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
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Share2,
  Target,
  Tag,
  ArrowRight,
  UserPlus,
  Gift,
  Percent,
  Info,
  MousePointerClick,
  Smartphone,
  Monitor,
  Tablet,
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
// Mock data -- Acquisition
// ---------------------------------------------------------------------------

const acquisitionSources = [
  { source: "Organic Search", students: 4, pctTotal: 33, avgFirstPurchase: 149, convToMember: 58 },
  { source: "Referral", students: 3, pctTotal: 25, avgFirstPurchase: 135, convToMember: 78 },
  { source: "Promo Code", students: 2, pctTotal: 17, avgFirstPurchase: 95, convToMember: 55 },
  { source: "Event / Workshop", students: 1, pctTotal: 8, avgFirstPurchase: 75, convToMember: 42 },
  { source: "Walk-in", students: 1, pctTotal: 8, avgFirstPurchase: 25, convToMember: 35 },
  { source: "Landing Page", students: 1, pctTotal: 9, avgFirstPurchase: 110, convToMember: 62 },
];

const monthlyAcquisition = [
  { month: "Jan", count: 8 },
  { month: "Feb", count: 10 },
  { month: "Mar", count: 9 },
  { month: "Apr", count: 14 },
  { month: "May", count: 11 },
  { month: "Jun", count: 12 },
];

const firstPurchaseBreakdown = [
  { type: "Intro Pack", pct: 45 },
  { type: "Drop-in", pct: 28 },
  { type: "Monthly Membership", pct: 18 },
  { type: "Class Pack", pct: 9 },
];

// ---------------------------------------------------------------------------
// Mock data -- Promo Performance
// ---------------------------------------------------------------------------

const activePromos = [
  {
    name: "Welcome 20% Off",
    code: "WELCOME20",
    description: "20% off first purchase",
    redemptions: 23,
    revenue: 1840,
    roi: 287,
    discountGiven: 475,
    revenueGenerated: 1840,
    netLift: 1365,
    subsequentPurchases: 17,
    subsequentPct: 74,
  },
  {
    name: "Summer Savings",
    code: "SUMMER10",
    description: "$10 off any pack",
    redemptions: 8,
    revenue: 1760,
    roi: 220,
    discountGiven: 80,
    revenueGenerated: 1760,
    netLift: 1680,
    subsequentPurchases: 5,
    subsequentPct: 63,
  },
  {
    name: "Bring a Friend",
    code: "BRINGAFRIEND",
    description: "Free class for both",
    redemptions: 15,
    revenue: 2100,
    roi: 340,
    discountGiven: 375,
    revenueGenerated: 2100,
    netLift: 1725,
    subsequentPurchases: 12,
    subsequentPct: 80,
  },
];

// ---------------------------------------------------------------------------
// Mock data -- Conversion
// ---------------------------------------------------------------------------

const funnelSteps = [
  { label: "Visitors", value: 1240, rate: null },
  { label: "Account Created", value: 142, rate: 11.5 },
  { label: "First Booking", value: 98, rate: 69 },
  { label: "Checked In", value: 89, rate: 91 },
  { label: "Second Visit", value: 62, rate: 70 },
];

const landingPages = [
  { page: "/intro-offer", views: 420, signups: 58, rate: 13.8, top: true },
  { page: "/schedule", views: 380, signups: 34, rate: 8.9, top: false },
  { page: "/pricing", views: 260, signups: 28, rate: 10.8, top: false },
  { page: "/teachers", views: 110, signups: 12, rate: 10.9, top: false },
  { page: "/homepage", views: 70, signups: 10, rate: 14.3, top: true },
];

const deviceConversion = [
  { device: "Mobile", icon: Smartphone, traffic: 68, convRate: 8.2 },
  { device: "Desktop", icon: Monitor, traffic: 24, convRate: 14.1 },
  { device: "Tablet", icon: Tablet, traffic: 8, convRate: 11.3 },
];

const dropOffPoints = [
  { point: "Pricing page", pct: 42, suggestion: "Simplify pricing tiers or add a comparison table" },
  { point: "Schedule view to booking", pct: 31, suggestion: "Add a prominent 'Book Now' CTA on each class card" },
  { point: "Checkout", pct: 18, suggestion: "Reduce checkout steps or offer guest checkout" },
];

// ---------------------------------------------------------------------------
// Mock data -- Referrals
// ---------------------------------------------------------------------------

const topReferrers = [
  { name: "Maya Thompson", sent: 8, converted: 6, revenue: 1020, reward: "$90 credit" },
  { name: "Carlos Rivera", sent: 6, converted: 4, revenue: 680, reward: "$60 credit" },
  { name: "Priya Sharma", sent: 5, converted: 4, revenue: 640, reward: "$60 credit" },
  { name: "Liam O'Brien", sent: 4, converted: 3, revenue: 510, reward: "$45 credit" },
  { name: "Aisha Johnson", sent: 4, converted: 2, revenue: 380, reward: "$30 credit" },
  { name: "Others", sent: 7, converted: 3, revenue: 510, reward: "$45 credit" },
];

