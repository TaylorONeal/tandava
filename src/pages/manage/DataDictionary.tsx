import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  DollarSign,
  Users,
  TrendingUp,
  BarChart3,
  BookOpen,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

// ---------------------------------------------------------------------------
// Data Dictionary Entries
// ---------------------------------------------------------------------------

interface MetricDefinition {
  term: string;
  shortDefinition: string;
  longDefinition: string;
  calculation?: string;
  example?: string;
  relatedTerms?: string[];
  category: "financial" | "member" | "sales" | "site" | "general";
  importance: "primary" | "secondary";
}

const metrics: MetricDefinition[] = [
  // Financial Metrics
  {
    term: "MRR (Monthly Recurring Revenue)",
    shortDefinition: "Predictable monthly income from active memberships",
    longDefinition:
      "MRR represents the total revenue you can expect each month from active membership subscriptions. It excludes one-time purchases like class packs, drop-ins, retail, and workshops. MRR is the foundation of a sustainable studio business because it provides predictable cash flow.",
    calculation: "Sum of (monthly membership price × active subscribers)",
    example:
      "If you have 50 members paying $99/month and 30 members paying $149/month, your MRR = (50 × $99) + (30 × $149) = $9,420",
    relatedTerms: ["ARR", "Churn Rate", "Revenue Per Student"],
    category: "financial",
    importance: "primary",
  },
  {
    term: "ARR (Annual Recurring Revenue)",
    shortDefinition: "MRR multiplied by 12",
    longDefinition:
      "ARR is your MRR annualized, giving you a full-year view of your recurring revenue if current subscriptions remain constant. Useful for long-term planning and comparing year-over-year growth.",
    calculation: "MRR × 12",
    example: "If MRR is $14,100, then ARR = $14,100 × 12 = $169,200",
    relatedTerms: ["MRR", "Revenue Growth Rate"],
    category: "financial",
    importance: "secondary",
  },
  {
    term: "Revenue Per Student (RPS)",
    shortDefinition: "Average revenue generated per active student",
    longDefinition:
      "This metric shows how much revenue, on average, each active student contributes. Rising RPS indicates students are purchasing higher-value plans, attending more often, or buying additional products/services. It's a key indicator of customer value.",
    calculation: "Total Revenue ÷ Active Students",
    example:
      "If total revenue is $18,400 and you have 163 active students, RPS = $18,400 ÷ 163 = $113",
    relatedTerms: ["CLV", "Active Members", "ARPU"],
    category: "financial",
    importance: "primary",
  },
  {
    term: "Gross Margin",
    shortDefinition: "Revenue minus direct costs as a percentage",
    longDefinition:
      "Gross margin shows what percentage of revenue remains after paying direct costs like instructor pay, credit card fees, and class materials. A healthy yoga studio typically targets 60-70% gross margin. Lower margins may indicate overstaffing or underpricing.",
    calculation: "(Revenue - Direct Costs) ÷ Revenue × 100",
    example:
      "Revenue of $18,400 with $5,900 in direct costs gives (18,400 - 5,900) ÷ 18,400 × 100 = 68% margin",
    relatedTerms: ["Operating Margin", "Net Profit"],
    category: "financial",
    importance: "primary",
  },
  {
    term: "CLV (Customer Lifetime Value)",
    shortDefinition: "Total revenue expected from a student over their lifetime",
    longDefinition:
      "CLV estimates how much total revenue a student will generate from the time they join until they cancel. It helps you understand how much you can afford to spend on acquisition and how valuable retention improvements are.",
    calculation: "Average Revenue Per Month × Average Membership Length (months)",
    example:
      "If average monthly revenue per member is $110 and members stay 14 months on average, CLV = $110 × 14 = $1,540",
    relatedTerms: ["CAC", "Retention Rate", "Churn Rate"],
    category: "financial",
    importance: "primary",
  },
  {
    term: "CAC (Customer Acquisition Cost)",
    shortDefinition: "Cost to acquire one new paying student",
    longDefinition:
      "CAC includes all marketing spend, promotions, referral bonuses, and sales efforts divided by new students acquired. A healthy CLV:CAC ratio is 3:1 or higher, meaning lifetime value is at least 3x the cost to acquire.",
    calculation: "Total Acquisition Spend ÷ New Students Acquired",
    example:
      "If you spent $800 on marketing and acquired 10 new members, CAC = $800 ÷ 10 = $80",
    relatedTerms: ["CLV", "Marketing ROI", "Conversion Rate"],
    category: "sales",
    importance: "primary",
  },

  // Member Metrics
  {
    term: "Active Members",
    shortDefinition: "Students with current attendance or active membership",
    longDefinition:
      "A student is considered 'active' if they have attended at least one class in the selected period OR have an active membership/class pack with remaining credits. This distinguishes engaged students from dormant accounts.",
    calculation: "Count of unique students meeting activity criteria",
    relatedTerms: ["Churn Rate", "Retention Rate", "At-Risk Members"],
    category: "member",
    importance: "primary",
  },
  {
    term: "Retention Rate",
    shortDefinition: "Percentage of students who remain active over time",
    longDefinition:
      "Retention rate measures how well you keep students engaged. 30-day retention tracks students who return within 30 days of their last visit. 90-day and annual retention give longer-term views. High retention reduces the need for constant new student acquisition.",
    calculation: "(Students at End - New Students) ÷ Students at Start × 100",
    example:
      "Started month with 150 members, ended with 158, added 12 new → (158 - 12) ÷ 150 × 100 = 97.3% retention",
    relatedTerms: ["Churn Rate", "At-Risk Members", "Engagement Score"],
    category: "member",
    importance: "primary",
  },
  {
    term: "Churn Rate",
    shortDefinition: "Percentage of students who stop attending or cancel",
    longDefinition:
      "Churn is the opposite of retention - the rate at which students leave. Monthly churn of 5% means losing 5% of your base each month. Reducing churn by even 1-2% has compounding benefits on long-term revenue.",
    calculation: "Lost Students ÷ Starting Students × 100",
    example:
      "If you started the month with 160 members and 8 cancelled, churn = 8 ÷ 160 × 100 = 5%",
    relatedTerms: ["Retention Rate", "At-Risk Members", "MRR"],
    category: "member",
    importance: "primary",
  },
  {
    term: "At-Risk Members",
    shortDefinition: "Students showing signs they may churn soon",
    longDefinition:
      "At-risk members are identified by declining engagement patterns: fewer visits than usual, longer gaps between visits, or approaching the end of a class pack without renewal. Early identification allows proactive outreach to re-engage them.",
    calculation: "Based on engagement score dropping below threshold + attendance patterns",
    relatedTerms: ["Engagement Score", "Churn Rate", "Win-Back Campaign"],
    category: "member",
    importance: "primary",
  },
  {
    term: "Engagement Score",
    shortDefinition: "0-100 score reflecting a student's activity level",
    longDefinition:
      "The engagement score combines visit frequency, recency, class variety, and social interactions (referrals, community posts) into a single number. Scores above 70 indicate highly engaged members. Below 40 suggests intervention needed.",
    calculation: "Weighted combination of frequency, recency, variety, and social factors",
    relatedTerms: ["At-Risk Members", "Retention Rate", "Classes Per Month"],
    category: "member",
    importance: "secondary",
  },
  {
    term: "Classes Per Student Per Month",
    shortDefinition: "Average monthly attendance per active student",
    longDefinition:
      "This metric shows how frequently your active members attend. Higher attendance usually correlates with better retention. If members on unlimited plans attend less than expected, they may be overpaying relative to perceived value.",
    calculation: "Total Check-ins ÷ Active Students",
    example:
      "684 total check-ins with 163 active students = 684 ÷ 163 = 4.2 classes per student",
    relatedTerms: ["Fill Rate", "Active Members", "Engagement Score"],
    category: "member",
    importance: "secondary",
  },

  // Sales Metrics
  {
    term: "Conversion Rate",
    shortDefinition: "Percentage of leads or trials who become paying members",
    longDefinition:
      "Conversion rate tracks how effectively you turn interested prospects into paying customers. This can be measured at multiple stages: website visitor to signup, signup to trial, trial to paid membership. Each stage offers optimization opportunities.",
    calculation: "Conversions ÷ Total Opportunities × 100",
    example:
      "If 50 people signed up for intro offers and 8 converted to memberships, rate = 8 ÷ 50 × 100 = 16%",
    relatedTerms: ["CAC", "Funnel", "Trial Rate"],
    category: "sales",
    importance: "primary",
  },
  {
    term: "Promo ROI",
    shortDefinition: "Revenue generated per dollar spent on promotions",
    longDefinition:
      "Promo ROI measures the effectiveness of promotional campaigns by comparing the revenue they generated against the cost (discounts given + marketing spend). A positive ROI means the promotion was profitable.",
    calculation: "(Revenue from Promo - Promo Cost) ÷ Promo Cost × 100",
    example:
      "If a promo brought in $2,000 revenue and cost $500 in discounts, ROI = (2,000 - 500) ÷ 500 × 100 = 300%",
    relatedTerms: ["CAC", "Marketing ROI", "Conversion Rate"],
    category: "sales",
    importance: "secondary",
  },
  {
    term: "Referral Rate",
    shortDefinition: "Percentage of new members from existing member referrals",
    longDefinition:
      "Referrals are typically your highest-quality leads because they come pre-qualified by someone who knows both the prospect and your studio. A healthy referral rate (15%+ of new members) indicates strong member satisfaction and community.",
    calculation: "Referred Signups ÷ Total New Signups × 100",
    relatedTerms: ["Net Promoter Score", "CLV", "Word of Mouth"],
    category: "sales",
    importance: "secondary",
  },

  // Utilization Metrics
  {
    term: "Fill Rate (Class Utilization)",
    shortDefinition: "Percentage of available spots filled in classes",
    longDefinition:
      "Fill rate shows how well your schedule matches student demand. A class with 15 spots and 12 attendees has an 80% fill rate. Consistently low fill rates suggest schedule optimization opportunities; high fill rates may indicate need for additional classes.",
    calculation: "Actual Attendance ÷ Class Capacity × 100",
    example: "Class with 18 spots and 13 attendees: 13 ÷ 18 × 100 = 72% fill rate",
    relatedTerms: ["Classes Per Student", "Schedule Optimization", "Waitlist"],
    category: "general",
    importance: "primary",
  },
  {
    term: "No-Show Rate",
    shortDefinition: "Percentage of booked students who don't attend",
    longDefinition:
      "No-shows waste capacity and can frustrate waitlisted students. Track no-show rate by class time, instructor, and member segment to identify patterns. Reminder emails/texts and reasonable cancellation policies help reduce no-shows.",
    calculation: "No-Shows ÷ Total Bookings × 100",
    example:
      "If 50 students booked and 4 didn't show, no-show rate = 4 ÷ 50 × 100 = 8%",
    relatedTerms: ["Fill Rate", "Late Cancel Rate", "Waitlist Conversion"],
    category: "general",
    importance: "secondary",
  },

  // Site Metrics
  {
    term: "Sessions",
    shortDefinition: "Individual visits to your website or app",
    longDefinition:
      "A session is one visit to your site, starting when someone arrives and ending after 30 minutes of inactivity or when they leave. Multiple pageviews can occur within one session. Sessions help you understand traffic volume and patterns.",
    calculation: "Count of unique visit instances",
    relatedTerms: ["Pageviews", "Bounce Rate", "Session Duration"],
    category: "site",
    importance: "primary",
  },
  {
    term: "Bounce Rate",
    shortDefinition: "Percentage of visitors who leave after viewing one page",
    longDefinition:
      "A high bounce rate on your schedule or pricing page may indicate confusion or friction. Some pages naturally have higher bounce rates (blog posts). Focus on reducing bounces on conversion-critical pages.",
    calculation: "Single-Page Sessions ÷ Total Sessions × 100",
    relatedTerms: ["Sessions", "Conversion Rate", "Page Exit Rate"],
    category: "site",
    importance: "secondary",
  },
  {
    term: "Attribution",
    shortDefinition: "Identifying which marketing channel led to a conversion",
    longDefinition:
      "Attribution helps you understand which marketing efforts drive results. First-touch attribution credits the first interaction, last-touch credits the final one before conversion. Understanding attribution helps allocate marketing budget effectively.",
    calculation: "Based on tracking parameters (UTM codes) and conversion events",
    relatedTerms: ["UTM Parameters", "Marketing ROI", "CAC"],
    category: "site",
    importance: "secondary",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DataDictionary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Metrics", icon: BookOpen },
    { id: "financial", label: "Financial", icon: DollarSign },
    { id: "member", label: "Member", icon: Users },
    { id: "sales", label: "Sales", icon: TrendingUp },
    { id: "site", label: "Site", icon: BarChart3 },
    { id: "general", label: "General", icon: Calculator },
  ];

  const filteredMetrics = metrics.filter((m) => {
    const matchesSearch =
      searchQuery === "" ||
      m.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.shortDefinition.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === "all" || m.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const primaryMetrics = filteredMetrics.filter((m) => m.importance === "primary");
  const secondaryMetrics = filteredMetrics.filter((m) => m.importance === "secondary");

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Data Dictionary</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Definitions and calculations for all analytics metrics
            </p>
          </div>
          <Link to="/manage/analytics">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              <ArrowRight className="h-3 w-3 mr-1" />
              Back to Analytics
            </Badge>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search metrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex flex-wrap h-auto gap-1 p-1">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <cat.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{cat.label}</span>
                <span className="sm:hidden">{cat.label.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-6 space-y-6">
            {/* Primary Metrics */}
            {primaryMetrics.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge className="bg-primary/20 text-primary">Key</Badge>
                    Primary Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {primaryMetrics.map((metric) => (
                      <AccordionItem key={metric.term} value={metric.term}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex flex-col items-start text-left">
                            <span className="font-semibold">{metric.term}</span>
                            <span className="text-sm text-muted-foreground font-normal">
                              {metric.shortDefinition}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          <p className="text-sm">{metric.longDefinition}</p>

                          {metric.calculation && (
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Calculation
                              </p>
                              <code className="text-sm font-mono">
                                {metric.calculation}
                              </code>
                            </div>
                          )}

                          {metric.example && (
                            <div className="p-3 rounded-lg bg-accent-sage/10">
                              <p className="text-xs font-medium text-accent-sage mb-1">
                                Example
                              </p>
                              <p className="text-sm">{metric.example}</p>
                            </div>
                          )}

                          {metric.relatedTerms && metric.relatedTerms.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs text-muted-foreground">
                                Related:
                              </span>
                              {metric.relatedTerms.map((term) => (
                                <Badge
                                  key={term}
                                  variant="secondary"
                                  className="text-xs cursor-pointer"
                                  onClick={() => setSearchQuery(term)}
                                >
                                  {term}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {/* Secondary Metrics */}
            {secondaryMetrics.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge variant="outline">Supporting</Badge>
                    Secondary Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {secondaryMetrics.map((metric) => (
                      <AccordionItem key={metric.term} value={metric.term}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex flex-col items-start text-left">
                            <span className="font-semibold">{metric.term}</span>
                            <span className="text-sm text-muted-foreground font-normal">
                              {metric.shortDefinition}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          <p className="text-sm">{metric.longDefinition}</p>

                          {metric.calculation && (
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Calculation
                              </p>
                              <code className="text-sm font-mono">
                                {metric.calculation}
                              </code>
                            </div>
                          )}

                          {metric.example && (
                            <div className="p-3 rounded-lg bg-accent-sage/10">
                              <p className="text-xs font-medium text-accent-sage mb-1">
                                Example
                              </p>
                              <p className="text-sm">{metric.example}</p>
                            </div>
                          )}

                          {metric.relatedTerms && metric.relatedTerms.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs text-muted-foreground">
                                Related:
                              </span>
                              {metric.relatedTerms.map((term) => (
                                <Badge
                                  key={term}
                                  variant="secondary"
                                  className="text-xs cursor-pointer"
                                  onClick={() => setSearchQuery(term)}
                                >
                                  {term}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {filteredMetrics.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No metrics found matching "{searchQuery}"
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    Clear search
                  </button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Help text */}
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              Need help understanding your analytics?{" "}
              <Link to="/manage/definitions" className="text-primary hover:underline">
                View the full glossary
              </Link>{" "}
              for industry terms and studio management concepts, or reach out to
              support for personalized guidance.
            </p>
          </CardContent>
        </Card>
      </div>
    </ManageLayout>
  );
}
