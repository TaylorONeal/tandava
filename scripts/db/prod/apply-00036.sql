-- Apply 00036 (schedule rules become bookable classes) to tandava-prod.
-- Paste all of it into https://supabase.com/dashboard/project/mkaixgjwakfufmmwembn/sql/new and Run.
-- One transaction: any error rolls back everything.
BEGIN;
-- 00036: Schedule rules become bookable classes.
--
-- Problem (found 2026-10-09 seeding the first live test studio): onboarding
-- saves a weekly class as a schedule_rules row, but nothing ever turned rules
-- into class_occurrences. A new studio had a schedule with nothing to book, so
-- its storefront, Discover and checkout were empty.
--
-- Fix:
--   generate_rule_occurrences(rule, weeks)  internal: fills the next `weeks`
--       weeks for one rule, idempotent (unique rule + start time).
--   schedule_rules trigger                   a saved or changed rule fills its
--       horizon at once; a rule that is deactivated, retimed or ended cancels
--       its future classes that nobody has booked or is holding.
--   generate_class_occurrences(studio, weeks) owners/admins top up their own
--       studio; with no studio and no signed-in user (cron) it tops up all.
--   pg_cron job (when the extension is available) runs it daily so the
--       horizon keeps rolling forward.
--
-- Times: start_time/end_time are wall-clock in the studio's timezone, so a
-- 10:00 class stays 10:00 across daylight saving changes.
-- Recurrence: daily, weekly, biweekly (every other week from effective_from).
-- 'monthly' is not generated yet (no rule in the product creates it).
-- Numbered 00036: 00035 is taken by PR #72 (attribution).

CREATE UNIQUE INDEX IF NOT EXISTS uq_class_occurrences_rule_start
  ON class_occurrences (schedule_rule_id, starts_at)
  WHERE schedule_rule_id IS NOT NULL;

CREATE OR REPLACE FUNCTION generate_rule_occurrences(p_rule_id UUID, p_weeks INTEGER DEFAULT 8)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r          RECORD;
  v_tz       TEXT;
  v_today    DATE;
  v_from     DATE;
  v_to       DATE;
  v_day      DATE;
  v_dow      INTEGER;
  v_starts   TIMESTAMPTZ;
  v_ends     TIMESTAMPTZ;
  v_capacity INTEGER;
  v_count    INTEGER := 0;
  v_rows     INTEGER;
