import { useState } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  Users,
  ArrowUp,
  X,
  Bell,
  CheckCircle2,
  Timer,
  ChevronDown,
  ChevronUp,
  Settings2,
  Zap,
} from "lucide-react";

// ============================================================================
// DEMO DATA — Today's classes with waitlists
// ============================================================================

interface WaitlistEntry {
  id: string;
  memberName: string;
  memberInitials: string;
  memberType: "unlimited" | "pack" | "drop_in";
  position: number;
  addedAt: string;
  status: "waiting" | "promoted" | "declined" | "expired" | "confirmed";
  promotedAt?: string;
  expiresAt?: string;
}

interface WaitlistedClass {
  id: string;
  className: string;
  classColor: string;
  time: string;
  teacher: string;
  location: string;
  capacity: number;
  bookedCount: number;
  waitlist: WaitlistEntry[];
}

const DEMO_WAITLISTED_CLASSES: WaitlistedClass[] = [
  {
    id: "wl-1",
    className: "Power Vinyasa",
    classColor: "#e74c3c",
    time: "09:00 AM",
    teacher: "Elena Vasquez",
    location: "South Congress Studio",
    capacity: 25,
    bookedCount: 25,
    waitlist: [
      { id: "w1", memberName: "Sophia Chen", memberInitials: "SC", memberType: "unlimited", position: 1, addedAt: "Yesterday 8:15 PM", status: "waiting" },
      { id: "w2", memberName: "Marcus Rivera", memberInitials: "MR", memberType: "pack", position: 2, addedAt: "Yesterday 9:30 PM", status: "waiting" },
      { id: "w3", memberName: "Priya Patel", memberInitials: "PP", memberType: "unlimited", position: 3, addedAt: "Today 6:45 AM", status: "waiting" },
    ],
  },
  {
    id: "wl-2",
    className: "Hot 26",
    classColor: "#f39c12",
    time: "12:00 PM",
    teacher: "Jordan Kim",
    location: "East Side Studio",
    capacity: 30,
    bookedCount: 30,
    waitlist: [
      { id: "w4", memberName: "Alex Thompson", memberInitials: "AT", memberType: "unlimited", position: 1, addedAt: "Today 7:20 AM", status: "promoted", promotedAt: "Today 8:00 AM", expiresAt: "8:15 AM" },
      { id: "w5", memberName: "Riley Nakamura", memberInitials: "RN", memberType: "pack", position: 2, addedAt: "Today 7:45 AM", status: "waiting" },
    ],
  },
  {
    id: "wl-3",
    className: "Yin & Restore",
    classColor: "#9b59b6",
    time: "05:30 PM",
    teacher: "Devika Nair",
    location: "South Congress Studio",
    capacity: 20,
    bookedCount: 20,
    waitlist: [
      { id: "w6", memberName: "Emma Okafor", memberInitials: "EO", memberType: "unlimited", position: 1, addedAt: "Today 10:30 AM", status: "waiting" },
      { id: "w7", memberName: "James Lee", memberInitials: "JL", memberType: "drop_in", position: 2, addedAt: "Today 11:00 AM", status: "waiting" },
      { id: "w8", memberName: "Taylor Swift", memberInitials: "TS", memberType: "pack", position: 3, addedAt: "Today 12:15 PM", status: "waiting" },
      { id: "w9", memberName: "Noah Garcia", memberInitials: "NG", memberType: "unlimited", position: 4, addedAt: "Today 1:30 PM", status: "waiting" },
    ],
  },
  {
    id: "wl-4",
    className: "Ashtanga Primary",
    classColor: "#2ecc71",
    time: "06:30 PM",
    teacher: "Ravi Sharma",
    location: "East Side Studio",
    capacity: 20,
    bookedCount: 20,
    waitlist: [
      { id: "w10", memberName: "Liam Walsh", memberInitials: "LW", memberType: "unlimited", position: 1, addedAt: "Today 2:00 PM", status: "waiting" },
    ],
  },
];

// ============================================================================
// WAITLIST SETTINGS
// ============================================================================

interface WaitlistSettings {
  autoPromoteEnabled: boolean;
  responseDeadlineMinutes: number;
  prioritizeMembers: boolean;
  notifyBySms: boolean;
  notifyByEmail: boolean;
  notifyByPush: boolean;
}

const DEFAULT_SETTINGS: WaitlistSettings = {
  autoPromoteEnabled: true,
  responseDeadlineMinutes: 15,
  prioritizeMembers: true,
  notifyBySms: true,
  notifyByEmail: true,
  notifyByPush: true,
};

// ============================================================================
// MEMBER TYPE BADGE
// ============================================================================

