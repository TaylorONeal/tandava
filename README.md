# Tandava

**Open-source studio management for yoga, pilates, and movement studios.**

Scheduling. Memberships. Payments. Check-in. Analytics. All in one place, all under your control.

*Tandava* is the cosmic dance in Hindu tradition, representing the rhythm of creation, preservation, and transformation. We chose this name because running a studio should feel like a practice: purposeful, flowing, and yours to shape.

---

## What Tandava Is

Tandava is studio management software you can self-host. It handles the operational reality of running a movement studio: scheduling classes, tracking memberships, processing payments, managing teachers, and understanding your business through analytics.

It's designed for studios with 1-3 locations where the owner is often also the lead teacher, the person handling check-ins, and the one reconciling the books at month-end.

**What you get:**
- Full scheduling with recurring classes, subs, and cancellations
- Membership and class pack management with purchase and consumption tracking
- Student profiles with visit history and waiver tracking
- Teacher profiles with pay rates and availability
- Check-in system with kiosk mode and QR codes
- Analytics dashboards for attendance, revenue, and retention
- Event and workshop management
- Data import from MindBody, Momence, Walla, and others

**What you don't get:**
- Vendor lock-in
- Per-member pricing that scales against you
- Data you can't export
- Features hidden behind enterprise tiers

---

## Why Open Source

Most studio software traps you. Your member data lives on someone else's servers. Switching providers means starting over. Customization requires paying for higher tiers or begging for features.

Tandava takes the opposite approach:

**Your data stays yours.** Run it on your own infrastructure or use managed hosting. Export everything, anytime, in standard formats.

**The code is open.** Every line is auditable. If something doesn't work for your studio, you can change it or hire someone to change it.

**No lock-in by design.** We're building toward a standardized data interchange format so moving to or from Tandava is straightforward.

---

## Current Status

Tandava is in active development. The demo shows complete UI and workflows, but some features need backend integration for production use.

**Working now:**
- Full UI for scheduling, bookings, roster management
- Role-based access (Owner, Front Desk, Teacher, Student)
- Analytics dashboards
- Demo mode with sample studio data

**Needs integration:**
- Payment processing (Stripe Connect ready, not connected)
- Real authentication (currently mock)
- Email/SMS notifications
- Data persistence (Supabase schema ready)

See [docs/STATUS.md](docs/STATUS.md) for complete details.

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/TaylorONeal/tandava.git
cd tandava
npm install

# Run in demo mode
echo "VITE_DEMO_MODE=true" > .env.local
npm run dev
```

Opens at `http://localhost:8080` with sample data from a fictional studio (Oxatl Yoga, Austin TX).

---

## Demo Mode

Demo mode lets you explore the platform without a database. It includes:

- **Oxatl Yoga**: A fictional Austin studio with 3 locations
- **18 teachers** with realistic profiles
- **500 members** with varied membership types
- **Full schedule** with historical booking data

Switch between roles (Owner, Front Desk, Teacher, Student) using the demo panel to see different views.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Payments | Stripe Connect (planned) |
| Hosting | Any static host (Vercel, Netlify, self-hosted) |

---

## Features

### For Studio Owners

| Feature | Description |
|---------|-------------|
| Dashboard | Today's schedule, metrics, alerts |
| Schedule Management | Recurring rules, substitutions, cancellations |
| Student Management | Profiles, memberships, visit history, waivers |
| Teacher Management | Profiles, pay rates, availability |
| Offerings | Class types with descriptions, levels, capacity |
| Events and Workshops | Multi-session support, tiered pricing |
| Financials | Memberships, class packs, transactions |
| Reports | Attendance, revenue, teacher performance |
| Data Import | CSV import with column mapping |
| Settings | Studio info, policies, branding |

### For Teachers

| Feature | Description |
|---------|-------------|
| Personal Dashboard | Upcoming classes, schedule overview |
| Sub Requests | Request and accept substitutions |
| Earnings | Track pay, tips, commissions |

### For Students

| Feature | Description |
|---------|-------------|
| Class Browsing | Search by studio, style, teacher, time |
| Booking | Class packs, memberships, drop-in, waitlist |
| My Schedule | Upcoming and past bookings |
| Progress | Classes attended, practice stats |

### Analytics

| Feature | Description |
|---------|-------------|
| Member Analytics | Retention, churn prediction, engagement |
| Sales Analytics | Revenue trends, pack performance |
| Financial Analytics | MRR tracking, forecasting |
| Site Analytics | Traffic sources, conversion funnels |

---

## Architecture

```
tandava/
├── src/
│   ├── components/     # React components
│   ├── contexts/       # Auth, Demo, Theme contexts
│   ├── data/demo/      # Demo mode data
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities
│   ├── pages/          # Route components
│   └── types/          # TypeScript types
├── supabase/
│   └── migrations/     # Database migrations
└── docs/               # Documentation
```

The database uses Row Level Security (RLS) for multi-tenant isolation. Each studio's data is completely separate.

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/INDEX.md](docs/INDEX.md) | Documentation index |
| [docs/STATUS.md](docs/STATUS.md) | Current project status |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Development roadmap |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [DATA_INTEROPERABILITY.md](DATA_INTEROPERABILITY.md) | Data ownership principles |

---

## Contributing

We welcome contributions from studio owners, developers, and anyone who cares about independent studio software.

**Quick ways to help:**
- Report bugs with reproduction steps
- Suggest features that would help your studio
- Submit code (fork, branch, PR)
- Improve documentation

See [CONTRIBUTING.md](CONTRIBUTING.md) for complete guidelines.

---

## Roadmap

**Completed:**
- Multi-tenant architecture with RLS
- Core scheduling with recurring rules
- Booking system with waitlist
- Membership and class pack management
- Analytics dashboards
- Demo mode
- Data connector hub

**In Development:**
- Real data connections
- Notification delivery
- Payment integration

**Future:**
- Custom report builder
- Mobile apps
- On-demand video

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full roadmap.

---

## License

Tandava is open source. License type is being finalized. See [LICENSE](LICENSE) for current status.

For studios running Tandava for their own use, there are no restrictions beyond standard open-source norms. You own your data and control your deployment.

---

## Links

- [Documentation](docs/INDEX.md)
- [Project Status](docs/STATUS.md)
- [Contributing](CONTRIBUTING.md)
