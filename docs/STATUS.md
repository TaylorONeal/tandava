# Project Status

Current state of Tandava for evaluators, contributors, and potential users.

**Last Updated:** February 2026

---

## Overview

Tandava is in **active development**. The interactive demo showcases UI and user workflows across all four roles (Student, Teacher, Studio Owner, Front Desk). All features use mock data with local React state — no backend required to explore.

Production deployment requires connecting the Supabase backend (schema and migrations exist but are not wired to the UI).

---

## What Works (Demo Mode)

These features are interactive in demo mode with mock data. Actions (booking, canceling, adding classes) update local state and show toast confirmations, but nothing persists across page reloads.

### Student Features
| Feature | Status | Notes |
|---------|--------|-------|
| Browse schedule | Working | Filter by style, level, location, teacher; search by name |
| Book a class | Working | Quick-book for members, payment source selection, confirmation |
| Cancel booking | Working | Cancel deadline warnings, confirmation dialog, toast feedback |
| Waitlist | Working | Join waitlist when class is full, see waitlist status |
| My Schedule | Working | Upcoming/past tabs, cancel from list, rate past classes |
| Account settings | Working | Profile display, membership info, notification preferences |
| Community page | Working | Announcements, events, teacher spotlights |

### Studio Owner Features (Manage)
| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard | Working | KPI cards, today's schedule, recent activity, action items |
| Schedule management | Working | View daily schedule, add new classes (with recurring option), cancel classes |
| Student roster | Working | Search, filter, click for detailed profile with stats |
| Teacher management | Working | Search, view profiles with certifications, schedules, pay rates |
| Financials | Working | Membership types, class packs, transaction history |
| Events page | Working | Workshop/event listing with details |
| Offerings management | Working | Pricing tiers, membership plans |
| Promo codes | Working | Discount code listing and management UI |
| Products & inventory | Working | Retail product management, inventory tracking, purchase orders |
| Landing pages | Working | Marketing page builder UI |
| UTM builder | Working | Campaign link generator |
| Campaigns | Working | Marketing campaign management |
| Tasks | Working | Internal task tracking |
| Reports | Working | Analytics and reporting views |
| Import data | Working | Data import wizard UI |
| SMS inbox | Working | Message thread viewer |
| Notification settings | Working | Email provider config (Resend/SendGrid/SMTP), notification preferences |
| Feature settings | Working | Toggle optional features on/off |
| Audit logs | Working | Enterprise audit viewer with filtering and search |
| Studio settings | Working | Branding, hours, location configuration |

### Teacher Features (Teach)
| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard | Working | Upcoming classes, earnings summary, student stats |
| My Schedule | Working | Teaching schedule view |
| Availability | Working | Set weekly availability |
| Sub management | Working | View/claim sub requests |
| Earnings | Working | Revenue and payment history |
| Profile | Working | Bio, certifications, specialties |

### Kiosk Mode
| Feature | Status | Notes |
|---------|--------|-------|
| QR scan check-in | Working | Simulated QR scanning with progress animation |
| Manual search | Working | Name/phone lookup with live results |
| Class roster | Working | Today's classes with capacity indicators |
| Success/error states | Working | Auto-dismiss with appropriate messaging |

### Cross-Cutting Features
| Feature | Status | Notes |
|---------|--------|-------|
| Role switching | Working | Demo panel switches persona, navigates to role-specific area |
| Role-based access | Working | ProtectedRoute enforces permissions per role |
| Theme system | Working | 3 themes (Mystic Night, Morning Light, Clean Studio) + customization |
| Mobile responsive | Working | All layouts adapt to mobile/tablet/desktop |
| Service worker | Present | Cache-first offline support in `/public/sw.js` |

---

## What Does NOT Work Yet

### Not Connected to Backend
| Feature | UI Exists | Backend Status | Notes |
|---------|-----------|----------------|-------|
| **Authentication** | Complete | Mock only | Supabase Auth configured, using demo personas |
| **Data persistence** | Complete | Schema ready | 10 migration files (7,500+ lines SQL), not wired to UI |
| **Payment processing** | Partial | Not connected | Stripe Connect types exist, no live integration |
| **Email sending** | Partial | Provider abstraction exists | Resend/SendGrid/SMTP abstraction layer, no triggers |
| **Real-time updates** | None | Not implemented | No Supabase realtime subscriptions |

