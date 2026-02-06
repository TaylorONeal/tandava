-- Migration 009: On-Demand Video, Audit Logging, Feature Toggles
-- Comprehensive schema for Phase 9+ features
--
-- Includes:
-- - On-demand video library (PRD-015)
-- - Feature toggles (studio-level feature management)
-- - Audit logging (enterprise compliance)
-- - Enhanced notification infrastructure
-- - Import system enhancements

-- ============================================================================
-- FEATURE TOGGLES
-- Allows studios to enable/disable optional features
-- ============================================================================

CREATE TABLE studio_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  feature_id TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,

  -- Settings preserved when disabled
  configuration JSONB DEFAULT '{}',

  -- Timestamps
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  enabled_by UUID REFERENCES profiles(id),
  disabled_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, feature_id)
);

CREATE INDEX idx_studio_features_studio ON studio_features(studio_id);
CREATE INDEX idx_studio_features_enabled ON studio_features(studio_id, is_enabled) WHERE is_enabled = true;

-- ============================================================================
-- AUDIT LOGGING
-- Enterprise-grade change tracking
-- ============================================================================

CREATE TYPE audit_category AS ENUM (
  'auth',
  'data',
  'settings',
  'access',
  'financial',
  'member',
  'staff',
  'integration',
  'export',
  'admin',
  'system'
);

CREATE TYPE audit_severity AS ENUM (
  'info',
  'notice',
  'warning',
  'critical'
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE SET NULL,

  -- What happened
  category audit_category NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Who did it
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL DEFAULT 'user',
  actor_email TEXT,
  actor_role TEXT,
  impersonator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- What was affected
  target_type TEXT,
  target_id UUID,
  target_description TEXT,

  -- Change details (JSON for flexibility)
  changes JSONB,
  previous_state JSONB,
  new_state JSONB,

  -- Context
  request_id TEXT,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  geo_location JSONB,

  -- Classification
  severity audit_severity DEFAULT 'info',
  tags TEXT[],
  metadata JSONB,

  -- Timestamps (high precision for ordering)
  timestamp TIMESTAMPTZ DEFAULT now(),
  timestamp_ms BIGINT DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
);

-- Indexes optimized for common query patterns
CREATE INDEX idx_audit_logs_studio_time ON audit_logs(studio_id, timestamp DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id, timestamp DESC);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id, timestamp DESC);
CREATE INDEX idx_audit_logs_category ON audit_logs(category, timestamp DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity, timestamp DESC) WHERE severity IN ('warning', 'critical');
CREATE INDEX idx_audit_logs_search ON audit_logs USING gin(to_tsvector('english', description));

-- Partitioning-ready: add partition by timestamp_ms for large datasets
-- ALTER TABLE audit_logs ADD COLUMN partition_key DATE GENERATED ALWAYS AS (DATE(timestamp)) STORED;

-- Archive table for old audit logs (cost optimization)
CREATE TABLE audit_logs_archive (
  LIKE audit_logs INCLUDING ALL
);

-- ============================================================================
-- NOTIFICATION ENHANCEMENTS
-- Provider configuration and delivery tracking
-- ============================================================================

CREATE TYPE notification_provider_type AS ENUM (
  'sendgrid',
  'resend',
  'postmark',
  'ses',
  'mailgun',
  'smtp',
  'twilio',
  'vonage',
  'messagebird',
  'plivo',
  'sns',
  'firebase',
  'onesignal',
  'web_push',
  'console'
);

CREATE TABLE notification_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
  provider notification_provider_type NOT NULL,

  is_enabled BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  -- Credentials (encrypted in application layer)
  credentials_encrypted TEXT,

  -- Provider-specific settings
  settings JSONB DEFAULT '{}',

  -- Delivery defaults
  from_address TEXT,
  from_name TEXT,
  reply_to TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, channel, provider)
);

-- Notification templates (enhanced)
CREATE TABLE notification_templates_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'in_app')),

  -- Content
  subject TEXT,
  body TEXT NOT NULL,
  body_html TEXT,

  -- Provider template (for SendGrid dynamic templates, etc.)
  provider_template_id TEXT,

  -- Variables
  variables JSONB DEFAULT '[]',

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, notification_type, channel)
);

