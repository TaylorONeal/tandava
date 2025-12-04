import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClassTypeCard } from "@/components/ondemand/ClassTypeCard";
import { SubscriptionCard } from "@/components/ondemand/SubscriptionCard";
import { OnDemandClassCard } from "@/components/ondemand/OnDemandClassCard";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Flame,
  Leaf,
  Moon,
  Zap,
  Heart,
  Wind,
  Search,
  Filter,
  X,
  ChevronRight,
} from "lucide-react";

// Mock data
const classTypes = [
  {
    id: "vinyasa",
    title: "Vinyasa Flow",
    description: "Dynamic, breath-linked movement to build heat and strength",
    icon: Flame,
    color: "primary" as const,
    classCount: 48,
  },
  {
    id: "yin",
    title: "Yin & Restore",
    description: "Deep stretches and relaxation for flexibility and calm",
    icon: Moon,
    color: "lilac" as const,
    classCount: 32,
  },
  {
    id: "power",
    title: "Power Yoga",
    description: "Challenging sequences to build muscle and endurance",
    icon: Zap,
    color: "peach" as const,
    classCount: 24,
  },
  {
    id: "meditation",
    title: "Meditation",
    description: "Guided practices for mindfulness and inner peace",
    icon: Leaf,
    color: "mint" as const,
    classCount: 56,
  },
  {
    id: "breathwork",
    title: "Breathwork",
    description: "Pranayama techniques for energy and stress relief",
    icon: Wind,
    color: "lilac" as const,
    classCount: 18,
  },
  {
    id: "selfcare",
    title: "Self-Care",
    description: "Gentle practices for recovery and self-compassion",
    icon: Heart,
    color: "peach" as const,
    classCount: 28,
  },
];

const subscriptionOptions = [
  {
    type: "individual" as const,
    title: "Single Class",
    price: 12,
    priceUnit: "class",
    description: "Purchase individual on-demand classes",
    features: [
      "Access to one class forever",
      "Download for offline viewing",
      "Track your progress",
    ],
  },
  {
    type: "studio" as const,
    title: "Studio Pass",
    price: 19,
    priceUnit: "month",
    description: "Unlimited access to one studio's library",
    features: [
      "All classes from one studio",
      "New classes added weekly",
      "Exclusive studio content",
      "Cancel anytime",
    ],
  },
  {
    type: "series" as const,
    title: "Series Bundle",
    price: 49,
    priceUnit: "series",
    description: "Complete multi-class programs",
    features: [
      "Full program access",
      "Structured learning path",
      "Progress tracking",
      "Completion certificate",
    ],
  },
  {
    type: "unlimited" as const,
    title: "Unlimited",
    price: 29,
    priceUnit: "month",
    description: "Everything, everywhere, always",
    features: [
      "All studios & instructors",
      "Entire on-demand library",
      "New content daily",
      "Offline downloads",
      "Priority support",
    ],
    isPopular: true,
  },
];

const onDemandClasses = [
  {
    id: "od1",
    title: "Morning Energy Flow",
    style: "Vinyasa",
    level: "ALL" as const,
    teacher: { name: "Maya Johnson" },
    duration: 30,
    thumbnailUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
    progress: 65,
  },
  {
    id: "od2",
    title: "Deep Hip Opening",
    style: "Yin",
    level: "BEGINNER" as const,
    teacher: { name: "David Park" },
    duration: 45,
    thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400",
    progress: 100,
    isCompleted: true,
  },
  {
    id: "od3",
    title: "Power Hour Challenge",
    style: "Power",
    level: "ADVANCED" as const,
    teacher: { name: "Alex Rivera" },
    duration: 60,
    thumbnailUrl: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400",
    progress: 0,
  },
  {
    id: "od4",
    title: "Stress Relief Meditation",
    style: "Meditation",
    level: "ALL" as const,
    teacher: { name: "Emma Thompson" },
    duration: 15,
    thumbnailUrl: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400",
    progress: 30,
  },
  {
    id: "od5",
    title: "Evening Wind Down",
    style: "Restorative",
    level: "ALL" as const,
    teacher: { name: "Sarah Lee" },
    duration: 40,
    thumbnailUrl: "https://images.unsplash.com/photo-1510894347713-fc3ed6fdf539?w=400",
    progress: 0,
  },
  {
    id: "od6",
    title: "Core Strength Flow",
    style: "Vinyasa",
    level: "INTERMEDIATE" as const,
    teacher: { name: "Maya Johnson" },
    duration: 35,
    thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    progress: 0,
  },
];

