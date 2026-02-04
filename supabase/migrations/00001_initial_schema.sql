-- Tandava Studio Management Platform
-- V1 Alpha Database Schema
-- Supports: multi-location studios, role-based staff, scheduling, bookings,
--           memberships, class packs, transactions, and importer infrastructure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('owner', 'admin', 'teacher', 'front_desk', 'student');
CREATE TYPE booking_status AS ENUM ('confirmed', 'waitlisted', 'cancelled', 'no_show', 'checked_in', 'late_cancel');
CREATE TYPE membership_status AS ENUM ('active', 'paused', 'cancelled', 'expired', 'past_due');
CREATE TYPE membership_billing_cycle AS ENUM ('weekly', 'monthly', 'quarterly', 'annual');
CREATE TYPE class_pack_status AS ENUM ('active', 'expired', 'exhausted');
CREATE TYPE transaction_type AS ENUM ('membership_purchase', 'membership_renewal', 'class_pack_purchase', 'drop_in', 'workshop', 'retreat', 'late_cancel_fee', 'refund', 'credit_purchase');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payment_method_type AS ENUM ('card', 'bank_account', 'apple_pay', 'google_pay');
CREATE TYPE schedule_recurrence AS ENUM ('daily', 'weekly', 'biweekly', 'monthly');
CREATE TYPE override_type AS ENUM ('sub', 'cancellation', 'room_change', 'time_change', 'one_off');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
CREATE TYPE import_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'partial');
CREATE TYPE import_source AS ENUM ('mindbody', 'walla', 'arketa', 'momoyoga', 'generic_csv');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push', 'in_app');
CREATE TYPE teacher_pay_type AS ENUM ('per_class', 'revenue_share', 'hourly', 'salary');
CREATE TYPE credit_type AS ENUM ('earned', 'purchased', 'gifted', 'promotional');
CREATE TYPE credit_status AS ENUM ('available', 'used', 'expired');

-- ============================================================================
-- STUDIOS & LOCATIONS
-- ============================================================================

CREATE TABLE studios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  currency TEXT NOT NULL DEFAULT 'USD',
  -- Stripe Connect
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  -- Discovery
  discoverable BOOLEAN DEFAULT FALSE,
  -- Branding (PWA)
  brand_primary_color TEXT DEFAULT '#4fd1c5',
  brand_secondary_color TEXT DEFAULT '#f687b3',
  brand_font TEXT DEFAULT 'DM Sans',
  -- Policies
  default_cancellation_minutes INTEGER DEFAULT 120,
  late_cancel_fee_cents INTEGER DEFAULT 0,
  no_show_fee_cents INTEGER DEFAULT 0,
  waitlist_enabled BOOLEAN DEFAULT TRUE,
  max_waitlist_size INTEGER DEFAULT 10,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  -- Room/space info
  rooms JSONB DEFAULT '[]',
  amenities TEXT[] DEFAULT '{}',
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_locations_studio ON locations(studio_id);

-- ============================================================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  pronouns TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  bio TEXT,
  -- Teacher-specific
  specialties TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  instagram_handle TEXT,
  website TEXT,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STUDIO STAFF (join table: profiles <-> studios with roles)
-- ============================================================================

CREATE TABLE studio_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'teacher',
  -- Teacher pay config
  pay_type teacher_pay_type,
  pay_rate_cents INTEGER,
  pay_revenue_share_pct DECIMAL(5, 2),
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  can_sub BOOLEAN DEFAULT TRUE,
  -- Notifications
  notify_on_sub_request BOOLEAN DEFAULT TRUE,
  notify_on_booking BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(studio_id, profile_id)
);

CREATE INDEX idx_studio_staff_studio ON studio_staff(studio_id);
CREATE INDEX idx_studio_staff_profile ON studio_staff(profile_id);

-- ============================================================================
-- STUDIO MEMBERS (students who belong to a studio)
-- ============================================================================