-- Notification delivery log
CREATE TABLE notification_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- What was sent
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  provider notification_provider_type NOT NULL,

  -- Who it was sent to
  recipient_id UUID REFERENCES profiles(id),
  recipient_address TEXT NOT NULL,

  -- Content snapshot
  subject TEXT,
  body_preview TEXT,
  template_id UUID REFERENCES notification_templates_v2(id),

  -- Status
  status TEXT NOT NULL DEFAULT 'queued',
  provider_message_id TEXT,

  -- Tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Context
  idempotency_key TEXT,
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notification_delivery_studio ON notification_delivery_log(studio_id, created_at DESC);
CREATE INDEX idx_notification_delivery_recipient ON notification_delivery_log(recipient_id, created_at DESC);
CREATE INDEX idx_notification_delivery_status ON notification_delivery_log(status, created_at);

-- ============================================================================
-- ON-DEMAND VIDEO LIBRARY (PRD-015)
-- ============================================================================

CREATE TYPE video_hosting_type AS ENUM (
  'self_hosted',
  'youtube',
  'vimeo',
  'zoom_recording',
  'external_url'
);

CREATE TYPE video_access_type AS ENUM (
  'free',
  'members_only',
  'specific_memberships',
  'class_pack',
  'rental',
  'purchase',
  'subscription'
);

CREATE TYPE video_status AS ENUM (
  'draft',
  'processing',
  'published',
  'unlisted',
  'archived'
);

CREATE TABLE on_demand_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,

  -- Hosting
  hosting_type video_hosting_type NOT NULL,
  video_url TEXT,
  video_id TEXT,
  embed_config JSONB DEFAULT '{}',

  -- Transcoding (self-hosted)
  original_file_path TEXT,
  transcoded_urls JSONB DEFAULT '{}',
  transcode_status TEXT,

  -- Media Info
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  preview_url TEXT,

  -- Timestamps for player
  chapters JSONB DEFAULT '[]',
  skip_intro_seconds INTEGER,

  -- Classification
  instructor_id UUID REFERENCES studio_staff(id),
  class_type_id UUID REFERENCES class_types(id),
  style TEXT,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all_levels')),
  equipment TEXT[],

  -- Access Control
  access_type video_access_type NOT NULL DEFAULT 'members_only',
  access_config JSONB DEFAULT '{}',
  class_pack_deduction INTEGER DEFAULT 1,

  -- Status
  status video_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,

  -- Metadata
  view_count INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2),
  rating_count INTEGER DEFAULT 0,

  -- Source (if from live class)
  source_class_occurrence_id UUID REFERENCES class_occurrences(id),
  source_zoom_meeting_id TEXT,

  -- SEO
  seo_title TEXT,
  seo_description TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, slug)
);

CREATE INDEX idx_videos_studio ON on_demand_videos(studio_id, status);
CREATE INDEX idx_videos_instructor ON on_demand_videos(instructor_id);
CREATE INDEX idx_videos_published ON on_demand_videos(studio_id, published_at DESC)
  WHERE status = 'published';

-- Video Series / Programs
CREATE TABLE video_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,

  instructor_id UUID REFERENCES studio_staff(id),
  style TEXT,
  level TEXT,
  estimated_duration_minutes INTEGER,

  access_type video_access_type NOT NULL DEFAULT 'members_only',
  access_config JSONB DEFAULT '{}',

  drip_enabled BOOLEAN DEFAULT false,
  drip_interval_days INTEGER DEFAULT 1,

  certificate_enabled BOOLEAN DEFAULT false,
  certificate_template_id UUID,

  prerequisite_series_id UUID REFERENCES video_series(id),

  status video_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,

  enrollment_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, slug)
);

CREATE TABLE video_series_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES video_series(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES on_demand_videos(id) ON DELETE CASCADE,

  sequence_number INTEGER NOT NULL,
  custom_title TEXT,
  available_after_days INTEGER,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(series_id, video_id),
  UNIQUE(series_id, sequence_number)
);

