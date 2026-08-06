/**
 * City tier picker. Setting a tier sets the rent per square foot and suggests a
 * membership price; both stay editable afterwards.
 */
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CITY_TIERS, type CityTier } from "@/lib/studioEcon";

interface Props {
  value: CityTier;
  onChange: (tier: CityTier) => void;
}

export function TierSelect({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        Market
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="About the rent figures in these market tiers"
              className="rounded-full text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Info className="h-3.5 w-3.5" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs leading-relaxed">
            Rent is quoted all-in: base rent plus an allowance for triple-net
            pass-throughs. Asking rents you see advertised are lower and are not
            what you pay. These are modelled estimates, not comps for a specific
            space.
          </TooltipContent>
        </Tooltip>
      </legend>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {(Object.values(CITY_TIERS) as (typeof CITY_TIERS)[CityTier][]).map((tier) => {
          const active = tier.tier === value;
          return (
            <Tooltip key={tier.tier}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onChange(tier.tier)}
                  aria-pressed={active}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                  data-testid={`tier-${tier.tier}`}
                >
                  <span className="block text-sm font-medium text-foreground">
                    Tier {tier.tier}
                  </span>
                  <span className="block text-[11px] leading-snug text-muted-foreground">
                    {tier.examples}
                  </span>
                  <span className="mt-1 block text-[11px] tabular-nums text-muted-foreground">
                    ${tier.rentPerSf}/sf/yr all-in
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-relaxed">
                {tier.tooltip}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </fieldset>
  );
}
