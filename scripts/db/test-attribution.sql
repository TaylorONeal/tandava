-- Behaviour tests for 00024/00035 (attribution, consent, automations).
-- Run by `npm run test:db` (supabase/tests/run.sh), or by hand after
-- scripts/db/verify-migrations.sh:
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

-- 9. (Stripe event idempotency is main's stripe_events ledger, 00031; tested
--    in supabase/tests/060_payments.test.sql. Paid conversions: block 22.)

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

-- 11. Acquisition dates: a member row alone is not an acquisition; imports
--     are not counted as newly acquired people.
DO $$
DECLARE n BIGINT;
BEGIN
  INSERT INTO studio_members (studio_id, profile_id, source) VALUES
    ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000e1', 'import');
  -- No conversion yet (an abandoned checkout looks like this): not acquired.
  IF (SELECT acquired_at FROM studio_members WHERE profile_id = '00000000-0000-0000-0000-0000000000e1'
        AND studio_id = '00000000-0000-0000-0000-00000000005a') IS NOT NULL
    THEN RAISE EXCEPTION 'acquired_at set before any conversion'; END IF;
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
  IF (SELECT has_upcoming_booking FROM get_automation_candidates('00000000-0000-0000-0000-00000000005a')
      WHERE profile_id = '00000000-0000-0000-0000-0000000000e3') IS NOT TRUE
    THEN RAISE EXCEPTION 'upcoming booking not reported to the runner'; END IF;
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

-- 15. A former owner (inactive staff row) keeps no access.
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-0000000000f1', 'former@example.com');
INSERT INTO studio_staff (studio_id, profile_id, role, is_active)
VALUES ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000f1', 'owner', FALSE);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000f1', true);
DO $$ BEGIN
  IF (SELECT count(*) FROM studio_staff) <> 0 THEN RAISE EXCEPTION 'former owner still sees staff rows'; END IF;
  IF (SELECT count(*) FROM automation_settings) <> 0 THEN RAISE EXCEPTION 'former owner still reads settings'; END IF;
  IF is_studio_admin('00000000-0000-0000-0000-00000000005a') THEN RAISE EXCEPTION 'former owner still admin'; END IF;
END $$;
RESET ROLE;

-- 16. A guest only on the waitlist has no guest follow-up yet; members from
--     before tracking are not counted as new.
DO $$
DECLARE occ UUID := gen_random_uuid(); n BIGINT;
BEGIN
  INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-0000000000e4', 'wai@example.com');
  UPDATE profiles SET is_guest = TRUE WHERE id = '00000000-0000-0000-0000-0000000000e4';
  INSERT INTO studio_members (studio_id, profile_id, source)
  VALUES ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000e4', 'pre_tracking');
  INSERT INTO class_occurrences (id, studio_id, offering_id, location_id, starts_at, ends_at) VALUES
    (occ, '00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1', NOW() + interval '4 day', NOW() + interval '4 day 1 hour');
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status)
  VALUES ('00000000-0000-0000-0000-00000000005a', occ, '00000000-0000-0000-0000-0000000000e4', 'waitlisted');
  IF (SELECT guest_booking_at FROM get_automation_candidates('00000000-0000-0000-0000-00000000005a')
      WHERE profile_id = '00000000-0000-0000-0000-0000000000e4') IS NOT NULL
    THEN RAISE EXCEPTION 'waitlisted guest started a follow-up'; END IF;

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
  SELECT COALESCE(sum(new_people), 0) INTO n FROM get_attribution_sources(NOW() - interval '1 day', NOW() + interval '1 day', 'first');
  -- Ana, lei and noa; not the import (block 11) and not the pre-tracking member.
  IF n <> 3 THEN RAISE EXCEPTION 'new people should be 3, got %', n; END IF;
END $$;

