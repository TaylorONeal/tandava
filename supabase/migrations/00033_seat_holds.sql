-- 00027: Seat holds (W4-3).
--
-- Problem: a guest could pay for a drop-in after the class filled, and the
-- webhook could only flag "refund needed". Fix: take the seat BEFORE sending
-- the student to Stripe.
--
--   hold_spot(occurrence)  signed-in student; locks the class row, refuses if
--                          confirmed + checked-in + other people's live holds
--                          already fill it, else holds one seat for 35 minutes.
--   held_seats(occ, who)   live holds on a class, excluding `who`.
--
-- book_class and promote_waitlist count live holds, so a held seat cannot be
-- sold twice or handed to the waitlist. A hold becomes 'consumed' when the
-- booking for it is inserted (trigger), and lapses by itself on expiry (no
-- cleanup job: every reader filters on expires_at).
--
-- Abuse bound: at most 3 live holds per student. Account creation is the real
-- gate; bot control belongs on sign-up (Turnstile, W4-6).
--
-- Known edge: if a hold lapses before payment completes and the class fills,
-- fulfilment still flags "class full: refund needed" (unchanged from 00025).

CREATE TABLE seat_holds (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_occurrence_id UUID NOT NULL REFERENCES class_occurrences(id) ON DELETE CASCADE,
  profile_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  studio_id           UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'released')),
  expires_at          TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_seat_holds_active ON seat_holds (class_occurrence_id, profile_id) WHERE status = 'active';
CREATE INDEX idx_seat_holds_occ_live ON seat_holds (class_occurrence_id, expires_at) WHERE status = 'active';
CREATE INDEX idx_seat_holds_profile ON seat_holds (profile_id);
CREATE INDEX idx_seat_holds_studio ON seat_holds (studio_id);

ALTER TABLE seat_holds ENABLE ROW LEVEL SECURITY;
-- Class B: the student sees their own holds, staff see the studio's. Writes only via hold_spot.
CREATE POLICY "Members view own seat holds" ON seat_holds FOR SELECT USING (profile_id = (SELECT auth.uid()));
CREATE POLICY "Staff view seat holds" ON seat_holds FOR SELECT USING (studio_id IN (SELECT my_staff_studio_ids()));

CREATE OR REPLACE FUNCTION held_seats(p_occurrence_id UUID, p_except_profile UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(*)::int FROM seat_holds
  WHERE class_occurrence_id = p_occurrence_id
    AND status = 'active' AND expires_at > NOW()
    AND (p_except_profile IS NULL OR profile_id <> p_except_profile);
$$;
-- Returns only a count; book_class and hold_spot call it as definer.
REVOKE ALL ON FUNCTION held_seats(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION held_seats(UUID, UUID) TO service_role;

CREATE OR REPLACE FUNCTION hold_spot(p_occurrence_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID := auth.uid();
  v_occ class_occurrences%ROWTYPE;
  v_expires TIMESTAMPTZ := NOW() + INTERVAL '35 minutes';
  v_live INTEGER;
BEGIN
  IF v_profile_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_occ FROM class_occurrences WHERE id = p_occurrence_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Class not found'; END IF;
  IF v_occ.is_cancelled THEN RAISE EXCEPTION 'Class is cancelled'; END IF;
  IF v_occ.starts_at <= NOW() THEN RAISE EXCEPTION 'Class has already started'; END IF;

  IF EXISTS (SELECT 1 FROM bookings
             WHERE class_occurrence_id = p_occurrence_id AND profile_id = v_profile_id
               AND status NOT IN ('cancelled', 'late_cancel')) THEN
    RAISE EXCEPTION 'Already booked for this class';
  END IF;

  -- Re-holding extends the caller's own hold without double counting it.
  IF COALESCE(v_occ.booked_count, 0) + COALESCE(v_occ.checked_in_count, 0)
     + held_seats(p_occurrence_id, v_profile_id) >= v_occ.capacity THEN
    RAISE EXCEPTION 'Class is full';
  END IF;

  SELECT count(*) INTO v_live FROM seat_holds
    WHERE profile_id = v_profile_id AND status = 'active' AND expires_at > NOW()
      AND class_occurrence_id <> p_occurrence_id;
  IF v_live >= 3 THEN RAISE EXCEPTION 'Too many held seats'; END IF;

  INSERT INTO seat_holds (class_occurrence_id, profile_id, studio_id, expires_at)
  VALUES (p_occurrence_id, v_profile_id, v_occ.studio_id, v_expires)
  ON CONFLICT (class_occurrence_id, profile_id) WHERE status = 'active'
  DO UPDATE SET expires_at = EXCLUDED.expires_at;

  RETURN jsonb_build_object('result', 'held', 'expires_at', v_expires);
END;
$$;
REVOKE ALL ON FUNCTION hold_spot(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION hold_spot(UUID) TO authenticated, service_role;

-- A booking consumes the holder's hold.
CREATE OR REPLACE FUNCTION consume_seat_hold()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE seat_holds SET status = 'consumed'
  WHERE class_occurrence_id = NEW.class_occurrence_id AND profile_id = NEW.profile_id AND status = 'active';
  RETURN NEW;
END;
$$;
CREATE TRIGGER bookings_consume_hold_trg
  AFTER INSERT ON bookings
  FOR EACH ROW WHEN (NEW.status IN ('confirmed', 'waitlisted'))
  EXECUTE FUNCTION consume_seat_hold();

-- Capacity checks that now count live holds.
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
  IF COALESCE(v_occ.booked_count, 0) + COALESCE(v_occ.checked_in_count, 0)
     + held_seats(p_occurrence_id, v_profile_id) < v_occ.capacity THEN
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

CREATE OR REPLACE FUNCTION promote_waitlist(p_occurrence_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_capacity INTEGER;
  v_taken INTEGER;
  v_promoted INTEGER := 0;
  r RECORD;
BEGIN
  -- Same lock book_class takes, so promotion and new bookings cannot interleave.
  SELECT capacity INTO v_capacity FROM class_occurrences WHERE id = p_occurrence_id FOR UPDATE;
  IF NOT FOUND THEN RETURN 0; END IF;

  SELECT count(*) INTO v_taken FROM bookings
  WHERE class_occurrence_id = p_occurrence_id AND status IN ('confirmed', 'checked_in');

  FOR r IN
    SELECT id FROM bookings
    WHERE class_occurrence_id = p_occurrence_id AND status = 'waitlisted'
    ORDER BY waitlist_position NULLS LAST, created_at
  LOOP
    EXIT WHEN v_taken + held_seats(p_occurrence_id, NULL) >= v_capacity;
    BEGIN
      -- The ledger trigger consumes the credit; if the pack ran out or expired
      -- while they waited, the update is rolled back and the next person is tried.
      UPDATE bookings SET status = 'confirmed', waitlist_position = NULL WHERE id = r.id;
      v_taken := v_taken + 1;
      v_promoted := v_promoted + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'waitlist promotion skipped booking %: %', r.id, SQLERRM;
    END;
  END LOOP;

  RETURN v_promoted;
END;
$$;


REVOKE ALL ON FUNCTION promote_waitlist(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION promote_waitlist(UUID) TO service_role;
