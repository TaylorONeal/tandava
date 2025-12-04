import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PromoVisual } from "@/components/video/PromoVisual";
import { Clock, MapPin, Users, Flame, Star, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface ClassDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData: {
    id: string;
    title: string;
    style: string;
    level: string;
    isHeated: boolean;
    description: string;
    benefits: string[];
    whatToBring: string[];
    promoGifUrl?: string;
    promoImageUrl?: string;
    teacher: {
      id: string;
      name: string;
      avatar?: string;
      bio: string;
      rating: number;
    };
    studio: {
      id: string;
      name: string;
      location: string;
    };
    startTime: string;
    duration: number;
    spotsLeft: number;
    capacity: number;
  } | null;
  onBook: () => void;
}

const levelVariants: Record<string, "beginner" | "allLevels" | "intermediate" | "advanced"> = {
  BEGINNER: "beginner",
  ALL: "allLevels",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
};

const levelLabels: Record<string, string> = {
  BEGINNER: "Beginner",
  ALL: "All Levels",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export function ClassDetailModal({
  open,
  onOpenChange,
  classData,
  onBook,
}: ClassDetailModalProps) {
  if (!classData) return null;

  const isFull = classData.spotsLeft === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="class">Class</Badge>
            <Badge variant={levelVariants[classData.level]}>
              {levelLabels[classData.level]}
            </Badge>
            {classData.isHeated && (
              <Badge variant="heated" className="gap-1">
                <Flame className="h-3 w-3" />
                Heated
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl">{classData.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{classData.style}</p>
        </DialogHeader>

        {/* Promo Visual */}
        {(classData.promoGifUrl || classData.promoImageUrl) && (
          <PromoVisual
            videoUrl={classData.promoGifUrl}
            imageUrl={classData.promoImageUrl}
            alt={classData.title}
            className="aspect-video -mx-6 -mt-2"
          />
        )}

        {/* Description */}
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {classData.description}
          </p>

          {/* Benefits */}
          {classData.benefits.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Benefits</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {classData.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What to bring */}
          {classData.whatToBring.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">What to Bring</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {classData.whatToBring.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* Teacher */}
          <Link
            to={`/instructors/${classData.teacher.id}`}
            className="flex items-center gap-3 p-3 -mx-3 rounded-lg hover:bg-muted transition-colors"
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={classData.teacher.avatar} alt={classData.teacher.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {classData.teacher.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium">{classData.teacher.name}</p>
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  <span>{classData.teacher.rating}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {classData.teacher.bio}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Separator />

          {/* Studio */}
          <Link
            to={`/studios/${classData.studio.id}`}
            className="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-muted transition-colors"
          >
            <div>
              <p className="font-medium">{classData.studio.name}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {classData.studio.location}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Separator />

          {/* Class details */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{classData.startTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">•</span>
                <span>{classData.duration} min</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className={isFull ? "text-destructive" : classData.spotsLeft <= 3 ? "text-warning" : ""}>
                {isFull ? "Full" : `${classData.spotsLeft} spots left`}
              </span>
            </div>
          </div>

          {/* Book button */}
          <Button
            className="w-full"
            size="lg"
            variant={isFull ? "outline" : "default"}
            onClick={onBook}
          >
            {isFull ? "Join Waitlist" : "Book Class"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
