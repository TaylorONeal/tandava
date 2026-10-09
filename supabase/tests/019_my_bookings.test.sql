\i helpers.sql
-- My bookings (MYB-*), 00039: a student sees only their own bookings, with names.

INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status) VALUES
  (pg_temp.id('studio_a'), pg_temp.id('occ_a_open'), pg_temp.id('student_a1'), 'confirmed'),
  (pg_temp.id('studio_a'), 'aaaaaaaa-3000-0000-0000-000000000004', pg_temp.id('student_a1'), 'checked_in'),
  (pg_temp.id('studio_a'), 'aaaaaaaa-3000-0000-0000-000000000002', pg_temp.id('student_a1'), 'confirmed'),
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
  PERFORM pg_temp.ok(n = 3 AND named = 3 AND past = 1, 'MYB-01', 'student sees own 3 bookings with class and studio names');

  -- MYB-04: upcoming comes first, soonest first (the limit keeps the nearest class).
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  SELECT count(*) INTO n FROM get_my_bookings(1) x WHERE x.occurrence_id = pg_temp.id('occ_a_open');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 1, 'MYB-04', 'limit 1 returns the soonest upcoming class');

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

-- My entitlements (ENT-*), 00040: own memberships and packs only.
INSERT INTO membership_types (id, studio_id, name, price_cents, billing_cycle)
  VALUES ('aaaaaaaa-6000-0000-0000-000000000001', pg_temp.id('studio_a'), 'Unlimited A', 9900, 'monthly');
INSERT INTO memberships (studio_id, profile_id, membership_type_id, status, current_period_start, current_period_end)
  VALUES (pg_temp.id('studio_a'), pg_temp.id('student_a1'), 'aaaaaaaa-6000-0000-0000-000000000001', 'active', NOW(), NOW() + interval '30 days');

DO $$
DECLARE n_m int; n_p int; others int; left_ int;
BEGIN
  -- ENT-01: a student gets their membership and their pack, with names and classes left.
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  SELECT count(*) FILTER (WHERE kind = 'membership' AND name = 'Unlimited A' AND studio_name = 'Studio A'),
         count(*) FILTER (WHERE kind = 'pack' AND name = '5 pack A'),
         max(classes_remaining) FILTER (WHERE kind = 'pack')
    INTO n_m, n_p, left_ FROM get_my_entitlements();
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n_m = 1 AND n_p = 1 AND left_ = 5, 'ENT-01', 'student sees own membership and pack');

  -- ENT-02: never another student's.
  PERFORM pg_temp.as_user(pg_temp.id('student_a2'));
  SELECT count(*) INTO others FROM get_my_entitlements() WHERE kind = 'membership';
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(others = 0, 'ENT-02', 'another student does not see that membership');

  -- ENT-03: anon cannot call it.
  BEGIN
    PERFORM pg_temp.as_anon();
    PERFORM count(*) FROM get_my_entitlements();
    EXECUTE 'RESET ROLE';
    PERFORM pg_temp.ok(false, 'ENT-03', 'anon must not execute get_my_entitlements');
  EXCEPTION WHEN insufficient_privilege THEN
    EXECUTE 'RESET ROLE';
    PERFORM pg_temp.ok(true, 'ENT-03', 'anon cannot execute get_my_entitlements');
  END;

  -- PROF-01: a student can update their own profile and nobody else's.
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  UPDATE profiles SET phone = '555-0100' WHERE id = pg_temp.id('student_a1');
  GET DIAGNOSTICS n_m = ROW_COUNT;
  UPDATE profiles SET phone = '555-0199' WHERE id = pg_temp.id('student_a2');
  GET DIAGNOSTICS n_p = ROW_COUNT;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n_m = 1 AND n_p = 0, 'PROF-01', 'student edits own profile only');
END $$;