CREATE TABLE studio_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Student notes visible to studio staff
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  -- Waivers
  waiver_signed_at TIMESTAMPTZ,
  -- Stats (denormalized for quick access)
  total_classes_attended INTEGER DEFAULT 0,
  last_class_at TIMESTAMPTZ,
  lifetime_revenue_cents BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(studio_id, profile_id)
);

CREATE INDEX idx_studio_members_studio ON studio_members(studio_id);
CREATE INDEX idx_studio_members_profile ON studio_members(profile_id);

-- ============================================================================
-- OFFERINGS (class types, not individual occurrences)
-- ============================================================================

CREATE TABLE offerings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'class',
  style TEXT,
  level TEXT DEFAULT 'all',
  is_heated BOOLEAN DEFAULT FALSE,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  capacity INTEGER NOT NULL DEFAULT 20,
  -- Pricing
  drop_in_price_cents INTEGER,
  -- Media
  image_url TEXT,
  -- Requirements
  what_to_bring TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  -- Discovery
  discoverable BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(studio_id, slug)
);

CREATE INDEX idx_offerings_studio ON offerings(studio_id);

-- ============================================================================
-- SCHEDULE RULES (recurring patterns that generate occurrences)
-- ============================================================================

CREATE TABLE schedule_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- Recurrence pattern
  recurrence schedule_recurrence NOT NULL DEFAULT 'weekly',
  day_of_week day_of_week NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  -- Room within location
  room TEXT,
  -- Capacity override (null = use offering default)
  capacity_override INTEGER,
  -- Date range for the rule
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedule_rules_studio ON schedule_rules(studio_id);
CREATE INDEX idx_schedule_rules_offering ON schedule_rules(offering_id);

-- ============================================================================
-- CLASS OCCURRENCES (generated from rules or one-off)
-- ============================================================================

CREATE TABLE class_occurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  schedule_rule_id UUID REFERENCES schedule_rules(id) ON DELETE SET NULL,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- Actual time for this occurrence
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  -- Room
  room TEXT,
  -- Capacity
  capacity INTEGER NOT NULL DEFAULT 20,
  -- Status
  is_cancelled BOOLEAN DEFAULT FALSE,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  -- Sub tracking
  original_teacher_id UUID REFERENCES profiles(id),
  is_subbed BOOLEAN DEFAULT FALSE,
  sub_requested_at TIMESTAMPTZ,
  sub_confirmed_at TIMESTAMPTZ,
  sub_notes TEXT,
  -- Denormalized counts for quick display
  booked_count INTEGER DEFAULT 0,
  waitlist_count INTEGER DEFAULT 0,
  checked_in_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_class_occurrences_studio ON class_occurrences(studio_id);
CREATE INDEX idx_class_occurrences_starts_at ON class_occurrences(starts_at);
CREATE INDEX idx_class_occurrences_teacher ON class_occurrences(teacher_id);
CREATE INDEX idx_class_occurrences_offering ON class_occurrences(offering_id);
CREATE INDEX idx_class_occurrences_studio_date ON class_occurrences(studio_id, starts_at);

-- ============================================================================
-- SCHEDULE OVERRIDES
-- ============================================================================

CREATE TABLE schedule_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  class_occurrence_id UUID NOT NULL REFERENCES class_occurrences(id) ON DELETE CASCADE,
  override_type override_type NOT NULL,
  -- What changed
  new_teacher_id UUID REFERENCES profiles(id),
  new_room TEXT,
  new_starts_at TIMESTAMPTZ,
  new_ends_at TIMESTAMPTZ,
  reason TEXT,
  -- Who made the change
  created_by UUID REFERENCES profiles(id),
  -- Notification tracking
  students_notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedule_overrides_occurrence ON schedule_overrides(class_occurrence_id);

