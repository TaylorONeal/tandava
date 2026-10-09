-- Apply 00042 (owner edits classes, prices and schedule, LP-5) to tandava-prod. Needs 00036..00041.
-- Paste all of it into https://supabase.com/dashboard/project/mkaixgjwakfufmmwembn/sql/new and Run.
-- Then redeploy stripe-checkout and onboarding.
BEGIN;
-- 00042: owners and admins edit classes, prices and the weekly schedule (LP-5).
--
-- offerings, class_pack_types, membership_types and schedule_rules had read
-- policies only. The onboarding edge function wrote them with the service
-- role, so nothing could change after setup. This adds:
--   1. Value checks for what an owner now types (no zero-length classes,
--      no negative prices).
--   2. INSERT and UPDATE policies for owners and admins of the studio. No
--      DELETE: retiring a class or price is is_active = false, so bookings,
--      purchases and history keep their references.
--   3. A row never moves to another studio.
--   4. A schedule rule only points at its own studio's class, location and
--      staff.
--   5. Editing a class (length, capacity, on/off) reaches its scheduled
--      classes. Rules are re-saved so 00036/00037 reconcile them, and a new
--      capacity is also set on future classes that already have bookings
--      (refused while a cut would strand a seat being paid for).
--   6. get_studio_staff_names: the schedule editor's teacher picker. Staff
--      cannot read each other's profiles through RLS.
--   7. Purchases keep the terms shown at checkout, and owners cannot change
--      an existing membership's billing cycle or class limit.
--
-- Prices are read at checkout (stripe-checkout builds price_data from these
-- rows), so a price edit applies to the next purchase with no Stripe change.

-- 1. Value checks -------------------------------------------------------------
ALTER TABLE offerings DROP CONSTRAINT IF EXISTS offerings_values_valid;
ALTER TABLE offerings ADD CONSTRAINT offerings_values_valid
  CHECK (duration_minutes BETWEEN 1 AND 1440 AND capacity > 0
         AND (drop_in_price_cents IS NULL OR drop_in_price_cents >= 0));

ALTER TABLE class_pack_types DROP CONSTRAINT IF EXISTS class_pack_types_values_valid;
ALTER TABLE class_pack_types ADD CONSTRAINT class_pack_types_values_valid
  CHECK (class_count > 0 AND price_cents >= 0 AND validity_days > 0);

ALTER TABLE membership_types DROP CONSTRAINT IF EXISTS membership_types_values_valid;
ALTER TABLE membership_types ADD CONSTRAINT membership_types_values_valid
  CHECK (price_cents >= 0 AND (classes_per_cycle IS NULL OR classes_per_cycle > 0));

