# CLAUDE – Business Systems Connector for Tandava

You are the primary coding assistant for the **Business Systems Connector** subsystem.

---

## 0. Project Context

Tandava is an **open-source, studio-owned management platform** that provides an alternative to proprietary systems. Studios choose Tandava for data sovereignty, transparency, and freedom from vendor lock-in.

It handles:
- Members (students) & memberships
- Classes, workshops, retreats, teacher trainings
- Bookings & attendance
- Payments, passes, and subscriptions
- Staff (teachers) & payroll/commission

**The Business Systems Connector** is a subsystem that makes Tandava's operational and financial data plug into external business tools:

| Tool Category | Examples |
|---------------|----------|
| **Accounting** | QuickBooks, Xero, Wave, FreshBooks |
| **Spreadsheets** | Excel, Google Sheets |
| **Payroll** | Gusto, ADP, Paychex, manual |
| **Time Tracking** | Homebase, Deputy, When I Work |
| **Automation** | Zapier, Make, n8n |
| **BI/Analytics** | Tableau, Looker, Metabase |

We do **NOT** replace QuickBooks.
We **DO** make it trivially easy to feed QuickBooks (and similar tools) with clean, reconcilable data.

---

## 1. Why This Matters for Yoga Studios

### The Current Pain

Most yoga studios:
1. Export messy CSV files from Mindbody monthly
2. Spend 2-4 hours manually cleaning and reformatting
3. Re-enter data into QuickBooks by hand
4. Calculate teacher pay in spreadsheets with error-prone formulas
5. End up with books that don't reconcile

### Our Solution

> "Tandava exports data your bookkeeper actually wants, in formats they already know."

- **Daily sales summaries** ready for QuickBooks import
- **Teacher pay calculations** with audit trails
- **Revenue by product type** for accurate categorization
- **Payout reconciliation** that matches Stripe deposits

---

## 2. Tandava's Existing Financial Schema

When building exports, use the **existing domain models** as the source of truth.

### Key Tables You'll Work With

```
-- Core entities
studios              -- Multi-location support
member_profiles      -- Students/clients
staff_profiles       -- Teachers, front desk, managers

-- Classes & Bookings
classes              -- Class definitions (Vinyasa, Hot Yoga, etc.)
class_occurrences    -- Scheduled instances
bookings             -- Student reservations
check_ins            -- Actual attendance

-- Payments & Products
offerings            -- Memberships, packs, drop-ins, retail
transactions         -- Sales and purchases
transaction_line_items
refunds              -- Linked to transactions
payouts              -- Stripe payouts to studio

-- Teacher Compensation (from PRD-002)
tips                 -- Student tips to teachers
tip_payouts          -- Batch tip payouts
commission_models    -- Pay structures (per-class, hourly, revenue share)
commission_assignments
commission_ledger    -- Real-time earned commissions
commission_snapshots -- Daily aggregates

-- Custom Reports (from PRD-013)
saved_reports
report_schedules
```

### Revenue Categories (Yoga-Specific)

Tandava tracks revenue by these product types:

| Product Type | QuickBooks Typical Account | Description |
|--------------|----------------------------|-------------|
| `membership` | Service Revenue – Memberships | Monthly unlimited, annual |
| `class_pack` | Service Revenue – Class Packs | 5-pack, 10-pack, 20-pack |
| `drop_in` | Service Revenue – Drop-In | Single class purchases |
| `intro_offer` | Promotional Revenue | First week free, new student specials |
| `workshop` | Service Revenue – Workshops | Single/multi-day workshops |
| `teacher_training` | Service Revenue – Trainings | 200hr, 300hr, specialty |
| `retreat` | Service Revenue – Retreats | Destination programs |
| `private_session` | Service Revenue – Privates | 1:1 sessions |
| `retail` | Retail Sales | Mats, props, apparel |
| `tips` | Tips (Passthrough) | Pass-through to teachers |

---

## 3. Export Specifications

### 3.1 QuickBooks Daily Sales Summary

**Purpose:** Give bookkeepers a daily summary they can import directly to QuickBooks.

**Filename:** `{studio_slug}_sales_{YYYY-MM-DD}.csv`

**Columns:**

