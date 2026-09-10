-- Migration: event deposits / payment plans
--
-- Lets trainings & retreats take a deposit now with the balance due later —
-- table stakes for high-ticket events (Mindbody/Arketa/Momence all support it).
--
-- events.deposit_cents: when set, registrants may pay this now instead of the
--   full price; null = full payment only.
-- event_registrations tracks what was paid vs still owed.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS deposit_cents INTEGER,
  ADD COLUMN IF NOT EXISTS allow_payment_plan BOOLEAN DEFAULT FALSE;

ALTER TABLE event_registrations
  ADD COLUMN IF NOT EXISTS deposit_paid_cents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due_cents INTEGER DEFAULT 0;

COMMENT ON COLUMN events.deposit_cents IS 'Optional deposit amount; when set, registrants can pay this now and the balance later (null = full payment only)';
COMMENT ON COLUMN event_registrations.balance_due_cents IS 'Amount still owed after a deposit (0 when paid in full)';

-- Atomic denormalized-count bumps for the events flow (events have no
-- booking-count trigger). Called by the stripe-webhook on successful payment.
CREATE OR REPLACE FUNCTION increment_event_registered(p_event_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE events SET registered_count = registered_count + 1 WHERE id = p_event_id;
$$;

CREATE OR REPLACE FUNCTION increment_tier_registered(p_tier_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE event_pricing_tiers SET registered_count = registered_count + 1 WHERE id = p_tier_id;
$$;
