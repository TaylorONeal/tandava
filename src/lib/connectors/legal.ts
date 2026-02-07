/**
 * Connector Legal Disclaimers
 *
 * IMPORTANT: Tandava provides data import/export tools for interoperability.
 * We are NOT affiliated with, endorsed by, or connected to any third-party
 * software providers. These connectors are provided under fair use for the
 * purpose of enabling data portability for users migrating their own data.
 *
 * All product names, logos, and brands are property of their respective owners.
 */

// ============================================================================
// LEGAL DISCLAIMERS
// ============================================================================

export const CONNECTOR_LEGAL_NOTICE = `
**Data Import Disclaimer**

Tandava provides import tools to help you migrate YOUR OWN data from other
studio management platforms. By using these tools, you confirm that:

1. You have the legal right to export and import this data
2. The data belongs to you or your business
3. You are not violating any terms of service or data protection laws
4. You have obtained any necessary consent from data subjects (e.g., members)

Tandava is an independent, open-source project. We are NOT affiliated with,
endorsed by, sponsored by, or officially connected with any of the platforms
listed below. All product names, logos, and brands mentioned are trademarks
of their respective owners.

These import tools are provided "as is" for data portability purposes under
applicable data protection regulations (e.g., GDPR Article 20, CCPA).
`.trim();

export const CONNECTOR_SHORT_DISCLAIMER = `
Tandava is not affiliated with this provider. Import tools are provided for
data portability purposes only. All trademarks are property of their respective owners.
`.trim();

// ============================================================================
// PROVIDER METADATA
// ============================================================================

export interface ConnectorProviderInfo {
  id: string;
  name: string;
  officialName: string;
  website: string;
  trademark: string;
  description: string;
  disclaimer: string;
  supportedEntities: string[];
  exportInstructions: string;
  knownFormats: ConnectorFormat[];
  lastUpdated: string;
}

export interface ConnectorFormat {
  version: string;
  dateRange: string;
  description: string;
  columnSignatures: string[];  // Unique columns that identify this format
}

