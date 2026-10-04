\i helpers.sql
-- Security baseline (SEC-*): guards for migration 00022 and for future drift.

DO $$
DECLARE missing text; unpinned text;
BEGIN
  -- SEC-01: every public table has RLS enabled (Supabase grants anon full rights on new tables).
  SELECT string_agg(c.relname, ', ') INTO missing FROM pg_class c
  WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r' AND NOT c.relrowsecurity;
  PERFORM pg_temp.ok(missing IS NULL, 'SEC-01', 'RLS enabled on every public table' || COALESCE(': missing ' || missing, ''));

  -- SEC-04: every SECURITY DEFINER function in public pins search_path.
  SELECT string_agg(p.proname, ', ') INTO unpinned FROM pg_proc p
  WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef
    AND NOT EXISTS (SELECT 1 FROM unnest(COALESCE(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%');
  PERFORM pg_temp.ok(unpinned IS NULL, 'SEC-04', 'SECURITY DEFINER functions pin search_path' || COALESCE(': ' || unpinned, ''));

END $$;

DO $$
DECLARE r record; bad text := '';
BEGIN
  -- SEC-03: no anon/authenticated execute on server-only definer functions.
  FOR r IN SELECT p.oid, p.proname FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname IN ('log_audit_event','increment_event_registered','increment_tier_registered') LOOP
    IF has_function_privilege('anon', r.oid, 'execute') OR has_function_privilege('authenticated', r.oid, 'execute') THEN
      bad := bad || ' ' || r.proname;
    END IF;
  END LOOP;
  PERFORM pg_temp.ok(bad = '', 'SEC-03', 'server-only functions closed to anon and authenticated' || bad);

  -- anon cannot run any definer function that acts for a user
  FOR r IN SELECT p.oid, p.proname FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname IN ('book_class','cancel_booking','get_my_effective_role','increment_video_view') LOOP
    IF has_function_privilege('anon', r.oid, 'execute') THEN bad := bad || ' ' || r.proname; END IF;
  END LOOP;
  PERFORM pg_temp.ok(bad = '', 'SEC-03', 'user-scoped functions closed to anon' || bad);
END $$;

DO $$
DECLARE n bigint;
BEGIN
  -- SEC-02: zoom host credentials are visible to the studio's admins only.
  INSERT INTO class_zoom_meetings (class_occurrence_id, zoom_meeting_id, join_url, host_url, password)
    VALUES (pg_temp.id('occ_a_open'), 'z-1', 'https://zoom.example/j/1', 'https://zoom.example/s/1', 'secret');

  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM class_zoom_meetings; EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'SEC-02', 'anon cannot read zoom meetings');

  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  SELECT count(*) INTO n FROM class_zoom_meetings; EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'SEC-02', 'a student cannot read zoom host credentials');

  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  SELECT count(*) INTO n FROM class_zoom_meetings; EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'SEC-02', 'staff of another studio cannot read zoom meetings');

  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  SELECT count(*) INTO n FROM class_zoom_meetings; EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 1, 'SEC-02', 'owner of the studio can read its zoom meeting');

  PERFORM pg_temp.as_anon();
  BEGIN
    UPDATE class_zoom_meetings SET password = 'hacked'; GET DIAGNOSTICS n = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN n := 0;
  END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0 AND (SELECT password FROM class_zoom_meetings LIMIT 1) = 'secret', 'SEC-02', 'anon cannot modify zoom meetings');
END $$;

DO $$
DECLARE n bigint; raw_rows bigint; msg text;
BEGIN
  -- SEC-05: anon cannot read raw studio rows even for a discoverable studio (no stripe ids, emails).
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO raw_rows FROM studios; EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(raw_rows = 0, 'SEC-05', 'anon sees no raw studio rows');
  -- ...while the public RPCs keep working.
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM discover_classes(); EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n > 0, 'SEC-05', 'discover still works for anon');
  PERFORM pg_temp.as_anon();
  PERFORM pg_temp.ok((get_studio_storefront('studio-a')) IS NOT NULL, 'SEC-05', 'storefront RPC still works for anon');
  EXECUTE 'RESET ROLE';
  -- a student still sees the studio they belong to
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  SELECT count(*) INTO n FROM studios; EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 1, 'SEC-05', 'a member sees only their own studio, got ' || n);
END $$;

