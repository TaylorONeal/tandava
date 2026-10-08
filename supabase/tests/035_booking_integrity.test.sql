\i helpers.sql
-- Booking integrity (BOOK-09.. and CHK-*): migration 00024. Each step builds on the last.
-- Fixed ids not in helpers.sql are spelled out; see fixtures.sql.

CREATE OR REPLACE FUNCTION pg_temp.pack(who text) RETURNS int LANGUAGE sql AS $$
  SELECT classes_remaining FROM class_packs WHERE id = pg_temp.id(who) $$;

DO $$
DECLARE b bookings; b2 bookings; start_credits int; msg text;
BEGIN
  -- BOOK-09: a cancelled booking does not block booking the same class again.
  start_credits := pg_temp.pack('pack_a1');
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  b := book_class('aaaaaaaa-3000-0000-0000-000000000002', 'class_pack', pg_temp.id('pack_a1'));
  b := cancel_booking(b.id);
  b2 := book_class('aaaaaaaa-3000-0000-0000-000000000002', 'class_pack', pg_temp.id('pack_a1'));
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(b2.status::text = 'confirmed' AND b2.id <> b.id, 'BOOK-09', 're-booking after a cancel works');
  PERFORM pg_temp.ok(pg_temp.pack('pack_a1') = start_credits - 1, 'BOOK-09', 'exactly one credit held after cancel + rebook, got ' || pg_temp.pack('pack_a1'));

  -- BOOK-10: on-time cancel returns the credit once; a second cancel is rejected, no double refund.
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  b := cancel_booking(b2.id);
  BEGIN PERFORM cancel_booking(b2.id); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(b.status::text = 'cancelled', 'BOOK-10', 'on-time cancel is a plain cancel');
  PERFORM pg_temp.ok(msg LIKE '%already cancelled%', 'BOOK-10', 'second cancel rejected: ' || COALESCE(msg, 'no error'));
  PERFORM pg_temp.ok(pg_temp.pack('pack_a1') = start_credits, 'BOOK-10', 'credit returned exactly once, got ' || pg_temp.pack('pack_a1'));
END $$;

DO $$
DECLARE b1 bookings; b2 bookings; a1_start int; a2_start int;
BEGIN
  a1_start := pg_temp.pack('pack_a1'); a2_start := pg_temp.pack('pack_a2');

  -- BOOK-11: waitlist promotion consumes the promoted student's credit (was a free class).
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  b1 := book_class(pg_temp.id('occ_a_open'), 'class_pack', pg_temp.id('pack_a1'));
  PERFORM pg_temp.as_user(pg_temp.id('student_a2'));
  b2 := book_class(pg_temp.id('occ_a_open'), 'class_pack', pg_temp.id('pack_a2'));
  PERFORM pg_temp.ok(b2.status::text = 'waitlisted', 'BOOK-11', 'second student waitlisted on the 1-seat class');
  PERFORM pg_temp.ok(pg_temp.pack('pack_a2') = a2_start, 'BOOK-11', 'waitlisting holds no credit');
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  PERFORM cancel_booking(b1.id);
  EXECUTE 'RESET ROLE';
  SELECT * INTO b2 FROM bookings WHERE id = b2.id;
  PERFORM pg_temp.ok(b2.status::text = 'confirmed' AND b2.waitlist_position IS NULL, 'BOOK-11', 'waitlisted student promoted on cancel');
  PERFORM pg_temp.ok(b2.entitlement_consumed, 'BOOK-11', 'promotion consumed their credit');
  PERFORM pg_temp.ok(pg_temp.pack('pack_a2') = a2_start - 1, 'BOOK-11', 'promoted student pack -1, got ' || pg_temp.pack('pack_a2'));
  PERFORM pg_temp.ok(pg_temp.pack('pack_a1') = a1_start, 'BOOK-11', 'cancelling student got their credit back');

  -- BOOK-12: cancelling a promoted booking returns the credit it consumed, not an extra one.
  PERFORM pg_temp.as_user(pg_temp.id('student_a2'));
  PERFORM cancel_booking(b2.id);
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(pg_temp.pack('pack_a2') = a2_start, 'BOOK-12', 'no minted credit after waitlist -> promote -> cancel, got ' || pg_temp.pack('pack_a2'));
END $$;

DO $$
DECLARE b1 bookings; b2 bookings; a1_start int;
BEGIN
  -- BOOK-13: a waitlisted student whose pack ran out is skipped, not promoted for free.
  a1_start := pg_temp.pack('pack_a1');
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  b1 := book_class(pg_temp.id('occ_a_open'), 'class_pack', pg_temp.id('pack_a1'));
  PERFORM pg_temp.as_user(pg_temp.id('student_a2'));
  b2 := book_class(pg_temp.id('occ_a_open'), 'class_pack', pg_temp.id('pack_a2'));
  EXECUTE 'RESET ROLE';
  UPDATE class_packs SET classes_remaining = 0, status = 'exhausted' WHERE id = pg_temp.id('pack_a2');
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  PERFORM cancel_booking(b1.id);
  EXECUTE 'RESET ROLE';
  SELECT * INTO b2 FROM bookings WHERE id = b2.id;
  PERFORM pg_temp.ok(b2.status::text = 'waitlisted', 'BOOK-13', 'student with an exhausted pack stays waitlisted');
  PERFORM pg_temp.ok(pg_temp.pack('pack_a2') = 0, 'BOOK-13', 'their pack is untouched');
  -- restore for the next scenario; clear the leftover waitlisted row
  UPDATE class_packs SET classes_remaining = 5, status = 'active' WHERE id = pg_temp.id('pack_a2');
  DELETE FROM bookings WHERE id = b2.id;
