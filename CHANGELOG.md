# Changelog

All notable changes to Tandava are documented here. The format is loosely based
on [Keep a Changelog](https://keepachangelog.com/), and the project follows
[SemVer](https://semver.org/) (pre-1.0, so minor versions may include breaking
schema changes).

## [Unreleased] — Deploy & transaction hardening

### Fixed
- **Migration conflict that broke `supabase db push`.** Removed the legacy
  `supabase/migrations/001_initial_schema.sql`, which defined an outdated
  `classes`/`messages` model and collided with the canonical `00001–00010`
  series (duplicate `CREATE TABLE`). `DEPLOYMENT.md` now references the correct
  migration series.
- **Events type/schema drift.** `StudioEvent`, `EventSession`,
  `EventPricingTier`, and `EventRegistration` in `src/types/database.ts` no
  longer declare columns that don't exist in the schema (e.g. `session_ids`,
  `series_id`); they now mirror the `events` tables exactly, and the
  `EventType`/`EventStatus`/`EventRegistrationStatus` enums match the DB enums.
- **`stripe-webhook` wrote non-existent columns** (legacy
  `memberships.plan_name`/`classes_remaining`/`user_id`). Handlers now insert
  into the canonical `transactions`, `bookings`, `memberships`, and
  `class_packs` tables and map Stripe statuses to the `membership_status` enum.

### Added
- **Route-level RBAC.** `/manage`, `/teach`, `/staff`, and authenticated member
  routes are now wrapped in `ProtectedRoute` (previously only `/admin` was).
  Added a `studio.teach` permission for the instructor portal. Demo mode still
  bypasses all guards.
- **Payments backend.** New `stripe-checkout` (drop-in, membership subscription,
  class pack) and `stripe-portal` Edge Functions — the functions the frontend
  was already calling but that did not exist. Prices are read server-side;
  callers are identified by JWT. Supports single-studio (direct charge) and
  platform (Stripe Connect destination charge, optional `PLATFORM_FEE_BPS`).
- **Email backend.** `supabase/functions/email/index.ts` HTTP entry point with a
  template dispatcher over the existing provider abstraction (Resend / SendGrid /
  SMTP / console).
- **Real CSV import engine** (`src/lib/connectors/`): a dependency-free RFC 4180
  parser, value transforms (`to_date`, `to_cents`, `to_phone`, …), alias-aware
  column auto-matching, and required-field/email validation with dedupe — plus
  13 unit tests. The import wizard now parses the user's actual file and reports
  real counts, preview rows, and validation errors instead of mock data.
- **Event registration window** (`migration 00011`):
  `events.registration_opens_at` / `registration_closes_at`.
- `docs/ROADMAP.md` June 2026 review section, `CHANGELOG.md`, and updated
  `README.md` / `DEPLOYMENT.md` / `.env.example`.

### Changed
- `src/lib/stripe.ts` checkout helpers now pass canonical IDs
  (`occurrenceId`, `membershipTypeId`, `classPackTypeId`).
- `package.json` version aligned to the documented pre-1.0 line (`0.1.0`).
