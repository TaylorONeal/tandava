# Reliability Engineering Guide

How to keep Tandava running reliably for studios that depend on it for their business.

## Table of Contents
1. [Reliability Principles](#reliability-principles)
2. [Infrastructure Architecture](#infrastructure-architecture)
3. [Monitoring & Alerting](#monitoring--alerting)
4. [Error Handling](#error-handling)
5. [Data Backup & Recovery](#data-backup--recovery)
6. [Incident Response](#incident-response)
7. [Performance Budgets](#performance-budgets)

---

## Reliability Principles

### Target SLA

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Uptime** | 99.9% | Monthly (43 min downtime max) |
| **API Latency (p50)** | < 100ms | Per request |
| **API Latency (p99)** | < 500ms | Per request |
| **Error Rate** | < 0.1% | Per request |
| **Data Durability** | 99.999999999% | Annual (11 nines) |

### Critical Paths

These paths must NEVER fail:

1. **Class Booking** - Member → Schedule → Book → Confirmation
2. **Check-in** - Instructor → Class → Mark Attendance
3. **Payment Processing** - Checkout → Payment → Confirmation
4. **Authentication** - Login → Session → Access

### Non-Critical (Graceful Degradation)

These can fail gracefully:

- Analytics dashboards (show cached data)
- Recommendations (hide section)
- Push notifications (queue for later)
- On-demand video (show error, allow retry)

---

## Infrastructure Architecture

### High-Availability Setup

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │   (CDN + WAF)   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
        │  Vercel   │  │  Vercel   │  │  Vercel   │
        │  Edge A   │  │  Edge B   │  │  Edge C   │
        └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │    Supabase     │
                    │  (PostgreSQL)   │
                    │  Multi-AZ       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   S3 / R2       │
                    │   (Assets)      │
                    │   Replicated    │
                    └─────────────────┘
```

### Redundancy Layers

1. **DNS**: Cloudflare with automatic failover
2. **CDN**: Multi-region edge caching
3. **Compute**: Serverless functions auto-scale
4. **Database**: PostgreSQL with streaming replication
5. **Storage**: S3 cross-region replication

### Failure Domains

| Component | Failure Impact | Mitigation |
|-----------|----------------|------------|
| Vercel Edge | Regional slowdown | Multi-region deployment |
| Supabase Primary | Read-only mode | Read replicas + failover |
| Supabase Replica | Increased latency | Multiple replicas |
| Cloudflare | Global outage | Backup DNS provider |
| Payment Provider | Can't checkout | Queue + retry, show error |

---

## Monitoring & Alerting

### Metrics to Track

#### Application Metrics

```typescript
// Key metrics to instrument
const metrics = {
  // Request metrics
  requestCount: Counter,
  requestDuration: Histogram,
  requestErrors: Counter,

  // Business metrics
  bookingsCreated: Counter,
  checkinsCompleted: Counter,
  paymentsProcessed: Counter,
  paymentFailures: Counter,

  // Resource metrics
  databaseConnections: Gauge,
  cacheHitRate: Gauge,
  queueDepth: Gauge,
};
```

#### Infrastructure Metrics

- CPU utilization
- Memory usage
- Database connections
- Query latency (p50, p95, p99)
- Error rates by endpoint
- Cache hit/miss ratio

### Alert Thresholds

```yaml
# Example alerting rules

- name: HighErrorRate
  condition: error_rate > 1%
  duration: 5m
  severity: critical
  notification: pagerduty

- name: SlowAPIResponses
  condition: p99_latency > 2s
  duration: 10m
  severity: warning
  notification: slack

- name: DatabaseConnectionsHigh
  condition: db_connections > 80%
  duration: 5m
  severity: warning
  notification: slack

- name: PaymentFailuresSpike
  condition: payment_failures > 5 in 10m
  duration: 1m
  severity: critical
  notification: pagerduty
```

### Recommended Tools

| Category | Tool | Purpose |
|----------|------|---------|
| APM | Sentry | Error tracking, performance |
| Metrics | Prometheus / Grafana | Time series, dashboards |
| Logs | Loki / CloudWatch | Log aggregation |
| Uptime | Better Stack | External monitoring |
| Alerts | PagerDuty | On-call rotation |

---

## Error Handling

### Error Classification

```typescript
// src/lib/errors.ts

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

// Operational errors (expected, handle gracefully)
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400, true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409, true);
  }
}

// Programming errors (unexpected, crash and restart)
export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR', 500, false);
  }
}
```

### Error Handling Patterns

```typescript
// API error boundary
async function handleRequest(req, res) {
  try {
    const result = await processRequest(req);
    res.json(result);
  } catch (error) {
    if (error instanceof AppError && error.isOperational) {
      // Expected error, return to client
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      });
    } else {
      // Unexpected error, log and return generic
      console.error('Unexpected error:', error);
      Sentry.captureException(error);

      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      });
    }
  }
}
```

### Retry Strategies

```typescript
// Exponential backoff for external services
async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryable(error)) throw error;

      const delay = Math.min(
        options.baseDelay * Math.pow(2, attempt),
        options.maxDelay
      );

      await sleep(delay + Math.random() * 1000);
    }
  }

  throw lastError;
}

