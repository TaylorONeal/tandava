# PRD-004: Membership Enhancements - Family Plans, Corporate, Dynamic Pricing & Commitment Contracts

## Overview
**Phase:** 1
**Priority:** P1
**Status:** Planned
**Owner:** TBD
**Dependencies:** Core membership infrastructure

---

## Jobs to Be Done

### Job 1: Family Coordination
**When** my family (spouse, kids, roommates) all practice at the same studio,
**I want to** manage our memberships together with shared benefits and one bill,
**So I can** simplify administration and potentially save money with family pricing.

### Job 2: Corporate Wellness Partnership
**When** I'm an HR manager looking to offer yoga as an employee benefit,
**I want to** set up a corporate account with streamlined enrollment and billing,
**So I can** provide wellness perks without complex reimbursement processes.

### Job 3: Revenue Optimization Through Pricing
**When** I have classes with varying demand throughout the week,
**I want to** price them dynamically or offer off-peak discounts,
**So I can** maximize revenue during peak times and fill slow classes.

### Job 4: Churn Reduction Through Commitment
**When** students sign up for memberships,
**I want to** offer discounted rates for longer commitments,
**So I can** improve retention and revenue predictability.

### Job 5: Membership Flexibility
**When** life circumstances change (travel, injury, financial situation),
**I want to** easily pause, downgrade, or modify my membership,
**So I can** maintain my relationship with the studio without feeling trapped.

### Job 6: Multi-Member Account Management
**When** I'm the primary account holder for my family or group,
**I want to** view everyone's usage, manage sub-members, and handle billing centrally,
**So I can** stay organized without logging into multiple accounts.

### Job 7: Corporate Reporting
**When** I'm managing corporate wellness for my company,
**I want to** see utilization reports and ROI metrics,
**So I can** justify the program to leadership and identify engagement issues.

---

## User Stories

### US-4.1: Create Family Plan Membership Type
**As a** studio owner,
**I want** to create family plan membership types with member limits and pricing tiers,
**So that** I can offer attractive rates for households.

**Acceptance Criteria:**
- [ ] Create membership type marked as "family plan"
- [ ] Set max members (e.g., 2-person, 4-person, unlimited)
- [ ] Set base price and per-additional-member price
- [ ] Define primary member vs. secondary member pricing
- [ ] Specify shared benefits (classes included, locations, offerings)
- [ ] Set age restrictions for family members (e.g., must be 13+, or specific child pricing)
- [ ] Option: require same household address or allow any defined "family"

### US-4.2: Family Plan Enrollment Flow
**As a** customer,
**I want** to purchase a family plan and add my family members,
**So that** we can all start using our membership immediately.

**Acceptance Criteria:**
- [ ] Primary member creates account and purchases family plan
- [ ] Invite family members by email or phone
- [ ] Invited members create accounts and link to family plan
- [ ] Or: primary can create accounts on behalf of minors
- [ ] Each family member gets their own profile/login
- [ ] Family members share the class credits pool (if applicable)
- [ ] Primary member can remove/replace family members
- [ ] Single invoice/receipt for all family charges

### US-4.3: Family Dashboard
**As a** primary family member,
**I want** a dashboard showing all family members' activity,
**So that** I can track usage and manage the family plan.

**Acceptance Criteria:**
- [ ] List of all family members with status
- [ ] Classes attended this period per member
- [ ] Shared credits remaining (if applicable)
- [ ] Upcoming bookings for any family member
- [ ] Quick-book for any family member
- [ ] Manage payment method (primary only)
- [ ] View combined booking history
- [ ] Add/remove family members

### US-4.4: Corporate Account Setup
**As a** studio owner,
**I want** to create corporate accounts with custom terms,
**So that** I can partner with local businesses.

**Acceptance Criteria:**
- [ ] Create corporate account with company name, contact, billing info
- [ ] Custom pricing (per-employee, bulk rate, or subsidy model)
- [ ] Set membership allocation (e.g., 50 employee spots)
- [ ] Define enrollment method: open (employees self-register), invite-only, or code-based
- [ ] Set subsidy model: full sponsorship, partial (employee pays remainder), or allowance
- [ ] Custom billing cycle and terms (net 30, etc.)
- [ ] Corporate-specific classes/offerings available (optional)
- [ ] Contract term and renewal handling

