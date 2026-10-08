-- 00022: add-to-calendar facts on get_public_occurrence (PRD-022, PR #68)
--
-- A booking confirmation builds a calendar event (.ics, Google, Outlook) whose
-- location must resolve in Apple and Google Maps and whose description states
-- the free-cancellation deadline. Adds the location's street address, lat/long
-- and the studio's cancellation window. All of it is the studio's own public
-- business information. Return columns change, so drop and recreate.

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
  'Public, read-only booking-relevant facts for ONE class occurrence of a discoverable studio: member booking ids (00021) plus calendar address and cancellation window (00022).';

-- express-book calls this with the service role; no REVOKE FROM PUBLIC here,
-- which would also strip the grant service_role inherits.
GRANT EXECUTE ON FUNCTION get_public_occurrence(TEXT, UUID) TO anon, authenticated, service_role;
