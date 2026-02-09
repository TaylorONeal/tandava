# PRD-002: Tips Collection & Live Commission Tracking

## Overview
**Phase:** 1
**Priority:** P1
**Status:** In Progress (UI scaffolded, toggle implemented)
**Owner:** TBD
**Dependencies:** PRD-001 (Staff Portal)

### Implementation Notes (Feb 2026)
- **Tips are disabled by default** — studio owner must enable via Settings > Feature Settings toggle
- When disabled: tips card, "Recent Tips" section, and tips line in earnings are all hidden from teacher dashboard and earnings page
- Toggle lives in `ManageSettings.tsx` under "Feature Settings" card
- Teacher dashboard checks `TIPS_ENABLED` constant (will be replaced with studio settings query when backend connected)
- Teacher earnings page respects same flag for tips column visibility

---

## Jobs to Be Done

### Job 1: Instructor Tip Reception
**When** I finish teaching a great class and students want to show appreciation,
**I want to** receive tips directly through the platform without friction,
**So I can** earn additional income proportional to the value I provide.

### Job 2: Student Gratitude Expression
**When** I've had an amazing class experience with an instructor,
**I want to** easily tip them right after class or from my booking history,
**So I can** show appreciation in a meaningful, immediate way.

### Job 3: Tip Payout Management
**When** I've accumulated tips over a pay period,
**I want to** see my tip balance and know when/how it will be paid out,
**So I can** trust the system and plan my finances accordingly.

### Job 4: Studio Commission Visibility
**When** I'm running my business and want to understand revenue splits,
**I want to** see real-time commission tracking across all transactions,
**So I can** monitor profitability and ensure accurate teacher payouts.

### Job 5: Teacher Earnings Motivation
**When** I want to understand what drives my total compensation,
**I want to** see how tips correlate with class ratings, attendance, and offerings,
**So I can** optimize my teaching approach and schedule strategically.

### Job 6: Transparent Revenue Distribution
**When** I'm a studio owner processing payroll,
**I want to** have automated commission calculations with clear audit trails,
**So I can** pay teachers accurately without manual spreadsheet work.

---

## User Stories

### US-2.1: Post-Class Tipping Flow (Student)
**As a** student who just attended class,
**I want** to tip my instructor through a simple, quick interface,
**So that** I can express gratitude without fumbling for cash.

**Acceptance Criteria:**
- [ ] Tip prompt appears on check-in confirmation screen
- [ ] Tip prompt appears on class completion notification (push/email)
- [ ] Preset tip amounts: $3, $5, $10, $20, Custom
- [ ] "Round up" option if student has pending transaction
- [ ] One-tap tip using saved payment method
- [ ] Optional: Add personal note with tip (max 200 chars)
- [ ] Confirmation shows: amount, instructor name, thank you message
- [ ] Can tip within 48 hours of class completion

### US-2.2: Tip from Booking History (Student)
**As a** student reviewing past classes,
**I want** to tip instructors I forgot to tip after class,
**So that** I can still show appreciation even if I missed the initial prompt.

**Acceptance Criteria:**
- [ ] Tip button visible on past booking cards (within 7-day window)
- [ ] Shows if tip was already given for that class
- [ ] Same tip flow as post-class (amounts, note, payment)
- [ ] Can tip multiple instructors from batch view

### US-2.3: Instructor Tip Dashboard
**As an** instructor,
**I want** a dedicated view of my tips with trends and insights,
**So that** I can understand my tipping patterns and what drives them.

**Acceptance Criteria:**
- [ ] Total tips: today, this week, this month, YTD
- [ ] List of recent tips with: amount, class, date, note (if any)
- [ ] Tips by class type chart
- [ ] Tips by day/time heatmap
- [ ] Average tip per class trend line
- [ ] Comparison to previous periods
- [ ] Export capability for tax purposes

### US-2.4: Tip Payout Configuration (Studio Admin)
**As a** studio owner,
**I want** to configure how tips are distributed and paid out,
**So that** I can comply with local regulations and teacher agreements.

