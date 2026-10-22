# Launch v1 backlog (dependency ordered)

Rules: one slice per commit (`W4-2a`), a test lands with the code, a DB change is a new migration, nothing starts before its `Needs` are done. Status: DONE, NEXT, LATER. See [PRD](PRD-launch-v1.md).

## Current release checkpoint — October 21, 2026

Taylor confirmed the endpoint: submit **both** the first-party hosted Member
marketplace and Studio management apps for App Review after a secure, polished,
low-friction release passes acceptance. Published open-source code remains part
of the model. The [PRD](PRD-launch-v1.md) records this direction; it supersedes old
single-app/non-native scope statements and expired submission dates below.

Work is integrated on [draft PR #109](https://github.com/TaylorONeal/tandava/pull/109),
branch `codex/app-store-excellence`, in the separate
`tandava-app-store` worktree: current main `c982696`, native PR #102 `4aea122`, and
restricted Data API grants PR #106 `6c5375b`. Neither PR was merged remotely.
Migration 45 on main remains historical; scoped grants are 46; native deletion
migrations are renumbered 47–49 to remove duplicate versions. No hosted SQL was run.
[PROGRESS](PROGRESS.md) owns results. [RELEASE-RISK-PLAN](../testing/RELEASE-RISK-PLAN.md)
owns test procedures; [STORE-APPS](../app-store/STORE-APPS.md) owns store candidates.

| Priority / task | Verified state | Next acceptance / unblock condition |
|---|---|---|
| P0 endpoint and tenant security | Restricted-grant and native migrations integrated; new local fixes cover redirects, inactive staff, generic sender authorization and imported member identity | CI passes at `714bc70`; independent review and merge/hosted rollout remain separate. Inspect production catalogs/consumers before tightening permissions. No live disclosure established by synthetic tests. |
| P0 truthful booking and sign-out | Local fixes and 11 browser checks pass for waitlist/missing-response handling, Studio logout and setup | All 36 CI browser cases pass; review and physical candidate acceptance remain. Browser fixtures do not prove hosted operation |
| P1 onboarding and native recovery | Preserve current design; repair unnamed phone setup steps, scrollable management navigation and unusable native email return origins | Same-task phone/desktop before/after inspection; verify real native email delivery, CAPTCHA and app/browser session boundaries |
| P0 payment acceptance | Latest scheduled smoke 39438453726 failed before checkout with missing test credentials; no provider payment outcome observed | Local isolated-harness repair and regression checks pass; runtime grants remain restricted. Provision the disposable local Supabase fixture and matching sandbox inputs before the retained schedule can run. Then prove actual hosted checkout/webhook/refund delivery separately. |
| P0 account deletion | Initiation/review/profile-stage code exists; UI OFF; full fulfillment incomplete | Approved per-category retention rules and responsible operator; complete Auth, data, storage, processor and backup adapters plus recovery and disposable-account proof. Pending/profile scrubbing cannot count as deletion. |
| P0 native purchase scope | Existing native candidate blocks checkout/express/portal; delivery classification is not persisted, and packs/memberships lack physical-only redemption restrictions | Enforce physical-service versus digital-service classification, implement a supported native purchase/return path and test it. Do not advertise purchase capability while blocked. |
| P0 reviewer environment | Role fixtures and page prerequisite are documented; real acceptance remains NOT RUN | Verified synthetic identities and authorized reachable studio page; actual Member, Teacher and Owner journeys, persistence and denial checks |
| P0 Apple records and candidates | October 21 Apple API returned zero app records for both existing bundle IDs; local signed 1.0(3) is older source 270a0a1 | Browser control recovered, but Apple’s sign-in form stalls and account access remains unverified. Create records when access works, rebuild after accepted source fixes, validate/upload and perform physical acceptance. |
| P1 complete advertised studio paths | Phone setup/navigation checks pass; currency options remain limited; advanced routes require a current real-data inventory | Verify every exposed launch action; fix or explicitly withhold unsupported paths and remove misleading global/full-featured claims |
| P1 final assets and declarations | Existing listing drafts are conditional; no complete authenticated screenshot set | Capture real accepted candidate journeys for each app, finish accurate privacy/support/reviewer fields, then submit only with P0 gates closed |

The historical tables below explain dependency IDs and prior implementation; old
NEXT/DONE labels are not new release evidence. No real payment, customer message,
customer-data mutation, production deployment or App Review submission occurred
in this local integration pass.

## Launch path (2026-10-09, supersedes the loose NEXT lines at the bottom)

Launch means: one real pilot studio takes a real booking and a real payment on tandavastudio.com, without being listed in Discover. Discover as a home page (W7-4) comes after 5 studios. Gates run in order; items inside a gate run in parallel. Claude works the code items while Taylor clears his batch.

| Gate | ID | Task | Owner | Needs | Status |
|---|---|---|---|---|---|
| 1 Money proof (sandbox) | LP-1 | Smoke test: buy drop-in, pack and membership on the test studio; refund one; resend one delivered event and confirm exactly one transaction. Record in PROGRESS | Claude drives, Taylor types the 4242 test card | Discover on for the test studio (temporary) | NEXT |
| | LP-1a | Automated Stripe smoke (`scripts/smoke/stripe-smoke.mjs`, workflow `Stripe smoke`): class pack checkout, signed paid event, redelivery, refund; daily and on demand, test mode only. Covers all of our code; the one manual step left in LP-1 is typing 4242 once on Stripe's hosted page | Claude; Taylor adds 3 GitHub secrets | | DONE in #98. Waiting on Taylor: the 3 SMOKE_ secrets, then a first run |
| | LP-1b | W7-1 in full: drive and resend every event stripe-webhook handles (checkout, refund, renewal, `account.updated`, subscription updated and deleted, payment failed); each yields exactly one ledger effect. No Stripe CLI here: trigger from the dashboard and test clocks, resend from the event page | Claude, Taylor for card entry | LP-1 | NEXT |
| | LP-1c | Refund flagged payments automatically: when fulfillment notes "refund needed" (double charge, class full or cancelled), stripe-webhook issues the Stripe refund (idempotent by event id, reverse transfer). Today it only records the note | Claude | LP-1 | NEXT |
| | LP-1d | Studio cancels a booked class: cancel its bookings, return pack and membership credits through the ledger, refund paid drop-ins, tell the students. Today `is_cancelled` changes nothing for existing bookings | Claude | LP-1c | DONE in PR: one tap on /manage/schedule (Next two weeks). Preview shows each person and what they get back; cancel_class (00043) cancels the class and its bookings, the ledger returns pack and membership classes, drop-in refunds are queued in refund_requests and sent to Stripe by the cancel-class function (idempotent, reverses Connect transfers), everyone with an email is told with the studio's note. Follow-up is durable: notices are queued in class_cancel_notices with the cancel, class_cancel_followup reports what is still owed, and an interrupted cancel shows "Finish follow-up" (resume mode). Paid-after-cancel drop-ins are queued too; a refund Stripe later fails is reopened (refund.updated, refund.failed, charge.refund.updated); students told "arranging" get a refund-sent email; overdue cancellations that still owe stay listed under Still to finish. Owners can mark notices handled after contacting people (an interrupted send is never resent automatically); a full refund made in the Stripe dashboard settles the queue (charge.refunded). CC-01..19, e2e. Prod also: redeploy stripe-webhook and add refund.updated, refund.failed and charge.refund.updated to the endpoint events. Prod: `apply-00043.sql`, deploy cancel-class |
| 2 A studio can sell on its own | LP-2 | Public page and guest booking work for a studio that is not in Discover. New owner-controlled "page live" state (`studios` has no active or published field today): storefront RPCs and express-book serve a studio by slug only when its page is live; `discoverable` only adds it to `discover_classes` and requires a live page. Negative DB tests for a studio whose page is off. Migration, edge redeploy | Claude | none | DONE in #90 (00038, LIVE-01..08). Prod: apply `scripts/db/prod/apply-00038.sql`, redeploy `onboarding`, `analytics-session`, `run-automations` (after the SQL) |
| | LP-3 | Owner lands on `/manage` for their studio; header shows the studio name; no sample notifications. Students land on their bookings | Claude | none | DONE in PR: header shows the owner's studio, sample bell count only in the demo, signed-in students land on /discover (sample-data /schedule until LP-4) |
| | LP-4 | Real data in MySchedule and Account (W4-5), `noindex` on /my-schedule | Claude | none | DONE in #92: My Schedule (00039) and Account (00040) on real data, MYB/ENT/PROF tests. Prod: `apply-00039-00040.sql`. Notification preferences and saved cards: LATER (no table) |
| | LP-5 | Owner can edit classes, prices and schedule after onboarding (W5-1). Check on the test studio first, fix what fails | Claude | none | DONE in PR: Classes and pricing (/manage/offerings) and Weekly schedule (/manage/schedule) on real data, 00042 owner/admin write policies, CAT-01..24, e2e. Prod: `apply-00042.sql`. One-off class changes (cancel one date, sub) still LATER |
| | LP-6 | Hide Settings tabs that only toast (fake sitemap URL included) instead of building them. Move the Discover and page-live switches from the Branding tab to General | Claude | none | DONE: switches on General (#90); live studios no longer see Locations, Notifications, SEO or logo upload (no backing store); Billing shows real payout status and opens Stripe (PR) |
| | LP-14 | Funnel sink (W6-1) so pilot drop-off is visible from the first studio | Claude | none | Code DONE in PR: PostHog capture over fetch when `VITE_POSTHOG_KEY` is set. Taylor: create a PostHog project, then the key goes in Vercel |
| 3 Trust and abuse | LP-7 | `EXPRESS_IP_SALT` secret; Turnstile hostnames (tandavastudio.com, www) then the secret in Supabase Auth | Taylor | none | NEXT |
| | LP-8 | Advisor warnings: pin `search_path` on legacy functions (48 warnings). New migration, prod via SQL handoff | Claude, Taylor runs SQL | none | DONE in PR (00041, HARD-01..03). Prod: `apply-00041.sql`. Remaining advisor items are by design (documented in the migration) plus "Leaked password protection" (Taylor, Auth settings) |
| | LP-9 | Terms, privacy and studio refund policy pages reachable from checkout and signup | Claude drafts, Taylor approves | none | DONE in PR: /terms, /privacy, /refunds from src/content/legal; linked from sign-up (replaces the dead /terms and /waiver links), express booking, storefront pricing, member drop-in, and every footer. Taylor to approve the wording; a lawyer review is recommended before real money |
| 4 Live money | LP-10 | D1 pricing: flat $99/mo or % fee. Sets the application fee before live | Taylor decides | none | NEXT |
| | LP-11 | Stripe live: activate the platform account, Connect live settings (Accounts v1 opt-in now, v2 later), two live webhook destinations, live keys and secrets in Supabase | Taylor clicks, Claude fills forms | LP-1b, LP-10 | LATER |
| | LP-12 | Live smoke: one real small purchase and refund | Taylor | LP-11 | LATER |
| 5 Pilot | LP-13 | First pilot studio onboarded and timed (target under 30 minutes); support address hello@purafieldstudio.com | Taylor recruits, Claude watches logs | Gates 2 to 4 (LP-14 included) | LATER |

Parked until after LP-1b: #72 attribution (it edits stripe-webhook; do not change the money path mid-test). Stale: #62, #63.

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
| W4-6 | Turnstile on sign-up (Supabase Auth captcha). Needs `frame-src https://challenges.cloudflare.com` in vercel.json CSP and a site key env var | D7 | E2E | Widget DONE (#75, #76, live). Enforcement waits on the Turnstile secret in Supabase Auth > Attack Protection (Taylor) |
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
| W6-2 | Prerender `/discover` and `/s/:slug`, sitemap, fix robots vs sitemap domain | none | Robots and sitemap on tandavastudio.com DONE (#74, #78). Prerender of `/discover` and `/s/:slug` LATER |
| W6-3 | noindex on mock pages (/schedule, /events, /instructors, /my-schedule) | W4-5 | DONE for /schedule, /events, /instructors, /on-demand (#78, `DemoDataPage` wrapper). /my-schedule open: it sits behind ProtectedRoute, so crawlers get the sign-in redirect; add `noindex` when W4-5 wires its real data |
| W6-4 | `/for-studios` page, open source pitch under `/open-source` | none | DONE (pages live, in sitemap) |

## W7 Pilot ops

| ID | Task | Needs | Status |
|---|---|---|---|
| W7-1 | Stripe CLI replay of every handled event | W2-2 | LATER |
| W7-2 | Verify embed headers on a real preview | D9 | DONE: /embed/* has frame-ancestors * and no X-Frame-Options; /discover has frame-ancestors none and DENY. Re-check on prod domain |
| W7-3 | 3 pilot studios, support loop | W5-3, W7-1 | LATER |
| W7-4 | Flip `VITE_HOME_MODE=discover` | W7-3, D4 | LATER |
| W7-5 | Single-use embed handoff tokens: the embed asks the server for a short-lived, one-time token instead of passing its raw visitor id as `tv`, so a copied booking URL opened by two signed-out people can't merge their journeys (PR #72 review, deferred as a new feature) | PR #72 | LATER |
| W7-6 | Pass the express origin into `create_guest_booking` instead of inferring it from `profiles.is_guest` in the waitlist-context trigger, so a guest claiming their account in the same instant as an express waitlist booking still gets an express (not member) conversion on promotion (PR #72 review, deferred: changes main's booking function) | PR #72 | LATER |
| W7-7 | Idempotent page-view counts: `record_session` increments `page_views` on every call, so a retried capture whose first response was lost counts twice. Add a per-page-view request id (RPC signature change) so a retry is recognised (PR #72 review, deferred: page_views is display-only, not used for attribution or money) | PR #72 | LATER |
| W7-8 | Self-hosted gateways: member booking RPCs send the converting session as an `x-tandava-session` header. Hosted Supabase reflects requested CORS headers (verified 2026-10-08), but a stock self-hosted Kong config would block the preflight. Move it into an RPC argument before anyone self-hosts (PR #72 review) | PR #72 | LATER |
| W7-9 | Express booking after an embed handoff: the browser's displaced earlier visitor ids are linked only at sign-in, so an immediate guest booking's first-touch journey uses only the handoff id. Pass the displaced ids to express-book and include them in `record_conversion`'s journey (they link after the booking's commit time, so the `linked_at <= v_at` filter would drop them today; needs an RPC argument). Narrow case: prior anonymous visits on the app origin AND an embed handoff AND a guest booking in the same visit (PR #72 review) | PR #72 | LATER |
| W7-10 | Late conversion retries and acquisition: when `conversion_retry_queue` replays an earlier conversion after a later one already set the member row, `studio_members` keeps the later source, first touch and `acquired_at` (COALESCE). Replace tracked acquisition fields when the replayed `acquired_at` is earlier, keeping `import` and `pre_tracking` rows. Needs a follow-up migration (00038 or later); only hits conversions that failed to write first time (PR #72 review) | PR #72 | NEXT |
| W7-11 | Member detail on live data: `/manage/members/:id` still renders a fixture member. Load the routed member (profile, membership, bookings, notes), then put `MemberSourceStrip` back (removed in PR #72 so a real source never shows under the fixture name) | PR #72 | NEXT |

## Critical path

W1 -> W3 -> W4-1 -> W4-3 -> W4-4 -> W5-2 -> W7-3 -> W7-4. W2 gates W4-3 and W5-2. W6 can run beside W5.

- DONE (#82): Settings loads and saves the real `studios` row; Discover and Express Booking switches persist. Test SET-01..03.
- NEXT: Settings tabs that still only toast (notifications, SEO, branding beyond the studios row) show placeholder data. The SEO tab shows a fake `https://{slug}.tandava.yoga/sitemap.xml`; replace with the real per-studio URL on tandavastudio.com or hide it.
- NEXT: Demo sample data still uses `@tandava.yoga` emails and `https://tandava.yoga` defaults (Settings, Teachers, Tasks). Fine in demo mode; make sure none of it shows for a live studio.
- DONE (00036): schedule rules generate bookable classes 8 weeks ahead (trigger, `generate_class_occurrences`, daily cron). GEN-01..09.
- NEXT: Stripe Connect on Accounts v2 (`POST /v2/core/accounts`). Sandbox runs on the Accounts v1 opt-in; live mode must either get the same opt-in or move to v2 before the first real studio.
- NEXT: after sign-in a real owner lands on `/schedule` (sample data). Send owners to `/manage`, students to their real bookings; the manage header must show the studio name, not "Tandava Yoga", and no sample notifications.
- NEXT: Turnstile fails in Taylor's Chrome ("Verification failed"). Check widget hostnames (tandavastudio.com, www) before enforcing captcha in Supabase Auth.
- LATER: `monthly` schedule rules are not generated (no UI creates them).

## Teacher portal first working slice (2026-10-18)

| Task | State | Acceptance / remaining gate |
|---|---|---|
| Assigned teacher schedule → roster → recorded attendance | Implemented and locally/CI validated, pending deployment | 00044: active assigned teacher/owner/admin only; narrow roster; existing check_in_booking authoritative window/status. Browser mocks cover failure, recovery, duplicate clicks and student denial. TEACH-01..15 and full DB suite passed locally and in PR100 CI; review/apply migration before deploying UI. |
| Teacher availability, substitutes, earnings and teacher profile | Deferred, explicitly unavailable in live UI | Demo unchanged. Separate real contracts needed; no false-save controls exposed live. |
