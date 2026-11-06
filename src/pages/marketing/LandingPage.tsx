/**
 * Search landing pages for studio owners (/studio-app, /yoga-studio-software,
 * /class-booking-software). Copy and structure come from
 * src/content/marketing/pages.ts; scripts/prerender-pages.ts writes the same
 * content as static HTML for crawlers. Look: docs/design/DESIGN_SYSTEM.md.
 */
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { StudioAppBadge } from "@/components/marketing/StudioAppBadge";
import { CtaLink, Eyebrow, PhoneShot, ScanFrame } from "@/components/marketing/brand";
import { RuledList, Section, TickList } from "@/components/marketing/primitives";
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
    <MarketingShell maxWidth="max-w-6xl">
      <SEOHead
        title={page.title}
        description={page.description}
        canonical={page.route}
        ogImage={page.ogImage}
        structuredData={landingLd(SITE_URL, page, STUDIO_APP_LIVE)}
      />

      <section className="mkt-grid">
        <div className={`max-w-6xl mx-auto grid items-center gap-14 px-6 pb-20 pt-12 sm:pt-20 ${page.isAppPage ? "md:grid-cols-[1.3fr_1fr]" : ""}`}>
          <div className="max-w-3xl">
            <Eyebrow>{page.eyebrow}</Eyebrow>
            <h1 className="mt-5 font-brand text-[2.45rem] font-extrabold leading-[0.97] tracking-[-0.045em] sm:text-[3.6rem]">{page.h1}</h1>
            {page.intro.map((p) => (
              <p key={p} className="mt-5 text-lg leading-relaxed text-ink/75">{p}</p>
            ))}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              {page.isAppPage ? (
                <>
                  <StudioAppBadge />
                  <CtaLink to={STUDIO_SIGNUP_HREF} variant="secondary">Set up your studio on the web</CtaLink>
                </>
              ) : (
                <>
                  <CtaLink to={STUDIO_SIGNUP_HREF}>Set up your studio <ArrowRight className="h-4 w-4" /></CtaLink>
                  <CtaLink to="/demo" variant="secondary">Look around a demo studio</CtaLink>
                </>
              )}
            </div>
          </div>
          {page.isAppPage && (
            <div className="mx-auto w-full max-w-[16rem]">
              <ScanFrame className="-rotate-2" color="border-coral">
                <PhoneShot src="/marketing/studio-dashboard.webp" alt="Tandava Studio dashboard on iPhone with the Scan passes card on top" />
              </ScanFrame>
            </div>
          )}
        </div>
      </section>

      {page.sections.map((s, i) => (
        <Section key={s.heading} title={s.heading} className={i === 0 ? "pt-4" : "mt-16"}>
          {s.paragraphs?.map((p) => (
            <p key={p} className="mb-4 max-w-[62ch] leading-relaxed text-ink/75 last:mb-0">{p}</p>
          ))}
          {s.bullets && (
            <div className={s.paragraphs?.length ? "mt-5" : ""}>
              <TickList items={s.bullets} />
            </div>
          )}
          {s.steps && (
            <div className={s.paragraphs?.length || s.bullets ? "mt-6" : ""}>
              <RuledList items={s.steps.map((st) => ({ title: st.title, body: st.body }))} />
            </div>
          )}
        </Section>
      ))}

      {page.faq.length > 0 && (
        <Section id="landing-faq" eyebrow="Questions" title="What people ask." className="mt-16">
          <dl className="divide-y divide-ink/15 border-y border-ink/15">
            {page.faq.map((f) => (
              <div key={f.q} className="py-4">
                <dt className="font-brand text-lg font-bold tracking-tight">{f.q}</dt>
                <dd className="mt-1 max-w-[62ch] leading-relaxed text-ink/70">{f.a}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      <section className="mt-20 bg-lime" aria-labelledby="ready-title">
        <div className="max-w-6xl mx-auto grid gap-6 px-6 py-12 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="min-w-0">
            <h2 id="ready-title" className="font-brand text-3xl font-extrabold tracking-[-0.03em] sm:text-[2.6rem]">Ready when you are</h2>
            <p className="mt-3 max-w-[60ch] text-ink/80">
              Studios sign up on the web. Setup takes no card, and pricing is agreed with you before you take a single payment.
            </p>
          </div>
          <CtaLink to={STUDIO_SIGNUP_HREF}>Set up your studio</CtaLink>
        </div>
      </section>

      <nav className="max-w-6xl mx-auto px-6 pt-16" aria-label="Related">
        <Eyebrow>Read more</Eyebrow>
        <ul className="mt-3 grid gap-x-8 border-t border-ink/15 sm:grid-cols-2">
          {page.related.map((r) => (
            <li key={r.to} className="border-b border-ink/15">
              <Link to={r.to} className="flex items-center justify-between gap-3 py-3 font-semibold hover:text-plum">
                {r.label} <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </MarketingShell>
  );
}
