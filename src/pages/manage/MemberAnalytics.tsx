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
  Users,
  UserPlus,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Download,
  ChevronLeft,
  HelpCircle,
  ArrowRight,
  Clock,
  Flame,
  Sun,
  Moon,
  Sunrise,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Inline info toggle
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
// Mock data
// ---------------------------------------------------------------------------

// --- Overview ---

const overviewKpis = [
  {
    label: "Total Members",
    value: "347",
    icon: Users,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    sub: "All time registered",
  },
  {
    label: "Active This Month",
    value: "163",
    icon: UserCheck,
    iconBg: "bg-accent-sage/20",
    iconColor: "text-accent-sage",
    sub: "Attended 1+ class",
  },
  {
    label: "New This Month",
    value: "12",
    change: "+20%",
    positive: true,
    icon: UserPlus,
    iconBg: "bg-accent-gold/20",
    iconColor: "text-accent-gold",
    sub: "vs last month",
  },
  {
    label: "At-Risk",
    value: "8",
    icon: AlertTriangle,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    sub: "Low engagement score",
    helpText:
      "Students whose engagement score dropped below 30 or who haven't attended in 14+ days despite having an active membership.",
  },
];

const funnelSteps = [
  { stage: "Trial", count: 45, rate: null },
  { stage: "First Purchase", count: 32, rate: 71 },
  { stage: "3-Month Active", count: 24, rate: 75 },
  { stage: "6-Month Active", count: 18, rate: 75 },
  { stage: "1-Year Active", count: 12, rate: 67 },
];

const retentionCurve = [
  { period: "30 days", rate: 87 },
  { period: "90 days", rate: 72 },
  { period: "180 days", rate: 58 },
  { period: "365 days", rate: 41 },
];

const atRiskMembers = [
  { name: "Jordan Blake", lastVisit: "Jan 12", daysSince: 23, risk: "high", score: 18, action: "Send re-engagement email" },
  { name: "Casey Nguyen", lastVisit: "Jan 18", daysSince: 17, risk: "high", score: 22, action: "Offer a free class" },
  { name: "Taylor Reed", lastVisit: "Jan 20", daysSince: 15, risk: "medium", score: 35, action: "Personal check-in" },
  { name: "Morgan Ellis", lastVisit: "Jan 22", daysSince: 13, risk: "medium", score: 38, action: "Recommend new class" },
  { name: "Riley Kim", lastVisit: "Jan 23", daysSince: 12, risk: "medium", score: 40, action: "Send schedule update" },
  { name: "Avery Chen", lastVisit: "Jan 24", daysSince: 11, risk: "low", score: 45, action: "Monitor" },
  { name: "Quinn Davis", lastVisit: "Jan 25", daysSince: 10, risk: "low", score: 48, action: "Monitor" },
  { name: "Sam Foster", lastVisit: "Jan 25", daysSince: 10, risk: "low", score: 49, action: "Monitor" },
];

// --- Engagement ---

const engagementDistribution = [
  { range: "0-20", count: 14, color: "bg-destructive" },
  { range: "21-40", count: 28, color: "bg-accent-coral" },
  { range: "41-60", count: 45, color: "bg-accent-gold" },
  { range: "61-80", count: 52, color: "bg-accent-sage" },
  { range: "81-100", count: 24, color: "bg-primary" },
];

const streakLeaderboard = [
  { name: "Mia Tanaka", streak: 42, classes: 156 },
  { name: "Alex Rivera", streak: 38, classes: 201 },
  { name: "Sarah Kim", streak: 31, classes: 98 },
  { name: "Noah Garcia", streak: 28, classes: 134 },
  { name: "Emma Wilson", streak: 24, classes: 87 },
  { name: "Liam Johnson", streak: 21, classes: 112 },
  { name: "Olivia Brown", streak: 19, classes: 76 },
  { name: "James Liu", streak: 17, classes: 145 },
  { name: "Sophia Martinez", streak: 15, classes: 63 },
  { name: "Ethan Park", streak: 14, classes: 89 },
];

