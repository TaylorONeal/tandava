\i helpers.sql
-- Booking page live (LIVE-*), 00038: a studio's own page works without a
-- Discover listing; a studio whose page is off stays invisible everywhere.
-- Fixtures: Studio A listed (so its page is live), Hidden C not listed.

DO $$
DECLARE sf jsonb; n int; v boolean;
BEGIN
  -- LIVE-01: page off, not listed: storefront, schedule and class lookup are empty for anon.
  PERFORM pg_temp.as_anon();
  sf := get_studio_storefront('hidden-c');
  SELECT count(*) INTO n FROM get_public_schedule('hidden-c');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(sf IS NULL AND n = 0, 'LIVE-01', 'page off: no storefront, no schedule');
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM get_public_occurrence('hidden-c', 'cccccccc-3000-0000-0000-000000000001');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'LIVE-02', 'page off: guest booking lookup finds nothing');

  -- LIVE-03: page on, still not listed: page and booking work, Discover does not show it.
  UPDATE studios SET page_live = TRUE WHERE id = 'cccccccc-0000-0000-0000-000000000003';
  PERFORM pg_temp.as_anon();
  sf := get_studio_storefront('hidden-c');
  SELECT count(*) INTO n FROM get_public_schedule('hidden-c');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(sf IS NOT NULL AND n >= 1, 'LIVE-03', 'page on: storefront and schedule served');
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM get_public_occurrence('hidden-c', 'cccccccc-3000-0000-0000-000000000001');
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 1, 'LIVE-04', 'page on: guest booking lookup finds the class');
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM discover_classes() WHERE studio_slug = 'hidden-c';
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'LIVE-05', 'page on but unlisted: not in Discover');

  -- LIVE-06: listing a studio publishes its page.
  UPDATE studios SET page_live = FALSE, discoverable = FALSE WHERE id = 'cccccccc-0000-0000-0000-000000000003';
  UPDATE studios SET discoverable = TRUE WHERE id = 'cccccccc-0000-0000-0000-000000000003';
  SELECT page_live INTO v FROM studios WHERE id = 'cccccccc-0000-0000-0000-000000000003';
  PERFORM pg_temp.ok(v, 'LIVE-06', 'listing turns the page on');

  -- LIVE-07: taking a listed page down also unlists it, and it disappears everywhere.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  UPDATE studios SET page_live = FALSE WHERE id = pg_temp.id('studio_a');
  EXECUTE 'RESET ROLE';
  SELECT discoverable INTO v FROM studios WHERE id = pg_temp.id('studio_a');
  PERFORM pg_temp.as_anon();
  sf := get_studio_storefront('studio-a');
  SELECT count(*) INTO n FROM discover_classes() WHERE studio_slug = 'studio-a';
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(v = FALSE AND sf IS NULL AND n = 0, 'LIVE-07', 'page off unlists and hides the studio');

  -- LIVE-08: an owner sees their own switch through get_my_studio.
  UPDATE studios SET page_live = TRUE WHERE id = pg_temp.id('studio_a');
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  SELECT g.page_live INTO v FROM get_my_studio() g;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(v, 'LIVE-08', 'get_my_studio returns page_live');
END $$;
