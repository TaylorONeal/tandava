import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        // Class type badges
        class: "border-transparent bg-accent text-accent-foreground",
        workshop: "border-transparent bg-warning/15 text-warning",
        appointment: "border-transparent bg-info/15 text-info",
        // Status badges
        booked: "border-transparent bg-success/15 text-success",
        waitlisted: "border-transparent bg-warning/15 text-warning",
        checkedIn: "border-transparent bg-success text-success-foreground",
        canceled: "border-transparent bg-destructive/15 text-destructive",
        noShow: "border-transparent bg-muted text-muted-foreground",
        // Level badges
        beginner: "border-transparent bg-success/15 text-success",
        allLevels: "border-transparent bg-info/15 text-info",
        intermediate: "border-transparent bg-warning/15 text-warning",
        advanced: "border-transparent bg-destructive/15 text-destructive",
        // Heated badge
        heated: "border-transparent bg-destructive/10 text-destructive",
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