DO $$
DECLARE n bigint; msg text;
BEGIN
  -- SEC-06: contact form. Anyone can submit; nobody but the studio's staff can read.
  PERFORM pg_temp.as_anon();
  INSERT INTO messages (type, studio_id, sender_name, subject, body)
    VALUES ('studio_inquiry', pg_temp.id('studio_a'), 'Guest', 'Hello', 'Do you have a class at 6?');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(true, 'SEC-06', 'anon can submit a message');

  PERFORM pg_temp.as_anon();
  BEGIN
    INSERT INTO messages (type, studio_id, subject, body, honeypot)
      VALUES ('studio_inquiry', pg_temp.id('studio_a'), 'Spam', 'buy now', 'bot-filled');
  EXCEPTION WHEN OTHERS THEN msg := SQLERRM;
  END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(msg IS NOT NULL, 'SEC-06', 'filled honeypot is rejected');

  msg := NULL;
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  BEGIN
    INSERT INTO messages (type, sender_id, subject, body)
      VALUES ('support_ticket', pg_temp.id('student_b1'), 'Spoof', 'pretend to be someone else');
  EXCEPTION WHEN OTHERS THEN msg := SQLERRM;
  END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(msg IS NOT NULL, 'SEC-06', 'cannot submit as another user');

  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM messages; EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'SEC-06', 'anon cannot read the inbox');

  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  SELECT count(*) INTO n FROM messages; EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 1, 'SEC-06', 'studio staff read their inbox, got ' || n);

  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  SELECT count(*) INTO n FROM messages; EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'SEC-06', 'other studio staff cannot read it');
END $$;

DO $$
DECLARE bare text; n bigint; msg text; rid uuid;
BEGIN
  -- SEC-07: RLS on with zero policies means the feature behind the table cannot work from
  -- the app. New tables must ship with a policy (or be added to an explicit allowlist here).
  SELECT string_agg(c.relname, ', ') INTO bare FROM pg_class c
  WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r' AND c.relrowsecurity
    AND NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid);
  PERFORM pg_temp.ok(bare IS NULL, 'SEC-07', 'every RLS table has at least one policy' || COALESCE(': ' || bare, ''));

  -- SEC-08 (class A, studio config): staff read, owner writes, others see nothing.
  INSERT INTO nudge_rules (studio_id, nudge_type, trigger_condition, title_template, body_template)
    SELECT pg_temp.id('studio_a'), e.enumlabel::nudge_type, '{}'::jsonb, 't', 'b'
    FROM pg_enum e JOIN pg_type ty ON ty.oid = e.enumtypid WHERE ty.typname = 'nudge_type' LIMIT 1
    RETURNING id INTO rid;

  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM nudge_rules; EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'SEC-08', 'anon cannot read studio config');

  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  SELECT count(*) INTO n FROM nudge_rules; EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'SEC-08', 'a student cannot read studio config');

  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  SELECT count(*) INTO n FROM nudge_rules; EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'SEC-08', 'other studio staff cannot read it');

  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  SELECT count(*) INTO n FROM nudge_rules; EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 1, 'SEC-08', 'owner reads their studio config');

  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  BEGIN
    UPDATE nudge_rules SET title_template = 'hijack' WHERE id = rid; GET DIAGNOSTICS n = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN n := 0; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'SEC-08', 'other studio owner cannot edit it');

  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  UPDATE nudge_rules SET title_template = 'mine' WHERE id = rid; GET DIAGNOSTICS n = ROW_COUNT;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 1, 'SEC-08', 'owner can edit their studio config');
END $$;
