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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Download,
  Eye,
  Globe,
  HelpCircle,
  Info,
  Mail,
  Monitor,
  Search,
  Smartphone,
  Tablet,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

// ---------------------------------------------------------------------------
// InfoTip -- togglable explanation for non-technical studio owners
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
// Mock data -- Traffic tab
// ---------------------------------------------------------------------------

const trafficKpis = [
  {
    label: "Sessions",
    value: "1,240",
    change: "+12%",
    positive: true,
    icon: Activity,
    iconColor: "text-primary",
    helpText:
      "A session is a single visit to your site. If one person visits your site twice in a day, that counts as two sessions.",
  },
  {
    label: "Unique Visitors",
    value: "890",
    change: "+9%",
    positive: true,
    icon: Users,
    iconColor: "text-accent-sage",
    helpText:
      "The number of distinct people who visited your site during this period, regardless of how many times they visited.",
  },
  {
    label: "Page Views",
    value: "4,320",
    change: "+15%",
    positive: true,
    icon: Eye,
    iconColor: "text-accent-gold",
    helpText:
      "The total number of pages viewed. A single visitor viewing 5 pages counts as 5 page views.",
  },
  {
    label: "Avg Session Duration",
    value: "3m 24s",
    change: "+8%",
    positive: true,
    icon: BarChart3,
    iconColor: "text-accent-coral",
    helpText:
      "How long visitors typically spend on your site per visit. Longer sessions often indicate more engaged visitors.",
  },
];

const deviceBreakdown = [
  { label: "Mobile", percent: 68, icon: Smartphone },
  { label: "Desktop", percent: 24, icon: Monitor },
  { label: "Tablet", percent: 8, icon: Tablet },
];

const topPages = [
  { page: "Schedule", views: 1200, uniqueViews: 940, avgTime: "2m 45s", bounceRate: "18%" },
  { page: "Home", views: 980, uniqueViews: 780, avgTime: "1m 50s", bounceRate: "42%" },
  { page: "Class Detail Pages", views: 720, uniqueViews: 580, avgTime: "3m 10s", bounceRate: "24%" },
  { page: "Pricing", views: 540, uniqueViews: 420, avgTime: "2m 30s", bounceRate: "35%" },
  { page: "About / Teachers", views: 380, uniqueViews: 310, avgTime: "1m 40s", bounceRate: "48%" },
  { page: "Events", views: 210, uniqueViews: 170, avgTime: "2m 05s", bounceRate: "30%" },
];

const trafficByDay = [
  { day: "Mon", sessions: 210 },
  { day: "Tue", sessions: 205 },
  { day: "Wed", sessions: 185 },
  { day: "Thu", sessions: 175 },
  { day: "Fri", sessions: 170 },
  { day: "Sat", sessions: 130 },
  { day: "Sun", sessions: 165 },
];

const visitorSplit = { returning: 62, new: 38 };

// ---------------------------------------------------------------------------
// Mock data -- Attribution tab
// ---------------------------------------------------------------------------

const trafficSources = [
  { source: "Direct", sessions: 420, percent: "33.9%", signups: 38, convRate: "9.0%" },
  { source: "Google Organic", sessions: 340, percent: "27.4%", signups: 42, convRate: "12.4%" },
  { source: "Instagram", sessions: 180, percent: "14.5%", signups: 22, convRate: "12.2%" },
  { source: "Referral Links", sessions: 120, percent: "9.7%", signups: 18, convRate: "15.0%" },
  { source: "Google Ads", sessions: 95, percent: "7.7%", signups: 12, convRate: "12.6%" },
  { source: "Email", sessions: 55, percent: "4.4%", signups: 8, convRate: "14.5%" },
  { source: "Other", sessions: 30, percent: "2.4%", signups: 2, convRate: "6.7%" },
];

const bestConversionSource = "Referral Links";

const utmCampaigns = [
  { name: "january_promo", source: "Google Ads", medium: "cpc", sessions: 95, conversions: 12, convRate: "12.6%" },
  { name: "class_launch_email", source: "Email", medium: "email", sessions: 42, conversions: 7, convRate: "16.7%" },
  { name: "instagram_stories", source: "Instagram", medium: "social", sessions: 68, conversions: 9, convRate: "13.2%" },
];

