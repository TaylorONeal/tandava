-- Migration 007: Phase 2-3 - Notifications, Check-In, and Waitlist Automation
-- Enables push notifications, SMS, QR check-in, kiosk mode, and waitlist auto-promotion

-- ============================================================================
-- NOTIFICATION INFRASTRUCTURE
-- ============================================================================

-- Notification preferences per member per studio
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,  -- null = global default

  -- Channel preferences
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,

  -- Notification type preferences
  booking_confirmations BOOLEAN DEFAULT true,
  class_reminders BOOLEAN DEFAULT true,
  reminder_hours_before INTEGER DEFAULT 2,
  class_changes BOOLEAN DEFAULT true,
  waitlist_updates BOOLEAN DEFAULT true,
  payment_alerts BOOLEAN DEFAULT true,
  marketing BOOLEAN DEFAULT true,

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  timezone TEXT DEFAULT 'America/Los_Angeles',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(profile_id, studio_id)
);

-- Web Push subscriptions (for browser notifications)
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Web Push subscription data
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,

  -- Device info
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  browser TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  failed_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(profile_id, endpoint)
);

-- SMS conversations (for two-way messaging)
CREATE TABLE sms_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  phone_number TEXT NOT NULL,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,

  -- Assignment for staff inbox
  assigned_to UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, phone_number)
);

-- Individual SMS messages
CREATE TABLE sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES sms_conversations(id) ON DELETE CASCADE,

  -- Direction
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),

  -- Content
  body TEXT NOT NULL,
  media_urls TEXT[],

  -- Delivery status
  provider_message_id TEXT,  -- Twilio SID
  status TEXT DEFAULT 'queued' CHECK (status IN (
    'queued', 'sending', 'sent', 'delivered', 'failed', 'undelivered'
  )),
  status_updated_at TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,

  -- For outbound: who sent it
  sent_by UUID REFERENCES profiles(id),

  -- Automation tracking
  automation_rule_id UUID,  -- If sent by automation
  template_id UUID,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sms_messages_conversation ON sms_messages(conversation_id, created_at DESC);

-- Notification delivery log (all channels)
CREATE TABLE notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- What was sent
  notification_type TEXT NOT NULL,  -- 'booking_confirmation', 'class_reminder', etc.
  channel TEXT NOT NULL CHECK (channel IN ('push', 'sms', 'email', 'in_app')),
  subject TEXT,
  body TEXT NOT NULL,

  -- Context
  related_entity_type TEXT,  -- 'booking', 'class_occurrence', 'transaction'
  related_entity_id UUID,

  -- Delivery status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced'
  )),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Provider tracking
  provider TEXT,  -- 'twilio', 'sendgrid', 'web_push'
  provider_message_id TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notification_deliveries_profile ON notification_deliveries(profile_id, created_at DESC);
CREATE INDEX idx_notification_deliveries_status ON notification_deliveries(status) WHERE status = 'pending';

-- ============================================================================
-- REVIEW REQUEST AUTOMATION
-- ============================================================================

CREATE TABLE review_request_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE UNIQUE,

  -- Enable/disable
  is_enabled BOOLEAN DEFAULT false,

  -- Timing
  send_after_hours INTEGER DEFAULT 2,  -- Hours after class ends
  send_only_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  send_time_start TIME DEFAULT '10:00',
  send_time_end TIME DEFAULT '20:00',

  -- Targeting
  min_classes_attended INTEGER DEFAULT 3,  -- Only ask after X classes
  exclude_recent_days INTEGER DEFAULT 30,  -- Don't ask if asked within X days
  exclude_low_engagement BOOLEAN DEFAULT true,

  -- Platforms
  google_place_id TEXT,
  google_review_url TEXT,
  yelp_business_id TEXT,
  yelp_review_url TEXT,
  facebook_page_id TEXT,
  facebook_review_url TEXT,

  -- Message template
  sms_template TEXT DEFAULT 'Hi {{first_name}}! How was your {{class_name}} class? We''d love to hear your feedback: {{review_url}}',
  email_subject TEXT DEFAULT 'How was your class at {{studio_name}}?',
  email_template TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'clicked', 'reviewed', 'skipped', 'suppressed'
  )),

  -- What we sent
  channel TEXT,  -- 'sms', 'email'
  platform TEXT,  -- 'google', 'yelp', 'facebook'
  review_url TEXT,

  -- Tracking
  sent_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  skip_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_review_requests_profile ON review_requests(profile_id, created_at DESC);

-- ============================================================================
-- CHECK-IN INFRASTRUCTURE
-- ============================================================================

-- Member QR codes for check-in
CREATE TABLE member_check_in_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Code data
  code_token TEXT NOT NULL UNIQUE,
  qr_data TEXT NOT NULL,  -- Encoded payload for QR

  -- Wallet passes
  apple_wallet_pass_url TEXT,
  google_wallet_pass_url TEXT,

  -- Validity
  generated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  is_active BOOLEAN DEFAULT true,

  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0,

  UNIQUE(profile_id, studio_id)
);