-- ============================================================================
-- BOOKINGS
-- ============================================================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  class_occurrence_id UUID NOT NULL REFERENCES class_occurrences(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status booking_status NOT NULL DEFAULT 'confirmed',
  -- Waitlist
  waitlist_position INTEGER,
  -- Payment source
  membership_id UUID,
  class_pack_id UUID,
  transaction_id UUID,
  -- Check-in
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES profiles(id),
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  is_late_cancel BOOLEAN DEFAULT FALSE,
  -- Metadata
  booked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_occurrence_id, profile_id)
);

CREATE INDEX idx_bookings_studio ON bookings(studio_id);
CREATE INDEX idx_bookings_occurrence ON bookings(class_occurrence_id);
CREATE INDEX idx_bookings_profile ON bookings(profile_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_profile_date ON bookings(profile_id, booked_at);

-- ============================================================================
-- MEMBERSHIPS
-- ============================================================================

CREATE TABLE membership_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  billing_cycle membership_billing_cycle NOT NULL DEFAULT 'monthly',
  price_cents INTEGER NOT NULL,
  -- Limits
  classes_per_cycle INTEGER, -- null = unlimited
  locations TEXT[] DEFAULT '{}', -- empty = all locations
  offering_ids UUID[] DEFAULT '{}', -- empty = all offerings
  -- Trial
  trial_days INTEGER DEFAULT 0,
  trial_price_cents INTEGER DEFAULT 0,
  -- Auto-renewal
  auto_renew BOOLEAN DEFAULT TRUE,
  -- Visibility
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_membership_types_studio ON membership_types(studio_id);

CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  membership_type_id UUID NOT NULL REFERENCES membership_types(id) ON DELETE RESTRICT,
  status membership_status NOT NULL DEFAULT 'active',
  -- Billing
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  -- Usage tracking
  classes_used_this_cycle INTEGER DEFAULT 0,
  -- Stripe
  stripe_subscription_id TEXT,
  stripe_payment_method_id TEXT,
  -- Dates
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paused_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memberships_studio ON memberships(studio_id);
CREATE INDEX idx_memberships_profile ON memberships(profile_id);
CREATE INDEX idx_memberships_status ON memberships(status);

-- ============================================================================
-- CLASS PACKS
-- ============================================================================

CREATE TABLE class_pack_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  class_count INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  validity_days INTEGER NOT NULL DEFAULT 90,
  -- Restrictions
  offering_ids UUID[] DEFAULT '{}', -- empty = all offerings
  locations TEXT[] DEFAULT '{}', -- empty = all locations
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_class_pack_types_studio ON class_pack_types(studio_id);

CREATE TABLE class_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_pack_type_id UUID NOT NULL REFERENCES class_pack_types(id) ON DELETE RESTRICT,
  status class_pack_status NOT NULL DEFAULT 'active',
  classes_remaining INTEGER NOT NULL,
  classes_total INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  -- Stripe
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_class_packs_studio ON class_packs(studio_id);
CREATE INDEX idx_class_packs_profile ON class_packs(profile_id);
CREATE INDEX idx_class_packs_status ON class_packs(status);

-- ============================================================================
-- TRANSACTIONS & PAYMENTS
-- ============================================================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  -- Amount
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  -- Tax
  tax_cents INTEGER DEFAULT 0,
  -- Net (amount - platform fee)
  net_amount_cents INTEGER,
  platform_fee_cents INTEGER DEFAULT 0,
  -- References
  membership_id UUID REFERENCES memberships(id),
  class_pack_id UUID REFERENCES class_packs(id),
  booking_id UUID REFERENCES bookings(id),
  -- Stripe
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_refund_id TEXT,
  -- Refund tracking
  refunded_amount_cents INTEGER DEFAULT 0,
  refund_reason TEXT,
  -- Description
  description TEXT,
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_studio ON transactions(studio_id);
CREATE INDEX idx_transactions_profile ON transactions(profile_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_transactions_studio_date ON transactions(studio_id, created_at);

-- ============================================================================
-- CREDITS SYSTEM
-- ============================================================================

CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type credit_type NOT NULL DEFAULT 'earned',
  status credit_status NOT NULL DEFAULT 'available',
  amount_cents INTEGER NOT NULL,
  remaining_cents INTEGER NOT NULL,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  -- References
  transaction_id UUID REFERENCES transactions(id),
  booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credits_studio_profile ON credits(studio_id, profile_id);
CREATE INDEX idx_credits_status ON credits(status);

-- ============================================================================
-- PAYMENT METHODS (stored per student per studio)
-- ============================================================================

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type payment_method_type NOT NULL DEFAULT 'card',
  -- Stripe references
  stripe_payment_method_id TEXT NOT NULL,
  -- Display info (never store full card numbers)
  brand TEXT,
  last_four TEXT,
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_studio_profile ON payment_methods(studio_id, profile_id);

-- ============================================================================
-- TEACHER PAYROLL
-- ============================================================================

CREATE TABLE payroll_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_occurrence_id UUID REFERENCES class_occurrences(id),
  -- Pay calculation
  pay_type teacher_pay_type NOT NULL,
  base_rate_cents INTEGER,
  revenue_share_pct DECIMAL(5, 2),
  calculated_amount_cents INTEGER NOT NULL,
  -- Class info (denormalized for reporting)
  class_date DATE NOT NULL,
  class_name TEXT,
  attendee_count INTEGER DEFAULT 0,
  class_revenue_cents INTEGER DEFAULT 0,
  -- Payment status
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  -- Period
  pay_period_start DATE,
  pay_period_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payroll_studio ON payroll_entries(studio_id);
CREATE INDEX idx_payroll_teacher ON payroll_entries(teacher_id);
CREATE INDEX idx_payroll_date ON payroll_entries(class_date);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL DEFAULT 'in_app',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  -- Link to action
  action_url TEXT,
  -- References
  class_occurrence_id UUID REFERENCES class_occurrences(id),
  booking_id UUID REFERENCES bookings(id),
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_profile ON notifications(profile_id);
CREATE INDEX idx_notifications_unread ON notifications(profile_id, is_read) WHERE NOT is_read;

-- ============================================================================
-- IMPORTER INFRASTRUCTURE
-- ============================================================================

CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  source import_source NOT NULL,
  status import_status NOT NULL DEFAULT 'pending',
  -- File info
  file_name TEXT,
  file_url TEXT,
  file_size_bytes BIGINT,
  -- Column mapping (user-defined mapping from source columns to our schema)
  column_mapping JSONB DEFAULT '{}',
  -- Processing stats
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  success_rows INTEGER DEFAULT 0,
  error_rows INTEGER DEFAULT 0,
  skipped_rows INTEGER DEFAULT 0,
  -- Error log
  errors JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  -- What was imported
  import_type TEXT NOT NULL, -- 'clients', 'classes', 'transactions', 'memberships', 'attendance'
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  -- Who triggered it
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_import_jobs_studio ON import_jobs(studio_id);

CREATE TABLE import_field_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source import_source NOT NULL,
  import_type TEXT NOT NULL,
  -- Source field -> Target field mapping
  source_field TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_field TEXT NOT NULL,
  -- Transformation
  transform_function TEXT, -- e.g., 'to_date', 'to_cents', 'to_phone'
  is_required BOOLEAN DEFAULT FALSE,
  default_value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-populate MindBody field mappings
INSERT INTO import_field_mappings (source, import_type, source_field, target_table, target_field, transform_function, is_required, description) VALUES
  -- Client import mappings
  ('mindbody', 'clients', 'First Name', 'profiles', 'first_name', NULL, TRUE, 'Client first name'),
  ('mindbody', 'clients', 'Last Name', 'profiles', 'last_name', NULL, TRUE, 'Client last name'),
  ('mindbody', 'clients', 'Email', 'profiles', 'email', 'to_lowercase', TRUE, 'Client email address'),
  ('mindbody', 'clients', 'Mobile Phone', 'profiles', 'phone', 'to_phone', FALSE, 'Client mobile phone'),
  ('mindbody', 'clients', 'Home Phone', 'profiles', 'phone', 'to_phone', FALSE, 'Fallback phone number'),
  ('mindbody', 'clients', 'Birth Date', 'profiles', 'date_of_birth', 'to_date', FALSE, 'Date of birth'),
  ('mindbody', 'clients', 'Emergency Contact Name', 'profiles', 'emergency_contact_name', NULL, FALSE, 'Emergency contact name'),
  ('mindbody', 'clients', 'Emergency Contact Phone', 'profiles', 'emergency_contact_phone', 'to_phone', FALSE, 'Emergency contact phone'),
  ('mindbody', 'clients', 'Notes', 'studio_members', 'notes', NULL, FALSE, 'Client notes'),
  -- Attendance/class history mappings
  ('mindbody', 'attendance', 'Client First Name', 'profiles', 'first_name', NULL, TRUE, 'Student first name'),
  ('mindbody', 'attendance', 'Client Last Name', 'profiles', 'last_name', NULL, TRUE, 'Student last name'),
  ('mindbody', 'attendance', 'Client Email', 'profiles', 'email', 'to_lowercase', FALSE, 'Student email for matching'),
  ('mindbody', 'attendance', 'Class Name', 'offerings', 'name', NULL, TRUE, 'Class/offering name'),
  ('mindbody', 'attendance', 'Class Date', 'class_occurrences', 'starts_at', 'to_datetime', TRUE, 'When the class occurred'),
  ('mindbody', 'attendance', 'Class Time', 'class_occurrences', 'starts_at', 'to_time', TRUE, 'Class start time'),
  ('mindbody', 'attendance', 'Teacher', 'profiles', 'display_name', NULL, FALSE, 'Teacher name'),
  ('mindbody', 'attendance', 'Location', 'locations', 'name', NULL, FALSE, 'Studio location'),
  ('mindbody', 'attendance', 'Status', 'bookings', 'status', 'to_booking_status', TRUE, 'Booking/attendance status'),
  ('mindbody', 'attendance', 'Signed In', 'bookings', 'checked_in_at', 'to_boolean', FALSE, 'Whether student checked in'),
  -- Transaction mappings
  ('mindbody', 'transactions', 'Client Name', 'profiles', 'display_name', NULL, TRUE, 'Client name'),
  ('mindbody', 'transactions', 'Sale Date', 'transactions', 'created_at', 'to_datetime', TRUE, 'Transaction date'),
  ('mindbody', 'transactions', 'Sale Amount', 'transactions', 'amount_cents', 'to_cents', TRUE, 'Transaction amount'),
  ('mindbody', 'transactions', 'Item Name', 'transactions', 'description', NULL, TRUE, 'What was purchased'),
  ('mindbody', 'transactions', 'Payment Method', 'transactions', 'metadata', NULL, FALSE, 'How they paid');

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_pack_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Studio staff can view profiles of members at their studio
CREATE POLICY "Staff can view studio member profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT sm.profile_id FROM studio_members sm
      JOIN studio_staff ss ON ss.studio_id = sm.studio_id
      WHERE ss.profile_id = auth.uid()
    )
  );

