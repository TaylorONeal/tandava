-- Session A of the last-spot race: books, then holds the transaction open.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-0000000000a1', true);
SELECT 'RESULT A1 ' || status FROM book_class('aaaaaaaa-3000-0000-0000-000000000001', 'class_pack', 'aaaaaaaa-5000-0000-0000-0000000000a1');
SELECT pg_sleep(3);
COMMIT;
