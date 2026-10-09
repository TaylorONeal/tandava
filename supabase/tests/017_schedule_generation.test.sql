\i helpers.sql
-- Schedule generation (GEN-*): a saved weekly rule becomes bookable classes
-- (00036). Rules are written as the test runner, like the onboarding edge
-- function does with the service role.

DO $$
DECLARE
  n int; m int; v_rule uuid := 'aaaaaaaa-4000-0000-0000-000000000001';
  v_first timestamptz; v_local time; v_booked uuid; ok boolean;
BEGIN
  -- GEN-01: inserting a weekly rule creates the next 8 weeks of classes.
  INSERT INTO schedule_rules (id, studio_id, offering_id, location_id, recurrence, day_of_week, start_time, end_time, room, effective_from)
  VALUES (v_rule, pg_temp.id('studio_a'), 'aaaaaaaa-2000-0000-0000-000000000001', 'aaaaaaaa-1000-0000-0000-000000000001',
          'weekly', 'saturday', '10:00', '11:00', 'Main', CURRENT_DATE);
  SELECT count(*), min(starts_at) INTO n, v_first FROM class_occurrences WHERE schedule_rule_id = v_rule;
  PERFORM pg_temp.ok(n BETWEEN 8 AND 9, 'GEN-01', 'weekly rule creates 8 weeks of classes (got ' || n || ')');

  -- GEN-02: classes start at 10:00 studio time on a Saturday, with the offering capacity.
  v_local := (v_first AT TIME ZONE 'America/Chicago')::time;
  PERFORM pg_temp.ok(v_local = '10:00' AND EXTRACT(ISODOW FROM v_first AT TIME ZONE 'America/Chicago') = 6
                     AND (SELECT capacity FROM class_occurrences WHERE schedule_rule_id = v_rule AND starts_at = v_first) = 1,
                     'GEN-02', 'wall-clock time, weekday and capacity are right');

  -- GEN-03: running the top-up again creates nothing new.
  PERFORM generate_class_occurrences(pg_temp.id('studio_a'), 8);
  SELECT count(*) INTO m FROM class_occurrences WHERE schedule_rule_id = v_rule;
  PERFORM pg_temp.ok(m = n, 'GEN-03', 'generation is idempotent');

  -- GEN-04: an owner of another studio cannot run it for studio A; a student cannot either.
  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  BEGIN
    PERFORM generate_class_occurrences(pg_temp.id('studio_a'), 8);
    ok := false;
  EXCEPTION WHEN insufficient_privilege OR raise_exception THEN ok := true;
  END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  BEGIN
    PERFORM generate_class_occurrences(pg_temp.id('studio_a'), 8);
    ok := false;
  EXCEPTION WHEN insufficient_privilege OR raise_exception THEN NULL;
  END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(ok, 'GEN-04', 'only the studio''s owners and admins can generate');

  -- GEN-05: the owner can top up their own studio.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  PERFORM generate_class_occurrences(pg_temp.id('studio_a'), 8);
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(true, 'GEN-05', 'owner tops up own studio');

  -- GEN-06: retiming the rule cancels unbooked future classes but keeps a booked one.
  SELECT id INTO v_booked FROM class_occurrences WHERE schedule_rule_id = v_rule ORDER BY starts_at LIMIT 1;
  INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status)
  VALUES (pg_temp.id('studio_a'), v_booked, pg_temp.id('student_a2'), 'confirmed');
  UPDATE schedule_rules SET start_time = '18:00', end_time = '19:00' WHERE id = v_rule;
  SELECT count(*) INTO m FROM class_occurrences
   WHERE schedule_rule_id = v_rule AND NOT is_cancelled
     AND (starts_at AT TIME ZONE 'America/Chicago')::time = '10:00';
  PERFORM pg_temp.ok(m = 1 AND NOT (SELECT is_cancelled FROM class_occurrences WHERE id = v_booked),
                     'GEN-06', 'retime cancels unbooked classes, keeps the booked one (left ' || m || ')');
  SELECT count(*) INTO m FROM class_occurrences
   WHERE schedule_rule_id = v_rule AND NOT is_cancelled
     AND (starts_at AT TIME ZONE 'America/Chicago')::time = '18:00';
  PERFORM pg_temp.ok(m BETWEEN 7 AND 9, 'GEN-07', 'retimed classes are generated (' || m || ')');

  -- GEN-08: deactivating the rule cancels the rest of its unbooked classes.
  UPDATE schedule_rules SET is_active = false WHERE id = v_rule;
  SELECT count(*) INTO m FROM class_occurrences WHERE schedule_rule_id = v_rule AND NOT is_cancelled;
  PERFORM pg_temp.ok(m = 1, 'GEN-08', 'inactive rule leaves only the booked class (' || m || ')');

  -- GEN-10..12 on a second rule (Tuesday 07:00).
  v_rule := 'aaaaaaaa-4000-0000-0000-000000000002';
  INSERT INTO schedule_rules (id, studio_id, offering_id, location_id, recurrence, day_of_week, start_time, end_time, room, effective_from)
  VALUES (v_rule, pg_temp.id('studio_a'), 'aaaaaaaa-2000-0000-0000-000000000001', 'aaaaaaaa-1000-0000-0000-000000000001',
          'weekly', 'tuesday', '07:00', '08:00', 'Main', CURRENT_DATE);

  -- GEN-10: a room change refreshes every unbooked class; a booked class keeps its room.
  SELECT id INTO v_booked FROM class_occurrences WHERE schedule_rule_id = v_rule ORDER BY starts_at LIMIT 1;
  INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status)
  VALUES (pg_temp.id('studio_a'), v_booked, pg_temp.id('student_a2'), 'confirmed');
  UPDATE schedule_rules SET room = 'Loft' WHERE id = v_rule;
  SELECT count(*) FILTER (WHERE room = 'Loft'), count(*) FILTER (WHERE room = 'Main') INTO n, m
    FROM class_occurrences WHERE schedule_rule_id = v_rule AND NOT is_cancelled;
  PERFORM pg_temp.ok(n >= 7 AND m = 1 AND (SELECT room FROM class_occurrences WHERE id = v_booked) = 'Main',
                     'GEN-10', 'rule edits refresh unbooked classes only (Loft ' || n || ', Main ' || m || ')');

  -- GEN-11: a cancelled booking does not keep an obsolete class alive.
  UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE class_occurrence_id = v_booked;
  UPDATE schedule_rules SET start_time = '07:30', end_time = '08:30' WHERE id = v_rule;
  PERFORM pg_temp.ok((SELECT is_cancelled FROM class_occurrences WHERE id = v_booked),
                     'GEN-11', 'class with only a cancelled booking is cancelled on retime');

  -- GEN-12: a class kept only by a seat hold is cancelled by the daily top-up once the hold lapses.
  SELECT id INTO v_booked FROM class_occurrences
   WHERE schedule_rule_id = v_rule AND NOT is_cancelled ORDER BY starts_at LIMIT 1;
  INSERT INTO seat_holds (class_occurrence_id, profile_id, studio_id, expires_at)
  VALUES (v_booked, pg_temp.id('student_a1'), pg_temp.id('studio_a'), NOW() + interval '30 minutes');
  UPDATE schedule_rules SET is_active = false WHERE id = v_rule;
  ok := NOT (SELECT is_cancelled FROM class_occurrences WHERE id = v_booked);
  UPDATE seat_holds SET expires_at = NOW() - interval '1 minute' WHERE class_occurrence_id = v_booked;
  PERFORM set_config('request.jwt.claim.sub', '', true);  -- the daily job runs with no user
  PERFORM generate_class_occurrences(NULL, 8);
  PERFORM pg_temp.ok(ok AND (SELECT is_cancelled FROM class_occurrences WHERE id = v_booked)
                     AND NOT EXISTS (SELECT 1 FROM class_occurrences WHERE schedule_rule_id = v_rule AND NOT is_cancelled),
                     'GEN-12', 'held class survives deactivation, then is cancelled after the hold lapses');

  -- GEN-09: anon cannot call it.
  PERFORM pg_temp.ok(NOT has_function_privilege('anon', 'generate_class_occurrences(uuid, integer)', 'EXECUTE')
                     AND NOT has_function_privilege('authenticated', 'generate_rule_occurrences(uuid, integer)', 'EXECUTE'),
                     'GEN-09', 'anon cannot generate; the per-rule helper is internal');
END $$;
