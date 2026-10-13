-- Apply 00043 (studio cancels a class, LP-1d) to tandava-prod. Needs 00033 (held_seats) and 00042.
-- Paste all of it into https://supabase.com/dashboard/project/mkaixgjwakfufmmwembn/sql/new and Run.
-- Then deploy cancel-class (verify_jwt true) and stripe-webhook, and add charge.refund.updated to the Stripe webhook endpoint events.
BEGIN;
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
--     6. queues a notice for everyone affected in class_cancel_notices
--     7. returns who to tell and what happened
--
--   class_cancel_followup(occurrence) reports what went out and what is still
--   owed, so an interrupted cancel (lost response, function timeout) can be
--   finished from the owner's screen.
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
  -- Part of the Stripe idempotency key. Bumped only after a definite failure
  -- (Stripe refused, or the refund later failed), so a retry after a lost
  -- response gets the same refund back, never a second one.
  refund_attempt   INTEGER NOT NULL DEFAULT 0,
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

-- Who still has to be told, durably queued with the refunds, so an
-- interrupted cancel can be finished later (class_cancel_followup + the
-- cancel-class edge function's resume mode). One row per affected booking;
-- person is the snapshot the email is written from.
CREATE TABLE IF NOT EXISTS class_cancel_notices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id     UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  occurrence_id UUID NOT NULL REFERENCES class_occurrences(id) ON DELETE CASCADE,
  -- NULL for a payment that completed after the class was cancelled (no booking).
  booking_id    UUID,
  -- The drop-in payment this person may be refunded for; joins refund_requests.
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  person        JSONB NOT NULL,
  email         TEXT,
  message       TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'no_email', 'handled')),
  -- What the sent email said about the refund ('sent' or 'failed'). A notice
  -- that said 'failed' is owed a short "your refund is on its way" once the
  -- refund goes through.
  -- 'handled': the owner told them themselves.
  refund_told   TEXT CHECK (refund_told IN ('sent', 'failed', 'handled')),
  last_error    TEXT,
  attempts      INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (occurrence_id, booking_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_class_cancel_notices_late_payment
  ON class_cancel_notices (occurrence_id, transaction_id) WHERE booking_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_class_cancel_notices_studio_status ON class_cancel_notices (studio_id, status);

ALTER TABLE class_cancel_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS class_cancel_notices_staff_read ON class_cancel_notices;
CREATE POLICY class_cancel_notices_staff_read ON class_cancel_notices
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
CREATE OR REPLACE FUNCTION cancel_class(p_occurrence_id UUID, p_reason TEXT DEFAULT NULL, p_message TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_occ class_occurrences%ROWTYPE;
  v_people JSONB;
  v_reason TEXT := NULLIF(left(trim(COALESCE(p_reason, '')), 500), '');
  v_message TEXT := NULLIF(left(trim(COALESCE(p_message, '')), 1000), '');
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

  -- Everyone affected is queued to be told; people with no email are recorded
  -- so the owner can see who to contact themselves.
  INSERT INTO class_cancel_notices (studio_id, occurrence_id, booking_id, transaction_id, person, email, message, status)
  SELECT v_occ.studio_id, p_occurrence_id, (p->>'booking_id')::UUID, b.transaction_id, p, NULLIF(p->>'email', ''), v_message,
         CASE WHEN NULLIF(p->>'email', '') IS NULL THEN 'no_email' ELSE 'pending' END
  FROM jsonb_array_elements(v_people) AS p
  LEFT JOIN bookings b ON b.id = (p->>'booking_id')::UUID
  ON CONFLICT (occurrence_id, booking_id) DO NOTHING;

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
REVOKE ALL ON FUNCTION cancel_class(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION cancel_class(UUID, TEXT, TEXT) TO authenticated, service_role;

COMMENT ON FUNCTION cancel_class(UUID, TEXT, TEXT) IS
  'Studio cancels a class: marks it cancelled, clears the waitlist, cancels bookings (ledger returns credits), queues drop-in refunds and notices. LP-1d.';

-- ---------------------------------------------------------------------------
-- 6. Follow-up state: what went out and what is still owed. Read after every
--    cancel or resume, and when the owner reopens a cancelled class, so the
--    screen always shows the durable truth rather than one call's response.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION class_cancel_followup(p_occurrence_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_occ class_occurrences%ROWTYPE;
BEGIN
  SELECT * INTO v_occ FROM class_occurrences WHERE id = p_occurrence_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Class not found' USING ERRCODE = 'P0002'; END IF;
  PERFORM class_cancel_assert_staff(v_occ.studio_id);

  RETURN jsonb_build_object(
    'occurrence_id', v_occ.id,
    'starts_at', v_occ.starts_at,
    'class_name', (SELECT name FROM offerings WHERE id = v_occ.offering_id),
    'cancelled', COALESCE(v_occ.is_cancelled, FALSE),
    -- refund_status: a drop-in refund not confirmed sent is reported as not sent.
    'people', (
      SELECT COALESCE(jsonb_agg(
        n.person || jsonb_build_object(
          'notice_status', n.status,
          'refund_status', CASE WHEN rr.id IS NULL THEN NULL WHEN rr.status = 'sent' THEN 'sent' ELSE 'failed' END)
        ORDER BY n.person->>'status' = 'waitlisted', n.person->>'first_name', n.created_at), '[]'::jsonb)
      FROM class_cancel_notices n
      LEFT JOIN refund_requests rr ON rr.transaction_id = n.transaction_id AND rr.reason = 'class_cancelled'
      WHERE n.occurrence_id = p_occurrence_id),
    'refunds_sent', (SELECT count(*) FROM refund_requests WHERE occurrence_id = p_occurrence_id AND status = 'sent'),
    'refunds_sent_cents', (SELECT COALESCE(sum(amount_cents), 0) FROM refund_requests WHERE occurrence_id = p_occurrence_id AND status = 'sent'),
    'refunds_outstanding', (SELECT count(*) FROM refund_requests WHERE occurrence_id = p_occurrence_id AND status <> 'sent'),
    'emails_sent', (SELECT count(*) FROM class_cancel_notices WHERE occurrence_id = p_occurrence_id AND status = 'sent'),
    'emails_outstanding', (SELECT count(*) FROM class_cancel_notices WHERE occurrence_id = p_occurrence_id AND status IN ('pending', 'sending', 'failed')),
    'emails_failed', (SELECT count(*) FROM class_cancel_notices WHERE occurrence_id = p_occurrence_id AND status = 'failed'),
    -- No email on file: the owner has to contact them, then marks it handled.
    'no_email_open', (SELECT count(*) FROM class_cancel_notices WHERE occurrence_id = p_occurrence_id AND status = 'no_email'),
    -- Claimed but never recorded (the function died mid-send): may or may not
    -- have gone out, so never resent automatically. The owner checks and marks it handled.
    'emails_uncertain', (SELECT count(*) FROM class_cancel_notices WHERE occurrence_id = p_occurrence_id
                           AND status = 'sending' AND updated_at < NOW() - INTERVAL '5 minutes'),
    -- Told "the studio is arranging your refund", and the refund has since gone through.
    'refund_updates_owed', (SELECT count(*) FROM class_cancel_notices n
                             JOIN refund_requests rr ON rr.transaction_id = n.transaction_id AND rr.reason = 'class_cancelled'
                            WHERE n.occurrence_id = p_occurrence_id AND n.status IN ('sent', 'handled')
                              AND n.refund_told = 'failed' AND rr.status = 'sent')
  );
END;
$$;
REVOKE ALL ON FUNCTION class_cancel_followup(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION class_cancel_followup(UUID) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 7. Paid after the class was cancelled
-- ---------------------------------------------------------------------------
-- A student can finish a Checkout started before the studio cancelled. The
-- payment is recorded without a booking; this queues its full refund and a
-- notice, so the cancelled class shows it as follow-up still owed.
CREATE OR REPLACE FUNCTION class_cancel_queue_late_payment(p_occurrence_id UUID, p_profile_id UUID, p_transaction_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_studio UUID;
  v_refund INTEGER := class_cancel_refund_cents(p_transaction_id);
  v_person JSONB;
BEGIN
  SELECT studio_id INTO v_studio FROM class_occurrences WHERE id = p_occurrence_id;
  IF v_studio IS NULL OR v_refund <= 0 THEN RETURN; END IF;

  INSERT INTO refund_requests (studio_id, transaction_id, occurrence_id, amount_cents, reason)
  VALUES (v_studio, p_transaction_id, p_occurrence_id, v_refund, 'class_cancelled')
  ON CONFLICT (transaction_id, reason) DO NOTHING;

  SELECT jsonb_build_object(
      'booking_id', NULL, 'profile_id', p.id,
      'name', NULLIF(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
      'first_name', p.first_name, 'email', p.email, 'status', 'paid_after_cancel',
      'source', 'drop_in', 'refund_cents', v_refund,
      'currency', (SELECT currency FROM transactions WHERE id = p_transaction_id))
    INTO v_person
    FROM profiles p WHERE p.id = p_profile_id;
  IF v_person IS NULL THEN RETURN; END IF;

  INSERT INTO class_cancel_notices (studio_id, occurrence_id, booking_id, transaction_id, person, email, status)
  VALUES (v_studio, p_occurrence_id, NULL, p_transaction_id, v_person, NULLIF(v_person->>'email', ''),
          CASE WHEN NULLIF(v_person->>'email', '') IS NULL THEN 'no_email' ELSE 'pending' END)
  ON CONFLICT DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION class_cancel_queue_late_payment(UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;

-- 00042's fulfillment, unchanged except that the cancelled-class branch now
-- calls class_cancel_queue_late_payment.
CREATE OR REPLACE FUNCTION fulfill_stripe_checkout(
  p_event_id   TEXT,
  p_event_type TEXT,
  p_session    JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meta        JSONB := COALESCE(p_session -> 'metadata', '{}'::jsonb);
  v_kind        TEXT  := v_meta ->> 'type';
  v_studio_id   UUID  := NULLIF(v_meta ->> 'studio_id', '')::uuid;
  v_profile_id  UUID  := NULLIF(v_meta ->> 'profile_id', '')::uuid;
  v_amount      INTEGER := COALESCE((p_session ->> 'amount_total')::int, 0);
  v_currency    TEXT  := UPPER(COALESCE(NULLIF(p_session ->> 'currency', ''), 'USD'));
  v_pi          TEXT  := NULLIF(p_session ->> 'payment_intent', '');
  v_session_id  TEXT  := NULLIF(p_session ->> 'id', '');
  v_fee         INTEGER := NULLIF(v_meta ->> 'platform_fee_cents', '')::int;
  v_inserted    INTEGER;
  v_txn_id      UUID;
  v_note        TEXT;
  v_occ         class_occurrences%ROWTYPE;
  v_taken       INTEGER;
  v_mt          membership_types%ROWTYPE;
  v_period_end  TIMESTAMPTZ;
  v_mem_id      UUID;
  v_pt          class_pack_types%ROWTYPE;
  v_pack_id     UUID;
  v_balance     INTEGER;
  v_tier        UUID;
BEGIN
  INSERT INTO stripe_events (id, type) VALUES (p_event_id, p_event_type) ON CONFLICT (id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN
    RETURN jsonb_build_object('status', 'duplicate');
  END IF;

  -- The same payment can arrive under a different event id (for example
  -- checkout.session.completed and checkout.session.async_payment_succeeded).
  IF EXISTS (SELECT 1 FROM transactions
             WHERE (v_pi IS NOT NULL AND stripe_payment_intent_id = v_pi)
                OR (v_session_id IS NOT NULL AND stripe_checkout_session_id = v_session_id)) THEN
    UPDATE stripe_events SET processed_at = NOW(), note = 'payment already fulfilled by another event' WHERE id = p_event_id;
    RETURN jsonb_build_object('status', 'duplicate', 'reason', 'payment already fulfilled');
  END IF;

  IF v_kind IS NULL THEN
    UPDATE stripe_events SET processed_at = NOW(), note = 'no metadata.type; ignored' WHERE id = p_event_id;
    RETURN jsonb_build_object('status', 'ignored');
  END IF;
  IF v_studio_id IS NULL OR v_profile_id IS NULL THEN
    RAISE EXCEPTION 'checkout session % is missing studio_id/profile_id metadata', v_session_id;
  END IF;

  IF v_kind = 'drop_in' THEN
    SELECT * INTO v_occ FROM class_occurrences
      WHERE id = NULLIF(v_meta ->> 'occurrence_id', '')::uuid FOR UPDATE;
    IF NOT FOUND OR v_occ.studio_id <> v_studio_id THEN
      RAISE EXCEPTION 'drop-in class % not found for studio %', v_meta ->> 'occurrence_id', v_studio_id;
    END IF;

    INSERT INTO transactions (studio_id, profile_id, type, status, amount_cents, currency,
                              platform_fee_cents, stripe_payment_intent_id, stripe_checkout_session_id)
    VALUES (v_studio_id, v_profile_id, 'drop_in', 'completed', v_amount, v_currency,
            v_fee, v_pi, v_session_id)
    RETURNING id INTO v_txn_id;

    SELECT count(*) INTO v_taken FROM bookings
      WHERE class_occurrence_id = v_occ.id AND status IN ('confirmed', 'checked_in');

    IF EXISTS (SELECT 1 FROM bookings WHERE class_occurrence_id = v_occ.id AND profile_id = v_profile_id
               AND status NOT IN ('cancelled', 'late_cancel')) THEN
      v_note := 'already booked: duplicate payment, refund needed';
    ELSIF v_occ.is_cancelled THEN
      v_note := 'class cancelled: refund needed';
      -- Paid after the studio cancelled: queue the refund and the notice like
      -- everyone else in the class, so the owner's follow-up covers them (00043).
      PERFORM class_cancel_queue_late_payment(v_occ.id, v_profile_id, v_txn_id);
    ELSIF v_taken >= v_occ.capacity THEN
      v_note := 'class full: refund needed';
    ELSE
      INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status, transaction_id)
      VALUES (v_studio_id, v_occ.id, v_profile_id, 'confirmed', v_txn_id);
    END IF;

  ELSIF v_kind = 'membership' THEN
    SELECT * INTO v_mt FROM membership_types WHERE id = NULLIF(v_meta ->> 'membership_type_id', '')::uuid;
    IF NOT FOUND OR v_mt.studio_id <> v_studio_id THEN
      RAISE EXCEPTION 'membership type % not found for studio %', v_meta ->> 'membership_type_id', v_studio_id;
    END IF;
    -- The cycle sold at checkout (metadata, 00042), else the plan's current one.
    v_period_end := CASE COALESCE(NULLIF(v_meta ->> 'billing_cycle', ''), v_mt.billing_cycle::text)
      WHEN 'weekly'    THEN NOW() + INTERVAL '7 days'
      WHEN 'quarterly' THEN NOW() + INTERVAL '3 months'
      WHEN 'annual'    THEN NOW() + INTERVAL '1 year'
      ELSE NOW() + INTERVAL '1 month' END;

    INSERT INTO memberships (studio_id, profile_id, membership_type_id, status,
                             current_period_start, current_period_end, stripe_subscription_id)
    VALUES (v_studio_id, v_profile_id, v_mt.id, 'active', NOW(), v_period_end, NULLIF(p_session ->> 'subscription', ''))
    RETURNING id INTO v_mem_id;

    INSERT INTO transactions (studio_id, profile_id, type, status, amount_cents, currency,
                              platform_fee_cents, stripe_payment_intent_id, stripe_checkout_session_id, membership_id)
    VALUES (v_studio_id, v_profile_id, 'membership_purchase', 'completed',
            COALESCE(NULLIF(v_amount, 0), v_mt.price_cents, 0), v_currency, v_fee, v_pi, v_session_id, v_mem_id);

  ELSIF v_kind = 'class_pack' THEN
    SELECT * INTO v_pt FROM class_pack_types WHERE id = NULLIF(v_meta ->> 'class_pack_type_id', '')::uuid;
    IF NOT FOUND OR v_pt.studio_id <> v_studio_id THEN
      RAISE EXCEPTION 'class pack type % not found for studio %', v_meta ->> 'class_pack_type_id', v_studio_id;
    END IF;

    INSERT INTO class_packs (studio_id, profile_id, class_pack_type_id, status, classes_remaining,
                             classes_total, expires_at, stripe_payment_intent_id)
    -- The terms sold at checkout (metadata, 00042), else the pack's current ones.
    VALUES (v_studio_id, v_profile_id, v_pt.id, 'active',
            COALESCE(NULLIF(v_meta ->> 'class_count', '')::int, v_pt.class_count),
            COALESCE(NULLIF(v_meta ->> 'class_count', '')::int, v_pt.class_count),
            NOW() + make_interval(days => COALESCE(NULLIF(v_meta ->> 'validity_days', '')::int, v_pt.validity_days, 90)), v_pi)
    RETURNING id INTO v_pack_id;

    INSERT INTO transactions (studio_id, profile_id, type, status, amount_cents, currency,
                              platform_fee_cents, stripe_payment_intent_id, stripe_checkout_session_id, class_pack_id)
    VALUES (v_studio_id, v_profile_id, 'class_pack_purchase', 'completed',
            COALESCE(NULLIF(v_amount, 0), v_pt.price_cents, 0), v_currency, v_fee, v_pi, v_session_id, v_pack_id);

  ELSIF v_kind = 'workshop' THEN
    v_balance := COALESCE(NULLIF(v_meta ->> 'balance_due_cents', '')::int, 0);
    v_tier    := NULLIF(v_meta ->> 'tier_id', '')::uuid;

    INSERT INTO transactions (studio_id, profile_id, type, status, amount_cents, currency,
                              platform_fee_cents, stripe_payment_intent_id, stripe_checkout_session_id)
    VALUES (v_studio_id, v_profile_id, 'workshop', 'completed', v_amount, v_currency, v_fee, v_pi, v_session_id)
    RETURNING id INTO v_txn_id;

    INSERT INTO event_registrations (event_id, studio_id, profile_id, pricing_tier_id, status,
                                     amount_paid_cents, deposit_paid_cents, balance_due_cents, transaction_id)
    VALUES (NULLIF(v_meta ->> 'event_id', '')::uuid, v_studio_id, v_profile_id, v_tier, 'registered',
            v_amount, CASE WHEN v_balance > 0 THEN v_amount ELSE 0 END, v_balance, v_txn_id);

    PERFORM increment_event_registered(NULLIF(v_meta ->> 'event_id', '')::uuid);
    IF v_tier IS NOT NULL THEN PERFORM increment_tier_registered(v_tier); END IF;

  ELSE
    UPDATE stripe_events SET processed_at = NOW(), note = 'unknown type ' || v_kind WHERE id = p_event_id;
    RETURN jsonb_build_object('status', 'ignored', 'reason', 'unknown type');
  END IF;

  UPDATE stripe_events SET processed_at = NOW(), note = v_note WHERE id = p_event_id;
  RETURN jsonb_build_object('status', 'processed', 'kind', v_kind, 'note', v_note);
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. A refund Stripe later fails goes back on the queue
-- ---------------------------------------------------------------------------
-- charge.refund.updated with status failed or canceled (stripe-webhook).
-- The next attempt uses a fresh idempotency key; the old refund is dead.
CREATE OR REPLACE FUNCTION reopen_failed_refund(
  p_refund_request_id UUID, p_stripe_refund_id TEXT, p_refund_attempt INTEGER, p_error TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_txn UUID;
BEGIN
  -- Matched by the attempt the refund was made under (its metadata), so a
  -- failure that arrives before the edge function recorded "sent" still
  -- counts, and a stale or repeated event (attempt already moved on) does not.
  UPDATE refund_requests
     SET status = 'failed', refund_attempt = refund_attempt + 1, stripe_refund_id = p_stripe_refund_id,
         last_error = left(COALESCE(p_error, 'Refund failed at Stripe'), 500), updated_at = NOW()
   WHERE id = p_refund_request_id
     AND CASE WHEN p_refund_attempt IS NULL
              THEN stripe_refund_id = p_stripe_refund_id AND status = 'sent'
              ELSE refund_attempt = p_refund_attempt END
  RETURNING transaction_id INTO v_txn;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  -- Whoever was told the refund is on its way is owed the update once a retry
  -- goes through (the refund-sent email), and the owner sees it as owed.
  UPDATE class_cancel_notices SET refund_told = 'failed', updated_at = NOW()
   WHERE transaction_id = v_txn AND refund_told = 'sent';
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION reopen_failed_refund(UUID, TEXT, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION reopen_failed_refund(UUID, TEXT, INTEGER, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- 9. The owner handled the rest themselves
-- ---------------------------------------------------------------------------
-- After contacting people directly (no email on file, a bad address, an email
-- that may or may not have gone out), the owner closes the remaining notices. Refunds are not
-- closable here: they settle through Stripe (see 10).
CREATE OR REPLACE FUNCTION class_cancel_mark_handled(p_occurrence_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_studio UUID;
  v_count INTEGER;
BEGIN
  SELECT studio_id INTO v_studio FROM class_occurrences WHERE id = p_occurrence_id;
  IF v_studio IS NULL THEN RAISE EXCEPTION 'Class not found' USING ERRCODE = 'P0002'; END IF;
  PERFORM class_cancel_assert_staff(v_studio);
  -- Not yet told (including no email on file) -> handled. A "your refund went
  -- through" update is closed only once it is actually owed (the refund has
  -- gone through); one still waiting on its refund stays open.
  UPDATE class_cancel_notices n
     SET status = CASE WHEN n.status IN ('pending', 'sending', 'failed', 'no_email') THEN 'handled' ELSE n.status END,
         refund_told = CASE
           WHEN n.refund_told = 'failed' AND rr.status = 'sent' THEN 'handled'
           -- Told by hand while the refund is still owed: they are owed the
           -- "your refund went through" update once it goes through.
           WHEN n.refund_told IS NULL AND n.status IN ('pending', 'sending', 'failed', 'no_email')
                AND rr.id IS NOT NULL AND rr.status <> 'sent' THEN 'failed'
           ELSE n.refund_told END,
         updated_at = NOW()
    FROM class_cancel_notices n2
    LEFT JOIN refund_requests rr ON rr.transaction_id = n2.transaction_id AND rr.reason = 'class_cancelled'
   WHERE n.id = n2.id AND n.occurrence_id = p_occurrence_id
     AND (n.status IN ('pending', 'sending', 'failed', 'no_email') OR (n.refund_told = 'failed' AND rr.status = 'sent'));
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION class_cancel_mark_handled(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION class_cancel_mark_handled(UUID) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 10. Refunded in the Stripe dashboard
-- ---------------------------------------------------------------------------
-- charge.refunded (stripe-webhook) for a fully refunded charge settles any
-- class-cancel refund still queued for that payment, so a refund the owner
-- made by hand is not retried (Stripe would refuse it) and stops showing as owed.
CREATE OR REPLACE FUNCTION settle_class_cancel_refunds(p_payment_intent TEXT, p_amount INTEGER, p_amount_refunded INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_payment_intent IS NULL OR p_amount_refunded < p_amount THEN RETURN 0; END IF;
  UPDATE refund_requests rr
     SET status = 'sent', last_error = 'Refunded in Stripe', updated_at = NOW()
    FROM transactions t
   WHERE rr.transaction_id = t.id AND t.stripe_payment_intent_id = p_payment_intent
     AND rr.status <> 'sent';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION settle_class_cancel_refunds(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION settle_class_cancel_refunds(TEXT, INTEGER, INTEGER) TO service_role;
COMMIT;
