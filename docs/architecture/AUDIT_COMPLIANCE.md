# Audit Compliance Guide

Preparing Tandava for financial, security, and operational audits.

---

## Overview

This document covers requirements to pass common audits:
- **SOC 2 Type II** (Service Organization Control)
- **Financial Audits** (external accountant review)
- **PCI DSS** (Payment Card Industry, via Stripe)
- **GDPR/CCPA** (Privacy compliance)

---

## Current State Assessment

### ✅ Strong Areas

| Area | Status | Notes |
|------|--------|-------|
| Payment processing | ✅ | Stripe handles PCI compliance |
| Database encryption | ✅ | Supabase handles at-rest encryption |
| HTTPS everywhere | ✅ | Enforced by hosting |
| Row-level security | ✅ | Supabase RLS policies |
| Authentication | ✅ | Supabase Auth + MFA support |

### ⚠️ Needs Attention

| Area | Status | Recommendation |
|------|--------|----------------|
| Audit logging | ⚠️ | Implement comprehensive audit log |
| Role separation | ⚠️ | Add accountant role, refine permissions |
| Data retention | ⚠️ | Define and enforce retention policies |
| Access reviews | ⚠️ | Implement quarterly access reviews |
| Change management | ⚠️ | Document deployment procedures |
| Backup testing | ⚠️ | Test restore procedures quarterly |
| Incident response | ⚠️ | Document incident procedures |

### ❌ Missing

| Area | Status | Priority |
|------|--------|----------|
| Formal security policy | ❌ | High |
| Vendor management | ❌ | Medium |
| Business continuity plan | ❌ | Medium |
| Penetration testing | ❌ | Medium |

---

## Financial Audit Requirements

### Segregation of Duties

**Finding:** No segregation between who processes payments and who reconciles.

**Remediation:**
1. Add `accountant` role with read-only financial access
2. Require different users for:
   - Processing refunds (Manager+)
   - Approving refunds over $100 (Admin+)
   - Reconciling accounts (Accountant)
   - Exporting financial data (Owner/Accountant)

