# Tandava

**Open-source studio management software you fork, deploy, and own.**

Scheduling. Memberships. Payments. Check-in. Analytics. Built for yoga, pilates, and movement studios with technical teams.

> **[Live Demo](https://tandava-flame.vercel.app)** — Explore the full platform with sample data. No signup required.

*Tandava* is the cosmic dance in Hindu tradition, representing the rhythm of creation, preservation, and transformation. We chose this name because running a studio should feel like a practice: purposeful, flowing, and yours to shape.

---

## What This Is

Tandava is a **deployable reference implementation** of studio management software. You clone it, configure it, deploy it, and run your studio on it.

It handles the operational reality of running a movement studio: scheduling classes, tracking memberships, processing payments, managing teachers, and understanding your business through analytics.

It is designed for studios with 1-3 locations where the owner is often also the lead teacher, the person handling check-ins, and the one reconciling the books at month-end.

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

## What This Is Not

**Not a hosted SaaS.** There is no sign-up page, no onboarding wizard, no managed hosting. You deploy this yourself.

**Not for non-technical studio owners (yet).** If you don't have a developer, technical co-founder, or trusted dev partner, this is not ready for you. We aspire to make it more accessible over time, in the open, with the community — but we won't pretend it's there today.

**Not a plug-and-play Mindbody alternative.** This is software you adopt, customize, and maintain. It requires understanding your own infrastructure: hosting, database, payment processing, DNS.

**Not a platform.** Tandava runs one studio (or a small number of locations under one owner). It is not a marketplace, directory, or multi-tenant SaaS. Platform-mode capabilities exist as scaffolding but are not the primary use case.

### Who This Is For

- Yoga studios with an internal engineering team or technical founder
- Studios with a trusted development partner willing to deploy and maintain
- Developer-led collectives building studio software together
- Technical people exploring what studio management software should look like

### Who This Is Not For (Yet)

- Non-technical studio owners without dev support
- Studios expecting hosted SaaS or guided onboarding
- Anyone looking for a turnkey solution they can use without touching code or infrastructure

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

For production deployment, see **[DEPLOYMENT.md](DEPLOYMENT.md)**.

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
- Role-based access (Owner, Front Desk, Teacher, Student)
- Analytics dashboards with revenue, attendance, retention metrics
- Teacher check-in dialog with student roster
- Event management with historical trends
- Demo mode with realistic sample data
- Data import/export

**Needs integration for production:**
- Payment processing (Stripe Connect architecture ready, not connected)
- Real authentication (Supabase Auth configured, currently mock in demo)
- Email/SMS notifications (provider abstraction built, needs configuration)
- Data persistence (full Supabase schema with RLS ready, needs deployment)

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

## Why Open Source

Most studio software traps you. Your member data lives on someone else's servers. Switching providers means starting over. Customization requires paying for higher tiers or begging for features.

Tandava takes the opposite approach:

**Your data stays yours.** Run it on your own infrastructure or use managed hosting. Export everything, anytime, in standard formats.

**The code is open.** Every line is auditable. If something doesn't work for your studio, you can change it or hire someone to change it.

**No lock-in by design.** We're building toward a standardized data interchange format so moving to or from Tandava is straightforward.

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
