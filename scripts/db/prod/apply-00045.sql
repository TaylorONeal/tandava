-- Production rollout bundle for migration 00045: explicit Data API grants.
-- Target: tandava-prod mkaixgjwakfufmmwembn. Requires existing schema through 00044.
-- Paste all of it into https://supabase.com/dashboard/project/mkaixgjwakfufmmwembn/sql/new and Run.
-- Safe on production: the table/sequence grants re-state what Supabase's old
-- auto-grant default already gave every existing table (no-op there), and the
-- ALTER DEFAULT PRIVILEGES lines only affect tables created in the future.
-- Idempotent: running it twice changes nothing. RLS policies are untouched.
BEGIN;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public
  TO anon, authenticated, service_role;

GRANT USAGE, SELECT, UPDATE
  ON ALL SEQUENCES IN SCHEMA public
  TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES
  TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES
  TO anon, authenticated, service_role;

COMMIT;
