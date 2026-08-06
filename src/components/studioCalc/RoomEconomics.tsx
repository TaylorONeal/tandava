/**
 * Per-room economics, shown only when there is more than one room.
 *
 * Paired bars of break-even headcount against actual, plus the incremental cost
 * callout: what the bigger room costs per class, expressed in students.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StudioResults } from "@/lib/studioEcon";
import { money, count } from "@/lib/studioNarrative";
import { CHART, CHART_HEIGHT_SM } from "./theme";
import { usePrefersReducedMotion } from "./useAnimatedNumber";

export function RoomEconomics({ results }: { results: StudioResults }) {
  const reduced = usePrefersReducedMotion();
  if (results.perRoom.length < 2) return null;

  const data = results.perRoom.map((room) => ({
    name: `Room ${room.index + 1} (${room.mats} mats)`,
    breakEven: Number(room.breakEvenHeadcount.toFixed(1)),
    actual: Number(room.actualAvgHeadcount.toFixed(1)),
  }));

  // Compare the most and least expensive rooms per class.
  const sorted = [...results.perRoom].sort(
    (a, b) => b.fullyLoadedCostPerClass - a.fullyLoadedCostPerClass,
  );
  const dearest = sorted[0];
  const cheapest = sorted[sorted.length - 1];
  const costGap = dearest.fullyLoadedCostPerClass - cheapest.fullyLoadedCostPerClass;
  const headGap = dearest.breakEvenHeadcount - cheapest.breakEvenHeadcount;

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground">Room economics</h3>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Break-even headcount against the average the model has you running.
      </p>

      <p className="sr-only">
        {results.perRoom
          .map(
            (room) =>
              `Room ${room.index + 1} with ${room.mats} mats needs ${room.breakEvenHeadcount.toFixed(1)} students per class to break even and averages ${room.actualAvgHeadcount.toFixed(1)}, at a fully loaded cost of ${money(room.fullyLoadedCostPerClass)} per class.`,
          )
          .join(" ")}
      </p>

      <div style={{ height: CHART_HEIGHT_SM }} className="mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={34}
            />
            <RTooltip
              formatter={(value: number, name: string) => [
                `${value} students`,
                name === "breakEven" ? "break-even" : "actual",
              ]}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
                color: "hsl(var(--popover-foreground))",
              }}
            />
            <Legend
              formatter={(value: string) => (value === "breakEven" ? "break-even" : "actual")}
              wrapperStyle={{ fontSize: 11 }}
            />
            <Bar
              dataKey="breakEven"
              fill={CHART.negative}
              radius={[3, 3, 0, 0]}
              isAnimationActive={!reduced}
              animationDuration={300}
            />
            <Bar
              dataKey="actual"
              fill={CHART.positive}
              radius={[3, 3, 0, 0]}
              isAnimationActive={!reduced}
              animationDuration={300}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 rounded-md bg-muted px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
        Room {dearest.index + 1} costs {money(costGap)} more per class than room{" "}
        {cheapest.index + 1}, which is {count(headGap, 1)} students of difference at break-even.
        Fully loaded, that room runs {money(dearest.fullyLoadedCostPerClass)} per class.
      </p>
    </section>
  );
}
