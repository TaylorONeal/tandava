# Hosted Tandava and open-source Tandava

This is the canonical page for how the hosted service relates to the open-source code. README, `/open-source`, the hosted marketing copy and agent docs point here. If they disagree with this file, this file wins and the others get fixed.

Think WordPress: wordpress.org is the software, wordpress.com is one company running it for you. Tandava works the same way.

| | Open source (this repo) | Hosted (tandavastudio.com) |
|---|---|---|
| What it is | The full application: web app, database migrations, edge functions, native app shells | One operator, Purafield Studio LLC, running that code for studios |
| Code | AGPL-3.0, everything in this repo | Built from `main` of this repo. No private fork, no paid-only features |
| Who runs it | You: Supabase, a static host, Stripe, email, backups, upgrades, support | Purafield Studio |
| Price | Free. You pay your own hosting and Stripe fees | Beta: $29 a month per location, no cut of payments ([PRICING-BETA.md](plans/PRICING-BETA.md)) |
| Studio network | Discover (`/discover`) lists the studios in your own database | Discover spans every studio on tandavastudio.com that turns it on |
| Studio directory | `/studios` ships with the same public data file (`src/data/directory/`) | Same page and data, kept current by the operator |
| Staff app | Build your own from `native/studio` under your own bundle ID and backend | Tandava Studio on the App Store and Google Play, pointed at the hosted backend |
| Member app | Same code, not shipped yet | Members book on the web. A store app comes later |
| Support | GitHub issues, best effort | hello@purafieldstudio.com, a person answers |

## What the hosted service adds, and what it does not

The hosted service adds operations, not features: a production database with row-level security checked by `npm run test:db`, a Stripe Connect platform account, email delivery, bot protection, store listings for the apps, and a person to write to.

It never adds code that self-hosters can't run. If the hosted product needs a feature, the feature lands in this repo. Operator-only material, such as production SQL handoffs in `scripts/db/prod/` and store build workflows in `codemagic.yaml`, is in the repo too. It's specific to the hosted deployment's accounts, but it doesn't change what the software does.

The name "Tandava Studio" and the store listings belong to the hosted service. A self-hosted copy of the staff app should ship under its own name and bundle ID (see the Android dev ID rule in [AGENTS.md](../AGENTS.md)).

## What is live versus demo

The repo has more screens than the hosted product runs on real data. The hosted owner workspace only opens routes with a real data contract. The list is `liveStudioRoutes` in [`src/lib/hosted/studioRoutes.ts`](../src/lib/hosted/studioRoutes.ts):

- Dashboard, weekly schedule, classes and pricing, teachers and staff, settings, onboarding
- Member CSV import, share links, schedule embed, automations, booking source analytics
- Staff app: sign-in, teaching schedule and roster, one-tap check-in, scan to check in

Everything else (CRM, financial reports, events, retail, campaigns and the rest) is **demo only**. It runs on sample data in demo mode (`VITE_DEMO_MODE=true` or `/demo`) and is not wired to the database. Treat it as a design for contributors to build out, not as a shipped feature. [FEATURE_INDEX.md](FEATURE_INDEX.md) labels each feature.

When a demo screen gets a real data contract, add its route to `liveStudioRoutes`, update this list and FEATURE_INDEX in the same PR.

## Writing rules for docs and copy

- Hosted pages claim only what is live (list above) and quote the price from `BETA_PRICE` in `src/content/marketing/pages.ts`.
- `/open-source` and README may describe demo screens, but must say they are demo.
- Never say "nothing is held back" about features without the live/demo caveat. The code is all here, but not all of it is production-ready.
