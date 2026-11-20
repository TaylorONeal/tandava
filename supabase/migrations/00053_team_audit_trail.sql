-- Team changes (add, role change, removal) are recorded by the `onboarding` edge function.
-- 1. Let the server write and read the audit trail, and hand a removed teacher's classes back.
-- 2. Make audit_logs append-only at the database, for every role including the server:
--    a record cannot be edited or deleted once written.
--
-- Idempotent. No data is changed.

GRANT SELECT, INSERT ON public.audit_logs TO service_role;
GRANT UPDATE (teacher_id) ON public.class_occurrences TO service_role;
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION audit_logs_append_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'audit_logs is append-only' USING ERRCODE = 'insufficient_privilege';
  END IF;
  -- The only permitted update is a foreign key being cleared when the studio or the
  -- person it points at is deleted (ON DELETE SET NULL). The emails and descriptions
  -- written at the time stay, so the record still says who did what.
  IF (to_jsonb(NEW) - 'studio_id' - 'actor_id' - 'impersonator_id')
       IS DISTINCT FROM (to_jsonb(OLD) - 'studio_id' - 'actor_id' - 'impersonator_id')
     OR (NEW.studio_id IS NOT NULL AND NEW.studio_id IS DISTINCT FROM OLD.studio_id)
     OR (NEW.actor_id IS NOT NULL AND NEW.actor_id IS DISTINCT FROM OLD.actor_id)
     OR (NEW.impersonator_id IS NOT NULL AND NEW.impersonator_id IS DISTINCT FROM OLD.impersonator_id) THEN
    RAISE EXCEPTION 'audit_logs is append-only' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION audit_logs_append_only() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS audit_logs_append_only ON public.audit_logs;
CREATE TRIGGER audit_logs_append_only
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_append_only();
