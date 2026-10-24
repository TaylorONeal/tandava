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
