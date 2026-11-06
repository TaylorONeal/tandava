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
 * Look: docs/design/DESIGN_SYSTEM.md (front desk: paper, ink, one highlighter;
 * the pass and the class board are the motifs).
 */
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { FaqSection } from "@/components/help/FaqSection";
import { StudioAppBadge } from "@/components/marketing/StudioAppBadge";
import { Band, CtaLink, Eyebrow, PhoneShot, ScanFrame } from "@/components/marketing/brand";
import { PassStub, RuledList, ScheduleBoard, Section, TickList } from "@/components/marketing/primitives";
import { STUDIO_SIGNUP_HREF } from "@/lib/audience";
import { STUDIO_APP_LIVE } from "@/config/studioApp";
import { HOME_FAQ_IDS, homeContent, STUDIO_APP_FEATURES, WEB_FEATURES } from "@/content/marketing/pages";
import { EXAMPLE_DAY } from "@/content/marketing/exampleSchedule";
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
    <MarketingShell maxWidth="max-w-6xl">
      <SEOHead title={c.title} description={c.description} canonical="/" structuredData={homeLd(SITE_URL, STUDIO_APP_LIVE)} />

      <section className="mkt-grid">
        <div className="max-w-6xl mx-auto grid items-center gap-14 px-6 pb-20 pt-12 sm:pt-20 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <Eyebrow>{c.eyebrow}</Eyebrow>
            <h1 className="mt-5 font-brand text-[2.55rem] font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-[4rem]">
              {lead} {banded && <Band>{banded}</Band>}
            </h1>
            <p className="mt-7 max-w-[54ch] text-lg leading-relaxed text-ink/75">{c.intro}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <CtaLink to={STUDIO_SIGNUP_HREF}>
                Set up your studio <ArrowRight className="h-4 w-4" aria-hidden />
              </CtaLink>
              <CtaLink to="/demo" variant="secondary">Look around a demo studio</CtaLink>
            </div>
            <p className="mt-4 text-sm text-ink/60">{c.finePrint}</p>
          </div>

          <div className="relative mx-auto w-full max-w-[17rem] pb-10 md:max-w-[18.5rem]">
            <ScanFrame className="rotate-2">
              <PhoneShot src="/marketing/studio-scan.webp" alt="Tandava Studio on iPhone showing a member checked in after a pass scan" />
            </ScanFrame>
            <PassStub
              className="absolute -left-8 bottom-0 w-[15.5rem] -rotate-3 sm:-left-20"
              label="Pass, 6:30 am"
              name="Ines Calderón"
              detail="Morning Vinyasa"
              code="#4821"
              status="In"
            />
          </div>
        </div>
      </section>

      <Section id="how" eyebrow="How it works" title="Three steps, all on the web." className="pt-4">
        <RuledList items={c.steps.map((s) => ({ title: s.title, body: s.body }))} />
      </Section>

      <Section id="web" eyebrow="On the web" title={c.webCard.heading} lead={c.webCard.body} className="mt-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
          <div className="min-w-0">
            <TickList items={WEB_FEATURES} />
            <CtaLink to={STUDIO_SIGNUP_HREF} className="mt-7">Set up your studio</CtaLink>
          </div>
          <div className="min-w-0">
            <ScheduleBoard day={EXAMPLE_DAY.day} place={EXAMPLE_DAY.place} rows={EXAMPLE_DAY.rows} />
            <p className="mt-3 text-xs text-ink/60">What members see on your booking page. Example schedule.</p>
          </div>
        </div>
      </Section>

      <Section id="app" eyebrow="At the door" title={c.appCard.heading} lead={c.appCard.body} className="mt-20">
        <div className="rounded-3xl bg-ink p-6 text-paper sm:p-8">
          <TickList items={STUDIO_APP_FEATURES} tone="ink" />
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <StudioAppBadge />
            <Link to="/studio-app" className="text-sm font-semibold text-paper underline underline-offset-4 hover:text-lime">
              More about the app
            </Link>
          </div>
        </div>
      </Section>

      <section className="mt-20 bg-lime" aria-labelledby="pilot-title">
        <div className="max-w-6xl mx-auto grid gap-6 px-6 py-12 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="min-w-0">
            <h2 id="pilot-title" className="font-brand text-3xl font-extrabold tracking-[-0.03em] sm:text-[2.6rem]">
              {c.pilot.heading}
            </h2>
            <p className="mt-3 max-w-[60ch] text-ink/80">{c.pilot.body}</p>
          </div>
          <CtaLink to={STUDIO_SIGNUP_HREF}>Set up your studio</CtaLink>
        </div>
      </section>

      <Section id="faq" eyebrow="Questions" title="What owners ask first." className="mt-20">
        <FaqSection audience="owner" ids={HOME_FAQ_IDS} title="Questions studio owners ask" bare />
      </Section>

      <Section id="oss" eyebrow="Open source" title={c.openSource.heading} className="mt-20">
        <p className="max-w-[62ch] leading-relaxed text-ink/75">{c.openSource.body}</p>
        <Link to="/open-source" className="mt-4 inline-block font-semibold underline underline-offset-4">
          {c.openSource.linkLabel}
        </Link>
      </Section>

      <nav className="max-w-6xl mx-auto px-6 pt-16" aria-label="Guides">
        <Eyebrow>Read more</Eyebrow>
        <ul className="mt-3 grid gap-x-8 border-t border-ink/15 sm:grid-cols-2">
          {c.guides.map((g) => (
            <li key={g.to} className="border-b border-ink/15">
              <Link to={g.to} className="flex items-center justify-between gap-3 py-3 font-semibold hover:text-plum">
                {g.label} <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </MarketingShell>
  );
}
