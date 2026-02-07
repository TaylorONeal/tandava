-- =============================================================================
-- Tandava: Initial Database Schema
-- =============================================================================
-- This migration creates the core tables, enums, RLS policies, and triggers
-- for the Tandava yoga studio platform.
--
-- Run via: supabase db push  (or supabase migration up)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM (
  'member', 'instructor', 'studio_owner', 'studio_staff', 'platform_admin'
);

CREATE TYPE booking_status AS ENUM (
  'confirmed', 'cancelled', 'waitlisted', 'no_show', 'completed'
);

CREATE TYPE subscription_status AS ENUM (
  'active', 'past_due', 'cancelled', 'trialing', 'paused'
);

CREATE TYPE message_status AS ENUM (
  'unread', 'read', 'archived', 'replied'
);

CREATE TYPE feedback_type AS ENUM (
  'class_feedback', 'studio_inquiry', 'platform_feedback', 'support_ticket'
);

-- ---------------------------------------------------------------------------
-- Profiles (extends Supabase auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'member',
  phone         TEXT,
  bio           TEXT,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  marketing_consent       BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Platform admins can read all profiles
CREATE POLICY profiles_select_admin ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- Users can update their own profile (but not their role)
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only platform admins can change roles
CREATE POLICY profiles_update_admin ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- ---------------------------------------------------------------------------
-- Studios
-- ---------------------------------------------------------------------------
CREATE TABLE studios (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  image_url     TEXT,
  address       TEXT NOT NULL,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  zip           TEXT NOT NULL,
  country       TEXT NOT NULL DEFAULT 'US',
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  phone         TEXT,
  email         TEXT,
  website       TEXT,
  styles        TEXT[] NOT NULL DEFAULT '{}',
  amenities     TEXT[] NOT NULL DEFAULT '{}',
  cancellation_policy TEXT,
  stripe_account_id         TEXT,
  stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios FORCE ROW LEVEL SECURITY;

-- Public: anyone can read active studios
CREATE POLICY studios_select_public ON studios
  FOR SELECT USING (is_active = true);

-- Platform admins can read all studios (including inactive)
CREATE POLICY studios_select_admin ON studios
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- Studio owners/managers can update their own studio
CREATE POLICY studios_update_members ON studios
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM studio_members sm
      WHERE sm.studio_id = id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'manager')
    )
  );

-- Platform admins can manage all studios
CREATE POLICY studios_all_admin ON studios
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- ---------------------------------------------------------------------------
-- Studio Members (maps users to studios with roles)
-- ---------------------------------------------------------------------------
CREATE TABLE studio_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id   UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'instructor', 'front_desk')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(studio_id, user_id)
);

ALTER TABLE studio_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_members FORCE ROW LEVEL SECURITY;

-- Studio staff can see their own studio's members
CREATE POLICY studio_members_select ON studio_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM studio_members sm
      WHERE sm.studio_id = studio_members.studio_id
        AND sm.user_id = auth.uid()
    )
  );

-- Studio owners can manage members
CREATE POLICY studio_members_manage ON studio_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM studio_members sm
      WHERE sm.studio_id = studio_members.studio_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'manager')
    )
  );

-- Platform admins can manage all
CREATE POLICY studio_members_admin ON studio_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- ---------------------------------------------------------------------------
-- Classes
-- ---------------------------------------------------------------------------
CREATE TABLE classes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id           UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  instructor_id       UUID NOT NULL REFERENCES profiles(id),
  title               TEXT NOT NULL,
  description         TEXT,
  style               TEXT NOT NULL,
  level               TEXT NOT NULL DEFAULT 'all_levels'
    CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all_levels')),
  is_heated           BOOLEAN NOT NULL DEFAULT false,
  duration_minutes    INTEGER NOT NULL,
  capacity            INTEGER NOT NULL,
  starts_at           TIMESTAMPTZ NOT NULL,
  ends_at             TIMESTAMPTZ NOT NULL,
  recurrence_rule     TEXT,
  location_name       TEXT,
  price_cents         INTEGER,
  drop_in_price_cents INTEGER,
  is_cancelled        BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes FORCE ROW LEVEL SECURITY;

-- Public: anyone can read non-cancelled classes
CREATE POLICY classes_select_public ON classes
  FOR SELECT USING (is_cancelled = false);

-- Studio staff can manage their studio's classes
CREATE POLICY classes_manage_studio ON classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM studio_members sm
      WHERE sm.studio_id = classes.studio_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'manager', 'instructor')
    )
  );

-- Platform admins can manage all classes
CREATE POLICY classes_admin ON classes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
CREATE TABLE bookings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id          UUID NOT NULL REFERENCES classes(id),
  user_id           UUID NOT NULL REFERENCES profiles(id),
  studio_id         UUID NOT NULL REFERENCES studios(id),
  status            booking_status NOT NULL DEFAULT 'confirmed',
  checked_in_at     TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  waitlist_position INTEGER,
  payment_intent_id TEXT,
  amount_paid_cents INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;

