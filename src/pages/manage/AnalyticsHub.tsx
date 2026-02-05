import { useState } from "react";
import { Link } from "react-router-dom";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DollarSign,
  Users,
  TrendingUp,
  BarChart3,
  Download,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  Percent,
  Calendar,
  Mail,
  Plus,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const kpiCards = [
  {
    label: "MRR",
    value: "$14,100",
    change: "+3%",
    changeLabel: "vs last month",
    positive: true,
    icon: DollarSign,
    iconColor: "text-accent-gold",
    helpText:
      "Monthly Recurring Revenue -- the predictable income from active memberships this month, excluding one-time purchases like class packs or drop-ins.",
  },
  {
    label: "Active Members",
    value: "163",
    change: "+8 net",
    changeLabel: "this month",
    positive: true,
    icon: Users,
    iconColor: "text-primary",
    helpText:
      "Students who attended at least one class or have an active membership during the selected period.",
  },
  {
    label: "Avg Class Fill Rate",
    value: "72%",
    change: "+4%",
    changeLabel: "vs last month",
    positive: true,
    icon: Percent,
    iconColor: "text-accent-coral",
    helpText:
      "The average percentage of spots filled across all classes. Higher fill rates mean your schedule matches student demand well.",
  },
  {
    label: "Revenue Per Student",
    value: "$113",
    change: "+$7",
    changeLabel: "vs last month",
    positive: true,
    icon: DollarSign,
    iconColor: "text-accent-sage",
    helpText:
      "Total revenue divided by active students. Rising values mean students are purchasing higher-value plans or attending more often.",
  },
];

const navCards = [
  {
    title: "Member Analytics",
    description: "Understand your students",
    icon: Users,
    href: "/manage/analytics/members",
    highlights: [
      { label: "New this month", value: "12" },
      { label: "At-risk", value: "3" },
      { label: "30-day retention", value: "87%" },
    ],
  },
  {
    title: "Sales & Conversion",
    description: "Track acquisition and growth",
    icon: TrendingUp,
    href: "/manage/analytics/sales",
    highlights: [
      { label: "Conversion rate", value: "8.2%" },
      { label: "Promo ROI", value: "$320" },
      { label: "Referral signups", value: "5" },
    ],
  },
  {
    title: "Financial Performance",
    description: "Revenue, expenses, and forecasting",
    icon: DollarSign,
    href: "/manage/analytics/financials",
    highlights: [
      { label: "Revenue", value: "$18.4K" },
      { label: "Margin", value: "68%" },
      { label: "Projected growth", value: "$2.1K" },
    ],
  },
  {
    title: "Site & App Metrics",
    description: "Traffic, attribution, and engagement",
    icon: BarChart3,
    href: "/manage/analytics/site",
    highlights: [
      { label: "Sessions", value: "1,240" },
      { label: "From Google", value: "34%" },
      { label: "Signup rate", value: "3.2%" },
    ],
  },
];

const healthScore = {
  overall: 78,
  label: "Your studio is performing well",
  subscores: [
    {
      name: "Revenue Health",
      score: 82,
      explanation: "Recurring revenue is growing steadily with low churn impact.",
    },
    {
      name: "Student Retention",
      score: 75,
      explanation: "Most students return within 30 days; a few long-term members are slipping.",
    },
    {
      name: "Class Utilization",
      score: 71,
      explanation: "Average fill rate is solid but some off-peak classes run below 50%.",
    },
    {
      name: "Growth Trajectory",
      score: 84,
      explanation: "New signups outpace cancellations and referrals are trending up.",
    },
  ],
};

const benchmarks = [
  { metric: "Revenue / Student", yours: 113, median: 110, unit: "$", max: 150 },
  { metric: "Fill Rate", yours: 72, median: 60, unit: "%", max: 100 },
  { metric: "Churn Rate", yours: 5, median: 5, unit: "%", max: 15, lowerIsBetter: true },
  { metric: "Classes / Student / Mo", yours: 4.2, median: 4.0, unit: "", max: 8 },
];

