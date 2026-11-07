-- Applies migrations 00047 to 00051 (account deletion requests, review,
-- execution, owner initiation, in-person purchase scope) to tandava-prod in
-- one transaction. Production is at 00044 plus 00052; 00045 is superseded and
-- 00046 (runtime grants) stays held for review. Taylor approved 00047 to 00051
-- on Nov 7 2026. Paste into the Supabase SQL editor and run once. Any error
-- rolls everything back and leaves production unchanged.
BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.check_in_with_pass(text)') IS NULL THEN
    RAISE EXCEPTION 'migration 00052 is not applied; stop';
  END IF;
  IF to_regclass('public.account_deletion_requests') IS NOT NULL THEN
    RAISE EXCEPTION 'migration 00047 is already applied; stop';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
             AND table_name = 'offerings' AND column_name = 'purchase_scope') THEN
    RAISE EXCEPTION 'migration 00050 is already applied; stop';
  END IF;
END $$;

-- ===== 00047_account_deletion_requests.sql =====
-- Initiation only: never cascade-delete a profile (financial FKs cascade).
-- Fulfillment requires an assigned operator and an audited retention workflow.
CREATE TABLE account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES profiles(id),
  requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
  completed_at timestamptz,
  CHECK ((status = 'completed') = (completed_at IS NOT NULL))
);
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON account_deletion_requests FROM PUBLIC, anon, authenticated;
-- Anonymous SELECT returns no rows under RLS, matching the schema-wide read contract.
GRANT SELECT ON account_deletion_requests TO authenticated, anon;
CREATE POLICY deletion_read_own ON account_deletion_requests FOR SELECT TO authenticated
  USING (profile_id = (SELECT auth.uid()));

CREATE FUNCTION request_account_deletion(p_confirmation text)
RETURNS account_deletion_requests LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  uid uuid := auth.uid();
  claims jsonb := COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
  recent boolean := false;
  result account_deletion_requests;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in to request deletion'; END IF;
  IF p_confirmation IS DISTINCT FROM 'DELETE' THEN RAISE EXCEPTION 'Type DELETE to confirm'; END IF;
  -- JWT refresh iat is NOT evidence of a new sign-in. Only verified AMR events.
  IF jsonb_typeof(claims->'amr') = 'array' THEN
    SELECT EXISTS (
      SELECT 1 FROM jsonb_array_elements(claims->'amr') a
      WHERE a->>'method' IN ('password', 'oauth', 'otp', 'totp')
        AND CASE WHEN (a->>'timestamp') ~ '^[0-9]{1,12}$' THEN
          (a->>'timestamp')::bigint BETWEEN extract(epoch FROM clock_timestamp())::bigint - 600
                                      AND extract(epoch FROM clock_timestamp())::bigint
          ELSE false END
    ) INTO recent;
  END IF;
  IF NOT recent THEN RAISE EXCEPTION 'Sign in again, then request deletion within 10 minutes'; END IF;
  PERFORM 1 FROM profiles WHERE id = uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
  IF EXISTS (
    SELECT 1 FROM studio_staff mine WHERE mine.profile_id = uid AND mine.is_active AND mine.role = 'owner'
      AND NOT EXISTS (SELECT 1 FROM studio_staff other WHERE other.studio_id = mine.studio_id
        AND other.profile_id <> uid AND other.is_active AND other.role = 'owner')
  ) THEN RAISE EXCEPTION 'Transfer studio ownership to another active owner before requesting deletion'; END IF;
  INSERT INTO account_deletion_requests(profile_id) VALUES (uid)
    ON CONFLICT (profile_id) DO NOTHING;
  SELECT * INTO result FROM account_deletion_requests WHERE profile_id = uid;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION request_account_deletion(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION request_account_deletion(text) TO authenticated;

-- ===== 00048_deletion_review.sql =====
-- Non-destructive operator preparation; no erasure/completion shortcut.
CREATE TABLE account_deletion_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES account_deletion_requests(id),
  policy_reference text NOT NULL CHECK (length(trim(policy_reference)) BETWEEN 1 AND 500),
  operator_reference text NOT NULL CHECK (length(trim(operator_reference)) BETWEEN 1 AND 500),
  reviewed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  inventory jsonb NOT NULL
);
ALTER TABLE account_deletion_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON account_deletion_reviews FROM PUBLIC, anon, authenticated, service_role;
-- Explicit deny policy: callers see zero rows, matching the schema-wide contract.
GRANT SELECT ON account_deletion_reviews TO anon, authenticated;
CREATE POLICY deletion_reviews_deny_read ON account_deletion_reviews FOR SELECT TO anon, authenticated USING (false);

