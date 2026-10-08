\i helpers.sql
-- Seat holds (HOLD-*): migration 00027. A paid drop-in must not land on a full class.
-- occ_a_open has capacity 1. student_a1 / student_a2 each own a pack at studio A.

CREATE OR REPLACE FUNCTION pg_temp.try_hold(who uuid, occ uuid) RETURNS text LANGUAGE plpgsql AS $$
DECLARE r jsonb;
BEGIN
  PERFORM pg_temp.as_user(who);
  BEGIN
    r := hold_spot(occ);
    EXECUTE 'RESET ROLE';
    RETURN r ->> 'result';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE 'RESET ROLE';
    RETURN 'ERR:' || SQLERRM;
  END;
END $$;

DO $$
DECLARE r text; st text; n int;
BEGIN
  -- HOLD-01: a student can hold the last seat.
  r := pg_temp.try_hold(pg_temp.id('student_a1'), pg_temp.id('occ_a_open'));
  PERFORM pg_temp.ok(r = 'held', 'HOLD-01', 'last seat held: ' || r);

  -- HOLD-02: while it is held, nobody else can hold it.
  r := pg_temp.try_hold(pg_temp.id('student_a2'), pg_temp.id('occ_a_open'));
  PERFORM pg_temp.ok(r = 'ERR:Class is full', 'HOLD-02', 'second holder refused: ' || r);

  -- HOLD-03: a held seat is not sold to a pack booking, the booker is waitlisted.
  PERFORM pg_temp.as_user(pg_temp.id('student_a2'));
  SELECT status::text INTO st FROM book_class(pg_temp.id('occ_a_open'), 'class_pack', pg_temp.id('pack_a2'));
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(st = 'waitlisted', 'HOLD-03', 'booking over another holder lands on the waitlist, got ' || st);

  -- HOLD-04: the holder's own booking uses their hold, and the hold is consumed.
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  SELECT status::text INTO st FROM book_class(pg_temp.id('occ_a_open'), 'class_pack', pg_temp.id('pack_a1'));
  EXECUTE 'RESET ROLE';
  SELECT count(*) INTO n FROM seat_holds WHERE profile_id = pg_temp.id('student_a1') AND status = 'consumed';
  PERFORM pg_temp.ok(st = 'confirmed' AND n = 1, 'HOLD-04', 'holder confirmed (' || st || ') and hold consumed (' || n || ')');
END $$;

-- HOLD-05: an expired hold does not block anyone.
DO $$
DECLARE r text;
BEGIN
  DELETE FROM bookings WHERE class_occurrence_id = pg_temp.id('occ_a_open');
  DELETE FROM seat_holds;
  INSERT INTO seat_holds (class_occurrence_id, profile_id, studio_id, expires_at)
    VALUES (pg_temp.id('occ_a_open'), pg_temp.id('student_a1'), pg_temp.id('studio_a'), NOW() - interval '1 minute');
  r := pg_temp.try_hold(pg_temp.id('student_a2'), pg_temp.id('occ_a_open'));
  PERFORM pg_temp.ok(r = 'held', 'HOLD-05', 'expired hold ignored: ' || r);
END $$;

-- HOLD-06: re-holding extends your own hold instead of failing against yourself.
DO $$
DECLARE r text; n int;
BEGIN
  r := pg_temp.try_hold(pg_temp.id('student_a2'), pg_temp.id('occ_a_open'));
  SELECT count(*) INTO n FROM seat_holds WHERE profile_id = pg_temp.id('student_a2') AND status = 'active';
  PERFORM pg_temp.ok(r = 'held' AND n = 1, 'HOLD-06', 're-hold is idempotent: ' || r || ', active rows ' || n);
END $$;

-- HOLD-07: at most 3 live holds per student.
DO $$
DECLARE r text;
BEGIN
  DELETE FROM seat_holds;
  INSERT INTO seat_holds (class_occurrence_id, profile_id, studio_id, expires_at) VALUES
    (pg_temp.id('occ_b_open'), pg_temp.id('student_a1'), pg_temp.id('studio_b'), NOW() + interval '20 minutes'),
    ('aaaaaaaa-3000-0000-0000-000000000002', pg_temp.id('student_a1'), pg_temp.id('studio_a'), NOW() + interval '20 minutes'),
    (pg_temp.id('occ_a_cancelled'), pg_temp.id('student_a1'), pg_temp.id('studio_a'), NOW() + interval '20 minutes');
  r := pg_temp.try_hold(pg_temp.id('student_a1'), pg_temp.id('occ_a_open'));
  PERFORM pg_temp.ok(r = 'ERR:Too many held seats', 'HOLD-07', 'fourth live hold refused: ' || r);
END $$;

-- HOLD-08: waitlist promotion does not hand out a held seat.
DO $$
DECLARE st text;
BEGIN
  DELETE FROM seat_holds; DELETE FROM bookings WHERE class_occurrence_id = pg_temp.id('occ_a_open');
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  PERFORM book_class(pg_temp.id('occ_a_open'), 'class_pack', pg_temp.id('pack_a1'));
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.as_user(pg_temp.id('student_a2'));
  PERFORM book_class(pg_temp.id('occ_a_open'), 'class_pack', pg_temp.id('pack_a2'));      -- waitlisted
  EXECUTE 'RESET ROLE';
  INSERT INTO seat_holds (class_occurrence_id, profile_id, studio_id, expires_at)
    VALUES (pg_temp.id('occ_a_open'), pg_temp.id('student_b1'), pg_temp.id('studio_a'), NOW() + interval '20 minutes');
  UPDATE bookings SET status = 'cancelled' WHERE class_occurrence_id = pg_temp.id('occ_a_open') AND profile_id = pg_temp.id('student_a1');
  SELECT status::text INTO st FROM bookings WHERE class_occurrence_id = pg_temp.id('occ_a_open') AND profile_id = pg_temp.id('student_a2');
  PERFORM pg_temp.ok(st = 'waitlisted', 'HOLD-08', 'freed seat stays with the holder, waitlisted student not promoted: ' || st);
END $$;

-- HOLD-09: privacy and grants.
DO $$
DECLARE n int; r text;
BEGIN
  PERFORM pg_temp.as_user(pg_temp.id('student_b1'));
  SELECT count(*) INTO n FROM seat_holds WHERE profile_id <> pg_temp.id('student_b1');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'HOLD-09', 'a student cannot read other students holds, saw ' || n);

  PERFORM pg_temp.as_anon();
  BEGIN
    PERFORM hold_spot(pg_temp.id('occ_a_open')); r := 'allowed';
  EXCEPTION WHEN insufficient_privilege THEN r := 'denied';
  END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(r = 'denied', 'HOLD-10', 'anon cannot call hold_spot: ' || r);

  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  BEGIN
    PERFORM held_seats(pg_temp.id('occ_a_open'), NULL); r := 'allowed';
  EXCEPTION WHEN insufficient_privilege THEN r := 'denied';
  END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(r = 'denied', 'HOLD-11', 'held_seats is not callable by clients: ' || r);
END $$;
