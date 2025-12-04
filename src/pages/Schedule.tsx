import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClassCard } from "@/components/schedule/ClassCard";
import { WorkshopCard } from "@/components/schedule/WorkshopCard";
import { AppointmentCard } from "@/components/schedule/AppointmentCard";
import { RetreatCard } from "@/components/schedule/RetreatCard";
import { ClassDetailModal } from "@/components/schedule/ClassDetailModal";
import { BookingModal } from "@/components/booking/BookingModal";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import {
  Calendar,
  List,
  Search,
  SlidersHorizontal,
  X,
  Plane,
  Play,
} from "lucide-react";

// Mock data with enhanced class descriptions
const mockClasses = [
  {
    id: "1",
    title: "Power Vinyasa Flow",
    style: "Vinyasa",
    level: "INTERMEDIATE" as const,
    isHeated: true,
    description: "A dynamic, energizing practice that links breath with movement. Expect sun salutations, standing poses, and creative sequences that build heat and strength.",
    benefits: ["Builds strength and flexibility", "Improves cardiovascular health", "Reduces stress"],
    whatToBring: ["Yoga mat", "Water bottle", "Towel"],
    teacher: { id: "t1", name: "Maya Johnson", avatar: "", bio: "E-RYT 500 with 15+ years experience", rating: 4.9 },
    studio: { id: "s1", name: "Lotus Flow Studio", location: "Downtown, SF" },
    startTime: "Today, 6:00 PM",
    duration: 60,
    location: "Lotus Flow Studio",
    spotsLeft: 4,
    capacity: 20,
  },
  {
    id: "2",
    title: "Yin Yoga & Meditation",
    style: "Yin",
    level: "ALL" as const,
    isHeated: false,
    description: "A slow-paced style of yoga with poses held for longer periods. Perfect for deep stretching and mindfulness practice.",
    benefits: ["Deep tissue release", "Improved flexibility", "Calming for the nervous system"],
    whatToBring: ["Yoga mat", "Blanket or bolster"],
    teacher: { id: "t2", name: "David Park", avatar: "", bio: "Yin yoga specialist, trained in Thailand", rating: 4.8 },
    studio: { id: "s1", name: "Lotus Flow Studio", location: "Downtown, SF" },
    startTime: "Today, 7:30 PM",
    duration: 75,
    location: "Lotus Flow Studio",
    spotsLeft: 8,
    capacity: 15,
  },
  {
    id: "3",
    title: "Morning Flow",
    style: "Vinyasa",
    level: "BEGINNER" as const,
    isHeated: false,
    description: "Start your day with an accessible, uplifting flow. Perfect for beginners or anyone wanting a gentler morning practice.",
    benefits: ["Gentle wake-up for the body", "Sets positive tone for the day"],
    whatToBring: ["Yoga mat"],
    teacher: { id: "t3", name: "Sarah Lee", avatar: "", bio: "Beginner-friendly specialist", rating: 4.7 },
    studio: { id: "s2", name: "Hot Yoga Collective", location: "SoMa, SF" },
    startTime: "Tomorrow, 7:00 AM",
    duration: 60,
    location: "Hot Yoga Collective",
    spotsLeft: 12,
    capacity: 20,
  },
  {
    id: "4",
    title: "Hot Power Yoga",
    style: "Power",
    level: "ADVANCED" as const,
    isHeated: true,
    description: "An intense, athletic practice in a heated room. Expect challenging sequences, arm balances, and inversions.",
    benefits: ["Maximum calorie burn", "Builds serious strength", "Detoxifying heat"],
    whatToBring: ["Yoga mat", "Large towel", "Lots of water"],
    teacher: { id: "t4", name: "Alex Rivera", avatar: "", bio: "Former athlete, power yoga specialist", rating: 4.9 },
    studio: { id: "s2", name: "Hot Yoga Collective", location: "SoMa, SF" },
    startTime: "Tomorrow, 12:00 PM",
    duration: 75,
    location: "Hot Yoga Collective",
    spotsLeft: 0,
    capacity: 18,
  },
  {
    id: "5",
    title: "Gentle Stretch",
    style: "Hatha",
    level: "BEGINNER" as const,
    isHeated: false,
    description: "A relaxing class focused on gentle stretches and relaxation. Perfect for stress relief and recovery days.",
    benefits: ["Stress relief", "Gentle on joints", "Promotes relaxation"],
    whatToBring: ["Yoga mat", "Blanket"],
    teacher: { id: "t5", name: "Emma Thompson", avatar: "", bio: "Restorative yoga teacher", rating: 4.8 },
    studio: { id: "s3", name: "Zen Garden Yoga", location: "Pacific Heights, SF" },
    startTime: "Tomorrow, 5:00 PM",
    duration: 60,
    location: "Zen Garden Yoga",
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
    location: "Lotus Flow Studio",
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
    location: "Zen Garden Yoga",
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
    location: "Lotus Flow Studio",
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
    location: "Zen Garden Yoga",
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
    location: "Zen Garden Yoga",
    price: 95,
    isBooked: true,
  },
];

