# Implementation status and remaining decisions

Updated September 10, 2026. Complements the [product review](HOSTED_PRODUCT_REVIEW.md) and [roadmap](ROADMAP.md).

## Changes in this work

- Fix CSV import format detection to read the detected provider ID rather than passing the detection object as a string.
- Fix TypeScript errors in demo waitlist configuration, notification types, newsletter source typing, recurring-task icon accessibility, substitute-request class names, and Supabase table metadata. Add an explicit `npm run typecheck` command. Preserve the newer upstream RPC signatures and effective-role implementation.
- Apply dependency security patches and upgrade React Router to 7.18.3, with route compatibility checks.
- Repair the npm lockfile and declare `tsx` locally for direct TypeScript script execution. Preserve upstream bundled postbuild tasks; document Node 22.12+ prerequisites.
- Restore an optional guided tour from the active demo bar; fix the member-list route and navigate when changing steps. Switching roles closes the active tour. Tour content explicitly identifies simulated payments/messages.
- Label mobile role controls, enlarge their touch targets, and keep a mobile demo-home link available.
- Scope front-desk check-in state and counts to each class. Make the search description match the name-only behavior; remove the unsupported scanning claim.
- Add pure, tested hosted-domain rules in `src/lib/hosted/domains.ts`: slug validation, reserved addresses, normalized exact domain mapping, and rejection of unknown/unverified/inactive/duplicate mappings.
- Align existing storefront host parsing with the same reserved-name rules and reject invalid DNS lengths. Preserve existing short studio slugs.
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

1. Verify the canonical migration series on a clean database and preserve any existing installations. Upstream removed the conflicting legacy migration; database bootstrap/upgrade execution is still unverified here.
2. Verify persisted operations and two-studio authorization against a real test database. Upstream now includes booking/cancellation RPCs, imports, onboarding, storefront and effective-role resolution.
3. Harden Stripe webhook processing with durable event deduplication and atomic effects. Checkout/portal/Connect endpoints now exist, but the webhook still acknowledges some database failures and lacks demonstrated replay safety. This is a payment launch blocker.
4. Connect hosted rules to authenticated provisioning, domain registration, separate platform billing, notifications and persisted readiness. Existing `studio-host.ts` handles storefront host parsing; the new hosted domain registry rules require server-side integration.
5. Complete payment replay/capacity race tests and an independent backup/restore before pilot launch.

The full task-checklist redesign, shared demo data and support operations remain roadmap work. A working demo or passing frontend build does not establish production readiness.


## Verification

- 140 unit tests passed against the updated dependencies.
- ESLint and standalone TypeScript checking passed; production build passed, including all locale checks, sitemap, 12 static blog pages and the calculator page.
- Final lockfile passed `npm ci --dry-run --ignore-scripts`; dependency audit reports zero vulnerabilities.
- Browser verified owner tour navigation through dashboard, schedule and students, mobile layout, member/front-desk role switching and class-specific check-in counts. No browser errors were reported.
- No database migration, production deployment or live payment was performed.
