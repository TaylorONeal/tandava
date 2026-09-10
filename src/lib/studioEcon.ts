/**
 * studioEcon.ts — the yoga studio profitability model behind /tools/studio-calculator.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT THIS FILE IS
 * ─────────────────────────────────────────────────────────────────────────────
 * A framework-free, dependency-free monthly P&L model for a bricks-and-mortar
 * yoga studio. Give it a room layout, a price, a member count and a business
 * model; it returns revenue, cost, EBITDA, break-even, utilization, per-room
 * economics and a twelve-month cash curve.
 *
 * It is deliberately readable top to bottom. Every constant is either sourced,
 * or labelled as an assumption, and every one of them can be overridden by the
 * caller through `inputs.assumptions`. Nothing is hidden in a spreadsheet.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE THE NUMBERS COME FROM (and how much to trust them)
 * ─────────────────────────────────────────────────────────────────────────────
 * These are MODELLED DEFAULTS, not quotes, and not a survey of real studios.
 * They are best-guess starting points assembled mid-2026 from:
 *
 *   - Retail lease comps in a Tier 2 US metro (Austin), where mid-2026 asking
 *     rents for street retail clustered near $26-27/sf/yr NNN before triple-net
 *     pass-throughs. The tier table below quotes ALL-IN (gross) rent, so it adds
 *     an allowance for those pass-throughs on top of asking.
 *   - Published membership prices at unlimited tiers in the same metros, taken
 *     as a cluster rather than any single studio.
 *   - Public wage aggregators (Payscale and similar) for yoga instructor and
 *     front-desk pay in US metros.
 *   - Ordinary small-business operating costs (insurance, cleaning, laundry,
 *     merchant processing, accounting) at small-studio scale.
 *
 * Every one of those varies enormously by market, lease, size, negotiation and
 * year. Treat the defaults as a starting point to argue with, then replace them
 * with your own quotes. The calculator exposes all of them for exactly that
 * reason.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT THIS MODEL DELIBERATELY DOES NOT DO
 * ─────────────────────────────────────────────────────────────────────────────
 *   - It models a STABILIZED year, not a ramp. A studio in month four does not
 *     look like this. Opening costs, build-out, free-trial burn and the first
 *     twelve months of member acquisition are outside the model.
 *   - It is EBITDA, not net income and not cash flow to the owner. No debt
 *     service, no build-out amortization, no depreciation, no taxes, no
 *     distributions, no owner draw beyond the GM salary line.
 *   - It has no working-capital model. Deferred revenue, annual prepays and
 *     payment timing all move real cash and none of them appear here.
 *   - It assumes one location.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOT FINANCIAL ADVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * This is an educational model. It is not accounting, tax, legal or investment
 * advice, and no output here is a projection of what any particular studio will
 * earn. Do not sign a lease on the strength of a number this file produced.
 * Take the output to an accountant who knows your market.
 *
 * Found a constant that is wrong for your market, or a formula that misstates
 * how studios actually run? Corrections are welcome — the whole point of
 * putting the math in one readable file is that it can be argued with. Tandava
 * is MIT licensed; open an issue or a pull request against this file.
 *
 *   https://github.com/TaylorONeal/tandava
 */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Types
// ─────────────────────────────────────────────────────────────────────────────

/** One practice room. A studio in this model has one to three. */
export interface RoomConfig {
  /** Mat capacity at a comfortable spacing. */
  mats: number;
  /** Scheduled classes per week in this room. */
  classesPerWeek: number;
  /** Heated room: drives utilities and laundry up. */
  heated: boolean;
}

export type CityTier = 1 | 2 | 3 | 4;

export type BusinessModelId =
  | "membership-boutique"
  | "heated-power"
  | "community-donation"
  | "pack-led"
  | "yin-restorative";

/**
 * Software choices are described by market POSITION, not by vendor name, and
 * the dollar figures are illustrative estimates for a two-room studio in
 * mid-2026 — not quotes, not scraped price pages, not endorsements. Published
 * pricing moves constantly and real invoices depend on plan, studio size,
 * add-on modules, contract length and what you negotiated. Enter your own
 * number; that is why `customSoftwareCost` exists.
 */
export type SoftwareChoiceId =
  | "enterprise-suite"
  | "modern-all-in-one"
  | "hybrid-online-first"
  | "boutique-focused"
  | "wellness-platform"
  | "self-hosted-open-source"
  | "custom";

export interface ClassPassConfig {
  enabled: boolean;
  /** Share of ALL studio visits arriving through the aggregator, 0-1. */
  shareOfVisits: number;
  /** Net dollars the studio actually keeps per aggregator visit. */
  netPerVisit: number;
}

export interface TeacherPay {
  /** Flat pay per class taught. */
  base: number;
  /** Extra dollars per head above `bonusThreshold`. */
  perHeadBonus: number;
  /** Headcount at which the per-head bonus starts. */
  bonusThreshold: number;
}

/** Optional revenue lines that not every studio runs. */
export interface AncillaryToggles {
  /** Teacher training. Defaults on for two rooms or more. */
  teacherTraining: boolean;
  /** Weekend workshops and series. */
  workshops: boolean;
  /** Renting the room out when you are not using it. */
  rentals: boolean;
}

/**
 * Every modelled constant, in one overridable bag. The UI writes user edits
 * straight into here, so "the assumptions are editable" is a property of the
 * engine rather than a feature bolted on beside it.
 */
export interface Assumptions {
  // Space
  /** Square feet per mat, including circulation. */
  sfPerMat: number;
  /** Lobby, changing, office and halls for a one-room studio. */
  supportSfBase: number;
  /** Additional support space per room beyond the first. */
  supportSfPerExtraRoom: number;
  /** Rentable-to-usable load factor: you pay for a share of common area. */
  loadFactor: number;
  /** Weeks per month (52 / 12). */
  weeksPerMonth: number;

  // Occupancy
  /** All-in rent, $/sf/yr. Set from the city tier, then editable. */
  rentPerSf: number;
  /** Utilities for a 2,700 sf unheated studio; scaled by size and heat. */
  utilitiesBase: number;
  /** Reference size for the utilities scaling curve. */
  utilitiesRefSf: number;

