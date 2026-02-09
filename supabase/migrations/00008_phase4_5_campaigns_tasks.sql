-- Phase 4: Campaign Hub (Core Features - No External Ad Integrations)
-- Phase 5: Staff Task Management

-- ============================================================================
-- PHASE 4: CAMPAIGN HUB
-- ============================================================================

-- Campaign types and statuses
CREATE TYPE campaign_type AS ENUM (
  'email',
  'sms',
  'push',
  'multi_channel'
);

CREATE TYPE campaign_status AS ENUM (
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed',
  'cancelled'
);

-- Main campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type campaign_type NOT NULL DEFAULT 'email',
  status campaign_status NOT NULL DEFAULT 'draft',

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Targeting (JSON for flexibility)
  target_audience JSONB DEFAULT '{}',
  -- Example: {"membership_types": ["unlimited"], "tags": ["vip"], "last_visit_days": 30}

  estimated_recipients INTEGER DEFAULT 0,

  -- A/B Testing
  is_ab_test BOOLEAN DEFAULT FALSE,
  winning_variant_id UUID,
  ab_test_percentage INTEGER DEFAULT 50, -- % that gets variant B
  ab_winner_criteria VARCHAR(50) DEFAULT 'open_rate', -- open_rate, click_rate, conversion
  ab_winner_wait_hours INTEGER DEFAULT 4,

  -- Tracking
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaigns_studio ON campaigns(studio_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_scheduled ON campaigns(scheduled_at) WHERE status = 'scheduled';

-- Campaign message variants (for A/B testing and multi-channel)
CREATE TABLE campaign_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  variant_name VARCHAR(50) DEFAULT 'A', -- 'A', 'B', 'C' for A/B testing
  channel campaign_type NOT NULL,

  -- Email content
  email_subject VARCHAR(255),
  email_preview_text VARCHAR(255),
  email_body_html TEXT,
  email_body_text TEXT,

  -- SMS content
  sms_body VARCHAR(1600),

  -- Push content
  push_title VARCHAR(100),
  push_body VARCHAR(255),
  push_image_url TEXT,
  push_action_url TEXT,

  -- Template reference (optional)
  template_id UUID,

  -- Stats for this variant
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaign_messages_campaign ON campaign_messages(campaign_id);

-- Individual send records for tracking
CREATE TABLE campaign_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  message_id UUID REFERENCES campaign_messages(id) ON DELETE SET NULL,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  channel campaign_type NOT NULL,

  -- Delivery tracking
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_reason TEXT,

  -- External IDs for provider tracking
  external_message_id VARCHAR(255),

  -- Click tracking
  clicks JSONB DEFAULT '[]', -- [{url, clicked_at}]

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaign_sends_campaign ON campaign_sends(campaign_id);
CREATE INDEX idx_campaign_sends_profile ON campaign_sends(profile_id);
CREATE INDEX idx_campaign_sends_sent ON campaign_sends(sent_at);

-- Saved audience segments
CREATE TABLE audience_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Filter criteria (JSON)
  filters JSONB NOT NULL DEFAULT '{}',
  -- Example: {
  --   "membership_status": ["active"],
  --   "membership_types": ["unlimited", "10-pack"],
  --   "tags": ["yoga-lover"],
  --   "last_visit": {"operator": "within", "days": 30},
  --   "total_visits": {"operator": ">=", "value": 10},
  --   "lifetime_value": {"operator": ">=", "value": 500}
  -- }

  -- Dynamic count (updated periodically)
  member_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,

  is_dynamic BOOLEAN DEFAULT TRUE, -- Auto-updates vs. static list

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audience_segments_studio ON audience_segments(studio_id);

-- Static segment members (for non-dynamic segments)
CREATE TABLE audience_segment_members (
  segment_id UUID NOT NULL REFERENCES audience_segments(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (segment_id, profile_id)
);

-- UTM Templates for link tracking
CREATE TABLE utm_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- UTM parameters
  utm_source VARCHAR(255) NOT NULL,
  utm_medium VARCHAR(255) NOT NULL,
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),

  -- For generating unique tracking
  is_default BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_utm_templates_studio ON utm_templates(studio_id);

-- Link click tracking (for UTM and general link tracking)
CREATE TABLE link_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Source tracking
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  campaign_send_id UUID REFERENCES campaign_sends(id) ON DELETE SET NULL,

  -- UTM data
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),

  -- Click data
  destination_url TEXT NOT NULL,
  short_code VARCHAR(20),

  -- Visitor info
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,

  clicked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_link_clicks_studio ON link_clicks(studio_id);
