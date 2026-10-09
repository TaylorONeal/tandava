-- Apply 00037 (schedule rules start on the studio's local date) to tandava-prod.
-- Paste all of it into https://supabase.com/dashboard/project/mkaixgjwakfufmmwembn/sql/new and Run.
BEGIN;
-- 00037: a new schedule rule starts on the studio's local date.
--
-- schedule_rules.effective_from defaults to CURRENT_DATE, which is the
-- database (UTC) date. In the evening in the Americas UTC is already
-- tomorrow, so a rule saved at 17:30 Pacific for an 18:00 class tonight got
-- tomorrow as its start and tonight's class was never generated (00036 starts
-- from GREATEST(effective_from, studio today)). On insert, a start date equal
-- to the UTC date is read as "today" and moved to the studio's local date.

CREATE OR REPLACE FUNCTION schedule_rule_local_effective_from()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_tz TEXT;
BEGIN
  IF NEW.effective_from IS NULL OR NEW.effective_from = CURRENT_DATE THEN
    SELECT COALESCE(NULLIF(timezone, ''), 'UTC') INTO v_tz FROM studios WHERE id = NEW.studio_id;
    NEW.effective_from := (NOW() AT TIME ZONE COALESCE(v_tz, 'UTC'))::date;
  END IF;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION schedule_rule_local_effective_from() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS schedule_rules_local_effective_from ON schedule_rules;
CREATE TRIGGER schedule_rules_local_effective_from
  BEFORE INSERT ON schedule_rules
  FOR EACH ROW EXECUTE FUNCTION schedule_rule_local_effective_from();
COMMIT;
