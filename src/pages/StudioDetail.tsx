import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClassCard } from "@/components/schedule/ClassCard";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Globe,
  Heart,
  Share2,
  ChevronLeft,
} from "lucide-react";

// Mock studio data
const studioData = {
  id: "s1",
  name: "Lotus Flow Studio",
  description: "A tranquil sanctuary in the heart of downtown offering vinyasa, yin, and meditation classes. Our beautiful natural light studio features city views and top-of-the-line equipment. We believe yoga is for everyone and offer classes for all levels.",
  imageUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80",
  galleryImages: [
    "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
    "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&q=80",
  ],
  location: {
    address: "123 Market Street, Suite 400",
    neighborhood: "Downtown",
    city: "San Francisco",
    state: "CA",
    zip: "94102",
  },
  contact: {
    phone: "(415) 555-0123",
    website: "https://lotusflowstudio.com",
  },
  hours: {
    weekday: "6:00 AM - 9:00 PM",
    weekend: "8:00 AM - 6:00 PM",
  },
  rating: 4.9,
  reviewCount: 342,
  styles: ["Vinyasa", "Yin", "Meditation", "Restorative"],
  amenities: ["Showers", "Mat Rental", "Props Provided", "Filtered Water", "Changing Rooms", "Retail Shop"],
};

const studioClasses = [
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
];

const studioInstructors = [
  {
    id: "t1",
    name: "Maya Johnson",
    bio: "E-RYT 500 specializing in dynamic vinyasa and arm balances. 15+ years teaching experience.",
    specialties: ["Vinyasa", "Inversions", "Arm Balances"],
    rating: 4.9,
    reviewCount: 456,
    classCount: 2340,
    studios: ["Lotus Flow Studio"],
  },
  {
    id: "t2",
    name: "David Park",
    bio: "Yin yoga and meditation teacher. Trained in Thailand with a focus on mindfulness.",
    specialties: ["Yin", "Meditation", "Restorative"],
    rating: 4.8,
    reviewCount: 312,
    classCount: 1890,
    studios: ["Lotus Flow Studio"],
  },
];

const StudioDetail = () => {
  const { id } = useParams();
  const [isFavorite, setIsFavorite] = useState(false);

  const handleBook = (classId: string) => {
    console.log("Booking class:", classId);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back link */}
        <Link
          to="/studios"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to studios
        </Link>

        {/* Hero Image */}
        <div className="relative rounded-xl overflow-hidden aspect-[3/1]">
          <img
            src={studioData.imageUrl}
            alt={studioData.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Actions overlay */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="bg-background/80 backdrop-blur-sm"
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-destructive text-destructive" : ""}`} />
            </Button>
            <Button variant="secondary" size="icon" className="bg-background/80 backdrop-blur-sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Studio name overlay */}
          <div className="absolute bottom-6 left-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              {studioData.styles.slice(0, 3).map((style) => (
                <Badge key={style} variant="secondary" className="bg-background/80 backdrop-blur-sm">
                  {style}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl font-bold">{studioData.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span className="font-medium">{studioData.rating}</span>
                <span className="opacity-80">({studioData.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1 opacity-80">
                <MapPin className="h-4 w-4" />
                {studioData.location.neighborhood}, {studioData.location.city}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="classes" className="w-full">
              <TabsList>
                <TabsTrigger value="classes">Schedule</TabsTrigger>
                <TabsTrigger value="instructors">Instructors</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="classes" className="mt-6 space-y-4">
                {studioClasses.map((classItem) => (
                  <ClassCard key={classItem.id} {...classItem} onBook={handleBook} />
                ))}
              </TabsContent>

              <TabsContent value="instructors" className="mt-6 space-y-4">
                {studioInstructors.map((instructor) => (
                  <InstructorCard key={instructor.id} {...instructor} />
                ))}
              </TabsContent>

              <TabsContent value="about" className="mt-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-muted-foreground">{studioData.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Styles Offered</h3>
                  <div className="flex flex-wrap gap-2">
                    {studioData.styles.map((style) => (
                      <Badge key={style} variant="secondary">{style}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {studioData.amenities.map((amenity) => (
                      <Badge key={amenity} variant="outline">{amenity}</Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <p>Reviews coming soon</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right column - Info card */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-5 shadow-card space-y-4">
              <h3 className="font-semibold">Location & Hours</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>{studioData.location.address}</p>
                    <p className="text-muted-foreground">
                      {studioData.location.city}, {studioData.location.state} {studioData.location.zip}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>Mon-Fri: {studioData.hours.weekday}</p>
                    <p>Sat-Sun: {studioData.hours.weekend}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${studioData.contact.phone}`} className="hover:text-primary">
                    {studioData.contact.phone}
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={studioData.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    Visit website
                  </a>
                </div>
              </div>

              <Button className="w-full">View All Classes</Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default StudioDetail;
