-- 00025: attribution and email automation, phase 1 (PRD-024 steps 1-3, PRD-027 phase 1)
--
-- Functions on the 00024 tables, plus the two automation tables:
--   record_session()          anon-callable via the analytics-session Edge Function (service role)
--   link_visitor()            attach a browser/app visitor to a profile (one profile, many visitors)
--   record_conversion()       write a conversion with frozen first/converting touches; set
--                             studio_members.source/first touch the first time
--   get_attribution_sources() owner report: sessions, new people, conversions, revenue by
--                             channel/source/campaign under first- or last-touch
--   get_member_attribution()  "How they found you" for one member
--   get_automation_candidates() facts per person for the automation runner
-- All SECURITY DEFINER with fixed search_path. Writers are service-role only.

-- ===========================================================================
-- Sessions
-- ===========================================================================
CREATE UNIQUE INDEX IF NOT EXISTS uq_analytics_sessions_visit
  ON analytics_sessions (studio_id, visitor_id, session_token);

CREATE OR REPLACE FUNCTION record_session(
  p_studio_slug TEXT,
  p_visitor_id UUID,
  p_session_token TEXT,
  p_surface TEXT,
  p_landing_page_url TEXT,
  p_referrer_url TEXT,
  p_utm JSONB,
  p_click_ids JSONB,
  p_channel TEXT,
  p_device_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_studio UUID;
  v_id UUID;
  v_ref_host TEXT;
BEGIN
  SELECT id INTO v_studio FROM studios WHERE slug = p_studio_slug AND discoverable = TRUE;
  IF v_studio IS NULL THEN
    RETURN NULL;  -- unknown or private studio: record nothing, reveal nothing
  END IF;

  v_ref_host := NULLIF(substring(COALESCE(p_referrer_url, '') FROM '^[a-z]+://([^/:?#]+)'), '');

  INSERT INTO analytics_sessions (
    studio_id, session_token, visitor_id, surface,
    referrer_url, referrer_domain, landing_page_url,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    fbclid, fbc, fbp, gclid, gbraid, wbraid, ttclid, msclkid,
    channel, device_type, page_views
  ) VALUES (
    v_studio, left(p_session_token, 64), p_visitor_id, left(p_surface, 32),
    left(p_referrer_url, 1000), left(v_ref_host, 255), left(p_landing_page_url, 1000),
    left(p_utm->>'source', 200), left(p_utm->>'medium', 200), left(p_utm->>'campaign', 200),
    left(p_utm->>'content', 200), left(p_utm->>'term', 200),
    left(p_click_ids->>'fbclid', 500), left(p_click_ids->>'fbc', 500), left(p_click_ids->>'fbp', 500),
    left(p_click_ids->>'gclid', 500), left(p_click_ids->>'gbraid', 500), left(p_click_ids->>'wbraid', 500),
    left(p_click_ids->>'ttclid', 500), left(p_click_ids->>'msclkid', 500),
    left(p_channel, 32), left(p_device_type, 16), 1
  )
  -- One row per (studio, visitor, session token), atomically: a refresh or
  -- two overlapping page loads in the same session count page views on one
  -- row instead of creating a second visit.
  ON CONFLICT (studio_id, visitor_id, session_token)
    DO UPDATE SET page_views = analytics_sessions.page_views + 1
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION record_session(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_session(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT) TO service_role;

-- ===========================================================================
-- Identity
-- ===========================================================================
CREATE OR REPLACE FUNCTION link_visitor(p_profile_id UUID, p_visitor_id UUID, p_via TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_profile_id IS NULL OR p_visitor_id IS NULL THEN RETURN; END IF;
  -- A browser id belongs to the first person who signed in on it. A shared
  -- household or front-desk browser must not merge two people's journeys;
  -- the client also starts a fresh visitor id when the account changes.
  IF EXISTS (SELECT 1 FROM profile_visitors WHERE visitor_id = p_visitor_id AND profile_id <> p_profile_id) THEN
    RETURN;
  END IF;
  INSERT INTO profile_visitors (profile_id, visitor_id, linked_via)
  VALUES (p_profile_id, p_visitor_id, left(COALESCE(p_via, 'unknown'), 32))
  ON CONFLICT (profile_id, visitor_id) DO NOTHING;
  UPDATE analytics_sessions SET profile_id = p_profile_id
  WHERE visitor_id = p_visitor_id AND profile_id IS NULL;
END;
$$;
REVOKE ALL ON FUNCTION link_visitor(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION link_visitor(UUID, UUID, TEXT) TO service_role;

-- Signed-in clients link their own browser after sign-in / sign-up / claim.
-- auth.uid() decides whose profile; the caller only supplies the visitor id.
CREATE OR REPLACE FUNCTION link_my_visitor(p_visitor_id UUID, p_via TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  PERFORM link_visitor(auth.uid(), p_visitor_id, p_via);
END;
$$;
REVOKE ALL ON FUNCTION link_my_visitor(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION link_my_visitor(UUID, TEXT) TO authenticated;

-- ===========================================================================
-- Conversions
-- ===========================================================================
CREATE OR REPLACE FUNCTION session_touch(p_session_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'session_id', s.id, 'started_at', s.started_at, 'channel', s.channel, 'surface', s.surface,
    'utm_source', s.utm_source, 'utm_medium', s.utm_medium, 'utm_campaign', s.utm_campaign,
    'utm_content', s.utm_content, 'referrer_domain', s.referrer_domain,
    'landing_page_url', s.landing_page_url,
    'has_ad_click', (s.gclid IS NOT NULL OR s.gbraid IS NOT NULL OR s.wbraid IS NOT NULL
                     OR s.fbclid IS NOT NULL OR s.ttclid IS NOT NULL OR s.msclkid IS NOT NULL)
  )
  FROM analytics_sessions s WHERE s.id = p_session_id;
$$;
REVOKE ALL ON FUNCTION session_touch(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION session_touch(UUID) TO service_role;

CREATE OR REPLACE FUNCTION record_conversion(
  p_studio_id UUID,
  p_profile_id UUID,
  p_visitor_id UUID,
  p_conversion_type TEXT,
  p_value_cents INTEGER,
  p_currency TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_converting_session_id UUID,
  p_member_source TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first UUID;
  v_last UUID;
  v_count INTEGER;
  v_first_at TIMESTAMPTZ;
  v_id UUID;
BEGIN
  IF p_visitor_id IS NOT NULL AND p_profile_id IS NOT NULL THEN
    PERFORM link_visitor(p_profile_id, p_visitor_id, p_conversion_type);
  END IF;

  -- The journey: every session at this studio from any visitor linked to the
  -- person (or the anonymous visitor itself), up to now.
  WITH visitors AS (
    SELECT visitor_id FROM profile_visitors WHERE profile_id = p_profile_id
    UNION
    SELECT p_visitor_id WHERE p_visitor_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM profile_visitors pv
                      WHERE pv.visitor_id = p_visitor_id AND pv.profile_id IS DISTINCT FROM p_profile_id)
  ), journey AS (
    SELECT s.id, s.started_at FROM analytics_sessions s
    WHERE s.visitor_id IN (SELECT visitor_id FROM visitors)
      AND (p_studio_id IS NULL OR s.studio_id = p_studio_id)
      AND s.started_at <= NOW()
  )
  SELECT
    (SELECT id FROM journey ORDER BY started_at ASC, id LIMIT 1),
    (SELECT id FROM journey ORDER BY started_at DESC, id LIMIT 1),
    (SELECT count(*) FROM journey),
    (SELECT min(started_at) FROM journey)
  INTO v_first, v_last, v_count, v_first_at;

  v_last := COALESCE(p_converting_session_id, v_last);

  INSERT INTO conversion_events (
    studio_id, profile_id, visitor_id, conversion_type, value_cents, currency,
    entity_type, entity_id, first_touch_session_id, converting_touch_session_id,
    first_touch, converting_touch, touch_count, days_to_convert
  ) VALUES (
    p_studio_id, p_profile_id, p_visitor_id, p_conversion_type, p_value_cents, upper(p_currency),
    p_entity_type, p_entity_id, v_first, v_last,
    session_touch(v_first), session_touch(v_last), COALESCE(v_count, 0),
    CASE WHEN v_first_at IS NULL THEN NULL ELSE GREATEST(0, (NOW()::date - v_first_at::date)) END
  )
  ON CONFLICT (conversion_type, entity_type, entity_id) WHERE entity_id IS NOT NULL DO NOTHING
  RETURNING id INTO v_id;

  -- First time this person has a relationship with this studio: record where
  -- it came from. Never overwritten.
  -- A signed-in member's first booking or purchase may be their first contact
  -- with the studio (only express booking and import create the row
  -- otherwise), so create the relationship here if it is missing.
  IF p_studio_id IS NOT NULL AND p_profile_id IS NOT NULL THEN
    INSERT INTO studio_members (studio_id, profile_id, source, first_touch_session_id, acquired_at)
    VALUES (p_studio_id, p_profile_id, p_member_source, v_first, NOW())
    ON CONFLICT (studio_id, profile_id) DO UPDATE SET
      source = COALESCE(studio_members.source, EXCLUDED.source),
      first_touch_session_id = COALESCE(studio_members.first_touch_session_id, EXCLUDED.first_touch_session_id),
      acquired_at = COALESCE(studio_members.acquired_at, EXCLUDED.acquired_at);
  END IF;

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION record_conversion(UUID, UUID, UUID, TEXT, INTEGER, TEXT, TEXT, UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_conversion(UUID, UUID, UUID, TEXT, INTEGER, TEXT, TEXT, UUID, UUID, TEXT) TO service_role;

-- ===========================================================================
-- Consent (append-only)
-- ===========================================================================
-- NOW() is fixed for a whole transaction, so an opt-in and an opt-out written
-- in one request would tie and "latest wins" would be a coin toss. A per-row
-- clock plus a sequence makes the order total.
ALTER TABLE consent_records ALTER COLUMN captured_at SET DEFAULT clock_timestamp();
ALTER TABLE consent_records ADD COLUMN IF NOT EXISTS seq BIGSERIAL;
CREATE OR REPLACE FUNCTION record_consent(
  p_studio_id UUID, p_profile_id UUID, p_visitor_id UUID,
  p_purpose TEXT, p_granted BOOLEAN, p_source TEXT, p_policy_version TEXT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO consent_records (studio_id, profile_id, visitor_id, purpose, granted, source, policy_version)
  VALUES (p_studio_id, p_profile_id, p_visitor_id, p_purpose, p_granted, left(p_source, 64), p_policy_version);
$$;
REVOKE ALL ON FUNCTION record_consent(UUID, UUID, UUID, TEXT, BOOLEAN, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_consent(UUID, UUID, UUID, TEXT, BOOLEAN, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION has_consent(p_studio_id UUID, p_profile_id UUID, p_purpose TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT granted FROM consent_records
    WHERE profile_id = p_profile_id AND studio_id = p_studio_id AND purpose = p_purpose
    ORDER BY captured_at DESC, seq DESC LIMIT 1
  ), FALSE);
$$;
REVOKE ALL ON FUNCTION has_consent(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION has_consent(UUID, UUID, TEXT) TO service_role;

-- ===========================================================================
-- Owner reports
-- ===========================================================================
CREATE OR REPLACE FUNCTION get_attribution_sources(
  p_from TIMESTAMPTZ, p_to TIMESTAMPTZ, p_model TEXT DEFAULT 'first'
)
RETURNS TABLE (
  channel TEXT, utm_source TEXT, utm_campaign TEXT,
  sessions BIGINT, new_people BIGINT, bookings BIGINT, purchases BIGINT, revenue_cents BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH my AS (
    SELECT ss.studio_id FROM studio_staff ss
    WHERE ss.profile_id = auth.uid() AND ss.is_active = TRUE
      AND ss.role IN ('owner', 'admin')
    ORDER BY ss.created_at ASC LIMIT 1
  ),
  sess AS (
    SELECT COALESCE(s.channel, 'direct') AS channel, COALESCE(s.utm_source, s.referrer_domain, '') AS utm_source,
           COALESCE(s.utm_campaign, '') AS utm_campaign, count(*) AS sessions
    FROM analytics_sessions s, my
    WHERE s.studio_id = my.studio_id AND s.started_at >= p_from AND s.started_at < p_to
    GROUP BY 1, 2, 3
  ),
  conv AS (
    SELECT
      COALESCE(t->>'channel', 'unknown') AS channel,
      COALESCE(t->>'utm_source', t->>'referrer_domain', '') AS utm_source,
      COALESCE(t->>'utm_campaign', '') AS utm_campaign,
      count(*) FILTER (WHERE c.conversion_type IN ('guest_booking', 'member_booking')) AS bookings,
      count(*) FILTER (WHERE COALESCE(c.value_cents, 0) > 0) AS purchases,
      COALESCE(sum(c.value_cents), 0) AS revenue_cents
    FROM conversion_events c, my,
      LATERAL (SELECT CASE WHEN p_model = 'last' THEN c.converting_touch ELSE c.first_touch END AS t) x
    WHERE c.studio_id = my.studio_id AND c.occurred_at >= p_from AND c.occurred_at < p_to
    GROUP BY 1, 2, 3
  ),
  people AS (
    SELECT COALESCE(s.channel, 'unknown') AS channel, COALESCE(s.utm_source, s.referrer_domain, '') AS utm_source,
           COALESCE(s.utm_campaign, '') AS utm_campaign, count(*) AS new_people
    FROM studio_members m
    JOIN my ON my.studio_id = m.studio_id
    LEFT JOIN analytics_sessions s ON s.id = m.first_touch_session_id
    WHERE m.acquired_at >= p_from AND m.acquired_at < p_to
      AND m.source IS DISTINCT FROM 'import'   -- moved over from another system, not acquired
    GROUP BY 1, 2, 3
  )
  SELECT k.channel, NULLIF(k.utm_source, ''), NULLIF(k.utm_campaign, ''),
         COALESCE(sess.sessions, 0), COALESCE(people.new_people, 0),
         COALESCE(conv.bookings, 0), COALESCE(conv.purchases, 0), COALESCE(conv.revenue_cents, 0)
  FROM (
    SELECT channel, utm_source, utm_campaign FROM sess
    UNION SELECT channel, utm_source, utm_campaign FROM conv
    UNION SELECT channel, utm_source, utm_campaign FROM people
  ) k
  LEFT JOIN sess USING (channel, utm_source, utm_campaign)
  LEFT JOIN conv USING (channel, utm_source, utm_campaign)
  LEFT JOIN people USING (channel, utm_source, utm_campaign)
  ORDER BY COALESCE(conv.revenue_cents, 0) DESC, COALESCE(sess.sessions, 0) DESC;
$$;
REVOKE ALL ON FUNCTION get_attribution_sources(TIMESTAMPTZ, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_attribution_sources(TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION get_member_attribution(p_profile_id UUID)
RETURNS TABLE (
  source TEXT, acquired_at TIMESTAMPTZ, first_touch JSONB,
  conversions JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH my AS (
    SELECT ss.studio_id FROM studio_staff ss
    WHERE ss.profile_id = auth.uid() AND ss.is_active = TRUE
    ORDER BY ss.created_at ASC LIMIT 1
  )
  SELECT m.source, m.acquired_at, session_touch(m.first_touch_session_id),
         COALESCE((
           SELECT jsonb_agg(jsonb_build_object(
             'type', c.conversion_type, 'value_cents', c.value_cents, 'currency', c.currency,
             'occurred_at', c.occurred_at, 'first_touch', c.first_touch,
             'converting_touch', c.converting_touch, 'days_to_convert', c.days_to_convert
           ) ORDER BY c.occurred_at)
           FROM conversion_events c WHERE c.studio_id = m.studio_id AND c.profile_id = m.profile_id
         ), '[]'::jsonb)
  FROM studio_members m JOIN my ON my.studio_id = m.studio_id
  WHERE m.profile_id = p_profile_id;
$$;
REVOKE ALL ON FUNCTION get_member_attribution(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_member_attribution(UUID) TO authenticated;

-- ===========================================================================
-- Staff authorization without RLS recursion (PR #72 review)
-- ===========================================================================
-- 00001's "Staff can view co-workers" policy on studio_staff queries
-- studio_staff, so any policy that looks at studio_staff from a client
-- session fails with "infinite recursion detected" (00017 and 00020 worked
-- around it per call). These helpers read studio_staff as the function owner,
-- outside RLS, and the co-workers policy is rebuilt on top of them, which
-- fixes every staff policy that reads studio_staff, old and new.
CREATE OR REPLACE FUNCTION my_staff_studio_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Matches 00001's policy exactly (it did not filter on is_active).
  SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION my_staff_studio_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION my_staff_studio_ids() TO authenticated;

CREATE OR REPLACE FUNCTION is_studio_staff(p_studio_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM studio_staff
                 WHERE studio_id = p_studio_id AND profile_id = auth.uid() AND is_active = TRUE);
$$;
REVOKE ALL ON FUNCTION is_studio_staff(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_studio_staff(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION is_studio_admin(p_studio_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM studio_staff
                 WHERE studio_id = p_studio_id AND profile_id = auth.uid() AND is_active = TRUE
                   AND role IN ('owner', 'admin'));
$$;
REVOKE ALL ON FUNCTION is_studio_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_studio_admin(UUID) TO authenticated;

-- Same rows as before (co-workers at studios where I am staff), no recursion.
DROP POLICY IF EXISTS "Staff can view co-workers" ON studio_staff;
CREATE POLICY "Staff can view co-workers"
  ON studio_staff FOR SELECT
  USING (studio_id IN (SELECT my_staff_studio_ids()));

-- The 00024 staff-read policies, rebuilt on the helpers.
DROP POLICY IF EXISTS conversion_events_staff_read ON conversion_events;
CREATE POLICY conversion_events_staff_read ON conversion_events
  FOR SELECT TO authenticated USING (is_studio_staff(studio_id));
DROP POLICY IF EXISTS consent_records_staff_read ON consent_records;
CREATE POLICY consent_records_staff_read ON consent_records
  FOR SELECT TO authenticated USING (studio_id IS NOT NULL AND is_studio_staff(studio_id));
DROP POLICY IF EXISTS ad_integrations_admin_read ON ad_integrations;
CREATE POLICY ad_integrations_admin_read ON ad_integrations
  FOR SELECT TO authenticated USING (is_studio_admin(studio_id));
DROP POLICY IF EXISTS conversion_deliveries_admin_read ON conversion_deliveries;
CREATE POLICY conversion_deliveries_admin_read ON conversion_deliveries
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM ad_integrations ai
                 WHERE ai.id = conversion_deliveries.ad_integration_id AND is_studio_admin(ai.studio_id)));

-- ===========================================================================
-- Email automations (phase 1: three sequences)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS automation_settings (
  studio_id UUID PRIMARY KEY REFERENCES studios(id) ON DELETE CASCADE,
  guest_to_member_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  first_visit_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  lapsed_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  lapsed_days_override INTEGER CHECK (lapsed_days_override IS NULL OR lapsed_days_override BETWEEN 7 AND 120),
  intro_offer_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE automation_settings IS
  'Per-studio switches for the phase-1 automations. A studio with no row gets the defaults (all on). Owners/admins edit via /manage.';

CREATE TABLE IF NOT EXISTS automation_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  automation_key TEXT NOT NULL CHECK (automation_key IN ('guest_to_member', 'first_visit', 'lapsed')),
  step INTEGER NOT NULL,
  episode_key TEXT NOT NULL,            -- e.g. the lapse's last-visit date, so a person lapses once per episode
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (studio_id, profile_id, automation_key, step, episode_key)
);
CREATE INDEX IF NOT EXISTS idx_automation_sends_recent ON automation_sends(profile_id, sent_at DESC);

ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automation_settings_admin ON automation_settings;
CREATE POLICY automation_settings_admin ON automation_settings
  FOR ALL TO authenticated
  USING (is_studio_admin(studio_id))
  WITH CHECK (is_studio_admin(studio_id));

DROP POLICY IF EXISTS automation_sends_staff_read ON automation_sends;
CREATE POLICY automation_sends_staff_read ON automation_sends
  FOR SELECT TO authenticated
  USING (is_studio_staff(studio_id));

-- Facts per person for the runner (src/lib/marketing/automations.ts decides).
CREATE OR REPLACE FUNCTION get_automation_candidates(p_studio_id UUID)
RETURNS TABLE (
  profile_id UUID, email TEXT, first_name TEXT,
  is_guest BOOLEAN, claimed_at TIMESTAMPTZ,
  email_consent BOOLEAN,
  first_booking_at TIMESTAMPTZ, guest_booking_at TIMESTAMPTZ,
  first_check_in_at TIMESTAMPTZ, last_visit_at TIMESTAMPTZ,
  visit_count BIGINT, booking_count BIGINT, median_gap_days NUMERIC,
  has_active_membership BOOLEAN, has_active_pack BOOLEAN,
  sends JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH members AS (
    SELECT m.profile_id FROM studio_members m WHERE m.studio_id = p_studio_id
  ),
  b AS (
    SELECT bk.profile_id, bk.created_at, bk.checked_in_at, bk.status
    FROM bookings bk JOIN members USING (profile_id)
    WHERE bk.studio_id = p_studio_id AND bk.status NOT IN ('cancelled', 'late_cancel')
  ),
  visits AS (
    SELECT profile_id, checked_in_at,
           checked_in_at - lag(checked_in_at) OVER (PARTITION BY profile_id ORDER BY checked_in_at) AS gap
    FROM b WHERE checked_in_at IS NOT NULL
  )
  SELECT
    p.id, p.email, p.first_name,
    COALESCE(p.is_guest, FALSE), p.claimed_at,
    has_consent(p_studio_id, p.id, 'email_marketing'),
    (SELECT min(created_at) FROM b WHERE b.profile_id = p.id),
    -- Latest guest booking: the follow-up is about the visit that just happened.
    CASE WHEN COALESCE(p.is_guest, FALSE) THEN (SELECT max(created_at) FROM b WHERE b.profile_id = p.id) END,
    (SELECT min(checked_in_at) FROM visits v WHERE v.profile_id = p.id),
    (SELECT max(checked_in_at) FROM visits v WHERE v.profile_id = p.id),
    (SELECT count(*) FROM visits v WHERE v.profile_id = p.id),
    (SELECT count(*) FROM b WHERE b.profile_id = p.id),
    (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM gap) / 86400.0)
       FROM visits v WHERE v.profile_id = p.id AND gap IS NOT NULL)::numeric,
    EXISTS (SELECT 1 FROM memberships ms WHERE ms.profile_id = p.id AND ms.studio_id = p_studio_id
            AND ms.status IN ('active', 'paused', 'past_due')),
    EXISTS (SELECT 1 FROM class_packs cp WHERE cp.profile_id = p.id AND cp.studio_id = p_studio_id
            AND cp.status = 'active' AND COALESCE(cp.classes_remaining, 0) > 0
            AND (cp.expires_at IS NULL OR cp.expires_at > NOW())),
    COALESCE((SELECT jsonb_agg(jsonb_build_object('key', s.automation_key, 'step', s.step,
                'episode', s.episode_key, 'sent_at', s.sent_at))
              FROM automation_sends s WHERE s.profile_id = p.id AND s.studio_id = p_studio_id), '[]'::jsonb)
  FROM profiles p JOIN members ON members.profile_id = p.id
  WHERE p.email IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION get_automation_candidates(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_automation_candidates(UUID) TO service_role;

-- ===========================================================================
-- Member bookings made by the member themselves (PR #72 review)
-- ===========================================================================
-- book_class() and book_free_class() run as the signed-in member. Count those
-- bookings as conversions without touching the booking functions: an AFTER
-- INSERT trigger fires only when the inserting session IS the member
-- (auth.uid() = profile_id). Service-role paths (express-book, the Stripe
-- webhook's drop-in booking) have no auth.uid() and record their own
-- conversion with the converting session and the payment. Analytics never
-- blocks a booking: any error here is swallowed.
CREATE OR REPLACE FUNCTION record_member_booking_conversion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND auth.uid() IS NOT NULL AND auth.uid() = NEW.profile_id THEN
    BEGIN
      PERFORM record_conversion(
        NEW.studio_id, NEW.profile_id, NULL, 'member_booking', 0,
        (SELECT currency FROM studios WHERE id = NEW.studio_id),
        'booking', NEW.id, NULL, 'signup'
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'record_member_booking_conversion: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_member_booking_conversion ON bookings;
CREATE TRIGGER trg_member_booking_conversion
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION record_member_booking_conversion();

-- A waitlisted booking that gets promoted becomes a booking then, whoever
-- triggers the promotion (a cancellation, staff, a job). Paths that record
-- their own conversion never record a waitlisted booking, and the per-entity
-- unique index stops any duplicate.
CREATE OR REPLACE FUNCTION record_promoted_booking_conversion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'waitlisted' AND NEW.status = 'confirmed' THEN
    BEGIN
      PERFORM record_conversion(
        NEW.studio_id, NEW.profile_id, NULL,
        CASE WHEN (SELECT COALESCE(is_guest, FALSE) FROM profiles WHERE id = NEW.profile_id)
             THEN 'guest_booking' ELSE 'member_booking' END,
        0, (SELECT currency FROM studios WHERE id = NEW.studio_id),
        'booking', NEW.id, NULL, NULL
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'record_promoted_booking_conversion: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_promoted_booking_conversion ON bookings;
CREATE TRIGGER trg_promoted_booking_conversion
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION record_promoted_booking_conversion();

-- ===========================================================================
-- Signup consent, scoped to the studio the person signed up from (PR #72 review)
-- ===========================================================================
-- Register stores marketing_consent and, when the sign-up started on a studio
-- page, marketing_consent_studio (the slug) in the auth metadata. Applied on
-- sign-in (email confirmation means there is no session at sign-up), once:
-- a later change of mind is recorded by the unsubscribe link or a settings
-- toggle and is never overwritten by this. A sign-up from no studio page
-- records nothing: consent is to a sender, not to Tandava in general.
CREATE OR REPLACE FUNCTION apply_my_signup_consent(
  p_studio_slug TEXT DEFAULT NULL, p_granted BOOLEAN DEFAULT NULL, p_started_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meta JSONB;
  v_created TIMESTAMPTZ;
  v_slug TEXT;
  v_granted BOOLEAN;
  v_studio UUID;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  SELECT raw_user_meta_data, created_at INTO v_meta, v_created FROM auth.users WHERE id = auth.uid();
  -- Email sign-ups carry the choice in metadata; OAuth sign-ups (no metadata)
  -- pass the choice the browser kept across the redirect. Either way it is
  -- the person's own choice about their own email.
  IF COALESCE(v_meta->>'marketing_consent_studio', '') <> '' THEN
    v_slug := v_meta->>'marketing_consent_studio';
    v_granted := COALESCE((v_meta->>'marketing_consent')::boolean, FALSE);
  ELSIF p_studio_slug IS NOT NULL AND p_granted IS NOT NULL AND p_started_at IS NOT NULL
        -- Only the account this browser just created: one made within an hour
        -- after the Google sign-up started. A cancelled attempt followed by
        -- someone else signing in to an existing account applies nothing.
        AND v_created BETWEEN p_started_at - interval '5 minutes' AND p_started_at + interval '1 hour' THEN
    v_slug := p_studio_slug;
    v_granted := p_granted;
  ELSE
    RETURN FALSE;
  END IF;
  SELECT id INTO v_studio FROM studios WHERE slug = v_slug;
  IF v_studio IS NULL THEN RETURN FALSE; END IF;
  IF EXISTS (
    SELECT 1 FROM consent_records
    WHERE studio_id = v_studio AND profile_id = auth.uid() AND purpose = 'email_marketing'
  ) THEN
    RETURN FALSE;
  END IF;
  INSERT INTO consent_records (studio_id, profile_id, purpose, granted, source, policy_version)
  VALUES (v_studio, auth.uid(), 'email_marketing', v_granted, 'signup_form', '2026-10');
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION apply_my_signup_consent(TEXT, BOOLEAN, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION apply_my_signup_consent(TEXT, BOOLEAN, TIMESTAMPTZ) TO authenticated;

-- ===========================================================================
-- Stripe webhook idempotency (PR #72 review)
-- ===========================================================================
-- Stripe redelivers events. The webhook claims each checkout event id here
-- (processing), fulfils, then marks it completed. A redelivery of a completed
-- event stops; one still processing within 10 minutes gets a 503 so Stripe
-- retries later; an older processing claim (the function died) is taken over
-- and fulfilled again.
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  -- processing: claimed, fulfilment under way (or the function died mid-way);
  -- completed: fulfilled. Only completed events are skipped on redelivery.
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies: service role only.

-- ===========================================================================
-- Acquisition dates (PR #72 review)
-- ===========================================================================
-- Existing members keep the date they joined; without this the first booking
-- after deploy would stamp them as acquired today. New rows default to their
-- creation time; record_conversion() only fills a still-null value.
UPDATE studio_members SET acquired_at = created_at WHERE acquired_at IS NULL;
ALTER TABLE studio_members ALTER COLUMN acquired_at SET DEFAULT NOW();