export const CONNECTOR_PROVIDERS: Record<string, ConnectorProviderInfo> = {
  mindbody: {
    id: 'mindbody',
    name: 'MindBody Import',
    officialName: 'MINDBODY, Inc.',
    website: 'https://www.mindbodyonline.com',
    trademark: 'MINDBODY® is a registered trademark of MINDBODY, Inc.',
    description: 'Import client data, attendance history, and transactions from MindBody CSV exports.',
    disclaimer: 'This import tool is provided for data portability. Tandava is not affiliated with, endorsed by, or connected to MINDBODY, Inc. in any way.',
    supportedEntities: ['members', 'attendance', 'transactions', 'offerings', 'memberships', 'staff'],
    exportInstructions: `
**How to export your data from MindBody:**

1. Log in to your MindBody business portal
2. Navigate to **Reports** in the main menu
3. For client data:
   - Go to **Reports > Clients > Client List**
   - Set your date range and filters
   - Click **Export** and choose **CSV**
4. For attendance:
   - Go to **Reports > Sales > Classes/Appointments**
   - Select your date range
   - Click **Export** and choose **CSV**
5. For transactions:
   - Go to **Reports > Sales > Transactions**
   - Select your date range
   - Click **Export** and choose **CSV**

*Note: Export format may vary by MindBody version and your subscription level.*
    `.trim(),
    knownFormats: [
      {
        version: '2025',
        dateRange: '2024-present',
        description: 'Current MindBody export format',
        columnSignatures: ['Client ID', 'First Name', 'Last Name', 'Email', 'Home Phone', 'Mobile Phone'],
      },
      {
        version: '2023',
        dateRange: '2022-2024',
        description: 'Legacy MindBody format',
        columnSignatures: ['ClientID', 'FirstName', 'LastName', 'Email', 'Phone'],
      },
    ],
    lastUpdated: '2025-02-06',
  },

  walla: {
    id: 'walla',
    name: 'Walla Import',
    officialName: 'Walla',
    website: 'https://www.hellowalla.com',
    trademark: 'Walla™ is a trademark of Walla.',
    description: 'Import member data and booking history from Walla CSV exports.',
    disclaimer: 'This import tool is provided for data portability. Tandava is not affiliated with, endorsed by, or connected to Walla in any way.',
    supportedEntities: ['members', 'attendance', 'transactions', 'memberships'],
    exportInstructions: `
**How to export your data from Walla:**

1. Log in to your Walla dashboard
2. Go to **Settings** (gear icon)
3. Navigate to **Data Export**
4. Select the data type you want to export:
   - Members
   - Bookings/Attendance
   - Transactions
5. Choose your date range
6. Click **Download CSV**

*Contact Walla support if you need additional export options.*
    `.trim(),
    knownFormats: [
      {
        version: '2025',
        dateRange: '2024-present',
        description: 'Current Walla export format',
        columnSignatures: ['member_id', 'first_name', 'last_name', 'email', 'phone_number'],
      },
    ],
    lastUpdated: '2025-02-06',
  },

  momence: {
    id: 'momence',
    name: 'Momence Import',
    officialName: 'Momence',
    website: 'https://www.momence.com',
    trademark: 'Momence™ is a trademark of Momence.',
    description: 'Import client data, bookings, and financial records from Momence exports.',
    disclaimer: 'This import tool is provided for data portability. Tandava is not affiliated with, endorsed by, or connected to Momence in any way.',
    supportedEntities: ['members', 'attendance', 'transactions', 'offerings', 'memberships'],
    exportInstructions: `
**How to export your data from Momence:**

1. Log in to your Momence admin dashboard
2. Go to **Settings > Data & Integrations**
3. Click **Export Data**
4. Select the data type:
   - Customers
   - Appointments/Bookings
   - Payments
   - Products/Services
5. Choose date range and format (CSV recommended)
6. Click **Export** and download when ready

*Large exports may take a few minutes to generate.*
    `.trim(),
    knownFormats: [
      {
        version: '2025',
        dateRange: '2024-present',
        description: 'Current Momence export format',
        columnSignatures: ['customer_id', 'first_name', 'last_name', 'email', 'phone'],
      },
    ],
    lastUpdated: '2025-02-06',
  },

  wellnessliving: {
    id: 'wellnessliving',
    name: 'WellnessLiving Import',
    officialName: 'WellnessLiving',
    website: 'https://www.wellnessliving.com',
    trademark: 'WellnessLiving® is a registered trademark of WellnessLiving.',
    description: 'Import comprehensive studio data from WellnessLiving exports.',
    disclaimer: 'This import tool is provided for data portability. Tandava is not affiliated with, endorsed by, or connected to WellnessLiving in any way.',
    supportedEntities: ['members', 'attendance', 'transactions', 'offerings', 'memberships', 'staff'],
    exportInstructions: `
**How to export your data from WellnessLiving:**

1. Log in to your WellnessLiving account
2. Navigate to **Setup > Business Data**
3. Click **Export** for the data type you need:
   - Clients
   - Staff
   - Classes/Services
   - Transactions
4. Select your preferred format (CSV)
5. Configure any filters or date ranges
6. Click **Generate Export**

*Some exports may require enterprise-level access.*
    `.trim(),
    knownFormats: [
      {
        version: '2025',
        dateRange: '2023-present',
        description: 'Current WellnessLiving export format',
        columnSignatures: ['Client ID', 'First Name', 'Last Name', 'Email Address', 'Phone Number'],
      },
    ],
    lastUpdated: '2025-02-06',
  },

  arketa: {
    id: 'arketa',
    name: 'Arketa Import',
    officialName: 'Arketa',
    website: 'https://www.arketa.co',
    trademark: 'Arketa™ is a trademark of Arketa.',
    description: 'Import studio data from Arketa CSV exports.',
    disclaimer: 'This import tool is provided for data portability. Tandava is not affiliated with, endorsed by, or connected to Arketa in any way.',
    supportedEntities: ['members', 'attendance', 'transactions', 'offerings'],
    exportInstructions: `
**How to export your data from Arketa:**

1. Log in to your Arketa dashboard
2. Go to **Settings > Export Data**
3. Choose the data category
4. Select date range if applicable
5. Click **Export CSV**

*Contact Arketa support for bulk exports or custom data requests.*
    `.trim(),
    knownFormats: [
      {
        version: '2025',
        dateRange: '2024-present',
        description: 'Current Arketa export format',
        columnSignatures: ['id', 'first_name', 'last_name', 'email'],
      },
    ],
    lastUpdated: '2025-02-06',
  },

  mariana_tek: {
    id: 'mariana_tek',
    name: 'Mariana Tek Import',
    officialName: 'Mariana Tek (Xplor)',
    website: 'https://www.marianatek.com',
    trademark: 'Mariana Tek® is a registered trademark of Xplor Technologies.',
    description: 'Import studio data from Mariana Tek exports.',
    disclaimer: 'This import tool is provided for data portability. Tandava is not affiliated with, endorsed by, or connected to Mariana Tek or Xplor Technologies in any way.',
    supportedEntities: ['members', 'attendance', 'transactions', 'offerings'],
    exportInstructions: `
**How to export your data from Mariana Tek:**

1. Contact your Mariana Tek account representative
2. Request a data export for:
   - Client records
   - Booking history
   - Transaction history
3. Specify the date range and format (CSV)
4. They will provide download links when ready

*Mariana Tek may require a formal data export request.*
    `.trim(),
    knownFormats: [
      {
        version: '2025',
        dateRange: '2024-present',
        description: 'Standard Mariana Tek export',
        columnSignatures: ['user_id', 'first_name', 'last_name', 'email', 'phone'],
      },
    ],
    lastUpdated: '2025-02-06',
  },

  vagaro: {
    id: 'vagaro',
    name: 'Vagaro Import',
    officialName: 'Vagaro',
    website: 'https://www.vagaro.com',
    trademark: 'Vagaro® is a registered trademark of Vagaro, Inc.',
    description: 'Import salon/studio data from Vagaro CSV exports.',
    disclaimer: 'This import tool is provided for data portability. Tandava is not affiliated with, endorsed by, or connected to Vagaro, Inc. in any way.',
    supportedEntities: ['members', 'attendance', 'transactions'],
    exportInstructions: `
**How to export your data from Vagaro:**

1. Log in to your Vagaro business account
2. Go to **Reports > Data Export**
3. Select the report type:
   - Client List
   - Appointment History
   - Sales Report
4. Set your filters and date range
5. Click **Export to CSV**

*Note: Some data exports may require Pro plan access.*
    `.trim(),
    knownFormats: [
      {
        version: '2025',
        dateRange: '2024-present',
        description: 'Standard Vagaro export',
        columnSignatures: ['Client ID', 'First Name', 'Last Name', 'Email', 'Mobile Phone'],
      },
    ],
    lastUpdated: '2025-02-06',
  },

  acuity: {
    id: 'acuity',
    name: 'Acuity Scheduling Import',
    officialName: 'Acuity Scheduling (Squarespace)',
    website: 'https://acuityscheduling.com',
    trademark: 'Acuity Scheduling® is a trademark of Squarespace, Inc.',
    description: 'Import appointment and client data from Acuity Scheduling exports.',
    disclaimer: 'This import tool is provided for data portability. Tandava is not affiliated with, endorsed by, or connected to Squarespace, Inc. in any way.',
    supportedEntities: ['members', 'attendance'],
    exportInstructions: `
**How to export your data from Acuity Scheduling:**

1. Log in to your Acuity account
2. Go to **Business Settings > Import/Export**
3. For clients:
   - Click **Export Clients to CSV**
4. For appointments:
   - Go to **Reporting > Appointment Report**
   - Set date range and filters
   - Click **Export**

*Exports are available on all Acuity plans.*
    `.trim(),
    knownFormats: [
      {
        version: '2025',
        dateRange: '2024-present',
        description: 'Standard Acuity export',
        columnSignatures: ['First Name', 'Last Name', 'Email', 'Phone'],
      },
    ],
    lastUpdated: '2025-02-06',
  },

  generic_csv: {
    id: 'generic_csv',
    name: 'Generic CSV Import',
    officialName: 'CSV File',
    website: '',
    trademark: '',
    description: 'Import data from any CSV file with manual column mapping.',
    disclaimer: 'Ensure you have the right to import this data and that it complies with applicable data protection laws.',
    supportedEntities: ['members', 'attendance', 'transactions', 'offerings', 'staff'],
    exportInstructions: `
**Preparing your CSV file:**

1. Ensure your data is in CSV (comma-separated values) format
2. Include a header row with column names
3. Use UTF-8 encoding for special characters
4. Dates should be in ISO format (YYYY-MM-DD) or MM/DD/YYYY
5. Phone numbers should include country code

**Recommended columns for member import:**
- first_name, last_name (or full_name)
- email
- phone
- address, city, state, zip
- birthdate
- membership_type
- join_date

You can map any column name to Tandava fields during import.
    `.trim(),
    knownFormats: [],
    lastUpdated: '2025-02-06',
  },
};

