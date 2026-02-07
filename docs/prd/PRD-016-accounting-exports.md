# PRD-016: Accounting & Business System Exports

## Overview
**Phase:** 2
**Priority:** P1
**Status:** Planned
**Owner:** TBD
**Dependencies:** PRD-002 (Tips & Commission), PRD-013 (Custom Reports)

---

## Jobs to Be Done

### Job 1: End-of-Month Bookkeeping
**When** it's the end of the month and I need to update my books,
**I want to** export my sales data in a format my bookkeeper understands,
**So I can** close the month without spending hours reformatting spreadsheets.

### Job 2: Reconcile Bank Deposits
**When** I see a Stripe deposit hit my bank account,
**I want to** match it to specific transactions in my studio software,
**So I can** ensure nothing is missing and my books balance.

### Job 3: Pay My Teachers Accurately
**When** it's payday for my teachers,
**I want to** export their hours, classes, and calculated pay,
**So I can** enter it into payroll without manual calculation errors.

### Job 4: Understand Revenue by Type
**When** I'm reviewing my business performance,
**I want to** see revenue broken down by memberships, packs, drop-ins, etc.,
**So I can** make informed decisions about pricing and offerings.

### Job 5: Share Data with My Accountant
**When** tax season arrives or I need financial advice,
**I want to** give my accountant clean, well-organized data,
**So they can** do their job without asking me a million questions.

### Job 6: Connect to Automation Tools
**When** I want data to flow automatically to other systems,
**I want to** set up webhooks or Zapier triggers,
**So I can** reduce manual data entry across my business tools.

---

## User Stories

### US-16.1: QuickBooks Daily Sales Export
**As a** studio owner using QuickBooks,
**I want** a daily sales summary export that matches QuickBooks import format,
**So that** my bookkeeper can import without reformatting.

**Acceptance Criteria:**
- [ ] Export by date range (single day or range)
- [ ] Aggregated by: date, location, revenue category
- [ ] Columns: Date, Location, Category, Gross, Discounts, Net, Tax, Refunds, Net Revenue
- [ ] Revenue categories map to accounting line items
- [ ] Include unique reference number per row
- [ ] CSV format compatible with QBO and QuickBooks Desktop
- [ ] Optional: XLSX format with multiple sheets

### US-16.2: Detailed Transaction Export
**As a** studio owner needing full audit trail,
**I want** a detailed export of every transaction,
**So that** I can reconcile at the line-item level.

**Acceptance Criteria:**
- [ ] One row per transaction line item
- [ ] Columns: Date, Time, Transaction ID, Member, Product, Type, Price, Qty, Subtotal, Discount, Tax, Total, Payment Method, Channel
- [ ] Filter by: date range, location, payment method, product type
- [ ] Include refunds as separate rows (negative amounts)
- [ ] Export up to 100k rows (background job for larger)
- [ ] CSV and XLSX formats

### US-16.3: Stripe Payout Reconciliation
**As a** studio owner reconciling bank deposits,
**I want** an export that shows which transactions make up each Stripe payout,
**So that** I can match deposits to my books exactly.

**Acceptance Criteria:**
- [ ] Select by payout ID or date range
- [ ] Summary: Payout ID, Date, Gross Revenue, Stripe Fees, Net Deposit
- [ ] Detail: Transaction ID, Date, Type (charge/refund), Gross, Fee, Net
- [ ] Totals must match actual bank deposit
- [ ] Flag any discrepancies between expected and actual

### US-16.4: Teacher Pay Export
**As a** studio owner processing payroll,
**I want** an export of teacher earnings calculated by pay period,
**So that** I can enter payroll without manual calculations.

**Acceptance Criteria:**
- [ ] Select pay period (custom dates or preset: weekly, biweekly, semimonthly, monthly)
- [ ] Summary: Teacher Name, ID, Email, Classes, Hours, Base Pay, Revenue Share, Tips, Gross, Deductions, Net
- [ ] Detail: Teacher, Date, Class, Start/End, Duration, Attendance, Pay Type, Calculated Pay
- [ ] Respects commission models assigned to each teacher
- [ ] Tips shown separately (tax reporting)
- [ ] Exportable to Gusto, ADP format (future)

