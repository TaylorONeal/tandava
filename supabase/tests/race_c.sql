-- Session C of the last-credit race: books class 1 with the pack's only credit, holds the txn open.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-0000000000a1', true);
SELECT 'RESULT C1 ' || status FROM book_class('aaaaaaaa-3000-0000-0000-000000000002', 'class_pack', 'aaaaaaaa-5000-0000-0000-0000000000a1');
SELECT pg_sleep(3);
COMMIT;
