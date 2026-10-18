-- Review-only rollout bundle: teacher assigned schedule, roster and check-in.
-- Target: tandava-prod mkaixgjwakfufmmwembn. Requires existing schema through 00043.
-- DO NOT APPLY until full database tests pass and deployment is explicitly authorized.
-- Apply before the teacher frontend is released. No new Edge Function is needed for 00044.
BEGIN;
-- Teacher portal: read only assigned classes/rosters; attendance uses the existing ledger path.
CREATE OR REPLACE FUNCTION get_my_teaching_classes()
RETURNS TABLE (
  occurrence_id UUID, offering_name TEXT, studio_name TEXT, studio_timezone TEXT,
  location_name TEXT, room TEXT, starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ,
  capacity INTEGER, is_cancelled BOOLEAN, booked BIGINT, checked_in BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT co.id, o.name, s.name, s.timezone, l.name, co.room, co.starts_at, co.ends_at,
         co.capacity, co.is_cancelled,
         (SELECT count(*) FROM bookings b WHERE b.class_occurrence_id = co.id AND b.status IN ('confirmed', 'checked_in')),
         (SELECT count(*) FROM bookings b WHERE b.class_occurrence_id = co.id AND b.status = 'checked_in')
  FROM class_occurrences co
  JOIN offerings o ON o.id = co.offering_id
  JOIN studios s ON s.id = co.studio_id
  LEFT JOIN locations l ON l.id = co.location_id
  WHERE co.teacher_id = (SELECT auth.uid())
    AND co.ends_at >= NOW() AND co.starts_at < NOW() + INTERVAL '14 days'
    AND EXISTS (SELECT 1 FROM studio_staff st WHERE st.studio_id = co.studio_id
      AND st.profile_id = (SELECT auth.uid()) AND st.is_active AND st.role IN ('teacher', 'owner', 'admin'))
  ORDER BY co.starts_at, co.id;
$$;

CREATE OR REPLACE FUNCTION get_teaching_roster(p_occurrence_id UUID)
RETURNS TABLE (booking_id UUID, student_name TEXT, status booking_status)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT b.id, COALESCE(NULLIF(p.display_name, ''), NULLIF(trim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Student'), b.status
  FROM class_occurrences co
  JOIN bookings b ON b.class_occurrence_id = co.id AND b.studio_id = co.studio_id
  JOIN profiles p ON p.id = b.profile_id
  WHERE co.id = p_occurrence_id AND co.teacher_id = (SELECT auth.uid())
    AND b.status IN ('confirmed', 'checked_in', 'waitlisted')
    AND EXISTS (SELECT 1 FROM studio_staff st WHERE st.studio_id = co.studio_id
      AND st.profile_id = (SELECT auth.uid()) AND st.is_active AND st.role IN ('teacher', 'owner', 'admin'))
  ORDER BY p.display_name NULLS LAST, b.id;
$$;

CREATE OR REPLACE FUNCTION check_in_teaching_booking(p_booking_id UUID)
RETURNS bookings LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_occ class_occurrences%ROWTYPE;
BEGIN
  SELECT co.* INTO v_occ FROM class_occurrences co
    JOIN bookings b ON b.class_occurrence_id = co.id AND b.studio_id = co.studio_id
    WHERE b.id = p_booking_id FOR UPDATE OF co;
  IF NOT FOUND OR v_occ.teacher_id IS DISTINCT FROM auth.uid() OR auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized to check in this class';
  END IF;
  PERFORM 1 FROM studio_staff st WHERE st.studio_id = v_occ.studio_id
    AND st.profile_id = auth.uid() AND st.is_active AND st.role IN ('teacher', 'owner', 'admin') FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized to check in this class'; END IF;
  PERFORM 1 FROM bookings b WHERE b.id = p_booking_id
    AND b.class_occurrence_id = v_occ.id AND b.studio_id = v_occ.studio_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized to check in this class'; END IF;
  RETURN check_in_booking(p_booking_id, 'staff_manual');
END;
$$;

REVOKE ALL ON FUNCTION get_my_teaching_classes() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION get_teaching_roster(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION check_in_teaching_booking(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_my_teaching_classes() TO authenticated;
GRANT EXECUTE ON FUNCTION get_teaching_roster(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_in_teaching_booking(UUID) TO authenticated;
COMMIT;
