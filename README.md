# Tandava

**Open-source studio management for yoga, pilates, and movement studios.**

*Your studio. Your data. Your freedom.*

---

## The Philosophy

In Sanskrit, *Tandava* is the cosmic dance — the rhythm of creation, preservation, and transformation. We chose this name because running a studio should feel like a practice in itself: purposeful, flowing, and deeply personal.

Today, most studio owners are locked into proprietary platforms that control their data, dictate their workflows, and charge escalating fees for the privilege. Switching providers means starting from scratch. Customization means paying for enterprise tiers. And the software you rely on every day? You have no say in how it evolves.

Tandava exists to change that.

We believe studio owners — whether you teach vinyasa, hot yoga, pilates, barre, martial arts, or any form of movement — should have complete ownership of their business tools. Your student relationships, your scheduling logic, your financial data, and your growth strategy should belong to you, not a vendor.

### Our Commitments

- **Data sovereignty.** Your data lives in your own database. Export everything, anytime, in standard formats. No lock-in, no ransom.
- **Adaptability.** Switch between self-hosted and managed hosting. Use our frontend or build your own. Integrate with whatever tools work for your studio today, and swap them out when something better comes along.
- **Standardization over reinvention.** By building on open standards (PostgreSQL, REST, CSV interchange), we free you to focus on what matters — the thriving of yourself, your teachers, your students, and your community.
- **Transparency.** Every line of code is auditable. Every design decision is documented. You can see exactly how your studio software works, and why.

### Who This Is For

Tandava is designed for **1–3 location studios** with small teams. The kind of studios where the owner is often also the lead teacher, the receptionist, and the accountant. Studios where every dollar matters, every student relationship is personal, and the last thing you need is software that creates more work instead of less.

Whether you run a yoga shala, a pilates reformer studio, a barre studio, a martial arts dojo, or a wellness center — if you want control of your business tools without needing a full-time developer, Tandava is being built for you.

---

## What's Included (V1 Alpha)

### For Studio Owners & Admins

| Feature | Description |
|---------|-------------|
| **Dashboard** | Today's schedule, real-time metrics, alerts, and activity feed |
| **Schedule Management** | Recurring rules + individual occurrences, sub requests, cancellations |
| **Student Management** | Profiles, memberships, class packs, visit history, waiver tracking |
| **Teacher Management** | Profiles, pay rates, availability, assigned classes |
| **Offerings** | Class types with descriptions, levels, styles, capacity, and fill rates |
| **Events & Workshops** | Workshops, trainings, retreats, series, and immersions — first-class entities with multi-session support, tiered pricing, and teacher assignments |
| **Promo Codes & Discounts** | Percentage or fixed discounts, usage limits, date ranges, offering restrictions |
| **Membership Pausing** | Configurable pause rules per membership type with history tracking |
| **Guest Passes** | Buy a class for someone else — great for gift-giving and referrals |
| **Gift Cards** | Issue, redeem, and track balances |
| **Waivers** | Template management and digital signature tracking |
| **Referral Programs** | Configurable rewards for referrer and referred |
| **Intro Offers** | First-class-free, trial packs, and welcome discounts |
| **Financials** | Membership types, class packs, transaction history |
| **Landing Pages** | SEO-optimized pages with content blocks, conversion tracking, and editorial guidance |
| **Reports** | Attendance, revenue, teacher performance, payroll summaries |
| **Data Import** | CSV import with column mapping — bring your data from any system |
| **Data Connectors** | Import, sync, and export hub with provider detection (MindBody, Walla, Momence, etc.) |
| **Onboarding Wizard** | Guided setup for new studios: info, location, offerings, schedule, payments |
| **Settings** | Studio info, policies, branding, notification preferences |

### Analytics & Business Intelligence

