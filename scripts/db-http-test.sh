#!/bin/bash
set -euo pipefail
# PostgreSQL initdb/pg_ctl/createdb/psql, Python3 and an official PostgREST
# binary must already be available. This script never downloads or logs in.
repo=$(cd "$(dirname "$0")/.." && pwd)
: "${POSTGREST_BIN:?Set POSTGREST_BIN to an existing official PostgREST executable}"
[[ -x "$POSTGREST_BIN" ]] || { echo "PostgREST executable unavailable" >&2; exit 2; }
for command in initdb pg_ctl createdb psql python3; do command -v "$command" >/dev/null; done
bash "$repo/scripts/check-migration-versions.sh" "$repo/supabase/migrations"
# Disallow inherited libpq routing/auth options. Every connection is to the new
# private socket below. PostgREST starts with a clean environment as well.
unset PGSERVICE PGSERVICEFILE PGHOSTADDR PGDATABASE PGUSER PGPASSWORD PGPASSFILE PGOPTIONS
work=$(mktemp -d /tmp/tandava-http.XXXXXX)
chmod 700 "$work"
pids=()
cleanup() {
 for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true; done
 pg_ctl -D "$work/data" -m fast stop >> "$work/setup.log" 2>&1 || true
}
trap cleanup EXIT
initdb -D "$work/data" --no-locale --encoding=UTF8 > "$work/setup.log" 2>&1
mkdir "$work/pg"
pg_ctl -D "$work/data" -l "$work/server.log" -o "-k $work/pg -p 55439 -c listen_addresses='' -c unix_socket_permissions=0700" start >> "$work/setup.log" 2>&1
export PGHOST="$work/pg" PGPORT=55439
createdb tandava_http_synthetic
psql -X -d tandava_http_synthetic -q -v ON_ERROR_STOP=1 -f "$repo/supabase/tests/support/supabase_stub.sql" > "$work/migrations.log" 2>&1
for sql in "$repo"/supabase/migrations/*.sql; do
 psql -X -d tandava_http_synthetic -q -v ON_ERROR_STOP=1 -f "$sql" >> "$work/migrations.log" 2>&1
 done
psql -X -d tandava_http_synthetic -q -v ON_ERROR_STOP=1 -f "$repo/supabase/tests/fixtures.sql" >> "$work/migrations.log" 2>&1
psql -X -d tandava_http_synthetic -q -v ON_ERROR_STOP=1 -f "$repo/supabase/tests/support/http_role_fixtures.sql" >> "$work/migrations.log" 2>&1
for role in anon authenticated service_role; do
 cat > "$work/$role.conf" <<CFG
db-uri = "postgresql:///tandava_http_synthetic?host=$work/pg&port=55439"
db-anon-role = "$role"
db-schemas = "public"
db-pre-request = "http_test.set_claims"
db-config = false
db-extra-search-path = "public,extensions"
server-unix-socket = "$work/$role.sock"
server-unix-socket-mode = "600"
log-level = "error"
CFG
 env -i PATH="$PATH" "$POSTGREST_BIN" "$work/$role.conf" > "$work/$role.log" 2>&1 &
 pids+=("$!")
done
for attempt in {1..30}; do
 if [[ -S "$work/anon.sock" && -S "$work/authenticated.sock" && -S "$work/service_role.sock" ]]; then break; fi
 sleep 0.2
done
printf 'Disposable workspace: %s\n' "$work"
python3 "$repo/scripts/db-http-roles.py" "$work"
