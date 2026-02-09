import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Clock,
  Star,
  Eye,
  Edit,
  Copy,
  TrendingUp,
  Sparkles,
  GraduationCap,
  Tent,
  Layers,
  Video,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EventRow {
  id: string;
  title: string;
  type: string;
  status: string;
  coverUrl: string | null;
  startsAt: string;
  endsAt: string;
  isMultiSession: boolean;
  sessionCount: number;
  capacity: number;
  registeredCount: number;
  waitlistCount: number;
  priceCents: number;
  earlyBirdCents: number | null;
  earlyBirdEndsAt: string | null;
  memberPriceCents: number | null;
  teachers: string[];
  tags: string[];
  location: string;
  isVirtual: boolean;
  featured: boolean;
  totalRevenue: number;
}

const mockEvents: EventRow[] = [
  {
    id: "e1", title: "Arm Balance & Inversion Workshop", type: "workshop",
    status: "published", coverUrl: null,
    startsAt: "2025-02-15T10:00:00", endsAt: "2025-02-15T13:00:00",
    isMultiSession: false, sessionCount: 1, capacity: 25, registeredCount: 19, waitlistCount: 2,
    priceCents: 7500, earlyBirdCents: 6000, earlyBirdEndsAt: "2025-02-08", memberPriceCents: 6500,
    teachers: ["Maya Rodriguez"], tags: ["Inversions", "Intermediate"], location: "Main Studio",
    isVirtual: false, featured: true, totalRevenue: 133500,
  },
  {
    id: "e2", title: "200-Hour Yoga Teacher Training", type: "training",
    status: "published", coverUrl: null,
    startsAt: "2025-03-01T08:00:00", endsAt: "2025-05-31T17:00:00",
    isMultiSession: true, sessionCount: 12, capacity: 15, registeredCount: 11, waitlistCount: 0,
    priceCents: 350000, earlyBirdCents: 299900, earlyBirdEndsAt: "2025-02-15", memberPriceCents: 320000,
    teachers: ["Sarah Chen", "James Park"], tags: ["YTT", "Certification"], location: "Main Studio",
    isVirtual: false, featured: true, totalRevenue: 3649000,
  },
  {
    id: "e3", title: "Sound Bath & Meditation Evening", type: "event",
    status: "published", coverUrl: null,
    startsAt: "2025-02-22T19:00:00", endsAt: "2025-02-22T21:00:00",
    isMultiSession: false, sessionCount: 1, capacity: 40, registeredCount: 34, waitlistCount: 5,
    priceCents: 4500, earlyBirdCents: null, earlyBirdEndsAt: null, memberPriceCents: 3500,
    teachers: ["Luna Patel"], tags: ["Meditation", "Sound Healing"], location: "Meditation Room",
    isVirtual: false, featured: false, totalRevenue: 147000,
  },
  {
    id: "e4", title: "Yin Yoga Deep Dive Series", type: "series",
    status: "published", coverUrl: null,
    startsAt: "2025-02-04T18:00:00", endsAt: "2025-02-25T19:30:00",
    isMultiSession: true, sessionCount: 4, capacity: 20, registeredCount: 16, waitlistCount: 0,
    priceCents: 12000, earlyBirdCents: 9500, earlyBirdEndsAt: "2025-01-28", memberPriceCents: 10000,
    teachers: ["James Park"], tags: ["Yin", "Series"], location: "Hot Room",
    isVirtual: false, featured: false, totalRevenue: 176000,
  },
  {
    id: "e5", title: "Virtual Meditation Retreat", type: "retreat",
    status: "draft", coverUrl: null,
    startsAt: "2025-04-11T09:00:00", endsAt: "2025-04-13T16:00:00",
    isMultiSession: true, sessionCount: 6, capacity: 50, registeredCount: 0, waitlistCount: 0,
    priceCents: 25000, earlyBirdCents: 19900, earlyBirdEndsAt: "2025-03-15", memberPriceCents: 22000,
    teachers: ["Sarah Chen", "Luna Patel"], tags: ["Retreat", "Virtual", "Meditation"], location: "Online",
    isVirtual: true, featured: false, totalRevenue: 0,
  },
];