-- Studios: staff can view their studios
CREATE POLICY "Staff can view their studios"
  ON studios FOR SELECT
  USING (
    id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid())
  );

-- Studios: owners and admins can update
CREATE POLICY "Owners and admins can update studios"
  ON studios FOR UPDATE
  USING (
    id IN (
      SELECT studio_id FROM studio_staff
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Members can view studios they belong to
CREATE POLICY "Members can view their studios"
  ON studios FOR SELECT
  USING (
    id IN (SELECT studio_id FROM studio_members WHERE profile_id = auth.uid())
  );

-- Discoverable studios are public
CREATE POLICY "Discoverable studios are public"
  ON studios FOR SELECT
  USING (discoverable = TRUE);

-- Locations: visible to studio staff and members
CREATE POLICY "Studio participants can view locations"
  ON locations FOR SELECT
  USING (
    studio_id IN (
      SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()
      UNION
      SELECT studio_id FROM studio_members WHERE profile_id = auth.uid()
    )
  );

-- Offerings: visible to studio staff and members, and discoverable
CREATE POLICY "Studio participants can view offerings"
  ON offerings FOR SELECT
  USING (
    studio_id IN (
      SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()
      UNION
      SELECT studio_id FROM studio_members WHERE profile_id = auth.uid()
    )
    OR (discoverable = TRUE AND studio_id IN (SELECT id FROM studios WHERE discoverable = TRUE))
  );

-- Class occurrences: visible to staff and members
CREATE POLICY "Studio participants can view class occurrences"
  ON class_occurrences FOR SELECT
  USING (
    studio_id IN (
      SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()
      UNION
      SELECT studio_id FROM studio_members WHERE profile_id = auth.uid()
    )
  );

-- Bookings: users can see their own bookings, staff can see all studio bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Staff can view studio bookings"
  ON bookings FOR SELECT
  USING (
    studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid())
  );

-- Memberships: users can see their own, staff can see all
CREATE POLICY "Users can view own memberships"
  ON memberships FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Staff can view studio memberships"
  ON memberships FOR SELECT
  USING (
    studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid())
  );