**Acceptance Criteria:**
- [ ] Configure tip distribution: 100% to instructor (default), pooled, split
- [ ] If pooled: define pool rules (equal split, weighted by hours, etc.)
- [ ] Set payout schedule: with regular payroll, weekly, instant
- [ ] Set minimum payout threshold
- [ ] Configure if studio takes any tip processing fee (0-15% max)
- [ ] Preview impact of configuration changes
- [ ] Changes require acknowledgment if affecting existing tips

### US-2.5: Live Commission Tracking Dashboard
**As a** studio owner or manager,
**I want** a real-time view of commission and revenue splits,
**So that** I can monitor business health throughout the day/week.

**Acceptance Criteria:**
- [ ] Real-time gross revenue today
- [ ] Teacher payroll accrual (what we owe teachers)
- [ ] Platform fees accrued
- [ ] Net revenue (gross - payroll - fees)
- [ ] Breakdown by revenue type: memberships, packs, drop-ins, tips, retail
- [ ] Breakdown by location (multi-location studios)
- [ ] Comparison to same day last week
- [ ] Drill-down to individual transactions

### US-2.6: Per-Class Commission View
**As a** studio manager,
**I want** to see the financial breakdown for each class occurrence,
**So that** I can understand profitability at the class level.

**Acceptance Criteria:**
- [ ] Shows on class detail page (admin view)
- [ ] Revenue from: memberships (prorated), packs (prorated), drop-ins
- [ ] Teacher cost: base pay + revenue share + tips
- [ ] Net margin per class
- [ ] Attendee count with average revenue per head
- [ ] Compare to historical average for same class slot

### US-2.7: Teacher Pay Statement
**As an** instructor,
**I want** to receive detailed pay statements each pay period,
**So that** I can verify my compensation and keep records.

**Acceptance Criteria:**
- [ ] Auto-generated at end of each pay period
- [ ] Shows: base pay, per-class earnings, revenue share, tips, total
- [ ] Itemized list of each class with earnings breakdown
- [ ] Deductions shown (if any)
- [ ] Tips shown separately for tax purposes
- [ ] PDF export with studio branding
- [ ] Email notification when statement ready
- [ ] Accessible in `/teach/earnings` history

### US-2.8: Tip Notification to Instructor
**As an** instructor,
**I want** to receive notifications when I get tipped,
**So that** I feel appreciated in real-time.

**Acceptance Criteria:**
- [ ] Push notification within 30 seconds of tip
- [ ] Notification shows: amount, class name, student first name
- [ ] Student note included if provided
- [ ] Option to disable notifications (but tips still recorded)
- [ ] Daily summary email option instead of real-time

### US-2.9: Commission Model Configuration
**As a** studio owner,
**I want** to configure different commission models for different scenarios,
**So that** I can handle various teacher arrangements and class types.

**Acceptance Criteria:**
- [ ] Set default commission model at studio level
- [ ] Override per teacher (in staff settings)
- [ ] Override per class type/offering
- [ ] Commission types supported:
  - Flat per-class rate
  - Hourly rate
  - Revenue share (% of class revenue)
  - Hybrid (base + revenue share)
  - Tiered (rate changes with attendance thresholds)
- [ ] Preview calculations before saving
- [ ] Historical tracking - rate changes don't affect past payroll

### US-2.10: Instant Tip Payout (Phase 1.1)
**As an** instructor,
**I want** the option to cash out my tips instantly,
**So that** I don't have to wait for the regular pay cycle.

**Acceptance Criteria:**
- [ ] "Cash out" button on tip dashboard
- [ ] Shows available balance and any minimum
- [ ] Instant payout fee shown clearly (e.g., $0.50 or 1.5%)
- [ ] Payout via Stripe Express (instructor onboarding required)
- [ ] Payout completes within 30 minutes to debit card
- [ ] Daily limit for instant payouts
- [ ] Audit log of all instant payouts

---

## Edge Cases

### EC-1: Student Tips After Cancellation
**Scenario:** Student tips instructor but later cancels/refunds their class booking.
**Handling:**
- Tip is non-refundable (clearly stated before tipping)
- Exception: Studio admin can manually refund tip with reason
- If tip was part of "round up," only round-up portion kept

