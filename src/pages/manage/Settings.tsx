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
} from "lucide-react";
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
        </Tabs>
      </div>
    </ManageLayout>
  );
}
