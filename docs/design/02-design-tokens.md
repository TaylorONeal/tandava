# Design Token Schema

Design tokens are the **single shared contract** between:
- Designers
- Developers
- AI agents
- Downstream tooling

They are not implementation details.
They describe **intent**, not styling preferences.

---

## Token Layering Model

Tokens are layered to balance stability, brand flexibility, and surface-specific needs.

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: CORE TOKENS                                           │
│  Structural, rarely changed                                     │
│  └── Spacing, typography scale, radius, motion                  │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: BRAND TOKENS                                          │
│  Studio identity, safely customized                             │
│  └── Colors, fonts, logos                                       │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3: SURFACE TOKENS                                        │
│  Contextual application                                         │
│  └── Internal (operations) vs Consumer (public)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Core Tokens (Structural)

These define **usability and rhythm**.
They should almost never be customized by studios.

### Spacing Scale

```json
{
  "core": {
    "spacing": {
      "xs": 4,
      "sm": 8,
      "md": 16,
      "lg": 24,
      "xl": 32,
      "2xl": 48,
      "3xl": 64
    }
  }
}
```

| Token | Value | Use Case |
|-------|-------|----------|
| `xs` | 4px | Icon padding, tight gaps |
| `sm` | 8px | Inline element spacing |
| `md` | 16px | Standard component padding |
| `lg` | 24px | Card padding, section gaps |
| `xl` | 32px | Large section spacing |
| `2xl` | 48px | Page section dividers |
| `3xl` | 64px | Hero spacing |

### Border Radius

```json
{
  "core": {
    "radius": {
      "none": 0,
      "sm": 4,
      "md": 8,
      "lg": 12,
      "xl": 16,
      "full": 9999
    }
  }
}
```

### Typography Scale

```json
{
  "core": {
    "fontSize": {
      "xs": 12,
      "sm": 14,
      "base": 16,
      "lg": 18,
      "xl": 20,
      "2xl": 24,
      "3xl": 30,
      "4xl": 36,
      "5xl": 48
    },
    "lineHeight": {
      "tight": 1.25,
      "normal": 1.5,
      "relaxed": 1.75
    },
    "fontWeight": {
      "normal": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    }
  }
}
```

### Motion

```json
{
  "core": {
    "motion": {
      "duration": {
        "fast": "120ms",
        "standard": "200ms",
        "slow": "320ms",
        "slower": "500ms"
      },
      "easing": {
        "default": "cubic-bezier(0.4, 0, 0.2, 1)",
        "in": "cubic-bezier(0.4, 0, 1, 1)",
        "out": "cubic-bezier(0, 0, 0.2, 1)",
        "bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
      }
    }
  }
}
```

### Elevation

```json
{
  "core": {
    "elevation": {
      "none": "none",
      "sm": "0 1px 2px rgba(0,0,0,0.05)",
      "md": "0 4px 6px rgba(0,0,0,0.1)",
      "lg": "0 10px 15px rgba(0,0,0,0.1)",
      "xl": "0 20px 25px rgba(0,0,0,0.15)"
    }
  }
}
```

---

## Layer 2: Brand Tokens (Studio Identity)

These define **who the studio is**, visually.

Safe to customize. Expected to differ per studio.

### Colors

```json
{
  "brand": {
    "color": {
      "primary": "#C41230",
      "primaryForeground": "#FFFFFF",
      "secondary": "#169179",
      "secondaryForeground": "#FFFFFF",
      "accent": "#F59E0B",
      "accentForeground": "#1F1F1F",
      "neutral": {
        "50": "#FAFAFA",
        "100": "#F4F4F5",
        "200": "#E4E4E7",
        "300": "#D4D4D8",
        "400": "#A1A1AA",
        "500": "#71717A",
        "600": "#52525B",
        "700": "#3F3F46",
        "800": "#27272A",
        "900": "#18181B",
        "950": "#09090B"
      }
    }
  }
}
```

### Typography Family

```json
{
  "brand": {
    "fontFamily": {
      "sans": "Inter, system-ui, sans-serif",
      "display": "Playfair Display, Georgia, serif",
      "mono": "JetBrains Mono, monospace"
    }
  }
}
```

### Logo Assets

```json
{
  "brand": {
    "logo": {
      "primary": "/assets/logo.svg",
      "primaryDark": "/assets/logo-dark.svg",
      "mark": "/assets/mark.svg",
      "markDark": "/assets/mark-dark.svg"
    }
  }
}
```

---

## Layer 3: Surface Tokens (Contextual Application)

These define **how brand applies** differently across surfaces.

### Surface Definitions

