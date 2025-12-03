import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/stats/StatCard";
import { ClassCard } from "@/components/schedule/ClassCard";
import { StudioCard } from "@/components/studio/StudioCard";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Activity,
  Calendar,
  Clock,
  Flame,
  TrendingUp,
  ChevronRight,
  Sun,
  Moon,
  Sunrise,
  Search,
  MapPin,
  Plane,
} from "lucide-react";

// Mock data
const stats = {
  classesThisWeek: 4,
  classesThisMonth: 12,
  minutesPracticed: 540,
  currentStreak: 8,
  longestStreak: 21,
  topStyle: "Vinyasa",
  favoriteTeacher: "Maya Johnson",
  peakTime: "Morning",
};

const featuredStudios = [
  {
    id: "s1",
    name: "Lotus Flow Studio",
    description: "A tranquil sanctuary in the heart of downtown offering vinyasa, yin, and meditation classes.",
    imageUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80",
    location: { neighborhood: "Downtown", city: "San Francisco" },
    rating: 4.9,
    reviewCount: 342,
    styles: ["Vinyasa", "Yin"],
    classesToday: 12,
  },
  {
    id: "s2",
    name: "Hot Yoga Collective",
    description: "Heated classes in a modern industrial space. Challenging flows and deep stretches.",
    imageUrl: "https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?w=800&q=80",
    location: { neighborhood: "SoMa", city: "San Francisco" },
    rating: 4.8,
    reviewCount: 218,
    styles: ["Hot Yoga", "Power"],
    classesToday: 8,
  },
  {
    id: "s3",
    name: "Zen Garden Yoga",
    description: "Traditional yoga practices with meditation and breathwork in a serene garden setting.",
    imageUrl: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&q=80",
    location: { neighborhood: "Pacific Heights", city: "San Francisco" },
    rating: 4.9,
    reviewCount: 156,
    styles: ["Hatha", "Meditation"],
    classesToday: 6,
  },
];

const topInstructors = [
  {
    id: "t1",
    name: "Maya Johnson",
    bio: "E-RYT 500 specializing in dynamic vinyasa and arm balances. 15+ years teaching experience.",
    specialties: ["Vinyasa", "Inversions", "Arm Balances"],
    rating: 4.9,
    reviewCount: 456,
    classCount: 2340,
    studios: ["Lotus Flow Studio", "Hot Yoga Collective"],
  },
  {
    id: "t2",
    name: "David Park",
    bio: "Yin yoga and meditation teacher. Trained in Thailand with a focus on mindfulness and stillness.",
    specialties: ["Yin", "Meditation", "Restorative"],
    rating: 4.8,
    reviewCount: 312,
    classCount: 1890,
    studios: ["Lotus Flow Studio", "Zen Garden Yoga"],
  },
];

const upcomingClass = {
  id: "1",
  title: "Power Vinyasa Flow",
  style: "Vinyasa",
  level: "INTERMEDIATE" as const,
  isHeated: true,
  teacher: { name: "Maya Johnson", avatar: "" },
  startTime: "Today, 6:00 PM",
  duration: 60,
  location: "Lotus Flow Studio",
  spotsLeft: 4,
  capacity: 20,
};

const featuredRetreats = [
  {
    destination: "Bali",
    country: "Indonesia",
    title: "7-Day Transformation",
    price: 2499,
    imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
  },
  {
    destination: "Costa Rica",
    country: "Central America", 
    title: "Jungle Wellness Escape",
    price: 1899,
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  },
];

const timeOfDayIcon = {
  Morning: Sunrise,
  Afternoon: Sun,
  Evening: Moon,
};

const Index = () => {
  const handleBook = (id: string) => {
    console.log("Booking class:", id);
  };

  const TimeIcon = timeOfDayIcon[stats.peakTime as keyof typeof timeOfDayIcon] || Sun;

  return (
    <AppLayout>
      <div className="space-y-10">
        {/* Hero / Search Section */}
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-accent to-primary/5 p-8 md:p-12">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Find your perfect practice
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              Discover yoga studios, book classes, and track your journey — all in one place.
            </p>
            
            {/* Search bar */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search studios, classes, or teachers..."
                  className="pl-12 h-12 bg-background/80 backdrop-blur-sm"
                />
              </div>
              <Button size="lg" className="h-12 px-6">
                <MapPin className="h-5 w-5 mr-2" />
                Near me
              </Button>
            </div>
          </div>

          {/* Quick stats for logged in user */}
          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Flame className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-semibold text-lg">{stats.currentStreak}</span>
                <span className="text-muted-foreground ml-1">day streak</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-semibold text-lg">{stats.classesThisMonth}</span>
                <span className="text-muted-foreground ml-1">classes this month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Your Next Class (if booked) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Next Class</h2>
            <Link
              to="/my-schedule"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <ClassCard {...upcomingClass} onBook={handleBook} />
        </section>

        {/* Featured Studios */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Popular Studios</h2>
              <p className="text-sm text-muted-foreground">Top-rated studios near you</p>
            </div>
            <Link
              to="/studios"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Browse all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {featuredStudios.map((studio) => (
              <StudioCard key={studio.id} {...studio} />
            ))}
          </div>
        </section>

        {/* Featured Instructors */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Top Instructors</h2>
              <p className="text-sm text-muted-foreground">Learn from the best</p>
            </div>
            <Link
              to="/instructors"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {topInstructors.map((instructor) => (
              <InstructorCard key={instructor.id} {...instructor} />
            ))}
          </div>
        </section>

        {/* Retreats Teaser */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Plane className="h-5 w-5 text-info" />
                Upcoming Retreats
              </h2>
              <p className="text-sm text-muted-foreground">Transform your practice with immersive experiences</p>
            </div>
            <Link
              to="/schedule?tab=retreats"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {featuredRetreats.map((retreat) => (
              <Link
                key={retreat.destination}
                to="/schedule?tab=retreats"
                className="group relative rounded-xl overflow-hidden aspect-[2/1]"
              >
                <img
                  src={retreat.imageUrl}
                  alt={retreat.destination}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <Badge className="bg-info text-info-foreground mb-2">Retreat</Badge>
                  <p className="text-sm opacity-80">{retreat.country}</p>
                  <h3 className="text-xl font-bold">{retreat.destination}</h3>
                  <p className="text-sm opacity-90">{retreat.title} • From ${retreat.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Personal Insights */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Insights</h2>
            <Link
              to="/community"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View full stats
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="This Week"
              value={stats.classesThisWeek}
              icon={Calendar}
              trend={{ value: 2, label: "vs last week" }}
            />
            <StatCard
              label="This Month"
              value={stats.classesThisMonth}
              icon={Activity}
              variant="primary"
            />
            <StatCard
              label="Minutes Practiced"
              value={stats.minutesPracticed}
              icon={Clock}
            />
            <StatCard
              label="Day Streak"
              value={stats.currentStreak}
              icon={Flame}
              trend={{ value: 0, label: `Best: ${stats.longestStreak}` }}
            />
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Index;
