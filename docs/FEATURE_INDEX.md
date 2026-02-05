# Tandava Feature Index

Quick reference for all features, their status, and locations in the codebase.

---

## Legend

| Status | Meaning |
|--------|---------|
| **Built** | Feature complete with UI and data |
| **UI Only** | UI exists but uses mock data |
| **Schema** | Database schema exists, no UI |
| **Planned** | Designed, not yet implemented |

---

## Core Operations

### Scheduling & Classes

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Recurring schedule rules | UI Only | `/manage/schedule` | `schedule_rules` | - |
| Class occurrences | UI Only | `/manage/schedule` | `class_occurrences` | - |
| Teacher substitutions | UI Only | `/manage/schedule` | `schedule_overrides` | - |
| Room management | Schema | - | `locations.rooms` | - |
| Multi-location | Schema | `/manage/settings` | `locations` | - |
| Cleaning/buffer times | Planned | - | - | PRD-010 |
| Hybrid virtual/in-person | Planned | - | - | Phase 9 |

### Bookings

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Class booking | UI Only | `/schedule` | `bookings` | - |
| Waitlist | UI Only | `/schedule` | `bookings.status` | - |
| Waitlist auto-promotion | Planned | - | - | PRD-009 |
| Check-in (staff) | UI Only | `/manage/students` | `bookings.checked_in_at` | - |
| Self check-in kiosk | Planned | `/kiosk/:id` | - | PRD-008 |
| QR code check-in | Planned | - | `member_qr_codes` | PRD-008 |
| Spot/asset selection | Planned | - | - | Phase 7 |
| Recurring booking | Planned | - | - | Phase 7 |
| Reserve with Google | Planned | - | - | Phase 7 |

### Members & Students

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Member profiles | UI Only | `/manage/students` | `profiles`, `studio_members` | - |
| Emergency contacts | UI Only | `/manage/members/:id` | `profiles.emergency_*` | - |
| Member tags | UI Only | `/manage/students` | - | - |
| Engagement scoring | Schema | - | `engagement_profiles` | - |
| Family/household linking | Schema | - | `households` | PRD-004 |
| Corporate accounts | Schema | - | `corporate_accounts` | PRD-004 |

---

## Financial

### Memberships

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Membership types | UI Only | `/manage/financials` | `membership_types` | - |
| Active memberships | UI Only | `/manage/financials` | `memberships` | - |
| Membership pauses | Schema | - | `membership_pauses` | - |
| Commitment tracking | Schema | - | `memberships.commitment_*` | PRD-004 |
| Auto-upgrade/downgrade | Planned | - | - | PRD-004 |
| Membership add-ons | Schema | - | `membership_addons` | PRD-004 |

### Class Packs

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Pack types | UI Only | `/manage/financials` | `class_pack_types` | - |
| Pack purchases | UI Only | `/manage/financials` | `class_packs` | - |
| Pack consumption | Schema | - | `class_packs.classes_remaining` | - |

### Payments

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Stripe Connect | Schema | `/manage/settings` | `studios.stripe_*` | - |
| Transactions | UI Only | `/manage/financials` | `transactions` | - |
| Payment methods | Schema | - | `payment_methods` | - |
| Payment retry logic | Planned | - | - | Phase 8 |
| Payment plans | Planned | - | - | Phase 8 |
| POS terminal | Planned | - | - | Phase 8 |
| Invoicing | Planned | - | - | Phase 8 |

### Promotions

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Promo codes | UI Only | `/manage/promo-codes` | `promo_codes` | - |
| Promo redemptions | Schema | - | `promo_redemptions` | - |
| Intro offers | Schema | - | `intro_offers` | - |
| Guest passes | Schema | - | `guest_passes` | - |
| Dynamic pricing | Schema | - | `pricing_rules` | PRD-004 |
| Gift cards | Schema | - | `gift_cards` | - |

---

## Staff & Teachers

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Staff roster | UI Only | `/manage/teachers` | `studio_staff` | - |
| Role-based access | Built | - | `studio_staff.role` | - |
| Payroll tracking | UI Only | `/manage/teachers` | `payroll_entries` | - |
| Staff portal | Planned | `/teach` | - | PRD-001 |
| Instructor availability | Schema | `/teach/availability` | `instructor_availability` | PRD-001 |
| Sub requests | Schema | `/teach/subs` | `sub_requests` | PRD-001 |
| Shift trading | Schema | `/teach/trades` | `shift_trades` | PRD-001 |
| Tips | Schema | - | `tips` | PRD-002 |
| Live commission view | Planned | `/teach/earnings` | - | PRD-002 |
| Staff task management | Planned | - | - | PRD-012 |

