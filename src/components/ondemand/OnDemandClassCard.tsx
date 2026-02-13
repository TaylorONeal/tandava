import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Play, CheckCircle, Lock, Ticket, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export type VideoAccessType = "free" | "members_only" | "class_pack" | "purchase" | "rental" | "subscription";

interface OnDemandClassCardProps {
  id: string;
  title: string;
  style: string;
  level: "BEGINNER" | "ALL" | "INTERMEDIATE" | "ADVANCED";
  teacher: {
    name: string;
    avatar?: string;
  };
  duration: number;
  thumbnailUrl: string;
  progress?: number; // 0-100
  isCompleted?: boolean;
  accessType?: VideoAccessType;
  price?: number;
  onClick: () => void;
}

const levelVariants = {
  BEGINNER: "mint",
  ALL: "lilac",
  INTERMEDIATE: "peach",
  ADVANCED: "destructive",
} as const;

const levelLabels = {
  BEGINNER: "Beginner",
  ALL: "All Levels",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const accessLabels: Record<VideoAccessType, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-emerald-500/10 text-emerald-700 border-emerald-300" },
  members_only: { label: "Members", className: "bg-indigo-500/10 text-indigo-700 border-indigo-300" },
  class_pack: { label: "Class Pack", className: "bg-violet-500/10 text-violet-700 border-violet-300" },
  purchase: { label: "Purchase", className: "bg-amber-500/10 text-amber-700 border-amber-300" },
  rental: { label: "Rental", className: "bg-rose-500/10 text-rose-700 border-rose-300" },
  subscription: { label: "Subscription", className: "bg-sky-500/10 text-sky-700 border-sky-300" },
};

function AccessIcon({ accessType }: { accessType: VideoAccessType }) {
  switch (accessType) {
    case "free":
      return null;
    case "members_only":
    case "subscription":
      return <Lock className="h-3 w-3" />;
    case "class_pack":
      return <Ticket className="h-3 w-3" />;
    case "purchase":
    case "rental":
      return <CreditCard className="h-3 w-3" />;
  }
}

export function OnDemandClassCard({
  id,
  title,
  style,
  level,
  teacher,
  duration,
  thumbnailUrl,
  progress = 0,
  isCompleted,
  accessType = "free",
  price,
  onClick,
}: OnDemandClassCardProps) {
  const access = accessLabels[accessType];

  return (
    <button
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden bg-card border text-left transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video">
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover"
        />

        {/* Play overlay */}
        <div className="absolute inset-0 bg-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <Play className="h-7 w-7 text-primary-foreground ml-1" />
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-foreground/80 text-background text-xs font-medium flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {duration} min
        </div>

        {/* Access type badge - top left */}
        {accessType !== "free" && (
          <div className={cn(
            "absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border backdrop-blur-sm",
            access.className
          )}>
            <AccessIcon accessType={accessType} />
            {access.label}
            {price != null && (accessType === "purchase" || accessType === "rental") && (
              <span className="ml-0.5">${price}</span>
            )}
          </div>
        )}

        {/* Free badge */}
        {accessType === "free" && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border backdrop-blur-sm bg-emerald-500/10 text-emerald-700 border-emerald-300">
            Free
          </div>
        )}

        {/* Progress bar */}
        {progress > 0 && !isCompleted && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/30">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Completed badge */}
        {isCompleted && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-mint text-foreground text-xs font-medium flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={levelVariants[level]}>{levelLabels[level]}</Badge>
          <span className="text-xs text-muted-foreground">{style}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold line-clamp-2 mb-2">{title}</h3>

        {/* Teacher */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={teacher.avatar} alt={teacher.name} />
            <AvatarFallback className="text-xs bg-lilac text-foreground">
              {teacher.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{teacher.name}</span>
        </div>
      </div>
    </button>
  );
}