CREATE FUNCTION preview_account_deletion(p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE req account_deletion_requests; fk record; row_count bigint;
  refs jsonb := '[]'; sole_owner boolean; unsupported bigint;
BEGIN
  SELECT * INTO req FROM account_deletion_requests WHERE id = p_request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Deletion request not found'; END IF;
  SELECT EXISTS (SELECT 1 FROM studio_staff mine WHERE mine.profile_id = req.profile_id AND mine.is_active AND mine.role = 'owner'
    AND NOT EXISTS (SELECT 1 FROM studio_staff other WHERE other.studio_id = mine.studio_id
      AND other.profile_id <> req.profile_id AND other.is_active AND other.role = 'owner')) INTO sole_owner;
  SELECT count(*) INTO unsupported FROM pg_constraint k
    WHERE k.contype = 'f' AND k.confrelid = 'public.profiles'::regclass
      AND (cardinality(k.conkey) <> 1 OR k.confkey[1] <> (
        SELECT attnum FROM pg_attribute WHERE attrelid = 'public.profiles'::regclass AND attname = 'id'));
  FOR fk IN
    SELECT n.nspname AS schema_name, c.relname AS table_name, a.attname AS column_name, k.conname
    FROM pg_constraint k JOIN pg_class c ON c.oid = k.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.conkey[1]
    WHERE k.contype = 'f' AND k.confrelid = 'public.profiles'::regclass
      AND cardinality(k.conkey) = 1 AND k.confkey[1] = (
        SELECT attnum FROM pg_attribute WHERE attrelid = 'public.profiles'::regclass AND attname = 'id')
    ORDER BY n.nspname, c.relname, a.attname, k.conname
  LOOP
    EXECUTE format('SELECT count(*) FROM %I.%I WHERE %I = $1', fk.schema_name, fk.table_name, fk.column_name)
      INTO row_count USING req.profile_id;
    refs := refs || jsonb_build_array(jsonb_build_object('schema', fk.schema_name, 'table', fk.table_name,
      'column', fk.column_name, 'constraint', fk.conname, 'rows', row_count));
  END LOOP;
  RETURN jsonb_build_object('request_id', req.id, 'profile_id', req.profile_id, 'status', req.status,
    'sole_owner', sole_owner, 'references', refs, 'unsupported_foreign_keys', unsupported, 'can_complete', false,
    'unverified_sinks', jsonb_build_array('auth identity and sessions', 'storage objects',
      'non-FK identifiers and JSON/free-text copies', 'Stripe and other processors', 'backups and retention expiry'),
    'limitation', 'Counts are discovery only, not proof of erasure or approved retention.');
END $$;

CREATE FUNCTION record_account_deletion_review(p_request_id uuid, p_expected_inventory jsonb,
  p_policy_reference text, p_operator_reference text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE inventory jsonb; review_id uuid;
BEGIN
  PERFORM 1 FROM account_deletion_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Deletion request not found'; END IF;
  inventory := preview_account_deletion(p_request_id);
  IF inventory IS DISTINCT FROM p_expected_inventory THEN RAISE EXCEPTION 'Inventory changed; review again'; END IF;
  IF (inventory->>'sole_owner')::boolean THEN RAISE EXCEPTION 'Transfer studio ownership before fulfillment'; END IF;
  IF (inventory->>'unsupported_foreign_keys')::bigint > 0 THEN RAISE EXCEPTION 'Unsupported references require review'; END IF;
  IF inventory->>'status' = 'completed' THEN RAISE EXCEPTION 'Request already completed'; END IF;
  INSERT INTO account_deletion_reviews(request_id, policy_reference, operator_reference, inventory)
    VALUES (p_request_id, p_policy_reference, p_operator_reference, inventory) RETURNING id INTO review_id;
  RETURN review_id;
END $$;
REVOKE ALL ON FUNCTION preview_account_deletion(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION record_account_deletion_review(uuid, jsonb, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION preview_account_deletion(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION record_account_deletion_review(uuid, jsonb, text, text) TO service_role;

-- ===== 00049_deletion_execution.sql =====
-- Production building blocks; no worker/enabling flag and no completion shortcut.
CREATE TABLE account_deletion_executions (
  request_id uuid PRIMARY KEY REFERENCES account_deletion_requests(id),
  review_id uuid NOT NULL REFERENCES account_deletion_reviews(id),
  manifest jsonb NOT NULL,
  state text NOT NULL DEFAULT 'access_blocked' CHECK (state IN ('access_blocked','profile_scrubbed')),
  lease_token uuid NOT NULL DEFAULT gen_random_uuid(),
  lease_until timestamptz NOT NULL DEFAULT clock_timestamp() + interval '15 minutes',
  started_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  profile_scrubbed_at timestamptz
);
ALTER TABLE account_deletion_executions ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON account_deletion_requests FROM service_role;
REVOKE ALL ON account_deletion_executions FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON account_deletion_executions TO anon, authenticated;
CREATE POLICY deletion_executions_deny_read ON account_deletion_executions FOR SELECT TO anon, authenticated USING (false);

-- Every authenticated write, including SECURITY DEFINER RPC writes, checks the
-- JWT subject. Shared writer locks allow ordinary concurrent writes; exclusive
-- cutoff/scrub locks drain in-flight subject writes before
-- the execution row activates the barrier. A writer never waits while holding a
-- row lock for an exclusive cutoff, avoiding lock-order deadlocks.
-- This is NOT a service/processor barrier.
CREATE FUNCTION assert_account_deletion_write_allowed() RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NOT NULL THEN
    IF NOT pg_try_advisory_xact_lock_shared(hashtextextended(uid::text, 471))
      THEN RAISE EXCEPTION 'Account operation in progress; retry'; END IF;
    IF EXISTS (SELECT 1 FROM account_deletion_executions e JOIN account_deletion_requests r ON r.id=e.request_id WHERE r.profile_id=uid)
      THEN RAISE EXCEPTION 'Account deletion is processing; writes are disabled'; END IF;
  END IF;
END $$;
REVOKE ALL ON FUNCTION assert_account_deletion_write_allowed() FROM PUBLIC, anon, authenticated, service_role;
CREATE FUNCTION guard_deleting_actor() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM assert_account_deletion_write_allowed();
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION guard_deleting_actor() FROM PUBLIC, anon, authenticated, service_role;
DO $$ DECLARE t record; BEGIN
  FOR t IN SELECT c.oid::regclass AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r'
  LOOP
    EXECUTE format('CREATE TRIGGER deletion_actor_write_guard BEFORE INSERT OR UPDATE OR DELETE ON %s FOR EACH ROW EXECUTE FUNCTION guard_deleting_actor()',t.name);
  END LOOP;
END $$;

CREATE FUNCTION begin_account_deletion_execution(p_request_id uuid, p_review_id uuid, p_manifest jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE req account_deletion_requests; review account_deletion_reviews; prior account_deletion_executions; snapshot jsonb;
BEGIN
  SELECT * INTO req FROM account_deletion_requests WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Deletion request not found'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(req.profile_id::text,471));
  LOCK TABLE studio_staff IN SHARE ROW EXCLUSIVE MODE;
  SELECT * INTO review FROM account_deletion_reviews WHERE id=p_review_id AND request_id=p_request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Matching review required'; END IF;
  IF p_manifest IS NULL OR jsonb_typeof(p_manifest) <> 'object'
    OR p_manifest->>'version' IS DISTINCT FROM '1'
    OR p_manifest->>'policy_reference' IS DISTINCT FROM review.policy_reference
    OR p_manifest->>'operator_reference' IS DISTINCT FROM review.operator_reference
    OR p_manifest->>'profile_action' IS DISTINCT FROM 'erase'
    OR p_manifest->>'financial_action' IS DISTINCT FROM 'retain'
    OR length(trim(COALESCE(p_manifest->>'financial_reason',''))) = 0
    OR length(trim(COALESCE(p_manifest->>'financial_processor',''))) = 0
    OR COALESCE(p_manifest->>'financial_expires_at','') !~ '^\d{4}-\d{2}-\d{2}T'
    THEN RAISE EXCEPTION 'Explicit reviewed profile/financial manifest required'; END IF;
  IF (p_manifest->>'financial_expires_at')::timestamptz <= clock_timestamp()
    THEN RAISE EXCEPTION 'Retention expiry requires review'; END IF;
  IF req.status='completed' THEN RAISE EXCEPTION 'Request already completed'; END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND NOT EXISTS (SELECT 1 FROM pg_trigger t
      WHERE t.tgrelid=c.oid AND t.tgname='deletion_actor_write_guard' AND t.tgenabled='O'))
    THEN RAISE EXCEPTION 'Unprotected table requires review'; END IF;
  snapshot := preview_account_deletion(p_request_id);
  IF (snapshot->>'sole_owner')::boolean THEN RAISE EXCEPTION 'Transfer ownership before fulfillment'; END IF;
  SELECT * INTO prior FROM account_deletion_executions WHERE request_id=p_request_id;
  IF FOUND THEN
    IF prior.review_id <> p_review_id OR prior.manifest IS DISTINCT FROM p_manifest
      THEN RAISE EXCEPTION 'Execution manifest is immutable'; END IF;
    IF prior.lease_until > clock_timestamp() THEN RAISE EXCEPTION 'Execution lease is active'; END IF;
    UPDATE account_deletion_executions SET lease_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '15 minutes'
      WHERE request_id=p_request_id RETURNING * INTO prior;
  ELSE
    IF snapshot IS DISTINCT FROM review.inventory THEN RAISE EXCEPTION 'Inventory changed; review again'; END IF;
    INSERT INTO account_deletion_executions(request_id,review_id,manifest) VALUES(p_request_id,p_review_id,p_manifest) RETURNING * INTO prior;
    UPDATE account_deletion_requests SET status='processing' WHERE id=p_request_id;
  END IF;
  RETURN jsonb_build_object('request_id',prior.request_id,'lease_token',prior.lease_token,'lease_until',prior.lease_until,'state',prior.state);
END $$;

CREATE FUNCTION scrub_account_deletion_profile(p_request_id uuid,p_lease_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE execution account_deletion_executions; req account_deletion_requests;
  before_financial jsonb; after_financial jsonb; columns text[]; blocked_until timestamptz; sessions_exist boolean;
BEGIN
  SELECT * INTO req FROM account_deletion_requests WHERE id=p_request_id FOR UPDATE;
  SELECT * INTO execution FROM account_deletion_executions WHERE request_id=p_request_id FOR UPDATE;
  IF NOT FOUND OR execution.lease_token IS DISTINCT FROM p_lease_token OR execution.lease_until <= clock_timestamp()
    THEN RAISE EXCEPTION 'Current execution lease required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(req.profile_id::text,471));
  LOCK TABLE studio_staff IN SHARE ROW EXCLUSIVE MODE;
  IF (preview_account_deletion(p_request_id)->>'sole_owner')::boolean
    THEN RAISE EXCEPTION 'Transfer ownership before fulfillment'; END IF;
  SELECT (to_jsonb(u)->>'banned_until')::timestamptz INTO blocked_until FROM auth.users u WHERE id=req.profile_id;
  IF blocked_until IS NULL OR blocked_until <= clock_timestamp()+interval '15 minutes'
    THEN RAISE EXCEPTION 'Auth administration ban must be verified first'; END IF;
  IF to_regclass('auth.sessions') IS NULL THEN RAISE EXCEPTION 'Auth session inventory unavailable'; END IF;
  EXECUTE 'SELECT EXISTS(SELECT 1 FROM auth.sessions WHERE user_id=$1)' INTO sessions_exist USING req.profile_id;
  IF sessions_exist THEN RAISE EXCEPTION 'Revoke Auth sessions before scrubbing'; END IF;
  SELECT array_agg(column_name::text ORDER BY column_name) INTO columns FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles';
  IF columns IS DISTINCT FROM ARRAY(SELECT unnest(ARRAY['id','first_name','last_name','display_name','email','phone','avatar_url','date_of_birth','pronouns',
    'emergency_contact_name','emergency_contact_phone','bio','specialties','certifications','instagram_handle','website','created_at','updated_at','is_guest','claimed_at']) ORDER BY 1)
    THEN RAISE EXCEPTION 'Profile schema changed; erasure adapter review required'; END IF;
  -- Freeze the protected financial relation set during this narrow operation.
  LOCK TABLE transactions, memberships, class_packs, credits, bookings IN SHARE MODE;
  -- Table/advisory lock waits can outlive the lease checked at entry.
  IF execution.lease_until <= clock_timestamp()
    THEN RAISE EXCEPTION 'Execution lease expired before profile mutation'; END IF;
  SELECT jsonb_build_object('transactions',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM transactions x WHERE profile_id=req.profile_id),
    'memberships',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM memberships x WHERE profile_id=req.profile_id),
    'class_packs',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM class_packs x WHERE profile_id=req.profile_id),
    'credits',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM credits x WHERE profile_id=req.profile_id),
    'bookings',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM bookings x WHERE profile_id=req.profile_id)) INTO before_financial;
  UPDATE profiles SET first_name=NULL,last_name=NULL,display_name='Deleted account',email='deleted+'||id::text||'@invalid.example',
    phone=NULL,avatar_url=NULL,date_of_birth=NULL,pronouns=NULL,emergency_contact_name=NULL,emergency_contact_phone=NULL,bio=NULL,
    specialties='{}',certifications='{}',instagram_handle=NULL,website=NULL,is_guest=false,claimed_at=NULL WHERE id=req.profile_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile missing; do not infer successful erasure'; END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id=req.profile_id
    AND first_name IS NULL AND last_name IS NULL AND display_name='Deleted account'
    AND email='deleted+'||id::text||'@invalid.example' AND phone IS NULL AND avatar_url IS NULL
    AND date_of_birth IS NULL AND pronouns IS NULL AND emergency_contact_name IS NULL
    AND emergency_contact_phone IS NULL AND bio IS NULL AND cardinality(specialties)=0
    AND cardinality(certifications)=0 AND instagram_handle IS NULL AND website IS NULL
    AND is_guest=false AND claimed_at IS NULL)
    THEN RAISE EXCEPTION 'Profile scrub read-back failed'; END IF;

  SELECT jsonb_build_object('transactions',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM transactions x WHERE profile_id=req.profile_id),
    'memberships',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM memberships x WHERE profile_id=req.profile_id),
    'class_packs',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM class_packs x WHERE profile_id=req.profile_id),
    'credits',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM credits x WHERE profile_id=req.profile_id),
    'bookings',(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM bookings x WHERE profile_id=req.profile_id)) INTO after_financial;
  IF before_financial IS DISTINCT FROM after_financial THEN RAISE EXCEPTION 'Financial invariance failed'; END IF;
  -- If the write itself outlives the lease, abort the entire transaction rather
  -- than acknowledging work performed by an expired worker.
  IF execution.lease_until <= clock_timestamp()
    THEN RAISE EXCEPTION 'Execution lease expired during profile mutation'; END IF;
  UPDATE account_deletion_executions SET state='profile_scrubbed',profile_scrubbed_at=COALESCE(profile_scrubbed_at,clock_timestamp()) WHERE request_id=p_request_id;
  RETURN jsonb_build_object('request_id',p_request_id,'profile_scrubbed',true,'account_completed',false,
    'remaining',jsonb_build_array('other database tables and indirect identifiers','Auth identity PII','storage','processors','backups and retention'));
