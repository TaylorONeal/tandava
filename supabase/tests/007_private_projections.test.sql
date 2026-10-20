\i helpers.sql
-- Regressions for disclosures reproduced ONLY in a synthetic local database.
-- Member/Teacher/Owner all use authenticated; policies/RPCs distinguish them.
BEGIN;
UPDATE studios SET stripe_account_id = 'acct_SYNTHETIC_REVIEW_ONLY' WHERE id = pg_temp.id('studio_a');
INSERT INTO studio_staff(studio_id, profile_id, role)
VALUES(pg_temp.id('studio_a'), pg_temp.id('staff_b'), 'teacher');
INSERT INTO class_cancel_notices(studio_id, occurrence_id, person, email, message)
VALUES(pg_temp.id('studio_a'), pg_temp.id('occ_a_open'),
  '{"first_name":"Synthetic notice person"}', 'synthetic-notice@example.test', 'Synthetic notice body');
DO $$
DECLARE n integer; result jsonb;
BEGIN
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  PERFORM id, name, slug, email, phone, website, timezone, currency,
    brand_primary_color, brand_secondary_color, default_cancellation_minutes,
    late_cancel_fee_cents, no_show_fee_cents, waitlist_enabled, max_waitlist_size,
    discoverable, express_booking_enabled, page_live
    FROM studios WHERE id = pg_temp.id('studio_a');
  PERFORM pg_temp.expect_denied('SELECT stripe_account_id FROM studios', 'ACL-PRIVATE-01');
  PERFORM pg_temp.expect_denied('SELECT * FROM studios', 'ACL-PRIVATE-01');
  SELECT count(*) INTO n FROM class_cancel_notices WHERE studio_id = pg_temp.id('studio_a');
  PERFORM pg_temp.ok(n = 0, 'ACL-PRIVATE-01', 'member cannot see staff-only cancellation status rows');
  EXECUTE 'RESET ROLE';

  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  PERFORM pg_temp.expect_denied(format('SELECT class_cancel_followup(%L::uuid)', pg_temp.id('occ_a_open')), 'ACL-PRIVATE-02');
  PERFORM pg_temp.expect_denied('SELECT person FROM class_cancel_notices', 'ACL-PRIVATE-02');
  PERFORM pg_temp.expect_denied('SELECT email FROM class_cancel_notices', 'ACL-PRIVATE-02');
  PERFORM pg_temp.expect_denied('SELECT message FROM class_cancel_notices', 'ACL-PRIVATE-02');
  PERFORM pg_temp.expect_denied('SELECT last_error FROM class_cancel_notices', 'ACL-PRIVATE-02');
  PERFORM pg_temp.expect_denied('SELECT stripe_refund_id FROM refund_requests', 'ACL-PRIVATE-02');
  PERFORM pg_temp.expect_denied('SELECT amount_cents, last_error FROM refund_requests', 'ACL-PRIVATE-02');
  -- SQL equivalent of the schedule's PostgREST embedding and owed-status filters.
  -- This checks role/column permissions; it is not an HTTP PostgREST test.
  SELECT count(*) INTO n FROM class_occurrences c
    JOIN studios s ON s.id = c.studio_id
    JOIN offerings o ON o.id = c.offering_id
    JOIN class_cancel_notices n ON n.occurrence_id = c.id
    LEFT JOIN refund_requests r ON r.occurrence_id = c.id
    WHERE c.studio_id = pg_temp.id('studio_a') AND s.timezone IS NOT NULL
      AND o.name IS NOT NULL AND n.status = 'pending';
  PERFORM pg_temp.ok(n = 1, 'ACL-PRIVATE-03', 'teacher retains schedule status embedding');
  PERFORM occurrence_id FROM refund_requests WHERE studio_id = pg_temp.id('studio_a') AND status <> 'sent';
  SELECT count(*) INTO n FROM class_cancel_notices WHERE studio_id = pg_temp.id('studio_a')
    AND (status IN ('pending','sending','failed','unknown','no_email')
      OR (status IN ('sent','handled') AND refund_told = 'failed'));
  PERFORM pg_temp.ok(n = 1, 'ACL-PRIVATE-03', 'teacher retains outstanding notice filter');
  EXECUTE 'RESET ROLE';

  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  result := class_cancel_followup(pg_temp.id('occ_a_open'));
  PERFORM pg_temp.ok(result->'people'->0->>'first_name' = 'Synthetic notice person',
    'ACL-PRIVATE-04', 'owner retains authorized follow-up detail through RPC');
  PERFORM pg_temp.expect_denied('SELECT email FROM class_cancel_notices', 'ACL-PRIVATE-04');
  EXECUTE 'RESET ROLE';
END $$;
ROLLBACK;
