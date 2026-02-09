import { TeachLayout } from "@/components/teach/TeachLayout";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  DollarSign,
  Repeat2,
  Clock,
  ArrowRight,
  Users,
  Heart,
  ChevronRight,
  ClipboardCheck,
  Video,
  Wifi,
} from "lucide-react";
import type { DeliveryMode } from "@/types/database";
import { Link } from "react-router-dom";

// Mock data for instructor dashboard
interface UpcomingClass {
  id: string;
  name: string;
  date: string;
  time: string;
  room: string;
  booked: number;
  capacity: number;
  isToday: boolean;
  deliveryMode?: DeliveryMode;
  isStartingSoon?: boolean;
  checkedIn?: number;
}

const upcomingClasses: UpcomingClass[] = [
  {
    id: "1",
    name: "Morning Vinyasa",
    date: "Today",
    time: "7:00 AM",
    room: "Main Studio",
    booked: 22,
    capacity: 25,
    isToday: true,
    deliveryMode: "hybrid",
    isStartingSoon: true,
    checkedIn: 18,
  },
  {
    id: "2",
    name: "Evening Vinyasa",
    date: "Today",
    time: "6:00 PM",
    room: "Main Studio",
    booked: 18,
    capacity: 25,
    isToday: true,
  },
  {
    id: "3",
    name: "Morning Vinyasa",
    date: "Wednesday",
    time: "7:00 AM",
    room: "Main Studio",
    booked: 19,
    capacity: 25,
    isToday: false,
    deliveryMode: "hybrid",
  },
  {
    id: "4",
    name: "Virtual Flow",
    date: "Wednesday",
    time: "6:00 PM",
    room: "Online",
    booked: 35,
    capacity: 50,
    isToday: false,
    deliveryMode: "virtual",
  },
  {
    id: "5",
    name: "Community Flow",
    date: "Saturday",
    time: "11:00 AM",
    room: "Main Studio",
    booked: 20,
    capacity: 25,
    isToday: false,
  },
];

const pendingSubRequests = [
  {
    id: "1",
    className: "Morning Vinyasa",
    date: "Feb 12",
    time: "7:00 AM",
    status: "pending",
    requestedAt: "2 days ago",
  },
];

const openSubOpportunities = [
  {
    id: "1",
    className: "Gentle Flow",
    teacher: "James Liu",
    date: "Feb 10",
    time: "9:30 AM",
    pay: 75,
  },
  {
    id: "2",
    className: "Yin Restore",
    teacher: "Ava Kim",
    date: "Feb 14",
    time: "4:30 PM",
    pay: 65,
  },
];

const recentTips = [
  { id: "1", from: "Anonymous", amount: 20, className: "Morning Vinyasa", date: "Today" },
  { id: "2", from: "Emma W.", amount: 15, className: "Evening Vinyasa", date: "Yesterday" },
  { id: "3", from: "Alex R.", amount: 10, className: "Community Flow", date: "Jan 28" },
];

const earningsSummary = {
  total: 1850,
  basePay: 1650,
  tips: 145,
  subs: 55,
  classesThisPeriod: 22,
  periodStart: "Jan 16",
  periodEnd: "Jan 31",
};

