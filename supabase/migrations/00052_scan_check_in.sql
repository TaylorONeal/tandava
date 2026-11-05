-- Scan-to-check-in for the Tandava Studio app.
--
-- A member's check-in pass is a QR code of `tandava:checkin:v1:<booking id>`.
-- The pass is an identifier, not a credential: the person scanning must be
-- staff who may check in that booking. Owners, admins and front desk may scan
-- any booking at their studio; a teacher only bookings in a class assigned to
-- them (same rule as check_in_teaching_booking). Everything else answers
-- 'not_found', so a scan never reveals a booking at another studio.
--
-- Expected outcomes come back as a result code instead of an exception, so the
-- scanner can show "already checked in" or "check-in opens 60 minutes before
-- class" and keep scanning. Attendance itself still goes through
-- check_in_booking, the only path that marks a booking checked_in.

CREATE OR REPLACE FUNCTION check_in_with_pass(p_pass TEXT)
RETURNS TABLE (
  result TEXT,
  booking_id UUID,
  student_name TEXT,
  offering_name TEXT,
  starts_at TIMESTAMPTZ,
  studio_timezone TEXT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_id UUID;
  v_booking bookings%ROWTYPE;
  v_occ class_occurrences%ROWTYPE;
  v_name TEXT;
  v_offering TEXT;
  v_tz TEXT;
  v_result TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF p_pass IS NULL OR p_pass !~ '^tandava:checkin:v1:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    RETURN QUERY SELECT 'invalid_pass'::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ, NULL::TEXT;
    RETURN;
  END IF;
  v_id := lower(substring(p_pass FROM 20))::UUID;

  -- Lock order matches check_in_booking: occurrence first, then booking.
  SELECT co.* INTO v_occ FROM class_occurrences co
    JOIN bookings b ON b.class_occurrence_id = co.id AND b.studio_id = co.studio_id
    WHERE b.id = v_id FOR UPDATE OF co;
  IF NOT FOUND OR NOT EXISTS (
    SELECT 1 FROM studio_staff st
    WHERE st.studio_id = v_occ.studio_id AND st.profile_id = v_uid AND st.is_active
      AND (st.role IN ('owner', 'admin', 'front_desk')
           OR (st.role = 'teacher' AND v_occ.teacher_id = v_uid))
  ) THEN
    RETURN QUERY SELECT 'not_found'::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ, NULL::TEXT;
    RETURN;
  END IF;

  SELECT * INTO v_booking FROM bookings WHERE id = v_id FOR UPDATE;
  SELECT COALESCE(NULLIF(p.display_name, ''), NULLIF(trim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Student')
    INTO v_name FROM profiles p WHERE p.id = v_booking.profile_id;
  SELECT o.name INTO v_offering FROM offerings o WHERE o.id = v_occ.offering_id;
  SELECT s.timezone INTO v_tz FROM studios s WHERE s.id = v_occ.studio_id;

  v_result := CASE
      WHEN v_booking.status = 'checked_in' THEN 'already_checked_in'
      WHEN v_booking.status <> 'confirmed' THEN 'not_confirmed'
      WHEN v_occ.is_cancelled THEN 'class_cancelled'
      WHEN NOW() < v_occ.starts_at - INTERVAL '60 minutes' OR NOW() > v_occ.ends_at THEN 'outside_window'
      ELSE 'checked_in'
    END;
  IF v_result = 'checked_in' THEN
    PERFORM check_in_booking(v_id, 'qr_scan');
  END IF;

  RETURN QUERY SELECT v_result, v_id, COALESCE(v_name, 'Student'), v_offering, v_occ.starts_at, v_tz;
END;
$$;

REVOKE ALL ON FUNCTION check_in_with_pass(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION check_in_with_pass(TEXT) TO authenticated;