```csv
Date,Location,Revenue Category,Gross Sales,Discounts,Net Sales,Tax Collected,Refunds,Net Revenue,Reference
2026-02-01,SOMA,Memberships,2850.00,150.00,2700.00,0.00,0.00,2700.00,TDV-20260201-MEM
2026-02-01,SOMA,Class Packs,1340.00,0.00,1340.00,0.00,50.00,1290.00,TDV-20260201-PCK
2026-02-01,SOMA,Drop-In,812.00,0.00,812.00,0.00,0.00,812.00,TDV-20260201-DRP
2026-02-01,SOMA,Workshops,450.00,0.00,450.00,38.25,0.00,450.00,TDV-20260201-WKS
2026-02-01,SOMA,Retail,234.50,0.00,234.50,19.93,0.00,234.50,TDV-20260201-RTL
```

**Key Design Decisions:**
- Pre-aggregated by date + location + revenue category (not line-item detail)
- Tax shown separately (some studios record gross, some net)
- Reference column for easy matching in QuickBooks
- Refunds shown as negative adjustment to category

**CLI Command:**
```bash
tandava export quickbooks-daily --date=2026-02-01 --location=soma
tandava export quickbooks-daily --from=2026-01-01 --to=2026-01-31 --format=csv
```

### 3.2 QuickBooks Detailed Sales Export

**Purpose:** Full transaction detail for studios that need line-item imports or detailed audit.

**Filename:** `{studio_slug}_transactions_{YYYY-MM-DD}.csv`

**Columns:**

```csv
Date,Time,Transaction ID,Member Name,Member ID,Location,Product,Product Type,Unit Price,Quantity,Subtotal,Discount Code,Discount Amount,Tax,Total,Payment Method,Channel,Reference
2026-02-01,09:15:23,txn_abc123,Sarah Chen,mem_456,SOMA,Unlimited Monthly,membership,149.00,1,149.00,,0.00,0.00,149.00,card,direct,TDV-abc123
2026-02-01,10:32:45,txn_def789,Mike Johnson,mem_789,SOMA,10-Class Pack,class_pack,200.00,1,200.00,NEWYEAR,20.00,0.00,180.00,card,direct,TDV-def789
```

**Use Cases:**
- Accountants who want full audit trail
- Reconciliation against Stripe dashboard
- Tax preparation with transaction-level detail

### 3.3 Teacher Pay Export

**Purpose:** Calculate and export teacher compensation for payroll processing.

**Filename:** `{studio_slug}_payroll_{period_start}_{period_end}.csv`

**Columns:**

```csv
Teacher Name,Teacher ID,Email,Pay Period,Total Classes,Total Hours,Base Pay,Revenue Share,Tips,Gross Pay,Deductions,Net Pay
Maya Patel,staff_123,maya@email.com,2026-01-16 to 2026-01-31,24,36.0,1800.00,420.00,185.00,2405.00,0.00,2405.00
Jordan Lee,staff_456,jordan@email.com,2026-01-16 to 2026-01-31,18,27.0,1350.00,280.00,92.00,1722.00,0.00,1722.00
```

**Detailed Breakdown Export:**

```csv
Teacher,Date,Class,Class Type,Start Time,End Time,Hours,Attendance,Pay Type,Base Rate,Revenue Share Rate,Class Revenue,Base Pay,Revenue Share,Tips,Total
Maya Patel,2026-01-16,Morning Vinyasa,vinyasa,07:00,08:15,1.25,22,hybrid,75.00,10%,550.00,75.00,55.00,12.00,142.00
Maya Patel,2026-01-16,Hot Power,hot_yoga,12:00,13:15,1.25,28,hybrid,75.00,10%,700.00,75.00,70.00,8.00,153.00
```

**Pay Types Supported:**
- `per_class` – Flat rate per class taught
- `hourly` – Rate × scheduled hours
- `revenue_share` – Percentage of class revenue
- `hybrid` – Base + revenue share
- `tiered` – Rate varies by attendance threshold

### 3.4 Stripe Payout Reconciliation

**Purpose:** Match Tandava revenue to actual Stripe bank deposits.

**Filename:** `{studio_slug}_payout_recon_{payout_id}.csv`

**Columns:**

```csv
Payout ID,Payout Date,Bank Deposit,Gross Revenue,Stripe Fees,Net Payout,Matches Deposit
po_xyz789,2026-02-03,4523.67,4678.00,154.33,4523.67,✓
```

**Transaction Detail:**

```csv
Payout ID,Transaction ID,Date,Type,Gross,Fee,Net
po_xyz789,txn_abc123,2026-02-01,charge,149.00,4.62,144.38
po_xyz789,txn_def789,2026-02-01,charge,180.00,5.52,174.48
po_xyz789,ref_ghi012,2026-02-02,refund,-50.00,-1.45,-48.55
```

