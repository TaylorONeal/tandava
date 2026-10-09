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

## 2026-10-09 (later): attribution phase 1 (#72) live in the database
- 00035 applied to prod by Taylor (SQL editor, bundle `scripts/db/prod/apply-00035.sql`, sha 654754f0ed69). Verified read-only: checkout, renewal, claim and opt-in functions present, `automation_settings` present, `bookings.confirmed_at` present, `analytics_sessions.profile_id` FK is ON DELETE SET NULL, 0 RLS tables without a policy, anon cannot write conversions. 00036 and 00037 also on prod.
- Edge functions deployed from the #72 branch via Supabase MCP, each bundled to one file with esbuild (`npx esbuild supabase/functions/<fn>/index.ts --bundle --format=esm --platform=neutral --external:'https://*'`): stripe-webhook v5, stripe-checkout v5, express-book v3, analytics-session v1 (new), unsubscribe v1 (new), run-automations v1 (new). verify_jwt off for all but stripe-checkout. Smoke-tested: webhook 400 without signature, checkout 401 "Not authenticated", express-book 404 for an unknown studio, analytics-session `{sessionId:null}` for an unknown studio, unsubscribe 400 invalid_link, run-automations 403 without the cron secret.
- Codex review loop closed: 4aadad7 "Didn't find any major issues". Deferred: W7-7..W7-11 (W7-10 needs a migration).
- Still open, in order:
  1. Taylor: merge #72 (https://github.com/TaylorONeal/tandava/pull/72). Merging deploys the frontend to tandavastudio.com.
  2. Taylor: `ANALYTICS_IP_SALT` (and `EXPRESS_IP_SALT`) at https://supabase.com/dashboard/project/mkaixgjwakfufmmwembn/functions/secrets, any long random value each.
  3. Automations stay in dry run until `AUTOMATIONS_CRON_SECRET`, `AUTOMATIONS_UNSUBSCRIBE_SECRET`, `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` and then `AUTOMATIONS_ENABLED=true` are set, plus the hourly cron call (docs/OPERATOR_SETUP.md).