---

## Retail & Inventory

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Product catalog | Schema | `/manage/products` | `products` | PRD-003 |
| Inventory levels | Schema | `/manage/inventory` | `inventory_levels` | PRD-003 |
| Inventory movements | Schema | - | `inventory_movements` | PRD-003 |
| Purchase orders | Schema | `/manage/purchase-orders` | `purchase_orders` | PRD-003 |
| Barcode scanning | Planned | - | `products.barcode` | PRD-003 |

---

## Marketing & Communication

### Landing Pages & SEO

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Landing page builder | UI Only | `/manage/landing-pages` | `landing_pages` | - |
| SEO recommendations | Schema | - | `seo_recommendations` | - |

### Email & SMS

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Notification log | Schema | - | `notifications` | - |
| Email templates | Planned | - | - | - |
| SMS (outbound) | Planned | - | - | PRD-005 |
| Two-way SMS | Planned | - | `sms_conversations` | PRD-005 |
| Push notifications | Planned | - | `push_subscriptions` | PRD-005 |

### Campaigns & Advertising

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Campaign manager | Planned | `/manage/campaigns` | `marketing_campaigns` | PRD-011 |
| UTM builder | Planned | - | `campaign_links` | PRD-011 |
| Meta Ads integration | Planned | - | `ad_platform_connections` | PRD-011 |
| Google Ads integration | Planned | - | `ad_platform_connections` | PRD-011 |
| Attribution tracking | Planned | - | `conversion_attributions` | PRD-011 |
| A/B testing | Planned | - | `ab_tests` | PRD-011 |

### Engagement & Retention

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Nudge rules | Schema | - | `nudge_rules` | - |
| Milestones/badges | Schema | - | `milestones` | - |
| Review requests | Planned | - | - | PRD-006 |
| Birthday automation | Planned | - | - | PRD-007 |
| Drip campaigns | Planned | - | - | PRD-007 |
| Referral programs | Schema | - | `referral_programs` | - |

---

## Analytics & Reporting

### Dashboards

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Analytics hub | UI Only | `/manage/analytics` | - | - |
| Member analytics | UI Only | `/manage/analytics/members` | - | - |
| Sales analytics | UI Only | `/manage/analytics/sales` | - | - |
| Financial analytics | UI Only | `/manage/analytics/financials` | - | - |
| Site analytics | UI Only | `/manage/analytics/site` | `analytics_sessions` | - |

### Advanced Analytics

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| MRR tracking | Schema | - | `mrr_snapshots` | - |
| Revenue forecasting | Schema | - | `revenue_forecasts` | - |
| CLV cohorts | Schema | - | `clv_cohorts` | - |
| P&L summaries | Schema | - | `pl_monthly_summaries` | - |
| Promo performance | Schema | - | `promo_performance` | - |
| Conversion funnels | Schema | - | `conversion_funnels` | - |
| Seasonality | Schema | - | `seasonality_patterns` | - |
| Benchmarks | Schema | - | `benchmark_*` | - |
| Expansion indicators | Schema | - | `expansion_indicators` | - |

### Reporting

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Reports page | UI Only | `/manage/reports` | - | - |
| Scheduled reports | Schema | - | `scheduled_reports` | - |
| Custom report builder | Planned | - | - | PRD-013 |
| CSV export | UI Only | Various | - | - |

---

## Events & Workshops

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Event management | UI Only | `/manage/events` | `events` | - |
| Multi-session events | Schema | - | `event_sessions` | - |
| Event pricing tiers | Schema | - | `event_pricing_tiers` | - |
| Event registrations | Schema | - | `event_registrations` | - |

---

## On-Demand & Video

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| On-demand library | Stub | `/on-demand` | - | - |
| Video hosting | Planned | - | - | Phase 9 |
| Live streaming (Zoom) | Planned | - | - | Phase 9 |
| Course builder | Planned | - | - | Phase 9 |
| Digital products | Planned | - | - | Phase 9 |

---

## Integrations & Data