-- Class packs: users can see their own, staff can see all
CREATE POLICY "Users can view own class packs"
  ON class_packs FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Staff can view studio class packs"
  ON class_packs FOR SELECT
  USING (
    studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid())
  );

-- Transactions: users can see their own, staff can see all
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Staff can view studio transactions"
  ON transactions FOR SELECT
  USING (
    studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid())
  );

-- Notifications: users can only see their own
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (profile_id = auth.uid());

-- Payment methods: users can see their own
CREATE POLICY "Users can view own payment methods"
  ON payment_methods FOR SELECT
  USING (profile_id = auth.uid());

-- Payroll: teachers see their own, owners/admins see all
CREATE POLICY "Teachers can view own payroll"
  ON payroll_entries FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Admins can view studio payroll"
  ON payroll_entries FOR SELECT
  USING (
    studio_id IN (
      SELECT studio_id FROM studio_staff
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Import jobs: only owners and admins
CREATE POLICY "Admins can manage import jobs"
  ON import_jobs FOR ALL
  USING (
    studio_id IN (
      SELECT studio_id FROM studio_staff
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Studio staff visibility
CREATE POLICY "Staff can view co-workers"
  ON studio_staff FOR SELECT
  USING (
    studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid())
  );

-- Studio members visibility for staff
CREATE POLICY "Staff can view studio members"
  ON studio_members FOR SELECT
  USING (
    studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid())
  );

-- Members can see they're a member
CREATE POLICY "Members can view own membership"
  ON studio_members FOR SELECT
  USING (profile_id = auth.uid());

-- Credits: users see their own
CREATE POLICY "Users can view own credits"
  ON credits FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Staff can view studio credits"
  ON credits FOR SELECT
  USING (
    studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid())
  );

-- Membership types: visible to staff and members
CREATE POLICY "Studio participants can view membership types"
  ON membership_types FOR SELECT
  USING (
    studio_id IN (
      SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()
      UNION
      SELECT studio_id FROM studio_members WHERE profile_id = auth.uid()
    )
  );

-- Class pack types: visible to staff and members
CREATE POLICY "Studio participants can view class pack types"
  ON class_pack_types FOR SELECT
  USING (
    studio_id IN (
      SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()
      UNION
      SELECT studio_id FROM studio_members WHERE profile_id = auth.uid()
    )
  );

-- Schedule rules: visible to staff
CREATE POLICY "Staff can view schedule rules"
  ON schedule_rules FOR SELECT
  USING (
    studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid())
  );

