/**
 * Public Studio Storefront — /s/:slug
 *
 * A discoverable studio's real public page: profile, class offerings, pricing,
 * and upcoming schedule, fetched by slug from the public RPCs
 * (get_studio_storefront + get_public_schedule). No login required.
 *
 * This is the slug-driven storefront the host-based-tenancy plan depends on
 * (docs/architecture/MULTI_TENANCY.md): once per-studio subdomains land, a
 * resolved subdomain simply renders this component for the matched studio.
 *
 * Gating: the RPC returns data only when studios.discoverable = true, so a
 * private or unknown slug lands on the neutral "not available" state below.
 */

import { useParams, Link } from "react-router-dom";
import { useStudioStorefront, usePublicSchedule } from "@/hooks/useBooking";
import { isBackendConfigured } from "@/lib/backend";
import { formatPrice } from "@/lib/reference-data";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Flame, MapPin, ArrowRight, Loader2 } from "lucide-react";

const CYCLE_LABEL: Record<string, string> = {
  weekly: "week",
  monthly: "month",
  quarterly: "quarter",
  annual: "year",
};

export default function StudioStorefront({ slug: slugProp }: { slug?: string } = {}) {
  const params = useParams<{ slug: string }>();
  // Slug comes from the route (/s/:slug) or, on a studio subdomain, the host.
  const slug = slugProp ?? params.slug;
  const { data: storefront, isLoading, isError } = useStudioStorefront(slug);
  const { data: schedule } = usePublicSchedule(slug);

  // Storefronts read from the live backend; the demo build has none.
  if (!isBackendConfigured()) {
    return (
      <Shell>
        <Empty
          title="Studio pages are live-only"
          body="Public studio storefronts load from a connected backend and aren't available in the demo."
        />
      </Shell>
    );
  }

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Shell>
    );
  }

  // Null = slug didn't match a discoverable studio (RPC gates on discoverable).
  if (isError || !storefront) {
    return (
      <Shell>
        <Empty
          title="Studio not available"
          body="This studio doesn't exist or hasn't made its page public yet."
        />
      </Shell>
    );
  }

  const { studio, offerings, memberships, packs } = storefront;
  const accent = studio.primary_color || undefined;
  const currency = studio.currency || "USD";
  const upcoming = (schedule ?? []).slice(0, 6);

  return (
    <Shell studioName={studio.name} accent={accent}>
      <SEOHead
        title={`${studio.name} — Classes & Membership`}
        description={studio.description ?? `Book classes and memberships at ${studio.name}.`}
        canonical={`/s/${studio.slug}`}
      />

      {/* Hero */}
      <section
        className="rounded-2xl p-8 md:p-12 mb-10"
        style={{ background: accent ? `${accent}14` : undefined }}
      >
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{studio.name}</h1>
        {studio.description && (
          <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">{studio.description}</p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" style={accent ? { backgroundColor: accent } : undefined}>
            <Link to="/auth/register">Sign up to book<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/auth/login">Sign in</Link>
          </Button>
        </div>
      </section>

      {/* Offerings */}
      {offerings.length > 0 && (
        <Section title="Classes">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {offerings.map((o) => (
              <Card key={o.id} className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium">{o.name}</h3>
                    {o.is_heated && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Flame className="h-3 w-3" />Heated
                      </Badge>
                    )}
                  </div>
                  {o.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{o.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {o.level && <span className="capitalize">{o.level}</span>}
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{o.duration_minutes} min</span>
                    {o.drop_in_price_cents != null && (
                      <span className="font-medium text-foreground">
                        {formatPrice(o.drop_in_price_cents, currency)} drop-in
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Upcoming schedule */}
      {upcoming.length > 0 && (
        <Section title="Upcoming classes">
          <div className="grid gap-2">
            {upcoming.map((c) => {
              const when = new Date(c.starts_at);
              return (
                <Card key={c.occurrence_id}>
                  <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{c.offering_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {when.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                        {" · "}
                        {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        {c.teacher_name ? ` · ${c.teacher_name}` : ""}
                        {c.location_name ? ` · ${c.location_name}` : ""}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0">
                      <Link to="/auth/register">Book</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {/* Pricing */}
      {(memberships.length > 0 || packs.length > 0) && (
        <Section title="Membership & pricing">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map((m) => (
              <Card key={m.id} className="h-full">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{m.name}</p>
                  <p className="mt-1 text-2xl font-bold">
                    {formatPrice(m.price_cents, currency)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}/ {CYCLE_LABEL[m.billing_cycle] ?? m.billing_cycle}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {m.classes_per_cycle == null ? "Unlimited classes" : `${m.classes_per_cycle} classes / cycle`}
                  </p>
                  <Button asChild size="sm" className="mt-3 w-full" style={accent ? { backgroundColor: accent } : undefined}>
                    <Link to="/auth/register">Get started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
            {packs.map((p) => (
              <Card key={p.id} className="h-full">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{p.name}</p>
                  <p className="mt-1 text-2xl font-bold">{formatPrice(p.price_cents, currency)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.class_count} classes · valid {p.validity_days} days
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                    <Link to="/auth/register">Buy pack</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {offerings.length === 0 && upcoming.length === 0 && memberships.length === 0 && packs.length === 0 && (
        <Empty title="Coming soon" body={`${studio.name} is still setting up its classes and schedule.`} />
      )}
    </Shell>
  );
}

function Shell({ children, studioName, accent }: { children: React.ReactNode; studioName?: string; accent?: string }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground font-bold"
              style={{ backgroundColor: accent || "hsl(var(--primary))" }}
            >
              {(studioName ?? "T").charAt(0)}
            </span>
            <span className="font-semibold tracking-tight">{studioName ?? "Tandava"}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/auth/login">Sign in</Link></Button>
            <Button asChild size="sm" style={accent ? { backgroundColor: accent } : undefined}>
              <Link to="/auth/register">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      <footer className="border-t border-border mt-16">
        <div className="max-w-5xl mx-auto px-6 py-6 text-xs text-muted-foreground flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" /> Powered by Tandava
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="text-center py-24">
      <MapPin className="h-10 w-10 text-muted-foreground/40 mx-auto" />
      <h1 className="mt-4 text-xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">{body}</p>
      <Button asChild variant="outline" className="mt-6"><Link to="/">Back to Tandava</Link></Button>
    </div>
  );
}