### 3.5 KPI Summary Export

**Purpose:** Operational metrics for Google Sheets dashboards or BI tools.

**Filename:** `{studio_slug}_kpis_{YYYY-MM}.csv`

**Columns:**

```csv
Date,New Members,Active Members,Check-ins,Classes Held,Avg Class Fill,Total Revenue,Membership Revenue,Pack Revenue,Drop-in Revenue,Retail Revenue,Churn Rate
2026-02-01,8,342,156,18,72%,4802.00,2700.00,1290.00,812.00,0.00,2.1%
2026-02-02,5,345,143,16,68%,3245.00,1800.00,890.00,555.00,0.00,1.8%
```

---

## 4. Implementation Architecture

### Directory Structure

```
src/
  domain/
    members/
    classes/
    payments/
    staff/
  business_connectors/
    exports/
      accounting/
        quickbooks_daily_sales.ts
        quickbooks_detailed.ts
        xero_export.ts
      payroll/
        teacher_pay_summary.ts
        teacher_pay_detailed.ts
        gusto_import.ts
      operations/
        kpi_summary.ts
        attendance_report.ts
        revenue_by_channel.ts
      reconciliation/
        stripe_payout_recon.ts
    formatters/
      csv.ts
      xlsx.ts
      pdf.ts
    events/
      emitter.ts
      handlers/
        sale_created.ts
        payout_received.ts
    integrations/
      zapier/
      webhooks/
    cli/
      export_commands.ts
```

### Export Module Pattern

Each export module should follow this pattern:

```typescript
// src/business_connectors/exports/accounting/quickbooks_daily_sales.ts

import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface QuickBooksDailySalesOptions {
  studioId: string;
  date?: Date;
  fromDate?: Date;
  toDate?: Date;
  locationId?: string;
}

interface QuickBooksDailySalesRow {
  date: string;
  location: string;
  revenueCategory: string;
  grossSales: number;
  discounts: number;
  netSales: number;
  taxCollected: number;
  refunds: number;
  netRevenue: number;
  reference: string;
}

export async function buildQuickBooksDailySales(
  options: QuickBooksDailySalesOptions
): Promise<QuickBooksDailySalesRow[]> {
  // 1. Query from domain models (commission_snapshots, transactions)
  // 2. Aggregate by date + location + product_type
  // 3. Map product_type to revenue category
  // 4. Return typed array

  const results = await db.query(`
    SELECT
      DATE(t.created_at AT TIME ZONE s.timezone) as sale_date,
      l.name as location_name,
      o.product_type,
      SUM(tli.unit_price_cents * tli.quantity) as gross_cents,
      SUM(tli.discount_cents) as discount_cents,
      SUM(tli.tax_cents) as tax_cents,
      COUNT(*) as transaction_count
    FROM transactions t
    JOIN studios s ON t.studio_id = s.id
    JOIN locations l ON t.location_id = l.id
    JOIN transaction_line_items tli ON t.id = tli.transaction_id
    JOIN offerings o ON tli.offering_id = o.id
    WHERE t.studio_id = $1
      AND t.status = 'completed'
      AND DATE(t.created_at AT TIME ZONE s.timezone) BETWEEN $2 AND $3
    GROUP BY sale_date, location_name, o.product_type
    ORDER BY sale_date, location_name, o.product_type
  `, [options.studioId, options.fromDate, options.toDate]);

  // Map and format
  return results.map(row => ({
    date: formatDate(row.sale_date),
    location: row.location_name,
    revenueCategory: mapProductTypeToCategory(row.product_type),
    grossSales: row.gross_cents / 100,
    discounts: row.discount_cents / 100,
    netSales: (row.gross_cents - row.discount_cents) / 100,
    taxCollected: row.tax_cents / 100,
    refunds: 0, // Calculate separately
    netRevenue: (row.gross_cents - row.discount_cents) / 100,
    reference: generateReference(row.sale_date, row.product_type),
  }));
}

function mapProductTypeToCategory(productType: string): string {
  const mapping: Record<string, string> = {
    membership: "Memberships",
    class_pack: "Class Packs",
    drop_in: "Drop-In",
    intro_offer: "Intro Offers",
    workshop: "Workshops",
    teacher_training: "Teacher Training",
    retreat: "Retreats",
    private_session: "Private Sessions",
    retail: "Retail",
    tips: "Tips (Passthrough)",
  };
  return mapping[productType] || "Other Revenue";
}
```

