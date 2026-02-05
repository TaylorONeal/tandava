-- Migration 005: Connector Infrastructure
-- Comprehensive import, sync, and export connector system
-- Supports: one-time migrations, ongoing sync, scheduled exports, GDPR compliance

-- ============================================================================
-- CONNECTOR REGISTRY
-- Central registry of all available connectors and their configurations
-- ============================================================================

CREATE TYPE connector_type AS ENUM (
  'import',           -- One-time data import (onboarding)
  'export',           -- One-time or scheduled data export
  'sync_inbound',     -- External system → Tandava (ClassPass, Gympass)
  'sync_outbound',    -- Tandava → External system (CRM, accounting)
  'sync_bidirectional' -- Two-way sync (calendar, marketing)
);

CREATE TYPE connector_category AS ENUM (
  'migration',        -- Competitor platform migrations
  'marketplace',      -- ClassPass, Gympass, etc.
  'calendar',         -- Google Calendar, Apple Calendar, Outlook
  'crm',              -- Mailchimp, HubSpot, Klaviyo
  'accounting',       -- QuickBooks, Xero, FreshBooks
  'communication',    -- Twilio, SendGrid, Slack
  'payment',          -- Stripe, Square (beyond Connect)
  'access_control',   -- Kisi, door systems
  'analytics',        -- Google Analytics, Meta Pixel
  'compliance',       -- GDPR exports, audit logs
  'custom'            -- Webhooks, Zapier, custom APIs
);

CREATE TYPE connector_status AS ENUM (
  'available',        -- Can be configured
  'configured',       -- Credentials entered, not active
  'active',           -- Currently syncing
  'paused',           -- Temporarily disabled
  'error',            -- In error state
  'deprecated'        -- No longer supported
);

-- Master connector definitions (system-wide, not per-studio)
CREATE TABLE connector_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  slug TEXT UNIQUE NOT NULL,  -- 'mindbody-import', 'classpass-sync'
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,

  -- Classification
  connector_type connector_type NOT NULL,
  category connector_category NOT NULL,

  -- Capabilities
  supported_entities TEXT[] NOT NULL DEFAULT '{}',  -- ['members', 'bookings', 'transactions']
  supports_dry_run BOOLEAN DEFAULT true,
  supports_incremental BOOLEAN DEFAULT false,  -- Can sync only changes
  supports_scheduled BOOLEAN DEFAULT false,

  -- Version awareness for migrations
  known_versions TEXT[] DEFAULT '{}',  -- ['2023', '2024', '2025'] for format detection

  -- Configuration schema (JSON Schema for validation)
  config_schema JSONB DEFAULT '{}',
  credentials_schema JSONB DEFAULT '{}',  -- What auth is needed

  -- Documentation
  setup_guide_url TEXT,
  export_instructions TEXT,  -- How to export from source system

  -- Status
  is_enabled BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,  -- Enterprise only

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- STUDIO CONNECTOR INSTANCES
-- Per-studio configuration of connectors
-- ============================================================================

CREATE TABLE studio_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  connector_definition_id UUID NOT NULL REFERENCES connector_definitions(id),

  -- Status
  status connector_status DEFAULT 'configured',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,

  -- Configuration
  config JSONB DEFAULT '{}',  -- Non-sensitive settings
  credentials_encrypted TEXT,  -- Encrypted API keys, tokens

  -- Sync settings
  sync_frequency_minutes INTEGER,  -- null = manual only
  sync_direction TEXT CHECK (sync_direction IN ('push', 'pull', 'both')),
  entity_filters JSONB DEFAULT '{}',  -- Which entities to sync

  -- Mapping overrides
  field_mappings JSONB DEFAULT '{}',  -- Custom field mappings beyond defaults

  -- Audit
  configured_by UUID REFERENCES profiles(id),
  configured_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, connector_definition_id)
);

-- ============================================================================
-- IMPORT JOBS (Enhanced from Migration 001)
-- Detailed tracking of import operations
-- ============================================================================