  // Labor
  frontDeskHourly: number;
  frontDeskBaseHours: number;
  frontDeskHoursPerRoom: number;
  frontDeskMaxHours: number;
  /** General manager, $6,250/mo ≈ $75k/yr. */
  gmSalary: number;
  /** Assistant manager and programming, two or more rooms. */
  asstProgrammingMulti: number;
  /** Same line, one room. */
  asstProgrammingSingle: number;
  /** Payroll taxes, workers comp and benefits as a share of wages. */
  payrollBurdenRate: number;

  // Fixed opex
  insurance: number;
  /** Marketing is the greater of a floor and a share of revenue. */
  marketingFloor: number;
  marketingRate: number;
  cleaningBase: number;
  laundryBase: number;
  repairs: number;
  music: number;
  internet: number;
  accounting: number;
  /** Miscellaneous plus failed and recovered payments. */
  miscFailedPayments: number;

  // Variable
  /** Card processing as a share of collected revenue. */
  merchantRate: number;
  /** Retail spend per member per month. */
  retailPerMember: number;
  /** Gross margin on that retail. */
  retailMargin: number;

  // Pricing relationships
  /** Class-pack price per class, as a multiple of the monthly membership. */
  packPriceRatio: number;
  /** Drop-in price, as a multiple of the monthly membership. */
  dropInRatio: number;
  /** Average donation for the donation model. */
  donationAverage: number;

  // Ancillary
  teacherTrainingRevenue: number;
  teacherTrainingMargin: number;
  workshopRevenue: number;
  /** Share of workshop revenue the house keeps after the presenter. */
  workshopHouseShare: number;
  rentalRevenue: number;

  // Software
  /** Resolved monthly software cost. Set from the choice, then editable. */
  softwareCost: number;
}

export interface StudioInputs {
  cityTier: CityTier;
  rooms: RoomConfig[];
  membershipPrice: number;
  businessModel: BusinessModelId;
  software: SoftwareChoiceId;
  classPass: ClassPassConfig;
  members: number;
  memberVisitsPerMonth: number;
  teacherPay: TeacherPay;
  /**
   * True when the owner works as the general manager and wants that salary
   * added back, so EBITDA reads as owner-operator cash rather than as the cost
   * of hiring someone to do the job. Default false: the salary is a real cost.
   */
  ownerIsGm: boolean;
  ancillary: AncillaryToggles;
  /** Sparse overrides layered on top of the derived defaults. */
  assumptions: Partial<Assumptions>;
}

export interface CostLine {
  key: string;
  label: string;
  amount: number;
  /** Which slice of the cost donut this belongs to. */
  group: CostGroup;
  /**
   * fixed        — does not move with attendance at all
   * step-fixed   — moves with the SCHEDULE, not with who shows up
   * variable     — moves with revenue or with headcount
   */
  behavior: "fixed" | "step-fixed" | "variable";
}

export type CostGroup = "occupancy" | "labor" | "opex" | "variable";

export interface RevenueLine {
  key: string;
  label: string;
  amount: number;
}

export interface RoomEconomics {
  index: number;
  mats: number;
  classesPerWeek: number;
  heated: boolean;
  classesPerMonth: number;
  seatCapacity: number;
  visits: number;
  actualAvgHeadcount: number;
  fullyLoadedCostPerClass: number;
  breakEvenHeadcount: number;
  revenuePerVisit: number;
}

export interface SeasonalMonth {
  /** 0 = January. */
  month: number;
  label: string;
  revenue: number;
  cost: number;
  netCash: number;
}

export interface StudioResults {
  // Space
  usableSf: number;
  supportSf: number;
  rentableSf: number;
  rent: number;

  // Schedule
  classesPerMonth: number;
  seatCapacity: number;

  // Visit mix
  totalVisits: number;
  memberVisits: number;
  packVisits: number;
  dropVisits: number;
  aggregatorVisits: number;
  /** Effective shares after ClassPass redistribution. */
  effectiveShares: VisitShares;
  avgHeadcount: number;

  // P&L
  revenueLines: RevenueLine[];
  revenue: number;
  costLines: CostLine[];
  totalCost: number;
  ebitda: number;
  ebitdaMargin: number;

  // Break-even
  contributionPerVisit: number;
  revenuePerVisit: number;
  netFixedToCover: number;
  breakEvenVisits: number;
  breakEvenMembers: number;
  breakEvenHeads: number;
  marginOfSafety: number;

  // Health
  utilization: number;
  rentPctRevenue: number;
  rentLight: "green" | "amber" | "red";
  fixedCostShare: number;

  // Detail
  perRoom: RoomEconomics[];
  seasonality: SeasonalMonth[];
  cashNegativeMonths: number;
  seasonalBurn: number;
  recommendedReserve: number;

