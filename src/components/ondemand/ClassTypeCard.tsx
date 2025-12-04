import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ClassTypeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: "primary" | "lilac" | "mint" | "peach";
  classCount: number;
  imageUrl?: string;
  onClick: () => void;
  isSelected?: boolean;
}

const colorVariants = {
  primary: "bg-primary/20 border-primary/30 hover:border-primary",
  lilac: "bg-lilac/40 border-lilac/50 hover:border-lilac",
  mint: "bg-mint/40 border-mint/50 hover:border-mint",
  peach: "bg-peach/40 border-peach/50 hover:border-peach",
};

const iconColorVariants = {
  primary: "bg-primary text-primary-foreground",
  lilac: "bg-lilac text-foreground",
  mint: "bg-mint text-foreground",
  peach: "bg-peach text-foreground",
};

export function ClassTypeCard({
  title,
  description,
  icon: Icon,
  color,
  classCount,
  imageUrl,
  onClick,
  isSelected,
}: ClassTypeCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-3xl border-2 p-6 text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        colorVariants[color],
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Background image overlay */}
      {imageUrl && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      <div className="relative z-10">
        {/* Icon */}
        <div
          className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center mb-4",
            iconColorVariants[color]
          )}
        >
          <Icon className="h-6 w-6" />
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {description}
        </p>

        {/* Class count */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-background/80 text-sm font-medium">
          {classCount} classes
        </div>
      </div>
    </button>
  );
}
