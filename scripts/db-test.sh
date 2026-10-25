#!/usr/bin/env bash
# Fresh throwaway DB -> Supabase role stubs -> every migration in order -> SQL tests.
# Works on any plain Postgres 14+ (CI service container or local). Never touches the
# database named in ADMIN_URL except to create/drop a uniquely named test DB.
# Only loopback TCP or an explicit Unix socket is accepted.
#
#   ADMIN_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres npm run test:db
set -euo pipefail
cd "$(dirname "$0")/.."

bash scripts/check-migration-versions.sh

ADMIN_URL="${ADMIN_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"
# Do not let a copied production URL or libpq service override reach CREATE/DROP.
local_tcp='^postgres(ql)?://([^/@?#]*@)?(127\.0\.0\.1|localhost|\[::1\])(:[0-9]+)?/[a-zA-Z0-9_]+$'
local_socket='^postgres(ql)?:///([a-zA-Z0-9_]+)$'
if [[ -n "${PGSERVICE:-}" || -n "${PGHOSTADDR:-}" ]]; then
  echo "Refusing database tests with PGSERVICE or PGHOSTADDR overrides" >&2; exit 2
fi
if [[ "$ADMIN_URL" =~ $local_tcp ]]; then
  :
elif [[ "$ADMIN_URL" =~ $local_socket && "${PGHOST:-}" == /* && "$PGHOST" != *,* && -d "$PGHOST" ]]; then
  :
else
  echo "Database tests require a loopback URL (no query parameters) or an explicit local Unix socket" >&2; exit 2
fi
# Used by the runner's safety regression test; no database connection is made.
[[ "${DB_TEST_VALIDATE_ONLY:-}" == 1 ]] && exit 0
TEST_DB="tandava_test_$$_${RANDOM}"
TEST_URL="${ADMIN_URL%/*}/${TEST_DB}"
psql "$ADMIN_URL" -q -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${TEST_DB}"
cleanup_db() { psql "$ADMIN_URL" -q -v ON_ERROR_STOP=1 -c "DROP DATABASE ${TEST_DB}"; }
trap cleanup_db EXIT
psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f supabase/tests/support/supabase_stub.sql >/dev/null

for f in $(ls supabase/migrations/*.sql | sort); do
  if ! out=$(psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f "$f" 2>&1); then
    echo "MIGRATION FAILED: $(basename "$f")"; echo "$out" | head -8; exit 1
  fi
  echo "ok  $(basename "$f")"
done

DATABASE_URL="$TEST_URL" ./supabase/tests/run.sh
