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

SELECT 'attribution tests passed' AS result;
ROLLBACK;