### US-4.5: Corporate Employee Enrollment
**As an** employee at a partner company,
**I want** to easily enroll in my company's yoga benefit,
**So that** I can start practicing without complex paperwork.

**Acceptance Criteria:**
- [ ] Enrollment via unique company code
- [ ] Or: work email domain verification
- [ ] Or: approved email list from HR
- [ ] Employee creates personal account linked to corporate
- [ ] Shows any employee contribution required
- [ ] Clear display of what's covered vs. personal charges
- [ ] Waiver signed during enrollment
- [ ] Confirmation to employee and HR (optional)

### US-4.6: Corporate Admin Portal
**As a** corporate HR admin,
**I want** a portal to manage our company's yoga benefit,
**So that** I can track utilization and manage employees.

**Acceptance Criteria:**
- [ ] Dashboard showing: active enrollees, total usage, available spots
- [ ] Employee roster management (add/remove/invite)
- [ ] Utilization reports: classes per employee, most active, inactive
- [ ] Cost reports: monthly spend, per-employee average
- [ ] Download reports (CSV, PDF)
- [ ] Receive monthly summary email
- [ ] Manage company payment method
- [ ] View invoices and payment history

### US-4.7: Dynamic Pricing Configuration
**As a** studio owner,
**I want** to configure dynamic pricing rules based on demand,
**So that** I can maximize revenue and fill capacity.

**Acceptance Criteria:**
- [ ] Set base drop-in price per offering
- [ ] Configure time-based pricing: off-peak, standard, peak
- [ ] Define time windows (e.g., 6-8am = peak, 2-4pm = off-peak)
- [ ] Set demand-based pricing thresholds (e.g., >80% full = surge)
- [ ] Configure price adjustments (% or fixed amount)
- [ ] Set min/max price bounds
- [ ] Preview pricing calendar
- [ ] Member pricing exemption option (members always pay base rate)

### US-4.8: Last-Minute Discount Automation
**As a** studio owner,
**I want** to automatically discount classes that aren't filling,
**So that** I can fill empty spots without manual intervention.

**Acceptance Criteria:**
- [ ] Set threshold: "If class is <X% full Y hours before start, apply discount"
- [ ] Set discount amount (% or fixed)
- [ ] Optional: notify members of last-minute deal
- [ ] Display "flash sale" pricing in app
- [ ] Track which bookings came from discounted pricing
- [ ] Report: revenue impact of auto-discounts

### US-4.9: Commitment Contracts (Annual/Multi-Month)
**As a** studio owner,
**I want** to offer discounted rates for longer commitments,
**So that** I can improve retention and predictable revenue.

**Acceptance Criteria:**
- [ ] Create commitment terms: 3-month, 6-month, 12-month
- [ ] Set discount per term (e.g., 10% off for 12-month)
- [ ] Display comparison: monthly rate vs. committed rate
- [ ] Commitment start date = enrollment date
- [ ] Early cancellation policy: fee, remaining payments, or honor period
- [ ] Show early cancellation terms clearly at signup
- [ ] Auto-convert to month-to-month after commitment ends
- [ ] Renewal reminder before commitment ends

### US-4.10: Commitment Contract Management
**As a** committed member,
**I want** visibility into my commitment status and options,
**So that** I understand my obligations and can plan ahead.

**Acceptance Criteria:**
- [ ] Shows commitment type and end date on membership page
- [ ] Shows months remaining
- [ ] Displays early cancellation fee/terms
- [ ] Option to cancel with fee acknowledgment
- [ ] Option to pause (if allowed under contract)
- [ ] Reminder notification 30 days before commitment ends
- [ ] Option to renew commitment at same rate
- [ ] History of all commitment terms

### US-4.11: Membership Modification Flow
**As a** member,
**I want** self-service options to modify my membership,
**So that** I can adjust without calling the studio.