CREATE INDEX idx_member_check_in_codes_token ON member_check_in_codes(code_token);

-- Kiosk devices for self-check-in
CREATE TABLE kiosk_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id),

  -- Identity
  name TEXT NOT NULL,
  device_token TEXT NOT NULL UNIQUE,

  -- Configuration
  settings JSONB DEFAULT '{}',
  /*
  {
    "auto_lock_minutes": 30,
    "allow_booking": true,
    "allow_purchase": false,
    "check_in_window_minutes": 30,
    "show_upcoming_classes": true,
    "require_photo_verification": false,
    "play_sound_on_scan": true
  }
  */

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_heartbeat_at TIMESTAMPTZ,
  current_version TEXT,
  ip_address INET,

  -- Security
  pin_hash TEXT,  -- PIN to exit kiosk mode
  allowed_hours_start TIME,
  allowed_hours_end TIME,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Check-in log with method tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS
  check_in_method TEXT CHECK (check_in_method IN ('qr_scan', 'kiosk_search', 'kiosk_list', 'staff_manual', 'auto'));

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS
  check_in_device_id UUID REFERENCES kiosk_devices(id);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS
  check_in_by UUID REFERENCES profiles(id);

-- ============================================================================
-- WAITLIST AUTOMATION
-- ============================================================================

-- Waitlist settings per studio
CREATE TABLE waitlist_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE UNIQUE,

  -- Auto-promotion
  auto_promote_enabled BOOLEAN DEFAULT true,
  promotion_window_minutes INTEGER DEFAULT 120,  -- Only promote within X minutes of class
  notification_channels TEXT[] DEFAULT ARRAY['push', 'sms', 'email'],

  -- Response time
  response_deadline_minutes INTEGER DEFAULT 15,  -- Time to confirm before next person
  max_promotion_attempts INTEGER DEFAULT 3,  -- Try this many people before giving up

  -- Targeting
  prioritize_members BOOLEAN DEFAULT true,  -- Members get priority over drop-ins
  prioritize_by_waitlist_time BOOLEAN DEFAULT true,  -- First-come-first-served

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Waitlist promotion log
CREATE TABLE waitlist_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  class_occurrence_id UUID NOT NULL REFERENCES class_occurrences(id) ON DELETE CASCADE,

  -- Who was promoted
  profile_id UUID NOT NULL REFERENCES profiles(id),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Notification sent, waiting for response
    'confirmed',    -- Member confirmed, moved to confirmed booking
    'declined',     -- Member declined
    'expired',      -- No response within deadline
    'cancelled'     -- Spot filled by someone else
  )),

  -- Timing
  promoted_at TIMESTAMPTZ DEFAULT now(),
  notified_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ,

  -- What spot opened
  opened_by_cancellation_id UUID,  -- The booking that cancelled

  -- Notifications sent
  notification_channels TEXT[],
  notification_ids UUID[],

  -- Response
  response_method TEXT,  -- 'sms_reply', 'app_click', 'auto_timeout'

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_waitlist_promotions_booking ON waitlist_promotions(booking_id);
CREATE INDEX idx_waitlist_promotions_pending ON waitlist_promotions(status, deadline_at)
  WHERE status = 'pending';

-- ============================================================================
-- SCHEDULE AUTOMATION: BUFFERS & SMART CAPACITY
-- ============================================================================

-- Class buffer/turnover settings
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS
  buffer_before_minutes INTEGER DEFAULT 0;

ALTER TABLE offerings ADD COLUMN IF NOT EXISTS
  buffer_after_minutes INTEGER DEFAULT 0;

ALTER TABLE offerings ADD COLUMN IF NOT EXISTS
  setup_instructions TEXT;

ALTER TABLE offerings ADD COLUMN IF NOT EXISTS
  cleanup_instructions TEXT;

-- Room-level buffer settings
ALTER TABLE locations ADD COLUMN IF NOT EXISTS
  default_buffer_minutes INTEGER DEFAULT 15;

-- Smart capacity (dynamic based on room setup)
CREATE TABLE room_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,

  -- Configuration name
  config_name TEXT NOT NULL,  -- 'standard', 'socially_distanced', 'workshop'

  -- Capacity
  capacity INTEGER NOT NULL,
  mat_spots INTEGER,
  equipment_spots JSONB,  -- {"reformers": 10, "bikes": 20}

  -- Visual layout (for spot selection)
  layout_svg TEXT,
  spot_positions JSONB,  -- [{id, x, y, type, label}]

  -- When to use
  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(location_id, room_name, config_name)
);

-- Link classes to specific room configurations
ALTER TABLE class_occurrences ADD COLUMN IF NOT EXISTS
  room_configuration_id UUID REFERENCES room_configurations(id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_request_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_check_in_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_configurations ENABLE ROW LEVEL SECURITY;

-- Notification preferences: users manage their own
CREATE POLICY "Users manage their own notification preferences"
  ON notification_preferences FOR ALL
  USING (profile_id = auth.uid());

-- Push subscriptions: users manage their own
CREATE POLICY "Users manage their own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (profile_id = auth.uid());

-- SMS conversations: studio staff can view
CREATE POLICY "Studio staff can manage SMS conversations"
  ON sms_conversations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = sms_conversations.studio_id
        AND studio_staff.profile_id = auth.uid()
    )
  );