const timeSlots = [
  { slot: "Morning (6-11 AM)", percent: 42, icon: Sunrise },
  { slot: "Midday (11 AM-3 PM)", percent: 23, icon: Sun },
  { slot: "Evening (3-9 PM)", percent: 35, icon: Moon },
];

const stylePreferences = [
  { style: "Vinyasa", students: 98, percent: 60 },
  { style: "Hot Yoga", students: 67, percent: 41 },
  { style: "Yin / Restorative", students: 54, percent: 33 },
  { style: "Power Yoga", students: 45, percent: 28 },
  { style: "Gentle / Beginner", students: 31, percent: 19 },
];

// --- Cohorts ---

const monthlyCohorts = [
  { month: "Aug 2024", sizes: [100, 84, 72, 61, 54, 47] },
  { month: "Sep 2024", sizes: [100, 81, 68, 58, 50, null] },
  { month: "Oct 2024", sizes: [100, 78, 65, 55, null, null] },
  { month: "Nov 2024", sizes: [100, 82, 70, null, null, null] },
  { month: "Dec 2024", sizes: [100, 76, null, null, null, null] },
  { month: "Jan 2025", sizes: [100, null, null, null, null, null] },
];

const cohortBySource = [
  { source: "Organic", m1: 100, m2: 82, m3: 71, m4: 63 },
  { source: "Referral", m1: 100, m2: 88, m3: 79, m4: 72 },
  { source: "Promo", m1: 100, m2: 74, m3: 58, m4: 45 },
  { source: "Event", m1: 100, m2: 80, m3: 66, m4: 55 },
  { source: "Walk-in", m1: 100, m2: 70, m3: 52, m4: 38 },
];

// --- Lifetime Value ---

const clvKpis = [
  { label: "Avg CLV", value: "$1,240", helpText: "Average total revenue generated per student over their entire membership lifetime." },
  { label: "Median CLV", value: "$980", helpText: "The middle value -- half of students generate more and half generate less." },
  { label: "Top Source", value: "$1,680", sub: "Referral", helpText: "Referrals produce the highest lifetime value on average." },
  { label: "Payback Period", value: "2.3 mo", helpText: "How long it takes to recoup the cost of acquiring a new student." },
];

const clvBySource = [
  { source: "Referral", students: 42, avgClv: 1680, avgClasses: 84, avgMonths: 14.2 },
  { source: "Organic", students: 98, avgClv: 1340, avgClasses: 68, avgMonths: 11.8 },
  { source: "Event", students: 28, avgClv: 1120, avgClasses: 52, avgMonths: 9.4 },
  { source: "Promo", students: 35, avgClv: 890, avgClasses: 42, avgMonths: 7.6 },
  { source: "Walk-in", students: 18, avgClv: 740, avgClasses: 34, avgMonths: 6.1 },
];

