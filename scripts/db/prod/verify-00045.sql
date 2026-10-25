-- Read-only legacy ACL inventory, not a readiness check or rollout approval.
-- Broad SELECT on all tables is no longer the intended contract. Review
-- 00046_runtime_api_privileges.sql and docs/security/data-api-permissions.md.
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon','authenticated','service_role','PUBLIC')
ORDER BY table_name, grantee, privilege_type;
SELECT defaclrole::regrole AS creator, defaclobjtype AS object_type,
       defaclnamespace::regnamespace AS schema_name, defaclacl::text AS acl
FROM pg_default_acl;
