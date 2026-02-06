import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Globe,
  Eye,
  Edit,
  Copy,
  TrendingUp,
  ArrowRight,
  BarChart3,
  Search as SearchIcon,
  Lightbulb,
  ExternalLink,
  MousePointer2,
  FileText,
  MoreVertical,
  Archive,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LandingPageWizard } from "@/components/landing-pages/LandingPageWizard";

type PageStatus = "draft" | "published" | "expired" | "archived";
type ExpiredBehavior = "show_alternatives" | "redirect_parent" | "show_message" | "custom_redirect";

interface LandingPageRow {
  id: string;
  title: string;
  slug: string;
  template: string;
  status: PageStatus;
  totalViews: number;
  totalConversions: number;
  conversionRate: number;
  publishedAt: string | null;
  updatedAt: string;
  expirationDate?: string;
  expiredBehavior?: ExpiredBehavior;
  seoScore?: number;
  targetKeywords?: string[];
}

const mockPages: LandingPageRow[] = [
  {
    id: "lp1", title: "Yoga for Beginners", slug: "yoga-for-beginners",
    template: "class_style", status: "published",
    totalViews: 1247, totalConversions: 89, conversionRate: 7.1,
    publishedAt: "2025-01-10", updatedAt: "2025-01-28",
    seoScore: 85, targetKeywords: ["beginner yoga", "yoga for beginners sf"],
  },
  {
    id: "lp2", title: "Teacher Training Spring 2026", slug: "teacher-training-spring-2026",
    template: "teacher_training", status: "published",
    totalViews: 834, totalConversions: 11, conversionRate: 1.3,
    publishedAt: "2025-01-15", updatedAt: "2025-02-01",
    seoScore: 78, targetKeywords: ["yoga teacher training sf", "200 hour ytt"],
    expirationDate: "2026-04-01", expiredBehavior: "show_alternatives",
  },
  {
    id: "lp3", title: "Hot Yoga SOMA", slug: "hot-yoga-soma",
    template: "class_style", status: "published",
    totalViews: 2103, totalConversions: 156, conversionRate: 7.4,
    publishedAt: "2024-11-05", updatedAt: "2025-01-20",
    seoScore: 92, targetKeywords: ["hot yoga soma", "heated yoga sf"],
  },
  {
    id: "lp4", title: "New Student Special", slug: "welcome",
    template: "new_student", status: "published",
    totalViews: 3891, totalConversions: 423, conversionRate: 10.9,
    publishedAt: "2024-10-01", updatedAt: "2025-01-30",
    seoScore: 88, targetKeywords: ["yoga trial", "first yoga class free"],
  },
  {
    id: "lp5", title: "Valentine's Partner Yoga", slug: "valentines-partner-yoga",
    template: "workshop", status: "draft",
    totalViews: 0, totalConversions: 0, conversionRate: 0,
    publishedAt: null, updatedAt: "2025-02-02",
    seoScore: 65, targetKeywords: ["partner yoga", "couples yoga sf"],
    expirationDate: "2026-02-15", expiredBehavior: "show_alternatives",
  },
  {
    id: "lp6", title: "New Year Resolution Special", slug: "new-year-2025",
    template: "seasonal_promo", status: "expired",
    totalViews: 1567, totalConversions: 89, conversionRate: 5.7,
    publishedAt: "2024-12-20", updatedAt: "2025-01-31",
    seoScore: 72, targetKeywords: ["new year yoga", "yoga resolution"],
    expirationDate: "2025-01-31", expiredBehavior: "show_alternatives",
  },
  {
    id: "lp7", title: "Summer Solstice Retreat 2024", slug: "solstice-retreat-2024",
    template: "retreat", status: "archived",
    totalViews: 2341, totalConversions: 28, conversionRate: 1.2,
    publishedAt: "2024-03-01", updatedAt: "2024-07-01",
    seoScore: 80,
  },
];

const mockRecommendations = [
  {
    id: "r1", type: "landing_page", priority: "high",
    title: "Create a 'Prenatal Yoga' landing page",
    description: "You offer prenatal classes but have no dedicated landing page. 'Prenatal yoga [your city]' has ~320 monthly searches. A targeted page could capture 15-30 new students/month.",
    suggestedTemplate: "class_style", suggestedSlug: "prenatal-yoga",
    targetKeywords: ["prenatal yoga sf", "yoga for pregnancy san francisco"],
  },
  {
    id: "r2", type: "landing_page", priority: "high",
    title: "Create a 'Corporate Yoga' page",
    description: "Corporate wellness is a growing segment. A page targeting 'corporate yoga' and 'office yoga' in your area could attract B2B inquiries. Include pricing for private groups.",
    suggestedTemplate: "custom", suggestedSlug: "corporate-yoga",
    targetKeywords: ["corporate yoga program", "office yoga san francisco"],
  },
  {
    id: "r3", type: "meta_tag", priority: "medium",
    title: "Optimize your 'New Student' page title",
    description: "Your best-performing page ('New Student Special') could rank higher with a title like 'First Yoga Class Free | Tandava Yoga SOMA' instead of the current generic title.",
    suggestedTemplate: null, suggestedSlug: null,
    targetKeywords: ["first yoga class free", "yoga trial class"],
  },
];

