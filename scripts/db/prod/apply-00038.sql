-- Apply 00038 (booking page live, LP-2) to tandava-prod. 00037 must already be applied.
-- Paste all of it into https://supabase.com/dashboard/project/mkaixgjwakfufmmwembn/sql/new and Run.
BEGIN;
-- 00038: a studio's booking page can be live without a Discover listing (LP-2).
--
-- Until now one switch, studios.discoverable, decided both whether a studio is
-- listed in Tandava Discover and whether its own page (/s/:slug), its embed
-- widget, guest booking and free-class booking work at all. A studio that
-- stayed out of Discover could not sell anything.
--
-- studios.page_live is the owner's "my booking page is live" switch. The
-- public read and booking paths serve a studio by slug only when it is on.
-- discoverable now only adds the studio to discover_classes, and a listed
-- studio always has a live page: a trigger turns page_live on when a studio is
-- listed, and takes the listing down when the page goes off.
--
-- Backfill: every currently listed studio keeps a live page; every other
-- studio stays off until its owner turns the page on.

ALTER TABLE studios ADD COLUMN IF NOT EXISTS page_live BOOLEAN NOT NULL DEFAULT FALSE;
COMMENT ON COLUMN studios.page_live IS
  'Owner switch: the public booking page, embed widget and guest booking work for this studio. Listing in Tandava Discover (discoverable) requires it.';

UPDATE studios SET page_live = TRUE WHERE discoverable = TRUE AND page_live = FALSE;

CREATE OR REPLACE FUNCTION studio_page_live_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.page_live AND NOT NEW.page_live THEN
    -- Taking the page down also takes the listing down.
    NEW.discoverable := FALSE;
  ELSIF NEW.discoverable THEN
    -- Listing a studio publishes its page.
    NEW.page_live := TRUE;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION studio_page_live_sync() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS studios_page_live_sync ON studios;
CREATE TRIGGER studios_page_live_sync
  BEFORE INSERT OR UPDATE OF discoverable, page_live ON studios
  FOR EACH ROW EXECUTE FUNCTION studio_page_live_sync();

-- Public read and booking paths: gate on the page, not the listing ----------

