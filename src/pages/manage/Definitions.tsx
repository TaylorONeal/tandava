import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  BookOpen,
  Users,
  Calendar,
  CreditCard,
  Settings,
  Target,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";

// ---------------------------------------------------------------------------
// Glossary Terms
// ---------------------------------------------------------------------------

interface GlossaryTerm {
  term: string;
  definition: string;
  category: "membership" | "scheduling" | "payments" | "members" | "operations" | "marketing";
  seeAlso?: string[];
}

const glossaryTerms: GlossaryTerm[] = [
  // Membership & Pricing
  {
    term: "Membership",
    definition:
      "A recurring subscription that grants a student ongoing access to classes. Memberships can be unlimited (all classes) or limited (set number per month). They auto-renew until cancelled.",
    category: "membership",
    seeAlso: ["Class Pack", "Drop-in"],
  },
  {
    term: "Class Pack",
    definition:
      "A prepaid bundle of class credits that don't auto-renew. Students use one credit per class attended. Packs typically have an expiration date (e.g., 3 or 6 months).",
    category: "membership",
    seeAlso: ["Membership", "Credit"],
  },
  {
    term: "Drop-in",
    definition:
      "A single-class purchase at full price, typically for visitors or members who've used their allocation. Drop-in rates are usually higher per-class than membership or pack rates.",
    category: "membership",
    seeAlso: ["Class Pack", "Intro Offer"],
  },
  {
    term: "Intro Offer",
    definition:
      "A discounted first-time purchase for new students, such as '2 weeks unlimited for $30' or 'First class free'. Designed to lower the barrier for trying the studio.",
    category: "membership",
    seeAlso: ["Conversion Rate", "Trial"],
  },
  {
    term: "Credit",
    definition:
      "A unit of value used to book classes. One credit typically equals one class. Some studios use variable credit costs (e.g., popular classes cost 2 credits).",
    category: "membership",
    seeAlso: ["Class Pack", "Credit Bank"],
  },
  {
    term: "Credit Bank",
    definition:
      "The member's balance of unused class credits from packs or rollover memberships. Displayed in their account and deducted when booking.",
    category: "membership",
  },
  {
    term: "Freeze / Hold",
    definition:
      "A temporary pause on a membership, typically used for travel, injury, or other life circumstances. The billing and membership end date are extended by the freeze duration.",
    category: "membership",
    seeAlso: ["Membership", "Churn"],
  },

  // Scheduling
  {
    term: "Class Occurrence",
    definition:
      "A specific instance of a class on the schedule. A 'Power Flow' class template might have multiple occurrences throughout the week, each with its own date, time, and capacity.",
    category: "scheduling",
    seeAlso: ["Class Template", "Series"],
  },
  {
    term: "Class Template",
    definition:
      "A reusable class definition that includes name, description, duration, default instructor, and capacity. Templates are used to generate recurring class occurrences.",
    category: "scheduling",
  },
  {
    term: "Series",
    definition:
      "A multi-week program where students commit to attending all sessions. Series often have a start/end date and may require full payment upfront (e.g., '6-Week Yoga Fundamentals').",
    category: "scheduling",
    seeAlso: ["Workshop"],
  },
  {
    term: "Workshop",
    definition:
      "A longer, one-time specialty class or event, typically 2-4 hours. Workshops are separately priced and often focus on specific skills, topics, or intensive practice.",
    category: "scheduling",
    seeAlso: ["Series", "Retreat"],
  },
  {
    term: "Retreat",
    definition:
      "An extended immersive experience, typically multiple days at an off-site location. Retreats include accommodation, meals, and a full schedule of classes and activities.",
    category: "scheduling",
  },
  {
    term: "Waitlist",
    definition:
      "A queue for students wanting to join a full class. When a spot opens (via cancellation), the first waitlisted student is automatically or manually added. Reduces lost revenue from full classes.",
    category: "scheduling",
    seeAlso: ["No-Show", "Late Cancel"],
  },
  {
    term: "Sub Request",
    definition:
      "When a scheduled instructor can't teach, they create a sub request for other qualified instructors to cover the class. The system can automatically notify available subs.",
    category: "scheduling",
    seeAlso: ["Coverage"],
  },
  {
    term: "Coverage",
    definition:
      "When one instructor teaches a class on behalf of another. Coverage may be unpaid (swap/favor), paid at regular rate, or paid at a premium sub rate.",
    category: "scheduling",
  },

  // Payments & Billing
  {
    term: "Payment Gateway",
    definition:
      "The service that processes credit card transactions (e.g., Stripe, Square). It securely handles card data and transfers funds to your bank account.",
    category: "payments",
  },
  {
    term: "ACH",
    definition:
      "Automated Clearing House - a bank-to-bank transfer method with lower fees than credit cards. Often used for membership billing as 'Bank Account' option.",
    category: "payments",
  },
  {
    term: "Auto-Pay",
    definition:
      "Automatic recurring charges for memberships. The stored payment method is charged on a set schedule (monthly, annually) without requiring member action.",
    category: "payments",
    seeAlso: ["Dunning"],
  },
  {
    term: "Dunning",
    definition:
      "The process of collecting failed payments. Includes automatic retry attempts, member notifications, and eventual account suspension if payment isn't resolved.",
    category: "payments",
    seeAlso: ["Auto-Pay"],
  },
  {
    term: "Promo Code",
    definition:
      "A discount code applied at checkout for percentage off, fixed amount off, or free trial periods. Can be limited by usage count, date range, or specific products.",
    category: "payments",
    seeAlso: ["Intro Offer"],
  },
  {
    term: "Refund",
    definition:
      "Returning payment to a member's original payment method. Policies vary but typically cover unused portions of packs or errors. Partial refunds are also possible.",
    category: "payments",
  },

  // Member Management
  {
    term: "Check-in",
    definition:
      "Recording a student's attendance at a class. Can be done via kiosk, instructor device, or automatically when entering with a key card/QR code.",
    category: "members",
    seeAlso: ["Booking", "No-Show"],
  },
  {
    term: "Booking",
    definition:
      "Reserving a spot in a class before attending. Bookings may be free (membership) or require payment (drop-in). Advance booking helps predict attendance.",
    category: "members",
    seeAlso: ["Check-in", "Waitlist"],
  },
  {
    term: "No-Show",
    definition:
      "When a booked student doesn't attend and doesn't cancel. May result in forfeited credit, fee, or membership strike depending on studio policy.",
    category: "members",
    seeAlso: ["Late Cancel", "Waitlist"],
  },
  {
    term: "Late Cancel",
    definition:
      "Cancelling a booking within the restricted window (e.g., less than 2 hours before class). May incur fees or credit forfeiture to discourage last-minute changes.",
    category: "members",
    seeAlso: ["No-Show", "Cancellation Policy"],
  },
  {
    term: "Waiver",
    definition:
      "A legal document students sign acknowledging physical activity risks and releasing the studio from liability. Required before first class, often signed digitally during registration.",
    category: "members",
  },
  {
    term: "Emergency Contact",
    definition:
      "A person to notify in case of medical emergency during class. Important member profile field, especially for hot yoga or athletic practices.",
    category: "members",
  },

  // Operations
  {
    term: "Studio Location",
    definition:
      "A physical space where classes are held. Multi-location studios can have separate schedules, staff, and even pricing per location.",
    category: "operations",
  },
  {
    term: "Room",
    definition:
      "A specific practice space within a location. Studios may have multiple rooms (Hot Room, Zen Room) with different capacities and amenities.",
    category: "operations",
  },
  {
    term: "Kiosk Mode",
    definition:
      "A simplified interface for a dedicated check-in device at the studio entrance. Shows today's classes and allows quick attendance marking.",
    category: "operations",
  },
  {
    term: "Capacity",
    definition:
      "The maximum number of students allowed in a class. Set per room or class type, accounting for space, safety, and experience quality.",
    category: "operations",
    seeAlso: ["Fill Rate", "Waitlist"],
  },
  {
    term: "Hybrid Class",
    definition:
      "A class offered simultaneously in-person and via livestream. Allows remote attendance while maintaining the in-studio experience. Requires video/audio setup.",
    category: "operations",
    seeAlso: ["Virtual Class", "On-Demand"],
  },
  {
    term: "Virtual Class",
    definition:
      "A class conducted entirely online via video streaming. No physical studio attendance. Can be live or on-demand (recorded).",
    category: "operations",
    seeAlso: ["Hybrid Class", "On-Demand"],
  },
  {
    term: "On-Demand",
    definition:
      "Pre-recorded class content available anytime. Members can practice at their convenience. Often included with memberships or available as separate subscription.",
    category: "operations",
    seeAlso: ["Virtual Class"],
  },

  // Marketing
  {
    term: "Lead",
    definition:
      "A potential student who has shown interest but hasn't purchased yet. May have signed up for newsletter, attended a free event, or started checkout without completing.",
    category: "marketing",
    seeAlso: ["Conversion Rate", "Funnel"],
  },
  {
    term: "Funnel",
    definition:
      "The stages a prospect moves through from awareness to paying member: Awareness → Interest → Trial → Conversion → Retention. Analyzing funnel helps optimize marketing.",
    category: "marketing",
    seeAlso: ["Lead", "Conversion Rate"],
  },
  {
    term: "UTM Parameters",
    definition:
      "Tags added to URLs to track marketing campaign effectiveness. Include source (where), medium (how), and campaign (what). E.g., ?utm_source=instagram&utm_medium=social",
    category: "marketing",
    seeAlso: ["Attribution"],
  },
  {
    term: "Referral Program",
    definition:
      "An incentive system rewarding members who bring new students. Both referrer and referred often receive benefits (free classes, discounts).",
    category: "marketing",
    seeAlso: ["Referral Rate"],
  },
  {
    term: "Win-Back Campaign",
    definition:
      "Marketing targeted at former members to encourage return. Typically offers special pricing or highlights new offerings since they left.",
    category: "marketing",
    seeAlso: ["Churn", "At-Risk Members"],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Definitions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [
    { id: "membership", label: "Membership & Pricing", icon: CreditCard, color: "bg-primary/10 text-primary" },
    { id: "scheduling", label: "Scheduling", icon: Calendar, color: "bg-accent-sage/20 text-accent-sage" },
    { id: "payments", label: "Payments & Billing", icon: CreditCard, color: "bg-accent-gold/20 text-accent-gold" },
    { id: "members", label: "Member Management", icon: Users, color: "bg-accent-lilac/30 text-accent-lilac" },
    { id: "operations", label: "Operations", icon: Settings, color: "bg-accent-coral/20 text-accent-coral" },
    { id: "marketing", label: "Marketing", icon: Target, color: "bg-accent-peach/30 text-foreground" },
  ];

  const filteredTerms = glossaryTerms.filter((t) => {
    const matchesSearch =
      searchQuery === "" ||
      t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.definition.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === null || t.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  // Group terms alphabetically
  const groupedTerms = filteredTerms.reduce(
    (acc, term) => {
      const letter = term.term[0].toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(term);
      return acc;
    },
    {} as Record<string, GlossaryTerm[]>
  );

  const sortedLetters = Object.keys(groupedTerms).sort();

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Glossary
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Studio management terms and industry definitions
            </p>
          </div>
          <Link to="/manage/data-dictionary">
            <Button variant="outline" size="sm">
              <ArrowUpRight className="h-4 w-4 mr-1.5" />
              Analytics Metrics
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search definitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(null)}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setActiveCategory(activeCategory === cat.id ? null : cat.id)
              }
              className="gap-1.5"
            >
              <cat.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{cat.label}</span>
              <span className="sm:hidden">{cat.label.split(" ")[0]}</span>
            </Button>
          ))}
        </div>

        {/* Alphabetical index */}
        {!searchQuery && !activeCategory && (
          <div className="flex flex-wrap gap-1">
            {Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ").map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                  sortedLetters.includes(letter)
                    ? "text-primary hover:bg-primary/10"
                    : "text-muted-foreground/30 cursor-not-allowed"
                }`}
              >
                {letter}
              </a>
            ))}
          </div>
        )}

        {/* Terms list */}
        <div className="space-y-8">
          {sortedLetters.map((letter) => (
            <div key={letter} id={`letter-${letter}`}>
              <h2 className="text-xl font-bold text-primary mb-4 sticky top-0 bg-background py-2 border-b">
                {letter}
              </h2>
              <div className="space-y-3">
                {groupedTerms[letter].map((item) => {
                  const cat = categories.find((c) => c.id === item.category);
                  return (
                    <Card key={item.term}>
                      <CardContent className="py-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{item.term}</h3>
                          {cat && (
                            <Badge className={cat.color} variant="secondary">
                              <cat.icon className="h-3 w-3 mr-1" />
                              {cat.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.definition}
                        </p>
                        {item.seeAlso && item.seeAlso.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="text-xs text-muted-foreground">
                              See also:
                            </span>
                            {item.seeAlso.map((related) => (
                              <Badge
                                key={related}
                                variant="outline"
                                className="text-xs cursor-pointer hover:bg-muted"
                                onClick={() => setSearchQuery(related)}
                              >
                                {related}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {filteredTerms.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No terms found matching "{searchQuery}"
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory(null);
                  }}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  Clear filters
                </button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer help */}
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              Looking for metric definitions and calculations?{" "}
              <Link
                to="/manage/data-dictionary"
                className="text-primary hover:underline"
              >
                View the Data Dictionary
              </Link>{" "}
              for detailed analytics documentation.
            </p>
          </CardContent>
        </Card>
      </div>
    </ManageLayout>
  );
}