### US-16.5: Revenue by Product Type
**As a** studio owner reviewing business mix,
**I want** revenue broken down by product category,
**So that** I can see which offerings drive my business.

**Acceptance Criteria:**
- [ ] Date range selector
- [ ] Breakdown: Memberships, Class Packs, Drop-Ins, Intro Offers, Workshops, Teacher Training, Retreats, Privates, Retail
- [ ] Show: Gross, Discounts, Net, % of Total
- [ ] Compare to previous period
- [ ] Chart visualization + export data

### US-16.6: KPI Dashboard Export
**As a** studio owner tracking daily operations,
**I want** a daily KPI summary I can import to Google Sheets,
**So that** I can build my own dashboards and analysis.

**Acceptance Criteria:**
- [ ] Daily rows with: Date, New Members, Active Members, Check-ins, Classes, Avg Fill Rate, Total Revenue (by type), Churn Rate
- [ ] Date range up to 1 year
- [ ] CSV optimized for Sheets/Excel
- [ ] Consistent date formatting (YYYY-MM-DD)

### US-16.7: Scheduled Export Delivery
**As a** busy studio owner,
**I want** exports to run automatically and email me,
**So that** I have reports ready without manual effort.

**Acceptance Criteria:**
- [ ] Schedule any export type
- [ ] Frequency: daily, weekly, monthly
- [ ] Choose day/time of delivery
- [ ] Email to multiple recipients
- [ ] Attach as CSV, XLSX, or PDF
- [ ] Include inline summary in email body
- [ ] Pause/resume schedules

### US-16.8: Webhook Events
**As a** tech-savvy studio owner,
**I want** real-time events when financial things happen,
**So that** I can trigger automations in Zapier or custom systems.

**Acceptance Criteria:**
- [ ] Events: sale.created, sale.refunded, payout.received, payroll.finalized
- [ ] Configure webhook URL per event type
- [ ] Shared secret for signature verification
- [ ] Retry logic (3 attempts with backoff)
- [ ] Event delivery log with status
- [ ] Test endpoint feature

### US-16.9: Account Mapping Configuration
**As a** studio owner with specific accounting categories,
**I want** to map Tandava product types to my QuickBooks accounts,
**So that** exports categorize revenue exactly how my accountant wants.

**Acceptance Criteria:**
- [ ] Default mappings provided (sensible defaults)
- [ ] Override any mapping: product_type → account_name
- [ ] Save mapping configuration per studio
- [ ] Preview export with applied mappings
- [ ] Import mapping from another studio (franchise)

---

## Edge Cases

### EC-1: Timezone Handling
**Scenario:** Transaction at 11:45 PM Pacific, studio operates in Pacific, export for Feb 1.
**Handling:**
- Use studio's configured timezone for date attribution
- Transaction should appear on Feb 1, not Feb 2
- Export column shows date in studio timezone

### EC-2: Multi-Location Revenue
**Scenario:** Studio has 3 locations, wants combined and per-location exports.
**Handling:**
- Default: separate rows per location
- Option: aggregate all locations
- Option: single location filter

### EC-3: Partial Refunds
**Scenario:** $100 purchase, $40 partial refund.
**Handling:**
- Original transaction: $100
- Refund row: -$40
- Net column: $60 (if aggregating)
- Reference numbers link original and refund

### EC-4: Payment Method Variety
**Scenario:** Studio accepts cards, cash, comps, gift cards.
**Handling:**
- Export includes payment_method column
- Cash transactions may have $0 processing fee
- Comps shown as $0 total with full discount
- Gift card redemptions show gift_card payment method

### EC-5: Teacher Pay Rate Changes
**Scenario:** Teacher's rate changed mid-pay-period.
**Handling:**
- Classes before change: old rate
- Classes after change: new rate
- Export shows which rate applied to each class
- Summary shows blended calculation

### EC-6: Large Export Performance
**Scenario:** Export 50k transactions for full year.
**Handling:**
- UI shows progress indicator
- Large exports run as background job
- Email notification when complete
- Download link expires after 7 days

---

## Technical Design

### Database Schema (Extensions)

