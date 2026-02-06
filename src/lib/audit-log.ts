/**
 * Audit Log System
 *
 * Enterprise-grade audit logging for compliance and security.
 * Tracks all changes to data with who, what, when, where, and why.
 *
 * Designed for:
 * - SOC 2 compliance
 * - GDPR data access logging
 * - HIPAA audit trails (for wellness/health studios)
 * - Internal security and troubleshooting
 *
 * Future: Can be exported to specialized data systems (BigQuery, Snowflake)
 * for large-scale analysis and long-term retention.
 */

// ============================================================================
// AUDIT EVENT TYPES
// ============================================================================

export type AuditCategory =
  | 'auth'           // Login, logout, password changes
  | 'data'           // CRUD operations on records
  | 'settings'       // Configuration changes
  | 'access'         // Access control changes
  | 'financial'      // Payments, refunds, billing changes
  | 'member'         // Member-related actions
  | 'staff'          // Staff-related actions
  | 'integration'    // Third-party integrations
  | 'export'         // Data exports
  | 'admin'          // Administrative actions
  | 'system';        // System events

export type AuditAction =
  // Auth
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_changed'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'session_expired'

  // Data CRUD
  | 'created'
  | 'updated'
  | 'deleted'
  | 'archived'
  | 'restored'
  | 'imported'
  | 'merged'

  // Access
  | 'role_assigned'
  | 'role_removed'
  | 'permission_granted'
  | 'permission_revoked'
  | 'access_denied'

  // Settings
  | 'setting_changed'
  | 'feature_enabled'
  | 'feature_disabled'

  // Financial
  | 'payment_processed'
  | 'refund_issued'
  | 'subscription_created'
  | 'subscription_cancelled'
  | 'price_changed'

  // Member
  | 'membership_started'
  | 'membership_paused'
  | 'membership_resumed'
  | 'membership_cancelled'
  | 'class_booked'
  | 'class_cancelled'
  | 'checked_in'

  // Staff
  | 'staff_added'
  | 'staff_removed'
  | 'payroll_calculated'
  | 'schedule_assigned'

  // Integration
  | 'integration_connected'
  | 'integration_disconnected'
  | 'webhook_sent'
  | 'webhook_received'
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'

  // Export
  | 'data_exported'
  | 'report_generated'
  | 'gdpr_request_submitted'
  | 'gdpr_request_completed'

  // Admin
  | 'impersonation_started'
  | 'impersonation_ended'
  | 'studio_created'
  | 'studio_suspended'
  | 'studio_deleted'

  // System
  | 'migration_completed'
  | 'backup_created'
  | 'maintenance_started'
  | 'maintenance_ended';

// ============================================================================
// AUDIT LOG ENTRY
// ============================================================================

export interface AuditLogEntry {
  id: string;
  studioId: string | null;  // null for system-wide events

  // What happened
  category: AuditCategory;
  action: AuditAction;
  description: string;

  // Who did it
  actorId: string | null;      // null for system actions
  actorType: 'user' | 'system' | 'api' | 'webhook' | 'cron';
  actorEmail?: string;         // For easy lookup (denormalized)
  actorRole?: string;          // Role at time of action
  impersonatorId?: string;     // If someone was impersonating

  // What was affected
  targetType?: string;         // 'member', 'booking', 'payment', etc.
  targetId?: string;           // ID of the affected record
  targetDescription?: string;  // Human-readable description

  // Change details
  changes?: AuditChange[];     // Detailed field-level changes
  previousState?: Record<string, unknown>;  // Snapshot before (for critical changes)
  newState?: Record<string, unknown>;       // Snapshot after (for critical changes)

  // Context
  requestId?: string;          // Trace ID for request correlation
  sessionId?: string;          // User session
  ipAddress?: string;
  userAgent?: string;
  geoLocation?: {
    country?: string;
    region?: string;
    city?: string;
  };

  // Classification
  severity: AuditSeverity;
  tags?: string[];

  // Metadata
  metadata?: Record<string, unknown>;

  // Timestamps
  timestamp: Date;
  timestampMs: number;         // For precise ordering
}

export interface AuditChange {
  field: string;
  fieldLabel?: string;         // Human-readable field name
  previousValue: unknown;
  newValue: unknown;
  changeType: 'added' | 'removed' | 'modified';
}

export type AuditSeverity =
  | 'info'      // Normal operations
  | 'notice'    // Notable but not concerning
  | 'warning'   // Potentially concerning
  | 'critical'; // Security or compliance concern

// ============================================================================
// AUDIT LOG SERVICE
// ============================================================================

export interface CreateAuditLogParams {
  studioId?: string;
  category: AuditCategory;
  action: AuditAction;
  description: string;

  actorId?: string;
  actorType?: 'user' | 'system' | 'api' | 'webhook' | 'cron';

  targetType?: string;
  targetId?: string;
  targetDescription?: string;