CREATE TYPE import_job_status AS ENUM (
  'pending',
  'validating',
  'dry_run',
  'dry_run_complete',
  'importing',
  'processing',
  'complete',
  'partial',
  'failed',
  'cancelled'
);

CREATE TABLE import_jobs_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  connector_id UUID REFERENCES studio_connectors(id),

  -- What was imported
  source_type TEXT NOT NULL,  -- 'mindbody', 'walla', 'csv', etc.
  source_version TEXT,  -- Detected format version
  entity_type TEXT NOT NULL,  -- 'members', 'attendance', 'transactions', 'offerings'

  -- File info
  original_filename TEXT,
  file_storage_path TEXT,  -- Supabase Storage path
  file_size_bytes BIGINT,
  file_hash TEXT,  -- For duplicate detection

  -- Status tracking
  status import_job_status DEFAULT 'pending',
  is_dry_run BOOLEAN DEFAULT false,

  -- Mapping used
  column_mappings JSONB NOT NULL DEFAULT '{}',
  transformation_rules JSONB DEFAULT '{}',  -- Date formats, phone normalization, etc.

  -- Progress
  total_rows INTEGER,
  processed_rows INTEGER DEFAULT 0,
  progress_percent NUMERIC(5,2) DEFAULT 0,

  -- Results
  imported_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,  -- Existing records updated
  skipped_count INTEGER DEFAULT 0,  -- Duplicates skipped
  error_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual row-level results for imports
CREATE TABLE import_row_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES import_jobs_v2(id) ON DELETE CASCADE,

  row_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('imported', 'updated', 'skipped', 'error', 'warning')),

  -- Source data snapshot
  source_data JSONB,

  -- Result
  target_entity_type TEXT,  -- 'studio_members', 'profiles', etc.
  target_entity_id UUID,    -- ID of created/updated record

  -- Issues
  error_message TEXT,
  warning_messages TEXT[],

  -- Duplicate handling
  duplicate_of_id UUID,
  duplicate_match_field TEXT,  -- 'email', 'phone', 'external_id'

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_import_row_results_job ON import_row_results(job_id);
CREATE INDEX idx_import_row_results_status ON import_row_results(job_id, status);

-- ============================================================================
-- DATA QUALITY REPORTS
-- Pre-import analysis of data quality
-- ============================================================================

