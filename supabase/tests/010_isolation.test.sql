\i helpers.sql
-- Tenant isolation (ISO-*). Gate: all must pass before any pilot.

-- RLS-only regression probes for legacy tables with no current direct API path.
-- These explicit grants exist only inside this transaction and are rolled back.
-- 005_api_privileges separately verifies the unmodified migration ACL contract.
BEGIN;
GRANT SELECT ON transactions, virtual_class_settings TO authenticated;

-- Setup as superuser: one booking per studio, and Zoom credentials for studio A.
INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status) VALUES
  (pg_temp.id('studio_a'), pg_temp.id('occ_a_open'), pg_temp.id('student_a1'), 'confirmed'),
  (pg_temp.id('studio_b'), pg_temp.id('occ_b_open'), pg_temp.id('student_b1'), 'confirmed');
INSERT INTO virtual_class_settings (studio_id, zoom_connected, zoom_credentials_encrypted)
  VALUES (pg_temp.id('studio_a'), TRUE, 'SECRET-ZOOM-TOKEN');

DO $$
DECLARE n int; m int;
BEGIN
  -- ISO-01a: staff of studio A sees only studio A rows
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  SELECT count(*) INTO n FROM transactions;
  SELECT count(*) INTO m FROM transactions WHERE studio_id <> pg_temp.id('studio_a');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 1 AND m = 0, 'ISO-01a', 'staff A sees only studio A transactions');

  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  SELECT count(*) INTO n FROM bookings;
  SELECT count(*) INTO m FROM bookings WHERE studio_id <> pg_temp.id('studio_a');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 1 AND m = 0, 'ISO-01a', 'staff A sees only studio A bookings');

  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  SELECT count(*) INTO n FROM class_packs;
  SELECT count(*) INTO m FROM class_packs WHERE studio_id <> pg_temp.id('studio_a');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 2 AND m = 0, 'ISO-01a', 'staff A sees only studio A class packs');

  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  SELECT count(*) INTO n FROM studio_members WHERE studio_id <> pg_temp.id('studio_a');
  SELECT count(*) INTO m FROM studio_staff WHERE studio_id <> pg_temp.id('studio_a');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0 AND m = 0, 'ISO-01a', 'staff A cannot see studio B members or staff');

  -- ISO-01b: and the mirror image for studio B
  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  SELECT count(*) INTO n FROM transactions WHERE studio_id = pg_temp.id('studio_a');
  SELECT count(*) INTO m FROM bookings WHERE studio_id = pg_temp.id('studio_a');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0 AND m = 0, 'ISO-01b', 'staff B cannot see studio A transactions or bookings');

  -- ISO-01c: a student sees only their own money and bookings
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  SELECT count(*) INTO n FROM bookings WHERE profile_id <> pg_temp.id('student_a1');
  SELECT count(*) INTO m FROM class_packs WHERE profile_id <> pg_temp.id('student_a1');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0 AND m = 0, 'ISO-01c', 'student cannot see other students bookings or packs');

  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  SELECT count(*) INTO n FROM transactions WHERE profile_id <> pg_temp.id('student_a1');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'ISO-01c', 'student cannot see other students transactions');

  -- ISO-01d: anonymous sees none of the private tables
  PERFORM pg_temp.as_anon();
  PERFORM pg_temp.expect_denied('SELECT * FROM bookings', 'ISO-01d');
  PERFORM pg_temp.expect_denied('SELECT * FROM transactions', 'ISO-01d');
  PERFORM pg_temp.expect_denied('SELECT * FROM profiles', 'ISO-01d');
  PERFORM pg_temp.expect_denied('SELECT * FROM studio_members', 'ISO-01d');
  PERFORM pg_temp.expect_denied('SELECT * FROM studio_staff', 'ISO-01d');
  PERFORM pg_temp.expect_denied('SELECT * FROM class_packs', 'ISO-01d');
  PERFORM pg_temp.expect_denied('SELECT * FROM memberships', 'ISO-01d');
  EXECUTE 'RESET ROLE';
END $$;

DO $$
DECLARE n int; v jsonb;
BEGIN
  -- ISO-02: non-discoverable studio is invisible to the public
  PERFORM pg_temp.as_anon();
  PERFORM pg_temp.expect_denied('SELECT * FROM studios', 'ISO-02');
  n := 0;
  v := get_studio_storefront('hidden-c');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'ISO-02', 'anon cannot select a non-discoverable studio');
  PERFORM pg_temp.ok(v IS NULL, 'ISO-02', 'storefront RPC returns NULL for a non-discoverable studio');

  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM get_public_schedule('hidden-c');
  v := get_studio_storefront('studio-a');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'ISO-02', 'public schedule RPC returns nothing for a non-discoverable studio');
  PERFORM pg_temp.ok(v IS NOT NULL, 'ISO-02', 'storefront RPC works for a discoverable studio');
