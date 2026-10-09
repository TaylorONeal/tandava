-- 00037: schedule rule follow-ups from the #85 review (00036 is already on prod).
--
-- 1. A rule saved without a start date starts on the studio's local date.
--    effective_from defaulted to CURRENT_DATE (the database's UTC date), so in
--    the evening in the Americas a rule for tonight started tomorrow and
--    tonight's class was never generated. The default is dropped; a BEFORE
--    INSERT trigger fills a missing date with the studio's local today. An
--    explicitly supplied date is kept as given.
-- 2. Reconciling a rule no longer races a booking. Each candidate class is
--    locked first (book_class, book_class_auto and hold_spot lock the same
--    row), and booking interest is checked in a later statement, so it sees a
--    booking that committed while we waited.
-- 3. A class with a one-off change (substitute, moved time, room or capacity
--    edit recorded in schedule_overrides or marked is_subbed) is not refreshed
--    from the rule. It is still cancelled if the rule stops producing it and
--    nobody is booked.
-- 4. Classes are matched to the rule by the slot they were generated for
--    (rule_slot_starts_at), not by starts_at, so a class moved to another time
--    still fills its original slot: it is neither cancelled nor duplicated.

-- 1. Local start date ---------------------------------------------------------
ALTER TABLE schedule_rules ALTER COLUMN effective_from DROP DEFAULT;

CREATE OR REPLACE FUNCTION schedule_rule_local_effective_from()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_tz TEXT;
BEGIN
  IF NEW.effective_from IS NULL THEN
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

-- 4. Slot identity ----------------------------------------------------------------
ALTER TABLE class_occurrences ADD COLUMN IF NOT EXISTS rule_slot_starts_at TIMESTAMPTZ;
-- The backfill uses starts_at, which is only the original slot if the class
-- was never moved. Overrides store only the new time, so a moved rule class
-- cannot be backfilled safely: stop rather than guess. (None exist on
-- tandava-prod: no code writes time_change yet.)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM schedule_overrides so
               JOIN class_occurrences co ON co.id = so.class_occurrence_id
              WHERE so.override_type = 'time_change' AND co.schedule_rule_id IS NOT NULL
                AND co.rule_slot_starts_at IS NULL) THEN
    RAISE EXCEPTION '00037: rule classes with time_change overrides need their original slot set by hand in rule_slot_starts_at before this migration';
  END IF;
END $$;
UPDATE class_occurrences SET rule_slot_starts_at = starts_at
 WHERE schedule_rule_id IS NOT NULL AND rule_slot_starts_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_class_occurrences_rule_slot
  ON class_occurrences (schedule_rule_id, rule_slot_starts_at)
  WHERE schedule_rule_id IS NOT NULL;
DROP INDEX IF EXISTS uq_class_occurrences_rule_start;

-- 2 and 3. Reconcile with locks, leave one-off changes alone -------------------
CREATE OR REPLACE FUNCTION occurrence_has_override(p_occurrence_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM schedule_overrides so WHERE so.class_occurrence_id = p_occurrence_id)
      OR EXISTS (SELECT 1 FROM class_occurrences co
                  WHERE co.id = p_occurrence_id
                    AND (COALESCE(co.is_subbed, false) OR co.original_teacher_id IS NOT NULL));
$$;
REVOKE ALL ON FUNCTION occurrence_has_override(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION occurrence_has_override(UUID) TO service_role;

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
  v_occ      RECORD;
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
  v_to := GREATEST(v_today + p_weeks * 7,
                   COALESCE((SELECT max(rule_slot_starts_at AT TIME ZONE v_tz)::date FROM class_occurrences
                              WHERE schedule_rule_id = r.id AND rule_slot_starts_at > NOW()), v_today));
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

  -- Cancel classes the rule no longer produces. Lock each one, then check for
  -- bookings and holds in a separate statement (fresh snapshot).
  FOR v_occ IN
    SELECT id FROM class_occurrences
     WHERE schedule_rule_id = r.id AND starts_at > NOW()
       -- Only slots still ahead are the rule's to manage: a class moved later
       -- than its slot keeps running once that slot time has passed.
       AND COALESCE(rule_slot_starts_at, starts_at) > NOW()
       AND NOT COALESCE(is_cancelled, false)
       AND NOT (COALESCE(rule_slot_starts_at, starts_at) = ANY (v_expected))
     ORDER BY id
       FOR UPDATE
  LOOP
    IF NOT occurrence_has_live_interest(v_occ.id) THEN
      UPDATE class_occurrences
         SET is_cancelled = true, cancelled_at = NOW(), cancellation_reason = 'schedule_rule_changed'
       WHERE id = v_occ.id;
    END IF;
  END LOOP;

  FOREACH v_starts IN ARRAY v_expected LOOP
    v_ends := CASE WHEN r.end_time > r.start_time
                   THEN ((v_starts AT TIME ZONE v_tz)::date + r.end_time) AT TIME ZONE v_tz
                   ELSE v_starts + make_interval(mins => COALESCE(r.duration_minutes, 60)) END;

    INSERT INTO class_occurrences (studio_id, offering_id, schedule_rule_id, location_id, teacher_id,
                                   starts_at, ends_at, room, capacity, instructor_role, rule_slot_starts_at)
    VALUES (r.studio_id, r.offering_id, r.id, r.location_id, r.teacher_id,
            v_starts, v_ends, r.room, v_capacity, r.instructor_role, v_starts)
    ON CONFLICT (schedule_rule_id, rule_slot_starts_at) WHERE schedule_rule_id IS NOT NULL DO NOTHING;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    v_count := v_count + v_rows;

    IF v_rows = 0 THEN
      -- Existing class: lock it, then refresh it from the rule unless someone
      -- is booked or holding, staff cancelled it, or it has a one-off change.
      SELECT id, is_cancelled, cancellation_reason INTO v_occ
        FROM class_occurrences
       WHERE schedule_rule_id = r.id AND rule_slot_starts_at = v_starts
         FOR UPDATE;
      IF FOUND
         AND (NOT COALESCE(v_occ.is_cancelled, false) OR v_occ.cancellation_reason = 'schedule_rule_changed')
         AND NOT occurrence_has_live_interest(v_occ.id)
         AND NOT occurrence_has_override(v_occ.id) THEN
        UPDATE class_occurrences
           SET offering_id = r.offering_id, location_id = r.location_id, teacher_id = r.teacher_id,
               ends_at = v_ends, room = r.room, capacity = v_capacity, instructor_role = r.instructor_role,
               is_cancelled = false, cancellation_reason = NULL, cancelled_at = NULL, updated_at = NOW()
         WHERE id = v_occ.id
           AND (offering_id, location_id, teacher_id, ends_at, room, capacity, instructor_role,
                COALESCE(is_cancelled, false))
               IS DISTINCT FROM
               (r.offering_id, r.location_id, r.teacher_id, v_ends, r.room, v_capacity, r.instructor_role, false);
        GET DIAGNOSTICS v_rows = ROW_COUNT;
        v_count := v_count + v_rows;
      END IF;
    END IF;
  END LOOP;

  RETURN v_count;
END $$;

REVOKE ALL ON FUNCTION generate_rule_occurrences(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_rule_occurrences(UUID, INTEGER) TO service_role;
