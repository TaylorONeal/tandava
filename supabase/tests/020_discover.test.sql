\i helpers.sql
-- Discover (DISC-*): public discover_classes() RPC.

DO $$
DECLARE n int; slugs text[]; cols text[];
BEGIN
  -- DISC-01: only future, non-cancelled classes of discoverable studios + offerings
  PERFORM pg_temp.as_anon();
  SELECT count(*), array_agg(studio_slug ORDER BY studio_slug) INTO n, slugs FROM discover_classes();
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 2 AND slugs = ARRAY['studio-a','studio-b'], 'DISC-01',
    'returns exactly the open classes of studio A and B (not hidden studio, private offering, cancelled or past): ' || COALESCE(slugs::text, 'none'));

  -- DISC-02: filters
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM discover_classes(p_style => 'yin');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 1, 'DISC-02', 'style filter yin returns one class');

  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM discover_classes(p_style => 'VINYASA');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 1, 'DISC-02', 'style filter is case-insensitive and excludes the hidden studio');

  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM discover_classes(p_city => 'austin');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 2, 'DISC-02', 'city filter is case-insensitive');

  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM discover_classes(p_city => 'Dallas');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'DISC-02', 'unknown city returns nothing');

  -- DISC-03: dates can never reach into the past
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM discover_classes(p_from => NOW() - interval '30 days');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 2, 'DISC-03', 'a past p_from still returns only upcoming classes');

  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM discover_classes(p_to => NOW() + interval '1 day');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'DISC-03', 'p_to before the first class returns nothing');

  -- DISC-04: exact public column whitelist (no ids of staff/profiles, no emails, no studio_id)
  SELECT array_agg(u.n ORDER BY u.ord) INTO cols
  FROM pg_proc p, unnest(p.proargnames, p.proargmodes) WITH ORDINALITY AS u(n, m, ord)
  WHERE p.proname = 'discover_classes' AND u.m = 't';
  PERFORM pg_temp.ok(cols = ARRAY['occurrence_id','starts_at','ends_at','offering_name','style','level','is_heated',
    'duration_minutes','drop_in_price_cents','currency','spots_left','teacher_name','location_name','city','state',
    'studio_slug','studio_name','studio_timezone','studio_primary_color'], 'DISC-04',
    'result columns are exactly the public whitelist: ' || cols::text);

  -- DISC-05: limit is clamped to at least 1
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM discover_classes(p_limit => 0);
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 1, 'DISC-05', 'p_limit 0 is clamped to 1');

  -- DISC-06: spots_left follows bookings
  PERFORM pg_temp.ok((SELECT spots_left FROM discover_classes() WHERE studio_slug = 'studio-a') = 1, 'DISC-06', 'open class shows 1 spot');
  INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status)
    VALUES (pg_temp.id('studio_a'), pg_temp.id('occ_a_open'), pg_temp.id('student_a1'), 'confirmed');
  PERFORM pg_temp.ok((SELECT spots_left FROM discover_classes() WHERE studio_slug = 'studio-a') = 0, 'DISC-06', 'full class shows 0 spots');
END $$;

DO $$
BEGIN
  -- DISC-07: anon cannot read the base tables behind the RPC directly
  PERFORM pg_temp.as_anon();
  PERFORM pg_temp.ok((SELECT count(*) FROM class_occurrences) = 0, 'DISC-07', 'anon cannot read class_occurrences directly');
  EXECUTE 'RESET ROLE';
END $$;
