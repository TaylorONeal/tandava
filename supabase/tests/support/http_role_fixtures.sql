-- TEST ONLY: loaded exclusively into the disposable HTTP-test database.
-- Never apply to a hosted project. The local runner exposes no TCP listener.
-- No credentials or JWTs: each private socket has a fixed database role and
-- this hook accepts only the known synthetic fixture IDs for that role.
CREATE SCHEMA http_test;
GRANT USAGE ON SCHEMA http_test TO anon, authenticated, service_role;
CREATE FUNCTION http_test.set_claims() RETURNS void LANGUAGE plpgsql AS $$
DECLARE actor text := current_setting('request.headers', true)::jsonb->>'x-synthetic-profile';
BEGIN
 IF current_user = 'authenticated' THEN
   IF actor IS NULL OR actor NOT IN ('a0000000-0000-0000-0000-00000000000a','b0000000-0000-0000-0000-00000000000b','a1000000-0000-0000-0000-0000000000a1','b1000000-0000-0000-0000-0000000000b1') THEN
     RAISE EXCEPTION 'Synthetic profile required' USING ERRCODE='42501';
   END IF;
 ELSE actor := ''; END IF;
 PERFORM set_config('request.jwt.claim.sub', actor, true);
 PERFORM set_config('request.jwt.claim.role', current_user, true);
END $$;
CREATE FUNCTION public.http_test_identity() RETURNS jsonb LANGUAGE sql AS $$
 SELECT jsonb_build_object('role', current_user, 'profile', auth.uid());
$$;
UPDATE studios SET stripe_account_id='acct_SYNTHETIC_HTTP_ONLY' WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
INSERT INTO studio_staff(studio_id,profile_id,role)
VALUES('aaaaaaaa-0000-0000-0000-000000000001','b0000000-0000-0000-0000-00000000000b','teacher');
INSERT INTO class_cancel_notices(studio_id,occurrence_id,person,email,message)
VALUES('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-3000-0000-0000-000000000001',
'{"first_name":"Synthetic HTTP attendee"}','synthetic-http@example.test','Synthetic HTTP message');
