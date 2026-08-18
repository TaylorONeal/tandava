/**
 * Net cash against member count, from zero to the capacity ceiling.
 *
 * Every point re-runs the whole model rather than drawing a straight line
 * through two numbers, so the kinks caused by the marketing floor and the
 * teacher bonus threshold are visible instead of smoothed away.
 *
 * The current-members handle is draggable and writes straight back to the
 * input, and there is a keyboard-operable slider underneath it for anyone not
 * using a pointer.
 */
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import {
  capacityCeilingMembers,
  netCashAtMembers,
  type StudioInputs,
  type StudioResults,
} from "@/lib/studioEcon";
import { money, count } from "@/lib/studioNarrative";
import { CHART, CHART_HEIGHT } from "./theme";
import { usePrefersReducedMotion } from "./useAnimatedNumber";

const POINTS = 44;

interface Props {
  inputs: StudioInputs;
  results: StudioResults;
  onMembersChange: (members: number) => void;
}

export function BreakEvenMountain({ inputs, results, onMembersChange }: Props) {
  const reduced = usePrefersReducedMotion();

  const { curve, ceiling, zeroOffset } = useMemo(() => {
    const rawCeiling = capacityCeilingMembers(inputs);
    // 1.5x the capacity ceiling is meaningless; cap the axis at the ceiling or
    // 1.5x the current member count, whichever gives a readable picture.
    const max = Math.max(
      Math.min(rawCeiling, inputs.members * 2.2),
      inputs.members * 1.4,
      results.breakEvenMembers * 1.3,
      10,
    );
    const step = max / POINTS;
    const curve = Array.from({ length: POINTS + 1 }, (_, i) => {
      const members = Math.round(i * step);
      return { members, netCash: netCashAtMembers(inputs, members) };
    });
    // Where zero sits between the curve's extremes, 0..1 from the top. Used to
    // split the gradient so profit renders teal and the loss region renders
    // red instead of both wearing the same optimistic green.
    const values = curve.map((point) => point.netCash);
    const peak = Math.max(...values);
    const trough = Math.min(...values);
    const zeroOffset = peak <= 0 ? 0 : trough >= 0 ? 1 : peak / (peak - trough);
    return { curve, ceiling: rawCeiling, zeroOffset };
  }, [inputs, results.breakEvenMembers]);

  const maxMembers = curve[curve.length - 1].members;

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground">Net cash by member count</h3>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Break-even at {count(results.breakEvenMembers)} members. Drag the slider to move your
        member count.
      </p>

      <p className="sr-only">
        Monthly net cash rises with member count. The studio is loss-making below{" "}
        {count(results.breakEvenMembers)} members and profitable above it. At the current{" "}
        {count(inputs.members)} members, net cash is {money(results.ebitda)} a month. Seat capacity
        would support roughly {count(ceiling)} members at the current visit frequency.
      </p>

      <div style={{ height: CHART_HEIGHT }} className="mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={curve} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
            <defs>
              {/* Fill: teal fading toward zero, then red deepening below it. */}
              <linearGradient id="beProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset={0} stopColor={CHART.positive} stopOpacity={0.35} />
                <stop offset={zeroOffset} stopColor={CHART.positive} stopOpacity={0.03} />
                <stop offset={zeroOffset} stopColor={CHART.negative} stopOpacity={0.06} />
                <stop offset={1} stopColor={CHART.negative} stopOpacity={0.3} />
              </linearGradient>
              {/* Stroke: the line itself changes color at break-even. */}
              <linearGradient id="beStroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset={zeroOffset} stopColor={CHART.positive} />
                <stop offset={zeroOffset} stopColor={CHART.negative} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="members"
              type="number"
              domain={[0, "dataMax"]}
              tickCount={6}
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              label={{
                value: "members",
                position: "insideBottomRight",
                offset: -2,
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={54}
              tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
            />
            {/* The loss region: everything below zero. */}
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
            <Area
              type="monotone"
              dataKey="netCash"
              stroke="url(#beStroke)"
              strokeWidth={2}
              fill="url(#beProfit)"
              isAnimationActive={!reduced}
              animationDuration={300}
            />
            <ReferenceLine
              x={Math.min(results.breakEvenMembers, maxMembers)}
              stroke={CHART.negative}
              strokeDasharray="4 3"
              label={{
                value: "break-even",
                position: "insideTopLeft",
                fontSize: 10,
                fill: CHART.negative,
              }}
            />
            <ReferenceLine
              x={Math.min(inputs.members, maxMembers)}
              stroke={CHART.current}
              strokeWidth={2}
              // Bottom-right, so it cannot collide with the break-even label
              // when the two lines sit close together.
              label={{
                value: "you",
                position: "insideBottomRight",
                fontSize: 10,
                fill: CHART.current,
              }}
            />
            <RTooltip
              formatter={(value: number) => [money(value), "net cash"]}
              labelFormatter={(label: number) => `${count(label)} members`}
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

      <div className="mt-2">
        <label htmlFor="members-handle" className="sr-only">
          Current member count
        </label>
        <Slider
          id="members-handle"
          min={0}
          max={Math.round(maxMembers)}
          step={1}
          value={[Math.min(inputs.members, maxMembers)]}
          onValueChange={([v]) => onMembersChange(v)}
          data-testid="members-handle"
        />
        <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted-foreground">
          <span>0</span>
          <span className="text-foreground">{count(inputs.members)} members</span>
          <span>{count(maxMembers)}</span>
        </div>
      </div>
    </section>
  );
}
