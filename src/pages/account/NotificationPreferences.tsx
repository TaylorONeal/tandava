import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Clock,
  Moon,
  CalendarCheck,
  CalendarX,
  Users,
  Tag,
  Megaphone,
  Save,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// Mock notification preferences
const defaultPreferences = {
  // Channels
  channels: {
    email: true,
    sms: true,
    push: true,
  },
  // Notification types
  types: {
    bookingConfirmation: { email: true, sms: true, push: true },
    classReminder: { email: true, sms: true, push: true },
    waitlistUpdate: { email: true, sms: false, push: true },
    classCancellation: { email: true, sms: true, push: true },
    teacherChange: { email: true, sms: false, push: true },
    membershipExpiring: { email: true, sms: false, push: false },
    packRunningLow: { email: true, sms: false, push: true },
    newWorkshops: { email: true, sms: false, push: false },
  },
  // Timing
  reminderTiming: "2",
  // Quiet hours
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  // Marketing
  marketingOptIn: true,
  newsletterOptIn: true,
};

const notificationTypes = [
  {
    id: "bookingConfirmation",
    label: "Booking confirmations",
    description: "When you book or cancel a class",
    icon: CalendarCheck,
    category: "classes",
  },
  {
    id: "classReminder",
    label: "Class reminders",
    description: "Reminders before your scheduled classes",
    icon: Bell,
    category: "classes",
  },
  {
    id: "waitlistUpdate",
    label: "Waitlist updates",
    description: "When a spot opens up in a full class",
    icon: Users,
    category: "classes",
  },
  {
    id: "classCancellation",
    label: "Class cancellations",
    description: "When a class you're booked for is cancelled",
    icon: CalendarX,
    category: "classes",
  },
  {
    id: "teacherChange",
    label: "Teacher changes",
    description: "When a substitute teacher is assigned",
    icon: Users,
    category: "classes",
  },
  {
    id: "membershipExpiring",
    label: "Membership expiring",
    description: "Reminders before your membership expires",
    icon: Tag,
    category: "account",
  },
  {
    id: "packRunningLow",
    label: "Class pack alerts",
    description: "When your class pack is running low",
    icon: Tag,
    category: "account",
  },
  {
    id: "newWorkshops",
    label: "New workshops & events",
    description: "Announcements for special workshops and events",
    icon: Megaphone,
    category: "promotions",
  },
];

