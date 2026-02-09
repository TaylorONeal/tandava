# Role-Based Access Control (RBAC)

Comprehensive guide to user roles, permissions, and access control in Tandava.

---

## Current Role Hierarchy

```
owner (highest)
  ↓
admin
  ↓
manager
  ↓
teacher
  ↓
front_desk
  ↓
accountant (read-only financial)
  ↓
student (lowest)
```

**Note:** Higher roles inherit all permissions from lower roles.

---

## Role Definitions

### Owner

**Who:** Studio founders, business owners with equity stake.

**Access:**
- **Full access** to all features
- Studio settings and configuration
- Billing and subscription management
- User role assignments
- Data export and deletion
- API keys and webhooks
- Dangerous operations (delete studio, bulk delete)

**UI Access:**
- All `/manage/*` pages
- Settings → all tabs including billing
- Can see all financial data

### Admin

**Who:** General managers, operations directors without ownership.

**Access:**
- All operational features
- Staff management (hire, fire, pay rates)
- Financial reporting (view all)
- Marketing and campaigns
- **Cannot:** Change billing, delete studio, assign owner role

**UI Access:**
- All `/manage/*` pages except billing management
- Settings → most tabs
- Cannot create other admins

### Manager

**Who:** Location managers, assistant managers, shift leads.

**Access:**
- Daily operations management
- Schedule management
- Student management
- Basic reporting
- Cannot access payroll details for others
- Cannot see full financial reports

**UI Access:**
- `/manage/dashboard`
- `/manage/schedule`
- `/manage/students`
- `/manage/events`
- `/manage/tasks`
- Limited `/manage/reports`

### Teacher

**Who:** Instructors, substitute teachers, contractor teachers.

**Access:**
- Their own schedule
- Class rosters for classes they teach
- Check-in students for their classes
- Sub requests
- Their own earnings/tips
- Cannot see other teachers' pay

**UI Access:**
- `/teach/*` only
- Cannot access `/manage/*`

### Front Desk

**Who:** Receptionists, check-in staff, part-time help.

**Access:**
- Check-in students
- Book/cancel classes for students
- View schedule
- Basic student lookup
- Process simple transactions
- Cannot see financial reports or payroll

**UI Access:**
- `/manage/dashboard` (limited view)
- `/manage/schedule` (view only)
- `/manage/students` (basic info)
- Check-in functionality

### Accountant (New Role)

**Who:** External bookkeepers, CPAs, financial consultants.

**Rationale:** Studios often share financial data with external accountants. A dedicated role provides:
- Read-only access to financial data
- Audit trail of accountant access
- No ability to modify operational data
- Export-only capabilities

**Access:**
- Financial reports (read-only)
- Transaction history (read-only)
- Payroll reports (read-only)
- Export all financial data
- **Cannot:** Modify any data, access student PII beyond transactions

**UI Access:**
- `/manage/financials` (read-only)
- `/manage/reports/exports`
- `/manage/reports` (financial reports only)
- Cannot see schedule, students, marketing

### Student

**Who:** Members, students, guests.

**Access:**
- Their own profile
- Class booking
- Purchase memberships/packs
- View their own history

**UI Access:**
- `/schedule`
- `/account/*`
- `/pricing`

---

## Feature Access Matrix

### Financial Features

| Feature | Owner | Admin | Manager | Accountant | Teacher | Front Desk |
|---------|-------|-------|---------|------------|---------|------------|
| View all revenue | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| View payroll (all staff) | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| View own pay | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Edit pay rates | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Process refunds | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export financial data | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| View commission models | ✅ | ✅ | ❌ | ✅ | Own only | ❌ |
| Configure Stripe | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Operational Features

| Feature | Owner | Admin | Manager | Accountant | Teacher | Front Desk |
|---------|-------|-------|---------|------------|---------|------------|
| Edit schedule | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cancel classes | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign subs | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Request sub | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Check-in students | ✅ | ✅ | ✅ | ❌ | Own classes | ✅ |
| View all students | ✅ | ✅ | ✅ | ❌ | Class roster | Basic |
| Edit student profiles | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Marketing Features

| Feature | Owner | Admin | Manager | Accountant | Teacher | Front Desk |
|---------|-------|-------|---------|------------|---------|------------|
| Landing pages | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Campaigns | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Promo codes | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| SEO settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Webhooks/API | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Reporting Features

| Feature | Owner | Admin | Manager | Accountant | Teacher | Front Desk |
|---------|-------|-------|---------|------------|---------|------------|
| Revenue reports | ✅ | ✅ | Summary | ✅ | ❌ | ❌ |
| Attendance reports | ✅ | ✅ | ✅ | ❌ | Own classes | ❌ |
| Teacher performance | ✅ | ✅ | ❌ | ❌ | Own | ❌ |
| Custom reports | ✅ | ✅ | Limited | Read-only | ❌ | ❌ |
| Export reports | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |

---

## Implementation Guidelines

### Route Protection

