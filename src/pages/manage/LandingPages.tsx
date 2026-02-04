import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LandingPageRow {
  id: string;
  title: string;
  slug: string;
  template: string;
  status: string;
  totalViews: number;
  totalConversions: number;
  conversionRate: number;
  publishedAt: string | null;
  updatedAt: string;
}

const mockPages: LandingPageRow[] = [
  {
    id: "lp1", title: "Yoga for Beginners", slug: "yoga-for-beginners",
    template: "class_style", status: "published",
    totalViews: 1247, totalConversions: 89, conversionRate: 7.1,
    publishedAt: "2025-01-10", updatedAt: "2025-01-28",
  },
  {
    id: "lp2", title: "Teacher Training 2025", slug: "teacher-training-2025",
    template: "event_promo", status: "published",
    totalViews: 834, totalConversions: 11, conversionRate: 1.3,
    publishedAt: "2025-01-15", updatedAt: "2025-02-01",
  },
  {
    id: "lp3", title: "Hot Yoga SOMA", slug: "hot-yoga-soma",
    template: "class_style", status: "published",
    totalViews: 2103, totalConversions: 156, conversionRate: 7.4,
    publishedAt: "2024-11-05", updatedAt: "2025-01-20",
  },
  {
    id: "lp4", title: "New Student Special", slug: "welcome",
    template: "new_student", status: "published",
    totalViews: 3891, totalConversions: 423, conversionRate: 10.9,
    publishedAt: "2024-10-01", updatedAt: "2025-01-30",
  },
  {
    id: "lp5", title: "Valentine's Partner Yoga", slug: "valentines-partner-yoga",
    template: "seasonal", status: "draft",
    totalViews: 0, totalConversions: 0, conversionRate: 0,
    publishedAt: null, updatedAt: "2025-02-02",
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
  event_promo: "Promote a workshop, training, or retreat. Rich media, agenda, pricing tiers, countdown.",
  teacher_profile: "Feature a specific teacher. Bio, schedule, specialties, student reviews.",
  seasonal: "Seasonal promotions (holiday, summer, new year). Limited-time offers with urgency.",
  custom: "Start from a blank canvas. Add content blocks in any order.",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-accent-sage/20 text-accent-sage",
  archived: "bg-secondary text-muted-foreground",
};

export default function LandingPagesManage() {
  const { toast } = useToast();
  const [pages] = useState(mockPages);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const totalViews = pages.reduce((s, p) => s + p.totalViews, 0);
  const totalConversions = pages.reduce((s, p) => s + p.totalConversions, 0);
  const avgConversionRate = totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(1) : "0";

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
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Page Views", value: totalViews.toLocaleString(), icon: Eye },
            { label: "Total Conversions", value: totalConversions, icon: MousePointer2 },
            { label: "Avg Conversion Rate", value: `${avgConversionRate}%`, icon: TrendingUp },
            { label: "Published Pages", value: pages.filter((p) => p.status === "published").length, icon: Globe },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold mt-0.5">{stat.value}</p>
                  </div>
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
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

        {/* Pages List */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Your Pages</h2>
          <div className="space-y-3">
            {pages.map((page) => (
              <Card key={page.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">{page.title}</h3>
                          <Badge className={`text-[10px] ${statusColors[page.status]}`}>{page.status}</Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">{page.template.replace(/_/g, " ")}</Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-muted-foreground">/s/tandava-yoga/{page.slug}</span>
                          {page.status === "published" && (
                            <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {page.status === "published" && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {page.totalViews.toLocaleString()} views
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointer2 className="h-3 w-3" />
                            {page.totalConversions} conversions
                          </span>
                          <span className={`font-medium ${page.conversionRate >= 5 ? "text-accent-sage" : page.conversionRate >= 2 ? "text-foreground" : "text-accent-coral"}`}>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicate">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Create Page Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Landing Page</DialogTitle>
              <DialogDescription>
                Choose a template. Each is optimized for a different goal — the right page
                can bring 10-50 new students per month from search engines.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {Object.entries(templateDescriptions).map(([key, desc]) => (
                <button
                  key={key}
                  onClick={() => setSelectedTemplate(key)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    selectedTemplate === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <p className="text-sm font-medium capitalize">{key.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
            <div className="space-y-2 pt-2">
              <Label htmlFor="pageTitle">Page Title</Label>
              <Input id="pageTitle" placeholder="e.g. Hot Yoga in SOMA" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                disabled={!selectedTemplate}
                onClick={() => {
                  setCreateOpen(false);
                  toast({ title: "Page created", description: "Edit your content blocks and publish when ready." });
                }}
              >
                Create Page <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ManageLayout>
  );
}