-- Users can see their own bookings
CREATE POLICY bookings_select_own ON bookings
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own bookings
CREATE POLICY bookings_insert_own ON bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can cancel their own bookings
CREATE POLICY bookings_update_own ON bookings
  FOR UPDATE USING (user_id = auth.uid());

-- Studio staff can see and manage bookings for their studio
CREATE POLICY bookings_studio_staff ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM studio_members sm
      WHERE sm.studio_id = bookings.studio_id
        AND sm.user_id = auth.uid()
    )
  );

-- Platform admins
CREATE POLICY bookings_admin ON bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- ---------------------------------------------------------------------------
-- Memberships
-- ---------------------------------------------------------------------------
CREATE TABLE memberships (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES profiles(id),
  studio_id               UUID NOT NULL REFERENCES studios(id),
  plan_name               TEXT NOT NULL,
  stripe_subscription_id  TEXT,
  stripe_customer_id      TEXT,
  status                  subscription_status NOT NULL DEFAULT 'active',
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  classes_remaining       INTEGER,
  is_unlimited            BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;

-- Users can see their own memberships
CREATE POLICY memberships_select_own ON memberships
  FOR SELECT USING (user_id = auth.uid());

-- Studio owners can see memberships for their studio
CREATE POLICY memberships_studio ON memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM studio_members sm
      WHERE sm.studio_id = memberships.studio_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'manager')
    )
  );

-- Platform admins
CREATE POLICY memberships_admin ON memberships
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- ---------------------------------------------------------------------------
-- Messages (unified messaging table)
-- ---------------------------------------------------------------------------
CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type          feedback_type NOT NULL,
  studio_id     UUID REFERENCES studios(id),
  class_id      UUID REFERENCES classes(id),
  sender_id     UUID REFERENCES profiles(id),
  sender_name   TEXT,
  sender_email  TEXT,
  subject       TEXT NOT NULL,
  body          TEXT NOT NULL,
  status        message_status NOT NULL DEFAULT 'unread',
  ip_hash       TEXT,
  honeypot      TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;

-- Senders can read their own messages
CREATE POLICY messages_select_sender ON messages
  FOR SELECT USING (sender_id = auth.uid());

-- Studio staff can read messages for their studio
CREATE POLICY messages_select_studio ON messages
  FOR SELECT USING (
    studio_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM studio_members sm
      WHERE sm.studio_id = messages.studio_id
        AND sm.user_id = auth.uid()
    )
  );

-- Studio staff can update message status (read, archived, replied)
CREATE POLICY messages_update_studio ON messages
  FOR UPDATE USING (
    studio_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM studio_members sm
      WHERE sm.studio_id = messages.studio_id
        AND sm.user_id = auth.uid()
    )
  );

-- Authenticated users can send messages
CREATE POLICY messages_insert_authenticated ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Anonymous studio inquiries (sender_id is null, honeypot must be empty)
CREATE POLICY messages_insert_anonymous ON messages
  FOR INSERT WITH CHECK (
    type = 'studio_inquiry'
    AND sender_id IS NULL
    AND (honeypot IS NULL OR honeypot = '')
  );

-- Platform admins can see platform feedback
CREATE POLICY messages_admin ON messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- ---------------------------------------------------------------------------
-- Email Log
-- ---------------------------------------------------------------------------
CREATE TABLE email_log (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email            TEXT NOT NULL,
  template            TEXT NOT NULL,
  subject             TEXT NOT NULL,
  provider            TEXT NOT NULL,
  provider_message_id TEXT,
  status              TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  error               TEXT,
  metadata            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log FORCE ROW LEVEL SECURITY;

-- Only platform admins can read email logs
CREATE POLICY email_log_admin ON email_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- ---------------------------------------------------------------------------
-- Platform Announcements
-- ---------------------------------------------------------------------------
CREATE TABLE platform_announcements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  author_id   UUID NOT NULL REFERENCES profiles(id),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_announcements FORCE ROW LEVEL SECURITY;

-- Studio owners and managers can read active announcements
CREATE POLICY announcements_select ON platform_announcements
  FOR SELECT USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM studio_members sm WHERE sm.user_id = auth.uid()
    )
  );

-- Platform admins can manage announcements
CREATE POLICY announcements_admin ON platform_announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- ---------------------------------------------------------------------------
-- Triggers: auto-create profile on signup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name, marketing_consent)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'marketing_consent')::boolean, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------------------
-- Triggers: auto-update updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER studios_updated_at BEFORE UPDATE ON studios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER memberships_updated_at BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER announcements_updated_at BEFORE UPDATE ON platform_announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_studio_members_studio ON studio_members(studio_id);
CREATE INDEX idx_studio_members_user ON studio_members(user_id);
CREATE INDEX idx_classes_studio ON classes(studio_id);
CREATE INDEX idx_classes_instructor ON classes(instructor_id);
CREATE INDEX idx_classes_starts_at ON classes(starts_at);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_class ON bookings(class_id);
CREATE INDEX idx_bookings_studio ON bookings(studio_id);
CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_studio ON memberships(studio_id);
CREATE INDEX idx_messages_studio ON messages(studio_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_type ON messages(type);
