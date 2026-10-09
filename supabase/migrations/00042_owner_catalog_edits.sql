-- 00042: owners and admins edit classes, prices and the weekly schedule (LP-5).
--
-- offerings, class_pack_types, membership_types and schedule_rules had read
-- policies only. The onboarding edge function wrote them with the service
-- role, so nothing could change after setup. This adds:
--   1. Value checks for what an owner now types (no zero-length classes,
--      no negative prices).
--   2. INSERT and UPDATE policies for owners and admins of the studio. No
--      DELETE: retiring a class or price is is_active = false, so bookings,
--      purchases and history keep their references.
--   3. A row never moves to another studio.
--   4. A schedule rule only points at its own studio's class, location and
--      staff.
--   5. Editing a class (length, capacity, on/off) reaches its scheduled
--      classes. Rules are re-saved so 00036/00037 reconcile them, and a new
--      capacity also reaches future classes that already have bookings
--      (never below the number booked).
--   6. get_studio_staff_names: the schedule editor's teacher picker. Staff
--      cannot read each other's profiles through RLS.
--
-- Prices are read at checkout (stripe-checkout builds price_data from these
-- rows), so a price edit applies to the next purchase with no Stripe change.

-- 1. Value checks -------------------------------------------------------------
ALTER TABLE offerings DROP CONSTRAINT IF EXISTS offerings_values_valid;
ALTER TABLE offerings ADD CONSTRAINT offerings_values_valid
  CHECK (duration_minutes BETWEEN 1 AND 1440 AND capacity > 0
         AND (drop_in_price_cents IS NULL OR drop_in_price_cents >= 0));

ALTER TABLE class_pack_types DROP CONSTRAINT IF EXISTS class_pack_types_values_valid;
ALTER TABLE class_pack_types ADD CONSTRAINT class_pack_types_values_valid
  CHECK (class_count > 0 AND price_cents >= 0 AND validity_days > 0);

ALTER TABLE membership_types DROP CONSTRAINT IF EXISTS membership_types_values_valid;
ALTER TABLE membership_types ADD CONSTRAINT membership_types_values_valid
  CHECK (price_cents >= 0 AND (classes_per_cycle IS NULL OR classes_per_cycle > 0));

-- 2. Owner and admin writes -----------------------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['offerings', 'class_pack_types', 'membership_types', 'schedule_rules'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admins can add %1$s" ON %1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admins can edit %1$s" ON %1$I', t);
    EXECUTE format(
      'CREATE POLICY "Admins can add %1$s" ON %1$I FOR INSERT TO authenticated
         WITH CHECK (studio_id IN (SELECT my_admin_studio_ids()))', t);
    EXECUTE format(
      'CREATE POLICY "Admins can edit %1$s" ON %1$I FOR UPDATE TO authenticated
         USING (studio_id IN (SELECT my_admin_studio_ids()))
         WITH CHECK (studio_id IN (SELECT my_admin_studio_ids()))', t);
  END LOOP;
END $$;

-- 3. studio_id is fixed -----------------------------------------------------------
CREATE OR REPLACE FUNCTION keep_studio_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.studio_id IS DISTINCT FROM OLD.studio_id THEN
    RAISE EXCEPTION 'studio_id cannot change' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION keep_studio_id() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['offerings', 'class_pack_types', 'membership_types', 'schedule_rules'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %1$s_keep_studio_id ON %1$I', t);
    EXECUTE format('CREATE TRIGGER %1$s_keep_studio_id BEFORE UPDATE OF studio_id ON %1$I
                      FOR EACH ROW EXECUTE FUNCTION keep_studio_id()', t);
  END LOOP;
END $$;

-- 4. Schedule rules stay inside their studio --------------------------------------
CREATE OR REPLACE FUNCTION schedule_rule_check_refs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM offerings WHERE id = NEW.offering_id AND studio_id = NEW.studio_id) THEN
    RAISE EXCEPTION 'class belongs to another studio' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM locations WHERE id = NEW.location_id AND studio_id = NEW.studio_id) THEN
    RAISE EXCEPTION 'location belongs to another studio' USING ERRCODE = '23514';
  END IF;
  IF NEW.teacher_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM studio_staff
                      WHERE studio_id = NEW.studio_id AND profile_id = NEW.teacher_id) THEN
    RAISE EXCEPTION 'teacher is not staff of this studio' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION schedule_rule_check_refs() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS schedule_rules_check_refs ON schedule_rules;
CREATE TRIGGER schedule_rules_check_refs
  BEFORE INSERT OR UPDATE OF studio_id, offering_id, location_id, teacher_id ON schedule_rules
  FOR EACH ROW EXECUTE FUNCTION schedule_rule_check_refs();

-- 5. Class edits reach the schedule -------------------------------------------------
CREATE OR REPLACE FUNCTION offering_sync_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Re-save each rule: end time follows the new length (clamped to the same
  -- day), and the 00036 trigger reconciles its classes (capacity, on/off).
  UPDATE schedule_rules sr
     SET end_time = time '00:00' + make_interval(
                      mins => LEAST((EXTRACT(EPOCH FROM sr.start_time) / 60)::int + NEW.duration_minutes, 1439)),
         updated_at = NOW()
   WHERE sr.offering_id = NEW.id;

  -- Classes with bookings are left alone by the reconcile. A capacity change
  -- still applies to them, never below the number already booked, unless the
  -- rule or the class has its own capacity.
  IF NEW.capacity IS DISTINCT FROM OLD.capacity THEN
    UPDATE class_occurrences co
       SET capacity = GREATEST(NEW.capacity, COALESCE(co.booked_count, 0)), updated_at = NOW()
     WHERE co.offering_id = NEW.id
       AND co.starts_at > NOW()
       AND NOT COALESCE(co.is_cancelled, false)
       AND co.capacity IS DISTINCT FROM GREATEST(NEW.capacity, COALESCE(co.booked_count, 0))
       AND NOT EXISTS (SELECT 1 FROM schedule_rules sr
                        WHERE sr.id = co.schedule_rule_id AND sr.capacity_override IS NOT NULL)
       AND NOT EXISTS (SELECT 1 FROM schedule_overrides so WHERE so.class_occurrence_id = co.id);
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION offering_sync_schedule() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS offerings_sync_schedule ON offerings;
CREATE TRIGGER offerings_sync_schedule
  AFTER UPDATE OF duration_minutes, capacity, is_active ON offerings
  FOR EACH ROW
  WHEN (OLD.duration_minutes IS DISTINCT FROM NEW.duration_minutes
        OR OLD.capacity IS DISTINCT FROM NEW.capacity
        OR OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION offering_sync_schedule();

-- 6. Teacher picker -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_studio_staff_names(p_studio_id UUID)
RETURNS TABLE (profile_id UUID, name TEXT, role TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ss.profile_id,
         COALESCE(NULLIF(p.display_name, ''),
                  NULLIF(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
                  p.email, 'Staff') AS name,
         ss.role::text
    FROM studio_staff ss
    JOIN profiles p ON p.id = ss.profile_id
   WHERE ss.studio_id = p_studio_id
     AND COALESCE(ss.is_active, true)
     AND p_studio_id IN (SELECT my_admin_studio_ids())
   ORDER BY 2;
$$;
REVOKE ALL ON FUNCTION get_studio_staff_names(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_studio_staff_names(UUID) TO authenticated;