CREATE TABLE import_quality_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES import_jobs_v2(id) ON DELETE CASCADE,

  -- Overall scores (0-100)
  overall_score INTEGER,
  completeness_score INTEGER,  -- Required fields filled
  validity_score INTEGER,      -- Valid formats
  uniqueness_score INTEGER,    -- No duplicates
  consistency_score INTEGER,   -- Consistent formatting

  -- Field-level analysis
  field_analysis JSONB NOT NULL DEFAULT '{}',
  /* Example:
  {
    "email": {
      "filled_count": 340,
      "empty_count": 7,
      "valid_count": 338,
      "invalid_samples": ["not-an-email", "test@"],
      "duplicate_count": 3
    },
    "phone": {
      "filled_count": 280,
      "empty_count": 67,
      "formats_detected": ["+1 (xxx) xxx-xxxx", "xxx-xxx-xxxx"],
      "invalid_samples": ["123", "phone here"]
    }
  }
  */

  -- Issues summary
  critical_issues JSONB[] DEFAULT '{}',  -- Blockers
  warnings JSONB[] DEFAULT '{}',         -- Non-blocking
  suggestions JSONB[] DEFAULT '{}',      -- Improvements

  -- Duplicate analysis
  potential_duplicates JSONB[] DEFAULT '{}',
  /* Example:
  [
    {
      "rows": [45, 128],
      "match_field": "email",
      "match_value": "emma@example.com",
      "recommendation": "merge"
    }
  ]
  */

  -- Existing data conflicts
  existing_matches_count INTEGER DEFAULT 0,
  existing_matches_sample JSONB[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- EXPORT JOBS
-- Track all data exports
-- ============================================================================

CREATE TYPE export_job_status AS ENUM (
  'pending',
  'generating',
  'complete',
  'failed',
  'expired'
);

CREATE TYPE export_format AS ENUM (
  'csv',
  'xlsx',
  'json',
  'pdf',
  'quickbooks_iif',
  'xero_csv'
);

CREATE TABLE export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  connector_id UUID REFERENCES studio_connectors(id),

  -- What's being exported
  export_type TEXT NOT NULL,  -- 'members', 'transactions', 'gdpr_full', 'payroll', 'accounting'
  entity_filters JSONB DEFAULT '{}',  -- Date range, status filters, etc.

  -- Format
  format export_format NOT NULL,
  include_headers BOOLEAN DEFAULT true,

  -- Options
  date_range_start DATE,
  date_range_end DATE,
  include_deleted BOOLEAN DEFAULT false,
  anonymize_pii BOOLEAN DEFAULT false,  -- For analytics exports

  -- Status
  status export_job_status DEFAULT 'pending',

  -- File info
  file_storage_path TEXT,
  file_size_bytes BIGINT,
  download_url TEXT,
  download_expires_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Audit
  requested_by UUID REFERENCES profiles(id),
  request_reason TEXT,  -- Required for GDPR exports
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SCHEDULED EXPORTS
-- Recurring export configurations
-- ============================================================================

CREATE TABLE scheduled_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- What to export
  name TEXT NOT NULL,
  export_type TEXT NOT NULL,
  entity_filters JSONB DEFAULT '{}',
  format export_format NOT NULL,

  -- Schedule (cron-like)
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
  day_of_week INTEGER,  -- 0-6 for weekly
  day_of_month INTEGER, -- 1-31 for monthly
  time_of_day TIME DEFAULT '06:00:00',
  timezone TEXT DEFAULT 'UTC',

  -- Delivery
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'sftp', 'webhook', 'storage')),
  delivery_config JSONB NOT NULL DEFAULT '{}',
  /* Examples:
  {"email": "owner@studio.com", "cc": ["accountant@studio.com"]}
  {"sftp_host": "ftp.accounting.com", "path": "/imports/"}
  {"webhook_url": "https://zapier.com/hooks/..."}
  */

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  next_run_at TIMESTAMPTZ,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SYNC OPERATIONS LOG
-- Track all sync operations for bidirectional connectors
-- ============================================================================

CREATE TYPE sync_direction AS ENUM ('inbound', 'outbound');

CREATE TABLE sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  connector_id UUID NOT NULL REFERENCES studio_connectors(id) ON DELETE CASCADE,

  -- Operation details
  direction sync_direction NOT NULL,
  entity_type TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('scheduled', 'manual', 'webhook', 'realtime')),

  -- Scope
  is_full_sync BOOLEAN DEFAULT false,
  incremental_since TIMESTAMPTZ,

  -- Results
  status TEXT NOT NULL CHECK (status IN ('running', 'complete', 'partial', 'failed')),
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_deleted INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,

  -- Errors
  error_summary JSONB DEFAULT '{}',

  -- Timing
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Cursor for incremental sync
  sync_cursor TEXT  -- Platform-specific cursor for next sync
);

CREATE INDEX idx_sync_operations_connector ON sync_operations(connector_id, started_at DESC);

-- ============================================================================
-- ENTITY SYNC MAPPING
-- Track which Tandava entities map to which external IDs
-- ============================================================================

CREATE TABLE entity_sync_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  connector_id UUID NOT NULL REFERENCES studio_connectors(id) ON DELETE CASCADE,

  -- Tandava side
  entity_type TEXT NOT NULL,  -- 'studio_members', 'bookings', 'transactions'
  entity_id UUID NOT NULL,

  -- External side
  external_id TEXT NOT NULL,
  external_data_hash TEXT,  -- To detect external changes

  -- Sync state
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_push', 'pending_pull', 'conflict')),
  conflict_data JSONB,  -- Both versions if conflict

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(connector_id, entity_type, entity_id),
  UNIQUE(connector_id, entity_type, external_id)
);

