\i helpers.sql
-- Function hardening (HARD-*), 00041.

DO $$
DECLARE n int;
BEGIN
  -- HARD-01: no public SECURITY DEFINER function or listed trigger helper has a mutable search_path.
  SELECT count(*) INTO n
    FROM pg_proc p
   WHERE p.pronamespace = 'public'::regnamespace
     AND (p.prosecdef OR p.proname IN ('update_updated_at', 'update_booking_counts', 'bookings_entitlement_sync'))
     AND NOT EXISTS (SELECT 1 FROM unnest(COALESCE(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%');
  PERFORM pg_temp.ok(n = 0, 'HARD-01', 'every SECURITY DEFINER function pins search_path (' || n || ' left)');

  -- HARD-02: SECURITY DEFINER trigger functions are not executable by anon or authenticated.
  SELECT count(*) INTO n
    FROM pg_proc p
   WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef AND p.prorettype = 'trigger'::regtype
     AND (has_function_privilege('anon', p.oid, 'EXECUTE') OR has_function_privilege('authenticated', p.oid, 'EXECUTE'));
  PERFORM pg_temp.ok(n = 0, 'HARD-02', 'definer trigger functions are not callable over the API');

  -- HARD-04: the check-in code generator still works with its pinned path.
  PERFORM pg_temp.ok(length(generate_check_in_code(pg_temp.id('student_a1'), pg_temp.id('studio_a'))) > 0, 'HARD-04', 'generate_check_in_code still finds pgcrypto after pinning');

  -- HARD-03: anon cannot call book_free_class; signed-in users can.
  PERFORM pg_temp.ok(NOT has_function_privilege('anon', 'book_free_class(uuid)', 'EXECUTE')
                     AND has_function_privilege('authenticated', 'book_free_class(uuid)', 'EXECUTE'),
                     'HARD-03', 'book_free_class is signed-in only');
END $$;
