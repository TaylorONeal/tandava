import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors border-transparent",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "text-foreground border border-border bg-transparent",
        // Pastel accent badges - Gen Z style
        lilac: "bg-accent-lilac text-foreground",
        mint: "bg-accent-mint text-foreground",
        peach: "bg-accent-peach text-foreground",
        yellow: "bg-primary/20 text-foreground",
        // Type badges with colored backgrounds
        class: "bg-primary text-primary-foreground",
        workshop: "bg-accent-lilac text-foreground",
        appointment: "bg-accent-mint text-foreground",
        retreat: "bg-accent-peach text-foreground",
        // Status badges
        booked: "bg-success/15 text-success",
        waitlisted: "bg-warning/15 text-warning",
        checkedIn: "bg-success text-success-foreground",
        canceled: "bg-destructive/15 text-destructive",
        noShow: "bg-muted text-muted-foreground",
        // Level badges with pastels
        beginner: "bg-accent-mint text-foreground",
        allLevels: "bg-accent-lilac text-foreground",
        intermediate: "bg-primary/20 text-foreground",
        advanced: "bg-accent-peach text-foreground",
        // Heated badge
        heated: "bg-destructive/15 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
