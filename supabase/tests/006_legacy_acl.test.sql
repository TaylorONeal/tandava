\i helpers.sql
-- Upgrade from the actual broad 00045 contract, including old column ACLs.
-- Unknown objects stay out of the reviewed manifest. Entire probe rolls back.
BEGIN;
CREATE TABLE public.unrelated_acl_probe(id integer);
\ir ../migrations/00045_data_api_grants.sql
GRANT SELECT (stripe_account_id) ON public.studios TO authenticated;
GRANT SELECT (email, message) ON public.class_cancel_notices TO PUBLIC;
\ir ../migrations/00046_runtime_api_privileges.sql
\ir ../migrations/00046_runtime_api_privileges.sql
DO $$ BEGIN
  PERFORM pg_temp.ok(NOT has_table_privilege('authenticated','public.transactions','SELECT'),
    'ACL-UPGRADE', 'forward correction removes unjustified legacy table privileges');
  PERFORM pg_temp.ok(NOT has_column_privilege('authenticated','public.studios','stripe_account_id','SELECT'),
    'ACL-UPGRADE', 'legacy column privileges do not retain Stripe access');
  PERFORM pg_temp.ok(NOT has_column_privilege('authenticated','public.class_cancel_notices','email','SELECT'),
    'ACL-UPGRADE', 'PUBLIC column grants cannot bypass the cancellation projection');
  PERFORM pg_temp.ok(has_table_privilege('anon','public.unrelated_acl_probe','SELECT'),
    'ACL-UPGRADE', 'unknown objects are untouched, not silently tightened');
  PERFORM pg_temp.ok((SELECT relrowsecurity FROM pg_class WHERE oid='public.transactions'::regclass),
    'ACL-UPGRADE', 'RLS remains enabled');
END $$;
CREATE TABLE public.new_acl_probe(id integer);
CREATE SEQUENCE public.new_acl_sequence;
DO $$
DECLARE who text;
BEGIN
  FOREACH who IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
    PERFORM pg_temp.ok(NOT has_table_privilege(who,'public.new_acl_probe','SELECT,INSERT,UPDATE,DELETE,TRUNCATE'),
      'ACL-UPGRADE', who || ' has no automatic table grants after repeated correction');
    PERFORM pg_temp.ok(NOT has_sequence_privilege(who,'public.new_acl_sequence','USAGE,SELECT,UPDATE'),
      'ACL-UPGRADE', who || ' has no automatic sequence grants after correction');
  END LOOP;
END $$;
ROLLBACK;