### Missing Features
| Feature | Status | Notes |
|---------|--------|-------|
| Front desk check-in page | Placeholder only | Component exists at `/staff/checkin` but route not registered in App.tsx; shows empty state |
| Calendar view | Not implemented | Schedule page has toggle button, shows "Coming soon" |
| Reviews/ratings submission | Placeholder | "Reviews coming soon" on instructor pages |
| iCal/calendar sync | Not implemented | No calendar export functionality |
| Waitlist auto-promotion | Types only | Notification types defined, no promotion logic |
| Recurring booking UI | Schema only | Database tables exist, no user-facing form |
| SMS sending | Not connected | Twilio settings UI exists, no actual integration |

---

## Technical Debt

### Performance
- [ ] No code splitting — all routes are statically imported in `App.tsx`
- [ ] No `React.lazy()` usage for `/manage/*`, `/teach/*`, `/admin/*` routes
- [ ] Images from Unsplash CDN (7+ files reference `images.unsplash.com`)

### Missing Assets
- [ ] `/public/og-image.png` — social share image (referenced in meta tags but missing)
- [ ] `/public/icons/` — PWA icon directory (missing)

### Code Quality
- [ ] `FeatureSettings.tsx:517` — `TODO: Save to API`
- [ ] `AuditLogs.tsx:726` — `TODO: Implement export`
- [ ] Hardcoded demo data throughout page components (should centralize in `src/data/demo/`)

---

## Database Schema

**Status:** Ready (not connected)

- 10 migration files in `/supabase/migrations/` totaling 7,500+ lines of SQL
- Covers: studios, locations, rooms, offerings, sessions, bookings, check-ins, memberships, transactions, teachers, staff, notifications, campaigns, audit logs, and more
- Row-Level Security (RLS) policies defined for multi-tenancy
- All tables isolated by `studio_id`

**To activate:**
1. Run `supabase start` (requires Docker)
2. Run `supabase db reset` to apply migrations
3. Update `.env.local` with Supabase credentials
4. Remove `VITE_DEMO_MODE=true`

---

## Backend Abstraction Layer

**Status:** Implemented

- `/src/lib/backend.ts` — provider-agnostic backend interface
- Abstracts auth, data queries, and storage operations
- Currently backed by mock/demo implementations
- Designed to swap in Supabase client without changing consumer code

---

## Deployment

| Item | Status |
|------|--------|
| Vite build | Succeeds (clean) |
| TypeScript strict | No errors |
| ESLint | Configured (flat config, v9) |
| Environment handling | Proper `VITE_` prefix scoping |
| Service worker | Present (`/public/sw.js`) |
| License | AGPL-3.0 |

---

## Recommended Path to Production

### Phase 1: Interactive Demo (Current)
- [x] Demo mode with role switching
- [x] All four roles navigable (Student, Owner, Teacher, Kiosk)
- [x] Build succeeds clean
- [x] AGPL-3.0 license
- [ ] Register `/staff/checkin` route in App.tsx
- [ ] Add missing PWA/social assets
- [ ] Deploy demo to Vercel/Netlify

### Phase 2: Backend Integration
- [ ] Wire Supabase client to React Query hooks
- [ ] Implement real authentication flow
- [ ] Connect booking/cancellation to database
- [ ] Basic email notifications via Edge Functions

### Phase 3: Payments & Notifications
- [ ] Stripe Connect onboarding flow
- [ ] Payment processing for memberships and class packs
- [ ] Email/SMS notification triggers
- [ ] Calendar sync (iCal export)

### Phase 4: Production Readiness
- [ ] Code splitting and lazy loading
- [ ] Self-host images (replace Unsplash)
- [ ] Security audit
- [ ] Performance optimization
- [ ] Monitoring and error tracking (Sentry configured)

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

**Good first issues:**
- Register `/staff/checkin` route in App.tsx
- Add missing PWA icons
- Implement calendar view on Schedule page
- Implement audit log export (`AuditLogs.tsx:726`)
- Connect feature settings save to API (`FeatureSettings.tsx:517`)
- Write tests for booking flow logic

---

## Questions?

- Open a [GitHub issue](https://github.com/TaylorONeal/tandava/issues)
- Check the [documentation](INDEX.md)