  /** Everything actually used, after tier/model/software defaults + overrides. */
  resolvedAssumptions: Assumptions;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — City tiers
// ─────────────────────────────────────────────────────────────────────────────

export interface CityTierSpec {
  tier: CityTier;
  label: string;
  /** All-in (gross) rent, $/sf/yr. */
  rentPerSf: number;
  /** Where unlimited memberships tend to cluster in that tier. */
  typicalMembership: number;
  examples: string;
  tooltip: string;
}

/**
 * Rent here is ALL-IN: base rent plus an allowance for triple-net
 * pass-throughs (taxes, insurance, common area). Quoted asking rents are lower
 * and are not what you pay. These are market-level estimates, not comps for any
 * specific space — your actual number comes from your actual lease.
 */
export const CITY_TIERS: Record<CityTier, CityTierSpec> = {
  1: {
    tier: 1,
    label: "Tier 1 — trophy markets",
    rentPerSf: 62,
    typicalMembership: 240,
    examples: "NYC, SF, LA cores",
    tooltip:
      "Trophy-market rents. The lease decides everything here; most failures are signed, not operated.",
  },
  2: {
    tier: 2,
    label: "Tier 2 — high-growth metros",
    rentPerSf: 43,
    typicalMembership: 165,
    examples: "Austin, Denver, Seattle, Chicago, Miami",
    tooltip:
      "High-growth metros. Anchor data: Austin mid-2026, $26-27/sf NNN asking plus pass-throughs.",
  },
  3: {
    tier: 3,
    label: "Tier 3 — regional markets",
    rentPerSf: 30,
    typicalMembership: 125,
    examples: "Nashville, Portland, Phoenix, Atlanta",
    tooltip: "Regional markets. Rent relief is real; so are lower price ceilings.",
  },
  4: {
    tier: 4,
    label: "Tier 4 — small markets",
    rentPerSf: 20,
    typicalMembership: 95,
    examples: "Small metros, college towns",
    tooltip: "Small markets. Cheapest floor, thinnest ceiling, least competition.",
  },
};

/** Price warning threshold: how far above the tier cluster is worth a nudge. */
export const PRICE_WARNING_RATIO = 1.25;

export const PRICE_WARNING_TEXT =
  "Above the local cluster; make sure the product justifies it";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Business models
// ─────────────────────────────────────────────────────────────────────────────

export interface VisitShares {
  member: number;
  pack: number;
  drop: number;
  aggregator: number;
}

export interface BusinessModelSpec {
  id: BusinessModelId;
  label: string;
  shares: VisitShares;
  /** Default member visits per month for this model. */
  visitFreq: number;
  /** Multiplier on utilities (and laundry) for hot rooms and cool rooms. */
  utilitiesMultiplier: number;
  /** Suggested nudge to membership price, as a multiple. */
  priceSuggestionMultiplier: number;
  /** Donation-style pricing: drop-ins are the average donation, not a rate. */
  donationBased: boolean;
  note: string;
}

/**
 * The visit mix is the model's personality. It says who walks through the door,
 * not just how many. Shares are of TOTAL visits and sum to 1.
 */
export const BUSINESS_MODELS: Record<BusinessModelId, BusinessModelSpec> = {
  "membership-boutique": {
    id: "membership-boutique",
    label: "Membership boutique",
    shares: { member: 0.68, pack: 0.14, drop: 0.08, aggregator: 0.1 },
    visitFreq: 5.8,
    utilitiesMultiplier: 1,
    priceSuggestionMultiplier: 1,
    donationBased: false,
    note: "The standard play: recurring memberships carry the room.",
  },
  "heated-power": {
    id: "heated-power",
    label: "Heated power studio",
    shares: { member: 0.66, pack: 0.12, drop: 0.1, aggregator: 0.12 },
    visitFreq: 6.4,
    utilitiesMultiplier: 1.35,
    priceSuggestionMultiplier: 1.1,
    donationBased: false,
    note: "Higher visit frequency, higher utilities. Heat is a real line item.",
  },
  "community-donation": {
    id: "community-donation",
    label: "Community donation",
    shares: { member: 0.3, pack: 0.1, drop: 0.55, aggregator: 0.05 },
    visitFreq: 4,
    utilitiesMultiplier: 1,
    priceSuggestionMultiplier: 1,
    donationBased: true,
    note: "Most visits are donations. Average donation replaces the drop-in rate.",
  },
  "pack-led": {
    id: "pack-led",
    label: "Pack-led",
    shares: { member: 0.35, pack: 0.42, drop: 0.13, aggregator: 0.1 },
    visitFreq: 4.5,
    utilitiesMultiplier: 1,
    priceSuggestionMultiplier: 1,
    donationBased: false,
    note: "Class packs do the work, so the pack price per class matters most.",
  },
  "yin-restorative": {
    id: "yin-restorative",
    label: "Yin and restorative",
    shares: { member: 0.75, pack: 0.1, drop: 0.08, aggregator: 0.07 },
    visitFreq: 4.6,
    utilitiesMultiplier: 0.85,
    priceSuggestionMultiplier: 1,
    donationBased: false,
    note: "Lower utilities, loyal members, lower visit frequency. Watch churn: fewer visits per month means less habit holding the membership in place.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Software
// ─────────────────────────────────────────────────────────────────────────────

export interface SoftwareSpec {
  id: SoftwareChoiceId;
  label: string;
  /** Illustrative monthly estimate for a two-room studio, mid-2026. */
  cost: number;
  note: string;
}

/**
 * NO VENDORS ARE NAMED, ON PURPOSE.
 *
 * Studio management pricing is rarely public in a form you can compare, moves
 * several times a year, and depends on modules, size and negotiation. Naming a
 * product beside a number would imply a precision this model does not have, and
 * would date badly. So these are market POSITIONS with best-guess monthly
 * estimates attached, and every one of them is editable.
 *
 * If you have a real invoice in front of you, use "Custom" and type it in. That
 * number beats anything here.
 */
export const SOFTWARE_OPTIONS: SoftwareSpec[] = [
  {
    id: "enterprise-suite",
    label: "Enterprise suite (legacy incumbent tier)",
    cost: 469,
    note: "Full-suite platforms at the top of the market. Estimated mid-tier plan for a two-room studio; payment-processing lock-in is common at this tier, so the true cost is often higher than the license line.",
  },
  {
    id: "boutique-focused",
    label: "Boutique-focused platform",
    cost: 385,
    note: "Built specifically for boutique fitness and yoga. Estimate for a two-room studio.",
  },
  {
    id: "wellness-platform",
    label: "Broad wellness platform",
    cost: 349,
    note: "General wellness and fitness management. Estimate for a two-room studio.",
  },
  {
    id: "modern-all-in-one",
    label: "Modern all-in-one",
    cost: 275,
    note: "Newer all-in-one platforms positioned against the incumbents. Estimate for a two-room studio.",
  },
  {
    id: "hybrid-online-first",
    label: "Hybrid / online-first",
    cost: 250,
    note: "Strong on on-demand and hybrid programming. Estimate for a two-room studio.",
  },
  {
    id: "self-hosted-open-source",
    label: "Self-hosted / open source",
    cost: 30,
    note: "Open-source software you run yourself. You pay for hosting rather than a license, and you pay in setup and maintenance time instead. The dollar figure is hosting only.",
  },
  {
    id: "custom",
    label: "Custom (enter your own)",
    cost: 300,
    note: "Use your actual invoice. It beats every estimate on this list.",
  },
];

export const SOFTWARE_DISCLAIMER =
  "Software costs are illustrative estimates for a two-room studio in mid-2026, described by market position rather than by vendor. Published pricing varies by plan, studio size, modules, contract length and negotiation, and changes often. Enter your own quote for a real answer.";

/** The cheapest tier on the list, used for the five-year comparison line. */
export const SOFTWARE_BASELINE_ID: SoftwareChoiceId = "self-hosted-open-source";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Default assumptions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Defaults that do not depend on tier, model or software choice. Anything that
 * does depend on those is resolved in `resolveAssumptions` below.
 *
 * Every figure here is a modelled estimate. None of them is a quote.
 */
export const BASE_ASSUMPTIONS: Omit<Assumptions, "rentPerSf" | "softwareCost"> = {
  // Space. 30 sf per mat is a working number that already includes walking
  // room; a packed heated room runs tighter, a restorative room with props runs
  // looser.
  sfPerMat: 30,
  supportSfBase: 1100,
  supportSfPerExtraRoom: 250,
  loadFactor: 1.09,
  weeksPerMonth: 4.33,

  // Occupancy
  utilitiesBase: 1700,
  utilitiesRefSf: 2700,

  // Labor
  frontDeskHourly: 17,
  frontDeskBaseHours: 55,
  frontDeskHoursPerRoom: 20,
  frontDeskMaxHours: 95,
  gmSalary: 6250,
  asstProgrammingMulti: 3200,
  asstProgrammingSingle: 1400,
  payrollBurdenRate: 0.11,

  // Fixed opex
  insurance: 475,
  marketingFloor: 2000,
  marketingRate: 0.045,
  cleaningBase: 1400,
  laundryBase: 850,
  repairs: 1100,
  music: 135,
  internet: 310,
  accounting: 700,
  miscFailedPayments: 1500,

  // Variable
  merchantRate: 0.031,
  retailPerMember: 4.5,
  retailMargin: 0.48,

  // Pricing relationships. Expressed as ratios to the membership price so that
  // moving the membership moves the whole price ladder coherently.
  packPriceRatio: 0.135,
  dropInRatio: 0.175,
  donationAverage: 14,

  // Ancillary
  teacherTrainingRevenue: 3733,
  teacherTrainingMargin: 0.55,
  workshopRevenue: 2400,
  workshopHouseShare: 0.6,
  rentalRevenue: 1800,
};

export const CLASSPASS_DEFAULT_NET_PER_VISIT = 9.5;
export const CLASSPASS_NET_RANGE: [number, number] = [8, 14];
export const CLASSPASS_SHARE_RANGE: [number, number] = [0.05, 0.25];
/** Above this share, aggregator dilution is worth calling out in the narrative. */
export const CLASSPASS_DILUTION_THRESHOLD = 0.15;

/** Rent as a share of revenue: the traffic light thresholds. */
export const RENT_GREEN_MAX = 0.12;
export const RENT_AMBER_MAX = 0.15;

/**
 * Rent heuristic surfaced when the traffic light is clicked. Derived from the
 * Tier 2 two-room anchor: a $4/sf/yr move on ~4,400 rentable sf is about
 * $1,467/mo of rent, which at roughly $23 of contribution per visit and 5.8
 * visits per member is on the order of ten members of break-even.
 */
export const RENT_HEURISTIC =
  "Every $4/sf on the lease is about 10 members of break-even.";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — Seasonality indices
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Twelve-month indices, January first.
 *
 * Demand: January resolution peak, a spring plateau, the summer trough when
 * everyone is outside or away, a September return, and December falling off a
 * cliff for the holidays.
 *
 * Utility: the mirror image. Summer cooling and winter heating are the two
 * peaks; the shoulder months are cheap. A heated studio amplifies both.
 */
export const DEMAND_INDEX = [
  1.25, 1.16, 1.08, 1.1, 1.02, 0.93, 0.85, 0.83, 0.98, 1.05, 0.95, 0.8,
];
export const UTILITY_INDEX = [
  0.88, 0.84, 0.8, 0.85, 1.0, 1.2, 1.35, 1.4, 1.2, 0.9, 0.8, 0.78,
];
export const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
/** Months of seasonal burn a studio should hold in reserve. */
export const RESERVE_MULTIPLE = 2.5;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — Presets
// ─────────────────────────────────────────────────────────────────────────────

export interface StudioPreset {
  id: string;
  name: string;
  blurb: string;
  editorsPick?: boolean;
  editorsPickReason?: string;
  inputs: StudioInputs;
}

function baseInputs(overrides: Partial<StudioInputs>): StudioInputs {
  return {
    cityTier: 2,
    rooms: [{ mats: 60, classesPerWeek: 32, heated: false }],
    membershipPrice: 149,
    businessModel: "membership-boutique",
    software: "enterprise-suite",
    classPass: {
      enabled: false,
      shareOfVisits: 0.12,
      netPerVisit: CLASSPASS_DEFAULT_NET_PER_VISIT,
    },
    members: 340,
    memberVisitsPerMonth: 5.8,
    teacherPay: { base: 40, perHeadBonus: 2, bonusThreshold: 12 },
    ownerIsGm: false,
    ancillary: { teacherTraining: true, workshops: false, rentals: false },
    assumptions: {},
    ...overrides,
  };
}

export const PRESETS: StudioPreset[] = [
  {
    id: "one-room-neighborhood",
    name: "One-room neighborhood",
    blurb: "A single room in a regional market. Low rent, low ceiling, tight schedule.",
    inputs: baseInputs({
      cityTier: 3,
      rooms: [{ mats: 30, classesPerWeek: 26, heated: false }],
      membershipPrice: 119,
      members: 210,
      // At this size the owner is the manager. Paying a separate $75k GM out of
      // a 210-member studio is the fastest way to model a business that cannot
      // exist, so the salary is added back and shown as owner earnings.
      ownerIsGm: true,
      software: "modern-all-in-one",
      ancillary: { teacherTraining: false, workshops: false, rentals: false },
    }),
  },
  {
    id: "two-room-boutique",
    name: "Two-room boutique",
    blurb: "The default build: a big main room, a smaller second room, a Tier 2 metro.",
    inputs: baseInputs({
      cityTier: 2,
      rooms: [
        { mats: 60, classesPerWeek: 32, heated: false },
        { mats: 30, classesPerWeek: 28, heated: false },
      ],
      membershipPrice: 149,
      members: 340,
    }),
  },
  {
    id: "heated-power",
    name: "Heated power studio",
    blurb: "One hot room, high frequency, high utilities, higher price.",
    inputs: baseInputs({
      cityTier: 2,
      rooms: [{ mats: 45, classesPerWeek: 34, heated: true }],
      membershipPrice: 165,
      members: 300,
      businessModel: "heated-power",
      memberVisitsPerMonth: 6.4,
      ancillary: { teacherTraining: false, workshops: false, rentals: false },
    }),
  },
  {
    id: "community-donation",
    name: "Community donation",
    blurb: "Donation-based in a small market. Most visits are drop-ins at whatever people give.",
    inputs: baseInputs({
      cityTier: 4,
      rooms: [{ mats: 35, classesPerWeek: 24, heated: false }],
      // Not a membership rate: donation studios have no membership line. This
      // is the suggested monthly give, and it is only used to set pack pricing.
      membershipPrice: 75,
      members: 120,
      businessModel: "community-donation",
      memberVisitsPerMonth: 4,
      software: "self-hosted-open-source",
      teacherPay: { base: 30, perHeadBonus: 1, bonusThreshold: 12 },
      ownerIsGm: true,
      ancillary: { teacherTraining: false, workshops: false, rentals: false },
      // Donation studios run lean by necessity, not by preference: a limited
      // staffed desk, no programming assistant, word-of-mouth marketing.
      assumptions: {
        frontDeskBaseHours: 20,
        frontDeskHoursPerRoom: 10,
        asstProgrammingSingle: 0,
        marketingFloor: 400,
        accounting: 300,
        miscFailedPayments: 400,
      },
    }),
  },
  {
    id: "right-sized-two-room",
    name: "Right-sized two-room",
    blurb: "The same two-room idea with less square footage. Smaller rooms, same schedule, materially less rent.",
    editorsPick: true,
    editorsPickReason:
      "Trimming the main room from 60 mats to 45 and the second from 30 to 25 cuts about 600 sf of rentable space. The schedule and the member base barely notice; the lease notices every month. Break-even drops from the high 290s into the high 270s, utilization climbs, and the rent line stops setting the agenda. The bigger studio earns more in a good year and dies faster in a bad one.",
    inputs: baseInputs({
      cityTier: 2,
      rooms: [
        { mats: 45, classesPerWeek: 30, heated: false },
        { mats: 25, classesPerWeek: 26, heated: false },
      ],
      membershipPrice: 149,
      members: 300,
    }),
  },
];

export const DEFAULT_PRESET_ID = "two-room-boutique";

export function getPreset(id: string): StudioPreset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[1];
}

/** Deep clone so preset objects are never mutated by the UI. */
export function clonePresetInputs(preset: StudioPreset): StudioInputs {
  return {
    ...preset.inputs,
    rooms: preset.inputs.rooms.map((r) => ({ ...r })),
    classPass: { ...preset.inputs.classPass },
    teacherPay: { ...preset.inputs.teacherPay },
    ancillary: { ...preset.inputs.ancillary },
    assumptions: { ...preset.inputs.assumptions },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — Resolution helpers
// ─────────────────────────────────────────────────────────────────────────────

export function softwareSpec(id: SoftwareChoiceId): SoftwareSpec {
  return SOFTWARE_OPTIONS.find((s) => s.id === id) ?? SOFTWARE_OPTIONS[0];
}

/**
 * Layer the tier, the software choice and any explicit user overrides into one
 * flat set of constants. User overrides always win: if someone typed a rent
 * number, the tier does not get to argue.
 */
export function resolveAssumptions(inputs: StudioInputs): Assumptions {
  return {
    ...BASE_ASSUMPTIONS,
    rentPerSf: CITY_TIERS[inputs.cityTier].rentPerSf,
    softwareCost: softwareSpec(inputs.software).cost,
    ...inputs.assumptions,
  };
}

/**
 * Redistribute the aggregator share when ClassPass is switched off.
 *
 * The aggregator visits do not evaporate — the model treats the remaining
 * channels as absorbing them in proportion to their existing weight, so a
 * membership-led studio stays membership-led. Shares always sum to 1.
 */
export function effectiveShares(
  model: BusinessModelSpec,
  classPassEnabled: boolean,
  classPassShare: number,
): VisitShares {
  const base = model.shares;

  if (!classPassEnabled) {
    const rest = base.member + base.pack + base.drop;
    // Guard against a malformed model definition summing to zero.
    if (rest <= 0) return { member: 1, pack: 0, drop: 0, aggregator: 0 };
    return {
      member: base.member / rest,
      pack: base.pack / rest,
      drop: base.drop / rest,
      aggregator: 0,
    };
  }

  // ClassPass on: the slider owns the aggregator share, and the other three
  // channels split what is left in proportion to their model weights.
  const agg = clamp(classPassShare, 0, 0.9);
  const rest = base.member + base.pack + base.drop;
  const scale = rest > 0 ? (1 - agg) / rest : 0;
  return {
    member: base.member * scale,
    pack: base.pack * scale,
    drop: base.drop * scale,
    aggregator: agg,
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Heat multiplier: the business model sets the floor, a heated room raises it. */
function heatMultiplier(inputs: StudioInputs, model: BusinessModelSpec): number {
  const anyHeated = inputs.rooms.some((r) => r.heated);
  const heatedShare =
    inputs.rooms.length > 0
      ? inputs.rooms.filter((r) => r.heated).length / inputs.rooms.length
      : 0;
  // A model that is inherently hot or cool sets the baseline; individual heated
  // rooms add on top, pro-rated by how much of the studio is actually hot.
  const roomEffect = anyHeated ? 1 + 0.35 * heatedShare : 1;
  return model.utilitiesMultiplier * roomEffect;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — The model
// ─────────────────────────────────────────────────────────────────────────────

export function computeStudio(inputs: StudioInputs): StudioResults {
  const a = resolveAssumptions(inputs);
  const model = BUSINESS_MODELS[inputs.businessModel];
  const rooms = inputs.rooms.length > 0 ? inputs.rooms : [{ mats: 30, classesPerWeek: 20, heated: false }];

  // ── Space ────────────────────────────────────────────────────────────────
  // Practice space plus the support space nobody photographs and everybody
  // pays for, then grossed up by the load factor because you rent a share of
  // the building's common area too.
  const matSf = rooms.reduce((sum, r) => sum + r.mats * a.sfPerMat, 0);
  const supportSf = a.supportSfBase + a.supportSfPerExtraRoom * (rooms.length - 1);
  const usableSf = matSf + supportSf;
  const rentableSf = usableSf * a.loadFactor;
  const rent = (rentableSf * a.rentPerSf) / 12;

  // ── Schedule and capacity ────────────────────────────────────────────────
  const classesPerMonth =
    rooms.reduce((sum, r) => sum + r.classesPerWeek, 0) * a.weeksPerMonth;
  const seatCapacity =
    rooms.reduce((sum, r) => sum + r.mats * r.classesPerWeek, 0) * a.weeksPerMonth;

  // ── Visit mix ────────────────────────────────────────────────────────────
  // Member visits are the anchor: they are the one number an operator actually
  // knows. Everything else is scaled off the model's channel mix.
  const shares = effectiveShares(model, inputs.classPass.enabled, inputs.classPass.shareOfVisits);
  const memberVisits = inputs.members * inputs.memberVisitsPerMonth;
  const totalVisits = shares.member > 0 ? memberVisits / shares.member : 0;
  const packVisits = totalVisits * shares.pack;
  const dropVisits = totalVisits * shares.drop;
  const aggregatorVisits = totalVisits * shares.aggregator;
  const avgHeadcount = classesPerMonth > 0 ? totalVisits / classesPerMonth : 0;

  // ── Price ladder ─────────────────────────────────────────────────────────
  const packPricePerClass = inputs.membershipPrice * a.packPriceRatio;
  // A donation studio does not have a drop-in rate; it has an average donation.
  const dropInPrice = model.donationBased
    ? a.donationAverage
    : inputs.membershipPrice * a.dropInRatio;

  // ── Revenue ──────────────────────────────────────────────────────────────
  // A donation studio has no membership line. Its "members" are regulars, not
  // subscribers: they show up often and they give at the door like everyone
  // else, so their visits are valued at the average donation rather than at a
  // monthly rate. This is why the donation preset shows no membership revenue.
  const membershipRevenue = model.donationBased
    ? 0
    : inputs.members * inputs.membershipPrice;
  const packRevenue = packVisits * packPricePerClass;
  const dropRevenue = model.donationBased
    ? (dropVisits + memberVisits) * dropInPrice
    : dropVisits * dropInPrice;
  const aggregatorRevenue = aggregatorVisits * inputs.classPass.netPerVisit;
  const retailRevenue = inputs.members * a.retailPerMember;

  const ttRevenue = inputs.ancillary.teacherTraining ? a.teacherTrainingRevenue : 0;
  const workshopRevenue = inputs.ancillary.workshops ? a.workshopRevenue : 0;
  const rentalRevenue = inputs.ancillary.rentals ? a.rentalRevenue : 0;

  const revenueLines: RevenueLine[] = [
    { key: "membership", label: "Memberships", amount: membershipRevenue },
    { key: "pack", label: "Class packs", amount: packRevenue },
    {
      key: "drop",
      label: model.donationBased ? "Donations" : "Drop-ins",
      amount: dropRevenue,
    },
    { key: "aggregator", label: "Aggregator visits", amount: aggregatorRevenue },
    { key: "retail", label: "Retail", amount: retailRevenue },
    { key: "teacherTraining", label: "Teacher training", amount: ttRevenue },
    { key: "workshops", label: "Workshops", amount: workshopRevenue },
    { key: "rentals", label: "Room rentals", amount: rentalRevenue },
  ].filter((l) => l.amount > 0);

  const revenue = revenueLines.reduce((sum, l) => sum + l.amount, 0);
  /** Revenue that comes through the door on a mat. Drives contribution. */
  const visitRevenue =
    membershipRevenue + packRevenue + dropRevenue + aggregatorRevenue + retailRevenue;

  // ── Costs ────────────────────────────────────────────────────────────────
  // Size scale: utilities, cleaning and laundry grow with the box, but
  // sub-linearly. A studio twice the size does not cost twice as much to heat.
  const sizeScale = Math.sqrt(usableSf / a.utilitiesRefSf);
  const heat = heatMultiplier(inputs, model);

  const utilities = a.utilitiesBase * heat * sizeScale;

  // Teacher pay is STEP-FIXED. It is set by how many classes you put on the
  // schedule, not by how many people come. That is why cutting a class saves
  // real money and adding a student to a class costs almost nothing.
  const teacherBase = classesPerMonth * inputs.teacherPay.base;
  const teacherBonus =
    classesPerMonth *
    Math.max(0, avgHeadcount - inputs.teacherPay.bonusThreshold) *
    inputs.teacherPay.perHeadBonus;

  const frontDeskHours = Math.min(
    a.frontDeskMaxHours,
    a.frontDeskBaseHours + a.frontDeskHoursPerRoom * rooms.length,
  );
  const frontDesk = a.frontDeskHourly * frontDeskHours * a.weeksPerMonth;

  // The GM salary is always a real cost of running the studio. The toggle only
  // changes whether it is presented as a cost or added back as owner earnings.
  const gmSalary = inputs.ownerIsGm ? 0 : a.gmSalary;
  const asstProgramming =
    rooms.length >= 2 ? a.asstProgrammingMulti : a.asstProgrammingSingle;

  const laborSum = teacherBase + teacherBonus + frontDesk + gmSalary + asstProgramming;
  const payrollBurden = a.payrollBurdenRate * laborSum;

  const marketing = Math.max(a.marketingFloor, a.marketingRate * revenue);
  const cleaning = a.cleaningBase * sizeScale;
  const laundry = a.laundryBase * heat;
  const merchant = a.merchantRate * revenue;
  const retailCogs = retailRevenue * (1 - a.retailMargin);
  const ttCost = ttRevenue * (1 - a.teacherTrainingMargin);
  const workshopCost = workshopRevenue * (1 - a.workshopHouseShare);

  const allCostLines: CostLine[] = [
    { key: "rent", label: "Rent (all-in)", amount: rent, group: "occupancy", behavior: "fixed" },
    { key: "utilities", label: "Utilities", amount: utilities, group: "occupancy", behavior: "fixed" },
    { key: "teacherBase", label: "Teacher pay (per class)", amount: teacherBase, group: "labor", behavior: "step-fixed" },
    { key: "teacherBonus", label: "Teacher per-head bonus", amount: teacherBonus, group: "labor", behavior: "variable" },
    { key: "frontDesk", label: "Front desk", amount: frontDesk, group: "labor", behavior: "step-fixed" },
    { key: "gm", label: "General manager", amount: gmSalary, group: "labor", behavior: "fixed" },
    { key: "asst", label: "Assistant / programming", amount: asstProgramming, group: "labor", behavior: "fixed" },
    { key: "payrollBurden", label: "Payroll burden", amount: payrollBurden, group: "labor", behavior: "step-fixed" },
    { key: "insurance", label: "Insurance", amount: a.insurance, group: "opex", behavior: "fixed" },
    { key: "software", label: "Studio software", amount: a.softwareCost, group: "opex", behavior: "fixed" },
    { key: "marketing", label: "Marketing", amount: marketing, group: "opex", behavior: "variable" },
    { key: "cleaning", label: "Cleaning", amount: cleaning, group: "opex", behavior: "fixed" },
    { key: "laundry", label: "Laundry / towels", amount: laundry, group: "opex", behavior: "fixed" },
    { key: "repairs", label: "Repairs and maintenance", amount: a.repairs, group: "opex", behavior: "fixed" },
    { key: "music", label: "Music licensing", amount: a.music, group: "opex", behavior: "fixed" },
    { key: "internet", label: "Internet and phone", amount: a.internet, group: "opex", behavior: "fixed" },
    { key: "accounting", label: "Accounting", amount: a.accounting, group: "opex", behavior: "fixed" },
    { key: "misc", label: "Misc / failed payments", amount: a.miscFailedPayments, group: "opex", behavior: "fixed" },
    { key: "merchant", label: "Card processing", amount: merchant, group: "variable", behavior: "variable" },
    { key: "retailCogs", label: "Retail cost of goods", amount: retailCogs, group: "variable", behavior: "variable" },
    { key: "ttCost", label: "Teacher training delivery", amount: ttCost, group: "variable", behavior: "variable" },
    { key: "workshopCost", label: "Workshop presenter share", amount: workshopCost, group: "variable", behavior: "variable" },
  ];
  // Zero-value lines are dropped so the donut and the tables never render an
  // empty slice for a program the studio does not run.
  const costLines = allCostLines.filter((l) => l.amount > 0);

  const totalCost = costLines.reduce((sum, l) => sum + l.amount, 0);
  const ebitda = revenue - totalCost;
  const ebitdaMargin = revenue > 0 ? ebitda / revenue : 0;

  // ── Break-even ───────────────────────────────────────────────────────────
  // Contribution per visit: what one extra student on a mat is worth after the
  // costs that scale with them. Card processing and marketing both scale with
  // revenue, so both come out of contribution.
  const visitVariableCosts =
    (a.merchantRate + a.marketingRate) * visitRevenue + retailCogs + teacherBonus;
  const contributionPerVisit =
    totalVisits > 0 ? (visitRevenue - visitVariableCosts) / totalVisits : 0;
  const revenuePerVisit = totalVisits > 0 ? visitRevenue / totalVisits : 0;

  // Fixed cost to cover, net of what the ancillary programs contribute. A
  // teacher training that nets $2k a month is $2k of rent you do not need mats
  // to cover.
  const ancillaryNet =
    ttRevenue - ttCost + (workshopRevenue - workshopCost) + rentalRevenue;
  const fixedAndStepFixed = costLines
    .filter((l) => l.behavior !== "variable")
    .reduce((sum, l) => sum + l.amount, 0);
  const netFixedToCover = fixedAndStepFixed - ancillaryNet;

  const breakEvenVisits =
    contributionPerVisit > 0 ? netFixedToCover / contributionPerVisit : Infinity;
  const breakEvenMembers =
    inputs.memberVisitsPerMonth > 0
      ? (breakEvenVisits * shares.member) / inputs.memberVisitsPerMonth
      : Infinity;
  const breakEvenHeads = classesPerMonth > 0 ? breakEvenVisits / classesPerMonth : Infinity;
  const marginOfSafety =
    totalVisits > 0 && Number.isFinite(breakEvenVisits)
      ? (totalVisits - breakEvenVisits) / totalVisits
      : 0;

  // ── Health ratios ────────────────────────────────────────────────────────
  const utilization = seatCapacity > 0 ? totalVisits / seatCapacity : 0;
  const rentPctRevenue = revenue > 0 ? rent / revenue : 0;
  const rentLight: StudioResults["rentLight"] =
    rentPctRevenue < RENT_GREEN_MAX ? "green" : rentPctRevenue <= RENT_AMBER_MAX ? "amber" : "red";
  const fixedCostShare = totalCost > 0 ? fixedAndStepFixed / totalCost : 0;

  // ── Per-room economics ───────────────────────────────────────────────────
  // Costs are allocated three ways: occupancy by square footage, teacher pay by
  // classes actually taught in that room, everything else by share of classes.
  const totalRoomSf = rooms.reduce((sum, r) => sum + r.mats * a.sfPerMat, 0);
  const totalClassesPerWeek = rooms.reduce((sum, r) => sum + r.classesPerWeek, 0);
  const totalSeatCapacity = seatCapacity;
  const occupancyCost = rent + utilities;
  const teacherCost = teacherBase + teacherBonus;
  const otherCost = totalCost - occupancyCost - teacherCost;

  const perRoom: RoomEconomics[] = rooms.map((room, index) => {
    const roomSf = room.mats * a.sfPerMat;
    // Support space is shared, so it rides along with the practice-space split.
    const sfShare = totalRoomSf > 0 ? roomSf / totalRoomSf : 0;
    const classShare = totalClassesPerWeek > 0 ? room.classesPerWeek / totalClassesPerWeek : 0;
    const roomClassesPerMonth = room.classesPerWeek * a.weeksPerMonth;
    const roomSeatCapacity = room.mats * room.classesPerWeek * a.weeksPerMonth;
    const capShare = totalSeatCapacity > 0 ? roomSeatCapacity / totalSeatCapacity : 0;
    // Visits land where the seats are: a bigger room in the same schedule
    // absorbs more of the traffic.
    const roomVisits = totalVisits * capShare;

    const allocatedCost =
      occupancyCost * sfShare + teacherCost * classShare + otherCost * classShare;
    const fullyLoadedCostPerClass =
      roomClassesPerMonth > 0 ? allocatedCost / roomClassesPerMonth : 0;

    return {
      index,
      mats: room.mats,
      classesPerWeek: room.classesPerWeek,
      heated: room.heated,
      classesPerMonth: roomClassesPerMonth,
      seatCapacity: roomSeatCapacity,
      visits: roomVisits,
      actualAvgHeadcount: roomClassesPerMonth > 0 ? roomVisits / roomClassesPerMonth : 0,
      fullyLoadedCostPerClass,
      breakEvenHeadcount:
        revenuePerVisit > 0 ? fullyLoadedCostPerClass / revenuePerVisit : 0,
      revenuePerVisit,
    };
  });

  // ── Seasonality ──────────────────────────────────────────────────────────
  // Visit-driven revenue rides the demand index; ancillary revenue does not.
  // Utilities ride their own index. Everything else holds flat, which is
  // precisely the problem: the costs do not know it is July.
  const flatCost = totalCost - utilities - marketing - merchant - retailCogs - teacherBonus;
  const seasonality: SeasonalMonth[] = MONTH_LABELS.map((label, month) => {
    const demand = DEMAND_INDEX[month];
    const monthVisitRevenue = visitRevenue * demand;
    const monthRevenue = monthVisitRevenue + ttRevenue + workshopRevenue + rentalRevenue;
    const monthUtilities = utilities * UTILITY_INDEX[month] * heat;
    const monthMarketing = Math.max(a.marketingFloor, a.marketingRate * monthRevenue);
    const monthMerchant = a.merchantRate * monthRevenue;
    const monthRetailCogs = retailCogs * demand;
    const monthBonus =
      classesPerMonth *
      Math.max(0, avgHeadcount * demand - inputs.teacherPay.bonusThreshold) *
      inputs.teacherPay.perHeadBonus;
    const monthCost =
      flatCost + monthUtilities + monthMarketing + monthMerchant + monthRetailCogs + monthBonus;
    return {
      month,
      label,
      revenue: monthRevenue,
      cost: monthCost,
      netCash: monthRevenue - monthCost,
    };
  });

  const negatives = seasonality.filter((m) => m.netCash < 0);
  const cashNegativeMonths = negatives.length;
  const seasonalBurn = negatives.reduce((sum, m) => sum + Math.abs(m.netCash), 0);
  const recommendedReserve = seasonalBurn * RESERVE_MULTIPLE;

  return {
    usableSf,
    supportSf,
    rentableSf,
    rent,
    classesPerMonth,
    seatCapacity,
    totalVisits,
    memberVisits,
    packVisits,
    dropVisits,
    aggregatorVisits,
    effectiveShares: shares,
    avgHeadcount,
    revenueLines,
    revenue,
    costLines,
    totalCost,
    ebitda,
    ebitdaMargin,
    contributionPerVisit,
    revenuePerVisit,
    netFixedToCover,
    breakEvenVisits,
    breakEvenMembers,
    breakEvenHeads,
    marginOfSafety,
    utilization,
    rentPctRevenue,
    rentLight,
    fixedCostShare,
    perRoom,
    seasonality,
    cashNegativeMonths,
    seasonalBurn,
    recommendedReserve,
    resolvedAssumptions: a,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — Derived helpers used by the UI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Net cash at an arbitrary member count, holding everything else steady. This
 * is what draws the break-even curve: it re-runs the whole model at each point
 * rather than drawing a straight line through two numbers, so the kinks caused
 * by the marketing floor and the teacher bonus threshold show up honestly.
 */
export function netCashAtMembers(inputs: StudioInputs, members: number): number {
  return computeStudio({ ...inputs, members }).ebitda;
}

/**
 * Revenue per visit with and without the aggregator, for the dilution strip.
 * "Without" holds total visits constant and asks what the same traffic would be
 * worth if it all arrived through the studio's own channels.
 */
export function classPassDilution(inputs: StudioInputs): {
  withAggregator: number;
  withoutAggregator: number;
  delta: number;
} {
  const withOn = computeStudio(inputs);
  const withOff = computeStudio({
    ...inputs,
    classPass: { ...inputs.classPass, enabled: false },
  });
  return {
    withAggregator: withOn.revenuePerVisit,
    withoutAggregator: withOff.revenuePerVisit,
    delta: withOn.revenuePerVisit - withOff.revenuePerVisit,
  };
}

/** Five-year software spend for the current choice against the cheapest tier. */
export function softwareFiveYear(inputs: StudioInputs): {
  chosen: number;
  baseline: number;
  difference: number;
  chosenLabel: string;
  baselineLabel: string;
} {
  const a = resolveAssumptions(inputs);
  const baseline = softwareSpec(SOFTWARE_BASELINE_ID);
  return {
    chosen: a.softwareCost * 60,
    baseline: baseline.cost * 60,
    difference: (a.softwareCost - baseline.cost) * 60,
    chosenLabel: softwareSpec(inputs.software).label,
    baselineLabel: baseline.label,
  };
}

/** The capacity ceiling used as the right edge of the break-even curve. */
export function capacityCeilingMembers(inputs: StudioInputs): number {
  const r = computeStudio(inputs);
  const shares = r.effectiveShares;
  if (inputs.memberVisitsPerMonth <= 0 || shares.member <= 0) return inputs.members * 2;
  const visitsAtCapacity = r.seatCapacity;
  return (visitsAtCapacity * shares.member) / inputs.memberVisitsPerMonth;
}
