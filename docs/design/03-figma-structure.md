# Figma File Structure

The Figma design system mirrors the conceptual structure of Tandava.

It is not a collection of screens.
It is a **system of intent**.

---

## Structure Overview

```
Tandava Design System (Figma)
├── 01 – Tokens
├── 02 – Primitives
├── 03 – Internal Components
├── 04 – Consumer Components
├── 05 – Flows & States
└── 06 – Page Templates
```

---

## 01 – Tokens (Reference Only)

Contains:
- Color styles (brand.color.*)
- Text styles (fontSize, fontWeight, lineHeight)
- Spacing references (visual guides)
- Motion annotations (timing, easing)
- Elevation samples

### Rules

- Driven by token schema (`tokens.json`)
- Not for layout experimentation
- Changes here should be deliberate and rare
- Synced with [02-design-tokens.md](02-design-tokens.md)

### Structure

```
01 – Tokens
├── Colors
│   ├── Primary
│   ├── Secondary
│   ├── Accent
│   └── Neutral Scale
├── Typography
│   ├── Font Families
│   ├── Size Scale
│   └── Weight Scale
├── Spacing
│   └── Visual Reference Grid
├── Elevation
│   └── Shadow Samples
└── Motion
    └── Timing Annotations
```

---

## 02 – Primitives

Low-level building blocks with no business logic.

### Components

| Primitive | Variants | Notes |
|-----------|----------|-------|
| Button | primary, secondary, ghost, destructive | Sizes: sm, md, lg |
| Input | text, email, password, search | States: default, focus, error, disabled |
| Select | single, multi | With/without search |
| Checkbox | checked, unchecked, indeterminate | |
| Radio | selected, unselected | |
| Toggle | on, off | |
| Badge | default, success, warning, error | |
| Avatar | image, initials, fallback | Sizes: xs, sm, md, lg |
| Icon | 24x24 base | Consistent stroke weight |
| Card | flat, elevated | Border vs shadow |
| Container | section, card, modal | |

### Rules

- No business logic
- No page-specific styling
- Component names **must match code concepts**
- All primitives work on both surfaces (internal/consumer)

---

## 03 – Internal Components

Used exclusively for the **internal operations UI** (`/manage/*`, `/teach/*`).

### Component Categories

#### Data Display
| Component | Purpose | Tandava Equivalent |
|-----------|---------|-------------------|
| DataTable | Tabular data with sorting, filtering | Member lists, transactions |
| StatCard | KPI display | Dashboard metrics |
| Timeline | Chronological events | Activity feed |
| Calendar | Schedule grid | Class schedule |

#### Forms
| Component | Purpose | Tandava Equivalent |
|-----------|---------|-------------------|
| FormSection | Grouped inputs | Settings panels |
| SearchFilter | List filtering | Member search |
| DateRangePicker | Period selection | Report filters |
| MultiSelect | Tag/category selection | Class type filters |

#### Navigation
| Component | Purpose | Tandava Equivalent |
|-----------|---------|-------------------|
| Sidebar | Main navigation | ManageLayout sidebar |
| Tabs | Section switching | Settings tabs |
| Breadcrumb | Location indicator | Nested pages |
| CommandMenu | Quick actions | ⌘K menu |

#### Feedback
| Component | Purpose | Tandava Equivalent |
|-----------|---------|-------------------|
| Toast | Transient notifications | Success/error messages |
| AlertDialog | Confirmations | Delete confirmations |
| EmptyState | No data placeholder | Empty lists |
| LoadingSkeleton | Loading placeholder | Data fetching |

### Rules

- Optimized for clarity and density
- Structurally stable (no redesigns)
- Light branding only (colors, logo)
- Accessibility compliant (WCAG AA)

---

## 04 – Consumer Components

Used for **public-facing experiences** (landing pages, booking, events).

### Component Categories

#### Heroes & Headers
| Component | Purpose | Use Case |
|-----------|---------|----------|
| HeroSection | Page header with CTA | Landing pages |
| PageHeader | Title + description | Interior pages |
| AnnouncementBar | Promotions | Site-wide notices |

