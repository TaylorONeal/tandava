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
--   schedule_rules trigger                   any saved rule is reconciled at
--       once: missing classes are added, unbooked ones refreshed from the rule
--       (end, location, teacher, room, capacity), and ones the rule no longer
--       produces are cancelled unless someone is booked or holding a seat.
--   generate_class_occurrences(studio, weeks) owners/admins top up their own
--       studio; with no studio and no signed-in user (cron) it tops up all.
--   pg_cron job (when the extension is available) runs it daily so the
--       horizon rolls forward and classes kept only by a since-lapsed seat
--       hold get cancelled.
--
-- Times: start_time/end_time are wall-clock in the studio's timezone, so a
-- 10:00 class stays 10:00 across daylight saving changes.
-- Recurrence: daily, weekly, biweekly (every other week from effective_from).
-- 'monthly' is not generated yet (no rule in the product creates it).
-- Numbered 00036: 00035 is taken by PR #72 (attribution).

CREATE UNIQUE INDEX IF NOT EXISTS uq_class_occurrences_rule_start
  ON class_occurrences (schedule_rule_id, starts_at)
  WHERE schedule_rule_id IS NOT NULL;

-- Live interest: someone is booked, waitlisted, checked in, or holding a seat.
-- Cancelled and late-cancelled bookings do not count.
CREATE OR REPLACE FUNCTION occurrence_has_live_interest(p_occurrence_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM bookings b
                  WHERE b.class_occurrence_id = p_occurrence_id
                    AND b.status IN ('confirmed', 'waitlisted', 'checked_in'))
      OR EXISTS (SELECT 1 FROM seat_holds h
                  WHERE h.class_occurrence_id = p_occurrence_id
                    AND h.status = 'active' AND h.expires_at > NOW());
$$;
REVOKE ALL ON FUNCTION occurrence_has_live_interest(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION occurrence_has_live_interest(UUID) TO service_role;

-- Reconcile one rule's future classes with the rule:
--   1. expected start times = the rule's pattern from today to the horizon
--      (or to the furthest class already generated, if later), within its
--      effective dates; none if the rule or offering is inactive;
--   2. a future class of the rule that is not expected and has no live
--      interest is cancelled ('schedule_rule_changed');
--   3. every expected time is inserted, or, if it exists without live
--      interest, refreshed from the rule (end, location, teacher, room,
--      capacity) and un-cancelled if the rule had cancelled it. Classes with
--      live interest and classes staff cancelled themselves are left alone.
-- Runs on every rule save and daily, so a class skipped because of a seat
-- hold is cancelled once the hold lapses.
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
  v_expected TIMESTAMPTZ[] := '{}';
  v_valid    BOOLEAN;
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
  IF NOT FOUND THEN RETURN 0; END IF;

  v_valid := COALESCE(r.is_active, true) AND COALESCE(r.offering_active, true)
             AND r.recurrence IN ('daily', 'weekly', 'biweekly');
  v_tz := COALESCE(NULLIF(r.studio_tz, ''), 'UTC');
  v_today := (NOW() AT TIME ZONE v_tz)::date;
  v_from := GREATEST(r.effective_from, v_today);
  -- Cover the horizon, or further if classes were already generated further out.
  v_to := GREATEST(v_today + p_weeks * 7,
                   COALESCE((SELECT max(starts_at AT TIME ZONE v_tz)::date FROM class_occurrences
                              WHERE schedule_rule_id = r.id AND starts_at > NOW()), v_today));
  IF r.effective_until IS NOT NULL THEN v_to := LEAST(v_to, r.effective_until); END IF;
  v_dow := array_position(ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'], r.day_of_week::text);
  v_capacity := COALESCE(r.capacity_override, r.offering_capacity, 20);

  IF v_valid THEN
    v_day := v_from;
    WHILE v_day <= v_to LOOP
      IF r.recurrence = 'daily'
         OR (EXTRACT(ISODOW FROM v_day)::int = v_dow
             AND (r.recurrence = 'weekly' OR ((v_day - r.effective_from) / 7) % 2 = 0)) THEN
        v_starts := (v_day + r.start_time) AT TIME ZONE v_tz;
        IF v_starts > NOW() THEN
          v_expected := v_expected || v_starts;
        END IF;
      END IF;
      v_day := v_day + 1;
    END LOOP;
  END IF;

  -- 2. Cancel future classes the rule no longer produces.
  UPDATE class_occurrences co
     SET is_cancelled = true, cancelled_at = NOW(), cancellation_reason = 'schedule_rule_changed'
   WHERE co.schedule_rule_id = r.id
     AND co.starts_at > NOW()
     AND NOT COALESCE(co.is_cancelled, false)
     AND NOT (co.starts_at = ANY (v_expected))
     AND NOT occurrence_has_live_interest(co.id);

  -- 3. Insert or refresh the expected classes.
  FOREACH v_starts IN ARRAY v_expected LOOP
    v_ends := CASE WHEN r.end_time > r.start_time
                   THEN ((v_starts AT TIME ZONE v_tz)::date + r.end_time) AT TIME ZONE v_tz
                   ELSE v_starts + make_interval(mins => COALESCE(r.duration_minutes, 60)) END;
    INSERT INTO class_occurrences (studio_id, offering_id, schedule_rule_id, location_id, teacher_id,
                                   starts_at, ends_at, room, capacity, instructor_role)
    VALUES (r.studio_id, r.offering_id, r.id, r.location_id, r.teacher_id,
            v_starts, v_ends, r.room, v_capacity, r.instructor_role)
    ON CONFLICT (schedule_rule_id, starts_at) WHERE schedule_rule_id IS NOT NULL
    DO UPDATE SET offering_id = EXCLUDED.offering_id, location_id = EXCLUDED.location_id,
                  teacher_id = EXCLUDED.teacher_id, ends_at = EXCLUDED.ends_at, room = EXCLUDED.room,
                  capacity = EXCLUDED.capacity, instructor_role = EXCLUDED.instructor_role,
                  is_cancelled = false, cancellation_reason = NULL, cancelled_at = NULL,
                  updated_at = NOW()
      WHERE (NOT COALESCE(class_occurrences.is_cancelled, false)
             OR class_occurrences.cancellation_reason = 'schedule_rule_changed')
        AND NOT occurrence_has_live_interest(class_occurrences.id)
        AND (class_occurrences.offering_id, class_occurrences.location_id, class_occurrences.teacher_id,
             class_occurrences.ends_at, class_occurrences.room, class_occurrences.capacity,
             class_occurrences.instructor_role, COALESCE(class_occurrences.is_cancelled, false))
            IS DISTINCT FROM
            (EXCLUDED.offering_id, EXCLUDED.location_id, EXCLUDED.teacher_id, EXCLUDED.ends_at,
             EXCLUDED.room, EXCLUDED.capacity, EXCLUDED.instructor_role, false);
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    v_count := v_count + v_rows;
  END LOOP;

  RETURN v_count;
END $$;

REVOKE ALL ON FUNCTION generate_rule_occurrences(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_rule_occurrences(UUID, INTEGER) TO service_role;

-- Any saved rule (new, edited, deactivated) is reconciled at once.
CREATE OR REPLACE FUNCTION schedule_rule_sync_occurrences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    SELECT sr.id FROM schedule_rules sr
     WHERE (p_studio_id IS NULL OR sr.studio_id = p_studio_id)
       AND (COALESCE(sr.is_active, true)
            OR EXISTS (SELECT 1 FROM class_occurrences co
                        WHERE co.schedule_rule_id = sr.id AND co.starts_at > NOW()
                          AND NOT COALESCE(co.is_cancelled, false)))
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
