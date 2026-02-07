import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Download,
  RefreshCw,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Pause,
  Play,
  ExternalLink,
  Search,
  Calendar,
  Users,
  CreditCard,
  ShoppingBag,
  Mail,
  BarChart3,
  Lock,
  Zap,
  ArrowRight,
  FileSpreadsheet,
  Database,
  Shield,
  HelpCircle,
  ChevronRight,
  Activity,
  Link2,
  Unlink,
} from "lucide-react";
import type {
  ConnectorDefinition,
  ConnectorCategory,
  ConnectorType,
  ConnectorStatus
} from "@/types/database";

// =============================================================================
// MOCK DATA - Connector Definitions
// =============================================================================

const CONNECTOR_DEFINITIONS: (ConnectorDefinition & { configured?: boolean; status?: ConnectorStatus })[] = [
  // Migration Connectors
  {
    id: "1",
    slug: "mindbody-import",
    name: "MindBody",
    description: "Import clients, attendance, and transactions from MindBody CSV exports",
    icon_url: null,
    connector_type: "import",
    category: "migration",
    supported_entities: ["members", "attendance", "transactions", "offerings", "memberships"],
    supports_dry_run: true,
    supports_incremental: false,
    supports_scheduled: false,
    known_versions: ["2022", "2023", "2024", "2025"],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: "In MindBody: Go to Reports > Clients > Export. Select 'All Clients' and download as CSV.",
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "2",
    slug: "walla-import",
    name: "Walla",
    description: "Import studio data from Walla CSV exports",
    icon_url: null,
    connector_type: "import",
    category: "migration",
    supported_entities: ["members", "attendance", "transactions", "memberships"],
    supports_dry_run: true,
    supports_incremental: false,
    supports_scheduled: false,
    known_versions: ["2023", "2024", "2025"],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: "In Walla: Go to Settings > Data Export > Select data type > Download CSV.",
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "3",
    slug: "momence-import",
    name: "Momence",
    description: "Import studio data from Momence exports",
    icon_url: null,
    connector_type: "import",
    category: "migration",
    supported_entities: ["members", "attendance", "transactions", "offerings", "memberships"],
    supports_dry_run: true,
    supports_incremental: false,
    supports_scheduled: false,
    known_versions: ["2023", "2024", "2025"],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: "In Momence: Go to Settings > Data & Integrations > Export Data.",
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "4",
    slug: "arketa-import",
    name: "Arketa",
    description: "Import studio data from Arketa exports",
    icon_url: null,
    connector_type: "import",
    category: "migration",
    supported_entities: ["members", "attendance", "transactions", "offerings"],
    supports_dry_run: true,
    supports_incremental: false,
    supports_scheduled: false,
    known_versions: ["2023", "2024", "2025"],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: "In Arketa: Go to Settings > Export Data. Choose export type and format.",
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "5",
    slug: "wellnessliving-import",
    name: "WellnessLiving",
    description: "Import studio data from WellnessLiving exports",
    icon_url: null,
    connector_type: "import",
    category: "migration",
    supported_entities: ["members", "attendance", "transactions", "offerings", "memberships", "staff"],
    supports_dry_run: true,
    supports_incremental: false,
    supports_scheduled: false,
    known_versions: ["2023", "2024", "2025"],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: "In WellnessLiving: Go to Setup > Business Data > Export. Select data type.",
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "6",
    slug: "generic-csv",
    name: "Generic CSV",
    description: "Import data from any CSV file with manual column mapping",
    icon_url: null,
    connector_type: "import",
    category: "migration",
    supported_entities: ["members", "attendance", "transactions", "offerings", "staff"],
    supports_dry_run: true,
    supports_incremental: false,
    supports_scheduled: false,
    known_versions: [],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: "Export data from your current system as CSV. Any format supported with manual mapping.",
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
  },
  // Marketplace Connectors
  {
    id: "10",
    slug: "classpass",
    name: "ClassPass",
    description: "Accept bookings from ClassPass members",
    icon_url: null,
    connector_type: "sync_inbound",
    category: "marketplace",
    supported_entities: ["bookings", "checkins"],
    supports_dry_run: false,
    supports_incremental: true,
    supports_scheduled: false,
    known_versions: [],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: null,
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "11",
    slug: "gympass",
    name: "Gympass",
    description: "Accept bookings from Gympass corporate members",
    icon_url: null,
    connector_type: "sync_inbound",
    category: "marketplace",
    supported_entities: ["bookings", "checkins"],
    supports_dry_run: false,
    supports_incremental: true,
    supports_scheduled: false,
    known_versions: [],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: null,
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
  },
  // Calendar Connectors
  {
    id: "20",
    slug: "google-calendar",
    name: "Google Calendar",
    description: "Sync classes and bookings to Google Calendar",
    icon_url: null,
    connector_type: "sync_bidirectional",
    category: "calendar",
    supported_entities: ["classes", "bookings"],
    supports_dry_run: false,
    supports_incremental: true,
    supports_scheduled: false,
    known_versions: [],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: null,
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
    configured: true,
    status: "active",
  },
  {
    id: "21",
    slug: "apple-calendar",
    name: "Apple Calendar",
    description: "Sync classes and bookings via iCal feed",
    icon_url: null,
    connector_type: "sync_outbound",
    category: "calendar",
    supported_entities: ["classes", "bookings"],
    supports_dry_run: false,
    supports_incremental: false,
    supports_scheduled: false,
    known_versions: [],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: null,
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
  },
  // CRM/Marketing
  {
    id: "30",
    slug: "mailchimp",
    name: "Mailchimp",
    description: "Sync contacts and segments for email marketing",
    icon_url: null,
    connector_type: "sync_bidirectional",
    category: "crm",
    supported_entities: ["members", "segments", "tags"],
    supports_dry_run: false,
    supports_incremental: true,
    supports_scheduled: false,
    known_versions: [],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: null,
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
    configured: true,
    status: "active",
  },
  {
    id: "31",
    slug: "klaviyo",
    name: "Klaviyo",
    description: "Sync customer data for advanced email/SMS marketing",
    icon_url: null,
    connector_type: "sync_bidirectional",
    category: "crm",
    supported_entities: ["members", "events", "segments"],
    supports_dry_run: false,
    supports_incremental: true,
    supports_scheduled: false,
    known_versions: [],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: null,
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "32",
    slug: "hubspot",
    name: "HubSpot",
    description: "Sync contacts and deals to HubSpot CRM",
    icon_url: null,
    connector_type: "sync_bidirectional",
    category: "crm",
    supported_entities: ["members", "transactions"],
    supports_dry_run: false,
    supports_incremental: true,
    supports_scheduled: false,
    known_versions: [],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: null,
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
  },
  // Accounting
  {
    id: "40",
    slug: "quickbooks",
    name: "QuickBooks Online",
    description: "Export transactions and invoices to QuickBooks",
    icon_url: null,
    connector_type: "sync_outbound",
    category: "accounting",
    supported_entities: ["transactions", "invoices", "payroll"],
    supports_dry_run: true,
    supports_incremental: true,
    supports_scheduled: true,
    known_versions: [],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: null,
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "41",
    slug: "xero",
    name: "Xero",
    description: "Export transactions and invoices to Xero",
    icon_url: null,
    connector_type: "sync_outbound",
    category: "accounting",
    supported_entities: ["transactions", "invoices", "payroll"],
    supports_dry_run: true,
    supports_incremental: true,
    supports_scheduled: true,
    known_versions: [],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: null,
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
  },
  // Automation
  {
    id: "50",
    slug: "zapier",
    name: "Zapier",
    description: "Connect to 5000+ apps via Zapier",
    icon_url: null,
    connector_type: "sync_bidirectional",
    category: "custom",
    supported_entities: ["members", "bookings", "transactions", "events"],
    supports_dry_run: false,
    supports_incremental: true,
    supports_scheduled: false,
    known_versions: [],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: null,
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "51",
    slug: "custom-webhook",
    name: "Custom Webhook",
    description: "Send events to your own webhook endpoints",
    icon_url: null,
    connector_type: "sync_outbound",
    category: "custom",
    supported_entities: ["all"],
    supports_dry_run: true,
    supports_incremental: true,
    supports_scheduled: false,
    known_versions: [],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: null,
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
    configured: true,
    status: "active",
  },
  // Analytics
  {
    id: "60",
    slug: "google-analytics",
    name: "Google Analytics",
    description: "Track website and booking conversions",
    icon_url: null,
    connector_type: "sync_outbound",
    category: "analytics",
    supported_entities: ["events", "conversions"],
    supports_dry_run: false,
    supports_incremental: true,
    supports_scheduled: false,
    known_versions: [],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: null,
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "61",
    slug: "meta-pixel",
    name: "Meta Pixel",
    description: "Track Facebook/Instagram ad conversions",
    icon_url: null,
    connector_type: "sync_outbound",
    category: "analytics",
    supported_entities: ["events", "conversions"],
    supports_dry_run: false,
    supports_incremental: true,
    supports_scheduled: false,
    known_versions: [],
    config_schema: {},
    credentials_schema: {},
    setup_guide_url: null,
    export_instructions: null,
    is_enabled: true,
    requires_approval: false,
    created_at: "",
    updated_at: "",
  },
];

