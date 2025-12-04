import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: "default" | "primary" | "lilac" | "mint" | "peach";
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]",
        variant === "default" && "bg-card border border-border shadow-card hover:shadow-card-hover",
        variant === "primary" && "bg-primary text-primary-foreground shadow-card",
        variant === "lilac" && "bg-accent-lilac text-foreground shadow-card",
        variant === "mint" && "bg-accent-mint text-foreground shadow-card",
        variant === "peach" && "bg-accent-peach text-foreground shadow-card",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p
            className={cn(
              "text-caption font-medium uppercase tracking-wider",
              variant === "default" && "text-muted-foreground",
              (variant === "primary" || variant === "lilac" || variant === "mint" || variant === "peach") && "opacity-70"
            )}
          >
            {label}
          </p>
          <p className="stat-value animate-count-up">
            {value}
          </p>
          {trend && (
            <p className={cn(
              "text-xs",
              variant === "default" ? "text-muted-foreground" : "opacity-70"
            )}>
              <span className={trend.value >= 0 ? "text-success" : "text-destructive"}>
                {trend.value >= 0 ? "+" : ""}
                {trend.value}
              </span>{" "}
              {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full",
              variant === "default" && "bg-secondary",
              variant === "primary" && "bg-primary-foreground/20",
              (variant === "lilac" || variant === "mint" || variant === "peach") && "bg-foreground/10"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