| Feature | Description |
|---------|-------------|
| **Analytics Hub** | Unified dashboard with member, sales, financial, and site analytics |
| **Member Analytics** | Retention cohorts, churn prediction, engagement scoring |
| **Sales Analytics** | Revenue trends, pack/membership performance, promo effectiveness |
| **Financial Analytics** | MRR tracking, revenue forecasting, P&L summaries |
| **Site Analytics** | Traffic sources, conversion funnels, UTM attribution |
| **Benchmark Data** | Industry comparisons for key metrics |

### Campaign & Marketing Hub (Phase 4)

| Feature | Description |
|---------|-------------|
| **Campaign Manager** | Create, schedule, and track email/SMS campaigns |
| **Audience Segments** | Build dynamic segments based on member behavior |
| **UTM Builder** | Create trackable links with campaign parameters |
| **A/B Testing** | Test subject lines, content, and send times |
| **Email Templates** | Reusable templates with personalization |
| **Link Click Tracking** | Monitor engagement and conversions |

### Task Management (Phase 5)

| Feature | Description |
|---------|-------------|
| **Task Board** | Kanban view for visual task management |
| **Task List** | Sortable, filterable list view |
| **Task Assignment** | Assign to staff with due dates and priorities |
| **Recurring Tasks** | Daily, weekly, monthly task automation |
| **Checklists** | Multi-step task breakdown |
| **Task Categories** | Organize by type (opening, closing, cleaning, etc.) |

### Check-In & Operations (Phase 3)

| Feature | Description |
|---------|-------------|
| **Self Check-In Kiosk** | Tablet mode for member self-service |
| **QR Code Check-In** | Members scan personal QR codes |
| **Waitlist Automation** | Automatic promotion when spots open |

### For Students

| Feature | Description |
|---------|-------------|
| **Class Browsing** | Search and filter by studio, style, level, teacher, time |
| **Booking Flow** | Book with class packs, memberships, or drop-in — with waitlist support |
| **My Schedule** | Upcoming and past bookings with cancellation |
| **On-Demand Library** | Recorded classes available anytime |
| **Studio Discovery** | Browse studios by location, style, and rating |
| **Instructor Profiles** | Teacher bios, specialties, and reviews |
| **Community** | Practice stats, streaks, leaderboards, friend connections |
| **Progress Tracking** | Classes attended, minutes practiced, style preferences |

### For Teachers

| Feature | Description |
|---------|-------------|
| **Teach Dashboard** | Personal schedule overview, upcoming classes |
| **My Schedule** | View assigned classes and availability |
| **Sub Requests** | Request and accept substitutions |
| **Earnings** | Track payroll, tips, and commissions |

### Growth & Engagement (Non-Obtrusive)

Tandava includes a thoughtful engagement layer inspired by product-led growth principles. Everything is:

- **Dismissible** — every nudge can be closed, permanently
- **Frequency-capped** — backend rules prevent notification fatigue
- **Contextual** — messages are based on actual user behavior, not generic blasts
- **Privacy-respecting** — no dark patterns, no guilt-tripping, no surveillance

| Feature | Description |
|---------|-------------|
| **Engagement Nudges** | Contextual reminders: streak at risk, pack running low, new class suggestions, friend activity |
| **Milestone Celebrations** | Genuine recognition when students hit practice milestones |
| **Newsletter Signup** | Available in natural touchpoints with source tracking and double opt-in |
| **Analytics Attribution** | UTM tracking, landing page source, campaign attribution |
| **Engagement Profiles** | Activation scoring, streak tracking, risk assessment for churn prevention |

### Integration Architecture

Tandava doesn't try to be your CRM, email platform, or advertising tool. Instead, it provides a clean event-driven architecture that connects to whatever you already use:

- **Event Log** — every significant action (booking, cancellation, purchase, milestone) is logged as a structured event
- **Webhook Endpoints** — configure outgoing webhooks to push events to Zapier, Make, n8n, or any HTTP endpoint
- **Integration Registry** — track connected services with health status and last-sync timestamps
- **Standard Data Export** — CSV export for everything, designed for interoperability

This means you can connect Mailchimp, ConvertKit, HubSpot, Google Ads, or whatever tools your studio uses — without Tandava needing to build and maintain those integrations directly.

