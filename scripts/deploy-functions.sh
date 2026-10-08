#!/usr/bin/env bash
# Deploy Supabase edge functions to tandava-prod. Prompts for the access token (hidden), never stores it.
# Usage: scripts/deploy-functions.sh [project-ref]
set -euo pipefail
REF="${1:-mkaixgjwakfufmmwembn}"
if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  read -r -s -p "Paste Supabase access token (hidden), then Enter: " SUPABASE_ACCESS_TOKEN; echo
  export SUPABASE_ACCESS_TOKEN
fi
cd "$(dirname "$0")/.."
SB="npx --yes supabase@latest"
# Browser and user-called functions keep JWT verification on (default).
for f in stripe-checkout stripe-connect stripe-portal onboarding email; do
  $SB functions deploy "$f" --project-ref "$REF" --use-api
done
# Stripe calls the webhook without a Supabase JWT; it verifies the Stripe signature itself.
$SB functions deploy stripe-webhook --project-ref "$REF" --use-api --no-verify-jwt
echo "Deployed. Functions:"; $SB functions list --project-ref "$REF"
