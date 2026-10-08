-- Migration: book_class() fixes found by running it against a real database
--
-- 1. DOUBLE CONSUMPTION. The bookings table already has AFTER INSERT triggers
--    (decrement_class_pack, increment_membership_usage; 00001) that consume the
--    entitlement for a confirmed booking. book_class() (00012) ALSO consumed it
--    explicitly, so one booking cost two classes. The triggers are the single
--    place now (they also cover the Stripe webhook and any other insert path).
--
-- 2. OVERBOOKING RACE. book_class() read capacity without locking, so two
--    concurrent requests for the last spot both saw a free seat and both were
--    confirmed. The occurrence row is now locked (FOR UPDATE) before the
--    capacity check, which serialises bookings per class.
--
-- 3. CROSS-STUDIO ENTITLEMENT. A membership or class pack was only checked
--    against the caller, never against the class's studio, so a pack bought at
--    studio A could be spent at studio B. Both are now rejected when the studio
--    differs.

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

  SELECT * INTO v_occ FROM class_occurrences WHERE id = p_occurrence_id FOR UPDATE;
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
  IF COALESCE(v_occ.booked_count, 0) + COALESCE(v_occ.checked_in_count, 0) < v_occ.capacity THEN
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
    IF v_mem.studio_id <> v_occ.studio_id THEN
      RAISE EXCEPTION 'Membership belongs to a different studio';
    END IF;
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

    -- Entitlement consumption happens in the increment_membership_usage trigger.

    INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status, waitlist_position, membership_id)
      VALUES (v_occ.studio_id, p_occurrence_id, v_profile_id, v_status, v_position, v_mem.id)
      RETURNING * INTO v_booking;

  ELSIF p_source_type = 'class_pack' THEN
    SELECT * INTO v_pack FROM class_packs
      WHERE id = p_source_id AND profile_id = v_profile_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Class pack not found'; END IF;
    IF v_pack.studio_id <> v_occ.studio_id THEN
      RAISE EXCEPTION 'Class pack belongs to a different studio';
    END IF;
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

    -- Pack decrement happens in the decrement_class_pack trigger.

    INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status, waitlist_position, class_pack_id)
      VALUES (v_occ.studio_id, p_occurrence_id, v_profile_id, v_status, v_position, v_pack.id)
      RETURNING * INTO v_booking;

  ELSE
    RAISE EXCEPTION 'Unsupported payment source: %', p_source_type;
  END IF;

  RETURN v_booking;
END;
$$;