  changes?: AuditChange[];
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;

  severity?: AuditSeverity;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

// Helper to create audit log entries
export function createAuditLog(
  params: CreateAuditLogParams,
  context?: AuditContext
): AuditLogEntry {
  const now = new Date();

  return {
    id: crypto.randomUUID(),
    studioId: params.studioId || null,

    category: params.category,
    action: params.action,
    description: params.description,

    actorId: params.actorId || context?.userId || null,
    actorType: params.actorType || 'user',
    actorEmail: context?.userEmail,
    actorRole: context?.userRole,
    impersonatorId: context?.impersonatorId,

    targetType: params.targetType,
    targetId: params.targetId,
    targetDescription: params.targetDescription,

    changes: params.changes,
    previousState: params.previousState,
    newState: params.newState,

    requestId: context?.requestId,
    sessionId: context?.sessionId,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
    geoLocation: context?.geoLocation,

    severity: params.severity || 'info',
    tags: params.tags,
    metadata: params.metadata,

    timestamp: now,
    timestampMs: now.getTime(),
  };
}

export interface AuditContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  impersonatorId?: string;
  requestId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  geoLocation?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

// ============================================================================
// CHANGE TRACKING HELPERS
// ============================================================================

/**
 * Compare two objects and return the changes
 */
export function computeChanges(
  previous: Record<string, unknown>,
  current: Record<string, unknown>,
  fieldLabels?: Record<string, string>
): AuditChange[] {
  const changes: AuditChange[] = [];
  const allKeys = new Set([...Object.keys(previous), ...Object.keys(current)]);

  for (const key of allKeys) {
    const prevValue = previous[key];
    const currValue = current[key];

    // Skip if values are the same
    if (JSON.stringify(prevValue) === JSON.stringify(currValue)) {
      continue;
    }

    // Skip internal fields
    if (key.startsWith('_') || key === 'updated_at' || key === 'created_at') {
      continue;
    }

    const change: AuditChange = {
      field: key,
      fieldLabel: fieldLabels?.[key],
      previousValue: prevValue,
      newValue: currValue,
      changeType: prevValue === undefined
        ? 'added'
        : currValue === undefined
          ? 'removed'
          : 'modified',
    };

    changes.push(change);
  }

  return changes;
}

/**
 * Get human-readable description of changes
 */
export function describeChanges(changes: AuditChange[]): string {
  if (changes.length === 0) return 'No changes';
  if (changes.length === 1) {
    const c = changes[0];
    const fieldName = c.fieldLabel || c.field;
    switch (c.changeType) {
      case 'added':
        return `Added ${fieldName}`;
      case 'removed':
        return `Removed ${fieldName}`;
      case 'modified':
        return `Changed ${fieldName}`;
    }
  }
  return `Changed ${changes.length} fields: ${changes.map(c => c.fieldLabel || c.field).join(', ')}`;
}

// ============================================================================
// SENSITIVE DATA HANDLING
// ============================================================================

// Fields that should be masked in audit logs
const SENSITIVE_FIELDS = new Set([
  'password',
  'password_hash',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'secret',
  'ssn',
  'social_security',
  'credit_card',
  'card_number',
  'cvv',
  'bank_account',
  'routing_number',
]);

// Fields that should be redacted entirely
const REDACTED_FIELDS = new Set([
  'password',
  'password_hash',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'secret',
]);

/**
 * Mask sensitive values in audit log data
 */
export function maskSensitiveData(
  data: Record<string, unknown>,
  options?: { redact?: boolean }
): Record<string, unknown> {
  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const keyLower = key.toLowerCase();

    if (REDACTED_FIELDS.has(keyLower)) {
      if (options?.redact) {
        // Completely omit
        continue;
      }
      masked[key] = '[REDACTED]';
    } else if (SENSITIVE_FIELDS.has(keyLower)) {
      if (typeof value === 'string' && value.length > 4) {
        masked[key] = `***${value.slice(-4)}`;
      } else {
        masked[key] = '***';
      }
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value as Record<string, unknown>, options);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

export interface AuditLogQuery {
  studioId?: string;
  category?: AuditCategory | AuditCategory[];
  action?: AuditAction | AuditAction[];
  actorId?: string;
  targetType?: string;
  targetId?: string;
  severity?: AuditSeverity | AuditSeverity[];
  startDate?: Date;
  endDate?: Date;
  searchText?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  orderBy?: 'timestamp' | 'severity';
  orderDirection?: 'asc' | 'desc';
}

// ============================================================================
// RETENTION POLICIES
// ============================================================================

export interface AuditRetentionPolicy {
  category: AuditCategory;
  retentionDays: number;
  archiveAfterDays?: number;  // Move to cold storage
  compressAfterDays?: number; // Compress old logs
}

// Default retention policies (can be customized per studio)
export const DEFAULT_RETENTION_POLICIES: AuditRetentionPolicy[] = [
  { category: 'auth', retentionDays: 365, archiveAfterDays: 90 },
  { category: 'access', retentionDays: 730, archiveAfterDays: 180 },
  { category: 'financial', retentionDays: 2555, archiveAfterDays: 365 }, // 7 years for tax
  { category: 'data', retentionDays: 365, archiveAfterDays: 90 },
  { category: 'settings', retentionDays: 365, archiveAfterDays: 90 },
  { category: 'member', retentionDays: 365, archiveAfterDays: 90 },
  { category: 'staff', retentionDays: 365, archiveAfterDays: 90 },
  { category: 'integration', retentionDays: 180, archiveAfterDays: 60 },
  { category: 'export', retentionDays: 730, archiveAfterDays: 180 },
  { category: 'admin', retentionDays: 730, archiveAfterDays: 180 },
  { category: 'system', retentionDays: 90, archiveAfterDays: 30 },
];

// ============================================================================
// COMPLIANCE HELPERS
// ============================================================================

/**
 * Generate audit log export for compliance (GDPR, SOC 2, etc.)
 */
export function generateComplianceExport(
  logs: AuditLogEntry[],
  format: 'json' | 'csv'
): string {
  if (format === 'json') {
    return JSON.stringify(logs, null, 2);
  }

  // CSV format
  const headers = [
    'timestamp',
    'category',
    'action',
    'description',
    'actor_id',
    'actor_email',
    'actor_type',
    'target_type',
    'target_id',
    'severity',
    'ip_address',
    'changes_summary',
  ];

  const rows = logs.map(log => [
    log.timestamp.toISOString(),
    log.category,
    log.action,
    `"${log.description.replace(/"/g, '""')}"`,
    log.actorId || '',
    log.actorEmail || '',
    log.actorType,
    log.targetType || '',
    log.targetId || '',
    log.severity,
    log.ipAddress || '',
    log.changes ? `"${describeChanges(log.changes).replace(/"/g, '""')}"` : '',
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// ============================================================================
// EVENT DESCRIPTIONS (for consistent messaging)
// ============================================================================

export const AUDIT_ACTION_DESCRIPTIONS: Record<AuditAction, string> = {
  // Auth
  login: 'User logged in',
  logout: 'User logged out',
  login_failed: 'Failed login attempt',
  password_changed: 'Password changed',
  password_reset_requested: 'Password reset requested',
  password_reset_completed: 'Password reset completed',
  mfa_enabled: 'Multi-factor authentication enabled',
  mfa_disabled: 'Multi-factor authentication disabled',
  session_expired: 'Session expired',

  // Data
  created: 'Record created',
  updated: 'Record updated',
  deleted: 'Record deleted',
  archived: 'Record archived',
  restored: 'Record restored',
  imported: 'Data imported',
  merged: 'Records merged',

  // Access
  role_assigned: 'Role assigned',
  role_removed: 'Role removed',
  permission_granted: 'Permission granted',
  permission_revoked: 'Permission revoked',
  access_denied: 'Access denied',

  // Settings
  setting_changed: 'Setting changed',
  feature_enabled: 'Feature enabled',
  feature_disabled: 'Feature disabled',

  // Financial
  payment_processed: 'Payment processed',
  refund_issued: 'Refund issued',
  subscription_created: 'Subscription created',
  subscription_cancelled: 'Subscription cancelled',
  price_changed: 'Price changed',

  // Member
  membership_started: 'Membership started',
  membership_paused: 'Membership paused',
  membership_resumed: 'Membership resumed',
  membership_cancelled: 'Membership cancelled',
  class_booked: 'Class booked',
  class_cancelled: 'Class booking cancelled',
  checked_in: 'Checked in to class',

  // Staff
  staff_added: 'Staff member added',
  staff_removed: 'Staff member removed',
  payroll_calculated: 'Payroll calculated',
  schedule_assigned: 'Schedule assigned',

  // Integration
  integration_connected: 'Integration connected',
  integration_disconnected: 'Integration disconnected',
  webhook_sent: 'Webhook sent',
  webhook_received: 'Webhook received',
  sync_started: 'Sync started',
  sync_completed: 'Sync completed',
  sync_failed: 'Sync failed',

  // Export
  data_exported: 'Data exported',
  report_generated: 'Report generated',
  gdpr_request_submitted: 'GDPR request submitted',
  gdpr_request_completed: 'GDPR request completed',

  // Admin
  impersonation_started: 'Impersonation started',
  impersonation_ended: 'Impersonation ended',
  studio_created: 'Studio created',
  studio_suspended: 'Studio suspended',
  studio_deleted: 'Studio deleted',

  // System
  migration_completed: 'Migration completed',
  backup_created: 'Backup created',
  maintenance_started: 'Maintenance started',
  maintenance_ended: 'Maintenance ended',
};
