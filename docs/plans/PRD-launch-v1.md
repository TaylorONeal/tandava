# PRD: Launch v1 (hosted Tandava + Discover marketplace)

Status: living document. Owner: Taylor. Backlog with IDs: [BACKLOG.md](BACKLOG.md). Progress: [PROGRESS.md](PROGRESS.md). Diagrams: [07-launch-architecture](../developer/07-launch-architecture.md).

## 1. Product direction confirmed October 21, 2026

Tandava publishes its source code and also operates its own hosted service, like
WordPress's open-source and managed-service model. The hosted product includes a
member marketplace app and a separate studio management app, backed by the same
service. Publishing the code does not replace operating and supporting those apps.

Taylor's requested endpoint is **both iOS apps submitted for App Review after
release acceptance**. Competitiveness with Mindbody and Arketa is a product goal,
not an established comparison or permission to advertise unfinished capabilities.
The member's primary job is finding, booking and returning to a class. The studio's
primary job is turning a new signup into a bookable schedule, then reliably managing
people, attendance and money. Open-source installation is a separate developer path.

## 2. Quality and scope

| Requirement | Acceptance |
|---|---|
| Low-friction discovery and booking | Browse without signup; preserve selected class through authentication; show price, time zone, location and cancellation terms; confirm only the server's actual booking/waitlist result. Target first booking under 3 minutes. |
| Easeful studio onboarding | Clearly named steps, recoverable errors and saved progress; reach a real bookable schedule without developer setup. Target observed onboarding under 30 minutes. |
| Useful, coherent native apps | Distinct Member and Studio navigation; working sign-in, recovery, sign-out, links and persistence on the actual release candidates; usable on small phones and iPad, including large text and assistive technology. |
| Complete advertised paths | Every exposed launch action works on real data. Placeholder success, sample people in live accounts, dead purchases and fake notifications are release failures. Track unsupported capabilities explicitly; do not call a demo full featured. |
| Security and money correctness | Denied cross-tenant and inactive-role actions, protected personal data, replay-safe payments, accurate capacity/credits and verified hosted sandbox checkout/refund delivery. Local mocks alone do not pass this gate. |
| Growth through product value | Shareable studio/class links, returning-member continuity, accurate reminders, simple imports and a supported studio onboarding path. Analytics require accurate privacy/consent behavior. |
| App Store acceptance preparation | Complete deletion workflow, accurate purchase classification and privacy disclosures, live reviewer access, authentic assets and successful native review journeys. Submission, approval and public release are separate states. |

The two shared apps are in scope; a separately branded binary for every studio is
not. On-demand digital sales, unsupported marketing tools and multi-location chains
must not be advertised as implemented. Native payment support remains unresolved
until physical-service versus digital-service products are enforced and the actual
native checkout/return path passes. Do not enable a blanket Stripe path to bypass
Apple's digital-purchase rules. The backlog owns execution order; the risk plan owns
candidate-specific acceptance and STORE-APPS owns store artifacts.

## 3. Users

Student (guest then member), Studio owner/admin, Front desk, Teacher. Platform operator (Taylor) is a fifth role for pilot ops only.

## 4. Pressure test: what the original plan got wrong or left open

| Assumption | Counterargument | Resolution |
|---|---|---|
| "Marketplace is just a page" | The page was real but every write behind it was mock or unsafe. Audit found 10 tables with no RLS, studio rows readable by anon, free classes via waitlist, double refunds | W1 to W3 built first, before any new UI |
| "Fix bugs as found" | Bugs clustered by root cause (no ledger, two waitlist paths, no idempotency). Patching leaves the cause | One entitlement ledger, one waitlist path, one fulfilment path |
| "White label every studio" | Per-studio binaries multiply review and support work | Decision D2: two shared apps, Member and Studio; studio-branded storefronts within the shared platform |
| "Guest checkout is easy" | Paying before a seat is held can charge for a full class | Built: `hold_spot` takes the seat before checkout (00027). Edge: a hold that lapses before payment still flags a refund |
| "Tests exist" | They did not run anywhere | CI runs web and database jobs (W0) |
| "Take rate model" | Not decided and drives Stripe Connect design | D1 open; code supports `platform_fee_cents` either way |

## 5. Original hosted implementation waves (historical; current state in BACKLOG)

Waves are ordered by dependency, not by visibility. A later wave may not start on a table or flow that an earlier wave has not secured.

