-- 00024: Booking integrity. One ledger, one waitlist path, locked critical sections.
--
-- Audit findings fixed here (docs/plans/PRD-launch-v1.md, wave W3):
--   * Re-booking a class you cancelled always failed (UNIQUE ignored status).
--   * Waitlist promotion confirmed a spot WITHOUT consuming the pack/membership
--     (free class), and a later on-time cancel REFUNDED a credit that was never
--     taken (minted credit).
--   * Two competing promotion triggers (00001 immediate, 00007 offer record)
--     fired on the same cancellation.
--   * cancel_booking did not lock the booking, so two parallel cancels both
--     refunded.
--   * Two bookings for different classes could both pass the "has credits"
--     check on the last credit; the second silently skipped its decrement.
--   * No check-in path: staff had no write policy and nothing guarded status.
--
-- Design: consumption is a property of the booking row, not of whichever code
-- path created it.
--   bookings.entitlement_consumed   true  <=> one credit/usage is currently held
--   BEFORE INSERT/UPDATE trigger    confirmed + not consumed  -> lock source row, consume
--                                   confirmed -> cancelled    -> release (on-time cancel)
--   late_cancel                     keeps the credit (forfeited by policy)
-- So book_class, the Stripe webhook, waitlist promotion and staff tools all get
-- the same accounting for free, and the pack/membership row lock serialises the
-- last-credit race.

-- ---------------------------------------------------------------------------
-- 1. Ledger column + backfill
-- ---------------------------------------------------------------------------
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS entitlement_consumed BOOLEAN NOT NULL DEFAULT FALSE;

-- Rows created under the old insert triggers consumed on insert when confirmed.
-- Waitlist-promoted rows under the old code did not; they cannot be told apart,
-- so this errs toward "consumed" (a later cancel refunds one credit, as before).
UPDATE bookings SET entitlement_consumed = TRUE
WHERE (class_pack_id IS NOT NULL OR membership_id IS NOT NULL)
  AND status IN ('confirmed', 'checked_in', 'late_cancel', 'no_show');

