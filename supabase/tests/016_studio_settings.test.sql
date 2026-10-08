\i helpers.sql
-- Studio settings (SET-*): /manage/settings writes the studios row directly
-- through RLS ("Owners and admins can update studios").

DO $$
DECLARE n int; v boolean;
BEGIN
  -- SET-01: an owner can unlist and relist their own studio.
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  UPDATE studios SET discoverable = false, express_booking_enabled = true WHERE id = pg_temp.id('studio_a');
  GET DIAGNOSTICS n = ROW_COUNT;
  EXECUTE 'RESET ROLE';
  SELECT discoverable INTO v FROM studios WHERE id = pg_temp.id('studio_a');
  PERFORM pg_temp.ok(n = 1 AND v = false, 'SET-01', 'owner updates own studio settings');

  -- SET-02: an owner of another studio changes nothing here.
  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  UPDATE studios SET name = 'hijacked' WHERE id = pg_temp.id('studio_a');
  GET DIAGNOSTICS n = ROW_COUNT;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'SET-02', 'other studio owner cannot update it');

  -- SET-03: a student cannot change a studio.
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  UPDATE studios SET discoverable = true WHERE id = pg_temp.id('studio_a');
  GET DIAGNOSTICS n = ROW_COUNT;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n = 0, 'SET-03', 'student cannot update a studio');
END $$;
