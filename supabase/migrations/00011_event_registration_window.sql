-- Migration: Event registration window
-- Adds an optional open/close window for event & workshop registration, matching
-- the scarcity/enrollment-window behavior studios expect from Mindbody-style
-- course enrollment (registration opens on a date, closes before the event).
--
-- Both columns are nullable: null open = open immediately, null close = open
-- until the event starts. Enforcement lives in the events checkout flow.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS registration_opens_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS registration_closes_at TIMESTAMPTZ;

COMMENT ON COLUMN events.registration_opens_at IS 'When registration opens (null = open immediately)';
COMMENT ON COLUMN events.registration_closes_at IS 'When registration closes (null = open until the event starts)';
