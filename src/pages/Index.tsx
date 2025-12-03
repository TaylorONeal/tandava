import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/stats/StatCard";
import { ClassCard } from "@/components/schedule/ClassCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const upcomingClass = {
  id: "1",
  title: "Power Vinyasa Flow",
  style: "Vinyasa",
  level: "INTERMEDIATE" as const,
  isHeated: true,
  teacher: { name: "Maya Johnson", avatar: "" },
  startTime: "Today, 6:00 PM",
  duration: 60,
  location: "Main Studio",
  spotsLeft: 4,
  capacity: 20,
};

const recommendedClasses = [
  {
    id: "2",
    title: "Yin Yoga & Meditation",
    style: "Yin",
    level: "ALL" as const,
    isHeated: false,
    teacher: { name: "David Park", avatar: "" },
    startTime: "Tomorrow, 7:30 AM",
    duration: 75,
    location: "Zen Room",
    spotsLeft: 8,
    capacity: 15,
  },
  {
    id: "3",
    title: "Morning Flow",
    style: "Vinyasa",
    level: "BEGINNER" as const,
    isHeated: false,
    teacher: { name: "Sarah Lee", avatar: "" },
    startTime: "Tomorrow, 9:00 AM",
    duration: 60,
    location: "Main Studio",
    spotsLeft: 12,
    capacity: 20,
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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, Sarah</h1>
            <p className="text-muted-foreground mt-1">
              You're on a {stats.currentStreak} day streak. Keep it up!
            </p>
          </div>
          <Button asChild variant="hero" size="lg">
            <Link to="/schedule">
              <Calendar className="h-5 w-5 mr-2" />
              Book a Class
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
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

        {/* Next Class & Insights */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Your Next Class */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Next Class</h2>
              <Link
                to="/my-schedule"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <ClassCard {...upcomingClass} onBook={handleBook} />
          </div>

          {/* Insights */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Insights</h2>

            <Card>
              <CardContent className="pt-4 space-y-4">
                {/* Top Style */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Top Style</p>
                      <p className="text-sm font-medium">{stats.topStyle}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">This Month</Badge>
                </div>

                {/* Favorite Teacher */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        MJ
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs text-muted-foreground">Favorite Teacher</p>
                      <p className="text-sm font-medium">{stats.favoriteTeacher}</p>
                    </div>
                  </div>
                </div>

                {/* Peak Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                      <TimeIcon className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Most Active</p>
                      <p className="text-sm font-medium">{stats.peakTime}s</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button asChild variant="soft" className="w-full">
              <Link to="/community">
                View Full Stats
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Recommended For You */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recommended For You</h2>
            <Link
              to="/schedule"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Browse all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {recommendedClasses.map((classItem) => (
              <ClassCard key={classItem.id} {...classItem} onBook={handleBook} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;