**Acceptance Criteria:**
- [ ] Upgrade: immediate proration and new billing
- [ ] Downgrade: takes effect at period end (or immediate with confirmation)
- [ ] Pause: set duration (1-12 weeks), freeze billing
- [ ] Resume: automatic or manual before pause ends
- [ ] Switch locations (multi-location memberships)
- [ ] Cancel: immediate or end-of-period
- [ ] All changes require confirmation with impact preview
- [ ] Changes logged for admin visibility

### US-4.12: Membership Holds with Conditions
**As a** studio owner,
**I want** to configure hold/pause policies with limits,
**So that** members can pause when needed but can't abuse the feature.

**Acceptance Criteria:**
- [ ] Set max pause duration per occurrence
- [ ] Set max total pause days per year
- [ ] Set minimum active time between pauses
- [ ] Optional: pause fee (flat or reduced monthly)
- [ ] Show remaining pause allowance to members
- [ ] Medical exception process (bypass limits with documentation)
- [ ] Auto-resume after max duration with warning

### US-4.13: Referral Bonus for Family/Corporate
**As a** studio owner,
**I want** special referral incentives for family and corporate plans,
**So that** I can encourage growth of these high-value segments.

**Acceptance Criteria:**
- [ ] Set referral bonus for family plan signup
- [ ] Set referral bonus per corporate employee enrolled
- [ ] Corporate referral: bonus to HR contact who signs company
- [ ] Track referral source for all enrollments
- [ ] Bonus can be: credit, free month, cash (for corporate)
- [ ] Referral dashboard for partners

### US-4.14: Dynamic Pricing Transparency
**As a** student,
**I want** to understand how pricing works when it changes,
**So that** I trust the studio and can plan my budget.

**Acceptance Criteria:**
- [ ] Price shown on class includes any dynamic adjustment
- [ ] If price is elevated, show reason: "Peak time pricing"
- [ ] If discounted, show original price crossed out
- [ ] Consistent pricing within booking session (no change mid-cart)
- [ ] Price lock for 15 minutes after viewing class
- [ ] Members see "Member rate" clearly differentiated
- [ ] Historical price for completed bookings in history

---

## Edge Cases

### EC-1: Family Member Disputes
**Scenario:** Family member wants their own separate account/billing.
**Handling:**
- Allow "split" from family plan to individual
- Pro-rate family plan for remaining members
- Split member starts new individual membership
- Usage history stays with their profile
- Primary must authorize the split

### EC-2: Corporate Employee Termination
**Scenario:** Employee leaves company but has active bookings.
**Handling:**
- HR removes employee from corporate roster
- Grace period (e.g., 7 days) to honor existing bookings
- Offer employee personal membership conversion
- If not converted, bookings cancelled with credits/refund
- Clear communication to employee of transition

### EC-3: Corporate Over-Enrollment
**Scenario:** Company has 50 spots but 55 employees try to enroll.
**Handling:**
- Waitlist for positions 51-55
- Notify HR that cap reached
- Option for HR to purchase additional spots
- Or: first-come slots with auto-rotation monthly

### EC-4: Dynamic Price Change After Cart Add
**Scenario:** Price surges while student is checking out.
**Handling:**
- Honor cart price for 15 minutes
- After expiry, show updated price with option to continue
- Never charge more than displayed at time of payment
- Log price lock expiry for analytics

### EC-5: Commitment Break with Refund Request
**Scenario:** Member signed 12-month but wants out at month 3 with refund.
**Handling:**
- Show early termination fee clearly
- Option to pay fee and cancel
- No refund for used months
- Option: transfer commitment to another person (if allowed)
- Medical exceptions require documentation

### EC-6: Family Plan with Mixed Ages
**Scenario:** Family has 2 adults and 2 kids (ages 8 and 15).
**Handling:**
- Child members may have offering restrictions (no heated classes)
- Child profiles marked with DOB, parental consent
- Age-appropriate class visibility
- Guardian must book for minors
- Age verification at check-in

### EC-7: Corporate Contract Non-Renewal
**Scenario:** Company doesn't renew annual contract.
**Handling:**
- Employees notified 30 days before expiry
- Grace period for conversion to personal membership
- Bulk conversion incentive (discounted first month)
- Usage data preserved in personal account
- HR receives final report

