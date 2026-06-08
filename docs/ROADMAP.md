# Tandava Development Roadmap

## Vision
Tandava is an open-source (AGPL-3.0) studio management platform that provides feature parity with commercial solutions (MindBody, Momence, Walla, WellnessLiving, Arketa) while remaining accessible, customizable, and community-driven.

---

## June 2026 Engineering Review & Hardening

A full repo review (build/lint/typecheck/tests + feature audit vs Mindbody,
Arketa, Momence) surfaced several "won't deploy / can't transact" gaps. These
have now been addressed:

**Shipped in this pass**
- Removed a legacy `001_initial_schema.sql` that collided with the canonical
  `00001–00010` migration series on `supabase db push`.
- Added route-level RBAC guards to `/manage`, `/teach`, `/staff`, and member
  routes (previously only `/admin` was guarded) + a `studio.teach` permission.
- Implemented the `stripe-checkout` and `stripe-portal` Edge Functions the
  frontend already called, and aligned `stripe-webhook` to the canonical schema.
  Supports single-studio (direct) and Connect (destination charge) modes.
- Added the email Edge Function HTTP entry point over the provider abstraction.
- Reconciled the events types with the real schema and added a registration
  window (`00011`).
- Built a tested CSV import engine (parser, transforms, alias matching,
  validation, dedupe) and wired the import wizard to real file data.
- Added the booking **entitlement engine** (`src/lib/booking/entitlements.ts`,
  19 tests) + an atomic `book_class()` RPC (`00012`) + a `data.bookClass()`
  backend method. `BookingModal` now renders engine-resolved payment sources.

