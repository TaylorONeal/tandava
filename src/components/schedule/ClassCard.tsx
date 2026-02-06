import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, Users, Flame, Video, Monitor, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeliveryMode } from "@/types/database";

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
  // Virtual/Hybrid class support
  deliveryMode?: DeliveryMode;
  isLive?: boolean; // true = live now or starting soon
  virtualLink?: string;
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

// Delivery mode badge config
const deliveryModeConfig: Record<DeliveryMode, { label: string; icon: typeof Video; className: string }> = {
  in_person: {
    label: 'In-Person',
    icon: MapPin,
    className: 'bg-stone-100 text-stone-700 border-stone-200',
  },
  virtual: {
    label: 'Virtual',
    icon: Video,
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  hybrid: {
    label: 'Hybrid',
    icon: Wifi,
    className: 'bg-violet-100 text-violet-700 border-violet-200',
  },
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
  deliveryMode = 'in_person',
  isLive = false,
  virtualLink,
}: ClassCardProps) {
  const isFull = spotsLeft === 0;
  const spotsPercentage = ((capacity - spotsLeft) / capacity) * 100;
  const modeConfig = deliveryModeConfig[deliveryMode];
  const ModeIcon = modeConfig.icon;

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
              {/* Delivery mode badge */}
              {deliveryMode !== 'in_person' && (
                <Badge className={cn("gap-1 border", modeConfig.className)}>
                  <ModeIcon className="h-3 w-3" />
                  {modeConfig.label}
                </Badge>
              )}
              {/* Live indicator */}
              {isLive && (deliveryMode === 'virtual' || deliveryMode === 'hybrid') && (
                <Badge className="gap-1 bg-red-500 text-white border-red-500 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  Live
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
              {deliveryMode === 'in_person' && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{location}</span>
                </div>
              )}
              {deliveryMode === 'virtual' && (
                <div className="flex items-center gap-1.5">
                  <Video className="h-4 w-4" />
                  <span>Join online</span>
                </div>
              )}
              {deliveryMode === 'hybrid' && (
                <div className="flex items-center gap-1.5">
                  <Wifi className="h-4 w-4" />
                  <span>{location} + Online</span>
                </div>
              )}
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

            {/* Book/Join button */}
            <Button
              variant={isFull ? "secondary" : "default"}
              size="sm"
              onClick={() => onBook(id)}
              className={cn(
                "w-full sm:w-auto min-w-[100px]",
                isLive && (deliveryMode === 'virtual' || deliveryMode === 'hybrid') && "bg-red-500 hover:bg-red-600"
              )}
            >
              {isLive && (deliveryMode === 'virtual' || deliveryMode === 'hybrid') ? (
                <>
                  <Video className="h-4 w-4 mr-1" />
                  Join Now
                </>
              ) : isFull ? (
                "Waitlist"
              ) : (
                "Book"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
