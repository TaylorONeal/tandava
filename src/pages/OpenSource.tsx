/**
 * Open source: /open-source
 *
 * Audience: developers and technical studio owners who want to read the code,
 * self-host, or contribute. Studio owners who just want it running go to
 * /for-studios; students go to /discover. Keep the hosted pitch out of here
 * beyond a single pointer.
 */
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { Band, CtaAnchor, Eyebrow } from "@/components/marketing/brand";
import { RuledList, Section, TickList } from "@/components/marketing/primitives";

const REPO = "https://github.com/TaylorONeal/tandava";

const STACK = [
  { title: "Stack", body: "React 18, TypeScript and Vite on the front end. Supabase (Postgres, Auth, Storage) behind it. Stripe Connect for payments." },
  { title: "Tenancy", body: "One database, many studios. Row-level security keeps each studio's data separate, and the SQL test suite checks it." },
  { title: "Same code as hosted", body: "The hosted product is built from this repository, so what you read is what runs." },
];

const SELF_HOST_NEEDS = [
  "A Supabase project (cloud or self-hosted Postgres with Supabase Auth)",
  "A static host for the web app, such as Vercel, Netlify or Cloudflare Pages",
  "A Stripe account if you take payments",
  "An email provider such as Resend for confirmations and receipts",
];

const QUICKSTART = `git clone ${REPO}.git
cd tandava
npm install
echo "VITE_DEMO_MODE=true" > .env.local
npm run dev`;

export default function OpenSource() {
  return (
    <MarketingShell maxWidth="max-w-6xl">
      <SEOHead
        title="Open source yoga studio software you can self-host"
        description="Open source scheduling, memberships, booking and payments for yoga, pilates and movement studios. AGPL-3.0. Read the code, self-host it, or contribute."
        canonical="/open-source"
      />

      <section className="mkt-grid">
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-20 sm:pt-20">
        <Eyebrow>Open source, AGPL-3.0</Eyebrow>
        <h1 className="mt-5 max-w-3xl font-brand text-[2.4rem] font-extrabold leading-[0.98] tracking-[-0.04em] sm:text-[3.4rem]">
          Studio software you can <Band tone="teal">read, run and change.</Band>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink/75 max-w-2xl">
          Tandava covers scheduling, memberships, bookings and payments for yoga, pilates and movement studios.
          Clone it, deploy it on your own infrastructure, send a patch.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <CtaAnchor href={REPO}>View on GitHub <ArrowRight className="h-4 w-4" aria-hidden /></CtaAnchor>
          <CtaAnchor href={`${REPO}/blob/main/DEPLOYMENT.md`} variant="secondary">Self-hosting guide</CtaAnchor>
        </div>
        <p className="mt-6 text-sm text-ink/60">
          Not a developer? <Link to="/" className="font-semibold underline underline-offset-4">Run your studio on the hosted version</Link> instead.
        </p>
        </div>
      </section>

      <Section id="built" eyebrow="Architecture" title="How it is built" className="pt-4">
        <RuledList items={STACK} />
      </Section>

      <Section id="local" eyebrow="Try it" title="Run it locally" lead="Demo mode needs no backend and loads sample data from a fictional studio." className="mt-16">
        <pre className="overflow-x-auto rounded-2xl bg-ink p-5 font-brand-mono text-sm leading-relaxed text-lime"><code>{QUICKSTART}</code></pre>
        <p className="mt-3 text-sm text-ink/70">
          Or <Link to="/demo" className="font-semibold underline underline-offset-4">try the same demo in your browser</Link>.
        </p>
      </Section>

      <Section
        id="selfhost"
        eyebrow="Self-hosting"
        title="What you need"
        lead="You own the operations: migrations, backups, upgrades and support. That is the trade for owning the data and the code."
        className="mt-16"
      >
        <TickList items={SELF_HOST_NEEDS} />
      </Section>

      <Section id="license" eyebrow="AGPL-3.0" title="License and contributing" className="mt-16">
        <p className="max-w-[62ch] leading-relaxed text-ink/75">
          You can use and modify Tandava freely. If you run a modified version as a service for others, you share your
          changes under the same license. Issues, docs fixes and pull requests are welcome.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <CtaAnchor href={`${REPO}/blob/main/CONTRIBUTING.md`} variant="secondary">Contributing guide</CtaAnchor>
          <CtaAnchor href={`${REPO}/blob/main/docs/INDEX.md`} variant="secondary">Documentation</CtaAnchor>
        </div>
      </Section>
    </MarketingShell>
  );
}