**Remaining to be studio-ready (priority order)**
1. **Booking loop — finish the data binding.** Core + plumbing done: entitlement
   engine, `book_class` RPC, `data.bookClass`, backend reads
   (`getUpcomingClasses`/`getMemberEntitlements`), React Query hooks
   (`src/hooks/useBooking.ts`), and a pluggable `BookingModal.onConfirm`.
   **Remaining:** swap `Schedule`/`MySchedule` from mock to `useUpcomingClasses`,
   pass `useBookingSources(...)` + an `onConfirm` that calls `useBookClass()`
   (covered) or `checkoutDropIn()` (drop-in); apply late-cancel fees on
   cancellation (engine's `isLateCancel` + a `late_cancel_fee` transaction); send
   the waitlist-promotion notification (the DB trigger already promotes).
2. Finish CSV import persistence (service-role function that creates member
   profiles + `studio_members` and writes `import_jobs`).
3. Workshop/event registration UX. **Done:** pricing core
   (`src/lib/events/pricing.ts`) + `EventRegistrationPanel` (tier picker,
   early-bird/member auto-resolution, partial-series session display,
   state-aware CTA) on the event detail page. **Remaining:** real
   `event_registrations` writes + Stripe checkout for events, deposits/payment
   plans, add-to-cart.
4. SMS + push notification providers behind `NotificationService`.
5. Make `/manage/onboarding` actually provision (upserts per step + Stripe
   Connect link), as the spine of non-technical setup.

**Installable-by-non-technical-studios plan**
- *Phase A:* one-click deploy buttons + `seed.sql` + guided env + first-run setup.
- *Phase B:* provisioning onboarding (#5) + working import (#2) — "deploy it" and
  "bring your data" together.
- *Phase C:* optional hosted / managed-fork provisioning service.

---

## Current State (V1 Alpha)

### Completed
- Multi-tenant architecture with Row Level Security
- Core scheduling with recurring rules and substitutions
- Booking system with waitlist management
- Membership types and active subscriptions
- Class pack purchase and consumption
- Stripe Connect payment integration
- Teacher payroll calculation
- Multi-location support
- Waivers with digital signatures
- Import infrastructure for data migration
- Comprehensive analytics dashboards (mock data)
- Demo mode with role switching
- Studio theming system (3 starter themes)
- Data connector hub (import/sync/export)

### In Development
- Real data connections (replacing mock data)
- Edge Functions for background processing

---

## Phased Roadmap

### Phase 1: Staff Experience + Retail + Membership Enhancements
**Goal:** Bring instructor and staff experience to parity; add retail/inventory; enhance membership flexibility

| Feature | Priority | PRD |
|---------|----------|-----|
| Staff Mobile Portal | P0 | [PRD-001](./prd/PRD-001-staff-portal.md) |
| Instructor Self-Service (availability, sub acceptance) | P0 | [PRD-001](./prd/PRD-001-staff-portal.md) |
| Shift Trading / Sub Marketplace | P1 | [PRD-001](./prd/PRD-001-staff-portal.md) |
| Tip Collection | P1 | [PRD-002](./prd/PRD-002-tips-commission.md) |
| Live Commission Tracking | P1 | [PRD-002](./prd/PRD-002-tips-commission.md) |
| Retail Product Sales | P0 | [PRD-003](./prd/PRD-003-retail-inventory.md) |
| Inventory Management | P1 | [PRD-003](./prd/PRD-003-retail-inventory.md) |
| Multi-Location Inventory | P2 | [PRD-003](./prd/PRD-003-retail-inventory.md) |
| Commitment Contract Enforcement | P1 | [PRD-004](./prd/PRD-004-membership-enhancements.md) |
| Corporate/Group Memberships | P1 | [PRD-004](./prd/PRD-004-membership-enhancements.md) |
| Family Plans | P1 | [PRD-004](./prd/PRD-004-membership-enhancements.md) |
| Dynamic Pricing (off-peak discounts) | P2 | [PRD-004](./prd/PRD-004-membership-enhancements.md) |
| Membership Add-Ons | P2 | [PRD-004](./prd/PRD-004-membership-enhancements.md) |

---

### Phase 2: Engagement & Communication
**Goal:** Enable proactive communication and engagement automation

| Feature | Priority | PRD |
|---------|----------|-----|
| Push Notifications (web) | P0 | [PRD-005](./prd/PRD-005-notifications.md) |
| Review Request Automation | P1 | [PRD-006](./prd/PRD-006-review-automation.md) ✅ |
| Two-Way SMS Conversations | P1 | [PRD-005](./prd/PRD-005-notifications.md) |
| Birthday/Anniversary Automation | P2 | [PRD-007](./prd/PRD-007-lifecycle-automation.md) ✅ |
| Multi-Step Drip Campaigns | P2 | [PRD-007](./prd/PRD-007-lifecycle-automation.md) ✅ |
| Lead Scoring | P2 | [PRD-007](./prd/PRD-007-lifecycle-automation.md) ✅ |

---

### Phase 3: Operations & Check-In
**Goal:** Streamline daily operations and reduce front-desk friction

| Feature | Priority | PRD |
|---------|----------|-----|
| Self Check-In Kiosk Mode | P0 | [PRD-008](./prd/PRD-008-check-in.md) |
| QR Code Check-In | P0 | [PRD-008](./prd/PRD-008-check-in.md) |
| Automated Waitlist Promotion | P0 | [PRD-009](./prd/PRD-009-waitlist-automation.md) |
| Cleaning/Turnover Buffers | P1 | [PRD-010](./prd/PRD-010-schedule-automation.md) ✅ |
| Smart Capacity Management | P2 | [PRD-010](./prd/PRD-010-schedule-automation.md) ✅ |

---

### Phase 4: Campaign & Advertising Hub
**Goal:** Centralize marketing campaigns, ad tracking, and promotional tools

| Feature | Priority | Status | PRD |
|---------|----------|--------|-----|
| Campaign Manager | P0 | ✅ Implemented | [PRD-011](./prd/PRD-011-campaign-hub.md) |
| Audience Segments | P0 | ✅ Implemented | [PRD-011](./prd/PRD-011-campaign-hub.md) |
| UTM Builder & Tracking | P1 | ✅ Implemented | [PRD-011](./prd/PRD-011-campaign-hub.md) |
| A/B Testing for Campaigns | P1 | ✅ Implemented | [PRD-011](./prd/PRD-011-campaign-hub.md) |
| Email Templates Library | P1 | ✅ Implemented | [PRD-011](./prd/PRD-011-campaign-hub.md) |
| Landing Page A/B Testing | P2 | ✅ Schema ready | [PRD-011](./prd/PRD-011-campaign-hub.md) |
| Ad Platform Integration (Meta, Google) | P1 | 🔮 Future | [PRD-011](./prd/PRD-011-campaign-hub.md) |
| Attribution Tracking (External Pixels) | P1 | 🔮 Future | [PRD-011](./prd/PRD-011-campaign-hub.md) |
| Real-time Ad Spend Sync | P2 | 🔮 Future | [PRD-011](./prd/PRD-011-campaign-hub.md) |
| Conversion API Webhooks | P2 | 🔮 Future | [PRD-011](./prd/PRD-011-campaign-hub.md) |

---

### Phase 5: Staff Task Management
**Goal:** Enable operational task assignment and tracking for staff

| Feature | Priority | Status | PRD |
|---------|----------|--------|-----|
| Task Creation & Assignment | P0 | ✅ Implemented | [PRD-012](./prd/PRD-012-task-management.md) |
| Task Board (Kanban View) | P0 | ✅ Implemented | [PRD-012](./prd/PRD-012-task-management.md) |
| Task List View | P0 | ✅ Implemented | [PRD-012](./prd/PRD-012-task-management.md) |
| Recurring Tasks | P1 | ✅ Implemented | [PRD-012](./prd/PRD-012-task-management.md) |
| Task Completion Tracking | P0 | ✅ Implemented | [PRD-012](./prd/PRD-012-task-management.md) |
| Task Comments & Activity | P1 | ✅ Implemented | [PRD-012](./prd/PRD-012-task-management.md) |
| Task Templates | P1 | ✅ Schema ready | [PRD-012](./prd/PRD-012-task-management.md) |
| Checklist Builder | P1 | ✅ Implemented | [PRD-012](./prd/PRD-012-task-management.md) |
| Staff Notifications (In-App) | P1 | ✅ Uses Phase 2 | [PRD-012](./prd/PRD-012-task-management.md) |

---

### Phase 6: Custom Report Builder
**Goal:** Allow studios to build their own custom reports and dashboards

| Feature | Priority | PRD |
|---------|----------|-----|
| Custom Report Builder | P0 | [PRD-013](./prd/PRD-013-custom-reports.md) |
| Saved Report Templates | P1 | [PRD-013](./prd/PRD-013-custom-reports.md) |
| Shareable Dashboard Links | P2 | [PRD-013](./prd/PRD-013-custom-reports.md) |
| Instructor Performance Reports | P1 | [PRD-013](./prd/PRD-013-custom-reports.md) |

---

### Future Phases (Prioritized Backlog)

#### Phase 7: Booking Enhancements
| Feature | Priority |
|---------|----------|
| Spot Selection / Room Maps | P1 |
| Equipment Reservation | P2 |
| Recurring Booking ("book me every week") | P1 |
| Family/Group Booking (single transaction) | P1 |

#### Phase 8: Payment Enhancements
| Feature | Priority | PRD |
|---------|----------|-----|
| Payment Plans / Installments | P0 | [PRD-014](./prd/PRD-014-payment-plans.md) ✅ |
| Auto-Pay Retry Logic | P0 | [PRD-014](./prd/PRD-014-payment-plans.md) ✅ |
| Universal Payment Abstraction | P0 | [PRD-014](./prd/PRD-014-payment-plans.md) ✅ |
| ACH / Direct Debit | P1 | [PRD-014](./prd/PRD-014-payment-plans.md) ✅ |
| Partial Refunds | P1 | - |
| In-Person POS / Terminal | P1 | - |
| Cash/Check Tracking | P2 | - |
| Invoice Generation | P1 | - |
| Tax Configuration | P1 | - |

#### Phase 9: Video & On-Demand
| Feature | Priority | Status | PRD |
|---------|----------|--------|-----|
| Video Library & Self-Hosting | P0 | ✅ Schema | [PRD-015](./prd/PRD-015-on-demand-video.md) |
| YouTube/Vimeo Embeds | P1 | ✅ Schema | [PRD-015](./prd/PRD-015-on-demand-video.md) |
| Live Streaming (Zoom) | P1 | ✅ Schema | [PRD-015](./prd/PRD-015-on-demand-video.md) |
| Auto-Record to Library | P1 | ✅ Schema | [PRD-015](./prd/PRD-015-on-demand-video.md) |
| Video Series & Programs | P1 | ✅ Schema | [PRD-015](./prd/PRD-015-on-demand-video.md) |
| Watch Progress & Resume | P1 | ✅ Schema | [PRD-015](./prd/PRD-015-on-demand-video.md) |
| Collections & Playlists | P2 | ✅ Schema | [PRD-015](./prd/PRD-015-on-demand-video.md) |
| Video Purchases & Rentals | P1 | ✅ Schema | [PRD-015](./prd/PRD-015-on-demand-video.md) |
| On-Demand Subscription | P2 | ✅ Schema | [PRD-015](./prd/PRD-015-on-demand-video.md) |
| Offline Download | P3 | Planned | [PRD-015](./prd/PRD-015-on-demand-video.md) |

#### Phase 10: Marketplace Integrations
| Feature | Priority |
|---------|----------|
| ClassPass Integration | P0 |
| Gympass Integration | P1 |
| Google Calendar Sync | P1 |
| Apple Calendar Sync | P1 |

#### Phase 11: Franchise/Multi-Studio
| Feature | Priority |
|---------|----------|
| HQ Dashboard (multi-location roll-up) | P1 |
| Franchise Fee Management | P2 |
| Cross-Location Memberships | P1 |
| Centralized Reporting | P1 |

#### Phase 12: Mobile Apps
| Feature | Priority |
|---------|----------|
| Branded Consumer App (white-label) | P1 |
| Staff Mobile App (native) | P1 |
| Apple Watch / Wear OS Support | P3 |

#### Phase 13: Advanced Features
| Feature | Priority |
|---------|----------|
| AI Churn Prediction | P2 |
| AI Front Desk Assistant | P3 |
| Gamification Leaderboards | P2 |
| Progress Photos/Measurements | P3 |
| Door Access Control (Kisi) | P2 |

#### Platform Infrastructure (Cross-cutting)
| Feature | Priority | Status |
|---------|----------|--------|
| Feature Toggles | P0 | ✅ Implemented |
| Audit Logging (Enterprise) | P0 | ✅ Implemented |
| Notification Provider Abstraction | P0 | ✅ Implemented |
| Import System with Provider Detection | P0 | ✅ Implemented |
| Universal Payment Abstraction | P0 | ✅ Implemented |

---

## Feature Index

### By Category

#### Scheduling & Booking
- [x] Recurring schedule rules
- [x] Class occurrences with overrides
- [x] Substitution tracking
- [x] Waitlist management
- [ ] Spot selection / room maps
- [ ] Equipment reservation
- [ ] Recurring booking
- [ ] Hybrid classes

#### Members & Students
- [x] Member profiles
- [x] Emergency contacts
- [x] Membership types (weekly/monthly/annual)
- [x] Class packs
- [ ] Family plans
- [ ] Corporate memberships
- [ ] Member engagement scoring (schema ready)

#### Staff & Teachers
- [x] Role-based access (owner/admin/teacher/front_desk)
- [x] Payroll calculation
- [ ] Staff mobile portal
- [ ] Shift trading
- [ ] Live commission tracking
- [ ] Task management

#### Payments & Billing
- [x] Stripe Connect integration
- [x] Membership purchases
- [x] Class pack purchases
- [x] Promo codes
- [ ] Payment plans
- [ ] Retry logic
- [ ] POS terminal
- [ ] Invoicing

#### Marketing & Communication
- [x] Landing page builder (schema ready)
- [x] Promo codes & campaigns
- [ ] Email builder
- [ ] SMS conversations
- [ ] Review automation
- [ ] Drip campaigns
- [ ] Campaign hub

#### Analytics & Reporting
- [x] Member analytics dashboard
- [x] Sales analytics dashboard
- [x] Financial analytics dashboard
- [x] Site analytics dashboard
- [ ] Custom report builder
- [ ] Scheduled report delivery
- [ ] Benchmark comparisons (schema ready)

#### Operations
- [x] Multi-location support
- [x] Waivers & signatures
- [ ] Self check-in kiosk
- [ ] QR code check-in
- [ ] Automated waitlist
- [ ] Turnover buffers

#### Integrations
- [x] Data import connectors (MindBody, Walla, etc.)
- [x] Webhook infrastructure (schema ready)
- [ ] Mailchimp/Klaviyo sync
- [ ] QuickBooks/Xero sync
- [ ] ClassPass/Gympass
- [ ] Calendar sync

#### Retail
- [ ] Product catalog
- [ ] Inventory management
- [ ] POS integration
- [ ] Barcode scanning

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on contributing to Tandava.

Each PRD in `/docs/prd/` follows the Jobs to Be Done framework:
1. **Job Statement:** When [situation], I want to [motivation], so I can [expected outcome]
2. **User Stories:** Specific scenarios with acceptance criteria
3. **Edge Cases:** What could go wrong and how we handle it
4. **Success Metrics:** How we measure if this feature is working
5. **Technical Design:** Schema, API, and UI considerations
