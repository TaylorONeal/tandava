import { useState } from "react";
import { Link } from "react-router-dom";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Info,
  FileSpreadsheet,
  Settings,
  MapPin,
  BarChart3,
  Building2,
  Target,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

// ---------------------------------------------------------------------------
// InfoTip -- togglable explanation for complex metrics
// ---------------------------------------------------------------------------

function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="More info"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span className="absolute left-0 top-full mt-1 z-20 w-64 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Mock data -- P&L
// ---------------------------------------------------------------------------

const revenueItems = [
  { label: "Memberships", amount: 13261, pct: 72.0 },
  { label: "Class Packs", amount: 3200, pct: 17.4 },
  { label: "Drop-ins", amount: 1120, pct: 6.1 },
  { label: "Events/Workshops", amount: 640, pct: 3.5 },
  { label: "Gift Cards", amount: 199, pct: 1.1 },
];

const deductions = [
  { label: "Refunds", amount: -420 },
  { label: "Discounts", amount: -680 },
];

const grossRevenue = 18420;
const netRevenue = 17320;

const expenseItems = [
  { label: "Teacher Payroll", amount: 5230, pct: 30.2 },
  { label: "Payment Processing", amount: 552, pct: 3.2 },
  { label: "Platform Fees", amount: 184, pct: 1.1 },
  { label: "Rent", amount: 3500, pct: 20.2, manual: true },
  { label: "Utilities", amount: 450, pct: 2.6, manual: true },
  { label: "Insurance", amount: 380, pct: 2.2, manual: true },
  { label: "Marketing", amount: 600, pct: 3.5, manual: true },
  { label: "Software", amount: 250, pct: 1.4 },
];

const totalExpenses = 11146;
const netOperatingIncome = 6174;
const operatingMargin = 35.6;

const monthComparison = [
  { label: "Gross Revenue", current: 18420, previous: 17100, delta: 1320, deltaPct: 7.7 },
  { label: "Net Revenue", current: 17320, previous: 16200, delta: 1120, deltaPct: 6.9 },
  { label: "Total Expenses", current: 11146, previous: 10890, delta: 256, deltaPct: 2.4 },
  { label: "Net Operating Income", current: 6174, previous: 5310, delta: 864, deltaPct: 16.3 },
];

// ---------------------------------------------------------------------------
// Mock data -- MRR & Forecasting
// ---------------------------------------------------------------------------

const mrrWaterfall = [
  { label: "Starting MRR", amount: 13680, type: "neutral" as const },
  { label: "New", amount: 890, type: "add" as const },
  { label: "Expansion", amount: 300, type: "add" as const },
  { label: "Contraction", amount: -150, type: "subtract" as const },
  { label: "Churn", amount: -450, type: "subtract" as const },
  { label: "Reactivation", amount: 180, type: "add" as const },
  { label: "Paused", amount: -350, type: "subtract" as const },
  { label: "Ending MRR", amount: 14100, type: "neutral" as const },
];

const forecastAssumptions = [
  { label: "Monthly churn rate", value: "5%" },
  { label: "Monthly growth rate", value: "3%" },
  { label: "Avg revenue per student", value: "$113" },
  { label: "Payment processing fee", value: "2.9%" },
  { label: "Expected pause rate", value: "4%" },
  { label: "App store cut", value: "0% (self-hosted)" },
];

const forecastTable = [
  { month: "Month 1", mrr: 14100, totalRev: 17320, members: 163, confidence: 95 },
  { month: "Month 2", mrr: 14523, totalRev: 17840, members: 168, confidence: 92 },
  { month: "Month 3", mrr: 14959, totalRev: 18380, members: 173, confidence: 88 },
  { month: "Month 4", mrr: 15408, totalRev: 18930, members: 178, confidence: 83 },
  { month: "Month 5", mrr: 15870, totalRev: 19500, members: 183, confidence: 77 },
  { month: "Month 6", mrr: 16346, totalRev: 20080, members: 189, confidence: 71 },
  { month: "Month 7", mrr: 16836, totalRev: 20680, members: 195, confidence: 65 },
  { month: "Month 8", mrr: 17341, totalRev: 21300, members: 201, confidence: 59 },
  { month: "Month 9", mrr: 17861, totalRev: 21940, members: 207, confidence: 54 },
  { month: "Month 10", mrr: 18397, totalRev: 22600, members: 213, confidence: 50 },
  { month: "Month 11", mrr: 18949, totalRev: 23280, members: 220, confidence: 47 },
  { month: "Month 12", mrr: 19517, totalRev: 23980, members: 227, confidence: 45 },
];

