import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AddOnItem {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
}

interface BookingAddOnsProps {
  addOns: AddOnItem[];
  onAddOns?: (selectedIds: string[]) => void;
  onSkip?: () => void;
}

export function BookingAddOns({ addOns, onAddOns, onSkip }: BookingAddOnsProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleAddOn = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(cents / 100);
  };

  const handleAddToBooking = () => {
    if (selected.size > 0) {
      onAddOns?.(Array.from(selected));
      toast({
        title: "Add-ons added ✨",
        description: "We'll have them ready for you!",
      });
    }
  };

  if (addOns.length === 0) return null;

  return (
    <Card className="border-accent-mint/50 bg-accent-mint/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Want us to have anything ready for you?
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Totally optional. You can always add this at the studio.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {addOns.map((addOn) => (
          <label
            key={addOn.id}
            className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border-subtle cursor-pointer hover:border-primary/30 transition-colors"
          >
            <Checkbox
              checked={selected.has(addOn.id)}
              onCheckedChange={() => toggleAddOn(addOn.id)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{addOn.name}</span>
                <span className="text-sm font-semibold text-primary">
                  {formatPrice(addOn.priceCents, addOn.currency)}
                </span>
              </div>
              {addOn.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {addOn.description}
                </p>
              )}
            </div>
          </label>
        ))}

        <div className="flex items-center gap-3 pt-2">
          {selected.size > 0 && (
            <Button onClick={handleAddToBooking} className="flex-1">
              Add to my booking
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={onSkip}
            className={selected.size > 0 ? "" : "w-full"}
          >
            Skip for now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