### EC-2: Split Classes (Co-Teaching)
**Scenario:** Two instructors co-teach a workshop; student wants to tip.
**Handling:**
- Show both instructor names with individual tip options
- Or: single tip with split selection (50/50, custom %)
- Default: equal split, student can adjust
- Each instructor sees their portion

### EC-3: Sub Gets the Tip
**Scenario:** Student tips after class but a sub taught instead of scheduled teacher.
**Handling:**
- Tip goes to teacher who actually taught (the sub)
- Original teacher not shown in tip flow for that class
- Clear on confirmation: "Tip for [Sub Name] teaching [Class]"

### EC-4: Negative Net Class (Pay > Revenue)
**Scenario:** Low attendance means teacher pay exceeds class revenue.
**Handling:**
- Dashboard shows negative margin for that class
- Studio still pays teacher full amount (per agreement)
- Alert if pattern emerges (3+ consecutive negative classes)
- Suggest: minimum attendance policies, class cancellation thresholds

### EC-5: Payment Method Fails on Tip
**Scenario:** Saved card declines when student tries to tip.
**Handling:**
- Show friendly error with retry option
- Allow adding new payment method inline
- Don't persist failed tip attempt
- Allow later tipping from booking history

### EC-6: Retroactive Pay Rate Change
**Scenario:** Studio changes teacher's rate mid-pay-period.
**Handling:**
- New rate applies to future classes only
- Option to specify effective date
- Audit log shows rate change with timestamp
- Warning if backdating would affect processed payroll

### EC-7: Tax Considerations for Large Tips
**Scenario:** Instructor receives large tip ($100+).
**Handling:**
- System still processes normally
- Flagged in reporting (potential 1099 implications)
- Year-end summary shows total tips for tax filing
- Disclaimer: "Consult tax professional; tips are taxable income"

### EC-8: Tip to Inactive/Departed Instructor
**Scenario:** Student tries to tip instructor who has left the studio.
**Handling:**
- If within payout period, tip still goes to instructor's account
- If instructor deactivated, tip held in escrow
- Admin can release held tips or refund to student
- 90-day limit, then auto-refund

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tip participation rate | 15%+ of check-ins | Tips / Total check-ins |
| Average tip amount | $6+ | Total tips / Tip count |
| Instructor tip satisfaction | 4.5+/5 | Survey rating |
| Commission accuracy | 99.9% | Disputes / Total payroll entries |
| Payroll processing time | <1 hour | Manual review time per period |
| Instant payout adoption | 30% of eligible teachers | Instant payouts / Total payouts |
| Revenue tracking latency | <5 seconds | Time to dashboard update |

---

## Technical Design

### Database Schema