```typescript
// src/lib/auth/guards.ts

export function requireRole(minimumRole: UserRole) {
  return function guard(user: AuthUser | null, studioId: string): boolean {
    if (!user) return false;
    const studioRole = user.studio_roles.find(r => r.studio_id === studioId);
    if (!studioRole) return false;
    return hasMinimumRole(studioRole.role, minimumRole);
  };
}

// Usage in route component:
const FinancialsPage = () => {
  const { user, activeStudioId, hasRole } = useAuth();

  if (!hasRole('manager')) {
    return <Navigate to="/unauthorized" />;
  }

  // Render page...
};
```

### Component-Level Protection

```typescript
// Conditional rendering based on role
const DashboardPage = () => {
  const { hasRole } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Everyone sees basic stats */}
      <BasicStats />

      {/* Only managers+ see detailed metrics */}
      {hasRole('manager') && <DetailedMetrics />}

      {/* Only admins+ see revenue */}
      {hasRole('admin') && <RevenueWidget />}

      {/* Only owners see billing */}
      {hasRole('owner') && <BillingStatus />}
    </div>
  );
};
```

### API Endpoint Protection

```typescript
// src/api/routes/financials.ts

router.get('/revenue', requireAuth, requireRole('admin'), async (req, res) => {
  // Only admin+ can access
});

router.get('/my-earnings', requireAuth, requireRole('teacher'), async (req, res) => {
  // Teachers can see their own earnings
  const teacherId = req.user.id;
  const earnings = await getEarningsForTeacher(teacherId);
  res.json(earnings);
});

router.get('/all-earnings', requireAuth, requireRole('admin'), async (req, res) => {
  // Only admin+ can see all earnings
  const earnings = await getAllEarnings(req.studioId);
  res.json(earnings);
});
```

### RLS Policies

```sql
-- Row-level security for financial data
CREATE POLICY "Admins see all transactions"
  ON transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = transactions.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin', 'accountant')
    )
  );

-- Teachers only see transactions for students in their classes
CREATE POLICY "Teachers see class-related transactions"
  ON transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_occurrences co
      JOIN bookings b ON b.class_occurrence_id = co.id
      WHERE co.instructor_id = auth.uid()
        AND b.member_id = transactions.member_id
    )
  );
```

---

## Navigation by Role

### Owner/Admin Navigation

```
/manage
├── Dashboard
├── Schedule
├── Events
├── Students
├── Teachers
├── Offerings
├── Promo Codes
├── Financials
├── Products
├── Inventory
├── Purchase Orders
├── Landing Pages
├── UTM Builder
├── Campaigns
├── Tasks
├── Reports
│   └── Exports
├── Import Data
├── SMS Inbox
├── Notifications
└── Settings
    ├── General
    ├── Locations
    ├── Policies
    ├── Branding
    ├── Billing
    ├── Notifications
    ├── SEO
    └── Integrations
```

### Manager Navigation

```
/manage
├── Dashboard
├── Schedule
├── Events
├── Students
├── Tasks
├── Reports (limited)
└── Settings (limited)
```

### Accountant Navigation

```
/manage
├── Dashboard (financial widgets only)
├── Financials (read-only)
├── Reports
│   └── Exports
└── (no other pages)
```

### Teacher Navigation

```
/teach
├── Dashboard
├── Schedule
├── Classes
├── Subs
├── Earnings
└── Profile
```

### Front Desk Navigation

```
/manage
├── Dashboard (check-in widget)
├── Schedule (view only)
├── Students (basic)
└── Check-In Kiosk
```

---

## Audit Logging

All role-based actions should be logged:

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id),
  actor_id UUID NOT NULL REFERENCES profiles(id),
  actor_role TEXT NOT NULL,

  action TEXT NOT NULL,  -- 'view', 'create', 'update', 'delete', 'export'
  resource_type TEXT NOT NULL,  -- 'transaction', 'member', 'schedule'
  resource_id UUID,

  details JSONB,  -- Additional context
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying by actor or resource
CREATE INDEX idx_audit_log_actor ON audit_log(studio_id, actor_id, created_at DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(studio_id, resource_type, resource_id);
```

### What to Log

**Always log:**
- Financial data access (especially by accountant role)
- Data exports
- Role changes
- Settings changes
- Bulk operations
- Login/logout events

**Consider logging:**
- Sensitive data views (SSN, payment info)
- Failed authorization attempts
- Report generation

---

## Migration Path

### Adding Accountant Role

1. Update `UserRole` type:
```typescript
type UserRole = 'owner' | 'admin' | 'manager' | 'teacher' | 'front_desk' | 'accountant' | 'student';
```

2. Update role hierarchy in `hasRole`:
```typescript
const hierarchy: UserRole[] = [
  'owner',
  'admin',
  'manager',
  'accountant',  // New position
  'teacher',
  'front_desk',
  'student'
];
```

3. Create RLS policies for accountant access
4. Update navigation components
5. Add accountant-specific UI views

---

## Security Considerations

1. **Principle of Least Privilege:** Users should have minimum access needed
2. **Defense in Depth:** Check roles at route, API, and database levels
3. **Audit Everything:** Log all sensitive operations
4. **Review Regularly:** Quarterly review of role assignments
5. **Revoke Promptly:** Remove access immediately when staff leave

---

*Proper access control is essential for compliance and trust.*