### EC-8: Dynamic Pricing During Promo Code
**Scenario:** Student applies promo code to dynamically-priced class.
**Handling:**
- Configuration: promo applies to base price, current price, or not at all
- Default: promo applies to current displayed price
- Show breakdown: Original ($20) -> Dynamic ($25) -> Promo (-$5) = $20
- Some promos can override dynamic pricing entirely

### EC-9: Family Plan Membership Pause
**Scenario:** Primary member pauses family plan for vacation.
**Handling:**
- All family members paused together
- Or: configurable per-member pause
- Pause days count against annual allowance for all members
- Clear communication to all family members
- Existing bookings can be cancelled or honored

### EC-10: Corporate Subsidy Exhaustion
**Scenario:** Company offers $100/month subsidy; employee exceeds it.
**Handling:**
- Track subsidy balance per employee per period
- Overage charged to employee's personal card
- Clear display: "Company covers: $100, Your cost: $29"
- Employee can set spending limit alerts
- End-of-period notification of utilization

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Family plan adoption | 10%+ of memberships | Family memberships / Total memberships |
| Family plan retention | 15%+ better than individual | Churn rate comparison |
| Corporate accounts | 5+ partners per studio | Active corporate accounts |
| Corporate utilization | 50%+ of enrolled | Active employees / Enrolled employees |
| Commitment contract uptake | 30%+ of new signups | Commitment signups / Total signups |
| Commitment retention | 20%+ better retention | Churn comparison at commitment end |
| Dynamic pricing revenue lift | 5-10% | Revenue vs. static pricing baseline |
| Off-peak class fill rate | +20% | Fill rate comparison |
| Membership modification self-service | 80%+ | Self-service / Total modifications |

---

## Technical Design

### Database Schema

