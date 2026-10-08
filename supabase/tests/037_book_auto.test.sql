\i helpers.sql
-- book_class_auto (AUTO-*): migration 00026. One server-side decision: membership, then pack, else pay.

CREATE OR REPLACE FUNCTION pg_temp.pack(who text) RETURNS int LANGUAGE sql AS $$
  SELECT classes_remaining FROM class_packs WHERE id = pg_temp.id(who) $$;

DO $$
DECLARE r jsonb; msg text; mt uuid;
BEGIN
  -- AUTO-01: nothing that covers the class -> needs payment, with the server's price.
  -- (student_b1 only owns a pack of studio B, which must not count at studio A.)
  PERFORM pg_temp.as_user(pg_temp.id('student_b1'));
  r := book_class_auto(pg_temp.id('occ_a_open'));
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(r ->> 'result' = 'needs_payment' AND (r ->> 'drop_in_price_cents')::int = 2200, 'AUTO-01', 'no usable entitlement -> needs_payment at the server price: ' || r::text);

  -- AUTO-02: a pack covers it -> booked, one credit used.
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  r := book_class_auto('aaaaaaaa-3000-0000-0000-000000000002');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(r ->> 'result' = 'booked' AND r ->> 'source_type' = 'class_pack' AND r ->> 'status' = 'confirmed', 'AUTO-02', 'pack used when it is the only source: ' || r::text);
  PERFORM pg_temp.ok(pg_temp.pack('pack_a1') = 4, 'AUTO-02', 'exactly one credit consumed, got ' || pg_temp.pack('pack_a1'));

  -- AUTO-03: a membership is preferred over a pack, and the pack stays untouched.
  INSERT INTO membership_types (studio_id, name, price_cents) VALUES (pg_temp.id('studio_a'), 'Unlimited', 12000) RETURNING id INTO mt;
  INSERT INTO memberships (studio_id, profile_id, membership_type_id, status, current_period_start, current_period_end)
    VALUES (pg_temp.id('studio_a'), pg_temp.id('student_a2'), mt, 'active', NOW() - interval '1 day', NOW() + interval '30 days');
  PERFORM pg_temp.as_user(pg_temp.id('student_a2'));
  r := book_class_auto('aaaaaaaa-3000-0000-0000-000000000002');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(r ->> 'source_type' = 'membership', 'AUTO-03', 'membership chosen before the pack: ' || r::text);
  PERFORM pg_temp.ok(pg_temp.pack('pack_a2') = 5, 'AUTO-03', 'pack untouched');
END $$;

DO $$
DECLARE r jsonb; r2 jsonb;
BEGIN
  -- AUTO-04: full class + entitlement -> waitlisted (not charged), not an error.
  PERFORM pg_temp.as_user(pg_temp.id('student_a2'));
  r := book_class_auto(pg_temp.id('occ_a_open'));            -- takes the only seat via membership
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  r2 := book_class_auto(pg_temp.id('occ_a_open'));
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(r ->> 'status' = 'confirmed', 'AUTO-04', 'first student confirmed');
  PERFORM pg_temp.ok(r2 ->> 'result' = 'booked' AND r2 ->> 'status' = 'waitlisted', 'AUTO-04', 'second student waitlisted: ' || r2::text);
  PERFORM pg_temp.ok(pg_temp.pack('pack_a1') = 4, 'AUTO-04', 'waitlisting did not consume a credit');
END $$;

INSERT INTO class_occurrences (id, studio_id, offering_id, location_id, starts_at, ends_at, capacity, is_cancelled)
VALUES ('aaaaaaaa-3000-0000-0000-0000000000f2', 'aaaaaaaa-0000-0000-0000-000000000001',
        'aaaaaaaa-2000-0000-0000-000000000001', 'aaaaaaaa-1000-0000-0000-000000000001',
        NOW() + interval '5 days', NOW() + interval '5 days 1 hour', 5, FALSE);

DO $$
DECLARE msg text; r jsonb;
BEGIN
  -- AUTO-05: an exhausted pack is skipped, so the student is asked to pay.
  UPDATE class_packs SET classes_remaining = 0, status = 'exhausted' WHERE id = pg_temp.id('pack_a1');
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  r := book_class_auto('aaaaaaaa-3000-0000-0000-0000000000f2');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(r ->> 'result' = 'needs_payment', 'AUTO-05', 'exhausted pack -> needs_payment');
END $$;

-- a class that already started (inserted inside the test)
INSERT INTO class_occurrences (id, studio_id, offering_id, location_id, starts_at, ends_at, capacity, is_cancelled)
VALUES ('aaaaaaaa-3000-0000-0000-0000000000f3', 'aaaaaaaa-0000-0000-0000-000000000001',
        'aaaaaaaa-2000-0000-0000-000000000001', 'aaaaaaaa-1000-0000-0000-000000000001',
        NOW() - interval '10 minutes', NOW() + interval '50 minutes', 5, FALSE);

DO $$
DECLARE msg text;
BEGIN
  -- AUTO-06: guards.
  PERFORM pg_temp.as_user(pg_temp.id('student_a2'));
  BEGIN PERFORM book_class_auto(pg_temp.id('occ_a_open')); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(msg LIKE 'Already booked%', 'AUTO-06', 'cannot book the same class twice: ' || COALESCE(msg, 'no error'));

  msg := NULL;
  PERFORM pg_temp.as_user(pg_temp.id('student_a2'));
  BEGIN PERFORM book_class_auto('aaaaaaaa-3000-0000-0000-0000000000f3'); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(msg = 'Class has already started', 'AUTO-06', 'cannot book a class that started: ' || COALESCE(msg, 'no error'));

  msg := NULL;
  PERFORM pg_temp.as_user(pg_temp.id('student_a2'));
  BEGIN PERFORM book_class(pg_temp.id('occ_a_open'), 'class_pack', pg_temp.id('pack_a2')); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(msg IS NOT NULL, 'AUTO-06', 'book_class still guards duplicates');

  msg := NULL;
  PERFORM pg_temp.as_anon();
  BEGIN PERFORM book_class_auto(pg_temp.id('occ_a_open')); EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(msg LIKE 'permission denied%', 'AUTO-06', 'anon cannot call it: ' || COALESCE(msg, 'no error'));
END $$;
