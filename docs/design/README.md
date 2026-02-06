# Design System Overview

This directory supports **designers of many kinds** working with Tandava:
- Studio owners customizing their brand
- Professional UX/product designers
- Figma-first designers
- AI-assisted design workflows
- Developers consuming design outputs

This is **not** a UI style guide or branding manual.

It documents:
- How design decisions are structured
- What is safe to customize
- How design work connects to code without friction

---

## Two Design Surfaces

Tandava has **two distinct design surfaces** with different rules.

```
┌─────────────────────────────────────────────────────────────────┐
│                         TANDAVA                                 │
├────────────────────────────┬────────────────────────────────────┤
│   INTERNAL APPLICATION     │     CONSUMER-FACING EXPERIENCES   │
│   (Operations)             │     (Brand Expression)             │
├────────────────────────────┼────────────────────────────────────┤
│ • /manage/* routes         │ • Landing pages                    │
│ • /teach/* routes          │ • Booking pages                    │
│ • Admin dashboards         │ • Studio website                   │
│ • Staff workflows          │ • Event/workshop pages             │
│ • Reports & analytics      │ • Member portal                    │
├────────────────────────────┼────────────────────────────────────┤
│ Goal: Clarity, speed       │ Goal: Brand, emotion, conversion   │
│ Customization: Light       │ Customization: High                │
└────────────────────────────┴────────────────────────────────────┘
```

### 1. Internal Application UI

**Includes:**
- Scheduling (`/manage/schedule`)
- Rosters and check-in
- Staff management
- Financial reports
- Settings and configuration

**Design goals:**
- Clarity over personality
- Consistency across workflows
- Speed and low cognitive load
- Accessibility compliance

**Customization philosophy:**
- Light branding only (logo, primary color, accent)
- No structural redesigns
- Consistency is a feature, not a limitation

**Recommendation:** Most studios should not redesign this surface.

### 2. Consumer-Facing Experiences

**Includes:**
- Studio landing pages
- Class booking flow
- Event and workshop pages
- Teacher training promotions
- Member account portal

**Design goals:**
- Brand expression and differentiation
- Emotional resonance
- Conversion optimization
- Mobile-first experience

**Customization philosophy:**
- High freedom within composable blocks
- Brand-driven styling encouraged
- Layout flexibility supported

**Recommendation:** This is where studios should invest design effort.

---

## Design Token Layers

Design and code communicate through **design tokens** organized in layers.

```
┌─────────────────────────────────────────────────────────────────┐
│                      TOKEN HIERARCHY                            │
├─────────────────────────────────────────────────────────────────┤
│  CORE TOKENS (Stable)                                           │
│  └── Spacing scale, typography scale, motion, radii             │
│      └── Define rhythm and usability                            │
│      └── Rarely customized                                      │
├─────────────────────────────────────────────────────────────────┤
│  BRAND TOKENS (Customizable)                                    │
│  └── Colors, fonts, logo, imagery style                         │
│      └── Define studio identity                                 │
│      └── Safely customized per studio                           │
├─────────────────────────────────────────────────────────────────┤
│  SURFACE TOKENS (Contextual)                                    │
│  └── How brand applies to each surface                          │
│      └── Internal: muted, functional                            │
│      └── Consumer: expressive, branded                          │
└─────────────────────────────────────────────────────────────────┘
```

See [02-design-tokens.md](02-design-tokens.md) for the complete token schema.

---

## What You Can Change vs. What You Shouldn't

### Safe to Customize

| Element | Where | Notes |
|---------|-------|-------|
| Brand colors | Both surfaces | Primary, secondary, accent |
| Typography family | Both surfaces | Keep scale intact |
| Logo | Both surfaces | Provide light/dark variants |
| Consumer layouts | Consumer only | Use composition blocks |
| Marketing imagery | Consumer only | Hero images, backgrounds |
| Tone of voice | Consumer only | Headlines, CTAs |

### Intentionally Stable

| Element | Why |
|---------|-----|
| Internal table density | Optimized for scanning |
| Form spacing | Accessibility tested |
| Button sizes | Touch target compliance |
| Navigation structure | Learned patterns |
| Modal behavior | Focus management |
| Core interaction patterns | Reduces training burden |

These boundaries enable collaboration, not restrict creativity.

---

## File Structure

```
docs/design/
├── README.md               # This overview
├── 02-design-tokens.md     # Token schema and values
├── 03-figma-structure.md   # How Figma files are organized
├── 04-consumer-pages.md    # Consumer-facing page compositions
├── 05-components.md        # Component inventory
└── tokens/
    └── tokens.json         # Machine-readable tokens
```

---

## Working With This System

### For Designers

1. **Start with tokens** — Understand the token hierarchy before diving into components
2. **Know your surface** — Internal and consumer have different rules
3. **Use compositions** — Consumer pages are built from reusable blocks
4. **Document intent** — Explain why, not just what

### For Developers

1. **Tokens are the contract** — Use CSS variables, not hardcoded values
2. **Components mirror design** — Naming is intentionally aligned
3. **Surface determines variant** — Same component, different styling rules

### For AI/Agents

1. **Tokens are parseable** — `tokens/tokens.json` is machine-readable
2. **Components are documented** — Clear props and variants
3. **Compositions are templated** — Page structures are predictable

---

## Philosophy

- **Structure enables creativity** — Constraints focus energy
- **Constraints protect usability** — Users benefit from consistency
- **Branding belongs where users feel it** — Consumer surfaces, not admin panels
- **Operations benefit from familiarity** — Staff shouldn't relearn the UI

This system makes all of that easy.

---

## Related Documentation

- [02-design-tokens.md](02-design-tokens.md) — Complete token schema
- [03-figma-structure.md](03-figma-structure.md) — Figma file organization
- [04-consumer-pages.md](04-consumer-pages.md) — Page compositions
- [05-components.md](05-components.md) — Component inventory
