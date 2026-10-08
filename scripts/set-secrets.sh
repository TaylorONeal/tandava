#!/usr/bin/env bash
# Prompts (hidden) for each secret, then sets them on the Supabase project in one call.
set -euo pipefail
REF="${1:-mkaixgjwakfufmmwembn}"
ask() { local v; read -r -s -p "$1: " v; echo >&2; printf '%s' "$v"; }
[ -n "${SUPABASE_ACCESS_TOKEN:-}" ] || export SUPABASE_ACCESS_TOKEN="$(ask 'Supabase access token')"
SK="$(ask 'Stripe secret key (sk_test_...)')"
WH="$(ask 'Stripe webhook signing secret (whsec_...)')"
RS="$(ask 'Resend API key (re_..., Enter to skip)')"
cd "$(dirname "$0")/.."
ARGS=(STRIPE_SECRET_KEY="$SK" STRIPE_WEBHOOK_SECRET="$WH" APP_URL=https://tandavastudio.com STRIPE_CONNECT_MODE=platform EMAIL_FROM=hello@tandavastudio.com EMAIL_FROM_NAME=Tandava)
[ -n "$RS" ] && ARGS+=(EMAIL_PROVIDER=resend RESEND_API_KEY="$RS")
npx --yes supabase@latest secrets set "${ARGS[@]}" --project-ref "$REF"
npx --yes supabase@latest secrets list --project-ref "$REF" | awk '{print $1,$2,$3}'
