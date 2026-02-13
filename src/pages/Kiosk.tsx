import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  QrCode,
  Search,
  Clock,
  Users,
  MapPin,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  Camera,
  Keyboard,
  RefreshCw,
  CalendarPlus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock studio data
const mockStudio = {
  id: "lotus-flow",
  name: "Lotus Flow Studio",
  logo: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=200&q=80",
  primaryColor: "#4fd1c5",
  accentColor: "#f687b3",
};

// Mock today's classes
const mockTodayClasses = [
  {
    id: "c1",
    name: "Morning Vinyasa Flow",
    instructor: "Maya Johnson",
    time: "7:00 AM",
    endTime: "8:00 AM",
    room: "Studio A",
    spotsTotal: 20,
    spotsBooked: 18,
    checkedIn: 12,
    status: "in_progress",
  },
  {
    id: "c2",
    name: "Gentle Yoga",
    instructor: "David Park",
    time: "9:00 AM",
    endTime: "10:00 AM",
    room: "Studio B",
    spotsTotal: 15,
    spotsBooked: 10,
    checkedIn: 0,
    status: "upcoming",
  },
  {
    id: "c3",
    name: "Power Hour",
    instructor: "Sarah Chen",
    time: "10:30 AM",
    endTime: "11:30 AM",
    room: "Studio A",
    spotsTotal: 25,
    spotsBooked: 22,
    checkedIn: 0,
    status: "upcoming",
  },
  {
    id: "c4",
    name: "Yin & Meditation",
    instructor: "James Wilson",
    time: "12:00 PM",
    endTime: "1:00 PM",
    room: "Studio B",
    spotsTotal: 18,
    spotsBooked: 8,
    checkedIn: 0,
    status: "upcoming",
  },
  {
    id: "c5",
    name: "Hot Yoga Sculpt",
    instructor: "Maya Johnson",
    time: "5:30 PM",
    endTime: "6:30 PM",
    room: "Hot Room",
    spotsTotal: 30,
    spotsBooked: 28,
    checkedIn: 0,
    status: "upcoming",
  },
  {
    id: "c6",
    name: "Restorative Flow",
    instructor: "David Park",
    time: "7:00 PM",
    endTime: "8:15 PM",
    room: "Studio A",
    spotsTotal: 15,
    spotsBooked: 6,
    checkedIn: 0,
    status: "upcoming",
  },
];

// Mock members with bookings
const mockMembers = [
  {
    id: "m1",
    firstName: "Emma",
    lastName: "Thompson",
    phone: "555-0101",
    email: "emma@example.com",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    bookings: [
      { classId: "c2", className: "Gentle Yoga", time: "9:00 AM", checkedIn: false },
    ],
  },
  {
    id: "m2",
    firstName: "Michael",
    lastName: "Chen",
    phone: "555-0102",
    email: "michael@example.com",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    bookings: [
      { classId: "c3", className: "Power Hour", time: "10:30 AM", checkedIn: false },
    ],
  },
  {
    id: "m3",
    firstName: "Sarah",
    lastName: "Williams",
    phone: "555-0103",
    email: "sarah@example.com",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    bookings: [
      { classId: "c2", className: "Gentle Yoga", time: "9:00 AM", checkedIn: true },
    ],
  },
  {
    id: "m4",
    firstName: "James",
    lastName: "Rodriguez",
    phone: "555-0104",
    email: "james@example.com",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    bookings: [
      { classId: "c5", className: "Hot Yoga Sculpt", time: "5:30 PM", checkedIn: false },
    ],
  },
  {
    id: "m5",
    firstName: "Lisa",
    lastName: "Nguyen",
    phone: "555-0105",
    email: "lisa@example.com",
    photo: "",
    bookings: [],
  },
];

// Mock class attendees
const mockClassAttendees: Record<string, typeof mockMembers> = {
  c2: [mockMembers[0], mockMembers[2]],
  c3: [mockMembers[1]],
  c5: [mockMembers[3]],
};

type KioskView = "scanner" | "manual_search" | "class_detail" | "success" | "error";
type ErrorType = "no_booking" | "already_checked_in" | "early_arrival" | null;