```sql
-- ============================================================================
-- TIPS
-- ============================================================================

-- Tips given by students to instructors
CREATE TABLE tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Who gave and received
  giver_profile_id UUID NOT NULL REFERENCES profiles(id),
  recipient_profile_id UUID NOT NULL REFERENCES profiles(id),

  -- Associated class
  class_occurrence_id UUID NOT NULL REFERENCES class_occurrences(id),
  booking_id UUID REFERENCES bookings(id),

  -- Amount
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Processing
  processing_fee_cents INTEGER DEFAULT 0,
  studio_fee_cents INTEGER DEFAULT 0,
  net_amount_cents INTEGER GENERATED ALWAYS AS (
    amount_cents - processing_fee_cents - studio_fee_cents
  ) STORED,

  -- Payment
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,

  -- Optional personalization
  note TEXT CHECK (char_length(note) <= 200),
  is_anonymous BOOLEAN DEFAULT false,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',        -- Payment initiated
    'completed',      -- Payment successful, tip recorded
    'failed',         -- Payment failed
    'refunded'        -- Admin refunded
  )),

  -- Payout tracking
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN (
    'pending',        -- Awaiting payout
    'scheduled',      -- Included in upcoming payout
    'paid',           -- Paid to instructor
    'instant'         -- Instant payout completed
  )),
  payout_id UUID REFERENCES tip_payouts(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- One tip per booking
  UNIQUE(booking_id)
);

-- Tip pool configuration for pooled tip studios
CREATE TABLE tip_pool_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Distribution method
  distribution_method TEXT NOT NULL CHECK (distribution_method IN (
    'equal',              -- Split equally among eligible teachers
    'hours_weighted',     -- Split by teaching hours
    'attendance_weighted', -- Split by student count
    'custom'              -- Manual percentage allocation
  )),

  -- Eligibility
  eligible_roles TEXT[] DEFAULT ARRAY['teacher'],
  min_classes_for_eligibility INTEGER DEFAULT 1,

  -- Custom allocations (if distribution_method = 'custom')
  custom_allocations JSONB, -- { "profile_id": percentage }

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id) -- One active pool per studio
);

-- Tip payouts (batch payouts to instructors)
CREATE TABLE tip_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  recipient_profile_id UUID NOT NULL REFERENCES profiles(id),

  -- Period covered
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Amount
  total_tips_cents INTEGER NOT NULL,
  total_fees_cents INTEGER DEFAULT 0,
  net_payout_cents INTEGER NOT NULL,

  -- Method
  payout_method TEXT NOT NULL CHECK (payout_method IN (
    'payroll',        -- Included in regular payroll
    'stripe_transfer', -- Direct Stripe transfer
    'instant',        -- Instant payout
    'manual'          -- Manual payment (check, etc.)
  )),

  -- External references
  stripe_transfer_id TEXT,
  stripe_payout_id TEXT,
  payroll_entry_id UUID REFERENCES payroll_entries(id),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed'
  )),

  failure_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================================================
-- COMMISSION TRACKING
-- ============================================================================

-- Commission models (templates for how teachers are paid)
CREATE TABLE commission_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Base compensation
  pay_type TEXT NOT NULL CHECK (pay_type IN (
    'per_class',        -- Flat rate per class taught
    'hourly',           -- Hourly rate × class duration
    'revenue_share',    -- Percentage of class revenue
    'hybrid',           -- Base pay + revenue share
    'tiered',           -- Rate varies by attendance thresholds
    'per_student',      -- Fixed amount per attending student
    'per_student_base'  -- Base pay + per-student bonus
  )),

  -- Rate details (in cents or percentage × 100)
  base_rate_cents INTEGER,           -- For per_class, hourly, hybrid, per_student_base
  revenue_share_bps INTEGER,         -- Basis points (100 = 1%)

  -- Per-student rates
  per_student_cents INTEGER,         -- $ per student (per_student, per_student_base)

  -- Tiered rates (attendance-based)
  tier_rates JSONB, -- [{ "min_attendance": 0, "rate_cents": 5000 }, ...]

  -- Hybrid details
  hybrid_base_cents INTEGER,
  hybrid_share_bps INTEGER,

  -- Attendance bonuses
  bonus_attendance_threshold INTEGER,      -- Bonus if attendance >= N
  bonus_attendance_amount_cents INTEGER,
  bonus_fill_rate_threshold INTEGER,       -- Bonus if fill rate >= N% (stored as 80 for 80%)
  bonus_fill_rate_amount_cents INTEGER,

  -- Setup/cleanup time (added to hourly calculation)
  setup_time_minutes INTEGER DEFAULT 0,
  cleanup_time_minutes INTEGER DEFAULT 0,
  include_setup_in_hours BOOLEAN DEFAULT false,

  -- Minimums and maximums
  min_pay_cents INTEGER,
  max_pay_cents INTEGER,

  -- Applicability
  is_default BOOLEAN DEFAULT false,
  applies_to_offerings UUID[], -- Empty = all offerings

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Commission assignments (which model applies to which teacher)
CREATE TABLE commission_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- The model to use
  commission_model_id UUID REFERENCES commission_models(id),

  -- Or override with direct values
  override_pay_type TEXT,
  override_base_rate_cents INTEGER,
  override_revenue_share_bps INTEGER,

  -- Effective dates
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,

  -- Notes
  notes TEXT,
  created_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT now(),

  -- No overlapping assignments for same teacher
  EXCLUDE USING gist (
    profile_id WITH =,
    daterange(effective_from, effective_until, '[]') WITH &&
  )
);

-- Live commission ledger (real-time tracking of earned commissions)
CREATE TABLE commission_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- The teacher
  teacher_id UUID NOT NULL REFERENCES profiles(id),

  -- Source of commission
  class_occurrence_id UUID REFERENCES class_occurrences(id),
  transaction_id UUID REFERENCES transactions(id),

  -- Commission details
  commission_type TEXT NOT NULL CHECK (commission_type IN (
    'class_base',       -- Base pay for teaching
    'class_share',      -- Revenue share from class
    'retail_commission', -- Commission on retail sales
    'bonus',            -- Discretionary bonus
    'adjustment'        -- Manual adjustment
  )),

  -- Amounts
  gross_revenue_cents INTEGER,      -- Revenue this is calculated from
  commission_rate_bps INTEGER,      -- Rate applied (for share types)
  amount_cents INTEGER NOT NULL,    -- Final commission amount

  -- Status
  status TEXT DEFAULT 'accrued' CHECK (status IN (
    'accrued',          -- Earned, not yet paid
    'approved',         -- Approved for payout
    'paid',             -- Paid out
    'voided'            -- Cancelled (e.g., class cancelled)
  )),

  -- Payout tracking
  payroll_entry_id UUID REFERENCES payroll_entries(id),
  pay_period_start DATE,
  pay_period_end DATE,

  -- Audit
  calculated_at TIMESTAMPTZ DEFAULT now(),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Commission snapshots (daily/weekly aggregates for fast dashboard queries)
CREATE TABLE commission_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  snapshot_date DATE NOT NULL,

  -- Revenue
  gross_revenue_cents INTEGER DEFAULT 0,
  membership_revenue_cents INTEGER DEFAULT 0,
  pack_revenue_cents INTEGER DEFAULT 0,
  dropin_revenue_cents INTEGER DEFAULT 0,
  tips_cents INTEGER DEFAULT 0,
  retail_revenue_cents INTEGER DEFAULT 0,

  -- Costs
  teacher_pay_cents INTEGER DEFAULT 0,
  tips_payout_cents INTEGER DEFAULT 0,
  platform_fees_cents INTEGER DEFAULT 0,
  payment_processing_cents INTEGER DEFAULT 0,

  -- Net
  net_revenue_cents INTEGER GENERATED ALWAYS AS (
    gross_revenue_cents - teacher_pay_cents - tips_payout_cents -
    platform_fees_cents - payment_processing_cents
  ) STORED,

  -- Volume
  class_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  check_in_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, snapshot_date)
);

-- Indexes
CREATE INDEX idx_tips_studio_date ON tips(studio_id, created_at DESC);
CREATE INDEX idx_tips_recipient ON tips(recipient_profile_id, payout_status);
CREATE INDEX idx_tips_giver ON tips(giver_profile_id);
CREATE INDEX idx_tips_class ON tips(class_occurrence_id);
CREATE INDEX idx_tip_payouts_recipient ON tip_payouts(recipient_profile_id, status);
CREATE INDEX idx_commission_ledger_teacher ON commission_ledger(teacher_id, status);
CREATE INDEX idx_commission_ledger_period ON commission_ledger(pay_period_start, pay_period_end);
CREATE INDEX idx_commission_snapshots_date ON commission_snapshots(studio_id, snapshot_date DESC);
```