const templateDescriptions: Record<string, string> = {
  new_student: "Optimized for converting first-time visitors. Hero, intro offer, schedule preview, testimonials.",
  class_style: "Showcase a specific yoga style. Benefits, schedule for that style, teacher profiles.",
  teacher_training: "200-hour, 300-hour, or specialty certifications with curriculum details.",
  retreat: "Yoga retreats, wellness getaways, and destination programs.",
  workshop: "Single or multi-day workshops and intensives.",
  seasonal_promo: "Seasonal promotions (holiday, summer, new year). Limited-time offers with urgency.",
  location: "SEO page for a specific studio location.",
  custom: "Start from a blank canvas. Add content blocks in any order.",
};

const statusColors: Record<PageStatus, { bg: string; text: string; icon: typeof CheckCircle }> = {
  draft: { bg: "bg-muted", text: "text-muted-foreground", icon: Clock },
  published: { bg: "bg-accent-sage/20", text: "text-accent-sage", icon: CheckCircle },
  expired: { bg: "bg-accent-gold/20", text: "text-accent-gold", icon: AlertTriangle },
  archived: { bg: "bg-secondary", text: "text-muted-foreground", icon: Archive },
};

export default function LandingPagesManage() {
  const { toast } = useToast();
  const [pages, setPages] = useState(mockPages);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | PageStatus>("all");

  const filteredPages = activeTab === "all"
    ? pages
    : pages.filter((p) => p.status === activeTab);

  const totalViews = pages.reduce((s, p) => s + p.totalViews, 0);
  const totalConversions = pages.reduce((s, p) => s + p.totalConversions, 0);
  const avgConversionRate = totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(1) : "0";

  const handleWizardComplete = (data: any) => {
    const newPage: LandingPageRow = {
      id: `lp${pages.length + 1}`,
      title: data.title,
      slug: data.slug,
      template: data.template,
      status: "draft",
      totalViews: 0,
      totalConversions: 0,
      conversionRate: 0,
      publishedAt: null,
      updatedAt: new Date().toISOString().split("T")[0],
      seoScore: 0,
      targetKeywords: data.targetKeywords,
      expirationDate: data.hasExpiration ? data.expirationDate : undefined,
      expiredBehavior: data.expiredBehavior,
    };
    setPages([newPage, ...pages]);
    toast({
      title: "Landing page created",
      description: `"${data.title}" is ready to edit. Publish when ready.`,
    });
  };

  const handleStatusChange = (pageId: string, newStatus: PageStatus) => {
    setPages(pages.map((p) =>
      p.id === pageId
        ? {
            ...p,
            status: newStatus,
            publishedAt: newStatus === "published" ? new Date().toISOString().split("T")[0] : p.publishedAt,
          }
        : p
    ));
    toast({
      title: "Status updated",
      description: `Page is now ${newStatus}.`,
    });
  };

  const handleDuplicate = (page: LandingPageRow) => {
    const newPage: LandingPageRow = {
      ...page,
      id: `lp${pages.length + 1}`,
      title: `${page.title} (Copy)`,
      slug: `${page.slug}-copy`,
      status: "draft",
      totalViews: 0,
      totalConversions: 0,
      conversionRate: 0,
      publishedAt: null,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setPages([newPage, ...pages]);
    toast({
      title: "Page duplicated",
      description: `"${newPage.title}" created as draft.`,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isExpiringSoon = (date?: string) => {
    if (!date) return false;
    const expDate = new Date(date);
    const now = new Date();
    const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 14;
  };

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Landing Pages</h1>
            <p className="text-sm text-muted-foreground mt-1">
              SEO-optimized pages that help new students discover your studio
            </p>
          </div>
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Page Views", value: totalViews.toLocaleString(), icon: Eye },
            { label: "Total Conversions", value: totalConversions, icon: MousePointer2 },
            { label: "Avg Conversion Rate", value: `${avgConversionRate}%`, icon: TrendingUp },
            { label: "Published", value: pages.filter((p) => p.status === "published").length, icon: CheckCircle, color: "text-accent-sage" },
            { label: "Expiring Soon", value: pages.filter((p) => isExpiringSoon(p.expirationDate)).length, icon: AlertTriangle, color: "text-accent-gold" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={`text-xl font-bold mt-0.5 ${"color" in stat ? stat.color : ""}`}>{stat.value}</p>
                  </div>
                  <stat.icon className={`h-5 w-5 ${"color" in stat ? stat.color : "text-muted-foreground"}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* SEO Recommendations */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent-gold" />
              SEO Recommendations
            </CardTitle>
            <CardDescription>
              Pages we think would help your studio rank higher and attract new students
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockRecommendations.map((rec) => (
              <div key={rec.id} className="flex items-start justify-between p-3 rounded-xl bg-secondary/30">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${rec.priority === "high" ? "bg-accent-coral/20 text-accent-coral" : "bg-primary/20 text-primary"}`}>
                      {rec.priority}
                    </Badge>
                    <h4 className="text-sm font-medium">{rec.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                  {rec.targetKeywords.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      <SearchIcon className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-[10px] text-muted-foreground">
                        Target: {rec.targetKeywords.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline" className="shrink-0 ml-3">
                  Create Page
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pages List with Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="flex items-center justify-between mb-3">
            <TabsList>
              <TabsTrigger value="all" className="text-xs">
                All ({pages.length})
              </TabsTrigger>
              <TabsTrigger value="published" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Published ({pages.filter((p) => p.status === "published").length})
              </TabsTrigger>
              <TabsTrigger value="draft" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Drafts ({pages.filter((p) => p.status === "draft").length})
              </TabsTrigger>
              <TabsTrigger value="expired" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Expired ({pages.filter((p) => p.status === "expired").length})
              </TabsTrigger>
              <TabsTrigger value="archived" className="text-xs">
                <Archive className="h-3 w-3 mr-1" />
                Archived ({pages.filter((p) => p.status === "archived").length})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="space-y-3">
            {filteredPages.map((page) => {
              const StatusIcon = statusColors[page.status].icon;
              return (
                <Card key={page.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold">{page.title}</h3>
                            <Badge className={`text-[10px] ${statusColors[page.status].bg} ${statusColors[page.status].text}`}>
                              <StatusIcon className="h-2.5 w-2.5 mr-1" />
                              {page.status}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {page.template.replace(/_/g, " ")}
                            </Badge>
                            {page.seoScore !== undefined && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  page.seoScore >= 70 ? "text-accent-sage border-accent-sage/30" :
                                  page.seoScore >= 40 ? "text-accent-gold border-accent-gold/30" :
                                  "text-accent-coral border-accent-coral/30"
                                }`}
                              >
                                SEO: {page.seoScore}
                              </Badge>
                            )}
                            {isExpiringSoon(page.expirationDate) && (
                              <Badge className="text-[10px] bg-accent-gold/20 text-accent-gold">
                                <Calendar className="h-2.5 w-2.5 mr-1" />
                                Expires {formatDate(page.expirationDate!)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs text-muted-foreground">/s/tandava-yoga/{page.slug}</span>
                            {page.status === "published" && (
                              <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {(page.status === "published" || page.status === "expired") && page.totalViews > 0 && (
                          <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {page.totalViews.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <MousePointer2 className="h-3 w-3" />
                              {page.totalConversions}
                            </span>
                            <span className={`font-medium ${
                              page.conversionRate >= 5 ? "text-accent-sage" :
                              page.conversionRate >= 2 ? "text-foreground" :
                              "text-accent-coral"
                            }`}>
                              {page.conversionRate}% CVR
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Preview">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleDuplicate(page)}>
                                <Copy className="h-3.5 w-3.5 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {page.status === "draft" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(page.id, "published")}>
                                  <Globe className="h-3.5 w-3.5 mr-2" />
                                  Publish
                                </DropdownMenuItem>
                              )}
                              {page.status === "published" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(page.id, "draft")}>
                                  <Clock className="h-3.5 w-3.5 mr-2" />
                                  Unpublish (Draft)
                                </DropdownMenuItem>
                              )}
                              {page.status === "expired" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStatusChange(page.id, "published")}>
                                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                    Republish
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(page.id, "archived")}>
                                    <Archive className="h-3.5 w-3.5 mr-2" />
                                    Archive
                                  </DropdownMenuItem>
                                </>
                              )}
                              {page.status !== "archived" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(page.id, "archived")}>
                                  <Archive className="h-3.5 w-3.5 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              {page.status === "archived" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(page.id, "draft")}>
                                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                  Restore as Draft
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredPages.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium">No pages in this category</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeTab === "all"
                      ? "Create your first landing page to start attracting new students."
                      : `No ${activeTab} pages yet.`}
                  </p>
                  {activeTab === "all" && (
                    <Button className="mt-4" onClick={() => setWizardOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Page
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </Tabs>

        {/* Landing Page Wizard */}
        <LandingPageWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          onComplete={handleWizardComplete}
        />
      </div>
    </ManageLayout>
  );
}
