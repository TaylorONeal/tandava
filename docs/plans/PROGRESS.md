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
