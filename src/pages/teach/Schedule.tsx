import { useState } from "react";
import { TeachLayout } from "@/components/teach/TeachLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Users,
  MapPin,
  Clock,
  Repeat2,
} from "lucide-react";

interface ScheduledClass {
  id: string;
  name: string;
  style: string;
  date: string;
  dayOfWeek: string;
  time: string;
  endTime: string;
  room: string;
  location: string;
  capacity: number;
  booked: number;
  status: "regular" | "subbing" | "pending_sub";
  originalTeacher?: string;
  subRequestedAt?: string;
}

type ViewMode = "week" | "month";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Mock data for instructor's schedule
const mockSchedule: ScheduledClass[] = [
  // This week
  {
    id: "1",
    name: "Morning Vinyasa",
    style: "Vinyasa",
    date: "Feb 3",
    dayOfWeek: "Mon",
    time: "7:00 AM",
    endTime: "8:15 AM",
    room: "Main Studio",
    location: "SOMA",
    capacity: 25,
    booked: 22,
    status: "regular",
  },
  {
    id: "2",
    name: "Evening Vinyasa",
    style: "Vinyasa",
    date: "Feb 3",
    dayOfWeek: "Mon",
    time: "6:00 PM",
    endTime: "7:15 PM",
    room: "Main Studio",
    location: "SOMA",
    capacity: 25,
    booked: 18,
    status: "regular",
  },
  {
    id: "3",
    name: "Morning Vinyasa",
    style: "Vinyasa",
    date: "Feb 5",
    dayOfWeek: "Wed",
    time: "7:00 AM",
    endTime: "8:15 AM",
    room: "Main Studio",
    location: "SOMA",
    capacity: 25,
    booked: 19,
    status: "pending_sub",
    subRequestedAt: "Feb 1",
  },
  {
    id: "4",
    name: "Evening Vinyasa",
    style: "Vinyasa",
    date: "Feb 5",
    dayOfWeek: "Wed",
    time: "6:00 PM",
    endTime: "7:15 PM",
    room: "Main Studio",
    location: "SOMA",
    capacity: 25,
    booked: 15,
    status: "regular",
  },
  {
    id: "5",
    name: "Morning Vinyasa",
    style: "Vinyasa",
    date: "Feb 7",
    dayOfWeek: "Fri",
    time: "7:00 AM",
    endTime: "8:15 AM",
    room: "Main Studio",
    location: "SOMA",
    capacity: 25,
    booked: 17,
    status: "regular",
  },
  {
    id: "6",
    name: "Community Flow",
    style: "Vinyasa",
    date: "Feb 8",
    dayOfWeek: "Sat",
    time: "11:00 AM",
    endTime: "12:15 PM",
    room: "Main Studio",
    location: "SOMA",
    capacity: 25,
    booked: 20,
    status: "regular",
  },
  {
    id: "7",
    name: "Power Yoga",
    style: "Power",
    date: "Feb 4",
    dayOfWeek: "Tue",
    time: "12:00 PM",
    endTime: "1:00 PM",
    room: "Hot Room",
    location: "SOMA",
    capacity: 30,
    booked: 28,
    status: "subbing",
    originalTeacher: "Sarah Chen",
  },
  // Next week
  {
    id: "8",
    name: "Morning Vinyasa",
    style: "Vinyasa",
    date: "Feb 10",
    dayOfWeek: "Mon",
    time: "7:00 AM",
    endTime: "8:15 AM",
    room: "Main Studio",
    location: "SOMA",
    capacity: 25,
    booked: 14,
    status: "regular",
  },
  {
    id: "9",
    name: "Evening Vinyasa",
    style: "Vinyasa",
    date: "Feb 10",
    dayOfWeek: "Mon",
    time: "6:00 PM",
    endTime: "7:15 PM",
    room: "Main Studio",
    location: "SOMA",
    capacity: 25,
    booked: 10,
    status: "regular",
  },
];

