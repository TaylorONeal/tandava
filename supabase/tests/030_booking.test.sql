\i helpers.sql
-- Booking through book_class() (BOOK-*). Order matters: each step builds on the last.

DO $$
DECLARE b bookings; remaining int; booked int;
BEGIN
  -- BOOK-01: one booking consumes exactly one class (was two before migration 00021)
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  b := book_class(pg_temp.id('occ_a_open'), 'class_pack', pg_temp.id('pack_a1'));
  EXECUTE 'RESET ROLE';
  SELECT classes_remaining INTO remaining FROM class_packs WHERE id = pg_temp.id('pack_a1');
  SELECT booked_count INTO booked FROM class_occurrences WHERE id = pg_temp.id('occ_a_open');
  PERFORM pg_temp.ok(b.status::text = 'confirmed', 'BOOK-01', 'first student is confirmed');
  PERFORM pg_temp.ok(remaining = 4, 'BOOK-01', 'pack goes 5 -> 4 (exactly one class consumed), got ' || remaining);
  PERFORM pg_temp.ok(booked = 1, 'BOOK-01', 'class booked_count is 1');
END $$;

DO $$
DECLARE msg text;
BEGIN
  -- BOOK-02: same student cannot book the same class twice
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  BEGIN
    PERFORM book_class(pg_temp.id('occ_a_open'), 'class_pack', pg_temp.id('pack_a1'));
  EXCEPTION WHEN OTHERS THEN msg := SQLERRM;
  END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(msg LIKE 'Already booked%', 'BOOK-02', 'duplicate booking rejected: ' || COALESCE(msg, 'no error'));
END $$;

DO $$
DECLARE b bookings; remaining int;
BEGIN
  -- BOOK-03: a full class waitlists the next student and does not consume their pack
  PERFORM pg_temp.as_user(pg_temp.id('student_a2'));
  b := book_class(pg_temp.id('occ_a_open'), 'class_pack', pg_temp.id('pack_a2'));
  EXECUTE 'RESET ROLE';
  SELECT classes_remaining INTO remaining FROM class_packs WHERE id = pg_temp.id('pack_a2');
  PERFORM pg_temp.ok(b.status::text = 'waitlisted' AND b.waitlist_position = 1, 'BOOK-03', 'second student is waitlisted at position 1');
  PERFORM pg_temp.ok(remaining = 5, 'BOOK-03', 'waitlisting does not consume a class, got ' || remaining);
END $$;

DO $$
DECLARE msg text;
BEGIN
  -- BOOK-04: anonymous cannot book
  PERFORM pg_temp.as_anon();
  BEGIN
    PERFORM book_class(pg_temp.id('occ_a_open'), 'class_pack', pg_temp.id('pack_a1'));
  EXCEPTION WHEN OTHERS THEN msg := SQLERRM;
  END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(msg = 'Not authenticated', 'BOOK-04', 'anon booking rejected: ' || COALESCE(msg, 'no error'));
END $$;

DO $$
DECLARE msg text;
BEGIN
  -- BOOK-05: a pack bought at studio A cannot be spent at studio B (was allowed before 00021)
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  BEGIN
    PERFORM book_class(pg_temp.id('occ_b_open'), 'class_pack', pg_temp.id('pack_a1'));
  EXCEPTION WHEN OTHERS THEN msg := SQLERRM;
  END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(msg LIKE '%different studio%', 'BOOK-05', 'cross-studio pack rejected: ' || COALESCE(msg, 'no error'));
END $$;

DO $$
DECLARE msg text;
BEGIN
  -- BOOK-06: cancelled class
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  BEGIN
    PERFORM book_class(pg_temp.id('occ_a_cancelled'), 'class_pack', pg_temp.id('pack_a1'));
  EXCEPTION WHEN OTHERS THEN msg := SQLERRM;
  END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(msg = 'Class is cancelled', 'BOOK-06', 'cancelled class rejected: ' || COALESCE(msg, 'no error'));
END $$;

DO $$
DECLARE msg text;
BEGIN
  -- BOOK-07: cannot spend another student's pack
  PERFORM pg_temp.as_user(pg_temp.id('student_a2'));
  BEGIN
    PERFORM book_class(pg_temp.id('occ_b_open'), 'class_pack', pg_temp.id('pack_a1'));
  EXCEPTION WHEN OTHERS THEN msg := SQLERRM;
  END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(msg = 'Class pack not found', 'BOOK-07', 'someone else''s pack rejected: ' || COALESCE(msg, 'no error'));
END $$;
