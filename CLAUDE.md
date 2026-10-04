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
│   ├── migrations/     # Database migrations
│   ├── functions/      # Edge functions (stripe-checkout, stripe-webhook, stripe-connect)
│   └── tests/          # Plain-SQL DB tests (run via npm run test:db)
├── docs/
│   ├── architecture/   # Domain model, RBAC, compliance
│   ├── developer/      # Visual docs with Mermaid diagrams
│   ├── guides/         # User-facing guides
│   ├── plans/          # Launch PRD, backlog, progress
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

## Launch work in flight

Start at `docs/plans/PRD-launch-v1.md` (why), `docs/plans/BACKLOG.md` (ordered tasks, pick the first NEXT
whose Needs are DONE) and `docs/plans/PROGRESS.md` (state). Diagrams: `docs/developer/07-launch-architecture.md`.
Verify with `npm run typecheck && npm test && npm run build && npm run test:db` (CI runs the same).
`test:db` builds a throwaway local Postgres; never point it at production.

Rules learned the hard way (full list in `docs/ai-agents/LESSONS_LEARNED.md`):
- Every new table: RLS + policy + test in the same migration. Use `(SELECT auth.uid())` and `my_staff_studio_ids()`.
- Every SECURITY DEFINER function: pin `search_path`, `REVOKE` from PUBLIC and anon.
- Money events are idempotent by Stripe event id; entitlement changes go through the ledger trigger only.
- Prove a new test fails without the fix before trusting it.
- Update docs and `.env.example` in the same PR. Home page mode is `VITE_HOME_MODE` (platform|discover).

## Access and tooling (cloud sessions)

Set up once, so nobody rediscovers it:

| Need | Works | Does not | Use |
|---|---|---|---|
| GitHub PRs, checks, comments | `gh api repos/TaylorONeal/tandava/...` (REST) | `gh pr ...` and `gh auth status` (GraphQL blocked, GH_TOKEN reported invalid but REST is authenticated) | `gh api .../pulls/N`, `.../commits/SHA/check-runs`, `.../pulls/N/ccr/review_threads` |
| Git push | `git push` | | Branch tracking needs `remote.origin.fetch` for the branch |
| Edge function typecheck | `npm i -g deno`, `npm run check:edge` | github.com release downloads (403) | Install CLIs via npm, not release tarballs |
| Supabase CLI | `npm i -g supabase` | | Local DB tests use `npm run test:db` (plain Postgres, no Docker needed) |
| Browser tests | `npm run test:e2e` (Playwright, Supabase mocked). Locally: `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` | `playwright install` (no network) | CI installs its own Chromium |
| Vercel preview | Vercel MCP `web_fetch_vercel_url` (bypass built in, returns headers) | plain curl (SSO 401) | Use it to verify headers and pages |
| Stripe CLI | not installable (release download blocked) | | Replay events by POSTing signed payloads, or run from Taylor's machine |

## Database

- Migrations in `supabase/migrations/`
- Row-Level Security (RLS) enforces multi-tenancy
- All tables have `studio_id` for isolation
- Schema changes require new migration files