**Implementation:**
```sql
-- Add dual-approval for large refunds
CREATE TABLE refund_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id UUID NOT NULL REFERENCES refunds(id),
  requested_by UUID NOT NULL REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  amount_cents INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ
);

-- Refunds over $100 require approval
CREATE OR REPLACE FUNCTION check_refund_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount_cents > 10000 THEN  -- $100
    IF NOT EXISTS (
      SELECT 1 FROM refund_approvals
      WHERE refund_id = NEW.id AND status = 'approved'
    ) THEN
      RAISE EXCEPTION 'Refunds over $100 require approval';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Audit Trail

**Finding:** Insufficient logging of financial transactions and access.

**Remediation:**
Implement comprehensive audit logging:

```sql
-- Core audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id),

  -- Actor
  actor_id UUID REFERENCES profiles(id),  -- NULL for system actions
  actor_role TEXT,
  actor_email TEXT,

  -- Action
  action TEXT NOT NULL,  -- 'view', 'create', 'update', 'delete', 'export', 'approve'
  category TEXT NOT NULL,  -- 'financial', 'member_data', 'settings', 'auth'

  -- Resource
  resource_type TEXT NOT NULL,
  resource_id UUID,
  resource_name TEXT,

  -- Details
  changes JSONB,  -- { before: {}, after: {} }
  metadata JSONB,  -- Additional context

  -- Request info
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Partition by month for performance
CREATE INDEX idx_audit_log_studio_date ON audit_log(studio_id, created_at DESC);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id, created_at DESC);
CREATE INDEX idx_audit_log_category ON audit_log(category, created_at DESC);
```

**Events to log:**

| Category | Events |
|----------|--------|
| `auth` | login, logout, failed_login, password_change, mfa_enable, mfa_disable |
| `financial` | transaction_created, refund_issued, refund_approved, payout_received, export_generated |
| `member_data` | profile_viewed, profile_updated, profile_deleted, data_exported |
| `settings` | setting_changed, role_assigned, role_removed, webhook_created |
| `schedule` | class_cancelled, sub_assigned, schedule_changed |

### Reconciliation Controls

**Finding:** No automated reconciliation between system and payment processor.

**Remediation:**
1. Implement daily automated reconciliation job
2. Alert on discrepancies over $10
3. Require manual review of all discrepancies

```typescript
// Daily reconciliation job
async function runDailyReconciliation(studioId: string) {
  const yesterday = subDays(new Date(), 1);

  // Get Tandava transactions
  const tandavaTotal = await db.query(`
    SELECT SUM(total_cents) as total
    FROM transactions
    WHERE studio_id = $1
      AND DATE(created_at) = $2
      AND status = 'completed'
  `, [studioId, yesterday]);

  // Get Stripe charges
  const stripeCharges = await stripe.charges.list({
    created: {
      gte: startOfDay(yesterday).getTime() / 1000,
      lt: endOfDay(yesterday).getTime() / 1000,
    },
  });

  const stripeTotal = stripeCharges.data
    .filter(c => c.status === 'succeeded')
    .reduce((sum, c) => sum + c.amount, 0);

  // Check for discrepancy
  const discrepancy = Math.abs(tandavaTotal - stripeTotal);

  if (discrepancy > 1000) { // $10
    await createReconciliationAlert({
      studioId,
      date: yesterday,
      tandavaTotal,
      stripeTotal,
      discrepancy,
    });
  }

  // Log reconciliation
  await createAuditLog({
    studioId,
    action: 'reconciliation_completed',
    category: 'financial',
    metadata: { tandavaTotal, stripeTotal, discrepancy },
  });
}
```

---

## Security Audit Requirements

### Access Control

**Finding:** Permissions too broad; no principle of least privilege.

**Remediation:**
1. Implement granular permissions (see ROLE_ACCESS_CONTROL.md)
2. Default new users to minimum permissions
3. Require justification for elevated access
4. Quarterly access reviews

```sql
-- Track access review status
CREATE TABLE access_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id),
  review_date DATE NOT NULL,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),

  -- Summary
  users_reviewed INTEGER DEFAULT 0,
  access_changes_made INTEGER DEFAULT 0,
  notes TEXT,

  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual review items
CREATE TABLE access_review_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES access_reviews(id),
  user_id UUID NOT NULL REFERENCES profiles(id),

  current_role TEXT NOT NULL,
  recommended_role TEXT,
  action_taken TEXT CHECK (action_taken IN ('no_change', 'elevated', 'reduced', 'removed')),
  justification TEXT,

  reviewed_at TIMESTAMPTZ
);
```

### Session Management

**Finding:** No session timeout; no concurrent session limits.

**Remediation:**
```typescript
// Session configuration
const SESSION_CONFIG = {
  maxAge: 8 * 60 * 60 * 1000,  // 8 hours
  idleTimeout: 30 * 60 * 1000,  // 30 minutes idle
  maxConcurrentSessions: 3,
  requireReauthForSensitive: true,  // Re-auth for financial operations
};

// Force re-authentication for sensitive operations
async function requireRecentAuth(userId: string) {
  const session = await getSession(userId);
  const lastAuth = new Date(session.last_authenticated_at);
  const fiveMinutesAgo = subMinutes(new Date(), 5);

  if (lastAuth < fiveMinutesAgo) {
    throw new ReauthenticationRequired();
  }
}
```

### Data Encryption

**Finding:** Sensitive fields not encrypted at application level.

**Remediation:**
```sql
-- Use pgcrypto for sensitive fields
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt SSN/EIN for teachers
ALTER TABLE staff_profiles
  ADD COLUMN ssn_encrypted BYTEA,
  ADD COLUMN ssn_hash TEXT;  -- For lookups

-- Encryption function
CREATE OR REPLACE FUNCTION encrypt_sensitive(data TEXT, key TEXT)
RETURNS BYTEA AS $$
  SELECT pgp_sym_encrypt(data, key);
