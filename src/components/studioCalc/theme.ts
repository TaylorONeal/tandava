/**
 * Shared visual language for the studio calculator.
 *
 * Chart colours are Tandava's own accents from src/index.css (teal, coral,
 * gold, sage) rather than Recharts defaults, so the dashboard reads as part of
 * the product. Tandava ships a single dark theme, so these are tuned for
 * contrast against the dark plum background rather than for both modes.
 */

export const CHART = {
  // Cost groups, one per brand accent. Occupancy takes coral because rent is
  // the line that most often needs to be looked at first.
  occupancy: "#f687b3", // --accent-coral
  labor: "#4fd1c5", // --accent-teal
  opex: "#d4a574", // --accent-gold
  variable: "#7d9e6a", // --accent-sage

  // Semantics. Teal doubles as the "healthy" signal because it is already the
  // completed/success colour everywhere else in the app.
  positive: "#4fd1c5",
  negative: "#e0645f",
  amber: "#d4a574",
  neutral: "rgba(245, 240, 232, 0.45)",
  /** "You are here" markers. Coral reads as attention without reading as alarm. */
  current: "#f687b3",
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
