\i helpers.sql
-- My bookings (MYB-*), 00039: a student sees only their own bookings, with names.

INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status) VALUES
  (pg_temp.id('studio_a'), pg_temp.id('occ_a_open'), pg_temp.id('student_a1'), 'confirmed'),
  (pg_temp.id('studio_a'), 'aaaaaaaa-3000-0000-0000-000000000004', pg_temp.id('student_a1'), 'checked_in'),
  (pg_temp.id('studio_b'), pg_temp.id('occ_b_open'), pg_temp.id('student_b1'), 'confirmed');

DO $$
DECLARE n int; others int; named int; past int;
BEGIN
  -- MYB-01: a student gets their own bookings, upcoming and past.
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  SELECT count(*), count(*) FILTER (WHERE offering_name IS NOT NULL AND studio_name IS NOT NULL),
         count(*) FILTER (WHERE starts_at < NOW())
    INTO n, named, past FROM get_my_bookings();
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 2 AND named = 2 AND past = 1, 'MYB-01', 'student sees own 2 bookings with class and studio names');

  -- MYB-02: never another student's bookings.
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  SELECT count(*) INTO others FROM get_my_bookings() WHERE studio_slug = 'studio-b';
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(others = 0, 'MYB-02', 'no bookings of other students');

  -- MYB-03: anon cannot call it.
  BEGIN
    PERFORM pg_temp.as_anon();
    PERFORM count(*) FROM get_my_bookings();
    EXECUTE 'RESET ROLE';
    PERFORM pg_temp.ok(false, 'MYB-03', 'anon must not execute get_my_bookings');
  EXCEPTION WHEN insufficient_privilege THEN
    EXECUTE 'RESET ROLE';
    PERFORM pg_temp.ok(true, 'MYB-03', 'anon cannot execute get_my_bookings');
  END;
END $$;
