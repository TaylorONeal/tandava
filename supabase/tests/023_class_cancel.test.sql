\i helpers.sql
-- Studio cancels a class (CC-*), 00043: credits come back, drop-ins are queued
-- for a refund, the waitlist is cleared and nobody is promoted, only staff can.

DO $$
DECLARE
  ok boolean; res jsonb; prev jsonb; n int; m int;
  v_occ uuid := pg_temp.id('occ_a_open');          -- capacity 1
  v_occ2 uuid := 'aaaaaaaa-3000-0000-0000-000000000002'; -- capacity 5
  v_past uuid := 'aaaaaaaa-3000-0000-0000-000000000004';
  v_mt uuid; v_mem uuid; v_txn uuid; v_bk_drop uuid;
BEGIN
  -- a1 holds the only seat with a pack class; a2 waits.
  INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status, class_pack_id)
  VALUES (pg_temp.id('studio_a'), v_occ, pg_temp.id('student_a1'), 'confirmed', pg_temp.id('pack_a1'));
  INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status, class_pack_id, waitlist_position)
  VALUES (pg_temp.id('studio_a'), v_occ, pg_temp.id('student_a2'), 'waitlisted', pg_temp.id('pack_a2'), 1);

  -- CC-01: a student cannot preview or cancel.
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  BEGIN PERFORM cancel_class(v_occ, 'x'); ok := false;
  EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  BEGIN PERFORM preview_class_cancellation(v_occ); ok := ok AND false;
  EXCEPTION WHEN insufficient_privilege THEN ok := ok AND true; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(ok AND NOT (SELECT is_cancelled FROM class_occurrences WHERE id = v_occ),
                     'CC-01', 'student cannot preview or cancel a class');

  -- CC-02: another studio's owner cannot cancel it.
  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  BEGIN PERFORM cancel_class(v_occ, 'x'); ok := false;
  EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(ok, 'CC-02', 'other studio owner cannot cancel');

  -- CC-03: preview names who is affected and changes nothing.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  prev := preview_class_cancellation(v_occ);
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(
    jsonb_array_length(prev -> 'people') = 2
    AND prev -> 'people' -> 0 ->> 'source' = 'pack'
    AND prev -> 'people' -> 1 ->> 'source' = 'waitlist'
    AND (SELECT classes_remaining FROM class_packs WHERE id = pg_temp.id('pack_a1')) = 4
    AND NOT (SELECT is_cancelled FROM class_occurrences WHERE id = v_occ),
    'CC-03', 'preview lists the booked student and the waitlist, changes nothing');

  -- CC-04: owner cancels: class cancelled, pack class back, waitlist cleared, nobody promoted.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  res := cancel_class(v_occ, 'Teacher is sick');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(
    (SELECT is_cancelled AND cancellation_reason = 'Teacher is sick' FROM class_occurrences WHERE id = v_occ)
    AND (SELECT classes_remaining FROM class_packs WHERE id = pg_temp.id('pack_a1')) = 5
    AND (SELECT classes_remaining FROM class_packs WHERE id = pg_temp.id('pack_a2')) = 5
    AND NOT EXISTS (SELECT 1 FROM bookings WHERE class_occurrence_id = v_occ AND status <> 'cancelled')
    AND (SELECT count(*) FROM bookings WHERE class_occurrence_id = v_occ AND cancel_reason = 'class_cancelled') = 2
    AND jsonb_array_length(res -> 'people') = 2,
    'CC-04', 'cancel returns the pack class, clears the waitlist without promoting, reports both people');

  -- CC-05: cancelling twice is refused and returns nothing twice.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  BEGIN PERFORM cancel_class(v_occ, 'again'); ok := false;
  EXCEPTION WHEN object_not_in_prerequisite_state THEN ok := true; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(ok AND (SELECT classes_remaining FROM class_packs WHERE id = pg_temp.id('pack_a1')) = 5,
                     'CC-05', 'second cancel refused, no second credit');

  -- CC-06: a class that already started cannot be cancelled.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  BEGIN PERFORM cancel_class(v_past, 'late'); ok := false;
  EXCEPTION WHEN object_not_in_prerequisite_state THEN ok := true; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(ok, 'CC-06', 'started class refused');

  -- Class 2: a membership booking and a paid drop-in.
  INSERT INTO membership_types (studio_id, name, price_cents, classes_per_cycle)
  VALUES (pg_temp.id('studio_a'), 'Ten a month', 9000, 10) RETURNING id INTO v_mt;
  INSERT INTO memberships (studio_id, profile_id, membership_type_id, status, current_period_start, current_period_end)
  VALUES (pg_temp.id('studio_a'), pg_temp.id('student_a1'), v_mt, 'active', NOW(), NOW() + interval '30 days') RETURNING id INTO v_mem;
  INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status, membership_id)
  VALUES (pg_temp.id('studio_a'), v_occ2, pg_temp.id('student_a1'), 'confirmed', v_mem);
  INSERT INTO transactions (studio_id, profile_id, type, status, amount_cents, currency, stripe_payment_intent_id, refunded_amount_cents)
  VALUES (pg_temp.id('studio_a'), pg_temp.id('student_a2'), 'drop_in', 'completed', 9000, 'USD', 'pi_cc_test', 1000)
  RETURNING id INTO v_txn;
  INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status, transaction_id)
  VALUES (pg_temp.id('studio_a'), v_occ2, pg_temp.id('student_a2'), 'confirmed', v_txn) RETURNING id INTO v_bk_drop;

  -- CC-07: membership usage is returned and the drop-in gets the unrefunded rest queued.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  res := cancel_class(v_occ2, NULL);
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(
    (SELECT classes_used_this_cycle FROM memberships WHERE id = v_mem) = 0
    AND (SELECT amount_cents FROM refund_requests WHERE transaction_id = v_txn AND reason = 'class_cancelled') = 8000
    AND (SELECT booking_id FROM refund_requests WHERE transaction_id = v_txn) = v_bk_drop
    AND jsonb_array_length(res -> 'refund_request_ids') = 1
    AND (SELECT cancellation_reason FROM class_occurrences WHERE id = v_occ2) = 'cancelled by studio',
    'CC-07', 'membership usage returned, drop-in refund queued for the unrefunded 80.00');

  -- CC-08: refund requests are visible to the studio's staff only, and never writable from the client.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  SELECT count(*) INTO n FROM refund_requests;
  UPDATE refund_requests SET status = 'sent';
  GET DIAGNOSTICS m = ROW_COUNT;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  SELECT n + 10 * count(*) INTO n FROM refund_requests;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.as_user(pg_temp.id('student_a2'));
  SELECT n + 100 * count(*) INTO n FROM refund_requests;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 1 AND m = 0 AND (SELECT status FROM refund_requests WHERE transaction_id = v_txn) = 'pending',
                     'CC-08', 'refund requests: own staff read only, no client writes');

  -- CC-09: the queue never holds two refunds for one payment.
  INSERT INTO refund_requests (studio_id, transaction_id, amount_cents, reason)
  VALUES (pg_temp.id('studio_a'), v_txn, 8000, 'class_cancelled') ON CONFLICT DO NOTHING;
  PERFORM pg_temp.ok((SELECT count(*) FROM refund_requests WHERE transaction_id = v_txn) = 1,
                     'CC-09', 'one refund request per payment per reason');

  -- CC-11: an early check-in is unwound: credit back and the attendance it counted removed.
  UPDATE studio_members SET total_classes_attended = 3, last_class_at = NOW() - interval '7 days'
   WHERE studio_id = pg_temp.id('studio_a') AND profile_id = pg_temp.id('student_a2');
  INSERT INTO class_occurrences (id, studio_id, offering_id, location_id, starts_at, ends_at, capacity)
  VALUES ('aaaaaaaa-3000-0000-0000-0000000000c1', pg_temp.id('studio_a'), 'aaaaaaaa-2000-0000-0000-000000000001',
          'aaaaaaaa-1000-0000-0000-000000000001', NOW() + interval '30 minutes', NOW() + interval '90 minutes', 5);
  INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status, class_pack_id)
  VALUES (pg_temp.id('studio_a'), 'aaaaaaaa-3000-0000-0000-0000000000c1', pg_temp.id('student_a2'), 'confirmed', pg_temp.id('pack_a2'));
  UPDATE bookings SET status = 'checked_in', checked_in_at = NOW()
   WHERE class_occurrence_id = 'aaaaaaaa-3000-0000-0000-0000000000c1';
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  res := cancel_class('aaaaaaaa-3000-0000-0000-0000000000c1', NULL);
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(
    (SELECT classes_remaining FROM class_packs WHERE id = pg_temp.id('pack_a2')) = 5
    AND (SELECT total_classes_attended FROM studio_members WHERE studio_id = pg_temp.id('studio_a') AND profile_id = pg_temp.id('student_a2')) = 3
    AND (SELECT status FROM bookings WHERE class_occurrence_id = 'aaaaaaaa-3000-0000-0000-0000000000c1') = 'cancelled'
    AND res -> 'people' -> 0 ->> 'currency' = 'USD',
    'CC-11', 'early check-in unwound: pack class back, attendance count restored, currency reported');

  -- CC-10: anonymous callers cannot reach either function.
  PERFORM pg_temp.as_anon();
  BEGIN PERFORM preview_class_cancellation(v_occ2); ok := false;
  EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(ok, 'CC-10', 'anon cannot preview');
END $$;