function MemberTypeBadge({ type }: { type: WaitlistEntry["memberType"] }) {
  const config = {
    unlimited: { label: "Unlimited", variant: "default" as const },
    pack: { label: "Class Pack", variant: "secondary" as const },
    drop_in: { label: "Drop-in", variant: "outline" as const },
  };
  const c = config[type];
  return <Badge variant={c.variant} className="text-xs">{c.label}</Badge>;
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusBadge({ status }: { status: WaitlistEntry["status"] }) {
  const config = {
    waiting: { label: "Waiting", className: "bg-muted text-muted-foreground" },
    promoted: { label: "Promoted — Awaiting Response", className: "bg-amber-500/15 text-amber-600" },
    confirmed: { label: "Confirmed", className: "bg-green-500/15 text-green-600" },
    declined: { label: "Declined", className: "bg-red-500/15 text-red-500" },
    expired: { label: "Expired", className: "bg-muted text-muted-foreground line-through" },
  };
  const c = config[status];
  return <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${c.className}`}>{c.label}</span>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function StaffWaitlist() {
  const { toast } = useToast();
  const [classes, setClasses] = useState(DEMO_WAITLISTED_CLASSES);
  const [settings, setSettings] = useState<WaitlistSettings>(DEFAULT_SETTINGS);
  const [expandedClass, setExpandedClass] = useState<string | null>(DEMO_WAITLISTED_CLASSES[0]?.id ?? null);
  const [showSettings, setShowSettings] = useState(false);

  const totalWaiting = classes.reduce(
    (sum, cls) => sum + cls.waitlist.filter((w) => w.status === "waiting").length,
    0
  );

  const handlePromote = (classId: string, entryId: string) => {
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          waitlist: cls.waitlist.map((w) =>
            w.id === entryId
              ? {
                  ...w,
                  status: "promoted" as const,
                  promotedAt: "Just now",
                  expiresAt: `${settings.responseDeadlineMinutes} min`,
                }
              : w
          ),
        };
      })
    );
    const cls = classes.find((c) => c.id === classId);
    const entry = cls?.waitlist.find((w) => w.id === entryId);
    toast({
      title: "Member promoted",
      description: `${entry?.memberName} has been notified. They have ${settings.responseDeadlineMinutes} minutes to confirm.`,
    });
  };

  const handleConfirm = (classId: string, entryId: string) => {
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          bookedCount: cls.bookedCount, // stays at capacity (spot was freed by cancellation)
          waitlist: cls.waitlist.map((w) =>
            w.id === entryId ? { ...w, status: "confirmed" as const } : w
          ),
        };
      })
    );
    const cls = classes.find((c) => c.id === classId);
    const entry = cls?.waitlist.find((w) => w.id === entryId);
    toast({
      title: "Booking confirmed",
      description: `${entry?.memberName} is now booked into ${cls?.className}.`,
    });
  };

  const handleRemove = (classId: string, entryId: string) => {
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        const removed = cls.waitlist.find((w) => w.id === entryId);
        return {
          ...cls,
          waitlist: cls.waitlist
            .filter((w) => w.id !== entryId)
            .map((w, i) => ({ ...w, position: i + 1 })),
        };
      })
    );
    toast({ title: "Removed from waitlist", description: "Member has been removed and notified." });
  };

  const handleAutoPromoteAll = () => {
    setClasses((prev) =>
      prev.map((cls) => {
        const firstWaiting = cls.waitlist.find((w) => w.status === "waiting");
        if (!firstWaiting) return cls;
        return {
          ...cls,
          waitlist: cls.waitlist.map((w) =>
            w.id === firstWaiting.id
              ? {
                  ...w,
                  status: "promoted" as const,
                  promotedAt: "Just now",
                  expiresAt: `${settings.responseDeadlineMinutes} min`,
                }
              : w
          ),
        };
      })
    );
    toast({
      title: "Auto-promotion triggered",
      description: "Next person on each waitlist has been notified.",
    });
  };

  return (
    <StaffLayout>
      <SEOHead title="Waitlist" noindex />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Waitlist Management</h1>
            <p className="text-muted-foreground">
              {totalWaiting} member{totalWaiting !== 1 ? "s" : ""} waiting across {classes.length} class{classes.length !== 1 ? "es" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings2 className="h-4 w-4 mr-1.5" />
              Settings
            </Button>
            <Button size="sm" onClick={handleAutoPromoteAll}>
              <Zap className="h-4 w-4 mr-1.5" />
              Auto-Promote Next
            </Button>
          </div>
        </div>

        {/* Automation Settings Panel */}
        {showSettings && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Waitlist Automation Settings
              </CardTitle>
              <CardDescription>Configure how waitlist promotions are handled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-promote" className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Auto-promote when spots open
                    </Label>
                    <Switch
                      id="auto-promote"
                      checked={settings.autoPromoteEnabled}
                      onCheckedChange={(v) => setSettings({ ...settings, autoPromoteEnabled: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prioritize" className="flex items-center gap-2">
                      <ArrowUp className="h-4 w-4 text-primary" />
                      Prioritize members over drop-ins
                    </Label>
                    <Switch
                      id="prioritize"
                      checked={settings.prioritizeMembers}
                      onCheckedChange={(v) => setSettings({ ...settings, prioritizeMembers: v })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Response deadline</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {[5, 10, 15, 30, 60].map((min) => (
                        <button
                          key={min}
                          onClick={() => setSettings({ ...settings, responseDeadlineMinutes: min })}
                          className={`text-xs px-3 py-1 rounded-full transition-colors ${
                            settings.responseDeadlineMinutes === min
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          }`}
                        >
                          {min}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-xs text-muted-foreground">Notification channels</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sms" className="text-sm">SMS</Label>
                      <Switch
                        id="sms"
                        checked={settings.notifyBySms}
                        onCheckedChange={(v) => setSettings({ ...settings, notifyBySms: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email" className="text-sm">Email</Label>
                      <Switch
                        id="email"
                        checked={settings.notifyByEmail}
                        onCheckedChange={(v) => setSettings({ ...settings, notifyByEmail: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push" className="text-sm">Push notification</Label>
                      <Switch
                        id="push"
                        checked={settings.notifyByPush}
                        onCheckedChange={(v) => setSettings({ ...settings, notifyByPush: v })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Waitlisted Classes */}
        <div className="space-y-3">
          {classes.map((cls) => {
            const isExpanded = expandedClass === cls.id;
            const waitingCount = cls.waitlist.filter((w) => w.status === "waiting").length;
            const promotedCount = cls.waitlist.filter((w) => w.status === "promoted").length;

            return (
              <Card key={cls.id}>
                {/* Class header — always visible */}
                <button
                  onClick={() => setExpandedClass(isExpanded ? null : cls.id)}
                  className="w-full text-left"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cls.classColor }}
                        />
                        <div>
                          <CardTitle className="text-base">{cls.className}</CardTitle>
                          <CardDescription className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 h-3" />
                              {cls.time}
                            </span>
                            <span>{cls.teacher}</span>
                            <span>{cls.location}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium text-red-500">{cls.bookedCount}/{cls.capacity}</span>
                            <span className="text-muted-foreground">Full</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {waitingCount} waiting{promotedCount > 0 ? ` · ${promotedCount} promoted` : ""}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {/* Expanded waitlist */}
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="border-t pt-4 space-y-2">
                      {cls.waitlist.map((entry) => (
                        <div
                          key={entry.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            entry.status === "promoted"
                              ? "bg-amber-500/5 border-amber-500/20"
                              : entry.status === "confirmed"
                              ? "bg-green-500/5 border-green-500/20"
                              : "bg-card"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Position */}
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                              {entry.position}
                            </div>
                            {/* Member info */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                {entry.memberInitials}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{entry.memberName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <MemberTypeBadge type={entry.memberType} />
                                  <span className="text-xs text-muted-foreground">Added {entry.addedAt}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <StatusBadge status={entry.status} />

                            {entry.status === "promoted" && entry.expiresAt && (
                              <span className="flex items-center gap-1 text-xs text-amber-600">
                                <Timer className="h-3 w-3" />
                                {entry.expiresAt}
                              </span>
                            )}

                            {entry.status === "waiting" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={(e) => { e.stopPropagation(); handlePromote(cls.id, entry.id); }}
                                >
                                  <Bell className="h-3.5 w-3.5 mr-1" />
                                  Promote
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => { e.stopPropagation(); handleRemove(cls.id, entry.id); }}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}

                            {entry.status === "promoted" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={(e) => { e.stopPropagation(); handleConfirm(cls.id, entry.id); }}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => { e.stopPropagation(); handleRemove(cls.id, entry.id); }}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}

                            {entry.status === "confirmed" && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      ))}

                      {cls.waitlist.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Waitlist is empty.
                        </p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold">{classes.length}</p>
              <p className="text-xs text-muted-foreground">Classes at capacity</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold">{totalWaiting}</p>
              <p className="text-xs text-muted-foreground">Members waiting</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold">
                {classes.reduce((s, c) => s + c.waitlist.filter((w) => w.status === "promoted").length, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Pending response</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold">
                {classes.reduce((s, c) => s + c.waitlist.filter((w) => w.status === "confirmed").length, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Confirmed today</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </StaffLayout>
  );
}
