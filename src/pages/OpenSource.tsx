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
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/layout/MarketingShell";

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
        title="Tandava is open source studio software"
        description="Scheduling, memberships and payments for yoga, pilates and movement studios. AGPL-3.0. Read the code, self-host it, or contribute."
        canonical="/open-source"
      />

      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 sm:pt-24">
        <p className="text-sm font-medium text-muted-foreground mb-4">Open source, AGPL-3.0</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl">
          Studio software you can read, run and change.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          Tandava covers scheduling, memberships, bookings and payments for yoga, pilates and movement studios.
          Clone it, deploy it on your own infrastructure, send a patch.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg">
            <a href={REPO} target="_blank" rel="noopener noreferrer">View on GitHub <ArrowRight className="ms-2 h-4 w-4" /></a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={`${REPO}/blob/main/DEPLOYMENT.md`} target="_blank" rel="noopener noreferrer">Self-hosting guide</a>
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Not a developer? <Link to="/for-studios" className="underline underline-offset-4">Run your studio on the hosted version</Link> instead.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold">How it is built</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {STACK.map((s) => (
            <div key={s.title} className="rounded-xl border border-border p-6">
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">Run it locally</h2>
          <p className="mt-2 text-sm text-muted-foreground">Demo mode needs no backend and loads sample data from a fictional studio.</p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-secondary p-4 text-sm"><code>{QUICKSTART}</code></pre>
          <p className="mt-3 text-sm text-muted-foreground">
            Or <Link to="/demo" className="underline underline-offset-4">try the same demo in your browser</Link>.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Self-hosting needs</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {SELF_HOST_NEEDS.map((n) => (
              <li key={n} className="flex gap-2"><span aria-hidden className="text-muted-foreground">•</span>{n}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            You own the operations: migrations, backups, upgrades and support. That is the trade for owning the data and the code.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold">License and contributing</h2>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Tandava is AGPL-3.0. You can use and modify it freely. If you run a modified version as a service for
          others, you share your changes under the same license. Issues, docs fixes and pull requests are welcome.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline"><a href={`${REPO}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer">Contributing guide</a></Button>
          <Button asChild variant="outline"><a href={`${REPO}/blob/main/docs/INDEX.md`} target="_blank" rel="noopener noreferrer">Documentation</a></Button>
        </div>
      </section>
    </MarketingShell>
  );
}