-- 17. A renewal keeps no converting visit and reports as its own channel.
DO $$
DECLARE c UUID; ch TEXT;
BEGIN
  c := record_conversion('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000b1', NULL,
    'membership_renewal', 5000, 'USD', 'stripe_invoice', gen_random_uuid(), NULL, NULL);
  IF (SELECT converting_touch_session_id FROM conversion_events WHERE id = c) IS NOT NULL
    THEN RAISE EXCEPTION 'renewal borrowed a visit'; END IF;
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
  SELECT channel INTO ch FROM get_attribution_sources(NOW() - interval '1 day', NOW() + interval '1 day', 'last')
    WHERE revenue_cents = 5000;
  IF ch IS DISTINCT FROM 'renewal' THEN RAISE EXCEPTION 'renewal channel %', ch; END IF;
END $$;

-- 18. A member booking credits the booking page's own session (request
--     header), but only a session that belongs to that member.
DO $$
DECLARE v UUID := gen_random_uuid(); mine UUID; theirs UUID; occ UUID := gen_random_uuid(); occ2 UUID := gen_random_uuid(); b UUID; b2 UUID;
BEGIN
  INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-0000000000e5', 'kim@example.com');
  mine := record_session('aloha', v, 'kim-1', 'booking', 'https://x/s/aloha/book/1?utm_source=newsletter&utm_medium=email', NULL,
    '{"source":"newsletter","medium":"email"}'::jsonb, '{}'::jsonb, 'email', 'mobile');
  PERFORM link_visitor('00000000-0000-0000-0000-0000000000e5', v, 'sign_in');
  theirs := record_session('aloha', gen_random_uuid(), 'other-1', 'storefront', 'https://x/s/aloha', NULL, '{}'::jsonb, '{}'::jsonb, 'direct', 'desktop');
  INSERT INTO class_occurrences (id, studio_id, offering_id, location_id, starts_at, ends_at) VALUES
    (occ, '00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1', NOW() + interval '5 day', NOW() + interval '5 day 1 hour'),
    (occ2, '00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1', NOW() + interval '6 day', NOW() + interval '6 day 1 hour');

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e5', true);
  PERFORM set_config('request.headers', json_build_object('x-tandava-session', mine)::text, true);
  INSERT INTO bookings (studio_id, class_occurrence_id, profile_id) VALUES ('00000000-0000-0000-0000-00000000005a', occ, '00000000-0000-0000-0000-0000000000e5') RETURNING id INTO b;
  IF (SELECT converting_touch_session_id FROM conversion_events WHERE entity_id = b) IS DISTINCT FROM mine
    THEN RAISE EXCEPTION 'booking page session not credited'; END IF;

  PERFORM set_config('request.headers', json_build_object('x-tandava-session', theirs)::text, true);
  INSERT INTO bookings (studio_id, class_occurrence_id, profile_id) VALUES ('00000000-0000-0000-0000-00000000005a', occ2, '00000000-0000-0000-0000-0000000000e5') RETURNING id INTO b2;
  IF (SELECT converting_touch_session_id FROM conversion_events WHERE entity_id = b2) = theirs
    THEN RAISE EXCEPTION 'someone else''s session was credited'; END IF;
  PERFORM set_config('request.headers', '', true);
END $$;

-- 19. Queued conversions are retried and removed.
DO $$
DECLARE bid UUID := gen_random_uuid(); n INTEGER;
BEGIN
  INSERT INTO conversion_retry_queue (args) VALUES (jsonb_build_object(
    'p_studio_id', '00000000-0000-0000-0000-00000000005a', 'p_profile_id', '00000000-0000-0000-0000-0000000000b1',
    'p_visitor_id', NULL, 'p_conversion_type', 'member_booking', 'p_value_cents', 0, 'p_currency', 'USD',
    'p_entity_type', 'booking', 'p_entity_id', bid, 'p_converting_session_id', NULL, 'p_member_source', 'signup'));
  n := retry_queued_conversions(10);
  IF n <> 1 OR EXISTS (SELECT 1 FROM conversion_retry_queue) OR NOT EXISTS (SELECT 1 FROM conversion_events WHERE entity_id = bid)
    THEN RAISE EXCEPTION 'queued conversion not retried (%)', n; END IF;
END $$;