### CLI Commands

```bash
# Daily sales
tandava export quickbooks-daily --date=2026-02-01
tandava export quickbooks-daily --from=2026-01-01 --to=2026-01-31

# Detailed transactions
tandava export quickbooks-detailed --from=2026-01-01 --to=2026-01-31

# Teacher payroll
tandava export payroll --period=2026-01 --period-type=semimonthly
tandava export payroll --from=2026-01-16 --to=2026-01-31

# Stripe reconciliation
tandava export stripe-recon --payout=po_xyz789
tandava export stripe-recon --month=2026-01

# KPIs
tandava export kpis --month=2026-01 --format=xlsx
```

---

## 5. Phases

### Phase 1: Export-First (Current Priority)

Focus on **CSV exports** that work today:

1. QuickBooks daily sales summary
2. QuickBooks detailed transactions
3. Teacher pay summary and detail
4. Stripe payout reconciliation
5. KPI summary

**No external integrations yet.** Just clean, downloadable exports.

### Phase 2: Automation Bridges

Add **webhook events** and simple integrations:

1. Events: `sale_created`, `refund_created`, `payout_received`, `payroll_finalized`
2. Webhook subscriptions (studio configures endpoint)
3. Zapier-friendly REST endpoints
4. n8n/Make compatibility

### Phase 3: Direct Integrations

Build **native connectors** for key platforms:

1. QuickBooks Online OAuth + direct sync
2. Gusto payroll API
3. Google Sheets auto-sync

### Phase 4: Enterprise/Hosted

For larger studios or franchise groups:

1. Multi-location rollup dashboards
2. Scheduled exports (email CSV weekly)
3. Custom account mappings
4. Audit and compliance reports

---

## 6. QuickBooks Integration Guide

### For Studios Using QuickBooks Desktop

1. Export CSV from Tandava (`quickbooks-daily`)
2. In QuickBooks Desktop: File → Utilities → Import → Excel/CSV
3. Map columns to QuickBooks fields
4. Review and import

### For Studios Using QuickBooks Online

**Phase 1 (Manual):**
1. Export CSV from Tandava
2. In QBO: Banking → Upload transactions → Select CSV
3. Categorize and approve

**Phase 3 (Direct Sync):**
1. Connect Tandava to QBO via OAuth
2. Map Tandava product types to QBO income accounts
3. Enable auto-sync (daily or real-time)

### Recommended QBO Account Structure

```
Income
├── Service Revenue
│   ├── Memberships
│   ├── Class Packs
│   ├── Drop-In Classes
│   ├── Intro Offers
│   ├── Workshops
│   ├── Teacher Training
│   ├── Retreats
│   └── Private Sessions
├── Retail Sales
│   ├── Yoga Props
│   ├── Apparel
│   └── Beverages
└── Other Income
    ├── Late Cancel Fees
    └── No-Show Fees

Cost of Goods Sold
├── Teacher Pay
│   ├── Base Compensation
│   └── Revenue Share
├── Tips Passthrough
└── Retail COGS

Expenses
├── Payment Processing Fees
│   ├── Stripe Fees
│   └── Other Processing
└── ...
```

---

## 7. Payroll Integration

### Teacher Pay Calculation Logic

Tandava calculates teacher pay using the `commission_models` and `commission_ledger` tables:

```typescript
async function calculateTeacherPay(
  teacherId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<TeacherPaySummary> {
  // 1. Get all class occurrences taught in period
  const classes = await getClassesForTeacher(teacherId, periodStart, periodEnd);

  // 2. Get commission assignment for teacher
  const assignment = await getCommissionAssignment(teacherId, periodStart);

  // 3. Calculate pay for each class based on model
  let basePay = 0;
  let revenueShare = 0;

  for (const cls of classes) {
    const classRevenue = await getClassRevenue(cls.id);
    const { base, share } = calculateClassPay(assignment, cls, classRevenue);
    basePay += base;
    revenueShare += share;
  }

  // 4. Add tips
  const tips = await getTipsForTeacher(teacherId, periodStart, periodEnd);

  // 5. Return summary
  return {
    teacherId,
    periodStart,
    periodEnd,
    totalClasses: classes.length,
    totalHours: classes.reduce((sum, c) => sum + c.durationMinutes / 60, 0),
    basePay,
    revenueShare,
    tips,
    grossPay: basePay + revenueShare + tips,
    deductions: 0, // Future: health insurance, etc.
    netPay: basePay + revenueShare + tips,
  };
}
```