// Mock recent sync operations
const RECENT_SYNCS = [
  { connector: "Google Calendar", direction: "outbound", status: "complete", records: 47, time: "2 min ago" },
  { connector: "Mailchimp", direction: "outbound", status: "complete", records: 12, time: "15 min ago" },
  { connector: "Custom Webhook", direction: "outbound", status: "complete", records: 3, time: "1 hour ago" },
  { connector: "Google Calendar", direction: "inbound", status: "complete", records: 2, time: "3 hours ago" },
];

// Mock import history
const IMPORT_HISTORY = [
  { source: "MindBody", type: "Clients", records: 847, status: "complete", date: "Jan 15, 2025" },
  { source: "MindBody", type: "Attendance", records: 12430, status: "complete", date: "Jan 15, 2025" },
  { source: "MindBody", type: "Transactions", records: 2841, status: "partial", date: "Jan 14, 2025" },
];

// Mock scheduled exports
const SCHEDULED_EXPORTS = [
  { name: "Weekly Revenue Report", format: "CSV", frequency: "Weekly", next: "Mon 6:00 AM", delivery: "email" },
  { name: "Monthly Payroll Export", format: "QuickBooks IIF", frequency: "Monthly", next: "Feb 1, 6:00 AM", delivery: "sftp" },
];

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const getCategoryIcon = (category: ConnectorCategory) => {
  switch (category) {
    case "migration": return Upload;
    case "marketplace": return ShoppingBag;
    case "calendar": return Calendar;
    case "crm": return Mail;
    case "accounting": return CreditCard;
    case "analytics": return BarChart3;
    case "communication": return Mail;
    case "access_control": return Lock;
    case "custom": return Zap;
    case "compliance": return Shield;
    default: return Database;
  }
};