-- Collections / Playlists
CREATE TABLE video_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,

  collection_type TEXT NOT NULL CHECK (collection_type IN ('curated', 'smart', 'featured')),
  smart_rules JSONB DEFAULT '{}',

  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, slug)
);

CREATE TABLE video_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES video_collections(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES on_demand_videos(id) ON DELETE CASCADE,

  sequence_number INTEGER,
  added_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(collection_id, video_id)
);

-- Student Playlists
CREATE TABLE student_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  title TEXT NOT NULL DEFAULT 'My Favorites',
  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE student_playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES student_playlists(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES on_demand_videos(id) ON DELETE CASCADE,

  added_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(playlist_id, video_id)
);

-- Watch Progress
CREATE TABLE video_watch_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES on_demand_videos(id) ON DELETE CASCADE,

  watched_seconds INTEGER DEFAULT 0,
  total_seconds INTEGER,
  progress_percent NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_seconds > 0
      THEN LEAST(100, (watched_seconds::NUMERIC / total_seconds) * 100)
      ELSE 0
    END
  ) STORED,

  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  last_position_seconds INTEGER DEFAULT 0,

  started_at TIMESTAMPTZ DEFAULT now(),
  last_watched_at TIMESTAMPTZ DEFAULT now(),
  watch_count INTEGER DEFAULT 1,

  UNIQUE(profile_id, video_id)
);

CREATE INDEX idx_watch_progress_profile ON video_watch_progress(profile_id, last_watched_at DESC);
CREATE INDEX idx_watch_progress_continue ON video_watch_progress(profile_id)
  WHERE is_completed = false AND progress_percent > 5;

-- Watch Sessions (for analytics)
CREATE TABLE video_watch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES on_demand_videos(id) ON DELETE CASCADE,

  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,

  start_position_seconds INTEGER,
  end_position_seconds INTEGER,
  watched_seconds INTEGER,

  device_type TEXT,
  quality TEXT
);

-- Series Enrollments
CREATE TABLE series_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES video_series(id) ON DELETE CASCADE,

  videos_completed INTEGER DEFAULT 0,
  videos_total INTEGER NOT NULL,
  progress_percent NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN videos_total > 0
      THEN (videos_completed::NUMERIC / videos_total) * 100
      ELSE 0
    END
  ) STORED,

  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  certificate_issued_at TIMESTAMPTZ,
  certificate_url TEXT,

  current_drip_index INTEGER DEFAULT 0,
  next_unlock_at TIMESTAMPTZ,

  enrolled_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,

  UNIQUE(profile_id, series_id)
);

-- Video Ratings
CREATE TABLE video_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES on_demand_videos(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,

  is_visible BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(video_id, profile_id)
);

-- Video Purchases/Rentals
CREATE TABLE video_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID REFERENCES on_demand_videos(id),
  series_id UUID REFERENCES video_series(id),

  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('purchase', 'rental')),

  amount_cents INTEGER NOT NULL,
  transaction_id UUID REFERENCES transactions(id),

  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),

  CHECK (video_id IS NOT NULL OR series_id IS NOT NULL)
);

CREATE INDEX idx_video_purchases_profile ON video_purchases(profile_id, is_active);

-- On-Demand Subscription (separate from studio membership)
CREATE TABLE on_demand_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  price_cents INTEGER NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),

  access_all_videos BOOLEAN DEFAULT true,
  included_video_ids UUID[],

  download_enabled BOOLEAN DEFAULT false,
  concurrent_streams INTEGER DEFAULT 2,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE on_demand_member_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES on_demand_subscriptions(id),
  profile_id UUID NOT NULL REFERENCES profiles(id),

  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'cancelled', 'paused')),

  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  payment_provider TEXT,
  provider_subscription_id TEXT,

  cancelled_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Virtual Class / Zoom Integration