CREATE INDEX idx_entity_sync_mappings_external ON entity_sync_mappings(connector_id, external_id);

-- ============================================================================
-- GDPR DATA REQUESTS
-- Track data subject access requests
-- ============================================================================

CREATE TYPE gdpr_request_type AS ENUM (
  'access',     -- Right to access (export all data)
  'rectification', -- Right to correct
  'erasure',    -- Right to be forgotten
  'portability' -- Right to data portability
);

CREATE TYPE gdpr_request_status AS ENUM (
  'pending',
  'processing',
  'awaiting_verification',
  'complete',
  'rejected'
);

CREATE TABLE gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Requestor
  profile_id UUID REFERENCES profiles(id),  -- If authenticated
  email TEXT NOT NULL,
  verification_token TEXT,
  verified_at TIMESTAMPTZ,

  -- Request details
  request_type gdpr_request_type NOT NULL,
  status gdpr_request_status DEFAULT 'pending',

  -- Processing
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- For access/portability: export job
  export_job_id UUID REFERENCES export_jobs(id),

  -- For erasure: what was deleted
  erasure_log JSONB,
  /* Example:
  {
    "tables_affected": ["profiles", "bookings", "transactions"],
    "records_anonymized": 1,
    "records_deleted": 47,
    "retained_for_legal": ["transactions"]  -- Must keep for tax
  }
  */

  -- Audit
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- Legal retention
  must_retain_until DATE  -- For legal compliance
);

-- ============================================================================
-- SEED CONNECTOR DEFINITIONS
-- ============================================================================

INSERT INTO connector_definitions (slug, name, description, connector_type, category, supported_entities, supports_dry_run, known_versions, export_instructions) VALUES

-- Migration Connectors (Import)
('mindbody-import', 'MindBody Migration', 'Import clients, attendance, and transactions from MindBody CSV exports', 'import', 'migration',
 ARRAY['members', 'attendance', 'transactions', 'offerings', 'memberships'], true,
 ARRAY['2022', '2023', '2024', '2025'],
 'In MindBody: Go to Reports > Clients > Export. Select "All Clients" and download as CSV. For attendance, go to Reports > Sales > Classes/Appointments.'),

('walla-import', 'Walla Migration', 'Import studio data from Walla CSV exports', 'import', 'migration',
 ARRAY['members', 'attendance', 'transactions', 'memberships'], true,
 ARRAY['2023', '2024', '2025'],
 'In Walla: Go to Settings > Data Export > Select data type > Download CSV.'),

('momence-import', 'Momence Migration', 'Import studio data from Momence exports', 'import', 'migration',
 ARRAY['members', 'attendance', 'transactions', 'offerings', 'memberships'], true,
 ARRAY['2023', '2024', '2025'],
 'In Momence: Go to Settings > Data & Integrations > Export Data. Select the data type and date range.'),

('arketa-import', 'Arketa Migration', 'Import studio data from Arketa exports', 'import', 'migration',
 ARRAY['members', 'attendance', 'transactions', 'offerings'], true,
 ARRAY['2023', '2024', '2025'],
 'In Arketa: Go to Settings > Export Data. Choose export type and format.'),

('wellnessliving-import', 'WellnessLiving Migration', 'Import studio data from WellnessLiving exports', 'import', 'migration',
 ARRAY['members', 'attendance', 'transactions', 'offerings', 'memberships', 'staff'], true,
 ARRAY['2023', '2024', '2025'],
 'In WellnessLiving: Go to Setup > Business Data > Export. Select data type.'),

('mariana-tek-import', 'Mariana Tek Migration', 'Import studio data from Mariana Tek exports', 'import', 'migration',
 ARRAY['members', 'attendance', 'transactions', 'offerings'], true,
 ARRAY['2023', '2024', '2025'],
 'Contact Mariana Tek support to request a data export.'),

