# Consumer-Facing Page Composition

Consumer-facing experiences are intentionally **composable**, not theme-swapped.

This allows studios to express brand freely while preserving system integrity.

---

## Composition Model

Pages are built from three layers:

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: BRAND STYLING                                         │
│  How it feels (colors, typography, imagery, motion)             │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: CONTENT BLOCKS                                        │
│  What is communicated (Hero, ClassList, BookingCTA)             │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 1: LAYOUT PRIMITIVES                                     │
│  How it's structured (Section, Grid, Stack, Container)          │
└─────────────────────────────────────────────────────────────────┘
```

Each layer has different responsibilities and customization rules.

---

## Layer 1: Layout Primitives (Structural)

These define **structure**, not aesthetics.

### Available Primitives

| Primitive | Purpose | Props |
|-----------|---------|-------|
| `Section` | Full-width container with vertical padding | `padding`, `background` |
| `Container` | Max-width centered content | `size`: sm, md, lg, xl, full |
| `Grid` | Responsive column layout | `cols`, `gap`, `responsive` |
| `Stack` | Vertical or horizontal stacking | `direction`, `gap`, `align` |
| `Spacer` | Explicit whitespace | `size`: sm, md, lg, xl |
| `Divider` | Visual separation | `style`: line, space, gradient |

### Example: Section with Grid

```jsx
<Section padding="xl" background="neutral-50">
  <Container size="lg">
    <Grid cols={3} gap="lg" responsive>
      <ClassCard />
      <ClassCard />
      <ClassCard />
    </Grid>
  </Container>
</Section>
```

### Rules

- Layout primitives do not know about brand
- They only manage spacing and alignment
- Safe for agents and no-code tools to assemble
- Responsive behavior is built-in

---

## Layer 2: Content Blocks (Meaningful Units)

These define **what** is being communicated.

### Block Categories

#### Heroes & Headers

| Block | Purpose | Slots |
|-------|---------|-------|
| `HeroSection` | Page opener with impact | headline, subhead, cta, image/video |
| `PageHeader` | Interior page title | title, description, breadcrumb |
| `AnnouncementBar` | Site-wide notice | message, cta, dismissible |

#### Class & Schedule

| Block | Purpose | Data Source |
|-------|---------|-------------|
| `ClassCard` | Single class preview | `class_occurrences` |
| `ClassScheduleGrid` | Full schedule view | `class_occurrences[]` |
| `ClassDetail` | Expanded class info | `class_occurrences` + `classes` |
| `UpcomingClasses` | Next N classes | `class_occurrences[]` |

#### Events & Workshops

| Block | Purpose | Data Source |
|-------|---------|-------------|
| `EventCard` | Event preview | `events` |
| `EventHero` | Event page header | `events` |
| `EventSchedule` | Multi-session view | `event_sessions[]` |
| `EventPricing` | Pricing tiers | `event_pricing_tiers[]` |

#### People

| Block | Purpose | Data Source |
|-------|---------|-------------|
| `InstructorCard` | Teacher preview | `staff_profiles` |
| `InstructorBio` | Full teacher profile | `staff_profiles` |
| `InstructorGrid` | Team display | `staff_profiles[]` |

#### Booking & Conversion

| Block | Purpose | Actions |
|-------|---------|---------|
| `BookingCTA` | Primary booking action | triggers booking flow |
| `MembershipCard` | Membership option | triggers purchase flow |
| `ClassPackCard` | Pack option | triggers purchase flow |
| `PricingTable` | Compare options | links to purchase |

#### Social Proof

| Block | Purpose | Data Source |
|-------|---------|-------------|
| `TestimonialCard` | Single review | `testimonials` |
| `TestimonialCarousel` | Rotating reviews | `testimonials[]` |
| `StatsBar` | Key metrics | aggregated data |
| `TrustBadges` | Certifications | static assets |

#### Lead Capture

| Block | Purpose | Actions |
|-------|---------|---------|
| `NewsletterSignup` | Email capture | creates `newsletter_subscriptions` |
| `ContactForm` | Inquiries | creates `contact_submissions` |
| `LeadMagnet` | Gated content | captures email + downloads |

### Rules

- Content blocks consume layout primitives
- They reference design tokens, not hard-coded values
- They may be rearranged or omitted
- Data bindings are explicit

---

## Layer 3: Brand Styling (Expression)

This defines **how it feels**.

### Customizable Elements

| Element | Token Reference | Example |
|---------|-----------------|---------|
| Primary color | `brand.color.primary` | Buttons, links, accents |
| Typography | `brand.fontFamily.display` | Headlines |
| Imagery style | — | Hero photos, backgrounds |
| Motion | `core.motion.duration.slow` | Page transitions |
| Card style | `surface.consumer.cardStyle` | Elevated vs flat |

### Rules

- Brand styling applies primarily at the consumer surface
- It should not affect internal application UI
- Safe to override per studio
- Must maintain accessibility contrast ratios

---

## Page Compositions

### Landing Page

```
┌─────────────────────────────────────────────────────────────────┐
│  AnnouncementBar (optional)                                     │
├─────────────────────────────────────────────────────────────────┤
│  Navigation                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HeroSection                                                    │
│  - Headline                                                     │
│  - Subhead                                                      │
│  - Primary CTA                                                  │
│  - Hero Image/Video                                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Section: "Upcoming Classes"                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                           │
│  │ClassCard│ │ClassCard│ │ClassCard│                           │
│  └─────────┘ └─────────┘ └─────────┘                           │
│  [View Full Schedule →]                                         │
├─────────────────────────────────────────────────────────────────┤
│  Section: "Why Practice With Us"                                │
│  FeatureGrid (3 columns)                                        │
├─────────────────────────────────────────────────────────────────┤
│  Section: "Meet Our Teachers"                                   │
│  InstructorGrid                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Section: "What Students Say"                                   │
│  TestimonialCarousel                                            │
├─────────────────────────────────────────────────────────────────┤
│  Section: "Ready to Start?"                                     │
│  PricingTable or IntroOfferCTA                                  │
├─────────────────────────────────────────────────────────────────┤
│  Footer                                                         │
│  - Links                                                        │
│  - NewsletterSignup                                             │
│  - Social                                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Schedule Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Navigation                                                     │
├─────────────────────────────────────────────────────────────────┤
│  PageHeader: "Class Schedule"                                   │
├─────────────────────────────────────────────────────────────────┤
│  Filters: Date | Class Type | Instructor | Location            │
├─────────────────────────────────────────────────────────────────┤
│  ClassScheduleGrid                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 6:00 AM  │ Morning Flow      │ Maya P.  │ 8 spots │ Book │  │
│  │ 9:00 AM  │ Vinyasa           │ Jordan L.│ 12 spots│ Book │  │
│  │ 12:00 PM │ Power Lunch       │ Sarah C. │ FULL    │ Wait │  │
│  │ ...                                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  Footer                                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Event Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Navigation                                                     │
├─────────────────────────────────────────────────────────────────┤
│  EventHero                                                      │
│  - Event Title                                                  │
│  - Date/Time                                                    │
│  - Location                                                     │
│  - Primary CTA                                                  │
│  - Hero Image                                                   │
├─────────────────────────────────────────────────────────────────┤
│  Section: Event Details                                         │
│  - Description (rich text)                                      │
│  - What You'll Learn                                            │
│  - Who It's For                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Section: Schedule (if multi-session)                           │
│  EventSchedule                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Section: Your Instructor                                       │
│  InstructorBio                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Section: Pricing                                               │
│  EventPricing (tiers if applicable)                             │
├─────────────────────────────────────────────────────────────────┤
│  Section: FAQ (optional)                                        │
│  Accordion                                                      │
├─────────────────────────────────────────────────────────────────┤
│  Sticky BookingCTA (mobile)                                     │
├─────────────────────────────────────────────────────────────────┤
│  Footer                                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Safe Customization Examples