| Wave | Theme | State |
|---|---|---|
| W0 | Safety net: CI, DB test runner, env and doc drift | CI and runner done; env and doc drift in this PR |
| W1 | Security baseline: RLS everywhere, definer hardening | Done (00022, 00023) |
| W2 | Money correctness: idempotent webhook, refunds, renewals, return URLs | Core done (00025) |
| W3 | Booking integrity: ledger, single waitlist path, locks, check-in | Done (00024) |
| W4 | Guest-first booking: return-to-intent, server booking decision, storefront buttons | Partly done (00026, UI); hold_spot open |
| W5 | Studio supply: write path, onboarding launch gate | Open |
| W6 | Growth: analytics sink, prerender and sitemap, noindex mocks | Open |
| W7 | Pilot ops: 3 studios, support loop, flip home to discover | Open |

## 6. Key design decisions (with the reason)

1. **Entitlement ledger.** `bookings.entitlement_consumed` plus one trigger decides consume and release. Counters stored in two places drifted before. Alternative rejected: derive from transactions (slow, and violates Booking != Transaction).
2. **One waitlist path.** `promote_waitlist()` runs after a confirmed booking is cancelled. It skips students with no valid entitlement. Two old triggers gave free classes.
3. **Thin webhook, SQL fulfilment.** Edge function verifies and dispatches; Postgres functions do the work in one transaction, deduped by `stripe_events`. Errors return 5xx so Stripe retries.
4. **Server decides how to pay.** `book_class_auto` picks membership, then pack by soonest expiry, else returns `needs_payment`. The client never chooses an entitlement.
5. **Public data only via narrow RPCs.** Anon never reads tables.
6. **Return to intent.** `?next=` plus a one hour localStorage stash, same-site relative paths only (open-redirect safe).

## 7. Original hosted risks (historical; current blockers in BACKLOG)

| Risk | Why it matters | Mitigation | Owner wave |
|---|---|---|---|
| Production has no backend (placeholder Supabase) and no Tandava DB exists | Nothing built in W1 to W4 has run against a live Supabase | W0.5 provisioning, see LAUNCH_RUNBOOK | W0.5 |
| Supabase built-in mail is 2 emails/hour | Guest sign-up at the last step dies on confirmation mail | Custom SMTP (Resend) before any real user | INF-4, INF-6 |
| Vercel Hobby team hosting a paid product | Against Hobby terms; risk of suspension | Vercel Pro | INF-3 |
| Stripe platform verification lead time | Live payments wait on entity + bank verification | Start now in test mode | INF-4 |
| Edge functions never executed in tests (no Deno) | Webhook bugs reach Stripe test mode first | Fulfilment logic is in SQL and tested; run Stripe CLI replay before pilot | W7 |
| No UI E2E | Booking UI regressions invisible | Decide Playwright (D6) | W4 |
| Hold lapses before payment and class fills | Charge without a seat (rare) | 35 min hold vs 31 min Stripe session; refund flag remains | W4-3 done |
| `FOR ALL` staff policies without role filter, 42 write policies skipping is_active | Deactivated staff keep write access | Tightening migration | W5-4 |
| ~128 bare `auth.uid()` in old policies, ~25 missing FK indexes | Slow at scale | Perf migration | W5-5 |
| Edited applied migrations 00005/00008/00009 | Prod drift | Taylor confirms, D5 | W0 |

## 8. Decisions

Answered 2026-10-04: D5 keep edits after a prod schema diff (blocked: no Tandava project in the connected Supabase account), D6 Playwright yes, D7 Turnstile yes, D9 preview bypass yes (done). D1 remains undecided; the latest two-app direction supersedes the old D2 default.


| ID | Decision | Default I would take |
|---|---|---|
| D1 | $99/mo flat vs 2% take | Flat; matches HOSTED_PRODUCT_REVIEW |
| D2 | Shared products versus per-studio binaries | Confirmed October 21: one shared Member app and one shared Studio management app; published source remains available |
| D3 | First metro | Austin |
| D4 | Flip home to discover at 5 discoverable studios | Keep threshold |
| D5 | Approve edited migrations 00005/00008/00009, least privilege on 00008 | Approve after a prod schema diff |
| D6 | Playwright devDependency | Yes |
| D7 | Captcha for guest checkout (Turnstile) | Turnstile |
| D8 | Stripe mode: platform (hosted) vs direct (self-host) | Both, env switch already built |
| D9 | Vercel preview bypass to verify embed headers | Yes |

## 9. Definition of done for v1

- All DB tests and unit tests green in CI on main.
- E2E-01 (guest to booked) green.
- Stripe test-mode replay of each event type produces exactly one transaction.
- 3 pilot studios live, each onboarded in under 30 minutes.