END $$;
REVOKE ALL ON FUNCTION begin_account_deletion_execution(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION scrub_account_deletion_profile(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION begin_account_deletion_execution(uuid,uuid,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION scrub_account_deletion_profile(uuid,uuid) TO service_role;

-- Keep the existing entitlement behavior; reject a deleting actor before its fallback.
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
  -- Fail before the entitlement fallback can return needs_payment.
  PERFORM assert_account_deletion_write_allowed();

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

-- ===== 00050_in_person_purchase_scope.sql =====
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

-- ===== 00051_owner_deletion_initiation.sql =====
-- Preserve sole-owner requests and their original deadline while ownership
-- transfer or studio closure is resolved. Never delete the business here.
CREATE OR REPLACE FUNCTION request_account_deletion(p_confirmation text)
RETURNS account_deletion_requests LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  uid uuid := auth.uid();
  claims jsonb := COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
  recent boolean := false;
  result account_deletion_requests;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in to request deletion'; END IF;
  IF p_confirmation IS DISTINCT FROM 'DELETE' THEN RAISE EXCEPTION 'Type DELETE to confirm'; END IF;
  -- JWT refresh iat is NOT evidence of a new sign-in. Only verified AMR events.
  IF jsonb_typeof(claims->'amr') = 'array' THEN
    SELECT EXISTS (
      SELECT 1 FROM jsonb_array_elements(claims->'amr') a
      WHERE a->>'method' IN ('password', 'oauth', 'otp', 'totp')
        AND CASE WHEN (a->>'timestamp') ~ '^[0-9]{1,12}$' THEN
          (a->>'timestamp')::bigint BETWEEN extract(epoch FROM clock_timestamp())::bigint - 600
                                      AND extract(epoch FROM clock_timestamp())::bigint
          ELSE false END
    ) INTO recent;
  END IF;
  IF NOT recent THEN RAISE EXCEPTION 'Sign in again, then request deletion within 10 minutes'; END IF;
  PERFORM 1 FROM profiles WHERE id = uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
  -- Ownership affects fulfillment, not the right to lodge a request. The
  -- operator inventory/review/execution guards still refuse unsafe removal.
  INSERT INTO account_deletion_requests(profile_id) VALUES (uid)
    ON CONFLICT (profile_id) DO NOTHING;
  SELECT * INTO result FROM account_deletion_requests WHERE profile_id = uid;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION request_account_deletion(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION request_account_deletion(text) TO authenticated;

COMMIT;
