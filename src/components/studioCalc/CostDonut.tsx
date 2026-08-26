/**
 * Cost donut, grouped into occupancy, labor, operating and variable.
 *
 * The centre carries the point of the whole chart: the share of cost that does
 * not care how many students show up.
 */
import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip } from "recharts";
import type { StudioResults, CostGroup } from "@/lib/studioEcon";
import { money, pct } from "@/lib/studioNarrative";
import { COST_GROUP_COLOR, COST_GROUP_LABEL, CHART_HEIGHT } from "./theme";
import { usePrefersReducedMotion } from "./useAnimatedNumber";

const ORDER: CostGroup[] = ["occupancy", "labor", "opex", "variable"];

export function CostDonut({ results }: { results: StudioResults }) {
  const reduced = usePrefersReducedMotion();

  const data = useMemo(
    () =>
      ORDER.map((group) => ({
        group,
        name: COST_GROUP_LABEL[group],
        value: results.costLines
          .filter((l) => l.group === group)
          .reduce((sum, l) => sum + l.amount, 0),
      })).filter((d) => d.value > 0),
    [results.costLines],
  );

  const summary = data
    .map((d) => `${d.name} ${money(d.value)}, ${pct(d.value / results.totalCost, 0)}`)
    .join("; ");

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground">Where the money goes</h3>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {money(results.totalCost)} of cost a month
      </p>

      <p className="sr-only">
        Monthly cost breakdown: {summary}. Fixed and step-fixed costs are{" "}
        {pct(results.fixedCostShare, 0)} of the total.
      </p>

      <div style={{ height: CHART_HEIGHT }} className="relative mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="66%"
              outerRadius="90%"
              paddingAngle={1.5}
              stroke="none"
              isAnimationActive={!reduced}
              animationDuration={300}
            >
              {data.map((entry) => (
                <Cell key={entry.group} fill={COST_GROUP_COLOR[entry.group]} />
              ))}
            </Pie>
            <RTooltip
              formatter={(value: number, name: string) => [money(value), name]}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
                color: "hsl(var(--popover-foreground))",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-[22%] text-center">
          <span className="font-display text-3xl tabular-nums leading-none text-foreground">
            {pct(results.fixedCostShare, 0)}
          </span>
          <span className="mt-1 text-[10px] leading-tight text-muted-foreground">
            the share of cost that does not care how many students show up
          </span>
        </div>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {data.map((entry) => (
          <li key={entry.group} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: COST_GROUP_COLOR[entry.group] }}
              aria-hidden
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ms-auto tabular-nums text-foreground">{money(entry.value)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
