-- 00034: explicit policy for profile_visitors.
--
-- 00024 (attribution foundation) enabled RLS on profile_visitors with no policy,
-- on purpose: only service-role functions touch it. An explicit deny-all policy
-- says the same thing out loud and keeps the "every RLS table has a policy"
-- test (SEC-07) meaningful. Clients still read and write nothing here.
DROP POLICY IF EXISTS "No client access to profile_visitors" ON profile_visitors;
CREATE POLICY "No client access to profile_visitors" ON profile_visitors
  FOR ALL USING (false) WITH CHECK (false);
