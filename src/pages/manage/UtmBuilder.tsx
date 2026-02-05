import { useState, useMemo } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Link,
  Copy,
  QrCode,
  Bookmark,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  Star,
  Check,
  Calendar,
  MousePointer,
  Lightbulb,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UtmTemplate, LinkClick } from "@/types/database";

// Mock data for saved templates
const mockTemplates: UtmTemplate[] = [
  {
    id: "t1",
    studio_id: "studio-1",
    name: "Newsletter Campaign",
    description: "Default template for weekly newsletters",
    utm_source: "newsletter",
    utm_medium: "email",
    utm_campaign: "weekly-digest",
    utm_term: null,
    utm_content: null,
    is_default: true,
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T10:00:00Z",
  },
  {
    id: "t2",
    studio_id: "studio-1",
    name: "Facebook Ads",
    description: "For paid Facebook campaigns",
    utm_source: "facebook",
    utm_medium: "cpc",
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
    is_default: false,
    created_at: "2025-01-10T10:00:00Z",
    updated_at: "2025-01-10T10:00:00Z",
  },
  {
    id: "t3",
    studio_id: "studio-1",
    name: "Instagram Bio",
    description: "Link in bio tracking",
    utm_source: "instagram",
    utm_medium: "social",
    utm_campaign: "bio-link",
    utm_term: null,
    utm_content: null,
    is_default: false,
    created_at: "2025-01-05T10:00:00Z",
    updated_at: "2025-01-05T10:00:00Z",
  },
  {
    id: "t4",
    studio_id: "studio-1",
    name: "Google Ads",
    description: "For paid search campaigns",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
    is_default: false,
    created_at: "2025-01-02T10:00:00Z",
    updated_at: "2025-01-02T10:00:00Z",
  },
];

// Mock data for recent links
const mockRecentLinks: (LinkClick & { short_url: string; click_count: number })[] = [
  {
    id: "lc1",
    studio_id: "studio-1",
    campaign_id: null,
    campaign_send_id: null,
    utm_source: "newsletter",
    utm_medium: "email",
    utm_campaign: "january-promo",
    utm_term: null,
    utm_content: "header-cta",
    destination_url: "https://tandavayoga.com/schedule",
    short_code: "tnd.yoga/a1b2c3",
    short_url: "https://tnd.yoga/a1b2c3",
    profile_id: null,
    session_id: null,
    ip_address: null,
    user_agent: null,
    referrer: null,
    clicked_at: "2025-02-01T14:30:00Z",
    click_count: 156,
  },
  {
    id: "lc2",
    studio_id: "studio-1",
    campaign_id: null,
    campaign_send_id: null,
    utm_source: "facebook",
    utm_medium: "cpc",
    utm_campaign: "new-student-offer",
    utm_term: "yoga classes",
    utm_content: "carousel-1",
    destination_url: "https://tandavayoga.com/new-students",
    short_code: "tnd.yoga/x4y5z6",
    short_url: "https://tnd.yoga/x4y5z6",
    profile_id: null,
    session_id: null,
    ip_address: null,
    user_agent: null,
    referrer: null,
    clicked_at: "2025-01-28T09:15:00Z",
    click_count: 89,
  },
  {
    id: "lc3",
    studio_id: "studio-1",
    campaign_id: null,
    campaign_send_id: null,
    utm_source: "instagram",
    utm_medium: "social",
    utm_campaign: "bio-link",
    utm_term: null,
    utm_content: null,
    destination_url: "https://tandavayoga.com",
    short_code: "tnd.yoga/m7n8o9",
    short_url: "https://tnd.yoga/m7n8o9",
    profile_id: null,
    session_id: null,
    ip_address: null,
    user_agent: null,
    referrer: null,
    clicked_at: "2025-01-25T16:45:00Z",
    click_count: 234,
  },
  {
    id: "lc4",
    studio_id: "studio-1",
    campaign_id: null,
    campaign_send_id: null,
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "brand-search",
    utm_term: "tandava yoga",
    utm_content: null,
    destination_url: "https://tandavayoga.com",
    short_code: "tnd.yoga/p1q2r3",
    short_url: "https://tnd.yoga/p1q2r3",
    profile_id: null,
    session_id: null,
    ip_address: null,
    user_agent: null,
    referrer: null,
    clicked_at: "2025-01-20T11:00:00Z",
    click_count: 412,
  },
  {
    id: "lc5",
    studio_id: "studio-1",
    campaign_id: null,
    campaign_send_id: null,
    utm_source: "partner",
    utm_medium: "referral",
    utm_campaign: "wellness-collab",
    utm_term: null,
    utm_content: "blog-post",
    destination_url: "https://tandavayoga.com/workshops",
    short_code: "tnd.yoga/s4t5u6",
    short_url: "https://tnd.yoga/s4t5u6",
    profile_id: null,
    session_id: null,
    ip_address: null,
    user_agent: null,
    referrer: null,
    clicked_at: "2025-01-15T08:30:00Z",
    click_count: 67,
  },
];