const referrerDomains = [
  { domain: "google.com", sessions: 340 },
  { domain: "instagram.com", sessions: 180 },
  { domain: "facebook.com", sessions: 65 },
  { domain: "yelp.com", sessions: 42 },
  { domain: "classpass.com", sessions: 38 },
  { domain: "local-blog.com", sessions: 28 },
  { domain: "yoga-directory.com", sessions: 18 },
  { domain: "nextdoor.com", sessions: 14 },
  { domain: "reddit.com", sessions: 10 },
  { domain: "pinterest.com", sessions: 8 },
];

// ---------------------------------------------------------------------------
// Mock data -- Landing Pages tab
// ---------------------------------------------------------------------------

const landingPages = [
  {
    title: "New Student Special",
    slug: "/welcome",
    status: "published",
    views: 560,
    uniqueViews: 420,
    conversions: 94,
    convRate: "16.8%",
    seoScore: 68,
  },
  {
    title: "Beginner Yoga Guide",
    slug: "/yoga-for-beginners",
    status: "published",
    views: 420,
    uniqueViews: 340,
    conversions: 82,
    convRate: "19.5%",
    seoScore: 85,
  },
  {
    title: "Hot Yoga Benefits",
    slug: "/hot-yoga",
    status: "published",
    views: 310,
    uniqueViews: 250,
    conversions: 45,
    convRate: "14.5%",
    seoScore: 72,
  },
  {
    title: "Teacher Training 2024",
    slug: "/teacher-training",
    status: "published",
    views: 180,
    uniqueViews: 150,
    conversions: 12,
    convRate: "6.7%",
    seoScore: 91,
  },
  {
    title: "Prenatal Yoga",
    slug: "/prenatal",
    status: "draft",
    views: 0,
    uniqueViews: 0,
    conversions: 0,
    convRate: "-",
    seoScore: 45,
  },
];

const topConvertingPages = landingPages
  .filter((p) => p.status === "published" && p.conversions > 0)
  .sort((a, b) => parseFloat(b.convRate) - parseFloat(a.convRate))
  .slice(0, 3);

const seoIssues = [
  "Missing meta description on 2 pages",
  "Title too long on 'Teacher Training'",
  "No alt text on hero images",
];

// ---------------------------------------------------------------------------
// Mock data -- Newsletter tab
// ---------------------------------------------------------------------------

const newsletterKpis = [
  {
    label: "Total Subscribers",
    value: "342",
    icon: Mail,
    iconColor: "text-primary",
    helpText: "The total number of people who have signed up for your email newsletter.",
  },
  {
    label: "Growth This Month",
    value: "+28",
    subtext: "+8.9%",
    icon: TrendingUp,
    iconColor: "text-accent-sage",
    helpText: "Net new subscribers gained this month after accounting for unsubscribes.",
  },
  {
    label: "Confirmed Rate",
    value: "94%",
    icon: Users,
    iconColor: "text-accent-gold",
    helpText:
      "The percentage of subscribers who confirmed their email address via the double opt-in link.",
  },
  {
    label: "Unsubscribe Rate",
    value: "1.2%",
    icon: TrendingDown,
    iconColor: "text-destructive",
    helpText:
      "The percentage of subscribers who opted out this month. Below 2% is considered healthy.",
  },
];

const subscriberGrowth = [
  { month: "Jan", count: 12 },
  { month: "Feb", count: 18 },
  { month: "Mar", count: 22 },
  { month: "Apr", count: 15 },
  { month: "May", count: 24 },
  { month: "Jun", count: 28 },
];

const signupSources = [
  { source: "Home page", subscribers: 98, percent: "28.7%" },
  { source: "Community page", subscribers: 72, percent: "21.1%" },
  { source: "Class booking confirmation", subscribers: 56, percent: "16.4%" },
  { source: "Event registration", subscribers: 45, percent: "13.2%" },
  { source: "Footer widget", subscribers: 38, percent: "11.1%" },
  { source: "Other", subscribers: 33, percent: "9.6%" },
];

