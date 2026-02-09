# Component Inventory

Reference of all design system components, organized by category and surface.

---

## Component Naming

Components use consistent naming between Figma, code, and documentation.

| Convention | Example |
|------------|---------|
| PascalCase | `ClassCard`, `BookingCTA` |
| Descriptive | `InstructorAvatar` not `Avatar2` |
| Surface prefix (if needed) | `ConsumerHero` vs `InternalHeader` |

---

## Primitives (Both Surfaces)

These components work on both internal and consumer surfaces.

### Inputs

| Component | Variants | Sizes | States |
|-----------|----------|-------|--------|
| `Button` | primary, secondary, ghost, destructive, outline | sm, md, lg | default, hover, active, disabled, loading |
| `Input` | text, email, password, number, search | sm, md, lg | default, focus, error, disabled |
| `Textarea` | — | sm, md, lg | default, focus, error, disabled |
| `Select` | single, multi, searchable | sm, md, lg | default, open, error, disabled |
| `Checkbox` | — | sm, md | unchecked, checked, indeterminate, disabled |
| `Radio` | — | sm, md | unselected, selected, disabled |
| `Toggle` | — | sm, md | off, on, disabled |
| `DatePicker` | single, range | md | default, open, error |
| `TimePicker` | — | md | default, open, error |

### Display

| Component | Variants | Sizes |
|-----------|----------|-------|
| `Avatar` | image, initials, fallback | xs, sm, md, lg, xl |
| `Badge` | default, success, warning, error, info | sm, md |
| `Tag` | default, removable | sm, md |
| `Icon` | (icon library) | sm, md, lg |
| `Tooltip` | top, right, bottom, left | — |
| `Popover` | — | — |

### Layout

| Component | Props |
|-----------|-------|
| `Card` | variant: flat, elevated, outlined |
| `Container` | size: sm, md, lg, xl, full |
| `Section` | padding, background |
| `Grid` | cols, gap, responsive |
| `Stack` | direction, gap, align |
| `Divider` | orientation, style |

### Feedback

| Component | Variants |
|-----------|----------|
| `Toast` | success, error, warning, info |
| `Alert` | success, error, warning, info |
| `Progress` | linear, circular |
| `Skeleton` | text, circle, rectangle |
| `Spinner` | sm, md, lg |

### Navigation

| Component | Variants |
|-----------|----------|
| `Tabs` | underline, pills, boxed |
| `Breadcrumb` | — |
| `Pagination` | simple, full |
| `Dropdown` | — |

### Overlay

| Component | Sizes |
|-----------|-------|
| `Modal` | sm, md, lg, xl, full |
| `Drawer` | sm, md, lg |
| `AlertDialog` | — |
| `Sheet` | — |

---

## Internal Components (`/manage/*`, `/teach/*`)

Optimized for operations: clarity, density, speed.

### Data Display

| Component | Purpose | Data Binding |
|-----------|---------|--------------|
| `DataTable` | Tabular data with sort/filter | Any collection |
| `StatCard` | Single KPI display | Metric value + change |
| `StatGrid` | Multiple KPIs | Metrics array |
| `Timeline` | Chronological events | Events array |
| `ActivityFeed` | Recent actions | Activities array |
| `MiniCalendar` | Date navigation | Date state |

### Schedule

| Component | Purpose | Data Binding |
|-----------|---------|--------------|
| `ScheduleGrid` | Weekly schedule view | `class_occurrences[]` |
| `ScheduleList` | List schedule view | `class_occurrences[]` |
| `ClassRow` | Single class in table | `class_occurrence` |
| `RosterTable` | Attendance list | `bookings[]` |

### Forms

| Component | Purpose |
|-----------|---------|
| `FormSection` | Grouped form fields |
| `FormField` | Label + input + error |
| `SearchFilter` | Search with filters |
| `FilterBar` | Active filter chips |
| `DateRangeFilter` | Period selection |

### Member Management

| Component | Purpose | Data Binding |
|-----------|---------|--------------|
| `MemberRow` | Member in table | `member_profile` |
| `MemberCard` | Member quick view | `member_profile` |
| `MembershipBadge` | Current membership | `membership` |
| `EntitlementIndicator` | Remaining classes | `class_pack` |