```sql
-- Export configurations
CREATE TABLE export_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  export_type TEXT NOT NULL CHECK (export_type IN (
    'quickbooks_daily',
    'quickbooks_detailed',
    'stripe_reconciliation',
    'teacher_payroll',
    'revenue_by_type',
    'kpi_summary'
  )),

  -- Filters
  date_range_type TEXT DEFAULT 'custom', -- custom, yesterday, last_week, last_month
  location_ids UUID[],

  -- Account mappings (for accounting exports)
  account_mappings JSONB DEFAULT '{}',
  /*
  {
    "membership": "Service Revenue - Memberships",
    "class_pack": "Service Revenue - Class Packs",
    "retail": "Retail Sales"
  }
  */

  -- Format
  format TEXT DEFAULT 'csv' CHECK (format IN ('csv', 'xlsx', 'pdf')),
  include_headers BOOLEAN DEFAULT true,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Export schedules
CREATE TABLE export_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_config_id UUID NOT NULL REFERENCES export_configs(id) ON DELETE CASCADE,

  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INTEGER, -- 0-6 for weekly
  day_of_month INTEGER, -- 1-31 for monthly
  time_of_day TIME DEFAULT '06:00',
  timezone TEXT NOT NULL,

  recipients TEXT[] NOT NULL,
  include_inline_summary BOOLEAN DEFAULT true,

  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Export history
CREATE TABLE export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  export_config_id UUID REFERENCES export_configs(id),

  export_type TEXT NOT NULL,
  date_range_start DATE,
  date_range_end DATE,

  -- Results
  row_count INTEGER,
  file_size_bytes INTEGER,
  file_url TEXT,
  file_expires_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  requested_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Webhook configurations
CREATE TABLE webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT,
  url TEXT NOT NULL,
  secret TEXT NOT NULL, -- For HMAC signature

  events TEXT[] NOT NULL, -- ['sale.created', 'payout.received']

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Webhook delivery log
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_config_id UUID NOT NULL REFERENCES webhook_configs(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL,
  payload JSONB NOT NULL,

  -- Delivery status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  response_status INTEGER,
  response_body TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_export_history_studio ON export_history(studio_id, created_at DESC);
CREATE INDEX idx_export_schedules_next ON export_schedules(is_active, next_send_at);
CREATE INDEX idx_webhook_deliveries_pending ON webhook_deliveries(status, created_at) WHERE status = 'pending';
```

### API Endpoints

```
# ============================================================================
# EXPORT GENERATION
# ============================================================================

POST   /api/manage/exports/generate           # Generate export
GET    /api/manage/exports/history            # Export history
GET    /api/manage/exports/:id/download       # Download export file
DELETE /api/manage/exports/:id                # Delete export

# Request body for POST:
# {
#   "type": "quickbooks_daily",
#   "dateRangeStart": "2026-01-01",
#   "dateRangeEnd": "2026-01-31",
#   "locationIds": ["uuid"],
#   "format": "csv",
#   "accountMappings": { ... }
# }

# ============================================================================
# EXPORT CONFIGURATIONS
# ============================================================================

GET    /api/manage/exports/configs            # List saved configs
POST   /api/manage/exports/configs            # Save config
PUT    /api/manage/exports/configs/:id        # Update config
DELETE /api/manage/exports/configs/:id        # Delete config

# ============================================================================
# EXPORT SCHEDULES
# ============================================================================

GET    /api/manage/exports/schedules          # List schedules
POST   /api/manage/exports/schedules          # Create schedule
PUT    /api/manage/exports/schedules/:id      # Update schedule
DELETE /api/manage/exports/schedules/:id      # Delete schedule
POST   /api/manage/exports/schedules/:id/test # Test delivery

# ============================================================================
# WEBHOOKS
# ============================================================================

GET    /api/manage/integrations/webhooks           # List webhooks
POST   /api/manage/integrations/webhooks           # Create webhook
PUT    /api/manage/integrations/webhooks/:id       # Update webhook
DELETE /api/manage/integrations/webhooks/:id       # Delete webhook
POST   /api/manage/integrations/webhooks/:id/test  # Test webhook
GET    /api/manage/integrations/webhooks/:id/logs  # Delivery logs

# ============================================================================
# ACCOUNT MAPPINGS
# ============================================================================

GET    /api/manage/exports/mappings           # Get current mappings
PUT    /api/manage/exports/mappings           # Update mappings
POST   /api/manage/exports/mappings/preview   # Preview with mappings
```

