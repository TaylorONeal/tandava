import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Download,
  ArrowRight,
  Clock,
  UserCheck,
  UserMinus,
  CreditCard,
  Repeat,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReportsManage() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("this_month");

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">Studio performance and analytics</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_quarter">This Quarter</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => toast({ title: "Exported", description: "Report data exported to CSV." })}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between">
                <DollarSign className="h-5 w-5 text-accent-gold" />
                <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage">
                  <TrendingUp className="h-3 w-3 mr-1" /> +8%
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-2">$18,420</p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between">
                <Repeat className="h-5 w-5 text-primary" />
                <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage">
                  <TrendingUp className="h-3 w-3 mr-1" /> +3%
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-2">$14,100</p>
              <p className="text-xs text-muted-foreground">Recurring Revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between">
                <CreditCard className="h-5 w-5 text-accent-coral" />
                <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage">
                  <TrendingUp className="h-3 w-3 mr-1" /> +12%
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-2">$3,200</p>
              <p className="text-xs text-muted-foreground">Pack Sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <Badge className="text-[10px] bg-destructive/10 text-destructive">
                  <TrendingDown className="h-3 w-3 mr-1" /> -2%
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-2">$1,120</p>
              <p className="text-xs text-muted-foreground">Drop-in Revenue</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Attendance Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                  <Calendar className="h-5 w-5 text-primary mx-auto" />
                  <p className="text-2xl font-bold mt-2">142</p>
                  <p className="text-xs text-muted-foreground">Total Classes</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                  <Users className="h-5 w-5 text-primary mx-auto" />
                  <p className="text-2xl font-bold mt-2">2,486</p>
                  <p className="text-xs text-muted-foreground">Total Bookings</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                  <UserCheck className="h-5 w-5 text-accent-sage mx-auto" />
                  <p className="text-2xl font-bold mt-2">87%</p>
                  <p className="text-xs text-muted-foreground">Check-in Rate</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                  <UserMinus className="h-5 w-5 text-destructive mx-auto" />
                  <p className="text-2xl font-bold mt-2">3.2%</p>
                  <p className="text-xs text-muted-foreground">No-show Rate</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Top Classes by Attendance</p>
                <div className="space-y-2">
                  {[
                    { name: "Morning Vinyasa", teacher: "Maya Patel", avg: 22, capacity: 25 },
                    { name: "Hot Vinyasa", teacher: "Sarah Chen", avg: 27, capacity: 30 },
                    { name: "Weekend Power", teacher: "Sarah Chen", avg: 26, capacity: 30 },
                    { name: "Community Flow", teacher: "Maya Patel", avg: 21, capacity: 25 },
                    { name: "Sunday Slow", teacher: "Ava Kim", avg: 17, capacity: 20 },
                  ].map((cls, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30">
                      <div>
                        <p className="text-sm font-medium">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">{cls.teacher}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{cls.avg}/{cls.capacity}</p>
                        <p className="text-xs text-muted-foreground">{Math.round((cls.avg / cls.capacity) * 100)}% fill</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Performance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Teacher Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { name: "Maya Patel", classes: 22, revenue: 8750, avgAttendees: 21, rating: 4.9 },
                  { name: "Sarah Chen", classes: 18, revenue: 9200, avgAttendees: 26, rating: 4.8 },
                  { name: "James Liu", classes: 16, revenue: 4800, avgAttendees: 14, rating: 4.7 },
                  { name: "Ava Kim", classes: 12, revenue: 3900, avgAttendees: 15, rating: 4.9 },
                ].map((teacher, i) => (
                  <div key={i} className="p-3 rounded-xl bg-secondary/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold">{teacher.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {teacher.rating} rating
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-sm font-bold">{teacher.classes}</p>
                        <p className="text-[10px] text-muted-foreground">Classes</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold">${teacher.revenue.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Revenue</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold">{teacher.avgAttendees}</p>
                        <p className="text-[10px] text-muted-foreground">Avg Students</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Membership Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Membership Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { type: "Unlimited Monthly", count: 89, revenue: 13261, trend: "+5" },
                { type: "8x Monthly", count: 34, revenue: 3740, trend: "+2" },
                { type: "4x Monthly", count: 28, revenue: 2240, trend: "-1" },
                { type: "Class Packs", count: 156, revenue: 3200, trend: "+18" },
              ].map((membership, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <div>
                    <p className="text-sm font-medium">{membership.type}</p>
                    <p className="text-xs text-muted-foreground">{membership.count} active</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">${membership.revenue.toLocaleString()}</p>
                    <p className={`text-xs ${membership.trend.startsWith('+') ? 'text-accent-sage' : 'text-destructive'}`}>
                      {membership.trend} this month
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payroll Summary */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Payroll Summary</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs">
                  View Details <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-xl bg-secondary/50 text-center mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Payroll This Month</p>
                <p className="text-3xl font-bold mt-1">$5,230</p>
                <p className="text-xs text-muted-foreground mt-1">68 classes across 4 teachers</p>
              </div>

              {[
                { name: "Maya Patel", hours: 22, amount: 1650, type: "$75/class" },
                { name: "Sarah Chen", hours: 18, amount: 1840, type: "40% share" },
                { name: "James Liu", hours: 16, amount: 960, type: "$60/class" },
                { name: "Ava Kim", hours: 12, amount: 780, type: "$65/class" },
              ].map((entry, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">{entry.hours} classes — {entry.type}</p>
                  </div>
                  <p className="text-sm font-semibold">${entry.amount.toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </ManageLayout>
  );
}
