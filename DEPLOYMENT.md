# Deployment Guide

How to deploy Tandava for a real studio. This guide assumes you are a developer or have one.

---

## Before You Start

### Skill Level Required

You should be comfortable with:
- Git (clone, branch, pull)
- Environment variables and `.env` files
- DNS configuration (A records, CNAME)
- Reading error messages and debugging deployment issues
- Basic SQL (for verifying data and running migrations)

You don't need to be an expert, but you should not be learning these things for the first time during deployment.

### What "Production-Ready" Means Here

The frontend UI is complete and functional. The backend integration layer (Supabase schema, auth, RLS policies) is architecturally ready but has not been battle-tested under real studio load.

**What works:**
- Every page renders and is interactive
- Role-based access control is enforced
- Database schema with Row Level Security is defined
- Payment architecture (Stripe Connect Standard) is designed
- Email provider abstraction supports multiple services

**What you will need to verify yourself:**
- RLS policies cover your actual access patterns
- Stripe webhook handling works end-to-end with real money
- Email delivery is reliable with your chosen provider
- Auth flows work correctly with Supabase Auth
- Performance under your actual member/class volume

This is not a product you unbox and run. It is software you adopt, test, and operate.

---

## Required Third-Party Services

| Service | Purpose | Free Tier? | Required? |
|---------|---------|------------|-----------|
| **Supabase** | Database, auth, storage, edge functions | Yes (generous) | Yes |
| **Vercel / Netlify / Cloudflare Pages** | Static frontend hosting | Yes | Yes (pick one) |
| **Stripe** | Payment processing | N/A (per-transaction fees) | Only if accepting payments |
| **Domain + DNS** | Custom domain for your studio | ~$12/year | Recommended |
| **Email provider** | Transactional email | Varies | Only if sending notifications |

### Supabase

Supabase provides PostgreSQL, authentication, file storage, and serverless Edge Functions. Tandava uses all of these.

