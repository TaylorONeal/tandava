-- Migration: public studio storefront
--
-- The slug-driven storefront (pages/StudioStorefront.tsx, route /s/:slug, and
-- eventually each studio's subdomain) needs a discoverable studio's PUBLIC
-- profile + offerings + pricing for unauthenticated visitors. As with
-- get_public_schedule (00016), a broad anon SELECT on these tables would
-- over-expose internal columns and non-public rows, so instead we expose one
-- narrow SECURITY DEFINER function that returns only safe, public fields — and
-- only for a studio that has opted into discovery (studios.discoverable).
--
-- Returns NULL when the slug doesn't match a discoverable studio, so the client
-- renders a neutral "not available" page rather than leaking existence.

CREATE OR REPLACE FUNCTION get_studio_storefront(p_slug TEXT)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'studio', jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'slug', s.slug,
      'description', s.description,
      'primary_color', s.brand_primary_color,
      'secondary_color', s.brand_secondary_color,
      'font', s.brand_font,
      'timezone', s.timezone,
      'currency', s.currency
    ),
    'offerings', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'style', o.style,
        'level', o.level,
        'description', o.description,
        'duration_minutes', o.duration_minutes,
        'capacity', o.capacity,
        'drop_in_price_cents', o.drop_in_price_cents,
        'is_heated', o.is_heated
      ) ORDER BY o.name)
      FROM offerings o
      WHERE o.studio_id = s.id AND o.is_active = TRUE AND o.discoverable = TRUE
    ), '[]'::jsonb),
    'memberships', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', m.id,
        'name', m.name,
        'description', m.description,
        'billing_cycle', m.billing_cycle,
        'price_cents', m.price_cents,
        'classes_per_cycle', m.classes_per_cycle
      ) ORDER BY m.sort_order, m.price_cents)
      FROM membership_types m
      WHERE m.studio_id = s.id AND m.is_active = TRUE
    ), '[]'::jsonb),
    'packs', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', cp.id,
        'name', cp.name,
        'description', cp.description,
        'class_count', cp.class_count,
        'price_cents', cp.price_cents,
        'validity_days', cp.validity_days
      ) ORDER BY cp.sort_order, cp.price_cents)
      FROM class_pack_types cp
      WHERE cp.studio_id = s.id AND cp.is_active = TRUE
    ), '[]'::jsonb)
  )
  FROM studios s
  WHERE s.slug = p_slug
    AND s.discoverable = TRUE;
$$;

COMMENT ON FUNCTION get_studio_storefront(TEXT) IS
  'Public, read-only storefront for a discoverable studio (by slug): studio profile + active offerings + active membership/pack pricing. Returns NULL if the studio is not discoverable. Companion to get_public_schedule for the /s/:slug storefront and future per-studio subdomains.';

GRANT EXECUTE ON FUNCTION get_studio_storefront(TEXT) TO anon, authenticated;