### UI Routes

```
/manage/reports/exports                    # Export center
/manage/reports/exports/new                # Generate new export
/manage/reports/exports/history            # Export history
/manage/reports/exports/schedules          # Manage schedules

/manage/settings/integrations/webhooks     # Webhook management
/manage/settings/integrations/accounting   # Account mapping config
```

---

## Export Format Specifications

### QuickBooks Daily Sales (CSV)

```csv
Date,Location,Revenue Category,Gross Sales,Discounts,Net Sales,Tax Collected,Refunds,Net Revenue,Reference
2026-01-01,SOMA,Memberships,2850.00,150.00,2700.00,0.00,0.00,2700.00,TDV-20260101-MEM-SOMA
2026-01-01,SOMA,Class Packs,1340.00,0.00,1340.00,0.00,50.00,1290.00,TDV-20260101-PCK-SOMA
2026-01-01,SOMA,Drop-In,812.00,0.00,812.00,0.00,0.00,812.00,TDV-20260101-DRP-SOMA
2026-01-01,SOMA,Workshops,450.00,0.00,450.00,38.25,0.00,450.00,TDV-20260101-WKS-SOMA
2026-01-01,SOMA,Retail,234.50,0.00,234.50,19.93,0.00,234.50,TDV-20260101-RTL-SOMA
```

### Teacher Payroll Summary (CSV)

```csv
Pay Period,Teacher Name,Teacher ID,Email,Total Classes,Total Hours,Base Pay,Revenue Share,Tips,Gross Pay,Deductions,Net Pay
2026-01-16 to 2026-01-31,Maya Patel,staff_123,maya@email.com,24,36.00,1800.00,420.00,185.00,2405.00,0.00,2405.00
2026-01-16 to 2026-01-31,Jordan Lee,staff_456,jordan@email.com,18,27.00,1350.00,280.00,92.00,1722.00,0.00,1722.00
```

### Webhook Payload (sale.created)

```json
{
  "id": "evt_123abc",
  "type": "sale.created",
  "created_at": "2026-02-01T14:30:00Z",
  "data": {
    "transaction_id": "txn_xyz789",
    "studio_id": "studio_abc",
    "member_id": "mem_456",
    "location_id": "loc_def",
    "total_cents": 14900,
    "currency": "USD",
    "line_items": [
      {
        "product_id": "prod_uvw",
        "product_type": "membership",
        "name": "Unlimited Monthly",
        "quantity": 1,
        "unit_price_cents": 14900,
        "discount_cents": 0,
        "tax_cents": 0,
        "total_cents": 14900
      }
    ],
    "payment_method": "card",
    "channel": "direct"
  }
}
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Export usage | 80%+ studios | Studios with 1+ export/month |
| Time saved | 2+ hours/month | User survey |
| Reconciliation accuracy | 99.9% | Export totals vs Stripe |
| Scheduled export adoption | 40% | Studios with active schedules |
| Webhook adoption | 20% | Studios with active webhooks |
| Support tickets (export-related) | <5% | % of total tickets |

---

## Rollout Plan

### Phase 1: Core Exports (Weeks 1-3)
1. QuickBooks daily sales export
2. Detailed transaction export
3. Teacher payroll summary
4. Export history and download

### Phase 2: Reconciliation & KPIs (Weeks 4-5)
1. Stripe payout reconciliation
2. KPI summary export
3. Revenue by product type

### Phase 3: Automation (Weeks 6-8)
1. Scheduled exports with email delivery
2. Webhook events (sale.created, payout.received)
3. Webhook configuration UI

### Phase 4: Advanced (Weeks 9-10)
1. Account mapping configuration
2. Gusto/ADP payroll format
3. Direct QuickBooks Online integration (OAuth)

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-02-06 | 1.0 | Claude | Initial PRD |
