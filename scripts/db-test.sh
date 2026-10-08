#!/usr/bin/env bash
# Fresh throwaway DB -> Supabase role stubs -> every migration in order -> SQL tests.
# Works on any plain Postgres 14+ (CI service container or local). Never touches the
# database named in ADMIN_URL except to create/drop `tandava_test`.
#
#   ADMIN_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres npm run test:db
set -euo pipefail
cd "$(dirname "$0")/.."

ADMIN_URL="${ADMIN_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"
TEST_DB="tandava_test"
TEST_URL="${ADMIN_URL%/*}/${TEST_DB}"

psql "$ADMIN_URL" -q -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${TEST_DB}" -c "CREATE DATABASE ${TEST_DB}"
psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f supabase/tests/support/supabase_stub.sql >/dev/null

for f in $(ls supabase/migrations/*.sql | sort); do
  if ! out=$(psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f "$f" 2>&1); then
    echo "MIGRATION FAILED: $(basename "$f")"; echo "$out" | head -8; exit 1
  fi
  echo "ok  $(basename "$f")"
done

DATABASE_URL="$TEST_URL" ./supabase/tests/run.sh