-- Notification deliveries: users can view their own
CREATE POLICY "Users can view their notification history"
  ON notification_deliveries FOR SELECT
  USING (profile_id = auth.uid());

-- Review settings: studio admins only
CREATE POLICY "Studio admins manage review settings"
  ON review_request_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = review_request_settings.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin')
    )
  );

-- Check-in codes: users can view their own
CREATE POLICY "Users can view their check-in codes"
  ON member_check_in_codes FOR SELECT
  USING (profile_id = auth.uid());

-- Kiosk devices: studio staff can manage
CREATE POLICY "Studio staff manage kiosks"
  ON kiosk_devices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = kiosk_devices.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin')
    )
  );

-- Waitlist settings: studio admins
CREATE POLICY "Studio admins manage waitlist settings"
  ON waitlist_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = waitlist_settings.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin')
    )
  );

-- Room configurations: studio staff
CREATE POLICY "Studio staff manage room configurations"
  ON room_configurations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM locations l
      JOIN studio_staff ss ON ss.studio_id = l.studio_id
      WHERE l.id = room_configurations.location_id
        AND ss.profile_id = auth.uid()
        AND ss.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- FUNCTIONS FOR AUTOMATION
-- ============================================================================

-- Function to auto-promote from waitlist when spot opens
CREATE OR REPLACE FUNCTION process_waitlist_promotion()
RETURNS TRIGGER AS $$
DECLARE
  v_class class_occurrences%ROWTYPE;
  v_settings waitlist_settings%ROWTYPE;
  v_next_waitlist bookings%ROWTYPE;
BEGIN
  -- Only process when a booking is cancelled
  IF NEW.status = 'cancelled' AND OLD.status IN ('confirmed', 'checked_in') THEN
    -- Get class details
    SELECT * INTO v_class FROM class_occurrences WHERE id = NEW.class_occurrence_id;

    -- Get waitlist settings
    SELECT * INTO v_settings FROM waitlist_settings WHERE studio_id = v_class.studio_id;

    -- Check if auto-promote is enabled
    IF v_settings.auto_promote_enabled THEN
      -- Find next person on waitlist
      SELECT * INTO v_next_waitlist
      FROM bookings
      WHERE class_occurrence_id = NEW.class_occurrence_id
        AND status = 'waitlisted'
      ORDER BY created_at ASC
      LIMIT 1;

      IF v_next_waitlist.id IS NOT NULL THEN
        -- Create promotion record (notification will be sent by Edge Function)
        INSERT INTO waitlist_promotions (
          booking_id,
          class_occurrence_id,
          profile_id,
          opened_by_cancellation_id,
          deadline_at
        ) VALUES (
          v_next_waitlist.id,
          NEW.class_occurrence_id,
          v_next_waitlist.profile_id,
          NEW.id,
          now() + (v_settings.response_deadline_minutes || ' minutes')::interval
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for waitlist auto-promotion
DROP TRIGGER IF EXISTS trigger_waitlist_promotion ON bookings;
CREATE TRIGGER trigger_waitlist_promotion
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION process_waitlist_promotion();

-- Function to generate check-in code
CREATE OR REPLACE FUNCTION generate_check_in_code(p_profile_id UUID, p_studio_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
  v_qr_data TEXT;
BEGIN
  -- Generate unique token
  v_token := encode(gen_random_bytes(16), 'hex');

  -- Create QR data payload
  v_qr_data := json_build_object(
    'v', 1,
    'm', substr(p_profile_id::text, 1, 8),
    's', substr(p_studio_id::text, 1, 8),
    't', v_token,
    'e', extract(epoch from now() + interval '7 days')::bigint
  )::text;

  -- Upsert the code
  INSERT INTO member_check_in_codes (profile_id, studio_id, code_token, qr_data)
  VALUES (p_profile_id, p_studio_id, v_token, v_qr_data)
  ON CONFLICT (profile_id, studio_id)
  DO UPDATE SET
    code_token = v_token,
    qr_data = v_qr_data,
    generated_at = now(),
    expires_at = now() + interval '7 days',
    is_active = true;

  RETURN v_token;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_notification_preferences_profile ON notification_preferences(profile_id);
CREATE INDEX idx_push_subscriptions_profile ON push_subscriptions(profile_id);
CREATE INDEX idx_sms_conversations_studio ON sms_conversations(studio_id, last_message_at DESC);
CREATE INDEX idx_review_requests_studio ON review_requests(studio_id, created_at DESC);
CREATE INDEX idx_kiosk_devices_studio ON kiosk_devices(studio_id);
CREATE INDEX idx_kiosk_devices_token ON kiosk_devices(device_token);