-- 20. A retried conversion keeps its own time: later visits stay out of the
--     journey, and occurred_at is the original moment.
DO $$
DECLARE v UUID := gen_random_uuid(); early UUID; late UUID; c UUID; r conversion_events%ROWTYPE; bid UUID := gen_random_uuid();
BEGIN
  early := record_session('aloha', v, 'when-1', 'storefront', 'https://x/s/aloha?utm_source=ig', NULL,
    '{"source":"ig"}'::jsonb, '{}'::jsonb, 'organic_social', 'mobile');
  UPDATE analytics_sessions SET started_at = NOW() - interval '3 days' WHERE id = early;
  late := record_session('aloha', v, 'when-2', 'storefront', 'https://x/s/aloha', NULL, '{}'::jsonb, '{}'::jsonb, 'direct', 'mobile');
  UPDATE analytics_sessions SET started_at = NOW() - interval '1 day' WHERE id = late;
  INSERT INTO conversion_retry_queue (args) VALUES (jsonb_build_object(
    'p_studio_id', '00000000-0000-0000-0000-00000000005a', 'p_profile_id', NULL,
    'p_visitor_id', v, 'p_conversion_type', 'guest_booking', 'p_value_cents', 0, 'p_currency', 'USD',
    'p_entity_type', 'booking', 'p_entity_id', bid, 'p_converting_session_id', NULL, 'p_member_source', 'express',
    'p_occurred_at', NOW() - interval '2 days'));
  PERFORM retry_queued_conversions(10);
  SELECT * INTO r FROM conversion_events WHERE entity_id = bid;
  IF r.touch_count <> 1 OR r.converting_touch_session_id IS DISTINCT FROM early
    THEN RAISE EXCEPTION 'a visit after the conversion joined its journey (% touches)', r.touch_count; END IF;
  IF r.occurred_at > NOW() - interval '47 hours' THEN RAISE EXCEPTION 'retry moved the conversion to %', r.occurred_at; END IF;
END $$;

-- 21. Reports follow the studio the UI asks for: an owner gets their studio's
--     rows, and a studio they don't manage returns nothing.
DO $$
DECLARE n BIGINT;
BEGIN
  INSERT INTO studios (id, name, slug, timezone, currency, discoverable)
  VALUES ('00000000-0000-0000-0000-00000000005b', 'Other Studio', 'other', 'UTC', 'EUR', TRUE);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
  SELECT count(*) INTO n FROM get_attribution_sources(NOW() - interval '60 days', NOW() + interval '1 day', 'first',
    '00000000-0000-0000-0000-00000000005a');
  IF n = 0 THEN RAISE EXCEPTION 'owner got no rows for their own studio'; END IF;
  SELECT count(*) INTO n FROM get_attribution_sources(NOW() - interval '60 days', NOW() + interval '1 day', 'first',
    '00000000-0000-0000-0000-00000000005b');
  IF n <> 0 THEN RAISE EXCEPTION 'report returned rows for a studio the caller does not manage'; END IF;
  IF EXISTS (SELECT 1 FROM get_member_attribution('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000005b'))
    THEN RAISE EXCEPTION 'member attribution leaked across studios'; END IF;
  IF NOT EXISTS (SELECT 1 FROM get_member_attribution('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000005a'))
    THEN RAISE EXCEPTION 'member attribution missing for the selected studio'; END IF;
END $$;

-- 22. Paid checkouts are credited after main's SQL fulfilment (00031):
--     the type follows what fulfilment wrote, the converting visit and
--     Stripe's event time are kept, and a duplicate delivery adds nothing.
DO $$
DECLARE occ UUID := gen_random_uuid(); v UUID := gen_random_uuid(); sess UUID; s JSONB; r conversion_events%ROWTYPE;
        txn UUID; at TIMESTAMPTZ := date_trunc('second', NOW() - interval '2 hours');