```sql
-- ============================================================================
-- FAMILY PLANS
-- ============================================================================

-- Family groups (collection of linked members)
CREATE TABLE family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,  -- e.g., "The Smith Family"

  -- Primary account holder
  primary_member_id UUID NOT NULL REFERENCES profiles(id),

  -- Shared membership (if family shares one membership)
  membership_id UUID REFERENCES memberships(id),

  -- Settings
  max_members INTEGER NOT NULL DEFAULT 4,
  share_credits BOOLEAN DEFAULT true,  -- Family shares class credits pool

  -- Address verification (optional)
  require_same_address BOOLEAN DEFAULT false,
  verified_address JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Family members
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),

  -- Role in family
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN (
    'primary',     -- Account holder, manages billing
    'adult',       -- Adult family member
    'child'        -- Minor, requires guardian booking
  )),

  -- Relationship
  relationship TEXT,  -- spouse, child, parent, roommate, etc.

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'invited',
    'active',
    'removed'
  )),

  -- Invitation
  invited_at TIMESTAMPTZ,
  invited_by UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(family_group_id, profile_id)
);

-- Family plan membership types
ALTER TABLE membership_types ADD COLUMN IF NOT EXISTS (
  is_family_plan BOOLEAN DEFAULT false,
  family_min_members INTEGER DEFAULT 2,
  family_max_members INTEGER,
  family_base_members INTEGER DEFAULT 2,  -- Included in base price
  family_additional_member_cents INTEGER,  -- Price per additional member
  family_child_discount_pct INTEGER DEFAULT 0,  -- Discount for child members
  family_requires_same_address BOOLEAN DEFAULT false
);

-- ============================================================================
-- CORPORATE ACCOUNTS
-- ============================================================================

-- Corporate accounts
CREATE TABLE corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Company info
  company_name TEXT NOT NULL,
  company_logo_url TEXT,

  -- Contact
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL,
  primary_contact_phone TEXT,

  -- Billing
  billing_email TEXT,
  billing_address JSONB,
  billing_cycle TEXT DEFAULT 'monthly',  -- monthly, quarterly, annual
  payment_terms INTEGER DEFAULT 30,  -- Net days

  stripe_customer_id TEXT,

  -- Program settings
  enrollment_type TEXT NOT NULL DEFAULT 'code' CHECK (enrollment_type IN (
    'open',          -- Any employee can join
    'code',          -- Need enrollment code
    'domain',        -- Work email domain verification
    'invite_only'    -- Must be on approved list
  )),
  enrollment_code TEXT UNIQUE,
  approved_domains TEXT[],  -- e.g., ['acme.com', 'acme.co.uk']

  -- Capacity
  max_employees INTEGER,
  current_enrollees INTEGER DEFAULT 0,

  -- Subsidy model
  subsidy_type TEXT NOT NULL DEFAULT 'full' CHECK (subsidy_type IN (
    'full',          -- Company pays 100%
    'fixed',         -- Company pays fixed amount
    'percentage',    -- Company pays percentage
    'allowance'      -- Monthly allowance per employee
  )),
  subsidy_amount_cents INTEGER,  -- For fixed amount
  subsidy_percentage INTEGER,    -- For percentage (0-100)
  employee_max_cost_cents INTEGER,  -- Cap on employee contribution

  -- Access
  membership_type_id UUID REFERENCES membership_types(id),
  allowed_offering_ids UUID[],  -- Restrict to specific classes
  allowed_location_ids UUID[],  -- Restrict to specific locations

  -- Contract
  contract_start_date DATE,
  contract_end_date DATE,
  auto_renew BOOLEAN DEFAULT true,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'pending',
    'active',
    'paused',
    'cancelled',
    'expired'
  )),

  notes TEXT,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Corporate employees
CREATE TABLE corporate_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),

  -- Employee info
  employee_id TEXT,           -- Company's employee ID
  work_email TEXT NOT NULL,
  department TEXT,

  -- Membership created from corporate benefit
  membership_id UUID REFERENCES memberships(id),

  -- Subsidy tracking
  subsidy_used_cents INTEGER DEFAULT 0,
  subsidy_period_start DATE,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'invited',
    'active',
    'inactive',
    'terminated'
  )),

  enrolled_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,
  terminated_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(corporate_account_id, profile_id),
  UNIQUE(corporate_account_id, work_email)
);

-- Corporate admin users
CREATE TABLE corporate_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),

  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN (
    'admin',    -- Full access
    'viewer'    -- Read-only reports
  )),

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(corporate_account_id, profile_id)
);

-- ============================================================================
-- DYNAMIC PRICING
-- ============================================================================

-- Dynamic pricing rules
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- What it applies to
  applies_to TEXT NOT NULL DEFAULT 'drop_in' CHECK (applies_to IN (
    'drop_in',
    'class_pack',
    'membership',
    'event'
  )),
  offering_ids UUID[],       -- Empty = all offerings
  location_ids UUID[],       -- Empty = all locations

  -- Rule type
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'time_of_day',      -- Peak/off-peak hours
    'day_of_week',      -- Weekend pricing
    'demand',           -- Based on fill rate
    'last_minute',      -- Close to class time
    'early_bird'        -- Far in advance
  )),

  -- Time-based configuration
  time_windows JSONB,  -- [{ "days": [0,1,2,3,4], "start": "06:00", "end": "08:00", "label": "peak" }]

  -- Demand-based configuration
  demand_threshold_pct INTEGER,      -- e.g., 80 = triggers at 80% full
  demand_direction TEXT,             -- 'above' or 'below' threshold

  -- Last-minute / early-bird configuration
  hours_before_class INTEGER,

  -- Price adjustment
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN (
    'percentage',
    'fixed_amount',
    'new_price'
  )),
  adjustment_value INTEGER NOT NULL,  -- Percentage or cents

  -- Bounds
  min_price_cents INTEGER,
  max_price_cents INTEGER,

  -- Exemptions
  members_exempt BOOLEAN DEFAULT false,

  -- Priority (higher = evaluated first)
  priority INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Dynamic price log (audit trail)
CREATE TABLE dynamic_price_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- What was priced
  class_occurrence_id UUID REFERENCES class_occurrences(id),
  booking_id UUID REFERENCES bookings(id),

  -- Pricing
  base_price_cents INTEGER NOT NULL,
  final_price_cents INTEGER NOT NULL,

  -- Rules applied
  rules_applied JSONB,  -- [{ "rule_id": "...", "adjustment": 500 }]

  -- Context
  fill_rate_at_booking INTEGER,    -- % full at time of booking
  hours_before_class INTEGER,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- COMMITMENT CONTRACTS
-- ============================================================================

-- Commitment terms available
CREATE TABLE commitment_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  membership_type_id UUID NOT NULL REFERENCES membership_types(id) ON DELETE CASCADE,

  -- Term details
  name TEXT NOT NULL,  -- e.g., "12-Month Commitment"
  term_months INTEGER NOT NULL,

  -- Pricing
  monthly_price_cents INTEGER NOT NULL,     -- Committed rate
  discount_percentage INTEGER,               -- vs. regular rate (for display)

  -- Early termination
  early_termination_fee_type TEXT CHECK (early_termination_fee_type IN (
    'fixed',              -- Flat fee
    'remaining_months',   -- Charge remaining months
    'percentage',         -- Percentage of remaining value
    'none'                -- No fee (honor-based)
  )),
  early_termination_value INTEGER,  -- Amount or percentage based on type

  -- Pause policy during commitment
  pause_allowed BOOLEAN DEFAULT true,
  max_pause_days_during_term INTEGER DEFAULT 30,

  -- Renewal
  auto_renew_to TEXT DEFAULT 'month_to_month',  -- 'same_term', 'month_to_month', 'none'
  renewal_discount_pct INTEGER,  -- Discount for re-committing

  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Member commitments
CREATE TABLE member_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),
  commitment_term_id UUID NOT NULL REFERENCES commitment_terms(id),

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Financial
  monthly_rate_cents INTEGER NOT NULL,
  total_value_cents INTEGER NOT NULL,  -- monthly * months

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',
    'completed',          -- Reached end date
    'terminated_early',   -- Broke contract
    'transferred'         -- Transferred to another person
  )),

  -- Early termination
  terminated_at DATE,
  termination_fee_cents INTEGER,
  termination_fee_paid BOOLEAN,
  termination_reason TEXT,

  -- Renewal
  renewal_offered_at TIMESTAMPTZ,
  renewal_decision TEXT,  -- 'renewed', 'month_to_month', 'cancelled'
  renewed_commitment_id UUID REFERENCES member_commitments(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- MEMBERSHIP MODIFICATIONS
-- ============================================================================

-- Membership modification requests/log
CREATE TABLE membership_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),

  -- Modification type
  modification_type TEXT NOT NULL CHECK (modification_type IN (
    'upgrade',
    'downgrade',
    'pause',
    'resume',
    'cancel',
    'location_change',
    'plan_change'
  )),

  -- Details
  from_membership_type_id UUID REFERENCES membership_types(id),
  to_membership_type_id UUID REFERENCES membership_types(id),

  from_status TEXT,
  to_status TEXT,

  -- Timing
  requested_effective_date DATE,
  actual_effective_date DATE,

  -- Financial impact
  proration_amount_cents INTEGER,  -- Credit or charge

  -- Pause specific
  pause_start_date DATE,
  pause_end_date DATE,
  pause_reason TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'completed',
    'denied',
    'cancelled'
  )),

  -- Processing
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  denial_reason TEXT,

  -- Self-service vs. admin
  requested_by_member BOOLEAN DEFAULT true,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Membership pause allowance tracking
CREATE TABLE membership_pause_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,

  -- Annual allowance
  year INTEGER NOT NULL,
  max_pause_days INTEGER NOT NULL,
  used_pause_days INTEGER DEFAULT 0,

  -- Individual pauses
  pause_history JSONB DEFAULT '[]',
  -- [{ "start": "2025-01-01", "end": "2025-01-15", "days": 14, "reason": "..." }]

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(membership_id, year)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_family_groups_studio ON family_groups(studio_id);
CREATE INDEX idx_family_groups_primary ON family_groups(primary_member_id);
CREATE INDEX idx_family_members_profile ON family_members(profile_id);
CREATE INDEX idx_family_members_group ON family_members(family_group_id, status);

CREATE INDEX idx_corporate_accounts_studio ON corporate_accounts(studio_id, status);
CREATE INDEX idx_corporate_employees_account ON corporate_employees(corporate_account_id, status);
CREATE INDEX idx_corporate_employees_profile ON corporate_employees(profile_id);

CREATE INDEX idx_pricing_rules_studio ON pricing_rules(studio_id, is_active);
CREATE INDEX idx_dynamic_price_log_class ON dynamic_price_log(class_occurrence_id);

CREATE INDEX idx_commitment_terms_membership ON commitment_terms(membership_type_id, is_active);
CREATE INDEX idx_member_commitments_membership ON member_commitments(membership_id);
CREATE INDEX idx_member_commitments_dates ON member_commitments(studio_id, end_date)
  WHERE status = 'active';

CREATE INDEX idx_membership_modifications_membership ON membership_modifications(membership_id);
CREATE INDEX idx_pause_tracking_membership ON membership_pause_tracking(membership_id, year);
```

