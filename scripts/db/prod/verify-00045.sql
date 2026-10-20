-- Read-only verification for migration 00045 (Data API grants).
-- Run against tandava-prod after apply-00045.sql. Changes nothing.

-- 1. Tables in public that each API role still cannot SELECT.
--    All three counts should be 0 after apply-00045.sql.
SELECT 'anon' AS role_name, count(*) AS tables_missing_select
FROM information_schema.tables t
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants g
    WHERE g.table_schema = 'public' AND g.table_name = t.table_name
      AND g.grantee = 'anon' AND g.privilege_type = 'SELECT')
UNION ALL
SELECT 'authenticated', count(*)
FROM information_schema.tables t
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants g
    WHERE g.table_schema = 'public' AND g.table_name = t.table_name
      AND g.grantee = 'authenticated' AND g.privilege_type = 'SELECT')
UNION ALL
SELECT 'service_role', count(*)
FROM information_schema.tables t
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants g
    WHERE g.table_schema = 'public' AND g.table_name = t.table_name
      AND g.grantee = 'service_role' AND g.privilege_type = 'SELECT');

-- 2. Default privileges for future objects in public.
--    Expect rows for object types 'r' (tables) and 'S' (sequences)
--    naming anon, authenticated and service_role.
SELECT defaclobjtype AS object_type, defaclacl::text AS acl
FROM pg_default_acl
WHERE defaclnamespace = 'public'::regnamespace;

-- 3. Spot checks on core tables. All should return true.
SELECT
  has_table_privilege('anon', 'public.studios', 'SELECT') AS anon_studios_select,
  has_table_privilege('authenticated', 'public.bookings', 'INSERT') AS authenticated_bookings_insert,
  has_table_privilege('service_role', 'public.profiles', 'UPDATE') AS service_role_profiles_update;
