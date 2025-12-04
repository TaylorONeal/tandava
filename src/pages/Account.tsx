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
import { Checkbox } from "@/components/ui/checkbox";
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
  Camera,
  Package,
  ChevronRight,
  Check,
  Instagram,
  GraduationCap,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  instagramHandle: "",
  // Training data
  workshopsAttended: "",
  trainingsCompleted: "",
  additionalTrainingsNote: "",
  hasYttTraining: false,
  ytt200Completed: false,
  ytt300Completed: false,
  ytt500Completed: false,
  yttSchoolName: "",
  yttTrainingLocation: "",
  yttTrainingYear: "",
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
    emailClassReminders: true,
    smsClassReminders: false,
    newsletterEmail: true,
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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

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

                {/* Instagram */}
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                    <Input
                      id="instagram"
                      value={formData.instagramHandle}
                      onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                      placeholder="yourusername"
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Connect with your yoga community on Instagram
                  </p>
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

            {/* Practice & Trainings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-lilac flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <CardTitle>Practice & Trainings</CardTitle>
                    <CardDescription>
                      Share your yoga journey and certifications
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Workshops & Trainings Summary */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workshopsAttended">Workshops attended</Label>
                    <Input
                      id="workshopsAttended"
                      type="number"
                      min="0"
                      value={formData.workshopsAttended}
                      onChange={(e) => setFormData({ ...formData, workshopsAttended: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trainingsCompleted">Trainings completed</Label>
                    <Input
                      id="trainingsCompleted"
                      type="number"
                      min="0"
                      value={formData.trainingsCompleted}
                      onChange={(e) => setFormData({ ...formData, trainingsCompleted: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalTrainings">Other trainings or certifications</Label>
                  <Textarea
                    id="additionalTrainings"
                    value={formData.additionalTrainingsNote}
                    onChange={(e) => setFormData({ ...formData, additionalTrainingsNote: e.target.value })}
                    placeholder="e.g., Aerial YTT, Restorative, Trauma-informed modules, Prenatal certification..."
                    rows={2}
                  />
                </div>

                <Separator />

                {/* YTT Section */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="hasYtt"
                      checked={formData.hasYttTraining}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, hasYttTraining: checked as boolean })
                      }
                    />
                    <div className="space-y-1">
                      <Label htmlFor="hasYtt" className="cursor-pointer font-medium">
                        I have completed a Yoga Teacher Training (YTT)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Share your Yoga Alliance certification levels and training details
                      </p>
                    </div>
                  </div>

                  {/* Collapsible YTT Panel */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      formData.hasYttTraining ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="mt-4 p-5 rounded-2xl border-2 border-lilac/50 bg-lilac/10 space-y-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-foreground" />
                        <span className="font-semibold">Yoga Alliance Levels</span>
                      </div>

                      {/* YTT Level Checkboxes */}
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="ytt200"
                            checked={formData.ytt200Completed}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, ytt200Completed: checked as boolean })
                            }
                          />
                          <Label htmlFor="ytt200" className="cursor-pointer">
                            <Badge variant="mint" className="text-sm">200-hour YTT</Badge>
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="ytt300"
                            checked={formData.ytt300Completed}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, ytt300Completed: checked as boolean })
                            }
                          />
                          <Label htmlFor="ytt300" className="cursor-pointer">
                            <Badge variant="peach" className="text-sm">300-hour YTT</Badge>
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="ytt500"
                            checked={formData.ytt500Completed}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, ytt500Completed: checked as boolean })
                            }
                          />
                          <Label htmlFor="ytt500" className="cursor-pointer">
                            <Badge variant="lilac" className="text-sm">500-hour YTT</Badge>
                          </Label>
                        </div>
                      </div>

                      {/* YTT Details */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="yttSchool">Primary YTT School / Program</Label>
                          <Input
                            id="yttSchool"
                            value={formData.yttSchoolName}
                            onChange={(e) => setFormData({ ...formData, yttSchoolName: e.target.value })}
                            placeholder="e.g., Haute Yoga Queen Anne, The Practice Bali"
                          />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="yttLocation">Training Location</Label>
                            <Input
                              id="yttLocation"
                              value={formData.yttTrainingLocation}
                              onChange={(e) => setFormData({ ...formData, yttTrainingLocation: e.target.value })}
                              placeholder="City, Country (e.g., Seattle, WA, USA)"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="yttYear">Year Completed</Label>
                            <Select
                              value={formData.yttTrainingYear}
                              onValueChange={(value) => setFormData({ ...formData, yttTrainingYear: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent>
                                {years.map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveProfile}>Save Trainings</Button>
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
                <div className="flex items-center justify-between p-4 rounded-2xl bg-mint/30">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{membership.type}</h3>
                        <Badge variant="mint">Active</Badge>
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
                    className="flex items-center justify-between p-4 rounded-2xl border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-lilac/30 flex items-center justify-center">
                        <Package className="h-5 w-5 text-foreground" />
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
                <div className="flex items-center justify-between p-4 rounded-2xl border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
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
            {/* Class Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Class Notifications</CardTitle>
                <CardDescription>Reminders for your booked classes</CardDescription>
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
                    checked={preferences.emailClassReminders}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, emailClassReminders: checked })
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
                    checked={preferences.smsClassReminders}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, smsClassReminders: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Newsletter & Marketing */}
            <Card>
              <CardHeader>
                <CardTitle>Newsletter & Updates</CardTitle>
                <CardDescription>Stay in the loop with studios and events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Newsletter</p>
                    <p className="text-sm text-muted-foreground">
                      Weekly digest with new studios, featured classes, and wellness tips
                    </p>
                  </div>
                  <Switch
                    checked={preferences.newsletterEmail}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, newsletterEmail: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing emails</p>
                    <p className="text-sm text-muted-foreground">
                      Special offers, new workshops, and studio promotions
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

            {/* Privacy */}
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