// Common source/medium combinations for best practices
const commonCombinations = [
  { source: "newsletter", medium: "email", description: "Email newsletters" },
  { source: "facebook", medium: "cpc", description: "Facebook paid ads" },
  { source: "facebook", medium: "social", description: "Facebook organic posts" },
  { source: "google", medium: "cpc", description: "Google Ads" },
  { source: "google", medium: "organic", description: "Google search (for reference)" },
  { source: "instagram", medium: "social", description: "Instagram posts/stories" },
  { source: "twitter", medium: "social", description: "Twitter/X posts" },
  { source: "partner", medium: "referral", description: "Partner referrals" },
];

export default function UtmBuilder() {
  const { toast } = useToast();

  // Form state
  const [destinationUrl, setDestinationUrl] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");

  // Templates state
  const [templates, setTemplates] = useState(mockTemplates);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<UtmTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");

  // Recent links state
  const [recentLinks] = useState(mockRecentLinks);
  const [dateFilter, setDateFilter] = useState<string>("all");

  // QR Code dialog
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  // Generate the full URL with UTM parameters
  const generatedUrl = useMemo(() => {
    if (!destinationUrl) return "";

    try {
      const url = new URL(destinationUrl.startsWith("http") ? destinationUrl : `https://${destinationUrl}`);

      if (utmSource) url.searchParams.set("utm_source", utmSource);
      if (utmMedium) url.searchParams.set("utm_medium", utmMedium);
      if (utmCampaign) url.searchParams.set("utm_campaign", utmCampaign);
      if (utmTerm) url.searchParams.set("utm_term", utmTerm);
      if (utmContent) url.searchParams.set("utm_content", utmContent);

      return url.toString();
    } catch {
      return "";
    }
  }, [destinationUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent]);

  const isFormValid = destinationUrl && utmSource && utmMedium;

  const handleCopyUrl = () => {
    if (generatedUrl) {
      navigator.clipboard?.writeText(generatedUrl);
      toast({ title: "Copied!", description: "URL copied to clipboard." });
    }
  };

  const handleCopyShortUrl = (url: string) => {
    navigator.clipboard?.writeText(url);
    toast({ title: "Copied!", description: "Short URL copied to clipboard." });
  };

  const handleApplyTemplate = (template: UtmTemplate) => {
    setUtmSource(template.utm_source);
    setUtmMedium(template.utm_medium);
    setUtmCampaign(template.utm_campaign || "");
    setUtmTerm(template.utm_term || "");
    setUtmContent(template.utm_content || "");
    toast({ title: "Template applied", description: `${template.name} settings loaded.` });
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      // Update existing template
      setTemplates(templates.map(t =>
        t.id === editingTemplate.id
          ? {
              ...t,
              name: newTemplateName,
              description: newTemplateDescription || null,
              utm_source: utmSource,
              utm_medium: utmMedium,
              utm_campaign: utmCampaign || null,
              utm_term: utmTerm || null,
              utm_content: utmContent || null,
              updated_at: new Date().toISOString(),
            }
          : t
      ));
      toast({ title: "Template updated", description: `${newTemplateName} has been updated.` });
    } else {
      // Create new template
      const newTemplate: UtmTemplate = {
        id: `t${Date.now()}`,
        studio_id: "studio-1",
        name: newTemplateName,
        description: newTemplateDescription || null,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign || null,
        utm_term: utmTerm || null,
        utm_content: utmContent || null,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTemplates([newTemplate, ...templates]);
      toast({ title: "Template saved", description: `${newTemplateName} has been created.` });
    }
    setTemplateDialogOpen(false);
    setEditingTemplate(null);
    setNewTemplateName("");
    setNewTemplateDescription("");
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    toast({ title: "Template deleted", description: "The template has been removed." });
  };

  const handleSetDefault = (id: string) => {
    setTemplates(templates.map(t => ({ ...t, is_default: t.id === id })));
    const template = templates.find(t => t.id === id);
    toast({ title: "Default updated", description: `${template?.name} is now your default template.` });
  };

  const handleEditTemplate = (template: UtmTemplate) => {
    setEditingTemplate(template);
    setNewTemplateName(template.name);
    setNewTemplateDescription(template.description || "");
    setUtmSource(template.utm_source);
    setUtmMedium(template.utm_medium);
    setUtmCampaign(template.utm_campaign || "");
    setUtmTerm(template.utm_term || "");
    setUtmContent(template.utm_content || "");
    setTemplateDialogOpen(true);
  };

  const handleOpenSaveDialog = () => {
    setEditingTemplate(null);
    setNewTemplateName("");
    setNewTemplateDescription("");
    setTemplateDialogOpen(true);
  };

  const handleClearForm = () => {
    setDestinationUrl("");
    setUtmSource("");
    setUtmMedium("");
    setUtmCampaign("");
    setUtmTerm("");
    setUtmContent("");
  };

  // Filter recent links by date
  const filteredLinks = useMemo(() => {
    if (dateFilter === "all") return recentLinks;

    const now = new Date();
    const filterDate = new Date();

    switch (dateFilter) {
      case "7d":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        filterDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        filterDate.setDate(now.getDate() - 90);
        break;
      default:
        return recentLinks;
    }

    return recentLinks.filter(link => new Date(link.clicked_at) >= filterDate);
  }, [recentLinks, dateFilter]);

  const totalClicks = recentLinks.reduce((sum, link) => sum + link.click_count, 0);

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">UTM Builder</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create tracked links to measure your marketing campaigns
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Links Created", value: recentLinks.length, icon: Link },
            { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointer },
            { label: "Saved Templates", value: templates.length, icon: Bookmark },
            { label: "Active Campaigns", value: new Set(recentLinks.map(l => l.utm_campaign).filter(Boolean)).size, icon: Calendar },
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - UTM Builder and Tables */}
          <div className="lg:col-span-2 space-y-6">
            {/* UTM Link Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  UTM Link Generator
                </CardTitle>
                <CardDescription>
                  Add UTM parameters to track where your traffic comes from
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Destination URL */}
                <div className="space-y-2">
                  <Label htmlFor="destinationUrl">Destination URL</Label>
                  <Input
                    id="destinationUrl"
                    placeholder="https://tandavayoga.com/schedule"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                  />
                </div>

                {/* Required UTM Parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="utmSource">
                      utm_source <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="utmSource"
                      placeholder="e.g. newsletter, facebook, google"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value.toLowerCase().replace(/\s/g, "_"))}
                    />
                    <p className="text-[10px] text-muted-foreground">Where the traffic comes from</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="utmMedium">
                      utm_medium <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="utmMedium"
                      placeholder="e.g. email, cpc, social"
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value.toLowerCase().replace(/\s/g, "_"))}
                    />
                    <p className="text-[10px] text-muted-foreground">Marketing channel type</p>
                  </div>
                </div>

                {/* Optional UTM Parameters */}
                <div className="space-y-2">
                  <Label htmlFor="utmCampaign">utm_campaign (optional)</Label>
                  <Input
                    id="utmCampaign"
                    placeholder="e.g. spring-sale, new-student-promo"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value.toLowerCase().replace(/\s/g, "-"))}
                  />
                  <p className="text-[10px] text-muted-foreground">Campaign name or promotion</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="utmTerm">utm_term (optional)</Label>
                    <Input
                      id="utmTerm"
                      placeholder="e.g. yoga classes, hot yoga"
                      value={utmTerm}
                      onChange={(e) => setUtmTerm(e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground">Paid search keywords</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="utmContent">utm_content (optional)</Label>
                    <Input
                      id="utmContent"
                      placeholder="e.g. header-cta, sidebar-banner"
                      value={utmContent}
                      onChange={(e) => setUtmContent(e.target.value.toLowerCase().replace(/\s/g, "-"))}
                    />
                    <p className="text-[10px] text-muted-foreground">A/B test or ad variation</p>
                  </div>
                </div>

                {/* Generated URL Preview */}
                {generatedUrl && (
                  <div className="space-y-2 pt-2">
                    <Label>Generated URL</Label>
                    <div className="p-3 bg-secondary/50 rounded-lg break-all">
                      <code className="text-xs">{generatedUrl}</code>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Button onClick={handleCopyUrl} disabled={!isFormValid}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setQrDialogOpen(true)}
                    disabled={!isFormValid}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Code
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOpenSaveDialog}
                    disabled={!utmSource || !utmMedium}
                  >
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save Template
                  </Button>
                  <Button variant="ghost" onClick={handleClearForm}>
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Templates and Recent Links */}
            <Tabs defaultValue="templates" className="w-full">
              <TabsList>
                <TabsTrigger value="templates">Saved Templates</TabsTrigger>
                <TabsTrigger value="recent">Recent Links</TabsTrigger>
              </TabsList>

              {/* Saved Templates */}
              <TabsContent value="templates" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Saved Templates</CardTitle>
                      <Button size="sm" onClick={handleOpenSaveDialog}>
                        <Plus className="h-4 w-4 mr-1" />
                        New Template
                      </Button>
                    </div>
                    <CardDescription>
                      Quick-apply templates to speed up link creation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className="flex items-start justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium">{template.name}</h4>
                              {template.is_default && (
                                <Badge className="text-[10px] bg-accent-gold/20 text-accent-gold">
                                  <Star className="h-2.5 w-2.5 mr-0.5" />
                                  Default
                                </Badge>
                              )}
                            </div>
                            {template.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <code className="text-[10px] px-1.5 py-0.5 bg-secondary rounded">
                                {template.utm_source}
                              </code>
                              <code className="text-[10px] px-1.5 py-0.5 bg-secondary rounded">
                                {template.utm_medium}
                              </code>
                              {template.utm_campaign && (
                                <code className="text-[10px] px-1.5 py-0.5 bg-secondary rounded">
                                  {template.utm_campaign}
                                </code>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApplyTemplate(template)}
                            >
                              Apply
                            </Button>
                            {!template.is_default && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title="Set as default"
                                onClick={() => handleSetDefault(template.id)}
                              >
                                <Star className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Edit"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Delete"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {templates.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          No saved templates yet. Create one to speed up link building.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Recent Links */}
              <TabsContent value="recent" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Recent Links</CardTitle>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All time</SelectItem>
                          <SelectItem value="7d">Last 7 days</SelectItem>
                          <SelectItem value="30d">Last 30 days</SelectItem>
                          <SelectItem value="90d">Last 90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <CardDescription>
                      Track performance of your generated links
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Short URL</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>Source / Medium</TableHead>
                          <TableHead className="text-right">Clicks</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLinks.map((link) => (
                          <TableRow key={link.id}>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <code className="text-xs">{link.short_code}</code>
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              <span className="text-xs text-muted-foreground">
                                {link.destination_url.replace(/^https?:\/\//, "")}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <code className="text-[10px] px-1 py-0.5 bg-secondary rounded">
                                  {link.utm_source}
                                </code>
                                <span className="text-muted-foreground">/</span>
                                <code className="text-[10px] px-1 py-0.5 bg-secondary rounded">
                                  {link.utm_medium}
                                </code>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {link.click_count}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(link.clicked_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleCopyShortUrl(link.short_url)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredLinks.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                              No links found for the selected period.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Best Practices */}
          <div className="space-y-6">
            {/* Best Practices Card */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-accent-gold" />
                  UTM Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Naming Conventions</h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-accent-sage mt-0.5 shrink-0" />
                      Use lowercase letters only
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-accent-sage mt-0.5 shrink-0" />
                      Replace spaces with underscores or hyphens
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-accent-sage mt-0.5 shrink-0" />
                      Keep names short but descriptive
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-accent-sage mt-0.5 shrink-0" />
                      Be consistent across campaigns
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-accent-sage mt-0.5 shrink-0" />
                      Include dates in campaign names (e.g., jan-2025)
                    </li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Common Combinations</h4>
                  <div className="space-y-2">
                    {commonCombinations.map((combo, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setUtmSource(combo.source);
                          setUtmMedium(combo.medium);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
                      >
                        <div>
                          <div className="flex items-center gap-1">
                            <code className="text-[10px] px-1 py-0.5 bg-background rounded">
                              {combo.source}
                            </code>
                            <span className="text-muted-foreground text-[10px]">/</span>
                            <code className="text-[10px] px-1 py-0.5 bg-background rounded">
                              {combo.medium}
                            </code>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {combo.description}
                          </p>
                        </div>
                        <Plus className="h-3 w-3 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Pro Tips</h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>
                      <strong>utm_source:</strong> The platform (facebook, google, newsletter)
                    </li>
                    <li>
                      <strong>utm_medium:</strong> The channel type (cpc, social, email)
                    </li>
                    <li>
                      <strong>utm_campaign:</strong> Your campaign name (spring-sale)
                    </li>
                    <li>
                      <strong>utm_term:</strong> Paid keywords (yoga+classes)
                    </li>
                    <li>
                      <strong>utm_content:</strong> A/B variants (blue-button)
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save/Edit Template Dialog */}
        <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Save as Template"}
              </DialogTitle>
              <DialogDescription>
                Save your current UTM settings as a reusable template
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  placeholder="e.g. Newsletter Campaign"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateDesc">Description (optional)</Label>
                <Input
                  id="templateDesc"
                  placeholder="e.g. For weekly email newsletters"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                />
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs font-medium mb-2">Settings to save:</p>
                <div className="flex flex-wrap gap-1">
                  {utmSource && (
                    <code className="text-[10px] px-1.5 py-0.5 bg-background rounded">
                      source: {utmSource}
                    </code>
                  )}
                  {utmMedium && (
                    <code className="text-[10px] px-1.5 py-0.5 bg-background rounded">
                      medium: {utmMedium}
                    </code>
                  )}
                  {utmCampaign && (
                    <code className="text-[10px] px-1.5 py-0.5 bg-background rounded">
                      campaign: {utmCampaign}
                    </code>
                  )}
                  {utmTerm && (
                    <code className="text-[10px] px-1.5 py-0.5 bg-background rounded">
                      term: {utmTerm}
                    </code>
                  )}
                  {utmContent && (
                    <code className="text-[10px] px-1.5 py-0.5 bg-background rounded">
                      content: {utmContent}
                    </code>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={!newTemplateName || !utmSource || !utmMedium}
              >
                {editingTemplate ? "Update Template" : "Save Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>QR Code</DialogTitle>
              <DialogDescription>
                Scan this code to open your tracked link
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center py-6">
              {/* QR Code Placeholder */}
              <div className="w-48 h-48 bg-secondary rounded-xl flex items-center justify-center border-2 border-dashed border-border">
                <div className="text-center">
                  <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">QR Code Preview</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    (Integration pending)
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center max-w-[200px] break-all">
                {generatedUrl}
              </p>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" className="flex-1" disabled>
                Download PNG
              </Button>
              <Button variant="outline" className="flex-1" disabled>
                Download SVG
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ManageLayout>
  );
}
