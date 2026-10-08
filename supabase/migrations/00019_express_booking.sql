-- Migration: Express Booking (PRD-020) — login-free class booking for guests
--
-- A first-time visitor should be able to book a class with name, email, and
-- phone, in one step, with no password and no email round-trip. Today the only
-- booking paths require an authenticated profile (book_class() keys off
-- auth.uid(), and bookings.profile_id is NOT NULL referencing auth.users).
--
-- Rather than make profile_id nullable — which would weaken every roster,
-- entitlement, and check-in query that assumes a member behind a booking — a
-- guest gets a real, passwordless identity: an auth user with no password, its
-- profile, and a studio_members row. One member record, no dual-write, and
-- rosters, waitlist promotion, and check-in keep working unchanged. The guest
-- claims their account later by setting a password on the same email.
--
-- Creating an auth user requires the service role, so the write path is the
-- `express-book` Edge Function, not an anon-callable RPC. What this migration
-- adds is the surrounding structure that function needs:
--
--   1. Studio-level express booking policy columns.
--   2. get_public_occurrence() — a narrow public read for ONE occurrence, so
--      the booking page can render without exposing the base table.
--   3. express_booking_claims — the audit trail, the duplicate guard, the
--      rate-limit substrate, and the continue-link token store.
--   4. profiles.is_guest / claimed_at — so staff can see an unclaimed guest
--      record and so the signup flow can upgrade one in place.
--
-- NOTE: integration-test against a live database before relying on this in
-- production. PL/pgSQL is not covered by the JS test suite; the decision rules
-- this mirrors are tested in src/lib/booking/express.test.ts.

-- ===========================================================================
-- 1. Studio policy
-- ===========================================================================

ALTER TABLE studios
  -- Off by default. A studio opts in, because guest booking changes who can
  -- create a record in their member list.
  ADD COLUMN IF NOT EXISTS express_booking_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  -- Minutes before start after which online booking closes. 0 = open until
  -- start. Distinct from default_cancellation_minutes, which governs exits.
  ADD COLUMN IF NOT EXISTS express_booking_cutoff_minutes INTEGER NOT NULL DEFAULT 0,
  -- Whether a guest (not just a signed-in member) may join a full class's
  -- waitlist. Separate from waitlist_enabled: a studio may want the waitlist
  -- for members only.
  ADD COLUMN IF NOT EXISTS express_waitlist_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  -- Require waiver acceptance in the express form before a first class.
  ADD COLUMN IF NOT EXISTS express_waiver_required BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN studios.express_booking_enabled IS
  'Opt-in: allow login-free (guest) booking of public classes. See PRD-020.';
COMMENT ON COLUMN studios.express_booking_cutoff_minutes IS
  'Minutes before class start after which express booking closes. 0 = open until start.';
COMMENT ON COLUMN studios.express_waitlist_enabled IS
  'Allow guests to join a full class waitlist. Waitlist claims never take payment.';
COMMENT ON COLUMN studios.express_waiver_required IS
  'Require waiver acceptance in the express booking form before a first class.';

-- ===========================================================================
-- 2. Guest identity markers on profiles
-- ===========================================================================

ALTER TABLE profiles
  -- True while the person has never set a password on this account. Lets staff
  -- distinguish "booked as a guest" from "registered member" in the roster, and
  -- lets us avoid emailing account-management copy to someone with no account.
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT FALSE,
  -- Set when the guest completes signup on the same email. is_guest flips false.
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.is_guest IS
  'Passwordless profile created by express booking (PRD-020). Flips false when the person sets a password.';
COMMENT ON COLUMN profiles.claimed_at IS
  'When a guest profile was upgraded to a full account by its owner.';

CREATE INDEX IF NOT EXISTS idx_profiles_is_guest ON profiles(is_guest) WHERE is_guest = TRUE;

-- Guest lookup is by normalized (lowercased) email, so the index and every
-- lookup must agree on the normalization. Unique: one identity per address.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_lower ON profiles(LOWER(email));

-- ===========================================================================
-- 3. Public read for one occurrence
-- ===========================================================================

