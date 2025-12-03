import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StudioCard } from "@/components/studio/StudioCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";

const mockStudios = [
  {
    id: "s1",
    name: "Lotus Flow Studio",
    description: "A tranquil sanctuary in the heart of downtown offering vinyasa, yin, and meditation classes. Beautiful natural light studio with city views.",
    imageUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80",
    location: { neighborhood: "Downtown", city: "San Francisco" },
    rating: 4.9,
    reviewCount: 342,
    styles: ["Vinyasa", "Yin", "Meditation"],
    classesToday: 12,
  },
  {
    id: "s2",
    name: "Hot Yoga Collective",
    description: "Heated classes in a modern industrial space. Challenging flows and deep stretches. State-of-the-art heating and ventilation systems.",
    imageUrl: "https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?w=800&q=80",
    location: { neighborhood: "SoMa", city: "San Francisco" },
    rating: 4.8,
    reviewCount: 218,
    styles: ["Hot Yoga", "Power", "Vinyasa"],
    classesToday: 8,
  },
  {
    id: "s3",
    name: "Zen Garden Yoga",
    description: "Traditional yoga practices with meditation and breathwork in a serene garden setting. Rooftop outdoor practice space available.",
    imageUrl: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&q=80",
    location: { neighborhood: "Pacific Heights", city: "San Francisco" },
    rating: 4.9,
    reviewCount: 156,
    styles: ["Hatha", "Meditation", "Restorative"],
    classesToday: 6,
  },
  {
    id: "s4",
    name: "Urban Asana",
    description: "Contemporary yoga for city dwellers. Quick lunch classes, early morning sessions, and weekend workshops for busy professionals.",
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
    location: { neighborhood: "Financial District", city: "San Francisco" },
    rating: 4.7,
    reviewCount: 289,
    styles: ["Vinyasa", "Power", "Express"],
    classesToday: 10,
  },
  {
    id: "s5",
    name: "Breathe Yoga Berkeley",
    description: "Community-focused studio with sliding scale pricing. Diverse class offerings from beginner to advanced. Inclusive and welcoming environment.",
    imageUrl: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&q=80",
    location: { neighborhood: "Downtown", city: "Berkeley" },
    rating: 4.8,
    reviewCount: 412,
    styles: ["Vinyasa", "Hatha", "Community"],
    classesToday: 9,
  },
  {
    id: "s6",
    name: "Oakland Yoga Shala",
    description: "Authentic yoga in a converted warehouse space. Focus on traditional Ashtanga and Mysore-style practices with experienced teachers.",
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
    location: { neighborhood: "Jack London Square", city: "Oakland" },
    rating: 4.9,
    reviewCount: 178,
    styles: ["Ashtanga", "Mysore", "Traditional"],
    classesToday: 5,
  },
];

const Studios = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Studios</h1>
          <p className="text-muted-foreground mt-1">
            Discover yoga studios in your area
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search studios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <MapPin className="h-4 w-4" />
              Near me
            </Button>

            <Select>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Styles</SelectItem>
                <SelectItem value="vinyasa">Vinyasa</SelectItem>
                <SelectItem value="hot">Hot Yoga</SelectItem>
                <SelectItem value="hatha">Hatha</SelectItem>
                <SelectItem value="ashtanga">Ashtanga</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="sf">San Francisco</SelectItem>
                <SelectItem value="oakland">Oakland</SelectItem>
                <SelectItem value="berkeley">Berkeley</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Studios Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockStudios.map((studio) => (
            <StudioCard key={studio.id} {...studio} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Studios;
