-- Migration: fix RLS recursion on studio_staff and close three RLS gaps
--
-- Found by running the migrations on a clean Postgres and querying as the
-- anon/authenticated roles (supabase/tests/).
--
-- 1. RECURSION. The policy "Staff can view co-workers" on studio_staff selects
--    from studio_staff. Postgres rejects that ("infinite recursion detected in
--    policy"), and because ~100 other policies subquery studio_staff, ANY
--    client read of bookings, transactions, studios, etc. failed for every
--    non-service role. 00017 worked around it for the role lookup only.
--    Fix: resolve the caller's studios through SECURITY DEFINER helpers (which
--    read studio_staff without re-entering its policies) and rebuild the one
--    self-referential policy on top of them. Semantics are unchanged: staff
--    see the staff rows of the studios they work at.
--
-- 2. RLS DISABLED on tables that carry studio_id:
--      virtual_class_settings   (holds zoom_credentials_encrypted)
--      audit_logs_archive
--      on_demand_subscriptions
--    With Supabase's default grants these were readable by the public anon key.
--    Enable RLS and scope them to the studio's own staff (admins for settings
--    and archives).

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER so they bypass RLS on studio_staff)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION my_staff_studio_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid() AND is_active;
$$;

CREATE OR REPLACE FUNCTION my_admin_studio_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT studio_id FROM studio_staff
  WHERE profile_id = auth.uid()
    AND is_active
    AND role IN ('owner', 'admin');
$$;

REVOKE ALL ON FUNCTION my_staff_studio_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION my_admin_studio_ids() FROM PUBLIC;
-- anon needs EXECUTE because policy expressions run as the calling role; for
-- anon (auth.uid() IS NULL) both functions simply return no rows.
GRANT EXECUTE ON FUNCTION my_staff_studio_ids() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION my_admin_studio_ids() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. Break the studio_staff self-reference
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Staff can view co-workers" ON studio_staff;
CREATE POLICY "Staff can view co-workers"
  ON studio_staff FOR SELECT
  USING (studio_id IN (SELECT my_staff_studio_ids()));

-- ---------------------------------------------------------------------------
-- 2. Close the RLS gaps
-- ---------------------------------------------------------------------------

ALTER TABLE virtual_class_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE on_demand_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio admins manage virtual class settings"
  ON virtual_class_settings FOR ALL
  USING (studio_id IN (SELECT my_admin_studio_ids()))
  WITH CHECK (studio_id IN (SELECT my_admin_studio_ids()));

CREATE POLICY "Studio admins read audit archive"
  ON audit_logs_archive FOR SELECT
  USING (studio_id IN (SELECT my_admin_studio_ids()));

CREATE POLICY "Studio staff read on-demand plans"
  ON on_demand_subscriptions FOR SELECT
  USING (studio_id IN (SELECT my_staff_studio_ids()));

CREATE POLICY "Studio admins manage on-demand plans"
  ON on_demand_subscriptions FOR ALL
  USING (studio_id IN (SELECT my_admin_studio_ids()))
  WITH CHECK (studio_id IN (SELECT my_admin_studio_ids()));