-- get_public_schedule() (00016) returns a list for the embed widget. The
-- express booking page needs the booking-relevant facts for ONE occurrence,
-- including the drop-in price and the studio's express policy, which the list
-- does not carry. Same discipline as 00016: a narrow SECURITY DEFINER function
-- returning only public columns, never a broad anon SELECT on the base table.
--
-- Returns zero rows when the studio is not discoverable or the occurrence does
-- not belong to it. Note it deliberately DOES return cancelled and past
-- occurrences: the page must be able to say "this class was cancelled" rather
-- than render a generic not-found. Eligibility is decided by the caller
-- (src/lib/booking/express.ts), not by row omission here.
-- Dropped first so a dev database that ran an earlier draft of this migration
-- can re-run it (the return columns changed; CREATE OR REPLACE cannot do that).
DROP FUNCTION IF EXISTS get_public_occurrence(TEXT, UUID);
CREATE OR REPLACE FUNCTION get_public_occurrence(p_slug TEXT, p_occurrence_id UUID)
RETURNS TABLE (
  occurrence_id UUID,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  room TEXT,
  is_cancelled BOOLEAN,
  capacity INTEGER,
  booked_count INTEGER,
  offering_name TEXT,
  offering_description TEXT,
  drop_in_price_cents INTEGER,
  location_name TEXT,
  location_city TEXT,
  teacher_name TEXT,
  studio_name TEXT,
  studio_slug TEXT,
  studio_timezone TEXT,
  studio_currency TEXT,
  studio_primary_color TEXT,
  express_booking_enabled BOOLEAN,
  express_booking_cutoff_minutes INTEGER,
  express_waitlist_enabled BOOLEAN,
  express_waiver_required BOOLEAN,
  -- Ids a signed-in member's booking path needs to resolve coverage
  -- (membership / pack scope by offering and location). Not sensitive.
  studio_id UUID,
  offering_id UUID,
  location_id UUID,
  -- Add-to-calendar needs a map-resolvable address and the cancellation
  -- window. Public already: it is the studio's own business address.
  location_address_line1 TEXT,
  location_address_line2 TEXT,
  location_state TEXT,
  location_zip TEXT,
  location_country TEXT,
  location_latitude DOUBLE PRECISION,
  location_longitude DOUBLE PRECISION,
  cancellation_minutes INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    co.id, co.starts_at, co.ends_at, co.room, co.is_cancelled,
    co.capacity, co.booked_count,
    o.name, o.description, o.drop_in_price_cents,
    l.name, l.city,
    p.display_name,
    s.name, s.slug, s.timezone, s.currency, s.brand_primary_color,
    s.express_booking_enabled,
    s.express_booking_cutoff_minutes,
    -- A guest waitlist requires BOTH the studio waitlist and the guest switch.
    (s.waitlist_enabled AND s.express_waitlist_enabled),
    s.express_waiver_required,
    s.id, co.offering_id, co.location_id,
    l.address_line1, l.address_line2, l.state, l.zip, l.country,
    l.latitude::DOUBLE PRECISION, l.longitude::DOUBLE PRECISION,
    s.default_cancellation_minutes
  FROM studios s
  JOIN class_occurrences co ON co.studio_id = s.id
  JOIN offerings o ON o.id = co.offering_id
  LEFT JOIN locations l ON l.id = co.location_id
  LEFT JOIN profiles p ON p.id = co.teacher_id
  WHERE s.slug = p_slug
    AND s.discoverable = TRUE
    AND co.id = p_occurrence_id;
$$;

COMMENT ON FUNCTION get_public_occurrence(TEXT, UUID) IS
  'Public, read-only booking-relevant facts for ONE class occurrence of a discoverable studio. Returns cancelled/past occurrences so the booking page can explain why they are unbookable; eligibility is decided by src/lib/booking/express.ts.';

GRANT EXECUTE ON FUNCTION get_public_occurrence(TEXT, UUID) TO anon, authenticated;

-- ===========================================================================
-- 4. Claim ledger
-- ===========================================================================

DO $$ BEGIN
  CREATE TYPE express_claim_outcome AS ENUM (
    'booked',             -- confirmed booking created
    'waitlisted',         -- waitlist booking created
    'pending_payment',    -- Stripe Checkout opened; booking created on webhook
    'continue_link_sent', -- email already had an account; link emailed instead
    'rejected',           -- ineligible (see reject_reason)
    'rate_limited'        -- throttled before any decision was made
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Every express booking attempt, successful or not.
--
-- Three jobs: the duplicate guard (a guest double-tapping "Book"), the
-- rate-limit substrate (counting recent attempts per email and per IP hash),
-- and the continue-link token store for the account-exists path.
--
-- Deliberately records rejected and rate-limited attempts too: without them a
-- studio cannot tell "nobody tried to book" from "everybody who tried was
-- turned away by a cutoff set too aggressively".
CREATE TABLE IF NOT EXISTS express_booking_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  class_occurrence_id UUID REFERENCES class_occurrences(id) ON DELETE SET NULL,
  -- Normalized (lowercased) email. The guest identity key.
  email TEXT NOT NULL,
  -- Set once an identity exists; null for a rejected or rate-limited attempt.
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  outcome express_claim_outcome NOT NULL,
  -- Matches ExpressRejectReason in src/lib/booking/express.ts.
  reject_reason TEXT,
  -- Payment, when the drop-in path was taken.
  amount_cents INTEGER NOT NULL DEFAULT 0,
  stripe_checkout_session_id TEXT,
  -- Continue link for the account-exists path. We store only a hash: the token
  -- itself goes in the email and nowhere else, so a database read cannot be
  -- turned into someone else's booking session.
  continue_token_hash TEXT,
  continue_token_expires_at TIMESTAMPTZ,
  continue_token_used_at TIMESTAMPTZ,
  -- Attribution and abuse control. The IP is stored as a salted hash, never in
  -- the clear: we need "how many attempts from this source" and nothing more.
  ip_hash TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
  waiver_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_express_claims_studio ON express_booking_claims(studio_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_express_claims_occurrence ON express_booking_claims(class_occurrence_id);
-- Rate limiting and duplicate detection both scan recent rows for one email.
CREATE INDEX IF NOT EXISTS idx_express_claims_email_recent ON express_booking_claims(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_express_claims_ip_recent ON express_booking_claims(ip_hash, created_at DESC)
  WHERE ip_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_express_claims_continue_token ON express_booking_claims(continue_token_hash)
  WHERE continue_token_hash IS NOT NULL;

-- Deliberately NOT unique on (class_occurrence_id, email). This table is an
-- audit log, and an audit log must never reject a write: a guest who books,
-- cancels, and rebooks the same class legitimately produces a second claim, and
-- a unique index would throw away the record of the successful one.
--
-- The duplicate guard lives where it can be enforced without losing history:
-- the UNIQUE(class_occurrence_id, profile_id) on bookings, the live-booking
-- check in the express-book function, and create_guest_booking()'s idempotent
-- return of an existing row.

COMMENT ON TABLE express_booking_claims IS
  'Every express (login-free) booking attempt: duplicate guard, rate-limit substrate, continue-link token store, and the record of why attempts were turned away. See PRD-020.';
COMMENT ON COLUMN express_booking_claims.continue_token_hash IS
  'Hash of the emailed continue token. The token itself is never stored, so a database read cannot resume someone else''s booking.';
COMMENT ON COLUMN express_booking_claims.ip_hash IS
  'Salted hash of the client IP for rate limiting. The address is never stored in the clear.';

-- RLS: this table holds the email addresses of people who are not yet members,
-- so it is staff-only. No anon or member access at all; the Edge Function writes
-- with the service role, which bypasses RLS.
ALTER TABLE express_booking_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS express_claims_staff_read ON express_booking_claims;
CREATE POLICY express_claims_staff_read ON express_booking_claims
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff ss
      WHERE ss.studio_id = express_booking_claims.studio_id
        AND ss.profile_id = auth.uid()
        AND ss.is_active = TRUE
    )
  );

-- ===========================================================================
-- 5. Rate-limit helper
-- ===========================================================================

-- Counts recent attempts for an email and an IP hash in one round-trip, so the
-- Edge Function can throttle before it does any work. SECURITY DEFINER because
-- the claims table is staff-only; it returns counts, never rows, so it leaks no
-- addresses. Service-role only: an anon caller could otherwise use it to probe
-- whether an address has been used.
CREATE OR REPLACE FUNCTION count_recent_express_claims(
  p_email TEXT,
  p_ip_hash TEXT,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS TABLE (email_attempts INTEGER, ip_attempts INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (WHERE email = LOWER(p_email))::INTEGER,
    COUNT(*) FILTER (WHERE p_ip_hash IS NOT NULL AND ip_hash = p_ip_hash)::INTEGER
  FROM express_booking_claims
  WHERE created_at > NOW() - (GREATEST(p_window_minutes, 1) || ' minutes')::INTERVAL
    AND (email = LOWER(p_email) OR (p_ip_hash IS NOT NULL AND ip_hash = p_ip_hash));
$$;

COMMENT ON FUNCTION count_recent_express_claims(TEXT, TEXT, INTEGER) IS
  'Recent express booking attempt counts for one email and one IP hash. Returns counts only, never rows. Service-role only.';

-- Revoking from PUBLIC also removes the default grant service_role inherits, so
-- the Edge Function's credential must be granted back explicitly or every call
-- fails with "permission denied for function".
REVOKE ALL ON FUNCTION count_recent_express_claims(TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION count_recent_express_claims(TEXT, TEXT, INTEGER) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION count_recent_express_claims(TEXT, TEXT, INTEGER) TO service_role;

-- ===========================================================================
-- 6. Guest booking writer
-- ===========================================================================

-- Creates the booking for a guest whose identity the Edge Function has already
-- established. Separate from book_class() because that function keys off
-- auth.uid() and consumes an entitlement; a guest has neither.
--
-- Capacity is re-checked here, inside the transaction, against the row the
-- insert will touch: the page's view of booked_count is always stale, and two
-- guests tapping "Book" on the last spot must not both get it. The decision in
-- src/lib/booking/express.ts chooses the INTENDED placement; this function has
-- the final say, and returns the placement it actually used.
--
-- Service-role only. It trusts p_profile_id, so an anon caller holding it could
-- book in anyone's name.
CREATE OR REPLACE FUNCTION create_guest_booking(
  p_occurrence_id UUID,
  p_profile_id UUID,
  p_transaction_id UUID DEFAULT NULL
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_occ class_occurrences%ROWTYPE;
  v_status booking_status;
  v_position INTEGER := NULL;
  v_booking bookings%ROWTYPE;
BEGIN
  -- Lock the occurrence so concurrent claims serialize on the capacity check.
  SELECT * INTO v_occ FROM class_occurrences WHERE id = p_occurrence_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Class not found';
  END IF;
  IF v_occ.is_cancelled THEN
    RAISE EXCEPTION 'Class is cancelled';
  END IF;
  IF v_occ.starts_at <= NOW() THEN
    RAISE EXCEPTION 'Class has already started';
  END IF;

  -- Idempotent on retry: the unique (class_occurrence_id, profile_id) index
  -- would raise anyway, but returning the existing row means a retried Stripe
  -- webhook or a double-submit does not surface an error to the guest.
  SELECT * INTO v_booking FROM bookings
    WHERE class_occurrence_id = p_occurrence_id
      AND profile_id = p_profile_id
      AND status NOT IN ('cancelled', 'late_cancel');
  IF FOUND THEN
    RETURN v_booking;
  END IF;

  IF v_occ.booked_count < v_occ.capacity THEN
    v_status := 'confirmed';
  ELSE
    v_status := 'waitlisted';
    SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO v_position
    FROM bookings
    WHERE class_occurrence_id = p_occurrence_id AND status = 'waitlisted';
  END IF;

  INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status, waitlist_position, transaction_id)
    VALUES (v_occ.studio_id, p_occurrence_id, p_profile_id, v_status, v_position, p_transaction_id)
    RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

COMMENT ON FUNCTION create_guest_booking(UUID, UUID, UUID) IS
  'Creates a booking for a guest profile with no entitlement, re-checking capacity under a row lock. Idempotent per (occurrence, profile). Service-role only: it trusts p_profile_id. See PRD-020.';

REVOKE ALL ON FUNCTION create_guest_booking(UUID, UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION create_guest_booking(UUID, UUID, UUID) FROM anon, authenticated;
-- Needed by both express-book and stripe-webhook, which run as service_role.
GRANT EXECUTE ON FUNCTION create_guest_booking(UUID, UUID, UUID) TO service_role;

-- ===========================================================================
-- 7. Identity lookup
-- ===========================================================================

-- Resolve an email to its profile, case-insensitively and via the index.
--
-- PostgREST can only express `email ILIKE $1`, which cannot use
-- idx_profiles_email_lower and so full-scans profiles on every booking attempt.
-- `LOWER(email) = LOWER(p_email)` matches the index expression exactly.
--
-- Returns the two facts the decision needs and nothing else: no name, no phone,
-- no membership state.
--
-- is_guest is true only while the auth user still has NO password. The profile
-- flag alone is not trusted: if the client-side claim write fails after a guest
-- sets a password, the account must still be treated as an account, or anyone
-- could keep booking under that email from the public form. Service-role only — an anon caller could otherwise use it
-- to test whether any address has an account here.
CREATE OR REPLACE FUNCTION get_profile_identity_by_email(p_email TEXT)
RETURNS TABLE (profile_id UUID, is_guest BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT p.id,
         (p.is_guest AND COALESCE(u.encrypted_password, '') = '') AS is_guest
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE LOWER(p.email) = LOWER(p_email)
  LIMIT 1;
$$;

COMMENT ON FUNCTION get_profile_identity_by_email(TEXT) IS
  'Indexed, case-insensitive email to profile lookup for express booking. Returns only (profile_id, is_guest). Service-role only.';

REVOKE ALL ON FUNCTION get_profile_identity_by_email(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_profile_identity_by_email(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION get_profile_identity_by_email(TEXT) TO service_role;
