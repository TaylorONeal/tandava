# Project Status

Current state of Tandava for evaluators, contributors, and potential users.

**Last Updated:** 2024

---

## Overview

Tandava is in **active development**. The demo showcases the complete UI and user workflows, but production deployment requires backend integration.

---

## What Works (Demo Mode)

These features are fully functional in demo mode with mock data:

### Core Operations
| Feature | Status | Notes |
|---------|--------|-------|
| Schedule management | ✓ Working | Create, edit, cancel classes |
| Class bookings | ✓ Working | Book, cancel, waitlist |
| Student roster | ✓ Working | View, search, filter members |
| Teacher management | ✓ Working | Profiles, assignments, availability |
| Check-in system | ✓ Working | Roster check-in, kiosk mode |
| Multi-location | ✓ Working | 3 demo locations |

### Analytics & Reporting
| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard metrics | ✓ Working | Charts, KPIs, trends |
| Member analytics | ✓ Working | Retention, engagement |
| Financial reports | ✓ Working | Revenue, transactions |
| Attendance reports | ✓ Working | Class fill rates |

### UI Features
| Feature | Status | Notes |
|---------|--------|-------|
| Role-based access | ✓ Working | Owner, Front Desk, Teacher, Student |
| Dark mode | ✓ Working | System preference or manual |
| Mobile responsive | ✓ Working | All breakpoints |
| Kiosk mode | ✓ Working | Full-screen check-in |

---

## What Needs Backend Integration

These features have UI implemented but require backend connection for production:

### Critical Path
| Feature | UI Status | Backend Status | Notes |
|---------|-----------|----------------|-------|
| **Authentication** | ✓ Complete | ⚠ Mock only | Supabase Auth configured but using mock user |
| **Data persistence** | ✓ Complete | ⚠ Schema ready | Supabase migrations exist, not connected |
| **Payment processing** | ✓ Complete | ✗ Not connected | Stripe Connect ready, needs integration |
| **Email notifications** | ✓ UI exists | ✗ Not connected | Templates designed, no provider |

### Secondary Features
| Feature | UI Status | Backend Status | Notes |
|---------|-----------|----------------|-------|
| SMS notifications | ✓ Settings UI | ✗ Not connected | Twilio recommended |
| Calendar sync | ✓ Mentioned | ✗ Not implemented | iCal export planned |
| Waitlist auto-promote | ✓ UI exists | ✗ Not connected | Logic ready, needs triggers |
| Recurring bookings | ✓ UI exists | ⚠ Partial | Needs cron/scheduling |

---

## Placeholder Features

These show "coming soon" in the UI:

| Feature | Location | Notes |
|---------|----------|-------|
| Reviews | Instructor/Studio detail pages | "Reviews coming soon" |
| Calendar view | Schedule page | Alternative grid view |

---

## Technical Debt

Items to address before production:

### Performance
- [ ] Main JS bundle is 1.1MB (should code-split admin routes)
- [ ] No lazy loading for `/manage/*` routes
- [ ] Images from Unsplash (should be optimized/self-hosted)

### Missing Assets
- [ ] `/public/og-image.png` - Social share image (referenced but missing)
- [ ] `/public/icons/` - PWA icons (9 files referenced but missing)

### Code Quality
- [ ] `FeatureSettings.tsx:517` - "TODO: Save to API"
- [ ] `AuditLogs.tsx:726` - "TODO: Implement export"
- [ ] Some hardcoded demo domain references

---

## Database Schema

**Status:** ✓ Ready

- Supabase migrations exist in `/supabase/migrations/`
- Schema includes all core tables
- Row-Level Security (RLS) policies defined
- Multi-tenant by `studio_id`

**To activate:**
1. Run `supabase start` (requires Docker)
2. Run `supabase db reset` to apply migrations
3. Update `.env.local` with credentials
4. Remove `VITE_DEMO_MODE=true`

---

## API Integration

**Status:** ⚠ Partially Ready

- Supabase client configured in `/src/lib/supabase.ts`
- Environment variables properly scoped (`VITE_*` prefix)
- Auth context prepared for real authentication

**Remaining work:**
1. Connect React Query hooks to Supabase
2. Implement real-time subscriptions
3. Add error boundaries for API failures

---

## Deployment Ready

| Item | Status |
|------|--------|
| Vite build | ✓ Succeeds |
| TypeScript strict | ✓ No errors |
| ESLint | ✓ Configured |
| Environment handling | ✓ Proper VITE_ prefix |
| Static assets | ⚠ Missing some PWA icons |
| Service worker | ✓ Present |

---

## Recommended Path to Production

### Phase 1: Demo Site (Current)
- [x] Demo mode working
- [x] Build succeeds
- [x] Open source landing page
- [ ] Add missing social/PWA assets
- [ ] Deploy to Vercel

### Phase 2: Alpha (Self-Hosters)
- [ ] Connect Supabase for data persistence
- [ ] Implement real authentication
- [ ] Basic email notifications
- [ ] Documentation for self-hosting

### Phase 3: Beta (Early Adopters)
- [ ] Stripe Connect integration
- [ ] Full notification system
- [ ] Calendar sync
- [ ] Performance optimization

### Phase 4: Production
- [ ] Security audit
- [ ] Load testing
- [ ] Monitoring/alerting
- [ ] Support documentation

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

**Good first issues:**
- Add missing PWA icons
- Implement audit log export
- Add feature settings API connection
- Write tests for core booking logic

---

## Questions?

- Open a [GitHub issue](https://github.com/TaylorONeal/tandava/issues)
- Check the [documentation](INDEX.md)

