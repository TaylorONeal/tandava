import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Search,
  Target,
  FileText,
  Image,
  Eye,
  Check,
  ExternalLink,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LandingPageWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: LandingPageData) => void;
  initialTemplate?: string;
}

interface LandingPageData {
  title: string;
  slug: string;
  template: string;
  metaDescription: string;
  targetKeywords: string[];
  heroHeadline: string;
  heroSubheadline: string;
  ctaText: string;
  ctaLink: string;
  hasExpiration: boolean;
  expirationDate?: string;
  expiredBehavior: "show_alternatives" | "redirect_parent" | "show_message" | "custom_redirect";
  expiredMessage?: string;
  expiredRedirectUrl?: string;
}

const WIZARD_STEPS = [
  { id: "template", title: "Choose Template", icon: FileText },
  { id: "content", title: "Page Content", icon: Target },
  { id: "seo", title: "SEO Settings", icon: Search },
  { id: "expiration", title: "Expiration", icon: Calendar },
  { id: "preview", title: "Preview", icon: Eye },
];

const TEMPLATES = [
  {
    id: "teacher_training",
    name: "Teacher Training",
    description: "200-hour, 300-hour, or specialty certifications",
    suggestedKeywords: ["yoga teacher training", "YTT", "yoga certification", "become yoga instructor"],
    heroExample: "Transform Your Practice Into Your Profession",
    ctaExample: "Apply Now",
  },
  {
    id: "retreat",
    name: "Retreat",
    description: "Yoga retreats, wellness getaways, destination programs",
    suggestedKeywords: ["yoga retreat", "wellness retreat", "meditation retreat"],
    heroExample: "Escape. Restore. Transform.",
    ctaExample: "Reserve Your Spot",
  },
  {
    id: "workshop",
    name: "Workshop",
    description: "Single or multi-day workshops and intensives",
    suggestedKeywords: ["yoga workshop", "arm balance workshop", "meditation intensive"],
    heroExample: "Master the Art of Arm Balances",
    ctaExample: "Register Now",
  },
  {
    id: "new_student",
    name: "New Student Offer",
    description: "Introductory specials for first-time visitors",
    suggestedKeywords: ["yoga near me", "first yoga class", "beginner yoga"],
    heroExample: "Your First Week Free",
    ctaExample: "Start Free Trial",
  },
  {
    id: "class_style",
    name: "Class Style",
    description: "Highlight a specific yoga style (hot, vinyasa, yin, etc.)",
    suggestedKeywords: ["hot yoga", "vinyasa yoga", "yin yoga"],
    heroExample: "Transform Your Body with Hot Yoga",
    ctaExample: "View Schedule",
  },
  {
    id: "seasonal_promo",
    name: "Seasonal Promotion",
    description: "Limited-time offers (New Year, Summer, Holiday)",
    suggestedKeywords: ["yoga special", "yoga deal", "membership discount"],
    heroExample: "New Year, New You - 20% Off Memberships",
    ctaExample: "Claim Offer",
  },
  {
    id: "location",
    name: "Location Page",
    description: "SEO page for a specific studio location",
    suggestedKeywords: ["yoga [city]", "yoga studio near me", "yoga classes [neighborhood]"],
    heroExample: "Yoga in the Heart of SOMA",
    ctaExample: "See Classes",
  },
  {
    id: "custom",
    name: "Custom Page",
    description: "Start from scratch with full control",
    suggestedKeywords: [],
    heroExample: "Your Headline Here",
    ctaExample: "Get Started",
  },
];

const KEYWORD_TOOLS = [
  { name: "Google Keyword Planner", url: "https://ads.google.com/keyword-planner", free: true },
  { name: "Ubersuggest", url: "https://neilpatel.com/ubersuggest/", free: true },
  { name: "AnswerThePublic", url: "https://answerthepublic.com/", free: true },
  { name: "Ahrefs Free Tools", url: "https://ahrefs.com/free-seo-tools", free: true },
  { name: "Moz Keyword Explorer", url: "https://moz.com/explorer", free: false },
];