### Import/Export

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Data import | UI Only | `/manage/import` | `import_jobs` | - |
| MindBody migration | Schema | `/manage/import` | `import_field_mappings` | - |
| Walla migration | Schema | `/manage/import` | `import_field_mappings` | - |
| Data connectors hub | UI Only | `/manage/connectors` | `connector_definitions` | - |
| Data export | UI Only | `/manage/connectors` | `export_jobs` | - |
| Scheduled exports | Schema | - | `scheduled_exports` | - |
| GDPR compliance | Schema | - | `gdpr_requests` | - |

### External Integrations

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Webhook infrastructure | Schema | - | `webhook_endpoints` | - |
| Mailchimp sync | Planned | - | `integrations` | - |
| QuickBooks sync | Planned | - | `integrations` | - |
| ClassPass | Planned | - | - | Phase 10 |
| Gympass | Planned | - | - | Phase 10 |
| Google Calendar | Planned | - | - | Phase 10 |
| Zapier | Planned | - | `integrations` | - |

---

## Platform & Settings

| Feature | Status | UI Location | Schema | PRD |
|---------|--------|-------------|--------|-----|
| Studio settings | UI Only | `/manage/settings` | `studios` | - |
| Branding/theming | Built | `/manage/settings` | ThemeContext | - |
| Onboarding wizard | UI Only | `/manage/onboarding` | `studio_onboarding` | - |
| Waivers | Schema | - | `waiver_templates` | - |
| Multi-tenant RLS | Built | - | All tables | - |
| Demo mode | Built | - | DemoContext | - |

---

## File Locations Quick Reference

```
src/
├── components/
│   ├── manage/
│   │   └── ManageLayout.tsx      # Admin layout wrapper
│   ├── teach/
│   │   └── TeachLayout.tsx       # Instructor portal layout
│   ├── DemoPanel.tsx             # Demo mode panel
│   └── ui/                       # shadcn components
├── contexts/
│   ├── AuthContext.tsx           # Authentication
│   ├── DemoContext.tsx           # Demo mode state
│   └── ThemeContext.tsx          # Studio theming
├── pages/
│   ├── manage/                   # Studio admin pages
│   │   ├── Dashboard.tsx
│   │   ├── Students.tsx
│   │   ├── Teachers.tsx
│   │   ├── ScheduleManage.tsx
│   │   ├── Offerings.tsx
│   │   ├── Financials.tsx
│   │   ├── PromoCodes.tsx
│   │   ├── Events.tsx
│   │   ├── LandingPages.tsx
│   │   ├── Analytics*.tsx        # Analytics dashboards
│   │   ├── DataConnectors.tsx    # Import/export hub
│   │   ├── Products.tsx          # Retail
│   │   ├── Inventory.tsx         # Inventory
│   │   └── ...
│   ├── teach/                    # Instructor portal
│   │   ├── Dashboard.tsx
│   │   ├── Schedule.tsx
│   │   ├── Subs.tsx
│   │   └── Earnings.tsx
│   └── ...                       # Student-facing pages
├── types/
│   └── database.ts               # All TypeScript types
└── App.tsx                       # Route definitions

supabase/
└── migrations/
    ├── 00001_initial_schema.sql
    ├── 00002_operational_workflows.sql
    ├── 00003_events_analytics_growth.sql
    ├── 00004_advanced_analytics.sql
    ├── 00005_connector_infrastructure.sql
    └── 00006_phase1_staff_retail_membership.sql

docs/
├── ROADMAP.md                    # Development roadmap
├── FEATURE_INDEX.md              # This file
└── prd/
    ├── PRD-001-staff-portal.md
    ├── PRD-002-tips-commission.md
    ├── PRD-003-retail-inventory.md
    └── ...
```

---

## Database Schema Overview

| Migration | Tables Added | Purpose |
|-----------|--------------|---------|
| 001 | 27 | Core: studios, profiles, bookings, memberships, payments |
| 002 | 17 | Operations: promos, waivers, referrals, webhooks |
| 003 | 20+ | Growth: events, landing pages, analytics, engagement |
| 004 | 12+ | BI: MRR, forecasting, CLV, P&L, benchmarks |
| 005 | 12+ | Connectors: import/export/sync infrastructure |
| 006 | 20+ | Phase 1: staff portal, retail, membership enhancements |

**Total Tables:** ~110+

---

*Last updated: 2025-02-05*