const mockRetreats = [
  {
    id: "r1",
    title: "7-Day Transformation Retreat",
    description: "Immerse yourself in daily yoga, meditation, and wellness practices surrounded by Bali's natural beauty. Includes accommodation, meals, and excursions.",
    imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    destination: "Ubud",
    country: "Bali, Indonesia",
    startDate: "Mar 15",
    endDate: "Mar 22",
    duration: "7 nights",
    price: 2499,
    spotsLeft: 8,
    capacity: 16,
    teachers: [{ name: "Maya Johnson" }, { name: "David Park" }],
    tags: ["Vinyasa", "Meditation", "Spa", "All-Inclusive"],
  },
  {
    id: "r2",
    title: "Jungle Wellness Escape",
    description: "A transformative journey combining yoga, surf, and adventure in the Costa Rican rainforest. Daily practices, optional surf lessons, and jungle excursions.",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    destination: "Nosara",
    country: "Costa Rica",
    startDate: "Apr 5",
    endDate: "Apr 12",
    duration: "7 nights",
    price: 1899,
    spotsLeft: 4,
    capacity: 12,
    teachers: [{ name: "Alex Rivera" }],
    tags: ["Vinyasa", "Surf", "Adventure", "Nature"],
  },
  {
    id: "r3",
    title: "Mediterranean Mindfulness",
    description: "Combine ancient yoga traditions with Mediterranean culture. Practice overlooking the Aegean Sea, explore historic sites, and enjoy Greek cuisine.",
    imageUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80",
    destination: "Santorini",
    country: "Greece",
    startDate: "May 20",
    endDate: "May 27",
    duration: "7 nights",
    price: 2799,
    spotsLeft: 10,
    capacity: 14,
    teachers: [{ name: "Emma Thompson" }],
    tags: ["Hatha", "Meditation", "Culture", "Wellness"],
  },
];

const filters = {
  styles: ["All Styles", "Vinyasa", "Yin", "Hatha", "Power", "Restorative"],
  levels: ["All Levels", "Beginner", "Intermediate", "Advanced"],
  studios: ["All Studios", "Lotus Flow Studio", "Hot Yoga Collective", "Zen Garden Yoga"],
  teachers: ["All Teachers", "Maya Johnson", "David Park", "Sarah Lee", "Alex Rivera", "Emma Thompson"],
};

// Mock on-demand classes
const mockOnDemandClasses = [
  {
    id: "od1",
    title: "Morning Energy Flow (On-Demand)",
    style: "Vinyasa",
    level: "ALL" as const,
    isHeated: false,
    isOnDemand: true,
    teacher: { id: "t1", name: "Maya Johnson", avatar: "" },
    duration: 30,
    thumbnailUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
  },
  {
    id: "od2",
    title: "Deep Hip Opening (On-Demand)",
    style: "Yin",
    level: "BEGINNER" as const,
    isHeated: false,
    isOnDemand: true,
    teacher: { id: "t2", name: "David Park", avatar: "" },
    duration: 45,
    thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400",
  },
];