### API Endpoints

```
# ============================================================================
# TIPS - Student Facing
# ============================================================================

POST   /api/tips                        # Submit a tip
GET    /api/tips/history                # My tip history (as giver)

# Request body for POST /api/tips:
# {
#   "class_occurrence_id": "uuid",
#   "booking_id": "uuid",
#   "amount_cents": 500,
#   "note": "Great class!",
#   "is_anonymous": false,
#   "payment_method_id": "pm_xxx"
# }

# ============================================================================
# TIPS - Instructor Facing
# ============================================================================

GET    /api/teach/tips                  # My tips summary
GET    /api/teach/tips/history          # Detailed tip history
GET    /api/teach/tips/analytics        # Tip trends and insights
POST   /api/teach/tips/instant-payout   # Request instant payout
GET    /api/teach/tips/payout-history   # Payout history

# ============================================================================
# TIPS - Studio Admin
# ============================================================================

GET    /api/manage/tips                 # All tips overview
GET    /api/manage/tips/config          # Tip configuration
PUT    /api/manage/tips/config          # Update tip configuration
GET    /api/manage/tips/pools           # Tip pool settings
PUT    /api/manage/tips/pools           # Update pool settings
POST   /api/manage/tips/:id/refund      # Refund a tip
GET    /api/manage/tips/payouts         # Payout management
POST   /api/manage/tips/payouts/batch   # Process batch payout

# ============================================================================
# COMMISSION - Studio Admin
# ============================================================================

GET    /api/manage/commission/dashboard    # Live commission dashboard
GET    /api/manage/commission/models       # List commission models
POST   /api/manage/commission/models       # Create commission model
PUT    /api/manage/commission/models/:id   # Update commission model
DELETE /api/manage/commission/models/:id   # Deactivate commission model

GET    /api/manage/commission/assignments  # Teacher assignments
POST   /api/manage/commission/assignments  # Assign model to teacher
PUT    /api/manage/commission/assignments/:id  # Update assignment

GET    /api/manage/commission/ledger       # Commission ledger entries
POST   /api/manage/commission/ledger/approve  # Approve for payout
GET    /api/manage/commission/ledger/export   # Export for payroll

GET    /api/manage/commission/snapshots    # Daily/weekly snapshots
GET    /api/manage/commission/class/:id    # Per-class breakdown

# ============================================================================
# PAY STATEMENTS
# ============================================================================

GET    /api/teach/statements               # List my pay statements
GET    /api/teach/statements/:id           # Get specific statement
GET    /api/teach/statements/:id/pdf       # Download PDF

GET    /api/manage/statements              # All statements (admin)
POST   /api/manage/statements/generate     # Generate statements for period
```

