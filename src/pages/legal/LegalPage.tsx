/**
 * /terms, /privacy and /refunds (LP-9). Content lives in src/content/legal.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { SEOHead } from "@/components/seo/SEOHead";
import { ALL_LEGAL_LINKS, LEGAL_DOCS, LEGAL_PUBLISHED, LEGAL_OPERATOR, LEGAL_UPDATED, type LegalDoc } from "@/content/legal";
import { anyAnalytics } from "@/content/legal/analytics";
import { WEB_ANALYTICS } from "@/config/analytics";
import { analyticsOptedOut, setAnalyticsOptOut } from "@/lib/analytics/web";
import { Button } from "@/components/ui/button";

/** The privacy page's analytics switch for this browser (applies from the next page load). */
function AnalyticsSwitch() {
  const [off, setOff] = useState(() => analyticsOptedOut());
  return (
    <div className="space-y-2 text-[15px]">
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="analytics-optout"
        onClick={() => {
          setAnalyticsOptOut(!off);
          setOff(!off);
        }}
      >
        {off ? "Turn analytics back on in this browser" : "Turn analytics off in this browser"}
      </Button>
      <p className="text-sm text-muted-foreground" role="status">
        {off ? "Analytics is off in this browser." : "Analytics is on in this browser."}
      </p>
    </div>
  );
}

function Paragraph({ text }: { text: string }) {
  if (text.startsWith("- ")) {
    return (
      <ul className="list-disc ps-5 space-y-1.5">
        {text.split("\n").map((line) => <li key={line}>{line.replace(/^- /, "")}</li>)}
      </ul>
    );
  }
  return <p>{text}</p>;
}

export function LegalDocView({ doc }: { doc: LegalDoc }) {
  // Moving between policies via the links at the bottom starts at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [doc.slug]);
  if (!LEGAL_PUBLISHED) {
    // A self-hosted deployment publishes its own policies; never show the hosted operator's.
    return (
      <MarketingShell maxWidth="max-w-3xl">
        <SEOHead title={doc.title} description={doc.summary} noindex />
        <article className="max-w-3xl mx-auto px-6 py-12 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">{doc.title}</h1>
          <p className="text-muted-foreground">
            This site has not published its {doc.title.toLowerCase()} yet. Contact the studio that runs it.
          </p>
        </article>
      </MarketingShell>
    );
  }
  return (
    <MarketingShell maxWidth="max-w-3xl">
      <SEOHead title={doc.title} description={doc.summary} />
      <article className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{doc.title}</h1>
          <p className="text-muted-foreground">{doc.summary}</p>
          <p className="text-sm text-muted-foreground">
            {LEGAL_OPERATOR}. Last updated {LEGAL_UPDATED}.
          </p>
        </header>
        {doc.sections.map((s) => (
          <section key={s.heading} className="space-y-3 text-[15px] leading-relaxed">
            <h2 className="text-lg font-semibold">{s.heading}</h2>
            {s.body.map((p) => <Paragraph key={p} text={p} />)}
            {doc.slug === "privacy" && s.heading === "Website and product analytics" && anyAnalytics(WEB_ANALYTICS) && <AnalyticsSwitch />}
          </section>
        ))}
        <nav aria-label="Policies" className="flex gap-4 border-t pt-6 text-sm">
          {ALL_LEGAL_LINKS.filter((l) => l.to !== `/${doc.slug}`).map((l) => (
            <Link key={l.to} to={l.to} className="text-primary hover:underline">{l.label}</Link>
          ))}
        </nav>
      </article>
    </MarketingShell>
  );
}

export const TermsPage = () => <LegalDocView doc={LEGAL_DOCS.terms} />;
export const PrivacyPage = () => <LegalDocView doc={LEGAL_DOCS.privacy} />;
export const RefundsPage = () => <LegalDocView doc={LEGAL_DOCS.refunds} />;
export default TermsPage;
