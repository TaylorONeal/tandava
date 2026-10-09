\i helpers.sql
-- Owner catalog edits (CAT-*), 00042: owners and admins edit classes, prices
-- and the weekly schedule of their own studio, and edits reach the classes.

DO $$
DECLARE
  n int; m int; ok boolean; v_off uuid; v_rule uuid; v_cap int; v_end time;
  v_vinyasa uuid := 'aaaaaaaa-2000-0000-0000-000000000001';
  v_loc_a uuid := 'aaaaaaaa-1000-0000-0000-000000000001';
BEGIN
  -- CAT-01: an owner adds a class and changes its price.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  INSERT INTO offerings (studio_id, name, slug, duration_minutes, capacity, drop_in_price_cents)
  VALUES (pg_temp.id('studio_a'), 'Yin Evening', 'yin-evening', 60, 12, 2000) RETURNING id INTO v_off;
  UPDATE offerings SET drop_in_price_cents = 2400 WHERE id = v_off;
  GET DIAGNOSTICS n = ROW_COUNT;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 1 AND (SELECT drop_in_price_cents FROM offerings WHERE id = v_off) = 2400,
                     'CAT-01', 'owner adds a class and edits its price');

  -- CAT-02: another studio's owner cannot edit or add to studio A.
  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  UPDATE offerings SET drop_in_price_cents = 1 WHERE id = v_off;
  GET DIAGNOSTICS n = ROW_COUNT;
  BEGIN
    INSERT INTO offerings (studio_id, name, slug) VALUES (pg_temp.id('studio_a'), 'Intruder', 'intruder');
    ok := false;
  EXCEPTION WHEN insufficient_privilege THEN ok := true;
  END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0 AND ok, 'CAT-02', 'other studio owner cannot edit or add');

  -- CAT-03: a student cannot edit prices.
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  UPDATE offerings SET drop_in_price_cents = 1 WHERE id = v_off;
  GET DIAGNOSTICS n = ROW_COUNT;
  UPDATE class_pack_types SET price_cents = 1 WHERE studio_id = pg_temp.id('studio_a');
  GET DIAGNOSTICS m = ROW_COUNT;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0 AND m = 0, 'CAT-03', 'student cannot edit classes or prices');

  -- CAT-04: a row cannot be moved to another studio.
  UPDATE studio_staff SET role = 'owner' WHERE profile_id = pg_temp.id('staff_a');
  INSERT INTO studio_staff (studio_id, profile_id, role) VALUES (pg_temp.id('studio_b'), pg_temp.id('staff_a'), 'owner');
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  BEGIN
    UPDATE offerings SET studio_id = pg_temp.id('studio_b') WHERE id = v_off;
    ok := false;
  EXCEPTION WHEN insufficient_privilege THEN ok := true;
  END;
  EXECUTE 'RESET ROLE';
  DELETE FROM studio_staff WHERE studio_id = pg_temp.id('studio_b') AND profile_id = pg_temp.id('staff_a');
  PERFORM pg_temp.ok(ok, 'CAT-04', 'studio_id cannot change, even between two studios the user owns');

  -- CAT-05: an owner edits pack and membership prices; nobody can delete them.
  INSERT INTO membership_types (studio_id, name, price_cents) VALUES (pg_temp.id('studio_a'), 'Unlimited A', 15000);
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  UPDATE class_pack_types SET price_cents = 12000 WHERE studio_id = pg_temp.id('studio_a');
  GET DIAGNOSTICS n = ROW_COUNT;
  UPDATE membership_types SET price_cents = 16000, is_active = false WHERE studio_id = pg_temp.id('studio_a');
  GET DIAGNOSTICS m = ROW_COUNT;
  DELETE FROM offerings WHERE id = v_off;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 1 AND m = 1 AND EXISTS (SELECT 1 FROM offerings WHERE id = v_off),
                     'CAT-05', 'pack and membership prices editable, delete does nothing');

  -- CAT-06: values are checked.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  BEGIN
    UPDATE offerings SET drop_in_price_cents = -100 WHERE id = v_off;
    ok := false;
  EXCEPTION WHEN check_violation THEN ok := true;
  END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(ok, 'CAT-06', 'negative price rejected');

  -- CAT-07: a rule cannot point at another studio's class.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  BEGIN
    INSERT INTO schedule_rules (studio_id, offering_id, location_id, recurrence, day_of_week, start_time, end_time)
    VALUES (pg_temp.id('studio_a'), 'bbbbbbbb-2000-0000-0000-000000000001', v_loc_a, 'weekly', 'monday', '09:00', '10:00');
    ok := false;
  EXCEPTION WHEN check_violation THEN ok := true;
  END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(ok, 'CAT-07', 'rule with another studio''s class rejected');

  -- CAT-08: an owner adds a weekly class and it is generated; moving the day moves the classes.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  INSERT INTO schedule_rules (studio_id, offering_id, location_id, teacher_id, recurrence, day_of_week, start_time, end_time)
  VALUES (pg_temp.id('studio_a'), v_off, v_loc_a, pg_temp.id('staff_a'), 'weekly', 'tuesday', '18:00', '19:00')
  RETURNING id INTO v_rule;
  UPDATE schedule_rules SET day_of_week = 'thursday' WHERE id = v_rule;
  EXECUTE 'RESET ROLE';
  SELECT count(*) FILTER (WHERE NOT is_cancelled AND EXTRACT(ISODOW FROM starts_at AT TIME ZONE 'America/Chicago') = 4),
         count(*) FILTER (WHERE NOT is_cancelled AND EXTRACT(ISODOW FROM starts_at AT TIME ZONE 'America/Chicago') = 2)
    INTO n, m FROM class_occurrences WHERE schedule_rule_id = v_rule;
  PERFORM pg_temp.ok(n >= 8 AND m = 0, 'CAT-08', 'owner-added class generated and moved (' || n || ' thu, ' || m || ' tue)');

  -- CAT-09: a new length reaches the rule and its classes.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  UPDATE offerings SET duration_minutes = 90 WHERE id = v_off;
  EXECUTE 'RESET ROLE';
  SELECT end_time INTO v_end FROM schedule_rules WHERE id = v_rule;
  SELECT count(*) INTO n FROM class_occurrences
   WHERE schedule_rule_id = v_rule AND NOT is_cancelled AND ends_at - starts_at <> interval '90 minutes';
  PERFORM pg_temp.ok(v_end = '19:30' AND n = 0, 'CAT-09', 'length change updates rule end and classes');

  -- CAT-10: a capacity change reaches a booked class, never below the bookings.
  INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status)
  VALUES (pg_temp.id('studio_a'), pg_temp.id('occ_a_open'), pg_temp.id('student_a1'), 'confirmed');
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  UPDATE offerings SET capacity = 10 WHERE id = v_vinyasa;
  EXECUTE 'RESET ROLE';
  SELECT capacity INTO v_cap FROM class_occurrences WHERE id = pg_temp.id('occ_a_open');
  PERFORM pg_temp.ok(v_cap = 10, 'CAT-10', 'raised capacity reaches a booked class (got ' || v_cap || ')');

  -- CAT-11: turning a class off cancels its unbooked future classes.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  UPDATE offerings SET is_active = false WHERE id = v_off;
  EXECUTE 'RESET ROLE';
  SELECT count(*) INTO n FROM class_occurrences
   WHERE schedule_rule_id = v_rule AND starts_at > NOW() AND NOT is_cancelled;
  PERFORM pg_temp.ok(n = 0, 'CAT-11', 'class turned off: future classes cancelled');

  -- CAT-12: the teacher picker is the owner's own studio only.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  SELECT count(*) INTO n FROM get_studio_staff_names(pg_temp.id('studio_a'));
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  SELECT count(*) INTO m FROM get_studio_staff_names(pg_temp.id('studio_a'));
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 1 AND m = 0 AND NOT has_function_privilege('anon', 'get_studio_staff_names(uuid)', 'EXECUTE'),
                     'CAT-12', 'staff names for own studio only');
END $$;