---

## Demo Mode

Tandava includes a comprehensive demo mode for exploring the platform without a database connection.

### Demo Studio: Oxatl Yoga

A fully-realized fictional yoga studio in Austin, Texas:

- **3 locations:** Domain, South Congress, East Austin
- **18 teachers** with realistic profiles and specialties
- **500 members** with varied membership types and activity levels
- **Historical data:** Full 2018 calendar with bookings and transactions
- **Workshop templates:** Myofascial Release, Breathwork, Sound Bath, and more

### Enabling Demo Mode

```bash
# In .env or .env.local
VITE_DEMO_MODE=true
```

The demo panel allows switching between personas (Owner, Front Desk, Teacher, Student) to experience different role-based views.

See [docs/DEMO_MODE.md](docs/DEMO_MODE.md) for complete documentation on customizing demo data.

---

## Architecture

```
tandava/
├── public/                     # Static assets, PWA manifest, service worker
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── layout/             # AppLayout (student), ManageLayout (admin)
│   │   ├── manage/             # Management-specific components
│   │   ├── teach/              # Teacher portal components
│   │   ├── booking/            # Booking flow components
│   │   ├── schedule/           # Class, workshop, retreat cards
│   │   ├── studio/             # Studio cards and details
│   │   ├── instructor/         # Instructor cards and profiles
│   │   ├── stats/              # Stat cards and visualizations
│   │   ├── DemoPanel.tsx       # Demo mode persona switcher
│   │   └── ui/                 # shadcn/ui base components
│   ├── contexts/               # React contexts
│   │   ├── AuthContext.tsx     # Authentication state
│   │   ├── DemoContext.tsx     # Demo mode state and personas
│   │   └── ThemeContext.tsx    # Studio theming
│   ├── data/
│   │   └── demo/               # Demo data (Oxatl Yoga studio)
│   │       ├── index.ts        # Central exports
│   │       ├── oxatl-yoga.ts   # Studio, teachers, members, schedule
│   │       └── bookings-transactions.ts  # 2018 historical data
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   │   ├── supabase.ts         # Supabase client
│   │   ├── reference-data.ts   # Canonical lists (class styles, workshop types)
│   │   └── validation.ts       # Form validation utilities
│   ├── pages/                  # Route-level page components
│   │   ├── auth/               # Login, Register
│   │   ├── manage/             # All studio management pages
│   │   │   ├── Analytics*.tsx  # Analytics dashboards
│   │   │   ├── Campaigns.tsx   # Campaign manager
│   │   │   ├── AudienceSegments.tsx
│   │   │   ├── UtmBuilder.tsx
│   │   │   ├── Tasks.tsx       # Task management
│   │   │   ├── DataConnectors.tsx
│   │   │   └── ...
│   │   └── teach/              # Teacher portal pages
│   └── types/                  # TypeScript type definitions
├── supabase/
│   └── migrations/             # PostgreSQL migration files (8 migrations)
├── docs/
│   ├── INDEX.md                # Documentation index
│   ├── ROADMAP.md              # Development roadmap
│   ├── FEATURE_INDEX.md        # Feature status reference
│   ├── DEMO_MODE.md            # Demo mode guide
│   ├── FAQ.md                  # Quick FAQ
│   ├── FAQ-detailed.md         # Detailed FAQ
│   ├── workflows/              # Workflow documentation
│   └── prd/                    # Product requirements (PRD-001 through PRD-013)
└── package.json
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 18, TypeScript, Vite | Fast builds, type safety, modern DX |
| **UI Components** | shadcn/ui (Radix primitives) | Accessible, composable, themeable |
| **Styling** | Tailwind CSS | Utility-first, consistent design system |
| **Backend** | Supabase (PostgreSQL + Auth + Storage) | Open-source, self-hostable, real-time |
| **Auth** | Supabase Auth with RLS | Row-level security for multi-tenant isolation |
| **Payments** | Stripe Connect (planned) | Multi-tenant payment processing |
| **Hosting** | PWA-first, any static host | Vercel, Netlify, Cloudflare Pages, or self-hosted |

### Data Model

The database is designed for **multi-tenant studio management** with Row Level Security (RLS) policies ensuring complete data isolation between studios.

| Migration | Focus | Tables |
|-----------|-------|--------|
| 001 | Core | Studios, profiles, bookings, memberships, payments |
| 002 | Operations | Promos, waivers, referrals, webhooks |
| 003 | Growth | Events, landing pages, analytics, engagement |
| 004 | BI | MRR, forecasting, CLV, P&L, benchmarks |
| 005 | Connectors | Import/export/sync infrastructure |
| 006 | Phase 1 | Staff portal, retail, membership enhancements |
| 007 | Phase 2-3 | Notifications, SMS, check-in, waitlist automation |
| 008 | Phase 4-5 | Campaigns, audience segments, UTM, task management |

**Total: 140+ tables** covering every aspect of studio operations.

---

## Reference Data

Tandava includes canonical reference lists for consistent data entry and validation:

### Class Styles (50 options)
Vinyasa, Power Vinyasa, Yoga Sculpt, Slow Flow, Yin, Restorative, Hot Yoga, Ashtanga, Kundalini, Pilates, and more.

### Workshop Types (30 options)
Intro to Yoga, Breathwork Workshop, Inversions, Handstand Workshop, Sound Bath, Full Moon Ceremony, and more.

### Booking Provider Detection
Automatic detection for MindBody, Walla, Momence, WellnessLiving, Arketa, Vagaro, Acuity, and others.

See `src/lib/reference-data.ts` for complete lists.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- [npm](https://www.npmjs.com/) 9+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local database)
- [Docker](https://www.docker.com/) (required by Supabase CLI for local development)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/TaylorONeal/tandava.git
cd tandava

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will open at `http://localhost:8080`. The frontend runs with demo data by default — no backend required to browse the UI.

