-- Migration: web push subscriptions
--
-- Stores each member's browser Web Push subscriptions so the `push` Edge
-- Function can deliver notifications (class reminders, waitlist promotions).
-- A profile can have several (multiple devices/browsers).

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_profile ON push_subscriptions(profile_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- A member manages only their own subscriptions.
CREATE POLICY push_subscriptions_own ON push_subscriptions
  FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
