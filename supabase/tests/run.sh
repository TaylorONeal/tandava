#!/usr/bin/env bash
# Database tests: tenant isolation, discovery, booking, and the last-spot race.
#
# Usage:
#   supabase start && supabase db reset      # applies every migration
#   ./supabase/tests/run.sh
#
# Override the target with DATABASE_URL (default: the local Supabase database).
# Needs psql and a role that may SET ROLE anon/authenticated (the local
# `postgres` user can). Fixtures use fixed UUIDs and are removed afterwards.
# Do NOT point this at a production database.
set -uo pipefail
cd "$(dirname "$0")"

DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
q() { psql "$DB_URL" -v ON_ERROR_STOP=1 -q "$@"; }

CLEAN="DELETE FROM studios WHERE id IN ('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','cccccccc-0000-0000-0000-000000000003'); DELETE FROM auth.users WHERE email LIKE '%@test.dev';"
cleanup() { q -c "$CLEAN" >/dev/null 2>&1 || true; }
trap cleanup EXIT

failed=0
for f in 010_isolation 015_baseline 020_discover 030_booking 035_booking_integrity 037_book_auto 038_seat_holds 060_payments; do
  echo "== $f"
  cleanup
  q -f fixtures.sql >/dev/null || { echo "fixtures failed"; exit 2; }
  out=$(q -f "$f.test.sql" 2>&1); rc=$?
  echo "$out" | grep -E "PASS|FAIL|INFO|ERROR" | sed -E 's/^psql:[^ ]+ //; s/^NOTICE:  //'
  [ $rc -ne 0 ] && failed=1
done

echo "== 070_attribution (scripts/db/test-attribution.sql, own fixtures, rolls back)"
cleanup
out=$(q -f ../../scripts/db/test-attribution.sql 2>&1); rc=$?
echo "$out" | grep -E "PASS|FAIL|ERROR" | sed -E 's/^psql:[^ ]+ //; s/^NOTICE:  //'
[ $rc -ne 0 ] && failed=1

echo "== 040_booking_race (two concurrent sessions, one seat)"
cleanup
q -f fixtures.sql >/dev/null || { echo "fixtures failed"; exit 2; }
( q -t -A -f race_a.sql 2>&1 | grep RESULT ) &
pid=$!
q -t -A -f race_b.sql 2>&1 | grep RESULT
wait $pid
confirmed=$(q -t -A -c "SELECT count(*) FROM bookings WHERE class_occurrence_id='aaaaaaaa-3000-0000-0000-000000000001' AND status='confirmed'")
if [ "$confirmed" = "1" ]; then echo "PASS BOOK-08  exactly one confirmed booking for the last spot"; else echo "FAIL BOOK-08  $confirmed confirmed bookings for a 1-seat class"; failed=1; fi

echo "== 050_last_credit_race (two sessions, one credit, two different classes)"
cleanup
q -f fixtures.sql >/dev/null || { echo "fixtures failed"; exit 2; }
q -c "UPDATE class_packs SET classes_remaining = 1 WHERE id = 'aaaaaaaa-5000-0000-0000-0000000000a1'" >/dev/null
( q -t -A -f race_c.sql 2>&1 | grep RESULT ) &
pid=$!
q -t -A -f race_d.sql 2>&1 | grep RESULT
wait $pid
left=$(q -t -A -c "SELECT classes_remaining FROM class_packs WHERE id = 'aaaaaaaa-5000-0000-0000-0000000000a1'")
held=$(q -t -A -c "SELECT count(*) FROM bookings WHERE profile_id = 'a1000000-0000-0000-0000-0000000000a1' AND status = 'confirmed'")
if [ "$left" = "0" ] && [ "$held" = "1" ]; then echo "PASS BOOK-15  one credit buys exactly one class (pack 0, 1 confirmed)"; else echo "FAIL BOOK-15  pack=$left confirmed=$held"; failed=1; fi

if [ $failed -ne 0 ]; then echo "RESULT: FAILED"; exit 1; fi
echo "RESULT: all database tests passed"
