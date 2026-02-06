# Competitor Issues - Prioritized Roadmap

Strategic prioritization of the 20 competitor issues for development and SEO landing pages.

---

## Priority Tiers

### Tier 1: CRITICAL (Do First)
High impact on user trust, data integrity, and revenue.

| # | Issue | Why Critical | Effort |
|---|-------|--------------|--------|
| **18** | Partial Refund Complexity | Direct revenue impact, admin frustration, legal risk | Medium |
| **10** | Payment Failed but Class Booked | Data integrity, trust, chargebacks | Medium |
| **1** | Timezone Display Bugs | Booking errors, no-shows, frustrated users | Medium |
| **6** | Duplicate Booking Prevention | Wasted capacity, refund overhead | Low |
| **11** | Instructor Schedule Conflicts | Operational chaos, double-booking | Low |

### Tier 2: HIGH (Core Experience)
Directly affects booking conversion and retention.

| # | Issue | Why High | Effort |
|---|-------|----------|--------|
| **3** | Confusing Booking Flow | Conversion killer, 5-7 taps → 1-2 taps | Medium |
| **7** | Inconsistent Cancellation Policies | Trust issues, support overhead | Low |
| **8** | Missing Waitlist Auto-Promotion | Lost revenue, manual work | Medium |
| **13** | Complex Membership Rules | Confusion, support calls, churn | Medium |
| **5** | Poor Error Messages | User frustration, support load | Low |

### Tier 3: MEDIUM (Operational Efficiency)
Improves admin/instructor experience.

| # | Issue | Why Medium | Effort |
|---|-------|------------|--------|
| **17** | Instructor Substitution Chaos | Operational overhead, last-minute scrambles | Medium |
| **19** | Report Export Limitations | Business intelligence blocked | Medium |
| **12** | No Grace Period for Late Arrivals | Rigid UX, instructor frustration | Low |
| **16** | Multi-Location Confusion | Booking errors at wrong location | Low |
| **9** | Calendar Sync Issues | Member frustration, missed classes | Medium |

### Tier 4: ENHANCEMENT (Polish)
Nice-to-have improvements.

| # | Issue | Why Enhancement | Effort |
|---|-------|-----------------|--------|
| **2** | Slow Mobile Performance | Already addressed with skeleton loading | Low |
| **4** | No Offline Support | PWA service worker handles basics | Medium |
| **14** | Notification Overload | Configurable preferences exist | Low |
| **15** | Account Recovery Difficulty | Standard auth flows cover this | Low |
| **20** | Mobile Check-in Failures | Multiple methods mitigate | Low |

---

## Implementation Order

### Sprint 1-2: Foundation Trust
1. **#18 Partial Refunds** - Automatic prorated calculation, one-click refund
2. **#10 Payment/Booking Atomicity** - Transaction integrity
3. **#6 Duplicate Booking Prevention** - Database constraint + UI check
4. **#11 Instructor Conflict Prevention** - Schedule overlap validation

### Sprint 3-4: Booking Excellence
5. **#1 Timezone Handling** - Delivery mode aware display
6. **#3 Quick Booking Flow** - 1-tap for members with coverage
7. **#7 Cancellation Policy Clarity** - Configurable display, countdown
8. **#5 Helpful Error Messages** - Actionable errors with recovery

### Sprint 5-6: Membership Clarity
9. **#13 Membership Rules UI** - "What's Included" section, coverage badges
10. **#8 Waitlist Auto-Promotion** - Configurable timing, notifications
11. **Membership Retail Discount** - Configurable % per membership type

### Sprint 7-8: Operations
12. **#17 Sub Request Workflow** - Request → Notify → Accept flow
13. **#12 Late Arrival Grace Period** - Configurable per studio
14. **#16 Location Clarity** - Color coding, prominent display
15. **#19 Report Exports** - CSV, Excel, PDF, scheduled delivery

### Sprint 9-10: Polish
16. **#9 Calendar Sync** - iCal subscription with updates
17. **#14 Notification Preferences** - Granular controls
18. **#4 Offline Support** - Enhanced service worker
19. **#2 Performance** - Bundle optimization, lazy loading
20. **#15 & #20** - Auth and check-in improvements

---

## SEO Landing Page Strategy

Each issue becomes a landing page targeting studios searching for solutions:

### URL Structure
```
/solutions/timezone-scheduling
/solutions/quick-booking
/solutions/membership-management
/solutions/instructor-scheduling
/solutions/payment-processing
/solutions/waitlist-automation
/solutions/reporting-analytics
...
```

### Page Template
```
[H1] {Problem} - Solved
[Hero] Brief problem description + screenshot of our solution

[Section] The Problem
- What competitors get wrong
- Real studio pain points

[Section] Our Solution
- How Tandava handles it
- Key features
- Screenshots/demo video

[Section] Benefits
- Time saved
- Revenue recovered
- Member satisfaction

[CTA] Try the Demo / Contact Sales
```

### Target Keywords
- "mindbody timezone problems"
- "yoga studio booking software"
- "class scheduling software mistakes"
- "membership management yoga studio"
- etc.

---

## Configurable Admin Messages

Issues that can be partially solved with configurable messaging:

| Issue | Configurable Element |
|-------|---------------------|
| #7 Cancellation Policy | Policy text, deadline hours, fee amount |
| #13 Membership Rules | "What's Included" list per membership type |
| #12 Grace Period | Minutes allowed, messaging |
| #5 Error Messages | Custom error text overrides |
| Retail Discount | % discount per membership tier |

### Admin Settings UI Location
`/manage/settings/policies` - Cancellation, late arrival, no-show
`/manage/settings/memberships` - Pricing, discounts, inclusions
`/manage/settings/messaging` - Custom text overrides

---

## Membership Retail Discount System

### Data Model
```sql
-- Membership types with retail discount
ALTER TABLE membership_types ADD COLUMN retail_discount_percent INTEGER DEFAULT 0;
ALTER TABLE membership_types ADD COLUMN retail_discount_excluded_promos TEXT[]; -- promo codes that don't get discount

-- Example data
-- "Unlimited Monthly" → 10% retail discount
-- "Black Friday Special" → 0% retail discount (excluded)
```

### Business Rules
1. Discount applies to retail purchases (products, not services)
2. Configurable per membership type (0-50%)
3. Can exclude specific promo-acquired memberships
4. Shows discount at checkout: "Member discount: -$5.00"
5. Stacks with sale prices but NOT with other promo codes

### UI Display
```typescript
// At checkout
{memberHasDiscount && (
  <div className="flex justify-between text-accent-sage">
    <span>Member Discount ({discountPercent}%)</span>
    <span>-{formatCurrency(discountAmount)}</span>
  </div>
)}
```

---

*This document guides development priority and marketing strategy.*
