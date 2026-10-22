\i helpers.sql
-- Actual migration ACLs, before any transaction-only legacy RLS probes.
-- Plain SQL equivalents of the browser/edge Data API operations, synthetic only.
BEGIN;

-- Detect a bootstrap or migration that silently restores automatic table grants.
CREATE TABLE public.api_grant_probe(id integer);
DO $$
DECLARE who text;
BEGIN
  FOREACH who IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
    PERFORM pg_temp.ok(NOT has_table_privilege(who, 'api_grant_probe', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE'),
      'ACL-01', who || ' has no automatic privileges on a newly created table');
  END LOOP;
END $$;
GRANT SELECT ON public.api_grant_probe TO anon;
DROP TABLE public.api_grant_probe;
CREATE TABLE public.api_grant_probe(id integer);
DO $$ BEGIN
  PERFORM pg_temp.ok(NOT has_table_privilege('anon', 'api_grant_probe', 'SELECT'),
    'ACL-02', 'recreated tables do not inherit old grants');
END $$;

DO $$
DECLARE n int; own_profile profiles; changed uuid;
BEGIN
  PERFORM pg_temp.as_anon();
  PERFORM pg_temp.ok(current_user = 'anon', 'ACL-03', 'request uses anon');
  SELECT count(*) INTO n FROM discover_classes();
  PERFORM pg_temp.ok(n > 0, 'ACL-03', 'anonymous discovery RPC works without base-table SELECT');
  INSERT INTO messages(type, studio_id, subject, body)
    VALUES ('studio_inquiry', pg_temp.id('studio_a'), 'Synthetic grant test', 'TEST ONLY');
  PERFORM pg_temp.expect_denied('SELECT * FROM messages', 'ACL-03');
  PERFORM pg_temp.expect_denied('SELECT * FROM studios', 'ACL-03');
  PERFORM pg_temp.expect_denied('SELECT * FROM profiles', 'ACL-03');
  EXECUTE 'RESET ROLE';

  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  PERFORM pg_temp.ok(current_user = 'authenticated', 'ACL-04', 'member uses authenticated');
  SELECT * INTO STRICT own_profile FROM profiles WHERE id = pg_temp.id('student_a1');
  UPDATE profiles SET first_name = 'Synthetic member' WHERE id = own_profile.id RETURNING id INTO changed;
  PERFORM pg_temp.ok(changed = own_profile.id, 'ACL-04', 'profile UPDATE RETURNING works with policy dependencies');
  UPDATE profiles SET first_name = 'Must not change' WHERE id = pg_temp.id('student_b1');
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM pg_temp.ok(n = 0, 'ACL-04', 'another member profile is hidden by RLS');
  PERFORM pg_temp.expect_denied('UPDATE profiles SET email = ''changed@test.dev''', 'ACL-04');
  PERFORM pg_temp.expect_denied('DELETE FROM profiles', 'ACL-04');
  -- Supported embedded read: occurrence -> offering/location, membership -> type.
  SELECT count(*) INTO n FROM class_occurrences c JOIN offerings o ON o.id = c.offering_id
    JOIN locations l ON l.id = c.location_id JOIN studios s ON s.id = c.studio_id
    WHERE c.studio_id = pg_temp.id('studio_a');
  PERFORM pg_temp.ok(n > 0, 'ACL-04', 'member class embedding dependencies are readable');
  PERFORM 1 FROM memberships m JOIN membership_types t ON t.id = m.membership_type_id;
  PERFORM 1 FROM class_packs p JOIN class_pack_types t ON t.id = p.class_pack_type_id;
  PERFORM pg_temp.expect_denied('UPDATE bookings SET status = ''cancelled''', 'ACL-04');
  PERFORM pg_temp.expect_denied('SELECT * FROM transactions', 'ACL-04');
  EXECUTE 'RESET ROLE';

  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  UPDATE studios SET website = 'https://studio.example' WHERE id = pg_temp.id('studio_a') RETURNING id INTO changed;
  PERFORM pg_temp.ok(changed = pg_temp.id('studio_a'), 'ACL-05', 'owner settings UPDATE RETURNING works');
  PERFORM pg_temp.expect_denied('UPDATE studios SET stripe_account_id = ''acct_forbidden''', 'ACL-05');
  PERFORM pg_temp.expect_denied('SELECT pay_rate_cents FROM studio_staff', 'ACL-05');
  INSERT INTO automation_settings(studio_id, guest_to_member_enabled) VALUES(pg_temp.id('studio_a'), false)
    ON CONFLICT(studio_id) DO UPDATE SET guest_to_member_enabled = excluded.guest_to_member_enabled;
  INSERT INTO automation_settings(studio_id, guest_to_member_enabled) VALUES(pg_temp.id('studio_a'), true)
    ON CONFLICT(studio_id) DO UPDATE SET guest_to_member_enabled = excluded.guest_to_member_enabled;
  PERFORM pg_temp.ok((SELECT guest_to_member_enabled FROM automation_settings WHERE studio_id = pg_temp.id('studio_a')),
    'ACL-05', 'settings UPSERT insert and conflict-update both work');
  PERFORM pg_temp.expect_denied('DELETE FROM offerings', 'ACL-05');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  UPDATE automation_settings SET guest_to_member_enabled = false WHERE studio_id = pg_temp.id('studio_a');
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM pg_temp.ok(n = 0, 'ACL-05', 'other owner cannot edit automation settings');
  EXECUTE 'RESET ROLE';
END $$;

DO $$
DECLARE table_name text; created uuid; changed uuid;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  EXECUTE 'SET LOCAL ROLE service_role';
  PERFORM pg_temp.ok(current_user = 'service_role', 'ACL-06', 'server requests use service_role, not owner');
  -- Direct edge reads, not grants for every public table. This catches missing
  -- service ACLs even though the test role carries BYPASSRLS.
  FOREACH table_name IN ARRAY ARRAY[
    'analytics_sessions','automation_settings','automation_sends','booking_attribution_context',
    'bookings','class_cancel_notices','class_occurrences','class_pack_types','consent_records',
    'event_pricing_tiers','event_registrations','events','import_jobs','locations','membership_types',
    'memberships','offerings','profile_visitors','profiles','push_subscriptions','refund_requests',
    'schedule_rules','studio_members','studio_onboarding','studio_staff','studios','waiver_templates'
  ] LOOP
    EXECUTE format('SELECT * FROM public.%I LIMIT 1', table_name);
  END LOOP;
  PERFORM pg_temp.ok(true, 'ACL-06', 'all current edge direct reads execute under service_role');
  INSERT INTO studios(name, slug) VALUES('Synthetic onboarding', 'acl-synthetic-onboarding') RETURNING id INTO created;
  INSERT INTO studio_staff(studio_id, profile_id, role) VALUES(created, pg_temp.id('staff_a'), 'owner');
  INSERT INTO studio_members(studio_id, profile_id) VALUES(created, pg_temp.id('student_a1'))
    ON CONFLICT(studio_id, profile_id) DO UPDATE SET profile_id = excluded.profile_id;
  INSERT INTO studio_members(studio_id, profile_id) VALUES(created, pg_temp.id('student_a1'))
    ON CONFLICT(studio_id, profile_id) DO UPDATE SET profile_id = excluded.profile_id;
  INSERT INTO profiles(id, email, display_name) VALUES(pg_temp.id('student_a1'), 'student-a1@test.dev', 'Synthetic guest')
    ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name RETURNING id INTO changed;
  PERFORM pg_temp.ok(changed = pg_temp.id('student_a1'), 'ACL-07', 'server onboarding INSERT RETURNING and member/profile UPSERT work');
  -- No rows need match: PostgreSQL still checks privileges on the statement.
  UPDATE refund_requests SET status = 'pending' WHERE false;
  UPDATE class_cancel_notices SET status = 'pending' WHERE false;
  UPDATE memberships SET updated_at = now() WHERE false;
  UPDATE booking_attribution_context SET session_id = NULL, visitor_id = NULL WHERE false;
  UPDATE automation_sends SET status = 'failed' WHERE false;
  DELETE FROM automation_sends WHERE false;
  DELETE FROM push_subscriptions WHERE false;
  PERFORM pg_temp.ok(true, 'ACL-08', 'edge follow-up mutations have explicit table privileges');
  PERFORM pg_temp.expect_denied('SELECT * FROM transactions', 'ACL-09');
  PERFORM pg_temp.expect_denied('INSERT INTO bookings DEFAULT VALUES', 'ACL-09');
  PERFORM pg_temp.expect_denied('TRUNCATE profiles', 'ACL-09');
  EXECUTE 'RESET ROLE';
END $$;
ROLLBACK;
