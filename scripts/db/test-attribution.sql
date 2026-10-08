-- Behaviour tests for 00024/00025 (run after verify-migrations.sh):
--   psql -v ON_ERROR_STOP=1 -d tandava_verify -f scripts/db/test-attribution.sql
-- Each block raises on failure. Runs inside a transaction and rolls back.
BEGIN;

-- Fixtures: a discoverable studio, an owner, a guest.
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'owner@example.com'),
  ('00000000-0000-0000-0000-0000000000b1', 'ana@example.com');
INSERT INTO studios (id, name, slug, timezone, currency, discoverable)
VALUES ('00000000-0000-0000-0000-00000000005a', 'Aloha Yoga', 'aloha', 'Pacific/Honolulu', 'USD', TRUE);
INSERT INTO studio_staff (studio_id, profile_id, role, is_active)
VALUES ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000a1', 'owner', TRUE);
UPDATE profiles SET is_guest = TRUE, first_name = 'Ana' WHERE id = '00000000-0000-0000-0000-0000000000b1';
INSERT INTO studio_members (studio_id, profile_id)
VALUES ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000b1');

-- 1. Sessions: unknown studio records nothing; refresh in the same session doesn't duplicate.
DO $$
DECLARE s1 UUID; s1b UUID; s2 UUID; nope UUID;
BEGIN
  nope := record_session('no-such-studio', gen_random_uuid(), 't0', 'storefront', '/s/x', NULL, '{}', '{}', 'direct', 'mobile');
  IF nope IS NOT NULL THEN RAISE EXCEPTION 'unknown studio should record nothing'; END IF;

  s1 := record_session('aloha', '11111111-1111-1111-1111-111111111111', 'tok-ig', 'storefront',
        'https://tandava.app/s/aloha?utm_source=instagram&utm_medium=bio', 'https://l.instagram.com/',
        '{"source":"instagram","medium":"bio"}', '{}', 'organic_social', 'mobile');
  s1b := record_session('aloha', '11111111-1111-1111-1111-111111111111', 'tok-ig', 'storefront',
        'https://tandava.app/s/aloha', NULL, '{}', '{}', 'organic_social', 'mobile');
  IF s1 <> s1b THEN RAISE EXCEPTION 'same session token should reuse the row'; END IF;
  IF (SELECT page_views FROM analytics_sessions WHERE id = s1) <> 2 THEN RAISE EXCEPTION 'page_views not incremented'; END IF;
  IF (SELECT referrer_domain FROM analytics_sessions WHERE id = s1) <> 'l.instagram.com' THEN RAISE EXCEPTION 'referrer host not parsed'; END IF;
  UPDATE analytics_sessions SET started_at = NOW() - interval '3 days' WHERE id = s1;

  s2 := record_session('aloha', '11111111-1111-1111-1111-111111111111', 'tok-direct', 'booking',
        'https://tandava.app/s/aloha/book/x', NULL, '{}', '{}', 'direct', 'mobile');
  PERFORM set_config('test.s1', s1::text, true);
  PERFORM set_config('test.s2', s2::text, true);
END $$;

-- 2. Conversion: first touch Instagram 3 days ago, converting touch today's direct visit.
DO $$
DECLARE c UUID; r conversion_events%ROWTYPE; again UUID;
BEGIN
  c := record_conversion('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000b1',
        '11111111-1111-1111-1111-111111111111', 'guest_booking', 2200, 'usd', 'booking',
        '22222222-2222-2222-2222-222222222222', current_setting('test.s2')::uuid, 'express');
  SELECT * INTO r FROM conversion_events WHERE id = c;
  IF r.first_touch->>'channel' <> 'organic_social' THEN RAISE EXCEPTION 'first touch should be instagram, got %', r.first_touch; END IF;
  IF r.converting_touch->>'channel' <> 'direct' THEN RAISE EXCEPTION 'converting touch should be direct'; END IF;
  IF r.touch_count <> 2 OR r.days_to_convert <> 3 THEN RAISE EXCEPTION 'touches % days %', r.touch_count, r.days_to_convert; END IF;
  IF r.currency <> 'USD' THEN RAISE EXCEPTION 'currency not upper-cased'; END IF;

  again := record_conversion('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000b1',
        NULL, 'guest_booking', 2200, 'USD', 'booking', '22222222-2222-2222-2222-222222222222', NULL, 'express');
  IF again IS NOT NULL THEN RAISE EXCEPTION 'replayed conversion should be a no-op'; END IF;

  IF (SELECT source FROM studio_members WHERE profile_id = '00000000-0000-0000-0000-0000000000b1') <> 'express'
    THEN RAISE EXCEPTION 'member source not set'; END IF;
  IF (SELECT first_touch_session_id FROM studio_members WHERE profile_id = '00000000-0000-0000-0000-0000000000b1') <> current_setting('test.s1')::uuid
    THEN RAISE EXCEPTION 'member first touch not set'; END IF;
