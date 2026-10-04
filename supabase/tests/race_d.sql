-- Session D of the last-credit race: a different class, same pack, while C is uncommitted.
SELECT pg_sleep(1);
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-0000000000a1', true);
DO $$
BEGIN
  PERFORM book_class('aaaaaaaa-3000-0000-0000-000000000001', 'class_pack', 'aaaaaaaa-5000-0000-0000-0000000000a1');
  RAISE NOTICE 'RESULT D1 booked';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'RESULT D1 rejected: %', SQLERRM;
END $$;
COMMIT;