BEGIN
  UPDATE offerings SET drop_in_price_cents = 2500 WHERE id = '00000000-0000-0000-0000-0000000000d1';
  INSERT INTO class_occurrences (id, studio_id, offering_id, location_id, starts_at, ends_at, capacity) VALUES
    (occ, '00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1', NOW() + interval '7 day', NOW() + interval '7 day 1 hour', 5);
  sess := record_session('aloha', v, 'paid-1', 'booking', 'https://x/s/aloha/book/1?utm_source=newsletter', NULL,
    '{"source":"newsletter"}'::jsonb, '{}'::jsonb, 'email', 'mobile');
  UPDATE analytics_sessions SET started_at = at - interval '1 hour' WHERE id = sess;
  -- A later visit in another tab: the checkout's own visit must still win.
  PERFORM record_session('aloha', v, 'paid-2', 'storefront', 'https://x/s/aloha', NULL, '{}'::jsonb, '{}'::jsonb, 'direct', 'mobile');
  UPDATE analytics_sessions SET started_at = at - interval '30 minutes' WHERE session_token = 'paid-2';
  PERFORM set_config('request.jwt.claim.sub', '', true);
  s := jsonb_build_object('id', 'cs_attr_1', 'payment_intent', 'pi_attr_1', 'amount_total', 2500, 'currency', 'usd',
    'metadata', jsonb_build_object('type', 'drop_in', 'occurrence_id', occ, 'studio_id', '00000000-0000-0000-0000-00000000005a',
      'profile_id', '00000000-0000-0000-0000-0000000000b1', 'visitor_id', v, 'session_id', sess));
  PERFORM fulfill_stripe_checkout('evt_attr_1', 'checkout.session.completed', s);
  PERFORM record_checkout_conversion(s, at);
  SELECT id INTO txn FROM transactions WHERE stripe_checkout_session_id = 'cs_attr_1';
  SELECT * INTO r FROM conversion_events WHERE entity_type = 'transaction' AND entity_id = txn;
  IF r.conversion_type IS DISTINCT FROM 'member_booking' OR r.value_cents <> 2500 OR r.currency <> 'USD'
    THEN RAISE EXCEPTION 'paid drop-in conversion wrong: % % %', r.conversion_type, r.value_cents, r.currency; END IF;
  IF r.converting_touch_session_id IS DISTINCT FROM sess THEN RAISE EXCEPTION 'checkout visit not credited'; END IF;
  IF r.occurred_at <> at THEN RAISE EXCEPTION 'conversion time should be the Stripe event time, got %', r.occurred_at; END IF;
  -- Stripe redelivers: fulfilment is a duplicate and the conversion is not repeated.
  PERFORM fulfill_stripe_checkout('evt_attr_1', 'checkout.session.completed', s);
  PERFORM record_checkout_conversion(s, NOW());
  IF (SELECT count(*) FROM conversion_events WHERE entity_id = txn) <> 1 THEN RAISE EXCEPTION 'duplicate delivery recorded twice'; END IF;
  -- An ignored or unfulfilled session credits nothing.
  IF record_checkout_conversion('{"id":"cs_nothing","metadata":{"type":"drop_in"}}'::jsonb, NOW()) IS NOT NULL
    THEN RAISE EXCEPTION 'a session with no fulfilment was credited'; END IF;
  -- A renewal is keyed by the invoice id.
  INSERT INTO membership_types (id, studio_id, name, price_cents, billing_cycle)
    VALUES ('00000000-0000-0000-0000-0000000000a7', '00000000-0000-0000-0000-00000000005a', 'Unlimited', 12000, 'monthly');
  INSERT INTO memberships (studio_id, profile_id, membership_type_id, status, current_period_start, current_period_end, stripe_subscription_id)
    VALUES ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a7',
            'active', NOW(), NOW() + interval '1 month', 'sub_attr_1');
  PERFORM record_renewal_conversion('sub_attr_1', 'in_attr_1', 12000, 'usd', at);
  PERFORM record_renewal_conversion('sub_attr_1', 'in_attr_1', 12000, 'usd', at);
  IF (SELECT count(*) FROM conversion_events WHERE conversion_type = 'membership_renewal' AND value_cents = 12000) <> 1
    THEN RAISE EXCEPTION 'renewal not recorded exactly once'; END IF;
END $$;