### Real-Time Updates (WebSocket Events)

```
# Tip events
tip.received           # Instructor receives a tip
tip.payout.completed   # Payout processed

# Commission events
commission.accrued     # New commission entry
commission.approved    # Commission approved for payout
commission.snapshot    # Daily snapshot updated (for dashboard refresh)
```

### UI Routes

```
# Student
/classes/:id/tip              # Tip flow for specific class
/account/tips                 # My tipping history

# Instructor Portal
/teach/tips                   # Tip dashboard
/teach/tips/history           # Detailed tip history
/teach/tips/cashout           # Instant payout
/teach/earnings               # Full earnings (includes tips)
/teach/statements             # Pay statements

# Studio Admin
/manage/finances/tips         # Tip management
/manage/finances/tips/config  # Tip configuration
/manage/finances/commissions  # Commission dashboard
/manage/finances/commissions/models  # Manage commission models
/manage/finances/payroll      # Payroll processing
/manage/classes/:id/finances  # Per-class financial view
```

---

## Open Questions

1. **Tip processing fees:** Should the studio absorb Stripe's ~2.9% + $0.30 fee, or pass it to the tipper/instructor?

2. **Anonymous tipping:** Should students have the option to tip anonymously? What are the tax implications?

3. **Tip pooling legality:** In some jurisdictions, tip pooling has legal restrictions. Should we have location-based configuration?

4. **Instant payout limits:** What should the minimum/maximum for instant payouts be? Should there be daily/weekly limits?

5. **Commission model complexity:** Should we support more complex models (e.g., different rates for different class sizes, first X classes, etc.)?

6. **Multi-location teachers:** How should commissions work for teachers who work at multiple studio locations?

7. **Backdating commissions:** Should admin be able to backdate commission changes, and if so, how far back?

---

## Dependencies

- Stripe Connect (for instructor payouts)
- PRD-001 Staff Portal (instructor dashboard foundation)
- Push notification infrastructure (tip notifications)

---

## Rollout Plan

### Phase 1A: Core Tipping (Weeks 1-3)
1. Basic tip flow (post-class, booking history)
2. Instructor tip dashboard
3. Simple payout configuration
4. Tip notifications

### Phase 1B: Commission Tracking (Weeks 4-6)
1. Commission models (per-class, hourly, revenue share)
2. Live commission dashboard
3. Per-class financial view
4. Commission ledger