#### Content Blocks
| Component | Purpose | Use Case |
|-----------|---------|----------|
| ClassCard | Class preview | Schedule displays |
| EventCard | Event/workshop preview | Event listings |
| InstructorCard | Teacher bio | About page, class details |
| TestimonialCard | Social proof | Landing pages |
| PricingCard | Membership/pack display | Pricing page |

#### Booking
| Component | Purpose | Use Case |
|-----------|---------|----------|
| BookingCTA | Primary booking action | Class/event pages |
| ClassScheduleBlock | Embedded schedule | Landing pages |
| AvailabilityIndicator | Spots remaining | Class cards |

#### Marketing
| Component | Purpose | Use Case |
|-----------|---------|----------|
| NewsletterSignup | Email capture | Footer, popups |
| SocialProof | Ratings, reviews | Landing pages |
| FeatureGrid | Benefits display | Marketing pages |

### Rules

- Composable (can be reordered, omitted)
- Brand-driven styling encouraged
- Layout-flexible
- Mobile-first

---

## 05 – Flows & States

Illustrates behavior, not just visuals.

### Documented Flows

| Flow | Screens | Key States |
|------|---------|------------|
| Booking Flow | Schedule → Class → Confirm → Success | Loading, error, full class |
| Check-in Flow | Roster → Search → Confirm | Not found, already checked in |
| Purchase Flow | Select → Payment → Confirmation | Payment error, retry |
| Onboarding Flow | Welcome → Studio → Schedule → Done | Validation errors |

### State Documentation

| State Type | Examples |
|------------|----------|
| Empty | No classes, no members, no bookings |
| Loading | Skeleton screens, spinners |
| Error | Form errors, API failures, 404 |
| Success | Confirmations, celebrations |
| Edge Cases | Sold out, waitlist, cancelled |

### Rules

- Explain behavior, not just visuals
- Focus on transitions and logic
- Document error handling
- Show responsive breakpoints

---

## 06 – Page Templates

Complete page compositions for reference.

### Internal Pages

| Template | Route | Components Used |
|----------|-------|-----------------|
| Dashboard | `/manage` | StatCard, Timeline, Calendar |
| Member List | `/manage/members` | DataTable, SearchFilter |
| Class Detail | `/manage/classes/:id` | FormSection, Tabs |
| Settings | `/manage/settings` | Tabs, FormSection |

### Consumer Pages

| Template | Route | Components Used |
|----------|-------|-----------------|
| Studio Landing | `/` | HeroSection, ClassScheduleBlock, TestimonialCard |
| Schedule | `/schedule` | Calendar, ClassCard, Filters |
| Class Detail | `/classes/:id` | PageHeader, InstructorCard, BookingCTA |
| Event Page | `/events/:id` | HeroSection, EventDetails, PricingCard |

---

## Naming Conventions

Use system concepts, not marketing names.

### Preferred

```
SessionCard
BookingCTA
InstructorAvatar
MembershipPricingCard
ClassScheduleGrid
```

### Avoid

```
PrettyCard
HeroThing
CoolButton
NewDesignV2
```

Consistency reduces drift between design and code.

---

## Collaboration Guidance

### For Designers

- Work **within** pages, not restructuring them
- Create variants, not duplicates
- Document intent in component descriptions
- Flag changes that affect code

### For Agents

- May generate variants respecting page intent
- Must use existing primitives
- Must follow naming conventions
- Should reference tokens, not raw values

### For Developers

- Map any component to a concept without guesswork
- Component names match React component names
- Props mirror Figma variants
- Tokens match CSS variables

---

## Why This Structure Exists

- **Makes handoff boring** (in a good way)
- **Makes changes obvious** (diff-friendly)
- **Makes agents reliable** (predictable structure)
- **Makes review fast** (clear organization)

If something feels confusing, the structure should be clarified before visuals are changed.

---

## Related Documentation

- [README.md](README.md) — Design system overview
- [02-design-tokens.md](02-design-tokens.md) — Token schema
- [04-consumer-pages.md](04-consumer-pages.md) — Page compositions
- [05-components.md](05-components.md) — Component inventory