CREATE TABLE virtual_class_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  zoom_connected BOOLEAN DEFAULT false,
  zoom_user_id TEXT,
  zoom_account_id TEXT,
  zoom_credentials_encrypted TEXT,

  default_waiting_room BOOLEAN DEFAULT true,
  default_auto_record BOOLEAN DEFAULT true,
  default_record_to_cloud BOOLEAN DEFAULT true,

  auto_import_recordings BOOLEAN DEFAULT true,
  auto_publish_recordings BOOLEAN DEFAULT false,
  default_recording_access video_access_type DEFAULT 'members_only',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id)
);

CREATE TABLE class_zoom_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_occurrence_id UUID NOT NULL REFERENCES class_occurrences(id) ON DELETE CASCADE,

  zoom_meeting_id TEXT NOT NULL,
  join_url TEXT NOT NULL,
  host_url TEXT,
  password TEXT,

  meeting_status TEXT DEFAULT 'scheduled',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  attendee_count INTEGER,
  attendee_data JSONB,

  recording_status TEXT,
  recording_files JSONB,
  imported_video_id UUID REFERENCES on_demand_videos(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- IMPORT SYSTEM ENHANCEMENTS
-- Version detection, error matching, improved validation
-- ============================================================================

-- Import format versions (for detecting source platform versions)
CREATE TABLE import_format_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  provider_id TEXT NOT NULL,
  version TEXT NOT NULL,
  date_range TEXT,
  description TEXT,

  -- Column signatures for auto-detection
  column_signatures TEXT[] NOT NULL,

  -- Column mappings for this version
  default_mappings JSONB NOT NULL DEFAULT '{}',

  -- Transformation rules
  transformations JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(provider_id, version)
);

-- Pre-populate known formats
INSERT INTO import_format_versions (provider_id, version, date_range, description, column_signatures, default_mappings) VALUES
('mindbody', '2025', '2024-present', 'Current MindBody export format',
 ARRAY['Client ID', 'First Name', 'Last Name', 'Email', 'Home Phone', 'Mobile Phone'],
 '{"Client ID": "external_id", "First Name": "first_name", "Last Name": "last_name", "Email": "email", "Mobile Phone": "phone"}'),

('mindbody', '2023', '2022-2024', 'Legacy MindBody format',
 ARRAY['ClientID', 'FirstName', 'LastName', 'Email', 'Phone'],
 '{"ClientID": "external_id", "FirstName": "first_name", "LastName": "last_name", "Email": "email", "Phone": "phone"}'),

('walla', '2025', '2024-present', 'Current Walla export format',
 ARRAY['member_id', 'first_name', 'last_name', 'email', 'phone_number'],
 '{"member_id": "external_id", "first_name": "first_name", "last_name": "last_name", "email": "email", "phone_number": "phone"}'),

('momence', '2025', '2024-present', 'Current Momence export format',
 ARRAY['customer_id', 'first_name', 'last_name', 'email', 'phone'],
 '{"customer_id": "external_id", "first_name": "first_name", "last_name": "last_name", "email": "email", "phone": "phone"}'),

('wellnessliving', '2025', '2023-present', 'Current WellnessLiving export format',
 ARRAY['Client ID', 'First Name', 'Last Name', 'Email Address', 'Phone Number'],
 '{"Client ID": "external_id", "First Name": "first_name", "Last Name": "last_name", "Email Address": "email", "Phone Number": "phone"}');

-- Import error patterns (for smart error matching)
CREATE TABLE import_error_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  pattern_type TEXT NOT NULL,
  pattern_regex TEXT NOT NULL,
  description TEXT NOT NULL,
  suggestion TEXT NOT NULL,

  -- Auto-fix if possible
  can_auto_fix BOOLEAN DEFAULT false,
  auto_fix_rule JSONB,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pre-populate common error patterns
