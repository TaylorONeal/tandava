-- Session B of the last-spot race: starts 1s later while A is still uncommitted.
SELECT pg_sleep(1);
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a2000000-0000-0000-0000-0000000000a2', true);
SELECT 'RESULT A2 ' || status FROM book_class('aaaaaaaa-3000-0000-0000-000000000001', 'class_pack', 'aaaaaaaa-5000-0000-0000-0000000000a2');
COMMIT;
