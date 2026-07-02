# Cowork Prompt — Stand Up Hosted Tandava

Paste the block below into a **Claude Code / Cowork session that has this repo checked out and is connected to your Vercel, Supabase, and Stripe accounts** (via their MCP integrations or CLIs, and the Supabase CLI installed + logged in). It executes the [Operator Setup runbook](../OPERATOR_SETUP.md) against your accounts.

It is written to **pause for your confirmation and secrets before anything irreversible or billable** (creating projects, setting live Stripe keys, changing DNS). Have these ready: your domain registrar login (for `tandavastudio.com`), and whether you want to launch in Stripe **test** or **live** mode.

---

```text
Goal: stand up the hosted, multi-tenant Tandava service at https://tandavastudio.com, following docs/OPERATOR_SETUP.md in this repo as the source of truth. One deployment serves many studios (multi-tenant by RLS); do NOT deploy per studio. Single domain, path-based routing — no subdomains.

Work in this order, and STOP to confirm with me before any billable or hard-to-reverse action (creating cloud projects, setting live Stripe keys, changing DNS). Ask me for each secret when you need it rather than guessing.

1. Supabase
   - Create (or let me select) a Supabase project. Report the Project URL, anon key, and service_role key back to me; treat service_role as sensitive.
   - Apply all migrations in supabase/migrations (00001 through the highest number) in order via `supabase db push`.
   - Deploy every edge function: onboarding, import-members, stripe-connect, stripe-checkout, stripe-portal, stripe-webhook, email, push, sms.
   - Set Auth Site URL to https://tandavastudio.com and add redirect URL https://tandavastudio.com/** . Ask me whether to require email confirmation.

2. Stripe (ask me: test or live mode first)
   - Confirm Connect (Standard) is enabled; if not, tell me what to click.
   - Set edge-function secrets: STRIPE_SECRET_KEY, APP_URL=https://tandavastudio.com, and PLATFORM_FEE_BPS (ask me the take-rate; default 0 to start).
   - Create the webhook at https://<project-ref>.supabase.co/functions/v1/stripe-webhook for events checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed, then set STRIPE_WEBHOOK_SECRET.
   - Do NOT set SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY as secrets — the Supabase runtime injects them.

3. Vercel
   - Import this repo as a Vite project (build `npm run build`, output `dist/`).
   - Set production env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_APP_URL=https://tandavastudio.com, VITE_APP_NAME=Tandava, VITE_STRIPE_PUBLISHABLE_KEY. Leave VITE_DEMO_MODE unset.
   - Deploy, and give me the deployment URL.

4. Domain
   - Add tandavastudio.com (and www) to the Vercel project. Show me the exact DNS records or nameservers to set at my registrar and wait for me to confirm DNS is done; then verify HTTPS is live.

5. Verify end-to-end and report results:
   - Register a test account at /auth/register.
   - Complete /manage/onboarding; confirm progress persists across a refresh.
   - Run the Stripe Connect step; confirm returning marks it complete.
   - Make a test-mode payment; confirm the studio received its share and the platform application_fee landed in my account.

Give me a final summary: every URL and key (secrets redacted), what's live, and anything I still need to do manually.
```

---

After this runs, a studio owner's entire job is: visit `tandavastudio.com`, sign up, and follow the [studio owner quickstart](../studio-manager/getting-started.md).
