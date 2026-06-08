import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  EventRegistrationPanel,
  type EventPricingTierLite,
  type EventSessionLite,
} from "@/components/events/EventRegistrationPanel";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  Share2,
  Heart,
  Sparkles,
  GraduationCap,
  Tent,
  Layers,
  Star,
  CheckCircle2,
  User,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────
interface EventDetail {
  id: string;
  title: string;
  type: "workshop" | "training" | "event" | "retreat" | "series";
  description: string;
  longDescription: string;
  imageUrl: string;
  startsAt: string;
  endsAt: string;
  isMultiSession: boolean;
  sessionCount: number;
  sessions?: { date: string; time: string; topic: string }[];
  teacher: { name: string; bio: string; avatar: string };
  location: string;
  locationDetail: string;
  priceCents: number;
  memberPriceCents: number | null;
  earlyBirdCents: number | null;
  earlyBirdEndsAt: string | null;
  capacity: number;
  spotsLeft: number;
  tags: string[];
  whatToBring: string[];
  requirements: string[];
  status?: string;
  waitlistEnabled?: boolean;
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
  pricingTiers?: EventPricingTierLite[];
  depositCents?: number | null;
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

// ── Mock event detail data ─────────────────────────────────────────
const eventsData: Record<string, EventDetail> = {
  ev1: {
    id: "ev1",
    title: "Arm Balance & Inversion Workshop",
    type: "workshop",
    description: "Build confidence in arm balances and inversions with progressive drills, partner assists, and wall work.",
    longDescription: "This three-hour workshop is designed for practitioners who want to deepen their inversion and arm balance practice. Whether you're working on your first crow pose or refining your handstand, Maya will guide you through progressive drills that build strength, proprioception, and confidence.\n\nThe workshop includes partner-assisted practice (you'll be paired thoughtfully), wall work for alignment, and detailed breakdowns of crow, side crow, forearm stand, and headstand variations. You'll leave with a personalized take-home practice plan.",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80",
    startsAt: "2026-02-21T10:00:00",
    endsAt: "2026-02-21T13:00:00",
    isMultiSession: false,
    sessionCount: 1,
    teacher: {
      name: "Maya Rodriguez",
      bio: "E-RYT 500 with 15+ years teaching experience. Known for making arm balances and inversions accessible to all bodies.",
      avatar: "",
    },
    location: "Main Studio",
    locationDetail: "142 Valencia St, 2nd Floor, San Francisco, CA 94103",
    priceCents: 7500,
    memberPriceCents: 6500,
    earlyBirdCents: 6000,
    earlyBirdEndsAt: "2026-02-14",
    capacity: 25,
    spotsLeft: 6,
    tags: ["Inversions", "Arm Balances", "All Levels"],
    whatToBring: ["Your own mat", "Water bottle", "Small towel", "Comfortable clothing that stays in place when inverted"],
    requirements: ["6+ months of regular yoga practice recommended", "No prior inversion experience needed"],
  },
  ev2: {
    id: "ev2",
    title: "200-Hour Yoga Teacher Training",
    type: "training",
    description: "Comprehensive Yoga Alliance certified teacher training.",
    longDescription: "Our 200-hour teacher training is a deep immersion into the art and science of teaching yoga. Over 12 weekends, you'll develop a strong foundation in asana, anatomy, philosophy, sequencing, and teaching methodology.\n\nLed by Sarah Chen (E-RYT 500, YACEP) and James Park (E-RYT 200, C-IAYT), this program is registered with Yoga Alliance and qualifies graduates to register as RYT-200. Small cohort size ensures personalized mentoring.",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80",
    startsAt: "2026-03-07T08:00:00",
    endsAt: "2026-06-13T17:00:00",
    isMultiSession: true,
    sessionCount: 12,
    sessions: [
      { date: "Mar 7-8", time: "8am-5pm", topic: "Foundations & Asana I" },
      { date: "Mar 21-22", time: "8am-5pm", topic: "Anatomy & Physiology" },
      { date: "Apr 4-5", time: "8am-5pm", topic: "Asana II & Alignment" },
      { date: "Apr 18-19", time: "8am-5pm", topic: "Yoga Philosophy" },
      { date: "May 2-3", time: "8am-5pm", topic: "Sequencing & Cueing" },
      { date: "May 16-17", time: "8am-5pm", topic: "Teaching Practicum" },
    ],
    teacher: {
      name: "Sarah Chen & James Park",
      bio: "Sarah is an E-RYT 500 and YACEP with 20+ years of practice. James is an E-RYT 200, C-IAYT specializing in yoga therapy and anatomy.",
      avatar: "",
    },
    location: "Main Studio",
    locationDetail: "142 Valencia St, 2nd Floor, San Francisco, CA 94103",
    priceCents: 350000,
    memberPriceCents: 320000,
    earlyBirdCents: 299900,
    earlyBirdEndsAt: "2026-02-21",
    capacity: 15,
    spotsLeft: 4,
    tags: ["YTT", "Certification", "Yoga Alliance"],
    whatToBring: ["Yoga mat", "Notebook and pen", "Anatomy coloring book (provided)", "Open mind"],
    requirements: ["1+ year of regular yoga practice", "Brief application and interview required", "Payment plan available"],
    waitlistEnabled: true,
    depositCents: 50000,
    pricingTiers: [
      {
        id: "full",
        name: "Full Immersion (certification)",
        description: "All 12 weekends · RYT-200 eligible",
        priceCents: 350000,
        memberPriceCents: 320000,
        includesSessions: [],
      },
      {
        id: "audit",
        name: "Foundations Audit",
        description: "First 3 weekends · no certification",
        priceCents: 95000,
        memberPriceCents: 85000,
        includesSessions: [1, 2, 3],
      },
    ],
  },
  ev3: {
    id: "ev3",
    title: "Sound Bath & Meditation Evening",
    type: "event",
    description: "Immerse yourself in crystal singing bowls, gongs, and chimes.",
    longDescription: "Settle into a supported restorative position and let the sound wash over you. Luna Patel leads this deeply relaxing evening with crystal singing bowls tuned to the chakras, Tibetan gongs, chimes, and rain sticks.\n\nThe evening begins with 15 minutes of guided meditation to help you arrive and settle, followed by 45 minutes of pure sound immersion. Bolsters, blankets, and eye pillows provided. Many participants report deep relaxation and improved sleep.",
    imageUrl: "https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=1200&q=80",
    startsAt: "2026-02-28T19:00:00",
    endsAt: "2026-02-28T21:00:00",
    isMultiSession: false,
    sessionCount: 1,
    teacher: {
      name: "Luna Patel",
      bio: "Certified sound healer and meditation teacher. Luna has studied with master teachers in India, Nepal, and Bali.",
      avatar: "",
    },
    location: "Meditation Room",
    locationDetail: "142 Valencia St, Ground Floor, San Francisco, CA 94103",
    priceCents: 4500,
    memberPriceCents: 3500,
    earlyBirdCents: null,
    earlyBirdEndsAt: null,
    capacity: 40,
    spotsLeft: 6,
    tags: ["Sound Healing", "Meditation", "Relaxation"],
    whatToBring: ["Comfortable clothing", "Optional: your own blanket or pillow"],
    requirements: ["No experience needed", "Please arrive 10 minutes early to settle in"],
  },
};

// Fallback for IDs not in eventsData
const fallbackEvent: EventDetail = eventsData.ev1;

// ── Component ──────────────────────────────────────────────────────
const EventDetailPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);

  const event = (id && eventsData[id]) || fallbackEvent;
  const cfg = typeConfig[event.type] ?? typeConfig.event;
  const TypeIcon = cfg.icon;
  const startDate = new Date(event.startsAt);
  const endDate = new Date(event.endsAt);
  const spotsLow = event.spotsLeft <= 5;

  // Map the event's sessions into the panel's shape (numbered, for partial series).
  const panelSessions: EventSessionLite[] = (event.sessions ?? []).map((s, i) => ({
    session_number: i + 1,
    title: s.topic,
    dateLabel: s.date,
    timeLabel: s.time,
  }));

  const handleRegister = (sel: {
    dueNowCents: number;
    paymentOption: "full" | "deposit";
    isWaitlist: boolean;
    sessionNumbers: number[];
  }) => {
    if (sel.isWaitlist) {
      toast({ title: "Added to waitlist", description: "We'll notify you if a spot opens up." });
      return;
    }
    const sessionNote = sel.sessionNumbers.length && sel.sessionNumbers.length < panelSessions.length
      ? ` · ${sel.sessionNumbers.length} sessions`
      : "";
    const depositNote = sel.paymentOption === "deposit" ? " deposit" : "";
    toast({
      title: "Registration started",
      description: `Opening checkout for ${formatPrice(sel.dueNowCents)}${depositNote}${sessionNote}…`,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          to="/events"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to events
        </Link>

        {/* Hero Image */}
        <div className="relative rounded-xl overflow-hidden aspect-[3/1]">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Actions overlay */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="bg-background/80 backdrop-blur-sm"
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-destructive text-destructive" : ""}`} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="bg-background/80 backdrop-blur-sm"
              onClick={() => toast({ title: "Link copied", description: "Event link copied to clipboard." })}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Event info overlay */}
          <div className="absolute bottom-6 left-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${cfg.color} border`}>
                <TypeIcon className="h-3 w-3 mr-1" />
                {cfg.label}
              </Badge>
              {spotsLow && (
                <Badge className="bg-accent-coral/90 text-white border-none">
                  Only {event.spotsLeft} spots left
                </Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">{event.title}</h1>
            <p className="text-sm opacity-80 mt-1">{event.description}</p>
          </div>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div>
              <h2 className="text-lg font-semibold mb-3">About This {cfg.label}</h2>
              {event.longDescription.split("\n\n").map((para, i) => (
                <p key={i} className="text-muted-foreground mb-3">{para}</p>
              ))}
            </div>

            <Separator />

            {/* Sessions (multi-session events) */}
            {event.isMultiSession && event.sessions && (
              <>
                <div>
                  <h2 className="text-lg font-semibold mb-3">Schedule ({event.sessionCount} sessions)</h2>
                  <div className="space-y-2">
                    {event.sessions.map((session, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 border border-border">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{session.topic}</p>
                          <p className="text-xs text-muted-foreground">{session.date} &middot; {session.time}</p>
                        </div>
                      </div>
                    ))}
                    {event.sessions.length < event.sessionCount && (
                      <p className="text-xs text-muted-foreground pl-12">
                        + {event.sessionCount - event.sessions.length} more sessions
                      </p>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Teacher */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Instructor</h2>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border border-border">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-lilac/20 text-accent-lilac shrink-0">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">{event.teacher.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{event.teacher.bio}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* What to bring */}
            {event.whatToBring.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">What to Bring</h2>
                <ul className="space-y-2">
                  {event.whatToBring.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-accent-sage shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {event.requirements.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Requirements</h2>
                <ul className="space-y-2">
                  {event.requirements.map((req, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 text-accent-gold shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right column — Registration */}
          <div className="space-y-4">
            <EventRegistrationPanel
              regularCents={event.priceCents}
              memberCents={event.memberPriceCents}
              earlyBirdCents={event.earlyBirdCents}
              earlyBirdEndsAt={event.earlyBirdEndsAt}
              status={event.status}
              registrationOpensAt={event.registrationOpensAt}
              registrationClosesAt={event.registrationClosesAt}
              capacity={event.capacity}
              spotsLeft={event.spotsLeft}
              waitlistEnabled={event.waitlistEnabled}
              sessions={panelSessions}
              tiers={event.pricingTiers}
              depositCents={event.depositCents}
              showMemberToggle
              onRegister={handleRegister}
            />

            <Card>
              <CardContent className="p-5 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">
                      {startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    </p>
                    {event.isMultiSession && (
                      <p className="text-muted-foreground">
                        through {endDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })} &middot; {event.sessionCount} sessions
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p>
                    {startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    {" — "}
                    {endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{event.location}</p>
                    <p className="text-muted-foreground">{event.locationDetail}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {event.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default EventDetailPage;