### Enabling Demo Mode

```bash
# Create .env.local with demo mode enabled
echo "VITE_DEMO_MODE=true" > .env.local

# Restart the dev server
npm run dev
```

### Connecting Supabase (Full Stack)

To run with a real database:

```bash
# 1. Install the Supabase CLI
npm install -g supabase

# 2. Start local Supabase (requires Docker)
supabase start

# 3. Apply migrations
supabase db reset

# 4. Create a .env.local file with your Supabase credentials
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
EOF

# 5. Restart the dev server
npm run dev
```

The Supabase CLI will output your local credentials when it starts. Copy the `anon key` and `API URL` into your `.env.local`.

### Building for Production

```bash
# Build the production bundle
npm run build

# Preview the production build locally
npm run preview
```

The build output goes to `dist/` and can be deployed to any static hosting provider.

---

## Data Portability

One of Tandava's core principles is that **your data should never be held hostage**.

### Importing Data

The Import tool (`/manage/import`) supports CSV import with intelligent column mapping. It recognizes common column formats from various studio management systems and maps them automatically. You can also create custom mappings for any CSV structure.

Supported import categories:
- Students and members
- Teachers and staff
- Class schedules and offerings
- Memberships and subscriptions
- Transaction history

### Data Connectors

The Data Connectors hub (`/manage/connectors`) provides:
- **Import connectors** for MindBody, Walla, Momence, WellnessLiving, and generic CSV
- **Sync connectors** for ongoing data synchronization
- **Export options** for backups and migrations

### Exporting Data

Every data table supports CSV export. The export format uses standardized column names designed for maximum interoperability — whether you're moving to another platform, building a custom integration, or just want a backup.

### The Standard Format Promise

We're working toward a standardized interchange format for studio management data. The goal: if you ever want to leave Tandava, your data exports seamlessly. And if you're coming from another system, your import is painless. This isn't just a feature — it's a commitment to the studio community.

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/INDEX.md](docs/INDEX.md) | Documentation index and reading order |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Development roadmap by phase |
| [docs/FEATURE_INDEX.md](docs/FEATURE_INDEX.md) | Complete feature status reference |
| [docs/DEMO_MODE.md](docs/DEMO_MODE.md) | Demo mode customization guide |
| [docs/FAQ.md](docs/FAQ.md) | Quick answers to common questions |
| [docs/workflows/](docs/workflows/) | Step-by-step operational guides |
| [docs/prd/](docs/prd/) | Product requirements documents |

