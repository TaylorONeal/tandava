\i helpers.sql
-- check_in_with_pass: Studio app scan-to-check-in (migration 00052).
UPDATE studio_staff SET role = 'teacher' WHERE profile_id = pg_temp.id('staff_a');
UPDATE class_occurrences SET teacher_id = pg_temp.id('staff_a'),
  starts_at = NOW() + interval '10 minutes', ends_at = NOW() + interval '70 minutes'
  WHERE id = pg_temp.id('occ_a_open');
UPDATE class_occurrences SET teacher_id = pg_temp.id('staff_a') WHERE id = pg_temp.id('occ_a_cancelled');
INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status) VALUES
 (pg_temp.id('studio_a'), pg_temp.id('occ_a_open'), pg_temp.id('student_a1'), 'confirmed'),
 (pg_temp.id('studio_a'), pg_temp.id('occ_a_open'), pg_temp.id('student_a2'), 'waitlisted'),
 (pg_temp.id('studio_a'), pg_temp.id('occ_a_cancelled'), pg_temp.id('student_a2'), 'confirmed'),
 (pg_temp.id('studio_b'), pg_temp.id('occ_b_open'), pg_temp.id('student_b1'), 'confirmed');

DO $$
DECLARE r record; msg text; bk uuid; wl uuid; cx uuid; other_bk uuid; st booking_status; method text;
BEGIN
 SELECT id INTO bk FROM bookings WHERE class_occurrence_id = pg_temp.id('occ_a_open') AND status = 'confirmed';
 SELECT id INTO wl FROM bookings WHERE class_occurrence_id = pg_temp.id('occ_a_open') AND status = 'waitlisted';
 SELECT id INTO cx FROM bookings WHERE class_occurrence_id = pg_temp.id('occ_a_cancelled');
 SELECT id INTO other_bk FROM bookings WHERE class_occurrence_id = pg_temp.id('occ_b_open');

 -- Signed out: no access at all.
 PERFORM pg_temp.as_anon();
 msg := NULL;
 BEGIN PERFORM check_in_with_pass('tandava:checkin:v1:' || bk); EXCEPTION WHEN insufficient_privilege THEN msg := 'denied'; END;
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(msg = 'denied', 'SCAN-01', 'anon cannot execute check_in_with_pass');

 -- Garbage and foreign QR codes are rejected without a lookup.
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 SELECT * INTO r FROM check_in_with_pass('https://example.com/' || bk);
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(r.result = 'invalid_pass' AND r.booking_id IS NULL, 'SCAN-02', 'non-Tandava code is invalid_pass');

 -- Cross-studio scan reveals nothing and changes nothing.
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 SELECT * INTO r FROM check_in_with_pass('tandava:checkin:v1:' || other_bk);
 EXECUTE 'RESET ROLE';
 SELECT status INTO st FROM bookings WHERE id = other_bk;
 PERFORM pg_temp.ok(r.result = 'not_found' AND r.student_name IS NULL AND st = 'confirmed', 'SCAN-03', 'other studio booking is not_found and untouched');

 -- A student cannot check anyone in, including themselves.
 PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
 SELECT * INTO r FROM check_in_with_pass('tandava:checkin:v1:' || bk);
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(r.result = 'not_found', 'SCAN-04', 'member scanning own pass is not_found');

 -- Unassigned teacher at the same studio: not_found (teacher rule is assigned classes only).
 INSERT INTO studio_staff (studio_id, profile_id, role) VALUES (pg_temp.id('studio_a'), pg_temp.id('staff_b'), 'teacher');
 PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
 SELECT * INTO r FROM check_in_with_pass('tandava:checkin:v1:' || bk);
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(r.result = 'not_found', 'SCAN-05', 'unassigned teacher cannot scan');

 -- Waitlisted and cancelled-class bookings explain themselves without changing state.
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 SELECT * INTO r FROM check_in_with_pass('tandava:checkin:v1:' || wl);
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(r.result = 'not_confirmed', 'SCAN-06', 'waitlisted booking is not_confirmed');
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 SELECT * INTO r FROM check_in_with_pass('tandava:checkin:v1:' || cx);
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(r.result = 'class_cancelled', 'SCAN-07', 'cancelled class is class_cancelled');

 -- Outside the 60-minute window.
 UPDATE class_occurrences SET starts_at = NOW() + interval '2 days', ends_at = NOW() + interval '2 days 1 hour' WHERE id = pg_temp.id('occ_a_open');
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 SELECT * INTO r FROM check_in_with_pass('tandava:checkin:v1:' || bk);
 EXECUTE 'RESET ROLE';
 SELECT status INTO st FROM bookings WHERE id = bk;
 PERFORM pg_temp.ok(r.result = 'outside_window' AND st = 'confirmed', 'SCAN-08', 'outside window is reported and not recorded');
 UPDATE class_occurrences SET starts_at = NOW() + interval '10 minutes', ends_at = NOW() + interval '70 minutes' WHERE id = pg_temp.id('occ_a_open');

 -- Assigned teacher checks in with an upper-case pass; method is qr_scan.
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 SELECT * INTO r FROM check_in_with_pass(upper('tandava:checkin:v1:') || upper(bk::text));
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(r.result = 'invalid_pass', 'SCAN-09', 'prefix is case sensitive');
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 SELECT * INTO r FROM check_in_with_pass('tandava:checkin:v1:' || upper(bk::text));
 EXECUTE 'RESET ROLE';
 SELECT status, check_in_method INTO st, method FROM bookings WHERE id = bk;
 PERFORM pg_temp.ok(r.result = 'checked_in' AND r.booking_id = bk AND r.student_name IS NOT NULL
   AND st = 'checked_in' AND method = 'qr_scan', 'SCAN-10', 'assigned teacher scan records qr_scan attendance');

 -- Second scan is friendly, not an error.
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 SELECT * INTO r FROM check_in_with_pass('tandava:checkin:v1:' || bk);
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(r.result = 'already_checked_in', 'SCAN-11', 'repeat scan is already_checked_in');

 -- Front desk may scan any class at the studio, but not when inactive.
 UPDATE bookings SET status = 'confirmed', checked_in_at = NULL, checked_in_by = NULL, check_in_method = NULL WHERE id = bk;
 UPDATE studio_staff SET role = 'front_desk' WHERE profile_id = pg_temp.id('staff_b') AND studio_id = pg_temp.id('studio_a');
 UPDATE studio_staff SET is_active = false WHERE profile_id = pg_temp.id('staff_b') AND studio_id = pg_temp.id('studio_a');
 PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
 SELECT * INTO r FROM check_in_with_pass('tandava:checkin:v1:' || bk);
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.ok(r.result = 'not_found', 'SCAN-12', 'inactive front desk cannot scan');
 UPDATE studio_staff SET is_active = true WHERE profile_id = pg_temp.id('staff_b') AND studio_id = pg_temp.id('studio_a');
 PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
 SELECT * INTO r FROM check_in_with_pass('tandava:checkin:v1:' || bk);
 EXECUTE 'RESET ROLE';
 SELECT status INTO st FROM bookings WHERE id = bk;
 PERFORM pg_temp.ok(r.result = 'checked_in' AND st = 'checked_in', 'SCAN-13', 'active front desk scan records attendance');
END $$;