export function LandingPageWizard({ open, onOpenChange, onComplete, initialTemplate }: LandingPageWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<LandingPageData>({
    title: "",
    slug: "",
    template: initialTemplate || "",
    metaDescription: "",
    targetKeywords: [],
    heroHeadline: "",
    heroSubheadline: "",
    ctaText: "",
    ctaLink: "/schedule",
    hasExpiration: false,
    expiredBehavior: "show_alternatives",
  });
  const [keywordInput, setKeywordInput] = useState("");

  const selectedTemplate = TEMPLATES.find((t) => t.id === data.template);
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  const updateData = (updates: Partial<LandingPageData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !data.targetKeywords.includes(keywordInput.trim())) {
      updateData({ targetKeywords: [...data.targetKeywords, keywordInput.trim()] });
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    updateData({ targetKeywords: data.targetKeywords.filter((k) => k !== keyword) });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const calculateSeoScore = () => {
    let score = 0;
    const checks = [];

    // Title checks
    if (data.title.length >= 30 && data.title.length <= 60) {
      score += 15;
      checks.push({ pass: true, text: "Title length is optimal (30-60 chars)" });
    } else {
      checks.push({ pass: false, text: "Title should be 30-60 characters" });
    }

    // Meta description
    if (data.metaDescription.length >= 120 && data.metaDescription.length <= 160) {
      score += 20;
      checks.push({ pass: true, text: "Meta description length is optimal" });
    } else if (data.metaDescription.length > 0) {
      score += 10;
      checks.push({ pass: false, text: "Meta description should be 120-160 characters" });
    } else {
      checks.push({ pass: false, text: "Add a meta description" });
    }

    // Keywords
    if (data.targetKeywords.length >= 2 && data.targetKeywords.length <= 5) {
      score += 20;
      checks.push({ pass: true, text: "Good number of target keywords" });
    } else if (data.targetKeywords.length === 1) {
      score += 10;
      checks.push({ pass: false, text: "Add 2-5 target keywords" });
    } else {
      checks.push({ pass: false, text: "Add target keywords" });
    }

    // Hero headline
    if (data.heroHeadline.length > 0) {
      score += 15;
      checks.push({ pass: true, text: "Hero headline is set" });
    } else {
      checks.push({ pass: false, text: "Add a hero headline" });
    }

    // CTA
    if (data.ctaText.length > 0) {
      score += 15;
      checks.push({ pass: true, text: "Call-to-action is set" });
    } else {
      checks.push({ pass: false, text: "Add a call-to-action" });
    }

    // Keyword in title
    const titleLower = data.title.toLowerCase();
    const keywordInTitle = data.targetKeywords.some((k) => titleLower.includes(k.toLowerCase()));
    if (keywordInTitle) {
      score += 15;
      checks.push({ pass: true, text: "Title includes target keyword" });
    } else if (data.targetKeywords.length > 0) {
      checks.push({ pass: false, text: "Include a target keyword in the title" });
    }

    return { score, checks };
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    onComplete(data);
    onOpenChange(false);
    // Reset state
    setCurrentStep(0);
    setData({
      title: "",
      slug: "",
      template: "",
      metaDescription: "",
      targetKeywords: [],
      heroHeadline: "",
      heroSubheadline: "",
      ctaText: "",
      ctaLink: "/schedule",
      hasExpiration: false,
      expiredBehavior: "show_alternatives",
    });
  };

  const renderStep = () => {
    switch (WIZARD_STEPS[currentStep].id) {
      case "template":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose the template that best fits your goal. Each is optimized for different search intents.
            </p>
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    updateData({
                      template: template.id,
                      heroHeadline: template.heroExample,
                      ctaText: template.ctaExample,
                      targetKeywords: template.suggestedKeywords.slice(0, 2),
                    });
                  }}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
                    data.template === template.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <p className="text-sm font-medium">{template.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                  {template.suggestedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.suggestedKeywords.slice(0, 2).map((kw) => (
                        <Badge key={kw} variant="secondary" className="text-[9px]">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case "content":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => {
                  updateData({
                    title: e.target.value,
                    slug: generateSlug(e.target.value),
                  });
                }}
                placeholder={`e.g., ${selectedTemplate?.heroExample || "200-Hour Yoga Teacher Training"}`}
              />
              <p className="text-xs text-muted-foreground">
                {data.title.length}/60 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">/s/your-studio/</span>
                <Input
                  id="slug"
                  value={data.slug}
                  onChange={(e) => updateData({ slug: e.target.value })}
                  placeholder="page-url"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline">Hero Headline</Label>
              <Input
                id="headline"
                value={data.heroHeadline}
                onChange={(e) => updateData({ heroHeadline: e.target.value })}
                placeholder={selectedTemplate?.heroExample || "Your main headline"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subheadline">Hero Subheadline</Label>
              <Textarea
                id="subheadline"
                value={data.heroSubheadline}
                onChange={(e) => updateData({ heroSubheadline: e.target.value })}
                placeholder="Supporting text that expands on your headline"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cta">CTA Button Text</Label>
                <Input
                  id="cta"
                  value={data.ctaText}
                  onChange={(e) => updateData({ ctaText: e.target.value })}
                  placeholder={selectedTemplate?.ctaExample || "Get Started"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaLink">CTA Link</Label>
                <Select value={data.ctaLink} onValueChange={(v) => updateData({ ctaLink: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/schedule">Schedule Page</SelectItem>
                    <SelectItem value="/signup">Signup Form</SelectItem>
                    <SelectItem value="/pricing">Pricing Page</SelectItem>
                    <SelectItem value="/contact">Contact Form</SelectItem>
                    <SelectItem value="custom">Custom URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case "seo":
        const { score, checks } = calculateSeoScore();
        return (
          <div className="space-y-4">
            {/* SEO Score */}
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">SEO Score</span>
                  <span className={cn(
                    "text-lg font-bold",
                    score >= 70 ? "text-accent-sage" : score >= 40 ? "text-accent-gold" : "text-accent-coral"
                  )}>
                    {score}/100
                  </span>
                </div>
                <Progress value={score} className="h-2" />
                <div className="mt-3 space-y-1">
                  {checks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {check.pass ? (
                        <Check className="h-3 w-3 text-accent-sage" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-accent-coral" />
                      )}
                      <span className={check.pass ? "text-muted-foreground" : "text-foreground"}>
                        {check.text}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Meta Description */}
            <div className="space-y-2">
              <Label htmlFor="metaDesc">Meta Description</Label>
              <Textarea
                id="metaDesc"
                value={data.metaDescription}
                onChange={(e) => updateData({ metaDescription: e.target.value })}
                placeholder="Describe your page in 120-160 characters. Include your main keyword and a compelling reason to click."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {data.metaDescription.length}/160 characters
              </p>
            </div>

            {/* Target Keywords */}
            <div className="space-y-2">
              <Label>Target Keywords</Label>
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                  placeholder="Add a keyword"
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={addKeyword}>
                  Add
                </Button>
              </div>
              {data.targetKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {data.targetKeywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/20"
                      onClick={() => removeKeyword(kw)}
                    >
                      {kw} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Keyword Research Tools */}
            <div className="p-3 rounded-xl bg-secondary/30">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-accent-gold" />
                <span className="text-sm font-medium">Find Keywords</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Use these free tools to research keywords your potential students are searching for:
              </p>
              <div className="flex flex-wrap gap-2">
                {KEYWORD_TOOLS.filter((t) => t.free).map((tool) => (
                  <a
                    key={tool.name}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {tool.name}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        );

      case "expiration":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set an expiration date for time-limited promotions. This prevents 404 errors and keeps
              your SEO healthy by showing alternatives when promotions end.
            </p>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasExpiration"
                checked={data.hasExpiration}
                onChange={(e) => updateData({ hasExpiration: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="hasExpiration" className="cursor-pointer">
                This page has an expiration date
              </Label>
            </div>

            {data.hasExpiration && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="expirationDate">Expiration Date</Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={data.expirationDate || ""}
                    onChange={(e) => updateData({ expirationDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>When promotion ends, show:</Label>
                  <div className="space-y-2">
                    {[
                      {
                        value: "show_alternatives",
                        label: "Current programs/classes",
                        desc: "Best for SEO. Shows similar offerings with a friendly notice.",
                      },
                      {
                        value: "redirect_parent",
                        label: "Redirect to category page",
                        desc: "301 redirect to /schedule or a parent page.",
                      },
                      {
                        value: "show_message",
                        label: "Custom message only",
                        desc: "Keep the page with a notice that the promotion ended.",
                      },
                      {
                        value: "custom_redirect",
                        label: "Custom redirect URL",
                        desc: "Redirect to a specific page of your choice.",
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateData({ expiredBehavior: option.value as any })}
                        className={cn(
                          "w-full p-3 rounded-xl border text-left transition-all",
                          data.expiredBehavior === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <p className="text-sm font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {data.expiredBehavior === "show_message" && (
                  <div className="space-y-2">
                    <Label htmlFor="expiredMessage">Custom Expired Message</Label>
                    <Textarea
                      id="expiredMessage"
                      value={data.expiredMessage || ""}
                      onChange={(e) => updateData({ expiredMessage: e.target.value })}
                      placeholder="This promotion has ended. Check out our current offerings!"
                      rows={2}
                    />
                  </div>
                )}

                {data.expiredBehavior === "custom_redirect" && (
                  <div className="space-y-2">
                    <Label htmlFor="redirectUrl">Redirect URL</Label>
                    <Input
                      id="redirectUrl"
                      value={data.expiredRedirectUrl || ""}
                      onChange={(e) => updateData({ expiredRedirectUrl: e.target.value })}
                      placeholder="/schedule or https://..."
                    />
                  </div>
                )}

                <Card className="border-accent-gold/30 bg-accent-gold/5">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-accent-gold mt-0.5" />
                      <div>
                        <p className="text-xs font-medium">Why not just delete expired pages?</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Deleting creates 404 errors that hurt your SEO. Showing alternatives keeps
                          visitors engaged and tells Google the page still has value.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        );

      case "preview":
        const seoResult = calculateSeoScore();
        return (
          <div className="space-y-4">
            {/* Google Preview */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Google Search Preview</Label>
              <div className="p-4 rounded-xl border border-border bg-white dark:bg-card">
                <p className="text-[#1a0dab] text-lg hover:underline cursor-pointer truncate">
                  {data.title || "Page Title"} | Your Studio Name
                </p>
                <p className="text-[#006621] text-xs mt-0.5">
                  yourstudio.tandava.yoga/s/{data.slug || "page-url"}
                </p>
                <p className="text-[#545454] text-sm mt-1 line-clamp-2">
                  {data.metaDescription || "Your meta description will appear here..."}
                </p>
              </div>
            </div>

            {/* Page Preview */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Page Preview</Label>
              <div className="p-6 rounded-xl border border-border bg-gradient-to-b from-primary/5 to-background text-center">
                <h1 className="text-xl font-bold">{data.heroHeadline || "Hero Headline"}</h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  {data.heroSubheadline || "Supporting subheadline text"}
                </p>
                <Button className="mt-4">
                  {data.ctaText || "Call to Action"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Template</p>
                  <p className="text-sm font-medium capitalize">{data.template.replace(/_/g, " ")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">SEO Score</p>
                  <p className={cn(
                    "text-sm font-medium",
                    seoResult.score >= 70 ? "text-accent-sage" : seoResult.score >= 40 ? "text-accent-gold" : "text-accent-coral"
                  )}>
                    {seoResult.score}/100
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Keywords</p>
                  <p className="text-sm font-medium">{data.targetKeywords.length} keywords</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Expiration</p>
                  <p className="text-sm font-medium">
                    {data.hasExpiration ? data.expirationDate || "Set date" : "Never"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (WIZARD_STEPS[currentStep].id) {
      case "template":
        return !!data.template;
      case "content":
        return !!data.title && !!data.slug;
      case "seo":
        return data.metaDescription.length > 0;
      case "expiration":
        return !data.hasExpiration || !!data.expirationDate;
      case "preview":
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Landing Page</DialogTitle>
          <DialogDescription>
            Build an SEO-optimized page that attracts new students from search engines
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2 pb-2">
          <Progress value={progress} className="h-1" />
          <div className="flex justify-between">
            {WIZARD_STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => index < currentStep && setCurrentStep(index)}
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  index === currentStep ? "text-primary font-medium" :
                  index < currentStep ? "text-muted-foreground cursor-pointer hover:text-foreground" :
                  "text-muted-foreground/50"
                )}
              >
                <step.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-2 px-1">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep === WIZARD_STEPS.length - 1 ? (
            <Button onClick={handleComplete} disabled={!canProceed()}>
              Create Page
              <Check className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
