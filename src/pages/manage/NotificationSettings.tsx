import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  MessageSquare,
  Bell,
  Clock,
  Send,
  Link2,
  CheckCircle2,
  XCircle,
  Settings2,
  Smartphone,
  Key,
  Save,
  TestTube,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock review platform connections
const reviewPlatforms = [
  {
    id: "google",
    name: "Google Business",
    icon: "G",
    connected: true,
    lastSync: "2 hours ago",
    reviewCount: 127,
    avgRating: 4.8,
  },
  {
    id: "yelp",
    name: "Yelp",
    icon: "Y",
    connected: false,
    lastSync: null,
    reviewCount: 0,
    avgRating: 0,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "f",
    connected: true,
    lastSync: "1 day ago",
    reviewCount: 45,
    avgRating: 4.9,
  },
];

// Mock SMS templates
const defaultSmsTemplates = [
  {
    id: "booking_confirm",
    name: "Booking Confirmation",
    template: "Hi {{first_name}}, your booking for {{class_name}} on {{date}} at {{time}} is confirmed! See you at {{studio_name}}.",
  },
  {
    id: "class_reminder",
    name: "Class Reminder",
    template: "Hi {{first_name}}! Reminder: {{class_name}} starts in {{time_until}} at {{studio_name}}. Reply CANCEL to cancel.",
  },
  {
    id: "review_request",
    name: "Review Request",
    template: "Hi {{first_name}}, thank you for practicing with us! We'd love your feedback: {{review_link}}",
  },
  {
    id: "waitlist_promoted",
    name: "Waitlist Promotion",
    template: "Great news {{first_name}}! A spot opened up in {{class_name}} on {{date}}. Book now to confirm your spot!",
  },
];

