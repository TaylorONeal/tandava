\i helpers.sql
-- Team audit trail (migration 00053): the server can record and hand classes back,
-- nobody can edit or delete a record, members and staff cannot write one.
BEGIN;
DO $$
DECLARE log_id uuid; msg text; n int;
BEGIN
 -- The server records a team change.
 PERFORM set_config('request.jwt.claim.role', 'service_role', true);
 EXECUTE 'SET LOCAL ROLE service_role';
 INSERT INTO audit_logs (studio_id, category, action, description, actor_id, actor_email, target_type, target_description, previous_state, new_state)
   VALUES (pg_temp.id('studio_a'), 'staff', 'staff.access_removed', 'TEST ONLY removed', pg_temp.id('staff_a'), 'owner@test.dev',
           'studio_staff', 'teacher@test.dev', '{"is_active":true}', '{"is_active":false}')
   RETURNING id INTO log_id;
 SELECT count(*) INTO n FROM audit_logs WHERE id = log_id;
 PERFORM pg_temp.ok(n = 1, 'TEAM-01', 'server writes and reads a team audit record');

 -- Nobody edits or deletes it, the server included.
 PERFORM pg_temp.expect_denied(format('UPDATE audit_logs SET description = %L WHERE id = %L', 'rewritten', log_id), 'TEAM-02');
 PERFORM pg_temp.expect_denied(format('DELETE FROM audit_logs WHERE id = %L', log_id), 'TEAM-03');

 -- Handover: the server can clear a class's teacher, and nothing else on the class.
 UPDATE class_occurrences SET teacher_id = NULL WHERE id = pg_temp.id('occ_a_open');
 PERFORM pg_temp.ok(true, 'TEAM-04', 'server can hand a class back with no teacher set');
 PERFORM pg_temp.expect_denied(format('UPDATE class_occurrences SET capacity = 1 WHERE id = %L', pg_temp.id('occ_a_open')), 'TEAM-04');
 EXECUTE 'RESET ROLE';

 -- The table owner is stopped by the trigger too: this is not only an ACL.
 msg := NULL;
 BEGIN UPDATE audit_logs SET actor_email = 'someone-else@test.dev' WHERE id = log_id;
 EXCEPTION WHEN insufficient_privilege THEN msg := 'blocked'; END;
 PERFORM pg_temp.ok(msg = 'blocked', 'TEAM-05', 'owner role cannot rewrite who made a change');
 msg := NULL;
 BEGIN DELETE FROM audit_logs WHERE id = log_id;
 EXCEPTION WHEN insufficient_privilege THEN msg := 'blocked'; END;
 PERFORM pg_temp.ok(msg = 'blocked', 'TEAM-05', 'owner role cannot delete a record');

 -- Staff and members cannot forge or alter a record.
 PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
 PERFORM pg_temp.expect_denied(format('INSERT INTO audit_logs (studio_id, category, action, description) VALUES (%L, %L, %L, %L)',
   pg_temp.id('studio_a'), 'staff', 'staff.added', 'forged'), 'TEAM-06');
 PERFORM pg_temp.expect_denied(format('DELETE FROM audit_logs WHERE id = %L', log_id), 'TEAM-06');
 EXECUTE 'RESET ROLE';
 PERFORM pg_temp.as_anon();
 PERFORM pg_temp.expect_denied('SELECT * FROM audit_logs', 'TEAM-07');
 EXECUTE 'RESET ROLE';

 -- Deleting the person keeps the record: the link clears, the email written at the time stays.
 UPDATE audit_logs SET actor_id = NULL WHERE id = log_id;
 SELECT count(*) INTO n FROM audit_logs WHERE id = log_id AND actor_id IS NULL AND actor_email = 'owner@test.dev';
 PERFORM pg_temp.ok(n = 1, 'TEAM-08', 'a cleared link keeps the record and the recorded email');
END $$;
ROLLBACK;