---

## Contributing

Tandava is open-source under the [AGPL-3.0 license](LICENSE). We welcome contributions from studio owners, developers, designers, and anyone who cares about independent studio software.

### How to Contribute

1. **Report bugs** — Open an issue describing what happened and how to reproduce it
2. **Suggest features** — Open a discussion describing the workflow you need
3. **Submit code** — Fork, branch, implement, test, and open a PR
4. **Improve docs** — Better documentation helps everyone
5. **Share your experience** — Tell us what works and what doesn't from a studio operator's perspective

### Development Guidelines

- Keep it simple. Studio owners shouldn't need to understand React internals.
- Respect the data model. Changes to the database schema require migration files.
- Test your changes. Run `npm run build` before submitting.
- Write for accessibility. Use semantic HTML and ARIA attributes.
- Design for mobile first. Most studio interactions happen on phones.

---

## Roadmap

### Completed

- Multi-tenant architecture with Row Level Security
- Core scheduling with recurring rules and substitutions
- Booking system with waitlist management
- Membership types and active subscriptions
- Class pack purchase and consumption
- Stripe Connect payment integration (schema)
- Teacher payroll calculation
- Multi-location support
- Waivers with digital signatures
- Import infrastructure for data migration
- Comprehensive analytics dashboards
- Demo mode with role switching
- Studio theming system (3 starter themes)
- Data connector hub (import/sync/export)
- Campaign Hub (manager, segments, UTM, A/B testing)
- Task Management (Kanban, list view, recurring, checklists)
- Check-in system (self-service kiosk, QR codes)
- Waitlist automation

### In Development

- Real data connections (replacing mock data)
- Edge Functions for background processing
- Notification delivery (email, SMS, push)

### Future Phases

- **Phase 6:** Custom Report Builder
- **Phase 7:** Booking Enhancements (Reserve with Google, spot selection)
- **Phase 8:** Payment Enhancements (payment plans, POS terminal)
- **Phase 9:** Video & On-Demand
- **Phase 10:** Marketplace Integrations (ClassPass, Gympass)
- **Phase 11:** Franchise/Multi-Studio
- **Phase 12:** Mobile Apps
- **Phase 13:** Advanced AI Features

See [docs/ROADMAP.md](docs/ROADMAP.md) for the complete roadmap with PRD links.

---

## License

Tandava is licensed under the [GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.en.html) (AGPL-3.0).

This means:
- You can use, modify, and distribute this software freely
- If you modify the software and offer it as a service, you must make your modifications available under the same license
- This ensures the community benefits from every improvement

For studios running Tandava for their own use, the AGPL-3.0 imposes no restrictions beyond standard open-source norms. You own your data, you control your deployment, and you're free to customize however you like.

---

## Why Open Source?

The wellness industry has a vendor lock-in problem. Studios sign up for a platform, build their entire operation around it, and then discover that switching costs are prohibitively high. Student data is trapped. Scheduling history is inaccessible. Payment relationships are intermediated.

This creates a power imbalance that doesn't serve anyone well — not studio owners, not teachers, and certainly not students.

Open-source software inverts this dynamic. When the code is transparent and the data is portable, the relationship between a studio and its tools becomes one of choice, not dependency. You use Tandava because it works for you, not because leaving is too painful.

We're not building this to compete with anyone. We're building it because the studios we care about deserve better tools — tools that respect their independence, support their growth, and get out of the way so they can focus on what they do best: creating spaces where people move, breathe, and feel more alive.

---

*"The body is your temple. Keep it pure and clean for the soul to reside in."* — B.K.S. Iyengar

*Tandava is built with care for the studio community. Namaste.*
