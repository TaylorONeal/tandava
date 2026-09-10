-- Migration: book_class() RPC — atomic, entitlement-checked class booking
--
-- The "covered" booking path (a member booking with a membership or class pack,
-- no payment) must validate eligibility and consume the entitlement atomically,
-- server-side, under the caller's identity. Drop-in (paid) bookings go through
-- Stripe Checkout + the stripe-webhook function instead.
--
-- This mirrors the rules in src/lib/booking/entitlements.ts. It is SECURITY
-- DEFINER so it can write the booking + decrement the source in one transaction
-- while still keying off auth.uid() for the acting member.
--
-- Returns the new booking row (status 'confirmed' or 'waitlisted').
--
-- NOTE: integration-test against a live database before relying on it in
-- production (PL/pgSQL is not covered by the JS test suite).

CREATE OR REPLACE FUNCTION book_class(
  p_occurrence_id UUID,
  p_source_type TEXT,      -- 'membership' | 'class_pack'
  p_source_id UUID
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID := auth.uid();
  v_occ class_occurrences%ROWTYPE;
  v_mem memberships%ROWTYPE;
  v_mt membership_types%ROWTYPE;
  v_pack class_packs%ROWTYPE;
  v_pt class_pack_types%ROWTYPE;
  v_status booking_status;
  v_position INTEGER := NULL;
  v_booking bookings%ROWTYPE;
BEGIN
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_occ FROM class_occurrences WHERE id = p_occurrence_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Class not found';
  END IF;
  IF v_occ.is_cancelled THEN
    RAISE EXCEPTION 'Class is cancelled';
  END IF;

  -- Already booked? (mirrors the UNIQUE(class_occurrence_id, profile_id))
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE class_occurrence_id = p_occurrence_id
      AND profile_id = v_profile_id
      AND status NOT IN ('cancelled', 'late_cancel')
  ) THEN
    RAISE EXCEPTION 'Already booked for this class';
  END IF;

  -- Capacity decides confirmed vs waitlisted.
  IF v_occ.booked_count < v_occ.capacity THEN
    v_status := 'confirmed';
  ELSE
    v_status := 'waitlisted';
    SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO v_position
    FROM bookings
    WHERE class_occurrence_id = p_occurrence_id AND status = 'waitlisted';
  END IF;

  -- ---- Validate + consume the entitlement ----
  IF p_source_type = 'membership' THEN
    SELECT * INTO v_mem FROM memberships
      WHERE id = p_source_id AND profile_id = v_profile_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Membership not found'; END IF;
    SELECT * INTO v_mt FROM membership_types WHERE id = v_mem.membership_type_id;

    IF v_mem.status <> 'active' THEN RAISE EXCEPTION 'Membership is not active'; END IF;
    IF v_mem.expires_at IS NOT NULL AND NOW() > v_mem.expires_at THEN
      RAISE EXCEPTION 'Membership has expired';
    END IF;
    IF NOW() < v_mem.current_period_start OR NOW() > v_mem.current_period_end THEN
      RAISE EXCEPTION 'Membership is outside its billing period';
    END IF;
    IF array_length(v_mt.offering_ids, 1) IS NOT NULL
       AND NOT (v_occ.offering_id = ANY(v_mt.offering_ids)) THEN
      RAISE EXCEPTION 'Membership does not cover this class';
    END IF;
    IF array_length(v_mt.locations, 1) IS NOT NULL
       AND NOT (v_occ.location_id::text = ANY(v_mt.locations)) THEN
      RAISE EXCEPTION 'Membership does not cover this location';
    END IF;
    IF v_mt.classes_per_cycle IS NOT NULL
       AND v_mem.classes_used_this_cycle >= v_mt.classes_per_cycle THEN
      RAISE EXCEPTION 'No classes remaining in this cycle';
    END IF;

    -- Consume one class only when the booking is confirmed (not waitlisted).
    IF v_status = 'confirmed' AND v_mt.classes_per_cycle IS NOT NULL THEN
      UPDATE memberships SET classes_used_this_cycle = classes_used_this_cycle + 1
        WHERE id = v_mem.id;
    END IF;

    INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status, waitlist_position, membership_id)
      VALUES (v_occ.studio_id, p_occurrence_id, v_profile_id, v_status, v_position, v_mem.id)
      RETURNING * INTO v_booking;

  ELSIF p_source_type = 'class_pack' THEN
    SELECT * INTO v_pack FROM class_packs
      WHERE id = p_source_id AND profile_id = v_profile_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Class pack not found'; END IF;
    SELECT * INTO v_pt FROM class_pack_types WHERE id = v_pack.class_pack_type_id;

    IF v_pack.status <> 'active' THEN RAISE EXCEPTION 'Class pack is not active'; END IF;
    IF NOW() > v_pack.expires_at THEN RAISE EXCEPTION 'Class pack has expired'; END IF;
    IF v_pack.classes_remaining <= 0 THEN RAISE EXCEPTION 'No classes remaining on this pack'; END IF;
    IF array_length(v_pt.offering_ids, 1) IS NOT NULL
       AND NOT (v_occ.offering_id = ANY(v_pt.offering_ids)) THEN
      RAISE EXCEPTION 'Class pack does not cover this class';
    END IF;
    IF array_length(v_pt.locations, 1) IS NOT NULL
       AND NOT (v_occ.location_id::text = ANY(v_pt.locations)) THEN
      RAISE EXCEPTION 'Class pack does not cover this location';
    END IF;

    IF v_status = 'confirmed' THEN
      UPDATE class_packs
        SET classes_remaining = classes_remaining - 1,
            status = CASE WHEN classes_remaining - 1 <= 0 THEN 'exhausted'::class_pack_status ELSE status END
        WHERE id = v_pack.id;
    END IF;

    INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status, waitlist_position, class_pack_id)
      VALUES (v_occ.studio_id, p_occurrence_id, v_profile_id, v_status, v_position, v_pack.id)
      RETURNING * INTO v_booking;

  ELSE
    RAISE EXCEPTION 'Unsupported payment source: %', p_source_type;
  END IF;

  RETURN v_booking;
END;
$$;

COMMENT ON FUNCTION book_class(UUID, TEXT, UUID) IS
  'Atomically books a class against a membership or class pack with server-side eligibility checks (mirrors src/lib/booking/entitlements.ts). Drop-in/paid bookings use Stripe Checkout + stripe-webhook instead.';

GRANT EXECUTE ON FUNCTION book_class(UUID, TEXT, UUID) TO authenticated;
