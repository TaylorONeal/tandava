# Claude Code Instructions

Context for AI assistants working on this codebase.

---

## Project Overview

Tandava is an **open-source studio management platform** for yoga, pilates, and movement studios. It handles scheduling, memberships, payments, and operations.

**Key principle:** This system models **universal studio reality**, not any proprietary software system.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Payments | Stripe Connect |

---

## Project Structure

```
tandava/
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts (Auth, Demo, Theme)
│   ├── data/demo/      # Demo mode data (Oxatl Yoga)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities
│   ├── pages/          # Route components
│   └── types/          # TypeScript types
├── supabase/
│   └── migrations/     # Database migrations
├── docs/
│   ├── architecture/   # Domain model, RBAC, compliance
│   ├── developer/      # Visual docs with Mermaid diagrams
│   ├── guides/         # User-facing guides
│   └── prd/            # Product requirements
└── public/             # Static assets
```

---

## Key Documentation

| Document | Purpose |
|----------|---------|
| [docs/developer/01-domain-model.md](docs/developer/01-domain-model.md) | Entity relationships (with diagrams) |
| [docs/developer/02-architecture.md](docs/developer/02-architecture.md) | System layers and data flow |
| [docs/developer/03-key-flows.md](docs/developer/03-key-flows.md) | Sequence diagrams for operations |
| [docs/architecture/DOMAIN_MODEL.md](docs/architecture/DOMAIN_MODEL.md) | Conceptual foundations |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [DATA_INTEROPERABILITY.md](DATA_INTEROPERABILITY.md) | Legal posture and data ownership |

---

## Core Domain Concepts

**Entities to understand:**
- **Studio** → owns locations, staff, offerings
- **Offering** → class type template (e.g., "Vinyasa Flow")
- **Session** (`class_occurrences`) → scheduled instance
- **Booking** → operational fact (intent to attend)
- **Check-in** → attendance confirmation
- **Entitlement** → permission to attend (membership, pack)
- **Transaction** → financial settlement

**Key separations:**
- Booking ≠ Transaction (operations ≠ finance)
- Entitlement ≠ Payment (permission ≠ purchase)
- Session exists independently of payment status

---

## Coding Guidelines

**Do:**
- Use existing component patterns from `src/components/ui/`
- Follow TypeScript strict mode
- Use Tailwind for styling
- Keep components small and focused
- Read existing code before modifying

**Don't:**
- Introduce proprietary dependencies
- Create vendor-specific abstractions
- Collapse distinct domain concepts
- Skip database migrations for schema changes

---

## Running Locally

```bash
npm install
echo "VITE_DEMO_MODE=true" > .env.local
npm run dev
```

Opens at http://localhost:8080 with demo data.

---

## When Making Changes

1. **Read relevant docs first** — especially domain model and flows
2. **Check for existing patterns** — components, hooks, utilities
3. **Run build before committing** — `npm run build`
4. **Keep PRs focused** — one concern per PR

---

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Component | PascalCase | `BookingCard.tsx` |
| Hook | camelCase with `use` | `useBookings.ts` |
| Utility | camelCase | `formatCurrency.ts` |
| Page | PascalCase | `ManageSchedule.tsx` |
| Type | PascalCase | `Booking.ts` |

---

## Database

- Migrations in `supabase/migrations/`
- Row-Level Security (RLS) enforces multi-tenancy
- All tables have `studio_id` for isolation
- Schema changes require new migration files
