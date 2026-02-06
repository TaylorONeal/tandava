# Developer Setup Guide

## Prerequisites

- Node.js 18+ (or Bun)
- A Supabase account (free tier works)
- (Optional) Stripe account for payment features
- (Optional) Sentry account for error monitoring

## Quick Start

```bash
# 1. Clone and install
git clone <your-fork-url>
cd tandava
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values (see sections below)

# 3. Set up Supabase database
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push

# 4. Start development server
npm run dev
# → http://localhost:8080
```

## Environment Variables

### Required: Supabase

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project (or use existing)
3. Go to **Project Settings → API**
4. Copy the values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

### Required: Database Migration

Run the initial schema migration:

```bash
npx supabase db push
```

This creates all tables, enums, RLS policies, triggers, and indexes defined in `supabase/migrations/001_initial_schema.sql`.

### Optional: Stripe

See [stripe-setup.md](./stripe-setup.md) for full instructions.

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Server-side keys are set as Supabase secrets:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### Optional: Email Provider

Email is configured in Supabase Edge Functions. Set secrets:

```bash
# Choose one provider
supabase secrets set EMAIL_PROVIDER=resend
supabase secrets set RESEND_API_KEY=re_...

# Or for SendGrid
supabase secrets set EMAIL_PROVIDER=sendgrid
supabase secrets set SENDGRID_API_KEY=SG....

# Or for generic SMTP (AWS SES, Mailgun, etc.)
supabase secrets set EMAIL_PROVIDER=smtp
supabase secrets set SMTP_RELAY_URL=https://...

# Common
supabase secrets set EMAIL_FROM=noreply@yourstudio.com
supabase secrets set EMAIL_FROM_NAME="Your Studio Name"
```

### Optional: Sentry

```env
VITE_SENTRY_DSN=https://...@sentry.io/...
```

When the DSN is not set, Sentry is completely disabled — no code runs, no network requests.

### Optional: Application

```env
VITE_APP_URL=https://yourstudio.com
VITE_APP_NAME=Your Studio Name
```

## Project Structure

```
tandava/
├── src/
│   ├── main.tsx                 # Entry point (Sentry init)
│   ├── App.tsx                  # Routes + providers
│   ├── contexts/
│   │   └── AuthContext.tsx       # Supabase auth + role/permissions
│   ├── components/
│   │   ├── auth/                # ProtectedRoute, AuthCallback
│   │   ├── contact/             # ContactForm (unified messaging)
│   │   ├── layout/              # AppLayout, AdminLayout, ManageLayout, StaffLayout
│   │   ├── seo/                 # SEOHead (react-helmet-async wrapper)
│   │   └── ui/                  # shadcn/ui components (60+)
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   ├── stripe.ts            # Stripe.js + checkout/portal helpers
│   │   ├── sentry.ts            # Sentry initialization
│   │   ├── structured-data.ts   # JSON-LD schema generators
│   │   └── utils.ts             # Tailwind cn() utility
│   ├── types/
│   │   ├── database.ts          # Supabase Database type definitions
│   │   └── roles.ts             # Role/permission system
│   ├── pages/
│   │   ├── admin/               # Platform admin (6 pages)
│   │   ├── manage/              # Studio management (5 pages)
│   │   ├── staff/               # Front desk (2 pages)
│   │   └── auth/                # Login, Register
│   └── hooks/
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       ├── email/               # Email provider + templates
│       └── stripe-webhook/      # Stripe webhook handler
├── scripts/
│   └── generate-sitemap.ts      # Build-time sitemap generation
├── docs/
│   ├── prd/                     # Product requirements
│   ├── developer/               # Developer documentation
│   └── studio-manager/          # Studio owner documentation
└── public/
    ├── robots.txt
    └── favicon.ico
```

## Key Architecture Decisions

### Demo Mode
When Supabase credentials are not configured, the app runs in **demo mode** with mock data. This allows designers and developers to work on the UI without a backend.

### Role System
Three-tier admin model with distinct route prefixes:
- `/admin/*` — Platform admin (manages the instance)
- `/manage/*` — Studio owner/manager (manages their studio)
- `/staff/*` — Front desk (day-of operations)

Permissions are defined in `src/types/roles.ts` and enforced via `<ProtectedRoute>`.

### Email Provider Abstraction
The email system uses a provider interface pattern. Swap providers by changing one environment variable — no code changes needed. See `supabase/functions/email/provider.ts`.

### Stripe Connect (Standard)
Each studio connects their own Stripe account via OAuth. The platform doesn't handle money directly — Stripe routes payments to the studio's account.

## Build & Deploy

```bash
# Production build
npm run build

# Preview production build locally
npm run preview

# Generate sitemap (after build)
npx tsx scripts/generate-sitemap.ts
```

The `dist/` directory is a static site — deploy to:
- Cloudflare Pages
- Vercel (static mode)
- Netlify
- Any nginx/Apache server
- GitHub Pages

No Node.js server runtime is needed in production.

## Database Type Generation

After changing the schema, regenerate TypeScript types:

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```

Or manually update `src/types/database.ts` to match your migration.