CREATE INDEX idx_link_clicks_campaign ON link_clicks(campaign_id);
CREATE INDEX idx_link_clicks_short_code ON link_clicks(short_code);
CREATE INDEX idx_link_clicks_clicked ON link_clicks(clicked_at);

-- Landing page A/B test variants
CREATE TABLE landing_page_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landing_page_id UUID NOT NULL, -- References landing_pages from earlier migration

  variant_name VARCHAR(50) NOT NULL DEFAULT 'A',

  -- Content overrides (JSON patch format)
  content_overrides JSONB DEFAULT '{}',
  -- Example: {"headline": "New headline", "cta_text": "Sign Up Now"}

  -- Traffic allocation
  traffic_percentage INTEGER DEFAULT 50,

  -- Stats
  views INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,4) GENERATED ALWAYS AS (
    CASE WHEN views > 0 THEN conversions::DECIMAL / views ELSE 0 END
  ) STORED,

  is_control BOOLEAN DEFAULT FALSE,
  is_winner BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_landing_page_variants_page ON landing_page_variants(landing_page_id);

-- Email templates library
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'welcome', 'promotional', 'reminder', 'transactional'

  subject VARCHAR(255),
  preview_text VARCHAR(255),
  body_html TEXT,
  body_text TEXT,

  -- Template variables available
  variables JSONB DEFAULT '[]', -- ['first_name', 'studio_name', 'class_name']

  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  is_system BOOLEAN DEFAULT FALSE, -- System templates can't be deleted

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_email_templates_studio ON email_templates(studio_id);
CREATE INDEX idx_email_templates_category ON email_templates(category);

-- ============================================================================
-- PHASE 5: STAFF TASK MANAGEMENT
-- ============================================================================

-- Task priority and status
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Task categories
CREATE TABLE task_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280', -- Hex color
  icon VARCHAR(50), -- Lucide icon name

  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_categories_studio ON task_categories(studio_id);

-- Main tasks table
CREATE TABLE staff_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Task details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES task_categories(id) ON DELETE SET NULL,

  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'pending',

  -- Assignment
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Timing
  due_date DATE,
  due_time TIME,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),

  -- Location context
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  room_id UUID, -- If task is room-specific

  -- Recurrence (for recurring tasks)
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule_id UUID,
  parent_task_id UUID REFERENCES staff_tasks(id) ON DELETE SET NULL, -- For recurring instances

  -- Checklist items (embedded JSON for simplicity)
  checklist JSONB DEFAULT '[]',
  -- Example: [{"id": "1", "text": "Wipe down mats", "completed": false}]

  -- Attachments count (actual files in separate table)
  attachments_count INTEGER DEFAULT 0,

  -- Notes
  notes TEXT,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_staff_tasks_studio ON staff_tasks(studio_id);
CREATE INDEX idx_staff_tasks_assigned ON staff_tasks(assigned_to);
CREATE INDEX idx_staff_tasks_status ON staff_tasks(status);
CREATE INDEX idx_staff_tasks_due ON staff_tasks(due_date) WHERE status IN ('pending', 'in_progress');
CREATE INDEX idx_staff_tasks_category ON staff_tasks(category_id);
CREATE INDEX idx_staff_tasks_location ON staff_tasks(location_id);

