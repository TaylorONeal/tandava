-- Native release sells physical services only. Unknown legacy products remain
-- unknown until an owner explicitly classifies them; location is not evidence.
ALTER TABLE offerings ADD COLUMN purchase_scope text NOT NULL DEFAULT 'unknown'
  CHECK (purchase_scope IN ('unknown','in_person','digital_or_mixed'));
ALTER TABLE class_pack_types ADD COLUMN purchase_scope text NOT NULL DEFAULT 'unknown'
  CHECK (purchase_scope IN ('unknown','in_person','digital_or_mixed'));
ALTER TABLE membership_types ADD COLUMN purchase_scope text NOT NULL DEFAULT 'unknown'
  CHECK (purchase_scope IN ('unknown','in_person','digital_or_mixed'));
ALTER TABLE class_packs ADD COLUMN purchase_scope text NOT NULL DEFAULT 'unknown'
  CHECK (purchase_scope IN ('unknown','in_person','digital_or_mixed'));
ALTER TABLE memberships ADD COLUMN purchase_scope text NOT NULL DEFAULT 'unknown'
  CHECK (purchase_scope IN ('unknown','in_person','digital_or_mixed'));

-- A classification is a durable product promise, including checkouts still in
-- flight. Change format by creating a new product, never by widening this one.
CREATE FUNCTION guard_catalog_purchase_scope() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.purchase_scope <> 'unknown' AND NEW.purchase_scope IS DISTINCT FROM OLD.purchase_scope THEN
    RAISE EXCEPTION 'Create a new product to change its delivery format' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION guard_catalog_purchase_scope() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER catalog_purchase_scope BEFORE UPDATE ON offerings
  FOR EACH ROW EXECUTE FUNCTION guard_catalog_purchase_scope();
CREATE TRIGGER catalog_purchase_scope BEFORE UPDATE ON class_pack_types
  FOR EACH ROW EXECUTE FUNCTION guard_catalog_purchase_scope();
CREATE TRIGGER catalog_purchase_scope BEFORE UPDATE ON membership_types
  FOR EACH ROW EXECUTE FUNCTION guard_catalog_purchase_scope();

CREATE FUNCTION guard_entitlement_purchase_scope() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.purchase_scope IS DISTINCT FROM OLD.purchase_scope THEN
    RAISE EXCEPTION 'Purchased delivery format cannot change' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION guard_entitlement_purchase_scope() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER entitlement_purchase_scope BEFORE UPDATE ON class_packs
  FOR EACH ROW EXECUTE FUNCTION guard_entitlement_purchase_scope();
CREATE TRIGGER entitlement_purchase_scope BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION guard_entitlement_purchase_scope();

-- A paid physical class must not later be replaced with an online offering.
CREATE FUNCTION guard_physical_occurrence() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_scope text;
BEGIN
  IF NEW.offering_id IS DISTINCT FROM OLD.offering_id THEN
    SELECT purchase_scope INTO v_scope FROM offerings WHERE id = OLD.offering_id FOR SHARE;
    IF v_scope = 'in_person' THEN
      RAISE EXCEPTION 'An in-person occurrence cannot change its class type' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION guard_physical_occurrence() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER physical_occurrence BEFORE UPDATE OF offering_id ON class_occurrences
  FOR EACH ROW EXECUTE FUNCTION guard_physical_occurrence();

