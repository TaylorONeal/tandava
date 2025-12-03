import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClassCard } from "@/components/schedule/ClassCard";
import { StudioCard } from "@/components/studio/StudioCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Star,
  Calendar,
  Clock,
  Users,
  Heart,
  Share2,
  ChevronLeft,
  Award,
} from "lucide-react";

// Mock instructor data
const instructorData = {
  id: "t1",
  name: "Maya Johnson",
  avatar: "",
  tagline: "Finding strength through movement",
  bio: "Maya is an E-RYT 500 yoga teacher with over 15 years of teaching experience. She specializes in dynamic vinyasa flows with a focus on arm balances and inversions. Her classes are known for creative sequencing, hands-on adjustments, and a supportive environment that encourages students to explore their edge.\n\nMaya began her yoga journey in 2005 after a career in dance. She completed her 200-hour training at Yoga Works and went on to complete her 500-hour certification with Jason Crandell. She has since studied with renowned teachers including Kathryn Budig and Dylan Werner.\n\nWhen not teaching, Maya leads international retreats and workshops, sharing her passion for yoga with students around the world.",
  specialties: ["Vinyasa", "Inversions", "Arm Balances", "Power Yoga"],
  certifications: ["E-RYT 500", "YACEP", "Inversion Specialist"],
  rating: 4.9,
  reviewCount: 456,
  classCount: 2340,
  studentCount: 1890,
  experience: "15+ years",
};

const instructorClasses = [
  {
    id: "1",
    title: "Power Vinyasa Flow",
    style: "Vinyasa",
    level: "INTERMEDIATE" as const,
    isHeated: true,
    teacher: { name: "Maya Johnson", avatar: "" },
    startTime: "Today, 6:00 PM",
    duration: 60,
    location: "Lotus Flow Studio",
    spotsLeft: 4,
    capacity: 20,
  },
  {
    id: "2",
    title: "Arm Balance Workshop",
    style: "Workshop",
    level: "ADVANCED" as const,
    isHeated: false,
    teacher: { name: "Maya Johnson", avatar: "" },
    startTime: "Saturday, 2:00 PM",
    duration: 120,
    location: "Lotus Flow Studio",
    spotsLeft: 6,
    capacity: 15,
  },
];

const instructorStudios = [
  {
    id: "s1",
    name: "Lotus Flow Studio",
    description: "A tranquil sanctuary in the heart of downtown.",
    imageUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80",
    location: { neighborhood: "Downtown", city: "San Francisco" },
    rating: 4.9,
    reviewCount: 342,
    styles: ["Vinyasa", "Yin"],
    classesToday: 12,
  },
  {
    id: "s2",
    name: "Hot Yoga Collective",
    description: "Heated classes in a modern industrial space.",
    imageUrl: "https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?w=800&q=80",
    location: { neighborhood: "SoMa", city: "San Francisco" },
    rating: 4.8,
    reviewCount: 218,
    styles: ["Hot Yoga", "Power"],
    classesToday: 8,
  },
];

const InstructorDetail = () => {
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
          to="/instructors"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to instructors
        </Link>

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Avatar className="h-32 w-32 flex-shrink-0">
            <AvatarImage src={instructorData.avatar} alt={instructorData.name} />
            <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
              {instructorData.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{instructorData.name}</h1>
                <p className="text-muted-foreground text-lg">{instructorData.tagline}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? "fill-destructive text-destructive" : ""}`} />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Rating and stats */}
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-warning text-warning" />
                <span className="font-semibold">{instructorData.rating}</span>
                <span className="text-muted-foreground">({instructorData.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{instructorData.classCount.toLocaleString()} classes taught</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{instructorData.studentCount.toLocaleString()} students</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{instructorData.experience} experience</span>
              </div>
            </div>

            {/* Specialties */}
            <div className="flex flex-wrap gap-2 mt-4">
              {instructorData.specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary">{specialty}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <Tabs defaultValue="classes" className="w-full">
          <TabsList>
            <TabsTrigger value="classes">Upcoming Classes</TabsTrigger>
            <TabsTrigger value="studios">Studios</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="mt-6 space-y-4">
            {instructorClasses.map((classItem) => (
              <ClassCard key={classItem.id} {...classItem} onBook={handleBook} />
            ))}
          </TabsContent>

          <TabsContent value="studios" className="mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {instructorStudios.map((studio) => (
                <StudioCard key={studio.id} {...studio} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="about" className="mt-6 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Bio</h3>
                <div className="text-muted-foreground whitespace-pre-line">
                  {instructorData.bio}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Certifications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {instructorData.certifications.map((cert) => (
                    <Badge key={cert} variant="outline">{cert}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="text-center py-12 text-muted-foreground">
              <p>Reviews coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default InstructorDetail;
