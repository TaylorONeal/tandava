# Launch v1 progress and continuation

Branch: `codex/launch-v1`. Why: [PRD-launch-v1.md](PRD-launch-v1.md). Ordered tasks and IDs: [BACKLOG.md](BACKLOG.md). Diagrams: [07-launch-architecture](../developer/07-launch-architecture.md). Pick the first NEXT task whose Needs are DONE.

Branch: `codex/launch-v1`. Plan docs (Taylor's machine / Claude project "Tandava Studio - Launch"):
`docs/plans/2026-10-04-launch-v1.md`, `docs/plans/2026-10-04-test-plan.md`.

## Done
- LV1-1a  DB: `discover_classes` RPC (00019), types, DataProvider method
- LV1-1b  DB: RLS recursion fix + RLS on 3 tables (00020), book_class fixes (00021)
- LV1-1c  Existing migrations 00005/00008/00009 repaired so a clean DB applies (flagged, see below)
- LV1-2a  Discover page `/discover`, `src/lib/discover.ts`, `useDiscover`, funnel events
- LV1-2b  Home mode switch `VITE_HOME_MODE=platform|discover` (default platform), `homeMode.ts`
- LV1-3a  Embed framing allowed only under `/embed/*` (vercel.json + test)
- LV1-4a  SQL tests: `supabase/tests/` (isolation, discover, booking, last-spot race)

- LV1-5a  W1 security: RLS on 10 tables, policies for 26 more (00022, 00023), SEC tests
- LV1-5b  W3 booking integrity: entitlement ledger, one waitlist path, check_in_booking (00024)
- LV1-5c  W2 payments: stripe_events, SQL fulfilment, thin webhook, checkout hardening (00025)
- LV1-5d  W4 book_class_auto (00026), return-to-intent auth, storefront Book/Buy buttons
- LV1-5e  W0 CI (`.github/workflows/ci.yml`) and `npm run test:db`
- LV1-6a  Docs: PRD, backlog, diagrams, lessons, env drift

## Not done: see BACKLOG.md (the list below is the older, pre-audit view)
1. Storefront: honor `?class=`, let a guest pick a class and sign up after selection (E2E-01)
2. `/for-studios` page; move open-source pitch under `/open-source` copy
3. Policies for 26 tables with RLS on and no policy (client sees nothing)
4. Playwright E2E (decision: add `@playwright/test` devDependency?)
5. Verify embed header rule on a real Vercel preview
6. Studio onboarding under 30 minutes; pilot with up to 3 studios

## Run it
```
npm run typecheck && npm test && npm run build
supabase start && supabase db reset && npm run test:db   # throwaway local DB, never production
```

## Flags for review
- Edited already-applied migrations 00005, 00008, 00009 (CLAUDE.md says new files for schema changes). Needed for clean-DB apply; production already applied the old text, so confirm no drift.
- 00008 policies now allow any active staff, not only owner/admin. Check least privilege.
- Flip `VITE_HOME_MODE=discover` only after ~5 discoverable studios (`DISCOVER_HOME_MIN_STUDIOS`).


## 2026-10-07: production database provisioned
- Supabase: org Purafield Studio (Free), project `tandava-prod` ref `mkaixgjwakfufmmwembn`, East US (Ohio). Account purafieldstudio@gmail.com.
- Migrations 00001..00027 applied via SQL editor from commit e79238e. Verified by function list (hold_spot, book_class_auto, check_in_booking, stripe fulfilment). Security advisor: 0 errors, 48 warnings (Function Search Path Mutable on legacy invoker/trigger functions; fix in a new migration, not yet written). Not tracked in `supabase_migrations` history (run by hand); use `supabase migration repair` before any `db push`.
- Cloudflare Turnstile widget "Tandava" created (site key public; secret stays with Taylor). Stripe: Purafield Studio sandbox with Connect enabled (marketplace).
- Next: edge functions (stripe-checkout, stripe-webhook, stripe-connect, email) need a Supabase access token or dashboard deploy; set secrets; Vercel env vars; Auth SMTP and captcha; seed first tenant.

2026-10-07 (later): edge functions deployed (6, ACTIVE), Stripe sandbox webhook `tandava-prod` created (7 events, Your-account scope), Supabase secrets set via scripts/set-secrets.sh, Auth site URL + redirect allowlist set, Vercel env vars VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_TURNSTILE_SITE_KEY / VITE_HOME_MODE saved (Production + Preview). Vercel team is already Pro. Do NOT redeploy production from main: it predates the launch code. Test on the PR preview. Open: Stripe Connected-accounts webhook for account.updated, Resend + SMTP, Turnstile secret in Supabase Auth, audit the old Vercel "_MODE" variable.

## 2026-10-08: launch day state
- Merged to main and live on tandavastudio.com: #64 (launch v1), #74 (owner-first copy, expired-link resend, robots fix), #75 (Turnstile widget), #76 (captcha on resend). Prod DB matches main: main's 00019..00024 plus 00034 applied by hand 2026-10-08; ours are 00025..00033 (renumbered files, already applied 2026-10-07).
- Email: Resend verified purafieldstudio.com; Supabase Auth SMTP via the Resend integration; six branded auth templates live; reset email delivered. Edge secret EMAIL_FROM = hello@purafieldstudio.com.
- Edge functions on prod: stripe-checkout, stripe-connect, stripe-portal, onboarding, email, stripe-webhook (all match main) plus express-book (deployed 2026-10-08 via Supabase MCP, verify_jwt off, smoke-tested 400/404). Not deployed: import-members, push, sms (not used at launch).
- Open:
  - `EXPRESS_IP_SALT` secret unset: express-book skips per-IP limiting and keeps the per-email limit. Set it in Supabase > Edge Functions > Secrets with any long random value.
  - Captcha: `VITE_TURNSTILE_SITE_KEY` is already set in Vercel, so the widget is live. Last step is the Turnstile secret key in Supabase Auth > Attack Protection.
  - Seed Purafield Studio as a hidden test studio (Taylor resets the purafieldstudio@gmail.com app password via /auth/reset, signs in, onboarding), then Stripe sandbox purchase, refund and webhook replay.
  - #72 (attribution phase 1) edits stripe-webhook and adds migration 00035: check it keeps fulfill_stripe_checkout before merging, and apply 00035 by hand.
  - Copy audit C-3 (translations) and C-5 (onboarding copy). `www.tandavastudio.com` missing from the Supabase redirect allow-list.

## 2026-10-09: launch day 2 state
- Merged to main and live (Vercel production READY on 8fda0c1): #77 (docs), #78 (CSP, fonts, noindex on mock pages, prerender anchor), #79 (no chunk-reload loop when sessionStorage is blocked), #80 (owner-signup translations, 17 locales), #81 (onboarding copy names Tandava Discover), #82 (Settings saves the real studio; Discover and Express Booking switches persist).
- Removed the static `canonical` in index.html that pointed every route at `https://tandava.yoga`; SEOHead sets per-page canonicals on tandavastudio.com.
- Merging: #83 added `.claude/settings.json` on main with a squash-merge allow rule. Sessions started after it landed should be able to merge on Taylor's explicit "merge" (rules in CLAUDE.md); not yet proven by a real merge. Sessions that started before it cannot, and hand Taylor the PR links in order.
- `/demo` now sets its own canonical (it is in the sitemap and had none once the static one went).
- Still open, in order:
  1. Taylor: reset the purafieldstudio@gmail.com app password at https://tandavastudio.com/auth/reset (regular Chrome), sign in, reply "in". Then seed Purafield Studio as a hidden test studio and run the Stripe sandbox purchase, refund and webhook tests (W7-1).
  2. Taylor: `EXPRESS_IP_SALT` at https://supabase.com/dashboard/project/mkaixgjwakfufmmwembn/functions/secrets (any long random value).
  3. Taylor: Turnstile secret at https://supabase.com/dashboard/project/mkaixgjwakfufmmwembn/auth/protection
  4. #72 (attribution phase 1): needs review. On merge, apply `scripts/db/prod/apply-00035.sql` by hand first, then redeploy stripe-webhook and any other changed function (deploy order is in its `docs/OPERATOR_SETUP.md`).
  5. Settings tabs beyond the studios row still placeholder (BACKLOG).

## 2026-10-09 (later): first live test studio
- purafieldstudio@gmail.com reset and signed in. Onboarding created hidden studio "Purafield Studio (test)" (slug `purafield-studio-test-eejz`, discoverable off, America/Chicago): one offering (Test Vinyasa, $20 drop-in, capacity 10), a Saturday 10:00 weekly rule, a $99 membership and a 5-class pack.
- Found: the weekly rule never became bookable classes (no code turned `schedule_rules` into `class_occurrences`). Fixed by 00036 (trigger on rules, owner/admin top-up RPC, daily pg_cron job, backfill). Applied to prod 2026-10-09 by Taylor via the SQL editor; verified: 8 Saturdays from 2026-10-10 10:00 CT, cron job `generate-class-occurrences` 07:15 UTC, anon cannot execute.
- 00037 (rule start date in studio time) and an onboarding fix (re-saving the class step edits the studio's first rule instead of adding a second) follow from the #85 review. Prod: apply `scripts/db/prod/apply-00037.sql` and redeploy the `onboarding` edge function after merge.
- Found: Stripe refused `stripe-connect` ("Accounts v1 not recommended for new Connect integrations"). Accounts v1 support turned on in the Purafield Studio sandbox (Taylor's call, 2026-10-09). Live mode needs the same setting or a move to Accounts v2 (BACKLOG).
- Found: after sign-in a real owner lands on `/schedule` with Oxatl sample data, and the manage header says "Tandava Yoga" with sample notifications (BACKLOG).
- Turnstile shows "Verification failed" in Taylor's Chrome. Do not add the Turnstile secret to Supabase Auth until the widget passes; check the widget hostnames first.

## 2026-10-09 (evening): Stripe ready, launch path set
- #85 merged (cfa9aa3). 00036 and 00037 applied to prod by Taylor; onboarding edge function v4 deployed (re-saving the class step edits the first rule).
- Stripe sandbox (platform `acct_1UNlJxL4WU0kwuiF`, "Purafield Studio sandbox"): test studio connected account `acct_1UOSAmL4K6KVihAt` Enabled, charges and payouts on, Stripe test bank. `studios.stripe_charges_enabled` = true.
- Webhook destinations, both Active: `tandava-prod` (Your account, 7 events) and `tandava-prod-connect` (Connected accounts, `account.updated`). `STRIPE_CONNECT_WEBHOOK_SECRET` set by Taylor in Supabase. `stripe_events` is still empty: no purchase yet.
- Found: the test studio's page `/s/purafield-studio-test-eejz` says "Studio not available". Storefront RPCs and express-book gate on `discoverable`, so a studio outside Discover cannot sell. LP-2.
- Launch path written as gates LP-1..LP-14 at the top of BACKLOG.md. Next: LP-1 (sandbox smoke purchases), with Discover temporarily on for the test studio, then LP-1b (every webhook event).

## 2026-10-09 (later): attribution phase 1 (#72) live in the database
- 00035 applied to prod by Taylor (SQL editor, bundle `scripts/db/prod/apply-00035.sql`, sha 654754f0ed69). Verified read-only: checkout, renewal, claim and opt-in functions present, `automation_settings` present, `bookings.confirmed_at` present, `analytics_sessions.profile_id` FK is ON DELETE SET NULL, 0 RLS tables without a policy, anon cannot write conversions. 00036 and 00037 also on prod.
- Edge functions deployed from the #72 branch via Supabase MCP, each bundled to one file with esbuild (`npx esbuild supabase/functions/<fn>/index.ts --bundle --format=esm --platform=neutral --external:'https://*'`): stripe-webhook v5, stripe-checkout v5, express-book v3, analytics-session v1 (new), unsubscribe v1 (new), run-automations v1 (new). verify_jwt off for all but stripe-checkout. Smoke-tested: webhook 400 without signature, checkout 401 "Not authenticated", express-book 404 for an unknown studio, analytics-session `{sessionId:null}` for an unknown studio, unsubscribe 400 invalid_link, run-automations 403 without the cron secret.
- Codex review loop closed: 4aadad7 "Didn't find any major issues". Deferred: W7-7..W7-11 (W7-10 needs a migration).
- Still open, in order:
  1. Taylor: merge #72 (https://github.com/TaylorONeal/tandava/pull/72). Merging deploys the frontend to tandavastudio.com.
  2. Taylor: `ANALYTICS_IP_SALT` (and `EXPRESS_IP_SALT`) at https://supabase.com/dashboard/project/mkaixgjwakfufmmwembn/functions/secrets, any long random value each.
  3. Automations stay in dry run until `AUTOMATIONS_CRON_SECRET`, `AUTOMATIONS_UNSUBSCRIBE_SECRET`, `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` and then `AUTOMATIONS_ENABLED=true` are set, plus the hourly cron call (docs/OPERATOR_SETUP.md).

## 2026-10-09 (later): LP-1 webhook proof
- Stripe to prod webhook proven: `stripe trigger checkout.session.completed` from the Stripe Workbench shell (sandbox) reached stripe-webhook, signature verified, one `stripe_events` row (`evt_1UOWSyL4WU0kwuiFTRgw9ovT`), correctly ignored (no `metadata.type`).
- Workbench shell rejects `--override` flags on `stripe trigger`, so it cannot send a session with our metadata. A fulfilled purchase needs a real Checkout session from our app.
- Found: CSP `frame-src` blocked `https://js.stripe.com` on every page (console error on the storefront). Fixed in this PR with a header test.
- Agents may not type card numbers, test cards included, on non-local pages, so the Checkout card step stays with Taylor (about 20 seconds).

## 2026-10-09 (later): LP-2 booking page live (#90)
- #87 (example names) and #89 (CSP allows Stripe.js frames) merged.
- 00038: `studios.page_live`. Storefront, public schedule, guest booking lookup, free-class booking and visit tracking serve a studio by slug only when its page is live; `discoverable` only adds it to Discover. Trigger: listing turns the page on, turning the page off unlists. Backfill: listed studios keep a live page. Tests LIVE-01..08 (fail without the migration).
- Settings: "Booking page live", "List on Tandava Discover" and "Guest booking" now sit on the General tab (were under Branding). Onboarding launch step: "Publish my booking page", on by default; the onboarding function saves it.
- Prod after merge, in this order: Taylor runs `scripts/db/prod/apply-00038.sql`; then redeploy `onboarding`, `analytics-session` and `run-automations` via Supabase MCP (they read `page_live`, which does not exist before the SQL).

## 2026-10-09 (later): LP-6 Settings shows only what saves
- Live studios no longer see the Locations, Notifications and SEO tabs or the logo upload (they only toasted "saved"; the SEO tab showed a fake sitemap URL). The demo keeps them. `showSettingsTab` is unit-tested.
- Billing tab (live) shows payout status from `stripe-connect`: ready only when Stripe has `charges_enabled` (what checkout requires), "Stripe review" when details are in but payments are not on yet ("Finish in Stripe" resumes onboarding), and "Open Stripe" goes to the owner's Stripe dashboard (Standard accounts).

## 2026-10-09 (later): LP-3 owner and student landing
- Both manage layouts show the studio the signed-in user manages (owner/admin, `get_my_admin_studio`), not "Tandava Yoga" or "Oxatl Yoga"; demo mode (including a demo build with backend variables) keeps the sample studio and the sample "5" on the bell.
- Signed-in students (and owners before their studio exists) land on /discover instead of /schedule, which still shows Oxatl sample data (LP-4).
- Owners already land on /manage: `get_my_effective_role` reads studio_staff, so the earlier /schedule landing was before onboarding created the studio.

## 2026-10-09 (later): LP-4a My Schedule on real bookings
- 00039 `get_my_bookings()`: the caller's own bookings with class, studio, room, location and teacher names (SECURITY DEFINER, authenticated only). Tests MYB-01..03.
- /my-schedule (live) lists real upcoming and past bookings in the studio's timezone, with the late-cancel deadline; Cancel calls `cancel_booking`. Demo keeps the sample list. Page is noindex.
- Found: /account showed a made-up profile ("Sarah Chen"), membership and pack to real users, and its Save buttons only toasted. LP-4b in the same PR: live /account shows the person's real profile (saves to `profiles`, own row only, PROF-01) and their memberships and class packs across studios from 00040 `get_my_entitlements()` (ENT-01..03), with "Manage billing" (Stripe portal) on Stripe-billed memberships. Preferences and saved cards have no backing store, so the live page does not show them. Demo keeps the sample account.
- Prod after merge: Taylor runs `scripts/db/prod/apply-00039-00040.sql` (independent of 00038).

## 2026-10-09 (later): LP-14 funnel sink
- `setFunnelSink` wired in main.tsx: student funnel events (discover_viewed, class_opened, checkout_started, booking_completed...) go to PostHog's capture endpoint over plain fetch (no SDK) when `VITE_POSTHOG_KEY` is set, with the anonymous attribution visitor id. Without a key they are dropped. `.env.example` documents it.
- Open: Taylor creates a PostHog project (https://us.posthog.com/signup, purafieldstudio@gmail.com), then the project API key is set as `VITE_POSTHOG_KEY` in Vercel (Production and Preview).

## 2026-10-09 (later): LP-8 advisor warnings
- Security advisor on prod: 21 "Function Search Path Mutable", 13 anon and 28 authenticated "SECURITY DEFINER executable", 1 "Leaked password protection disabled".
- 00041 pins search_path on the 21 functions, revokes EXECUTE on SECURITY DEFINER trigger functions (Postgres checks it only at CREATE TRIGGER), and makes book_free_class signed-in only. HARD-01..03 fail without it.
- Kept by design (reasons in the migration): RLS helper functions (policies call them for every role), the public read RPCs, the authenticated booking RPCs.
- Open: Taylor turns on leaked password protection in Supabase Auth (same page as the Turnstile secret).

## 2026-10-09 (later): LP-5 owners edit classes, prices and schedule
- 00039, 00040 and 00041 confirmed on prod (read-only check): `get_my_bookings`, `get_my_entitlements` present, `book_free_class` signed-in only.
- Found: after onboarding nothing could change. /manage/offerings and /manage/schedule showed sample data, and offerings, class_pack_types, membership_types and schedule_rules had read policies only.
- 00042: owner/admin INSERT and UPDATE policies (no DELETE, "Off" keeps history), value checks, studio_id fixed, rules must use their own studio's class, location and staff, class length/capacity/off reach scheduled classes (capacity also reaches booked classes, never below bookings), `get_studio_staff_names` for the teacher picker. Tests CAT-01..12 (fail without the migration).
- Live pages: "Classes and pricing" (classes, packs, memberships) and "Weekly schedule". Prices apply at the next checkout (checkout reads the rows). Booked classes keep their time and teacher when a rule changes.
- Codex P1s fixed: checkout refuses packs and memberships turned off; packs and memberships are fulfilled with the terms shown at checkout (metadata), and a membership's billing and class limit lock once someone has joined (CAT-13, CAT-14). Turning a class off unschedules it; classes people already booked still run and stay bookable.
- Prod after merge: Taylor runs `scripts/db/prod/apply-00042.sql`, then redeploy stripe-checkout and onboarding. Second Codex round: a capacity change applies exactly to booked classes too (people stay booked, the class shows full) and is refused while it would strand a seat being paid for, counted after locking each class, nobody can change an existing membership's billing or class limit (the onboarding pricing step updates only name and price of its starter plan and says where to add a new plan otherwise; it now reports pack and membership save errors), overnight classes keep their length, a capacity raise promotes the waitlist first (CAT-15..19); a length change also reaches booked classes, start unchanged (CAT-20); turning a class off also cancels its unbooked one-off classes (CAT-21) and waits while a seat is being paid for (CAT-22), and an owner moving or removing a weekly class waits the same way (CAT-23). New rules cannot use a closed location (CAT-24). Onboarding records the starter pack and plan it created (backfilled) and validates values and membership terms before any write.

## 2026-10-10: LP-5 live on prod, LP-9 policies
- #96 merged. 00042 applied to prod by Taylor (SQL editor, prefilled by Claude in the Browser pane). Verified read-only: 8 owner/admin write policies, starter_* columns on studio_onboarding (backfilled for the test studio), 6 functions and 4 triggers, `get_studio_staff_names` not callable by anon, fulfillment reads checkout terms. Redeployed `stripe-checkout` v6 and `onboarding` v7 (both 401 without auth).
- Captcha (Turnstile) is on in Supabase Auth; a password sign-in without a token returns `captcha_failed`.
- LP-9: Terms, Privacy and Refund Policy pages (operator Purafield Studio, contact hello@purafieldstudio.com, Texas law). Sign-up linked to /terms and /waiver, neither of which existed; it now links Terms and Privacy. Checkout entry points show what the buyer agrees to. The app footer no longer says "Oxatl Yoga" outside the demo.
- Refund defaults Taylor should confirm: 2-hour cancellation window unless the studio sets one; unused packs refundable within 14 days; no partial membership refunds.


## 2026-10-18: teacher schedule and attendance (local implementation)
- Baseline reconciled to remote main 7353a2a; obsolete launch-v1 checkout left untouched. Member cancellation failure/retry regression committed locally (82c613e).
- /teach and /teach/schedule now use assigned classes and roster RPCs for live sessions; demo retains existing sample screens. Live unsupported teacher routes show an explicit unavailable page, and no fake studio name, qualification or notification count is shown.
- Scope follows ROLE_ACCESS_CONTROL teacher own-schedule/own-roster/own-check-in and PRD-001 two-week default; earnings/substitution remain deferred. New DataProvider methods: getMyTeachingClasses, getTeachingRoster, checkInTeachingBooking. Narrow 00044 read RPCs require current assignment plus active teacher/owner/admin staff in the same studio. Roster returns only booking ID, display name and status. The check-in wrapper locks the class before assignment validation, then delegates to existing check_in_booking for status, cancellation and time-window enforcement. Existing general staff check-in permissions are unchanged.
- UI records attendance only after matching booking ID and checked_in response, prevents concurrent clicks, disables roster dismissal during writes, refreshes after ambiguous failures and offers explicit roster refresh. Waitlisted people cannot be checked in from the portal; attendance undo, substitution, payroll and bulk attendance are outside this slice.
- Added browser coverage for failed/successful check-in, duplicate clicks, persisted roster refresh, lost response recovery, schedule/roster errors, direct navigation to unavailable features and student route denial without teacher RPC requests.
- Added SQL TEACH-01..15 (assignment, same/cross-studio denial, disabled/unexpected roles, anon denial, time window, duplicate attendance, cancelled class). Included in test runner. **SQL tests NOT EXECUTED locally:** no PostgreSQL server installed/running. Migration00044 NOT APPLIED to any hosted database. Deployment is blocked on a clean database test run and explicit deployment authorization; mocks do not prove production RLS/function execution.
- Validation: TypeScript passed; 526 application tests and 32 script tests passed; final full browser suite 23/23 passed with 2 workers, including 390×844 mobile attendance and desktop recovery/sign-out. Earlier 5-worker run had one existing owner cancellation follow-up failure; focused 12/12 and final 23/23 reruns passed without modifying that flow. Production build/postbuild passed through E2E setup. Sign-out now waits for the backend and reports failures rather than navigating on an unconfirmed logout.

## 2026-10-18: upstream and hosted reconciliation (read-only)
- Fetched upstream: main still7353a2a; no open PRs. Local82c613e and209778a remain unpushed. GitHub's Vercel status is success for deployment HrDS9DXSLc6xvqZfgxUhi7s1jaW8. Public /teach serves HTTP200 SPA shell (main--tUT3jD_.js); authenticated teacher behavior cannot be inferred from that shell.
- Supabase CLI function inventory for tandava-prod returned403 (connected account lacks privileges). No source download, secret access or production query followed. Vercel connector403 and scoped CLI inspect could not resolve the deployment; GitHub/public HTTP evidence is available, direct deployment metadata remains unavailable.
- Latest Stripe smoke39131170968 (Oct18) still fails: Missing SUPABASE_SERVICE_ROLE_KEY. No dispatch or credentials configured.
- Prepared TEACHER_ROLLOUT.md, exact transactional apply-00044.sql bundle, and read-only verify-00043-00044.sql. Migration00043/function deployment status remains unverified;00044 is local only. Full SQL validation and explicit rollout approval remain required.

## 2026-10-18: database and PR validation completed
- PostgreSQL16 installed after explicit approval. Fresh isolated Tandava cluster applied every migration through00044 and completed the full SQL suite:251 PASS lines, including TEACH-01..15, payment/refund/idempotency tests, attribution39 blocks, last-seat and last-credit races. Temporary socket-only server stopped and data removed.
- Initial combined cross-app runner produced a false PAY-01 failure: TeacherTree's test creates cluster-global service_role without BYPASSRLS; Tandava's stub preserved it on duplicate-object. Separate fresh clusters per app restore the intended test environment without changing role permissions. No production/payment-code defect was found, and the temporary diagnostic change was reverted.
- PR100 CI run39176946297 passed all four jobs: migrations+SQL, Edge Functions typecheck, browser E2E, and web typecheck/lint/test/build. Local and CI database gates are now complete; prior notes that SQL was unexecuted describe earlier state. No hosted migration or deployment has been performed.


## 2026-10-19: cancellation and assigned-teacher release deployed

- PR100 merged at `d694b2ba65040a313fbeea5811c8fa7a25c90dbf` (2026-10-19 01:56:18 UTC). All premerge CI checks green at `0245c75a1fc4d88013503a3180d68936c17cb22e`; no review comments returned. CI run39177214808 includes app/build, database, edge and browser checks. Local evidence:526 app,32 script,23 browser tests and251 SQL PASS assertions.
- Verified owner browser identity: `purafieldstudio@gmail.com`, Purafield Studio FREE organization `nopyuyyzzvffhxlamsch`, project `tandava-prod` / `mkaixgjwakfufmmwembn`. Personal Mac Supabase CLI is the wrong account; use the authorized owner session.
- Applied exact reviewed 00043 and00044 bundles together in one transaction. Dashboard reported success. Receipt: https://supabase.com/dashboard/project/mkaixgjwakfufmmwembn/sql/0fde39c9-f9f5-4308-81cf-a1025333d623 . Postcheck: both new tables RLS=true with one policy each; all8 expected RPCs present with pinned search_path, anon execute=false. Reconciliation remains service-only (authenticated=false); intended caller RPCs authenticated=true.
- Deployed bundled `cancel-class` with JWT verification ON and `stripe-webhook` with existing JWT OFF/signature verification preserved. Retrieved editor contents after navigation/reload exactly matched deployed bundles. Anonymous empty request: cancel-class401 missing authorization; unsigned webhook400 missing stripe-signature. No cancellation, refund, payment or email invocation used for verification.
- GitHub Production deployment7163945179 reports success for the merge SHA: https://tandava-kc9hm1dx2-tayloroneal-1467s-projects.vercel.app . https://tandavastudio.com landing rendered; unauthenticated /teach redirected to /auth/login. Real signed-in role journeys were not exercised in this release.
- Stripe event additions are **pending owner Stripe login**, not an access denial. Supabase login does not authenticate Stripe. Verify Purafield Studio sandbox `acct_1UNlJxL4WU0kwuiF` visibly, then add refund.updated/refund.failed/charge.refund.updated to the existing Your-account destination only; preserve other subscriptions and Connect endpoint. No live-mode changes authorized or made.
- Rollback: preserve new queue tables/records and revert affected frontend/functions as needed. 00043 replaces fulfillment/waitlist functions, so it is not entirely additive. Reverting code does not undo later real cancellations/refunds.
- Canonical launch plan remains PRD-launch-v1 + BACKLOG + this log. STORE-APPS already defines member `com.tandava.app` and Studio `com.tandava.studio`; hosted-v1 native exclusion means a later release, not cancellation of that plan. Store-ready native builds/screenshots/walkthroughs are not yet demonstrated.


### October20 Bali submission target: native candidate inventory

Taylor authorized pursuing both passing store submissions by October20 Bali, including fixes/testing/capture preparation. Targeted existing-credential Apple API GETs on October19: `/v1/apps?filter[bundleId]=com.tandava.app` and `com.tandava.studio` both returned empty data; corresponding `/v1/bundleIds` queries returned registered resources WJF8DWPMZW/Q29237U4L4. No app/version/build IDs exist in this account for those two bundles. Local primary and two alternate Tandava checkouts lack ios/android/Capacitor configs. No credentials printed/changed; no native builds, store writes, submissions or paid calls performed. Updated existing STORE-APPS critical path and backlog deadline; do not infer candidate availability from unrelated cross-app historical build counts.

### 2026-10-19 — Two native app source foundations and privacy remediation (local)

Generated distinct Capacitor iOS projects for the already-decided member and Studio
apps; native email-only auth, role entry, sharing and offline status added. Query
caches now clear across auth identity transitions, stale profile results are
rejected, and Sentry replay/email identification are removed. Native ambiguous
checkout is blocked pending catalog/payment review. Deletion initiation added
behind a default-off flag with a local-only migration and operational runbook.
Focused tests: 11 native-routing/cache/deletion unit cases passed; deletion agent's
full disposable PostgreSQL suite passed including nine authorization/retention
cases. No signed archive, device acceptance, ASC candidate, or deployed deletion
is claimed. See `docs/app-store/STORE-APPS.md` for the updated release gates.

Configured unsigned member and Studio iOS simulator compilations subsequently
passed at source `12c9e538`; exact artifact hashes and detailed test scope are in
`docs/app-store/STORE-APPS.md`. User-approved Xcode component installation briefly
restored simulator discovery/boot, but installation/launch failed with a missing
CoreSimulatorUtilities library; install outcome is uncertain and launch not
verified. No role/device acceptance, submission or production deletion is claimed.