export default function NotificationPreferences() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState(defaultPreferences);

  const updateChannel = (channel: keyof typeof preferences.channels, enabled: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      channels: { ...prev.channels, [channel]: enabled },
    }));
  };

  const updateTypeChannel = (
    typeId: string,
    channel: "email" | "sms" | "push",
    enabled: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      types: {
        ...prev.types,
        [typeId]: { ...prev.types[typeId as keyof typeof prev.types], [channel]: enabled },
      },
    }));
  };

  const handleSave = () => {
    toast({
      title: "Preferences saved",
      description: "Your notification preferences have been updated.",
    });
  };

  const classNotifications = notificationTypes.filter((t) => t.category === "classes");
  const accountNotifications = notificationTypes.filter((t) => t.category === "account");
  const promotionNotifications = notificationTypes.filter((t) => t.category === "promotions");

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/account">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notification Preferences</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Choose how and when you want to be notified
            </p>
          </div>
        </div>

        {/* Channel Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notification Channels</CardTitle>
            <CardDescription>
              Enable or disable notification channels. You can fine-tune each notification type below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
              </div>
              <Switch
                checked={preferences.channels.email}
                onCheckedChange={(v) => updateChannel("email", v)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent-sage/20 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-accent-sage" />
                </div>
                <div>
                  <p className="font-medium">SMS</p>
                  <p className="text-sm text-muted-foreground">Receive text message notifications</p>
                </div>
              </div>
              <Switch
                checked={preferences.channels.sms}
                onCheckedChange={(v) => updateChannel("sms", v)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent-lilac/30 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Browser and mobile push alerts</p>
                </div>
              </div>
              <Switch
                checked={preferences.channels.push}
                onCheckedChange={(v) => updateChannel("push", v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Type Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Class Notifications</CardTitle>
            <CardDescription>
              Notifications related to your class bookings and schedule
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {classNotifications.map((type) => (
              <NotificationTypeRow
                key={type.id}
                type={type}
                settings={preferences.types[type.id as keyof typeof preferences.types]}
                channels={preferences.channels}
                onUpdate={(channel, enabled) => updateTypeChannel(type.id, channel, enabled)}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Notifications</CardTitle>
            <CardDescription>
              Updates about your membership and account status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {accountNotifications.map((type) => (
              <NotificationTypeRow
                key={type.id}
                type={type}
                settings={preferences.types[type.id as keyof typeof preferences.types]}
                channels={preferences.channels}
                onUpdate={(channel, enabled) => updateTypeChannel(type.id, channel, enabled)}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Promotions & Events</CardTitle>
            <CardDescription>
              Stay updated on new workshops, events, and special offers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {promotionNotifications.map((type) => (
              <NotificationTypeRow
                key={type.id}
                type={type}
                settings={preferences.types[type.id as keyof typeof preferences.types]}
                channels={preferences.channels}
                onUpdate={(channel, enabled) => updateTypeChannel(type.id, channel, enabled)}
              />
            ))}
          </CardContent>
        </Card>

        {/* Reminder Timing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Reminder Timing
            </CardTitle>
            <CardDescription>
              Choose when you want to receive class reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Remind me before class</Label>
              <Select
                value={preferences.reminderTiming}
                onValueChange={(v) => setPreferences((p) => ({ ...p, reminderTiming: v }))}
              >
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
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Moon className="h-5 w-5" />
                  Quiet Hours
                </CardTitle>
                <CardDescription>
                  Pause notifications during specific hours
                </CardDescription>
              </div>
              <Switch
                checked={preferences.quietHoursEnabled}
                onCheckedChange={(v) => setPreferences((p) => ({ ...p, quietHoursEnabled: v }))}
              />
            </div>
          </CardHeader>
          {preferences.quietHoursEnabled && (
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start time</Label>
                  <Select
                    value={preferences.quietHoursStart}
                    onValueChange={(v) => setPreferences((p) => ({ ...p, quietHoursStart: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, "0");
                        return (
                          <SelectItem key={hour} value={`${hour}:00`}>
                            {i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>End time</Label>
                  <Select
                    value={preferences.quietHoursEnd}
                    onValueChange={(v) => setPreferences((p) => ({ ...p, quietHoursEnd: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, "0");
                        return (
                          <SelectItem key={hour} value={`${hour}:00`}>
                            {i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Push and SMS notifications will be held during quiet hours. Urgent notifications (like class cancellations) will still be delivered.
              </p>
            </CardContent>
          )}
        </Card>

        {/* Marketing Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Marketing Preferences
            </CardTitle>
            <CardDescription>
              Control marketing and promotional communications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Newsletter</p>
                <p className="text-sm text-muted-foreground">
                  Weekly digest with studio news and wellness tips
                </p>
              </div>
              <Switch
                checked={preferences.newsletterOptIn}
                onCheckedChange={(v) => setPreferences((p) => ({ ...p, newsletterOptIn: v }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Promotional offers</p>
                <p className="text-sm text-muted-foreground">
                  Special discounts and promotional campaigns
                </p>
              </div>
              <Switch
                checked={preferences.marketingOptIn}
                onCheckedChange={(v) => setPreferences((p) => ({ ...p, marketingOptIn: v }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pb-6">
          <Button onClick={handleSave} size="lg">
            <Save className="h-4 w-4 mr-2" />
            Save Preferences
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

// Component for individual notification type rows
function NotificationTypeRow({
  type,
  settings,
  channels,
  onUpdate,
}: {
  type: (typeof notificationTypes)[0];
  settings: { email: boolean; sms: boolean; push: boolean };
  channels: { email: boolean; sms: boolean; push: boolean };
  onUpdate: (channel: "email" | "sms" | "push", enabled: boolean) => void;
}) {
  const Icon = type.icon;

  return (
    <div className="p-3 rounded-xl border">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{type.label}</p>
          <p className="text-xs text-muted-foreground">{type.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => onUpdate("email", !settings.email)}
              disabled={!channels.email}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                settings.email && channels.email
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-muted-foreground",
                !channels.email && "opacity-50 cursor-not-allowed"
              )}
            >
              <Mail className="h-3 w-3" />
              Email
            </button>
            <button
              onClick={() => onUpdate("sms", !settings.sms)}
              disabled={!channels.sms}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                settings.sms && channels.sms
                  ? "bg-accent-sage/20 text-accent-sage"
                  : "bg-secondary text-muted-foreground",
                !channels.sms && "opacity-50 cursor-not-allowed"
              )}
            >
              <MessageSquare className="h-3 w-3" />
              SMS
            </button>
            <button
              onClick={() => onUpdate("push", !settings.push)}
              disabled={!channels.push}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                settings.push && channels.push
                  ? "bg-accent-lilac/30 text-foreground"
                  : "bg-secondary text-muted-foreground",
                !channels.push && "opacity-50 cursor-not-allowed"
              )}
            >
              <Smartphone className="h-3 w-3" />
              Push
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
