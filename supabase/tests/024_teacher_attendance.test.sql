\i helpers.sql
UPDATE studio_staff SET role = 'teacher' WHERE profile_id = pg_temp.id('staff_a');
UPDATE class_occurrences SET teacher_id = pg_temp.id('staff_a') WHERE id IN (pg_temp.id('occ_a_open'), pg_temp.id('occ_a_cancelled'));
UPDATE class_occurrences SET starts_at = NOW() + interval '10 minutes', ends_at = NOW() + interval '70 minutes' WHERE id = pg_temp.id('occ_a_open');
INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status) VALUES
 (pg_temp.id('studio_a'), pg_temp.id('occ_a_open'), pg_temp.id('student_a1'), 'confirmed'),
 (pg_temp.id('studio_a'), pg_temp.id('occ_a_cancelled'), pg_temp.id('student_a2'), 'confirmed'),
 (pg_temp.id('studio_b'), pg_temp.id('occ_b_open'), pg_temp.id('student_b1'), 'confirmed');

DO $$
DECLARE n int; msg text; bk uuid; other_bk uuid; cancelled_bk uuid; result bookings;
BEGIN
 SELECT id INTO bk FROM bookings WHERE class_occurrence_id = pg_temp.id('occ_a_open');
 SELECT id INTO other_bk FROM bookings WHERE class_occurrence_id = pg_temp.id('occ_b_open');
 SELECT id INTO cancelled_bk FROM bookings WHERE class_occurrence_id = pg_temp.id('occ_a_cancelled');
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 SELECT count(*) INTO n FROM get_my_teaching_classes();
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(n = 2, 'TEACH-01', 'assigned active teacher sees only own two classes');
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 SELECT count(*) INTO n FROM get_teaching_roster(pg_temp.id('occ_a_open'));
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(n = 1, 'TEACH-02', 'assigned teacher sees roster');
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 SELECT count(*) INTO n FROM get_teaching_roster(pg_temp.id('occ_b_open'));
 msg := NULL;
 BEGIN PERFORM check_in_teaching_booking(other_bk); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(n = 0 AND msg LIKE 'Not authorized%', 'TEACH-03', 'cross-studio roster and check-in denied');

 INSERT INTO studio_staff (studio_id, profile_id, role) VALUES (pg_temp.id('studio_a'), pg_temp.id('staff_b'), 'teacher');
 PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
 SELECT count(*) INTO n FROM get_teaching_roster(pg_temp.id('occ_a_open'));
 msg := NULL;
 BEGIN PERFORM check_in_teaching_booking(bk); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(n = 0 AND msg LIKE 'Not authorized%', 'TEACH-14', 'other active teacher in same studio cannot read roster or check in');
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 msg := NULL;
 BEGIN PERFORM check_in_teaching_booking(cancelled_bk); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(msg = 'Class is cancelled', 'TEACH-15', 'cancelled class cannot accept attendance');

 PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
 SELECT count(*) INTO n FROM get_my_teaching_classes();
 SELECT n + count(*) INTO n FROM get_teaching_roster(pg_temp.id('occ_a_open'));
 msg := NULL;
 BEGIN PERFORM check_in_teaching_booking(bk); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(n = 0 AND msg LIKE 'Not authorized%', 'TEACH-04', 'student cannot read teacher data or check in');

 UPDATE studio_staff SET is_active = false WHERE profile_id = pg_temp.id('staff_a');
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 SELECT count(*) INTO n FROM get_my_teaching_classes();
 SELECT n + count(*) INTO n FROM get_teaching_roster(pg_temp.id('occ_a_open'));
 msg := NULL;
 BEGIN PERFORM check_in_teaching_booking(bk); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(n = 0 AND msg LIKE 'Not authorized%', 'TEACH-05', 'disabled staff cannot read or mutate');
 UPDATE studio_staff SET is_active = true, role = 'front_desk' WHERE profile_id = pg_temp.id('staff_a');
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 SELECT count(*) INTO n FROM get_my_teaching_classes();
 SELECT n + count(*) INTO n FROM get_teaching_roster(pg_temp.id('occ_a_open'));
 msg := NULL;
 BEGIN PERFORM check_in_teaching_booking(bk); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(n = 0 AND msg LIKE 'Not authorized%', 'TEACH-06', 'unexpected staff role denied despite assignment');
 UPDATE studio_staff SET role = 'teacher' WHERE profile_id = pg_temp.id('staff_a');

 UPDATE class_occurrences SET teacher_id = NULL WHERE id = pg_temp.id('occ_a_open');
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 SELECT count(*) INTO n FROM get_teaching_roster(pg_temp.id('occ_a_open'));
 msg := NULL;
 BEGIN PERFORM check_in_teaching_booking(bk); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(n = 0 AND msg LIKE 'Not authorized%', 'TEACH-07', 'removed assignment loses access');
 UPDATE class_occurrences SET teacher_id = pg_temp.id('staff_a'), starts_at = NOW() + interval '2 days', ends_at = NOW() + interval '2 days 1 hour' WHERE id = pg_temp.id('occ_a_open');
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 msg := NULL;
 BEGIN PERFORM check_in_teaching_booking(bk); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(msg LIKE 'Check-in is open%', 'TEACH-08', 'existing check-in window enforced');
 UPDATE class_occurrences SET starts_at = NOW() + interval '10 minutes', ends_at = NOW() + interval '70 minutes' WHERE id = pg_temp.id('occ_a_open');
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 result := check_in_teaching_booking(bk);
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(result.status = 'checked_in' AND result.checked_in_by = pg_temp.id('staff_a'), 'TEACH-09', 'attendance records authenticated teacher');
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 msg := NULL;
 BEGIN PERFORM check_in_teaching_booking(bk); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(msg LIKE 'Only confirmed%', 'TEACH-10', 'duplicate check-in does not change attendance');

 BEGIN
   PERFORM pg_temp.as_anon(); PERFORM get_my_teaching_classes();
   EXECUTE 'RESET ROLE'; PERFORM pg_temp.ok(false, 'TEACH-11', 'anon schedule denied');
 EXCEPTION WHEN insufficient_privilege THEN EXECUTE 'RESET ROLE'; PERFORM pg_temp.ok(true, 'TEACH-11', 'anon schedule denied'); END;
 BEGIN
   PERFORM pg_temp.as_anon(); PERFORM get_teaching_roster(pg_temp.id('occ_a_open'));
   EXECUTE 'RESET ROLE'; PERFORM pg_temp.ok(false, 'TEACH-12', 'anon roster denied');
 EXCEPTION WHEN insufficient_privilege THEN EXECUTE 'RESET ROLE'; PERFORM pg_temp.ok(true, 'TEACH-12', 'anon roster denied'); END;
 BEGIN
   PERFORM pg_temp.as_anon(); PERFORM check_in_teaching_booking(bk);
   EXECUTE 'RESET ROLE'; PERFORM pg_temp.ok(false, 'TEACH-13', 'anon check-in denied');
 EXCEPTION WHEN insufficient_privilege THEN EXECUTE 'RESET ROLE'; PERFORM pg_temp.ok(true, 'TEACH-13', 'anon check-in denied'); END;
END $$;