const clvTrend = [
  { cohort: "Aug", avgClv: 1180 },
  { cohort: "Sep", avgClv: 1210 },
  { cohort: "Oct", avgClv: 1190 },
  { cohort: "Nov", avgClv: 1260 },
  { cohort: "Dec", avgClv: 1280 },
  { cohort: "Jan", avgClv: 1320 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function riskBadge(level: string) {
  switch (level) {
    case "high":
      return <Badge className="text-[10px] bg-destructive/10 text-destructive">High Risk</Badge>;
    case "medium":
      return <Badge className="text-[10px] bg-accent-gold/20 text-accent-gold">Medium</Badge>;
    default:
      return <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage">Low</Badge>;
  }
}

function cohortCellColor(value: number | null) {
  if (value === null) return "bg-secondary/30 text-muted-foreground";
  if (value >= 80) return "bg-accent-sage/30 text-accent-sage font-semibold";
  if (value >= 60) return "bg-accent-sage/15 text-accent-sage";
  if (value >= 40) return "bg-accent-gold/20 text-accent-gold";
  if (value >= 20) return "bg-accent-coral/20 text-accent-coral";
  return "bg-destructive/15 text-destructive";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MemberAnalytics() {
  const [period, setPeriod] = useState("this_month");

  // For the engagement distribution histogram, find the max count for scaling
  const maxEngagement = Math.max(...engagementDistribution.map((d) => d.count));

  // For CLV trend, find min/max for simple sparkline
  const clvMax = Math.max(...clvTrend.map((c) => c.avgClv));
  const clvMin = Math.min(...clvTrend.map((c) => c.avgClv));

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* ---- Header ---- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                to="/manage/analytics"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Analytics
              </Link>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Member Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Retention, engagement, and lifetime value insights
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

        {/* ---- Tabs ---- */}
        <Tabs defaultValue="overview">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
            <TabsTrigger value="ltv">Lifetime Value</TabsTrigger>
          </TabsList>

          {/* ================================================================
              OVERVIEW TAB
              ================================================================ */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {overviewKpis.map((kpi) => (
                <Card key={kpi.label}>
                  <CardContent className="pt-5 pb-4 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                          {kpi.label}
                          {kpi.helpText && <InfoTip text={kpi.helpText} />}
                        </p>
                        <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                      </div>
                      <div className={`h-10 w-10 rounded-xl ${kpi.iconBg} flex items-center justify-center`}>
                        <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      {kpi.change && kpi.positive && (
                        <TrendingUp className="h-3 w-3 text-accent-sage" />
                      )}
                      {kpi.change && !kpi.positive && (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      )}
                      {kpi.change ? (
                        <span className={kpi.positive ? "text-accent-sage" : "text-destructive"}>
                          {kpi.change}
                        </span>
                      ) : null}
                      {kpi.change && " "}{kpi.sub}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Member Funnel */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Member Funnel</CardTitle>
                    <InfoTip text="Shows how students progress from their first trial through long-term membership. Each step shows what percentage of students advance." />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {funnelSteps.map((step, i) => {
                    const widthPercent = (step.count / funnelSteps[0].count) * 100;
                    return (
                      <div key={step.stage}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{step.stage}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{step.count}</span>
                            {step.rate !== null && (
                              <span className="text-xs text-muted-foreground">
                                ({step.rate}% conversion)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-3 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                        {i < funnelSteps.length - 1 && (
                          <div className="flex justify-center py-0.5">
                            <ArrowRight className="h-3 w-3 text-muted-foreground rotate-90" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Retention Curve */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Retention Curve</CardTitle>
                    <InfoTip text="What percentage of students are still active after each time period. Industry benchmark for yoga studios is around 70% at 90 days." />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {retentionCurve.map((r) => (
                    <div key={r.period}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{r.period}</p>
                        <span
                          className={`text-sm font-semibold ${
                            r.rate >= 70
                              ? "text-accent-sage"
                              : r.rate >= 50
                              ? "text-accent-gold"
                              : "text-accent-coral"
                          }`}
                        >
                          {r.rate}%
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            r.rate >= 70
                              ? "bg-accent-sage"
                              : r.rate >= 50
                              ? "bg-accent-gold"
                              : "bg-accent-coral"
                          }`}
                          style={{ width: `${r.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground pt-1">
                    Retention is measured from each student's first class date.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* At-Risk Members */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-accent-gold" />
                    At-Risk Members
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                        <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Visit</th>
                        <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Days Since</th>
                        <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Risk Level</th>
                        <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Score
                          <InfoTip text="Engagement score (0-100) based on attendance frequency, recency, and booking patterns." />
                        </th>
                        <th className="text-left py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Suggested Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {atRiskMembers.map((member, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0">
                          <td className="py-2.5 pr-4 font-medium">{member.name}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{member.lastVisit}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{member.daysSince}</td>
                          <td className="py-2.5 pr-4">{riskBadge(member.risk)}</td>
                          <td className="py-2.5 pr-4">
                            <span className={member.score < 30 ? "text-destructive font-semibold" : "text-accent-gold font-semibold"}>
                              {member.score}
                            </span>
                          </td>
                          <td className="py-2.5 text-muted-foreground">{member.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================
              ENGAGEMENT TAB
              ================================================================ */}
          <TabsContent value="engagement" className="space-y-6 mt-4">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Engagement Score Distribution */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Engagement Score Distribution</CardTitle>
                    <InfoTip text="Shows how your students are spread across engagement levels. A healthy studio has most students in the 61-100 range." />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {engagementDistribution.map((bucket) => (
                    <div key={bucket.range} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-12 text-right text-muted-foreground">
                        {bucket.range}
                      </span>
                      <div className="flex-1 h-6 rounded bg-secondary/50 overflow-hidden relative">
                        <div
                          className={`h-full rounded ${bucket.color} transition-all`}
                          style={{ width: `${(bucket.count / maxEngagement) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-8">{bucket.count}</span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground pt-1">
                    {engagementDistribution
                      .filter((b) => b.range === "61-80" || b.range === "81-100")
                      .reduce((sum, b) => sum + b.count, 0)}{" "}
                    of {engagementDistribution.reduce((sum, b) => sum + b.count, 0)} students (
                    {Math.round(
                      (engagementDistribution
                        .filter((b) => b.range === "61-80" || b.range === "81-100")
                        .reduce((sum, b) => sum + b.count, 0) /
                        engagementDistribution.reduce((sum, b) => sum + b.count, 0)) *
                        100
                    )}
                    %) are highly engaged
                  </p>
                </CardContent>
              </Card>

              {/* Streak Leaderboard */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Flame className="h-4 w-4 text-accent-coral" />
                    Streak Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {streakLeaderboard.map((student, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold w-5 text-center ${i < 3 ? "text-accent-gold" : "text-muted-foreground"}`}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.classes} total classes</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {student.streak} day streak
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Preferred Time Slots */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Preferred Time Slots</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {timeSlots.map((ts) => (
                    <div key={ts.slot} className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                        <ts.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{ts.slot}</p>
                          <span className="text-sm font-semibold">{ts.percent}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${ts.percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Style Preferences */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Style Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stylePreferences.map((s) => (
                    <div key={s.style} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30">
                      <div>
                        <p className="text-sm font-medium">{s.style}</p>
                        <p className="text-xs text-muted-foreground">{s.students} students</p>
                      </div>
                      <span className="text-sm font-semibold">{s.percent}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Activation Metrics */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Activation Metrics</CardTitle>
                    <InfoTip text="Activation means a trial member books and attends their second class. Faster activation correlates with higher long-term retention." />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-secondary/50 text-center">
                    <Clock className="h-5 w-5 text-primary mx-auto" />
                    <p className="text-2xl font-bold mt-2">4.2 days</p>
                    <p className="text-xs text-muted-foreground">Avg Time to Activate</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50 text-center">
                    <UserCheck className="h-5 w-5 text-accent-sage mx-auto" />
                    <p className="text-2xl font-bold mt-2">71%</p>
                    <p className="text-xs text-muted-foreground">Activation Rate</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Students who activate within 7 days retain at 2x the rate of those who take
                    longer.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ================================================================
              COHORTS TAB
              ================================================================ */}
          <TabsContent value="cohorts" className="space-y-6 mt-4">
            {/* Monthly Cohort Retention */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Monthly Cohort Retention</CardTitle>
                  <InfoTip text="Each row is a group of students who signed up in the same month. The columns show what percentage are still active in subsequent months. Green is good, red needs attention." />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Signup Month
                        </th>
                        {["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"].map(
                          (col) => (
                            <th
                              key={col}
                              className="text-center py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"
                            >
                              {col}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyCohorts.map((cohort, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0">
                          <td className="py-2 pr-4 font-medium">{cohort.month}</td>
                          {cohort.sizes.map((val, j) => (
                            <td key={j} className="py-2 px-2 text-center">
                              <span
                                className={`inline-block w-12 py-1 rounded text-xs ${cohortCellColor(val)}`}
                              >
                                {val !== null ? `${val}%` : "--"}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Read each row left-to-right to see how that cohort retained over time. Month 1 is
                  always 100% (everyone is active the month they sign up).
                </p>
              </CardContent>
            </Card>

            {/* Cohort by Acquisition Source */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Cohort by Acquisition Source</CardTitle>
                  <InfoTip text="Compares retention across the channel that brought each student in. This helps you understand which marketing channels attract students who stick around." />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Source
                        </th>
                        {["Month 1", "Month 2", "Month 3", "Month 4"].map((col) => (
                          <th
                            key={col}
                            className="text-center py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cohortBySource.map((row, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0">
                          <td className="py-2 pr-4 font-medium">{row.source}</td>
                          {[row.m1, row.m2, row.m3, row.m4].map((val, j) => (
                            <td key={j} className="py-2 px-2 text-center">
                              <span
                                className={`inline-block w-12 py-1 rounded text-xs ${cohortCellColor(val)}`}
                              >
                                {val}%
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Referral students retain significantly better than promo or walk-in acquisitions.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================
              LIFETIME VALUE TAB
              ================================================================ */}
          <TabsContent value="ltv" className="space-y-6 mt-4">
            {/* CLV KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {clvKpis.map((kpi) => (
                <Card key={kpi.label}>
                  <CardContent className="pt-5 pb-4 px-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                      {kpi.label}
                      <InfoTip text={kpi.helpText} />
                    </p>
                    <p className="text-2xl font-bold mt-2">{kpi.value}</p>
                    {kpi.sub && (
                      <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* CLV by Acquisition Source */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">CLV by Acquisition Source</CardTitle>
                    <InfoTip text="Which channels bring the most valuable long-term students? Higher CLV means students from that channel spend more over their lifetime." />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Students</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg CLV</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Classes</th>
                          <th className="text-right py-2 pl-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Months</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clvBySource.map((row, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0">
                            <td className="py-2.5 pr-3 font-medium">{row.source}</td>
                            <td className="py-2.5 px-3 text-right text-muted-foreground">{row.students}</td>
                            <td className="py-2.5 px-3 text-right font-semibold">${row.avgClv.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right text-muted-foreground">{row.avgClasses}</td>
                            <td className="py-2.5 pl-3 text-right text-muted-foreground">{row.avgMonths}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* CLV Trend */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">CLV Trend by Cohort</CardTitle>
                    <InfoTip text="Average customer lifetime value for each monthly cohort. An upward trend means newer students are on track to be more valuable." />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end gap-2 h-32">
                    {clvTrend.map((point) => {
                      const range = clvMax - clvMin || 1;
                      const heightPercent = ((point.avgClv - clvMin) / range) * 60 + 40;
                      return (
                        <div key={point.cohort} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] font-semibold">
                            ${(point.avgClv / 1000).toFixed(1)}K
                          </span>
                          <div
                            className="w-full rounded-t bg-primary"
                            style={{ height: `${heightPercent}%` }}
                          />
                          <span className="text-[10px] text-muted-foreground">{point.cohort}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-accent-sage">
                    <TrendingUp className="h-3.5 w-3.5" />
                    CLV is trending upward -- newer cohorts are more valuable
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Concentration */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Revenue Concentration</CardTitle>
                  <InfoTip text="The Pareto principle applied to your studio: what share of revenue comes from your most active students. A lower number means revenue is more evenly distributed, which is healthier." />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="p-5 rounded-xl bg-secondary/50 text-center flex-shrink-0">
                    <p className="text-3xl font-bold text-primary">62%</p>
                    <p className="text-xs text-muted-foreground mt-1">of total revenue</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm">
                      Your <span className="font-semibold">top 20% of students</span> generate{" "}
                      <span className="font-semibold text-primary">62%</span> of total revenue.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This is typical for small studios. Focus on retaining these high-value
                      members while also growing your mid-tier base to reduce concentration risk.
                    </p>
                    <div className="h-3 rounded-full bg-secondary overflow-hidden flex">
                      <div className="h-full bg-primary" style={{ width: "62%" }} />
                      <div className="h-full bg-accent-sage/30" style={{ width: "38%" }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Top 20% of students</span>
                      <span>Remaining 80%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What is CLV info box */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">What is Customer Lifetime Value (CLV)?</p>
                    <p className="text-sm text-muted-foreground">
                      CLV is the total revenue a student generates over their entire time as a
                      member of your studio. It includes membership fees, class packs, workshops,
                      retail purchases, and any other spending.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Knowing your CLV helps you decide how much to spend on acquiring new
                      students. For example, if your average CLV is $1,240 and it costs $80 to
                      acquire a student, your return on investment is strong. If acquisition costs
                      rise above your payback period threshold, you may want to shift marketing
                      spend toward higher-value channels like referrals.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ManageLayout>
  );
}
