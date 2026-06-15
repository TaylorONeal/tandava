-- Migration: public schedule for the embeddable widget
--
-- The embed widget needs to show a discoverable studio's UPCOMING classes to
-- unauthenticated visitors. A broad anon SELECT policy on class_occurrences
-- would over-expose: RLS filters rows but not columns, so it would leak internal
-- fields (sub_notes, sub-tracking, original_teacher_id) and all historical rows
-- to the public internet.
--
-- Instead, expose a narrow SECURITY DEFINER function that returns only safe,
-- public columns for FUTURE, non-cancelled occurrences of a discoverable studio.
-- This is the entire public surface; the base table stays participants-only.

CREATE OR REPLACE FUNCTION get_public_schedule(p_slug TEXT, p_limit INT DEFAULT 12)
RETURNS TABLE (
  occurrence_id UUID,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  room TEXT,
  offering_name TEXT,
  location_name TEXT,
  teacher_name TEXT,
  capacity INTEGER,
  booked_count INTEGER,
  studio_name TEXT,
  studio_timezone TEXT,
  studio_primary_color TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    co.id, co.starts_at, co.ends_at, co.room,
    o.name AS offering_name,
    l.name AS location_name,
    p.display_name AS teacher_name,
    co.capacity, co.booked_count,
    s.name AS studio_name,
    s.timezone AS studio_timezone,
    s.brand_primary_color AS studio_primary_color
  FROM studios s
  JOIN class_occurrences co ON co.studio_id = s.id
  JOIN offerings o ON o.id = co.offering_id
  LEFT JOIN locations l ON l.id = co.location_id
  LEFT JOIN profiles p ON p.id = co.teacher_id
  WHERE s.slug = p_slug
    AND s.discoverable = TRUE
    AND co.is_cancelled = FALSE
    AND co.starts_at >= NOW()
  ORDER BY co.starts_at ASC
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
$$;

COMMENT ON FUNCTION get_public_schedule(TEXT, INT) IS
  'Public, read-only upcoming schedule for a discoverable studio (by slug). Returns only safe columns for the embed widget; the class_occurrences table itself stays participants-only.';

GRANT EXECUTE ON FUNCTION get_public_schedule(TEXT, INT) TO anon, authenticated;