INSERT INTO import_error_patterns (pattern_type, pattern_regex, description, suggestion, can_auto_fix, auto_fix_rule) VALUES
('email', '^[^@]+$', 'Missing @ symbol in email', 'Check if this is a valid email address', false, NULL),
('email', '@[^.]+$', 'Missing domain extension', 'Email should end with .com, .org, etc.', false, NULL),
('phone', '^[0-9]{1,6}$', 'Phone number too short', 'Enter complete phone number with area code', false, NULL),
('phone', '[a-zA-Z]', 'Letters in phone number', 'Remove letters from phone number', true, '{"action": "remove_letters"}'),
('date', '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{2}$', 'Ambiguous 2-digit year', 'Use 4-digit year format (YYYY)', true, '{"action": "expand_year"}'),
('duplicate', 'email_exists', 'Email already exists', 'Choose to skip, merge, or update existing record', false, NULL),
('duplicate', 'phone_exists', 'Phone number already exists', 'This may be a duplicate member', false, NULL);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE studio_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE on_demand_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_watch_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_purchases ENABLE ROW LEVEL SECURITY;

-- Studio features: staff can manage
CREATE POLICY "Staff can manage studio features"
  ON studio_features FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = studio_features.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin')
    )
  );

-- Audit logs: admin-only read, system-only write
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    studio_id IS NULL OR EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = audit_logs.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin')
    )
  );

-- Videos: staff can manage, members can view published
CREATE POLICY "Staff can manage videos"
  ON on_demand_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = on_demand_videos.studio_id
        AND studio_staff.profile_id = auth.uid()
    )
  );

CREATE POLICY "Members can view published videos"
  ON on_demand_videos FOR SELECT
  USING (
    status = 'published' AND (
      access_type = 'free'
      OR EXISTS (
        SELECT 1 FROM studio_members
        WHERE studio_members.studio_id = on_demand_videos.studio_id
          AND studio_members.profile_id = auth.uid()
      )
    )
  );

-- Watch progress: users own their data
CREATE POLICY "Users manage own watch progress"
  ON video_watch_progress FOR ALL
  USING (profile_id = auth.uid());

-- Playlists: users own their playlists
CREATE POLICY "Users manage own playlists"
  ON student_playlists FOR ALL
  USING (profile_id = auth.uid());

-- Series enrollments: users manage their own
CREATE POLICY "Users manage own enrollments"
  ON series_enrollments FOR ALL
  USING (profile_id = auth.uid());

-- Video purchases: users can see their own
CREATE POLICY "Users view own purchases"
  ON video_purchases FOR SELECT
  USING (profile_id = auth.uid());

-- Notification configs: admin only
CREATE POLICY "Admins can manage notification configs"
  ON notification_provider_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = notification_provider_configs.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_studio_id UUID,
  p_category audit_category,
  p_action TEXT,
  p_description TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_severity audit_severity DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO audit_logs (
    studio_id, category, action, description,
    actor_id, actor_type,
    target_type, target_id,
    changes, severity
  ) VALUES (
    p_studio_id, p_category, p_action, p_description,
    COALESCE(p_actor_id, auth.uid()), 'user',
    p_target_type, p_target_id,
    p_changes, p_severity
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment video view count
CREATE OR REPLACE FUNCTION increment_video_view(p_video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE on_demand_videos
  SET view_count = view_count + 1
  WHERE id = p_video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update video rating average
CREATE OR REPLACE FUNCTION update_video_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE on_demand_videos
  SET
    average_rating = (
      SELECT AVG(rating)::NUMERIC(3,2)
      FROM video_ratings
      WHERE video_id = COALESCE(NEW.video_id, OLD.video_id)
        AND is_visible = true
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM video_ratings
      WHERE video_id = COALESCE(NEW.video_id, OLD.video_id)
        AND is_visible = true
    )
  WHERE id = COALESCE(NEW.video_id, OLD.video_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_rating
  AFTER INSERT OR UPDATE OR DELETE ON video_ratings
  FOR EACH ROW EXECUTE FUNCTION update_video_rating();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE studio_features IS 'Feature toggles allowing studios to enable/disable optional functionality';
COMMENT ON TABLE audit_logs IS 'Enterprise audit log for compliance (SOC 2, GDPR, HIPAA)';
COMMENT ON TABLE on_demand_videos IS 'On-demand video library for recorded classes';
COMMENT ON TABLE video_series IS 'Multi-video programs with progression tracking';
COMMENT ON TABLE video_watch_progress IS 'Per-user video watch progress for resume functionality';
COMMENT ON TABLE import_format_versions IS 'Known CSV export formats from various providers for auto-detection';
