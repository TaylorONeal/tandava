-- Migration: public class discovery across discoverable studios
--
-- Powers the platform Discover experience (/discover, and "/" when
-- VITE_HOME_MODE=discover). Same pattern as get_public_schedule (00016) and
-- get_studio_storefront (00018): a narrow SECURITY DEFINER function returning
-- only safe public columns, for studios that opted in (studios.discoverable)
-- and offerings that opted in (offerings.discoverable). Base tables stay
-- participants-only; RLS is unchanged.
--
-- Filters are all optional. Results are FUTURE, non-cancelled occurrences only.

CREATE OR REPLACE FUNCTION discover_classes(
  p_city  TEXT        DEFAULT NULL,
  p_style TEXT        DEFAULT NULL,
  p_from  TIMESTAMPTZ DEFAULT NULL,
  p_to    TIMESTAMPTZ DEFAULT NULL,
  p_limit INT         DEFAULT 60
)
RETURNS TABLE (
  occurrence_id UUID,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  offering_name TEXT,
  style TEXT,
  level TEXT,
  is_heated BOOLEAN,
  duration_minutes INTEGER,
  drop_in_price_cents INTEGER,
  currency TEXT,
  spots_left INTEGER,
  teacher_name TEXT,
  location_name TEXT,
  city TEXT,
  state TEXT,
  studio_slug TEXT,
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
    co.id,
    co.starts_at,
    co.ends_at,
    o.name,
    o.style,
    o.level,
    o.is_heated,
    o.duration_minutes,
    o.drop_in_price_cents,
    s.currency,
    GREATEST(co.capacity - COALESCE(co.booked_count, 0), 0),
    p.display_name,
    l.name,
    l.city,
    l.state,
    s.slug,
    s.name,
    s.timezone,
    s.brand_primary_color
  FROM studios s
  JOIN class_occurrences co ON co.studio_id = s.id
  JOIN offerings o ON o.id = co.offering_id
  LEFT JOIN locations l ON l.id = co.location_id
  LEFT JOIN profiles p ON p.id = co.teacher_id
  WHERE s.discoverable = TRUE
    AND o.discoverable = TRUE
    AND o.is_active = TRUE
    AND co.is_cancelled = FALSE
    AND co.starts_at >= GREATEST(COALESCE(p_from, NOW()), NOW())
    AND (p_to IS NULL OR co.starts_at < p_to)
    AND (p_city IS NULL OR l.city ILIKE p_city)
    AND (p_style IS NULL OR o.style ILIKE p_style)
  ORDER BY co.starts_at ASC
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$$;

COMMENT ON FUNCTION discover_classes(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INT) IS
  'Public, read-only upcoming classes across discoverable studios, with optional city/style/date filters. Returns only safe public columns; base tables stay participants-only.';

GRANT EXECUTE ON FUNCTION discover_classes(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INT) TO anon, authenticated;