END $$;

-- 3. A second device linked later never rewrites an earlier conversion; source is never overwritten.
DO $$
DECLARE old_first JSONB;
BEGIN
  SELECT first_touch INTO old_first FROM conversion_events WHERE entity_id = '22222222-2222-2222-2222-222222222222';
  PERFORM record_session('aloha', '33333333-3333-3333-3333-333333333333', 'tok-laptop', 'storefront',
          '/s/aloha', 'https://www.google.com/', '{}', '{"gclid":"g1"}', 'paid_search', 'desktop');
  UPDATE analytics_sessions SET started_at = NOW() - interval '30 days' WHERE session_token = 'tok-laptop';
  PERFORM link_visitor('00000000-0000-0000-0000-0000000000b1', '33333333-3333-3333-3333-333333333333', 'sign_in');
  IF (SELECT count(*) FROM profile_visitors WHERE profile_id = '00000000-0000-0000-0000-0000000000b1') <> 2
    THEN RAISE EXCEPTION 'second visitor not linked'; END IF;
  IF (SELECT first_touch FROM conversion_events WHERE entity_id = '22222222-2222-2222-2222-222222222222') <> old_first
    THEN RAISE EXCEPTION 'earlier conversion was rewritten'; END IF;
  PERFORM record_conversion('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000b1',
        NULL, 'pack_purchase', 9900, 'USD', 'transaction', '44444444-4444-4444-4444-444444444444', NULL, 'signup');
  IF (SELECT first_touch->>'channel' FROM conversion_events WHERE entity_id = '44444444-4444-4444-4444-444444444444') <> 'paid_search'
    THEN RAISE EXCEPTION 'new conversion should see the older linked device as first touch'; END IF;
  IF (SELECT source FROM studio_members WHERE profile_id = '00000000-0000-0000-0000-0000000000b1') <> 'express'
    THEN RAISE EXCEPTION 'member source was overwritten'; END IF;
END $$;

-- 4. Consent: latest row wins; default is no.
DO $$
BEGIN
  IF has_consent('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000b1', 'email_marketing')
    THEN RAISE EXCEPTION 'consent should default to false'; END IF;
  PERFORM record_consent('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000b1', NULL, 'email_marketing', TRUE, 'express_booking_form', 'v1');
  IF NOT has_consent('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000b1', 'email_marketing')
    THEN RAISE EXCEPTION 'granted consent not seen'; END IF;
  PERFORM pg_sleep(0.01);
  PERFORM record_consent('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000b1', NULL, 'email_marketing', FALSE, 'unsubscribe_link', 'v1');
  IF has_consent('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000b1', 'email_marketing')
    THEN RAISE EXCEPTION 'withdrawal should win'; END IF;
END $$;

-- 5. Owner report: only the owner's studio; revenue by first touch.
DO $$
DECLARE ig_rev BIGINT; paid_rev BIGINT; rows_for_anon BIGINT;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
  SELECT revenue_cents INTO ig_rev FROM get_attribution_sources(NOW() - interval '60 days', NOW() + interval '1 day', 'first')
    WHERE channel = 'organic_social';
  SELECT revenue_cents INTO paid_rev FROM get_attribution_sources(NOW() - interval '60 days', NOW() + interval '1 day', 'first')
    WHERE channel = 'paid_search';
  IF ig_rev <> 2200 OR paid_rev <> 9900 THEN RAISE EXCEPTION 'first-touch revenue wrong: ig % paid %', ig_rev, paid_rev; END IF;
  IF (SELECT source FROM get_member_attribution('00000000-0000-0000-0000-0000000000b1')) <> 'express'
    THEN RAISE EXCEPTION 'member attribution not visible to owner'; END IF;

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
  SELECT count(*) INTO rows_for_anon FROM get_attribution_sources(NOW() - interval '60 days', NOW() + interval '1 day', 'first');
  IF rows_for_anon <> 0 THEN RAISE EXCEPTION 'a non-staff caller saw the report'; END IF;
END $$;

-- 6. Automation candidates: facts come back.
DO $$
DECLARE r RECORD;
BEGIN
  SELECT * INTO r FROM get_automation_candidates('00000000-0000-0000-0000-00000000005a')
    WHERE profile_id = '00000000-0000-0000-0000-0000000000b1';
  IF r.profile_id IS NULL OR r.is_guest IS NOT TRUE OR r.email_consent IS NOT FALSE
    THEN RAISE EXCEPTION 'candidate facts wrong: %', r; END IF;
END $$;