### API Endpoints

```
# ============================================================================
# FAMILY PLANS - Admin
# ============================================================================

GET    /api/manage/families                     # List family groups
POST   /api/manage/families                     # Create family group
GET    /api/manage/families/:id                 # Get family detail
PUT    /api/manage/families/:id                 # Update family
DELETE /api/manage/families/:id                 # Dissolve family group

POST   /api/manage/families/:id/members         # Add member
DELETE /api/manage/families/:id/members/:mid    # Remove member

# ============================================================================
# FAMILY PLANS - Member
# ============================================================================

GET    /api/account/family                      # My family group
POST   /api/account/family                      # Create family (during checkout)
POST   /api/account/family/invite               # Invite family member
POST   /api/account/family/join                 # Accept invitation
DELETE /api/account/family/members/:id          # Remove member (primary only)
PUT    /api/account/family/members/:id          # Update member role

GET    /api/account/family/activity             # Family activity dashboard
GET    /api/account/family/credits              # Shared credits balance

# ============================================================================
# CORPORATE ACCOUNTS - Admin
# ============================================================================

GET    /api/manage/corporate                    # List corporate accounts
POST   /api/manage/corporate                    # Create corporate account
GET    /api/manage/corporate/:id                # Get account detail
PUT    /api/manage/corporate/:id                # Update account
DELETE /api/manage/corporate/:id                # Deactivate account

GET    /api/manage/corporate/:id/employees      # List employees
POST   /api/manage/corporate/:id/employees      # Add employee
DELETE /api/manage/corporate/:id/employees/:eid # Remove employee

GET    /api/manage/corporate/:id/reports        # Utilization reports
GET    /api/manage/corporate/:id/invoices       # Invoice history

# ============================================================================
# CORPORATE - Employee Enrollment
# ============================================================================

POST   /api/corporate/verify                    # Verify eligibility (code/domain)
POST   /api/corporate/enroll                    # Complete enrollment
GET    /api/account/corporate                   # My corporate benefit status

# ============================================================================
# CORPORATE - HR Portal
# ============================================================================

GET    /api/corporate-admin/dashboard           # HR dashboard
GET    /api/corporate-admin/employees           # Employee roster
POST   /api/corporate-admin/employees/invite    # Bulk invite
GET    /api/corporate-admin/reports/utilization # Utilization report
GET    /api/corporate-admin/reports/cost        # Cost report
GET    /api/corporate-admin/invoices            # View invoices

# ============================================================================
# DYNAMIC PRICING - Admin
# ============================================================================

GET    /api/manage/pricing/rules                # List pricing rules
POST   /api/manage/pricing/rules                # Create rule
PUT    /api/manage/pricing/rules/:id            # Update rule
DELETE /api/manage/pricing/rules/:id            # Delete rule

GET    /api/manage/pricing/preview              # Preview pricing calendar
GET    /api/manage/pricing/analytics            # Pricing performance

# ============================================================================
# DYNAMIC PRICING - Internal
# ============================================================================

POST   /api/internal/pricing/calculate          # Calculate price for booking
# Called internally during booking flow

# ============================================================================
# COMMITMENT CONTRACTS - Admin
# ============================================================================

GET    /api/manage/commitments/terms            # List commitment terms
POST   /api/manage/commitments/terms            # Create term
PUT    /api/manage/commitments/terms/:id        # Update term
DELETE /api/manage/commitments/terms/:id        # Deactivate term

GET    /api/manage/commitments/active           # Active commitments
GET    /api/manage/commitments/expiring         # Expiring soon
GET    /api/manage/commitments/:id              # Commitment detail

# ============================================================================
# COMMITMENT CONTRACTS - Member
# ============================================================================

GET    /api/account/commitment                  # My commitment status
POST   /api/account/commitment/terminate        # Early termination
POST   /api/account/commitment/renew            # Renew commitment

# ============================================================================
# MEMBERSHIP MODIFICATIONS - Member
# ============================================================================

GET    /api/account/membership/options          # Available modifications
POST   /api/account/membership/upgrade          # Request upgrade
POST   /api/account/membership/downgrade        # Request downgrade
POST   /api/account/membership/pause            # Request pause
POST   /api/account/membership/resume           # Resume from pause
POST   /api/account/membership/cancel           # Cancel membership

GET    /api/account/membership/pause-allowance  # Pause days remaining

# ============================================================================
# MEMBERSHIP MODIFICATIONS - Admin
# ============================================================================

GET    /api/manage/membership-modifications     # All modifications
POST   /api/manage/membership-modifications/:id/approve   # Approve
POST   /api/manage/membership-modifications/:id/deny      # Deny

PUT    /api/manage/memberships/:id/pause-override  # Override pause limits
```