-- ---------------------------------------------------------------------------
-- 2. Re-booking after a cancel: uniqueness only applies to active bookings
-- ---------------------------------------------------------------------------
DO $$
DECLARE c text;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'bookings'::regclass AND contype = 'u'
      AND pg_get_constraintdef(oid) = 'UNIQUE (class_occurrence_id, profile_id)'
  LOOP
    EXECUTE format('ALTER TABLE bookings DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_active_per_profile
  ON bookings (class_occurrence_id, profile_id)
  WHERE status NOT IN ('cancelled', 'late_cancel');

-- ---------------------------------------------------------------------------
-- 3. The ledger trigger (replaces the two AFTER INSERT consume triggers)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS decrement_pack_on_booking ON bookings;
DROP TRIGGER IF EXISTS increment_membership_on_booking ON bookings;

CREATE OR REPLACE FUNCTION bookings_entitlement_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_pack class_packs%ROWTYPE;
  v_mem memberships%ROWTYPE;
  v_cap INTEGER;
  v_old_status booking_status := CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END;
BEGIN
  -- Consume: a confirmed booking that holds no credit yet.
  IF NEW.status = 'confirmed' AND NOT NEW.entitlement_consumed THEN
    IF NEW.class_pack_id IS NOT NULL THEN
      SELECT * INTO v_pack FROM class_packs WHERE id = NEW.class_pack_id FOR UPDATE;
      IF NOT FOUND OR v_pack.status <> 'active' OR v_pack.expires_at < NOW() OR v_pack.classes_remaining <= 0 THEN
        RAISE EXCEPTION 'No classes remaining on this pack';
      END IF;
      UPDATE class_packs SET
        classes_remaining = classes_remaining - 1,
        status = CASE WHEN classes_remaining - 1 <= 0 THEN 'exhausted'::class_pack_status ELSE status END
      WHERE id = v_pack.id;
      NEW.entitlement_consumed := TRUE;

    ELSIF NEW.membership_id IS NOT NULL THEN
      SELECT * INTO v_mem FROM memberships WHERE id = NEW.membership_id FOR UPDATE;
      IF NOT FOUND OR v_mem.status <> 'active' THEN
        RAISE EXCEPTION 'Membership is not active';
      END IF;
      SELECT classes_per_cycle INTO v_cap FROM membership_types WHERE id = v_mem.membership_type_id;
      IF v_cap IS NOT NULL AND v_mem.classes_used_this_cycle >= v_cap THEN
        RAISE EXCEPTION 'No classes remaining in this cycle';
      END IF;
      UPDATE memberships SET classes_used_this_cycle = classes_used_this_cycle + 1 WHERE id = v_mem.id;
      NEW.entitlement_consumed := TRUE;
    END IF;

  -- Release: an on-time cancel of a confirmed booking that holds a credit.
  -- (late_cancel is deliberately not released: the credit is forfeited.)
  ELSIF NEW.status = 'cancelled' AND v_old_status = 'confirmed' AND OLD.entitlement_consumed THEN
    IF NEW.class_pack_id IS NOT NULL THEN
      SELECT * INTO v_pack FROM class_packs WHERE id = NEW.class_pack_id FOR UPDATE;
      IF FOUND THEN
        UPDATE class_packs SET
          classes_remaining = classes_remaining + 1,
          -- an expired pack must not come back to life
          status = CASE WHEN status = 'exhausted' AND expires_at > NOW() THEN 'active'::class_pack_status ELSE status END
        WHERE id = v_pack.id;
      END IF;
    ELSIF NEW.membership_id IS NOT NULL THEN
      UPDATE memberships SET classes_used_this_cycle = GREATEST(0, classes_used_this_cycle - 1)
      WHERE id = NEW.membership_id;
    END IF;
    NEW.entitlement_consumed := FALSE;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_entitlement_sync_trg
  BEFORE INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION bookings_entitlement_sync();

-- ---------------------------------------------------------------------------
-- 4. One waitlist promotion path
-- ---------------------------------------------------------------------------
-- Replaces promote_waitlist_on_cancel (00001, immediate) and
-- trigger_waitlist_promotion (00007, offer record with accept deadline).
-- Immediate promotion is the behaviour the app supports today; the offer-with-
-- deadline flow (waitlist_promotions) stays in the schema for a later release.
DROP TRIGGER IF EXISTS promote_waitlist_on_cancel ON bookings;
DROP TRIGGER IF EXISTS trigger_waitlist_promotion ON bookings;

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
    EXIT WHEN v_taken >= v_capacity;
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

CREATE OR REPLACE FUNCTION promote_waitlist_after_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM promote_waitlist(NEW.class_occurrence_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER promote_waitlist_after_cancel_trg
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  WHEN (OLD.status = 'confirmed' AND NEW.status IN ('cancelled', 'late_cancel'))
  EXECUTE FUNCTION promote_waitlist_after_cancel();

-- ---------------------------------------------------------------------------
-- 5. cancel_booking: lock before reading, ledger does the refund
-- ---------------------------------------------------------------------------
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

  -- Lock order: occurrence, then booking (book_class and promote_waitlist use
  -- the same order), so concurrent cancels and bookings cannot deadlock.
  SELECT * INTO v_occ FROM class_occurrences WHERE id = v_booking.class_occurrence_id FOR UPDATE;
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;

  SELECT EXISTS (
    SELECT 1 FROM studio_staff
    WHERE studio_id = v_booking.studio_id AND profile_id = v_uid
      AND is_active AND role IN ('owner', 'admin', 'front_desk')
  ) INTO v_is_staff;
  IF v_booking.profile_id <> v_uid AND NOT v_is_staff THEN
    RAISE EXCEPTION 'Not authorized to cancel this booking';
  END IF;

  IF v_booking.status IN ('cancelled', 'late_cancel') THEN
    RAISE EXCEPTION 'Booking is already cancelled';
  END IF;

  SELECT * INTO v_studio FROM studios WHERE id = v_booking.studio_id;

  v_is_late := NOW() > (v_occ.starts_at - make_interval(mins => COALESCE(v_studio.default_cancellation_minutes, 120)));
  v_new_status := CASE WHEN v_is_late THEN 'late_cancel'::booking_status ELSE 'cancelled'::booking_status END;

  IF v_is_late AND COALESCE(v_studio.late_cancel_fee_cents, 0) > 0 THEN
    INSERT INTO transactions (studio_id, profile_id, type, status, amount_cents, booking_id, description)
    VALUES (
      v_booking.studio_id, v_booking.profile_id, 'late_cancel_fee', 'pending',
      v_studio.late_cancel_fee_cents, v_booking.id, 'Late cancellation fee'
    );
  END IF;

  -- Credit release (on-time) and waitlist promotion happen in the triggers.
  UPDATE bookings
    SET status = v_new_status, cancelled_at = NOW(), is_late_cancel = v_is_late
    WHERE id = p_booking_id
    RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION cancel_booking(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION cancel_booking(UUID) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. check_in_booking: the only way a booking becomes checked_in
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_in_booking(
  p_booking_id UUID,
  p_method TEXT DEFAULT 'staff_manual'
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_booking bookings%ROWTYPE;
  v_occ class_occurrences%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_method NOT IN ('qr_scan', 'kiosk_search', 'kiosk_list', 'staff_manual', 'auto') THEN
    RAISE EXCEPTION 'Unknown check-in method';
  END IF;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM studio_staff
    WHERE studio_id = v_booking.studio_id AND profile_id = v_uid
      AND is_active AND role IN ('owner', 'admin', 'front_desk', 'teacher')
  ) THEN
    RAISE EXCEPTION 'Not authorized to check in attendees';
  END IF;

  SELECT * INTO v_occ FROM class_occurrences WHERE id = v_booking.class_occurrence_id FOR UPDATE;
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;

  IF v_booking.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Only confirmed bookings can be checked in (status: %)', v_booking.status;
  END IF;
  IF v_occ.is_cancelled THEN RAISE EXCEPTION 'Class is cancelled'; END IF;
  IF NOW() < v_occ.starts_at - INTERVAL '60 minutes' OR NOW() > v_occ.ends_at THEN
    RAISE EXCEPTION 'Check-in is open from 60 minutes before the class until it ends';
  END IF;

  UPDATE bookings SET
    status = 'checked_in',
    checked_in_at = NOW(),
    checked_in_by = v_uid,
    check_in_method = p_method
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION check_in_booking(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION check_in_booking(UUID, TEXT) TO authenticated, service_role;
