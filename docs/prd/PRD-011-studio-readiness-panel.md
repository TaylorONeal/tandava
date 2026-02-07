# PRD-011: Studio Readiness Panel

**Status:** Draft
**Author:** Product
**Last Updated:** 2024
**Dependencies:** PRD-010 (UI Nudges), Training Path, Checklists

---

## Summary

A reflective status panel that helps studio owners understand what their studio is ready for, based on actual usage patterns—without scores, pressure, or gamification.

---

## What This Is (and Is Not)

### It Is

- A reflective status panel
- A situational awareness tool
- A conversation starter for owners/admins
- A bridge between training materials and real usage
- A "go-live confidence" indicator

### It Is Not

- A progress bar
- A completion tracker
- A gating mechanism
- A gamified level system
- A KPI dashboard pretending to be education

### Core Framing

> "Here's what your studio appears ready for, based on how you're using the system."

**Not:**
> "Here's what you must do next."

---

## The Golden Rule

> If the Studio Readiness Panel ever feels like a performance review, it has failed.

It should feel like:
> "A calm operator quietly saying, 'You're good. Here's what's possible when you're ready.'"

---

## Location and Visibility

### Primary Location

- Owner/Admin dashboard
- Collapsed by default
- Expandable on demand

### Visual Treatment

- Calm card design
- Neutral color (muted background)
- Informational tone
- No badges, no alerts, no urgency indicators

### Secondary Access

Linked from:
- Onboarding/training area
- Settings overview
- Help menu

### Visibility Rules

- Never forced into workflows
- Never blocks actions
- If a studio never opens it, nothing breaks

---

## Readiness States

Three primary states, mapped to the training path. Studios can move between states non-linearly.

### State 1: Getting Started

**When shown:** New studio with minimal setup

**Signals detected:**
- Studio created but few/no sessions scheduled
- No bookings yet
- Staff may not be fully configured

**Panel content:**

```
┌─────────────────────────────────────────────────────────────┐
│  Studio Readiness                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current focus: Getting Set Up                              │
│                                                             │
│  You're in the early stages of configuration.               │
│  Take your time—there's no rush.                            │
│                                                             │
│  Before accepting bookings, most studios:                   │
│  • Schedule at least a week of classes                      │
│  • Add instructors with correct permissions                 │
│  • Test a booking themselves                                │
│                                                             │
│  [View setup checklist]                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Go-live indicator:** Not yet shown

---

### State 2: Operational Stability

**When shown:** Studio has core operations running

**Signals detected:**
- Sessions scheduled consistently (7+ days out)
- Staff roles assigned
- At least one booking exists
- Attendance can be marked

**Panel content:**

```
┌─────────────────────────────────────────────────────────────┐
│  Studio Readiness                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current focus: Operational Stability                       │
│                                                             │
│  Your studio is set up to run day-to-day smoothly.          │
│  Branding and growth tools are available when you're ready. │
│                                                             │
│  Signals we see:                                            │
│  • Sessions scheduled consistently                          │
│  • Staff assigned and active                                │
│  • Bookings flowing without intervention                    │
│                                                             │
│  ✓ Ready to accept bookings                                 │
│                                                             │
│  Optional next considerations:                              │
│  • Light branding for customer-facing pages                 │
│  • Review your onboarding checklist                         │
│                                                             │
│  [View checklist]  [Dismiss]                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Go-live indicator:** "✓ Ready to accept bookings" appears

---

### State 3: Brand-Ready

**When shown:** Operations stable, branding activity detected

**Signals detected:**
- All Operational Stability signals present
- Consumer-facing pages exist or viewed
- Branding settings accessed
- Logo or colors customized

**Panel content:**