-- Task recurrence rules
CREATE TABLE task_recurrence_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- RRULE-style recurrence
  frequency VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  interval_value INTEGER DEFAULT 1, -- Every X days/weeks/months

  -- Weekly: which days
  days_of_week INTEGER[] DEFAULT '{}', -- 0=Sunday, 1=Monday, etc.

  -- Monthly: which day or which weekday
  day_of_month INTEGER, -- 1-31
  week_of_month INTEGER, -- 1-5 (5 = last)

  -- Time of day for the task
  task_time TIME,

  -- Range
  starts_on DATE NOT NULL,
  ends_on DATE,
  max_occurrences INTEGER,
  occurrences_created INTEGER DEFAULT 0,

  -- Template for generated tasks
  task_template JSONB NOT NULL,
  -- Contains: title, description, category_id, priority, assigned_to, checklist, etc.

  -- Auto-assign rotation (optional)
  assignee_rotation UUID[] DEFAULT '{}', -- Rotate through these profile IDs
  current_rotation_index INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT TRUE,
  last_generated_at TIMESTAMPTZ,
  next_occurrence_at TIMESTAMPTZ,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_recurrence_studio ON task_recurrence_rules(studio_id);
CREATE INDEX idx_task_recurrence_next ON task_recurrence_rules(next_occurrence_at) WHERE is_active = TRUE;

-- Task attachments (photos, files)
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES staff_tasks(id) ON DELETE CASCADE,

  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  file_url TEXT NOT NULL,

  -- For completion photos
  is_completion_photo BOOLEAN DEFAULT FALSE,

  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_attachments_task ON task_attachments(task_id);

-- Task comments
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES staff_tasks(id) ON DELETE CASCADE,

  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,

  -- Mentions
  mentions UUID[] DEFAULT '{}', -- Profile IDs mentioned with @

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_comments_task ON task_comments(task_id);
CREATE INDEX idx_task_comments_created ON task_comments(created_at);

-- Task activity log
CREATE TABLE task_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES staff_tasks(id) ON DELETE CASCADE,

  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'created', 'assigned', 'status_changed', 'completed', etc.

  -- Change details
  old_value JSONB,
  new_value JSONB,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_activity_task ON task_activity(task_id);
CREATE INDEX idx_task_activity_created ON task_activity(created_at);

-- Task templates (for quick task creation)
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES task_categories(id) ON DELETE SET NULL,

  -- Default values
  default_title VARCHAR(255) NOT NULL,
  default_description TEXT,
  default_priority task_priority DEFAULT 'medium',
  default_checklist JSONB DEFAULT '[]',

  -- Estimated duration
  estimated_minutes INTEGER,

  -- Usage tracking
  times_used INTEGER DEFAULT 0,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_templates_studio ON task_templates(studio_id);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Update task attachment count
CREATE OR REPLACE FUNCTION update_task_attachments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE staff_tasks SET attachments_count = attachments_count + 1 WHERE id = NEW.task_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE staff_tasks SET attachments_count = attachments_count - 1 WHERE id = OLD.task_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_task_attachments_count
AFTER INSERT OR DELETE ON task_attachments
FOR EACH ROW EXECUTE FUNCTION update_task_attachments_count();

-- Log task status changes
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO task_activity (task_id, actor_id, action, old_value, new_value)
    VALUES (NEW.id, NEW.completed_by, 'status_changed',
            jsonb_build_object('status', OLD.status),
            jsonb_build_object('status', NEW.status));

    -- Set completed_at when status changes to completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      NEW.completed_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_task_status_change
BEFORE UPDATE ON staff_tasks
FOR EACH ROW EXECUTE FUNCTION log_task_status_change();

-- Update campaign stats from sends
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE campaigns SET
    total_sent = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = NEW.campaign_id),
    total_delivered = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = NEW.campaign_id AND delivered_at IS NOT NULL),
    total_opened = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = NEW.campaign_id AND opened_at IS NOT NULL),
    total_clicked = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = NEW.campaign_id AND clicked_at IS NOT NULL),
    total_converted = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = NEW.campaign_id AND converted_at IS NOT NULL),
    total_unsubscribed = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = NEW.campaign_id AND unsubscribed_at IS NOT NULL),
    total_bounced = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = NEW.campaign_id AND bounced_at IS NOT NULL),
    updated_at = now()
  WHERE id = NEW.campaign_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_campaign_stats
