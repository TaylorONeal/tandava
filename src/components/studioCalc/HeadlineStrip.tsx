/**
 * The three numbers that answer the question: monthly EBITDA, where you stand
 * against break-even members, and whether the lease is eating you.
 *
 * The break-even stat is a bullet chart rather than a number pair: a bar that
 * runs green once the current member marker passes break-even. No celebration
 * when it crosses, because this is someone's savings.
 */
import { useState } from "react";
import { Info } from "lucide-react";
import { RENT_HEURISTIC, type StudioResults } from "@/lib/studioEcon";
import { money, pct, count } from "@/lib/studioNarrative";
import { useAnimatedNumber, usePrefersReducedMotion } from "./useAnimatedNumber";
import { CHART, RENT_LIGHT_COLOR } from "./theme";

interface Props {
  results: StudioResults;
  members: number;
}

export function HeadlineStrip({ results, members }: Props) {
  const ebitda = useAnimatedNumber(results.ebitda);
  const margin = useAnimatedNumber(results.ebitdaMargin);
  const breakEven = useAnimatedNumber(
    Number.isFinite(results.breakEvenMembers) ? results.breakEvenMembers : 0,
  );
  const rentPct = useAnimatedNumber(results.rentPctRevenue);
  const [rentOpen, setRentOpen] = useState(false);
  const reduced = usePrefersReducedMotion();

  const past = members >= results.breakEvenMembers;
  // The bar spans zero to 1.35x break-even so the marker always has room.
  const scaleMax = Math.max(members, results.breakEvenMembers) * 1.15 || 1;
  const fillPct = Math.min(100, (members / scaleMax) * 100);
  const markerPct = Math.min(100, (results.breakEvenMembers / scaleMax) * 100);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" data-testid="headline-strip">
      {/* EBITDA */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          EBITDA per month
        </p>
        <p
          className="mt-1 font-display text-3xl tabular-nums leading-none"
          style={{ color: results.ebitda >= 0 ? CHART.positive : CHART.negative }}
          data-testid="stat-ebitda"
        >
          {money(ebitda)}
        </p>
        <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
          {pct(margin, 1)} margin on {money(results.revenue)} revenue
        </p>
      </div>

      {/* Break-even bullet */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Break-even members
        </p>
        <p className="mt-1 font-display text-3xl tabular-nums leading-none text-foreground" data-testid="stat-breakeven">
          {Number.isFinite(results.breakEvenMembers) ? count(breakEven) : "not reachable"}
        </p>
        <div
          className="mt-3 h-2.5 w-full rounded-full bg-muted"
          role="img"
          aria-label={`You are at ${count(members)} members against a break-even of ${count(results.breakEvenMembers)}. Margin of safety ${pct(results.marginOfSafety, 1)}.`}
        >
          <div className="relative h-full w-full">
            <div
              className={`h-full rounded-full ${reduced ? "" : "transition-[width,background-color] duration-300 ease-out"}`}
              style={{
                width: `${fillPct}%`,
                backgroundColor: past ? CHART.positive : CHART.negative,
              }}
            />
            <span
              className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-foreground"
              style={{ left: `${markerPct}%` }}
              aria-hidden
            />
          </div>
        </div>
        <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
          at {count(members)} members, {pct(results.marginOfSafety, 1)} margin of safety
        </p>
      </div>

      {/* Rent traffic light */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Rent, share of revenue
        </p>
        <button
          type="button"
          onClick={() => setRentOpen((v) => !v)}
          aria-expanded={rentOpen}
          className="mt-1 flex items-center gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="stat-rent"
        >
          <span
            className={`h-3 w-3 shrink-0 rounded-full ${reduced ? "" : "transition-colors duration-500"}`}
            style={{ backgroundColor: RENT_LIGHT_COLOR[results.rentLight] }}
            aria-hidden
          />
          <span className="font-display text-3xl tabular-nums leading-none text-foreground">
            {pct(rentPct, 1)}
          </span>
          <Info className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        </button>
        <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
          {money(results.rent)} a month.{" "}
          {results.rentLight === "green"
            ? "Under 12%, healthy."
            : results.rentLight === "amber"
              ? "12 to 15%, watch it."
              : "Over 15%, the lease is running the business."}
        </p>
        {rentOpen && (
          <p className="mt-2 rounded-md bg-muted px-2 py-1.5 text-[11px] leading-relaxed text-muted-foreground">
            {RENT_HEURISTIC}
          </p>
        )}
      </div>
    </div>
  );
}