### UI Routes

```
# Member Account
/account/family                   # Family management
/account/family/invite            # Invite family member
/account/family/activity          # Family activity

/account/membership               # Membership management
/account/membership/modify        # Modification options
/account/membership/pause         # Pause request
/account/membership/commitment    # Commitment details

# Corporate HR Portal
/corporate                        # HR dashboard
/corporate/employees              # Employee management
/corporate/reports                # Reports
/corporate/billing                # Invoices and billing

# Studio Admin
/manage/families                  # Family groups
/manage/corporate                 # Corporate accounts
/manage/corporate/:id             # Corporate detail

/manage/pricing/rules             # Dynamic pricing rules
/manage/pricing/calendar          # Price preview calendar

/manage/commitments               # Commitment management
/manage/commitments/terms         # Term configuration

/manage/memberships/modifications # Pending modifications
```

---

## Open Questions

1. **Family definition:** How flexible should "family" be? Same address required? Any group of people?

2. **Corporate billing frequency:** Should we support invoice billing (Net 30) for corporates, or require credit card?

3. **Dynamic pricing visibility:** Should we show students that surge pricing is in effect, or just show the price?

4. **Commitment transfer:** Should members be able to transfer their commitment to another person (e.g., if moving)?

5. **Corporate class reservations:** Should corporate accounts be able to reserve class spots in advance for their employees?