-- 23. Writers and internal helpers are service-role only; member functions
--     are closed to anon (Supabase grants EXECUTE to anon by default).
DO $$
DECLARE f TEXT; bad TEXT := '';
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'record_session(text,uuid,text,text,text,text,jsonb,jsonb,text,text)', 'link_visitor(uuid,uuid,text)',
    'session_touch(uuid)', 'record_conversion(uuid,uuid,uuid,text,integer,text,text,uuid,uuid,text,timestamptz)',
    'record_consent(uuid,uuid,uuid,text,boolean,text,text)', 'confirm_email_opt_in(uuid,uuid,timestamptz)', 'lock_consent(uuid,uuid,text)', 'has_consent(uuid,uuid,text)',
    'get_automation_candidates(uuid)', 'claim_automation_send(uuid,uuid,text,integer,text)', 'record_booking_conversion_or_queue(uuid,uuid,text,uuid,uuid,text)',
    'retry_queued_conversions(integer)', 'record_conversion_or_queue(jsonb)',
    'record_checkout_conversion(jsonb,timestamptz)', 'record_renewal_conversion(text,text,integer,text,timestamptz,text)', 'conversion_refunded_cents(uuid,text,uuid)',
    'booking_session_from_request(uuid,uuid)'] LOOP
    IF has_function_privilege('anon', f, 'EXECUTE') OR has_function_privilege('authenticated', f, 'EXECUTE') THEN bad := bad || ' ' || f; END IF;
  END LOOP;
  FOREACH f IN ARRAY ARRAY[
    'link_my_visitor(uuid,text)', 'apply_my_signup_consent(text,boolean,timestamptz)',
    'get_attribution_sources(timestamptz,timestamptz,text,uuid)', 'get_member_attribution(uuid,uuid)',
    'is_studio_staff(uuid)', 'is_studio_admin(uuid)'] LOOP
    IF has_function_privilege('anon', f, 'EXECUTE') THEN bad := bad || ' anon:' || f; END IF;
  END LOOP;
  IF bad <> '' THEN RAISE EXCEPTION 'functions open to clients:%', bad; END IF;
END $$;

-- 24. Refunds come off attributed revenue; a fully refunded purchase stops
--     counting as a purchase (refunds live on the transaction, 00031).
DO $$
DECLARE rev0 BIGINT; rev1 BIGINT; rev2 BIGINT; p0 BIGINT; p2 BIGINT;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
  SELECT COALESCE(sum(revenue_cents), 0), COALESCE(sum(purchases), 0) INTO rev0, p0
    FROM get_attribution_sources(NOW() - interval '60 days', NOW() + interval '1 day', 'last', '00000000-0000-0000-0000-00000000005a');
  PERFORM record_stripe_refund('evt_ref_1', 'pi_attr_1', 'ch_attr_1', 2500, 1000);
  SELECT COALESCE(sum(revenue_cents), 0) INTO rev1
    FROM get_attribution_sources(NOW() - interval '60 days', NOW() + interval '1 day', 'last', '00000000-0000-0000-0000-00000000005a');
  IF rev0 - rev1 <> 1000 THEN RAISE EXCEPTION 'partial refund not netted: % -> %', rev0, rev1; END IF;
  PERFORM record_stripe_refund('evt_ref_2', 'pi_attr_1', 'ch_attr_1', 2500, 2500);
  SELECT COALESCE(sum(revenue_cents), 0), COALESCE(sum(purchases), 0) INTO rev2, p2
    FROM get_attribution_sources(NOW() - interval '60 days', NOW() + interval '1 day', 'last', '00000000-0000-0000-0000-00000000005a');
  IF rev0 - rev2 <> 2500 OR p0 - p2 <> 1 THEN RAISE EXCEPTION 'full refund not netted: rev % -> %, purchases % -> %', rev0, rev2, p0, p2; END IF;
END $$;

-- 25. Owner screens use a studio the caller administers, even when an older
--     assignment elsewhere is a teaching one.
DO $$
DECLARE a UUID;
BEGIN
  INSERT INTO studio_staff (studio_id, profile_id, role, is_active, created_at)
  VALUES ('00000000-0000-0000-0000-00000000005b', '00000000-0000-0000-0000-0000000000a1', 'teacher', TRUE, NOW() - interval '5 years');
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
  SELECT studio_id INTO a FROM get_my_admin_studio();
  IF a IS DISTINCT FROM '00000000-0000-0000-0000-00000000005a'::uuid THEN RAISE EXCEPTION 'admin studio should be aloha, got %', a; END IF;
  IF has_function_privilege('anon', 'get_my_admin_studio()', 'EXECUTE') THEN RAISE EXCEPTION 'get_my_admin_studio open to anon'; END IF;
