/**
 * InfoTip — the one way this page explains a term.
 *
 * Every figure on the dashboard that is jargon, derived, or otherwise not
 * self-evident gets one of these. The rule is simple: if a number needs a
 * sentence before an operator can act on it, it gets an InfoTip. Decoration
 * does not.
 */
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`What does ${label} mean?`}
          className="inline-flex shrink-0 rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="h-3.5 w-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">{children}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Definitions live here rather than inline so the same wording is used
 * everywhere a term appears, and so they can be reviewed as a set.
 */
export const GLOSSARY = {
  ebitda:
    "Earnings before interest, tax, depreciation and amortization. Roughly: what the studio produces in a month before your loan payment, before the build-out you are still paying off, and before tax. It is not take-home pay.",
  breakEvenMembers:
    "The member count at which the studio stops losing money, holding your price, schedule and visit frequency steady. Below it you are covering the shortfall from somewhere else.",
  marginOfSafety:
    "How far attendance can fall before the studio stops paying for itself. Under 10 percent you are running the business from the bank balance rather than from the plan.",
  rentPct:
    "Rent divided by total revenue. Under 12 percent is healthy, 12 to 15 percent is worth watching, above 15 percent the lease is setting the agenda. Every $4 per square foot on the lease is about 10 members of break-even.",
  rentPerSf:
    "All-in rent per square foot per year: base rent plus an allowance for triple-net pass-throughs such as taxes, insurance and common area. Advertised asking rents are lower and are not what you pay. Set by the market tier, editable here.",
  utilities:
    "Power, gas and water for a 2,700 square foot unheated studio. The model scales this by your actual size and raises it for heated rooms, so the number in the cost breakdown will differ from what you type here.",
  heated:
    "Marks this room as a hot room. Heating drives utilities up by roughly a third and increases towel and laundry volume, both of which the model recalculates. It changes cost only, never revenue.",
  utilization:
    "Visits divided by total seats on the schedule. A 60-mat room running 10 students is paying rent on 50 empty mats every class. Low utilization usually means the room was sized for the January peak rather than for a Tuesday afternoon.",
  contributionPerVisit:
    "What one more student on a mat is actually worth after the costs that scale with them, mainly card processing and revenue-linked marketing. This is the number that divides into fixed cost to give break-even.",
  revenuePerVisit:
    "Average revenue across every visit, blending members, packs, drop-ins and any aggregator traffic. Aggregator visits pull it down.",
  breakEvenHeads:
    "Average students per class needed across the whole schedule to cover cost. Individual classes will sit either side of it; this is the schedule-wide average.",
  seasonalReserve:
    "Cash to hold against the months that run negative, sized at 2.5 times the total depth of those months. An annually profitable studio can still fail because it could not pay an August rent bill.",
  visitFreq:
    "How many times an average member actually comes in per month. The single most sensitive input on this page after rent, and the one most owners overestimate.",
  memberCount:
    "People on a recurring membership. Pack holders and drop-ins are modelled separately, off the visit mix.",
  aggregator:
    "Third-party class marketplaces. They net you less per visit than your own channels but fill seats that would otherwise be empty. The question is whether they fill your off-peak or displace full-price students at peak.",
} as const;