const Schedule = () => {
  const [activeTab, setActiveTab] = useState("classes");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<typeof mockClasses[0] | null>(null);
  const [classDetailOpen, setClassDetailOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [showOnDemand, setShowOnDemand] = useState(false);

  const handleBook = (id: string) => {
    const classItem = mockClasses.find(c => c.id === id);
    if (classItem) {
      setSelectedClass(classItem);
      setClassDetailOpen(true);
    } else {
      console.log("Booking:", id);
    }
  };

  const handleOpenBookingModal = () => {
    setClassDetailOpen(false);
    setBookingModalOpen(true);
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
            Browse classes, workshops, appointments, and retreats across all studios
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList className="grid w-full sm:w-auto grid-cols-4">
              <TabsTrigger value="classes" className="px-4">Classes</TabsTrigger>
              <TabsTrigger value="workshops" className="px-4">Workshops</TabsTrigger>
              <TabsTrigger value="appointments" className="px-4">Appointments</TabsTrigger>
              <TabsTrigger value="retreats" className="px-4 gap-1">
                <Plane className="h-3.5 w-3.5" />
                Retreats
              </TabsTrigger>
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
                placeholder="Search classes, teachers, studios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Studio" />
                </SelectTrigger>
                <SelectContent>
                  {filters.studios.map((studio) => (
                    <SelectItem key={studio} value={studio.toLowerCase()}>
                      {studio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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

              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* On-Demand Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-lilac/20 border border-lilac/30 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-lilac flex items-center justify-center">
                <Play className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <Label htmlFor="ondemand-toggle" className="font-semibold cursor-pointer">
                  Include On-Demand Classes
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show recordings you can watch anytime
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="ondemand-toggle"
                checked={showOnDemand}
                onCheckedChange={setShowOnDemand}
              />
              <Link to="/on-demand">
                <Button variant="outline" size="sm">
                  Browse Library
                </Button>
              </Link>
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
                
                {/* On-Demand Classes Section */}
                {showOnDemand && (
                  <>
                    <div className="flex items-center gap-2 pt-4 pb-2">
                      <Badge variant="lilac" className="gap-1">
                        <Play className="h-3 w-3" />
                        On-Demand
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Watch anytime, progress syncs across devices
                      </span>
                    </div>
                    {mockOnDemandClasses.map((classItem) => (
                      <Link
                        key={classItem.id}
                        to="/on-demand"
                        className="block rounded-2xl border bg-card p-4 shadow-card transition-all hover:shadow-card-hover"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={classItem.thumbnailUrl}
                              alt={classItem.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-foreground/30 flex items-center justify-center">
                              <Play className="h-6 w-6 text-background" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="lilac">On-Demand</Badge>
                              <Badge variant="mint">{classItem.style}</Badge>
                            </div>
                            <h3 className="font-semibold truncate">{classItem.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {classItem.teacher.name} • {classItem.duration} min
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
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

          {/* Retreats Tab */}
          <TabsContent value="retreats" className="mt-0">
            <div className="grid md:grid-cols-2 gap-6">
              {mockRetreats.map((retreat) => (
                <RetreatCard key={retreat.id} {...retreat} onBook={handleBook} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Class Detail Modal */}
      <ClassDetailModal
        open={classDetailOpen}
        onOpenChange={setClassDetailOpen}
        classData={selectedClass}
        onBook={handleOpenBookingModal}
      />

      {/* Booking Modal */}
      {selectedClass && (
        <BookingModal
          open={bookingModalOpen}
          onOpenChange={setBookingModalOpen}
          booking={{
            id: selectedClass.id,
            type: "class",
            title: selectedClass.title,
            style: selectedClass.style,
            teacher: selectedClass.teacher.name,
            studio: selectedClass.studio.name,
            location: selectedClass.studio.location,
            dateTime: selectedClass.startTime,
            duration: selectedClass.duration,
            spotsLeft: selectedClass.spotsLeft,
            dropInPriceCents: 2500, // $25 drop-in
            cancellationMinutes: 120,
          }}
        />
      )}
    </AppLayout>
  );
};

export default Schedule;
