-- 00043: The studio cancels a class (LP-1d).
--
-- Before this, setting class_occurrences.is_cancelled changed nothing for the
-- people booked: their bookings stayed confirmed, their pack class or
-- membership usage stayed spent, paid drop-ins stayed charged, and nobody was
-- told. Now one call does all of it, in one transaction:
--
--   cancel_class(occurrence, reason)
--     1. locks the class (same lock order as book_class / cancel_booking)
--     2. marks it cancelled
--     3. clears the waitlist (no promotion into a cancelled class)
--     4. cancels every active booking with reason 'class_cancelled'; the
--        ledger trigger (00030) returns pack classes and membership usage
--     5. queues a full refund for every paid drop-in in refund_requests
--     6. returns who to tell and what happened, for the caller to email
--
--   preview_class_cancellation(occurrence) answers the same question without
--   changing anything, so the owner sees exactly who is affected first.
--
-- Money leaves through the cancel-class edge function, which issues the
-- Stripe refunds from refund_requests (idempotent by request id). The
-- charge.refunded webhook then records the refund on the transaction as for
-- any other refund (record_stripe_refund, 00031).

-- ---------------------------------------------------------------------------
-- 1. Refunds owed, durably queued
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refund_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id        UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  transaction_id   UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  booking_id       UUID REFERENCES bookings(id) ON DELETE SET NULL,
  occurrence_id    UUID REFERENCES class_occurrences(id) ON DELETE SET NULL,
  amount_cents     INTEGER NOT NULL CHECK (amount_cents > 0),
  reason           TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  stripe_refund_id TEXT,
  last_error       TEXT,
  attempts         INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One refund per payment per reason: re-running a cancel never double-refunds.
  UNIQUE (transaction_id, reason)
);