END $$;

-- 26. A refunded renewal comes off too (keyed to its transaction), and the
--     member page shows the same net values as the report.
DO $$
DECLARE mem UUID; c UUID; rev0 BIGINT; rev1 BIGINT; v JSONB;
BEGIN
  SELECT id INTO mem FROM memberships WHERE stripe_subscription_id = 'sub_attr_1';
  INSERT INTO transactions (studio_id, profile_id, type, status, amount_cents, currency, stripe_payment_intent_id, membership_id)
  VALUES ('00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000b1', 'membership_renewal', 'completed',
          12000, 'USD', 'pi_ren_2', mem);
  c := record_renewal_conversion('sub_attr_1', 'in_attr_2', 12000, 'usd', NOW(), 'pi_ren_2');
  IF (SELECT entity_type FROM conversion_events WHERE id = c) <> 'transaction' THEN RAISE EXCEPTION 'renewal not keyed to its transaction'; END IF;
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
  SELECT COALESCE(sum(revenue_cents), 0) INTO rev0
    FROM get_attribution_sources(NOW() - interval '60 days', NOW() + interval '1 day', 'first', '00000000-0000-0000-0000-00000000005a');
  PERFORM record_stripe_refund('evt_ref_3', 'pi_ren_2', 'ch_ren_2', 12000, 12000);
  SELECT COALESCE(sum(revenue_cents), 0) INTO rev1
    FROM get_attribution_sources(NOW() - interval '60 days', NOW() + interval '1 day', 'first', '00000000-0000-0000-0000-00000000005a');
  IF rev0 - rev1 <> 12000 THEN RAISE EXCEPTION 'refunded renewal not netted: % -> %', rev0, rev1; END IF;
  SELECT conversions INTO v FROM get_member_attribution('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000005a');
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(v) e
             WHERE (e->>'gross_value_cents')::int = 12000 AND e->>'type' = 'membership_renewal'
               AND (e->>'value_cents')::int <> 0 AND (e->>'occurred_at')::timestamptz > NOW() - interval '1 minute')
    THEN RAISE EXCEPTION 'member page still shows the refunded renewal'; END IF;
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v) e WHERE e ? 'gross_value_cents') THEN RAISE EXCEPTION 'gross value missing'; END IF;
END $$;

-- 27. A waitlist spot keeps how it was made: an express guest who saves an
--     account and visits again before promotion is still credited to the
--     express visit that booked the spot.
DO $$
DECLARE v UUID := gen_random_uuid(); occ UUID := gen_random_uuid(); early UUID; b UUID; r conversion_events%ROWTYPE;
        g UUID := '00000000-0000-0000-0000-0000000000f7';
BEGIN
  INSERT INTO auth.users (id, email) VALUES (g, 'wait@example.com');
  UPDATE profiles SET is_guest = TRUE WHERE id = g;
  INSERT INTO class_occurrences (id, studio_id, offering_id, location_id, starts_at, ends_at) VALUES
    (occ, '00000000-0000-0000-0000-00000000005a', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1', NOW() + interval '9 day', NOW() + interval '9 day 1 hour');
  early := record_session('aloha', v, 'wl-1', 'booking', 'https://x/s/aloha/book/1?utm_source=flyer', NULL,
    '{"source":"flyer"}'::jsonb, '{}'::jsonb, 'qr', 'mobile');
  PERFORM link_visitor(g, v, 'express_booking');
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.headers', '', true);
  INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status)
  VALUES ('00000000-0000-0000-0000-00000000005a', occ, g, 'waitlisted') RETURNING id INTO b;
  -- The trigger wrote the context with the booking; express-book adds the visit.
  IF NOT EXISTS (SELECT 1 FROM booking_attribution_context WHERE booking_id = b AND origin = 'express')
    THEN RAISE EXCEPTION 'waitlist context not written with the booking'; END IF;
  UPDATE booking_attribution_context SET session_id = early WHERE booking_id = b;
  -- They save an account and come back through another link before a spot opens.
  UPDATE profiles SET is_guest = FALSE WHERE id = g;
  PERFORM record_session('aloha', v, 'wl-2', 'storefront', 'https://x/s/aloha?utm_source=ig', NULL,
    '{"source":"ig"}'::jsonb, '{}'::jsonb, 'organic_social', 'mobile');
  UPDATE bookings SET status = 'confirmed' WHERE id = b;
  SELECT * INTO r FROM conversion_events WHERE entity_type = 'booking' AND entity_id = b;
  IF r.conversion_type IS DISTINCT FROM 'guest_booking' THEN RAISE EXCEPTION 'promoted express spot recorded as %', r.conversion_type; END IF;
  IF r.converting_touch_session_id IS DISTINCT FROM early THEN RAISE EXCEPTION 'promotion credited a later visit'; END IF;
