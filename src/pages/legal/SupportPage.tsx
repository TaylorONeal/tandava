/**
 * /support (Tandava Studio App Store Support URL). Content in src/content/support.
 * Published only where the hosted policies are, like /terms and /privacy.
 */
import { Link } from "react-router-dom";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { SEOHead } from "@/components/seo/SEOHead";
import { LEGAL_CONTACT, LEGAL_OPERATOR, LEGAL_PUBLISHED } from "@/content/legal";
import { SUPPORT_ITEMS, SUPPORT_SUMMARY } from "@/content/support";

export default function SupportPage() {
  if (!LEGAL_PUBLISHED) {
    return (
      <MarketingShell maxWidth="max-w-3xl">
        <SEOHead title="Support" description={SUPPORT_SUMMARY} noindex />
        <article className="max-w-3xl mx-auto px-6 py-12 space-y-3">
          <h1 className="font-brand text-4xl font-extrabold tracking-tight">Support</h1>
          <p className="text-muted-foreground">Contact the studio that runs this site.</p>
        </article>
      </MarketingShell>
    );
  }
  return (
    <MarketingShell maxWidth="max-w-3xl">
      <SEOHead title="Support" description={SUPPORT_SUMMARY} />
      <article className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        <header className="space-y-3 border-b-2 border-ink pb-8">
          <h1 className="font-brand text-[2.6rem] font-extrabold leading-none tracking-[-0.04em] sm:text-5xl">Support</h1>
          <p className="text-muted-foreground">{SUPPORT_SUMMARY}</p>
          <p className="text-[15px]">
            Email <a className="underline underline-offset-4 hover:text-plum" href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a> and
            a person at {LEGAL_OPERATOR} will reply.
          </p>
        </header>
        {SUPPORT_ITEMS.map((item) => (
          <section key={item.q} className="space-y-2 border-b border-ink/15 py-6 text-[15px] leading-relaxed">
            <h2 className="font-brand text-lg font-bold tracking-tight">{item.q}</h2>
            <p>{item.a}</p>
          </section>
        ))}
        <nav aria-label="Policies" className="flex gap-4 pt-6 text-sm font-semibold">
          <Link to="/privacy" className="underline underline-offset-4 hover:text-plum">Privacy</Link>
          <Link to="/terms" className="underline underline-offset-4 hover:text-plum">Terms</Link>
        </nav>
      </article>
    </MarketingShell>
  );
}