const OnDemand = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<typeof onDemandClasses[0] | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const handleClassClick = (classItem: typeof onDemandClasses[0]) => {
    setSelectedClass(classItem);
    setIsPlayerOpen(true);
  };

  const filteredClasses = onDemandClasses.filter((c) => {
    const matchesType = !selectedType || c.style.toLowerCase() === selectedType;
    const matchesSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacher.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <AppLayout>
      <div className="space-y-10">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="lilac" className="mb-4">On-Demand</Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Practice Anytime, Anywhere
          </h1>
          <p className="text-lg text-muted-foreground">
            Hundreds of classes from world-class teachers. Your progress syncs across all your devices.
          </p>
        </div>

        {/* Class Types Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Explore by Style</h2>
            {selectedType && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedType(null)}
                className="text-muted-foreground"
              >
                Clear filter
                <X className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {classTypes.map((type) => (
              <ClassTypeCard
                key={type.id}
                {...type}
                onClick={() => setSelectedType(type.id === selectedType ? null : type.id)}
                isSelected={type.id === selectedType}
              />
            ))}
          </div>
        </section>

        {/* Tabs: Browse / My Library */}
        <Tabs defaultValue="browse" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="browse">Browse All</TabsTrigger>
              <TabsTrigger value="continue">Continue Watching</TabsTrigger>
              <TabsTrigger value="saved">My Library</TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <TabsContent value="browse" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredClasses.map((classItem) => (
                <OnDemandClassCard
                  key={classItem.id}
                  {...classItem}
                  onClick={() => handleClassClick(classItem)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="continue" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {onDemandClasses
                .filter((c) => c.progress > 0 && !c.isCompleted)
                .map((classItem) => (
                  <OnDemandClassCard
                    key={classItem.id}
                    {...classItem}
                    onClick={() => handleClassClick(classItem)}
                  />
                ))}
            </div>
            {onDemandClasses.filter((c) => c.progress > 0 && !c.isCompleted).length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No classes in progress</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {onDemandClasses
                .filter((c) => c.isCompleted)
                .map((classItem) => (
                  <OnDemandClassCard
                    key={classItem.id}
                    {...classItem}
                    onClick={() => handleClassClick(classItem)}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Subscription Options */}
        <section className="py-10 border-t">
          <div className="text-center mb-8">
            <Badge variant="mint" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl font-bold mb-3">Choose Your Access</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              From single classes to unlimited access – find the plan that fits your practice.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {subscriptionOptions.map((option) => (
              <SubscriptionCard
                key={option.type}
                {...option}
                onSelect={() => console.log("Selected:", option.type)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Video Player Modal */}
      <Dialog open={isPlayerOpen} onOpenChange={setIsPlayerOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedClass && (
            <div>
              <VideoPlayer
                videoId={selectedClass.id}
                title={selectedClass.title}
                thumbnailUrl={selectedClass.thumbnailUrl}
                videoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                duration={selectedClass.duration * 60}
                initialProgress={selectedClass.progress}
              />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="lilac">{selectedClass.style}</Badge>
                  <Badge variant="mint">{selectedClass.level}</Badge>
                </div>
                <h3 className="text-xl font-bold">{selectedClass.title}</h3>
                <p className="text-muted-foreground">
                  with {selectedClass.teacher.name} • {selectedClass.duration} min
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default OnDemand;