// Usage
const result = await withRetry(
  () => stripeClient.charges.create(params),
  { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
);
```

---

## Data Backup & Recovery

### Backup Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                     Backup Tiers                             │
├─────────────────────────────────────────────────────────────┤
│  Tier 1: Real-time replication (streaming)                  │
│  ├── Supabase read replicas                                 │
│  └── RPO: ~0 seconds, RTO: < 5 minutes                      │
│                                                              │
│  Tier 2: Point-in-time recovery (daily snapshots)           │
│  ├── Automated daily backups                                │
│  └── RPO: 24 hours, RTO: < 1 hour                          │
│                                                              │
│  Tier 3: Long-term archive (weekly)                         │
│  ├── Encrypted backups to cold storage                      │
│  └── Retention: 1 year                                      │
└─────────────────────────────────────────────────────────────┘
```

### Recovery Procedures

#### 1. Point-in-Time Recovery

```bash
# Restore to specific timestamp
supabase db restore \
  --target-time "2026-02-05T14:30:00Z" \
  --dry-run  # Preview first

# Execute restore
supabase db restore \
  --target-time "2026-02-05T14:30:00Z" \
  --confirm
```

#### 2. Full Database Restore

```bash
# List available backups
supabase db backups list

# Restore from backup
supabase db restore --backup-id <id>
```

#### 3. Table-Level Recovery

```sql
-- Restore single table from backup
-- 1. Create temp database from backup
-- 2. Export specific table
-- 3. Import into production

pg_dump -t bookings backup_db > bookings_backup.sql
psql production_db < bookings_backup.sql
```

### Testing Backups

**Monthly backup verification:**

1. Restore backup to test environment
2. Run data integrity checks
3. Verify application functionality
4. Document results
5. Fix any issues found

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **SEV1** | Service down | 15 minutes | Cannot book classes, payments failing |
| **SEV2** | Major degradation | 1 hour | Slow responses, feature broken |
| **SEV3** | Minor issue | 4 hours | UI bug, non-critical feature |
| **SEV4** | Low priority | 24 hours | Cosmetic issues, minor inconvenience |

### Incident Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Detect    │────▶│   Triage    │────▶│   Mitigate  │
│ (Alert/User)│     │  (On-call)  │     │  (Fix/Roll) │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Close    │◀────│   Verify    │◀────│ Communicate │
│ (Post-mort) │     │   (Test)    │     │  (Status)   │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Status Communication

```markdown
# Status Page Template

## [Service Name] Incident
**Status**: Investigating / Identified / Monitoring / Resolved
**Impact**: Booking system is unavailable
**Started**: 2026-02-06 14:30 UTC

### Updates

**15:00 UTC** - Issue identified as database connection exhaustion.
Rolling restart in progress.

**14:45 UTC** - We are investigating reports of failed bookings.
Our team is actively working on this issue.

**14:30 UTC** - We are aware of issues affecting the booking system.
More updates to follow.
```

### Post-Incident Review

Template for post-mortems:

```markdown
# Post-Incident Review: [Brief Title]

**Date**: 2026-02-06
**Duration**: 45 minutes
**Severity**: SEV1
**Author**: [Name]

## Summary
Brief 2-3 sentence summary of what happened.

## Timeline
- 14:30 - First alert triggered
- 14:35 - On-call engineer paged
- 14:45 - Root cause identified
- 15:00 - Fix deployed
- 15:15 - All systems normal

## Root Cause
Technical explanation of what caused the incident.

## Impact
- X bookings failed
- Y users affected
- Z minutes of downtime

## What Went Well
- Quick detection
- Clear communication
- Fast mitigation

## What Needs Improvement
- Better monitoring for X
- Runbook for Y scenario
- Auto-scaling for Z

## Action Items
- [ ] Add alert for database connections (owner, due date)
- [ ] Update runbook with this scenario (owner, due date)
- [ ] Implement connection pooling (owner, due date)
```

---

## Performance Budgets

### Page Load Budgets

| Metric | Budget | Measurement |
|--------|--------|-------------|
| Time to First Byte (TTFB) | < 200ms | Server response |
| First Contentful Paint (FCP) | < 1.8s | First visible content |
| Largest Contentful Paint (LCP) | < 2.5s | Main content loaded |
| Cumulative Layout Shift (CLS) | < 0.1 | Visual stability |
| Time to Interactive (TTI) | < 3.5s | Fully interactive |

### Bundle Size Budgets

```javascript
// vite.config.ts - bundle analysis
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    visualizer({
      filename: 'bundle-analysis.html',
      gzipSize: true,
    }),
  ],
};
```

| Bundle | Budget | Current |
|--------|--------|---------|
| Main JS | < 200KB gzip | Check with build |
| Main CSS | < 50KB gzip | Check with build |
| Vendor JS | < 150KB gzip | Check with build |
| Total Initial | < 400KB gzip | Check with build |

### Database Query Budgets

| Query Type | Budget | Action if Exceeded |
|------------|--------|-------------------|
| Simple read | < 10ms | Investigate |
| Complex read | < 100ms | Add index or optimize |
| Write | < 50ms | Check constraints |
| Aggregate | < 500ms | Consider caching |

---

*Last Updated: February 2026*
