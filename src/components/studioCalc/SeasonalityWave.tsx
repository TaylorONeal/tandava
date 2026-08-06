/**
 * Twelve months of net cash.
 *
 * Demand peaks in January and falls apart in summer and December, while
 * utilities peak in exactly the months revenue bottoms out. The cost base does
 * not know it is July, which is what produces the negative months.
 */
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import type { StudioResults } from "@/lib/studioEcon";
import { money, count } from "@/lib/studioNarrative";
import { CHART, CHART_HEIGHT } from "./theme";
import { usePrefersReducedMotion } from "./useAnimatedNumber";

export function SeasonalityWave({ results }: { results: StudioResults }) {
  const reduced = usePrefersReducedMotion();

  const trough = useMemo(
    () => results.seasonality.reduce((a, b) => (b.netCash < a.netCash ? b : a)),
    [results.seasonality],
  );

  const summary = results.seasonality
    .map((m) => `${m.label} ${money(m.netCash)}`)
    .join(", ");

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground">Twelve months of cash</h3>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {results.cashNegativeMonths === 0
          ? "No cash-negative months in this scenario."
          : `${count(results.cashNegativeMonths)} cash-negative ${results.cashNegativeMonths === 1 ? "month" : "months"}, deepest in ${trough.label} at ${money(trough.netCash)}.`}
      </p>

      <p className="sr-only">Monthly net cash: {summary}.</p>

      <div style={{ height: CHART_HEIGHT }} className="mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={results.seasonality} margin={{ top: 12, right: 8, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id="seasonPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.positive} stopOpacity={0.4} />
                <stop offset="100%" stopColor={CHART.positive} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={54}
              tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
            <Area
              type="monotone"
              dataKey="netCash"
              stroke={CHART.positive}
              strokeWidth={2}
              fill="url(#seasonPos)"
              isAnimationActive={!reduced}
              animationDuration={300}
            />
            {trough.netCash < 0 && (
              <ReferenceDot
                x={trough.label}
                y={trough.netCash}
                r={4}
                fill={CHART.negative}
                stroke="none"
                // Month only: the dollar figure is already in the subtitle and
                // in the reserve note, and a long label clips at the axis edge.
                label={{
                  value: trough.label,
                  position: "bottom",
                  fontSize: 10,
                  fill: CHART.negative,
                }}
              />
            )}
            <RTooltip
              formatter={(value: number) => [money(value), "net cash"]}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
                color: "hsl(var(--popover-foreground))",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {results.cashNegativeMonths > 0 && (
        <p className="mt-2 flex items-start gap-1.5 rounded-md bg-muted px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
          <AlertTriangle
            className="mt-px h-3.5 w-3.5 shrink-0"
            style={{ color: CHART.amber }}
            aria-hidden
          />
          <span>
            Seasonal burn totals {money(results.seasonalBurn)} across those months. Consider holding
            about {money(results.recommendedReserve)} in reserve. Annual profitability does not pay
            an August rent bill.
          </span>
        </p>
      )}
    </section>
  );
}
