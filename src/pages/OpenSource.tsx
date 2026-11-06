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
    <MarketingShell>
      <SEOHead
        title="Open source yoga studio software you can self-host"
        description="Open source scheduling, memberships, booking and payments for yoga, pilates and movement studios. AGPL-3.0. Read the code, self-host it, or contribute."
        canonical="/open-source"
      />

      <section className="mkt-grid border-b border-ink/10">
        <div className="max-w-5xl mx-auto px-6 pt-14 pb-14 sm:pt-20">
        <Eyebrow>Open source, AGPL-3.0</Eyebrow>
        <h1 className="mt-5 max-w-3xl font-brand text-[2.4rem] font-extrabold leading-[0.98] tracking-[-0.04em] sm:text-[3.4rem]">
          Studio software you can <Band tone="teal">read, run and change.</Band>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink/75 max-w-2xl">
          Tandava covers scheduling, memberships, bookings and payments for yoga, pilates and movement studios.
          Clone it, deploy it on your own infrastructure, send a patch.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <CtaAnchor href={REPO}>View on GitHub <ArrowRight className="h-4 w-4" /></CtaAnchor>
          <CtaAnchor href={`${REPO}/blob/main/DEPLOYMENT.md`} variant="secondary">Self-hosting guide</CtaAnchor>
        </div>
        <p className="mt-6 text-sm text-ink/60">
          Not a developer? <Link to="/" className="font-semibold underline underline-offset-4">Run your studio on the hosted version</Link> instead.
        </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="font-brand text-2xl font-extrabold tracking-tight sm:text-3xl">How it is built</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {STACK.map((s) => (
            <div key={s.title} className="rounded-2xl border-2 border-ink bg-white p-6">
              <h3 className="font-brand text-lg font-bold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-2">
        <div className="min-w-0">
          <h2 className="font-brand text-2xl font-extrabold tracking-tight sm:text-3xl">Run it locally</h2>
          <p className="mt-2 text-sm text-ink/70">Demo mode needs no backend and loads sample data from a fictional studio.</p>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-ink p-5 font-brand-mono text-sm text-lime"><code>{QUICKSTART}</code></pre>
          <p className="mt-3 text-sm text-ink/70">
            Or <Link to="/demo" className="underline underline-offset-4">try the same demo in your browser</Link>.
          </p>
        </div>
        <div className="min-w-0">
          <h2 className="font-brand text-2xl font-extrabold tracking-tight sm:text-3xl">Self-hosting needs</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {SELF_HOST_NEEDS.map((n) => (
              <li key={n} className="flex gap-2"><span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lime ring-1 ring-ink" />{n}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink/70">
            You own the operations: migrations, backups, upgrades and support. That is the trade for owning the data and the code.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="font-brand text-2xl font-extrabold tracking-tight sm:text-3xl">License and contributing</h2>
        <p className="mt-2 text-ink/70 max-w-2xl">
          Tandava is AGPL-3.0. You can use and modify it freely. If you run a modified version as a service for
          others, you share your changes under the same license. Issues, docs fixes and pull requests are welcome.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <CtaAnchor href={`${REPO}/blob/main/CONTRIBUTING.md`} variant="secondary">Contributing guide</CtaAnchor>
          <CtaAnchor href={`${REPO}/blob/main/docs/INDEX.md`} variant="secondary">Documentation</CtaAnchor>
        </div>
      </section>
    </MarketingShell>
  );
}