### Studios MAY

- Redesign landing page layout
- Create custom event page templates
- Reorder content blocks
- Apply unique typography and imagery
- Add custom sections
- Modify hero styling
- Create promotional variations

### Studios SHOULD NOT

- Change booking flow logic
- Alter core interaction patterns
- Modify internal admin workflows
- Remove accessibility features
- Hard-code values instead of tokens

---

## Agent & No-Code Compatibility

This model is intentionally friendly to:
- AI-generated layouts
- Visual page builders
- Static site generators
- Headless CMS

### Why It Works

| Characteristic | Benefit |
|----------------|---------|
| Structure is explicit | Agents can parse layout |
| Content is modular | Blocks can be rearranged |
| Styling is token-driven | Themes apply consistently |
| Data bindings are clear | Content populates automatically |

### Example: Agent-Generated Page

```json
{
  "page": "landing",
  "sections": [
    { "block": "HeroSection", "props": { "variant": "centered" } },
    { "block": "UpcomingClasses", "props": { "limit": 3 } },
    { "block": "InstructorGrid", "props": { "featured": true } },
    { "block": "TestimonialCarousel" },
    { "block": "NewsletterSignup" }
  ]
}
```

---

## Why This Matters

This approach:
- **Avoids brittle theming systems** — No CSS overrides that break
- **Prevents accidental UX regressions** — Core patterns protected
- **Gives designers real freedom** — Express brand where it counts
- **Enables automation** — Agents can compose pages safely

**Creativity lives at the edges. Stability lives at the core.**

---

## Related Documentation

- [README.md](README.md) — Design system overview
- [02-design-tokens.md](02-design-tokens.md) — Token schema
- [03-figma-structure.md](03-figma-structure.md) — Figma organization
- [05-components.md](05-components.md) — Component inventory