$$ LANGUAGE sql;

-- Decryption function (requires key)
CREATE OR REPLACE FUNCTION decrypt_sensitive(data BYTEA, key TEXT)
RETURNS TEXT AS $$
  SELECT pgp_sym_decrypt(data, key);
$$ LANGUAGE sql;
```

---

## Data Privacy Compliance (GDPR/CCPA)

### Data Inventory

Document all personal data collected:

| Data Type | Purpose | Retention | Legal Basis |
|-----------|---------|-----------|-------------|
| Name, email | Account, communication | Active + 7 years | Contract |
| Payment info | Billing | Stripe handles | Contract |
| Class attendance | Service delivery | Active + 7 years | Contract |
| Health info (injuries) | Safety | Active + 3 years | Consent |
| Location data | Check-in | 30 days | Consent |
| Marketing preferences | Email campaigns | Until withdrawn | Consent |

### Data Subject Rights

Implement handlers for:

| Right | Implementation |
|-------|----------------|
| Access | `/api/member/data-export` - Generate full data export |
| Rectification | `/account/profile` - Self-service profile editing |
| Erasure | `/api/member/delete-request` - Start deletion process |
| Portability | JSON/CSV export in standard format |
| Objection | `/account/preferences` - Marketing opt-out |

```typescript
// Data export endpoint
router.get('/api/member/data-export', requireAuth, async (req, res) => {
  const memberId = req.user.id;

  // Gather all member data
  const data = {
    profile: await getProfile(memberId),
    bookings: await getBookings(memberId),
    transactions: await getTransactions(memberId),
    memberships: await getMemberships(memberId),
    preferences: await getPreferences(memberId),
    audit_log: await getAuditLog(memberId),  // Their own access log
  };

  // Log the export
  await createAuditLog({
    actorId: memberId,
    action: 'data_export',
    category: 'member_data',
    resourceType: 'profile',
    resourceId: memberId,
  });

  res.json(data);
});
```

### Data Retention

```sql
-- Automated retention enforcement
CREATE OR REPLACE FUNCTION enforce_retention_policies()
RETURNS void AS $$
BEGIN
  -- Delete old audit logs (keep 3 years)
  DELETE FROM audit_log
  WHERE created_at < NOW() - INTERVAL '3 years';

  -- Anonymize old members (inactive 7+ years)
  UPDATE profiles
  SET
    first_name = 'Deleted',
    last_name = 'User',
    email = 'deleted_' || id || '@deleted.local',
    phone = NULL,
    date_of_birth = NULL,
    emergency_contact_name = NULL,
    emergency_contact_phone = NULL,
    is_anonymized = true,
    anonymized_at = NOW()
  WHERE id IN (
    SELECT DISTINCT p.id
    FROM profiles p
    LEFT JOIN bookings b ON b.member_id = p.id
    LEFT JOIN memberships m ON m.member_id = p.id
    WHERE p.is_anonymized = false
      AND (b.id IS NULL OR b.created_at < NOW() - INTERVAL '7 years')
      AND (m.id IS NULL OR m.ended_at < NOW() - INTERVAL '7 years')
  );

  -- Log retention execution
  INSERT INTO audit_log (action, category, metadata)
  VALUES ('retention_policy_executed', 'system', jsonb_build_object(
    'executed_at', NOW()
  ));
END;
$$ LANGUAGE plpgsql;