export default function TeachDashboard() {
  const { toast } = useToast();
  return (
    <TeachLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Today's Classes - Prominent on mobile for check-in */}
        {upcomingClasses.filter(c => c.isToday).length > 0 && (
          <Card className="border-accent-sage/30 bg-accent-sage/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-accent-sage" />
                Today's Classes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingClasses.filter(c => c.isToday).map((cls) => (
                <div
                  key={cls.id}
                  className={`p-4 rounded-xl bg-white border ${
                    cls.isStartingSoon ? 'border-accent-sage shadow-sm' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{cls.time}</span>
                      {cls.isStartingSoon && (
                        <Badge className="bg-accent-sage text-white text-[10px] animate-pulse">
                          Starting Soon
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{cls.checkedIn ?? 0}/{cls.booked} checked in</span>
                    </div>
                  </div>
                  <p className="font-medium">{cls.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>{cls.room}</span>
                    {cls.deliveryMode === 'hybrid' && (
                      <span className="flex items-center gap-1 text-violet-600">
                        <Wifi className="h-3 w-3" /> + Online
                      </span>
                    )}
                    {cls.deliveryMode === 'virtual' && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Video className="h-3 w-3" /> Virtual
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1" onClick={() => toast({ title: "Check-in opened", description: "Student check-in for this class is now active." })}>
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Check-in Students
                    </Button>
                    {(cls.deliveryMode === 'virtual' || cls.deliveryMode === 'hybrid') && (
                      <Button size="sm" variant="outline" onClick={() => toast({ title: "Stream starting", description: "Virtual class stream is being prepared..." })}>
                        <Video className="h-4 w-4 mr-2" />
                        Start Stream
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions - Desktop */}
        <div className="hidden sm:flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/teach/schedule">
              <Calendar className="h-4 w-4 mr-2" />
              View Schedule
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/teach/subs">
              <Repeat2 className="h-4 w-4 mr-2" />
              Request Sub
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/teach/earnings">
              <DollarSign className="h-4 w-4 mr-2" />
              View Earnings
            </Link>
          </Button>
        </div>

        {/* Mobile Quick Actions */}
        <div className="grid grid-cols-3 gap-2 sm:hidden">
          <Link
            to="/teach/schedule"
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-medium">Schedule</span>
          </Link>
          <Link
            to="/teach/subs"
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-accent-gold/10 hover:bg-accent-gold/20 transition-colors"
          >
            <Repeat2 className="h-5 w-5 text-accent-gold" />
            <span className="text-[10px] font-medium">Subs</span>
          </Link>
          <Link
            to="/teach/earnings"
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-accent-sage/10 hover:bg-accent-sage/20 transition-colors"
          >
            <DollarSign className="h-5 w-5 text-accent-sage" />
            <span className="text-[10px] font-medium">Earnings</span>
          </Link>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Classes This Week
                  </p>
                  <p className="text-2xl font-bold mt-1">5</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {upcomingClasses.filter((c) => c.isToday).length} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Period Earnings
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    ${earningsSummary.total.toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-accent-sage/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-accent-sage" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {earningsSummary.classesThisPeriod} classes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Open Sub Opps
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {openSubOpportunities.length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-accent-gold/20 flex items-center justify-center">
                  <Repeat2 className="h-5 w-5 text-accent-gold" />
                </div>
              </div>
              <p className="text-xs text-accent-gold mt-2">Available to claim</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tips This Period
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    ${earningsSummary.tips}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-accent-coral/20 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-accent-coral" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {recentTips.length} tips received
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Classes */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Upcoming Classes</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/teach/schedule" className="text-xs">
                      View Full Schedule <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                      cls.isToday
                        ? "bg-accent-sage/10 border border-accent-sage/20"
                        : "bg-secondary/50 hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-center shrink-0 w-20">
                        <p className="text-xs text-muted-foreground">{cls.date}</p>
                        <p className="text-sm font-semibold">{cls.time}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">{cls.room}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>
                          {cls.booked}/{cls.capacity}
                        </span>
                      </div>
                      {cls.isToday && (
                        <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage border-0">
                          Today
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Tips */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-4 w-4 text-accent-coral" />
                  Recent Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentTips.map((tip) => (
                  <div
                    key={tip.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
                  >
                    <div>
                      <p className="text-sm font-medium">{tip.from}</p>
                      <p className="text-xs text-muted-foreground">
                        {tip.className} - {tip.date}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-accent-sage">
                      +${tip.amount}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Pending Sub Requests */}
            {pendingSubRequests.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent-gold" />
                    Pending Sub Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pendingSubRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl border border-accent-gold/30 bg-accent-gold/5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{req.className}</p>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-accent-gold/50 text-accent-gold"
                        >
                          Pending
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {req.date} at {req.time}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested {req.requestedAt}
                      </p>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    asChild
                  >
                    <Link to="/teach/subs">
                      Manage Requests <ChevronRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Open Sub Opportunities */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Repeat2 className="h-4 w-4 text-primary" />
                  Sub Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {openSubOpportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{opp.className}</p>
                      <span className="text-xs font-semibold text-accent-sage">
                        ${opp.pay}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      For {opp.teacher}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {opp.date} at {opp.time}
                    </p>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  asChild
                >
                  <Link to="/teach/subs">
                    View All <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Earnings Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Current Period</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {earningsSummary.periodStart} - {earningsSummary.periodEnd}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Base Pay</span>
                  <span className="text-sm font-medium">
                    ${earningsSummary.basePay.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tips</span>
                  <span className="text-sm font-medium">
                    ${earningsSummary.tips}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sub Classes</span>
                  <span className="text-sm font-medium">
                    ${earningsSummary.subs}
                  </span>
                </div>
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-lg font-bold">
                      ${earningsSummary.total.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  asChild
                >
                  <Link to="/teach/earnings">
                    View Details <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TeachLayout>
  );
}
