-- Tandava Studio Management Platform
-- Migration 003: Workshops/Events/Trainings, Landing Pages, Analytics,
--               Newsletter, and Growth/Engagement Infrastructure
--
-- Workshops & events are first-class entities (not just class types).
-- Landing pages give studios SEO-optimized discovery surfaces.
-- Analytics tracks attribution from campaigns, landing pages, referrals.
-- Growth hooks enable PLG-style nudges without being annoying.

-- ============================================================================
-- NEW ENUMS
-- ============================================================================

CREATE TYPE event_type AS ENUM ('workshop', 'event', 'training', 'retreat', 'immersion', 'series');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'sold_out', 'cancelled', 'completed');
CREATE TYPE event_registration_status AS ENUM ('registered', 'waitlisted', 'cancelled', 'attended', 'no_show');
CREATE TYPE landing_page_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE newsletter_source AS ENUM ('footer', 'popup', 'checkout', 'event_page', 'landing_page', 'booking_confirmation', 'referral');
CREATE TYPE nudge_type AS ENUM (
  'booking_reminder', 'streak_at_risk', 'comeback', 'milestone_approaching',
  'new_class_suggestion', 'pack_running_low', 'membership_expiring',
  'friend_activity', 'event_recommendation', 'review_request'
);
CREATE TYPE nudge_channel AS ENUM ('in_app', 'push', 'email');
CREATE TYPE engagement_event AS ENUM (
  'app_open', 'schedule_view', 'class_detail_view', 'booking_started',
  'booking_completed', 'check_in', 'review_submitted', 'referral_sent',
  'event_viewed', 'landing_page_viewed', 'newsletter_signup',
  'promo_applied', 'membership_page_viewed', 'streak_shared'
);

-- ============================================================================
-- WORKSHOPS, EVENTS & TRAININGS
-- First-class entities with rich content, multi-session support,
-- pricing tiers, early bird, and better discovery than competitors.
-- ============================================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  -- Basic info
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  subtitle TEXT,
  description TEXT, -- rich text / markdown
  type event_type NOT NULL DEFAULT 'workshop',
  status event_status NOT NULL DEFAULT 'draft',
  -- Media
  cover_image_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  video_url TEXT, -- promo video
  -- Schedule
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  -- Multi-session support (for series, trainings, immersions)
  is_multi_session BOOLEAN DEFAULT FALSE,
  session_count INTEGER DEFAULT 1,
  -- Location
  location_id UUID REFERENCES locations(id),
  room TEXT,
  is_virtual BOOLEAN DEFAULT FALSE,
  virtual_url TEXT, -- Zoom/meet link (only shown to registered)
  -- Capacity
  capacity INTEGER NOT NULL DEFAULT 30,
  registered_count INTEGER DEFAULT 0,
  waitlist_count INTEGER DEFAULT 0,
  waitlist_enabled BOOLEAN DEFAULT TRUE,
  -- Pricing
  price_cents INTEGER NOT NULL DEFAULT 0,
  early_bird_price_cents INTEGER,
  early_bird_ends_at TIMESTAMPTZ,
  member_price_cents INTEGER, -- special price for existing members
  -- Content for the page
  what_to_expect TEXT, -- markdown
  who_its_for TEXT, -- markdown
  what_to_bring TEXT[] DEFAULT '{}',
  prerequisites TEXT,
  cancellation_policy TEXT,
  -- Teachers
  primary_teacher_id UUID REFERENCES profiles(id),
  -- Tags for discovery and filtering
  tags TEXT[] DEFAULT '{}',
  style TEXT, -- yoga style if applicable
  level TEXT, -- beginner, intermediate, advanced, all
  -- SEO & Discovery
  meta_title TEXT,
  meta_description TEXT,
  discoverable BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(studio_id, slug)
);