6. **Pause abuse:** What's the right balance between flexibility and preventing pause abuse?

7. **Family booking:** Should primary member be able to book for all family members in one transaction?

---

## Dependencies

- Stripe for complex billing scenarios (invoicing, prorations)
- Email/notification system for corporate communications
- Reporting infrastructure for corporate dashboards

---

## Rollout Plan

### Phase 1A: Family Plans (Weeks 1-4)
1. Family plan membership types
2. Family group creation and member invitation
3. Family dashboard
4. Shared credit pool

### Phase 1B: Commitment Contracts (Weeks 5-7)
1. Commitment term configuration
2. Commitment enrollment flow
3. Early termination handling
4. Renewal workflow

### Phase 1C: Dynamic Pricing (Weeks 8-10)
1. Pricing rule engine
2. Time-based pricing
3. Demand-based pricing
4. Price display and transparency

### Phase 1D: Corporate Accounts (Weeks 11-14)
1. Corporate account setup
2. Employee enrollment flow
3. HR admin portal
4. Corporate billing and invoicing

### Phase 1E: Membership Modifications (Weeks 15-16)
1. Self-service upgrade/downgrade
2. Pause/resume workflow
3. Pause tracking and limits
4. Admin override capabilities

### Rollout Strategy
1. **Alpha (Family):** 10 studios with family-oriented clientele
2. **Alpha (Corporate):** 5 studios with existing corporate relationships
3. **Beta:** 30 studios across all features
4. **GA:** Full release with sales materials for corporate outreach

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-02-05 | 1.0 | Claude | Initial PRD |