const typeIcons: Record<string, typeof Calendar> = {
  workshop: Sparkles,
  training: GraduationCap,
  event: Calendar,
  retreat: Tent,
  series: Layers,
  immersion: Star,
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-accent-sage/20 text-accent-sage",
  sold_out: "bg-accent-coral/20 text-accent-coral",
  cancelled: "bg-destructive/20 text-destructive",
  completed: "bg-primary/20 text-primary",
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function EventsManage() {
  const { toast } = useToast();
  const [events] = useState(mockEvents);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = events.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || e.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalRevenue = events.reduce((sum, e) => sum + e.totalRevenue, 0);
  const totalRegistered = events.reduce((sum, e) => sum + e.registeredCount, 0);
  const publishedCount = events.filter((e) => e.status === "published").length;

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Workshops & Events</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage workshops, trainings, retreats, series, and special events
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Published Events", value: publishedCount, icon: Calendar },
            { label: "Total Registered", value: totalRegistered, icon: Users },
            { label: "Event Revenue", value: formatPrice(totalRevenue), icon: DollarSign },
            { label: "Avg Fill Rate", value: `${Math.round((totalRegistered / events.reduce((s, e) => s + e.capacity, 0)) * 100)}%`, icon: TrendingUp },
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

        {/* Historical Trends by Event Type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent-sage" />
              Historical Trends
            </CardTitle>
            <CardDescription>Performance by event type over recent quarters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { type: "Workshops", icon: Sparkles, events: 24, avgFill: 82, revenue: 892500, trend: "+12%" },
                { type: "Trainings", icon: GraduationCap, events: 3, avgFill: 73, revenue: 10947000, trend: "+8%" },
                { type: "Events", icon: Calendar, events: 18, avgFill: 88, revenue: 441000, trend: "+22%" },
                { type: "Retreats", icon: Tent, events: 4, avgFill: 68, revenue: 2500000, trend: "-5%" },
                { type: "Series", icon: Layers, events: 12, avgFill: 76, revenue: 1152000, trend: "+15%" },
              ].map((item) => {
                const ItemIcon = item.icon;
                const isPositive = item.trend.startsWith("+");
                return (
                  <div key={item.type} className="p-3 rounded-xl bg-secondary/30 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <ItemIcon className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium">{item.type}</span>
                    </div>
                    <p className="text-lg font-bold">{item.events}</p>
                    <p className="text-[10px] text-muted-foreground">events this year</p>
                    <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Avg fill</span>
                        <span className="font-medium">{item.avgFill}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="font-medium">{formatPrice(item.revenue)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">vs last year</span>
                        <span className={`font-medium ${isPositive ? "text-accent-sage" : "text-accent-coral"}`}>
                          {item.trend}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="workshop">Workshops</SelectItem>
              <SelectItem value="training">Trainings</SelectItem>
              <SelectItem value="event">Events</SelectItem>
              <SelectItem value="retreat">Retreats</SelectItem>
              <SelectItem value="series">Series</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filtered.map((event) => {
            const TypeIcon = typeIcons[event.type] || Calendar;
            const fillPct = Math.round((event.registeredCount / event.capacity) * 100);

            return (
              <Card key={event.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Date sidebar */}
                    <div className="w-20 shrink-0 bg-primary/5 flex flex-col items-center justify-center p-3 border-r border-border">
                      <span className="text-xs text-muted-foreground uppercase">
                        {new Date(event.startsAt).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-2xl font-bold">
                        {new Date(event.startsAt).getDate()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(event.startsAt)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <TypeIcon className="h-4 w-4 text-primary" />
                            <Badge className={`text-[10px] ${statusColors[event.status]}`}>
                              {event.status}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] capitalize">{event.type}</Badge>
                            {event.featured && (
                              <Badge className="text-[10px] bg-accent-gold/20 text-accent-gold">Featured</Badge>
                            )}
                            {event.isVirtual && (
                              <Badge variant="outline" className="text-[10px]">
                                <Video className="h-2.5 w-2.5 mr-1" /> Virtual
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-sm font-semibold">{event.title}</h3>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {event.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.isMultiSession
                                ? `${event.sessionCount} sessions, ${formatDate(event.startsAt)} — ${formatDate(event.endsAt)}`
                                : `${formatDate(event.startsAt)}`
                              }
                            </span>
                            <span>{event.teachers.join(", ")}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Preview" onClick={() => toast({ title: "Preview", description: "Event preview opened in new tab." })}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => toast({ title: "Edit mode", description: "Event editor opened." })}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicate" onClick={() => toast({ title: "Duplicated", description: "Event duplicated as draft." })}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Bottom row: pricing + capacity */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-4 text-xs">
                          <span className="font-semibold">{formatPrice(event.priceCents)}</span>
                          {event.memberPriceCents && (
                            <span className="text-primary">{formatPrice(event.memberPriceCents)} members</span>
                          )}
                          {event.earlyBirdCents && event.earlyBirdEndsAt && (
                            <span className="text-accent-gold">
                              {formatPrice(event.earlyBirdCents)} early bird (until {formatDate(event.earlyBirdEndsAt)})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className={fillPct >= 90 ? "text-accent-coral font-semibold" : ""}>
                              {event.registeredCount}/{event.capacity}
                            </span>
                            <span className="text-muted-foreground">({fillPct}%)</span>
                          </div>
                          {event.waitlistCount > 0 && (
                            <span className="text-muted-foreground">+{event.waitlistCount} waitlist</span>
                          )}
                          {event.totalRevenue > 0 && (
                            <span className="text-accent-sage font-medium">{formatPrice(event.totalRevenue)} revenue</span>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      {event.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {event.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[9px] px-1.5">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Create Event Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Event</DialogTitle>
              <DialogDescription>
                Set up a workshop, training, retreat, or special event
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select defaultValue="workshop">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop (single session, 1-4 hours)</SelectItem>
                    <SelectItem value="series">Series (multi-week, same time each week)</SelectItem>
                    <SelectItem value="training">Training / Teacher Training (multi-day certification)</SelectItem>
                    <SelectItem value="retreat">Retreat (multi-day immersive)</SelectItem>
                    <SelectItem value="event">Special Event (sound bath, social, etc.)</SelectItem>
                    <SelectItem value="immersion">Immersion (weekend deep-dive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventTitle">Title</Label>
                <Input id="eventTitle" placeholder="e.g. Arm Balance Workshop with Maya" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Start Date & Time</Label>
                  <Input id="eventDate" type="datetime-local" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventEnd">End Date & Time</Label>
                  <Input id="eventEnd" type="datetime-local" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventPrice">Price ($)</Label>
                  <Input id="eventPrice" type="number" placeholder="75" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventCapacity">Capacity</Label>
                  <Input id="eventCapacity" type="number" placeholder="25" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Virtual / Hybrid</p>
                  <p className="text-xs text-muted-foreground">Include a virtual attendance option</p>
                </div>
                <Switch />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={() => { setCreateOpen(false); toast({ title: "Event created", description: "Continue editing to add details, pricing tiers, and publish." }); }}>
                Create & Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ManageLayout>
  );
}
