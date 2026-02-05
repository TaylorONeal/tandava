# PRD-013: Custom Report Builder

## Overview
**Phase:** 6
**Priority:** P0
**Status:** Planned
**Owner:** TBD

---

## Jobs to Be Done

### Job 1: Answer Unique Business Questions
**When** I have a specific question about my business that standard reports don't answer,
**I want to** build a custom report with the exact data I need,
**So I can** make informed decisions based on my specific situation.

### Job 2: Save Time on Recurring Analysis
**When** I need to run the same analysis regularly (weekly revenue by class type),
**I want to** save my custom report as a template,
**So I can** run it again with one click.

### Job 3: Share Insights with Team
**When** I've built a useful report,
**I want to** share it with my team or export it,
**So I can** collaborate on business decisions.

---

## User Stories

### US-13.1: Report Builder Interface
**As a** studio owner,
**I want** a visual report builder to create custom reports,
**So that** I don't need technical skills to analyze my data.

**Acceptance Criteria:**
- [ ] Drag-and-drop interface for selecting data fields
- [ ] Available entities: Members, Bookings, Transactions, Classes, Staff
- [ ] Filter options: date range, membership status, class type, etc.
- [ ] Grouping: by day/week/month, by class, by teacher, etc.
- [ ] Aggregations: count, sum, average, min, max
- [ ] Preview results before saving

### US-13.2: Pre-built Report Templates
**As a** studio owner new to analytics,
**I want** pre-built report templates for common questions,
**So that** I can start getting insights immediately.

**Acceptance Criteria:**
- [ ] Template: "Revenue by Membership Type" (monthly)
- [ ] Template: "Class Attendance Trends" (weekly)
- [ ] Template: "Teacher Performance" (classes, attendance, revenue)
- [ ] Template: "New vs Returning Members" (acquisition funnel)
- [ ] Template: "Churn Risk Report" (at-risk members)
- [ ] One-click use template, then customize

### US-13.3: Saved Reports
**As a** user who built a custom report,
**I want** to save it for future use,
**So that** I don't have to rebuild it each time.

**Acceptance Criteria:**
- [ ] Save with name and description
- [ ] Organize into folders
- [ ] Set as favorite for quick access
- [ ] Edit saved report configuration
- [ ] Duplicate to create variations

### US-13.4: Scheduled Reports
**As a** busy studio owner,
**I want** reports to run automatically and email me,
**So that** I stay informed without manual effort.

**Acceptance Criteria:**
- [ ] Schedule: daily, weekly, monthly
- [ ] Choose delivery day/time
- [ ] Email to self or multiple recipients
- [ ] Include as attachment (CSV, PDF) or inline summary
- [ ] Pause/resume schedules

### US-13.5: Shareable Dashboards
**As a** studio owner,
**I want** to create a dashboard with multiple reports,
**So that** I can see all key metrics in one place.

**Acceptance Criteria:**
- [ ] Add multiple saved reports to dashboard
- [ ] Arrange in grid layout
- [ ] Set refresh frequency
- [ ] Share link with team (view-only)
- [ ] Embed in external tools (optional)

---

## Edge Cases

### EC-1: Large Data Exports
**Scenario:** User requests report with 100k+ rows.
**Handling:**
- Show warning about large export
- Generate in background, email when ready
- Paginate in UI, offer full download

### EC-2: Sensitive Data in Shared Reports
**Scenario:** User shares report containing PII.
**Handling:**
- Warn before sharing reports with member data
- Option to anonymize (Member #1234 instead of names)
- Audit log of who accessed shared reports

---

## Technical Design

### Report Configuration Schema

```typescript
interface ReportConfig {
  id: string;
  name: string;
  description?: string;

  // Data source
  entity: 'members' | 'bookings' | 'transactions' | 'classes' | 'staff';

  // Fields to include
  fields: ReportField[];

  // Filters
  filters: ReportFilter[];

  // Grouping
  groupBy?: string[];
  groupByPeriod?: 'day' | 'week' | 'month' | 'quarter' | 'year';

  // Sorting
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';

  // Aggregations
  aggregations?: ReportAggregation[];

  // Limits
  limit?: number;
}

interface ReportField {
  name: string;           // field path: 'profile.first_name', 'booking.created_at'
  alias?: string;         // display name
  format?: 'currency' | 'percent' | 'date' | 'datetime';
}

interface ReportFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'between';
  value: any;
}

interface ReportAggregation {
  field: string;
  function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'count_distinct';
  alias: string;
}
```

### Database Schema

```sql
CREATE TABLE saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,

  -- Organization
  folder TEXT,
  is_favorite BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,

  -- Sharing
  shared_link_token TEXT UNIQUE,
  shared_link_expires_at TIMESTAMPTZ,

  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_run_at TIMESTAMPTZ
);

CREATE TABLE report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES saved_reports(id) ON DELETE CASCADE,

  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INTEGER,
  day_of_month INTEGER,
  time_of_day TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'America/Los_Angeles',

  recipients TEXT[] NOT NULL,
  format TEXT DEFAULT 'csv' CHECK (format IN ('csv', 'xlsx', 'pdf')),
  include_inline_summary BOOLEAN DEFAULT true,

  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Layout
  layout JSONB NOT NULL DEFAULT '[]',
  /*
  [
    { "reportId": "uuid", "x": 0, "y": 0, "w": 6, "h": 4 },
    { "reportId": "uuid", "x": 6, "y": 0, "w": 6, "h": 4 }
  ]
  */

  -- Sharing
  shared_link_token TEXT UNIQUE,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## UI Wireframes

### Report Builder

```
┌─────────────────────────────────────────────────────────────┐
│  Custom Report Builder                        [Save] [Run]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Data Source: [Bookings ▼]                                  │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │ Available Fields│  │ Selected Fields                 │  │
│  │                 │  │                                 │  │
│  │ ☐ Booking Date  │  │ ✓ Booking Date                  │  │
│  │ ☐ Member Name   │  │ ✓ Member Name                   │  │
│  │ ☐ Class Name    │  │ ✓ Class Name                    │  │
│  │ ☐ Status        │  │ ✓ Revenue (sum)                 │  │
│  │ ☐ Revenue       │  │                                 │  │
│  │ ...             │  │ [Drag to reorder]               │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
│                                                             │
│  Filters:                                                   │
│  [+ Add Filter]                                             │
│  • Date Range: [Last 30 days ▼]                             │
│  • Status: [Checked In ▼]                                   │
│                                                             │
│  Group By: [Class Name ▼]  Period: [Week ▼]                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Preview (showing 10 of 247 rows)            [Export CSV]   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Week     │ Class Name    │ Bookings │ Revenue      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ Jan 1    │ Vinyasa Flow  │ 45       │ $1,350       │   │
│  │ Jan 1    │ Hot Yoga      │ 38       │ $1,140       │   │
│  │ Jan 8    │ Vinyasa Flow  │ 52       │ $1,560       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Reports created per studio | 5+/month | Count of new saved reports |
| Template usage | 60%+ | Reports from templates / total |
| Scheduled report adoption | 30%+ | Studios with active schedules |
| Export frequency | 10+/month | CSV/PDF exports per studio |

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-02-05 | 1.0 | Claude | Initial PRD |
