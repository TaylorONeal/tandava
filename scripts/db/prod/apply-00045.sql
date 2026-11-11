-- SUPERSEDED: do not reapply 00045 after the reviewed runtime ACL correction.
-- Historical migration 00045 remains in the reset chain. This former manual
-- bundle would reopen unrelated tables/defaults and is intentionally blocked.
-- No production rollout is authorized by this repository change.
DO $$ BEGIN
  RAISE EXCEPTION '00045 manual rollout superseded; review 00046_runtime_api_privileges and obtain production approval';
END $$;