('generic-csv-import', 'Generic CSV', 'Import data from any CSV file with manual column mapping', 'import', 'migration',
 ARRAY['members', 'attendance', 'transactions', 'offerings', 'staff'], true,
 ARRAY[],
 'Export data from your current system as CSV. Any CSV format is supported with manual column mapping.'),

-- Marketplace Connectors (Bidirectional Sync)
('classpass-sync', 'ClassPass', 'Accept bookings from ClassPass members', 'sync_inbound', 'marketplace',
 ARRAY['bookings', 'checkins'], false, ARRAY[],
 NULL),

('gympass-sync', 'Gympass', 'Accept bookings from Gympass corporate members', 'sync_inbound', 'marketplace',
 ARRAY['bookings', 'checkins'], false, ARRAY[],
 NULL),

-- Calendar Connectors (Bidirectional)
('google-calendar', 'Google Calendar', 'Sync classes and bookings to Google Calendar', 'sync_bidirectional', 'calendar',
 ARRAY['classes', 'bookings'], false, ARRAY[],
 NULL),

('apple-calendar', 'Apple Calendar', 'Sync classes and bookings via iCal feed', 'sync_outbound', 'calendar',
 ARRAY['classes', 'bookings'], false, ARRAY[],
 NULL),

('outlook-calendar', 'Outlook Calendar', 'Sync classes and bookings to Microsoft Outlook', 'sync_bidirectional', 'calendar',
 ARRAY['classes', 'bookings'], false, ARRAY[],
 NULL),

-- CRM/Marketing Connectors (Bidirectional)
('mailchimp', 'Mailchimp', 'Sync contacts and segments to Mailchimp for email marketing', 'sync_bidirectional', 'crm',
 ARRAY['members', 'segments', 'tags'], false, ARRAY[],
 NULL),

('klaviyo', 'Klaviyo', 'Sync customer data to Klaviyo for advanced email/SMS marketing', 'sync_bidirectional', 'crm',
 ARRAY['members', 'events', 'segments'], false, ARRAY[],
 NULL),

('hubspot', 'HubSpot', 'Sync contacts and deals to HubSpot CRM', 'sync_bidirectional', 'crm',
 ARRAY['members', 'transactions'], false, ARRAY[],
 NULL),

-- Accounting Connectors (Outbound)
('quickbooks-online', 'QuickBooks Online', 'Export transactions and invoices to QuickBooks', 'sync_outbound', 'accounting',
 ARRAY['transactions', 'invoices', 'payroll'], false, ARRAY[],
 NULL),

('xero', 'Xero', 'Export transactions and invoices to Xero', 'sync_outbound', 'accounting',
 ARRAY['transactions', 'invoices', 'payroll'], false, ARRAY[],
 NULL),

('freshbooks', 'FreshBooks', 'Export invoices to FreshBooks', 'sync_outbound', 'accounting',
 ARRAY['invoices'], false, ARRAY[],
 NULL),

-- Communication Connectors
('twilio', 'Twilio', 'Send SMS notifications via Twilio', 'sync_outbound', 'communication',
 ARRAY['notifications'], false, ARRAY[],
 NULL),

('sendgrid', 'SendGrid', 'Send transactional emails via SendGrid', 'sync_outbound', 'communication',
 ARRAY['notifications'], false, ARRAY[],
 NULL),

('slack', 'Slack', 'Send alerts and notifications to Slack channels', 'sync_outbound', 'communication',
 ARRAY['alerts', 'bookings'], false, ARRAY[],
 NULL),

-- Access Control
('kisi', 'Kisi', 'Control door access based on memberships and bookings', 'sync_outbound', 'access_control',
 ARRAY['members', 'access_grants'], false, ARRAY[],
 NULL),

-- Analytics Connectors
('google-analytics', 'Google Analytics', 'Track website and booking conversions', 'sync_outbound', 'analytics',
 ARRAY['events', 'conversions'], false, ARRAY[],
 NULL),