```
┌─────────────────────────────────────────────────────────────┐
│  Studio Readiness                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current focus: Brand Expression                            │
│                                                             │
│  Many studios at this stage begin shaping how clients       │
│  experience their brand. Your operations are stable         │
│  enough to support customization.                           │
│                                                             │
│  Signals we see:                                            │
│  • Consistent operations over time                          │
│  • Branding settings explored                               │
│  • Customer-facing pages active                             │
│                                                             │
│  Reminder: Internal tools stay consistent by design.        │
│  Brand expression happens on customer-facing pages.         │
│                                                             │
│  [View branding checklist]  [Branding guide]  [Dismiss]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### State 4: Leverage-Ready

**When shown:** Studio showing signs of scaling needs

**Signals detected:**
- Data exports used
- Multiple staff active
- Multiple locations or programs
- Reports accessed regularly
- Integrations explored

**Panel content:**

```
┌─────────────────────────────────────────────────────────────┐
│  Studio Readiness                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current focus: Operational Leverage                        │
│                                                             │
│  Your setup suggests opportunities to reduce manual work.   │
│  Growth tools can help—when added intentionally.            │
│                                                             │
│  Signals we see:                                            │
│  • Multiple active staff members                            │
│  • Data exports in use                                      │
│  • Increased operational complexity                         │
│                                                             │
│  Before adding integrations or automation, consider:        │
│  • Is this removing effort or adding complexity?            │
│  • Can staff manage this independently?                     │
│                                                             │
│  [View growth checklist]  [Dismiss]                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Go-Live Confidence

The most important moment for new studios: "Am I ready to accept real bookings?"

### When "Ready to accept bookings" appears

All of these must be true:
- [ ] At least 7 days of sessions scheduled
- [ ] At least one instructor assigned to sessions
- [ ] At least one pricing option exists (membership, pack, or drop-in)
- [ ] Test booking completed successfully

### Display

A simple checkmark with text, not a celebration:

```
✓ Ready to accept bookings
```

### If not ready

Don't show a warning. Simply don't show the indicator. The "Getting Started" state handles guidance.

---

## Signal Detection

### Safe Signals (structural, not behavioral)

| Signal | How Detected | Maps To |
|--------|--------------|---------|
| Sessions scheduled | `class_occurrences` with future `start_time` | Operations |
| Staff configured | `staff_profiles` with `role` assigned | Operations |
| Bookings exist | `bookings` table has records | Operations |
| Pricing configured | `memberships` or `class_packs` exist | Operations |
| Branding touched | `studio_settings.branding` modified | Branding |
| Consumer pages active | Page views on public routes | Branding |
| Exports used | `export_logs` has records | Growth |
| Multiple locations | `locations` count > 1 | Growth |
| Reports accessed | `report_views` logged | Growth |

### Signals We Avoid

| Avoid | Why |
|-------|-----|
| Time since signup | Creates pressure |
| Login frequency | Judges behavior |
| Comparison to other studios | Competitive/shame |
| Feature usage quotas | Arbitrary goals |
| "Days since X" | Urgency manufacturing |

### Signal Transparency

The panel always shows "Signals we see" so studios understand why a suggestion appears. No hidden logic.

---

## Data Model

```sql
-- Readiness state (computed, not stored)
-- This is derived from signals, not persisted as a "level"

-- Signal sources (existing tables)
-- class_occurrences: future sessions
-- staff_profiles: roles assigned
-- bookings: booking activity
-- memberships, class_packs: pricing
-- studio_settings: branding changes

-- Panel state (user preferences only)
CREATE TABLE IF NOT EXISTS studio_readiness_preferences (
  studio_id UUID PRIMARY KEY REFERENCES studios(id),
  panel_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  show_again_after TIMESTAMPTZ  -- Optional "show later"
);
```

### Readiness Computation (pseudocode)

```typescript
function computeReadinessState(studio: Studio): ReadinessState {
  const signals = gatherSignals(studio);

  // Check in reverse order (most advanced first)
  if (signals.exportsUsed || signals.multipleLocations || signals.reportsAccessed) {
    return 'leverage-ready';
  }

  if (signals.brandingTouched || signals.consumerPagesActive) {
    return 'brand-ready';
  }

  if (signals.futureSessionsExist &&
      signals.staffConfigured &&
      signals.bookingsExist) {
    return 'operational-stability';
  }

  return 'getting-started';
}

function isReadyForBookings(studio: Studio): boolean {
  const signals = gatherSignals(studio);
  return (
    signals.futureSessionsCount >= 7 &&
    signals.instructorsAssigned &&
    signals.pricingConfigured &&
    signals.testBookingCompleted
  );
}
```

---

## Edge Cases

### Migrated Studios

Studios importing data from another system should:
- Skip "Getting Started" if data indicates established operations
- Start at "Operational Stability" or higher
- Show: "We see you've imported existing data. Your readiness reflects your current setup."

### Seasonal Studios

Studios that operate seasonally may:
- Drop back to "Getting Started" when schedule is empty
- This is normal, not a regression
- Panel acknowledges: "Looks like you're between seasons."

