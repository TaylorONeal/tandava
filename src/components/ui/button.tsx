import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary - Starface yellow pill
        default: "bg-primary text-primary-foreground rounded-full shadow-md hover:shadow-lg hover:bg-[hsl(45_90%_58%)]",
        // Secondary - white with border
        secondary: "bg-card text-foreground border border-border-strong rounded-full hover:bg-[hsl(45_100%_96%)] hover:shadow-md",
        // Destructive
        destructive: "bg-destructive text-destructive-foreground rounded-full shadow-md hover:bg-destructive/90",
        // Outline
        outline: "border border-border bg-background rounded-full hover:bg-accent hover:text-accent-foreground",
        // Ghost - minimal
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground rounded-full",
        // Link style
        link: "text-primary underline-offset-4 hover:underline",
        // Hero CTA - gradient background
        hero: "bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:bg-[hsl(45_90%_58%)] transition-all duration-300",
        // Soft pastel variants
        soft: "bg-accent text-accent-foreground rounded-full hover:bg-accent/80",
        "soft-mint": "bg-accent-mint text-foreground rounded-full hover:bg-accent-mint/80",
        "soft-peach": "bg-accent-peach text-foreground rounded-full hover:bg-accent-peach/80",
        "soft-lilac": "bg-accent-lilac text-foreground rounded-full hover:bg-accent-lilac/80",
        // Success
        success: "bg-success text-success-foreground rounded-full shadow-md hover:bg-success/90",
      },
      size: {
        default: "h-10 px-5 py-2 text-sm",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10 rounded-full",
        "icon-sm": "h-8 w-8 rounded-full",
        "icon-lg": "h-12 w-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
