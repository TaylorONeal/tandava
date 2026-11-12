#!/usr/bin/env bash
# Deploy Supabase edge functions to tandava-prod. Prompts for the access token (hidden), never stores it.
# Usage: scripts/deploy-functions.sh [project-ref]
set -euo pipefail
REF="${1:-${SUPABASE_PROJECT_REF:?pass the project ref or set SUPABASE_PROJECT_REF}}"
if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  read -r -s -p "Paste Supabase access token (hidden), then Enter: " SUPABASE_ACCESS_TOKEN; echo
  export SUPABASE_ACCESS_TOKEN
fi
cd "$(dirname "$0")/.."
SB="npx --yes supabase@latest"
# Browser and user-called functions keep JWT verification on (default).
# import-members is new on tandava-prod (the onboarding Import step calls it).
for f in stripe-checkout stripe-connect stripe-portal native-checkout native-portal onboarding email cancel-class import-members; do
  $SB functions deploy "$f" --project-ref "$REF" --use-api
done
# These are called without a Supabase JWT and check the caller themselves:
# Stripe signs the webhook; express-book serves guest bookings (JWT check is off on prod).
for f in stripe-webhook express-book; do
  $SB functions deploy "$f" --project-ref "$REF" --use-api --no-verify-jwt
done
# push and sms are left out until their providers (APNs/FCM, Twilio) are set up on prod.
echo "Deployed. Functions:"; $SB functions list --project-ref "$REF"