// ============================================================================
// UI COMPONENTS HELPER TEXT
// ============================================================================

export const IMPORT_UI_STRINGS = {
  pageTitle: 'Import Your Data',
  pageSubtitle: 'Migrate your studio data from another platform',

  selectProviderTitle: 'Select Your Previous Platform',
  selectProviderDescription: 'Choose where your data is coming from. We\'ll help you map the columns correctly.',

  uploadTitle: 'Upload Your Export File',
  uploadDescription: 'Drag and drop your CSV file or click to browse',
  uploadHint: 'Supported format: .csv (comma-separated values)',

  mappingTitle: 'Map Your Columns',
  mappingDescription: 'Match columns from your file to Tandava fields. We\'ve auto-detected what we can.',

  previewTitle: 'Preview Import',
  previewDescription: 'Review the data before importing. Check for any issues or duplicates.',

  confirmTitle: 'Confirm Import',
  confirmDescription: 'Ready to import? This will add records to your Tandava account.',

  duplicateWarning: 'Potential duplicates detected',
  duplicateDescription: 'These records may already exist in your account. Choose how to handle them.',

  errorTitle: 'Import Issues',
  errorDescription: 'Some rows have errors. You can fix them or skip these rows.',

  successTitle: 'Import Complete!',
  successDescription: 'Your data has been imported successfully.',

  tooltipDisclaimer: 'ⓘ Not affiliated with this provider. Import tools provided for data portability.',
};

