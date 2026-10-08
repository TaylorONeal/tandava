-- 00024: attribution, consent and ad-measurement foundation (PRD-024, PRD-027)
--
-- Tables only. Nothing in the app writes to these yet; they exist so that the
-- first capture code (PRD-024 build step 1) and, much later, ad-platform
-- delivery (PRD-027) land on a schema that already has the right shape:
--   - one visitor id per browser/app install, many visitors per profile
--   - ad click ids captured at the first touch, frozen onto conversions
--   - consent recorded per purpose, append-only, with its source
--   - every conversion has a stable event_id (Meta/TikTok dedupe with the
--     browser pixel) and an outbox row per destination, so a failed upload
--     retries without double-counting
--   - ad-platform credentials are referenced in Supabase Vault, never stored
--     in a table
-- All writes are service-role only (Edge Functions). Studio staff can read
-- their own studio's rows. Members and anon have no access.

-- ---------------------------------------------------------------------------
-- 1. Sessions: visitor id and click ids on the existing analytics_sessions
-- ---------------------------------------------------------------------------
ALTER TABLE analytics_sessions
  ADD COLUMN IF NOT EXISTS visitor_id UUID,
  ADD COLUMN IF NOT EXISTS surface TEXT,            -- storefront, booking, embed, landing, blog, teacher, app, short_link
  ADD COLUMN IF NOT EXISTS fbclid TEXT,
  ADD COLUMN IF NOT EXISTS fbc TEXT,                -- _fbc cookie value when the studio has a Meta pixel
  ADD COLUMN IF NOT EXISTS fbp TEXT,
  ADD COLUMN IF NOT EXISTS gclid TEXT,
  ADD COLUMN IF NOT EXISTS gbraid TEXT,
  ADD COLUMN IF NOT EXISTS wbraid TEXT,
  ADD COLUMN IF NOT EXISTS ttclid TEXT,
  ADD COLUMN IF NOT EXISTS msclkid TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT;            -- normalised: organic_social, paid_social, search, email, sms, qr, referral, direct, embed, network

COMMENT ON COLUMN analytics_sessions.channel IS
  'Tandava''s normalised channel, computed from utm_medium/utm_source/referrer/click ids. Studios tag links their own way; reports group by this.';

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_visitor ON analytics_sessions(visitor_id, started_at);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_studio_channel ON analytics_sessions(studio_id, channel, started_at);

-- ---------------------------------------------------------------------------
-- 2. One profile, many visitors (PRD-024: links are added, never replaced)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profile_visitors (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  linked_via TEXT NOT NULL,                         -- express_booking, signup, claim, sign_in, app_sign_in, network
  PRIMARY KEY (profile_id, visitor_id)
);
CREATE INDEX IF NOT EXISTS idx_profile_visitors_visitor ON profile_visitors(visitor_id);

