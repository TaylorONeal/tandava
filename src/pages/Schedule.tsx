import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClassCard } from "@/components/schedule/ClassCard";
import { WorkshopCard } from "@/components/schedule/WorkshopCard";
import { AppointmentCard } from "@/components/schedule/AppointmentCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

// Mock data
const mockClasses = [
  {
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
  },
  {
    id: "2",
    title: "Yin Yoga & Meditation",
    style: "Yin",
    level: "ALL" as const,
    isHeated: false,
    teacher: { name: "David Park", avatar: "" },
    startTime: "Today, 7:30 PM",
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
    startTime: "Tomorrow, 7:00 AM",
    duration: 60,
    location: "Main Studio",
    spotsLeft: 12,
    capacity: 20,
  },
  {
    id: "4",
    title: "Hot Power Yoga",
    style: "Power",
    level: "ADVANCED" as const,
    isHeated: true,
    teacher: { name: "Alex Rivera", avatar: "" },
    startTime: "Tomorrow, 12:00 PM",
    duration: 75,
    location: "Hot Room",
    spotsLeft: 0,
    capacity: 18,
  },
  {
    id: "5",
    title: "Gentle Stretch",
    style: "Hatha",
    level: "BEGINNER" as const,
    isHeated: false,
    teacher: { name: "Emma Thompson", avatar: "" },
    startTime: "Tomorrow, 5:00 PM",
    duration: 60,
    location: "Zen Room",
    spotsLeft: 10,
    capacity: 15,
  },
];

const mockWorkshops = [
  {
    id: "w1",
    title: "Inversions Workshop: Headstand & Handstand",
    description: "Master the foundations of inversions in this comprehensive workshop. Learn proper alignment, build strength, and overcome fear with expert guidance.",
    teacher: { name: "Maya Johnson", avatar: "" },
    startTime: "Saturday, Dec 7, 2:00 PM",
    duration: 180,
    location: "Main Studio",
    price: 75,
    spotsLeft: 6,
    capacity: 15,
    isSeries: false,
    tags: ["Inversions", "Advanced"],
  },
  {
    id: "w2",
    title: "Yoga for Runners: 3-Week Series",
    description: "A comprehensive series designed specifically for runners. Focus on hip flexibility, IT band release, and recovery techniques.",
    teacher: { name: "David Park", avatar: "" },
    startTime: "Starts Sunday, Dec 8, 10:00 AM",
    duration: 90,
    location: "Zen Room",
    price: 120,
    spotsLeft: 10,
    capacity: 20,
    isSeries: true,
    seriesParts: 3,
    tags: ["Athletes", "Flexibility"],
  },
];

const mockAppointments = [
  {
    id: "a1",
    type: "Private Yoga Session",
    description: "One-on-one session tailored to your needs and goals.",
    teacher: { name: "Maya Johnson", avatar: "" },
    startTime: "Today, 4:00 PM",
    duration: 60,
    location: "Private Room",
    price: 120,
    isBooked: false,
  },
  {
    id: "a2",
    type: "Thai Yoga Massage",
    description: "Traditional Thai bodywork combining passive stretching and pressure points.",
    teacher: { name: "David Park", avatar: "" },
    startTime: "Tomorrow, 2:00 PM",
    duration: 90,
    location: "Healing Room",
    price: 150,
    isBooked: false,
  },
  {
    id: "a3",
    type: "Yoga Therapy Consultation",
    description: "Assessment and personalized practice design for specific conditions.",
    teacher: { name: "Emma Thompson", avatar: "" },
    startTime: "Friday, 11:00 AM",
    duration: 75,
    location: "Private Room",
    price: 95,
    isBooked: true,
  },
];

const filters = {
  styles: ["All Styles", "Vinyasa", "Yin", "Hatha", "Power", "Restorative"],
  levels: ["All Levels", "Beginner", "Intermediate", "Advanced"],
  locations: ["All Locations", "Main Studio", "Hot Room", "Zen Room"],
  teachers: ["All Teachers", "Maya Johnson", "David Park", "Sarah Lee", "Alex Rivera", "Emma Thompson"],
};

const Schedule = () => {
  const [activeTab, setActiveTab] = useState("classes");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const handleBook = (id: string) => {
    console.log("Booking:", id);
  };

  const clearFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter((f) => f !== filter));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground mt-1">
            Browse and book classes, workshops, and appointments
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList className="grid w-full sm:w-auto grid-cols-3">
              <TabsTrigger value="classes" className="px-6">Classes</TabsTrigger>
              <TabsTrigger value="workshops" className="px-6">Workshops</TabsTrigger>
              <TabsTrigger value="appointments" className="px-6">Appointments</TabsTrigger>
            </TabsList>

            {/* View toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "calendar" ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("calendar")}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classes, teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  {filters.styles.map((style) => (
                    <SelectItem key={style} value={style.toLowerCase()}>
                      {style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {filters.levels.map((level) => (
                    <SelectItem key={level} value={level.toLowerCase()}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeFilters.map((filter) => (
                <Badge key={filter} variant="secondary" className="gap-1 pr-1">
                  {filter}
                  <button
                    onClick={() => clearFilter(filter)}
                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setActiveFilters([])}
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Classes Tab */}
          <TabsContent value="classes" className="mt-0">
            {viewMode === "list" ? (
              <div className="space-y-4">
                {mockClasses.map((classItem) => (
                  <ClassCard key={classItem.id} {...classItem} onBook={handleBook} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Calendar view coming soon</p>
              </div>
            )}
          </TabsContent>

          {/* Workshops Tab */}
          <TabsContent value="workshops" className="mt-0">
            <div className="space-y-4">
              {mockWorkshops.map((workshop) => (
                <WorkshopCard key={workshop.id} {...workshop} onBook={handleBook} />
              ))}
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="mt-0">
            <div className="space-y-4">
              {mockAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} {...appointment} onBook={handleBook} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Schedule;