END $$;

DO $$
DECLARE n int; booking_id uuid;
BEGIN
  SELECT id INTO booking_id FROM bookings WHERE profile_id = pg_temp.id('student_a1');

  -- ISO-04: other students and other studios' staff cannot modify a booking
  PERFORM pg_temp.as_user(pg_temp.id('student_b1'));
  PERFORM pg_temp.expect_denied(format('UPDATE bookings SET status = %L WHERE id = %L', 'cancelled', booking_id), 'ISO-04');
  n := 0;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'ISO-04', 'student B cannot cancel student A booking');

  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  PERFORM pg_temp.expect_denied(format('UPDATE bookings SET status = %L WHERE id = %L', 'cancelled', booking_id), 'ISO-04');
  n := 0;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'ISO-04', 'staff of studio B cannot modify a studio A booking');

  PERFORM pg_temp.ok((SELECT status::text FROM bookings WHERE id = booking_id) = 'confirmed', 'ISO-04', 'booking unchanged');
END $$;

DO $$
DECLARE offenders text;
BEGIN
  -- ISO-05: every table carrying studio_id has row-level security on
  SELECT string_agg(c.table_name, ', ' ORDER BY c.table_name) INTO offenders
  FROM information_schema.columns c
  JOIN pg_class t ON t.relname = c.table_name AND t.relnamespace = 'public'::regnamespace AND t.relkind = 'r'
  WHERE c.table_schema = 'public' AND c.column_name = 'studio_id' AND NOT t.relrowsecurity;
  PERFORM pg_temp.ok(offenders IS NULL, 'ISO-05', 'RLS enabled on every studio_id table' || COALESCE(' (missing: ' || offenders || ')', ''));
END $$;

DO $$
DECLARE n int;
BEGIN
  -- ISO-06: Zoom credentials are readable only by studio A admins
  PERFORM pg_temp.as_anon();
  PERFORM pg_temp.expect_denied('SELECT * FROM virtual_class_settings', 'ISO-06');
  n := 0;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'ISO-06', 'anon cannot read virtual_class_settings');

  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  SELECT count(*) INTO n FROM virtual_class_settings;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'ISO-06', 'staff B cannot read studio A virtual_class_settings');

  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  SELECT count(*) INTO n FROM virtual_class_settings;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'ISO-06', 'a student cannot read virtual_class_settings');

  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  SELECT count(*) INTO n FROM virtual_class_settings;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 1, 'ISO-06', 'studio A owner can read their own virtual_class_settings');
END $$;

DO $$
DECLARE
  t record; who text; failures text := ''; denied int := 0; n bigint;
BEGIN
  -- ISO-07: granted reads must work (including policy dependencies); tables
  -- without SELECT must reject reads. Required grants are asserted in 005.
  FOREACH who IN ARRAY ARRAY['anon', 'student_a1', 'staff_a'] LOOP
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1 LOOP
      BEGIN
        IF who = 'anon' THEN PERFORM pg_temp.as_anon(); ELSE PERFORM pg_temp.as_user(pg_temp.id(who)); END IF;
        IF has_table_privilege(current_user, format('public.%I', t.tablename), 'SELECT') THEN
          EXECUTE format('SELECT count(*) FROM public.%I', t.tablename) INTO n;
        ELSE
          PERFORM pg_temp.expect_denied(format('SELECT * FROM public.%I', t.tablename), 'ISO-07');
        END IF;
        EXECUTE 'RESET ROLE';
      EXCEPTION WHEN OTHERS THEN
        EXECUTE 'RESET ROLE';
        failures := failures || format(' %s@%s(%s)', t.tablename, who, SQLERRM);
      END;
    END LOOP;
  END LOOP;
  PERFORM pg_temp.ok(failures = '', 'ISO-07', 'granted reads work; other reads are denied for anon, student and staff' || failures);

  -- Informational: tables with RLS on and no policy deny all client access.
  SELECT count(*) INTO denied FROM pg_class c
  WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r' AND c.relrowsecurity
    AND NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid);
  RAISE NOTICE 'INFO  % tables have RLS enabled but no policy (clients require grants and policies; service role also needs grants)', denied;
END $$;

ROLLBACK;
