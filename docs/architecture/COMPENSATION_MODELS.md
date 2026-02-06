# Compensation Models

Complete guide to staff compensation in Tandava, including teacher pay models, front desk/hourly staff, rate changes, and contractor vs. employee considerations.

---

## Table of Contents

1. [Teacher Pay Models](#teacher-pay-models)
2. [Model Configuration](#model-configuration)
3. [Rate Changes and Effective Dates](#rate-changes-and-effective-dates)
4. [Front Desk and Hourly Staff](#front-desk-and-hourly-staff)
5. [Contractor vs. Employee](#contractor-vs-employee)
6. [Accounting and Exports](#accounting-and-exports)
7. [Implementation Status](#implementation-status)

---

## Teacher Pay Models

### Currently Implemented (Base Schema)

| Model | Enum Value | Description | Example |
|-------|------------|-------------|---------|
| **Per Class** | `per_class` | Flat rate per class taught | $50/class |
| **Hourly** | `hourly` | Rate × scheduled class duration | $40/hour × 1.25hr = $50 |
| **Revenue Share** | `revenue_share` | Percentage of class revenue | 30% of $400 = $120 |
| **Salary** | `salary` | Fixed periodic amount | $3,000/month |

### PRD-002 Additions (Planned)

| Model | Enum Value | Description | Example |
|-------|------------|-------------|---------|
| **Hybrid** | `hybrid` | Base pay + revenue share | $30 base + 10% of revenue |
| **Tiered** | `tiered` | Rate varies by attendance threshold | $40 if <10, $50 if 10-20, $60 if 20+ |

### Recommended Additions

| Model | Proposed Enum | Description | Example |
|-------|---------------|-------------|---------|
| **Per Student** | `per_student` | Fixed amount per attending student | $5/student × 18 = $90 |
| **Per Student + Base** | `per_student_base` | Base + per-student bonus | $25 base + $3/student |
| **Attendance Bonus** | `bonus_attendance` | Bonus when attendance hits threshold | +$25 if 20+ students |
| **Fill Rate Bonus** | `bonus_fill_rate` | Bonus when class fills to % capacity | +$25 if 80%+ full |
| **Hourly + Setup** | `hourly_setup` | Hourly + fixed setup/cleanup time | $40/hr + 15min setup |

---

## Model Configuration

### Database Schema

```sql
-- Current: Simple per-teacher configuration
CREATE TABLE studio_staff (
  ...
  pay_type teacher_pay_type,
  pay_rate_cents INTEGER,
  pay_revenue_share_pct DECIMAL(5, 2),
  ...
);

-- PRD-002: Flexible commission models
CREATE TABLE commission_models (
  id UUID PRIMARY KEY,
  studio_id UUID NOT NULL,
  name TEXT NOT NULL,

  pay_type TEXT NOT NULL,  -- Extended enum

  -- Base rates
  base_rate_cents INTEGER,
  revenue_share_bps INTEGER,  -- Basis points (100 = 1%)

  -- Per-student rates
  per_student_cents INTEGER,
  per_student_base_cents INTEGER,

  -- Tiered rates (JSON array)
  tier_rates JSONB,
  -- Example: [
  --   {"min_attendance": 0, "rate_cents": 4000},
  --   {"min_attendance": 10, "rate_cents": 5000},
  --   {"min_attendance": 20, "rate_cents": 6000}
  -- ]

  -- Bonus configuration
  bonus_attendance_threshold INTEGER,
  bonus_attendance_amount_cents INTEGER,
  bonus_fill_rate_threshold DECIMAL(5,2),
  bonus_fill_rate_amount_cents INTEGER,

  -- Setup/cleanup time (minutes)
  setup_time_minutes INTEGER DEFAULT 0,
  cleanup_time_minutes INTEGER DEFAULT 0,

  -- Hourly includes setup/cleanup
  include_setup_in_hours BOOLEAN DEFAULT false,

  -- Minimums and maximums
  min_pay_cents INTEGER,
  max_pay_cents INTEGER,

  -- Applicability
  is_default BOOLEAN DEFAULT false,
  applies_to_class_types UUID[],  -- Empty = all

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Assignment with effective dates
CREATE TABLE commission_assignments (
  id UUID PRIMARY KEY,
  studio_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  commission_model_id UUID REFERENCES commission_models(id),

  -- Effective period (no overlaps enforced)
  effective_from DATE NOT NULL,
  effective_until DATE,  -- NULL = ongoing

  -- Override specific values without new model
  override_base_rate_cents INTEGER,
  override_revenue_share_bps INTEGER,

  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### UI Configuration Flow

**Settings → Staff → [Teacher] → Compensation**

1. **Select Model Type:**
   - Per Class
   - Hourly
   - Revenue Share
   - Hybrid
   - Tiered
   - Per Student
   - Custom (opens advanced editor)

2. **Configure Rates:**
   ```
   ┌─────────────────────────────────────────────────┐
   │ Compensation Model: Maya Patel                  │
   ├─────────────────────────────────────────────────┤
   │ Model Type: [Hybrid ▼]                          │
   │                                                 │
   │ Base Pay:        $[ 35.00 ] per class           │
   │ Revenue Share:   [ 10 ]%                        │
   │                                                 │
   │ ☑ Add attendance bonus                          │
   │   Bonus: $[ 25.00 ] when attendance ≥ [ 20 ]    │
   │                                                 │
   │ ☐ Include setup/cleanup time                    │
   │   Setup: [ 15 ] min  Cleanup: [ 10 ] min        │
   │                                                 │
   │ Minimum Pay: $[ 50.00 ]                         │
   │ Maximum Pay: $[       ] (no cap)                │
   │                                                 │
   │ Effective From: [ 2026-02-01 ]                  │
   │ Notes: [ Renegotiated after 1 year ]            │
   │                                                 │
   │              [Cancel]  [Save Changes]           │
   └─────────────────────────────────────────────────┘
   ```

---

## Rate Changes and Effective Dates

### Core Principle

> Rate changes apply to **future classes only**. Historical payroll is never recalculated unless explicitly corrected.

### How It Works

1. **New Rate with Effective Date:**
   - Admin sets new rate with `effective_from` date
   - System creates new `commission_assignment` record
   - Old assignment gets `effective_until` = day before new rate
   - Classes before effective date use old rate
   - Classes on/after effective date use new rate

2. **Mid-Pay-Period Changes:**
   ```
   Pay Period: Feb 1-15
   Rate Change: Feb 10

   Feb 1-9:  Old rate ($50/class)
   Feb 10-15: New rate ($60/class)

   Pay statement shows both rates with itemized breakdown
   ```

3. **Retroactive Changes (Requires Approval):**
   - Admin can backdate rate changes
   - System warns: "This will affect X classes already calculated"
   - Requires confirmation
   - Creates adjustment entries in commission_ledger
   - Audit log records who made the change and why

### Database Enforcement

```sql
-- Prevent overlapping assignments
ALTER TABLE commission_assignments ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (
    teacher_id WITH =,
    daterange(effective_from, effective_until, '[]') WITH &&
  );

-- Audit trail for rate changes
CREATE TABLE commission_assignment_history (
  id UUID PRIMARY KEY,
  assignment_id UUID NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT now(),
  previous_values JSONB,
  new_values JSONB,
  reason TEXT
);
```

### UI for Rate History

**Staff → [Teacher] → Compensation History**

| Effective | Model | Base Rate | Share | Changed By | Notes |
|-----------|-------|-----------|-------|------------|-------|
| Feb 1, 2026 | Hybrid | $60/class | 12% | Sarah (Owner) | Annual raise |
| Jan 1, 2025 | Hybrid | $50/class | 10% | Sarah (Owner) | Promoted to lead |
| Jun 1, 2024 | Per Class | $45/class | — | Sarah (Owner) | Initial hire |

---

## Front Desk and Hourly Staff

### Different System Required

Front desk and hourly staff typically use **time tracking** rather than per-class compensation:

| Teacher Pay | Front Desk Pay |
|-------------|----------------|
| Triggered by teaching a class | Triggered by clocking in/out |
| Calculated per occurrence | Calculated from timesheet |
| Revenue-based options | Hourly only |
| Commission models | Wage + overtime rules |

### Options for Front Desk

#### Option A: External Time Tracking (Recommended)

Integrate with dedicated time tracking:
- **Homebase** - Free for small teams, scheduling + time clock
- **Deputy** - Shift scheduling, time tracking, payroll export
- **When I Work** - Scheduling and time clock

Tandava exports class schedule → Staff sees their shifts
External system handles clock-in/out → Payroll export

#### Option B: Basic Built-In Time Tracking

```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY,
  studio_id UUID NOT NULL,
  staff_id UUID NOT NULL,

  -- Shift details
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,

  -- Calculated
  hours_worked DECIMAL(5,2) GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600
  ) STORED,

  -- Pay
  hourly_rate_cents INTEGER NOT NULL,
  regular_hours DECIMAL(5,2),
  overtime_hours DECIMAL(5,2),
  total_pay_cents INTEGER,

  -- Metadata
  location_id UUID,
  notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Option C: Shift-Based Pay

For studios that schedule front desk in fixed shifts:

```sql
-- Front desk "classes" as shifts
INSERT INTO class_occurrences (
  class_id,  -- "Front Desk Shift" pseudo-class
  start_time,
  end_time,
  teacher_id  -- Front desk staff
);

-- Use hourly pay model
-- Pay = (end_time - start_time) × hourly_rate
```

### Recommendation

Most studios should use **Option A** (external time tracking) for front desk:
- Purpose-built for wage/hour compliance
- Handles overtime, breaks, labor law
- Integrates with payroll (Gusto, ADP)
- Tandava focuses on class-based compensation

---

## Contractor vs. Employee

### Key Differences

| Aspect | Employee (W-2) | Contractor (1099) |
|--------|----------------|-------------------|
| **Tax Withholding** | Studio withholds taxes | Contractor handles own taxes |
| **Benefits** | May be eligible | Not eligible |
| **Schedule Control** | Studio sets schedule | Contractor has flexibility |
| **Equipment** | Studio provides | Contractor provides own |
| **Overtime** | Required over 40hrs | Not applicable |
| **Minimum Wage** | Applies | Not applicable |
| **Pay Frequency** | Regular payroll | Per invoice/agreement |

### Most Yoga Studios

> **Reality:** Most yoga teachers are **independent contractors** (1099), not employees.

This means:
- No tax withholding by studio
- Teacher invoices studio or studio pays gross
- Teacher responsible for quarterly estimated taxes
- No overtime calculations needed
- More flexible pay schedules

### Tandava's Approach

```sql
-- Track worker classification
ALTER TABLE studio_staff ADD COLUMN
  worker_classification TEXT DEFAULT 'contractor'
  CHECK (worker_classification IN ('employee', 'contractor'));

-- Affects exports and reporting
-- Employees: Include in payroll with withholding
-- Contractors: Include in 1099 reporting, no withholding
```

### Configuration UI

**Settings → Staff → [Person] → Employment**

```
┌─────────────────────────────────────────────────┐
│ Worker Classification                           │
├─────────────────────────────────────────────────┤
│ ○ Employee (W-2)                                │
│   • Included in payroll                         │
│   • Tax withholding applies                     │
│   • Overtime rules apply                        │
│                                                 │
│ ● Independent Contractor (1099)                 │
│   • Receives gross pay                          │
│   • No tax withholding                          │
│   • Reported on 1099 if >$600/year              │
│                                                 │
│ Tax ID (SSN/EIN): [•••-••-1234] [Edit]          │
│ W-9 on file: ✓ Received Jan 15, 2025            │
└─────────────────────────────────────────────────┘
```

### 1099 Reporting

At year-end, studios must report contractor payments >$600:

```typescript
// Export for 1099 preparation
interface ContractorYearEnd {
  contractor_name: string;
  contractor_address: string;
  tax_id_last_four: string;
  total_payments_cents: number;
  payment_type: 'nonemployee_compensation';  // Box 1 on 1099-NEC
}

// Generate report
async function generate1099Report(studioId: string, year: number) {
  return db.query(`
    SELECT
      p.full_name,
      p.address,
      RIGHT(ss.tax_id, 4) as tax_id_last_four,
      SUM(pe.calculated_amount_cents) as total_payments
    FROM payroll_entries pe
    JOIN studio_staff ss ON pe.teacher_id = ss.profile_id
    JOIN profiles p ON ss.profile_id = p.id
    WHERE ss.worker_classification = 'contractor'
      AND EXTRACT(YEAR FROM pe.class_date) = $2
      AND pe.is_paid = true
    GROUP BY p.id, ss.id
    HAVING SUM(pe.calculated_amount_cents) >= 60000  -- $600 threshold
  `, [studioId, year]);
}
```

---

## Accounting and Exports

### Pay Model in Exports

All exports include the pay model used for transparency:

**Teacher Pay Export (CSV):**
```csv
Teacher,Date,Class,Pay Model,Base Rate,Students,Revenue,Calculated Pay,Bonus,Total
Maya Patel,2026-02-01,Morning Vinyasa,hybrid,$35 + 10%,22,$550.00,$35.00,$55.00,$0,$90.00
Maya Patel,2026-02-01,Hot Power,hybrid,$35 + 10%,28,$700.00,$35.00,$70.00,$25.00,$130.00
Jordan Lee,2026-02-01,Yin Yoga,per_class,$50,15,$375.00,$50.00,$0,$0,$50.00
```

**Columns explained:**
- **Pay Model**: The model used for calculation
- **Base Rate**: The configured rate
- **Students**: Actual attendance
- **Revenue**: Class revenue (for share calculations)
- **Calculated Pay**: Base calculation
- **Bonus**: Any attendance/fill bonuses
- **Total**: Final amount

### QuickBooks Mapping

| Tandava Pay Type | QuickBooks Account |
|------------------|-------------------|
| `per_class` | Payroll Expense - Teacher Pay |
| `hourly` | Payroll Expense - Hourly Staff |
| `revenue_share` | Payroll Expense - Commissions |
| `hybrid` | Split: Teacher Pay + Commissions |
| `salary` | Payroll Expense - Salaries |
| `bonus_*` | Payroll Expense - Bonuses |

### Audit Requirements

For clean audits, exports include:

1. **Pay model at time of class** (not current model)
2. **Calculation breakdown** showing how total was derived
3. **Rate change history** for any teacher whose rate changed
4. **Approval trail** for any manual adjustments

---

## Implementation Status

### Currently in Schema

| Feature | Table | Status |
|---------|-------|--------|
| Basic pay types | `studio_staff.pay_type` | ✅ Implemented |
| Per-class rate | `studio_staff.pay_rate_cents` | ✅ Implemented |
| Revenue share % | `studio_staff.pay_revenue_share_pct` | ✅ Implemented |
| Payroll entries | `payroll_entries` | ✅ Implemented |

### In PRD-002 (Planned)

| Feature | Table | Status |
|---------|-------|--------|
| Commission models | `commission_models` | 📋 PRD only |
| Model assignments | `commission_assignments` | 📋 PRD only |
| Commission ledger | `commission_ledger` | 📋 PRD only |
| Tiered rates | `commission_models.tier_rates` | 📋 PRD only |
| Hybrid model | `commission_models` | 📋 PRD only |

### Recommended Additions

| Feature | Priority | Complexity |
|---------|----------|------------|
| Per-student pay | P1 | Low |
| Attendance bonus | P1 | Low |
| Fill rate bonus | P2 | Low |
| Setup/cleanup time | P2 | Medium |
| Worker classification | P1 | Low |
| 1099 export | P1 | Medium |
| Time tracking (basic) | P3 | High |
| External time tracking integration | P2 | Medium |

---

## Migration Path

### Phase 1: Extend Pay Types

```sql
-- Add new pay types to enum
ALTER TYPE teacher_pay_type ADD VALUE 'hybrid';
ALTER TYPE teacher_pay_type ADD VALUE 'tiered';
ALTER TYPE teacher_pay_type ADD VALUE 'per_student';

-- Add worker classification
ALTER TABLE studio_staff ADD COLUMN
  worker_classification TEXT DEFAULT 'contractor';

-- Add 1099 tracking
ALTER TABLE studio_staff ADD COLUMN
  tax_id_encrypted BYTEA,
  w9_received_at TIMESTAMPTZ;
```

### Phase 2: Commission Models (PRD-002)

Implement full `commission_models` and `commission_assignments` tables with:
- Effective date tracking
- No-overlap constraints
- Audit history

### Phase 3: Advanced Features

- Per-student and bonus calculations
- Setup/cleanup time tracking
- External time tracking webhooks
- 1099 year-end export

---

## Related Documentation

- [PRD-002: Tips & Commission](../prd/PRD-002-tips-commission.md) - Full PRD for commission system
- [PRD-016: Accounting Exports](../prd/PRD-016-accounting-exports.md) - Export formats for payroll
- [BUSINESS_CONNECTORS.md](../ai-agents/BUSINESS_CONNECTORS.md) - Integration with payroll systems
- [ROLE_ACCESS_CONTROL.md](ROLE_ACCESS_CONTROL.md) - Who can configure compensation

---

*Last updated: 2026-02-06*
