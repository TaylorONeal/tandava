#!/usr/bin/env bash
# Apply every migration in order to a fresh database and stop on the first
# error. Usage: PGHOST=… PGPORT=… PGUSER=postgres scripts/db/verify-migrations.sh
# Needs psql and a throwaway Postgres 15+. Supabase-only objects are stubbed
# by supabase-stub.sql. A pilot gate in docs/IMPLEMENTATION_HANDOFF.md.
set -euo pipefail
DB="${VERIFY_DB:-tandava_verify}"
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
psql -v ON_ERROR_STOP=1 -q -d postgres -c "DROP DATABASE IF EXISTS $DB" -c "CREATE DATABASE $DB"
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$HERE/supabase-stub.sql"
dupes=$(ls "$ROOT/supabase/migrations" | cut -d_ -f1 | sort | uniq -d)
if [ -n "$dupes" ]; then echo "Duplicate migration versions: $dupes" >&2; exit 1; fi
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "applying $(basename "$f")"
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f" >/dev/null
done
echo "all migrations applied"
