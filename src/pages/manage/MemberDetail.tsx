import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Mail, Phone, Calendar, UserCheck, DollarSign, Clock, Flame,
  CreditCard, PauseCircle, XCircle, RefreshCw, Package, StickyNote, Shield,
  Plus, X, Gift, FileText, CheckCircle2, AlertCircle, Filter,
} from "lucide-react";
import { Link } from "react-router-dom";

// --- Mock Data ---
const member = {
  id: "3", firstName: "Mia", lastName: "Tanaka",
  email: "mia.tanaka@example.com", phone: "+1 415-555-0103",
  joinedAt: "2023-08-10", tags: ["VIP", "Referred by Emma"],
  membership: {
    type: "Unlimited Monthly", status: "active" as const, billing: "Monthly",
    price: 149, renewalDate: "2026-02-15", classesUsed: 14, classesAllowed: "Unlimited",
  },
  isPaused: false, totalClasses: 142, currentStreak: 12,
  lifetimeRevenue: 4280, lastVisit: "2 days ago",
};

const classPacks = [
  { id: "1", name: "10-Class Workshop Pack", remaining: 6, total: 10, expires: "2026-04-15" },
  { id: "2", name: "5-Class Intro Pack", remaining: 0, total: 5, expires: "2025-12-01" },
];

const purchaseHistory = [
  { id: "1", date: "2026-02-01", item: "Unlimited Monthly Renewal", amount: 149, type: "membership" },
  { id: "2", date: "2026-01-10", item: "10-Class Workshop Pack", amount: 220, type: "pack" },
  { id: "3", date: "2026-01-01", item: "Unlimited Monthly Renewal", amount: 149, type: "membership" },
  { id: "4", date: "2025-12-01", item: "Unlimited Monthly Renewal", amount: 149, type: "membership" },
];

const bookings = [
  { id: "1", date: "2026-02-06", time: "7:00 AM", className: "Morning Vinyasa", teacher: "Maya Patel", status: "confirmed" as const },
  { id: "2", date: "2026-02-04", time: "12:00 PM", className: "Power Yoga", teacher: "Sarah Chen", status: "confirmed" as const },
  { id: "3", date: "2026-02-02", time: "7:00 AM", className: "Morning Vinyasa", teacher: "Maya Patel", status: "checked_in" as const },
  { id: "4", date: "2026-01-31", time: "6:00 PM", className: "Evening Vinyasa", teacher: "Maya Patel", status: "checked_in" as const },
  { id: "5", date: "2026-01-29", time: "4:30 PM", className: "Yin Restore", teacher: "Ava Kim", status: "cancelled" as const },
  { id: "6", date: "2026-01-27", time: "7:00 AM", className: "Morning Vinyasa", teacher: "Maya Patel", status: "checked_in" as const },
  { id: "7", date: "2026-01-25", time: "9:30 AM", className: "Gentle Flow", teacher: "James Liu", status: "no_show" as const },
  { id: "8", date: "2026-01-22", time: "7:00 AM", className: "Morning Vinyasa", teacher: "Maya Patel", status: "late_cancel" as const },
];

const transactions = [
  { id: "1", date: "2026-02-01", description: "Unlimited Monthly - Feb 2026", amount: 149, status: "completed" as const },
  { id: "2", date: "2026-01-10", description: "10-Class Workshop Pack", amount: 220, status: "completed" as const },
  { id: "3", date: "2026-01-01", description: "Unlimited Monthly - Jan 2026", amount: 149, status: "completed" as const },
  { id: "4", date: "2025-12-01", description: "Unlimited Monthly - Dec 2025", amount: 149, status: "completed" as const },
  { id: "5", date: "2025-11-15", description: "Late Cancellation Fee", amount: 15, status: "completed" as const },
  { id: "6", date: "2025-11-01", description: "Unlimited Monthly - Nov 2025", amount: 149, status: "completed" as const },
  { id: "7", date: "2025-10-01", description: "Unlimited Monthly - Oct 2025", amount: 149, status: "refunded" as const },
];

const paymentMethods = [
  { id: "1", type: "Visa", last4: "4242", expiry: "08/27", isDefault: true },
  { id: "2", type: "Mastercard", last4: "8888", expiry: "03/26", isDefault: false },
];

