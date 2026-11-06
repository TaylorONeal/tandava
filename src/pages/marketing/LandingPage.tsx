/**
 * Search landing pages for studio owners (/studio-app, /yoga-studio-software,
 * /class-booking-software). Copy and structure come from
 * src/content/marketing/pages.ts; scripts/prerender-pages.ts writes the same
 * content as static HTML for crawlers.
 */
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { StudioAppBadge } from "@/components/marketing/StudioAppBadge";
import { STUDIO_SIGNUP_HREF } from "@/lib/audience";
import { STUDIO_APP_LIVE } from "@/config/studioApp";
import { landingPageFor } from "@/content/marketing/pages";
import { landingLd } from "@/content/marketing/schema";
import NotFound from "@/pages/NotFound";

const SITE_URL = import.meta.env.VITE_APP_URL || "https://tandavastudio.com";

export default function LandingPage({ route }: { route: string }) {
  const page = landingPageFor(route, STUDIO_APP_LIVE);
  if (!page) return <NotFound />;

  return (
    <MarketingShell>
      <SEOHead
        title={page.title}
        description={page.description}
        canonical={page.route}
        ogImage={page.ogImage}
        structuredData={landingLd(SITE_URL, page, STUDIO_APP_LIVE)}
      />

      <section className="max-w-3xl mx-auto px-6 pt-16 pb-8 sm:pt-24">
        <p className="text-sm font-medium text-muted-foreground mb-4">{page.eyebrow}</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">{page.h1}</h1>
        {page.intro.map((p) => (
          <p key={p} className="mt-6 text-lg text-muted-foreground">{p}</p>
        ))}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
          {page.isAppPage ? (
            <>
              <StudioAppBadge />
              <Button asChild size="lg" variant="outline">
                <Link to={STUDIO_SIGNUP_HREF}>Set up your studio on the web</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg">
                <Link to={STUDIO_SIGNUP_HREF}>Set up your studio <ArrowRight className="ms-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/demo">Look around a demo studio</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {page.sections.map((s) => (
        <section key={s.heading} className="max-w-3xl mx-auto px-6 py-8">
          <h2 className="text-2xl font-semibold">{s.heading}</h2>
          {s.paragraphs?.map((p) => (
            <p key={p} className="mt-3 text-muted-foreground">{p}</p>
          ))}
          {s.bullets && (
            <ul className="mt-4 space-y-2">
              {s.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
          )}
          {s.steps && (
            <ol className="mt-4 space-y-4">
              {s.steps.map((st, i) => (
                <li key={st.title} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-sm">{i + 1}</span>
                  <div>
                    <p className="font-medium">{st.title}</p>
                    <p className="text-sm text-muted-foreground">{st.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}

      {page.faq.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 py-8" aria-labelledby="landing-faq">
          <h2 id="landing-faq" className="text-2xl font-semibold">Questions</h2>
          <dl className="mt-4 space-y-5">
            {page.faq.map((f) => (
              <div key={f.q}>
                <dt className="font-medium">{f.q}</dt>
                <dd className="mt-1 text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="max-w-3xl mx-auto px-6 py-8">
        <div className="rounded-xl border border-border bg-secondary/40 p-6">
          <h2 className="text-xl font-semibold">Ready when you are</h2>
          <p className="mt-2 text-muted-foreground">
            Studios sign up on the web. Setup takes no card, and pricing is agreed with you before you take a single payment.
          </p>
          <Button asChild className="mt-4">
            <Link to={STUDIO_SIGNUP_HREF}>Set up your studio</Link>
          </Button>
        </div>
      </section>

      <nav className="max-w-3xl mx-auto px-6 pt-4" aria-label="Related">
        <h2 className="text-sm font-medium text-muted-foreground">Read more</h2>
        <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {page.related.map((r) => (
            <li key={r.to}><Link to={r.to} className="underline underline-offset-4">{r.label}</Link></li>
          ))}
        </ul>
      </nav>
    </MarketingShell>
  );
}