// ---------------------------------------------------------------------------
// Mock data -- Seasonality
// ---------------------------------------------------------------------------

const monthlyRevenueSeason = [
  { month: "Jan", index: 1.15, note: "New Year surge" },
  { month: "Feb", index: 0.95, note: "" },
  { month: "Mar", index: 1.05, note: "" },
  { month: "Apr", index: 1.0, note: "" },
  { month: "May", index: 0.9, note: "" },
  { month: "Jun", index: 0.8, note: "Summer dip" },
  { month: "Jul", index: 0.75, note: "Lowest" },
  { month: "Aug", index: 0.85, note: "" },
  { month: "Sep", index: 1.1, note: "Back to school" },
  { month: "Oct", index: 1.05, note: "" },
  { month: "Nov", index: 0.95, note: "" },
  { month: "Dec", index: 0.9, note: "" },
];

const monthlyBookingsSeason = [
  { month: "Jan", index: 1.2 },
  { month: "Feb", index: 1.0 },
  { month: "Mar", index: 1.1 },
  { month: "Apr", index: 1.05 },
  { month: "May", index: 0.95 },
  { month: "Jun", index: 0.75 },
  { month: "Jul", index: 0.7 },
  { month: "Aug", index: 0.8 },
  { month: "Sep", index: 1.15 },
  { month: "Oct", index: 1.1 },
  { month: "Nov", index: 1.0 },
  { month: "Dec", index: 0.85 },
];

const monthlyNewStudentsSeason = [
  { month: "Jan", index: 1.35 },
  { month: "Feb", index: 1.05 },
  { month: "Mar", index: 1.1 },
  { month: "Apr", index: 1.0 },
  { month: "May", index: 0.85 },
  { month: "Jun", index: 0.7 },
  { month: "Jul", index: 0.65 },
  { month: "Aug", index: 0.8 },
  { month: "Sep", index: 1.25 },
  { month: "Oct", index: 1.1 },
  { month: "Nov", index: 0.9 },
  { month: "Dec", index: 0.8 },
];

const yoyComparison = [
  { quarter: "Q1", lastYear: 48200, thisYear: 52100, delta: 8.1 },
  { quarter: "Q2", lastYear: 45600, thisYear: 49800, delta: 9.2 },
  { quarter: "Q3", lastYear: 40800, thisYear: 44100, delta: 8.1 },
  { quarter: "Q4", lastYear: 44200, thisYear: 47900, delta: 8.4 },
];

// ---------------------------------------------------------------------------
// Mock data -- Expansion
// ---------------------------------------------------------------------------

const expansionScore = 72;

const signalCards = [
  {
    title: "Capacity",
    icon: BarChart3,
    signal: "Strong signal",
    signalColor: "text-accent-sage",
    metrics: [
      "Avg fill rate: 72%",
      "Peak hours: 89% full",
      "23% of classes hit waitlist",
    ],
  },
  {
    title: "Demand",
    icon: TrendingUp,
    signal: "Moderate signal",
    signalColor: "text-accent-gold",
    metrics: [
      "New student growth: +8% MoM",
      "Students from 12 different zip codes",
    ],
  },
  {
    title: "Financial",
    icon: DollarSign,
    signal: "Strong signal",
    signalColor: "text-accent-sage",
    metrics: [
      "Operating margin: 35.6%",
      "Revenue growing 3% MoM",
    ],
  },
  {
    title: "Risk",
    icon: AlertTriangle,
    signal: "Consider carefully",
    signalColor: "text-accent-gold",
    metrics: [
      "Cash reserves: (enter manually)",
      "Est. new location startup: $45,000-80,000",
    ],
  },
];

