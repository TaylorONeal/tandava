# AGENTS.md

Guidance for AI coding agents (and humans) working on this codebase. Any agent can use it; tool-specific files such as `CLAUDE.md` point here.

More detail for agents lives in [`docs/ai-agents/`](docs/ai-agents/AGENTS.md), including [LESSONS_LEARNED.md](docs/ai-agents/LESSONS_LEARNED.md).

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
- Prod DB changes: see "Production database changes" in LESSONS_LEARNED. Prod has no migration tracking table, so inspect the schema with read-only SQL before proposing a change.
- Merging main: renumber our migrations after main's, rehearse in prod order locally (`pg_ctlcluster 16 main start`), run all four verify commands before pushing.
- Prove a new test fails without the fix before trusting it.
- Update docs and `.env.example` in the same PR. Home page mode is `VITE_HOME_MODE` (platform|discover).

## Database

- Migrations in `supabase/migrations/`
- Row-Level Security (RLS) enforces multi-tenancy
- All tables have `studio_id` for isolation
- Schema changes require new migration files

## Android dev app ID (sideloaded builds)

Never sideload a build that uses the Play app ID `com.tandava.studio`. Google Play re-signs every release with its own key, so a copy installed over USB, adb or from a CI/Codemagic APK under the Play ID has a different signature, and Play can't update it until it is uninstalled.

- Debug builds always install as `com.tandava.studio.dev`, named "Tandava Studio Dev", beside the Play copy. Set in `native/studio/android/app/build.gradle` (`buildTypes.debug.applicationIdSuffix`); the launcher label comes from the `appLabel` manifest placeholder.
- A release-variant QA APK that will be sideloaded must be built with `ANDROID_DEV_ID=1` (or `-PandroidDevId=1`), which gives it the same `.dev` ID.
- Play AABs are built without `ANDROID_DEV_ID` and keep `com.tandava.studio`. Test Play behaviour (updates, billing, install referrer) only from a Play install (internal testing track), never from a sideload.
- The activity class keeps the real namespace: launch with `adb shell am start -n com.tandava.studio.dev/com.tandava.studio.MainActivity`. Check what is on a device with `adb shell pm list packages -i | grep com.tandava.studio` (`installer=com.android.vending` is Play, `null` is a sideload).
- If an old sideload under `com.tandava.studio` is on a device, uninstall it once and reinstall from Play.
- Applies to the Studio app (`native/studio/android`). The member app (`com.tandava.app`) has no Android project yet; give it the same rule when it gets one.

## Writing agent instructions

Keep this file and `docs/ai-agents/` tool-neutral and written for current models: goals, hard limits, sources of truth and how to check the result. No step-by-step reasoning templates, and no model names or versions.

## Secrets

Never write a secret into any file: code, config, docs, notes, prompts, submission notes, logs or commit messages. That covers API keys (RevenueCat and Stripe `sk_` keys included), Supabase service role keys and JWT secrets, access tokens (Codemagic, Vercel, GitHub, Expo), deploy keys, and the contents of `.p8` or `.pem` files. Write where the secret lives instead, for example "RevenueCat dashboard > API keys" or "Supabase secrets", and read it from an environment variable. The secret-scan check (`.github/workflows/secret-scan.yml`, rules in `.gitleaks.toml`) fails any pull request that adds one. If a real secret was ever committed, removing it is not enough: say so, so the key gets rotated.
