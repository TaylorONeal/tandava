-- 00040: get_my_entitlements() for the student's Account page (LP-4b).
--
-- /account showed a made-up membership and pack. Students need their real
-- memberships and class packs across every studio they belong to, with the
-- studio and plan names. Same pattern as get_my_bookings (00039): one narrow
-- SECURITY DEFINER function, the caller's own rows only.

CREATE OR REPLACE FUNCTION get_my_entitlements()
RETURNS TABLE (
  kind TEXT,                 -- 'membership' | 'pack'
  entitlement_id UUID,
  studio_id UUID,
  studio_name TEXT,
  studio_slug TEXT,
  currency TEXT,
  name TEXT,
  status TEXT,
  price_cents INTEGER,
  billing_cycle TEXT,        -- memberships only
  ends_at TIMESTAMPTZ,       -- membership current period end, or pack expiry
  classes_remaining INTEGER, -- packs only
  has_subscription BOOLEAN   -- membership billed through Stripe (portal available)
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'membership', m.id, s.id, s.name, s.slug, s.currency, mt.name, m.status::text,
         mt.price_cents, mt.billing_cycle::text, m.current_period_end, NULL::integer,
         m.stripe_subscription_id IS NOT NULL
  FROM memberships m
  JOIN membership_types mt ON mt.id = m.membership_type_id
  JOIN studios s ON s.id = m.studio_id
  WHERE m.profile_id = (SELECT auth.uid())
  UNION ALL
  SELECT 'pack', cp.id, s.id, s.name, s.slug, s.currency, cpt.name, cp.status::text,
         cpt.price_cents, NULL::text, cp.expires_at, cp.classes_remaining, FALSE
  FROM class_packs cp
  JOIN class_pack_types cpt ON cpt.id = cp.class_pack_type_id
  JOIN studios s ON s.id = cp.studio_id
  WHERE cp.profile_id = (SELECT auth.uid())
  ORDER BY 5 ASC, 1 ASC, 11 DESC;
$$;

COMMENT ON FUNCTION get_my_entitlements() IS
  'The calling user''s own memberships and class packs across studios, with studio and plan names. Account page.';

REVOKE ALL ON FUNCTION get_my_entitlements() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_my_entitlements() TO authenticated;