AFTER INSERT OR UPDATE ON campaign_sends
FOR EACH ROW EXECUTE FUNCTION update_campaign_stats();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE utm_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_recurrence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Studio staff can manage campaigns
CREATE POLICY "Studio staff can manage campaigns"
  ON campaigns FOR ALL
  USING (studio_id IN (SELECT studio_id FROM staff_roles WHERE profile_id = auth.uid()));

CREATE POLICY "Studio staff can manage campaign messages"
  ON campaign_messages FOR ALL
  USING (campaign_id IN (SELECT id FROM campaigns WHERE studio_id IN (SELECT studio_id FROM staff_roles WHERE profile_id = auth.uid())));

CREATE POLICY "Studio staff can view campaign sends"
  ON campaign_sends FOR SELECT
  USING (campaign_id IN (SELECT id FROM campaigns WHERE studio_id IN (SELECT studio_id FROM staff_roles WHERE profile_id = auth.uid())));

CREATE POLICY "Studio staff can manage audience segments"
  ON audience_segments FOR ALL
  USING (studio_id IN (SELECT studio_id FROM staff_roles WHERE profile_id = auth.uid()));

CREATE POLICY "Studio staff can manage audience members"
  ON audience_segment_members FOR ALL
  USING (segment_id IN (SELECT id FROM audience_segments WHERE studio_id IN (SELECT studio_id FROM staff_roles WHERE profile_id = auth.uid())));

CREATE POLICY "Studio staff can manage UTM templates"
  ON utm_templates FOR ALL
  USING (studio_id IN (SELECT studio_id FROM staff_roles WHERE profile_id = auth.uid()));

CREATE POLICY "Studio staff can view link clicks"
  ON link_clicks FOR SELECT
  USING (studio_id IN (SELECT studio_id FROM staff_roles WHERE profile_id = auth.uid()));

CREATE POLICY "Studio staff can manage email templates"
  ON email_templates FOR ALL
  USING (studio_id IN (SELECT studio_id FROM staff_roles WHERE profile_id = auth.uid()));

CREATE POLICY "Studio staff can manage task categories"
  ON task_categories FOR ALL
  USING (studio_id IN (SELECT studio_id FROM staff_roles WHERE profile_id = auth.uid()));

CREATE POLICY "Studio staff can manage tasks"
  ON staff_tasks FOR ALL
  USING (studio_id IN (SELECT studio_id FROM staff_roles WHERE profile_id = auth.uid()));

CREATE POLICY "Studio staff can manage task recurrence"
  ON task_recurrence_rules FOR ALL
  USING (studio_id IN (SELECT studio_id FROM staff_roles WHERE profile_id = auth.uid()));

CREATE POLICY "Studio staff can manage task attachments"
  ON task_attachments FOR ALL
  USING (task_id IN (SELECT id FROM staff_tasks WHERE studio_id IN (SELECT studio_id FROM staff_roles WHERE profile_id = auth.uid())));

CREATE POLICY "Studio staff can manage task comments"
  ON task_comments FOR ALL
  USING (task_id IN (SELECT id FROM staff_tasks WHERE studio_id IN (SELECT studio_id FROM staff_roles WHERE profile_id = auth.uid())));

CREATE POLICY "Studio staff can view task activity"
  ON task_activity FOR SELECT
  USING (task_id IN (SELECT id FROM staff_tasks WHERE studio_id IN (SELECT studio_id FROM staff_roles WHERE profile_id = auth.uid())));

CREATE POLICY "Studio staff can manage task templates"
  ON task_templates FOR ALL
  USING (studio_id IN (SELECT studio_id FROM staff_roles WHERE profile_id = auth.uid()));

-- ============================================================================
-- SEED DEFAULT TASK CATEGORIES
-- ============================================================================

-- Note: These would be created per-studio on first use, but here's the pattern
COMMENT ON TABLE task_categories IS 'Default categories: Cleaning, Maintenance, Inventory, Administrative, Customer Service, Marketing';