// ============================================================================
// FORMAT DETECTION
// ============================================================================

/**
 * Detect which provider format a CSV file matches based on column headers
 */
export function detectProviderFormat(
  headers: string[]
): { providerId: string; confidence: number; version?: string } | null {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  let bestMatch: { providerId: string; confidence: number; version?: string } | null = null;

  for (const [providerId, info] of Object.entries(CONNECTOR_PROVIDERS)) {
    for (const format of info.knownFormats) {
      const normalizedSignatures = format.columnSignatures.map(s => s.toLowerCase());
      const matchCount = normalizedSignatures.filter(sig =>
        normalizedHeaders.some(h => h === sig || h.includes(sig) || sig.includes(h))
      ).length;

      const confidence = matchCount / normalizedSignatures.length;

      if (confidence > 0.5 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { providerId, confidence, version: format.version };
      }
    }
  }

  return bestMatch;
}

/**
 * Get human-readable provider name with trademark notice
 */
export function getProviderDisplayName(providerId: string): string {
  const info = CONNECTOR_PROVIDERS[providerId];
  if (!info) return providerId;
  return info.name;
}

/**
 * Get full legal notice for a provider
 */
export function getProviderLegalNotice(providerId: string): string {
  const info = CONNECTOR_PROVIDERS[providerId];
  if (!info) return CONNECTOR_SHORT_DISCLAIMER;

  return `${info.disclaimer}\n\n${info.trademark}`;
}
