-- ============================================================================
-- EFFECTIVE ROLE RESOLUTION
--
-- The frontend derives permissions from a single role, but roles live in
-- studio_staff (a user can be owner of one studio and a student elsewhere).
-- profiles has no role column, so production users previously always resolved
-- to student permissions and could never reach /manage.
--
-- get_my_effective_role() returns the caller's highest studio_staff role.
-- SECURITY DEFINER sidesteps the self-referential RLS policy on studio_staff
-- ("Staff can view studio staff" subqueries studio_staff itself, which
-- Postgres rejects as infinite recursion when queried directly by a client).
-- ============================================================================

CREATE OR REPLACE FUNCTION get_my_effective_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT role
      FROM studio_staff
      WHERE profile_id = auth.uid()
        AND is_active
      ORDER BY
        CASE role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'teacher' THEN 3
          WHEN 'front_desk' THEN 4
          ELSE 5
        END
      LIMIT 1
    ),
    'student'::user_role
  );
$$;

GRANT EXECUTE ON FUNCTION get_my_effective_role() TO authenticated;
