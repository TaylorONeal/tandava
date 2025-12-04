import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, Users, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClassCardProps {
  id: string;
  title: string;
  style: string;
  level: "BEGINNER" | "ALL" | "INTERMEDIATE" | "ADVANCED";
  isHeated: boolean;
  teacher: {
    name: string;
    avatar?: string;
  };
  startTime: string;
  duration: number;
  location: string;
  spotsLeft: number;
  capacity: number;
  onBook: (id: string) => void;
}

const levelVariants = {
  BEGINNER: "beginner",
  ALL: "allLevels",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
} as const;

const levelLabels = {
  BEGINNER: "Beginner",
  ALL: "All Levels",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export function ClassCard({
  id,
  title,
  style,
  level,
  isHeated,
  teacher,
  startTime,
  duration,
  location,
  spotsLeft,
  capacity,
  onBook,
}: ClassCardProps) {
  const isFull = spotsLeft === 0;
  const spotsPercentage = ((capacity - spotsLeft) / capacity) * 100;

  return (
    <div className="group flex rounded-2xl border border-border bg-card overflow-hidden shadow-card transition-all duration-200 hover:shadow-card-hover hover:scale-[1.01]">
      {/* Left color bar - Yellow for classes */}
      <div className="w-1.5 bg-primary flex-shrink-0" />
      
      <div className="flex-1 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="class">Class</Badge>
              <Badge variant={levelVariants[level]}>{levelLabels[level]}</Badge>
              {isHeated && (
                <Badge variant="heated" className="gap-1">
                  <Flame className="h-3 w-3" />
                  Heated
                </Badge>
              )}
            </div>

            {/* Title and style */}
            <h3 className="text-lg font-semibold text-foreground truncate mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{style}</p>

            {/* Teacher */}
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={teacher.avatar} alt={teacher.name} />
                <AvatarFallback className="text-xs bg-accent-lilac text-foreground">
                  {teacher.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{teacher.name}</span>
            </div>

            {/* Details */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{startTime}</span>
                <span className="text-muted-foreground/50">•</span>
                <span>{duration} min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            </div>
          </div>

          {/* Right side - spots and CTA */}
          <div className="flex sm:flex-col items-center sm:items-end gap-3">
            {/* Spots indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className={cn(
                  "font-medium",
                  isFull ? "text-destructive" : spotsLeft <= 3 ? "text-warning" : "text-foreground"
                )}>
                  {isFull ? "Full" : `${spotsLeft} left`}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isFull ? "bg-destructive" : spotsPercentage >= 80 ? "bg-warning" : "bg-primary"
                )}
                style={{ width: `${spotsPercentage}%` }}
              />
            </div>

            {/* Book button */}
            <Button
              variant={isFull ? "secondary" : "default"}
              size="sm"
              onClick={() => onBook(id)}
              className="w-full sm:w-auto min-w-[100px]"
            >
              {isFull ? "Waitlist" : "Book"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