### Multi-Location Studios

Each location doesn't need its own readiness. Studio-level readiness applies. However:
- New location added → brief revisit prompt (not forced)
- "You've added a new location. Consider reviewing your setup checklist."

### Hybrid Studios (Classes + Events + Trainings)

Different program types don't change readiness logic. The same signals apply. Programs are just different `offering_types`.

---

## Dismissal and Control

### Rules

- Panel can be dismissed
- Dismissal persists (stored in preferences)
- No automatic resurfacing

### Options Shown

```
[Dismiss]              → Hide permanently
[Show again later]     → Hide for 30 days (optional)
```

### Never Show

- "Remind me"
- "Are you sure?"
- "You're missing out"
- Confirmation modals for dismissal

---

## Connection to Training Materials

### Just-in-Time Links

Each state links to relevant, scoped resources:

| State | Links To |
|-------|----------|
| Getting Started | Setup checklist, QUICKSTART |
| Operational Stability | Onboarding checklist, FAQ |
| Brand-Ready | Branding checklist, Branding Guide |
| Leverage-Ready | Growth checklist, Compensation Guide |

### Never Dump the Library

Only show 1-2 relevant links. Don't overwhelm with options.

---

## Component Specification

### StudioReadinessPanel

```tsx
interface StudioReadinessPanelProps {
  studio: Studio;
  onDismiss: () => void;
  onShowLater?: () => void;
}

// Collapsed view
<Card variant="muted" className="cursor-pointer">
  <CardHeader>
    <CardTitle className="text-sm font-medium">
      Studio Readiness
    </CardTitle>
    <ChevronDown className="h-4 w-4" />
  </CardHeader>
</Card>

// Expanded view
<Card variant="muted">
  <CardHeader>
    <CardTitle>Studio Readiness</CardTitle>
  </CardHeader>
  <CardContent>
    <ReadinessStateContent state={computedState} />
    <SignalsList signals={detectedSignals} />
    {isReadyForBookings && <GoLiveIndicator />}
    <SuggestedActions state={computedState} />
  </CardContent>
  <CardFooter>
    <Button variant="ghost" onClick={onDismiss}>Dismiss</Button>
  </CardFooter>
</Card>
```

### Visual Treatment

| Element | Treatment |
|---------|-----------|
| Card background | `bg-muted` (subtle gray) |
| Text | `text-muted-foreground` for descriptions |
| State title | `text-foreground font-medium` |
| Go-live indicator | Simple checkmark, `text-green-600` |
| Signals list | Bullet points, no icons |
| Links | Text links, no buttons |

---

## Content Guidelines

### Tone

| Do | Don't |
|----|-------|
| "Your studio appears ready for..." | "You've unlocked..." |
| "Signals we see" | "You've completed" |
| "Optional next considerations" | "You should now..." |
| "When you're ready" | "Don't miss out on..." |

### Length

- State description: 2-3 sentences max
- Signals list: 3-5 items max
- Suggestions: 2 items max

---

## Success Metrics

### Track (carefully)

- Panel open rate (are people curious?)
- Dismissal rate (is it annoying?)
- Link click-through (are resources helpful?)
- Support tickets mentioning readiness (confusion indicator)

### Don't Track

- "Progression" through states
- Time to reach states
- State comparisons between studios

---

## Implementation Phases

### Phase 1: Core Panel

- [ ] Readiness computation logic
- [ ] Panel component (collapsed/expanded)
- [ ] Dashboard integration
- [ ] Dismissal persistence

### Phase 2: Go-Live Indicator

- [ ] Booking readiness checks
- [ ] "Ready to accept bookings" display
- [ ] Setup checklist link

### Phase 3: Training Integration

- [ ] Links to checklists
- [ ] Links to guides
- [ ] State-appropriate resource filtering

### Phase 4: Edge Cases

- [ ] Migration detection
- [ ] Seasonal studio handling
- [ ] Multi-location prompts

---

## Related Documentation

- [Training Path](../guides/TRAINING_PATH.md) — Three-phase model this reflects
- [Checklists](../guides/CHECKLISTS.md) — Self-assessment tools linked from panel
- [PRD-010: UI Nudges](PRD-010-ui-nudges.md) — Nudge philosophy this follows
- [Branding Guide](../guides/BRANDING_GUIDE.md) — Linked from Brand-Ready state

