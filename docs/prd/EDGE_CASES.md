# Edge Cases - System Behavior & Business Rules

Comprehensive documentation of how Tandava handles edge cases. Each case includes system behavior, admin configuration, and FAQ/training content.

---

## Table of Contents
1. [Staff Lifecycle](#staff-lifecycle)
2. [Location Lifecycle](#location-lifecycle)
3. [Special Class Types](#special-class-types)
4. [Accounting & Reporting](#accounting--reporting)
5. [Membership Edge Cases](#membership-edge-cases)
6. [Booking Edge Cases](#booking-edge-cases)
7. [Payment Edge Cases](#payment-edge-cases)

---

## Staff Lifecycle

### Teacher Leaves Studio Employment

**The Problem (Competitor Mistake)**
Studios delete the teacher → past classes show "Staff" → payment history broken → reports inaccurate → they re-add the teacher → data chaos.

**Tandava Solution: Status-Based Lifecycle**

```sql
-- Teacher status enum
CREATE TYPE instructor_status AS ENUM (
  'active',           -- Can be scheduled, visible to members
  'inactive',         -- Not schedulable, still visible in history
  'on_leave',         -- Temporarily unavailable (parental, medical, sabbatical)
  'terminated',       -- Employment ended, hidden from public, preserved in records
  'contractor'        -- External sub, not regular staff
);

ALTER TABLE instructors ADD COLUMN status instructor_status DEFAULT 'active';
ALTER TABLE instructors ADD COLUMN termination_date DATE;
ALTER TABLE instructors ADD COLUMN termination_reason TEXT;
```

**System Behavior**

| Status | Can Schedule | Visible in App | In Reports | In Payments |
|--------|--------------|----------------|------------|-------------|
| Active | ✓ | ✓ | ✓ | ✓ |
| Inactive | ✗ | ✓ (history only) | ✓ | ✓ |
| On Leave | ✗ | ✓ (with badge) | ✓ | ✓ |
| Terminated | ✗ | ✗ | ✓ | ✓ |
| Contractor | ✓ (manual) | ✓ | ✓ | Separate |

**When Teacher Departs - Checklist**
1. Change status to `terminated` (NOT delete)
2. Set termination date
3. Cancel future scheduled classes OR assign subs
4. Final payroll calculation auto-generated
5. Historical classes remain attributed to teacher
6. Teacher profile hidden from public pages
7. Teacher can no longer log in
8. Data preserved for 7 years (tax/legal)

**Admin UI Flow**
```
/manage/teachers/{id}/terminate
→ Confirm termination date
→ Handle scheduled classes:
  [ ] Cancel all future classes
  [ ] Assign to: [dropdown of active teachers]
  [ ] Create sub requests
→ Final pay period: [auto-calculated]
→ [Terminate]
```

**FAQ Entry (Admin)**
> **Q: A teacher is leaving. How do I remove them?**
> A: Go to Teachers → [Teacher Name] → Actions → End Employment. This preserves their class history and payment records while removing them from scheduling. Never delete a teacher record.

---

### New Teacher Hired

**Onboarding Checklist - System Generated**

```typescript
const teacherOnboardingSteps = [
  { key: 'profile_complete', label: 'Complete profile (bio, photo)' },
  { key: 'waiver_signed', label: 'Sign instructor agreement' },
  { key: 'payment_setup', label: 'Set up payment info (bank/PayPal)' },
  { key: 'certifications', label: 'Upload certifications' },
  { key: 'class_types', label: 'Assign teachable class types' },
  { key: 'availability', label: 'Set availability preferences' },
  { key: 'training_complete', label: 'Complete platform training' },
  { key: 'first_class', label: 'Schedule first class' },
];
```

**System Behavior**
1. Admin creates teacher account → status = `active`
2. Teacher receives welcome email with login
3. Dashboard shows onboarding checklist
4. Can't be scheduled until required steps complete
5. Pay rate configured by admin
6. Certifications tracked with expiry alerts

**FAQ Entry (Admin)**
> **Q: How do I add a new instructor?**
> A: Go to Teachers → Add Teacher. They'll receive a welcome email to complete their profile. You can assign them class types and set their pay rate in their profile.

**FAQ Entry (Teacher)**
> **Q: I just got hired. What do I do first?**
> A: Check your email for login instructions. Then complete your profile: add a bio, photo, and teaching certifications. Your dashboard shows what's left to do before you can start teaching.

---

## Location Lifecycle

### New Location Created

**System Behavior**
1. Admin creates location with:
   - Name, address, timezone
   - Contact info
   - Operating hours
   - Rooms/spaces within location
   - Default pricing (can differ from other locations)

2. Auto-generated items:
   - Separate schedule view
   - Location-specific reports
   - Staff assignments (teachers can teach at multiple)
   - Member home location preference

**Multi-Location Considerations**
```sql
-- Classes belong to location
ALTER TABLE class_occurrences ADD COLUMN location_id UUID REFERENCES locations(id);

-- Members can have home location
ALTER TABLE member_profiles ADD COLUMN home_location_id UUID REFERENCES locations(id);

-- Some memberships are location-specific
ALTER TABLE membership_types ADD COLUMN valid_locations UUID[]; -- NULL = all locations
```

**FAQ Entry (Admin)**
> **Q: We're opening a second location. How do I set it up?**
> A: Go to Settings → Locations → Add Location. Enter the address and timezone, set up rooms, and configure any location-specific pricing. Existing members can access the new location based on their membership type.

---

### Location Closed (Temporary or Permanent)

**Status Options**
```sql
CREATE TYPE location_status AS ENUM (
  'active',
  'temporarily_closed',  -- Renovation, emergency
  'permanently_closed',  -- Going out of business
  'coming_soon'          -- Not yet open
);
```

**Temporary Closure**
1. Set status to `temporarily_closed`
2. Set closure dates (start/end)
3. System auto-cancels classes in date range
4. Members notified with:
   - Closure reason (configurable text)
   - Alternative locations (if multi-location)
   - Membership freeze option
5. Reopening: classes can be bulk-recreated from templates

**Permanent Closure**
1. Set status to `permanently_closed`
2. Cancel all future classes
3. Members notified with:
   - Final class date
   - Prorated refund/credit options
   - Transfer to another location (if applicable)
4. Historical data preserved
5. Location hidden from public but in reports

**FAQ Entry (Member)**
> **Q: My location is closing. What happens to my membership?**
> A: You'll receive an email with your options: transfer to another location, receive a prorated refund, or pause your membership. Contact us if you need help choosing.

---

## Special Class Types

### Donation-Based Classes

**Configuration**
```sql
-- Pricing type enum
CREATE TYPE pricing_type AS ENUM (
  'fixed',           -- Set price
  'donation',        -- Suggested donation, any amount
  'sliding_scale',   -- Range min-max
  'free',            -- No charge
  'membership_only'  -- Must have membership
);

ALTER TABLE class_templates ADD COLUMN pricing_type pricing_type DEFAULT 'fixed';
ALTER TABLE class_templates ADD COLUMN suggested_donation_cents INTEGER;
ALTER TABLE class_templates ADD COLUMN min_donation_cents INTEGER DEFAULT 0;
```

**Booking Flow for Donation Class**
1. Member selects class → sees "Donation-based"
2. Suggested amount shown (e.g., "$15 suggested")
3. Member enters any amount ≥ minimum
4. $0 allowed if minimum is 0
5. Payment processed (or skipped if $0)
6. Receipt shows "Donation: $X"

**Reporting**
- Donation classes tracked separately
- Average donation per class
- Donation vs attendance trends

**FAQ Entry (Member)**
> **Q: What is a donation-based class?**
> A: Donation-based classes let you pay what you can afford. There's a suggested amount, but you can contribute more or less based on your situation. This makes yoga accessible to everyone.

---

### Workshop Requiring Contact to Register

**Configuration**
```sql
ALTER TABLE class_templates ADD COLUMN booking_type VARCHAR(50) DEFAULT 'instant';
-- Options: 'instant', 'request', 'contact_required', 'external_link'

ALTER TABLE class_templates ADD COLUMN contact_instructions TEXT;
ALTER TABLE class_templates ADD COLUMN external_booking_url TEXT;
```

**Booking Types**

| Type | Behavior |
|------|----------|
| `instant` | Standard book now |
| `request` | Submit request, admin approves |
| `contact_required` | Shows contact info, no online booking |
| `external_link` | Redirects to external URL |

**UI for Contact Required**
```typescript
// Instead of "Book" button
{bookingType === 'contact_required' && (
  <div className="space-y-3">
    <p className="text-sm text-muted-foreground">
      Registration for this workshop is by phone or email only.
    </p>
    <div className="flex gap-2">
      <Button variant="outline" asChild>
        <a href={`tel:${studio.phone}`}>
          <Phone className="mr-2 h-4 w-4" />
          Call to Register
        </a>
      </Button>
      <Button variant="outline" asChild>
        <a href={`mailto:${studio.email}?subject=Workshop Registration: ${workshop.title}`}>
          <Mail className="mr-2 h-4 w-4" />
          Email to Register
        </a>
      </Button>
    </div>
  </div>
)}
```

**FAQ Entry (Member)**
> **Q: Why can't I book this workshop online?**
> A: Some specialty workshops require personal consultation before registration. Contact us by phone or email and we'll help you sign up.

---

## Accounting & Reporting

### Monthly Accounting Close

**Process**
1. **Pre-Close Checklist** (automated reminders)
   - [ ] All class attendance finalized
   - [ ] Instructor pay rates confirmed
   - [ ] Refunds/adjustments processed
   - [ ] Revenue reconciled with payment processor
   - [ ] Memberships charged (recurring billing complete)

2. **Close Period**
   - Admin clicks "Close Month"
   - System generates final reports
   - Period locked from editing
   - Adjustments require "Reopen" (audit logged)

3. **Generated Reports**
   - Revenue Summary (by type: memberships, packs, retail, etc.)
   - Instructor Payroll (hours, rates, total)
   - Membership MRR
   - Refunds & Adjustments
   - Outstanding Receivables

**Data Model**
```sql
CREATE TABLE accounting_periods (
  id UUID PRIMARY KEY,
  studio_id UUID REFERENCES studios(id),
  period_type VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'annual'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'closed', 'reopened'
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES users(id),
  notes TEXT,
  UNIQUE(studio_id, period_type, start_date)
);

CREATE TABLE accounting_adjustments (
  id UUID PRIMARY KEY,
  period_id UUID REFERENCES accounting_periods(id),
  adjustment_type VARCHAR(50), -- 'revenue', 'expense', 'payroll'
  amount_cents INTEGER,
  reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**FAQ Entry (Admin)**
> **Q: How do I close the books for the month?**
> A: Go to Financials → Month End Close. Review the pre-close checklist, make any final adjustments, then click "Close Period." Once closed, reports are locked and can be exported for your accountant.

---

### Year-End Close (Calendar or Fiscal)

**Configuration**
```sql
ALTER TABLE studios ADD COLUMN fiscal_year_end_month INTEGER DEFAULT 12; -- 1-12
-- 12 = Calendar year (Jan-Dec)
-- 6 = Fiscal year ending June 30
```

**Year-End Process**
1. **Pre-Close** (30 days before)
   - System alerts: "Year-end approaching"
   - Review all monthly closes completed
   - Verify annual membership renewals
   - Check gift card liability

2. **Year-End Reports**
   - Annual Revenue Summary
   - Annual Membership Statistics
   - Instructor 1099 Data (US)
   - Gift Card Liability
   - YoY Comparison

3. **Tax Preparation**
   - 1099 generation for instructors (>$600)
   - Revenue by category for tax filing
   - Deductible expense summary

4. **New Year Setup**
   - Reset annual stats counters
   - Apply annual membership renewals
   - Archive old data (configurable retention)

**FAQ Entry (Admin)**
> **Q: What do I need to do for year-end?**
> A: Tandava generates year-end reports automatically. Before closing, verify all monthly periods are finalized. After close, download 1099 data for contractors and revenue summaries for your tax preparer.

---

## Membership Edge Cases

### Membership Includes Retail Discount

**Configuration UI**
```
/manage/settings/memberships/{id}
├── Pricing
│   ├── Monthly Rate: $149
│   └── Annual Rate: $1,490
├── Class Access
│   ├── [x] Unlimited classes
│   └── [ ] Limited to X/month
├── Retail Benefits
│   ├── Retail Discount: [10]%
│   └── Exclude from promos:
│       [x] Black Friday 2024
│       [x] New Year Special
│       [ ] Regular promotions
└── Other Benefits
    ├── [x] Early booking window (48h)
    └── [ ] Guest passes: [2]/month
```

**Checkout Logic**
```typescript
function calculateRetailDiscount(
  member: Member,
  cart: CartItem[]
): DiscountResult {
  // Get membership retail discount
  const membership = member.activeMembership;
  if (!membership) return { discount: 0 };

  // Check if membership was acquired via excluded promo
  const membershipPromo = membership.acquisitionPromoCode;
  const excludedPromos = membership.type.retailDiscountExcludedPromos;

  if (excludedPromos.includes(membershipPromo)) {
    return { discount: 0, reason: 'Promo membership does not include retail discount' };
  }

  // Calculate discount on retail items only
  const retailItems = cart.filter(item => item.type === 'retail');
  const retailTotal = sum(retailItems.map(i => i.price));
  const discountPercent = membership.type.retailDiscountPercent;

  return {
    discount: retailTotal * (discountPercent / 100),
    percent: discountPercent,
  };
}
```

---

### Member Disputes Charge

**Process**
1. Member contacts studio OR files chargeback
2. If direct contact:
   - Review in `/manage/members/{id}/transactions`
   - One-click refund with reason dropdown
   - Auto-send confirmation email
3. If chargeback:
   - Alert in admin dashboard
   - Evidence auto-compiled (booking, check-in, policy agreed)
   - One-click submit evidence to processor
   - Track outcome

**FAQ Entry (Admin)**
> **Q: A member is disputing a charge. What do I do?**
> A: First, try to resolve directly. Go to their profile → Transactions → click the charge. You can issue a full or partial refund. If it's already a chargeback, we auto-compile evidence. Go to Financials → Disputes to submit your response.

---

## Booking Edge Cases

### Class Cancelled by Studio

**Member Communication**
```typescript
const classCancellationTemplate = {
  subject: "Class Cancelled: {class_name} on {date}",
  body: `
    Hi {member_name},

    Unfortunately, {class_name} on {date} at {time} has been cancelled.

    Reason: {cancellation_reason}

    {if has_alternative}
    Alternative: {alternative_class_name} at {alternative_time}
    [Book Alternative]
    {/if}

    Your {credit_type} has been automatically refunded to your account.

    We apologize for the inconvenience.
  `,
};
```

**System Behavior**
1. Admin cancels class with reason
2. All booked members notified
3. Credits/payments auto-refunded
4. Suggest alternatives (same day, same style)
5. Instructor notified
6. Class marked cancelled (not deleted) for records

---

### Member No-Shows Repeatedly

**Configurable Policy**
```sql
ALTER TABLE studio_settings ADD COLUMN no_show_policy JSONB DEFAULT '{
  "warning_threshold": 2,
  "suspension_threshold": 3,
  "reset_period_days": 30,
  "fee_cents": 1000,
  "apply_fee": false
}';
```

**System Behavior**
1. No-show #1: Email reminder about policy
2. No-show #2: Warning email, flag in admin
3. No-show #3: Auto-suspend booking privileges
4. Admin can override/reset
5. Fee charged if configured

**FAQ Entry (Member)**
> **Q: I missed a class without cancelling. What happens?**
> A: Missing a booked class without cancelling is a "no-show." Multiple no-shows may temporarily limit your booking privileges. Please cancel in advance so others can take your spot.

---

## Additional Edge Cases

### Gift Card/Credit Expiration

**Rules**
- Gift cards: May have expiration (check state laws - some prohibit)
- Account credits: Configurable expiration (default: 1 year)
- Expiring credits: Notify 30 days before

### Teacher Has Emergency During Class

**Procedure**
1. Teacher marks "Emergency" in app
2. Front desk alerted
3. Options presented:
   - Another teacher covers (if available)
   - Class continues self-guided
   - Class cancelled with auto-refunds

### Payment Processor Outage

**Fallback Behavior**
1. Detect processor unavailable
2. Allow bookings for members with credit/membership
3. Queue drop-in payments for retry
4. Show member: "Payment pending, booking confirmed"
5. Process queued payments when restored
6. Alert admin to outage

### Daylight Saving Time Transitions

**Handling**
- All times stored in UTC
- Class created "every Tuesday 6pm" stays at 6pm local
- One-time classes use exact UTC timestamp
- Recurring classes use local time rule

---

*Keep this document updated as new edge cases are discovered.*
