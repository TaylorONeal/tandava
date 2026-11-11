#!/usr/bin/env bash
# Reject ambiguous Supabase migration history before opening a database.
set -euo pipefail
migration_dir="${1:-supabase/migrations}"
versions=()
for migration in "$migration_dir"/*.sql; do
  [[ -f "$migration" ]] || { echo "No SQL migrations in $migration_dir" >&2; exit 2; }
  name="${migration##*/}"
  [[ "$name" =~ ^([0-9]+)_.+\.sql$ ]] || { echo "Invalid migration filename: $name" >&2; exit 2; }
  versions+=("${BASH_REMATCH[1]}")
done
duplicates=$(printf '%s\n' "${versions[@]}" | sort | uniq -d)
[[ -z "$duplicates" ]] || { echo "Duplicate migration versions: $duplicates" >&2; exit 2; }
