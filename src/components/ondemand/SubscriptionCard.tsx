import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionCardProps {
  type: "individual" | "studio" | "series" | "unlimited";
  title: string;
  price: number;
  priceUnit: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  onSelect: () => void;
}

const typeStyles = {
  individual: "border-border",
  studio: "border-lilac",
  series: "border-mint",
  unlimited: "border-primary bg-primary/5",
};

export function SubscriptionCard({
  type,
  title,
  price,
  priceUnit,
  description,
  features,
  isPopular,
  onSelect,
}: SubscriptionCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-3xl border-2 p-6 transition-all hover:shadow-lg",
        typeStyles[type]
      )}
    >
      {/* Popular badge */}
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Most Popular
        </Badge>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold">${price}</span>
          <span className="text-muted-foreground">/{priceUnit}</span>
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <div className="h-5 w-5 rounded-full bg-mint flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="h-3 w-3 text-foreground" />
            </div>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        onClick={onSelect}
        className="w-full"
        variant={type === "unlimited" ? "default" : "outline"}
      >
        {type === "individual" ? "Purchase" : "Subscribe"}
      </Button>
    </div>
  );
}
