/**
 * Discover — /discover (and "/" when VITE_HOME_MODE=discover)
 *
 * The student front door: find an upcoming class across discoverable studios
 * and go straight to that studio's storefront to book. No account needed to
 * browse. Data: public discover_classes() RPC (migration 00019).
 *
 * Studio owners and open-source visitors are not forgotten: the header and
 * footer link to /open-source and the hosted offer.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Flame, Loader2, MapPin, Search } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isBackendConfigured } from "@/lib/backend";
import { formatPrice } from "@/lib/reference-data";
import { useDiscoverClasses } from "@/hooks/useDiscover";
import { trackFunnel } from "@/lib/funnel";
import {
  availableStyles,
  classHref,
  filterClasses,
  groupByDay,
  hasEnoughSupply,
  spotsLabel,
} from "@/lib/discover";
import type { DiscoverClassRow } from "@/types/database";

const DEFAULT_CITY = "Austin";

function formatDay(day: string): string {
  // Noon avoids DST edge cases when rendering a bare calendar date.
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(
    new Date(`${day}T12:00:00`),
  );
}

function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone }).format(new Date(iso));
}

export default function Discover() {
  const [style, setStyle] = useState("");
  const [query, setQuery] = useState("");
  const { data, isLoading, isError } = useDiscoverClasses(DEFAULT_CITY);

  useEffect(() => {
    trackFunnel("discover_viewed");
  }, []);

  const rows = useMemo(() => data ?? [], [data]);
  const styles = useMemo(() => availableStyles(rows), [rows]);
  const visible = useMemo(() => filterClasses(rows, { style, query }), [rows, style, query]);
  const groups = useMemo(() => groupByDay(visible), [visible]);
  const thin = !isLoading && !hasEnoughSupply(rows);

  return (
    <Shell>
      <SEOHead
        title={`Find a yoga class in ${DEFAULT_CITY}`}
        description={`Browse upcoming classes at independent studios in ${DEFAULT_CITY} and book in your browser. No app to install.`}
        canonical="/discover"
      />

      <section className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Find a class in {DEFAULT_CITY}</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Independent yoga and movement studios. Pick a class, book on the studio's page. Works in your browser, no app needed.
        </p>
      </section>

      {!isBackendConfigured() ? (
        <Notice
          title="Discover needs a live backend"
          body="This build has no connected backend, so there are no studios to show. Try the demo instead."
          cta={{ to: "/demo", label: "Explore the demo" }}
        />
      ) : isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground" role="status" aria-label="Loading classes">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : isError ? (
        <Notice title="We couldn't load classes" body="Please refresh in a moment." />
      ) : (
        <>
          <div className="mb-6 space-y-3">
            <div className="relative max-w-md">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => query && trackFunnel("discover_filtered", { kind: "query" })}
                placeholder="Search class, studio, teacher"
                aria-label="Search classes"
                className="ps-9"
              />
            </div>
            {styles.length > 0 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by style">
                <StyleChip label="All styles" active={style === ""} onClick={() => setStyle("")} />
                {styles.map((s) => (
                  <StyleChip
                    key={s}
                    label={s}
                    active={style.toLowerCase() === s.toLowerCase()}
                    onClick={() => {
                      setStyle(s);
                      trackFunnel("discover_filtered", { kind: "style", value: s });
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {thin && (
            <Notice
              tone="soft"
              title="More studios are opening soon"
              body={`We're onboarding independent ${DEFAULT_CITY} studios now. The list below is everything live today.`}
            />
          )}

          {groups.length === 0 ? (
            <Notice
              title={rows.length === 0 ? "No classes yet" : "No classes match"}
              body={
                rows.length === 0
                  ? "Studios will appear here as soon as they publish their schedule."
                  : "Try a different style or clear the search."
              }
            />
          ) : (
            groups.map((g) => (
              <section key={g.day} className="mb-8" aria-labelledby={`day-${g.day}`}>
                <h2 id={`day-${g.day}`} className="text-lg font-semibold mb-3">
                  {formatDay(g.day)}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {g.classes.map((c) => (
                    <ClassCard key={c.occurrence_id} c={c} />
                  ))}
                </div>
              </section>
            ))
          )}
        </>
      )}
    </Shell>
  );
}

function ClassCard({ c }: { c: DiscoverClassRow }) {
  const full = c.spots_left <= 0;
  return (
    <Link
      to={classHref(c)}
      onClick={() => trackFunnel("class_opened", { studio: c.studio_slug, occurrence: c.occurrence_id })}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <Card className="h-full transition-colors hover:bg-secondary/40">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium leading-tight">{c.offering_name}</h3>
              <p className="text-sm text-muted-foreground">{c.studio_name}</p>
            </div>
            <Badge variant={full ? "outline" : "secondary"} className="shrink-0 text-[10px]">
              {spotsLabel(c.spots_left)}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {formatTime(c.starts_at, c.studio_timezone)} · {c.duration_minutes} min
            </span>
            {(c.location_name || c.city) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {c.location_name ?? c.city}
              </span>
            )}
            {c.is_heated && (
              <span className="inline-flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" aria-hidden />
                Heated
              </span>
            )}
            {c.drop_in_price_cents != null && <span>{formatPrice(c.drop_in_price_cents, c.currency)}</span>}
          </div>
          {c.teacher_name && <p className="mt-2 text-xs text-muted-foreground">with {c.teacher_name}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

function StyleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      aria-pressed={active}
      onClick={onClick}
      className="rounded-full"
    >
      {label}
    </Button>
  );
}

function Notice({
  title,
  body,
  cta,
  tone,
}: {
  title: string;
  body: string;
  cta?: { to: string; label: string };
  tone?: "soft";
}) {
  return (
    <div className={`rounded-xl border border-border p-6 mb-6 ${tone === "soft" ? "bg-secondary/40" : "text-center py-16"}`}>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">{body}</p>
      {cta && (
        <Button asChild variant="outline" className="mt-4">
          <Link to={cta.to}>{cta.label}</Link>
        </Button>
      )}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">T</span>
            <span className="font-semibold tracking-tight">Tandava</span>
          </Link>
          <nav className="flex items-center gap-1" aria-label="Primary">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/open-source">For studios</Link>
            </Button>
            <Button asChild variant="ghost" size="sm"><Link to="/auth/login">Sign in</Link></Button>
            <Button asChild size="sm"><Link to="/auth/register">Sign up</Link></Button>
          </nav>
        </div>
      </header>
      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      <footer className="border-t border-border mt-16">
        <div className="max-w-5xl mx-auto px-6 py-6 text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" aria-hidden /> Powered by Tandava</span>
          <Link to="/open-source" className="hover:underline">Open source project</Link>
          <Link to="/blog" className="hover:underline">Blog</Link>
        </div>
      </footer>
    </div>
  );
}
