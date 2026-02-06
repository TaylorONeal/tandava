import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  UserPlus,
  CalendarPlus,
  CheckCircle,
  Video,
  Wifi,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { DeliveryMode } from "@/types/database";

// Mock data for the dashboard
const todayClasses: {
  id: string;
  name: string;
  time: string;
  teacher: string;
  spotsLeft: number;
  capacity: number;
  checkedIn: number;
  deliveryMode?: DeliveryMode;
  isLive?: boolean;
}[] = [
  { id: "1", name: "Morning Vinyasa", time: "7:00 AM", teacher: "Maya Patel", spotsLeft: 3, capacity: 25, checkedIn: 18, deliveryMode: "hybrid", isLive: true },
  { id: "2", name: "Gentle Flow", time: "9:30 AM", teacher: "James Liu", spotsLeft: 8, capacity: 20, checkedIn: 0 },
  { id: "3", name: "Power Yoga", time: "12:00 PM", teacher: "Sarah Chen", spotsLeft: 0, capacity: 30, checkedIn: 0 },
  { id: "4", name: "Virtual Yin", time: "4:30 PM", teacher: "Ava Kim", spotsLeft: 12, capacity: 50, checkedIn: 0, deliveryMode: "virtual" },
  { id: "5", name: "Evening Vinyasa", time: "6:00 PM", teacher: "Maya Patel", spotsLeft: 5, capacity: 25, checkedIn: 0, deliveryMode: "hybrid" },
  { id: "6", name: "Candlelight Yin", time: "7:30 PM", teacher: "James Liu", spotsLeft: 6, capacity: 18, checkedIn: 0 },
];

const alerts = [
  { type: "sub_needed", message: "James Liu needs a sub for Wednesday 9:30 AM Gentle Flow", urgent: true },
  { type: "low_spots", message: "Power Yoga (12 PM) is full — 3 on waitlist", urgent: false },
  { type: "expiring_packs", message: "12 class packs expiring this week", urgent: false },
  { type: "payment_failed", message: "2 membership renewals failed — follow up needed", urgent: true },
];

const recentActivity = [
  { action: "New student registered", detail: "Emma Wilson", time: "15 min ago" },
  { action: "Booking confirmed", detail: "Morning Vinyasa — Alex Rivera", time: "32 min ago" },
  { action: "Late cancel", detail: "Power Yoga — Jordan Blake", time: "1 hr ago" },
  { action: "Membership purchased", detail: "Unlimited Monthly — Mia Tanaka", time: "2 hrs ago" },
  { action: "Class pack purchased", detail: "10-Class Pack — Noah Garcia", time: "3 hrs ago" },
];

export default function ManageDashboard() {
  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="hidden sm:flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/manage/students">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Student
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/manage/schedule">
                <CalendarPlus className="h-4 w-4 mr-2" />
                Add Class
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Quick Actions - Touch-friendly grid */}
        <div className="grid grid-cols-4 gap-2 sm:hidden">
          <Link
            to="/manage/schedule"
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-medium text-center">Schedule</span>
          </Link>
          <Link
            to="/manage/students"
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-accent-sage/10 hover:bg-accent-sage/20 transition-colors"
          >
            <Users className="h-5 w-5 text-accent-sage" />
            <span className="text-[10px] font-medium text-center">Students</span>
          </Link>
          <Link
            to="/manage/financials"
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-accent-gold/10 hover:bg-accent-gold/20 transition-colors"
          >
            <DollarSign className="h-5 w-5 text-accent-gold" />
            <span className="text-[10px] font-medium text-center">Payments</span>
          </Link>
          <Link
            to="/manage/teachers"
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-accent-lilac/10 hover:bg-accent-lilac/20 transition-colors"
          >
            <UserCheck className="h-5 w-5 text-accent-lilac" />
            <span className="text-[10px] font-medium text-center">Teachers</span>
          </Link>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today's Classes</p>
                  <p className="text-2xl font-bold mt-1">{todayClasses.length}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {todayClasses.reduce((acc, c) => acc + (c.capacity - c.spotsLeft), 0)} total bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Students</p>
                  <p className="text-2xl font-bold mt-1">347</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-accent-sage/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-accent-sage" />
                </div>
              </div>
              <p className="text-xs text-accent-sage mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +12 this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue (MTD)</p>
                  <p className="text-2xl font-bold mt-1">$18,420</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-accent-gold/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-accent-gold" />
                </div>
              </div>
              <p className="text-xs text-accent-sage mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +8% vs last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Check-in Rate</p>
                  <p className="text-2xl font-bold mt-1">87%</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">3% no-show rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Today's Schedule</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/manage/schedule" className="text-xs">
                      View Full Schedule <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {todayClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-center shrink-0 w-16">
                        <p className="text-sm font-semibold">{cls.time}</p>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{cls.name}</p>
                          {cls.isLive && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              LIVE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{cls.teacher}</span>
                          {cls.deliveryMode === 'virtual' && (
                            <span className="flex items-center gap-0.5 text-blue-600">
                              <Video className="h-3 w-3" /> Virtual
                            </span>
                          )}
                          {cls.deliveryMode === 'hybrid' && (
                            <span className="flex items-center gap-0.5 text-violet-600">
                              <Wifi className="h-3 w-3" /> Hybrid
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {cls.checkedIn > 0 && (
                        <Badge variant="outline" className="text-xs bg-accent-sage/10 text-accent-sage border-accent-sage/30 hidden sm:flex">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {cls.checkedIn}
                        </Badge>
                      )}
                      {cls.spotsLeft === 0 ? (
                        <Badge className="text-xs bg-accent-coral/20 text-accent-coral">Full</Badge>
                      ) : cls.spotsLeft <= 3 ? (
                        <Badge variant="outline" className="text-xs text-accent-gold border-accent-gold/30">
                          {cls.spotsLeft} left
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {cls.capacity - cls.spotsLeft}/{cls.capacity}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.action}</span>
                        <span className="text-muted-foreground"> — {activity.detail}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Alerts & Action Items */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-accent-gold" />
                  Action Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border text-sm ${
                      alert.urgent
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-border bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {alert.urgent && (
                        <span className="h-2 w-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                      )}
                      <p className="text-sm leading-snug">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">This Week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Classes Taught</span>
                  </div>
                  <span className="text-sm font-semibold">34</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Bookings</span>
                  </div>
                  <span className="text-sm font-semibold">612</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">New Students</span>
                  </div>
                  <span className="text-sm font-semibold">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Revenue</span>
                  </div>
                  <span className="text-sm font-semibold">$4,850</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ManageLayout>
  );
}
