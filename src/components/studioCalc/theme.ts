/**
 * Shared visual language for the studio calculator.
 *
 * Chart colours read the design tokens in src/index.css, so the calculator
 * follows the light paper system (and the opt-in Night theme) instead of
 * Recharts defaults. Lime is only ever a fill here, never a line or text.
 */

export const CHART = {
  // Cost groups, one per brand accent. Occupancy takes coral because rent is
  // the line that most often needs to be looked at first.
  occupancy: "hsl(var(--accent-peach))", // coral
  labor: "hsl(var(--accent-mint))", // teal
  opex: "hsl(var(--accent))", // lime (fill only)
  variable: "hsl(var(--foreground))", // ink

  // Semantics. These are also used as text colour, so they use the text-safe
  // status tokens rather than the bright accent fills.
  positive: "hsl(var(--success))",
  negative: "hsl(var(--destructive))",
  amber: "hsl(var(--warning))",
  neutral: "hsl(var(--muted-foreground))",
  /** "You are here" markers. Coral reads as attention without reading as alarm. */
  current: "var(--accent-coral)",
} as const;

export const RENT_LIGHT_COLOR = {
  green: CHART.positive,
  amber: CHART.amber,
  red: CHART.negative,
} as const;

export const COST_GROUP_COLOR = {
  occupancy: CHART.occupancy,
  labor: CHART.labor,
  opex: CHART.opex,
  variable: CHART.variable,
} as const;

export const COST_GROUP_LABEL = {
  occupancy: "Occupancy",
  labor: "Labor",
  opex: "Operating",
  variable: "Variable",
} as const;

/** Every chart on the page reserves its height so nothing shifts on recompute. */
export const CHART_HEIGHT = 260;
export const CHART_HEIGHT_SM = 200;