const Kiosk = () => {
  const { studioId } = useParams<{ studioId: string }>();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [view, setView] = useState<KioskView>("scanner");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof mockMembers>([]);
  const [selectedMember, setSelectedMember] = useState<(typeof mockMembers)[0] | null>(null);
  const [selectedClass, setSelectedClass] = useState<(typeof mockTodayClasses)[0] | null>(null);
  const [checkedInMember, setCheckedInMember] = useState<(typeof mockMembers)[0] | null>(null);
  const [checkedInClass, setCheckedInClass] = useState<{ className: string; room: string } | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const resetToScanner = useCallback(() => {
    setView("scanner");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedMember(null);
    setSelectedClass(null);
    setCheckedInMember(null);
    setCheckedInClass(null);
    setErrorType(null);
    setIsScanning(false);
    setScanProgress(0);
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss success screen
  useEffect(() => {
    if (view === "success") {
      const timer = setTimeout(() => {
        resetToScanner();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [view, resetToScanner]);

  // Auto-dismiss error screen
  useEffect(() => {
    if (view === "error" && errorType !== "no_booking") {
      const timer = setTimeout(() => {
        resetToScanner();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [view, errorType, resetToScanner]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = mockMembers.filter(
        (m) =>
          m.firstName.toLowerCase().includes(query.toLowerCase()) ||
          m.lastName.toLowerCase().includes(query.toLowerCase()) ||
          m.phone.includes(query)
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSimulateScan = () => {
    setIsScanning(true);
    setScanProgress(0);

    // Simulate scanning progress
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    // After "scan" completes, check in a random member
    setTimeout(() => {
      setIsScanning(false);
      setScanProgress(0);

      // Randomly select a scenario
      const scenario = Math.random();

      if (scenario < 0.5) {
        // Successful check-in
        const member = mockMembers[0];
        const booking = member.bookings[0];
        if (booking) {
          setCheckedInMember(member);
          setCheckedInClass({ className: booking.className, room: "Studio B" });
          setView("success");
        }
      } else if (scenario < 0.7) {
        // Already checked in
        setSelectedMember(mockMembers[2]);
        setErrorType("already_checked_in");
        setView("error");
      } else if (scenario < 0.85) {
        // Early arrival
        setSelectedMember(mockMembers[3]);
        setErrorType("early_arrival");
        setView("error");
      } else {
        // No booking found
        setErrorType("no_booking");
        setView("error");
      }
    }, 1200);
  };

  const handleMemberSelect = (member: (typeof mockMembers)[0]) => {
    setSelectedMember(member);

    if (member.bookings.length === 0) {
      setErrorType("no_booking");
      setView("error");
      return;
    }

    const booking = member.bookings[0];

    if (booking.checkedIn) {
      setErrorType("already_checked_in");
      setView("error");
      return;
    }

    // Successful check-in
    setCheckedInMember(member);
    setCheckedInClass({ className: booking.className, room: "Studio B" });
    setView("success");
  };

  const handleClassSelect = (classItem: (typeof mockTodayClasses)[0]) => {
    setSelectedClass(classItem);
    setView("class_detail");
  };

  const renderScanner = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      {/* QR Scanner Viewfinder */}
      <div className="relative mb-8">
        {/* Outer glow ring */}
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-xl animate-pulse" />

        {/* Camera viewfinder */}
        <div className="relative w-80 h-80 rounded-2xl overflow-hidden border-2 border-primary/50 bg-card/50 backdrop-blur">
          {/* Simulated camera feed */}
          <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/10">
            {/* Scanning animation */}
            {isScanning && (
              <div
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
                style={{
                  top: `${scanProgress}%`,
                  transition: 'top 0.1s linear',
                  boxShadow: '0 0 20px var(--accent-teal)',
                }}
              />
            )}

            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-lg" />

            {/* Center crosshair */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <QrCode className="w-16 h-16 text-primary/40" />
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Camera icon overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur">
              <Camera className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Camera Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">Scan your QR code to check in</h2>
        <p className="text-muted-foreground">
          Hold your phone up to the camera with your booking QR code visible
        </p>
      </div>

      {/* Demo button */}
      <Button
        size="xl"
        onClick={handleSimulateScan}
        disabled={isScanning}
        className="mb-6 gap-3"
      >
        <Sparkles className="w-5 h-5" />
        {isScanning ? "Scanning..." : "Simulate Scan"}
      </Button>

      {/* Manual check-in option */}
      <div className="flex items-center gap-4 text-muted-foreground">
        <div className="h-px w-20 bg-border" />
        <span className="text-sm">or</span>
        <div className="h-px w-20 bg-border" />
      </div>

      <Button
        variant="ghost"
        size="lg"
        onClick={() => setView("manual_search")}
        className="mt-4 gap-2"
      >
        <Keyboard className="w-5 h-5" />
        Find My Booking
      </Button>
    </div>
  );

  const renderManualSearch = () => (
    <div className="flex-1 flex flex-col p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={resetToScanner}>
          <X className="w-6 h-6" />
        </Button>
        <h2 className="text-2xl font-semibold">Find Your Booking</h2>
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone number..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-12 h-14 text-lg"
          autoFocus
        />
      </div>

      {/* Search results */}
      <ScrollArea className="flex-1">
        <div className="space-y-3">
          {searchResults.length > 0 ? (
            searchResults.map((member) => (
              <Card
                key={member.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleMemberSelect(member)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={member.photo} />
                    <AvatarFallback className="text-lg">
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="text-muted-foreground">{member.phone}</p>
                  </div>
                  {member.bookings.length > 0 ? (
                    <div className="text-right">
                      <p className="font-medium">{member.bookings[0].className}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.bookings[0].time}
                      </p>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      No bookings
                    </Badge>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))
          ) : searchQuery.length >= 2 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No members found</p>
              <p className="text-sm">Try a different name or phone number</p>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Keyboard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Start typing to search</p>
              <p className="text-sm">Enter your name or phone number</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const renderClassDetail = () => {
    if (!selectedClass) return null;

    const attendees = mockClassAttendees[selectedClass.id] || [];

    return (
      <div className="flex-1 flex flex-col p-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={resetToScanner}>
            <X className="w-6 h-6" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">{selectedClass.name}</h2>
            <p className="text-muted-foreground">
              {selectedClass.time} - {selectedClass.endTime} with {selectedClass.instructor}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="hover:scale-100">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{selectedClass.spotsBooked}</p>
              <p className="text-sm text-muted-foreground">Booked</p>
            </CardContent>
          </Card>
          <Card className="hover:scale-100">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-success">{selectedClass.checkedIn}</p>
              <p className="text-sm text-muted-foreground">Checked In</p>
            </CardContent>
          </Card>
          <Card className="hover:scale-100">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{selectedClass.spotsTotal - selectedClass.spotsBooked}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </CardContent>
          </Card>
        </div>

        <h3 className="font-semibold mb-4">Attendees</h3>
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {attendees.map((member) => {
              const booking = member.bookings.find((b) => b.classId === selectedClass.id);
              const isCheckedIn = booking?.checkedIn;

              return (
                <div
                  key={member.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl",
                    isCheckedIn ? "bg-success/10" : "bg-card"
                  )}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.photo} />
                    <AvatarFallback>
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">
                      {member.firstName} {member.lastName}
                    </p>
                  </div>
                  {isCheckedIn ? (
                    <Badge className="bg-success text-success-foreground">
                      <Check className="w-3 h-3 mr-1" />
                      Checked In
                    </Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>
              );
            })}
            {attendees.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No attendees yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      {/* Success animation */}
      <div className="relative mb-8">
        {/* Animated rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border-2 border-success/20 animate-ping" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-40 h-40 rounded-full border-2 border-success/30 animate-ping"
            style={{ animationDelay: "0.2s" }}
          />
        </div>

        {/* Main checkmark circle */}
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-success to-success/80 flex items-center justify-center shadow-lg">
          <Check className="w-16 h-16 text-success-foreground animate-[bounce_0.5s_ease-in-out]" />
        </div>
      </div>

      {/* Member info */}
      {checkedInMember && (
        <div className="text-center mb-8">
          <Avatar className="w-20 h-20 mx-auto mb-4 ring-4 ring-success/30">
            <AvatarImage src={checkedInMember.photo} />
            <AvatarFallback className="text-2xl">
              {checkedInMember.firstName[0]}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-3xl font-bold mb-2">
            Welcome, {checkedInMember.firstName}!
          </h2>
          {checkedInClass && (
            <div className="space-y-1">
              <p className="text-xl text-muted-foreground">{checkedInClass.className}</p>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{checkedInClass.room}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message */}
      <div className="text-center">
        <p className="text-2xl font-medium gradient-text">Enjoy your practice!</p>
      </div>

      {/* Auto-return indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <p className="text-sm text-muted-foreground animate-pulse">
          Returning to check-in in a few seconds...
        </p>
      </div>
    </div>
  );

  const renderError = () => {
    let icon = <AlertCircle className="w-16 h-16" />;
    let title = "";
    let message = "";
    let showBookNow = false;

    switch (errorType) {
      case "no_booking":
        icon = <Search className="w-16 h-16" />;
        title = "No Booking Found";
        message = "We couldn't find a booking for today. Would you like to book a class?";
        showBookNow = true;
        break;
      case "already_checked_in":
        icon = <Check className="w-16 h-16" />;
        title = "Already Checked In";
        message = `${selectedMember?.firstName}, you're already checked in for your class. Enjoy!`;
        break;
      case "early_arrival":
        icon = <Clock className="w-16 h-16" />;
        title = "You're Early!";
        message = `${selectedMember?.firstName}, your class doesn't start for a while. Feel free to wait in the lounge.`;
        break;
      default:
        title = "Something Went Wrong";
        message = "Please try again or ask staff for assistance.";
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Error icon */}
        <div className={cn(
          "w-32 h-32 rounded-full flex items-center justify-center mb-8",
          errorType === "already_checked_in"
            ? "bg-success/20 text-success"
            : errorType === "early_arrival"
            ? "bg-warning/20 text-warning"
            : "bg-destructive/20 text-destructive"
        )}>
          {icon}
        </div>

        {/* Message */}
        <div className="text-center mb-8 max-w-md">
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground text-lg">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {showBookNow && (
            <Button size="lg" className="gap-2">
              <CalendarPlus className="w-5 h-5" />
              Book a Class
            </Button>
          )}
          <Button
            variant={showBookNow ? "outline" : "default"}
            size="lg"
            onClick={resetToScanner}
            className="gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </Button>
        </div>
      </div>
    );
  };

  const renderClassesSidebar = () => (
    <div className="w-96 border-l border-border bg-card/50 flex flex-col">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold">Today's Classes</h3>
        <p className="text-sm text-muted-foreground">{formatDate(currentTime)}</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {mockTodayClasses.map((classItem) => (
            <Card
              key={classItem.id}
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50",
                classItem.status === "in_progress" && "border-primary/50 bg-primary/5"
              )}
              onClick={() => handleClassSelect(classItem)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{classItem.name}</h4>
                    <p className="text-sm text-muted-foreground">{classItem.instructor}</p>
                  </div>
                  {classItem.status === "in_progress" && (
                    <Badge className="bg-primary text-primary-foreground">
                      In Progress
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {classItem.time}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {classItem.room}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {classItem.spotsBooked}/{classItem.spotsTotal}
                    </span>
                  </div>
                  {classItem.spotsTotal - classItem.spotsBooked <= 3 && (
                    <Badge variant="outline" className="text-warning border-warning">
                      {classItem.spotsTotal - classItem.spotsBooked} spots left
                    </Badge>
                  )}
                </div>
                {/* Capacity bar */}
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      classItem.spotsBooked / classItem.spotsTotal > 0.9
                        ? "bg-warning"
                        : "bg-primary"
                    )}
                    style={{
                      width: `${(classItem.spotsBooked / classItem.spotsTotal) * 100}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-20 border-b border-border flex items-center justify-between px-8 bg-card/50 backdrop-blur">
        {/* Studio branding */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted">
            <img
              src={mockStudio.logo}
              alt={mockStudio.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{mockStudio.name}</h1>
            <p className="text-sm text-muted-foreground">Self Check-In</p>
          </div>
        </div>

        {/* Current time */}
        <div className="text-right">
          <p className="text-3xl font-bold gradient-text">{formatTime(currentTime)}</p>
          <p className="text-sm text-muted-foreground">{formatDate(currentTime)}</p>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main panel */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
          {view === "scanner" && renderScanner()}
          {view === "manual_search" && renderManualSearch()}
          {view === "class_detail" && renderClassDetail()}
          {view === "success" && renderSuccess()}
          {view === "error" && renderError()}
        </div>

        {/* Classes sidebar - hide on success/error screens */}
        {(view === "scanner" || view === "manual_search") && renderClassesSidebar()}
      </div>

      {/* Footer */}
      <footer className="h-12 border-t border-border flex items-center justify-center bg-card/30">
        <p className="text-sm text-muted-foreground">
          Need help? Ask our front desk team
        </p>
      </footer>
    </div>
  );
};

export default Kiosk;