-- Run monthly
SELECT cron.schedule('retention-policy', '0 3 1 * *', 'SELECT enforce_retention_policies()');
```

---

## Audit Checklist

### Pre-Audit Preparation

**Documentation:**
- [ ] Security policy document
- [ ] Incident response plan
- [ ] Business continuity plan
- [ ] Data retention policy
- [ ] Access control matrix
- [ ] Change management procedures

**Technical:**
- [ ] Audit logging enabled and tested
- [ ] Backup restoration tested (within 30 days)
- [ ] Vulnerability scan completed
- [ ] Access reviews current (within 90 days)
- [ ] Session timeout configured
- [ ] MFA enabled for admin accounts

**Operational:**
- [ ] All staff have signed security acknowledgment
- [ ] Terminated employees' access removed promptly
- [ ] Third-party vendor list current
- [ ] Insurance coverage verified

### Common Audit Findings to Avoid

| Finding | Prevention |
|---------|------------|
| "No audit trail for financial transactions" | Implement comprehensive audit logging |
| "Excessive user permissions" | Implement least privilege, quarterly reviews |
| "No segregation of duties" | Add accountant role, dual approval for large refunds |
| "Backup restoration not tested" | Schedule quarterly restore tests |
| "No incident response plan" | Document and practice incident procedures |
| "Session timeout not enforced" | Configure 30-minute idle timeout |
| "Sensitive data not encrypted" | Encrypt PII at application level |
| "No vulnerability scanning" | Schedule quarterly scans |

---

## Incident Response

### Classification

| Severity | Description | Response Time |
|----------|-------------|---------------|
| Critical | Data breach, system down | Immediate (24/7) |
| High | Security vulnerability, data loss risk | 4 hours |
| Medium | Minor security issue, isolated impact | 24 hours |
| Low | Policy violation, no immediate risk | 72 hours |

### Response Procedures

1. **Identify:** Detect and classify the incident
2. **Contain:** Limit damage, preserve evidence
3. **Eradicate:** Remove threat, patch vulnerability
4. **Recover:** Restore services, verify integrity
5. **Lessons Learned:** Document and improve

### Breach Notification

**GDPR:** Notify supervisory authority within 72 hours
**CCPA:** Notify affected California residents "in the most expedient time possible"

```typescript
// Breach notification workflow
async function handleDataBreach(breach: DataBreach) {
  // 1. Document immediately
  await createIncident({
    type: 'data_breach',
    severity: 'critical',
    description: breach.description,
    affectedRecords: breach.affectedCount,
    detectedAt: new Date(),
  });

  // 2. Notify leadership
  await sendAlert({
    to: ['owner', 'admin'],
    subject: 'CRITICAL: Data Breach Detected',
    body: breach.summary,
  });

  // 3. Start 72-hour timer for GDPR notification
  await scheduleTask({
    task: 'gdpr_breach_notification',
    dueAt: addHours(new Date(), 72),
    data: { incidentId: breach.incidentId },
  });

  // 4. Identify affected users
  const affectedUsers = await identifyAffectedUsers(breach);

  // 5. Prepare notification templates
  await prepareBreachNotifications(affectedUsers, breach);
}
```

---

## Continuous Compliance

### Automated Monitoring

```typescript
// Daily compliance checks
const COMPLIANCE_CHECKS = [
  {
    name: 'admin_mfa_enabled',
    query: `
      SELECT COUNT(*) FROM studio_staff ss
      JOIN auth.users u ON ss.profile_id = u.id
      WHERE ss.role IN ('owner', 'admin')
        AND u.mfa_enabled = false
    `,
    threshold: 0,
    severity: 'high',
  },
  {
    name: 'access_review_current',
    query: `
      SELECT COUNT(*) FROM studios s
      WHERE NOT EXISTS (
        SELECT 1 FROM access_reviews ar
        WHERE ar.studio_id = s.id
          AND ar.completed_at > NOW() - INTERVAL '90 days'
      )
    `,
    threshold: 0,
    severity: 'medium',
  },
  {
    name: 'backup_tested_recently',
    query: `
      SELECT COUNT(*) FROM backup_tests
      WHERE completed_at > NOW() - INTERVAL '30 days'
        AND status = 'success'
    `,
    threshold: 1,  // At least 1 successful test
    severity: 'high',
  },
];
```

### Quarterly Tasks

- [ ] Access review for all studios
- [ ] Backup restoration test
- [ ] Vulnerability scan
- [ ] Review and update security documentation
- [ ] Third-party vendor review
- [ ] Incident response drill

---

*Compliance is not a destination but a continuous journey.*