const scheduledReports = [
  {
    name: "Weekly Summary",
    schedule: "Every Monday at 8:00 AM",
    recipients: "you@studio.com",
  },
  {
    name: "Monthly Financials",
    schedule: "1st of each month",
    recipients: "you@studio.com, manager@studio.com",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number) {
  if (score >= 75) return "text-accent-sage";
  if (score >= 50) return "text-accent-gold";
  return "text-destructive";
}

function scoreBgColor(score: number) {
  if (score >= 75) return "bg-accent-sage";
  if (score >= 50) return "bg-accent-gold";
  return "bg-destructive";
}

// ---------------------------------------------------------------------------
// Inline tooltip helper -- togglable explanation text
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
// Component
// ---------------------------------------------------------------------------

export default function AnalyticsHub() {
  const [period, setPeriod] = useState("this_month");

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* ---- Header ---- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Understand your studio's performance
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

        {/* ---- Quick Pulse KPI Cards ---- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="pt-5 pb-4 px-4">
                <div className="flex items-center justify-between">
                  <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                  <Badge
                    className={`text-[10px] ${
                      kpi.positive
                        ? "bg-accent-sage/20 text-accent-sage"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {kpi.change}
                  </Badge>
                </div>
                <p className="text-2xl font-bold mt-2">{kpi.value}</p>
                <p className="text-xs text-muted-foreground flex items-center">
                  {kpi.label}
                  <InfoTip text={kpi.helpText} />
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ---- Navigation Cards (2x2) ---- */}
        <div className="grid sm:grid-cols-2 gap-4">
          {navCards.map((nav) => (
            <Link key={nav.title} to={nav.href} className="group">
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <nav.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                          {nav.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{nav.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {nav.highlights.map((h) => (
                      <div key={h.label} className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">{h.value}</span>
                        <span className="text-xs text-muted-foreground">{h.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* ---- Studio Health Score ---- */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Studio Health Score</CardTitle>
              <InfoTip text="A composite score (0-100) summarizing revenue stability, student retention, class utilization, and growth. Updated daily." />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Overall score */}
            <div className="flex items-center gap-4">
              <div
                className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white ${scoreBgColor(healthScore.overall)}`}
              >
                {healthScore.overall}
              </div>
              <div>
                <p className={`text-lg font-semibold ${scoreColor(healthScore.overall)}`}>
                  {healthScore.overall} / 100
                </p>
                <p className="text-sm text-muted-foreground">{healthScore.label}</p>
              </div>
            </div>

            {/* Sub-scores */}
            <div className="grid sm:grid-cols-2 gap-3">
              {healthScore.subscores.map((sub) => (
                <div key={sub.name} className="p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium">{sub.name}</p>
                    <span className={`text-sm font-bold ${scoreColor(sub.score)}`}>
                      {sub.score}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full ${scoreBgColor(sub.score)}`}
                      style={{ width: `${sub.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{sub.explanation}</p>
                </div>
              ))}
            </div>

            {/* Methodology collapsible */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                  How is this calculated?
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-4 rounded-xl bg-secondary/30 text-sm text-muted-foreground space-y-2">
                  <p>
                    The Studio Health Score is a weighted average of four factors that together
                    reflect how sustainably your studio is operating:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>
                      <span className="font-medium text-foreground">Revenue Health (30%)</span> --
                      looks at MRR growth, churn-related revenue loss, and revenue diversity.
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Student Retention (30%)</span> --
                      measures 30-day return rate, churn rate, and engagement score distribution.
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Class Utilization (20%)</span> --
                      average fill rate across all scheduled classes, weighted by time slot.
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Growth Trajectory (20%)</span> --
                      net new members, referral rate, and trial-to-member conversion.
                    </li>
                  </ul>
                  <p className="text-xs">
                    Scores above 75 indicate a healthy studio. Between 50-75 suggests areas for
                    improvement. Below 50 signals that action is needed soon.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* ---- Benchmark Comparison ---- */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">How Do You Compare?</CardTitle>
              <InfoTip text="We compare your metrics to the median for small yoga studios with 100-300 active members." />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {benchmarks.map((b) => {
              const yoursPercent = Math.min((b.yours / b.max) * 100, 100);
              const medianPercent = Math.min((b.median / b.max) * 100, 100);
              const isBetter = b.lowerIsBetter ? b.yours <= b.median : b.yours >= b.median;

              return (
                <div key={b.metric}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{b.metric}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={isBetter ? "text-accent-sage font-semibold" : "text-foreground font-semibold"}>
                        You: {b.unit}{b.yours}
                      </span>
                      <span className="text-muted-foreground">
                        Median: {b.unit}{b.median}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
                    {/* Median marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground/40 z-10"
                      style={{ left: `${medianPercent}%` }}
                    />
                    {/* Your value */}
                    <div
                      className={`h-full rounded-full ${isBetter ? "bg-accent-sage" : "bg-accent-coral"}`}
                      style={{ width: `${yoursPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground pt-1">
              Benchmarks based on industry data for small yoga studios. The vertical line marks the
              median.
            </p>
          </CardContent>
        </Card>

        {/* ---- Scheduled Reports ---- */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Scheduled Reports
              </CardTitle>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Schedule a Report
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {scheduledReports.map((report, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{report.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.schedule}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground hidden sm:block">{report.recipients}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ManageLayout>
  );
}
