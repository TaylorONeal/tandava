-- Shared helpers for the SQL tests. Loaded with \i at the top of each file.
-- Plain SQL + PL/pgSQL (no pgTAP) so it runs on any Postgres.
--
-- Pattern inside a DO block:
--   PERFORM pg_temp.as_user('<uuid>');   -- act as that signed-in user
--   ... run queries as that user ...
--   EXECUTE 'RESET ROLE';                -- back to the test runner (superuser)
--   PERFORM pg_temp.ok(cond, 'ID', 'what was checked');

CREATE OR REPLACE FUNCTION pg_temp.as_user(u uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', u::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  EXECUTE 'SET LOCAL ROLE authenticated';
END $$;

CREATE OR REPLACE FUNCTION pg_temp.as_anon() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claim.role', 'anon', true);
  EXECUTE 'SET LOCAL ROLE anon';
END $$;

CREATE OR REPLACE FUNCTION pg_temp.ok(cond boolean, id text, msg text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF cond IS TRUE THEN
    RAISE NOTICE 'PASS %  %', id, msg;
  ELSE
    RAISE EXCEPTION 'FAIL %  %', id, msg;
  END IF;
END $$;

-- Fixed ids from fixtures.sql
CREATE OR REPLACE FUNCTION pg_temp.id(name text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE name
    WHEN 'staff_a'   THEN 'a0000000-0000-0000-0000-00000000000a'
    WHEN 'staff_b'   THEN 'b0000000-0000-0000-0000-00000000000b'
    WHEN 'student_a1' THEN 'a1000000-0000-0000-0000-0000000000a1'
    WHEN 'student_a2' THEN 'a2000000-0000-0000-0000-0000000000a2'
    WHEN 'student_b1' THEN 'b1000000-0000-0000-0000-0000000000b1'
    WHEN 'studio_a'  THEN 'aaaaaaaa-0000-0000-0000-000000000001'
    WHEN 'studio_b'  THEN 'bbbbbbbb-0000-0000-0000-000000000002'
    WHEN 'studio_c'  THEN 'cccccccc-0000-0000-0000-000000000003'
    WHEN 'occ_a_open' THEN 'aaaaaaaa-3000-0000-0000-000000000001'
    WHEN 'occ_a_cancelled' THEN 'aaaaaaaa-3000-0000-0000-000000000003'
    WHEN 'occ_b_open' THEN 'bbbbbbbb-3000-0000-0000-000000000001'
    WHEN 'pack_a1'   THEN 'aaaaaaaa-5000-0000-0000-0000000000a1'
    WHEN 'pack_a2'   THEN 'aaaaaaaa-5000-0000-0000-0000000000a2'
    WHEN 'pack_b1'   THEN 'bbbbbbbb-5000-0000-0000-0000000000b1'
  END::uuid
$$;