const subscriberStatus = [
  { label: "Confirmed", count: 321, color: "bg-accent-sage" },
  { label: "Pending confirmation", count: 12, color: "bg-accent-gold" },
  { label: "Unsubscribed", count: 9, color: "bg-destructive" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function seoScoreColor(score: number) {
  if (score >= 80) return "text-accent-sage";
  if (score >= 60) return "text-accent-gold";
  return "text-destructive";
}

function seoScoreBg(score: number) {
  if (score >= 80) return "bg-accent-sage";
  if (score >= 60) return "bg-accent-gold";
  return "bg-destructive";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SiteAnalytics() {
  const [period, setPeriod] = useState("this_month");
  const [activeTab, setActiveTab] = useState("traffic");

  const maxDaySessions = Math.max(...trafficByDay.map((d) => d.sessions));
  const maxGrowthCount = Math.max(...subscriberGrowth.map((m) => m.count));

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* ---- Header ---- */}
        <div className="flex flex-col gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/manage/analytics">Analytics</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Site & App Metrics</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Site & App Metrics</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Traffic, attribution, landing pages, and newsletter performance
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
        </div>

        {/* ---- Tabs ---- */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="traffic">Traffic</TabsTrigger>
            <TabsTrigger value="attribution">Attribution</TabsTrigger>
            <TabsTrigger value="landing-pages">Landing Pages</TabsTrigger>
            <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
          </TabsList>

          {/* ==================================================================
              TRAFFIC TAB
          ================================================================== */}
          <TabsContent value="traffic" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {trafficKpis.map((kpi) => (
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

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Device Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Device Breakdown
                    <InfoTip text="Shows which devices visitors use to access your site. A high mobile percentage is typical for yoga studios." />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {deviceBreakdown.map((device) => (
                    <div key={device.label} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <device.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{device.label}</span>
                        </div>
                        <span className="text-sm font-semibold">{device.percent}%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${device.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Returning vs New Visitors */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Returning vs New Visitors
                    <InfoTip text="Returning visitors have been to your site before. A healthy mix means you retain interest while attracting new students." />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    {/* Pie-chart style display */}
                    <div className="relative h-32 w-32 shrink-0">
                      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                        <circle
                          cx="18"
                          cy="18"
                          r="15.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="text-accent-coral/30"
                          strokeDasharray={`${visitorSplit.new} ${100 - visitorSplit.new}`}
                          strokeDashoffset="0"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="text-primary"
                          strokeDasharray={`${visitorSplit.returning} ${100 - visitorSplit.returning}`}
                          strokeDashoffset={`${-visitorSplit.new}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold">{visitorSplit.returning}%</span>
                        <span className="text-[10px] text-muted-foreground">returning</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-primary shrink-0" />
                        <div>
                          <p className="text-sm font-semibold">Returning: {visitorSplit.returning}%</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round(890 * (visitorSplit.returning / 100))} visitors
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-accent-coral/60 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold">New: {visitorSplit.new}%</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round(890 * (visitorSplit.new / 100))} visitors
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Pages */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Unique Views</TableHead>
                      <TableHead className="text-right hidden md:table-cell">Avg Time</TableHead>
                      <TableHead className="text-right">Bounce Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPages.map((page) => (
                      <TableRow key={page.page}>
                        <TableCell className="font-medium">{page.page}</TableCell>
                        <TableCell className="text-right">{page.views.toLocaleString()}</TableCell>
                        <TableCell className="text-right hidden sm:table-cell">
                          {page.uniqueViews.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right hidden md:table-cell">{page.avgTime}</TableCell>
                        <TableCell className="text-right">{page.bounceRate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Traffic by Day of Week */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Traffic by Day of Week
                  <InfoTip text="Sessions broken down by day. Peaks often occur early in the week as people plan classes ahead." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-40">
                  {trafficByDay.map((day) => {
                    const heightPercent = (day.sessions / maxDaySessions) * 100;
                    const isPeak = day.day === "Mon" || day.day === "Tue";
                    return (
                      <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold">{day.sessions}</span>
                        <div
                          className={`w-full rounded-t-md transition-all ${
                            isPeak ? "bg-primary" : "bg-primary/40"
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className={`text-xs ${isPeak ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                          {day.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Peak traffic on Monday and Tuesday -- visitors tend to plan their week early. Saturday sees the lowest traffic.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================================================================
              ATTRIBUTION TAB
          ================================================================== */}
          <TabsContent value="attribution" className="space-y-6">
            {/* Traffic Sources */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Traffic Sources
                  <InfoTip text="Where your visitors come from. 'Direct' means they typed your URL or used a bookmark. 'Organic' means they found you through a search engine." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">% of Total</TableHead>
                      <TableHead className="text-right hidden md:table-cell">Signups</TableHead>
                      <TableHead className="text-right">Conv Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trafficSources.map((src) => {
                      const isBest = src.source === bestConversionSource;
                      return (
                        <TableRow key={src.source}>
                          <TableCell className="font-medium">
                            {src.source}
                            {isBest && (
                              <Badge className="ml-2 text-[10px] bg-accent-gold/20 text-accent-gold">
                                Best conversion
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{src.sessions}</TableCell>
                          <TableCell className="text-right hidden sm:table-cell">{src.percent}</TableCell>
                          <TableCell className="text-right hidden md:table-cell">{src.signups}</TableCell>
                          <TableCell className={`text-right font-semibold ${isBest ? "text-accent-gold" : ""}`}>
                            {src.convRate}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* UTM Campaign Performance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  UTM Campaign Performance
                  <InfoTip text="UTM parameters are tags you add to links to track where traffic comes from. For example, a link shared in an email with ?utm_campaign=january_promo." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Source</TableHead>
                      <TableHead className="hidden md:table-cell">Medium</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Conversions</TableHead>
                      <TableHead className="text-right">Conv Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {utmCampaigns.map((campaign) => (
                      <TableRow key={campaign.name}>
                        <TableCell className="font-medium font-mono text-xs">{campaign.name}</TableCell>
                        <TableCell className="hidden sm:table-cell">{campaign.source}</TableCell>
                        <TableCell className="hidden md:table-cell">{campaign.medium}</TableCell>
                        <TableCell className="text-right">{campaign.sessions}</TableCell>
                        <TableCell className="text-right hidden sm:table-cell">{campaign.conversions}</TableCell>
                        <TableCell className="text-right font-semibold">{campaign.convRate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Referrer Domains */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Top Referrer Domains
                  <InfoTip text="External websites that send visitors to your site. This does not include search engines or social media apps that are tracked separately." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {referrerDomains.map((ref, i) => (
                    <div
                      key={ref.domain}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium">{ref.domain}</span>
                      </div>
                      <span className="text-sm font-semibold">{ref.sessions} sessions</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Attribution Info Box */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-secondary/30">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Understanding attribution</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Attribution helps you understand where students find you. Use UTM parameters on
                  links you share to track campaigns. For example, add{" "}
                  <code className="text-xs bg-secondary px-1 py-0.5 rounded">?utm_campaign=your_campaign</code>{" "}
                  to any link you share on social media or in emails.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* ==================================================================
              LANDING PAGES TAB
          ================================================================== */}
          <TabsContent value="landing-pages" className="space-y-6">
            {/* Landing Page Performance */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Landing Page Performance</CardTitle>
                  <Link to="/manage/landing-pages">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Manage Landing Pages <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page Title</TableHead>
                      <TableHead className="hidden sm:table-cell">Slug</TableHead>
                      <TableHead className="hidden md:table-cell">Status</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Unique</TableHead>
                      <TableHead className="text-right hidden md:table-cell">Conv</TableHead>
                      <TableHead className="text-right">Conv Rate</TableHead>
                      <TableHead className="text-right hidden lg:table-cell">SEO</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {landingPages.map((page) => (
                      <TableRow key={page.slug}>
                        <TableCell className="font-medium">{page.title}</TableCell>
                        <TableCell className="hidden sm:table-cell font-mono text-xs text-muted-foreground">
                          {page.slug}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant={page.status === "published" ? "default" : "outline"}
                            className={`text-[10px] ${
                              page.status === "published"
                                ? "bg-accent-sage/20 text-accent-sage"
                                : ""
                            }`}
                          >
                            {page.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{page.views.toLocaleString()}</TableCell>
                        <TableCell className="text-right hidden sm:table-cell">
                          {page.uniqueViews.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right hidden md:table-cell">{page.conversions}</TableCell>
                        <TableCell className="text-right font-semibold">{page.convRate}</TableCell>
                        <TableCell className="text-right hidden lg:table-cell">
                          <span className={`font-semibold ${seoScoreColor(page.seoScore)}`}>
                            {page.seoScore}/100
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top Converting Pages */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Top Converting Pages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topConvertingPages.map((page, i) => (
                    <div key={page.slug} className="p-3 rounded-xl bg-secondary/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-accent-gold/20 text-accent-gold text-xs font-bold">
                            {i + 1}
                          </span>
                          <p className="text-sm font-semibold">{page.title}</p>
                        </div>
                        <span className="text-sm font-bold text-accent-gold">{page.convRate}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground ml-8">
                        <span>{page.views} views</span>
                        <span>{page.conversions} conversions</span>
                        <span className="font-mono">{page.slug}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* SEO Recommendations Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    SEO Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-secondary/50 text-center">
                      <p className="text-2xl font-bold text-accent-gold">2</p>
                      <p className="text-xs text-muted-foreground">Pages need attention</p>
                    </div>
                    <div className="p-3 rounded-xl bg-secondary/50 text-center">
                      <p className="text-2xl font-bold text-primary">3</p>
                      <p className="text-xs text-muted-foreground">Recommendations open</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Top Issues
                    </p>
                    <div className="space-y-2">
                      {seoIssues.map((issue, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-secondary/30"
                        >
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-accent-gold shrink-0" />
                          <p className="text-sm">{issue}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SEO score bars for all pages */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Page SEO Scores
                    </p>
                    <div className="space-y-2">
                      {landingPages.map((page) => (
                        <div key={page.slug} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium truncate mr-2">{page.title}</span>
                            <span className={`text-xs font-semibold ${seoScoreColor(page.seoScore)}`}>
                              {page.seoScore}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full rounded-full ${seoScoreBg(page.seoScore)}`}
                              style={{ width: `${page.seoScore}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ==================================================================
              NEWSLETTER TAB
          ================================================================== */}
          <TabsContent value="newsletter" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {newsletterKpis.map((kpi) => (
                <Card key={kpi.label}>
                  <CardContent className="pt-5 pb-4 px-4">
                    <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                    <p className="text-2xl font-bold mt-2">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground flex items-center">
                      {kpi.label}
                      <InfoTip text={kpi.helpText} />
                    </p>
                    {"subtext" in kpi && kpi.subtext && (
                      <p className="text-xs text-accent-sage font-medium mt-0.5">{kpi.subtext}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Subscriber Growth */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Subscriber Growth
                    <InfoTip text="Net new subscribers added each month over the last 6 months." />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3 h-40">
                    {subscriberGrowth.map((month) => {
                      const heightPercent = (month.count / maxGrowthCount) * 100;
                      return (
                        <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-semibold">+{month.count}</span>
                          <div
                            className="w-full rounded-t-md bg-primary/60"
                            style={{ height: `${heightPercent}%` }}
                          />
                          <span className="text-xs text-muted-foreground">{month.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Subscriber Status Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Subscriber Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscriberStatus.map((status) => {
                    const total = subscriberStatus.reduce((sum, s) => sum + s.count, 0);
                    const percent = ((status.count / total) * 100).toFixed(1);
                    return (
                      <div key={status.label} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{status.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{status.count}</span>
                            <span className="text-xs text-muted-foreground">({percent}%)</span>
                          </div>
                        </div>
                        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full ${status.color}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Signup Sources */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Signup Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Subscribers</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signupSources.map((src) => (
                      <TableRow key={src.source}>
                        <TableCell className="font-medium">{src.source}</TableCell>
                        <TableCell className="text-right">{src.subscribers}</TableCell>
                        <TableCell className="text-right">{src.percent}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Newsletter Info Box */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-secondary/30">
              <Info className="h-5 w-5 text-accent-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Insight: Booking-sourced subscribers perform better</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Newsletter subscribers who came through class bookings have 2.3x higher open rates
                  than other sources. Consider adding a newsletter opt-in to your booking confirmation
                  flow to grow this high-quality segment.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ManageLayout>
  );
}
