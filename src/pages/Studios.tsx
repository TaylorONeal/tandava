import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  GraduationCap,
  Tent,
  Layers,
  Star,
  ArrowRight,
} from "lucide-react";

// ── Oxatl Yoga event types ─────────────────────────────────────────
interface StudioEvent {
  id: string;
  title: string;
  type: "workshop" | "training" | "event" | "retreat" | "series";
  description: string;
  imageUrl: string;
  startsAt: string;
  endsAt: string;
  isMultiSession: boolean;
  sessionCount: number;
  teacher: string;
  location: string;
  priceCents: number;
  memberPriceCents: number | null;
  earlyBirdCents: number | null;
  earlyBirdEndsAt: string | null;
  capacity: number;
  spotsLeft: number;
  tags: string[];
  featured: boolean;
}

const typeConfig: Record<string, { icon: typeof Calendar; label: string; color: string }> = {
  workshop: { icon: Sparkles, label: "Workshop", color: "bg-accent-teal/15 text-accent-teal border-accent-teal/30" },
  training: { icon: GraduationCap, label: "Training", color: "bg-accent-gold/15 text-accent-gold border-accent-gold/30" },
  event: { icon: Star, label: "Special Event", color: "bg-accent-coral/15 text-accent-coral border-accent-coral/30" },
  retreat: { icon: Tent, label: "Retreat", color: "bg-accent-lilac/15 text-accent-lilac border-accent-lilac/30" },
  series: { icon: Layers, label: "Series", color: "bg-accent-sage/15 text-accent-sage border-accent-sage/30" },
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

// ── Mock events for Oxatl Yoga ─────────────────────────────────────
const mockEvents: StudioEvent[] = [
  {
    id: "ev1",
    title: "Arm Balance & Inversion Workshop",
    type: "workshop",
    description: "Build confidence in arm balances and inversions with progressive drills, partner assists, and wall work. All levels welcome — modifications for every body.",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    startsAt: "2026-02-21T10:00:00",
    endsAt: "2026-02-21T13:00:00",
    isMultiSession: false,
    sessionCount: 1,
    teacher: "Maya Rodriguez",
    location: "Main Studio",
    priceCents: 7500,
    memberPriceCents: 6500,
    earlyBirdCents: 6000,
    earlyBirdEndsAt: "2026-02-14",
    capacity: 25,
    spotsLeft: 6,
    tags: ["Inversions", "Arm Balances", "All Levels"],
    featured: true,
  },
  {
    id: "ev2",
    title: "200-Hour Yoga Teacher Training",
    type: "training",
    description: "Comprehensive Yoga Alliance certified teacher training. 12 weekends covering asana, anatomy, philosophy, sequencing, and teaching methodology.",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
    startsAt: "2026-03-07T08:00:00",
    endsAt: "2026-06-13T17:00:00",
    isMultiSession: true,
    sessionCount: 12,
    teacher: "Sarah Chen & James Park",
    location: "Main Studio",
    priceCents: 350000,
    memberPriceCents: 320000,
    earlyBirdCents: 299900,
    earlyBirdEndsAt: "2026-02-21",
    capacity: 15,
    spotsLeft: 4,
    tags: ["YTT", "Certification", "Yoga Alliance"],
    featured: true,
  },
  {
    id: "ev3",
    title: "Sound Bath & Meditation Evening",
    type: "event",
    description: "Immerse yourself in crystal singing bowls, gongs, and chimes. Guided meditation followed by 45 minutes of restorative sound healing.",
    imageUrl: "https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800&q=80",
    startsAt: "2026-02-28T19:00:00",
    endsAt: "2026-02-28T21:00:00",
    isMultiSession: false,
    sessionCount: 1,
    teacher: "Luna Patel",
    location: "Meditation Room",
    priceCents: 4500,
    memberPriceCents: 3500,
    earlyBirdCents: null,
    earlyBirdEndsAt: null,
    capacity: 40,
    spotsLeft: 6,
    tags: ["Sound Healing", "Meditation", "Relaxation"],
    featured: false,
  },
  {
    id: "ev4",
    title: "Yin Yoga Deep Dive Series",
    type: "series",
    description: "A four-week exploration of yin yoga targeting different meridian lines each week. Learn to hold, breathe, and release with intention.",
    imageUrl: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800&q=80",
    startsAt: "2026-03-03T18:00:00",
    endsAt: "2026-03-24T19:30:00",
    isMultiSession: true,
    sessionCount: 4,
    teacher: "James Park",
    location: "Hot Room",
    priceCents: 12000,
    memberPriceCents: 10000,
    earlyBirdCents: 9500,
    earlyBirdEndsAt: "2026-02-24",
    capacity: 20,
    spotsLeft: 8,
    tags: ["Yin", "Meridians", "Flexibility"],
    featured: false,
  },
  {
    id: "ev5",
    title: "Spring Equinox Retreat",
    type: "retreat",
    description: "Two-day immersive retreat in the hills north of the city. Morning practices, nature walks, workshops, farm-to-table meals, and evening ceremonies.",
    imageUrl: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80",
    startsAt: "2026-03-20T09:00:00",
    endsAt: "2026-03-21T16:00:00",
    isMultiSession: true,
    sessionCount: 6,
    teacher: "Sarah Chen & Luna Patel",
    location: "Off-site — Sonoma County",
    priceCents: 45000,
    memberPriceCents: 39900,
    earlyBirdCents: 35000,
    earlyBirdEndsAt: "2026-03-07",
    capacity: 30,
    spotsLeft: 18,
    tags: ["Retreat", "Nature", "Spring Equinox"],
    featured: true,
  },
  {
    id: "ev6",
    title: "Prenatal Yoga Workshop",
    type: "workshop",
    description: "Gentle yoga and breathing techniques for expecting mothers. Focus on comfort, strength, and relaxation through all trimesters.",
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
    startsAt: "2026-03-14T11:00:00",
    endsAt: "2026-03-14T13:00:00",
    isMultiSession: false,
    sessionCount: 1,
    teacher: "Maya Rodriguez",
    location: "Zen Room",
    priceCents: 5000,
    memberPriceCents: 4000,
    earlyBirdCents: null,
    earlyBirdEndsAt: null,
    capacity: 15,
    spotsLeft: 10,
    tags: ["Prenatal", "Gentle", "All Trimesters"],
    featured: false,
  },
];

// ── Component ──────────────────────────────────────────────────────
const Events = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    return mockEvents.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = typeFilter === "all" || e.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, typeFilter]);

  const featured = filtered.filter((e) => e.featured);
  const upcoming = filtered.filter((e) => !e.featured);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Events & Workshops</h1>
          <p className="text-muted-foreground mt-1">
            Workshops, trainings, retreats, and special events at Oxatl Yoga
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events, teachers, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="workshop">Workshops</SelectItem>
              <SelectItem value="training">Trainings</SelectItem>
              <SelectItem value="event">Special Events</SelectItem>
              <SelectItem value="retreat">Retreats</SelectItem>
              <SelectItem value="series">Series</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Type quick-filters */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(typeConfig).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const isActive = typeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setTypeFilter(isActive ? "all" : key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  isActive ? cfg.color : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Featured events */}
        {featured.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-accent-gold" />
              Featured
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((event) => (
                <EventCard key={event.id} event={event} featured />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming events */}
        <div className="space-y-4">
          {featured.length > 0 && upcoming.length > 0 && (
            <h2 className="text-lg font-semibold">Upcoming</h2>
          )}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No events found matching your search.</p>
              <Button variant="link" onClick={() => { setSearchQuery(""); setTypeFilter("all"); }}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

// ── Event Card ─────────────────────────────────────────────────────
function EventCard({ event, featured }: { event: StudioEvent; featured?: boolean }) {
  const cfg = typeConfig[event.type] ?? typeConfig.event;
  const TypeIcon = cfg.icon;
  const spotsLow = event.spotsLeft <= 5;
  const startDate = new Date(event.startsAt);

  return (
    <Link to={`/events/${event.id}`}>
      <Card className={`group overflow-hidden transition-all duration-200 hover:shadow-card-hover ${featured ? "border-accent-gold/30" : ""}`}>
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Type badge */}
          <div className="absolute top-3 left-3">
            <Badge className={`${cfg.color} border`}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {cfg.label}
            </Badge>
          </div>

          {/* Date overlay */}
          <div className="absolute bottom-3 left-3 text-white">
            <p className="text-xs opacity-80">
              {startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              {event.isMultiSession && ` — ${event.sessionCount} sessions`}
            </p>
            <p className="text-xs opacity-60 flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" />
              {startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>

          {/* Spots badge */}
          {spotsLow && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-accent-coral/90 text-white border-none text-[10px]">
                {event.spotsLeft} spots left
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
              {event.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{event.description}</p>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.location}
            </span>
            <span>{event.teacher}</span>
          </div>

          {/* Pricing + spots */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{formatPrice(event.priceCents)}</span>
              {event.memberPriceCents && (
                <span className="text-xs text-primary">{formatPrice(event.memberPriceCents)} members</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {event.spotsLeft} of {event.capacity} left
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {event.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5">{tag}</Badge>
            ))}
          </div>

          <div className="flex items-center gap-1 text-xs text-primary font-medium group-hover:gap-2 transition-all">
            Learn more <ArrowRight className="h-3 w-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default Events;
