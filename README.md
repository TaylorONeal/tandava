# Tandava

An open-source yoga studio booking and management platform. Tandava gives studio owners a complete system for scheduling classes, managing memberships, processing payments, and communicating with students — all self-hosted and under your control.

## What Is This?

Tandava is a **deploy-your-own-instance** application. A studio operator clones this repo, configures their environment, and deploys to any static hosting provider. There is no central SaaS — you own your data, your branding, and your deployment.

**For members**, Tandava provides class browsing, booking, on-demand video access, and self-service billing.

**For studio owners**, it provides a full management panel with scheduling, member directory, instructor management, messaging inbox, and revenue tracking.

**For developers**, it provides a modern React + TypeScript codebase with a provider-agnostic backend layer, making it straightforward to extend or swap components.

## Features

- **Class booking** — browse schedule, book drop-ins, join waitlists, get confirmation emails
- **Memberships & class packs** — recurring subscriptions and pre-paid bundles via Stripe
- **Three-tier admin model** — platform admin, studio manager, and front desk each get their own panel with appropriate permissions
- **Payment processing** — Stripe Connect (Standard) so each studio receives payments directly
- **Messaging system** — unified inbox for member messages, visitor inquiries, and class feedback with honeypot anti-spam
- **Provider-agnostic email** — swap between Resend, SendGrid, SMTP, or console with a single environment variable
- **SEO** — per-page meta tags, Open Graph, Twitter Cards, JSON-LD structured data, and build-time sitemap generation
- **Error monitoring** — optional Sentry integration (zero overhead when unconfigured)
- **Demo mode** — runs entirely without a backend using mock data, so designers and developers can work on the UI immediately
- **Backend flexibility** — abstraction layer lets you swap Supabase for raw PostgreSQL or any other backend without changing frontend code

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite 5 |
| **Styling** | Tailwind CSS 3, shadcn/ui (60+ Radix components) |
| **Routing** | React Router v6 |
| **Server State** | TanStack Query (React Query) |
| **Backend** | Supabase (PostgreSQL + Auth + Edge Functions + RLS) |
| **Payments** | Stripe Connect (Standard) |
| **Email** | Resend / SendGrid / SMTP / Console (provider-agnostic) |
| **SEO** | react-helmet-async, JSON-LD, build-time sitemap |
| **Error Monitoring** | Sentry (optional) |

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) account (free tier works)
- (Optional) [Stripe](https://stripe.com) account for payments
- (Optional) [Sentry](https://sentry.io) account for error monitoring

### Setup

```bash
# Clone the repo
git clone https://github.com/TaylorONeal/tandava.git
cd tandava

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase project URL and anon key

# Set up the database
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`.

### Running Without a Backend (Demo Mode)

If you skip the Supabase setup, the app runs in **demo mode** with mock data. This is useful for exploring the UI, making design changes, or onboarding new contributors.

```bash
npm install
npm run dev
# No .env configuration needed — demo mode activates automatically
```

## Project Structure

```
tandava/
├── src/
│   ├── main.tsx                     # Entry point (Sentry init)
│   ├── App.tsx                      # Routes + providers
│   ├── contexts/
│   │   └── AuthContext.tsx           # Auth state + role/permissions
│   ├── components/
│   │   ├── auth/                    # ProtectedRoute, AuthCallback
│   │   ├── contact/                 # ContactForm (unified messaging)
│   │   ├── layout/                  # AppLayout, AdminLayout, ManageLayout, StaffLayout
│   │   ├── seo/                     # SEOHead (react-helmet-async wrapper)
│   │   └── ui/                      # shadcn/ui components (60+)
│   ├── lib/
│   │   ├── backend/                 # Backend abstraction layer
│   │   │   ├── types.ts             # Provider interfaces
│   │   │   ├── supabase.ts          # Supabase implementation
│   │   │   └── index.ts             # Active provider export
│   │   ├── stripe.ts                # Stripe.js + checkout helpers
│   │   ├── sentry.ts                # Optional Sentry initialization
│   │   ├── structured-data.ts       # JSON-LD schema generators
│   │   └── utils.ts                 # Tailwind cn() utility
│   ├── types/
│   │   ├── database.ts              # Database table types
│   │   └── roles.ts                 # Role + permission system
│   └── pages/
│       ├── admin/                   # Platform admin (6 pages)
│       ├── manage/                  # Studio management (5 pages)
│       └── staff/                   # Front desk (2 pages)
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # Full schema with RLS policies
│   └── functions/
│       ├── email/                   # Email provider + templates
│       └── stripe-webhook/          # Stripe event handler
├── scripts/
│   └── generate-sitemap.ts          # Build-time sitemap generation
├── docs/
│   ├── prd/                         # Product requirements
│   ├── developer/                   # Developer documentation
│   └── studio-manager/              # Studio owner guides
└── public/
    └── robots.txt
```

## Three-Tier Admin Model

Tandava separates administrative access into three tiers, each with its own routes, layout, and permission set:

| Tier | Who | Routes | Purpose |
|------|-----|--------|---------|
| **Platform Admin** | Developer or operator who deployed the instance | `/admin/*` | Instance health, studio management, user management, billing configuration |
| **Studio Manager** | The person who runs the yoga studio | `/manage/*` | Class schedule, member directory, instructor management, messaging inbox, studio settings |
| **Staff (Front Desk)** | Day-of operations | `/staff/*` | Class check-in, waitlist management |

Permissions are defined in `src/types/roles.ts` and enforced at the route level via `<ProtectedRoute>`.

## Backend Flexibility

All application code interacts with the backend through a provider abstraction layer at `src/lib/backend/`. The default implementation uses Supabase, but you can swap in raw PostgreSQL, Firebase, or any custom backend by implementing three interfaces:

- **AuthProvider** — sign in, sign up, OAuth, session management
- **DataProvider** — database reads and writes
- **ApiProvider** — serverless function / API endpoint calls

To swap backends, implement the `Backend` interface and change one import in `src/lib/backend/index.ts`. See [docs/developer/backend-flexibility.md](docs/developer/backend-flexibility.md) for a detailed guide with tradeoffs and a worked example.

## Documentation

### For Developers

- [Developer Setup Guide](docs/developer/setup.md) — environment, database, project structure
- [Backend Flexibility](docs/developer/backend-flexibility.md) — Supabase vs raw Postgres, swapping providers
- [Stripe Setup](docs/developer/stripe-setup.md) — Connect configuration, webhooks, testing
- [Email System](docs/developer/email-system.md) — provider architecture, templates, adding providers
- [SEO Guide](docs/developer/seo-guide.md) — meta tags, structured data, sitemap, prerendering

### For Studio Managers

- [Getting Started](docs/studio-manager/getting-started.md) — studio setup, scheduling, team roles
- [Billing & Payments](docs/studio-manager/billing-guide.md) — Stripe, pricing options, refunds, payouts

### Product Requirements

- [Platform Overview PRD](docs/prd/platform-overview.md) — architecture, roles, feature matrix, database schema

## Build & Deploy

```bash
# Production build (includes sitemap generation)
npm run build

# Preview production build locally
npm run preview
```

The `dist/` directory is a static site. Deploy to any hosting provider:

- Cloudflare Pages
- Vercel (static mode)
- Netlify
- GitHub Pages
- Any nginx or Apache server

No Node.js server runtime is needed in production.

## Design System

Tandava uses a "Mystical Night" theme built on Tailwind CSS with shadcn/ui components:

- **Background:** Deep dark (#0f0a14)
- **Accents:** Teal, coral, gold, sage
- **Typography:** Cormorant Garamond (display), DM Sans (body), Cinzel (Sanskrit terms)
- **Effects:** Glass morphism, gradient borders, subtle glow animations

## Contributing

Contributions are welcome. Before starting significant work, please open an issue to discuss the approach.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Ensure the build passes (`npm run build`)
5. Submit a pull request

## License

This project is open source. See the repository for license details.