CREATE INDEX idx_events_studio ON events(studio_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_starts ON events(starts_at);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_discoverable ON events(discoverable, status) WHERE discoverable = TRUE AND status = 'published';

-- Individual sessions within a multi-session event
CREATE TABLE event_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  -- Session details
  title TEXT NOT NULL, -- "Session 1: Foundations" or "Day 2: Advanced Techniques"
  description TEXT,
  session_number INTEGER NOT NULL,
  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  -- Location override (if different from parent event)
  location_id UUID REFERENCES locations(id),
  room TEXT,
  -- Teacher override
  teacher_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_sessions_event ON event_sessions(event_id);

-- Additional teachers for events
CREATE TABLE event_teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'teacher', -- 'lead', 'assistant', 'guest'
  bio_override TEXT, -- event-specific bio
  UNIQUE(event_id, teacher_id)
);

-- Pricing tiers (beyond early bird — e.g., "Full Training", "Partial", "Audit")
CREATE TABLE event_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Full Immersion", "Weekend Only", "Audit"
  description TEXT,
  price_cents INTEGER NOT NULL,
  member_price_cents INTEGER,
  capacity INTEGER, -- per-tier capacity, null = unlimited within event capacity
  registered_count INTEGER DEFAULT 0,
  includes_sessions INTEGER[] DEFAULT '{}', -- which session numbers (empty = all)
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_pricing_tiers ON event_pricing_tiers(event_id);

-- Registrations
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pricing_tier_id UUID REFERENCES event_pricing_tiers(id),
  transaction_id UUID REFERENCES transactions(id),
  status event_registration_status NOT NULL DEFAULT 'registered',
  -- Waitlist
  waitlist_position INTEGER,
  -- Check-in tracking per session
  sessions_attended INTEGER[] DEFAULT '{}', -- which session_numbers they attended
  -- Payment
  amount_paid_cents INTEGER NOT NULL DEFAULT 0,
  promo_code_id UUID REFERENCES promo_codes(id),
  discount_amount_cents INTEGER DEFAULT 0,
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  refund_amount_cents INTEGER DEFAULT 0,
  -- Metadata
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, profile_id)
);

CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_profile ON event_registrations(profile_id);

-- ============================================================================
-- LANDING PAGES
-- Studio-editable SEO landing pages. Studios get guidance on what to create
-- and why. The system provides templates and SEO recommendations.
-- ============================================================================

CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  -- URL & identity
  slug TEXT NOT NULL, -- becomes /s/{studio-slug}/{page-slug}
  title TEXT NOT NULL,
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[] DEFAULT '{}',
  og_image_url TEXT,
  -- Content blocks (stored as ordered JSON array)
  -- Each block: { type: "hero"|"text"|"schedule"|"pricing"|"testimonials"|"cta"|"newsletter"|"teachers", content: {...} }
  content_blocks JSONB NOT NULL DEFAULT '[]',
  -- Template the page was created from
  template TEXT, -- 'new_student', 'class_style', 'teacher_profile', 'event_promo', 'seasonal', 'custom'
  -- Targeting
  target_audience TEXT, -- 'new_students', 'returning', 'specific_style', etc.
  -- CTA
  primary_cta_text TEXT DEFAULT 'Book Your First Class',
  primary_cta_url TEXT DEFAULT '/schedule',
  -- Analytics
  total_views INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0, -- how many led to a booking/signup
  -- Status
  status landing_page_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  -- Newsletter signup embedded
  show_newsletter_signup BOOLEAN DEFAULT TRUE,
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(studio_id, slug)
);

CREATE INDEX idx_landing_pages_studio ON landing_pages(studio_id);
CREATE INDEX idx_landing_pages_status ON landing_pages(status);

-- SEO recommendations per studio (system-generated suggestions)
CREATE TABLE seo_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  -- What we recommend
  recommendation_type TEXT NOT NULL, -- 'landing_page', 'meta_tag', 'content', 'backlink', 'local_seo'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  -- Priority
  priority TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
  -- Status
  is_completed BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  -- If it's a landing page suggestion, which template
  suggested_template TEXT,
  suggested_slug TEXT,
  -- Target keywords
  target_keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seo_recommendations_studio ON seo_recommendations(studio_id);

-- ============================================================================
-- NEWSLETTER SUBSCRIPTIONS
-- Email signups from various touchpoints throughout the app
-- ============================================================================

CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  -- Subscriber info
  email TEXT NOT NULL,
  first_name TEXT,
  profile_id UUID REFERENCES profiles(id), -- linked if they have an account
  -- Source tracking
  source newsletter_source NOT NULL,
  source_detail TEXT, -- specific page or event name
  -- Preferences
  subscribed_to TEXT[] DEFAULT '{"general"}', -- 'general', 'events', 'promotions', 'blog'
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  unsubscribed_at TIMESTAMPTZ,
  -- Double opt-in
  confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  confirmation_token TEXT,
  -- GDPR/CAN-SPAM
  consent_text TEXT DEFAULT 'I agree to receive emails from this studio',
  ip_address TEXT,
  -- Metadata
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(studio_id, email)
);

CREATE INDEX idx_newsletter_studio ON newsletter_subscribers(studio_id);
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(studio_id, is_active) WHERE is_active = TRUE;

-- ============================================================================
-- ANALYTICS & ATTRIBUTION
-- Track where students come from, what converts them, and key user metrics.
-- Designed for the studio dashboard, not raw event streaming.
-- ============================================================================

CREATE TABLE analytics_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id), -- null for anonymous visitors
  -- Session info
  session_token TEXT NOT NULL,
  -- Attribution
  referrer_url TEXT,
  referrer_domain TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  -- Landing
  landing_page_url TEXT,
  landing_page_id UUID REFERENCES landing_pages(id),
  -- Device
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  os TEXT,
  -- Location (coarse, from IP)
  city TEXT,
  region TEXT,
  country TEXT,
  -- Session metrics
  page_views INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  -- Conversion
  converted BOOLEAN DEFAULT FALSE, -- did they book, sign up, or purchase?
  conversion_type TEXT, -- 'booking', 'signup', 'purchase', 'newsletter'
  conversion_entity_id UUID, -- booking_id, profile_id, transaction_id, etc.
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_sessions_studio ON analytics_sessions(studio_id);
CREATE INDEX idx_analytics_sessions_date ON analytics_sessions(started_at);
CREATE INDEX idx_analytics_sessions_campaign ON analytics_sessions(studio_id, utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX idx_analytics_sessions_landing ON analytics_sessions(landing_page_id) WHERE landing_page_id IS NOT NULL;

-- Aggregated daily analytics (materialized from sessions, for fast dashboard queries)
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- Traffic
  total_sessions INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  -- Conversions
  total_bookings INTEGER DEFAULT 0,
  total_signups INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  total_newsletter_signups INTEGER DEFAULT 0,
  -- Revenue
  revenue_cents BIGINT DEFAULT 0,
  -- Top sources (JSONB array of {source, count})
  top_referrers JSONB DEFAULT '[]',
  top_campaigns JSONB DEFAULT '[]',
  top_landing_pages JSONB DEFAULT '[]',
  -- Class metrics
  total_check_ins INTEGER DEFAULT 0,
  avg_class_fill_rate DECIMAL(5, 2),
  -- Retention
  returning_students INTEGER DEFAULT 0,
  new_students INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(studio_id, date)
);

CREATE INDEX idx_analytics_daily_studio_date ON analytics_daily(studio_id, date);

-- ============================================================================
-- GROWTH & ENGAGEMENT INFRASTRUCTURE
-- PLG-style nudges, streaks, milestones, and re-engagement.
-- Inspired by Reforge growth frameworks — activation, engagement,
-- retention, resurrection. Not annoying — respectful, contextual.
-- ============================================================================

