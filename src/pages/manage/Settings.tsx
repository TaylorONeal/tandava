import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Globe,
  Palette,
  CreditCard,
  Bell,
  Shield,
  MapPin,
  Save,
  Search,
  CheckCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function SettingsManage() {
  const { toast } = useToast();
  const [studioName, setStudioName] = useState("Tandava Yoga");
  const [studioSlug, setStudioSlug] = useState("tandava-yoga");
  const [studioEmail, setStudioEmail] = useState("hello@tandava.yoga");
  const [studioPhone, setStudioPhone] = useState("+1 (415) 555-0100");
  const [studioWebsite, setStudioWebsite] = useState("https://tandava.yoga");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [currency, setCurrency] = useState("USD");

  const [cancelMinutes, setCancelMinutes] = useState("120");
  const [lateCancelFee, setLateCancelFee] = useState("15");
  const [noShowFee, setNoShowFee] = useState("20");
  const [waitlistEnabled, setWaitlistEnabled] = useState(true);
  const [maxWaitlist, setMaxWaitlist] = useState("10");

  const [primaryColor, setPrimaryColor] = useState("#4fd1c5");
  const [secondaryColor, setSecondaryColor] = useState("#f687b3");
  const [discoverable, setDiscoverable] = useState(false);

  // SEO Settings
  const [metaDescription, setMetaDescription] = useState("Hot yoga, vinyasa, and meditation classes in San Francisco's SOMA neighborhood. New students get their first week free.");
  const [googleVerification, setGoogleVerification] = useState("");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [facebookPixelId, setFacebookPixelId] = useState("");
  const [googleBusinessProfileId, setGoogleBusinessProfileId] = useState("");
  const [sitemapAutoGenerate, setSitemapAutoGenerate] = useState(true);

  const seoScore = 78; // Would be calculated based on completeness
  const seoChecks = [
    { name: "Meta description set", pass: metaDescription.length >= 120 },
    { name: "Google verification added", pass: googleVerification.length > 0 },
    { name: "Sitemap configured", pass: sitemapAutoGenerate },
    { name: "Google Business linked", pass: googleBusinessProfileId.length > 0 },
    { name: "Analytics configured", pass: googleAnalyticsId.length > 0 },
  ];

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your studio settings have been updated.",
    });
  };

  return (
    <ManageLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Studio Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your studio preferences and policies</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="general" className="text-xs">
              <Building2 className="h-3.5 w-3.5 mr-1.5" />
              General
            </TabsTrigger>
            <TabsTrigger value="locations" className="text-xs">
              <MapPin className="h-3.5 w-3.5 mr-1.5" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="policies" className="text-xs">
              <Shield className="h-3.5 w-3.5 mr-1.5" />
              Policies
            </TabsTrigger>
            <TabsTrigger value="branding" className="text-xs">
              <Palette className="h-3.5 w-3.5 mr-1.5" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="billing" className="text-xs">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs">
              <Bell className="h-3.5 w-3.5 mr-1.5" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="seo" className="text-xs">
              <Search className="h-3.5 w-3.5 mr-1.5" />
              SEO
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Studio Information</CardTitle>
                <CardDescription>Basic details about your studio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studioName">Studio Name</Label>
                    <Input id="studioName" value={studioName} onChange={(e) => setStudioName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studioSlug">URL Slug</Label>
                    <Input id="studioSlug" value={studioSlug} onChange={(e) => setStudioSlug(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Contact Email</Label>
                    <Input id="email" type="email" value={studioEmail} onChange={(e) => setStudioEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={studioPhone} onChange={(e) => setStudioPhone(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" value={studioWebsite} onChange={(e) => setStudioWebsite(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations */}
          <TabsContent value="locations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Locations</CardTitle>
                    <CardDescription>Manage your studio locations</CardDescription>
                  </div>
                  <Button size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-xl border border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">SOMA Location</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">123 Folsom St, San Francisco, CA 94105</p>
                      <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                        <span>3 rooms</span>
                        <span>Main Studio, Hot Room, Meditation Room</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies */}
          <TabsContent value="policies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cancellation & No-Show Policies</CardTitle>
                <CardDescription>Set the rules for class cancellations and no-shows</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cancellation Window (minutes before class)</Label>
                  <Input
                    type="number"
                    value={cancelMinutes}
                    onChange={(e) => setCancelMinutes(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Students must cancel at least {cancelMinutes} minutes before class to avoid a fee
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Late Cancel Fee ($)</Label>
                    <Input
                      type="number"
                      value={lateCancelFee}
                      onChange={(e) => setLateCancelFee(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>No-Show Fee ($)</Label>
                    <Input
                      type="number"
                      value={noShowFee}
                      onChange={(e) => setNoShowFee(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Waitlist</p>
                    <p className="text-xs text-muted-foreground">Allow students to join a waitlist when classes are full</p>
                  </div>
                  <Switch checked={waitlistEnabled} onCheckedChange={setWaitlistEnabled} />
                </div>

                {waitlistEnabled && (
                  <div className="space-y-2">
                    <Label>Max Waitlist Size</Label>
                    <Input
                      type="number"
                      value={maxWaitlist}
                      onChange={(e) => setMaxWaitlist(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Policies
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding */}
          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand Customization</CardTitle>
                <CardDescription>Customize how your studio appears to students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                    <p className="text-sm text-muted-foreground">Drag and drop your logo, or click to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, SVG, or JPG (512x512px recommended)</p>
                    <Button variant="outline" size="sm" className="mt-3">Upload Logo</Button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Branding
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Discovery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Discovery Directory
                </CardTitle>
                <CardDescription>
                  Make your studio discoverable on the Tandava directory so new students can find you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">List on Discovery Directory</p>
                    <p className="text-xs text-muted-foreground">Your schedule and offerings will appear in public search results</p>
                  </div>
                  <Switch checked={discoverable} onCheckedChange={setDiscoverable} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing / Stripe */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Processing</CardTitle>
                <CardDescription>Connect your Stripe account to accept payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl border-2 border-dashed border-border text-center">
                  <CreditCard className="h-8 w-8 text-muted-foreground mx-auto" />
                  <h3 className="text-sm font-semibold mt-3">Connect Stripe</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Connect your Stripe account to process memberships, class packs, and drop-in payments.
                    Powered by Stripe Connect for secure, PCI-compliant payment processing.
                  </p>
                  <Button className="mt-4">
                    Connect with Stripe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure when and how students and staff are notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Booking confirmation", desc: "Send confirmation when a student books a class", enabled: true },
                  { label: "Class reminder", desc: "Remind students 2 hours before class", enabled: true },
                  { label: "Cancellation notice", desc: "Notify students when a class is cancelled", enabled: true },
                  { label: "Sub notification", desc: "Notify students when a teacher is subbed", enabled: true },
                  { label: "Waitlist promotion", desc: "Notify students when promoted from waitlist", enabled: true },
                  { label: "Membership expiring", desc: "Warn students 7 days before membership expires", enabled: false },
                  { label: "Pack running low", desc: "Notify students when they have 2 or fewer classes left", enabled: false },
                ].map((pref, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{pref.label}</p>
                      <p className="text-xs text-muted-foreground">{pref.desc}</p>
                    </div>
                    <Switch defaultChecked={pref.enabled} />
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Settings */}
          <TabsContent value="seo" className="space-y-6">
            {/* SEO Score Card */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    SEO Health Score
                  </CardTitle>
                  <Badge className={seoScore >= 70 ? "bg-accent-sage/20 text-accent-sage" : seoScore >= 40 ? "bg-accent-gold/20 text-accent-gold" : "bg-accent-coral/20 text-accent-coral"}>
                    {seoScore}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={seoScore} className="h-2 mb-4" />
                <div className="grid grid-cols-2 gap-2">
                  {seoChecks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {check.pass ? (
                        <CheckCircle className="h-3 w-3 text-accent-sage" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-accent-coral" />
                      )}
                      <span className={check.pass ? "text-muted-foreground" : "text-foreground"}>
                        {check.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Meta Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Search Engine Optimization</CardTitle>
                <CardDescription>Help search engines and AI assistants understand your studio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaDesc">Meta Description</Label>
                  <Textarea
                    id="metaDesc"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Describe your studio in 150-160 characters..."
                    rows={3}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Appears in Google search results</span>
                    <span className={metaDescription.length > 160 ? "text-accent-coral" : ""}>
                      {metaDescription.length}/160
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Google Search Console */}
                <div className="space-y-2">
                  <Label htmlFor="googleVerify">Google Search Console Verification</Label>
                  <Input
                    id="googleVerify"
                    value={googleVerification}
                    onChange={(e) => setGoogleVerification(e.target.value)}
                    placeholder="Paste verification meta tag content..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Get this from{" "}
                    <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                      Google Search Console <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </p>
                </div>

                <Separator />

                {/* Sitemap */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Auto-generate Sitemap</p>
                      <p className="text-xs text-muted-foreground">Automatically update sitemap when content changes</p>
                    </div>
                    <Switch checked={sitemapAutoGenerate} onCheckedChange={setSitemapAutoGenerate} />
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/30">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <code className="text-xs flex-1">https://{studioSlug}.tandava.yoga/sitemap.xml</code>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                      navigator.clipboard.writeText(`https://${studioSlug}.tandava.yoga/sitemap.xml`);
                      toast({ title: "Copied to clipboard" });
                    }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save SEO Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analytics & Tracking */}
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Tracking</CardTitle>
                <CardDescription>Connect tracking tools to measure your marketing performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ga4">Google Analytics 4 ID</Label>
                  <Input
                    id="ga4"
                    value={googleAnalyticsId}
                    onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fbPixel">Facebook Pixel ID</Label>
                  <Input
                    id="fbPixel"
                    value={facebookPixelId}
                    onChange={(e) => setFacebookPixelId(e.target.value)}
                    placeholder="1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gbp">Google Business Profile ID</Label>
                  <Input
                    id="gbp"
                    value={googleBusinessProfileId}
                    onChange={(e) => setGoogleBusinessProfileId(e.target.value)}
                    placeholder="accounts/123/locations/456"
                  />
                  <p className="text-xs text-muted-foreground">
                    Links your studio to Google Maps and local search
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Tracking
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* LLM GEO Info */}
            <Card className="border-accent-gold/30 bg-accent-gold/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-accent-gold mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">AI Assistant Discovery</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tandava automatically optimizes your site for AI assistants like ChatGPT and Claude.
                      Your class schedules, pricing, and studio information are structured so AI can
                      answer questions about your studio accurately.
                    </p>
                    <a href="/docs/guides/llm-geo" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-2">
                      Learn more about LLM GEO <ExternalLink className="h-2.5 w-2.5" />
                    </a>
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