export default function NotificationSettings() {
  const { toast } = useToast();

  // Review request automation settings
  const [reviewAutomationEnabled, setReviewAutomationEnabled] = useState(true);
  const [reviewDelayHours, setReviewDelayHours] = useState("2");
  const [reviewMinClasses, setReviewMinClasses] = useState("3");
  const [reviewPlatformPriority, setReviewPlatformPriority] = useState("google");
  const [reviewFrequencyDays, setReviewFrequencyDays] = useState("90");

  // SMS settings
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [smsProvider, setSmsProvider] = useState("twilio");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");
  const [smsTemplates, setSmsTemplates] = useState(defaultSmsTemplates);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);

  // Push notification settings
  const [pushEnabled, setPushEnabled] = useState(true);
  const [vapidPublicKey, setVapidPublicKey] = useState("");
  const [vapidPrivateKey, setVapidPrivateKey] = useState("");

  // Default reminder timing
  const [reminderTiming, setReminderTiming] = useState("2");
  const [secondReminder, setSecondReminder] = useState(true);
  const [secondReminderTiming, setSecondReminderTiming] = useState("24");

  const handleSave = (section: string) => {
    toast({
      title: "Settings saved",
      description: `${section} settings have been updated.`,
    });
  };

  const handleTestNotification = (type: string) => {
    toast({
      title: "Test notification sent",
      description: `A test ${type} notification has been sent to your account.`,
    });
  };

  const handleConnectPlatform = (platform: string) => {
    toast({
      title: "Connection initiated",
      description: `Connecting to ${platform}... (This is a demo)`,
    });
  };

  const handleDisconnectPlatform = (platform: string) => {
    toast({
      title: "Platform disconnected",
      description: `${platform} has been disconnected.`,
      variant: "destructive",
    });
  };

  const updateTemplate = (id: string, newTemplate: string) => {
    setSmsTemplates(templates =>
      templates.map(t => t.id === id ? { ...t, template: newTemplate } : t)
    );
  };

  return (
    <ManageLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notification Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure automated notifications, SMS messaging, and review requests
          </p>
        </div>

        <Tabs defaultValue="reviews" className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="reviews" className="text-xs">
              <Star className="h-3.5 w-3.5 mr-1.5" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="sms" className="text-xs">
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="push" className="text-xs">
              <Bell className="h-3.5 w-3.5 mr-1.5" />
              Push
            </TabsTrigger>
            <TabsTrigger value="timing" className="text-xs">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              Timing
            </TabsTrigger>
          </TabsList>

          {/* Review Request Automation Tab */}
          <TabsContent value="reviews" className="space-y-6">
            {/* Review Automation Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Review Request Automation</CardTitle>
                    <CardDescription>
                      Automatically request reviews from members after class attendance
                    </CardDescription>
                  </div>
                  <Switch
                    checked={reviewAutomationEnabled}
                    onCheckedChange={setReviewAutomationEnabled}
                  />
                </div>
              </CardHeader>
              {reviewAutomationEnabled && (
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Delay after class (hours)</Label>
                      <Select value={reviewDelayHours} onValueChange={setReviewDelayHours}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 hour</SelectItem>
                          <SelectItem value="2">2 hours</SelectItem>
                          <SelectItem value="4">4 hours</SelectItem>
                          <SelectItem value="24">24 hours</SelectItem>
                          <SelectItem value="48">48 hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Wait this long after class before sending request
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum classes attended</Label>
                      <Select value={reviewMinClasses} onValueChange={setReviewMinClasses}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 class</SelectItem>
                          <SelectItem value="3">3 classes</SelectItem>
                          <SelectItem value="5">5 classes</SelectItem>
                          <SelectItem value="10">10 classes</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Only request reviews from members who have attended at least this many classes
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Preferred platform</Label>
                      <Select value={reviewPlatformPriority} onValueChange={setReviewPlatformPriority}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="google">Google Business</SelectItem>
                          <SelectItem value="yelp">Yelp</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="rotate">Rotate platforms</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Request frequency limit</Label>
                      <Select value={reviewFrequencyDays} onValueChange={setReviewFrequencyDays}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">Once per 30 days</SelectItem>
                          <SelectItem value="60">Once per 60 days</SelectItem>
                          <SelectItem value="90">Once per 90 days</SelectItem>
                          <SelectItem value="180">Once per 6 months</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Don't ask the same member more often than this
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={() => handleTestNotification("review request")}>
                      <TestTube className="h-4 w-4 mr-2" />
                      Send Test Request
                    </Button>
                    <Button onClick={() => handleSave("Review automation")}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Platform Connections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Review Platform Connections
                </CardTitle>
                <CardDescription>
                  Connect your business profiles to enable review requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviewPlatforms.map((platform) => (
                  <div
                    key={platform.id}
                    className="flex items-center justify-between p-4 rounded-xl border"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${
                        platform.id === "google" ? "bg-blue-500" :
                        platform.id === "yelp" ? "bg-red-500" :
                        "bg-blue-600"
                      }`}>
                        {platform.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{platform.name}</h4>
                          {platform.connected ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              <XCircle className="h-3 w-3 mr-1" />
                              Not connected
                            </Badge>
                          )}
                        </div>
                        {platform.connected ? (
                          <p className="text-sm text-muted-foreground">
                            {platform.reviewCount} reviews | {platform.avgRating} avg rating | Synced {platform.lastSync}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Connect to enable review requests
                          </p>
                        )}
                      </div>
                    </div>
                    {platform.connected ? (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnectPlatform(platform.name)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => handleConnectPlatform(platform.name)}>
                        Connect
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Settings Tab */}
          <TabsContent value="sms" className="space-y-6">
            {/* SMS Provider Configuration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings2 className="h-5 w-5" />
                      SMS Provider Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure your SMS provider for sending notifications
                    </CardDescription>
                  </div>
                  <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
                </div>
              </CardHeader>
              {smsEnabled && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>SMS Provider</Label>
                    <Select value={smsProvider} onValueChange={setSmsProvider}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="messagebird">MessageBird</SelectItem>
                        <SelectItem value="vonage">Vonage (Nexmo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="p-4 rounded-xl bg-secondary/50 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Key className="h-4 w-4" />
                      {smsProvider === "twilio" ? "Twilio" : smsProvider === "messagebird" ? "MessageBird" : "Vonage"} Credentials
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sid">Account SID</Label>
                        <Input
                          id="sid"
                          type="password"
                          placeholder="ACxxxxxxxxxxxxxxxxx"
                          value={twilioSid}
                          onChange={(e) => setTwilioSid(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="token">Auth Token</Label>
                        <Input
                          id="token"
                          type="password"
                          placeholder="Your auth token"
                          value={twilioToken}
                          onChange={(e) => setTwilioToken(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">SMS Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+1 (555) 000-0000"
                        value={twilioPhone}
                        onChange={(e) => setTwilioPhone(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        The phone number that will send SMS messages
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      SMS credentials are stored securely and encrypted at rest.
                    </p>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={() => handleTestNotification("SMS")}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test SMS
                    </Button>
                    <Button onClick={() => handleSave("SMS provider")}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Configuration
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* SMS Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  SMS Templates
                </CardTitle>
                <CardDescription>
                  Customize the message templates for different notification types
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {smsTemplates.map((template) => (
                  <div key={template.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">{template.name}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTemplate(
                          editingTemplate === template.id ? null : template.id
                        )}
                      >
                        {editingTemplate === template.id ? "Done" : "Edit"}
                      </Button>
                    </div>
                    {editingTemplate === template.id ? (
                      <Textarea
                        value={template.template}
                        onChange={(e) => updateTemplate(template.id, e.target.value)}
                        rows={3}
                        className="font-mono text-sm"
                      />
                    ) : (
                      <div className="p-3 rounded-lg bg-secondary/50 text-sm font-mono">
                        {template.template}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Available variables: {`{{first_name}}, {{class_name}}, {{date}}, {{time}}, {{studio_name}}, {{review_link}}`}
                    </p>
                  </div>
                ))}

                <div className="flex justify-end pt-2">
                  <Button onClick={() => handleSave("SMS templates")}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Templates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Push Notification Settings Tab */}
          <TabsContent value="push" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Push Notification Settings
                    </CardTitle>
                    <CardDescription>
                      Configure web push notifications for browsers and mobile devices
                    </CardDescription>
                  </div>
                  <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
                </div>
              </CardHeader>
              {pushEnabled && (
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-secondary/50 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Key className="h-4 w-4" />
                      VAPID Keys (Web Push)
                    </div>
                    <p className="text-xs text-muted-foreground">
                      VAPID keys are required for web push notifications. Generate them using a tool like web-push-codelab.
                    </p>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="vapidPublic">Public Key</Label>
                        <Input
                          id="vapidPublic"
                          placeholder="BEl62iUYgUivxIkv69yViEuiBIa-..."
                          value={vapidPublicKey}
                          onChange={(e) => setVapidPublicKey(e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vapidPrivate">Private Key</Label>
                        <Input
                          id="vapidPrivate"
                          type="password"
                          placeholder="Your private VAPID key"
                          value={vapidPrivateKey}
                          onChange={(e) => setVapidPrivateKey(e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border space-y-3">
                    <h4 className="font-medium">Push notification types</h4>
                    <div className="space-y-3">
                      {[
                        { label: "Booking confirmations", desc: "Notify when a class is booked", enabled: true },
                        { label: "Class reminders", desc: "Remind members before class starts", enabled: true },
                        { label: "Waitlist updates", desc: "Notify when promoted from waitlist", enabled: true },
                        { label: "Cancellation notices", desc: "Notify when a class is cancelled", enabled: true },
                        { label: "Teacher substitutions", desc: "Notify when teacher changes", enabled: false },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                          <Switch defaultChecked={item.enabled} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={() => handleTestNotification("push")}>
                      <Bell className="h-4 w-4 mr-2" />
                      Send Test Push
                    </Button>
                    <Button onClick={() => handleSave("Push notification")}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Default Reminder Timing Tab */}
          <TabsContent value="timing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Default Reminder Timing
                </CardTitle>
                <CardDescription>
                  Set when members receive class reminders by default. Members can customize their own preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Primary reminder</Label>
                    <Select value={reminderTiming} onValueChange={setReminderTiming}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.5">30 minutes before</SelectItem>
                        <SelectItem value="1">1 hour before</SelectItem>
                        <SelectItem value="2">2 hours before</SelectItem>
                        <SelectItem value="3">3 hours before</SelectItem>
                        <SelectItem value="4">4 hours before</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      This is when the main reminder notification is sent
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Second reminder</p>
                      <p className="text-sm text-muted-foreground">
                        Send an earlier reminder notification
                      </p>
                    </div>
                    <Switch checked={secondReminder} onCheckedChange={setSecondReminder} />
                  </div>

                  {secondReminder && (
                    <div className="space-y-2">
                      <Label>Second reminder timing</Label>
                      <Select value={secondReminderTiming} onValueChange={setSecondReminderTiming}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 hours before</SelectItem>
                          <SelectItem value="12">12 hours before</SelectItem>
                          <SelectItem value="24">24 hours before</SelectItem>
                          <SelectItem value="48">48 hours before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="p-4 rounded-xl border space-y-3">
                  <h4 className="font-medium">Reminder delivery channels</h4>
                  <p className="text-xs text-muted-foreground">
                    Select which channels to use for class reminders (members can opt out individually)
                  </p>
                  <div className="space-y-3">
                    {[
                      { label: "Email", desc: "Send reminder via email", enabled: true },
                      { label: "SMS", desc: "Send reminder via text message", enabled: true },
                      { label: "Push notification", desc: "Send browser/app push notification", enabled: true },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch defaultChecked={item.enabled} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={() => handleSave("Reminder timing")}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Timing Settings
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
