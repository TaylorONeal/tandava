# Key Files Index

Quick reference to the most important files in the Tandava codebase.

---

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, version |
| `tsconfig.json` | TypeScript configuration |
| `tailwind.config.ts` | Tailwind CSS configuration, theme colors |
| `vite.config.ts` | Build configuration, aliases |
| `index.html` | HTML entry point, meta tags, fonts |
| `public/manifest.json` | PWA manifest, app icons |

---

## Core Application

### Entry Points

| File | Purpose |
|------|---------|
| `src/main.tsx` | React entry point |
| `src/App.tsx` | **Route definitions**, layout structure |
| `src/index.css` | Global styles, Tailwind imports |

### Contexts (Global State)

| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.tsx` | User authentication, session |
| `src/contexts/DemoContext.tsx` | Demo mode, mock personas |
| `src/contexts/ThemeContext.tsx` | Dark/light theme |

### Types & Database

| File | Purpose |
|------|---------|
| `src/types/database.ts` | **All database types**, key interfaces |
| `src/lib/supabase.ts` | Supabase client instance |

### Utilities

| File | Purpose |
|------|---------|
| `src/lib/utils.ts` | `cn()` class merger, common helpers |
| `src/hooks/use-toast.ts` | Toast notifications |
| `src/hooks/use-mobile.tsx` | Mobile detection hook |

---

## UI Components

### Base UI (shadcn)

Located in `src/components/ui/`:

| Component | Usage |
|-----------|-------|
| `button.tsx` | All buttons |
| `card.tsx` | Card containers |
| `dialog.tsx` | Modal dialogs |
| `input.tsx` | Text inputs |
| `select.tsx` | Dropdowns |
| `tabs.tsx` | Tab navigation |
| `badge.tsx` | Status badges |
| `toast.tsx` | Toast notifications |
| `accordion.tsx` | Expandable sections |
| `dropdown-menu.tsx` | Context menus |

### Layout Components

| File | Purpose |
|------|---------|
| `src/components/layout/AppLayout.tsx` | Member-facing layout |
| `src/components/manage/ManageLayout.tsx` | Studio admin layout |

### Feature Components

| Directory | Purpose |
|-----------|---------|
| `src/components/booking/` | Booking modal, payment selection |
| `src/components/schedule/` | Class cards, filters, calendar |
| `src/components/email/` | Email templates |

---

## Pages

### Member-Facing (`src/pages/`)

| File | Route | Purpose |
|------|-------|---------|
| `Index.tsx` | `/` | Home/dashboard |
| `Schedule.tsx` | `/schedule` | Browse classes |
| `MySchedule.tsx` | `/my-schedule` | Booked classes |
| `Account.tsx` | `/account` | Profile, settings |
| `OnDemand.tsx` | `/on-demand` | Video library |
| `Demo.tsx` | `/demo` | Demo landing page |

### Authentication (`src/pages/auth/`)

| File | Route | Purpose |
|------|-------|---------|
| `Login.tsx` | `/auth/login` | Sign in |
| `Register.tsx` | `/auth/register` | Sign up |

### Studio Management (`src/pages/manage/`)

| File | Route | Purpose |
|------|-------|---------|
| `Dashboard.tsx` | `/manage` | Owner dashboard |
| `ScheduleManage.tsx` | `/manage/schedule` | Class management |
| `Students.tsx` | `/manage/students` | Member management |
| `Teachers.tsx` | `/manage/teachers` | Instructor management |
| `Financials.tsx` | `/manage/financials` | Revenue, billing |
| `AnalyticsHub.tsx` | `/manage/analytics` | Analytics overview |
| `Settings.tsx` | `/manage/settings` | Studio settings |
| `DataDictionary.tsx` | `/manage/data-dictionary` | Metrics reference |
| `Definitions.tsx` | `/manage/definitions` | Industry glossary |

### Instructor Portal (`src/pages/teach/`)

| File | Route | Purpose |
|------|-------|---------|
| `Dashboard.tsx` | `/teach` | Teacher dashboard |
| `Schedule.tsx` | `/teach/schedule` | Teaching schedule |
| `Subs.tsx` | `/teach/subs` | Sub requests |
| `Earnings.tsx` | `/teach/earnings` | Pay history |

---

## Database (Supabase)

### Migrations

Located in `supabase/migrations/`:

```
001_initial_schema.sql      # Core tables
002_add_user_profiles.sql   # User profiles
...
008_phase_5_prd_impl.sql    # Phase 5 features
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `users` | Supabase auth users |
| `profiles` | User profile data |
| `studios` | Studio entities |
| `studio_members` | Studio membership associations |
| `class_templates` | Reusable class definitions |
| `class_occurrences` | Scheduled class instances |
| `bookings` | Class reservations |
| `memberships` | Active subscriptions |
| `class_packs` | Prepaid class bundles |
| `transactions` | Payment records |
| `notification_logs` | Notification history |
| `audit_logs` | System audit trail |

---

## Documentation

| File | Purpose |
|------|---------|
| `docs/ai-agents/AGENTS.md` | AI assistant guide |
| `docs/ai-agents/KEY_FILES.md` | This file |
| `docs/ai-agents/LESSONS_LEARNED.md` | Common issues |
| `docs/ai-agents/DESIGN_SYSTEM.md` | UI patterns |
| `docs/architecture/VERSION_MANAGEMENT.md` | Upgrade strategy |
| `docs/architecture/RELIABILITY.md` | SLA, monitoring |
| `docs/architecture/MAINTAINABILITY.md` | Code quality |
| `docs/app-store/SUBMISSION_GUIDE.md` | iOS/Android submission |

---

## Testing

| Directory | Purpose |
|-----------|---------|
| `tests/unit/` | Unit tests |
| `tests/integration/` | API/DB tests |
| `tests/e2e/` | End-to-end tests |

---

## Static Assets

| Directory | Purpose |
|-----------|---------|
| `public/favicon.svg` | SVG favicon |
| `public/favicon.ico` | ICO fallback |
| `public/icons/` | PWA icons |
| `public/manifest.json` | PWA manifest |
| `public/sw.js` | Service worker |

---

## Quick Find Commands

```bash
# Find all TypeScript interfaces
grep -r "export interface" src/types/

# Find all page components
ls -la src/pages/

# Find all route definitions
grep -r "Route path=" src/App.tsx

# Find component usage
grep -r "ComponentName" src/

# Find TODO comments
grep -r "TODO" src/

# Find all hooks
ls -la src/hooks/
```

---

*Update this file when adding significant new files or directories.*
