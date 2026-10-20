-- 00045: Explicit Data API grants (Supabase breaking change, 30 Oct 2026).
--
-- Supabase is removing the automatic exposure of new tables in the `public`
-- schema to the Data API (supabase-js / PostgREST / GraphQL). Until now every
-- table created in `public` silently received SELECT, INSERT, UPDATE and
-- DELETE for the `anon`, `authenticated` and `service_role` roles, and every
-- migration in this repo (00001-00044, 161 tables) relied on that default:
-- there is not a single GRANT ON TABLE in the migration history, only
-- GRANT EXECUTE on functions.
--
-- Timeline (Supabase changelog, "Breaking Change: Tables not exposed to
-- Data and GraphQL API automatically"):
--   * 30 May 2026: the no-auto-grant default starts for NEW projects.
--   * 30 Oct 2026: the setting is applied to ALL EXISTING projects.
--
-- Impact without this migration:
--   * The production project keeps working for existing tables: they keep
--     the grants they already have and are not touched by the change.
--   * A FRESH project built from these migrations (a self-hoster, a new
--     dev/preview environment, a rebuild) gets no Data API access to any
--     table at all: every .from() call in src/lib/backend/supabase.ts and
--     every table access in the edge functions fails with
--     42501 "permission denied for table ...".
--   * Any table created by a future migration on an existing project
--     after 30 Oct 2026 hits the same error until it is granted.
--
-- What this migration does:
--   1. Re-states, explicitly, the exact grants the old default gave every
--      existing table and sequence. On the production project this is a
--      no-op (the grants are already there). On a fresh project it makes
--      the full schema reachable through the Data API again.
--   2. Restores the same behaviour for FUTURE tables created by the
--      `postgres` role (the role migrations and dashboard SQL run as) via
--      ALTER DEFAULT PRIVILEGES, so migration 00046+ does not silently
--      regress. This is a deliberate choice for this codebase, not a
--      weakening: row access was never controlled by grants here.
--
-- Security note: grants are not the access control in Tandava, RLS is.
-- Every table in this schema has RLS enabled and its access defined by
-- policies (see 00028/00029 for the hardening passes). A grant lets a role
-- reach the table; the policies still decide which rows it can see or
-- change, and a role with no policy for an operation still gets nothing.
-- Tables that must stay closed are closed with policies (or an explicit
-- REVOKE, as in 00028), never by omitting the grant.
--
-- RULE FOR NEW TABLES (00046 onwards): still write the grant in the same
-- migration that creates the table, e.g.
--   GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_table
--     TO anon, authenticated, service_role;
--   GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES ... -- if it has one
-- The default-privileges lines below are a safety net for tables created
-- by `postgres`, not a substitute: a table created by another role, or a
-- narrower grant than the default, needs its own explicit statement.

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
