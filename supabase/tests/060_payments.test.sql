\i helpers.sql
-- Payments (PAY-*): migration 00025. Stripe fulfilment is idempotent, atomic and retry-safe.
-- Runs as the service role, like the stripe-webhook edge function does.

CREATE OR REPLACE FUNCTION pg_temp.session(kind text, extra jsonb DEFAULT '{}', amount int DEFAULT 2200, pi text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql AS $$
  SELECT jsonb_build_object(
    'id', 'cs_' || md5(random()::text), 'amount_total', amount, 'currency', 'usd',
    'payment_intent', COALESCE(pi, 'pi_' || md5(random()::text)),
    'metadata', jsonb_build_object('type', kind,
        'studio_id', pg_temp.id('studio_a')::text, 'profile_id', pg_temp.id('student_a1')::text) || extra)
$$;

DO $$
DECLARE r jsonb; s jsonb; n int; occ text := pg_temp.id('occ_a_open')::text;
BEGIN
  EXECUTE 'SET LOCAL ROLE service_role';

  -- PAY-01: a paid drop-in creates one transaction and one confirmed booking...
  s := pg_temp.session('drop_in', jsonb_build_object('occurrence_id', occ), 2200, 'pi_dropin_1');
  r := fulfill_stripe_checkout('evt_1', 'checkout.session.completed', s);
  PERFORM pg_temp.ok(r ->> 'status' = 'processed', 'PAY-01', 'first delivery is processed');
  PERFORM pg_temp.ok((SELECT count(*) FROM transactions WHERE stripe_payment_intent_id = 'pi_dropin_1' AND status = 'completed' AND currency = 'USD') = 1, 'PAY-01', 'one completed USD transaction');
  PERFORM pg_temp.ok((SELECT count(*) FROM bookings b JOIN transactions t ON t.id = b.transaction_id
                      WHERE t.stripe_payment_intent_id = 'pi_dropin_1' AND b.status = 'confirmed') = 1, 'PAY-01', 'one confirmed booking linked to it');

  -- ...and a Stripe retry of the same event changes nothing.
  r := fulfill_stripe_checkout('evt_1', 'checkout.session.completed', s);
  PERFORM pg_temp.ok(r ->> 'status' = 'duplicate', 'PAY-01', 'retry is reported as duplicate');
  SELECT count(*) INTO n FROM transactions WHERE stripe_payment_intent_id = 'pi_dropin_1';
  PERFORM pg_temp.ok(n = 1, 'PAY-01', 'retry did not duplicate the transaction, got ' || n);

  -- PAY-02: a pack purchase delivered twice (different event ids, same payment) credits once.
  s := pg_temp.session('class_pack', jsonb_build_object('class_pack_type_id', 'aaaaaaaa-4000-0000-0000-000000000001'), 10000, 'pi_pack_1');
  PERFORM fulfill_stripe_checkout('evt_2', 'checkout.session.completed', s);
  r := fulfill_stripe_checkout('evt_2', 'checkout.session.completed', s);
  PERFORM pg_temp.ok((SELECT count(*) FROM class_packs WHERE stripe_payment_intent_id = 'pi_pack_1') = 1, 'PAY-02', 'one pack for one payment');
  -- the same payment under a different event id (completed + async_payment_succeeded) is a no-op
  r := fulfill_stripe_checkout('evt_2b', 'checkout.session.async_payment_succeeded', s);
  PERFORM pg_temp.ok(r ->> 'status' = 'duplicate', 'PAY-02', 'same payment under a new event id is a no-op, not an error');
  PERFORM pg_temp.ok((SELECT count(*) FROM class_packs WHERE stripe_payment_intent_id = 'pi_pack_1') = 1, 'PAY-02', 'still exactly one pack');
  EXECUTE 'RESET ROLE';
END $$;

DO $$
DECLARE s jsonb; msg text; ev int;
BEGIN
  EXECUTE 'SET LOCAL ROLE service_role';
  -- PAY-03: a failure rolls back the event record too, so Stripe's retry can succeed.
  s := pg_temp.session('drop_in', jsonb_build_object('occurrence_id', 'bbbbbbbb-3000-0000-0000-000000000001'), 2000, 'pi_wrong_studio');
  BEGIN
    PERFORM fulfill_stripe_checkout('evt_3', 'checkout.session.completed', s);
  EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
  PERFORM pg_temp.ok(msg LIKE '%not found for studio%', 'PAY-03', 'class of another studio is rejected: ' || COALESCE(msg, 'no error'));
  SELECT count(*) INTO ev FROM stripe_events WHERE id = 'evt_3';
  PERFORM pg_temp.ok(ev = 0, 'PAY-03', 'failed event is not recorded as processed');
  PERFORM pg_temp.ok((SELECT count(*) FROM transactions WHERE stripe_payment_intent_id = 'pi_wrong_studio') = 0, 'PAY-03', 'nothing half-written');
  EXECUTE 'RESET ROLE';
END $$;

DO $$
DECLARE s jsonb; r jsonb;
BEGIN
  EXECUTE 'SET LOCAL ROLE service_role';
  -- PAY-04: payment for a class that filled up meanwhile is recorded, not lost, and flagged.
  -- (occ_a_open has 1 seat, taken by PAY-01's booking.)
  s := jsonb_set(pg_temp.session('drop_in', jsonb_build_object('occurrence_id', pg_temp.id('occ_a_open')::text), 2200, 'pi_late'),
                 '{metadata,profile_id}', to_jsonb(pg_temp.id('student_a2')::text));
  r := fulfill_stripe_checkout('evt_4', 'checkout.session.completed', s);
  PERFORM pg_temp.ok(r ->> 'status' = 'processed' AND r ->> 'note' LIKE 'class full%', 'PAY-04', 'full class is flagged for refund: ' || COALESCE(r ->> 'note', 'none'));
  PERFORM pg_temp.ok((SELECT count(*) FROM transactions WHERE stripe_payment_intent_id = 'pi_late') = 1, 'PAY-04', 'the payment is still recorded');
  PERFORM pg_temp.ok((SELECT count(*) FROM bookings WHERE class_occurrence_id = pg_temp.id('occ_a_open') AND status = 'confirmed') = 1, 'PAY-04', 'no overbooking');
  EXECUTE 'RESET ROLE';
END $$;

DO $$
DECLARE r jsonb; msg text; pack uuid;
BEGIN
  EXECUTE 'SET LOCAL ROLE service_role';
  -- PAY-05: refunds. Partial first, then full; a full drop-in refund cancels the booking.
  r := record_stripe_refund('evt_5a', 'pi_dropin_1', 'ch_1', 2200, 500);
  PERFORM pg_temp.ok((SELECT status::text FROM transactions WHERE stripe_payment_intent_id = 'pi_dropin_1') = 'partially_refunded', 'PAY-05', 'partial refund recorded');
  PERFORM pg_temp.ok((SELECT count(*) FROM bookings WHERE class_occurrence_id = pg_temp.id('occ_a_open') AND status = 'confirmed') = 1, 'PAY-05', 'partial refund keeps the booking');
  PERFORM record_stripe_refund('evt_5b', 'pi_dropin_1', 'ch_1', 2200, 2200);
  PERFORM pg_temp.ok((SELECT status::text FROM transactions WHERE stripe_payment_intent_id = 'pi_dropin_1') = 'refunded', 'PAY-05', 'full refund recorded');
  PERFORM pg_temp.ok((SELECT count(*) FROM bookings WHERE class_occurrence_id = pg_temp.id('occ_a_open') AND status = 'confirmed') = 0, 'PAY-05', 'full refund cancelled the booking and freed the seat');
  r := record_stripe_refund('evt_5b', 'pi_dropin_1', 'ch_1', 2200, 2200);
  PERFORM pg_temp.ok(r ->> 'status' = 'duplicate', 'PAY-05', 'refund retry is a no-op');

  -- a full pack refund voids the unused credits
  PERFORM record_stripe_refund('evt_5c', 'pi_pack_1', 'ch_2', 10000, 10000);
  SELECT id INTO pack FROM class_packs WHERE stripe_payment_intent_id = 'pi_pack_1';
  PERFORM pg_temp.ok((SELECT classes_remaining FROM class_packs WHERE id = pack) = 0, 'PAY-05', 'refunded pack has no credits left');

  -- a refund that arrives before its purchase is recorded must fail so Stripe retries it
  BEGIN PERFORM record_stripe_refund('evt_5d', 'pi_not_yet', 'ch_3', 100, 100);
  EXCEPTION WHEN OTHERS THEN msg := SQLERRM; END;
  PERFORM pg_temp.ok(msg LIKE '%retry later%', 'PAY-05', 'out-of-order refund is retried, not dropped');
  PERFORM pg_temp.ok((SELECT count(*) FROM stripe_events WHERE id = 'evt_5d') = 0, 'PAY-05', 'and not marked processed');
  EXECUTE 'RESET ROLE';
END $$;

DO $$
DECLARE mt uuid; mem uuid; r jsonb;
BEGIN
  -- PAY-06: renewal resets the usage counter and records a renewal transaction, once.
  INSERT INTO membership_types (studio_id, name, price_cents, classes_per_cycle)
    VALUES (pg_temp.id('studio_a'), 'Monthly 4', 8000, 4) RETURNING id INTO mt;
  INSERT INTO memberships (studio_id, profile_id, membership_type_id, status, current_period_start, current_period_end, classes_used_this_cycle, stripe_subscription_id)
    VALUES (pg_temp.id('studio_a'), pg_temp.id('student_a1'), mt, 'active', NOW() - interval '30 days', NOW(), 4, 'sub_1')
    RETURNING id INTO mem;
  EXECUTE 'SET LOCAL ROLE service_role';
  r := renew_membership_cycle('evt_6', 'sub_1', NOW(), NOW() + interval '30 days', 8000, 'usd', 'pi_renew_1');
  PERFORM renew_membership_cycle('evt_6', 'sub_1', NOW(), NOW() + interval '30 days', 8000, 'usd', 'pi_renew_1');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok((SELECT classes_used_this_cycle FROM memberships WHERE id = mem) = 0, 'PAY-06', 'usage reset for the new cycle (was locked forever before)');
  PERFORM pg_temp.ok((SELECT count(*) FROM transactions WHERE membership_id = mem AND type = 'membership_renewal') = 1, 'PAY-06', 'one renewal transaction despite a retry');
END $$;

DO $$
DECLARE n int;
BEGIN
  -- PAY-07: charges_enabled follows Stripe's account.updated.
  UPDATE studios SET stripe_account_id = 'acct_a', stripe_charges_enabled = FALSE, stripe_onboarding_complete = TRUE WHERE id = pg_temp.id('studio_a');
  EXECUTE 'SET LOCAL ROLE service_role';
  PERFORM set_studio_charges_enabled('acct_a', TRUE, TRUE);
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok((SELECT stripe_charges_enabled FROM studios WHERE id = pg_temp.id('studio_a')), 'PAY-07', 'charges enabled recorded');
  EXECUTE 'SET LOCAL ROLE service_role';
  PERFORM set_studio_charges_enabled('acct_a', FALSE, TRUE);
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(NOT (SELECT stripe_charges_enabled FROM studios WHERE id = pg_temp.id('studio_a')), 'PAY-07', 'charges disabled recorded (details submitted alone is not enough)');
END $$;

DO $$
DECLARE msg text; r record; bad text := '';
BEGIN
  -- PAY-08: clients can never run fulfilment or read the event ledger.
  FOR r IN SELECT p.oid, p.proname FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace
           AND p.proname IN ('fulfill_stripe_checkout','record_stripe_refund','renew_membership_cycle','set_studio_charges_enabled') LOOP
    IF has_function_privilege('anon', r.oid, 'execute') OR has_function_privilege('authenticated', r.oid, 'execute') THEN
      bad := bad || ' ' || r.proname;
    END IF;
  END LOOP;
  PERFORM pg_temp.ok(bad = '', 'PAY-08', 'payment functions are service-role only' || bad);
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  PERFORM pg_temp.ok((SELECT count(*) FROM stripe_events) = 0, 'PAY-08', 'even studio owners cannot read the Stripe event ledger');
  EXECUTE 'RESET ROLE';
END $$;
