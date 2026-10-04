# Launch v1 progress and continuation

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

## Not done (next, in order)
1. Storefront: honor `?class=`, let a guest pick a class and sign up after selection (E2E-01)
2. `/for-studios` page; move open-source pitch under `/open-source` copy
3. Policies for 26 tables with RLS on and no policy (client sees nothing)
4. Playwright E2E (decision: add `@playwright/test` devDependency?)
5. Verify embed header rule on a real Vercel preview
6. Studio onboarding under 30 minutes; pilot with up to 3 studios

## Run it
```
npm run typecheck && npm test && npm run build
supabase start && supabase db reset && ./supabase/tests/run.sh   # never against production
```

## Flags for review
- Edited already-applied migrations 00005, 00008, 00009 (CLAUDE.md says new files for schema changes). Needed for clean-DB apply; production already applied the old text, so confirm no drift.
- 00008 policies now allow any active staff, not only owner/admin. Check least privilege.
- Flip `VITE_HOME_MODE=discover` only after ~5 discoverable studios (`DISCOVER_HOME_MIN_STUDIOS`).