CREATE INDEX IF NOT EXISTS idx_refund_requests_studio_status ON refund_requests (studio_id, status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_occurrence ON refund_requests (occurrence_id);

ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- Staff see their studio's refunds. Nobody writes from the client: rows are
-- created by cancel_class and updated by the edge function (service role).
DROP POLICY IF EXISTS refund_requests_staff_read ON refund_requests;
CREATE POLICY refund_requests_staff_read ON refund_requests
  FOR SELECT TO authenticated
  USING (studio_id IN (SELECT my_staff_studio_ids()));

-- ---------------------------------------------------------------------------
-- 2. No waitlist promotion into a cancelled class (00033 body, plus the guard)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION promote_waitlist(p_occurrence_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_capacity INTEGER;
  v_cancelled BOOLEAN;
  v_taken INTEGER;
  v_promoted INTEGER := 0;
  r RECORD;
BEGIN
  -- Same lock book_class takes, so promotion and new bookings cannot interleave.
  SELECT capacity, COALESCE(is_cancelled, FALSE) INTO v_capacity, v_cancelled
    FROM class_occurrences WHERE id = p_occurrence_id FOR UPDATE;
  IF NOT FOUND OR v_cancelled THEN RETURN 0; END IF;

  SELECT count(*) INTO v_taken FROM bookings
  WHERE class_occurrence_id = p_occurrence_id AND status IN ('confirmed', 'checked_in');

  FOR r IN
    SELECT id FROM bookings
    WHERE class_occurrence_id = p_occurrence_id AND status = 'waitlisted'
    ORDER BY waitlist_position NULLS LAST, created_at
  LOOP
    EXIT WHEN v_taken + held_seats(p_occurrence_id, NULL) >= v_capacity;
    BEGIN
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

-- ---------------------------------------------------------------------------
-- 3. Who is affected (shared by preview and cancel)
-- ---------------------------------------------------------------------------
-- What a refund for this booking would be: the unrefunded part of a completed
-- card payment. 0 for pack, membership, free and unpaid bookings.
CREATE OR REPLACE FUNCTION class_cancel_refund_cents(p_transaction_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT GREATEST(0, t.amount_cents - COALESCE(t.refunded_amount_cents, 0))
    FROM transactions t
    WHERE t.id = p_transaction_id
      AND t.status IN ('completed', 'partially_refunded')
      AND t.stripe_payment_intent_id IS NOT NULL
  ), 0);
$$;
REVOKE ALL ON FUNCTION class_cancel_refund_cents(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION class_cancel_assert_staff(p_studio_id UUID)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM studio_staff
    WHERE studio_id = p_studio_id AND profile_id = (SELECT auth.uid())
      AND is_active AND role IN ('owner', 'admin', 'front_desk')
  ) THEN
    RAISE EXCEPTION 'Only this studio''s staff can cancel its classes' USING ERRCODE = '42501';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION class_cancel_assert_staff(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION class_cancel_people(p_occurrence_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'booking_id', b.id,
      'profile_id', b.profile_id,
      'name', NULLIF(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
      'first_name', p.first_name,
      'email', p.email,
      'status', b.status,
      'source', CASE
                  WHEN b.status = 'waitlisted' THEN 'waitlist'
                  WHEN b.class_pack_id IS NOT NULL THEN 'pack'
                  WHEN b.membership_id IS NOT NULL THEN 'membership'
                  WHEN class_cancel_refund_cents(b.transaction_id) > 0 THEN 'drop_in'
                  ELSE 'free'
                END,
      'refund_cents', CASE WHEN b.status = 'waitlisted' THEN 0
                           ELSE class_cancel_refund_cents(b.transaction_id) END,
      'currency', COALESCE(t.currency, s.currency, 'USD')
    ) ORDER BY b.status = 'waitlisted', p.first_name, p.last_name), '[]'::jsonb)
  FROM bookings b
  LEFT JOIN profiles p ON p.id = b.profile_id
  LEFT JOIN transactions t ON t.id = b.transaction_id
  LEFT JOIN studios s ON s.id = b.studio_id
  WHERE b.class_occurrence_id = p_occurrence_id
    AND b.status IN ('confirmed', 'checked_in', 'waitlisted');
$$;
REVOKE ALL ON FUNCTION class_cancel_people(UUID) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Preview: what cancelling would do. Changes nothing.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION preview_class_cancellation(p_occurrence_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_occ class_occurrences%ROWTYPE;
  v_people JSONB;
BEGIN
  SELECT * INTO v_occ FROM class_occurrences WHERE id = p_occurrence_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Class not found' USING ERRCODE = 'P0002'; END IF;
  PERFORM class_cancel_assert_staff(v_occ.studio_id);

  v_people := class_cancel_people(p_occurrence_id);
  RETURN jsonb_build_object(
    'occurrence_id', v_occ.id,
    'starts_at', v_occ.starts_at,
    'class_name', (SELECT name FROM offerings WHERE id = v_occ.offering_id),
    'already_cancelled', COALESCE(v_occ.is_cancelled, FALSE),
    'started', v_occ.starts_at <= NOW(),
    'people', v_people
  );
END;
$$;
REVOKE ALL ON FUNCTION preview_class_cancellation(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION preview_class_cancellation(UUID) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Cancel
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cancel_class(p_occurrence_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_occ class_occurrences%ROWTYPE;
  v_people JSONB;
  v_reason TEXT := NULLIF(left(trim(COALESCE(p_reason, '')), 500), '');
  r RECORD;
  v_refund INTEGER;
  v_refund_ids UUID[] := '{}';
  v_id UUID;
BEGIN
  -- Lock order: occurrence first (book_class, cancel_booking, promote_waitlist).
  SELECT * INTO v_occ FROM class_occurrences WHERE id = p_occurrence_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Class not found' USING ERRCODE = 'P0002'; END IF;
  PERFORM class_cancel_assert_staff(v_occ.studio_id);

  IF COALESCE(v_occ.is_cancelled, FALSE) THEN
    RAISE EXCEPTION 'This class is already cancelled' USING ERRCODE = '55000';
  END IF;
  IF v_occ.starts_at <= NOW() THEN
    RAISE EXCEPTION 'This class has already started' USING ERRCODE = '55000';
  END IF;

  -- Who was affected, captured before anything changes.
  v_people := class_cancel_people(p_occurrence_id);

  UPDATE class_occurrences
     SET is_cancelled = TRUE, cancelled_at = NOW(),
         cancellation_reason = COALESCE(v_reason, 'cancelled by studio'), updated_at = NOW()
   WHERE id = p_occurrence_id;

  -- Waitlist first, so nothing can be promoted into the cancelled class.
  UPDATE bookings
     SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = 'class_cancelled', waitlist_position = NULL
   WHERE class_occurrence_id = p_occurrence_id AND status = 'waitlisted';

  -- An early check-in (allowed before the start) still holds its credit and
  -- has counted as attendance. Undo the attendance the check-in trigger added
  -- (00001 update_member_stats_on_checkin), then step the booking back to
  -- confirmed so the ledger trigger releases the credit on the cancel below.
  FOR r IN
    SELECT id, studio_id, profile_id FROM bookings
    WHERE class_occurrence_id = p_occurrence_id AND status = 'checked_in'
    FOR UPDATE
  LOOP
    UPDATE studio_members sm SET
      total_classes_attended = GREATEST(0, COALESCE(sm.total_classes_attended, 0) - 1),
      last_class_at = (SELECT max(b.checked_in_at) FROM bookings b
                        WHERE b.studio_id = r.studio_id AND b.profile_id = r.profile_id
                          AND b.status = 'checked_in' AND b.id <> r.id)
     WHERE sm.studio_id = r.studio_id AND sm.profile_id = r.profile_id;
    UPDATE bookings SET status = 'confirmed', checked_in_at = NULL, checked_in_by = NULL WHERE id = r.id;
  END LOOP;

  FOR r IN
    SELECT id, transaction_id FROM bookings
    WHERE class_occurrence_id = p_occurrence_id AND status = 'confirmed'
    ORDER BY id
    FOR UPDATE
  LOOP
    -- The studio cancelled, so this is never a late cancel: the ledger
    -- trigger returns the pack class or membership usage.
    UPDATE bookings
       SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = 'class_cancelled', is_late_cancel = FALSE
     WHERE id = r.id;

    v_refund := class_cancel_refund_cents(r.transaction_id);
    IF v_refund > 0 THEN
      INSERT INTO refund_requests (studio_id, transaction_id, booking_id, occurrence_id, amount_cents, reason)
      VALUES (v_occ.studio_id, r.transaction_id, r.id, p_occurrence_id, v_refund, 'class_cancelled')
      ON CONFLICT (transaction_id, reason) DO NOTHING
      RETURNING id INTO v_id;
      IF v_id IS NOT NULL THEN v_refund_ids := v_refund_ids || v_id; END IF;
      v_id := NULL;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'occurrence_id', v_occ.id,
    'starts_at', v_occ.starts_at,
    'class_name', (SELECT name FROM offerings WHERE id = v_occ.offering_id),
    'studio_name', (SELECT name FROM studios WHERE id = v_occ.studio_id),
    'reason', v_reason,
    'people', v_people,
    'refund_request_ids', to_jsonb(v_refund_ids)
  );
END;
$$;
REVOKE ALL ON FUNCTION cancel_class(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION cancel_class(UUID, TEXT) TO authenticated, service_role;

COMMENT ON FUNCTION cancel_class(UUID, TEXT) IS
  'Studio cancels a class: marks it cancelled, clears the waitlist, cancels bookings (ledger returns credits), queues drop-in refunds. LP-1d.';
