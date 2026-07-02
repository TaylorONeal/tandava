# Operator Setup — Running the Hosted Tandava

This is the **one-time** setup for whoever operates the hosted service (e.g. `tandavastudio.com`) that studios sign up for. You do this **once**. After it, every studio owner just visits the URL, signs up, and completes the setup wizard — they never touch any of the below.

If instead you're a single studio deploying Tandava only for yourself, use [DEPLOYMENT.md](../DEPLOYMENT.md) — it's the same building blocks with less to configure.

> **Shortcut:** There's a paste-ready Claude Code / Cowork prompt that performs this whole runbook against your accounts — see [`docs/cowork-prompts/deploy-hosted.md`](cowork-prompts/deploy-hosted.md). Read this document first so you understand what it's doing and can supply the right secrets.

---

## The model you're standing up

- **One deployment, many studios.** Tandava is multi-tenant by row-level security (`studio_id` on every table). A single frontend + single Supabase project serve every studio; each owner's studio is resolved from their login, not from the URL. You do **not** deploy per studio.
- **Single domain, path-based routing.** `tandavastudio.com` serves everything — the product/marketing page (`/open-source`), sign-up (`/auth/register`), and each owner's admin (`/manage`). No subdomains are required. (Per-studio vanity domains like `book.theirstudio.com` are a future feature — the app has no host-based tenant routing yet.)
- **Money only from payment take-rate.** You earn a configurable percentage of the payments studios process through Stripe Connect (`PLATFORM_FEE_BPS`). No per-member or subscription billing exists or is needed. Studios' payouts go straight to their own connected Stripe accounts; you never hold their funds.

---

## What you'll need

| Thing | Why | Cost |
|---|---|---|
| A domain (you have `tandavastudio.com`) | The address studios visit | ~$12/yr |
| [Supabase](https://supabase.com) account | Database, auth, storage, edge functions | Free tier to start |
| [Vercel](https://vercel.com) account | Hosts the static frontend | Free tier to start |
| [Stripe](https://stripe.com) account | Platform account for Connect + your take-rate | Per-transaction fees only |
| [Supabase CLI](https://supabase.com/docs/guides/cli) | Run migrations + deploy edge functions | Free |

Estimated time: a couple of focused hours.

---

## Step 1 — Supabase project (database + auth + functions)

1. Create a new Supabase project. Note, from **Settings → API**:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → used by edge functions (never ship this to the frontend)
2. Link the CLI and push the schema (runs `supabase/migrations/00001…00017` in order):
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
   (Or paste each migration into **SQL Editor** in filename order.)
3. Deploy every edge function:
   ```bash
   supabase functions deploy onboarding
   supabase functions deploy import-members
   supabase functions deploy stripe-connect
   supabase functions deploy stripe-checkout
   supabase functions deploy stripe-portal
   supabase functions deploy stripe-webhook
   supabase functions deploy email
   supabase functions deploy push
   supabase functions deploy sms
   ```
4. **Auth config** (**Authentication → URL Configuration**):
   - **Site URL:** `https://tandavastudio.com`
   - **Redirect URLs:** add `https://tandavastudio.com/**`
   - Decide whether to require email confirmation (**Authentication → Providers → Email**). The signup UI already handles both: it shows a "check your email" screen when confirmation is on.
   - Optional: enable Google OAuth (the signup page offers it) and add your OAuth credentials.

> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected into edge functions automatically by the Supabase runtime — you do **not** set those as secrets.

---

## Step 2 — Stripe platform account + Connect

1. In the Stripe Dashboard, enable **Connect** (Standard accounts). This is what lets each studio link its own Stripe and receive payouts directly.
2. From **Developers → API keys**, copy your **Secret key** (`sk_live_…` or `sk_test_…` while testing).
3. Set the Stripe-related **edge function secrets** in Supabase:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
   supabase secrets set APP_URL=https://tandavastudio.com
   supabase secrets set PLATFORM_FEE_BPS=0          # your take-rate — see below
   ```
4. Create a webhook (**Developers → Webhooks**) pointing at:
   `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   Subscribe to `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Copy its signing secret:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Setting your take-rate (`PLATFORM_FEE_BPS`)

This is your entire business model, so it's worth understanding. The value is in **basis points** (1 bp = 0.01%):

| `PLATFORM_FEE_BPS` | You keep |
|---|---|
| `0` | Nothing — fully free (good for launch/growth) |
| `100` | 1% of each payment |
| `250` | 2.5% of each payment |

It's applied as a Stripe `application_fee` on every drop-in, membership, and class-pack payment (`supabase/functions/stripe-checkout/index.ts`), routed via destination charges so the studio's share lands in **their** account and your fee lands in yours — automatically, per transaction. Since the goal is to encourage growth, starting at `0` (or a low single-digit percent) and raising it later is reasonable; changing it is one `supabase secrets set` command and takes effect on the next payment.

---

## Step 3 — Deploy the frontend to Vercel

1. Import the GitHub repo into Vercel. Framework preset: **Vite**. Build command `npm run build`, output `dist/` (both are the repo defaults).
2. Set **Environment Variables** (Production):
   | Variable | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | your Supabase Project URL |
   | `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |
   | `VITE_APP_URL` | `https://tandavastudio.com` |
   | `VITE_APP_NAME` | `Tandava` |
   | `VITE_STRIPE_PUBLISHABLE_KEY` | your Stripe **publishable** key (`pk_live_…`) |
   Leave `VITE_DEMO_MODE` **unset** (or `false`) — setting it `true` turns the whole app into the mock-data demo.
3. Deploy.

---

## Step 4 — Point the domain

1. In Vercel → your project → **Settings → Domains**, add `tandavastudio.com` (and `www` if you want it).
2. At your domain registrar, follow Vercel's instructions — either change the nameservers to Vercel's, or add the `A` / `CNAME` records it shows. Vercel provisions HTTPS automatically once DNS resolves (usually minutes to an hour).

That's the only DNS anyone ever touches. Studio owners never see this.

---

## Step 5 — Verify end-to-end

Walk the exact path a studio owner will:

1. Visit `https://tandavastudio.com/auth/register` → create an account.
2. Go to `/manage/onboarding` → complete the wizard (studio, location, offerings, pricing, staff, waiver). Progress should persist across a refresh.
3. On the **Stripe** step, click Connect → you're sent to Stripe's hosted onboarding → returning marks the step complete.
4. Make a **test-mode** booking/payment and confirm in your Stripe dashboard that the studio received their share and your `application_fee` landed in the platform account.
5. Optional: run a CSV import on the **Import** step to confirm member provisioning.

If all five pass, the hosted service is live and self-serve.

---

## Optional: notifications

Email and SMS are provider-agnostic edge functions. To turn them on, set the relevant secrets (see [docs/developer/email-system.md](developer/email-system.md) and the SMS function) — e.g. `EMAIL_PROVIDER=resend` + `RESEND_API_KEY=…`, and VAPID keys for web push. The app runs fine without them; studios just won't get automated messages until they're configured.

---

## What a studio owner does after all this

Nothing on this page. They go to `tandavastudio.com`, sign up, and follow the [studio owner quickstart](studio-manager/getting-started.md). That asymmetry — hours of one-time operator setup, ~15 minutes of self-serve per studio — is the whole point of the hosted model.