('meta-pixel', 'Meta Pixel', 'Track Facebook/Instagram ad conversions', 'sync_outbound', 'analytics',
 ARRAY['events', 'conversions'], false, ARRAY[],
 NULL),

-- Custom/Automation Connectors
('zapier', 'Zapier', 'Connect to 5000+ apps via Zapier', 'sync_bidirectional', 'custom',
 ARRAY['members', 'bookings', 'transactions', 'events'], false, ARRAY[],
 NULL),

('custom-webhook', 'Custom Webhook', 'Send events to your own webhook endpoints', 'sync_outbound', 'custom',
 ARRAY['all'], false, ARRAY[],
 NULL),

-- Compliance/Export
('gdpr-export', 'GDPR Data Export', 'Export all data for a specific user (data subject access request)', 'export', 'compliance',
 ARRAY['full_profile'], true, ARRAY[],
 NULL),

('full-backup', 'Full Data Backup', 'Export all studio data for backup or migration', 'export', 'compliance',
 ARRAY['all'], true, ARRAY[],
 NULL);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE connector_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_row_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_quality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_sync_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;

-- Connector definitions are public (read-only)
CREATE POLICY "Connector definitions are readable by all"
  ON connector_definitions FOR SELECT
  USING (is_enabled = true);

-- Studio connectors: only studio staff can manage
CREATE POLICY "Studio staff can manage connectors"
  ON studio_connectors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = studio_connectors.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin')
    )
  );

-- Import jobs: studio staff can view and create
CREATE POLICY "Studio staff can manage imports"
  ON import_jobs_v2 FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = import_jobs_v2.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin')
    )
  );

-- Import row results follow job access
CREATE POLICY "Import row results follow job access"
  ON import_row_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM import_jobs_v2 j
      JOIN studio_staff ss ON ss.studio_id = j.studio_id
      WHERE j.id = import_row_results.job_id
        AND ss.profile_id = auth.uid()
        AND ss.role IN ('owner', 'admin')
    )
  );

-- Quality reports follow job access
CREATE POLICY "Quality reports follow job access"
  ON import_quality_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM import_jobs_v2 j
      JOIN studio_staff ss ON ss.studio_id = j.studio_id
      WHERE j.id = import_quality_reports.job_id
        AND ss.profile_id = auth.uid()
        AND ss.role IN ('owner', 'admin')
    )
  );

-- Export jobs: studio staff can manage
CREATE POLICY "Studio staff can manage exports"
  ON export_jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = export_jobs.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin')
    )
  );

-- Scheduled exports: studio staff can manage
CREATE POLICY "Studio staff can manage scheduled exports"
  ON scheduled_exports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = scheduled_exports.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin')
    )
  );

-- Sync operations: studio staff can view
CREATE POLICY "Studio staff can view sync operations"
  ON sync_operations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = sync_operations.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin')
    )
  );

-- Entity sync mappings: studio staff can view
CREATE POLICY "Studio staff can view sync mappings"
  ON entity_sync_mappings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = entity_sync_mappings.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin')
    )
  );

-- GDPR requests: studio admins and the subject themselves
CREATE POLICY "GDPR requests visible to admins and subject"
  ON gdpr_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = gdpr_requests.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin')
    )
    OR gdpr_requests.profile_id = auth.uid()
  );

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_studio_connectors_studio ON studio_connectors(studio_id);
CREATE INDEX idx_studio_connectors_status ON studio_connectors(status) WHERE status = 'active';
CREATE INDEX idx_import_jobs_v2_studio ON import_jobs_v2(studio_id, created_at DESC);
CREATE INDEX idx_import_jobs_v2_status ON import_jobs_v2(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_export_jobs_studio ON export_jobs(studio_id, created_at DESC);
CREATE INDEX idx_export_jobs_status ON export_jobs(status) WHERE status = 'pending';
CREATE INDEX idx_scheduled_exports_next_run ON scheduled_exports(next_run_at) WHERE is_active = true;
CREATE INDEX idx_gdpr_requests_email ON gdpr_requests(email);