-- Schedule overrides: visible to staff
CREATE POLICY "Staff can view schedule overrides"
  ON schedule_overrides FOR SELECT
  USING (
    studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid())
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_studios_updated_at BEFORE UPDATE ON studios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_studio_staff_updated_at BEFORE UPDATE ON studio_staff FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_studio_members_updated_at BEFORE UPDATE ON studio_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_offerings_updated_at BEFORE UPDATE ON offerings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_schedule_rules_updated_at BEFORE UPDATE ON schedule_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_class_occurrences_updated_at BEFORE UPDATE ON class_occurrences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_class_packs_updated_at BEFORE UPDATE ON class_packs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_import_jobs_updated_at BEFORE UPDATE ON import_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_membership_types_updated_at BEFORE UPDATE ON membership_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_class_pack_types_updated_at BEFORE UPDATE ON class_pack_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update booking counts on class_occurrences when bookings change
CREATE OR REPLACE FUNCTION update_booking_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE class_occurrences SET
    booked_count = (
      SELECT COUNT(*) FROM bookings
      WHERE class_occurrence_id = COALESCE(NEW.class_occurrence_id, OLD.class_occurrence_id)
      AND status = 'confirmed'
    ),
    waitlist_count = (
      SELECT COUNT(*) FROM bookings
      WHERE class_occurrence_id = COALESCE(NEW.class_occurrence_id, OLD.class_occurrence_id)
      AND status = 'waitlisted'
    ),
    checked_in_count = (
      SELECT COUNT(*) FROM bookings
      WHERE class_occurrence_id = COALESCE(NEW.class_occurrence_id, OLD.class_occurrence_id)
      AND status = 'checked_in'
    )
  WHERE id = COALESCE(NEW.class_occurrence_id, OLD.class_occurrence_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_occurrence_counts_insert
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_booking_counts();

CREATE TRIGGER update_occurrence_counts_update
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_booking_counts();

CREATE TRIGGER update_occurrence_counts_delete
  AFTER DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_booking_counts();

-- Promote from waitlist when a confirmed booking is cancelled
CREATE OR REPLACE FUNCTION promote_from_waitlist()
RETURNS TRIGGER AS $$
DECLARE
  next_waitlisted UUID;
BEGIN
  IF NEW.status IN ('cancelled', 'late_cancel') AND OLD.status = 'confirmed' THEN
    SELECT id INTO next_waitlisted
    FROM bookings
    WHERE class_occurrence_id = NEW.class_occurrence_id
      AND status = 'waitlisted'
    ORDER BY waitlist_position ASC
    LIMIT 1;

    IF next_waitlisted IS NOT NULL THEN
      UPDATE bookings SET
        status = 'confirmed',
        waitlist_position = NULL
      WHERE id = next_waitlisted;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER promote_waitlist_on_cancel
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION promote_from_waitlist();

-- Decrement class pack on booking confirmation
CREATE OR REPLACE FUNCTION decrement_class_pack()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.class_pack_id IS NOT NULL AND NEW.status = 'confirmed' THEN
    UPDATE class_packs SET
      classes_remaining = classes_remaining - 1,
      status = CASE
        WHEN classes_remaining - 1 <= 0 THEN 'exhausted'::class_pack_status
        ELSE status
      END
    WHERE id = NEW.class_pack_id AND classes_remaining > 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_pack_on_booking
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION decrement_class_pack();

-- Increment membership usage on booking
CREATE OR REPLACE FUNCTION increment_membership_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.membership_id IS NOT NULL AND NEW.status = 'confirmed' THEN
    UPDATE memberships SET
      classes_used_this_cycle = classes_used_this_cycle + 1
    WHERE id = NEW.membership_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_membership_on_booking
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION increment_membership_usage();

-- Update studio member stats on check-in
CREATE OR REPLACE FUNCTION update_member_stats_on_checkin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'checked_in' AND OLD.status != 'checked_in' THEN
    UPDATE studio_members SET
      total_classes_attended = total_classes_attended + 1,
      last_class_at = NOW()
    WHERE studio_id = NEW.studio_id AND profile_id = NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_member_stats_checkin
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_member_stats_on_checkin();