-- Student engagement profiles (computed / updated periodically)
CREATE TABLE engagement_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Activation metrics
  is_activated BOOLEAN DEFAULT FALSE, -- completed first class
  activation_date TIMESTAMPTZ,
  days_to_activate INTEGER, -- days from signup to first class
  -- Engagement metrics
  current_streak_weeks INTEGER DEFAULT 0,
  longest_streak_weeks INTEGER DEFAULT 0,
  avg_classes_per_week DECIMAL(4, 2) DEFAULT 0,
  preferred_day day_of_week,
  preferred_time TEXT, -- 'morning', 'midday', 'evening'
  preferred_styles TEXT[] DEFAULT '{}',
  preferred_teachers UUID[] DEFAULT '{}',
  -- Retention risk
  days_since_last_class INTEGER DEFAULT 0,
  risk_level TEXT DEFAULT 'none', -- 'none', 'low', 'medium', 'high', 'churned'
  risk_updated_at TIMESTAMPTZ,
  -- Milestones reached
  milestones_reached TEXT[] DEFAULT '{}', -- 'first_class', '10_classes', '50_classes', '100_classes', '1_year', etc.
  next_milestone TEXT,
  next_milestone_progress INTEGER DEFAULT 0, -- percentage toward next milestone
  -- Engagement score (0-100)
  engagement_score INTEGER DEFAULT 0,
  -- Last computed
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(studio_id, profile_id)
);

CREATE INDEX idx_engagement_profiles_studio ON engagement_profiles(studio_id);
CREATE INDEX idx_engagement_profiles_risk ON engagement_profiles(studio_id, risk_level);
CREATE INDEX idx_engagement_profiles_score ON engagement_profiles(studio_id, engagement_score);

-- Nudge configuration (studio-level rules for when/how to nudge)
CREATE TABLE nudge_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  nudge_type nudge_type NOT NULL,
  -- When to trigger
  trigger_condition JSONB NOT NULL, -- e.g., {"days_since_last_class": 7} or {"streak_weeks": 4, "at_risk": true}
  -- How to nudge
  channel nudge_channel NOT NULL DEFAULT 'in_app',
  -- Content template
  title_template TEXT NOT NULL, -- supports {{name}}, {{streak}}, etc.
  body_template TEXT NOT NULL,
  action_url TEXT, -- where the nudge links to
  -- Frequency limits (respect the user)
  max_per_week INTEGER DEFAULT 2,
  max_per_month INTEGER DEFAULT 6,
  cooldown_hours INTEGER DEFAULT 48, -- min hours between nudges of this type
  -- Opt-out
  can_dismiss BOOLEAN DEFAULT TRUE,
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nudge_rules_studio ON nudge_rules(studio_id);

-- Nudge delivery log
CREATE TABLE nudge_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nudge_rule_id UUID REFERENCES nudge_rules(id),
  nudge_type nudge_type NOT NULL,
  channel nudge_channel NOT NULL,
  -- Content as delivered
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  -- Outcome
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seen_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  converted BOOLEAN DEFAULT FALSE, -- did it lead to a booking/purchase?
  conversion_entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nudge_log_profile ON nudge_log(profile_id);
CREATE INDEX idx_nudge_log_studio_date ON nudge_log(studio_id, delivered_at);

-- Milestone definitions (what milestones exist and their rewards)
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  -- Milestone definition
  key TEXT NOT NULL, -- 'first_class', '10_classes', '50_classes', '100_classes', '6_month_streak', '1_year'
  name TEXT NOT NULL,
  description TEXT,
  -- Criteria
  classes_required INTEGER,
  streak_weeks_required INTEGER,
  months_active_required INTEGER,
  -- Reward (optional)
  reward_type TEXT, -- 'credit', 'free_class', 'badge', 'none'
  reward_value INTEGER DEFAULT 0, -- cents or class count
  -- Display
  icon TEXT, -- emoji or icon name
  badge_image_url TEXT,
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(studio_id, key)
);

CREATE INDEX idx_milestones_studio ON milestones(studio_id);

-- Student milestone achievements
CREATE TABLE milestone_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Was the reward granted?
  reward_granted BOOLEAN DEFAULT FALSE,
  reward_transaction_id UUID REFERENCES transactions(id),
  -- Social
  shared BOOLEAN DEFAULT FALSE, -- did the student share it?
  UNIQUE(milestone_id, profile_id)
);

CREATE INDEX idx_milestone_achievements_profile ON milestone_achievements(profile_id);

-- Engagement event tracking (lightweight, high-volume)
CREATE TABLE engagement_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id), -- null for anonymous
  session_id UUID REFERENCES analytics_sessions(id),
  event engagement_event NOT NULL,
  -- Context
  entity_type TEXT, -- 'class', 'event', 'landing_page', 'membership', etc.
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  -- Timestamp
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partitioned index for fast queries on recent events
CREATE INDEX idx_engagement_events_studio_date ON engagement_events(studio_id, occurred_at);
CREATE INDEX idx_engagement_events_profile ON engagement_events(profile_id, occurred_at);