export default function TeachSchedule() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(
    null
  );
  const [subReason, setSubReason] = useState("");

  // Filter classes based on current view
  const filteredClasses =
    viewMode === "week"
      ? mockSchedule.filter((cls) => {
          // Simple filter for demo - in real app, use date comparison
          if (currentWeekOffset === 0) {
            return ["Feb 3", "Feb 4", "Feb 5", "Feb 6", "Feb 7", "Feb 8", "Feb 9"].includes(
              cls.date
            );
          }
          return ["Feb 10", "Feb 11", "Feb 12", "Feb 13", "Feb 14", "Feb 15", "Feb 16"].includes(
            cls.date
          );
        })
      : mockSchedule;

  // Group classes by day for week view
  const classesByDay: Record<string, ScheduledClass[]> = {};
  weekDays.forEach((day) => {
    classesByDay[day] = filteredClasses
      .filter((cls) => cls.dayOfWeek === day)
      .sort((a, b) => a.time.localeCompare(b.time));
  });

  const getStatusColor = (status: ScheduledClass["status"]) => {
    switch (status) {
      case "regular":
        return "bg-primary/10 border-primary/20";
      case "subbing":
        return "bg-accent-sage/10 border-accent-sage/30";
      case "pending_sub":
        return "bg-accent-gold/10 border-accent-gold/30";
      default:
        return "bg-secondary/50";
    }
  };

  const getStatusBadge = (cls: ScheduledClass) => {
    switch (cls.status) {
      case "subbing":
        return (
          <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage border-0">
            Subbing for {cls.originalTeacher}
          </Badge>
        );
      case "pending_sub":
        return (
          <Badge
            variant="outline"
            className="text-[10px] border-accent-gold/50 text-accent-gold"
          >
            Sub Requested
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleRequestSub = () => {
    if (!selectedClass) return;
    // In real app, this would make an API call
    console.log("Requesting sub for:", selectedClass.id, "Reason:", subReason);
    setSubDialogOpen(false);
    setSelectedClass(null);
    setSubReason("");
  };

  const weekLabel =
    currentWeekOffset === 0
      ? "This Week"
      : currentWeekOffset === 1
      ? "Next Week"
      : `Week of Feb ${10 + (currentWeekOffset - 1) * 7}`;

  return (
    <TeachLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Schedule</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage your teaching schedule
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("month")}
            >
              Month
            </Button>
          </div>
        </div>

        {/* Week Navigation */}
        {viewMode === "week" && (
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentWeekOffset(Math.max(0, currentWeekOffset - 1))}
              disabled={currentWeekOffset === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{weekLabel}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/30 border border-primary/40" />
            <span className="text-muted-foreground">Regular Class</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-accent-sage/30 border border-accent-sage/40" />
            <span className="text-muted-foreground">Subbing for Someone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-accent-gold/30 border border-accent-gold/40" />
            <span className="text-muted-foreground">Sub Requested</span>
          </div>
        </div>

        {/* Week View */}
        {viewMode === "week" && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((day) => (
              <div key={day} className="space-y-2">
                <div className="text-center py-2 rounded-lg bg-secondary/50">
                  <p className="text-sm font-semibold">{day}</p>
                </div>
                {classesByDay[day].length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground rounded-lg border border-dashed border-border">
                    No classes
                  </div>
                ) : (
                  classesByDay[day].map((cls) => (
                    <Card
                      key={cls.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow border ${getStatusColor(
                        cls.status
                      )}`}
                      onClick={() => {
                        setSelectedClass(cls);
                        if (cls.status !== "pending_sub") {
                          setSubDialogOpen(true);
                        }
                      }}
                    >
                      <CardContent className="p-3">
                        <p className="text-xs font-semibold">{cls.time}</p>
                        <p className="text-sm font-medium mt-1 truncate">
                          {cls.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {cls.room}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>
                            {cls.booked}/{cls.capacity}
                          </span>
                        </div>
                        {getStatusBadge(cls) && (
                          <div className="mt-2">{getStatusBadge(cls)}</div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ))}
          </div>
        )}

        {/* Month View / List View */}
        {viewMode === "month" && (
          <div className="space-y-3">
            {filteredClasses.map((cls) => (
              <Card
                key={cls.id}
                className={`cursor-pointer hover:shadow-md transition-shadow border ${getStatusColor(
                  cls.status
                )}`}
                onClick={() => {
                  setSelectedClass(cls);
                  if (cls.status !== "pending_sub") {
                    setSubDialogOpen(true);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 min-w-0">
                      {/* Date & Time */}
                      <div className="shrink-0 w-24 text-center">
                        <p className="text-xs text-muted-foreground">{cls.date}</p>
                        <p className="text-sm font-semibold">{cls.time}</p>
                        <p className="text-xs text-muted-foreground">
                          {cls.endTime}
                        </p>
                      </div>

                      {/* Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold">{cls.name}</h3>
                          {getStatusBadge(cls)}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {cls.room}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {cls.style}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Status */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="font-semibold">
                            {cls.booked}/{cls.capacity}
                          </span>
                        </div>
                      </div>
                      {cls.status === "regular" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClass(cls);
                            setSubDialogOpen(true);
                          }}
                        >
                          <Repeat2 className="h-3 w-3 mr-1" />
                          Request Sub
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredClasses.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No classes scheduled</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Request Sub Dialog */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Request a Sub</DialogTitle>
            <DialogDescription>
              Submit a request for another instructor to cover this class.
            </DialogDescription>
          </DialogHeader>
          {selectedClass && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-secondary/50">
                <p className="text-sm font-semibold">{selectedClass.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedClass.date} ({selectedClass.dayOfWeek}) at{" "}
                  {selectedClass.time}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedClass.room} - {selectedClass.booked} students booked
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Reason (optional)
                </label>
                <Textarea
                  placeholder="Let the team know why you need coverage..."
                  value={subReason}
                  onChange={(e) => setSubReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="p-3 rounded-xl bg-accent-gold/10 border border-accent-gold/20">
                <p className="text-xs text-accent-gold">
                  Your request will be sent to qualified instructors. You will
                  be notified once someone accepts.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestSub}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TeachLayout>
  );
}
