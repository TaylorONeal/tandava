-- Migration: get_my_studio() — the caller's studio, for owner-facing screens
--
-- Several manage screens need to know "which studio am I?" to show the owner
-- their own slug, brand color and discoverability without asking them to type
-- any of it. `/manage/embed` currently asks the owner to type their own slug,
-- defaulting to the literal string 'your-studio-slug', which is a question a
-- studio owner should never be asked.
--
-- A plain `SELECT * FROM studios` would mostly work: migration 00001 has a
-- staff SELECT policy on studios. But that policy's subquery reads studio_staff,
-- which carries its own self-referential policy — the same recursion migration
-- 00017 added a SECURITY DEFINER function to sidestep for roles. Rather than
-- rely on that resolving, this follows 00017 and 00018: one narrow
-- SECURITY DEFINER function returning exactly the columns the screens need.
--
-- Returns at most one row: the studio of the caller's first active staff
-- record. Multi-studio staff are a real case the share and embed screens do not
-- handle yet; ordering by created_at makes the choice deterministic rather than
-- arbitrary, and a studio picker is the follow-up when multi-location lands.
--
-- NOTE: integration-test against a live database before relying on this.

CREATE OR REPLACE FUNCTION get_my_studio()
RETURNS TABLE (
  studio_id UUID,
  name TEXT,
  slug TEXT,
  timezone TEXT,
  currency TEXT,
  discoverable BOOLEAN,
  brand_primary_color TEXT,
  brand_secondary_color TEXT,
  logo_url TEXT,
  express_booking_enabled BOOLEAN,
  staff_role user_role
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id, s.name, s.slug, s.timezone, s.currency, s.discoverable,
    s.brand_primary_color, s.brand_secondary_color, s.logo_url,
    s.express_booking_enabled,
    ss.role
  FROM studio_staff ss
  JOIN studios s ON s.id = ss.studio_id
  WHERE ss.profile_id = auth.uid()
    AND ss.is_active = TRUE
  ORDER BY ss.created_at ASC
  LIMIT 1;
$$;

COMMENT ON FUNCTION get_my_studio() IS
  'The calling staff member''s studio: the identity and branding fields owner-facing screens need so an owner is never asked to type their own slug. Returns at most one row; a studio picker is needed for multi-studio staff.';

-- Authenticated only. There is nothing secret here (slug, name and brand colors
-- are public for a discoverable studio), but it keys off auth.uid(), so an anon
-- caller would get nothing and the grant would only mislead.
REVOKE ALL ON FUNCTION get_my_studio() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_my_studio() TO authenticated;