CREATE OR REPLACE FUNCTION public.get_studio_storefront(p_slug text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    AND s.page_live = TRUE;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_schedule(p_slug text, p_limit integer DEFAULT 12)
 RETURNS TABLE(occurrence_id uuid, starts_at timestamp with time zone, ends_at timestamp with time zone, room text, offering_name text, location_name text, teacher_name text, capacity integer, booked_count integer, studio_name text, studio_timezone text, studio_primary_color text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    co.id, co.starts_at, co.ends_at, co.room,
    o.name AS offering_name,
    l.name AS location_name,
    p.display_name AS teacher_name,
    co.capacity, co.booked_count,
    s.name AS studio_name,
    s.timezone AS studio_timezone,
    s.brand_primary_color AS studio_primary_color
  FROM studios s
  JOIN class_occurrences co ON co.studio_id = s.id
  JOIN offerings o ON o.id = co.offering_id
  LEFT JOIN locations l ON l.id = co.location_id
  LEFT JOIN profiles p ON p.id = co.teacher_id
  WHERE s.slug = p_slug
    AND s.page_live = TRUE
    AND co.is_cancelled = FALSE
    AND co.starts_at >= NOW()
  ORDER BY co.starts_at ASC
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
$function$;

CREATE OR REPLACE FUNCTION public.get_public_occurrence(p_slug text, p_occurrence_id uuid)
 RETURNS TABLE(occurrence_id uuid, starts_at timestamp with time zone, ends_at timestamp with time zone, room text, is_cancelled boolean, capacity integer, booked_count integer, offering_name text, offering_description text, drop_in_price_cents integer, location_name text, location_city text, teacher_name text, studio_name text, studio_slug text, studio_timezone text, studio_currency text, studio_primary_color text, express_booking_enabled boolean, express_booking_cutoff_minutes integer, express_waitlist_enabled boolean, express_waiver_required boolean, studio_id uuid, offering_id uuid, location_id uuid, location_address_line1 text, location_address_line2 text, location_state text, location_zip text, location_country text, location_latitude double precision, location_longitude double precision, cancellation_minutes integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    co.id, co.starts_at, co.ends_at, co.room, co.is_cancelled,
    co.capacity, co.booked_count,
    o.name, o.description, o.drop_in_price_cents,
    l.name, l.city,
    p.display_name,
    s.name, s.slug, s.timezone, s.currency, s.brand_primary_color,
    s.express_booking_enabled,
    s.express_booking_cutoff_minutes,
    -- A guest waitlist requires BOTH the studio waitlist and the guest switch.
    (s.waitlist_enabled AND s.express_waitlist_enabled),
    s.express_waiver_required,
    s.id, co.offering_id, co.location_id,
    l.address_line1, l.address_line2, l.state, l.zip, l.country,
    l.latitude::DOUBLE PRECISION, l.longitude::DOUBLE PRECISION,
    s.default_cancellation_minutes
  FROM studios s
  JOIN class_occurrences co ON co.studio_id = s.id
  JOIN offerings o ON o.id = co.offering_id
  LEFT JOIN locations l ON l.id = co.location_id
  LEFT JOIN profiles p ON p.id = co.teacher_id
  WHERE s.slug = p_slug
    AND s.page_live = TRUE
    AND co.id = p_occurrence_id;
$function$;

CREATE OR REPLACE FUNCTION public.book_free_class(p_occurrence_id uuid)
 RETURNS bookings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_price INTEGER;
  v_live BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to book';
  END IF;

  SELECT o.drop_in_price_cents, s.page_live
    INTO v_price, v_live
  FROM class_occurrences co
  JOIN offerings o ON o.id = co.offering_id
  JOIN studios s ON s.id = co.studio_id
  WHERE co.id = p_occurrence_id;

  IF NOT FOUND OR NOT COALESCE(v_live, FALSE) THEN
    RAISE EXCEPTION 'Class not found';
  END IF;
  IF COALESCE(v_price, -1) <> 0 THEN
    RAISE EXCEPTION 'This class is not free';
  END IF;

  RETURN create_guest_booking(p_occurrence_id, auth.uid(), NULL);
END;
$function$;

-- Visit tracking follows the page: a studio whose page is live records visits.
CREATE OR REPLACE FUNCTION record_session(
  p_studio_slug TEXT,
  p_visitor_id UUID,
  p_session_token TEXT,
  p_surface TEXT,
  p_landing_page_url TEXT,
  p_referrer_url TEXT,
  p_utm JSONB,
  p_click_ids JSONB,
  p_channel TEXT,
  p_device_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_studio UUID;
  v_id UUID;
  v_ref_host TEXT;
BEGIN
  SELECT id INTO v_studio FROM studios WHERE slug = p_studio_slug AND page_live = TRUE;
  IF v_studio IS NULL THEN
    RETURN NULL;  -- unknown or private studio: record nothing, reveal nothing
  END IF;

  v_ref_host := NULLIF(substring(COALESCE(p_referrer_url, '') FROM '^[a-z]+://([^/:?#]+)'), '');

  INSERT INTO analytics_sessions (
    studio_id, session_token, visitor_id, surface,
    referrer_url, referrer_domain, landing_page_url,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    fbclid, fbc, fbp, gclid, gbraid, wbraid, ttclid, msclkid,
    channel, device_type, page_views
  ) VALUES (
    v_studio, left(p_session_token, 64), p_visitor_id, left(p_surface, 32),
    left(p_referrer_url, 1000), left(v_ref_host, 255), left(p_landing_page_url, 1000),
    left(p_utm->>'source', 200), left(p_utm->>'medium', 200), left(p_utm->>'campaign', 200),
    left(p_utm->>'content', 200), left(p_utm->>'term', 200),
    left(p_click_ids->>'fbclid', 500), left(p_click_ids->>'fbc', 500), left(p_click_ids->>'fbp', 500),
    left(p_click_ids->>'gclid', 500), left(p_click_ids->>'gbraid', 500), left(p_click_ids->>'wbraid', 500),
    left(p_click_ids->>'ttclid', 500), left(p_click_ids->>'msclkid', 500),
    left(p_channel, 32), left(p_device_type, 16), 1
  )
  -- One row per (studio, visitor, session token), atomically: a refresh or
  -- two overlapping page loads in the same session count page views on one
  -- row instead of creating a second visit.
  -- Two page views of one visit can arrive out of order: if the row was
  -- created by an untagged view and this request carries the campaign tags
  -- the visit started with, adopt them (and that landing page, referrer and
  -- channel) instead of losing them. Tags already on the row never change.
  ON CONFLICT (studio_id, visitor_id, session_token)
    DO UPDATE SET page_views = analytics_sessions.page_views + 1,
      referrer_url = CASE WHEN ((EXCLUDED.utm_source IS NOT NULL OR EXCLUDED.utm_medium IS NOT NULL OR EXCLUDED.utm_campaign IS NOT NULL OR EXCLUDED.utm_content IS NOT NULL OR EXCLUDED.utm_term IS NOT NULL OR EXCLUDED.fbclid IS NOT NULL OR EXCLUDED.gclid IS NOT NULL OR EXCLUDED.gbraid IS NOT NULL OR EXCLUDED.wbraid IS NOT NULL OR EXCLUDED.ttclid IS NOT NULL OR EXCLUDED.msclkid IS NOT NULL) AND (analytics_sessions.utm_source IS NULL AND analytics_sessions.utm_medium IS NULL AND analytics_sessions.utm_campaign IS NULL AND analytics_sessions.utm_content IS NULL AND analytics_sessions.utm_term IS NULL AND analytics_sessions.fbclid IS NULL AND analytics_sessions.gclid IS NULL AND analytics_sessions.gbraid IS NULL AND analytics_sessions.wbraid IS NULL AND analytics_sessions.ttclid IS NULL AND analytics_sessions.msclkid IS NULL)) THEN EXCLUDED.referrer_url ELSE analytics_sessions.referrer_url END,
      referrer_domain = CASE WHEN ((EXCLUDED.utm_source IS NOT NULL OR EXCLUDED.utm_medium IS NOT NULL OR EXCLUDED.utm_campaign IS NOT NULL OR EXCLUDED.utm_content IS NOT NULL OR EXCLUDED.utm_term IS NOT NULL OR EXCLUDED.fbclid IS NOT NULL OR EXCLUDED.gclid IS NOT NULL OR EXCLUDED.gbraid IS NOT NULL OR EXCLUDED.wbraid IS NOT NULL OR EXCLUDED.ttclid IS NOT NULL OR EXCLUDED.msclkid IS NOT NULL) AND (analytics_sessions.utm_source IS NULL AND analytics_sessions.utm_medium IS NULL AND analytics_sessions.utm_campaign IS NULL AND analytics_sessions.utm_content IS NULL AND analytics_sessions.utm_term IS NULL AND analytics_sessions.fbclid IS NULL AND analytics_sessions.gclid IS NULL AND analytics_sessions.gbraid IS NULL AND analytics_sessions.wbraid IS NULL AND analytics_sessions.ttclid IS NULL AND analytics_sessions.msclkid IS NULL)) THEN EXCLUDED.referrer_domain ELSE analytics_sessions.referrer_domain END,
      landing_page_url = CASE WHEN ((EXCLUDED.utm_source IS NOT NULL OR EXCLUDED.utm_medium IS NOT NULL OR EXCLUDED.utm_campaign IS NOT NULL OR EXCLUDED.utm_content IS NOT NULL OR EXCLUDED.utm_term IS NOT NULL OR EXCLUDED.fbclid IS NOT NULL OR EXCLUDED.gclid IS NOT NULL OR EXCLUDED.gbraid IS NOT NULL OR EXCLUDED.wbraid IS NOT NULL OR EXCLUDED.ttclid IS NOT NULL OR EXCLUDED.msclkid IS NOT NULL) AND (analytics_sessions.utm_source IS NULL AND analytics_sessions.utm_medium IS NULL AND analytics_sessions.utm_campaign IS NULL AND analytics_sessions.utm_content IS NULL AND analytics_sessions.utm_term IS NULL AND analytics_sessions.fbclid IS NULL AND analytics_sessions.gclid IS NULL AND analytics_sessions.gbraid IS NULL AND analytics_sessions.wbraid IS NULL AND analytics_sessions.ttclid IS NULL AND analytics_sessions.msclkid IS NULL)) THEN EXCLUDED.landing_page_url ELSE analytics_sessions.landing_page_url END,
      utm_source = CASE WHEN ((EXCLUDED.utm_source IS NOT NULL OR EXCLUDED.utm_medium IS NOT NULL OR EXCLUDED.utm_campaign IS NOT NULL OR EXCLUDED.utm_content IS NOT NULL OR EXCLUDED.utm_term IS NOT NULL OR EXCLUDED.fbclid IS NOT NULL OR EXCLUDED.gclid IS NOT NULL OR EXCLUDED.gbraid IS NOT NULL OR EXCLUDED.wbraid IS NOT NULL OR EXCLUDED.ttclid IS NOT NULL OR EXCLUDED.msclkid IS NOT NULL) AND (analytics_sessions.utm_source IS NULL AND analytics_sessions.utm_medium IS NULL AND analytics_sessions.utm_campaign IS NULL AND analytics_sessions.utm_content IS NULL AND analytics_sessions.utm_term IS NULL AND analytics_sessions.fbclid IS NULL AND analytics_sessions.gclid IS NULL AND analytics_sessions.gbraid IS NULL AND analytics_sessions.wbraid IS NULL AND analytics_sessions.ttclid IS NULL AND analytics_sessions.msclkid IS NULL)) THEN EXCLUDED.utm_source ELSE analytics_sessions.utm_source END,
      utm_medium = CASE WHEN ((EXCLUDED.utm_source IS NOT NULL OR EXCLUDED.utm_medium IS NOT NULL OR EXCLUDED.utm_campaign IS NOT NULL OR EXCLUDED.utm_content IS NOT NULL OR EXCLUDED.utm_term IS NOT NULL OR EXCLUDED.fbclid IS NOT NULL OR EXCLUDED.gclid IS NOT NULL OR EXCLUDED.gbraid IS NOT NULL OR EXCLUDED.wbraid IS NOT NULL OR EXCLUDED.ttclid IS NOT NULL OR EXCLUDED.msclkid IS NOT NULL) AND (analytics_sessions.utm_source IS NULL AND analytics_sessions.utm_medium IS NULL AND analytics_sessions.utm_campaign IS NULL AND analytics_sessions.utm_content IS NULL AND analytics_sessions.utm_term IS NULL AND analytics_sessions.fbclid IS NULL AND analytics_sessions.gclid IS NULL AND analytics_sessions.gbraid IS NULL AND analytics_sessions.wbraid IS NULL AND analytics_sessions.ttclid IS NULL AND analytics_sessions.msclkid IS NULL)) THEN EXCLUDED.utm_medium ELSE analytics_sessions.utm_medium END,
      utm_campaign = CASE WHEN ((EXCLUDED.utm_source IS NOT NULL OR EXCLUDED.utm_medium IS NOT NULL OR EXCLUDED.utm_campaign IS NOT NULL OR EXCLUDED.utm_content IS NOT NULL OR EXCLUDED.utm_term IS NOT NULL OR EXCLUDED.fbclid IS NOT NULL OR EXCLUDED.gclid IS NOT NULL OR EXCLUDED.gbraid IS NOT NULL OR EXCLUDED.wbraid IS NOT NULL OR EXCLUDED.ttclid IS NOT NULL OR EXCLUDED.msclkid IS NOT NULL) AND (analytics_sessions.utm_source IS NULL AND analytics_sessions.utm_medium IS NULL AND analytics_sessions.utm_campaign IS NULL AND analytics_sessions.utm_content IS NULL AND analytics_sessions.utm_term IS NULL AND analytics_sessions.fbclid IS NULL AND analytics_sessions.gclid IS NULL AND analytics_sessions.gbraid IS NULL AND analytics_sessions.wbraid IS NULL AND analytics_sessions.ttclid IS NULL AND analytics_sessions.msclkid IS NULL)) THEN EXCLUDED.utm_campaign ELSE analytics_sessions.utm_campaign END,
      utm_content = CASE WHEN ((EXCLUDED.utm_source IS NOT NULL OR EXCLUDED.utm_medium IS NOT NULL OR EXCLUDED.utm_campaign IS NOT NULL OR EXCLUDED.utm_content IS NOT NULL OR EXCLUDED.utm_term IS NOT NULL OR EXCLUDED.fbclid IS NOT NULL OR EXCLUDED.gclid IS NOT NULL OR EXCLUDED.gbraid IS NOT NULL OR EXCLUDED.wbraid IS NOT NULL OR EXCLUDED.ttclid IS NOT NULL OR EXCLUDED.msclkid IS NOT NULL) AND (analytics_sessions.utm_source IS NULL AND analytics_sessions.utm_medium IS NULL AND analytics_sessions.utm_campaign IS NULL AND analytics_sessions.utm_content IS NULL AND analytics_sessions.utm_term IS NULL AND analytics_sessions.fbclid IS NULL AND analytics_sessions.gclid IS NULL AND analytics_sessions.gbraid IS NULL AND analytics_sessions.wbraid IS NULL AND analytics_sessions.ttclid IS NULL AND analytics_sessions.msclkid IS NULL)) THEN EXCLUDED.utm_content ELSE analytics_sessions.utm_content END,
      utm_term = CASE WHEN ((EXCLUDED.utm_source IS NOT NULL OR EXCLUDED.utm_medium IS NOT NULL OR EXCLUDED.utm_campaign IS NOT NULL OR EXCLUDED.utm_content IS NOT NULL OR EXCLUDED.utm_term IS NOT NULL OR EXCLUDED.fbclid IS NOT NULL OR EXCLUDED.gclid IS NOT NULL OR EXCLUDED.gbraid IS NOT NULL OR EXCLUDED.wbraid IS NOT NULL OR EXCLUDED.ttclid IS NOT NULL OR EXCLUDED.msclkid IS NOT NULL) AND (analytics_sessions.utm_source IS NULL AND analytics_sessions.utm_medium IS NULL AND analytics_sessions.utm_campaign IS NULL AND analytics_sessions.utm_content IS NULL AND analytics_sessions.utm_term IS NULL AND analytics_sessions.fbclid IS NULL AND analytics_sessions.gclid IS NULL AND analytics_sessions.gbraid IS NULL AND analytics_sessions.wbraid IS NULL AND analytics_sessions.ttclid IS NULL AND analytics_sessions.msclkid IS NULL)) THEN EXCLUDED.utm_term ELSE analytics_sessions.utm_term END,
      fbclid = CASE WHEN ((EXCLUDED.utm_source IS NOT NULL OR EXCLUDED.utm_medium IS NOT NULL OR EXCLUDED.utm_campaign IS NOT NULL OR EXCLUDED.utm_content IS NOT NULL OR EXCLUDED.utm_term IS NOT NULL OR EXCLUDED.fbclid IS NOT NULL OR EXCLUDED.gclid IS NOT NULL OR EXCLUDED.gbraid IS NOT NULL OR EXCLUDED.wbraid IS NOT NULL OR EXCLUDED.ttclid IS NOT NULL OR EXCLUDED.msclkid IS NOT NULL) AND (analytics_sessions.utm_source IS NULL AND analytics_sessions.utm_medium IS NULL AND analytics_sessions.utm_campaign IS NULL AND analytics_sessions.utm_content IS NULL AND analytics_sessions.utm_term IS NULL AND analytics_sessions.fbclid IS NULL AND analytics_sessions.gclid IS NULL AND analytics_sessions.gbraid IS NULL AND analytics_sessions.wbraid IS NULL AND analytics_sessions.ttclid IS NULL AND analytics_sessions.msclkid IS NULL)) THEN EXCLUDED.fbclid ELSE analytics_sessions.fbclid END,
      fbc = CASE WHEN ((EXCLUDED.utm_source IS NOT NULL OR EXCLUDED.utm_medium IS NOT NULL OR EXCLUDED.utm_campaign IS NOT NULL OR EXCLUDED.utm_content IS NOT NULL OR EXCLUDED.utm_term IS NOT NULL OR EXCLUDED.fbclid IS NOT NULL OR EXCLUDED.gclid IS NOT NULL OR EXCLUDED.gbraid IS NOT NULL OR EXCLUDED.wbraid IS NOT NULL OR EXCLUDED.ttclid IS NOT NULL OR EXCLUDED.msclkid IS NOT NULL) AND (analytics_sessions.utm_source IS NULL AND analytics_sessions.utm_medium IS NULL AND analytics_sessions.utm_campaign IS NULL AND analytics_sessions.utm_content IS NULL AND analytics_sessions.utm_term IS NULL AND analytics_sessions.fbclid IS NULL AND analytics_sessions.gclid IS NULL AND analytics_sessions.gbraid IS NULL AND analytics_sessions.wbraid IS NULL AND analytics_sessions.ttclid IS NULL AND analytics_sessions.msclkid IS NULL)) THEN EXCLUDED.fbc ELSE analytics_sessions.fbc END,
      fbp = CASE WHEN ((EXCLUDED.utm_source IS NOT NULL OR EXCLUDED.utm_medium IS NOT NULL OR EXCLUDED.utm_campaign IS NOT NULL OR EXCLUDED.utm_content IS NOT NULL OR EXCLUDED.utm_term IS NOT NULL OR EXCLUDED.fbclid IS NOT NULL OR EXCLUDED.gclid IS NOT NULL OR EXCLUDED.gbraid IS NOT NULL OR EXCLUDED.wbraid IS NOT NULL OR EXCLUDED.ttclid IS NOT NULL OR EXCLUDED.msclkid IS NOT NULL) AND (analytics_sessions.utm_source IS NULL AND analytics_sessions.utm_medium IS NULL AND analytics_sessions.utm_campaign IS NULL AND analytics_sessions.utm_content IS NULL AND analytics_sessions.utm_term IS NULL AND analytics_sessions.fbclid IS NULL AND analytics_sessions.gclid IS NULL AND analytics_sessions.gbraid IS NULL AND analytics_sessions.wbraid IS NULL AND analytics_sessions.ttclid IS NULL AND analytics_sessions.msclkid IS NULL)) THEN EXCLUDED.fbp ELSE analytics_sessions.fbp END,
      gclid = CASE WHEN ((EXCLUDED.utm_source IS NOT NULL OR EXCLUDED.utm_medium IS NOT NULL OR EXCLUDED.utm_campaign IS NOT NULL OR EXCLUDED.utm_content IS NOT NULL OR EXCLUDED.utm_term IS NOT NULL OR EXCLUDED.fbclid IS NOT NULL OR EXCLUDED.gclid IS NOT NULL OR EXCLUDED.gbraid IS NOT NULL OR EXCLUDED.wbraid IS NOT NULL OR EXCLUDED.ttclid IS NOT NULL OR EXCLUDED.msclkid IS NOT NULL) AND (analytics_sessions.utm_source IS NULL AND analytics_sessions.utm_medium IS NULL AND analytics_sessions.utm_campaign IS NULL AND analytics_sessions.utm_content IS NULL AND analytics_sessions.utm_term IS NULL AND analytics_sessions.fbclid IS NULL AND analytics_sessions.gclid IS NULL AND analytics_sessions.gbraid IS NULL AND analytics_sessions.wbraid IS NULL AND analytics_sessions.ttclid IS NULL AND analytics_sessions.msclkid IS NULL)) THEN EXCLUDED.gclid ELSE analytics_sessions.gclid END,
      gbraid = CASE WHEN ((EXCLUDED.utm_source IS NOT NULL OR EXCLUDED.utm_medium IS NOT NULL OR EXCLUDED.utm_campaign IS NOT NULL OR EXCLUDED.utm_content IS NOT NULL OR EXCLUDED.utm_term IS NOT NULL OR EXCLUDED.fbclid IS NOT NULL OR EXCLUDED.gclid IS NOT NULL OR EXCLUDED.gbraid IS NOT NULL OR EXCLUDED.wbraid IS NOT NULL OR EXCLUDED.ttclid IS NOT NULL OR EXCLUDED.msclkid IS NOT NULL) AND (analytics_sessions.utm_source IS NULL AND analytics_sessions.utm_medium IS NULL AND analytics_sessions.utm_campaign IS NULL AND analytics_sessions.utm_content IS NULL AND analytics_sessions.utm_term IS NULL AND analytics_sessions.fbclid IS NULL AND analytics_sessions.gclid IS NULL AND analytics_sessions.gbraid IS NULL AND analytics_sessions.wbraid IS NULL AND analytics_sessions.ttclid IS NULL AND analytics_sessions.msclkid IS NULL)) THEN EXCLUDED.gbraid ELSE analytics_sessions.gbraid END,
      wbraid = CASE WHEN ((EXCLUDED.utm_source IS NOT NULL OR EXCLUDED.utm_medium IS NOT NULL OR EXCLUDED.utm_campaign IS NOT NULL OR EXCLUDED.utm_content IS NOT NULL OR EXCLUDED.utm_term IS NOT NULL OR EXCLUDED.fbclid IS NOT NULL OR EXCLUDED.gclid IS NOT NULL OR EXCLUDED.gbraid IS NOT NULL OR EXCLUDED.wbraid IS NOT NULL OR EXCLUDED.ttclid IS NOT NULL OR EXCLUDED.msclkid IS NOT NULL) AND (analytics_sessions.utm_source IS NULL AND analytics_sessions.utm_medium IS NULL AND analytics_sessions.utm_campaign IS NULL AND analytics_sessions.utm_content IS NULL AND analytics_sessions.utm_term IS NULL AND analytics_sessions.fbclid IS NULL AND analytics_sessions.gclid IS NULL AND analytics_sessions.gbraid IS NULL AND analytics_sessions.wbraid IS NULL AND analytics_sessions.ttclid IS NULL AND analytics_sessions.msclkid IS NULL)) THEN EXCLUDED.wbraid ELSE analytics_sessions.wbraid END,
      ttclid = CASE WHEN ((EXCLUDED.utm_source IS NOT NULL OR EXCLUDED.utm_medium IS NOT NULL OR EXCLUDED.utm_campaign IS NOT NULL OR EXCLUDED.utm_content IS NOT NULL OR EXCLUDED.utm_term IS NOT NULL OR EXCLUDED.fbclid IS NOT NULL OR EXCLUDED.gclid IS NOT NULL OR EXCLUDED.gbraid IS NOT NULL OR EXCLUDED.wbraid IS NOT NULL OR EXCLUDED.ttclid IS NOT NULL OR EXCLUDED.msclkid IS NOT NULL) AND (analytics_sessions.utm_source IS NULL AND analytics_sessions.utm_medium IS NULL AND analytics_sessions.utm_campaign IS NULL AND analytics_sessions.utm_content IS NULL AND analytics_sessions.utm_term IS NULL AND analytics_sessions.fbclid IS NULL AND analytics_sessions.gclid IS NULL AND analytics_sessions.gbraid IS NULL AND analytics_sessions.wbraid IS NULL AND analytics_sessions.ttclid IS NULL AND analytics_sessions.msclkid IS NULL)) THEN EXCLUDED.ttclid ELSE analytics_sessions.ttclid END,
      msclkid = CASE WHEN ((EXCLUDED.utm_source IS NOT NULL OR EXCLUDED.utm_medium IS NOT NULL OR EXCLUDED.utm_campaign IS NOT NULL OR EXCLUDED.utm_content IS NOT NULL OR EXCLUDED.utm_term IS NOT NULL OR EXCLUDED.fbclid IS NOT NULL OR EXCLUDED.gclid IS NOT NULL OR EXCLUDED.gbraid IS NOT NULL OR EXCLUDED.wbraid IS NOT NULL OR EXCLUDED.ttclid IS NOT NULL OR EXCLUDED.msclkid IS NOT NULL) AND (analytics_sessions.utm_source IS NULL AND analytics_sessions.utm_medium IS NULL AND analytics_sessions.utm_campaign IS NULL AND analytics_sessions.utm_content IS NULL AND analytics_sessions.utm_term IS NULL AND analytics_sessions.fbclid IS NULL AND analytics_sessions.gclid IS NULL AND analytics_sessions.gbraid IS NULL AND analytics_sessions.wbraid IS NULL AND analytics_sessions.ttclid IS NULL AND analytics_sessions.msclkid IS NULL)) THEN EXCLUDED.msclkid ELSE analytics_sessions.msclkid END,
      channel = CASE WHEN ((EXCLUDED.utm_source IS NOT NULL OR EXCLUDED.utm_medium IS NOT NULL OR EXCLUDED.utm_campaign IS NOT NULL OR EXCLUDED.utm_content IS NOT NULL OR EXCLUDED.utm_term IS NOT NULL OR EXCLUDED.fbclid IS NOT NULL OR EXCLUDED.gclid IS NOT NULL OR EXCLUDED.gbraid IS NOT NULL OR EXCLUDED.wbraid IS NOT NULL OR EXCLUDED.ttclid IS NOT NULL OR EXCLUDED.msclkid IS NOT NULL) AND (analytics_sessions.utm_source IS NULL AND analytics_sessions.utm_medium IS NULL AND analytics_sessions.utm_campaign IS NULL AND analytics_sessions.utm_content IS NULL AND analytics_sessions.utm_term IS NULL AND analytics_sessions.fbclid IS NULL AND analytics_sessions.gclid IS NULL AND analytics_sessions.gbraid IS NULL AND analytics_sessions.wbraid IS NULL AND analytics_sessions.ttclid IS NULL AND analytics_sessions.msclkid IS NULL)) THEN EXCLUDED.channel ELSE analytics_sessions.channel END
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION record_session(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_session(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT) TO service_role;

-- Owner screens need the switch: get_my_studio gains page_live (return type
-- changes, so drop and recreate with the same grants).
DROP FUNCTION IF EXISTS get_my_studio();
CREATE FUNCTION get_my_studio()
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
  staff_role user_role,
  page_live BOOLEAN
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
    ss.role,
    s.page_live
  FROM studio_staff ss
  JOIN studios s ON s.id = ss.studio_id
  WHERE ss.profile_id = auth.uid()
    AND ss.is_active = TRUE
  ORDER BY ss.created_at ASC
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION get_my_studio() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_my_studio() TO authenticated;

-- discover_classes is unchanged: it still requires discoverable, and the
-- trigger above guarantees a listed studio has a live page.
COMMIT;
