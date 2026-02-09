import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  CreditCard,
  Package,
  Users,
  Plus,
  TrendingUp,
  Download,
  MoreHorizontal,
  FileSpreadsheet,
  FileText,
  Calculator,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EngagementNudge } from "@/components/EngagementNudge";

const mockMembershipTypes = [
  { id: "1", name: "Unlimited Monthly", price: 14900, billing: "monthly", activeCount: 89, isActive: true },
  { id: "2", name: "8x Monthly", price: 11900, billing: "monthly", activeCount: 34, isActive: true },
  { id: "3", name: "4x Monthly", price: 7900, billing: "monthly", activeCount: 28, isActive: true },
  { id: "4", name: "Annual Unlimited", price: 149900, billing: "annual", activeCount: 12, isActive: true },
];

const mockClassPacks = [
  { id: "1", name: "10-Class Pack", classes: 10, price: 22000, validity: 90, sold: 45, isActive: true },
  { id: "2", name: "20-Class Pack", classes: 20, price: 38000, validity: 180, sold: 18, isActive: true },
  { id: "3", name: "5-Class Intro", classes: 5, price: 7500, validity: 30, sold: 67, isActive: true },
  { id: "4", name: "Single Drop-in", classes: 1, price: 2500, validity: 1, sold: 156, isActive: true },
];

const mockRecentTransactions = [
  { id: "1", student: "Mia Tanaka", type: "Membership Renewal", amount: 14900, date: "Today, 8:12 AM", status: "completed" },
  { id: "2", student: "Noah Garcia", type: "10-Class Pack", amount: 22000, date: "Today, 7:45 AM", status: "completed" },
  { id: "3", student: "Emma Wilson", type: "Drop-in", amount: 2500, date: "Yesterday, 6:30 PM", status: "completed" },
  { id: "4", student: "Jordan Blake", type: "Late Cancel Fee", amount: 1500, date: "Yesterday, 2:15 PM", status: "completed" },
  { id: "5", student: "Alex Rivera", type: "Membership Renewal", amount: 11900, date: "Yesterday, 12:00 AM", status: "failed" },
  { id: "6", student: "Sophia Lee", type: "5-Class Intro", amount: 7500, date: "Jan 28, 9:20 AM", status: "completed" },
  { id: "7", student: "Liam Park", type: "Drop-in", amount: 2500, date: "Jan 27, 5:45 PM", status: "refunded" },
];

// ============================================================================
// CSV EXPORT — Generate and download transaction data
// ============================================================================

type ExportFormat = "csv" | "quickbooks" | "xero";

