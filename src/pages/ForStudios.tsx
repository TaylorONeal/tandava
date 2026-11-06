/**
 * For studios: the hosted home page. Renders at "/" on the hosted product
 * (lib/homeMode.ts) and at /for-studios, both canonical to "/".
 *
 * Audience: a studio owner or manager deciding whether to run their studio on
 * the hosted Tandava. Three things must land in the first screen: you sign up
 * on the web, staff use the Tandava Studio iPhone app at the door, and open
 * source exists for those who want it (one block, below the fold).
 *
 * Copy lives in src/content/marketing/pages.ts so the prerendered HTML and
 * llms.txt say the same thing. No pricing numbers until decision D1.
 */
import { Link } from "react-router-dom";
import { ArrowRight, Check, Globe, Smartphone } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { FaqSection } from "@/components/help/FaqSection";
import { StudioAppBadge } from "@/components/marketing/StudioAppBadge";
import { STUDIO_SIGNUP_HREF } from "@/lib/audience";
import { STUDIO_APP_LIVE } from "@/config/studioApp";
import { HOME_FAQ_IDS, homeContent, STUDIO_APP_FEATURES, WEB_FEATURES } from "@/content/marketing/pages";
import { homeLd } from "@/content/marketing/schema";

const SITE_URL = import.meta.env.VITE_APP_URL || "https://tandavastudio.com";

export default function ForStudios() {
  const c = homeContent(STUDIO_APP_LIVE);

  return (
    <MarketingShell>
      <SEOHead title={c.title} description={c.description} canonical="/" structuredData={homeLd(SITE_URL, STUDIO_APP_LIVE)} />

      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 sm:pt-24">
        <p className="text-sm font-medium text-muted-foreground mb-4">{c.eyebrow}</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl">{c.h1}</h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">{c.intro}</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg">
            <Link to={STUDIO_SIGNUP_HREF}>Set up your studio <ArrowRight className="ms-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/demo">Look around a demo studio</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{c.finePrint}</p>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12" aria-labelledby="how-title">
        <h2 id="how-title" className="text-2xl font-semibold">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {c.steps.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-border p-6">
              <span className="text-sm text-muted-foreground">Step {i + 1}</span>
              <h3 className="mt-1 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12 grid gap-4 md:grid-cols-2" aria-label="Web and app">
        <div className="rounded-xl border border-border p-6">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="text-xl font-semibold">{c.webCard.heading}</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{c.webCard.body}</p>
          <ul className="mt-4 space-y-2">
            {WEB_FEATURES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <Button asChild className="mt-6">
            <Link to={STUDIO_SIGNUP_HREF}>Set up your studio</Link>
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-secondary/40 p-6">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="text-xl font-semibold">{c.appCard.heading}</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{c.appCard.body}</p>
          <ul className="mt-4 space-y-2">
            {STUDIO_APP_FEATURES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <StudioAppBadge />
            <Link to="/studio-app" className="text-sm underline underline-offset-4">More about the app</Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="rounded-xl border border-border bg-secondary/40 p-6 sm:p-8">
          <h2 className="text-xl font-semibold">{c.pilot.heading}</h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">{c.pilot.body}</p>
          <Button asChild className="mt-5">
            <Link to={STUDIO_SIGNUP_HREF}>Set up your studio</Link>
          </Button>
        </div>
      </section>

      <FaqSection
        audience="owner"
        ids={HOME_FAQ_IDS}
        className="max-w-5xl mx-auto px-6 py-12"
      />

      <section className="max-w-5xl mx-auto px-6 py-12" aria-labelledby="oss-title">
        <h2 id="oss-title" className="text-xl font-semibold">{c.openSource.heading}</h2>
        <p className="mt-2 text-muted-foreground max-w-2xl">{c.openSource.body}</p>
        <Link to="/open-source" className="mt-3 inline-block text-sm underline underline-offset-4">{c.openSource.linkLabel}</Link>
      </section>

      <nav className="max-w-5xl mx-auto px-6 pt-4" aria-label="Guides">
        <h2 className="text-sm font-medium text-muted-foreground">Read more</h2>
        <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {c.guides.map((g) => (
            <li key={g.to}><Link to={g.to} className="underline underline-offset-4">{g.label}</Link></li>
          ))}
        </ul>
      </nav>
    </MarketingShell>
  );
}
