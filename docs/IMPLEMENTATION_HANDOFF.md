# Implementation status and remaining decisions

Updated September 10, 2026. Complements the [product review](HOSTED_PRODUCT_REVIEW.md) and [roadmap](ROADMAP.md).

## Changes in this work

- Fix TypeScript errors in demo waitlist configuration, notification types, newsletter source typing, recurring-task icon accessibility, substitute-request class names, and Supabase table metadata and explicit profile query result typing. Add an explicit `npm run typecheck` command. These type repairs do not reconcile the two SQL schema tracks.
- Apply available dependency patches within existing ranges; remaining React Router advisories need a separately verified major-version upgrade.
- Repair the npm lockfile and declare `tsx` locally so sitemap generation does not depend on downloading an undeclared tool during builds.
- Restore an optional guided tour from the active demo bar; fix the member-list route and navigate when changing steps. Switching roles closes the active tour. Tour content explicitly identifies simulated payments/messages.
- Label mobile role controls, enlarge their touch targets, and keep a mobile demo-home link available.
- Scope front-desk check-in state and counts to each class. Make the search description match the name-only behavior; remove the unsupported scanning claim.
- Add pure, tested hosted-domain rules in `src/lib/hosted/domains.ts`: slug validation, reserved addresses, normalized exact domain mapping, and rejection of unknown/unverified/inactive/duplicate mappings.
- Add pure, tested launch-readiness and provisioning-transition rules in `src/lib/hosted/readiness.ts`. Hosting billing and studio payment readiness remain separate; setup trials cannot publish paid public bookings under the proposed policy.

The hosted modules are building blocks, not connected infrastructure. They do not create DNS records, persist tenants, authenticate requests, charge cards or publish studios. Production endpoints must call these rules with validated server-side facts and enforce authorization and database uniqueness independently. Provisioning transitions need transactional compare-and-set and request idempotency in persistence.

## Three decisions to make before a hosted pilot

| Decision | Recommended default | When needed |
|---|---|---|
| Who is the first customer? | One-location, class-based yoga/movement studios in one Stripe-supported operating country | Before payment onboarding and pilot recruitment; confirm country/currency |
| What do we sell? | $99/month hosting with defined business-hours email support; optional $299 scoped setup; no additional Tandava percentage fee on studio sales | Before publishing pricing or accepting subscriptions; confirm support hours and limits |
| Where does it live? | Tandava Studio = open product; Tandava Cloud = managed service; use one owned domain with studio subdomains | Before DNS/provider configuration; confirm domain ownership |

Everything else can follow these defaults until evidence justifies a change: shared deployment/database, existing React/Vite + Supabase stack, responsive web/PWA first, custom domains later, shared native member app before studio-branded apps, no public marketplace at launch. These are planning defaults, not irreversible infrastructure changes.

## Technical blockers are work, not product decisions

1. Reconcile the incompatible `00001_initial_schema.sql` and `001_initial_schema.sql` tracks. Establish whether any real installation used either track before defining upgrade migrations. Preserve existing installations; do not blindly rewrite deployed history.
2. Connect the studio operations to the canonical schema and verify tenant authorization. Existing auth fallback and route guards require a dedicated change; this work does not change auth configuration.
3. Implement checkout/portal endpoints and durable, idempotent webhook processing. The current webhook still acknowledges database failures and lacks demonstrated replay safety. No live payments should rely on it yet.
4. Connect the hosted rules to authenticated provisioning, domain registration, platform billing, notifications and persisted readiness.
5. Complete a clean database bootstrap, two-studio isolation tests, payment replay/capacity race tests, and an independent backup/restore before pilot launch.

Do not equate a working demo or passing frontend build with production readiness. The full task-checklist redesign, shared demo data, persisted booking/import flows, and support operations remain roadmap work.

## Verification

- Clean `npm ci --ignore-scripts` succeeded after lockfile repair; the final lockfile also passed `npm ci --dry-run --ignore-scripts` after dependency patches.
- 28 unit tests passed, including hosted address boundaries, cross-tenant lookup rejection, readiness gates and provisioning transitions.
- ESLint, the standalone TypeScript check, and the production build (including sitemap generation) passed.
- Browser verified the optional owner tour advances to schedule and members; check-in remains 15/20 on the original class while another class remains 0/18. Mobile layout and accessible role labels were inspected; no browser errors were reported.
- Dependency audit reduced from 25 advisories to two moderate React Router advisories. The remaining suggested fix is a major-version upgrade and was not forced.
- No database migration, production deployment or live payment was performed.
