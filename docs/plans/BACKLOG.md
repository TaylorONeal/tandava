# Launch v1 backlog (dependency ordered)

Rules: one slice per commit (`W4-2a`), a test lands with the code, a DB change is a new migration, nothing starts before its `Needs` are done. Status: DONE, NEXT, LATER. See [PRD](PRD-launch-v1.md).

## W0 Safety net

| ID | Task | Needs | Acceptance | Status |
|---|---|---|---|---|
| W0-1 | CI: web and database jobs | none | `.github/workflows/ci.yml` green on PR | DONE (green on PR #64) |
| W0-2 | `npm run test:db` builds a throwaway DB, applies all migrations, runs tests | none | exits 0 on clean DB | DONE |
| W0-3 | `.env.example` matches code | none | every `Deno.env.get`/`import.meta.env` var listed | DONE in this PR |
| W0-4 | Doc reconcile (STATUS, HANDOFF, ROADMAP, INDEX, CLAUDE.md) | none | banners point to PRD | DONE in this PR |

## W0.5 Infrastructure provisioning (new 2026-10-06)

Found: production is a demo build (`placeholder.supabase.co`); no Tandava database exists. Steps and
commands in [LAUNCH_RUNBOOK.md](LAUNCH_RUNBOOK.md).

| ID | Task | Needs | Owner | Status |
|---|---|---|---|---|
| INF-1 | Operating identity decided (Purafield Studio, purafieldstudio@gmail.com) | none | Taylor | DONE 2026-10-07 |
| INF-2 | Supabase Free account under purafieldstudio@gmail.com (separate person = own free projects); connector re-authorized to it | INF-1 | Taylor | DONE (project `tandava-prod` ref `mkaixgjwakfufmmwembn`, us-east-2; connector re-link not needed, SQL editor path used) |
| INF-3 | Vercel team to Pro; connector with env access | INF-1 | Taylor | NEXT |
| INF-4 | Stripe platform account (test mode), Resend domain, Turnstile keys | INF-1 | Taylor | NEXT |
| INF-5 | Create `tandava-prod`, apply 00001..00027, deploy edge functions, advisors clean | INF-2 | Claude | blocked |
| INF-6 | Secrets set (Supabase, Vercel, Auth SMTP and captcha, Stripe webhook) | INF-3, INF-4, INF-5 | Taylor | blocked |
| INF-7 | Seed first tenant; E2E and Stripe test-mode pass against prod DB | INF-6 | Claude | blocked |
| INF-8 | Merge PR #64; production on real backend | INF-7 | both | blocked |

## W1 Security baseline

| ID | Task | Needs | Test | Status |
|---|---|---|---|---|
| W1-1 | RLS on 10 exposed tables, drop public studios policy, harden definer functions | W0-2 | SEC-01..08 | DONE (00022) |
| W1-2 | Policies for 26 locked tables | W1-1 | ISO-*, SEC | DONE (00023) |

## W2 Money correctness

| ID | Task | Needs | Test | Status |
|---|---|---|---|---|
| W2-1 | `stripe_events` ledger, fulfilment functions, refunds, renewals | W1 | PAY-01..08 | DONE (00025) |
| W2-2 | Thin webhook, async signature, 5xx on error | W2-1 | Stripe CLI replay | DONE, replay pending (W7) |
| W2-3 | Checkout: return URL allowlist, charges_enabled gate, idempotency key | W2-1 | safeReturnUrl unit tests | DONE |
| W2-4 | Membership cycle reset vs refund corruption | W2-1 | new PAY test | LATER |
| W2-5 | Application fee at studio level | D1 | PAY test | LATER |

## W3 Booking integrity

| ID | Task | Needs | Test | Status |
|---|---|---|---|---|
| W3-1 | Entitlement ledger and trigger, rebooking after cancel | W1 | BOOK-09..14 | DONE (00024) |
| W3-2 | Single waitlist path | W3-1 | BOOK-*, CHK-* | DONE |
| W3-3 | Last-credit race | W3-1 | BOOK-15 (two sessions) | DONE |
| W3-4 | `check_in_booking` | W3-1 | CHK-01..06 | DONE |

## W4 Guest-first booking

| ID | Task | Needs | Test | Status |
|---|---|---|---|---|
| W4-1 | `book_class_auto` | W3 | AUTO-01..06 | DONE (00026) |
| W4-2 | Return-to-intent auth, storefront Book and Buy buttons | W4-1 | authReturn unit tests | DONE |
| W4-3 | `hold_spot` then checkout so a paid drop-in cannot hit a full class | W4-1 | HOLD-01..11 | DONE (00027, checkout calls it) |
| W4-6 | Turnstile on sign-up (Supabase Auth captcha). Needs `frame-src https://challenges.cloudflare.com` in vercel.json CSP and a site key env var | D7 | E2E | NEXT |
| W4-4 | Playwright E2E-01 guest to booked | W4-2, D6 | E2E-01 | UI half DONE (`npm run test:e2e`, mocked Supabase, in CI). Full stack half needs local Supabase |
| W4-5 | Wire real data into Schedule, MySchedule, Account (replace mocks) | W4-1 | E2E | LATER |

## W5 Studio supply

| ID | Task | Needs | Test | Status |
|---|---|---|---|---|
| W5-1 | Staff write path for classes (RPC vs policy decision, 44 SELECT-only tables) | W1 | ISO write tests | NEXT |
| W5-2 | Onboarding gate: cannot set discoverable with zero classes or no charges_enabled | W5-1, W2 | DB test | LATER |
| W5-3 | Onboarding under 30 minutes, timed | W5-2 | pilot | LATER |
| W5-4 | Tighten `FOR ALL` staff policies and is_active on writes | W5-1 | SEC tests | LATER |
| W5-5 | Perf migration: `(select auth.uid())`, FK indexes | W5-4 | advisors clean | LATER |

## W6 Growth

| ID | Task | Needs | Status |
|---|---|---|---|
| W6-1 | `setFunnelSink` at main.tsx next to initSentry | W4-2 | NEXT |
| W6-2 | Prerender `/discover` and `/s/:slug`, sitemap, fix robots vs sitemap domain | none | LATER |
| W6-3 | noindex on mock pages (/schedule, /events, /instructors, /my-schedule) | W4-5 | LATER |
| W6-4 | `/for-studios` page, open source pitch under `/open-source` | none | LATER |

## W7 Pilot ops

| ID | Task | Needs | Status |
|---|---|---|---|
| W7-1 | Stripe CLI replay of every handled event | W2-2 | LATER |
| W7-2 | Verify embed headers on a real preview | D9 | DONE: /embed/* has frame-ancestors * and no X-Frame-Options; /discover has frame-ancestors none and DENY. Re-check on prod domain |
| W7-3 | 3 pilot studios, support loop | W5-3, W7-1 | LATER |
| W7-4 | Flip `VITE_HOME_MODE=discover` | W7-3, D4 | LATER |
| W7-5 | Single-use embed handoff tokens: the embed asks the server for a short-lived, one-time token instead of passing its raw visitor id as `tv`, so a copied booking URL opened by two signed-out people can't merge their journeys (PR #72 review, deferred as a new feature) | PR #72 | LATER |

## Critical path

W1 -> W3 -> W4-1 -> W4-3 -> W4-4 -> W5-2 -> W7-3 -> W7-4. W2 gates W4-3 and W5-2. W6 can run beside W5.
