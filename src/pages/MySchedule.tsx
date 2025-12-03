import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Star,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingItem {
  id: string;
  type: "CLASS" | "WORKSHOP" | "APPOINTMENT";
  title: string;
  teacher: {
    name: string;
    avatar?: string;
  };
  startTime: string;
  duration: number;
  location: string;
  status: "BOOKED" | "CHECKED_IN" | "CANCELED" | "NO_SHOW" | "WAITLISTED";
  canCancel: boolean;
  cancelDeadline?: string;
}

const upcomingBookings: BookingItem[] = [
  {
    id: "1",
    type: "CLASS",
    title: "Power Vinyasa Flow",
    teacher: { name: "Maya Johnson" },
    startTime: "Today, 6:00 PM",
    duration: 60,
    location: "Main Studio",
    status: "BOOKED",
    canCancel: true,
    cancelDeadline: "Cancel by 4:00 PM",
  },
  {
    id: "2",
    type: "CLASS",
    title: "Morning Flow",
    teacher: { name: "Sarah Lee" },
    startTime: "Tomorrow, 7:00 AM",
    duration: 60,
    location: "Main Studio",
    status: "BOOKED",
    canCancel: true,
    cancelDeadline: "Cancel by 5:00 AM tomorrow",
  },
  {
    id: "3",
    type: "WORKSHOP",
    title: "Inversions Workshop",
    teacher: { name: "Maya Johnson" },
    startTime: "Saturday, Dec 7, 2:00 PM",
    duration: 180,
    location: "Main Studio",
    status: "BOOKED",
    canCancel: true,
    cancelDeadline: "Cancel by Dec 5",
  },
  {
    id: "4",
    type: "CLASS",
    title: "Hot Power Yoga",
    teacher: { name: "Alex Rivera" },
    startTime: "Tomorrow, 12:00 PM",
    duration: 75,
    location: "Hot Room",
    status: "WAITLISTED",
    canCancel: true,
  },
];

const pastBookings: BookingItem[] = [
  {
    id: "p1",
    type: "CLASS",
    title: "Yin Yoga & Meditation",
    teacher: { name: "David Park" },
    startTime: "Yesterday, 7:30 PM",
    duration: 75,
    location: "Zen Room",
    status: "CHECKED_IN",
    canCancel: false,
  },
  {
    id: "p2",
    type: "CLASS",
    title: "Morning Flow",
    teacher: { name: "Sarah Lee" },
    startTime: "Dec 1, 7:00 AM",
    duration: 60,
    location: "Main Studio",
    status: "CHECKED_IN",
    canCancel: false,
  },
  {
    id: "p3",
    type: "APPOINTMENT",
    title: "Private Yoga Session",
    teacher: { name: "Maya Johnson" },
    startTime: "Nov 30, 4:00 PM",
    duration: 60,
    location: "Private Room",
    status: "CHECKED_IN",
    canCancel: false,
  },
];

const statusConfig = {
  BOOKED: { label: "Booked", variant: "booked" as const, icon: Check },
  CHECKED_IN: { label: "Attended", variant: "checkedIn" as const, icon: Check },
  CANCELED: { label: "Canceled", variant: "canceled" as const, icon: X },
  NO_SHOW: { label: "No Show", variant: "noShow" as const, icon: X },
  WAITLISTED: { label: "Waitlisted", variant: "waitlisted" as const, icon: Clock },
};

const typeConfig = {
  CLASS: { label: "Class", variant: "class" as const },
  WORKSHOP: { label: "Workshop", variant: "workshop" as const },
  APPOINTMENT: { label: "Appointment", variant: "appointment" as const },
};

function BookingCard({
  booking,
  onCancel,
  onRate,
  isPast = false,
}: {
  booking: BookingItem;
  onCancel: (id: string) => void;
  onRate: (id: string) => void;
  isPast?: boolean;
}) {
  const status = statusConfig[booking.status];
  const type = typeConfig[booking.type];
  const StatusIcon = status.icon;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant={type.variant}>{type.label}</Badge>
            <Badge variant={status.variant} className="gap-1">
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground">{booking.title}</h3>

          {/* Teacher */}
          <div className="flex items-center gap-2 mt-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={booking.teacher.avatar} alt={booking.teacher.name} />
              <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                {booking.teacher.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{booking.teacher.name}</span>
          </div>

          {/* Details */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{booking.startTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{booking.duration} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{booking.location}</span>
            </div>
          </div>

          {/* Cancel deadline warning */}
          {!isPast && booking.canCancel && booking.cancelDeadline && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{booking.cancelDeadline}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex sm:flex-col gap-2">
          {isPast && booking.status === "CHECKED_IN" ? (
            <Button variant="outline" size="sm" onClick={() => onRate(booking.id)}>
              <Star className="h-4 w-4 mr-1" />
              Rate
            </Button>
          ) : booking.canCancel ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(booking.id)}
              className="text-destructive hover:text-destructive"
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const MySchedule = () => {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);

  const handleCancelClick = (id: string) => {
    const booking = [...upcomingBookings, ...pastBookings].find((b) => b.id === id);
    if (booking) {
      setSelectedBooking(booking);
      setCancelDialogOpen(true);
    }
  };

  const handleConfirmCancel = () => {
    console.log("Canceling booking:", selectedBooking?.id);
    setCancelDialogOpen(false);
    setSelectedBooking(null);
  };

  const handleRate = (id: string) => {
    console.log("Rating booking:", id);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
          <p className="text-muted-foreground mt-1">
            Manage your upcoming classes, workshops, and appointments
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:inline-grid">
            <TabsTrigger value="upcoming" className="px-8">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="px-8">
              Past
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={handleCancelClick}
                    onRate={handleRate}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No upcoming bookings</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any classes, workshops, or appointments scheduled.
                </p>
                <Button asChild>
                  <a href="/schedule">Browse Schedule</a>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {pastBookings.length > 0 ? (
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={handleCancelClick}
                    onRate={handleRate}
                    isPast
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No past bookings</h3>
                <p className="text-muted-foreground">
                  Your booking history will appear here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your booking for{" "}
              <span className="font-medium text-foreground">
                {selectedBooking?.title}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          {selectedBooking?.cancelDeadline && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                {selectedBooking.cancelDeadline}. Canceling after may result in a fee.
              </span>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Booking
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default MySchedule;