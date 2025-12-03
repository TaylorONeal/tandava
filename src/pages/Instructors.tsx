import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";

const mockInstructors = [
  {
    id: "t1",
    name: "Maya Johnson",
    bio: "E-RYT 500 specializing in dynamic vinyasa and arm balances. 15+ years teaching experience. Known for creative sequencing and hands-on adjustments.",
    specialties: ["Vinyasa", "Inversions", "Arm Balances"],
    rating: 4.9,
    reviewCount: 456,
    classCount: 2340,
    studios: ["Lotus Flow Studio", "Hot Yoga Collective"],
  },
  {
    id: "t2",
    name: "David Park",
    bio: "Yin yoga and meditation teacher. Trained in Thailand with a focus on mindfulness and stillness. Brings a calming presence to every class.",
    specialties: ["Yin", "Meditation", "Restorative"],
    rating: 4.8,
    reviewCount: 312,
    classCount: 1890,
    studios: ["Lotus Flow Studio", "Zen Garden Yoga"],
  },
  {
    id: "t3",
    name: "Sarah Lee",
    bio: "Passionate about making yoga accessible to everyone. Specializes in beginner-friendly classes with clear instruction and modifications.",
    specialties: ["Beginner Yoga", "Hatha", "Gentle Flow"],
    rating: 4.7,
    reviewCount: 198,
    classCount: 980,
    studios: ["Hot Yoga Collective", "Urban Asana"],
  },
  {
    id: "t4",
    name: "Alex Rivera",
    bio: "Former professional athlete turned yoga teacher. Brings an athletic approach to power yoga with emphasis on strength and endurance.",
    specialties: ["Power Yoga", "Hot Yoga", "Athletic Flow"],
    rating: 4.9,
    reviewCount: 287,
    classCount: 1560,
    studios: ["Hot Yoga Collective"],
  },
  {
    id: "t5",
    name: "Emma Thompson",
    bio: "Therapeutic yoga specialist with a background in physical therapy. Expert in adapting poses for injuries and chronic conditions.",
    specialties: ["Yoga Therapy", "Restorative", "Chair Yoga"],
    rating: 4.8,
    reviewCount: 234,
    classCount: 1120,
    studios: ["Zen Garden Yoga"],
  },
  {
    id: "t6",
    name: "Marcus Chen",
    bio: "Ashtanga practitioner for 20 years. Studied in Mysore, India. Traditional approach with authentic lineage teachings.",
    specialties: ["Ashtanga", "Mysore", "Traditional"],
    rating: 4.9,
    reviewCount: 189,
    classCount: 2100,
    studios: ["Oakland Yoga Shala"],
  },
];

const Instructors = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instructors</h1>
          <p className="text-muted-foreground mt-1">
            Meet the teachers guiding your practice
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search instructors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                <SelectItem value="vinyasa">Vinyasa</SelectItem>
                <SelectItem value="yin">Yin</SelectItem>
                <SelectItem value="hot">Hot Yoga</SelectItem>
                <SelectItem value="meditation">Meditation</SelectItem>
                <SelectItem value="ashtanga">Ashtanga</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Studio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Studios</SelectItem>
                <SelectItem value="lotus">Lotus Flow Studio</SelectItem>
                <SelectItem value="hot">Hot Yoga Collective</SelectItem>
                <SelectItem value="zen">Zen Garden Yoga</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Instructors Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {mockInstructors.map((instructor) => (
            <InstructorCard key={instructor.id} {...instructor} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Instructors;
