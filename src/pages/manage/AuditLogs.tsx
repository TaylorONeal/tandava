/**
 * Audit Log Viewer
 *
 * Enterprise-grade audit log viewer for compliance and security monitoring.
 * Supports filtering, search, and detailed change inspection.
 */

import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  type AuditLogEntry,
  type AuditCategory,
  type AuditAction,
  type AuditSeverity,
  type AuditChange,
  AUDIT_ACTION_DESCRIPTIONS,
  describeChanges,
} from '@/lib/audit-log';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    studioId: 'oxatl-yoga',
    category: 'auth',
    action: 'login',
    description: 'User logged in successfully',
    actorId: 'user-1',
    actorType: 'user',
    actorEmail: 'admin@oxatlyoga.com',
    actorRole: 'owner',
    severity: 'info',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    geoLocation: { country: 'US', region: 'TX', city: 'Austin' },
    timestamp: new Date('2026-02-06T14:30:00'),
    timestampMs: Date.now() - 1000 * 60 * 5,
  },
  {
    id: '2',
    studioId: 'oxatl-yoga',
    category: 'member',
    action: 'membership_started',
    description: 'New membership activated for Sarah Chen',
    actorId: 'user-1',
    actorType: 'user',
    actorEmail: 'admin@oxatlyoga.com',
    targetType: 'member',
    targetId: 'member-123',
    targetDescription: 'Sarah Chen',
    severity: 'info',
    timestamp: new Date('2026-02-06T14:25:00'),
    timestampMs: Date.now() - 1000 * 60 * 10,
  },
  {
    id: '3',
    studioId: 'oxatl-yoga',
    category: 'settings',
    action: 'setting_changed',
    description: 'Studio settings updated',
    actorId: 'user-1',
    actorType: 'user',
    actorEmail: 'admin@oxatlyoga.com',
    targetType: 'studio_settings',
    targetId: 'oxatl-yoga',
    changes: [
      { field: 'timezone', previousValue: 'America/Chicago', newValue: 'America/New_York', changeType: 'modified' },
      { field: 'booking_window_days', previousValue: 7, newValue: 14, changeType: 'modified' },
    ],
    severity: 'notice',
    timestamp: new Date('2026-02-06T13:15:00'),
    timestampMs: Date.now() - 1000 * 60 * 80,
  },
  {
    id: '4',
    studioId: 'oxatl-yoga',
    category: 'financial',
    action: 'refund_issued',
    description: 'Refund issued for cancelled class pack',
    actorId: 'user-1',
    actorType: 'user',
    actorEmail: 'admin@oxatlyoga.com',
    targetType: 'payment',
    targetId: 'pay-456',
    targetDescription: '$75.00 refund to card ending 4242',
    metadata: { amount: 7500, currency: 'USD', reason: 'Customer request' },
    severity: 'warning',
    timestamp: new Date('2026-02-06T11:00:00'),
    timestampMs: Date.now() - 1000 * 60 * 210,
  },
  {
    id: '5',
    studioId: 'oxatl-yoga',
    category: 'access',
    action: 'role_assigned',
    description: 'Staff role changed from Instructor to Manager',
    actorId: 'user-1',
    actorType: 'user',
    actorEmail: 'admin@oxatlyoga.com',
    targetType: 'staff',
    targetId: 'staff-789',
    targetDescription: 'Marcus Johnson',
    changes: [
      { field: 'role', previousValue: 'instructor', newValue: 'manager', changeType: 'modified' },
    ],
    severity: 'notice',
    timestamp: new Date('2026-02-06T10:30:00'),
    timestampMs: Date.now() - 1000 * 60 * 240,
  },
  {
    id: '6',
    studioId: 'oxatl-yoga',
    category: 'auth',
    action: 'login_failed',
    description: 'Failed login attempt - invalid password',
    actorId: null,
    actorType: 'user',
    actorEmail: 'unknown@example.com',
    severity: 'warning',
    ipAddress: '45.33.32.156',
    geoLocation: { country: 'RU', city: 'Moscow' },
    timestamp: new Date('2026-02-06T09:45:00'),
    timestampMs: Date.now() - 1000 * 60 * 285,
  },
  {
    id: '7',
    studioId: 'oxatl-yoga',
    category: 'access',
    action: 'access_denied',
    description: 'Unauthorized access attempt to admin settings',
    actorId: 'user-5',
    actorType: 'user',
    actorEmail: 'instructor@oxatlyoga.com',
    actorRole: 'instructor',
    targetType: 'page',
    targetDescription: '/manage/settings/billing',
    severity: 'critical',
    ipAddress: '192.168.1.105',
    timestamp: new Date('2026-02-06T08:20:00'),
    timestampMs: Date.now() - 1000 * 60 * 370,
  },
  {
    id: '8',
    studioId: 'oxatl-yoga',
    category: 'data',
    action: 'imported',
    description: 'Member data imported from CSV',
    actorId: 'user-1',
    actorType: 'user',
    actorEmail: 'admin@oxatlyoga.com',
    targetType: 'import_job',
    targetId: 'import-001',
    metadata: { recordCount: 156, source: 'mindbody', format: 'csv' },
    severity: 'info',
    timestamp: new Date('2026-02-05T16:00:00'),
    timestampMs: Date.now() - 1000 * 60 * 60 * 22,
  },
  {
    id: '9',
    studioId: 'oxatl-yoga',
    category: 'integration',
    action: 'sync_completed',
    description: 'Mailchimp sync completed successfully',
    actorId: null,
    actorType: 'system',
    targetType: 'integration',
    targetId: 'mailchimp',
    metadata: { contactsSynced: 342, listsUpdated: 3 },
    severity: 'info',
    timestamp: new Date('2026-02-05T04:00:00'),
    timestampMs: Date.now() - 1000 * 60 * 60 * 34,
  },
  {
    id: '10',
    studioId: 'oxatl-yoga',
    category: 'admin',
    action: 'impersonation_started',
    description: 'Admin started impersonating member account',
    actorId: 'super-admin',
    actorType: 'user',
    actorEmail: 'support@tandava.io',
    actorRole: 'super_admin',
    impersonatorId: 'super-admin',
    targetType: 'member',
    targetId: 'member-456',
    targetDescription: 'John Doe',
    severity: 'critical',
    ipAddress: '10.0.0.1',
    timestamp: new Date('2026-02-04T15:30:00'),
    timestampMs: Date.now() - 1000 * 60 * 60 * 47,
  },
];