-- 7. A member booking their own class counts as a conversion; a service-role
--    insert (express-book, Stripe) does not, because those paths record their own.
DO $$
DECLARE occ1 UUID := gen_random_uuid(); occ2 UUID := gen_random_uuid(); b1 UUID; b2 UUID;
BEGIN
  INSERT INTO locations (id, studio_id, name) VALUES ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000005a', 'Main');
  INSERT INTO offerings (id, studio_id, name, slug) VALUES ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-00000000005a', 'Flow', 'flow');
  INSERT INTO class_occurrences (id, studio_id, offering_id, location_id, starts_at, ends_at) VALUES
    (occ1, '00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1', NOW() + interval '1 day', NOW() + interval '1 day 1 hour'),
    (occ2, '00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1', NOW() + interval '2 day', NOW() + interval '2 day 1 hour');

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
  INSERT INTO bookings (studio_id, class_occurrence_id, profile_id) VALUES
    ('00000000-0000-0000-0000-00000000005a', occ1, '00000000-0000-0000-0000-0000000000b1') RETURNING id INTO b1;
  IF NOT EXISTS (SELECT 1 FROM conversion_events WHERE conversion_type = 'member_booking' AND entity_type = 'booking' AND entity_id = b1)
    THEN RAISE EXCEPTION 'member self-booking not recorded'; END IF;

  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO bookings (studio_id, class_occurrence_id, profile_id) VALUES
    ('00000000-0000-0000-0000-00000000005a', occ2, '00000000-0000-0000-0000-0000000000b1') RETURNING id INTO b2;
  IF EXISTS (SELECT 1 FROM conversion_events WHERE entity_id = b2)
    THEN RAISE EXCEPTION 'service-role booking should not be double counted'; END IF;
END $$;

-- 8. Sign-up consent applies once, to the studio the sign-up came from, and
--    never overrides a later choice.
DO $$
BEGIN
  INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
    ('00000000-0000-0000-0000-0000000000e1', 'kai@example.com', '{"marketing_consent": true, "marketing_consent_studio": "aloha"}'),
    ('00000000-0000-0000-0000-0000000000e2', 'lei@example.com', '{"marketing_consent": true}');

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', true);
  IF apply_my_signup_consent() IS NOT TRUE THEN RAISE EXCEPTION 'signup consent not applied'; END IF;
  IF NOT has_consent('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000e1', 'email_marketing')
    THEN RAISE EXCEPTION 'signup consent not visible'; END IF;
  PERFORM record_consent('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000e1', NULL,
    'email_marketing', FALSE, 'unsubscribe_link', '2026-10');
  IF apply_my_signup_consent() IS NOT FALSE THEN RAISE EXCEPTION 'signup consent applied twice'; END IF;
  IF has_consent('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000e1', 'email_marketing')
    THEN RAISE EXCEPTION 'signup consent overrode an unsubscribe'; END IF;

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e2', true);
  IF apply_my_signup_consent() IS NOT FALSE THEN RAISE EXCEPTION 'consent without a studio should record nothing'; END IF;
  -- OAuth sign-up: no metadata, the browser passes the kept choice, applied
  -- only to an account created just after the attempt started.
  IF apply_my_signup_consent('aloha', TRUE, NOW() + interval '2 hours') IS NOT FALSE
    THEN RAISE EXCEPTION 'pending consent applied to an account older than the attempt'; END IF;
  IF apply_my_signup_consent('aloha', TRUE, NOW()) IS NOT TRUE THEN RAISE EXCEPTION 'oauth signup consent not applied'; END IF;
  IF NOT has_consent('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000e2', 'email_marketing')
    THEN RAISE EXCEPTION 'oauth signup consent not visible'; END IF;
  IF apply_my_signup_consent('aloha', TRUE, NOW()) IS NOT FALSE THEN RAISE EXCEPTION 'oauth consent applied twice'; END IF;
END $$;

-- 9. Stripe events are claimed once.
DO $$
BEGIN
  INSERT INTO stripe_webhook_events (event_id, event_type) VALUES ('evt_test_1', 'checkout.session.completed');
  BEGIN
    INSERT INTO stripe_webhook_events (event_id, event_type) VALUES ('evt_test_1', 'checkout.session.completed');
    RAISE EXCEPTION 'replayed event was accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
END $$;

-- 10. A browser id belongs to the first person linked to it; a second person
--     signing in on the same browser gets no share of its history.
DO $$
DECLARE v UUID := gen_random_uuid(); c UUID; r RECORD;
BEGIN
  PERFORM record_session('aloha', v, 'shared-1', 'storefront', 'https://x/s/aloha?utm_source=instagram', NULL,
    '{"source":"instagram"}'::jsonb, '{}'::jsonb, 'organic_social', 'desktop');
  PERFORM link_visitor('00000000-0000-0000-0000-0000000000e1', v, 'sign_in');
  PERFORM link_visitor('00000000-0000-0000-0000-0000000000e2', v, 'sign_in');
  IF EXISTS (SELECT 1 FROM profile_visitors WHERE visitor_id = v AND profile_id = '00000000-0000-0000-0000-0000000000e2')
    THEN RAISE EXCEPTION 'second person linked to a claimed browser'; END IF;
  c := record_conversion('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000e2', v,
    'member_booking', 0, 'USD', 'booking', gen_random_uuid(), NULL, 'signup');
  SELECT * INTO r FROM conversion_events WHERE id = c;
  IF r.first_touch_session_id IS NOT NULL OR r.touch_count <> 0
    THEN RAISE EXCEPTION 'second person inherited the first person''s journey: %', r.first_touch; END IF;
