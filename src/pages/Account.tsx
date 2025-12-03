import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  CreditCard,
  Bell,
  Shield,
  Camera,
  Calendar,
  Package,
  ChevronRight,
  Check,
} from "lucide-react";

// Mock user data
const userData = {
  firstName: "Sarah",
  lastName: "Chen",
  email: "sarah@example.com",
  phone: "(555) 123-4567",
  pronouns: "she/her",
  dateOfBirth: "1990-05-15",
  emergencyContactName: "John Chen",
  emergencyContactPhone: "(555) 987-6543",
  notes: "Lower back sensitivity - please remind me about modifications for forward folds.",
  avatar: "",
};

const membership = {
  type: "Unlimited Monthly",
  status: "ACTIVE",
  renewsAt: "Jan 3, 2024",
  price: 149,
};

const packs = [
  { type: "Class Pack", name: "10-Class Pack", remaining: 6, expires: "Feb 15, 2024" },
];

const Account = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(userData);
  const [preferences, setPreferences] = useState({
    emailReminders: true,
    smsReminders: false,
    marketingEmails: true,
    leaderboardVisibility: "FRIENDS" as "PUBLIC" | "FRIENDS" | "HIDDEN",
  });

  const handleSaveProfile = () => {
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved.",
    });
  };

  const handleSavePreferences = () => {
    toast({
      title: "Preferences updated",
      description: "Your notification preferences have been saved.",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account</h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile, memberships, and preferences
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full sm:w-auto grid-cols-4 sm:inline-grid">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4 hidden sm:block" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="membership" className="gap-2">
              <Package className="h-4 w-4 hidden sm:block" />
              Membership
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4 hidden sm:block" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Bell className="h-4 w-4 hidden sm:block" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6 space-y-6">
            {/* Avatar section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={formData.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {formData.firstName[0]}{formData.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {formData.firstName} {formData.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">{formData.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal info */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pronouns">Pronouns</Label>
                    <Input
                      id="pronouns"
                      value={formData.pronouns}
                      onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                      placeholder="e.g., she/her, he/him, they/them"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Emergency Contact</Label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      placeholder="Contact name"
                      value={formData.emergencyContactName}
                      onChange={(e) =>
                        setFormData({ ...formData, emergencyContactName: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Contact phone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, emergencyContactPhone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes for teachers</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any injuries, conditions, or preferences you'd like teachers to know about"
                    rows={3}
                  />
                </div>

                <Button onClick={handleSaveProfile}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Membership Tab */}
          <TabsContent value="membership" className="mt-6 space-y-6">
            {/* Active membership */}
            <Card>
              <CardHeader>
                <CardTitle>Current Membership</CardTitle>
                <CardDescription>Your active membership and benefits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-accent">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                      <Check className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{membership.type}</h3>
                        <Badge variant="booked">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Renews {membership.renewsAt} • ${membership.price}/month
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">Manage</Button>
                </div>
              </CardContent>
            </Card>

            {/* Class packs */}
            <Card>
              <CardHeader>
                <CardTitle>Class Packs & Passes</CardTitle>
                <CardDescription>Your active packs and passes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {packs.map((pack, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                        <Package className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">{pack.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {pack.remaining} classes remaining • Expires {pack.expires}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{pack.remaining} left</Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  Purchase More
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium">•••• •••• •••• 4242</h4>
                      <p className="text-sm text-muted-foreground">Expires 12/25</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Default</Badge>
                </div>
                <Button variant="outline" className="w-full">
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>View your past invoices and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: "Dec 3, 2023", desc: "Unlimited Monthly", amount: 149 },
                    { date: "Nov 3, 2023", desc: "Unlimited Monthly", amount: 149 },
                    { date: "Oct 15, 2023", desc: "10-Class Pack", amount: 180 },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium">{item.desc}</p>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                      </div>
                      <p className="font-medium">${item.amount}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Receive email reminders 24h and 1h before classes
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailReminders}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, emailReminders: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Receive text message reminders before classes
                    </p>
                  </div>
                  <Switch
                    checked={preferences.smsReminders}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, smsReminders: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing emails</p>
                    <p className="text-sm text-muted-foreground">
                      News about workshops, events, and special offers
                    </p>
                  </div>
                  <Switch
                    checked={preferences.marketingEmails}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, marketingEmails: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy</CardTitle>
                <CardDescription>Control your privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Leaderboard visibility</Label>
                  <Select
                    value={preferences.leaderboardVisibility}
                    onValueChange={(value) =>
                      setPreferences({
                        ...preferences,
                        leaderboardVisibility: value as typeof preferences.leaderboardVisibility,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public - Anyone can see my stats</SelectItem>
                      <SelectItem value="FRIENDS">Friends Only - Only friends can see</SelectItem>
                      <SelectItem value="HIDDEN">Hidden - Don't show me on leaderboard</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Controls who can see your stats on the studio leaderboard
                  </p>
                </div>

                <Button onClick={handleSavePreferences}>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Account;