/**
 * studioNarrative.ts — "What the model says".
 *
 * Turns the current results into three to five plain sentences. Assembled from
 * templates rather than generated, so the claims are auditable and always tie
 * to a number on screen.
 *
 * House rules, enforced by test:
 *   - no exclamation points
 *   - no advice verb stronger than "consider"
 *   - every sentence carries at least one figure
 */
import {
  CLASSPASS_DILUTION_THRESHOLD,
  RENT_AMBER_MAX,
  RENT_GREEN_MAX,
  type StudioInputs,
  type StudioResults,
} from "./studioEcon";

export const money = (n: number, decimals = 0): string =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export const pct = (n: number, decimals = 0): string => `${(n * 100).toFixed(decimals)}%`;

export const count = (n: number, decimals = 0): string =>
  n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export function buildNarrative(inputs: StudioInputs, r: StudioResults): string[] {
  const lines: string[] = [];

  // 1. Where you stand against break-even.
  if (Number.isFinite(r.breakEvenMembers)) {
    const gap = inputs.members - r.breakEvenMembers;
    const direction = gap >= 0 ? "above" : "below";
    lines.push(
      `At ${count(inputs.members)} members you are ${count(Math.abs(gap))} ${direction} cash break-even of ${count(r.breakEvenMembers)} members, a margin of safety of ${pct(r.marginOfSafety, 1)}.`,
    );
  } else {
    lines.push(
      `At ${count(inputs.members)} members the schedule does not reach break-even at any attendance level, because contribution per visit is ${money(r.contributionPerVisit, 2)}.`,
    );
  }

  // 2. The rent line. Each band gets its own clause so the sentence reads.
  const rentHead = `Rent is ${pct(r.rentPctRevenue, 1)} of revenue at ${money(r.rent)} a month`;
  lines.push(
    r.rentPctRevenue < RENT_GREEN_MAX
      ? `${rentHead}, which is under the 12% line and healthy.`
      : r.rentPctRevenue <= RENT_AMBER_MAX
        ? `${rentHead}, which is in the 12 to 15% band and worth watching.`
        : `${rentHead}, which is past 15%, so the lease is running the business.`,
  );

  // 3. Heads per class, break-even against actual.
  lines.push(
    `Your schedule needs ${count(r.breakEvenHeads, 1)} students per class on average to break even across ${count(r.classesPerMonth, 0)} classes a month; the model has you at ${count(r.avgHeadcount, 1)}.`,
  );

  // 4. Aggregator dilution, only when it is material.
  if (inputs.classPass.enabled && inputs.classPass.shareOfVisits > CLASSPASS_DILUTION_THRESHOLD) {
    lines.push(
      `Aggregator visits above 15% start diluting revenue per visit materially; yours are ${pct(inputs.classPass.shareOfVisits, 0)} of visits and revenue per visit is ${money(r.revenuePerVisit, 2)}.`,
    );
  }

  // 5. Seasonal cash.
  if (r.cashNegativeMonths > 0) {
    const worst = r.seasonality.reduce((a, b) => (b.netCash < a.netCash ? b : a));
    lines.push(
      `Expect ${count(r.cashNegativeMonths)} cash-negative ${r.cashNegativeMonths === 1 ? "month" : "months"}, deepest in ${worst.label} at ${money(worst.netCash)}; consider holding about ${money(r.recommendedReserve)} in seasonal reserve.`,
    );
  } else if (lines.length < 5) {
    lines.push(
      `No month in the twelve-month curve goes cash-negative, with the weakest at ${money(r.seasonality.reduce((a, b) => (b.netCash < a.netCash ? b : a)).netCash)}.`,
    );
  }

  // Utilization, when there is room left in the five-sentence budget and the
  // room is conspicuously oversized.
  if (lines.length < 5 && r.utilization < 0.35) {
    lines.push(
      `Utilization is ${pct(r.utilization, 0)} of seat capacity, so the rooms are sized for roughly ${count(r.seatCapacity / Math.max(r.totalVisits, 1), 1)} times the traffic they hold.`,
    );
  }

  return lines.slice(0, 5);
}