BEGIN
  SELECT sr.*, o.capacity AS offering_capacity, o.duration_minutes, o.is_active AS offering_active,
         s.timezone AS studio_tz
    INTO r
    FROM schedule_rules sr
    JOIN offerings o ON o.id = sr.offering_id
    JOIN studios s ON s.id = sr.studio_id
   WHERE sr.id = p_rule_id;

  IF NOT FOUND OR NOT COALESCE(r.is_active, true) OR NOT COALESCE(r.offering_active, true)
     OR r.recurrence NOT IN ('daily', 'weekly', 'biweekly') THEN
    RETURN 0;
  END IF;

  v_tz := COALESCE(NULLIF(r.studio_tz, ''), 'UTC');
  v_today := (NOW() AT TIME ZONE v_tz)::date;
  v_from := GREATEST(r.effective_from, v_today);
  v_to := LEAST(COALESCE(r.effective_until, v_today + p_weeks * 7), v_today + p_weeks * 7);
  -- ISO day number of the rule (monday = 1 .. sunday = 7)
  v_dow := array_position(ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'], r.day_of_week::text);
  v_capacity := COALESCE(r.capacity_override, r.offering_capacity, 20);

  v_day := v_from;
  WHILE v_day <= v_to LOOP
    IF r.recurrence = 'daily'
       OR (EXTRACT(ISODOW FROM v_day)::int = v_dow
           AND (r.recurrence = 'weekly'
                OR ((v_day - r.effective_from) / 7) % 2 = 0)) THEN
      v_starts := (v_day + r.start_time) AT TIME ZONE v_tz;
      v_ends := CASE WHEN r.end_time > r.start_time
                     THEN (v_day + r.end_time) AT TIME ZONE v_tz
                     ELSE v_starts + make_interval(mins => COALESCE(r.duration_minutes, 60)) END;
      IF v_starts > NOW() THEN
        INSERT INTO class_occurrences (studio_id, offering_id, schedule_rule_id, location_id, teacher_id,
                                       starts_at, ends_at, room, capacity, instructor_role)
        VALUES (r.studio_id, r.offering_id, r.id, r.location_id, r.teacher_id,
                v_starts, v_ends, r.room, v_capacity, r.instructor_role)
        ON CONFLICT (schedule_rule_id, starts_at) WHERE schedule_rule_id IS NOT NULL
        DO UPDATE SET is_cancelled = false, cancellation_reason = NULL, cancelled_at = NULL
          WHERE class_occurrences.cancellation_reason = 'schedule_rule_changed';
        GET DIAGNOSTICS v_rows = ROW_COUNT;
        v_count := v_count + v_rows;
      END IF;
    END IF;
    v_day := v_day + 1;
  END LOOP;

  RETURN v_count;
END $$;

REVOKE ALL ON FUNCTION generate_rule_occurrences(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_rule_occurrences(UUID, INTEGER) TO service_role;

-- A saved rule fills its horizon. A changed rule first cancels its future
-- classes that no one has booked or is holding (booked ones stay for staff to
-- move or cancel with notice), then regenerates.
CREATE OR REPLACE FUNCTION schedule_rule_sync_occurrences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
       NEW.is_active IS DISTINCT FROM OLD.is_active
    OR NEW.day_of_week IS DISTINCT FROM OLD.day_of_week
    OR NEW.start_time IS DISTINCT FROM OLD.start_time
    OR NEW.end_time IS DISTINCT FROM OLD.end_time
    OR NEW.recurrence IS DISTINCT FROM OLD.recurrence
    OR NEW.effective_from IS DISTINCT FROM OLD.effective_from
    OR NEW.effective_until IS DISTINCT FROM OLD.effective_until
    OR NEW.offering_id IS DISTINCT FROM OLD.offering_id
    OR NEW.location_id IS DISTINCT FROM OLD.location_id) THEN
    UPDATE class_occurrences co
       SET is_cancelled = true, cancelled_at = NOW(), cancellation_reason = 'schedule_rule_changed'
     WHERE co.schedule_rule_id = NEW.id
       AND co.starts_at > NOW()
       AND NOT co.is_cancelled
       AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.class_occurrence_id = co.id)
       AND NOT EXISTS (SELECT 1 FROM seat_holds h WHERE h.class_occurrence_id = co.id
                         AND h.status = 'active' AND h.expires_at > NOW());
  END IF;

  PERFORM generate_rule_occurrences(NEW.id, 8);
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION schedule_rule_sync_occurrences() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS schedule_rules_sync_occurrences ON schedule_rules;
CREATE TRIGGER schedule_rules_sync_occurrences
  AFTER INSERT OR UPDATE ON schedule_rules
  FOR EACH ROW EXECUTE FUNCTION schedule_rule_sync_occurrences();

-- Top up the horizon. Owners and admins for their own studio; the daily job
-- (no signed-in user) for every studio.
CREATE OR REPLACE FUNCTION generate_class_occurrences(p_studio_id UUID DEFAULT NULL, p_weeks INTEGER DEFAULT 8)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule  UUID;
  v_total INTEGER := 0;
BEGIN
  IF p_weeks IS NULL OR p_weeks < 1 OR p_weeks > 26 THEN
    RAISE EXCEPTION 'weeks must be between 1 and 26';
  END IF;

  IF (SELECT auth.uid()) IS NOT NULL THEN
    IF p_studio_id IS NULL OR p_studio_id NOT IN (SELECT my_admin_studio_ids()) THEN
      RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
    END IF;
  END IF;

  FOR v_rule IN
    SELECT id FROM schedule_rules
     WHERE COALESCE(is_active, true)
       AND (p_studio_id IS NULL OR studio_id = p_studio_id)
  LOOP
    v_total := v_total + generate_rule_occurrences(v_rule, p_weeks);
  END LOOP;

  RETURN v_total;
END $$;

REVOKE ALL ON FUNCTION generate_class_occurrences(UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION generate_class_occurrences(UUID, INTEGER) TO authenticated, service_role;

-- Daily top-up. pg_cron exists on Supabase; plain Postgres (CI) skips this.
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'generate-class-occurrences';
    PERFORM cron.schedule('generate-class-occurrences', '15 7 * * *',
                          'SELECT public.generate_class_occurrences(NULL, 8)');
  END IF;
END $cron$;

-- Backfill: rules saved before this migration (the onboarding bug) get their classes now.
SELECT generate_class_occurrences(NULL, 8);
COMMIT;
