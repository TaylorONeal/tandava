import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
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
  Search,
  Mail,
  MessageSquare,
  Bell,
  MoreHorizontal,
  Edit,
  Copy,
  Pause,
  Play,
  Trash2,
  Send,
  Users,
  MousePointerClick,
  Eye,
  TrendingUp,
  BarChart3,
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  Filter,
  ArrowUpRight,
  Beaker,
  Target,
  Megaphone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type {
  Campaign,
  CampaignType,
  CampaignStatus,
  TargetAudience,
} from "@/types/database";

// Mock campaign data
interface CampaignRow {
  id: string;
  name: string;
  description: string | null;
  campaignType: CampaignType;
  status: CampaignStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  estimatedRecipients: number;
  isAbTest: boolean;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  totalUnsubscribed: number;
  totalBounced: number;
  createdAt: string;
}

const mockCampaigns: CampaignRow[] = [
  {
    id: "c1",
    name: "February New Member Welcome",
    description: "Welcome series for new members who joined in February",
    campaignType: "email",
    status: "active",
    scheduledAt: "2025-02-01T09:00:00",
    startedAt: "2025-02-01T09:00:00",
    completedAt: null,
    estimatedRecipients: 156,
    isAbTest: false,
    totalSent: 142,
    totalDelivered: 138,
    totalOpened: 89,
    totalClicked: 45,
    totalConverted: 12,
    totalUnsubscribed: 2,
    totalBounced: 4,
    createdAt: "2025-01-28T14:30:00",
  },
  {
    id: "c2",
    name: "Valentine's Day Workshop Promo",
    description: "Partner yoga workshop promotion with early bird discount",
    campaignType: "email",
    status: "scheduled",
    scheduledAt: "2025-02-10T10:00:00",
    startedAt: null,
    completedAt: null,
    estimatedRecipients: 1250,
    isAbTest: true,
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalConverted: 0,
    totalUnsubscribed: 0,
    totalBounced: 0,
    createdAt: "2025-02-02T11:00:00",
  },
  {
    id: "c3",
    name: "Class Reminder - 24hr",
    description: "Automated reminder 24 hours before booked class",
    campaignType: "sms",
    status: "active",
    scheduledAt: null,
    startedAt: "2025-01-01T00:00:00",
    completedAt: null,
    estimatedRecipients: 0,
    isAbTest: false,
    totalSent: 3842,
    totalDelivered: 3798,
    totalOpened: 0,
    totalClicked: 1245,
    totalConverted: 0,
    totalUnsubscribed: 5,
    totalBounced: 44,
    createdAt: "2025-01-01T00:00:00",
  },
  {
    id: "c4",
    name: "Membership Expiring Soon",
    description: "Push notification for members with expiring membership",
    campaignType: "push",
    status: "active",
    scheduledAt: null,
    startedAt: "2025-01-15T00:00:00",
    completedAt: null,
    estimatedRecipients: 0,
    isAbTest: false,
    totalSent: 234,
    totalDelivered: 228,
    totalOpened: 187,
    totalClicked: 89,
    totalConverted: 34,
    totalUnsubscribed: 0,
    totalBounced: 6,
    createdAt: "2025-01-15T09:00:00",
  },
  {
    id: "c5",
    name: "January Newsletter",
    description: "Monthly studio newsletter with updates and tips",
    campaignType: "email",
    status: "completed",
    scheduledAt: "2025-01-15T09:00:00",
    startedAt: "2025-01-15T09:00:00",
    completedAt: "2025-01-15T09:45:00",
    estimatedRecipients: 2100,
    isAbTest: false,
    totalSent: 2087,
    totalDelivered: 2034,
    totalOpened: 892,
    totalClicked: 234,
    totalConverted: 45,
    totalUnsubscribed: 18,
    totalBounced: 53,
    createdAt: "2025-01-10T14:00:00",
  },
  {
    id: "c6",
    name: "Win-back Lapsed Members",
    description: "Re-engagement campaign for members who haven't visited in 30+ days",
    campaignType: "email",
    status: "draft",
    scheduledAt: null,
    startedAt: null,
    completedAt: null,
    estimatedRecipients: 342,
    isAbTest: true,
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalConverted: 0,
    totalUnsubscribed: 0,
    totalBounced: 0,
    createdAt: "2025-02-03T16:30:00",
  },
  {
    id: "c7",
    name: "New Class Announcement",
    description: "Announcing the new Hot Pilates class starting next month",
    campaignType: "push",
    status: "completed",
    scheduledAt: "2025-01-20T12:00:00",
    startedAt: "2025-01-20T12:00:00",
    completedAt: "2025-01-20T12:15:00",
    estimatedRecipients: 1500,
    isAbTest: false,
    totalSent: 1456,
    totalDelivered: 1423,
    totalOpened: 1102,
    totalClicked: 456,
    totalConverted: 89,
    totalUnsubscribed: 12,
    totalBounced: 33,
    createdAt: "2025-01-18T10:00:00",
  },
  {
    id: "c8",
    name: "Flash Sale - Class Packs",
    description: "24-hour flash sale on 10-class packs",
    campaignType: "sms",
    status: "paused",
    scheduledAt: "2025-02-05T08:00:00",
    startedAt: "2025-02-05T08:00:00",
    completedAt: null,
    estimatedRecipients: 890,
    isAbTest: false,
    totalSent: 445,
    totalDelivered: 438,
    totalOpened: 0,
    totalClicked: 156,
    totalConverted: 23,
    totalUnsubscribed: 8,
    totalBounced: 7,
    createdAt: "2025-02-04T14:00:00",
  },
];

