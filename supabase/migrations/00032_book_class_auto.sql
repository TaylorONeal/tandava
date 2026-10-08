-- 00026: Book with the best available source, in one server-side decision.
--
-- The storefront has to answer "can this signed-in student just book this
-- class, or do they need to pay?" Doing that in the browser meant shipping
-- every membership and pack to the client and re-implementing book_class's
-- eligibility rules. Instead:
--
--   book_class_auto(occurrence)
--     -> tries the student's memberships, then their packs (soonest expiry
--        first) through book_class itself, so eligibility has ONE definition
--     -> returns {result: 'booked', ...} or
--        {result: 'needs_payment', drop_in_price_cents, currency}
--
-- The client then either shows "you're booked" or starts a drop-in checkout.
--
-- Also: book_class now rejects classes that have already started (audit P2).

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
  IF v_occ.starts_at <= NOW() THEN
    RAISE EXCEPTION 'Class has already started';
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

    -- Consumption happens in bookings_entitlement_sync (00024).

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

    -- Consumption happens in bookings_entitlement_sync (00024).

    INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status, waitlist_position, class_pack_id)
      VALUES (v_occ.studio_id, p_occurrence_id, v_profile_id, v_status, v_position, v_pack.id)
      RETURNING * INTO v_booking;

  ELSE
    RAISE EXCEPTION 'Unsupported payment source: %', p_source_type;
  END IF;

  RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION book_class(UUID, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION book_class(UUID, TEXT, UUID) TO authenticated, service_role;


CREATE OR REPLACE FUNCTION book_class_auto(p_occurrence_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_occ class_occurrences%ROWTYPE;
  v_booking bookings%ROWTYPE;
  v_price INTEGER;
  v_currency TEXT;
  r RECORD;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_occ FROM class_occurrences WHERE id = p_occurrence_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Class not found'; END IF;
  IF v_occ.is_cancelled THEN RAISE EXCEPTION 'Class is cancelled'; END IF;
  IF v_occ.starts_at <= NOW() THEN RAISE EXCEPTION 'Class has already started'; END IF;
  IF EXISTS (SELECT 1 FROM bookings WHERE class_occurrence_id = p_occurrence_id
             AND profile_id = v_uid AND status NOT IN ('cancelled', 'late_cancel')) THEN
    RAISE EXCEPTION 'Already booked for this class';
  END IF;

  -- Memberships first (they do not run out per class), then packs that expire soonest.
  FOR r IN
    SELECT 'membership'::text AS source_type, m.id AS source_id, m.current_period_end AS sort_key
      FROM memberships m
      WHERE m.profile_id = v_uid AND m.studio_id = v_occ.studio_id AND m.status = 'active'
    UNION ALL
    SELECT 'class_pack', p.id, p.expires_at
      FROM class_packs p
      WHERE p.profile_id = v_uid AND p.studio_id = v_occ.studio_id
        AND p.status = 'active' AND p.classes_remaining > 0
    ORDER BY 1 DESC, 3 ASC   -- 'membership' sorts after 'class_pack', so DESC puts memberships first
  LOOP
    BEGIN
      v_booking := book_class(p_occurrence_id, r.source_type, r.source_id);
      RETURN jsonb_build_object(
        'result', 'booked',
        'booking_id', v_booking.id,
        'status', v_booking.status,
        'source_type', r.source_type,
        'source_id', r.source_id
      );
    EXCEPTION WHEN OTHERS THEN
      -- This source does not cover the class (scope, period, cap, expiry): try the next one.
      CONTINUE;
    END;
  END LOOP;

  SELECT o.drop_in_price_cents, s.currency INTO v_price, v_currency
    FROM offerings o JOIN studios s ON s.id = o.studio_id
    WHERE o.id = v_occ.offering_id;

  RETURN jsonb_build_object(
    'result', 'needs_payment',
    'drop_in_price_cents', v_price,
    'currency', COALESCE(v_currency, 'USD')
  );
END;
$$;

REVOKE ALL ON FUNCTION book_class_auto(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION book_class_auto(UUID) TO authenticated, service_role;
