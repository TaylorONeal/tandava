# Migration 00052 (scan check-in) on tandava-prod: runbook

Project: **tandava-prod**, org **Purafield Studio**, id `mkaixgjwakfufmmwembn`.
SQL editor: https://supabase.com/dashboard/project/mkaixgjwakfufmmwembn/sql/new

## State on Nov 7, 2026, 23:20 CST: already applied. Nothing to run.

Checked read-only through the Supabase Tandava connector:

| Check | Result |
|---|---|
| `scripts/db/prod/verify-00052.sql` | `scan_fn` true, `staff_can_scan` true, `anon_can_scan` false, `m50_applied` true |
| Function body on prod vs `supabase/migrations/00052_scan_check_in.sql` | Identical: both 2192 chars, md5 `84b2510ec776936c292c428dfffe14aa` |
| Security | `SECURITY DEFINER`, `search_path=public, pg_temp` |
| Review studio | "Juniper Review Studio (synthetic)" present, unlisted, page not live, 37 future classes, last ends Nov 27, 2026 19:14 UTC |

So the Studio 1.0 backend is ready. 00047 to 00051 are on prod too (`STUDIO-PHASE-1.md` says 00050 and 00051 were held; that line is stale, the listing doc's Nov 8 note is right).

## If it ever has to be applied again (new project, restore)

1. Verify first (read-only). Paste `scripts/db/prod/verify-00052.sql`. Expect `scan_fn` false before apply.
2. Apply: paste all of `scripts/db/prod/apply-00052.sql` and click Run. It is one transaction; it stops if 00044 is missing or 00052 is already there.
3. Verify again. Expect `true, true, false` for the first three columns.
4. Local proof before any prod run: `npm run test:db` (SCAN-01 to SCAN-13 in `supabase/tests/029_scan_check_in.test.sql`).

## Rollback (only if scanning must be turned off on the server)

00052 adds one function and nothing else (no table, column or constraint). Rolling back removes scanning; the roster check-in keeps working.

```sql
BEGIN;
DROP FUNCTION IF EXISTS public.check_in_with_pass(TEXT);
COMMIT;
-- Check: expect false
select exists (select 1 from pg_proc where proname = 'check_in_with_pass');
```

Check-ins already recorded with method `qr_scan` stay; they are ordinary attendance rows.
Agents never run this on prod: Taylor runs it in the SQL editor after saying so in chat.