END $$;

-- 11. Acquisition dates: new members default to their creation time; imports
--     are not counted as newly acquired people.
DO $$
DECLARE n BIGINT;
BEGIN
  INSERT INTO studio_members (studio_id, profile_id, source) VALUES
    ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000e1', 'import');
  IF (SELECT acquired_at FROM studio_members WHERE profile_id = '00000000-0000-0000-0000-0000000000e1'
        AND studio_id = '00000000-0000-0000-0000-00000000005a') IS NULL
    THEN RAISE EXCEPTION 'acquired_at has no default'; END IF;
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
  SELECT COALESCE(sum(new_people), 0) INTO n FROM get_attribution_sources(NOW() - interval '1 day', NOW() + interval '1 day', 'first');
  -- Ana (express guest) and lei (first conversion in block 10) are new; the import is not.
  IF n <> 2 THEN RAISE EXCEPTION 'new people should be 2 (import excluded), got %', n; END IF;
END $$;

-- 12. A signed-in member's first booking creates the studio relationship,
--     and a waitlisted booking counts once it is promoted.
DO $$
DECLARE occ UUID := gen_random_uuid(); b UUID;
BEGIN
  INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-0000000000e3', 'noa@example.com');
  INSERT INTO class_occurrences (id, studio_id, offering_id, location_id, starts_at, ends_at) VALUES
    (occ, '00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1', NOW() + interval '3 day', NOW() + interval '3 day 1 hour');

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e3', true);
  INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status) VALUES
    ('00000000-0000-0000-0000-00000000005a', occ, '00000000-0000-0000-0000-0000000000e3', 'waitlisted') RETURNING id INTO b;
  IF EXISTS (SELECT 1 FROM conversion_events WHERE entity_id = b)
    THEN RAISE EXCEPTION 'a waitlisted booking should not count yet'; END IF;

  PERFORM set_config('request.jwt.claim.sub', '', true);
  UPDATE bookings SET status = 'confirmed' WHERE id = b;
  IF NOT EXISTS (SELECT 1 FROM conversion_events WHERE conversion_type = 'member_booking' AND entity_id = b)
    THEN RAISE EXCEPTION 'promoted booking not recorded'; END IF;
  IF NOT EXISTS (SELECT 1 FROM studio_members WHERE studio_id = '00000000-0000-0000-0000-00000000005a'
                 AND profile_id = '00000000-0000-0000-0000-0000000000e3')
    THEN RAISE EXCEPTION 'conversion did not create the studio relationship'; END IF;
END $$;

-- 13. Overlapping page loads in one session make one visit.
DO $$
DECLARE v UUID := gen_random_uuid(); a UUID; b UUID;
BEGIN
  a := record_session('aloha', v, 'tok-x', 'storefront', 'https://x/s/aloha', NULL, '{}'::jsonb, '{}'::jsonb, 'direct', 'mobile');
  b := record_session('aloha', v, 'tok-x', 'booking', 'https://x/s/aloha/book/1', NULL, '{}'::jsonb, '{}'::jsonb, 'direct', 'mobile');
  IF a <> b OR (SELECT page_views FROM analytics_sessions WHERE id = a) <> 2
    THEN RAISE EXCEPTION 'same session token should be one visit'; END IF;
END $$;

-- 14. Owners read and write automation settings from a client session (no RLS
--     recursion through studio_staff); a non-staff person sees nothing.
GRANT SELECT, INSERT, UPDATE ON automation_settings, studio_staff TO authenticated;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
INSERT INTO automation_settings (studio_id, lapsed_enabled) VALUES ('00000000-0000-0000-0000-00000000005a', FALSE);
DO $$ BEGIN
  IF (SELECT count(*) FROM automation_settings) <> 1 THEN RAISE EXCEPTION 'owner cannot read settings'; END IF;
  IF (SELECT count(*) FROM studio_staff) < 1 THEN RAISE EXCEPTION 'owner cannot see co-workers'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
DO $$ BEGIN
  IF (SELECT count(*) FROM automation_settings) <> 0 THEN RAISE EXCEPTION 'non-staff can read settings'; END IF;
END $$;
RESET ROLE;

SELECT 'attribution tests passed' AS result;
ROLLBACK;
