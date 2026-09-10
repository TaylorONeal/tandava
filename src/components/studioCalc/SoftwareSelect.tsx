/**
 * Studio software picker.
 *
 * Options are described by market position rather than by vendor, and the
 * dollar figures are illustrative estimates. See the note in studioEcon.ts for
 * why: published pricing moves constantly, real invoices depend on plan, size
 * and negotiation, and naming a product beside a number would imply a precision
 * this model does not have.
 */
import { Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  SOFTWARE_OPTIONS,
  SOFTWARE_DISCLAIMER,
  softwareSpec,
  type SoftwareChoiceId,
} from "@/lib/studioEcon";
import { money } from "@/lib/studioNarrative";

interface Props {
  value: SoftwareChoiceId;
  /** Resolved monthly cost, which may be a user override. */
  cost: number;
  fiveYear: { chosen: number; baseline: number; difference: number; baselineLabel: string };
  onChangeChoice: (id: SoftwareChoiceId) => void;
  onChangeCost: (cost: number) => void;
}

export function SoftwareSelect({ value, cost, fiveYear, onChangeChoice, onChangeCost }: Props) {
  const spec = softwareSpec(value);

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <label htmlFor="software-select" className="text-sm font-medium text-foreground">
          Studio software
        </label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="How these software costs were estimated"
              className="rounded-full text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Info className="h-3.5 w-3.5" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs leading-relaxed">
            {SOFTWARE_DISCLAIMER}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="mt-2 flex gap-2">
        <Select value={value} onValueChange={(v) => onChangeChoice(v as SoftwareChoiceId)}>
          {/* min-w-0 so a long option label cannot squeeze the price field. */}
          <SelectTrigger id="software-select" className="min-w-0 flex-1" data-testid="software-select">
            <SelectValue className="truncate" />
          </SelectTrigger>
          <SelectContent>
            {SOFTWARE_OPTIONS.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative w-28 shrink-0">
          <span className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <Input
            type="number"
            min={0}
            step={5}
            value={Math.round(cost)}
            onChange={(e) => onChangeCost(Math.max(0, Number(e.target.value) || 0))}
            aria-label="Monthly software cost in dollars"
            className="ps-6 tabular-nums"
            data-testid="software-cost"
          />
        </div>
      </div>

      {spec.note && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{spec.note}</p>
      )}

      <p className="mt-2 text-xs tabular-nums text-muted-foreground" data-testid="software-five-year">
        Software over 5 years: {money(fiveYear.chosen)}.{" "}
        {fiveYear.difference > 0
          ? `Self-hosted at ${money(fiveYear.baseline)} would be ${money(fiveYear.difference)} less.`
          : "That is already the lowest tier on this list."}
      </p>
    </div>
  );
}
