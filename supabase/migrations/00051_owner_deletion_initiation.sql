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