### Phase 1C: Payroll Integration (Weeks 7-8)
1. Pay statement generation
2. Tip payout batching
3. Commission approval workflow
4. Export for external payroll

### Phase 1D: Advanced Features (Weeks 9-10)
1. Instant tip payouts
2. Tip pooling
3. Tiered commission models
4. Commission analytics

### Rollout Strategy
1. **Alpha:** 3 studios (different sizes, tip cultures)
2. **Beta:** 15 studios with active tipping cultures
3. **GA:** Full release with compliance documentation

---

## Security & Compliance

- Tips are taxable income; provide year-end summaries
- PCI compliance for payment processing
- Clear disclosure of tip distribution to students
- Audit trail for all commission changes
- State-specific tip pooling regulations

---

## Worker Classification

### Contractor vs. Employee

Most yoga studios classify teachers as **independent contractors (1099)**, not employees (W-2). This affects:

| Aspect | Contractor (1099) | Employee (W-2) |
|--------|-------------------|----------------|
| Tax withholding | None - teacher handles | Studio withholds |
| Benefits | Not eligible | May be eligible |
| Overtime | Not applicable | Required >40hrs |
| 1099 reporting | Required if >$600/year | W-2 instead |
| Schedule control | Teacher has flexibility | Studio sets schedule |

### Database Support

```sql
ALTER TABLE studio_staff ADD COLUMN
  worker_classification TEXT DEFAULT 'contractor'
  CHECK (worker_classification IN ('employee', 'contractor'));

ALTER TABLE studio_staff ADD COLUMN
  tax_id_encrypted BYTEA,          -- SSN/EIN (encrypted)
  w9_received_at TIMESTAMPTZ;      -- W-9 on file date
```

### 1099 Year-End Export

Studios must provide 1099-NEC forms for contractors paid >$600:

```sql
-- Generate 1099 report
SELECT
  p.full_name,
  SUM(pe.calculated_amount_cents) / 100.0 as total_paid
FROM payroll_entries pe
JOIN studio_staff ss ON pe.teacher_id = ss.profile_id
JOIN profiles p ON ss.profile_id = p.id
WHERE ss.worker_classification = 'contractor'
  AND EXTRACT(YEAR FROM pe.class_date) = 2025
  AND pe.is_paid = true
GROUP BY p.id
HAVING SUM(pe.calculated_amount_cents) >= 60000;  -- $600+
```

---

## Pay Model Selection Guide

### By Studio Type

| Studio Type | Recommended Models | Rationale |
|-------------|-------------------|-----------|
| **Boutique (1 location, <10 teachers)** | `per_class` or `hybrid` | Simple, predictable costs |
| **Growing (2-3 locations)** | `hybrid` or `tiered` | Incentivize class growth |
| **Established (high attendance)** | `revenue_share` or `tiered` | Align teacher/studio interests |
| **Hot yoga / High volume** | `per_student` or `per_student_base` | Fair for varying class sizes |
| **Specialty (workshops, trainings)** | `revenue_share` + bonus | Reward expertise and marketing |

### By Teacher Experience

| Teacher Level | Recommended Approach |
|---------------|---------------------|
| **New teachers** | `per_class` with modest rate, increase after 6 months |
| **Experienced** | `hybrid` with base + small revenue share |
| **Star teachers** | `revenue_share` or `tiered` with attendance bonuses |
| **Guest/workshop** | `revenue_share` (40-60%) or flat workshop fee |

### By Growth Stage

| Stage | Model | Why |
|-------|-------|-----|
| **Startup (<1 year)** | `per_class` flat rate | Predictable costs while building |
| **Growing (1-3 years)** | `hybrid` | Balance cost control with incentives |
| **Established (3+ years)** | `tiered` or `per_student` | Optimize for class performance |
| **Multi-location** | Location-specific models | Different markets, different economics |

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-02-06 | 1.1 | Claude | Added per_student models, bonuses, setup time, worker classification, selection guide |
| 2025-02-05 | 1.0 | Claude | Initial PRD |

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-02-05 | 1.0 | Claude | Initial PRD |
