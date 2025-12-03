import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/stats/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Calendar,
  Clock,
  Flame,
  Trophy,
  Users,
  UserPlus,
  Search,
  Share2,
  ChevronRight,
  Sun,
  Moon,
  Sunrise,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock stats data
const stats = {
  week: {
    classes: 4,
    workshops: 1,
    minutes: 315,
    streak: 8,
    longestStreak: 21,
    topStyles: ["Vinyasa", "Yin", "Power"],
    topTeachers: ["Maya Johnson", "David Park", "Sarah Lee"],
    peakTime: "Morning",
  },
  month: {
    classes: 12,
    workshops: 2,
    minutes: 945,
    streak: 8,
    longestStreak: 21,
    topStyles: ["Vinyasa", "Yin", "Hatha"],
    topTeachers: ["Maya Johnson", "David Park", "Emma Thompson"],
    peakTime: "Morning",
  },
  year: {
    classes: 156,
    workshops: 8,
    minutes: 11700,
    streak: 8,
    longestStreak: 21,
    topStyles: ["Vinyasa", "Yin", "Power"],
    topTeachers: ["Maya Johnson", "David Park", "Alex Rivera"],
    peakTime: "Evening",
  },
  allTime: {
    classes: 312,
    workshops: 15,
    minutes: 23400,
    streak: 8,
    longestStreak: 21,
    topStyles: ["Vinyasa", "Yin", "Power"],
    topTeachers: ["Maya Johnson", "David Park", "Sarah Lee"],
    peakTime: "Evening",
  },
};

const friends = [
  { id: "1", name: "Emma T.", avatar: "", classesThisMonth: 18, status: "ACCEPTED" },
  { id: "2", name: "Alex R.", avatar: "", classesThisMonth: 14, status: "ACCEPTED" },
  { id: "3", name: "Jordan M.", avatar: "", classesThisMonth: 9, status: "ACCEPTED" },
  { id: "4", name: "Taylor S.", avatar: "", classesThisMonth: 22, status: "ACCEPTED" },
];

const leaderboard = [
  { rank: 1, name: "Taylor S.", avatar: "", classes: 22, minutes: 1650 },
  { rank: 2, name: "Chris K.", avatar: "", classes: 20, minutes: 1500 },
  { rank: 3, name: "Emma T.", avatar: "", classes: 18, minutes: 1350 },
  { rank: 4, name: "You", avatar: "", classes: 12, minutes: 945, isCurrentUser: true },
  { rank: 5, name: "Alex R.", avatar: "", classes: 14, minutes: 1050 },
  { rank: 6, name: "Jordan M.", avatar: "", classes: 9, minutes: 675 },
  { rank: 7, name: "Sam P.", avatar: "", classes: 8, minutes: 600 },
  { rank: 8, name: "Riley B.", avatar: "", classes: 7, minutes: 525 },
];

const timeOfDayIcon = {
  Morning: Sunrise,
  Afternoon: Sun,
  Evening: Moon,
};

const Community = () => {
  const [period, setPeriod] = useState<"week" | "month" | "year" | "allTime">("month");
  const [searchQuery, setSearchQuery] = useState("");

  const currentStats = stats[period];
  const TimeIcon = timeOfDayIcon[currentStats.peakTime as keyof typeof timeOfDayIcon] || Sun;

  const formatMinutes = (mins: number) => {
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remaining = mins % 60;
      return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community</h1>
          <p className="text-muted-foreground mt-1">
            Track your progress, connect with friends, and see how you rank
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:inline-grid">
            <TabsTrigger value="stats" className="px-6">Stats</TabsTrigger>
            <TabsTrigger value="friends" className="px-6">Friends</TabsTrigger>
            <TabsTrigger value="leaderboard" className="px-6">Leaderboard</TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats" className="mt-6 space-y-6">
            {/* Period selector */}
            <div className="flex items-center justify-between">
              <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="allTime">All Time</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                View My Wrapped
              </Button>
            </div>

            {/* Main stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Classes"
                value={currentStats.classes}
                icon={Calendar}
                variant="primary"
              />
              <StatCard
                label="Workshops"
                value={currentStats.workshops}
                icon={Activity}
              />
              <StatCard
                label="Time Practiced"
                value={formatMinutes(currentStats.minutes)}
                icon={Clock}
              />
              <StatCard
                label="Day Streak"
                value={currentStats.streak}
                icon={Flame}
                trend={{ value: 0, label: `Best: ${currentStats.longestStreak}` }}
              />
            </div>

            {/* Breakdown cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Top Styles */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Top Styles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentStats.topStyles.map((style, i) => (
                    <div key={style} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                          i === 0 ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          {i + 1}
                        </span>
                        <span className="font-medium">{style}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Teachers */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Top Teachers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentStats.topTeachers.map((teacher, i) => (
                    <div key={teacher} className="flex items-center gap-3">
                      <span className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        i === 0 ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {i + 1}
                      </span>
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                          {teacher.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{teacher}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Peak Time */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TimeIcon className="h-4 w-4 text-primary" />
                    Peak Practice Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent mb-3">
                      <TimeIcon className="h-8 w-8 text-accent-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{currentStats.peakTime}s</p>
                    <p className="text-sm text-muted-foreground">Most active time</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends" className="mt-6 space-y-6">
            {/* Search and add */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Friend
              </Button>
            </div>

            {/* Friends list */}
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-4 rounded-xl border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.avatar} />
                      <AvatarFallback className="bg-accent text-accent-foreground">
                        {friend.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {friend.classesThisMonth} classes this month
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Profile
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Ranked by classes attended in the last 30 days
              </p>
              <Badge variant="secondary">Last 30 days</Badge>
            </div>

            {/* Leaderboard list */}
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border",
                    entry.isCurrentUser
                      ? "bg-accent border-primary/20"
                      : "bg-card"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                      entry.rank === 1 && "bg-yellow-500 text-yellow-950",
                      entry.rank === 2 && "bg-gray-300 text-gray-800",
                      entry.rank === 3 && "bg-amber-600 text-amber-950",
                      entry.rank > 3 && "bg-muted text-muted-foreground"
                    )}>
                      {entry.rank <= 3 ? (
                        <Trophy className="h-4 w-4" />
                      ) : (
                        entry.rank
                      )}
                    </div>

                    {/* User */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={entry.avatar} />
                      <AvatarFallback className={cn(
                        entry.isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent text-accent-foreground"
                      )}>
                        {entry.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className={cn("font-medium", entry.isCurrentUser && "text-primary")}>
                        {entry.name}
                        {entry.isCurrentUser && (
                          <Badge variant="default" className="ml-2 text-xs">You</Badge>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="font-semibold">{entry.classes}</p>
                      <p className="text-muted-foreground text-xs">classes</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatMinutes(entry.minutes)}</p>
                      <p className="text-muted-foreground text-xs">practiced</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Community;