-- 2. Owner and admin writes -----------------------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['offerings', 'class_pack_types', 'membership_types', 'schedule_rules'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admins can add %1$s" ON %1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admins can edit %1$s" ON %1$I', t);
    EXECUTE format(
      'CREATE POLICY "Admins can add %1$s" ON %1$I FOR INSERT TO authenticated
         WITH CHECK (studio_id IN (SELECT my_admin_studio_ids()))', t);
    EXECUTE format(
      'CREATE POLICY "Admins can edit %1$s" ON %1$I FOR UPDATE TO authenticated
         USING (studio_id IN (SELECT my_admin_studio_ids()))
         WITH CHECK (studio_id IN (SELECT my_admin_studio_ids()))', t);
  END LOOP;
END $$;

-- 3. studio_id is fixed -----------------------------------------------------------
CREATE OR REPLACE FUNCTION keep_studio_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.studio_id IS DISTINCT FROM OLD.studio_id THEN
    RAISE EXCEPTION 'studio_id cannot change' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION keep_studio_id() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['offerings', 'class_pack_types', 'membership_types', 'schedule_rules'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %1$s_keep_studio_id ON %1$I', t);
    EXECUTE format('CREATE TRIGGER %1$s_keep_studio_id BEFORE UPDATE OF studio_id ON %1$I
                      FOR EACH ROW EXECUTE FUNCTION keep_studio_id()', t);
  END LOOP;
END $$;

-- 4. Schedule rules stay inside their studio --------------------------------------
CREATE OR REPLACE FUNCTION schedule_rule_check_refs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM offerings WHERE id = NEW.offering_id AND studio_id = NEW.studio_id) THEN
    RAISE EXCEPTION 'class belongs to another studio' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM locations WHERE id = NEW.location_id AND studio_id = NEW.studio_id) THEN
    RAISE EXCEPTION 'location belongs to another studio' USING ERRCODE = '23514';
  END IF;
  IF NEW.teacher_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM studio_staff
                      WHERE studio_id = NEW.studio_id AND profile_id = NEW.teacher_id) THEN
    RAISE EXCEPTION 'teacher is not staff of this studio' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION schedule_rule_check_refs() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS schedule_rules_check_refs ON schedule_rules;
CREATE TRIGGER schedule_rules_check_refs
  BEFORE INSERT OR UPDATE OF studio_id, offering_id, location_id, teacher_id ON schedule_rules
  FOR EACH ROW EXECUTE FUNCTION schedule_rule_check_refs();

-- 5. Class edits reach the schedule -------------------------------------------------
CREATE OR REPLACE FUNCTION offering_sync_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_occ   UUID;
  v_taken INTEGER;
  v_held  INTEGER;
BEGIN
  -- Re-save each rule: end time follows the new length (TIME wraps past
  -- midnight, and generate_rule_occurrences then uses the class length), and
  -- the 00036 trigger reconciles its classes (capacity, on/off).
  UPDATE schedule_rules sr
     SET end_time = sr.start_time + make_interval(mins => NEW.duration_minutes),
         updated_at = NOW()
   WHERE sr.offering_id = NEW.id;

  -- Classes with bookings or holds are left alone by the reconcile, so the
  -- new capacity is set on them here, exactly as asked (unless the rule has
  -- its own capacity; schedule_overrides has no capacity type, so a sub or a
  -- moved time does not keep the old capacity). Below the number booked, everyone stays
  -- booked and the class shows full until it drops under the new capacity;
  -- waitlist promotion (00030/00033) only fills seats below capacity. A raise
  -- promotes the waitlist before the new seats are offered to anyone else. A cut that would
  -- strand a customer paying in Checkout (an active seat hold) is refused, so
  -- no paid seat turns into a refund. Each class is locked first and counted
  -- in a later statement (fresh snapshot), like the 00037 reconcile, so a
  -- booking or hold that commits while we wait is seen.
  IF NEW.capacity IS DISTINCT FROM OLD.capacity THEN
    FOR v_occ IN
      SELECT co.id FROM class_occurrences co
       WHERE co.offering_id = NEW.id
         AND co.starts_at > NOW()
         AND NOT COALESCE(co.is_cancelled, false)
         AND co.capacity IS DISTINCT FROM NEW.capacity
         AND NOT EXISTS (SELECT 1 FROM schedule_rules sr
                          WHERE sr.id = co.schedule_rule_id AND sr.capacity_override IS NOT NULL)
       ORDER BY co.id
         FOR UPDATE OF co
    LOOP
      SELECT count(*) INTO v_taken FROM bookings
       WHERE class_occurrence_id = v_occ AND status IN ('confirmed', 'checked_in');
      SELECT count(*) INTO v_held FROM seat_holds
       WHERE class_occurrence_id = v_occ AND status = 'active' AND expires_at > NOW();
      IF v_held > 0 AND v_taken + v_held > NEW.capacity THEN
        RAISE EXCEPTION 'Someone is paying for a spot in one of these classes right now. Try again in a few minutes.'
          USING ERRCODE = '55P03';
      END IF;
      UPDATE class_occurrences SET capacity = NEW.capacity, updated_at = NOW() WHERE id = v_occ;
      -- New seats go to the waitlist first (00033 promote_waitlist checks
      -- capacity, so a cut never promotes anyone).
      IF NEW.capacity > OLD.capacity THEN
        PERFORM promote_waitlist(v_occ);
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION offering_sync_schedule() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS offerings_sync_schedule ON offerings;
CREATE TRIGGER offerings_sync_schedule
  AFTER UPDATE OF duration_minutes, capacity, is_active ON offerings
  FOR EACH ROW
  WHEN (OLD.duration_minutes IS DISTINCT FROM NEW.duration_minutes
        OR OLD.capacity IS DISTINCT FROM NEW.capacity
        OR OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION offering_sync_schedule();

-- 6. Teacher picker -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_studio_staff_names(p_studio_id UUID)
RETURNS TABLE (profile_id UUID, name TEXT, role TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ss.profile_id,
         COALESCE(NULLIF(p.display_name, ''),
                  NULLIF(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
                  p.email, 'Staff') AS name,
         ss.role::text
    FROM studio_staff ss
    JOIN profiles p ON p.id = ss.profile_id
   WHERE ss.studio_id = p_studio_id
     AND COALESCE(ss.is_active, true)
     AND p_studio_id IN (SELECT my_admin_studio_ids())
   ORDER BY 2;
$$;
REVOKE ALL ON FUNCTION get_studio_staff_names(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_studio_staff_names(UUID) TO authenticated;

-- 7. Purchases keep the terms they were sold with ---------------------------------
-- An owner can now edit a pack's size or validity while a customer is in
-- Checkout. stripe-checkout puts the terms it showed into the session metadata
-- (class_count, validity_days, billing_cycle) and fulfillment uses them. Older
-- sessions without them fall back to the current row. Otherwise unchanged from
-- 00031.
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

-- A membership's billing cycle and class limit apply to everyone on it (usage
-- is checked against the plan, not copied to the membership), including a
-- buyer still in Checkout. So owners cannot change them on an existing plan:
-- they add a new plan and turn the old one off. Price and name can change:
-- existing subscriptions keep their price. The onboarding function (service
-- role, no signed-in user) may still re-save its starter plan before anyone
-- has joined.
CREATE OR REPLACE FUNCTION membership_type_lock_terms()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.billing_cycle IS DISTINCT FROM OLD.billing_cycle
      OR NEW.classes_per_cycle IS DISTINCT FROM OLD.classes_per_cycle)
     AND ((SELECT auth.uid()) IS NOT NULL
          OR EXISTS (SELECT 1 FROM memberships WHERE membership_type_id = OLD.id)) THEN
    RAISE EXCEPTION 'Billing and the class limit cannot change on an existing membership. Add a new one and turn this one off.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION membership_type_lock_terms() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS membership_types_lock_terms ON membership_types;
CREATE TRIGGER membership_types_lock_terms
  BEFORE UPDATE OF billing_cycle, classes_per_cycle ON membership_types
  FOR EACH ROW EXECUTE FUNCTION membership_type_lock_terms();
COMMIT;
