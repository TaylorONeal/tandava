#!/usr/bin/env bash
# Focused adapter test only: fresh local PostgreSQL, synthetic rows, no providers.
set -euo pipefail
cd "$(dirname "$0")/../.."
for command in initdb pg_ctl createdb psql node; do command -v "$command" >/dev/null; done
work="$(mktemp -d "${TMPDIR:-/tmp}/tandava-smoke-store.XXXXXX")"
port="${SMOKE_STORE_TEST_PORT:-55448}"
initdb -D "$work/data" -A trust --no-instructions > "$work/init.log"
pg_ctl -D "$work/data" -l "$work/postgres.log" -o "-h 127.0.0.1 -p $port -k $work" -w start > /dev/null
trap 'pg_ctl -D "$work/data" -m fast -w stop > /dev/null' EXIT
export PGHOST=127.0.0.1 PGPORT="$port" PGUSER="$(whoami)"
unset PGHOSTADDR PGSERVICE PGSERVICEFILE PGDATABASE
createdb tandava_smoke_store_fixture
psql -X -q -v ON_ERROR_STOP=1 -d tandava_smoke_store_fixture <<'SQL'
COMMENT ON DATABASE tandava_smoke_store_fixture IS 'tandava-stripe-smoke-disposable';
CREATE ROLE service_role NOLOGIN;
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY, profile_id uuid, stripe_checkout_session_id text,
  amount_cents integer, refunded_amount_cents integer, status text
);
CREATE TABLE public.class_packs (
  id uuid PRIMARY KEY, profile_id uuid, stripe_payment_intent_id text,
  classes_remaining integer, status text
);
INSERT INTO public.transactions VALUES
 ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000001','cs_test_first',8000,0,'completed'),
 ('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000002','cs_test_second',5000,0,'completed');
INSERT INTO public.class_packs VALUES
 ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','pi_smoke_first',5,'active'),
 ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000002','pi_smoke_second',3,'active');
SQL
SMOKE_STORE_TEST_DATABASE_URL="postgresql://$(whoami)@127.0.0.1:$port/tandava_smoke_store_fixture" \
  node --test scripts/smoke/local-store.test.mjs
printf 'Synthetic PostgreSQL logs retained in %s\n' "$work"