END $$;

-- A class starting in 30 minutes: inside the late-cancel window and the check-in window.
INSERT INTO class_occurrences (id, studio_id, offering_id, location_id, starts_at, ends_at, capacity, is_cancelled)
VALUES ('aaaaaaaa-3000-0000-0000-0000000000f1', 'aaaaaaaa-0000-0000-0000-000000000001',
        'aaaaaaaa-2000-0000-0000-000000000001', 'aaaaaaaa-1000-0000-0000-000000000001',
        NOW() + interval '30 minutes', NOW() + interval '90 minutes', 1, FALSE);

DO $$
DECLARE b1 bookings; b2 bookings; a1_start int; a2_start int;
BEGIN
  a1_start := pg_temp.pack('pack_a1'); a2_start := pg_temp.pack('pack_a2');
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  b1 := book_class('aaaaaaaa-3000-0000-0000-0000000000f1', 'class_pack', pg_temp.id('pack_a1'));
  PERFORM pg_temp.as_user(pg_temp.id('student_a2'));
  b2 := book_class('aaaaaaaa-3000-0000-0000-0000000000f1', 'class_pack', pg_temp.id('pack_a2'));
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  b1 := cancel_booking(b1.id);
  EXECUTE 'RESET ROLE';
  -- BOOK-14: a late cancel forfeits the credit but still frees the seat for the waitlist.
  PERFORM pg_temp.ok(b1.status::text = 'late_cancel', 'BOOK-14', 'cancel inside the window is a late cancel');
  PERFORM pg_temp.ok(pg_temp.pack('pack_a1') = a1_start - 1, 'BOOK-14', 'late cancel keeps the credit forfeited, got ' || pg_temp.pack('pack_a1'));
  SELECT * INTO b2 FROM bookings WHERE id = b2.id;
  PERFORM pg_temp.ok(b2.status::text = 'confirmed' AND pg_temp.pack('pack_a2') = a2_start - 1, 'BOOK-14', 'waitlist promoted and charged one credit');
END $$;

DO $$
DECLARE bk bookings; far bookings; msg text;
BEGIN
  SELECT * INTO bk FROM bookings
    WHERE class_occurrence_id = 'aaaaaaaa-3000-0000-0000-0000000000f1' AND status = 'confirmed';

  -- CHK-01..03: only active staff of that studio may check anyone in.
  PERFORM pg_temp.as_anon();
  BEGIN PERFORM check_in_booking(bk.id); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(msg LIKE 'permission denied%' OR msg = 'Not authenticated', 'CHK-01', 'anon cannot check in: ' || COALESCE(msg, 'no error'));

  msg := NULL;
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  BEGIN PERFORM check_in_booking(bk.id); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(msg LIKE 'Not authorized%', 'CHK-02', 'a student cannot check in: ' || COALESCE(msg, 'no error'));

  msg := NULL;
  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  BEGIN PERFORM check_in_booking(bk.id); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(msg LIKE 'Not authorized%', 'CHK-03', 'staff of another studio cannot check in: ' || COALESCE(msg, 'no error'));

  -- CHK-04: a late-cancelled booking cannot be checked in.
  msg := NULL;
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  BEGIN
    PERFORM check_in_booking((SELECT id FROM bookings WHERE class_occurrence_id = 'aaaaaaaa-3000-0000-0000-0000000000f1' AND status = 'late_cancel'));
  EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(msg LIKE 'Only confirmed bookings%', 'CHK-04', 'cancelled booking cannot be checked in: ' || COALESCE(msg, 'no error'));

  -- CHK-05: outside the window (class in 3 days) is rejected.
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  far := book_class('aaaaaaaa-3000-0000-0000-000000000002', 'class_pack', pg_temp.id('pack_a1'));
  msg := NULL;
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  BEGIN PERFORM check_in_booking(far.id); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(msg LIKE 'Check-in is open from%', 'CHK-05', 'too early is rejected: ' || COALESCE(msg, 'no error'));

  -- CHK-06: happy path, then a second check-in is rejected.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  bk := check_in_booking(bk.id, 'qr_scan');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(bk.status::text = 'checked_in' AND bk.checked_in_by = pg_temp.id('staff_a') AND bk.check_in_method = 'qr_scan', 'CHK-06', 'owner checks in a confirmed booking');
  msg := NULL;
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  BEGIN PERFORM check_in_booking(bk.id); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(msg LIKE 'Only confirmed bookings%', 'CHK-06', 'second check-in rejected');
  PERFORM pg_temp.ok((SELECT total_classes_attended FROM studio_members WHERE studio_id = pg_temp.id('studio_a') AND profile_id = bk.profile_id) >= 1, 'CHK-06', 'attendance counter incremented');
END $$;
