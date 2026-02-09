# PRD-010: UI Nudge System

**Status:** Draft
**Author:** Product
**Last Updated:** 2024

---

## Summary

A respectful, contextual guidance system that helps studios without being patronizing.

---

## Philosophy

UI nudges should:
- Reflect reality, not push behavior
- Appear only when contextually relevant
- Disappear permanently when dismissed
- Never block actions

Think: "Helpful note from a calm operator," not "Product manager yelling from a tooltip."

---

## Core Principle

> The platform suggests, the studio decides.

---

## Nudge Types

### 1. Contextual Hints (Passive, Inline)

**Purpose:** Reduce anxiety at decision points.

**Appearance:**
- Small text block
- Muted color (gray or subtle brand)
- No icons that demand attention
- No animation

**Example:**
> "Most studios wait to customize branding until schedules are running smoothly."

**When shown:**
- First time a studio opens branding settings
- First time a complex feature is accessed
- When an action has non-obvious implications

**Behavior:**
- Appears once per user per context
- Dismissible with "Got it" or X
- Once dismissed, never returns
- No follow-up prompts

**Component API:**
```tsx
<ContextualHint
  id="branding-first-visit"
  showIf={isFirstBrandingVisit}
  roles={['owner', 'admin']}
>
  Most studios wait to customize branding until schedules
  are running smoothly.
</ContextualHint>
```

---

### 2. Phase Awareness Indicators (Informational)

**Purpose:** Orient without instructing. Normalize pacing.

**Appearance:**
- Subtle label in settings or dashboard sidebar
- No badge, no progress bar, no gamification

**Example:**
> "Many studios focus on stability first. Branding and growth tools remain available when you're ready."

**Behavior:**
- No CTA
- No urgency language
- Opt-in to display (hidden by default)
- Based on activity patterns, not "completion"

**Implementation Note:**

This is the riskiest element. Consider:
- Making it opt-in only
- Framing as "Your recent activity" not "Your current phase"
- Or deferring to the Checklists document instead

---

### 3. Gentle Warnings (Rare)

**Purpose:** Pause before high-impact actions.

**When used:**
- Action could destabilize operations
- Consequences are non-obvious
- Reverting is difficult or impossible

**Appearance:**
- Modal or inline confirmation
- Neutral tone, no red/warning colors
- Clear explanation of impact

**Example (before deep customization):**
> "This change affects staff-facing tools. Most studios keep these consistent to avoid retraining."
>
> [Continue] [Cancel]

**Behavior:**
- No scary language
- No "Are you sure?" patterns
- Explains impact, lets user decide
- Remembers preference: "Don't show this again"

---

## What Nudges Must NEVER Do

| Forbidden Pattern | Why |
|-------------------|-----|
| Track "completion" percentage | Implies judgment |
| Lock features behind phases | Removes agency |
| Force sequencing | Studios know their needs |
| Use gamification | Patronizing |
| Reference "best practices" as authority | Condescending |
| Create urgency | Manipulative |
| Upsell or promote features | Breaks trust |

---

## Phase Mapping

| Phase | Nudge Support |
|-------|---------------|
| Onboarding | Hints that reduce anxiety about setup |
| Branding | Boundary reminders (consumer vs internal) |
| Growth | Complexity checks before adding integrations |

The UI doesn't teach. It reminds at the moment of choice.

---

## Technical Specification

### Data Model

```sql
-- User preferences for dismissed hints
ALTER TABLE user_profiles ADD COLUMN dismissed_hints TEXT[] DEFAULT '{}';

-- Example: ['branding-first-visit', 'integration-warning-stripe']
```

### Dismissal Logic