// ============================================================================
// ICONS
// ============================================================================

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
  </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const GlobeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_LABELS: Record<AuditCategory, string> = {
  auth: 'Authentication',
  data: 'Data',
  settings: 'Settings',
  access: 'Access Control',
  financial: 'Financial',
  member: 'Member',
  staff: 'Staff',
  integration: 'Integration',
  export: 'Export',
  admin: 'Admin',
  system: 'System',
};

const CATEGORY_COLORS: Record<AuditCategory, string> = {
  auth: 'bg-blue-100 text-blue-700',
  data: 'bg-stone-100 text-stone-700',
  settings: 'bg-amber-100 text-amber-700',
  access: 'bg-red-100 text-red-700',
  financial: 'bg-emerald-100 text-emerald-700',
  member: 'bg-violet-100 text-violet-700',
  staff: 'bg-cyan-100 text-cyan-700',
  integration: 'bg-indigo-100 text-indigo-700',
  export: 'bg-pink-100 text-pink-700',
  admin: 'bg-orange-100 text-orange-700',
  system: 'bg-slate-100 text-slate-700',
};

const SEVERITY_CONFIG: Record<AuditSeverity, { label: string; color: string; dotColor: string }> = {
  info: { label: 'Info', color: 'text-stone-600', dotColor: 'bg-stone-400' },
  notice: { label: 'Notice', color: 'text-blue-600', dotColor: 'bg-blue-500' },
  warning: { label: 'Warning', color: 'text-amber-600', dotColor: 'bg-amber-500' },
  critical: { label: 'Critical', color: 'text-red-600', dotColor: 'bg-red-500' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatFullTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ============================================================================
// SEVERITY BADGE COMPONENT
// ============================================================================

function SeverityBadge({ severity }: { severity: AuditSeverity }) {
  const config = SEVERITY_CONFIG[severity];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}

// ============================================================================
// CATEGORY BADGE COMPONENT
// ============================================================================

function CategoryBadge({ category }: { category: AuditCategory }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[category]}`}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}

// ============================================================================
// FILTER PANEL COMPONENT
// ============================================================================

interface FilterPanelProps {
  filters: {
    category: AuditCategory | '';
    severity: AuditSeverity | '';
    dateRange: string;
  };
  onFilterChange: (filters: FilterPanelProps['filters']) => void;
}

function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <select
        value={filters.category}
        onChange={(e) => onFilterChange({ ...filters, category: e.target.value as AuditCategory | '' })}
        className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
      >
        <option value="">All Categories</option>
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <select
        value={filters.severity}
        onChange={(e) => onFilterChange({ ...filters, severity: e.target.value as AuditSeverity | '' })}
        className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
      >
        <option value="">All Severities</option>
        {Object.entries(SEVERITY_CONFIG).map(([value, config]) => (
          <option key={value} value={value}>{config.label}</option>
        ))}
      </select>

      <select
        value={filters.dateRange}
        onChange={(e) => onFilterChange({ ...filters, dateRange: e.target.value })}
        className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
      >
        <option value="24h">Last 24 hours</option>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
        <option value="all">All time</option>
      </select>
    </div>
  );
}

// ============================================================================
// LOG ENTRY ROW COMPONENT
// ============================================================================

interface LogEntryRowProps {
  entry: AuditLogEntry;
  onSelect: (entry: AuditLogEntry) => void;
  isSelected: boolean;
}

function LogEntryRow({ entry, onSelect, isSelected }: LogEntryRowProps) {
  const severityConfig = SEVERITY_CONFIG[entry.severity];

  return (
    <button
      onClick={() => onSelect(entry)}
      className={`
        w-full text-left px-4 py-3 border-b border-stone-100 hover:bg-stone-50
        transition-colors flex items-start gap-4
        ${isSelected ? 'bg-stone-100' : ''}
      `}
    >
      {/* Severity indicator */}
      <div className={`w-1 h-12 rounded-full ${severityConfig.dotColor} flex-shrink-0 mt-1`} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <CategoryBadge category={entry.category} />
          <span className="text-xs text-stone-500">{formatRelativeTime(entry.timestamp)}</span>
        </div>

        <p className="text-sm font-medium text-stone-900 truncate">
          {entry.description}
        </p>

        <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
          {entry.actorEmail && (
            <span className="flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              {entry.actorEmail}
            </span>
          )}
          {entry.actorType === 'system' && (
            <span className="flex items-center gap-1">
              <ShieldIcon className="w-3 h-3" />
              System
            </span>
          )}
          {entry.targetDescription && (
            <span className="truncate">
              Target: {entry.targetDescription}
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <ChevronRightIcon className="w-4 h-4 text-stone-400 flex-shrink-0 mt-4" />
    </button>
  );
}

// ============================================================================
// CHANGE DIFF COMPONENT
// ============================================================================

function ChangeDiff({ changes }: { changes: AuditChange[] }) {
  return (
    <div className="space-y-2">
      {changes.map((change, index) => (
        <div key={index} className="bg-stone-50 rounded-lg p-3">
          <p className="text-xs font-medium text-stone-500 mb-1">
            {change.fieldLabel || change.field}
          </p>
          <div className="flex items-center gap-2 text-sm">
            {change.changeType !== 'added' && (
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded line-through">
                {JSON.stringify(change.previousValue)}
              </span>
            )}
            {change.changeType === 'modified' && (
              <span className="text-stone-400">&rarr;</span>
            )}
            {change.changeType !== 'removed' && (
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                {JSON.stringify(change.newValue)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// DETAIL PANEL COMPONENT
// ============================================================================

interface DetailPanelProps {
  entry: AuditLogEntry;
  onClose: () => void;
}

function DetailPanel({ entry, onClose }: DetailPanelProps) {
  return (
    <div className="bg-white border-l border-stone-200 w-96 h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-stone-900">Event Details</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-stone-100 rounded transition-colors"
        >
          <XIcon className="w-5 h-5 text-stone-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Summary */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <SeverityBadge severity={entry.severity} />
            <CategoryBadge category={entry.category} />
          </div>
          <p className="text-sm font-medium text-stone-900">{entry.description}</p>
          <p className="text-xs text-stone-500 mt-1">
            {AUDIT_ACTION_DESCRIPTIONS[entry.action]}
          </p>
        </div>

        {/* Timestamp */}
        <div>
          <p className="text-xs font-medium text-stone-500 mb-1 flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            Timestamp
          </p>
          <p className="text-sm text-stone-900">{formatFullTimestamp(entry.timestamp)}</p>
        </div>

        {/* Actor */}
        <div>
          <p className="text-xs font-medium text-stone-500 mb-1 flex items-center gap-1">
            <UserIcon className="w-3 h-3" />
            Actor
          </p>
          <div className="text-sm text-stone-900">
            {entry.actorEmail || (entry.actorType === 'system' ? 'System' : 'Unknown')}
            {entry.actorRole && (
              <span className="text-stone-500 ml-1">({entry.actorRole})</span>
            )}
          </div>
          {entry.impersonatorId && (
            <p className="text-xs text-amber-600 mt-1">
              Impersonating user
            </p>
          )}
        </div>

        {/* Target */}
        {(entry.targetType || entry.targetDescription) && (
          <div>
            <p className="text-xs font-medium text-stone-500 mb-1">Target</p>
            <p className="text-sm text-stone-900">
              {entry.targetDescription || entry.targetId}
            </p>
            {entry.targetType && (
              <p className="text-xs text-stone-500 mt-0.5">
                Type: {entry.targetType}
              </p>
            )}
          </div>
        )}

        {/* Changes */}
        {entry.changes && entry.changes.length > 0 && (
          <div>
            <p className="text-xs font-medium text-stone-500 mb-2">Changes</p>
            <ChangeDiff changes={entry.changes} />
          </div>
        )}

        {/* Location */}
        {(entry.ipAddress || entry.geoLocation) && (
          <div>
            <p className="text-xs font-medium text-stone-500 mb-1 flex items-center gap-1">
              <GlobeIcon className="w-3 h-3" />
              Location
            </p>
            {entry.ipAddress && (
              <p className="text-sm text-stone-900 font-mono">{entry.ipAddress}</p>
            )}
            {entry.geoLocation && (
              <p className="text-xs text-stone-500 mt-0.5">
                {[entry.geoLocation.city, entry.geoLocation.region, entry.geoLocation.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Metadata */}
        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
          <div>
            <p className="text-xs font-medium text-stone-500 mb-2">Additional Data</p>
            <pre className="text-xs bg-stone-50 rounded-lg p-3 overflow-x-auto">
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
          </div>
        )}

        {/* IDs */}
        <div className="pt-4 border-t border-stone-200">
          <p className="text-xs text-stone-400">
            Event ID: <span className="font-mono">{entry.id}</span>
          </p>
          {entry.requestId && (
            <p className="text-xs text-stone-400 mt-1">
              Request ID: <span className="font-mono">{entry.requestId}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STATS CARDS
// ============================================================================

interface StatsCardsProps {
  logs: AuditLogEntry[];
}

function StatsCards({ logs }: StatsCardsProps) {
  const stats = useMemo(() => {
    const last24h = logs.filter(l => Date.now() - l.timestampMs < 86400000);
    const critical = logs.filter(l => l.severity === 'critical').length;
    const warnings = logs.filter(l => l.severity === 'warning').length;
    const authEvents = logs.filter(l => l.category === 'auth').length;

    return [
      { label: 'Events (24h)', value: last24h.length, color: 'text-stone-900' },
      { label: 'Critical', value: critical, color: critical > 0 ? 'text-red-600' : 'text-stone-900' },
      { label: 'Warnings', value: warnings, color: warnings > 0 ? 'text-amber-600' : 'text-stone-900' },
      { label: 'Auth Events', value: authEvents, color: 'text-blue-600' },
    ];
  }, [logs]);

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map(stat => (
        <div key={stat.label} className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-sm text-stone-500">{stat.label}</p>
          <p className={`mt-1 text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AuditLogs() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    category: AuditCategory | '';
    severity: AuditSeverity | '';
    dateRange: string;
  }>({
    category: '',
    severity: '',
    dateRange: '7d',
  });
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return mockAuditLogs.filter(log => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          log.description.toLowerCase().includes(query) ||
          log.actorEmail?.toLowerCase().includes(query) ||
          log.targetDescription?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && log.category !== filters.category) {
        return false;
      }

      // Severity filter
      if (filters.severity && log.severity !== filters.severity) {
        return false;
      }

      // Date range filter
      const now = Date.now();
      const ranges: Record<string, number> = {
        '24h': 86400000,
        '7d': 604800000,
        '30d': 2592000000,
        '90d': 7776000000,
      };
      if (filters.dateRange !== 'all' && ranges[filters.dateRange]) {
        if (now - log.timestampMs > ranges[filters.dateRange]) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, filters]);

  const handleExport = () => {
    toast({ title: "Exported", description: "Audit log data exported to CSV." });
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <ShieldIcon className="w-5 h-5" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
              </div>
              <p className="text-stone-300 max-w-xl">
                Track all activity across your studio. Monitor changes, access attempts,
                and security events for compliance and troubleshooting.
              </p>
            </div>

            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <DownloadIcon className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-10 w-full">
        <StatsCards logs={mockAuditLogs} />
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden flex h-[600px]">
          {/* Left panel - Log list */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Search and filters */}
            <div className="p-4 border-b border-stone-200 space-y-4">
              {/* Search */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                />
              </div>

              {/* Filters */}
              <FilterPanel filters={filters} onFilterChange={setFilters} />
            </div>

            {/* Log entries */}
            <div className="flex-1 overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-stone-500">
                  <FilterIcon className="w-12 h-12 mb-3 text-stone-300" />
                  <p className="font-medium">No matching logs</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                filteredLogs.map(entry => (
                  <LogEntryRow
                    key={entry.id}
                    entry={entry}
                    onSelect={setSelectedEntry}
                    isSelected={selectedEntry?.id === entry.id}
                  />
                ))
              )}
            </div>

            {/* Results count */}
            <div className="px-4 py-2 border-t border-stone-200 text-xs text-stone-500">
              Showing {filteredLogs.length} of {mockAuditLogs.length} events
            </div>
          </div>

          {/* Right panel - Detail view */}
          {selectedEntry && (
            <DetailPanel entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
          )}
        </div>
      </div>
    </div>
  );
}
