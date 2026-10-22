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
