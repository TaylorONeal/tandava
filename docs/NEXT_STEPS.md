# Tandava: What's Next

A prioritized task list for continuing development. Updated as phases complete.

---

## Current Status Summary

**Completed:**
- Multi-tenant architecture with RLS (140+ tables)
- Core UI for all major features (scheduling, bookings, members, staff, analytics)
- Phase 1-5 schemas and UI components
- Demo mode with Oxatl Yoga dataset (500 members, 2018 historical data)
- Data connector infrastructure (import/export/sync schemas)
- Reference data (50 class styles, 30 workshop types, provider detection)

**In Progress:**
- Wiring real data to replace mock data
- Edge Functions for background processing

---

## Priority 1: Production Foundation

These items bridge the gap between demo and production-ready.

### 1.1 Wire Real Data to UI

**Effort:** Medium | **Value:** Critical

Replace mock data with actual Supabase queries in existing components.

| Page | Status | Notes |
|------|--------|-------|
| `/manage/dashboard` | Needs wiring | Real-time stats, today's schedule |
| `/manage/students` | Needs wiring | Member list, search, filters |
| `/manage/teachers` | Needs wiring | Staff roster, payroll |
| `/manage/schedule` | Needs wiring | Class occurrences, rules |
| `/manage/financials` | Needs wiring | Transactions, memberships |
| `/manage/analytics/*` | Needs wiring | All analytics dashboards |
| `/manage/campaigns` | Needs wiring | Campaign manager |
| `/manage/tasks` | Needs wiring | Task management |

**Approach:**
1. Create Supabase client hooks for each entity type
2. Update components to use `useQuery` with real data
3. Keep demo fallback for `VITE_DEMO_MODE=true`
4. Test with seed data in local Supabase

### 1.2 Notification Delivery System

**Effort:** Medium | **Value:** High

Implement actual email/SMS/push sending via Edge Functions.

| Notification Type | Provider | Status |
|-------------------|----------|--------|
| Email (transactional) | SendGrid/Resend | Schema ready |
| SMS (outbound) | Twilio | Schema ready |
| Push (web) | Web Push API | Schema ready |
| In-app | Real-time via Supabase | Schema ready |

**Tasks:**
- [ ] Create Edge Function for email sending
- [ ] Create Edge Function for SMS sending
- [ ] Implement push notification subscription flow
- [ ] Build notification queue with retry logic
- [ ] Create notification preferences UI (per-user opt-outs)

### 1.3 Edge Functions for Background Processing

**Effort:** Medium | **Value:** High

| Function | Purpose | Priority |
|----------|---------|----------|
| `send-notification` | Process notification queue | P0 |
| `process-waitlist` | Auto-promote when spots open | P0 |
| `campaign-sender` | Send scheduled campaigns | P0 |
| `recurring-task-generator` | Create recurring task instances | P1 |
| `membership-renewal` | Process subscription renewals | P1 |
| `import-processor` | Process CSV imports | P1 |
| `export-generator` | Generate export files | P1 |

---

## Priority 2: Connectors & Import

### 2.1 CSV Import Flow

**Effort:** Medium | **Value:** High

The schema exists. Need UI and processing logic.

**Tasks:**
- [ ] File upload component with drag-and-drop
- [ ] Column mapping UI (auto-detect + manual override)
- [ ] Data quality preview (validation errors, duplicates)
- [ ] Dry-run mode with diff preview
- [ ] Import execution with progress tracking
- [ ] Import history and rollback capability

### 2.2 Provider-Specific Import Parsers

**Effort:** Medium | **Value:** High

Create parsers for known export formats:

| Provider | Parser Status | Notes |
|----------|---------------|-------|
| MindBody | Not started | Multiple export types (clients, attendance, sales) |
| Walla | Not started | Single combined export format |
| Momence | Not started | Structured JSON + CSV exports |
| WellnessLiving | Not started | Complex multi-file exports |
| Generic CSV | Not started | Flexible column mapping |

### 2.3 Sync Connectors (Future)

These require OAuth flows and ongoing sync logic:

| Connector | Complexity | Priority |
|-----------|------------|----------|
| ClassPass | High | P1 |
| Gympass | High | P1 |
| Google Calendar | Medium | P2 |
| Mailchimp | Medium | P2 |
| QuickBooks | High | P2 |

---

## Priority 3: Missing PRDs

Create PRDs for features referenced but not documented:

| PRD | Feature | Status |
|-----|---------|--------|
| PRD-006 | Review Request Automation | Needs creation |
| PRD-007 | Lifecycle Automation (birthday, drip, lead scoring) | Needs creation |
| PRD-010 | Schedule Automation (buffers, capacity) | Needs creation |
| PRD-014 | Payment Plans (universal provider abstraction) | Needs creation |

---

## Priority 4: Feature Completion by Phase

### Phase 1: Staff Experience + Retail