```typescript
// Check if hint should show
function shouldShowHint(hintId: string, user: User): boolean {
  if (user.dismissed_hints.includes(hintId)) return false;
  if (hint.roles && !hint.roles.includes(user.role)) return false;
  if (hint.hideAfterDays && daysSinceSignup(user) > hint.hideAfterDays) return false;
  return hint.condition(user);
}

// Dismiss hint permanently
async function dismissHint(hintId: string, user: User) {
  await supabase
    .from('user_profiles')
    .update({
      dismissed_hints: [...user.dismissed_hints, hintId]
    })
    .eq('id', user.id);
}
```

### Copy Management

All hint copy lives in a single file for easy editing:

```typescript
// src/lib/hints.ts
export const hints = {
  'branding-first-visit': {
    content: 'Most studios wait to customize branding until schedules are running smoothly.',
    roles: ['owner', 'admin'],
    hideAfterDays: 90,
  },
  'integration-first-visit': {
    content: 'Integrations work best after your core workflows are stable.',
    roles: ['owner'],
    hideAfterDays: 60,
  },
  // ...
} as const;
```

---

## Component Specifications

### ContextualHint

```tsx
interface ContextualHintProps {
  id: string;                    // Unique identifier for dismissal tracking
  children: React.ReactNode;     // Hint content
  showIf?: boolean;              // Conditional display
  roles?: UserRole[];            // Which roles see this hint
  hideAfterDays?: number;        // Auto-hide after N days from signup
  className?: string;            // Additional styling
}
```

**Visual treatment:**
- Background: `bg-muted` (subtle gray)
- Border: `border-l-2 border-muted-foreground/20`
- Text: `text-sm text-muted-foreground`
- Dismiss: Small X button, top-right

### GentleWarning

```tsx
interface GentleWarningProps {
  id: string;
  title: string;
  description: string;
  onContinue: () => void;
  onCancel: () => void;
  rememberPreference?: boolean;  // Show "Don't ask again" checkbox
}
```

**Visual treatment:**
- No red or warning colors
- Standard modal styling
- Primary button: "Continue"
- Secondary button: "Cancel"

---

## Content Guidelines

### Tone

| Do | Don't |
|----|-------|
| "Most studios..." | "You should..." |
| "This affects..." | "Warning: This will..." |
| "Available when you're ready" | "Unlock this feature by..." |
| Neutral observation | Prescriptive instruction |

### Length

- Hints: 1-2 sentences max
- Warnings: 2-3 sentences max
- No walls of text

### Voice

- Calm operator, not enthusiastic marketer
- Observational, not directive
- Confident, not hedging

---

## Quality Checklist

Before adding any nudge, ask:

> "Would a thoughtful adult find this helpful or insulting?"

If not clearly helpful, don't add it.

### Review Criteria

- [ ] Does it appear at the moment of decision?
- [ ] Is it dismissible forever?
- [ ] Does it respect the user's intelligence?
- [ ] Is it free of urgency language?
- [ ] Would removing it make the product worse?

---

## Measurement

**Do track:**
- Dismissal rates (are hints useful or annoying?)
- Support tickets related to hinted areas

**Do NOT track:**
- "Engagement" with hints
- Hint-driven conversions
- Phase progression

---

## Examples Library

### Good Hints

| Context | Hint |
|---------|------|
| First branding visit | "Most studios wait to customize branding until schedules are running smoothly." |
| First integration page | "Integrations work best after your core workflows are stable." |
| Adding second location | "Each location can have its own schedule and staff." |
| First report export | "Exports can be scheduled to run automatically." |

### Good Warnings

| Action | Warning |
|--------|---------|
| Changing internal layout | "This change affects staff-facing tools. Most studios keep these consistent to avoid retraining." |
| Bulk member import | "This will create [N] new member records. Review the preview to confirm the data looks correct." |
| Deleting a class type | "This removes the class type from future scheduling. Existing bookings are not affected." |

---

## Related Documentation

- [Training Path](../guides/TRAINING_PATH.md) — Phase model this supports
- [Checklists](../guides/CHECKLISTS.md) — Self-assessment tools
- [Branding Guide](../guides/BRANDING_GUIDE.md) — Consumer vs internal surfaces

