-- 00020: member booking path + server-truthful guest status (PRD-020, PR #67)
--
-- Separate from 00019 so a database that already applied 00019 receives these
-- changes; editing an applied migration would silently skip them.
--
-- 1. get_public_occurrence() also returns studio_id, offering_id, location_id,
--    so a signed-in member's booking page can resolve which membership or pack
--    covers the class (resolvePaymentSources). Ids only, nothing sensitive.
--    The return columns change, so the function is dropped and recreated.
-- 2. get_profile_identity_by_email() reports is_guest only while the auth user
--    has no password. If the client-side claim write fails after a guest sets a
--    password, the account must still count as an account, or the public form
--    could keep booking under that email.

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
  location_id UUID
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
    s.id, co.offering_id, co.location_id
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
  'Public, read-only booking-relevant facts for ONE class occurrence of a discoverable studio, plus the ids the member booking path needs. Eligibility is decided by src/lib/booking/express.ts.';

-- express-book calls this with the service role; no REVOKE FROM PUBLIC here,
-- which would also strip the grant service_role inherits.
GRANT EXECUTE ON FUNCTION get_public_occurrence(TEXT, UUID) TO anon, authenticated, service_role;

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
  'Indexed, case-insensitive email to profile lookup for express booking. is_guest is true only while the auth user has no password. Service-role only.';

REVOKE ALL ON FUNCTION get_profile_identity_by_email(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_profile_identity_by_email(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION get_profile_identity_by_email(TEXT) TO service_role;
