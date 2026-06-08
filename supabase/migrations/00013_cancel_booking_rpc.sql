-- Migration: cancel_booking() RPC — cancellation with late-cancel fee + refund
--
-- Mirrors src/lib/booking/entitlements.ts isLateCancel(): a cancellation inside
-- the studio's window is a late cancel (forfeit the class + charge the fee); an
-- on-time cancellation refunds the consumed entitlement. The existing
-- promote_from_waitlist trigger fills the freed spot automatically.
--
-- SECURITY DEFINER, keyed off auth.uid(); studio staff may also cancel.
-- Returns the updated booking row.
--
-- NOTE: integration-test against a live database before production use.

CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_booking bookings%ROWTYPE;
  v_occ class_occurrences%ROWTYPE;
  v_studio studios%ROWTYPE;
  v_is_late BOOLEAN;
  v_is_staff BOOLEAN;
  v_new_status booking_status;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  -- The booking owner or studio staff may cancel.
  SELECT EXISTS (
    SELECT 1 FROM studio_staff
    WHERE studio_id = v_booking.studio_id AND profile_id = v_uid
      AND role IN ('owner', 'admin', 'front_desk')
  ) INTO v_is_staff;
  IF v_booking.profile_id <> v_uid AND NOT v_is_staff THEN
    RAISE EXCEPTION 'Not authorized to cancel this booking';
  END IF;

  IF v_booking.status IN ('cancelled', 'late_cancel') THEN
    RAISE EXCEPTION 'Booking is already cancelled';
  END IF;

  SELECT * INTO v_occ FROM class_occurrences WHERE id = v_booking.class_occurrence_id;
  SELECT * INTO v_studio FROM studios WHERE id = v_booking.studio_id;

  v_is_late := NOW() > (v_occ.starts_at - make_interval(mins => COALESCE(v_studio.default_cancellation_minutes, 120)));
  v_new_status := CASE WHEN v_is_late THEN 'late_cancel'::booking_status ELSE 'cancelled'::booking_status END;

  -- Refund the consumed entitlement only on an on-time cancel of a confirmed spot.
  IF v_booking.status = 'confirmed' AND NOT v_is_late THEN
    IF v_booking.class_pack_id IS NOT NULL THEN
      UPDATE class_packs
        SET classes_remaining = classes_remaining + 1,
            status = CASE WHEN status = 'exhausted' THEN 'active'::class_pack_status ELSE status END
        WHERE id = v_booking.class_pack_id;
    ELSIF v_booking.membership_id IS NOT NULL THEN
      UPDATE memberships
        SET classes_used_this_cycle = GREATEST(0, classes_used_this_cycle - 1)
        WHERE id = v_booking.membership_id;
    END IF;
  END IF;

  -- Charge a late-cancel fee when applicable.
  IF v_is_late AND COALESCE(v_studio.late_cancel_fee_cents, 0) > 0 THEN
    INSERT INTO transactions (studio_id, profile_id, type, status, amount_cents, booking_id, description)
    VALUES (
      v_booking.studio_id, v_booking.profile_id, 'late_cancel_fee', 'pending',
      v_studio.late_cancel_fee_cents, v_booking.id, 'Late cancellation fee'
    );
  END IF;

  UPDATE bookings
    SET status = v_new_status, cancelled_at = NOW(), is_late_cancel = v_is_late
    WHERE id = p_booking_id
    RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

COMMENT ON FUNCTION cancel_booking(UUID) IS
  'Cancels a booking with late-cancel detection: on-time cancels refund the entitlement; late cancels forfeit it and record a late_cancel_fee transaction. Waitlist promotion is handled by the promote_from_waitlist trigger.';

GRANT EXECUTE ON FUNCTION cancel_booking(UUID) TO authenticated;
