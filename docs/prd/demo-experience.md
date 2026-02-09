# PRD: Interactive Demo Experience

**Last Updated:** February 2026
**Status:** Implemented

---

## Overview

The interactive demo is Tandava's primary acquisition tool. Studio owners, teachers, and prospective users land on the demo page, choose a role, and explore a fully functional UI with mock data. Every button must provide feedback, every flow must feel complete, and the experience must compel visitors to download and self-host Tandava for their studio.

---

## Demo Landing Page (`/`)

### Role Cards
Visitors choose from 4 roles, each navigating to a role-specific area:

| Role | Destination | Layout |
|------|-------------|--------|
| Studio Owner | `/manage` | ManageLayout (sidebar + header) |
| Instructor | `/teach` | TeachLayout (sidebar + header) |
| Front Desk | `/staff/checkin` | StaffLayout (horizontal nav) |
| Member | `/home` | AppLayout (top nav + tabs) |

### Landing Page Sections
1. **Hero** — "The platform yoga studios deserve" + value proposition
2. **Role selector** — 4 cards with feature highlights per role
3. **Feature grid** — Smart Scheduling, Flexible Payments, Deep Analytics, On-Demand Video
4. **Open source CTA** — AGPL-3.0 license, GitHub + docs links
5. **Footer** — Branding, license notice

---

## Top 25 Demo Flows

### Student Flows (1-7)

| # | Flow | Entry Point | Steps | Status |
|---|------|-------------|-------|--------|
| 1 | **Browse & filter classes** | `/schedule` | Search by name, filter by studio/style/level, clear filters | Working |
| 2 | **Book a class** | `/schedule` | Click class -> Class Detail Modal -> Book Now -> Payment selection -> Confirmation toast | Working |
| 3 | **Join waitlist** | `/schedule` | Click full class (0 spots) -> Join Waitlist button -> Waitlist badge in My Schedule | Working |
| 4 | **Cancel a booking** | `/my-schedule` | Upcoming tab -> Cancel -> Confirm dialog -> Toast "Booking cancelled" | Working |
| 5 | **Rate a past class** | `/my-schedule` | Past tab -> Rate -> Toast "Thank you for your feedback" | Working |
| 6 | **Update profile** | `/account` | Edit name/email/phone/pronouns -> Save Changes -> Toast "Profile updated" | Working |
| 7 | **Browse instructors** | `/instructors` | Search by name, filter by specialty/studio, click for detail page | Working |

### Studio Owner Flows (8-16)

| # | Flow | Entry Point | Steps | Status |
|---|------|-------------|-------|--------|
| 8 | **View dashboard KPIs** | `/manage` | See today's classes, active students, revenue MTD, check-in rate | Working |
| 9 | **Add a new class** | `/manage/schedule` | Click "Add Class" -> Fill form (name, time, teacher, style, recurring) -> Add -> Appears in schedule | Working |
| 10 | **Cancel a class** | `/manage/schedule` | Click Cancel on class -> Toast confirmation | Working |
| 11 | **Search student roster** | `/manage/students` | Search by name/email -> Click student -> View detail modal with stats | Working |
| 12 | **View teacher profiles** | `/manage/teachers` | Search -> Click teacher -> Full profile with certs, schedule, pay rate | Working |
| 13 | **View financials** | `/manage/financials` | See membership types, class packs, transaction history | Working |
| 14 | **Toggle features** | `/manage/feature-settings` | Enable/disable optional features -> Save -> Toast | Working |
| 15 | **View audit logs** | `/manage/audit-logs` | Filter by category/severity -> Search -> View change details | Working |
| 16 | **Manage promo codes** | `/manage/promo-codes` | Create, copy, toggle, delete promo codes | Working |

### Teacher Flows (17-22)

| # | Flow | Entry Point | Steps | Status |
|---|------|-------------|-------|--------|
| 17 | **View teaching dashboard** | `/teach` | See upcoming classes, check-in students via dialog, earnings summary | Working |
| 18 | **Browse weekly schedule** | `/teach/schedule` | Navigate weeks, see class details, request sub | Working |
| 19 | **Request a sub** | `/teach/schedule` | Select class -> Request Sub -> Enter reason -> Submit -> Toast | Working |
| 20 | **Set availability** | `/teach/availability` | Toggle days, set time ranges, save -> Toast | Working |
| 21 | **View earnings** | `/teach/earnings` | Browse pay periods, see per-class breakdown | Working |
| 22 | **Edit profile** | `/teach/profile` | Edit bio, add/remove specialties, view certifications | Working |
| 22b | **Check-in students** | `/teach` | Click "Check-in Students" on today's class -> Dialog with student list -> Click to toggle check-in -> Search students -> "Check All" button | Working |

### Front Desk Flows (23-24)

| # | Flow | Entry Point | Steps | Status |
|---|------|-------------|-------|--------|
| 23 | **Check in a member** | `/staff/checkin` | Select class -> Find member -> Click Check In -> Badge updates | Working |
| 24 | **Search members** | `/staff/checkin` | Type name in search -> Filtered results | Working |

### Kiosk Flow (25)

