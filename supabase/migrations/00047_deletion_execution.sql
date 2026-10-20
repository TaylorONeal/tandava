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