END $$;

-- 28. Two page views of one visit arriving out of order keep the campaign:
--     an untagged view that lands first is filled in by the tagged one.
DO $$
DECLARE v UUID := gen_random_uuid(); a UUID; b UUID; r analytics_sessions%ROWTYPE;
BEGIN
  a := record_session('aloha', v, 'race-1', 'storefront', 'https://x/s/aloha/classes', NULL, '{}'::jsonb, '{}'::jsonb, 'direct', 'mobile');
  b := record_session('aloha', v, 'race-1', 'storefront', 'https://x/s/aloha?utm_source=ig&utm_campaign=fall', NULL,
    '{"source":"ig","campaign":"fall"}'::jsonb, '{}'::jsonb, 'organic_social', 'mobile');
  SELECT * INTO r FROM analytics_sessions WHERE id = a;
  IF a <> b OR r.page_views <> 2 OR r.utm_source IS DISTINCT FROM 'ig' OR r.channel <> 'organic_social'
     OR r.landing_page_url NOT LIKE '%utm_source=ig%'
    THEN RAISE EXCEPTION 'tagged view lost: % % %', r.utm_source, r.channel, r.landing_page_url; END IF;
  -- Tags already on a row are never replaced.
  PERFORM record_session('aloha', v, 'race-1', 'storefront', 'https://x/s/aloha?utm_source=tiktok', NULL,
    '{"source":"tiktok"}'::jsonb, '{}'::jsonb, 'organic_social', 'mobile');
  IF (SELECT utm_source FROM analytics_sessions WHERE id = a) <> 'ig' THEN RAISE EXCEPTION 'existing tags overwritten'; END IF;
END $$;

-- 29. link_my_visitor reports ownership: true for the owner, false for
--     someone holding another person's id (a copied embed link).
DO $$
DECLARE v UUID := gen_random_uuid(); r BOOLEAN;
BEGIN
  PERFORM link_visitor('00000000-0000-0000-0000-0000000000b1', v, 'sign_in');
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
  r := link_my_visitor(v, 'sign_in');
  IF r IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'owner not reported as owner'; END IF;
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
  r := link_my_visitor(v, 'embed_handoff');
  IF r IS DISTINCT FROM FALSE THEN RAISE EXCEPTION 'foreign id not reported: %', r; END IF;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  IF link_my_visitor(v, 'x') IS NOT NULL THEN RAISE EXCEPTION 'anonymous call should return null'; END IF;
END $$;

-- 30. Daily cap is per person across studios: another studio's send from the
--     last day comes back flagged other_studio; its older sends do not.
DO $$
DECLARE sends JSONB;
BEGIN
  INSERT INTO automation_sends (studio_id, profile_id, automation_key, step, episode_key, status, sent_at) VALUES
    ('00000000-0000-0000-0000-00000000005b', '00000000-0000-0000-0000-0000000000b1', 'lapsed', 0, 'x-recent', 'sent', NOW() - interval '2 hours'),
    ('00000000-0000-0000-0000-00000000005b', '00000000-0000-0000-0000-0000000000b1', 'lapsed', 0, 'x-old', 'sent', NOW() - interval '3 days');
  SELECT c.sends INTO sends FROM get_automation_candidates('00000000-0000-0000-0000-00000000005a') c
    WHERE c.profile_id = '00000000-0000-0000-0000-0000000000b1';
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(sends) e WHERE e->>'episode' = 'x-recent' AND (e->>'other_studio')::boolean)
    THEN RAISE EXCEPTION 'recent other-studio send missing: %', sends; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(sends) e WHERE e->>'episode' = 'x-old')
    THEN RAISE EXCEPTION 'old other-studio send leaked: %', sends; END IF;