-- This covers direct writes, book_class/auto and waitlist promotion. Cancellation
-- and credit refunds remain possible. Ledger triggers still own consumption.
CREATE FUNCTION guard_physical_redemption() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_physical boolean; v_scope text;
BEGIN
  IF NEW.status::text IN ('cancelled', 'late_cancel') THEN RETURN NEW; END IF;
  SELECT EXISTS (SELECT 1 FROM class_packs WHERE id = NEW.class_pack_id AND purchase_scope = 'in_person')
      OR EXISTS (SELECT 1 FROM memberships WHERE id = NEW.membership_id AND purchase_scope = 'in_person')
    INTO v_physical;
  IF v_physical THEN
    SELECT o.purchase_scope INTO v_scope FROM class_occurrences c
      JOIN offerings o ON o.id = c.offering_id AND o.studio_id = c.studio_id
      WHERE c.id = NEW.class_occurrence_id AND c.studio_id = NEW.studio_id FOR SHARE OF c, o;
    IF v_scope IS DISTINCT FROM 'in_person' THEN
      RAISE EXCEPTION 'This purchase is valid only for in-person classes' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION guard_physical_redemption() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER a_physical_redemption BEFORE INSERT OR UPDATE OF status, class_occurrence_id, class_pack_id, membership_id ON bookings
  FOR EACH ROW EXECUTE FUNCTION guard_physical_redemption();

-- Snapshot the scope actually sold, not the current catalog. Historical checkout
-- sessions without this metadata keep unknown scope and their existing terms.
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
                             current_period_start, current_period_end, stripe_subscription_id, purchase_scope)
    VALUES (v_studio_id, v_profile_id, v_mt.id, 'active', NOW(), v_period_end, NULLIF(p_session ->> 'subscription', ''), COALESCE(v_meta ->> 'purchase_scope', 'unknown'))
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
                             classes_total, expires_at, stripe_payment_intent_id, purchase_scope)
    -- The terms sold at checkout (metadata, 00042), else the pack's current ones.
    VALUES (v_studio_id, v_profile_id, v_pt.id, 'active',
            COALESCE(NULLIF(v_meta ->> 'class_count', '')::int, v_pt.class_count),
            COALESCE(NULLIF(v_meta ->> 'class_count', '')::int, v_pt.class_count),
            NOW() + make_interval(days => COALESCE(NULLIF(v_meta ->> 'validity_days', '')::int, v_pt.validity_days, 90)), v_pi, COALESCE(v_meta ->> 'purchase_scope', 'unknown'))
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
REVOKE ALL ON FUNCTION fulfill_stripe_checkout(text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION fulfill_stripe_checkout(text,text,jsonb) TO service_role;

-- Public product scope is safe storefront information; tenant/page gates stay intact.
CREATE OR REPLACE FUNCTION public.get_studio_storefront(p_slug text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'studio', jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'slug', s.slug,
      'description', s.description,
      'primary_color', s.brand_primary_color,
      'secondary_color', s.brand_secondary_color,
      'font', s.brand_font,
      'timezone', s.timezone,
      'currency', s.currency
    ),
    'offerings', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', o.id,
        'purchase_scope', o.purchase_scope,
        'name', o.name,
        'style', o.style,
        'level', o.level,
        'description', o.description,
        'duration_minutes', o.duration_minutes,
        'capacity', o.capacity,
        'drop_in_price_cents', o.drop_in_price_cents,
        'is_heated', o.is_heated
      ) ORDER BY o.name)
      FROM offerings o
      WHERE o.studio_id = s.id AND o.is_active = TRUE AND o.discoverable = TRUE
    ), '[]'::jsonb),
    'memberships', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', m.id,
        'purchase_scope', m.purchase_scope,
        'name', m.name,
        'description', m.description,
        'billing_cycle', m.billing_cycle,
        'price_cents', m.price_cents,
        'classes_per_cycle', m.classes_per_cycle
      ) ORDER BY m.sort_order, m.price_cents)
      FROM membership_types m
      WHERE m.studio_id = s.id AND m.is_active = TRUE
    ), '[]'::jsonb),
    'packs', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', cp.id,
        'purchase_scope', cp.purchase_scope,
        'name', cp.name,
        'description', cp.description,
        'class_count', cp.class_count,
        'price_cents', cp.price_cents,
        'validity_days', cp.validity_days
      ) ORDER BY cp.sort_order, cp.price_cents)
      FROM class_pack_types cp
      WHERE cp.studio_id = s.id AND cp.is_active = TRUE
    ), '[]'::jsonb)
  )
  FROM studios s
  WHERE s.slug = p_slug
    AND s.page_live = TRUE;
$function$;
