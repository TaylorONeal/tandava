/**
 * Search landing pages for studio owners (/studio-app, /yoga-studio-software,
 * /class-booking-software). Copy and structure come from
 * src/content/marketing/pages.ts; scripts/prerender-pages.ts writes the same
 * content as static HTML for crawlers. Look: components/marketing/brand.tsx.
 */
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { StudioAppBadge } from "@/components/marketing/StudioAppBadge";
import { CtaLink, Eyebrow, PhoneShot, ScanFrame } from "@/components/marketing/brand";
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

      <section className="mkt-grid border-b border-ink/10">
        <div className={`max-w-5xl mx-auto grid items-center gap-12 px-6 pb-14 pt-14 sm:pt-20 ${page.isAppPage ? "md:grid-cols-[1.3fr_1fr]" : ""}`}>
          <div className="max-w-3xl">
            <Eyebrow>{page.eyebrow}</Eyebrow>
            <h1 className="mt-5 font-brand text-[2.4rem] font-extrabold leading-[0.98] tracking-[-0.04em] sm:text-[3.4rem]">{page.h1}</h1>
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

      <div className="max-w-3xl mx-auto px-6 pt-6">
        {page.sections.map((s) => (
          <section key={s.heading} className="py-8">
            <h2 className="font-brand text-2xl font-extrabold tracking-tight sm:text-3xl">{s.heading}</h2>
            {s.paragraphs?.map((p) => (
              <p key={p} className="mt-3 leading-relaxed text-ink/75">{p}</p>
            ))}
            {s.bullets && (
              <ul className="mt-5 space-y-2.5">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-lime">
                      <Check className="h-3 w-3" aria-hidden />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            )}
            {s.steps && (
              <ol className="mt-5 space-y-3">
                {s.steps.map((st, i) => (
                  <li key={st.title} className="flex gap-4 rounded-2xl border-2 border-ink bg-white p-5">
                    <span className="font-brand-mono text-sm font-semibold text-ink/50">0{i + 1}</span>
                    <div>
                      <p className="font-brand text-lg font-bold tracking-tight">{st.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink/70">{st.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))}

        {page.faq.length > 0 && (
          <section className="py-8" aria-labelledby="landing-faq">
            <h2 id="landing-faq" className="font-brand text-2xl font-extrabold tracking-tight sm:text-3xl">Questions</h2>
            <dl className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
              {page.faq.map((f) => (
                <div key={f.q} className="py-4">
                  <dt className="font-bold">{f.q}</dt>
                  <dd className="mt-1 leading-relaxed text-ink/70">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="py-8">
          <div className="rounded-3xl bg-lime p-7">
            <h2 className="font-brand text-2xl font-extrabold tracking-tight sm:text-3xl">Ready when you are</h2>
            <p className="mt-2 text-ink/80">
              Studios sign up on the web. Setup takes no card, and pricing is agreed with you before you take a single payment.
            </p>
            <CtaLink to={STUDIO_SIGNUP_HREF} className="mt-5">Set up your studio</CtaLink>
          </div>
        </section>

        <nav className="pt-2" aria-label="Related">
          <Eyebrow>Read more</Eyebrow>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            {page.related.map((r) => (
              <li key={r.to}><Link to={r.to} className="underline underline-offset-4">{r.label}</Link></li>
            ))}
          </ul>
        </nav>
      </div>
    </MarketingShell>
  );
}