-- ============================================================================
-- EXTEND TRANSACTION TYPES FOR EVENTS
-- ============================================================================

ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'event_registration';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'gift_card_purchase';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;

-- Events: published events are public for discovery
CREATE POLICY "Published events are publicly visible"
  ON events FOR SELECT
  USING (status = 'published' AND discoverable = TRUE);

CREATE POLICY "Staff can manage events"
  ON events FOR ALL
  USING (studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()));

CREATE POLICY "Members can view studio events"
  ON events FOR SELECT
  USING (studio_id IN (SELECT studio_id FROM studio_members WHERE profile_id = auth.uid()));

-- Event registrations: users see own, staff sees all
CREATE POLICY "Users can view own registrations"
  ON event_registrations FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Staff can manage registrations"
  ON event_registrations FOR ALL
  USING (studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()));

-- Landing pages: published pages are public
CREATE POLICY "Published landing pages are public"
  ON landing_pages FOR SELECT
  USING (status = 'published');

CREATE POLICY "Staff can manage landing pages"
  ON landing_pages FOR ALL
  USING (studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()));

-- Newsletter: staff can view subscribers
CREATE POLICY "Staff can manage newsletter subscribers"
  ON newsletter_subscribers FOR ALL
  USING (studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()));

-- Analytics: admins only
CREATE POLICY "Admins can view analytics"
  ON analytics_sessions FOR SELECT
  USING (studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Admins can view daily analytics"
  ON analytics_daily FOR SELECT
  USING (studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')));

-- Engagement: users see own, staff sees all
CREATE POLICY "Users can view own engagement"
  ON engagement_profiles FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Staff can view engagement profiles"
  ON engagement_profiles FOR SELECT
  USING (studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()));

-- Nudge log: users see own
CREATE POLICY "Users can view own nudges"
  ON nudge_log FOR SELECT
  USING (profile_id = auth.uid());

-- Milestones: visible to all studio participants
CREATE POLICY "Studio participants can view milestones"
  ON milestones FOR SELECT
  USING (studio_id IN (
    SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()
    UNION SELECT studio_id FROM studio_members WHERE profile_id = auth.uid()
  ));

-- Milestone achievements: users see own, staff sees all
CREATE POLICY "Users can view own achievements"
  ON milestone_achievements FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Staff can view achievements"
  ON milestone_achievements FOR SELECT
  USING (studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_landing_pages_updated_at BEFORE UPDATE ON landing_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_engagement_profiles_updated_at BEFORE UPDATE ON engagement_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_nudge_rules_updated_at BEFORE UPDATE ON nudge_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update event registration counts
CREATE OR REPLACE FUNCTION update_event_registration_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events SET
    registered_count = (
      SELECT COUNT(*) FROM event_registrations
      WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
      AND status = 'registered'
    ),
    waitlist_count = (
      SELECT COUNT(*) FROM event_registrations
      WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
      AND status = 'waitlisted'
    )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_counts_insert
  AFTER INSERT ON event_registrations FOR EACH ROW EXECUTE FUNCTION update_event_registration_counts();
CREATE TRIGGER update_event_counts_update
  AFTER UPDATE ON event_registrations FOR EACH ROW EXECUTE FUNCTION update_event_registration_counts();
CREATE TRIGGER update_event_counts_delete
  AFTER DELETE ON event_registrations FOR EACH ROW EXECUTE FUNCTION update_event_registration_counts();

-- Track landing page views
CREATE OR REPLACE FUNCTION increment_landing_page_views()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.landing_page_id IS NOT NULL THEN
    UPDATE landing_pages SET total_views = total_views + 1
    WHERE id = NEW.landing_page_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_lp_views_on_session
  AFTER INSERT ON analytics_sessions
  FOR EACH ROW EXECUTE FUNCTION increment_landing_page_views();