| Feature | Schema | UI | Backend | Notes |
|---------|--------|----|---------|----|
| Staff Mobile Portal | ✅ | ✅ | Needs wiring | PRD-001 |
| Instructor Availability | ✅ | Partial | Needs wiring | PRD-001 |
| Shift Trading | ✅ | Partial | Needs wiring | PRD-001 |
| Tips | ✅ | Needs UI | Needs wiring | PRD-002 |
| Commission Tracking | ✅ | Needs UI | Needs wiring | PRD-002 |
| Retail POS | ✅ | Needs UI | Needs wiring | PRD-003 |
| Inventory Management | ✅ | Needs UI | Needs wiring | PRD-003 |
| Membership Enhancements | ✅ | Partial | Needs wiring | PRD-004 |

### Phase 2: Engagement & Communication

| Feature | Schema | UI | Backend | Notes |
|---------|--------|----|---------|----|
| Push Notifications | ✅ | Needs UI | Needs Edge Fn | PRD-005 |
| Two-Way SMS | ✅ | ✅ | Needs Edge Fn | PRD-005 |
| Review Request Automation | Needs schema | Needs UI | Needs Edge Fn | PRD-006 needed |
| Birthday/Anniversary | Needs schema | Needs UI | Needs Edge Fn | PRD-007 needed |
| Drip Campaigns | Partial | Needs UI | Needs Edge Fn | PRD-007 needed |

### Phase 3: Operations & Check-In

| Feature | Schema | UI | Backend | Notes |
|---------|--------|----|---------|----|
| Self Check-In Kiosk | ✅ | ✅ | Needs wiring | PRD-008 |
| QR Code Check-In | ✅ | ✅ | Needs wiring | PRD-008 |
| Waitlist Automation | ✅ | ✅ | Needs Edge Fn | PRD-009 |
| Cleaning/Turnover Buffers | Needs schema | Needs UI | - | PRD-010 needed |

### Phase 4: Campaign Hub

| Feature | Schema | UI | Backend | Notes |
|---------|--------|----|---------|----|
| Campaign Manager | ✅ | ✅ | Needs wiring | PRD-011 |
| Audience Segments | ✅ | ✅ | Needs wiring | PRD-011 |
| UTM Builder | ✅ | ✅ | Needs wiring | PRD-011 |
| A/B Testing | ✅ | ✅ | Needs Edge Fn | PRD-011 |
| Ad Platform Integration | Future | - | - | PRD-011 (deferred) |

### Phase 5: Task Management

| Feature | Schema | UI | Backend | Notes |
|---------|--------|----|---------|----|
| Task Board | ✅ | ✅ | Needs wiring | PRD-012 |
| Recurring Tasks | ✅ | ✅ | Needs Edge Fn | PRD-012 |
| Task Templates | ✅ | Partial | Needs wiring | PRD-012 |

---

## Priority 5: Phase 6+ Planning

### Phase 6: Custom Report Builder (PRD-013)
- Drag-and-drop report builder
- Saved report templates
- Scheduled delivery
- Shareable links

### Phase 7: Booking Enhancements
- Reserve with Google integration
- Spot selection / room maps
- Equipment reservation
- Recurring "book me every week"

### Phase 8: Payment Enhancements (PRD-014 needed)
- Payment plans / installments
- Auto-pay retry logic
- ACH / direct debit
- POS terminal integration
- **Universal payment provider abstraction**

### Phase 9: Video & On-Demand
- Video hosting
- Live streaming (Zoom integration)
- Course / program builder
- Digital product sales

---

## Technical Debt & Improvements

| Item | Priority | Notes |
|------|----------|-------|
| Comprehensive test suite | P1 | Unit tests for hooks, integration tests for flows |
| Error boundary components | P1 | Graceful error handling throughout |
| Loading state improvements | P2 | Skeleton loaders, optimistic updates |
| Accessibility audit | P2 | WCAG 2.1 AA compliance |
| Performance optimization | P2 | Code splitting, lazy loading |
| Mobile responsiveness audit | P2 | Ensure all pages work on phone |
| Security audit | P1 | RLS policies, input validation |

---

## Recommended Next Steps (in order)

1. **Create missing PRDs** (006, 007, 010, 014) - Document before building
2. **Wire real data to dashboard** - Quick win, proves production readiness
3. **Build notification Edge Function** - Unlocks campaigns, waitlist, reminders
4. **Implement CSV import flow** - High value for onboarding new studios
5. **Build Retail POS UI** - PRD-003 is comprehensive, schema exists
6. **Payment plans with universal abstraction** - Future-proofs payment integrations

---

## Decision Log

| Decision | Date | Rationale |
|----------|------|-----------|
| Defer ad platform integration | 2025-02 | Requires complex OAuth, can use UTMs instead |
| Use provider-agnostic payment abstraction | 2025-02 | Enables future Stripe/Shopify/App Store flexibility |
| Demo data uses 2018 dates | 2025-02 | Clear separation from "real" data |
| Separate demo data from production tables | 2025-02 | Clean architecture, no data contamination |

---

*Last updated: 2025-02-06*
