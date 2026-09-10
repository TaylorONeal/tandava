/**
 * Revenue per visit with and without the aggregator, as two compact bars.
 *
 * Shown only when the aggregator toggle is on. The comparison holds total
 * visits constant and asks what the same traffic would be worth through your
 * own channels, which is the honest version of the question.
 */
import type { StudioInputs } from "@/lib/studioEcon";
import { CLASSPASS_DILUTION_THRESHOLD } from "@/lib/studioEcon";
import { money, pct } from "@/lib/studioNarrative";
import { CHART } from "./theme";
import { usePrefersReducedMotion } from "./useAnimatedNumber";

interface Props {
  inputs: StudioInputs;
  dilution: { withAggregator: number; withoutAggregator: number; delta: number };
}

export function ClassPassStrip({ inputs, dilution }: Props) {
  const reduced = usePrefersReducedMotion();
  if (!inputs.classPass.enabled) return null;

  const max = Math.max(dilution.withAggregator, dilution.withoutAggregator) || 1;
  const material = inputs.classPass.shareOfVisits > CLASSPASS_DILUTION_THRESHOLD;

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground">Aggregator dilution</h3>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Revenue per visit at {pct(inputs.classPass.shareOfVisits, 0)} of visits through the
        marketplace.
      </p>

      <p className="sr-only">
        Revenue per visit is {money(dilution.withoutAggregator, 2)} without aggregator visits and{" "}
        {money(dilution.withAggregator, 2)} with them, a difference of{" "}
        {money(dilution.delta, 2)} per visit.
      </p>

      <div className="mt-3 space-y-2.5">
        <Row
          label="Your own channels only"
          value={dilution.withoutAggregator}
          max={max}
          color={CHART.positive}
          reduced={reduced}
        />
        <Row
          label="Blended with aggregator"
          value={dilution.withAggregator}
          max={max}
          color={material ? CHART.negative : CHART.amber}
          reduced={reduced}
        />
      </div>

      <p className="mt-3 text-xs tabular-nums text-foreground">
        {money(dilution.delta, 2)} per visit
        <span className="ms-1.5 text-muted-foreground">
          ({pct(dilution.delta / (dilution.withoutAggregator || 1), 1)})
        </span>
      </p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
        {material
          ? "Above roughly 15% of visits, the studio is effectively repricing itself. The question worth answering is whether these visits fill off-peak seats or displace full-price students at peak."
          : "At this share the dilution is manageable, and off-peak seats that would otherwise be empty are worth more filled than empty."}
      </p>
    </section>
  );
}

function Row({
  label,
  value,
  max,
  color,
  reduced,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  reduced: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">{money(value, 2)}</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${reduced ? "" : "transition-[width] duration-300 ease-out"}`}
          style={{ width: `${Math.max(2, (value / max) * 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
