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
  PERFORM pg_temp.expect_denied('UPDATE refund_requests SET status = ''sent''', 'CC-08');
  m := 0;
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

  -- CC-12: everyone affected is queued to be told; no email on file is recorded, not queued.
  PERFORM pg_temp.ok(
    (SELECT count(*) FROM class_cancel_notices WHERE occurrence_id = v_occ) = 2
    AND (SELECT count(*) FROM class_cancel_notices WHERE occurrence_id = v_occ2) = 2
    AND NOT EXISTS (SELECT 1 FROM class_cancel_notices
                    WHERE status <> CASE WHEN email IS NULL THEN 'no_email' ELSE 'pending' END),
    'CC-12', 'a notice per affected booking, pending when there is an email');

  -- CC-13: follow-up state reports what is still owed, then what went out.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  prev := class_cancel_followup(v_occ2);
  EXECUTE 'RESET ROLE';
  UPDATE refund_requests SET status = 'sent' WHERE transaction_id = v_txn;
  UPDATE class_cancel_notices SET status = 'sent' WHERE occurrence_id = v_occ2 AND status = 'pending';
  GET DIAGNOSTICS m = ROW_COUNT;
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  res := class_cancel_followup(v_occ2);
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(
    (prev ->> 'cancelled')::boolean
    AND (prev ->> 'refunds_outstanding')::int = 1 AND (prev ->> 'refunds_sent')::int = 0
    AND (prev ->> 'emails_outstanding')::int = m
    AND jsonb_array_length(prev -> 'people') = 2
    AND (SELECT count(*) FROM jsonb_array_elements(prev -> 'people') x
          WHERE x ->> 'source' = 'drop_in' AND x ->> 'refund_status' = 'failed') = 1
    AND (res ->> 'refunds_outstanding')::int = 0 AND (res ->> 'refunds_sent')::int = 1
    AND (res ->> 'refunds_sent_cents')::int = 8000
    AND (res -> 'refunds_sent_by_currency' ->> 'USD')::int = 8000
    AND (res ->> 'emails_sent')::int = m AND (res ->> 'emails_outstanding')::int = 0
    AND (SELECT count(*) FROM jsonb_array_elements(res -> 'people') x
          WHERE x ->> 'source' = 'drop_in' AND x ->> 'refund_status' = 'sent') = 1,
    'CC-13', 'follow-up state: refund and emails owed, then sent');

  -- CC-14: follow-up state and notices are the studio's staff only, never client-writable.
  ok := true;
  PERFORM pg_temp.as_user(pg_temp.id('student_a2'));
  BEGIN PERFORM class_cancel_followup(v_occ2); ok := false;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  SELECT count(*) INTO n FROM class_cancel_notices;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  BEGIN PERFORM class_cancel_followup(v_occ2); ok := false;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  SELECT n + count(*) INTO n FROM class_cancel_notices;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  PERFORM pg_temp.expect_denied('UPDATE class_cancel_notices SET status = ''pending''', 'CC-14');
  m := 0;
  SELECT n + 10 * count(*) INTO n FROM class_cancel_notices;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(ok AND m = 0 AND n = 40, 'CC-14', 'follow-up and notices: own staff read only, no client writes');

  -- CC-15: a drop-in paid after the class was cancelled gets its refund and notice queued.
  res := fulfill_stripe_checkout('evt_cc_late', 'checkout.session.completed', jsonb_build_object(
    'id', 'cs_cc_late', 'payment_intent', 'pi_cc_late', 'amount_total', 2200, 'currency', 'usd',
    'metadata', jsonb_build_object('type', 'drop_in', 'studio_id', pg_temp.id('studio_a'),
                                   'profile_id', pg_temp.id('student_a1'), 'occurrence_id', v_occ2)));
  SELECT id INTO v_txn FROM transactions WHERE stripe_payment_intent_id = 'pi_cc_late';
  PERFORM pg_temp.ok(
    res ->> 'status' = 'processed'
    AND NOT EXISTS (SELECT 1 FROM bookings WHERE transaction_id = v_txn)
    AND (SELECT amount_cents FROM refund_requests WHERE transaction_id = v_txn AND occurrence_id = v_occ2 AND status = 'pending') = 2200
    AND (SELECT count(*) FROM class_cancel_notices WHERE transaction_id = v_txn AND occurrence_id = v_occ2 AND booking_id IS NULL) = 1,
    'CC-15', 'paid after cancel: no booking, refund and notice queued');

  -- CC-16: a student told "arranging" is owed an update once the refund goes
  -- through; a refund Stripe later fails is reopened once, for the matching refund only.
  UPDATE refund_requests SET status = 'sent', stripe_refund_id = 're_cc_late' WHERE transaction_id = v_txn;
  UPDATE class_cancel_notices SET status = 'sent', refund_told = 'failed' WHERE transaction_id = v_txn;
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  prev := class_cancel_followup(v_occ2);
  EXECUTE 'RESET ROLE';
  ok := NOT reopen_failed_refund((SELECT id FROM refund_requests WHERE transaction_id = v_txn), 're_other', NULL, 'x');
  ok := ok AND NOT reopen_failed_refund((SELECT id FROM refund_requests WHERE transaction_id = v_txn), 're_cc_late', 3, 'stale attempt');
  -- The failure can arrive before "sent" was recorded: matched by attempt.
  UPDATE refund_requests SET status = 'pending', stripe_refund_id = NULL WHERE transaction_id = v_txn;
  -- Told by hand while the refund looked sent: reopened too.
  UPDATE class_cancel_notices SET status = 'handled', refund_told = NULL WHERE transaction_id = v_txn;
  UPDATE transactions SET status = 'refunded', refunded_amount_cents = 2200 WHERE id = v_txn;
  ok := ok AND reopen_failed_refund((SELECT id FROM refund_requests WHERE transaction_id = v_txn), 're_cc_late', 0, 'insufficient funds', 2200, 0);
  ok := ok AND (SELECT status = 'completed' AND refunded_amount_cents = 0 FROM transactions WHERE id = v_txn);
  ok := ok AND NOT reopen_failed_refund((SELECT id FROM refund_requests WHERE transaction_id = v_txn), 're_cc_late', 0, 'again');
  -- A confirmation the owner gave by hand is reopened by a later failure too.
  UPDATE refund_requests SET status = 'sent' WHERE transaction_id = v_txn;
  UPDATE class_cancel_notices SET refund_told = 'handled' WHERE transaction_id = v_txn;
  ok := ok AND reopen_failed_refund((SELECT id FROM refund_requests WHERE transaction_id = v_txn), 're_cc_late2', 1, 'insufficient funds');
  PERFORM pg_temp.ok(
    ok AND (prev ->> 'refund_updates_owed')::int = 1
    AND (SELECT status = 'failed' AND refund_attempt = 2 AND last_error = 'insufficient funds' AND stripe_refund_id = 're_cc_late2'
           FROM refund_requests WHERE transaction_id = v_txn)
    AND (SELECT refund_told FROM class_cancel_notices WHERE transaction_id = v_txn) = 'failed',
    'CC-16', 'refund update owed after a late success; a failed refund is reopened once, with the payment back to unrefunded');

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
  res := cancel_class('aaaaaaaa-3000-0000-0000-0000000000c1', NULL, '  See you Thursday  ');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(
    (SELECT classes_remaining FROM class_packs WHERE id = pg_temp.id('pack_a2')) = 5
    AND (SELECT total_classes_attended FROM studio_members WHERE studio_id = pg_temp.id('studio_a') AND profile_id = pg_temp.id('student_a2')) = 3
    AND (SELECT status FROM bookings WHERE class_occurrence_id = 'aaaaaaaa-3000-0000-0000-0000000000c1') = 'cancelled'
    AND res -> 'people' -> 0 ->> 'currency' = 'USD'
    AND (SELECT message FROM class_cancel_notices WHERE occurrence_id = 'aaaaaaaa-3000-0000-0000-0000000000c1') = 'See you Thursday',
    'CC-11', 'early check-in unwound: pack class back, attendance count restored, currency and note kept');

  -- CC-17: only the service role can reopen a refund.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  BEGIN PERFORM reopen_failed_refund(gen_random_uuid(), 're', 0, 'x'); ok := false;
  EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(ok, 'CC-17', 'staff cannot reopen refunds');

  -- CC-18: the owner closes notices they handled themselves; others cannot.
  UPDATE class_cancel_notices SET status = 'failed' WHERE occurrence_id = v_occ2 AND booking_id IS NOT NULL;
  UPDATE class_cancel_notices SET status = 'sent', refund_told = 'failed' WHERE occurrence_id = v_occ2 AND booking_id IS NULL;
  UPDATE refund_requests SET status = 'sent' WHERE transaction_id = (SELECT id FROM transactions WHERE stripe_payment_intent_id = 'pi_cc_late');
  -- The original drop-in's notice promised a confirmation, but its refund has not gone through: stays open.
  UPDATE refund_requests SET status = 'failed' WHERE transaction_id = (SELECT transaction_id FROM bookings WHERE id = v_bk_drop);
  UPDATE class_cancel_notices SET status = 'failed', refund_told = NULL WHERE booking_id = v_bk_drop;
  UPDATE class_cancel_notices SET status = 'no_email' WHERE occurrence_id = v_occ2 AND booking_id IS NOT NULL AND booking_id <> v_bk_drop;
  ok := true;
  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  BEGIN PERFORM class_cancel_mark_handled(v_occ2); ok := false;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  n := class_cancel_mark_handled(v_occ2);
  res := class_cancel_followup(v_occ2);
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(
    ok AND n = 3 AND (res ->> 'emails_outstanding')::int = 0 AND (res ->> 'refund_updates_owed')::int = 0
    AND (res ->> 'no_email_open')::int = 0
    AND (SELECT status = 'handled' AND refund_told = 'failed' FROM class_cancel_notices WHERE booking_id = v_bk_drop)
    AND (SELECT refund_told FROM class_cancel_notices WHERE occurrence_id = v_occ2 AND booking_id IS NULL) = 'handled'
    AND NOT EXISTS (SELECT 1 FROM class_cancel_notices WHERE occurrence_id = v_occ2 AND status IN ('failed', 'no_email')),
    'CC-18', 'owner marks notices handled (no-email too); someone still owed a refund stays owed its confirmation');
  -- ...and once that refund goes through, the confirmation is owed.
  UPDATE refund_requests SET status = 'sent' WHERE transaction_id = (SELECT transaction_id FROM bookings WHERE id = v_bk_drop);
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  res := class_cancel_followup(v_occ2);
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok((res ->> 'refund_updates_owed')::int = 1, 'CC-18', 'confirmation owed after a hand-handled notice once the refund goes through');

  -- CC-19: a full refund made in the Stripe dashboard settles the queued request; a partial one does not.
  SELECT id INTO v_txn FROM transactions WHERE stripe_payment_intent_id = 'pi_cc_late';
  UPDATE refund_requests SET status = 'failed' WHERE transaction_id = v_txn;
  n := settle_class_cancel_refunds('pi_cc_late', 2200, 1000);
  ok := n = 0 AND (SELECT status FROM refund_requests WHERE transaction_id = v_txn) = 'failed';
  m := (SELECT refund_attempt FROM refund_requests WHERE transaction_id = v_txn);
  n := settle_class_cancel_refunds('pi_cc_late', 2200, 2200);
  -- A delayed failure for the refund made before the dashboard refund does not reopen it.
  ok := ok AND NOT reopen_failed_refund((SELECT id FROM refund_requests WHERE transaction_id = v_txn), 're_old', m, 'late failure');
  -- Already sent when the dashboard refund lands: the attempt is still retired.
  m := (SELECT refund_attempt FROM refund_requests WHERE transaction_id = v_txn);
  PERFORM settle_class_cancel_refunds('pi_cc_late', 2200, 2200);
  ok := ok AND NOT reopen_failed_refund((SELECT id FROM refund_requests WHERE transaction_id = v_txn), 're_old2', m, 'late failure');
  PERFORM pg_temp.ok(
    ok AND n = 1 AND (SELECT status FROM refund_requests WHERE transaction_id = v_txn) = 'sent',
    'CC-19', 'dashboard refund settles the queue only when the charge is fully refunded');

  -- CC-21: an unconfirmed delivery counts as uncertain at once, and can be marked handled.
  UPDATE class_cancel_notices SET status = 'unknown', updated_at = NOW() WHERE transaction_id = v_txn;
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  res := class_cancel_followup(v_occ2);
  n := class_cancel_mark_handled(v_occ2);
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok((res ->> 'emails_uncertain')::int = 1 AND (res ->> 'emails_outstanding')::int >= 1 AND n >= 1
                     AND (SELECT status FROM class_cancel_notices WHERE transaction_id = v_txn) = 'handled',
                     'CC-21', 'unconfirmed delivery is uncertain immediately and closable');

  -- CC-20: a notice that announced a refund which then failed is reopened by the post-send reconcile.
  UPDATE refund_requests SET status = 'failed' WHERE transaction_id = v_txn;
  UPDATE class_cancel_notices SET refund_told = 'sent' WHERE transaction_id = v_txn;
  n := class_cancel_reconcile_notices(v_occ2);
  PERFORM pg_temp.ok(n = 1 AND (SELECT refund_told FROM class_cancel_notices WHERE transaction_id = v_txn) = 'failed'
                     AND class_cancel_reconcile_notices(v_occ2) = 0,
                     'CC-20', 'reconcile reopens a notice whose announced refund failed, once');

  -- CC-10: anonymous callers cannot reach either function.
  PERFORM pg_temp.as_anon();
  BEGIN PERFORM preview_class_cancellation(v_occ2); ok := false;
  EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(ok, 'CC-10', 'anon cannot preview');
END $$;