```json
{
  "surface": {
    "internal": {
      "density": "compact",
      "cardStyle": "flat",
      "emphasis": "subtle",
      "borderWidth": 1,
      "focusRing": "2px solid var(--brand-primary)"
    },
    "consumer": {
      "density": "comfortable",
      "cardStyle": "elevated",
      "emphasis": "expressive",
      "borderWidth": 0,
      "focusRing": "3px solid var(--brand-primary)"
    }
  }
}
```

### Surface Characteristics

| Attribute | Internal | Consumer |
|-----------|----------|----------|
| **Density** | Compact (more info per screen) | Comfortable (breathing room) |
| **Card Style** | Flat with borders | Elevated with shadows |
| **Emphasis** | Subtle, functional | Expressive, branded |
| **Typography** | System font preferred | Display font encouraged |
| **Motion** | Fast, minimal | Slower, more expressive |
| **Imagery** | Functional icons | Hero photos, lifestyle |

---

## Token Usage Rules

1. **Core tokens should not reference brand tokens**
   - Core defines structure; brand defines identity
   - Keep layers independent

2. **Surface tokens may reference core tokens**
   - `surface.internal.spacing` → `core.spacing.sm`
   - `surface.consumer.spacing` → `core.spacing.lg`

3. **Components consume tokens, never raw values**
   - ✅ `padding: var(--spacing-md)`
   - ❌ `padding: 16px`

4. **Agents and tooling should treat this schema as authoritative**
   - Parse `tokens.json` for automation
   - Generate platform-specific outputs

---

## Export Targets

Tokens may be exported to:

| Target | Format | Use Case |
|--------|--------|----------|
| CSS Variables | `--spacing-md: 16px` | Web application |
| Tailwind Config | `spacing: { md: '16px' }` | Utility classes |
| JSON | `tokens.json` | Agents, tooling |
| Swift | `enum Spacing` | iOS (future) |
| Kotlin | `object Spacing` | Android (future) |
| Figma Tokens | Plugin format | Design sync |

The schema is intentionally neutral to tooling choice.

> **Cross-Platform Note:** Web, iOS, and Android exports are planned.
> See [06-cross-platform.md](06-cross-platform.md) (coming soon) for platform-specific mappings.

---

## Tandava Default Theme

Complete token set for the default Tandava theme:

```json
{
  "name": "tandava-default",
  "version": "1.0.0",
  "core": {
    "spacing": { "xs": 4, "sm": 8, "md": 16, "lg": 24, "xl": 32, "2xl": 48, "3xl": 64 },
    "radius": { "none": 0, "sm": 4, "md": 8, "lg": 12, "xl": 16, "full": 9999 },
    "fontSize": { "xs": 12, "sm": 14, "base": 16, "lg": 18, "xl": 20, "2xl": 24, "3xl": 30, "4xl": 36, "5xl": 48 },
    "lineHeight": { "tight": 1.25, "normal": 1.5, "relaxed": 1.75 },
    "fontWeight": { "normal": 400, "medium": 500, "semibold": 600, "bold": 700 },
    "motion": {
      "duration": { "fast": "120ms", "standard": "200ms", "slow": "320ms", "slower": "500ms" },
      "easing": { "default": "cubic-bezier(0.4, 0, 0.2, 1)" }
    },
    "elevation": {
      "none": "none",
      "sm": "0 1px 2px rgba(0,0,0,0.05)",
      "md": "0 4px 6px rgba(0,0,0,0.1)",
      "lg": "0 10px 15px rgba(0,0,0,0.1)"
    }
  },
  "brand": {
    "color": {
      "primary": "#C41230",
      "primaryForeground": "#FFFFFF",
      "secondary": "#169179",
      "secondaryForeground": "#FFFFFF",
      "accent": "#F59E0B"
    },
    "fontFamily": {
      "sans": "Inter, system-ui, sans-serif",
      "display": "Playfair Display, Georgia, serif"
    }
  },
  "surface": {
    "internal": { "density": "compact", "cardStyle": "flat", "emphasis": "subtle" },
    "consumer": { "density": "comfortable", "cardStyle": "elevated", "emphasis": "expressive" }
  }
}
```

---

## Philosophy

Tokens exist to:
- **Reduce ambiguity** — One source of truth
- **Prevent drift** — Design and code stay aligned
- **Make collaboration predictable** — Everyone speaks the same language

They are guardrails, not constraints.

---

## Related Documentation

- [README.md](README.md) — Design system overview
- [03-figma-structure.md](03-figma-structure.md) — Figma file organization
- [tokens/tokens.json](tokens/tokens.json) — Machine-readable tokens