function generateCSV(transactions: typeof mockRecentTransactions, format: ExportFormat): string {
  if (format === "quickbooks") {
    // QuickBooks IIF format (simplified)
    const lines = [
      "!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO",
      "!SPL\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO",
      "!ENDTRNS",
    ];
    transactions.forEach((tx) => {
      lines.push(`TRNS\tDEPOSIT\t${tx.date}\tUndeposited Funds\t${tx.student}\t${(tx.amount / 100).toFixed(2)}\t${tx.type}`);
      lines.push(`SPL\tDEPOSIT\t${tx.date}\tClass Revenue\t${tx.student}\t-${(tx.amount / 100).toFixed(2)}\t${tx.type}`);
      lines.push("ENDTRNS");
    });
    return lines.join("\n");
  }

  if (format === "xero") {
    // Xero CSV format
    const headers = ["*ContactName", "*InvoiceNumber", "*InvoiceDate", "*DueDate", "Description", "*Quantity", "*UnitAmount", "*AccountCode", "TaxType"];
    const rows = transactions.map((tx, i) => [
      tx.student,
      `TDV-${String(i + 1).padStart(4, "0")}`,
      tx.date,
      tx.date,
      tx.type,
      "1",
      (tx.amount / 100).toFixed(2),
      "200",
      "Tax Exempt",
    ]);
    return [headers, ...rows].map((r) => r.join(",")).join("\n");
  }

  // Standard CSV
  const headers = ["Date", "Student", "Type", "Amount", "Status", "Payment Method"];
  const rows = transactions.map((tx) => [
    tx.date,
    tx.student,
    tx.type,
    `$${(tx.amount / 100).toFixed(2)}`,
    tx.status,
    "Card",
  ]);
  return [headers, ...rows].map((r) => r.join(",")).join("\n");
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function FinancialsManage() {
  const { toast } = useToast();
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");

  const handleExport = () => {
    const csv = generateCSV(mockRecentTransactions, exportFormat);
    const extensions: Record<ExportFormat, string> = { csv: "csv", quickbooks: "iif", xero: "csv" };
    const prefixes: Record<ExportFormat, string> = { csv: "transactions", quickbooks: "quickbooks-export", xero: "xero-import" };
    downloadFile(csv, `${prefixes[exportFormat]}-${new Date().toISOString().split("T")[0]}.${extensions[exportFormat]}`);
    setExportOpen(false);
    toast({
      title: "Export downloaded",
      description: `${mockRecentTransactions.length} transactions exported as ${exportFormat === "quickbooks" ? "QuickBooks IIF" : exportFormat === "xero" ? "Xero CSV" : "CSV"}.`,
    });
  };

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Nudge */}
        <EngagementNudge
          type="pack_running_low"
          title="2 failed membership renewals"
          message="Alex Rivera and 1 other member have failed payment attempts. Follow up to prevent churn."
          actionLabel="View Failed Payments"
          context="$268 at risk"
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Financials</h1>
            <p className="text-sm text-muted-foreground mt-1">Memberships, class packs, and transactions</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Export Dialog */}
        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Export Transaction Data</DialogTitle>
              <DialogDescription>
                Download your transaction data for accounting or analysis
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        CSV (Excel, Google Sheets)
                      </div>
                    </SelectItem>
                    <SelectItem value="quickbooks">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        QuickBooks IIF
                      </div>
                    </SelectItem>
                    <SelectItem value="xero">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Xero CSV
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Input type="date" value={exportDateFrom} onChange={(e) => setExportDateFrom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>To</Label>
                  <Input type="date" value={exportDateTo} onChange={(e) => setExportDateTo(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {exportFormat === "quickbooks"
                  ? "Exports in IIF format compatible with QuickBooks Desktop and Online."
                  : exportFormat === "xero"
                  ? "Exports as Xero-compatible CSV with invoice mapping."
                  : "Standard CSV with all transaction fields."}
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setExportOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-1.5" />
                  Download {mockRecentTransactions.length} Transactions
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="memberships">Memberships</TabsTrigger>
            <TabsTrigger value="packs">Class Packs</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-5 pb-4 px-4">
                  <DollarSign className="h-5 w-5 text-accent-gold" />
                  <p className="text-2xl font-bold mt-2">$18,420</p>
                  <p className="text-xs text-muted-foreground">Revenue (MTD)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4 px-4">
                  <Users className="h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold mt-2">163</p>
                  <p className="text-xs text-muted-foreground">Active Members</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4 px-4">
                  <Package className="h-5 w-5 text-accent-coral" />
                  <p className="text-2xl font-bold mt-2">286</p>
                  <p className="text-xs text-muted-foreground">Active Packs</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4 px-4">
                  <TrendingUp className="h-5 w-5 text-accent-sage" />
                  <p className="text-2xl font-bold mt-2">$113</p>
                  <p className="text-xs text-muted-foreground">Avg Revenue/Student</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockRecentTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium">{tx.student}</p>
                      <p className="text-xs text-muted-foreground">{tx.type} — {tx.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">${(tx.amount / 100).toFixed(2)}</span>
                      <Badge
                        className={`text-[10px] ${
                          tx.status === "completed" ? "bg-accent-sage/20 text-accent-sage" :
                          tx.status === "failed" ? "bg-destructive/10 text-destructive" :
                          "bg-accent-gold/20 text-accent-gold"
                        }`}
                      >
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Memberships */}
          <TabsContent value="memberships" className="space-y-6">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => toast({ title: "Coming soon", description: "Membership creation will be available with backend integration." })}>
                <Plus className="h-4 w-4 mr-2" />
                New Membership Type
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {mockMembershipTypes.map((membership) => (
                <Card key={membership.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">{membership.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold">${(membership.price / 100).toFixed(0)}</span>
                          <span className="text-xs text-muted-foreground">/{membership.billing === "monthly" ? "mo" : "yr"}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl">
                          <DropdownMenuItem className="rounded-lg cursor-pointer">Edit</DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg cursor-pointer">View Members</DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg cursor-pointer text-destructive">Deactivate</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{membership.activeCount} active</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">
                          ${((membership.price * membership.activeCount) / 100).toLocaleString()}/mo
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Class Packs */}
          <TabsContent value="packs" className="space-y-6">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => toast({ title: "Coming soon", description: "Pack creation will be available with backend integration." })}>
                <Plus className="h-4 w-4 mr-2" />
                New Pack Type
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {mockClassPacks.map((pack) => (
                <Card key={pack.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">{pack.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold">${(pack.price / 100).toFixed(0)}</span>
                          <span className="text-xs text-muted-foreground">
                            {pack.classes} class{pack.classes > 1 ? "es" : ""} — {pack.validity} day{pack.validity > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl">
                          <DropdownMenuItem className="rounded-lg cursor-pointer">Edit</DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg cursor-pointer text-destructive">Deactivate</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                      <span className="text-sm text-muted-foreground">{pack.sold} sold (all time)</span>
                      <span className="text-sm text-muted-foreground">
                        ${((pack.price / pack.classes) / 100).toFixed(0)}/class
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Transactions */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardContent className="p-0">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-[2fr,1fr,1fr,1fr,auto] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span>Student</span>
                  <span>Type</span>
                  <span>Amount</span>
                  <span>Date</span>
                  <span>Status</span>
                </div>
                {mockRecentTransactions.map((tx) => (
                  <div key={tx.id} className="grid md:grid-cols-[2fr,1fr,1fr,1fr,auto] gap-4 px-4 py-3 border-b border-border last:border-0 items-center">
                    <p className="text-sm font-medium">{tx.student}</p>
                    <p className="text-sm text-muted-foreground">{tx.type}</p>
                    <p className="text-sm font-semibold">${(tx.amount / 100).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{tx.date}</p>
                    <Badge
                      className={`text-[10px] ${
                        tx.status === "completed" ? "bg-accent-sage/20 text-accent-sage" :
                        tx.status === "failed" ? "bg-destructive/10 text-destructive" :
                        "bg-accent-gold/20 text-accent-gold"
                      }`}
                    >
                      {tx.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ManageLayout>
  );
}
