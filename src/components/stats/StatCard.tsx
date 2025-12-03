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
  variant?: "default" | "primary" | "accent";
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
        "relative overflow-hidden rounded-xl p-5 transition-all duration-200",
        variant === "default" && "bg-card border shadow-card hover:shadow-card-hover",
        variant === "primary" && "gradient-sage text-primary-foreground",
        variant === "accent" && "bg-accent",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p
            className={cn(
              "text-xs font-medium uppercase tracking-wider",
              variant === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "text-3xl font-bold tracking-tight animate-count-up",
              variant === "primary" && "text-primary-foreground"
            )}
          >
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "text-xs",
                variant === "primary" ? "text-primary-foreground/70" : "text-muted-foreground"
              )}
            >
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
              "flex h-10 w-10 items-center justify-center rounded-lg",
              variant === "primary"
                ? "bg-primary-foreground/20"
                : "bg-accent"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                variant === "primary" ? "text-primary-foreground" : "text-accent-foreground"
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}