### Gusto Integration (Phase 3)

For studios using Gusto:

```typescript
// POST to Gusto Payroll API
const gustoPayrollItem = {
  employee_id: teacher.gustoEmployeeId,
  pay_period: {
    start_date: "2026-01-16",
    end_date: "2026-01-31",
  },
  earnings: [
    { earning_type: "Regular", amount: basePay },
    { earning_type: "Commission", amount: revenueShare },
    { earning_type: "Tips", amount: tips },
  ],
};
```

---

## 8. Workflow Automation Events

### Event Catalog

| Event | Trigger | Payload |
|-------|---------|---------|
| `sale.created` | Transaction completed | Transaction + line items |
| `sale.refunded` | Refund processed | Refund + original transaction |
| `membership.created` | New membership starts | Member + membership details |
| `membership.cancelled` | Membership cancelled | Member + cancellation reason |
| `class.completed` | Class ends | Class + attendance + revenue |
| `payout.received` | Stripe payout lands | Payout + transaction IDs |
| `payroll.finalized` | Pay period closed | Pay summaries for all teachers |

### Webhook Configuration

Studios can configure webhooks in Settings → Integrations → Webhooks:

```json
{
  "id": "wh_123",
  "url": "https://hooks.zapier.com/hooks/catch/123/abc",
  "events": ["sale.created", "membership.cancelled"],
  "secret": "whsec_xyz",
  "active": true
}
```

### Zapier Integration

For Zapier compatibility, expose REST endpoints:

```
GET  /api/integrations/zapier/triggers/sales
POST /api/integrations/zapier/subscribe
DELETE /api/integrations/zapier/unsubscribe/:id
```

---

## 9. What NOT To Build

Do NOT:
- Implement a full general ledger or chart of accounts
- Force a specific accounting methodology
- Hard-code tax rules for specific jurisdictions
- Create exports that require heavy manual cleanup
- Design only for US studios (support international currencies/formats)

Do:
- Optimize for **truth and clarity** of financial data
- Make exports **reconcilable** against Stripe and bank statements
- Support **multiple export formats** (CSV, XLSX, PDF)
- Document **what each export is for** and how to use it

---

## 10. Response Patterns

When users ask for business connector features:

### "Add QuickBooks integration"
1. Start with daily sales + detailed exports (Phase 1)
2. Ensure product_type → account mapping is configurable
3. Add docs for how to import into QuickBooks
4. Plan for direct OAuth integration (Phase 3)

### "Help me with payroll exports"
1. Check existing commission_models and commission_ledger
2. Implement teacher pay summary + detail exports
3. Include tips separately (tax implications)
4. Document fields and typical workflow

### "Connect to Zapier"
1. Check for existing event infrastructure
2. Implement webhook subscription endpoints
3. Create Zapier-compatible REST triggers
4. Document payload schemas

### "Export for my bookkeeper"
1. Ask: Do they use QuickBooks, Xero, or spreadsheets?
2. Recommend appropriate export format
3. Include reference numbers for reconciliation
4. Add date range and location filters

---

## 11. Testing Exports

### Manual Testing Checklist

For each export:
- [ ] Totals match commission_snapshots or transaction sums
- [ ] Dates respect studio timezone
- [ ] Currency formatting is consistent
- [ ] Reference numbers are unique and traceable
- [ ] Multi-location studios show correct location attribution
- [ ] Refunds appear as negative adjustments
- [ ] Tips are separated from service revenue

### Automated Tests

```typescript
describe("QuickBooks Daily Sales Export", () => {
  it("aggregates by date, location, and product type", async () => {
    // Seed test data
    // Run export
    // Assert row count and totals
  });

  it("handles refunds correctly", async () => {
    // Create transaction then refund
    // Export should show refund as negative
  });

  it("respects studio timezone", async () => {
    // Create transaction at 11:30pm PT
    // Should appear on correct date
  });
});
```

---

## 12. Admin UI for Business Connectors

Add to `/manage/settings`:

**Settings → Integrations → Exports**

- Configure default export formats
- Set up QuickBooks account mappings
- Configure payroll schedule (weekly, biweekly, semimonthly)
- View export history

**Settings → Integrations → Webhooks**

- Add webhook endpoints
- Select events to subscribe
- View delivery logs
- Test endpoints

**Reports → Export Center**

- Quick access to all export types
- Date range picker
- Download or schedule via email

---

*You are here to make Tandava's financial data accessible, accurate, and easy to use with external business tools.*