1. Create an account at [supabase.com](https://supabase.com)
2. Create a new project
3. Note your **Project URL** and **Anon Key** from Settings > API
4. These become `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Static Host

The built frontend is a static site (HTML + JS + CSS). It needs no server runtime. Deploy to any static host:

- **Vercel**: Connect your GitHub repo, set build command to `npm run build`, output to `dist/`
- **Netlify**: Same approach, or drag-and-drop the `dist/` folder
- **Cloudflare Pages**: Connect repo, build command `npm run build`, output `dist/`
- **Self-hosted**: Build locally, serve `dist/` with nginx or Apache

### Stripe (Optional)

Only needed if you want to accept payments. Tandava uses Stripe Connect (Standard), meaning each studio connects their own Stripe account.

See [docs/developer/stripe-setup.md](docs/developer/stripe-setup.md) for full instructions.

### Email (Optional)

Email is provider-agnostic. Set one environment variable to switch between Resend, SendGrid, SMTP, or console (dev-only) logging.

See [docs/developer/email-system.md](docs/developer/email-system.md) for setup.

---

## Environment Variables

### Frontend (set in your hosting provider or `.env.local`)

```env
# Required: Supabase connection
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key

# Optional: Stripe (only if accepting payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Optional: Sentry error monitoring
VITE_SENTRY_DSN=https://...@sentry.io/...

# Optional: Application branding
VITE_APP_URL=https://yourstudio.com
VITE_APP_NAME=Your Studio Name

# Demo mode (set to "true" ONLY for demo/preview deployments)
# VITE_DEMO_MODE=true
```

**Important:** Do NOT set `VITE_DEMO_MODE=true` in production. When set, the app uses mock data and bypasses authentication entirely.

### Backend (set as Supabase secrets)

```bash
# Stripe (if accepting payments)
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Email provider (pick one)
supabase secrets set EMAIL_PROVIDER=resend
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set EMAIL_FROM=noreply@yourstudio.com
supabase secrets set EMAIL_FROM_NAME="Your Studio Name"
```

### Where Variables Come From

| Variable | Where to get it |
|----------|----------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard > Settings > API > Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API > `anon` `public` key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard > Developers > API Keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard > Developers > API Keys (secret) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard > Developers > Webhooks > Signing secret |
| `VITE_SENTRY_DSN` | Sentry Dashboard > Project Settings > Client Keys (DSN) |
| `RESEND_API_KEY` | Resend Dashboard > API Keys |

---

## Step-by-Step Deployment

### 1. Fork and Clone

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/tandava.git
cd tandava
npm install
```

### 2. Set Up Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push the database schema (creates all tables, RLS policies, triggers)
supabase db push
```

This applies every migration in `supabase/migrations/` in order (`00001_initial_schema.sql` through the latest), creating the full schema, RLS policies, and triggers.

### 3. Configure Environment

Create `.env.local` with your Supabase credentials:

```bash
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
EOF
```

### 4. Test Locally

```bash
npm run dev
```

Verify:
- The app loads without demo mode banner
- Login/register works via Supabase Auth
- You can create your studio profile

### 5. Build and Deploy

```bash
npm run build
```

The `dist/` directory is your deployable artifact. Push to your hosting provider.

**Vercel example:**
- Connect your GitHub fork to Vercel
- Set build command: `npm run build`
- Set output directory: `dist`
- Add environment variables in Vercel dashboard
- Deploy

### 6. Configure DNS

Point your domain to your hosting provider. Each provider has its own DNS instructions.

### 7. Set Up Stripe (Optional)

If accepting payments:

1. Create a Stripe account
2. Deploy the payment Edge Functions:
   ```bash
   supabase functions deploy stripe-checkout
   supabase functions deploy stripe-portal
   supabase functions deploy stripe-webhook
   supabase functions deploy email
   supabase functions deploy import-members
   ```
   (`import-members` powers the data-migration importer; the others are for
   payments + email. All use secrets/keys set below.)
3. Configure secrets in Supabase:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   supabase secrets set APP_URL=https://your-studio.com
   ```
4. Add a webhook endpoint in the Stripe Dashboard pointing to
   `https://<project-ref>.supabase.co/functions/v1/stripe-webhook` and
   subscribe to: `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.payment_failed`. Copy its signing
   secret into `STRIPE_WEBHOOK_SECRET`.
5. Test with Stripe test mode before going live.

**Single-studio vs platform mode:** if you self-host for one studio, leave
`studios.stripe_account_id` null and the studio's own Stripe key handles
everything directly. For a multi-studio platform, set each studio's
`stripe_account_id` (Stripe Connect) and the functions automatically route
funds via destination charges, with an optional `PLATFORM_FEE_BPS` fee.

See [docs/developer/stripe-setup.md](docs/developer/stripe-setup.md) for detailed instructions.

---

## Common Failure Points

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Blank screen after deploy | `VITE_DEMO_MODE` not set and Supabase not configured | Set Supabase env vars OR set `VITE_DEMO_MODE=true` |
| Auth doesn't work | Supabase URL or anon key wrong | Double-check values from Supabase dashboard |
| RLS blocking queries | Policies not applied | Run `supabase db push` to apply migrations |
| Stripe webhooks failing | Webhook secret mismatch or wrong endpoint URL | Verify webhook URL and signing secret |
| Email not sending | Provider not configured or API key wrong | Check `EMAIL_PROVIDER` and corresponding API key |
| 404 on page refresh | Static host not configured for SPA routing | Add rewrite rule: all paths -> `/index.html` |
| Build fails | Node version mismatch | Use Node 18+ |

### SPA Routing

Tandava is a single-page application. Your hosting provider needs to serve `index.html` for all routes (not just `/`).

- **Vercel**: Handled automatically with the `vercel.json` or framework detection
- **Netlify**: Add `_redirects` file: `/* /index.html 200`
- **Nginx**: Add `try_files $uri $uri/ /index.html;`
- **Apache**: Add `.htaccess` with `FallbackResource /index.html`

---

## Updating

Since this is a fork, you pull updates from upstream:

```bash
# Add upstream remote (one time)
git remote add upstream https://github.com/TaylorONeal/tandava.git

# Fetch and merge updates
git fetch upstream
git merge upstream/main

# Resolve any conflicts, then rebuild
npm install
npm run build
```

**Before updating:**
- Read the changelog/release notes
- Check for migration notes
- Test in a staging environment first
- Back up your database

---

## What Tandava Does NOT Handle

These are your responsibility as the operator:

- **Backups**: Set up database backups in Supabase (or your own PostgreSQL)
- **Monitoring**: Set up uptime monitoring and error alerts (Sentry is pre-integrated)
- **SSL**: Your hosting provider handles this (Vercel/Netlify/Cloudflare do it automatically)
- **Scaling**: Supabase handles database scaling; frontend is static and scales infinitely
- **GDPR/Privacy**: You are the data controller; implement data deletion and export as required by your jurisdiction
- **PCI Compliance**: Stripe handles payment card data; you never touch card numbers directly

---

## Realistic Expectations

**Time to first deploy (demo mode):** 10 minutes
**Time to full production deploy:** 2-4 hours for someone comfortable with the stack
**Ongoing maintenance:** Pulling updates, monitoring errors, responding to Supabase/Stripe issues

If any of this sounds overwhelming, you need a developer partner before proceeding. That's not a limitation of the software — it's the reality of operating your own infrastructure.
