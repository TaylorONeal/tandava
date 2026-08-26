/**
 * MobileStatsBar — the feedback loop for phones.
 *
 * On mobile the config inputs sit thousands of pixels below the headline
 * stats, so editing a number produced no visible response: the page appeared
 * to do nothing. This bar pins EBITDA, break-even and the rent light to the
 * bottom of the viewport whenever the headline strip is scrolled out of view,
 * so every edit answers immediately.
 *
 * Tapping it scrolls back to the full dashboard. Hidden on lg+ screens, where
 * the sticky config column keeps results and controls visible together. It is
 * a fixed overlay, so it never shifts layout (CLS 0).
 */
import { useEffect, useState, type RefObject } from "react";
import { ArrowUp } from "lucide-react";
import type { StudioResults } from "@/lib/studioEcon";
import { money, pct, count } from "@/lib/studioNarrative";
import { CHART, RENT_LIGHT_COLOR } from "./theme";
import { usePrefersReducedMotion } from "./useAnimatedNumber";

interface Props {
  results: StudioResults;
  members: number;
  /** The headline strip; the bar shows only while this is off screen. */
  watchRef: RefObject<HTMLElement | null>;
}

export function MobileStatsBar({ results, members, watchRef }: Props) {
  const [headlineVisible, setHeadlineVisible] = useState(true);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const target = watchRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeadlineVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [watchRef]);

  if (headlineVisible) return null;

  const past = members >= results.breakEvenMembers;

  return (
    <button
      type="button"
      onClick={() =>
        watchRef.current?.scrollIntoView(
          reduced ? undefined : { behavior: "smooth", block: "start" },
        )
      }
      aria-label={`Jump to results. EBITDA ${money(results.ebitda)} a month, break-even ${count(results.breakEvenMembers)} members against ${count(members)} now, rent ${pct(results.rentPctRevenue, 1)} of revenue.`}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md lg:hidden"
      data-testid="mobile-stats-bar"
    >
      <span className="mx-auto flex w-full max-w-md items-center justify-between gap-3 text-start">
        <span>
          <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
            EBITDA / mo
          </span>
          <span
            className="block text-sm font-medium tabular-nums"
            style={{ color: results.ebitda >= 0 ? CHART.positive : CHART.negative }}
          >
            {money(results.ebitda)}
          </span>
        </span>
        <span>
          <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
            Break-even
          </span>
          <span className="block text-sm tabular-nums text-foreground">
            {Number.isFinite(results.breakEvenMembers)
              ? `${count(results.breakEvenMembers)} of ${count(members)}`
              : "unreachable"}
            <span
              className="ms-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
              style={{ backgroundColor: past ? CHART.positive : CHART.negative }}
              aria-hidden
            />
          </span>
        </span>
        <span>
          <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
            Rent
          </span>
          <span className="flex items-center gap-1.5 text-sm tabular-nums text-foreground">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: RENT_LIGHT_COLOR[results.rentLight] }}
              aria-hidden
            />
            {pct(results.rentPctRevenue, 1)}
          </span>
        </span>
        <ArrowUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </span>
    </button>
  );
}