### Staff

| Component | Purpose | Data Binding |
|-----------|---------|--------------|
| `StaffRow` | Staff in table | `staff_profile` |
| `TeacherSchedule` | Teacher's classes | `class_occurrences[]` |
| `PayrollRow` | Payroll entry | `payroll_entry` |

### Financial

| Component | Purpose | Data Binding |
|-----------|---------|--------------|
| `TransactionRow` | Transaction in table | `transaction` |
| `RevenueChart` | Revenue visualization | Aggregated data |
| `PayoutSummary` | Stripe payout | `payout` |

---

## Consumer Components (Public Pages)

Optimized for brand expression and conversion.

### Heroes & Headers

| Component | Variants | Slots |
|-----------|----------|-------|
| `HeroSection` | centered, split, video | headline, subhead, cta, media |
| `PageHeader` | simple, with-image | title, description, breadcrumb |
| `AnnouncementBar` | — | message, cta |

### Class & Schedule

| Component | Variants | Data Binding |
|-----------|----------|--------------|
| `ClassCard` | compact, detailed | `class_occurrence` |
| `ClassScheduleBlock` | list, grid | `class_occurrences[]` |
| `ClassDetail` | — | `class_occurrence` + `class` |
| `AvailabilityBadge` | available, limited, full, waitlist | Capacity data |

### Events

| Component | Variants | Data Binding |
|-----------|----------|--------------|
| `EventCard` | compact, detailed | `event` |
| `EventHero` | — | `event` |
| `EventSchedule` | — | `event_sessions[]` |
| `EventPricing` | single, tiered | `event_pricing_tiers[]` |

### People

| Component | Variants | Data Binding |
|-----------|----------|--------------|
| `InstructorCard` | compact, detailed | `staff_profile` |
| `InstructorBio` | — | `staff_profile` |
| `InstructorGrid` | — | `staff_profiles[]` |

### Booking & Purchase

| Component | Variants | Actions |
|-----------|----------|---------|
| `BookingCTA` | inline, floating, sticky | Opens booking flow |
| `MembershipCard` | — | Opens purchase flow |
| `ClassPackCard` | — | Opens purchase flow |
| `PricingTable` | 2-col, 3-col | Links to purchase |
| `IntroOfferBanner` | — | Links to offer |

### Social Proof

| Component | Variants |
|-----------|----------|
| `TestimonialCard` | quote, with-photo |
| `TestimonialCarousel` | — |
| `StatsBar` | — |
| `TrustBadges` | — |
| `StarRating` | readonly, interactive |

### Lead Capture

| Component | Variants | Actions |
|-----------|----------|---------|
| `NewsletterSignup` | inline, popup | Creates subscription |
| `ContactForm` | simple, detailed | Creates inquiry |
| `LeadMagnet` | — | Captures + downloads |

### Navigation

| Component | Variants |
|-----------|----------|
| `NavHeader` | transparent, solid |
| `MobileNav` | drawer, dropdown |
| `Footer` | simple, detailed |

---

## State Patterns

All components should handle these states:

| State | Visual Treatment |
|-------|------------------|
| Loading | Skeleton or spinner |
| Empty | Empty state message + CTA |
| Error | Error message + retry |
| Success | Confirmation + next action |

---

## Responsive Behavior

| Breakpoint | Width | Typical Changes |
|------------|-------|-----------------|
| `sm` | 640px | Stack columns, hide secondary |
| `md` | 768px | Two columns, show more |
| `lg` | 1024px | Full layout |
| `xl` | 1280px | Max container width |

---

## Accessibility Requirements

All components must meet:

| Requirement | Standard |
|-------------|----------|
| Color contrast | WCAG AA (4.5:1 text, 3:1 UI) |
| Focus indicators | Visible focus ring |
| Keyboard navigation | Full keyboard support |
| Screen reader | Proper ARIA labels |
| Touch targets | Minimum 44x44px |

---

## Related Documentation

- [02-design-tokens.md](02-design-tokens.md) — Token values
- [03-figma-structure.md](03-figma-structure.md) — Figma organization
- [04-consumer-pages.md](04-consumer-pages.md) — Page compositions
