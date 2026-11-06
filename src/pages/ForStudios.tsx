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
 * Look: components/marketing/brand.tsx (Tandava Studio store art).
 */
import { Link } from "react-router-dom";
import { ArrowRight, Check, Globe, Smartphone } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { FaqSection } from "@/components/help/FaqSection";
import { StudioAppBadge } from "@/components/marketing/StudioAppBadge";
import { Band, CtaLink, Eyebrow, PhoneShot, ScanFrame } from "@/components/marketing/brand";
import { STUDIO_SIGNUP_HREF } from "@/lib/audience";
import { STUDIO_APP_LIVE } from "@/config/studioApp";
import { HOME_FAQ_IDS, homeContent, STUDIO_APP_FEATURES, WEB_FEATURES } from "@/content/marketing/pages";
import { homeLd } from "@/content/marketing/schema";

const SITE_URL = import.meta.env.VITE_APP_URL || "https://tandavastudio.com";

/** "First sentence. Second sentence." -> the second goes on the highlighter band. */
function splitHeadline(h1: string): [string, string] {
  const i = h1.indexOf(". ");
  return i === -1 ? [h1, ""] : [h1.slice(0, i + 1), h1.slice(i + 2)];
}

export default function ForStudios() {
  const c = homeContent(STUDIO_APP_LIVE);
  const [lead, banded] = splitHeadline(c.h1);

  return (
    <MarketingShell>
      <SEOHead title={c.title} description={c.description} canonical="/" structuredData={homeLd(SITE_URL, STUDIO_APP_LIVE)} />

      <section className="mkt-grid border-b border-ink/10">
        <div className="max-w-5xl mx-auto grid items-center gap-12 px-6 pb-16 pt-14 sm:pt-20 md:grid-cols-[1.25fr_1fr]">
          <div>
            <Eyebrow>{c.eyebrow}</Eyebrow>
            <h1 className="mt-5 font-brand text-[2.6rem] font-extrabold leading-[0.95] tracking-[-0.04em] sm:text-6xl">
              {lead}{" "}
              {banded && <Band>{banded}</Band>}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/75">{c.intro}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaLink to={STUDIO_SIGNUP_HREF}>Set up your studio <ArrowRight className="h-4 w-4" /></CtaLink>
              <CtaLink to="/demo" variant="secondary">Look around a demo studio</CtaLink>
            </div>
            <p className="mt-4 text-sm text-ink/60">{c.finePrint}</p>
          </div>

          <div className="relative mx-auto w-full max-w-[17rem] md:max-w-[18rem]">
            <ScanFrame className="rotate-2">
              <PhoneShot src="/marketing/studio-scan.webp" alt="Tandava Studio on iPhone showing a member checked in after a pass scan" />
            </ScanFrame>
            <span className="absolute -left-6 top-10 -rotate-6 rounded-xl bg-brand-teal px-4 py-2 font-brand text-base font-extrabold text-ink shadow-md">
              <Check className="me-1 inline h-4 w-4" aria-hidden />checked in
            </span>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16" aria-labelledby="how-title">
        <Eyebrow>How it works</Eyebrow>
        <h2 id="how-title" className="mt-3 font-brand text-3xl font-extrabold tracking-tight sm:text-4xl">Three steps, all on the web.</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {c.steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border-2 border-ink bg-white p-6">
              <span className="font-brand-mono text-sm font-semibold text-ink/50">0{i + 1}</span>
              <h3 className="mt-2 font-brand text-xl font-bold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="max-w-5xl mx-auto grid gap-5 px-6 pb-16 md:grid-cols-2" aria-label="Web and app">
        <div className="rounded-3xl border-2 border-ink bg-white p-7">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" aria-hidden />
            <h2 className="font-brand text-2xl font-extrabold tracking-tight">{c.webCard.heading}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink/70">{c.webCard.body}</p>
          <ul className="mt-5 space-y-2.5">
            {WEB_FEATURES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-lime">
                  <Check className="h-3 w-3" aria-hidden />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <CtaLink to={STUDIO_SIGNUP_HREF} className="mt-7">Set up your studio</CtaLink>
        </div>

        <div className="rounded-3xl bg-brand-teal p-7 text-ink">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" aria-hidden />
            <h2 className="font-brand text-2xl font-extrabold tracking-tight">{c.appCard.heading}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">{c.appCard.body}</p>
          <ul className="mt-5 space-y-2.5">
            {STUDIO_APP_FEATURES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-lime">
                  <Check className="h-3 w-3" aria-hidden />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <StudioAppBadge />
            <Link to="/studio-app" className="text-sm font-semibold underline underline-offset-4">More about the app</Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6">
        <div className="rounded-3xl bg-lime p-7 sm:p-10">
          <h2 className="font-brand text-3xl font-extrabold tracking-tight sm:text-4xl">{c.pilot.heading}</h2>
          <p className="mt-3 max-w-2xl text-ink/80">{c.pilot.body}</p>
          <CtaLink to={STUDIO_SIGNUP_HREF} className="mt-6">Set up your studio</CtaLink>
        </div>
      </section>

      <FaqSection
        audience="owner"
        ids={HOME_FAQ_IDS}
        className="max-w-5xl mx-auto px-6 py-16"
      />

      <section className="max-w-5xl mx-auto px-6" aria-labelledby="oss-title">
        <div className="rounded-3xl border-2 border-dashed border-ink/30 p-7">
          <Eyebrow>Open source</Eyebrow>
          <h2 id="oss-title" className="mt-2 font-brand text-2xl font-extrabold tracking-tight">{c.openSource.heading}</h2>
          <p className="mt-2 max-w-2xl text-ink/70">{c.openSource.body}</p>
          <Link to="/open-source" className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">{c.openSource.linkLabel}</Link>
        </div>
      </section>

      <nav className="max-w-5xl mx-auto px-6 pt-10" aria-label="Guides">
        <Eyebrow>Read more</Eyebrow>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          {c.guides.map((g) => (
            <li key={g.to}><Link to={g.to} className="underline underline-offset-4">{g.label}</Link></li>
          ))}
        </ul>
      </nav>
    </MarketingShell>
  );
}
