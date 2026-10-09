-- Apply 00039 (get_my_bookings, LP-4) to tandava-prod. Independent of 00038.
-- Paste all of it into https://supabase.com/dashboard/project/mkaixgjwakfufmmwembn/sql/new and Run.
BEGIN;
-- 00039: get_my_bookings() for the student's My Schedule page (LP-4).
--
-- /my-schedule showed hard-coded sample bookings. Students need their real
-- bookings with the class, studio, teacher and room names. Joining those
-- tables through RLS from the client depends on four tables' policies lining
-- up for a student; like get_my_studio (00020) this is one narrow SECURITY
-- DEFINER function that returns only the caller's own rows and only the
-- columns the page shows.

CREATE OR REPLACE FUNCTION get_my_bookings(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  booking_id UUID,
  status booking_status,
  occurrence_id UUID,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_cancelled BOOLEAN,
  offering_name TEXT,
  room TEXT,
  location_name TEXT,
  teacher_name TEXT,
  studio_name TEXT,
  studio_slug TEXT,
  studio_timezone TEXT,
  cancellation_minutes INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.id, b.status, co.id, co.starts_at, co.ends_at, COALESCE(co.is_cancelled, FALSE),
    o.name, co.room, l.name, t.display_name,
    s.name, s.slug, s.timezone, s.default_cancellation_minutes
  FROM bookings b
  JOIN class_occurrences co ON co.id = b.class_occurrence_id
  JOIN offerings o ON o.id = co.offering_id
  JOIN studios s ON s.id = co.studio_id
  LEFT JOIN locations l ON l.id = co.location_id
  LEFT JOIN profiles t ON t.id = co.teacher_id
  WHERE b.profile_id = (SELECT auth.uid())
  ORDER BY co.starts_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
$$;

COMMENT ON FUNCTION get_my_bookings(INTEGER) IS
  'The calling user''s own bookings with class, studio, room, location and teacher names, newest class first. My Schedule page.';

REVOKE ALL ON FUNCTION get_my_bookings(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_my_bookings(INTEGER) TO authenticated;
COMMIT;
