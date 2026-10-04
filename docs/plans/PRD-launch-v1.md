# PRD: Launch v1 (hosted Tandava + Discover marketplace)

Status: living document. Owner: Taylor. Backlog with IDs: [BACKLOG.md](BACKLOG.md). Progress: [PROGRESS.md](PROGRESS.md). Diagrams: [07-launch-architecture](../developer/07-launch-architecture.md).

## 1. Problem

A student who lands on the platform cannot find a class and book it. Mindbody has the same hole (you need their app first). Studios need a place to run schedule, memberships and payments without a vendor lock. Tandava is open source; the hosted version is how most studios will actually use it.

## 2. Goals and non-goals

| Goal | Measure |
|---|---|
| A stranger finds a class and books it in under 3 minutes, signing up only at the last step | E2E-01 passes; funnel `discover_view` to `booking_confirmed` instrumented |
| A studio goes from signup to a bookable public schedule in under 30 minutes | Pilot timing, W5 |
| Money is correct under retries, refunds, races | PAY-*, BOOK-* DB tests green in CI |
| No tenant can read or write another tenant's data, and anon sees only public RPC output | SEC-*, ISO-* tests green in CI |

Non-goals for v1: native apps, on-demand video sales, SMS marketing, multi-location chains, a white-label build per studio (see decision D2).

## 3. Users

Student (guest then member), Studio owner/admin, Front desk, Teacher. Platform operator (Taylor) is a fifth role for pilot ops only.

## 4. Pressure test: what the original plan got wrong or left open

| Assumption | Counterargument | Resolution |
|---|---|---|
| "Marketplace is just a page" | The page was real but every write behind it was mock or unsafe. Audit found 10 tables with no RLS, studio rows readable by anon, free classes via waitlist, double refunds | W1 to W3 built first, before any new UI |
| "Fix bugs as found" | Bugs clustered by root cause (no ledger, two waitlist paths, no idempotency). Patching leaves the cause | One entitlement ledger, one waitlist path, one fulfilment path |
| "White label the studio app" | Two builds double the support surface before there are 5 customers | Decision D2: one app, studio-branded storefront at `/s/:slug` and custom domains later |
| "Guest checkout is easy" | Paying before a seat is held can charge for a full class | Today: flagged for refund. Planned: hold_spot before checkout (W4-3) |
| "Tests exist" | They did not run anywhere | CI runs web and database jobs (W0) |
| "Take rate model" | Not decided and drives Stripe Connect design | D1 open; code supports `platform_fee_cents` either way |

## 5. Scope by wave

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

## 7. Risks

| Risk | Why it matters | Mitigation | Owner wave |
|---|---|---|---|
| Edge functions never executed in tests (no Deno) | Webhook bugs reach Stripe test mode first | Fulfilment logic is in SQL and tested; run Stripe CLI replay before pilot | W7 |
| No UI E2E | Booking UI regressions invisible | Decide Playwright (D6) | W4 |
| Paid drop-in for a now-full class | Charge without a seat | hold_spot, then checkout | W4-3 |
| `FOR ALL` staff policies without role filter, 42 write policies skipping is_active | Deactivated staff keep write access | Tightening migration | W5-4 |
| ~128 bare `auth.uid()` in old policies, ~25 missing FK indexes | Slow at scale | Perf migration | W5-5 |
| Edited applied migrations 00005/00008/00009 | Prod drift | Taylor confirms, D5 | W0 |

## 8. Open decisions

| ID | Decision | Default I would take |
|---|---|---|
| D1 | $99/mo flat vs 2% take | Flat; matches HOSTED_PRODUCT_REVIEW |
| D2 | White label vs one app | One app plus custom domains |
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