const studentZipCodes = [
  { zip: "98101", students: 45 },
  { zip: "98102", students: 38 },
  { zip: "98103", students: 22 },
  { zip: "98104", students: 18 },
  { zip: "98105", students: 14 },
  { zip: "Other", students: 26 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function confidenceColor(confidence: number): string {
  if (confidence >= 80) return "text-accent-sage";
  if (confidence >= 50) return "text-accent-gold";
  return "text-destructive";
}

function confidenceBg(confidence: number): string {
  if (confidence >= 80) return "bg-accent-sage/10";
  if (confidence >= 50) return "bg-accent-gold/10";
  return "bg-destructive/5";
}

function expansionScoreLabel(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 80) return { label: "Compelling", color: "text-accent-sage", bgColor: "bg-accent-sage" };
  if (score >= 60) return { label: "Strong Candidate", color: "text-accent-sage", bgColor: "bg-accent-sage/80" };
  if (score >= 40) return { label: "Building Momentum", color: "text-accent-gold", bgColor: "bg-accent-gold" };
  return { label: "Not Ready", color: "text-destructive", bgColor: "bg-destructive" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FinancialAnalytics() {
  const [period, setPeriod] = useState("this_month");
  const [seasonView, setSeasonView] = useState<"revenue" | "bookings" | "students">("revenue");

  const scoreInfo = expansionScoreLabel(expansionScore);

  const getSeasonData = () => {
    if (seasonView === "bookings") return monthlyBookingsSeason;
    if (seasonView === "students") return monthlyNewStudentsSeason;
    return monthlyRevenueSeason;
  };

  const maxIndex = Math.max(...getSeasonData().map((m) => m.index));

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            to="/manage/analytics"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Analytics
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Financial Performance</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Financial Performance</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Revenue, expenses, forecasting, and expansion readiness
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_quarter">This Quarter</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pnl" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pnl">P&L</TabsTrigger>
            <TabsTrigger value="mrr">MRR & Forecasting</TabsTrigger>
            <TabsTrigger value="seasonality">Seasonality</TabsTrigger>
            <TabsTrigger value="expansion">Expansion</TabsTrigger>
          </TabsList>

          {/* ================================================================
              P&L TAB
              ================================================================ */}
          <TabsContent value="pnl" className="space-y-6">
            {/* Simplified P&L Statement */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Profit & Loss Statement</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Manual Expenses
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export for QuickBooks
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* REVENUE */}
                <div className="mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Revenue
                  </p>
                  <div className="space-y-1.5">
                    {revenueItems.map((item) => (
                      <div key={item.label} className="flex items-center justify-between px-3 py-1.5">
                        <span className="text-sm">{item.label}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-accent-sage w-24 text-right">
                            ${item.amount.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {item.pct}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border my-3 mx-3" />

                  <div className="flex items-center justify-between px-3 py-1.5">
                    <span className="text-sm font-semibold">Gross Revenue</span>
                    <span className="text-sm font-bold w-24 text-right">
                      ${grossRevenue.toLocaleString()}
                    </span>
                  </div>

                  {deductions.map((item) => (
                    <div key={item.label} className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-sm text-muted-foreground">Less: {item.label}</span>
                      <span className="text-sm text-destructive w-24 text-right">
                        (${Math.abs(item.amount).toLocaleString()})
                      </span>
                    </div>
                  ))}

                  <div className="border-t border-border my-3 mx-3" />

                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-accent-sage/5">
                    <span className="text-sm font-semibold">Net Revenue</span>
                    <span className="text-base font-bold text-accent-sage">
                      ${netRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* EXPENSES */}
                <div className="mt-6 mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Expenses
                  </p>
                  <div className="space-y-1.5">
                    {expenseItems.map((item) => (
                      <div key={item.label} className="flex items-center justify-between px-3 py-1.5">
                        <span className="text-sm flex items-center gap-1.5">
                          {item.label}
                          {item.manual && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              manual
                            </Badge>
                          )}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold w-24 text-right">
                            ${item.amount.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {item.pct}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border my-3 mx-3" />

                  <div className="flex items-center justify-between px-3 py-1.5">
                    <span className="text-sm font-semibold">Total Expenses</span>
                    <span className="text-sm font-bold w-24 text-right">
                      ${totalExpenses.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* NET OPERATING INCOME */}
                <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Net Operating Income</p>
                      <p className="text-xs text-muted-foreground">{operatingMargin}% margin</p>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      ${netOperatingIncome.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Note */}
                <div className="flex items-start gap-3 mt-4 p-3 rounded-xl bg-secondary/30">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Rent, utilities, insurance, and marketing are manually entered. Revenue and
                    payroll are auto-calculated from your bookings and teacher pay settings. The
                    QuickBooks export produces a CSV compatible with standard accounting software.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Month-over-Month Comparison */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Month-over-Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="hidden md:grid grid-cols-[2fr,1fr,1fr,1fr,1fr] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span>Line Item</span>
                  <span>This Month</span>
                  <span>Last Month</span>
                  <span>Change</span>
                  <span>% Change</span>
                </div>
                {monthComparison.map((row) => {
                  const isPositive = row.label === "Total Expenses" ? row.delta < 0 : row.delta > 0;
                  return (
                    <div
                      key={row.label}
                      className="grid md:grid-cols-[2fr,1fr,1fr,1fr,1fr] gap-4 px-4 py-3 border-b border-border last:border-0 items-center"
                    >
                      <p className="text-sm font-medium">{row.label}</p>
                      <p className="text-sm font-semibold">${row.current.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        ${row.previous.toLocaleString()}
                      </p>
                      <p className={`text-sm font-semibold ${isPositive ? "text-accent-sage" : "text-destructive"}`}>
                        {row.delta >= 0 ? "+" : ""}${row.delta.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1">
                        {isPositive ? (
                          <ArrowUpRight className="h-3 w-3 text-accent-sage" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-destructive" />
                        )}
                        <span className={`text-sm ${isPositive ? "text-accent-sage" : "text-destructive"}`}>
                          {row.deltaPct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Expense Ratio Insights */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  Expense Ratio Insights
                  <InfoTip text="Compares your key expense ratios to industry benchmarks for small yoga studios." />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-4 w-4 text-accent-sage" />
                    <p className="text-sm font-medium">Teacher Payroll: 30.2% of revenue</p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Benchmark: 28-35%. Your payroll ratio is within the healthy range for a studio
                    of your size.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-4 w-4 text-accent-sage" />
                    <p className="text-sm font-medium">Operating Margin: 35.6%</p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Benchmark: 25-40%. Your margin is healthy, indicating good cost control
                    relative to revenue.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Rent: 20.2% of revenue</p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Benchmark: 15-25%. Rent is your second-largest expense. If revenue grows, this
                    ratio improves naturally with fixed rent.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================
              MRR & FORECASTING TAB
              ================================================================ */}
          <TabsContent value="mrr" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="flex items-center justify-between">
                    <DollarSign className="h-5 w-5 text-accent-gold" />
                    <InfoTip text="Monthly Recurring Revenue from active memberships, excluding one-time purchases." />
                  </div>
                  <p className="text-2xl font-bold mt-2">$14,100</p>
                  <p className="text-xs text-muted-foreground">Current MRR</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="flex items-center justify-between">
                    <TrendingUp className="h-5 w-5 text-accent-sage" />
                    <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage">
                      +3.1%
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold mt-2">+$420</p>
                  <p className="text-xs text-muted-foreground">MRR Growth</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5 pb-4 px-4">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold mt-2">$169,200</p>
                  <p className="text-xs text-muted-foreground flex items-center">
                    Annual Run Rate
                    <InfoTip text="Current MRR multiplied by 12. Represents projected annual revenue if MRR stays constant." />
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="flex items-center justify-between">
                    <TrendingUp className="h-5 w-5 text-accent-gold" />
                    <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage">
                      +19%
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold mt-2">$16,800</p>
                  <p className="text-xs text-muted-foreground">Projected MRR (6mo)</p>
                </CardContent>
              </Card>
            </div>

            {/* MRR Waterfall */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  MRR Breakdown
                  <InfoTip text="Shows how your MRR changed this month: new subscriptions, upgrades, downgrades, cancellations, reactivations, and pauses." />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mrrWaterfall.map((row) => (
                  <div
                    key={row.label}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      row.type === "neutral"
                        ? "bg-primary/5 border border-primary/10"
                        : "bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {row.type === "add" && (
                        <ArrowUpRight className="h-4 w-4 text-accent-sage" />
                      )}
                      {row.type === "subtract" && (
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                      )}
                      {row.type === "neutral" && (
                        <Minus className="h-4 w-4 text-primary" />
                      )}
                      <span
                        className={`text-sm ${
                          row.type === "neutral" ? "font-semibold" : "font-medium"
                        }`}
                      >
                        {row.label}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        row.type === "add"
                          ? "text-accent-sage"
                          : row.type === "subtract"
                            ? "text-destructive"
                            : "text-primary"
                      }`}
                    >
                      {row.type === "add" && "+"}
                      {row.type === "subtract" && "-"}
                      ${Math.abs(row.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Revenue Forecast */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Revenue Forecast</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Assumptions Panel */}
                <div className="p-4 rounded-xl bg-secondary/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Forecast Assumptions
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {forecastAssumptions.map((a) => (
                      <div key={a.label} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{a.label}</span>
                        <span className="text-xs font-semibold">{a.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Forecast Table */}
                <div>
                  <div className="hidden md:grid grid-cols-[1fr,1fr,1fr,1fr,1fr] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>Month</span>
                    <span>Projected MRR</span>
                    <span>Total Revenue</span>
                    <span>Members</span>
                    <span>Confidence</span>
                  </div>
                  {forecastTable.map((row) => (
                    <div
                      key={row.month}
                      className={`grid md:grid-cols-[1fr,1fr,1fr,1fr,1fr] gap-4 px-4 py-2.5 border-b border-border last:border-0 items-center ${confidenceBg(row.confidence)}`}
                    >
                      <p className="text-sm font-medium">{row.month}</p>
                      <p className="text-sm font-semibold text-accent-gold">
                        ${row.mrr.toLocaleString()}
                      </p>
                      <p className="text-sm">${row.totalRev.toLocaleString()}</p>
                      <p className="text-sm">{row.members}</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-12 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.confidence >= 80
                                ? "bg-accent-sage"
                                : row.confidence >= 50
                                  ? "bg-accent-gold"
                                  : "bg-destructive"
                            }`}
                            style={{ width: `${row.confidence}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${confidenceColor(row.confidence)}`}>
                          {row.confidence}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Forecast Info */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/30 border border-border">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Forecasts use your historical data combined with configurable assumptions.
                Confidence decreases for months further out because more variables can change.
                Green rows (above 80%) are high confidence, yellow (50-80%) are moderate, and
                red-tinted rows (below 50%) are speculative.
              </p>
            </div>
          </TabsContent>

          {/* ================================================================
              SEASONALITY TAB
              ================================================================ */}
          <TabsContent value="seasonality" className="space-y-6">
            {/* Seasonal Pattern */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    Monthly Seasonal Pattern
                    <InfoTip text="Index values relative to your annual average (1.0). Values above 1.0 are above-average months, below 1.0 are below-average." />
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={seasonView === "revenue" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSeasonView("revenue")}
                      className="text-xs"
                    >
                      Revenue
                    </Button>
                    <Button
                      variant={seasonView === "bookings" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSeasonView("bookings")}
                      className="text-xs"
                    >
                      Bookings
                    </Button>
                    <Button
                      variant={seasonView === "students" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSeasonView("students")}
                      className="text-xs"
                    >
                      New Students
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-48">
                  {getSeasonData().map((m, i) => {
                    const heightPct = (m.index / maxIndex) * 100;
                    const isAbove = m.index >= 1.0;
                    const revItem = monthlyRevenueSeason[i];
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center">
                        <span className="text-[10px] font-semibold mb-1">
                          {m.index.toFixed(2)}
                        </span>
                        <div className="w-full relative" style={{ height: "140px" }}>
                          <div
                            className={`absolute bottom-0 w-full rounded-t-lg transition-all ${
                              isAbove ? "bg-accent-sage/60" : "bg-accent-gold/50"
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">{m.month}</span>
                        {seasonView === "revenue" && revItem.note && (
                          <span className="text-[8px] text-muted-foreground text-center leading-tight mt-0.5">
                            {revItem.note}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-accent-sage/60" />
                    <span>Above average</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-accent-gold/50" />
                    <span>Below average</span>
                  </div>
                  <span className="text-muted-foreground/60">|</span>
                  <span>1.0 = annual average</span>
                </div>
              </CardContent>
            </Card>

            {/* Seasonal Recommendations */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Seasonal Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-accent-gold/5 border border-accent-gold/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-accent-gold" />
                    <p className="text-sm font-semibold">Summer Dip (Jun-Aug)</p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Your revenue dips 20-25% during summer months. Consider these strategies:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Launch summer promo campaigns in late May</li>
                    <li>Offer outdoor or park classes as a seasonal differentiator</li>
                    <li>Run teacher training workshops to fill the revenue gap</li>
                    <li>Introduce summer-only class packs at a slight discount</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-accent-sage/5 border border-accent-sage/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-accent-sage" />
                    <p className="text-sm font-semibold">January Surge</p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    January is your strongest month (+15% above average). Plan ahead:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Add pop-up or overflow classes to handle increased demand</li>
                    <li>Prepare onboarding materials for a wave of new students</li>
                    <li>Stock merchandise and promote annual memberships</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">September Rebound</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    September shows a strong "back to school" rebound (+10%). This is a great time
                    to launch new class formats, re-engage lapsed members with a "welcome back"
                    campaign, and introduce fall workshop series.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Year-over-Year Comparison */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Year-over-Year Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="hidden md:grid grid-cols-[1fr,1fr,1fr,1fr] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span>Quarter</span>
                  <span>Last Year</span>
                  <span>This Year</span>
                  <span>Growth</span>
                </div>
                {yoyComparison.map((row) => (
                  <div
                    key={row.quarter}
                    className="grid md:grid-cols-[1fr,1fr,1fr,1fr] gap-4 px-4 py-3 border-b border-border last:border-0 items-center"
                  >
                    <p className="text-sm font-semibold">{row.quarter}</p>
                    <p className="text-sm text-muted-foreground">
                      ${row.lastYear.toLocaleString()}
                    </p>
                    <p className="text-sm font-semibold">${row.thisYear.toLocaleString()}</p>
                    <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage w-fit">
                      <TrendingUp className="h-3 w-3 mr-1" />+{row.delta}%
                    </Badge>
                  </div>
                ))}
                <div className="mt-3 px-4">
                  <p className="text-xs text-muted-foreground">
                    Revenue is growing consistently across all quarters, averaging +8.5%
                    year-over-year. Strongest growth in Q2 (+9.2%).
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================
              EXPANSION TAB
              ================================================================ */}
          <TabsContent value="expansion" className="space-y-6">
            {/* Expansion Readiness Score */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Building2 className="h-4 w-4 text-muted-foreground mr-2" />
                  Should I Open a New Studio?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-6">
                  <div
                    className={`h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white ${scoreInfo.bgColor}`}
                  >
                    {expansionScore}
                  </div>
                  <div>
                    <p className={`text-lg font-semibold ${scoreInfo.color}`}>
                      {expansionScore} / 100
                    </p>
                    <p className="text-sm font-medium">{scoreInfo.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">Expansion Readiness Score</p>
                  </div>
                </div>

                {/* Score gauge */}
                <div>
                  <div className="h-3 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${scoreInfo.bgColor}`}
                      style={{ width: `${expansionScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-destructive">Not Ready (0-40)</span>
                    <span className="text-[10px] text-accent-gold">Building (40-60)</span>
                    <span className="text-[10px] text-accent-sage">Strong (60-80)</span>
                    <span className="text-[10px] text-accent-sage font-semibold">Compelling (80+)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Signal Analysis Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {signalCards.map((card) => (
                <Card key={card.title}>
                  <CardContent className="pt-5 pb-4 px-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-xl bg-secondary/50 flex items-center justify-center">
                          <card.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold">{card.title}</p>
                      </div>
                      <Badge
                        className={`text-[10px] ${
                          card.signalColor === "text-accent-sage"
                            ? "bg-accent-sage/20 text-accent-sage"
                            : "bg-accent-gold/20 text-accent-gold"
                        }`}
                      >
                        {card.signal}
                      </Badge>
                    </div>
                    <ul className="space-y-1.5">
                      {card.metrics.map((metric, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-muted-foreground/40 mt-0.5">--</span>
                          {metric}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Student Geography */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                  Student Geography
                  <InfoTip text="Where your students live based on their registered zip codes. Helps identify demand clusters for a potential new location." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Where are your students coming from?
                </p>
                <div className="space-y-2">
                  {studentZipCodes.map((z) => {
                    const maxStudents = studentZipCodes[0].students;
                    const widthPct = (z.students / maxStudents) * 100;
                    return (
                      <div key={z.zip} className="flex items-center gap-3">
                        <span className="text-sm font-mono w-14 shrink-0">{z.zip}</span>
                        <div className="flex-1 h-6 bg-secondary/30 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-primary/50 rounded-lg flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(widthPct, 15)}%` }}
                          >
                            <span className="text-[10px] font-semibold text-primary-foreground">
                              {z.students}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground w-16 text-right">
                          {z.students} students
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  {studentZipCodes[0].zip} and {studentZipCodes[1].zip} together represent over
                  50% of your students. A second location nearby could reduce travel time for
                  these students and capture more demand from neighboring areas.
                </p>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/30 border border-border">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                This analysis helps you evaluate expansion readiness based on your studio's
                current metrics. It is not financial advice. Consult with your accountant and
                business advisor before making expansion decisions. Factors like lease terms,
                local competition, and personal financial situation are not captured here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ManageLayout>
  );
}