| # | Flow | Entry Point | Steps | Status |
|---|------|-------------|-------|--------|
| 25 | **Self-service check-in** | `/kiosk` | QR scan simulation -> Success screen; or manual search -> Select member -> Check in | Working |

---

## Demo Mode Architecture

### Context Chain
```
DemoProvider (tracks active role/persona)
  -> AuthProvider (reads persona, sets profile/permissions)
    -> Router (all routes accessible in demo mode)
      -> ProtectedRoute (bypassed: returns children directly)
```

### Data Strategy
- All data is mock/hardcoded in component files or `src/data/demo/`
- User actions (book, cancel, add class, check in) modify **local React state**
- Toast notifications confirm every action
- Nothing persists across page reload — by design

### Role Switching
- **DemoRoleBar** (prominent sticky top bar, z-index 110) shows current role and enables instant switching
- Shows current role with accent-colored badge (amber=Owner, blue=Instructor, violet=Front Desk, teal=Member)
- One-click role switching buttons always visible
- Green pulsing "DEMO" indicator + persona name
- Only renders when `DEMO_MODE_ENABLED` is true
- Switching calls `switchPersona(role)` in DemoContext + navigates to role destination
- AuthContext syncs profile + permissions via useEffect
- Back links removed from all layouts — roles are parallel perspectives, not hierarchical
- **DemoPanel** (floating side panel) still exists as secondary access

---

## Design Principles

1. **Every button does something** — Either performs a demo action with toast, or explains what the production feature would do
2. **No empty states** — All pages have mock data that looks realistic
3. **No console.logs** — All debug output replaced with toast notifications
4. **Current dates** — All mock dates reference 2025-2026, never 2023-2024
5. **Filters work** — Search, dropdowns, and filter controls actually filter content
6. **Role context is clear** — DemoPanel always shows current role and page context
7. **Navigation is complete** — Every sidebar link has a route and component

---

## Pages by Role

### Student (AppLayout)
| Route | Page | Key Features |
|-------|------|-------------|
| `/home` | Studio landing | Compact hero, filterable today's schedule (location/style/mode), clickable teachers & styles, image carousel location cards, login-aware CTAs, inline streak stats |
| `/schedule` | Class browser | Tabs (classes/workshops/appointments/retreats), filters, booking modal |
| `/my-schedule` | My bookings | Upcoming/past tabs, cancel, rate |
| `/account` | Account settings | Profile, membership, billing, preferences |
| `/instructors` | Teacher listing | Search, filter by specialty/studio |
| `/instructors/:id` | Teacher detail | Bio, schedule, reviews, studios |
| `/community` | Community | Stats, friends, leaderboard |
| `/on-demand` | Video library | Browse/watch on-demand classes |
| `/kiosk` | Self-service check-in | QR scan, manual search |

### Studio Owner (ManageLayout)
| Route | Page |
|-------|------|
| `/manage` | Dashboard (KPIs, today's classes, activity) |
| `/manage/schedule` | Schedule management (add/cancel classes) |
| `/manage/students` | Student CRM (search, profiles) |
| `/manage/teachers` | Teacher management |
| `/manage/financials` | Revenue, memberships, transactions |
| `/manage/events` | Workshop/event management |
| `/manage/offerings` | Pricing and membership tiers |
| `/manage/promo-codes` | Discount codes |
| `/manage/products` | Retail products and inventory |
| `/manage/landing-pages` | Marketing page builder |
| `/manage/utm-builder` | Campaign link generator |
| `/manage/campaigns` | Marketing campaigns |
| `/manage/tasks` | Internal task tracking |
| `/manage/reports` | Analytics and reporting |
| `/manage/import` | Data import wizard |
| `/manage/sms-inbox` | SMS messaging |
| `/manage/notification-settings` | Email/SMS provider config |
| `/manage/feature-settings` | Feature toggles |
| `/manage/audit-logs` | Audit log viewer |
| `/manage/settings` | Studio branding, hours, locations |

### Teacher (TeachLayout)
| Route | Page |
|-------|------|
| `/teach` | Dashboard (upcoming, earnings, students) |
| `/teach/schedule` | Weekly teaching schedule |
| `/teach/availability` | Set weekly availability |
| `/teach/subs` | Sub request management |
| `/teach/earnings` | Pay periods and class breakdown |
| `/teach/profile` | Public instructor profile |

### Front Desk (StaffLayout)
| Route | Page |
|-------|------|
| `/staff/checkin` | Class check-in with roster |
| `/staff/waitlist` | Waitlist management |

### Platform Admin (AdminLayout)
| Route | Page |
|-------|------|
| `/admin` | Platform overview |
| `/admin/studios` | Studio management |
| `/admin/users` | User management |
| `/admin/billing` | Platform billing |
| `/admin/feedback` | User feedback |
| `/admin/settings` | Instance configuration |

---

## Success Metrics

A successful demo experience means:
1. Visitor chooses a role and understands the platform within 60 seconds
2. Every click produces visible feedback (navigation, toast, state change)
3. Studio owner sees enough value to clone the repo
4. No broken links, empty states, or unresponsive buttons
5. Works fully without any backend — pure client-side demo