END $$;

-- 31. claim_automation_send enforces the per-person daily cap across studios.
DO $$
DECLARE p UUID := '00000000-0000-0000-0000-0000000000a1'; a UUID; b UUID;
BEGIN
  DELETE FROM automation_sends WHERE profile_id = p;
  a := claim_automation_send('00000000-0000-0000-0000-00000000005a', p, 'lapsed', 0, 'cap-a');
  b := claim_automation_send('00000000-0000-0000-0000-00000000005b', p, 'lapsed', 0, 'cap-b');
  IF a IS NULL OR b IS NOT NULL THEN RAISE EXCEPTION 'cross-studio cap not enforced: % %', a, b; END IF;
  UPDATE automation_sends SET status = 'failed' WHERE id = a;
  b := claim_automation_send('00000000-0000-0000-0000-00000000005b', p, 'lapsed', 0, 'cap-b');
  IF b IS NULL THEN RAISE EXCEPTION 'a failed send should not count toward the cap'; END IF;
END $$;

-- 32. A device linked after the conversion time does not join that
--     conversion's journey; the converting browser still does.
DO $$
DECLARE p UUID := '00000000-0000-0000-0000-0000000000a1';
  v_conv UUID := gen_random_uuid(); v_late UUID := gen_random_uuid();
  s_conv UUID; s_late UUID; c UUID; r conversion_events%ROWTYPE;
BEGIN
  s_conv := record_session('aloha', v_conv, 'tok-conv', 'storefront', 'https://x/s/aloha', NULL, '{}', '{}', 'direct', 'mobile');
  s_late := record_session('aloha', v_late, 'tok-late', 'storefront', 'https://x/s/aloha', NULL, '{}', '{}', 'paid_search', 'desktop');
  UPDATE analytics_sessions SET started_at = NOW() - interval '5 days' WHERE id = s_conv;
  UPDATE analytics_sessions SET started_at = NOW() - interval '10 days' WHERE id = s_late;
  -- The other device was linked just now, after the purchase two days ago.
  PERFORM link_visitor(p, v_late, 'sign_in');
  c := record_conversion('00000000-0000-0000-0000-00000000005a', p, v_conv, 'purchase', 5000, 'usd', 'transaction',
        gen_random_uuid(), s_conv, NULL, NOW() - interval '2 days');
  SELECT * INTO r FROM conversion_events WHERE id = c;
  IF r.first_touch_session_id IS DISTINCT FROM s_conv OR r.touch_count <> 1 THEN
    RAISE EXCEPTION 'late-linked device joined the journey: first % count %', r.first_touch_session_id, r.touch_count; END IF;
END $$;

-- 33. confirm_email_opt_in: an opt-out after the link was issued wins; an
--     earlier one doesn't block a fresh confirmation.
DO $$
DECLARE st UUID := '00000000-0000-0000-0000-00000000005b'; p UUID := '00000000-0000-0000-0000-0000000000a1';
  issued TIMESTAMPTZ := clock_timestamp(); r TEXT;
BEGIN
  PERFORM record_consent(st, p, NULL, 'email_marketing', FALSE, 'unsubscribe_link', '2026-10');
  r := confirm_email_opt_in(st, p, issued);
  IF r <> 'superseded' OR has_consent(st, p, 'email_marketing') THEN RAISE EXCEPTION 'stale confirmation reversed an opt-out: %', r; END IF;
  r := confirm_email_opt_in(st, p, clock_timestamp());
  IF r <> 'confirmed' OR NOT has_consent(st, p, 'email_marketing') THEN RAISE EXCEPTION 'fresh confirmation not recorded: %', r; END IF;
END $$;

DO $$ BEGIN RAISE NOTICE 'PASS ATTR-ALL  attribution, consent, automations and paid conversions (33 blocks)'; END $$;
ROLLBACK;
