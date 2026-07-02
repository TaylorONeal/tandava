# Tandava

**Open-source studio management software — run it yourself, or let us host it.**

Scheduling. Memberships. Payments. Check-in. Analytics. Built for yoga, pilates, and movement studios.

Two ways to use Tandava:

- **Hosted** — sign up at **[tandavastudio.com](https://tandavastudio.com)**, complete the setup wizard, and go live. No servers, no DNS, no deployment. Free to run — we make money only by taking a small percentage of the payments you process, so we only earn when your studio does.
- **Self-host** — clone this repo and deploy it on your own infrastructure. Own every byte, pay only your hosting costs, change anything. AGPL-3.0.

> **[Live Demo](https://tandava-flame.vercel.app)** — Explore the full platform with sample data. No signup required.

*Tandava* is the cosmic dance in Hindu tradition, representing the rhythm of creation, preservation, and transformation. We chose this name because running a studio should feel like a practice: purposeful, flowing, and yours to shape.

---

## What This Is

Tandava is studio management software you can either **sign up for** (hosted) or **deploy yourself** (open source) — the same application either way.

It handles the operational reality of running a movement studio: scheduling classes, tracking memberships, processing payments, managing teachers, and understanding your business through analytics.

It is designed for studios with 1-3 locations where the owner is often also the lead teacher, the person handling check-ins, and the one reconciling the books at month-end.

**Open core, not open bait.** Every feature is in this repository — nothing is held back for a paid tier. The hosted version runs this exact code; you pay for the convenience of not operating it, not for locked features. The software is licensed AGPL-3.0, which keeps it open for everyone and lets the project sustain itself by offering hosting.

**What you get:**
- Full scheduling with recurring classes, subs, and cancellations
- Membership and class pack management with purchase and consumption tracking
- Student profiles with visit history and waiver tracking
- Teacher profiles with pay rates, availability, and performance analytics
- Check-in system with kiosk mode and QR codes
- Analytics dashboards for attendance, revenue, and retention
- Event and workshop management with historical trends
- Data import from MindBody, Momence, Walla, and others

**What you don't get:**
- Vendor lock-in
- Per-member pricing that scales against you
- Data you can't export
- Features hidden behind enterprise tiers

## Which Path Is Yours

**Non-technical owner? Use the hosted version.** Go to [tandavastudio.com](https://tandavastudio.com), sign up, and the setup wizard walks you through your studio, staff, offerings, pricing, waivers, importing data from your old system, and connecting Stripe. You never touch a server, a database, or DNS. This is the turnkey path.

**Have a developer, or want full control? Self-host.** Clone the repo and deploy it on your own Supabase + static host. You own the data and the infrastructure, and you can change anything. This requires comfort with hosting, environment variables, and payment configuration — see [DEPLOYMENT.md](DEPLOYMENT.md).

### Honest status

The frontend and workflows are complete; the backend (Supabase schema, auth, RLS, edge functions) is architecturally ready and being hardened under real use. If you self-host today, budget time to verify RLS, payments, and email against your own project before real members rely on it — the hosted version exists precisely so you don't have to.

**Tandava is multi-tenant by design.** One deployment serves many studios, isolated by row-level security — which is exactly what makes the hosted version possible. Self-hosters typically run it for a single studio (or a few locations under one owner), but the platform capabilities are real, not scaffolding.

---

## Live Demo

Explore the full platform at **[tandava-flame.vercel.app](https://tandava-flame.vercel.app)**.

The demo loads a complete fictional studio (Oxatl Yoga, Austin TX) with 3 locations, 18 teachers, and 500 members. Switch between roles using the bar at the top:

| Role | What You See |
|------|-------------|
| Studio Owner | Dashboard, schedule management, financials, teacher analytics, events |
| Instructor | Teaching dashboard, check-in students, earnings, sub requests |
| Front Desk | Class check-in, waitlist management |
| Member | Browse classes, book, view schedule, track progress |

No signup, no backend, no database. Everything runs client-side with mock data.

---

## Quick Start

**Just want to run a studio?** Skip all of this — go to [tandavastudio.com](https://tandavastudio.com), sign up, and follow the setup wizard. See the [studio owner quickstart](docs/studio-manager/getting-started.md).

**Want to run the code locally or self-host?**

```bash
# Clone and install
git clone https://github.com/TaylorONeal/tandava.git
cd tandava
npm install

# Run in demo mode (no backend needed)
echo "VITE_DEMO_MODE=true" > .env.local
npm run dev
```

Opens at `http://localhost:8080` with sample data.

- **Self-host for your own studio:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Operate the hosted service (run your own tandavastudio.com):** [docs/OPERATOR_SETUP.md](docs/OPERATOR_SETUP.md)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Payments | Stripe Connect (Standard) |
| Hosting | Any static host (Vercel, Netlify, Cloudflare Pages, self-hosted) |

No Node.js server runtime needed in production. The frontend is a static SPA; all backend logic runs in Supabase (PostgreSQL + Edge Functions).

---

## Current Status

Tandava is in active development. The demo shows complete UI and workflows. Some features require backend integration for production use.

**Working now (frontend complete):**
- Full UI for scheduling, bookings, roster management
- Role-based access enforced at the route level (Owner, Admin, Teacher, Front Desk, Student)
- Analytics dashboards with revenue, attendance, retention metrics
- Teacher check-in dialog with student roster
- Event management with historical trends
- Demo mode with realistic sample data
- CSV import engine: real parsing, provider auto-detection, column
  auto-mapping, validation, and dedupe (see `src/lib/connectors/`)
- Embeddable booking widget: a one-line `<script>` that puts your live
  schedule / a "Book Now" button / an event on your own website
  (Squarespace, Wix, WordPress) — see `public/embed.js` and `/manage/embed`

**Backend implemented, needs your keys/config:**
- Payments: Stripe Checkout, Customer Portal, and webhook Edge Functions are
  implemented (drop-in, membership subscriptions, class packs) and support both
  single-studio and Stripe Connect platform modes — set your Stripe secrets and
  webhook endpoint to go live
- Email: provider abstraction (Resend / SendGrid / SMTP / console) with a
  deployable Edge Function — set `EMAIL_PROVIDER` + keys
- Auth: real Supabase Auth (mock only when `VITE_DEMO_MODE=true`)
- Data persistence: full Supabase schema with RLS — run the migrations

**Still in progress (see [docs/ROADMAP.md](docs/ROADMAP.md)):**
- Wiring the booking/checkout UI to the live payment + entitlement layer
- Final import persistence (member creation via a service-role function)
- SMS / push notification providers
- Workshop/event registration UI (multi-session, deposits, partial series)

### Versioning

Tandava follows [SemVer](https://semver.org/). We are pre-1.0 (`v0.x`).

**What that means:**
- The API and schema may change between minor versions
- Migration paths will be documented but not guaranteed to be automated
- Pin to a specific commit or tag when deploying to production
- Check the changelog before pulling updates

**Release strategy:**
- Releases are tagged in git (starting at `v0.1.0`)
- Each release includes a summary of changes and migration notes if applicable
- There is no npm package — this is meant to be forked and deployed, not installed as a dependency

---

## Features

### For Studio Owners

| Feature | Description |
|---------|-------------|
| Dashboard | Today's schedule, KPIs, alerts |
| Schedule Management | Recurring rules, substitutions, cancellations |
| Student Management | Profiles, memberships, visit history, waivers |
| Teacher Management | Profiles, pay rates, availability, performance analytics |
| Offerings | Class types with descriptions, levels, capacity |
| Events and Workshops | Multi-session support, tiered pricing, historical trends |
| Financials | Memberships, class packs, transactions |
| Reports | Attendance, revenue, teacher performance |
| Feature Toggles | Tips, reviews, and other optional features on/off |
| Website Embed | One-line script widget for booking on your own site |
| Data Import | CSV import with column mapping |
| Settings | Studio info, policies, branding |

### For Teachers

| Feature | Description |
|---------|-------------|
| Dashboard | Upcoming classes, check-in students, schedule overview |
| Sub Requests | Request and accept substitutions |
| Earnings | Track pay, tips (when enabled), commissions |
| Availability | Set weekly availability for scheduling |

### For Students

| Feature | Description |
|---------|-------------|
| Class Browsing | Filter by location, style, teacher, time, in-person/virtual |
| Booking | Class packs, memberships, drop-in, waitlist |
| My Schedule | Upcoming and past bookings |
| Progress | Classes attended, streak tracking |

---

## Architecture

```
tandava/
├── src/
│   ├── components/     # React components (shadcn/ui)
│   ├── contexts/       # Auth, Demo, Theme contexts
│   ├── data/demo/      # Demo mode data (Oxatl Yoga)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities + backend abstraction
│   ├── pages/          # Route components
│   └── types/          # TypeScript types
├── supabase/
│   ├── migrations/     # Database migrations (RLS)
│   └── functions/      # Edge Functions (email, Stripe webhooks)
├── docs/               # Documentation
└── public/             # Static assets
```

The database uses Row Level Security (RLS) for multi-tenant isolation. Each studio's data is completely separate.

For architectural decisions and trade-offs, see **[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## Documentation

| Document | Description |
|----------|-------------|
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Production deployment guide |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | System design and decisions |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | How to contribute + governance |
| [docs/developer/](docs/developer/) | Developer guides (domain model, flows, integrations) |
| [docs/prd/](docs/prd/) | Product requirements documents |
| [docs/architecture/](docs/architecture/) | Domain model, RBAC, compliance |
| [DATA_INTEROPERABILITY.md](DATA_INTEROPERABILITY.md) | Data ownership principles |

---

## Why Open Source (and how the hosted version fits)

Most studio software traps you. Your member data lives on someone else's servers. Switching providers means starting over. Customization requires paying for higher tiers or begging for features.

Tandava takes the opposite approach:

**Your data stays yours.** Run it on your own infrastructure, or use the hosted version and export everything, anytime, in standard formats.

**The code is open.** Every line is auditable. If something doesn't work for your studio, you can change it or hire someone to change it — or ask us to.

**No lock-in by design.** We're building toward a standardized data interchange format so moving to or from Tandava is straightforward.

**Aligned incentives.** The hosted service earns a small percentage of the payments a studio processes — nothing else. There's no per-member fee, no seat pricing, no locked features. We grow only when studios grow, and any studio that outgrows the arrangement can take the open-source code and self-host. That option existing is what keeps the hosted version honest.

---

## Contributing

We welcome contributions from studio owners, developers, and anyone who cares about independent studio software.

Before contributing, understand the project's core bias: **deployable reference implementation first.** Contributions that make Tandava easier to fork, deploy, customize, and operate for real studios are prioritized. Contributions that add abstraction, packaging, or platform generalization without clear operator benefit will likely be declined.

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for complete guidelines and governance.

---

## License

Tandava is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).

For studios running Tandava for their own use, you own your data and control your deployment. If you modify the source and make it available over a network, you must share your modifications under the same license.

---

## Links

- **[Live Demo](https://tandava-flame.vercel.app)**
- [Documentation](docs/INDEX.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Architecture](ARCHITECTURE.md)
- [Contributing](CONTRIBUTING.md)
