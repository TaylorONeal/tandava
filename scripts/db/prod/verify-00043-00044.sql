-- Read-only catalog inspection. Does not invoke application RPCs or expose user data/secrets.
-- Run against the intended Tandava database before planning any migration/deployment.
SELECT current_database() AS database_name;

SELECT relation_name, to_regclass(relation_name) IS NOT NULL AS present
FROM (VALUES ('public.refund_requests'), ('public.class_cancel_notices')) AS expected(relation_name);

WITH expected(signature) AS (VALUES
  ('public.preview_class_cancellation(uuid)'),
  ('public.cancel_class(uuid,text,text)'),
  ('public.class_cancel_followup(uuid)'),
  ('public.class_cancel_mark_handled(uuid)'),
  ('public.class_cancel_reconcile_notices(uuid)'),
  ('public.get_my_teaching_classes()'),
  ('public.get_teaching_roster(uuid)'),
  ('public.check_in_teaching_booking(uuid)')
)
SELECT e.signature, p.oid IS NOT NULL AS present,
       p.prosecdef AS security_definer, p.proconfig AS function_settings,
       CASE WHEN p.oid IS NOT NULL THEN has_function_privilege('anon', p.oid, 'EXECUTE') END AS anon_can_execute,
       CASE WHEN p.oid IS NOT NULL THEN has_function_privilege('authenticated', p.oid, 'EXECUTE') END AS authenticated_can_execute,
       CASE WHEN p.oid IS NOT NULL THEN md5(pg_get_functiondef(p.oid)) END AS definition_fingerprint
FROM expected e LEFT JOIN pg_proc p ON p.oid = to_regprocedure(e.signature);