const getStatusBadge = (status?: ConnectorStatus) => {
  switch (status) {
    case "active":
      return <Badge className="bg-accent-sage/20 text-accent-sage">Active</Badge>;
    case "configured":
      return <Badge className="bg-accent-gold/20 text-accent-gold">Configured</Badge>;
    case "paused":
      return <Badge className="bg-secondary text-muted-foreground">Paused</Badge>;
    case "error":
      return <Badge className="bg-destructive/20 text-destructive">Error</Badge>;
    default:
      return null;
  }
};

const getTypeLabel = (type: ConnectorType) => {
  switch (type) {
    case "import": return "Import";
    case "export": return "Export";
    case "sync_inbound": return "Inbound Sync";
    case "sync_outbound": return "Outbound Sync";
    case "sync_bidirectional": return "Two-Way Sync";
    default: return type;
  }
};

// =============================================================================
// CONNECTOR CARD COMPONENT
// =============================================================================

interface ConnectorCardProps {
  connector: ConnectorDefinition & { configured?: boolean; status?: ConnectorStatus };
  onConfigure: () => void;
}

function ConnectorCard({ connector, onConfigure }: ConnectorCardProps) {
  const Icon = getCategoryIcon(connector.category);
  const isConfigured = connector.configured;

  return (
    <Card className={`transition-all hover:border-primary/30 ${isConfigured ? "border-accent-sage/30" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              isConfigured ? "bg-accent-sage/20" : "bg-primary/10"
            }`}>
              <Icon className={`h-5 w-5 ${isConfigured ? "text-accent-sage" : "text-primary"}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{connector.name}</h3>
                {getStatusBadge(connector.status)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {connector.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px] px-1.5">
                  {getTypeLabel(connector.connector_type)}
                </Badge>
                {connector.supports_dry_run && (
                  <Badge variant="outline" className="text-[10px] px-1.5">Dry Run</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          {isConfigured ? (
            <>
              <Button size="sm" variant="outline" className="flex-1">
                <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                Settings
              </Button>
              {connector.status === "active" ? (
                <Button size="sm" variant="ghost">
                  <Pause className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="sm" variant="ghost">
                  <Play className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button size="sm" variant="ghost">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <Button size="sm" className="w-full" onClick={onConfigure}>
              Connect
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DataConnectors() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredConnectors = CONNECTOR_DEFINITIONS.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const activeConnectors = CONNECTOR_DEFINITIONS.filter(c => c.status === "active");
  const migrationConnectors = CONNECTOR_DEFINITIONS.filter(c => c.category === "migration");
  const syncConnectors = CONNECTOR_DEFINITIONS.filter(c =>
    c.connector_type.startsWith("sync") && c.category !== "migration"
  );

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Data Connectors</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Import, export, and sync your studio data with external platforms
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <a href="/manage/import">
                <Upload className="h-4 w-4 mr-2" />
                Quick Import
              </a>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Studio Data</DialogTitle>
                  <DialogDescription>
                    Choose what data to export and the format
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Type</label>
                    <Select defaultValue="members">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="members">Members / Students</SelectItem>
                        <SelectItem value="transactions">Transactions</SelectItem>
                        <SelectItem value="attendance">Attendance History</SelectItem>
                        <SelectItem value="payroll">Payroll Data</SelectItem>
                        <SelectItem value="full">Full Backup (All Data)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Format</label>
                    <Select defaultValue="csv">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="quickbooks">QuickBooks IIF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" />
                      <Input type="date" />
                    </div>
                  </div>
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Export
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent-sage/20 flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-accent-sage" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeConnectors.length}</p>
                  <p className="text-xs text-muted-foreground">Active Connectors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">64</p>
                  <p className="text-xs text-muted-foreground">Syncs Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent-gold/20 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-accent-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold">16.1K</p>
                  <p className="text-xs text-muted-foreground">Records Imported</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">2</p>
                  <p className="text-xs text-muted-foreground">Scheduled Exports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="migration">Migration</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="exports">Exports</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Active Connections */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Active Connections</CardTitle>
                  <CardDescription>Currently syncing integrations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeConnectors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Unlink className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No active connections</p>
                      <Button variant="link" size="sm" onClick={() => setActiveTab("integrations")}>
                        Browse integrations
                      </Button>
                    </div>
                  ) : (
                    activeConnectors.map(connector => (
                      <div key={connector.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const Icon = getCategoryIcon(connector.category);
                            return <Icon className="h-4 w-4 text-accent-sage" />;
                          })()}
                          <div>
                            <p className="text-sm font-medium">{connector.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {getTypeLabel(connector.connector_type)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-accent-sage/20 text-accent-sage text-xs">Healthy</Badge>
                          <Button variant="ghost" size="sm">
                            <Settings2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Sync Activity</CardTitle>
                  <CardDescription>Latest data synchronizations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {RECENT_SYNCS.map((sync, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                      <div className="flex items-center gap-3">
                        {sync.direction === "outbound" ? (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ArrowRight className="h-4 w-4 text-muted-foreground rotate-180" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{sync.connector}</p>
                          <p className="text-xs text-muted-foreground">
                            {sync.records} records • {sync.time}
                          </p>
                        </div>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-accent-sage" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab("migration")}
                    className="p-4 rounded-xl border border-border hover:border-primary/30 transition-all text-left"
                  >
                    <Upload className="h-6 w-6 text-primary mb-2" />
                    <h3 className="font-semibold text-sm">Migrate from Another Platform</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Import clients, history, and transactions from MindBody, Walla, Momence, or others
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab("integrations")}
                    className="p-4 rounded-xl border border-border hover:border-primary/30 transition-all text-left"
                  >
                    <Zap className="h-6 w-6 text-accent-gold mb-2" />
                    <h3 className="font-semibold text-sm">Connect Marketing Tools</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sync with Mailchimp, Klaviyo, or HubSpot for automated marketing
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab("exports")}
                    className="p-4 rounded-xl border border-border hover:border-primary/30 transition-all text-left"
                  >
                    <CreditCard className="h-6 w-6 text-accent-sage mb-2" />
                    <h3 className="font-semibold text-sm">Export to Accounting</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Send transactions to QuickBooks or Xero automatically
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Migration Tab */}
          <TabsContent value="migration" className="space-y-6">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Switching to Tandava?</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Import your existing data from another platform. We support MindBody, Walla, Momence,
                      Arketa, WellnessLiving, and generic CSV files. Every import includes:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent-sage" />
                        <span><strong>Dry run mode</strong> — Preview what will be imported before committing</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent-sage" />
                        <span><strong>Data quality report</strong> — See issues before they become problems</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent-sage" />
                        <span><strong>Duplicate detection</strong> — Smart matching by email prevents duplicates</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent-sage" />
                        <span><strong>Version-aware parsing</strong> — We detect your export format automatically</span>
                      </li>
                    </ul>
                    <Button className="mt-4" asChild>
                      <a href="/manage/import">
                        Start Migration
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Migration Connectors */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Supported Platforms</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {migrationConnectors.map(connector => (
                  <ConnectorCard
                    key={connector.id}
                    connector={connector}
                    onConfigure={() => window.location.href = "/manage/import"}
                  />
                ))}
              </div>
            </div>

            {/* Import History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {IMPORT_HISTORY.map((job, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{job.type} from {job.source}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.date} • {job.records.toLocaleString()} records
                        </p>
                      </div>
                    </div>
                    <Badge className={
                      job.status === "complete"
                        ? "bg-accent-sage/20 text-accent-sage"
                        : "bg-accent-gold/20 text-accent-gold"
                    }>
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search integrations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                  <SelectItem value="calendar">Calendar</SelectItem>
                  <SelectItem value="crm">Marketing / CRM</SelectItem>
                  <SelectItem value="accounting">Accounting</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="custom">Automation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Integration Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConnectors
                .filter(c => c.category !== "migration")
                .map(connector => (
                  <ConnectorCard
                    key={connector.id}
                    connector={connector}
                    onConfigure={() => {}}
                  />
                ))}
            </div>

            {filteredConnectors.filter(c => c.category !== "migration").length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No integrations found matching your search</p>
              </div>
            )}
          </TabsContent>

          {/* Exports Tab */}
          <TabsContent value="exports" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* One-Time Export */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">One-Time Export</CardTitle>
                  <CardDescription>Download your data in various formats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Members", icon: Users, desc: "Client list with contact info" },
                      { label: "Transactions", icon: CreditCard, desc: "All purchases and payments" },
                      { label: "Attendance", icon: Calendar, desc: "Class attendance history" },
                      { label: "Payroll", icon: CreditCard, desc: "Teacher earnings report" },
                    ].map(item => (
                      <button
                        key={item.label}
                        className="p-4 rounded-xl border border-border hover:border-primary/30 transition-all text-left"
                      >
                        <item.icon className="h-5 w-5 text-primary mb-2" />
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Full Data Backup
                  </Button>
                </CardContent>
              </Card>

              {/* Scheduled Exports */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Scheduled Exports</CardTitle>
                    <CardDescription>Automated recurring exports</CardDescription>
                  </div>
                  <Button size="sm">
                    Add Schedule
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {SCHEDULED_EXPORTS.map((exp, i) => (
                    <div key={i} className="p-3 rounded-xl bg-secondary/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{exp.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {exp.format} • {exp.frequency} • via {exp.delivery}
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Next: {exp.next}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Accounting Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Accounting Integrations</CardTitle>
                <CardDescription>
                  Automatically sync transactions to your accounting software
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {CONNECTOR_DEFINITIONS
                    .filter(c => c.category === "accounting")
                    .map(connector => (
                      <ConnectorCard
                        key={connector.id}
                        connector={connector}
                        onConfigure={() => {}}
                      />
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <Card className="border-accent-sage/30 bg-accent-sage/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-accent-sage/20 flex items-center justify-center shrink-0">
                    <Shield className="h-6 w-6 text-accent-sage" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Data Privacy & Compliance</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tandava helps you comply with GDPR, CCPA, and other data privacy regulations.
                      You can export, rectify, or delete individual user data on request.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* GDPR Tools */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Subject Requests</CardTitle>
                  <CardDescription>Handle GDPR/CCPA requests from members</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      type: "Data Access Request",
                      desc: "Export all data for a specific member",
                      icon: Download
                    },
                    {
                      type: "Data Rectification",
                      desc: "Correct inaccurate personal data",
                      icon: Settings2
                    },
                    {
                      type: "Data Erasure",
                      desc: "Delete all data for a member (right to be forgotten)",
                      icon: Shield
                    },
                    {
                      type: "Data Portability",
                      desc: "Export data in machine-readable format",
                      icon: FileSpreadsheet
                    },
                  ].map(item => (
                    <button
                      key={item.type}
                      className="flex items-center gap-3 w-full p-3 rounded-xl border border-border hover:border-primary/30 transition-all text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.type}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Audit Log */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Audit Log</CardTitle>
                    <CardDescription>Track all data access and changes</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export Log
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { action: "Member data exported", user: "Sarah Chen", time: "2 hours ago" },
                    { action: "GDPR erasure completed", user: "System", time: "Yesterday" },
                    { action: "Bulk export generated", user: "David Park", time: "3 days ago" },
                    { action: "Member data rectified", user: "Sarah Chen", time: "1 week ago" },
                  ].map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 text-sm">
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">by {log.user}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{log.time}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Data Retention */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Retention Settings</CardTitle>
                <CardDescription>Configure how long data is retained before automatic deletion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Cancelled member data", current: "3 years", reason: "Legal requirement for tax records" },
                    { label: "Transaction records", current: "7 years", reason: "Financial compliance" },
                    { label: "Audit logs", current: "2 years", reason: "Security best practice" },
                    { label: "Analytics data", current: "Indefinite", reason: "Anonymized, no PII" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.reason}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.current}</Badge>
                        <Button variant="ghost" size="sm">
                          <Settings2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ManageLayout>
  );
}
