#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?A disposable test database is required}"
lock_dir=$(mktemp -d)
worker_pid=''
cleanup_lock() {
  if [ -n "$worker_pid" ]; then wait "$worker_pid" 2>/dev/null || true; fi
  rm -rf "$lock_dir"
}
trap cleanup_lock EXIT
psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 > "$lock_dir/worker.log" 2>&1 <<SQL &
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('a1000000-0000-0000-0000-0000000000a1',471));
\! touch '$lock_dir/ready'
SELECT pg_sleep(3);
COMMIT;
SQL
worker_pid=$!
for _ in $(seq 1 50); do
  [ -f "$lock_dir/ready" ] && break
  kill -0 "$worker_pid" 2>/dev/null || { cat "$lock_dir/worker.log"; exit 1; }
  sleep 0.1
done
[ -f "$lock_dir/ready" ] || { echo 'FAIL EXEC-20 worker did not acquire cutoff'; exit 1; }
psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
SET LOCAL statement_timeout='1500ms';
DO $$ DECLARE msg text; BEGIN
  PERFORM set_config('request.jwt.claim.sub','a1000000-0000-0000-0000-0000000000a1',true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  BEGIN UPDATE profiles SET first_name='must not land' WHERE id=auth.uid(); EXCEPTION WHEN OTHERS THEN msg:=SQLERRM; END;
  EXECUTE 'RESET ROLE';
  IF msg IS DISTINCT FROM 'Account operation in progress; retry' THEN RAISE EXCEPTION 'FAIL EXEC-20 unexpected result: %',msg; END IF;
  RAISE NOTICE 'PASS EXEC-20 concurrent stale writer fails fast during exclusive cutoff without row-lock deadlock';
END $$;
ROLLBACK;
SQL
wait "$worker_pid"
worker_pid=''
