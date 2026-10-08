-- 00025: Payments integrity. Idempotent, transactional Stripe fulfilment in SQL.
--
-- Audit findings fixed here (docs/plans/PRD-launch-v1.md, wave W2):
--   * The webhook had no idempotency: a Stripe retry duplicated transactions,
--     class packs (double credits), memberships and workshop registrations.
--   * Each fulfilment step was a separate client call that logged and
--     swallowed errors, then answered 200, so a failed insert after a
--     successful payment was lost for good (Stripe never retried).
--   * No refund handling, no membership renewal handling (usage never reset),
--     no way to know a studio can really take charges (details_submitted was
--     used as the gate).
--
-- Design: the edge function only verifies the signature and forwards the
-- event to one SECURITY DEFINER function per outcome. Each function runs as a
-- single database transaction: it records the Stripe event id first, then does
-- all of its writes. If anything fails, everything rolls back (including the
-- event id), the function raises, the webhook answers 5xx, and Stripe retries.
-- If the same event arrives twice the second call is a no-op.

-- ---------------------------------------------------------------------------
-- 1. Event ledger (server-only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stripe_events (
  id            TEXT PRIMARY KEY,          -- Stripe event id (evt_...)
  type          TEXT NOT NULL,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at  TIMESTAMPTZ,
  note          TEXT                        -- e.g. 'class full: refund needed'
);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
-- Explicit deny-all for clients; only the service role (which bypasses RLS) reads it.
CREATE POLICY "No client access to stripe events"
  ON stripe_events FOR ALL USING (FALSE) WITH CHECK (FALSE);

-- ---------------------------------------------------------------------------
-- 2. Columns the money path needs
-- ---------------------------------------------------------------------------
-- A studio may only receive payments once Stripe says charges are enabled.
-- (details_submitted, used before, is true while a payout review is pending.)
ALTER TABLE studios ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE studios SET stripe_charges_enabled = TRUE
WHERE stripe_account_id IS NOT NULL AND stripe_onboarding_complete = TRUE;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

-- Belt and braces under the event ledger. Guarded: if production already holds
-- duplicates from the old webhook, skip the index instead of failing the migration.
DO $$
BEGIN
  CREATE UNIQUE INDEX uq_transactions_payment_intent
    ON transactions (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
EXCEPTION WHEN unique_violation THEN
  RAISE WARNING 'duplicate stripe_payment_intent_id rows exist; uq_transactions_payment_intent not created. Clean up, then create it manually.';
END $$;

-- ---------------------------------------------------------------------------
-- 3. Fulfil a completed checkout
-- ---------------------------------------------------------------------------
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
    v_period_end := CASE v_mt.billing_cycle::text
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
    VALUES (v_studio_id, v_profile_id, v_pt.id, 'active', v_pt.class_count, v_pt.class_count,
            NOW() + make_interval(days => COALESCE(v_pt.validity_days, 90)), v_pi)
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
-- 4. Refunds: record them, and undo what the money bought when fully refunded
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION record_stripe_refund(
  p_event_id        TEXT,
  p_payment_intent  TEXT,
  p_charge_id       TEXT,
  p_amount          INTEGER,   -- charge.amount
  p_amount_refunded INTEGER    -- charge.amount_refunded (cumulative)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INTEGER;
  v_txn transactions%ROWTYPE;
  v_full BOOLEAN := p_amount_refunded >= p_amount;
BEGIN
  INSERT INTO stripe_events (id, type) VALUES (p_event_id, 'charge.refunded') ON CONFLICT (id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN RETURN jsonb_build_object('status', 'duplicate'); END IF;

  SELECT * INTO v_txn FROM transactions WHERE stripe_payment_intent_id = p_payment_intent FOR UPDATE;
  IF NOT FOUND THEN
    -- Refund arrived before the purchase was recorded: fail so Stripe retries later.
    RAISE EXCEPTION 'refund for unknown payment intent %, retry later', p_payment_intent;
  END IF;

  UPDATE transactions SET
    refunded_amount_cents = p_amount_refunded,
    status = CASE WHEN v_full THEN 'refunded'::transaction_status ELSE 'partially_refunded'::transaction_status END,
    stripe_charge_id = COALESCE(stripe_charge_id, p_charge_id)
  WHERE id = v_txn.id;

  IF v_full THEN
    IF v_txn.type = 'drop_in' THEN
      -- Cancel the booking this payment bought (the booking ledger handles the rest).
      UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = 'refunded'
      WHERE transaction_id = v_txn.id AND status IN ('confirmed', 'waitlisted');
    ELSIF v_txn.type = 'class_pack_purchase' AND v_txn.class_pack_id IS NOT NULL THEN
      -- Void the unused credits; classes already taken stay taken.
      UPDATE class_packs SET classes_remaining = 0, status = 'exhausted' WHERE id = v_txn.class_pack_id;
    END IF;
  END IF;

  UPDATE stripe_events SET processed_at = NOW() WHERE id = p_event_id;
  RETURN jsonb_build_object('status', 'processed', 'full', v_full);
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Membership renewal: new period, usage reset, renewal transaction
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION renew_membership_cycle(
  p_event_id        TEXT,
  p_subscription_id TEXT,
  p_period_start    TIMESTAMPTZ,
  p_period_end      TIMESTAMPTZ,
  p_amount_cents    INTEGER,
  p_currency        TEXT,
  p_payment_intent  TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INTEGER;
  v_mem memberships%ROWTYPE;
BEGIN
  INSERT INTO stripe_events (id, type) VALUES (p_event_id, 'invoice.paid') ON CONFLICT (id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN RETURN jsonb_build_object('status', 'duplicate'); END IF;

  SELECT * INTO v_mem FROM memberships WHERE stripe_subscription_id = p_subscription_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'renewal for unknown subscription %, retry later', p_subscription_id;
  END IF;

  UPDATE memberships SET
    status = 'active',
    current_period_start = p_period_start,
    current_period_end = p_period_end,
    classes_used_this_cycle = 0
  WHERE id = v_mem.id;

  INSERT INTO transactions (studio_id, profile_id, type, status, amount_cents, currency,
                            stripe_payment_intent_id, membership_id)
  VALUES (v_mem.studio_id, v_mem.profile_id, 'membership_renewal', 'completed',
          COALESCE(p_amount_cents, 0), UPPER(COALESCE(p_currency, 'USD')), p_payment_intent, v_mem.id);

  UPDATE stripe_events SET processed_at = NOW() WHERE id = p_event_id;
  RETURN jsonb_build_object('status', 'processed');
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Connect account state (account.updated)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_studio_charges_enabled(
  p_account_id        TEXT,
  p_charges_enabled   BOOLEAN,
  p_details_submitted BOOLEAN
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n INTEGER;
BEGIN
  UPDATE studios SET
    stripe_charges_enabled = COALESCE(p_charges_enabled, FALSE),
    stripe_onboarding_complete = COALESCE(p_details_submitted, FALSE)
  WHERE stripe_account_id = p_account_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Server-only
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION fulfill_stripe_checkout(TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION record_stripe_refund(TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION renew_membership_cycle(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION set_studio_charges_enabled(TEXT, BOOLEAN, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION fulfill_stripe_checkout(TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION record_stripe_refund(TEXT, TEXT, TEXT, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION renew_membership_cycle(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION set_studio_charges_enabled(TEXT, BOOLEAN, BOOLEAN) TO service_role;