-- ---------------------------------------------------------------------------
-- 3. Where each studio relationship came from (PRD-024 step 3)
-- ---------------------------------------------------------------------------
ALTER TABLE studio_members
  ADD COLUMN IF NOT EXISTS source TEXT,             -- express, signup, import, staff, walk_in, network, private_event
  ADD COLUMN IF NOT EXISTS first_touch_session_id UUID REFERENCES analytics_sessions(id),
  ADD COLUMN IF NOT EXISTS acquired_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- 4. Conversions with frozen touches and a stable event id
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),   -- also the event_id sent to ad platforms (dedupe with the pixel)
  -- NULL for Tandava-level conversions (e.g. a Studio Network credit purchase,
  -- PRD-023/024), which belong to no studio. Staff RLS never shows those.
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  visitor_id UUID,
  conversion_type TEXT NOT NULL,                    -- lead, guest_booking, member_booking, account_claimed, signup, pack_purchase, membership_start, event_registration, private_accepted, network_booking, first_check_in
  value_cents INTEGER,
  currency TEXT,
  entity_type TEXT,                                 -- booking, transaction, membership, event_registration, appointment
  entity_id UUID,
  first_touch_session_id UUID REFERENCES analytics_sessions(id),
  converting_touch_session_id UUID REFERENCES analytics_sessions(id),
  -- Frozen copy of what the touches said at conversion time, so later
  -- re-processing or a deleted session cannot rewrite history.
  first_touch JSONB,
  converting_touch JSONB,
  touch_count INTEGER,
  days_to_convert INTEGER,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conversion_events_studio ON conversion_events(studio_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_events_profile ON conversion_events(profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversion_events_entity
  ON conversion_events(conversion_type, entity_type, entity_id) WHERE entity_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. Consent, per purpose, append-only
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,  -- null = Tandava-level (e.g. Network)
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  visitor_id UUID,
  purpose TEXT NOT NULL CHECK (purpose IN (
    'email_marketing', 'sms_marketing', 'ad_user_data', 'ad_personalization', 'analytics_storage', 'ad_storage'
  )),
  granted BOOLEAN NOT NULL,
  source TEXT NOT NULL,                             -- express_booking_form, signup_form, consent_banner, import, staff_entry, sms_keyword
  policy_version TEXT,
  region TEXT,                                      -- ISO country / US state, for Consent Mode and Meta LDU
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE consent_records IS
  'Append-only. The current state for a person and purpose is the latest row. Never update or delete except for a GDPR erasure.';
CREATE INDEX IF NOT EXISTS idx_consent_records_lookup ON consent_records(profile_id, studio_id, purpose, captured_at DESC);

-- ---------------------------------------------------------------------------
-- 6. Ad-platform connections per studio (credentials live in Vault)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ad_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'tiktok')),
  dataset_id TEXT,                                  -- Meta pixel/dataset id, TikTok event set id
  ad_account_id TEXT,                               -- Meta act_..., Google customer id
  conversion_action_ids JSONB NOT NULL DEFAULT '{}',-- Google: conversion_type -> conversion action
  vault_secret_id UUID,                             -- vault.secrets id holding the access token; never the token itself
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connected', 'error', 'paused')),
  send_events BOOLEAN NOT NULL DEFAULT FALSE,       -- off until the owner turns it on after a test event
  last_test_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (studio_id, platform)
);

-- ---------------------------------------------------------------------------
-- 7. Delivery outbox: one row per conversion per destination
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversion_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversion_event_id UUID NOT NULL REFERENCES conversion_events(id) ON DELETE CASCADE,
  ad_integration_id UUID NOT NULL REFERENCES ad_integrations(id) ON DELETE CASCADE,
  platform_event_name TEXT NOT NULL,                -- Lead, Schedule, CompleteRegistration, StartTrial, Subscribe, Purchase
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped_no_consent', 'skipped_disabled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversion_event_id, ad_integration_id)
);
CREATE INDEX IF NOT EXISTS idx_conversion_deliveries_due ON conversion_deliveries(status, next_attempt_at) WHERE status IN ('pending', 'failed');

-- ---------------------------------------------------------------------------
-- RLS: service role writes; active staff of the studio read
-- ---------------------------------------------------------------------------
ALTER TABLE profile_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversion_events_staff_read ON conversion_events;
CREATE POLICY conversion_events_staff_read ON conversion_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM studio_staff ss
    WHERE ss.studio_id = conversion_events.studio_id AND ss.profile_id = auth.uid() AND ss.is_active = TRUE
  ));

DROP POLICY IF EXISTS consent_records_staff_read ON consent_records;
CREATE POLICY consent_records_staff_read ON consent_records
  FOR SELECT TO authenticated
  USING (studio_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM studio_staff ss
    WHERE ss.studio_id = consent_records.studio_id AND ss.profile_id = auth.uid() AND ss.is_active = TRUE
  ));

-- Ad connections: owners and admins only (they show account ids and errors).
DROP POLICY IF EXISTS ad_integrations_admin_read ON ad_integrations;
CREATE POLICY ad_integrations_admin_read ON ad_integrations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM studio_staff ss
    WHERE ss.studio_id = ad_integrations.studio_id AND ss.profile_id = auth.uid()
      AND ss.is_active = TRUE AND ss.role IN ('owner', 'admin')
  ));

DROP POLICY IF EXISTS conversion_deliveries_admin_read ON conversion_deliveries;
CREATE POLICY conversion_deliveries_admin_read ON conversion_deliveries
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ad_integrations ai
    JOIN studio_staff ss ON ss.studio_id = ai.studio_id
    WHERE ai.id = conversion_deliveries.ad_integration_id AND ss.profile_id = auth.uid()
      AND ss.is_active = TRUE AND ss.role IN ('owner', 'admin')
  ));
-- profile_visitors: no read policy; only service-role functions use it.