const referralFunnel = [
  { label: "Sent", value: 34, rate: null },
  { label: "Clicked", value: 28, rate: 82 },
  { label: "Signed Up", value: 24, rate: 86 },
  { label: "First Purchase", value: 22, rate: 92 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SalesAnalytics() {
  const [period, setPeriod] = useState("this_month");
  const [selectedPromo, setSelectedPromo] = useState(0);

  const maxAcquisition = Math.max(...monthlyAcquisition.map((m) => m.count));

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
          <span className="text-foreground font-medium">Sales & Conversion</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sales & Conversion</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acquisition channels, promo performance, and conversion funnels
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
        <Tabs defaultValue="acquisition" className="space-y-6">
          <TabsList>
            <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
            <TabsTrigger value="promos">Promo Performance</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
          </TabsList>

          {/* ================================================================
              ACQUISITION TAB
              ================================================================ */}
          <TabsContent value="acquisition" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="flex items-center justify-between">
                    <UserPlus className="h-5 w-5 text-primary" />
                    <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage">
                      <TrendingUp className="h-3 w-3 mr-1" /> +9%
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold mt-2">12</p>
                  <p className="text-xs text-muted-foreground">New Students This Month</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="flex items-center justify-between">
                    <DollarSign className="h-5 w-5 text-accent-gold" />
                    <InfoTip text="Estimated cost per acquired student based on total marketing spend divided by new signups this month." />
                  </div>
                  <p className="text-2xl font-bold mt-2">$42</p>
                  <p className="text-xs text-muted-foreground">Acquisition Cost (est.)</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="flex items-center justify-between">
                    <Share2 className="h-5 w-5 text-accent-coral" />
                  </div>
                  <p className="text-2xl font-bold mt-2">Referrals</p>
                  <p className="text-xs text-muted-foreground flex items-center">
                    Top Source (38%)
                    <InfoTip text="The acquisition channel that brought in the most new students this period." />
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="flex items-center justify-between">
                    <Target className="h-5 w-5 text-accent-sage" />
                    <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage">
                      <TrendingUp className="h-3 w-3 mr-1" /> +5%
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold mt-2">71%</p>
                  <p className="text-xs text-muted-foreground flex items-center">
                    Trial-to-Paid Rate
                    <InfoTip text="Percentage of trial/intro pack students who convert to a paid membership or class pack." />
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Acquisition by Source Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Acquisition by Source</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Table header */}
                <div className="hidden md:grid grid-cols-[2fr,1fr,1fr,1fr,1fr] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span>Source</span>
                  <span>New Students</span>
                  <span>% of Total</span>
                  <span>Avg First Purchase</span>
                  <span>Conv. to Member</span>
                </div>
                {acquisitionSources.map((row, i) => (
                  <div
                    key={i}
                    className="grid md:grid-cols-[2fr,1fr,1fr,1fr,1fr] gap-4 px-4 py-3 border-b border-border last:border-0 items-center"
                  >
                    <p className="text-sm font-medium">{row.source}</p>
                    <p className="text-sm">{row.students}</p>
                    <p className="text-sm text-muted-foreground">{row.pctTotal}%</p>
                    <p className="text-sm text-accent-gold">${row.avgFirstPurchase}</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${row.convToMember >= 70 ? "text-accent-sage" : ""}`}>
                        {row.convToMember}%
                      </p>
                      {row.convToMember >= 70 && (
                        <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage">Best</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Monthly Acquisition Trend */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Monthly Acquisition Trend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {monthlyAcquisition.map((m) => (
                    <div key={m.month} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-8 shrink-0">{m.month}</span>
                      <div className="flex-1 h-6 bg-secondary/30 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-primary/70 rounded-lg flex items-center justify-end pr-2"
                          style={{ width: `${(m.count / maxAcquisition) * 100}%` }}
                        >
                          <span className="text-[10px] font-semibold text-primary-foreground">
                            {m.count}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground pt-1">
                    Last 6 months. April saw the highest acquisition driven by spring promos.
                  </p>
                </CardContent>
              </Card>

              {/* First Purchase Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    First Purchase Breakdown
                    <InfoTip text="What new students purchase first when they sign up. Intro Packs are the most common entry point." />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {firstPurchaseBreakdown.map((item) => (
                    <div key={item.type}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{item.type}</p>
                        <p className="text-sm font-semibold">{item.pct}%</p>
                      </div>
                      <div className="h-3 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ================================================================
              PROMO PERFORMANCE TAB
              ================================================================ */}
          <TabsContent value="promos" className="space-y-6">
            {/* Active Promo Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {activePromos.map((promo, i) => (
                <Card
                  key={promo.code}
                  className={`cursor-pointer transition-colors ${
                    selectedPromo === i ? "border-primary/60" : "hover:border-primary/30"
                  }`}
                  onClick={() => setSelectedPromo(i)}
                >
                  <CardContent className="pt-5 pb-4 px-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs font-mono">
                        {promo.code}
                      </Badge>
                      <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage">
                        ROI {promo.roi}%
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold">{promo.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{promo.description}</p>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                      <div>
                        <p className="text-sm font-bold">{promo.redemptions}</p>
                        <p className="text-[10px] text-muted-foreground">Uses</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-accent-gold">
                          ${promo.revenue.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Promo ROI Calculator */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    Promo ROI Calculator
                    <InfoTip text="Shows the return on investment for the selected promotion, including subsequent purchases made by promo users within 30 days." />
                  </CardTitle>
                  <Badge variant="outline" className="text-xs font-mono">
                    {activePromos[selectedPromo].code}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-destructive/5 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Discount Given
                    </p>
                    <p className="text-xl font-bold text-destructive mt-1">
                      ${activePromos[selectedPromo].discountGiven.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50 text-center relative">
                    <ArrowRight className="hidden lg:block absolute -left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Revenue Generated
                    </p>
                    <p className="text-xl font-bold text-accent-gold mt-1">
                      ${activePromos[selectedPromo].revenueGenerated.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50 text-center relative">
                    <ArrowRight className="hidden lg:block absolute -left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Net Lift
                    </p>
                    <p className="text-xl font-bold text-accent-sage mt-1">
                      ${activePromos[selectedPromo].netLift.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-accent-sage/10 text-center relative">
                    <ArrowRight className="hidden lg:block absolute -left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">ROI</p>
                    <p className="text-xl font-bold text-accent-sage mt-1">
                      {activePromos[selectedPromo].roi}%
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-secondary/30">
                  <p className="text-sm font-medium mb-1">Subsequent Purchases (within 30 days)</p>
                  <p className="text-xs text-muted-foreground">
                    {activePromos[selectedPromo].subsequentPurchases} of{" "}
                    {activePromos[selectedPromo].redemptions} promo users made another purchase (
                    <span className="text-accent-sage font-semibold">
                      {activePromos[selectedPromo].subsequentPct}%
                    </span>
                    )
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sales Lift Analysis */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Sales Lift Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/50 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Before Promo
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Weekly Revenue</p>
                    <p className="text-xl font-bold mt-2">$4,200</p>
                  </div>
                  <div className="p-4 rounded-xl bg-accent-sage/10 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      During Promo
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Weekly Revenue</p>
                    <p className="text-xl font-bold mt-2">$5,100</p>
                    <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage mt-1">
                      +21%
                    </Badge>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      After Promo
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Weekly Revenue</p>
                    <p className="text-xl font-bold mt-2">$4,500</p>
                    <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage mt-1">
                      +7% sustained
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ROI Info Box */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/30 border border-border">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">How ROI is calculated:</span>{" "}
                (Revenue from promo users - Discount given) / Discount given. This measures how much
                additional revenue each dollar of discount generates.
              </p>
            </div>
          </TabsContent>

          {/* ================================================================
              CONVERSION TAB
              ================================================================ */}
          <TabsContent value="conversion" className="space-y-6">
            {/* Site-to-Signup Funnel */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  Site-to-Signup Funnel
                  <InfoTip text="Tracks visitors from their first site visit through account creation, booking, check-in, and return visit." />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {funnelSteps.map((step, i) => {
                  const widthPct = (step.value / funnelSteps[0].value) * 100;
                  return (
                    <div key={step.label}>
                      {step.rate !== null && (
                        <div className="flex items-center justify-center mb-1">
                          <span className="text-xs text-muted-foreground">
                            {step.rate}% conversion
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-28 shrink-0 text-right">
                          {step.label}
                        </span>
                        <div className="flex-1">
                          <div
                            className="h-8 bg-primary/60 rounded-lg flex items-center px-3 transition-all"
                            style={{ width: `${Math.max(widthPct, 12)}%` }}
                          >
                            <span className="text-xs font-semibold text-primary-foreground">
                              {step.value.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Conversion by Landing Page */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Conversion by Landing Page</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="hidden md:grid grid-cols-[2fr,1fr,1fr,1fr] gap-3 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
                    <span>Page</span>
                    <span>Views</span>
                    <span>Signups</span>
                    <span>Conv. Rate</span>
                  </div>
                  {landingPages.map((page) => (
                    <div
                      key={page.page}
                      className={`grid md:grid-cols-[2fr,1fr,1fr,1fr] gap-3 px-3 py-2.5 border-b border-border last:border-0 items-center ${
                        page.top ? "bg-accent-sage/5" : ""
                      }`}
                    >
                      <p className="text-sm font-medium font-mono">{page.page}</p>
                      <p className="text-sm text-muted-foreground">
                        {page.views.toLocaleString()}
                      </p>
                      <p className="text-sm">{page.signups}</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold ${page.top ? "text-accent-sage" : ""}`}>
                          {page.rate}%
                        </p>
                        {page.top && (
                          <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage">
                            Top
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Conversion by Device */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Conversion by Device</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {deviceConversion.map((d) => (
                    <div key={d.device} className="p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <d.icon className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-semibold">{d.device}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {d.traffic}% traffic
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-4">
                          <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary/60"
                              style={{ width: `${(d.convRate / 15) * 100}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-sm font-bold">{d.convRate}% conv.</p>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Desktop has the highest conversion rate despite lower traffic share. Consider
                    optimizing the mobile booking experience.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Booking Conversion Optimization */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <MousePointerClick className="h-4 w-4 text-muted-foreground mr-2" />
                  Where Visitors Drop Off
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dropOffPoints.map((point) => (
                  <div key={point.point} className="p-4 rounded-xl bg-secondary/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold">{point.point}</p>
                      <Badge className="text-[10px] bg-destructive/10 text-destructive">
                        {point.pct}% drop-off
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Suggestion:</span>{" "}
                      {point.suggestion}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================
              REFERRALS TAB
              ================================================================ */}
          <TabsContent value="referrals" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-5 pb-4 px-4">
                  <Gift className="h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold mt-2">1</p>
                  <p className="text-xs text-muted-foreground">Active Referral Program</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5 pb-4 px-4">
                  <Users className="h-5 w-5 text-accent-coral" />
                  <p className="text-2xl font-bold mt-2">34</p>
                  <p className="text-xs text-muted-foreground">Total Referrals</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="flex items-center justify-between">
                    <Target className="h-5 w-5 text-accent-sage" />
                    <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage">65%</Badge>
                  </div>
                  <p className="text-2xl font-bold mt-2">22</p>
                  <p className="text-xs text-muted-foreground">Successful Conversions</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5 pb-4 px-4">
                  <DollarSign className="h-5 w-5 text-accent-gold" />
                  <p className="text-2xl font-bold mt-2">$3,740</p>
                  <p className="text-xs text-muted-foreground">Referral Revenue</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Referrers Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Top Referrers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="hidden md:grid grid-cols-[2fr,1fr,1fr,1fr,1fr] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span>Name</span>
                  <span>Sent</span>
                  <span>Converted</span>
                  <span>Revenue</span>
                  <span>Reward</span>
                </div>
                {topReferrers.map((ref, i) => (
                  <div
                    key={i}
                    className="grid md:grid-cols-[2fr,1fr,1fr,1fr,1fr] gap-4 px-4 py-3 border-b border-border last:border-0 items-center"
                  >
                    <p className="text-sm font-medium">{ref.name}</p>
                    <p className="text-sm">{ref.sent}</p>
                    <p className="text-sm text-accent-sage font-semibold">{ref.converted}</p>
                    <p className="text-sm text-accent-gold font-semibold">
                      ${ref.revenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{ref.reward}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Referral Funnel */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Referral Funnel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {referralFunnel.map((step) => {
                    const widthPct = (step.value / referralFunnel[0].value) * 100;
                    return (
                      <div key={step.label}>
                        {step.rate !== null && (
                          <div className="flex items-center justify-center mb-1">
                            <span className="text-xs text-muted-foreground">
                              {step.rate}% conversion
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-24 shrink-0 text-right">
                            {step.label}
                          </span>
                          <div className="flex-1">
                            <div
                              className="h-7 bg-accent-sage/60 rounded-lg flex items-center px-3"
                              style={{ width: `${Math.max(widthPct, 20)}%` }}
                            >
                              <span className="text-xs font-semibold text-white">{step.value}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Referral vs Other Sources */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    Referral vs Other Sources
                    <InfoTip text="Compares average Customer Lifetime Value (CLV) across acquisition channels. Referred students tend to stay longer and spend more." />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { source: "Referral", clv: 1680, best: true },
                    { source: "Organic", clv: 1120, best: false },
                    { source: "Promo", clv: 940, best: false },
                  ].map((item) => (
                    <div key={item.source} className="p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold">{item.source}</p>
                        <p className={`text-lg font-bold ${item.best ? "text-accent-sage" : ""}`}>
                          ${item.clv.toLocaleString()}
                        </p>
                      </div>
                      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.best ? "bg-accent-sage" : "bg-primary/40"}`}
                          style={{ width: `${(item.clv / 1680) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Avg CLV</p>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Referred students have 50% higher lifetime value than organic signups and 79%
                    higher than promo-acquired students.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ManageLayout>
  );
}