const statusStyles: Record<string, string> = {
  confirmed: "bg-primary/20 text-primary", checked_in: "bg-accent-sage/20 text-accent-sage",
  cancelled: "bg-muted text-muted-foreground", no_show: "bg-destructive/10 text-destructive",
  late_cancel: "bg-accent-gold/20 text-accent-gold", completed: "bg-accent-sage/20 text-accent-sage",
  failed: "bg-destructive/10 text-destructive", refunded: "bg-accent-gold/20 text-accent-gold",
  active: "bg-accent-sage/20 text-accent-sage", paused: "bg-accent-gold/20 text-accent-gold",
};
const statusLabel = (s: string) => s.replace("_", " ");
const fmtDate = (d: string, opts?: Intl.DateTimeFormatOptions) =>
  new Date(d).toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" });

// --- Component ---
export default function MemberDetail() {
  const { toast } = useToast();
  const [pauseOpen, setPauseOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState("");
  const [pauseDuration, setPauseDuration] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelTiming, setCancelTiming] = useState("end_of_period");
  const [isPaused, setIsPaused] = useState(member.isPaused);
  const [bookingFilter, setBookingFilter] = useState("all");
  const [notes, setNotes] = useState("Mia is a dedicated practitioner who prefers morning classes. Interested in teacher training program starting Q3. Has a mild shoulder injury — avoid deep chaturangas.");
  const [memberTags, setMemberTags] = useState([...member.tags]);
  const [newTag, setNewTag] = useState("");
  const [waiverSigned, setWaiverSigned] = useState(true);

  const filteredBookings = bookingFilter === "all" ? bookings : bookings.filter((b) => b.status === bookingFilter);

  const handlePause = () => {
    if (!pauseDuration) return;
    setIsPaused(true); setPauseOpen(false); setPauseReason(""); setPauseDuration("");
    toast({ title: "Membership paused", description: `Paused for ${pauseDuration}. Will resume automatically.` });
  };
  const handleResume = () => {
    setIsPaused(false);
    toast({ title: "Membership resumed", description: "Membership is now active again." });
  };
  const handleCancel = () => {
    setCancelOpen(false); setCancelReason("");
    toast({ title: "Membership cancelled", description: cancelTiming === "immediate" ? "Cancelled immediately." : "Will cancel at end of billing period." });
  };
  const handleAddTag = () => {
    if (newTag.trim() && !memberTags.includes(newTag.trim())) {
      setMemberTags([...memberTags, newTag.trim()]); setNewTag("");
      toast({ title: "Tag added" });
    }
  };
  const handleRemoveTag = (tag: string) => {
    setMemberTags(memberTags.filter((t) => t !== tag));
    toast({ title: "Tag removed" });
  };

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Back link */}
        <Link to="/manage/students" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Students
        </Link>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarFallback className="bg-primary/10 text-foreground text-lg font-semibold">
                {member.firstName[0]}{member.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight">{member.firstName} {member.lastName}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{member.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{member.phone}</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Member since {fmtDate(member.joinedAt, { month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {memberTags.map((tag) => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => toast({ title: "Email opened", description: `Composing email to ${member.email}` })}>
              <Mail className="h-4 w-4 mr-2" />Email
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast({ title: "Checked in", description: `${member.firstName} checked in successfully.` })}>
              <UserCheck className="h-4 w-4 mr-2" />Check In
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast({ title: "Note added" })}>
              <StickyNote className="h-4 w-4 mr-2" />Add Note
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Classes</p>
                  <p className="text-2xl font-bold mt-1">{member.totalClasses}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Streak</p>
                  <p className="text-2xl font-bold mt-1">{member.currentStreak} <span className="text-sm font-normal text-muted-foreground">weeks</span></p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-accent-coral/20 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-accent-coral" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lifetime Revenue</p>
                  <p className="text-2xl font-bold mt-1">${member.lifetimeRevenue.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-accent-gold/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-accent-gold" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Visit</p>
                  <p className="text-2xl font-bold mt-1">{member.lastVisit}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-accent-sage/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-accent-sage" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="membership" className="space-y-6">
          <TabsList>
            <TabsTrigger value="membership">Membership</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* ======== MEMBERSHIP TAB ======== */}
          <TabsContent value="membership" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Current Membership</CardTitle>
                  <Badge className={`text-xs capitalize ${statusStyles[isPaused ? "paused" : member.membership.status]}`}>
                    {isPaused ? "paused" : member.membership.status}
                  </Badge>
                </div>
                {isPaused && (
                  <CardDescription className="text-accent-gold">
                    Paused since Feb 4, 2026. Scheduled to resume Mar 4, 2026.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Plan", val: member.membership.type },
                    { label: "Billing Cycle", val: member.membership.billing },
                    { label: "Price", val: `$${member.membership.price}/mo` },
                    { label: "Next Renewal", val: fmtDate(member.membership.renewalDate) },
                  ].map((f) => (
                    <div key={f.label}>
                      <p className="text-xs text-muted-foreground">{f.label}</p>
                      <p className="text-sm font-medium mt-0.5">{f.val}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-muted-foreground">Classes this cycle</p>
                    <p className="text-xs font-medium">{member.membership.classesUsed} / {member.membership.classesAllowed}</p>
                  </div>
                  <Progress value={70} className="h-2" />
                </div>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {isPaused ? (
                    <Button size="sm" onClick={handleResume}><RefreshCw className="h-4 w-4 mr-2" />Resume Membership</Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setPauseOpen(true)}><PauseCircle className="h-4 w-4 mr-2" />Pause Membership</Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setCancelOpen(true)}><XCircle className="h-4 w-4 mr-2" />Cancel Membership</Button>
                  <Button variant="outline" size="sm" onClick={() => toast({ title: "Change plan", description: "Plan selection would open here." })}>
                    <RefreshCw className="h-4 w-4 mr-2" />Change Plan
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Class Packs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><Package className="h-5 w-5 text-muted-foreground" />Class Packs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {classPacks.map((pack) => (
                  <div key={pack.id} className="p-3 rounded-xl bg-secondary/30 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{pack.name}</p>
                      <p className="text-xs text-muted-foreground">Expires {fmtDate(pack.expires)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{pack.remaining}/{pack.total} <span className="text-xs font-normal text-muted-foreground">remaining</span></p>
                      <Badge className={`text-[10px] mt-0.5 ${pack.remaining > 0 ? "bg-accent-sage/20 text-accent-sage" : "bg-muted text-muted-foreground"}`}>
                        {pack.remaining > 0 ? "active" : "used up"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Purchase History */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg">Purchase History</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="hidden md:grid grid-cols-[1fr,2fr,1fr,1fr] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span>Date</span><span>Item</span><span>Amount</span><span>Type</span>
                </div>
                {purchaseHistory.map((p) => (
                  <div key={p.id} className="grid md:grid-cols-[1fr,2fr,1fr,1fr] gap-4 px-4 py-3 border-b border-border last:border-0 items-center">
                    <p className="text-sm text-muted-foreground">{fmtDate(p.date, { month: "short", day: "numeric" })}</p>
                    <p className="text-sm font-medium">{p.item}</p>
                    <p className="text-sm font-semibold">${p.amount}</p>
                    <Badge variant="outline" className="text-[10px] w-fit capitalize">{p.type}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======== BOOKINGS TAB ======== */}
          <TabsContent value="bookings" className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={bookingFilter} onValueChange={setBookingFilter}>
                <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>
                  {["all", "confirmed", "checked_in", "cancelled", "no_show", "late_cancel"].map((v) => (
                    <SelectItem key={v} value={v}>{v === "all" ? "All Statuses" : statusLabel(v)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="hidden md:grid grid-cols-[1fr,1fr,2fr,1.5fr,1fr] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span>Date</span><span>Time</span><span>Class</span><span>Teacher</span><span>Status</span>
                </div>
                {filteredBookings.map((b) => (
                  <div key={b.id} className="grid md:grid-cols-[1fr,1fr,2fr,1.5fr,1fr] gap-4 px-4 py-3 border-b border-border last:border-0 items-center">
                    <p className="text-sm text-muted-foreground">{fmtDate(b.date, { month: "short", day: "numeric" })}</p>
                    <p className="text-sm">{b.time}</p>
                    <p className="text-sm font-medium">{b.className}</p>
                    <p className="text-sm text-muted-foreground">{b.teacher}</p>
                    <Badge className={`text-[10px] w-fit capitalize ${statusStyles[b.status]}`}>{statusLabel(b.status)}</Badge>
                  </div>
                ))}
                {filteredBookings.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No bookings match this filter.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======== NOTES TAB ======== */}
          <TabsContent value="notes" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-muted-foreground" />Studio Notes</CardTitle>
                <CardDescription>Private notes visible only to studio staff.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder="Add notes about this student..." />
                <Button size="sm" onClick={() => toast({ title: "Notes saved", description: "Student notes updated successfully." })}>Save Notes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg">Internal Tags</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {memberTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs flex items-center gap-1 pr-1">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive transition-colors"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add a tag..." className="max-w-xs" onKeyDown={(e) => e.key === "Enter" && handleAddTag()} />
                  <Button size="sm" variant="outline" onClick={handleAddTag}><Plus className="h-4 w-4 mr-1" />Add</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-muted-foreground" />Waiver Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-2">
                    {waiverSigned ? <CheckCircle2 className="h-5 w-5 text-accent-sage" /> : <AlertCircle className="h-5 w-5 text-destructive" />}
                    <div>
                      <p className="text-sm font-medium">{waiverSigned ? "Liability Waiver Signed" : "Waiver Not Signed"}</p>
                      <p className="text-xs text-muted-foreground">{waiverSigned ? "Signed on Aug 10, 2023" : "Send a reminder to complete the waiver."}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setWaiverSigned(!waiverSigned); toast({ title: waiverSigned ? "Waiver marked as unsigned" : "Waiver marked as signed" }); }}>
                    {waiverSigned ? "Revoke" : "Mark Signed"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======== BILLING TAB ======== */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg">Transaction History</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="hidden md:grid grid-cols-[1fr,2fr,1fr,1fr] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span>Date</span><span>Description</span><span>Amount</span><span>Status</span>
                </div>
                {transactions.map((tx) => (
                  <div key={tx.id} className="grid md:grid-cols-[1fr,2fr,1fr,1fr] gap-4 px-4 py-3 border-b border-border last:border-0 items-center">
                    <p className="text-sm text-muted-foreground">{fmtDate(tx.date)}</p>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-sm font-semibold">${tx.amount.toFixed(2)}</p>
                    <Badge className={`text-[10px] w-fit capitalize ${statusStyles[tx.status]}`}>{tx.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Payment Methods</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => toast({ title: "Add payment method", description: "Payment form would open here." })}>
                    <Plus className="h-4 w-4 mr-1" />Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {paymentMethods.map((pm) => (
                  <div key={pm.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{pm.type} ending in {pm.last4}</p>
                        <p className="text-xs text-muted-foreground">Expires {pm.expiry}</p>
                      </div>
                    </div>
                    {pm.isDefault && <Badge className="text-[10px] bg-primary/20 text-primary">Default</Badge>}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2"><Gift className="h-5 w-5 text-muted-foreground" />Gift Card Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">$25.00</p>
                  <p className="text-xs text-muted-foreground mt-1">From gift card #GC-4829</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5 text-muted-foreground" />Account Credit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">$0.00</p>
                  <p className="text-xs text-muted-foreground mt-1">No credits on file</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ======== PAUSE DIALOG ======== */}
      <Dialog open={pauseOpen} onOpenChange={setPauseOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Pause Membership</DialogTitle>
            <DialogDescription>
              Temporarily pause {member.firstName}'s {member.membership.type} membership. Billing will be suspended during the pause period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Pause Duration</Label>
              <Select value={pauseDuration} onValueChange={setPauseDuration}>
                <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 week">1 Week</SelectItem>
                  <SelectItem value="2 weeks">2 Weeks</SelectItem>
                  <SelectItem value="1 month">1 Month</SelectItem>
                  <SelectItem value="2 months">2 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {pauseDuration && (
              <div className="p-3 rounded-xl bg-secondary/50 text-sm">
                <p className="text-muted-foreground">Scheduled resume date:</p>
                <p className="font-medium mt-0.5">
                  {new Date(Date.now() + (pauseDuration === "1 week" ? 7 : pauseDuration === "2 weeks" ? 14 : pauseDuration === "1 month" ? 30 : 60) * 86400000)
                    .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea value={pauseReason} onChange={(e) => setPauseReason(e.target.value)} placeholder="Travel, injury, personal reasons..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseOpen(false)}>Cancel</Button>
            <Button onClick={handlePause} disabled={!pauseDuration}><PauseCircle className="h-4 w-4 mr-2" />Pause Membership</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======== CANCEL DIALOG ======== */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cancel Membership</DialogTitle>
            <DialogDescription>
              Cancel {member.firstName}'s {member.membership.type} membership. This action can be reversed by creating a new membership.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Effective Date</Label>
              <Select value={cancelTiming} onValueChange={setCancelTiming}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="end_of_period">End of current billing period (Feb 15, 2026)</SelectItem>
                  <SelectItem value="immediate">Immediately</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {cancelTiming === "immediate" && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm">
                <div className="flex items-center gap-2 text-destructive font-medium">
                  <AlertCircle className="h-4 w-4" />Early cancellation fee: $25.00
                </div>
                <p className="text-muted-foreground mt-1">Cancelling before the end of the billing period incurs an early cancellation fee.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Why is this membership being cancelled?" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep Membership</Button>
            <Button variant="destructive" onClick={handleCancel}><XCircle className="h-4 w-4 mr-2" />Confirm Cancellation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManageLayout>
  );
}