const savedSegments = [
  { id: "s1", name: "Active Members", count: 1245 },
  { id: "s2", name: "Lapsed Members (30+ days)", count: 342 },
  { id: "s3", name: "New Members (last 30 days)", count: 89 },
  { id: "s4", name: "Unlimited Membership Holders", count: 456 },
  { id: "s5", name: "Class Pack Holders", count: 234 },
  { id: "s6", name: "High Engagement (5+ classes/week)", count: 78 },
];

const membershipTypes = [
  { id: "m1", name: "Unlimited Monthly" },
  { id: "m2", name: "8 Classes/Month" },
  { id: "m3", name: "Drop-in" },
  { id: "m4", name: "Student Unlimited" },
];

const typeIcons: Record<CampaignType | string, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  push: Bell,
  multi_channel: Megaphone,
};

const statusColors: Record<CampaignStatus | string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-primary/20 text-primary",
  active: "bg-accent-sage/20 text-accent-sage",
  paused: "bg-accent-gold/20 text-accent-gold",
  completed: "bg-secondary text-foreground",
  cancelled: "bg-destructive/20 text-destructive",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRate(numerator: number, denominator: number): string {
  if (denominator === 0) return "0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

type WizardStep = "setup" | "audience" | "content" | "review";

export default function CampaignsManage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusTab, setStatusTab] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>("setup");

  // Create campaign form state
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    campaignType: "email" as CampaignType,
    scheduleType: "now" as "now" | "scheduled",
    scheduledDate: "",
    scheduledTime: "",
    // Audience
    audienceType: "segment" as "segment" | "filter",
    selectedSegments: [] as string[],
    membershipTypes: [] as string[],
    tags: [] as string[],
    lastVisitDays: "",
    // Content
    subject: "",
    previewText: "",
    body: "",
    // A/B Testing
    isAbTest: false,
    variantASubject: "",
    variantABody: "",
    variantBSubject: "",
    variantBBody: "",
    winnerCriteria: "open_rate" as "open_rate" | "click_rate",
    testPercentage: 20,
  });

  // Filtering
  const filtered = campaigns.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || c.campaignType === typeFilter;
    const matchesStatus =
      statusTab === "all" ||
      (statusTab === "drafts" && c.status === "draft") ||
      (statusTab === "scheduled" && c.status === "scheduled") ||
      (statusTab === "active" && (c.status === "active" || c.status === "paused")) ||
      (statusTab === "completed" && c.status === "completed");
    return matchesSearch && matchesType && matchesStatus;
  });

  // Stats
  const totalCampaigns = campaigns.length;
  const totalSent = campaigns.reduce((sum, c) => sum + c.totalSent, 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + c.totalOpened, 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + c.totalClicked, 0);
  const totalDelivered = campaigns.reduce((sum, c) => sum + c.totalDelivered, 0);
  const avgOpenRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
  const avgClickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

  const handlePauseResume = (campaign: CampaignRow) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaign.id
          ? { ...c, status: c.status === "paused" ? "active" : "paused" }
          : c
      )
    );
    toast({
      title: campaign.status === "paused" ? "Campaign resumed" : "Campaign paused",
      description: campaign.name,
    });
  };

  const handleDuplicate = (campaign: CampaignRow) => {
    const newCampaign: CampaignRow = {
      ...campaign,
      id: `c${Date.now()}`,
      name: `${campaign.name} (Copy)`,
      status: "draft",
      scheduledAt: null,
      startedAt: null,
      completedAt: null,
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalConverted: 0,
      totalUnsubscribed: 0,
      totalBounced: 0,
      createdAt: new Date().toISOString(),
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
    toast({
      title: "Campaign duplicated",
      description: `"${newCampaign.name}" created as draft`,
    });
  };

  const handleDelete = (campaign: CampaignRow) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
    toast({
      title: "Campaign deleted",
      description: campaign.name,
    });
  };

  const resetWizard = () => {
    setWizardStep("setup");
    setNewCampaign({
      name: "",
      description: "",
      campaignType: "email",
      scheduleType: "now",
      scheduledDate: "",
      scheduledTime: "",
      audienceType: "segment",
      selectedSegments: [],
      membershipTypes: [],
      tags: [],
      lastVisitDays: "",
      subject: "",
      previewText: "",
      body: "",
      isAbTest: false,
      variantASubject: "",
      variantABody: "",
      variantBSubject: "",
      variantBBody: "",
      winnerCriteria: "open_rate",
      testPercentage: 20,
    });
  };

  const handleCreateCampaign = () => {
    const campaign: CampaignRow = {
      id: `c${Date.now()}`,
      name: newCampaign.name,
      description: newCampaign.description,
      campaignType: newCampaign.campaignType,
      status: newCampaign.scheduleType === "now" ? "active" : "scheduled",
      scheduledAt:
        newCampaign.scheduleType === "scheduled" && newCampaign.scheduledDate
          ? `${newCampaign.scheduledDate}T${newCampaign.scheduledTime || "09:00"}:00`
          : null,
      startedAt: newCampaign.scheduleType === "now" ? new Date().toISOString() : null,
      completedAt: null,
      estimatedRecipients: newCampaign.selectedSegments.length > 0
        ? savedSegments.filter(s => newCampaign.selectedSegments.includes(s.id)).reduce((sum, s) => sum + s.count, 0)
        : 500,
      isAbTest: newCampaign.isAbTest,
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalConverted: 0,
      totalUnsubscribed: 0,
      totalBounced: 0,
      createdAt: new Date().toISOString(),
    };
    setCampaigns((prev) => [campaign, ...prev]);
    setCreateOpen(false);
    resetWizard();
    toast({
      title: newCampaign.scheduleType === "now" ? "Campaign launched" : "Campaign scheduled",
      description: campaign.name,
    });
  };

  const wizardSteps: { key: WizardStep; label: string }[] = [
    { key: "setup", label: "Setup" },
    { key: "audience", label: "Audience" },
    { key: "content", label: "Content" },
    { key: "review", label: "Review" },
  ];

  const currentStepIndex = wizardSteps.findIndex((s) => s.key === wizardStep);

  const canProceed = () => {
    switch (wizardStep) {
      case "setup":
        return newCampaign.name.trim() !== "";
      case "audience":
        return (
          newCampaign.selectedSegments.length > 0 ||
          newCampaign.membershipTypes.length > 0 ||
          newCampaign.lastVisitDays !== ""
        );
      case "content":
        if (newCampaign.isAbTest) {
          return (
            newCampaign.variantASubject.trim() !== "" &&
            newCampaign.variantABody.trim() !== "" &&
            newCampaign.variantBSubject.trim() !== "" &&
            newCampaign.variantBBody.trim() !== ""
          );
        }
        return newCampaign.subject.trim() !== "" && newCampaign.body.trim() !== "";
      case "review":
        return true;
      default:
        return false;
    }
  };

  const estimatedRecipients = newCampaign.selectedSegments.length > 0
    ? savedSegments
        .filter((s) => newCampaign.selectedSegments.includes(s.id))
        .reduce((sum, s) => sum + s.count, 0)
    : 0;

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage email, SMS, and push notification campaigns
            </p>
          </div>
          <Button onClick={() => { resetWizard(); setCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Campaigns</p>
                  <p className="text-xl font-bold mt-0.5">{totalCampaigns}</p>
                </div>
                <Megaphone className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Sent</p>
                  <p className="text-xl font-bold mt-0.5">{totalSent.toLocaleString()}</p>
                </div>
                <Send className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Open Rate</p>
                  <p className="text-xl font-bold mt-0.5 text-accent-sage">
                    {avgOpenRate.toFixed(1)}%
                  </p>
                </div>
                <Eye className="h-5 w-5 text-accent-sage" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Click Rate</p>
                  <p className="text-xl font-bold mt-0.5 text-primary">
                    {avgClickRate.toFixed(1)}%
                  </p>
                </div>
                <MousePointerClick className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Placeholder */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Send Volume Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center bg-secondary/30 rounded-xl border border-dashed border-border">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Campaign analytics chart</p>
                <p className="text-xs text-muted-foreground">Visualize sends, opens, and clicks over time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Tabs value={statusTab} onValueChange={setStatusTab} className="flex-1">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="push">Push</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Campaign List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Megaphone className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No campaigns found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || typeFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first campaign to get started"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((campaign) => {
              const TypeIcon = typeIcons[campaign.campaignType] || Mail;
              const openRate = formatRate(campaign.totalOpened, campaign.totalDelivered);
              const clickRate = formatRate(campaign.totalClicked, campaign.totalOpened);
              const deliveryRate = formatRate(campaign.totalDelivered, campaign.totalSent);

              return (
                <Card key={campaign.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Type Icon */}
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <TypeIcon className="h-5 w-5 text-primary" />
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold truncate">{campaign.name}</h3>
                              <Badge className={`text-[10px] ${statusColors[campaign.status]}`}>
                                {campaign.status}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] capitalize">
                                {campaign.campaignType}
                              </Badge>
                              {campaign.isAbTest && (
                                <Badge variant="outline" className="text-[10px]">
                                  <Beaker className="h-2.5 w-2.5 mr-1" />
                                  A/B Test
                                </Badge>
                              )}
                            </div>
                            {campaign.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {campaign.description}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => toast({ title: "Edit mode", description: "Campaign editor opened." })}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="rounded-lg cursor-pointer"
                                  onClick={() => handleDuplicate(campaign)}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                {(campaign.status === "active" || campaign.status === "paused") && (
                                  <DropdownMenuItem
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => handlePauseResume(campaign)}
                                  >
                                    {campaign.status === "paused" ? (
                                      <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Resume
                                      </>
                                    ) : (
                                      <>
                                        <Pause className="h-4 w-4 mr-2" />
                                        Pause
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="rounded-lg cursor-pointer text-destructive"
                                  onClick={() => handleDelete(campaign)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Schedule/Date Info */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {campaign.scheduledAt && campaign.status === "scheduled" && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Scheduled: {formatDateTime(campaign.scheduledAt)}
                            </span>
                          )}
                          {campaign.startedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {campaign.status === "completed" ? "Sent" : "Started"}: {formatDateTime(campaign.startedAt)}
                            </span>
                          )}
                          {campaign.estimatedRecipients > 0 && campaign.status === "draft" && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Est. recipients: {campaign.estimatedRecipients.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Stats Row */}
                        {campaign.totalSent > 0 && (
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Send className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{campaign.totalSent.toLocaleString()}</span>
                              <span className="text-muted-foreground">sent</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{deliveryRate}</span>
                              <span className="text-muted-foreground">delivered</span>
                            </div>
                            {campaign.campaignType !== "sms" && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <Eye className="h-3 w-3 text-accent-sage" />
                                <span className="font-medium text-accent-sage">{openRate}</span>
                                <span className="text-muted-foreground">opened</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-xs">
                              <MousePointerClick className="h-3 w-3 text-primary" />
                              <span className="font-medium text-primary">{clickRate}</span>
                              <span className="text-muted-foreground">clicked</span>
                            </div>
                            {campaign.totalConverted > 0 && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <Target className="h-3 w-3 text-accent-coral" />
                                <span className="font-medium text-accent-coral">
                                  {campaign.totalConverted}
                                </span>
                                <span className="text-muted-foreground">converted</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Create Campaign Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
              <DialogDescription>
                Build and schedule your marketing campaign
              </DialogDescription>
            </DialogHeader>

            {/* Wizard Steps Indicator */}
            <div className="flex items-center justify-between mb-6 px-4">
              {wizardSteps.map((step, index) => (
                <div key={step.key} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => index < currentStepIndex && setWizardStep(step.key)}
                    className={`flex items-center gap-2 ${
                      index < currentStepIndex
                        ? "cursor-pointer"
                        : index === currentStepIndex
                        ? "cursor-default"
                        : "cursor-not-allowed"
                    }`}
                    disabled={index > currentStepIndex}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        index < currentStepIndex
                          ? "bg-accent-sage text-white"
                          : index === currentStepIndex
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {index < currentStepIndex ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium hidden sm:inline ${
                        index === currentStepIndex
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                  {index < wizardSteps.length - 1 && (
                    <div
                      className={`h-px w-8 sm:w-12 mx-2 ${
                        index < currentStepIndex ? "bg-accent-sage" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="space-y-4 py-2">
              {/* Setup Step */}
              {wizardStep === "setup" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaignName">Campaign Name *</Label>
                    <Input
                      id="campaignName"
                      placeholder="e.g. February Newsletter"
                      value={newCampaign.name}
                      onChange={(e) =>
                        setNewCampaign({ ...newCampaign, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campaignDesc">Description</Label>
                    <Textarea
                      id="campaignDesc"
                      placeholder="Brief description of this campaign..."
                      value={newCampaign.description}
                      onChange={(e) =>
                        setNewCampaign({ ...newCampaign, description: e.target.value })
                      }
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Campaign Type *</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["email", "sms", "push"] as CampaignType[]).map((type) => {
                        const Icon = typeIcons[type];
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() =>
                              setNewCampaign({ ...newCampaign, campaignType: type })
                            }
                            className={`p-4 rounded-xl border-2 transition-all ${
                              newCampaign.campaignType === type
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                            <p className="text-sm font-medium capitalize">{type}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Schedule</Label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setNewCampaign({ ...newCampaign, scheduleType: "now" })
                        }
                        className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                          newCampaign.scheduleType === "now"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Send className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-sm font-medium">Send Now</p>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNewCampaign({ ...newCampaign, scheduleType: "scheduled" })
                        }
                        className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                          newCampaign.scheduleType === "scheduled"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-sm font-medium">Schedule</p>
                      </button>
                    </div>
                    {newCampaign.scheduleType === "scheduled" && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="space-y-1">
                          <Label htmlFor="schedDate" className="text-xs">Date</Label>
                          <Input
                            id="schedDate"
                            type="date"
                            value={newCampaign.scheduledDate}
                            onChange={(e) =>
                              setNewCampaign({ ...newCampaign, scheduledDate: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="schedTime" className="text-xs">Time</Label>
                          <Input
                            id="schedTime"
                            type="time"
                            value={newCampaign.scheduledTime}
                            onChange={(e) =>
                              setNewCampaign({ ...newCampaign, scheduledTime: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Audience Step */}
              {wizardStep === "audience" && (
                <div className="space-y-4">
                  <Tabs
                    value={newCampaign.audienceType}
                    onValueChange={(v) =>
                      setNewCampaign({ ...newCampaign, audienceType: v as "segment" | "filter" })
                    }
                  >
                    <TabsList className="grid grid-cols-2 w-full">
                      <TabsTrigger value="segment">Saved Segments</TabsTrigger>
                      <TabsTrigger value="filter">Custom Filter</TabsTrigger>
                    </TabsList>
                    <TabsContent value="segment" className="space-y-3 mt-4">
                      <p className="text-sm text-muted-foreground">
                        Select one or more saved audience segments
                      </p>
                      <div className="space-y-2">
                        {savedSegments.map((segment) => (
                          <label
                            key={segment.id}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                              newCampaign.selectedSegments.includes(segment.id)
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={newCampaign.selectedSegments.includes(segment.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewCampaign({
                                      ...newCampaign,
                                      selectedSegments: [...newCampaign.selectedSegments, segment.id],
                                    });
                                  } else {
                                    setNewCampaign({
                                      ...newCampaign,
                                      selectedSegments: newCampaign.selectedSegments.filter(
                                        (id) => id !== segment.id
                                      ),
                                    });
                                  }
                                }}
                              />
                              <span className="text-sm font-medium">{segment.name}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {segment.count.toLocaleString()} members
                            </Badge>
                          </label>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="filter" className="space-y-4 mt-4">
                      <p className="text-sm text-muted-foreground">
                        Create a custom filter to target specific members
                      </p>
                      <div className="space-y-2">
                        <Label>Membership Type</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {membershipTypes.map((type) => (
                            <label
                              key={type.id}
                              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                                newCampaign.membershipTypes.includes(type.id)
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <Checkbox
                                checked={newCampaign.membershipTypes.includes(type.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewCampaign({
                                      ...newCampaign,
                                      membershipTypes: [...newCampaign.membershipTypes, type.id],
                                    });
                                  } else {
                                    setNewCampaign({
                                      ...newCampaign,
                                      membershipTypes: newCampaign.membershipTypes.filter(
                                        (id) => id !== type.id
                                      ),
                                    });
                                  }
                                }}
                              />
                              <span className="text-sm">{type.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                          id="tags"
                          placeholder="e.g. VIP, Newsletter, Promo"
                          value={newCampaign.tags.join(", ")}
                          onChange={(e) =>
                            setNewCampaign({
                              ...newCampaign,
                              tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastVisit">Last Visit (days ago)</Label>
                        <Select
                          value={newCampaign.lastVisitDays}
                          onValueChange={(v) =>
                            setNewCampaign({ ...newCampaign, lastVisitDays: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Any time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Any time</SelectItem>
                            <SelectItem value="7">Within last 7 days</SelectItem>
                            <SelectItem value="14">Within last 14 days</SelectItem>
                            <SelectItem value="30">Within last 30 days</SelectItem>
                            <SelectItem value="30+">More than 30 days ago</SelectItem>
                            <SelectItem value="60+">More than 60 days ago</SelectItem>
                            <SelectItem value="90+">More than 90 days ago</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                  </Tabs>
                  {estimatedRecipients > 0 && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-3 flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">
                            Estimated Recipients: {estimatedRecipients.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Based on selected segments
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Content Step */}
              {wizardStep === "content" && (
                <div className="space-y-4">
                  {/* A/B Testing Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <Beaker className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">A/B Testing</p>
                        <p className="text-xs text-muted-foreground">
                          Test two versions to find the winner
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={newCampaign.isAbTest}
                      onCheckedChange={(checked) =>
                        setNewCampaign({ ...newCampaign, isAbTest: checked })
                      }
                    />
                  </div>

                  {newCampaign.isAbTest ? (
                    <>
                      {/* A/B Test Settings */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Winner Criteria</Label>
                          <Select
                            value={newCampaign.winnerCriteria}
                            onValueChange={(v) =>
                              setNewCampaign({
                                ...newCampaign,
                                winnerCriteria: v as "open_rate" | "click_rate",
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open_rate">Open Rate</SelectItem>
                              <SelectItem value="click_rate">Click Rate</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Test Percentage: {newCampaign.testPercentage}%</Label>
                          <Slider
                            value={[newCampaign.testPercentage]}
                            onValueChange={([v]) =>
                              setNewCampaign({ ...newCampaign, testPercentage: v })
                            }
                            min={10}
                            max={50}
                            step={5}
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground">
                            {newCampaign.testPercentage}% will receive test variants, winner goes to the rest
                          </p>
                        </div>
                      </div>

                      {/* Variant A */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Badge className="bg-primary/20 text-primary">A</Badge>
                            Variant A
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {newCampaign.campaignType === "email" && (
                            <div className="space-y-2">
                              <Label htmlFor="varASubject">Subject Line *</Label>
                              <Input
                                id="varASubject"
                                placeholder="Email subject..."
                                value={newCampaign.variantASubject}
                                onChange={(e) =>
                                  setNewCampaign({
                                    ...newCampaign,
                                    variantASubject: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor="varABody">
                              {newCampaign.campaignType === "email"
                                ? "Body"
                                : newCampaign.campaignType === "sms"
                                ? "Message"
                                : "Push Content"}{" "}
                              *
                            </Label>
                            <Textarea
                              id="varABody"
                              placeholder="Write your message..."
                              value={newCampaign.variantABody}
                              onChange={(e) =>
                                setNewCampaign({
                                  ...newCampaign,
                                  variantABody: e.target.value,
                                })
                              }
                              className="min-h-[100px]"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Variant B */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Badge className="bg-accent-gold/20 text-accent-gold">B</Badge>
                            Variant B
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {newCampaign.campaignType === "email" && (
                            <div className="space-y-2">
                              <Label htmlFor="varBSubject">Subject Line *</Label>
                              <Input
                                id="varBSubject"
                                placeholder="Email subject..."
                                value={newCampaign.variantBSubject}
                                onChange={(e) =>
                                  setNewCampaign({
                                    ...newCampaign,
                                    variantBSubject: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor="varBBody">
                              {newCampaign.campaignType === "email"
                                ? "Body"
                                : newCampaign.campaignType === "sms"
                                ? "Message"
                                : "Push Content"}{" "}
                              *
                            </Label>
                            <Textarea
                              id="varBBody"
                              placeholder="Write your message..."
                              value={newCampaign.variantBBody}
                              onChange={(e) =>
                                setNewCampaign({
                                  ...newCampaign,
                                  variantBBody: e.target.value,
                                })
                              }
                              className="min-h-[100px]"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <>
                      {/* Single Version Content */}
                      {newCampaign.campaignType === "email" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="subject">Subject Line *</Label>
                            <Input
                              id="subject"
                              placeholder="e.g. Your February newsletter is here!"
                              value={newCampaign.subject}
                              onChange={(e) =>
                                setNewCampaign({ ...newCampaign, subject: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="preview">Preview Text</Label>
                            <Input
                              id="preview"
                              placeholder="Text that appears after the subject in inbox..."
                              value={newCampaign.previewText}
                              onChange={(e) =>
                                setNewCampaign({ ...newCampaign, previewText: e.target.value })
                              }
                            />
                          </div>
                        </>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="body">
                          {newCampaign.campaignType === "email"
                            ? "Body *"
                            : newCampaign.campaignType === "sms"
                            ? "Message *"
                            : "Push Notification Content *"}
                        </Label>
                        <Textarea
                          id="body"
                          placeholder={
                            newCampaign.campaignType === "email"
                              ? "Write your email content..."
                              : newCampaign.campaignType === "sms"
                              ? "Write your SMS message (160 chars recommended)..."
                              : "Write your push notification..."
                          }
                          value={newCampaign.body}
                          onChange={(e) =>
                            setNewCampaign({ ...newCampaign, body: e.target.value })
                          }
                          className="min-h-[150px]"
                        />
                        {newCampaign.campaignType === "sms" && (
                          <p className="text-xs text-muted-foreground">
                            {newCampaign.body.length}/160 characters
                            {newCampaign.body.length > 160 && (
                              <span className="text-accent-gold">
                                {" "}
                                (will be sent as {Math.ceil(newCampaign.body.length / 160)} messages)
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Review Step */}
              {wizardStep === "review" && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Campaign Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Name</p>
                          <p className="font-medium">{newCampaign.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-medium capitalize">{newCampaign.campaignType}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Schedule</p>
                          <p className="font-medium">
                            {newCampaign.scheduleType === "now"
                              ? "Send immediately"
                              : `${newCampaign.scheduledDate} at ${newCampaign.scheduledTime || "09:00"}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">A/B Test</p>
                          <p className="font-medium">{newCampaign.isAbTest ? "Enabled" : "Disabled"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Audience</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {newCampaign.selectedSegments.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Selected Segments:</p>
                          <div className="flex flex-wrap gap-2">
                            {savedSegments
                              .filter((s) => newCampaign.selectedSegments.includes(s.id))
                              .map((s) => (
                                <Badge key={s.id} variant="outline">
                                  {s.name} ({s.count})
                                </Badge>
                              ))}
                          </div>
                          <p className="text-sm font-medium mt-2">
                            Total: {estimatedRecipients.toLocaleString()} recipients
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Custom Filter:</p>
                          {newCampaign.membershipTypes.length > 0 && (
                            <p className="text-sm">
                              Membership:{" "}
                              {membershipTypes
                                .filter((m) => newCampaign.membershipTypes.includes(m.id))
                                .map((m) => m.name)
                                .join(", ")}
                            </p>
                          )}
                          {newCampaign.lastVisitDays && (
                            <p className="text-sm">Last visit: {newCampaign.lastVisitDays} days</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Content Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {newCampaign.isAbTest ? (
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-xs font-medium text-primary mb-1">Variant A</p>
                            {newCampaign.campaignType === "email" && (
                              <p className="text-sm font-medium">{newCampaign.variantASubject}</p>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {newCampaign.variantABody}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-accent-gold/5 border border-accent-gold/20">
                            <p className="text-xs font-medium text-accent-gold mb-1">Variant B</p>
                            {newCampaign.campaignType === "email" && (
                              <p className="text-sm font-medium">{newCampaign.variantBSubject}</p>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {newCampaign.variantBBody}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-secondary/30">
                          {newCampaign.campaignType === "email" && (
                            <p className="text-sm font-medium">{newCampaign.subject}</p>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {newCampaign.body}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <div>
                {currentStepIndex > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setWizardStep(wizardSteps[currentStepIndex - 1].key)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                {wizardStep === "review" ? (
                  <Button onClick={handleCreateCampaign}>
                    <Send className="h-4 w-4 mr-2" />
                    {newCampaign.scheduleType === "now" ? "Launch Campaign" : "Schedule Campaign"}
                  </Button>
                ) : (
                  <Button onClick={() => setWizardStep(wizardSteps[currentStepIndex + 1].key)} disabled={!canProceed()}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ManageLayout>
  );
}
