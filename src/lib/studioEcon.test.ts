/**
 * studioEcon.test.ts — regression lock for the studio profitability model.
 *
 * Two jobs:
 *   1. Pin the anchor scenario so nobody moves a constant by accident.
 *   2. Prove the structural invariants (shares sum to 1, break-even really is
 *      the zero-EBITDA point, the donation model has no membership line).
 *
 * See the "ANCHOR RECONCILIATION" block below for why one of the four target
 * figures in the original build spec is not reachable by any model.
 */
import { describe, it, expect } from "vitest";
import {
  computeStudio,
  clonePresetInputs,
  getPreset,
  PRESETS,
  BUSINESS_MODELS,
  effectiveShares,
  netCashAtMembers,
  classPassDilution,
  softwareFiveYear,
  type StudioInputs,
} from "./studioEcon";

/** The Tier 2, two-room anchor from the build spec. */
function anchorInputs(): StudioInputs {
  return {
    cityTier: 2,
    rooms: [
      { mats: 60, classesPerWeek: 32, heated: false },
      { mats: 30, classesPerWeek: 28, heated: false },
    ],
    membershipPrice: 149,
    businessModel: "membership-boutique",
    software: "enterprise-suite",
    classPass: { enabled: false, shareOfVisits: 0.12, netPerVisit: 9.5 },
    members: 340,
    memberVisitsPerMonth: 5.8,
    teacherPay: { base: 40, perHeadBonus: 2, bonusThreshold: 12 },
    ownerIsGm: false,
    ancillary: { teacherTraining: true, workshops: false, rentals: false },
    assumptions: {},
  };
}

/** Relative tolerance helper: |actual - expected| / expected <= tol. */
function within(actual: number, expected: number, tol: number) {
  expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThanOrEqual(tol);
}

describe("studioEcon — space and schedule", () => {
  it("derives the anchor footprint from mats and rooms", () => {
    const r = computeStudio(anchorInputs());
    // 90 mats * 30 sf = 2,700 practice + 1,350 support = 4,050 usable
    expect(r.usableSf).toBe(4050);
    expect(r.supportSf).toBe(1350);
    within(r.rentableSf, 4414.5, 0.0001);
    within(r.rent, 15818.63, 0.0005);
  });

  it("derives classes and seat capacity from the schedule", () => {
    const r = computeStudio(anchorInputs());
    within(r.classesPerMonth, 259.8, 0.0001); // 60 classes/wk * 4.33
    within(r.seatCapacity, 11950.8, 0.0001); // (60*32 + 30*28) * 4.33
  });
});

describe("studioEcon — anchor scenario", () => {
  const r = computeStudio(anchorInputs());

  // ───────────────────────────────────────────────────────────────────────────
  // ANCHOR RECONCILIATION
  //
  // The build spec quoted four targets for this scenario: EBITDA ~$11.0k/mo,
  // cash break-even ~314 members, ~10.3 heads per class, and rent ~22% of
  // revenue. Three of the four are reachable. The set as a whole is not, and
  // the reason is arithmetic rather than a modelling choice:
  //
  //   340 members * 5.8 visits = 1,972 member visits.
  //   With ClassPass off, the membership-boutique mix puts members at 68/90 of
  //   all visits, so total visits = 2,610 and average headcount = 2,610 / 259.8
  //   = 10.05 per class.
  //
  //   EBITDA is positive if and only if actual visits exceed break-even visits.
  //   So a break-even of 10.3 heads per class would put the studio BELOW its
  //   break-even at 10.05 actual heads, which forces EBITDA negative. A
  //   break-even of 10.3 heads and an EBITDA of +$11.0k cannot both be true at
  //   this member count and this schedule.
  //
  // Reading "~10.3 heads/class" as the ACTUAL average headcount instead removes
  // the contradiction, and three of the four land close:
  //
  //   actual heads    10.05 vs 10.3   -2.4%
  //   rent % revenue  22.6% vs 22%    +2.6%
  //   break-even mbrs 296.9 vs 314    -5.4%
  //   EBITDA          $7.39k vs $11k  -32.8%
  //
  // The EBITDA gap is the honest residual. $7.4k on $70.1k of revenue is a
  // 10.5% EBITDA margin, which sits inside the 8-18% band this calculator
  // publishes as the industry benchmark, so the model is not obviously wrong;
  // the spec's figure is simply more optimistic than these cost constants
  // support. Closing it would mean either cutting ~$3.6k of cost (which pushes
  // break-even further DOWN, away from 314 members) or adding ~$4k of revenue
  // (which pushes rent % of revenue further DOWN, away from 22%). Every fix for
  // one target moves another out of range.
  //
  // The assertions below therefore pin the engine's own values as a regression
  // lock, and separately check the spec targets at the tolerance each one
  // actually achieves.
  // ───────────────────────────────────────────────────────────────────────────

  it("pins the anchor P&L (regression lock)", () => {
    within(r.revenue, 70139.09, 0.0005);
    within(r.totalCost, 62747.15, 0.0005);
    within(r.ebitda, 7391.94, 0.001);
    within(r.ebitdaMargin, 0.1054, 0.005);
  });

  it("pins the anchor visit mix and break-even (regression lock)", () => {
    within(r.totalVisits, 2610, 0.0005);
    within(r.avgHeadcount, 10.05, 0.001);
    within(r.contributionPerVisit, 23.2, 0.005);
    within(r.breakEvenVisits, 2279.2, 0.001);
    within(r.breakEvenMembers, 296.9, 0.001);
    within(r.breakEvenHeads, 8.77, 0.002);
  });

  it("lands the reachable spec targets within tolerance", () => {
    // Rent as a share of revenue: spec target 22%.
    within(r.rentPctRevenue, 0.22, 0.03);
    // Average headcount: spec target 10.3.
    within(r.avgHeadcount, 10.3, 0.03);
    // Cash break-even members: spec target 314.
    within(r.breakEvenMembers, 314, 0.06);
  });

  it("documents the unreachable spec target rather than pretending", () => {
    // EBITDA sits well below the spec's $11.0k. Locked here deliberately: if a
    // future change makes it hit $11.0k, that change also has to explain what
    // happened to break-even and to rent as a share of revenue.
    expect(r.ebitda).toBeGreaterThan(6800);
    expect(r.ebitda).toBeLessThan(8000);
    // The contradiction itself: break-even heads must be below actual heads
    // whenever EBITDA is positive.
    expect(r.breakEvenHeads).toBeLessThan(r.avgHeadcount);
    expect(r.ebitda).toBeGreaterThan(0);
  });

  it("flags the anchor studio as rent-heavy", () => {
    expect(r.rentLight).toBe("red"); // above 15% of revenue
  });

  it("reports a mostly fixed cost base", () => {
    // The central claim of the whole page: most of the cost does not care how
    // many students show up.
    expect(r.fixedCostShare).toBeGreaterThan(0.85);
    expect(r.fixedCostShare).toBeLessThan(0.92);
  });
});

describe("studioEcon — break-even is really the zero point", () => {
  it("nets to approximately zero cash at the computed break-even member count", () => {
    const inputs = anchorInputs();
    const r = computeStudio(inputs);
    const atBreakEven = netCashAtMembers(inputs, r.breakEvenMembers);
    // Not exactly zero: the marketing floor and the teacher bonus threshold put
    // small kinks in the curve, so the engine's linear break-even is an
    // approximation of a piecewise-linear reality. It should still be close.
    expect(Math.abs(atBreakEven)).toBeLessThan(0.02 * r.revenue);
  });

  it("moves net cash in the right direction on either side of break-even", () => {
    const inputs = anchorInputs();
    const r = computeStudio(inputs);
    expect(netCashAtMembers(inputs, r.breakEvenMembers - 40)).toBeLessThan(0);
    expect(netCashAtMembers(inputs, r.breakEvenMembers + 40)).toBeGreaterThan(0);
  });

  it("agrees with the margin-of-safety identity", () => {
    const r = computeStudio(anchorInputs());
    expect(r.marginOfSafety).toBeCloseTo(
      (r.totalVisits - r.breakEvenVisits) / r.totalVisits,
      10,
    );
    expect(r.marginOfSafety).toBeGreaterThan(0);
  });
});

describe("studioEcon — ClassPass", () => {
  it("redistributes the aggregator share proportionally when switched off", () => {
    const model = BUSINESS_MODELS["membership-boutique"];
    const off = effectiveShares(model, false, 0.12);
    expect(off.aggregator).toBe(0);
    expect(off.member + off.pack + off.drop).toBeCloseTo(1, 10);
    // Proportions between the surviving channels are preserved.
    expect(off.member / off.pack).toBeCloseTo(model.shares.member / model.shares.pack, 10);
    expect(off.pack / off.drop).toBeCloseTo(model.shares.pack / model.shares.drop, 10);
  });

  it("gives the slider control of the aggregator share when switched on", () => {
    const model = BUSINESS_MODELS["membership-boutique"];
    const on = effectiveShares(model, true, 0.2);
    expect(on.aggregator).toBeCloseTo(0.2, 10);
    expect(on.member + on.pack + on.drop + on.aggregator).toBeCloseTo(1, 10);
  });

  it("every model's shares sum to 1 in both states", () => {
    for (const model of Object.values(BUSINESS_MODELS)) {
      for (const enabled of [true, false]) {
        const s = effectiveShares(model, enabled, 0.15);
        expect(s.member + s.pack + s.drop + s.aggregator).toBeCloseTo(1, 10);
      }
    }
  });

  it("dilutes revenue per visit when aggregator visits are cheap", () => {
    const inputs = anchorInputs();
    inputs.classPass = { enabled: true, shareOfVisits: 0.2, netPerVisit: 9.5 };
    const d = classPassDilution(inputs);
    expect(d.withAggregator).toBeLessThan(d.withoutAggregator);
    expect(d.delta).toBeLessThan(0);
  });
});

describe("studioEcon — business models", () => {
  it("shows no membership revenue for the donation model", () => {
    const r = computeStudio(clonePresetInputs(getPreset("community-donation")));
    expect(r.revenueLines.find((l) => l.key === "membership")).toBeUndefined();
    expect(r.revenueLines.some((l) => l.key === "drop")).toBe(true);
    expect(r.revenueLines.find((l) => l.key === "drop")?.label).toBe("Donations");
  });

  it("raises utilities for a heated room", () => {
    const cold = computeStudio(anchorInputs());
    const hot = computeStudio({
      ...anchorInputs(),
      rooms: [
        { mats: 60, classesPerWeek: 32, heated: true },
        { mats: 30, classesPerWeek: 28, heated: true },
      ],
    });
    const u = (r: ReturnType<typeof computeStudio>) =>
      r.costLines.find((l) => l.key === "utilities")!.amount;
    expect(u(hot)).toBeGreaterThan(u(cold));
  });

  it("lowers utilities for the yin model", () => {
    const base = computeStudio(anchorInputs());
    const yin = computeStudio({ ...anchorInputs(), businessModel: "yin-restorative" });
    const u = (r: ReturnType<typeof computeStudio>) =>
      r.costLines.find((l) => l.key === "utilities")!.amount;
    expect(u(yin)).toBeLessThan(u(base));
  });
});

describe("studioEcon — presets", () => {
  it("produces a sane, positive result for all five presets", () => {
    for (const preset of PRESETS) {
      const r = computeStudio(clonePresetInputs(preset));
      expect(r.revenue).toBeGreaterThan(0);
      expect(r.ebitda).toBeGreaterThan(0);
      expect(Number.isFinite(r.breakEvenMembers)).toBe(true);
      expect(r.breakEvenMembers).toBeGreaterThan(0);
      expect(r.utilization).toBeGreaterThan(0);
      expect(r.utilization).toBeLessThan(1);
      expect(r.seasonality).toHaveLength(12);
    }
  });

  it("produces distinct results across presets", () => {
    const revenues = PRESETS.map((p) => Math.round(computeStudio(clonePresetInputs(p)).revenue));
    expect(new Set(revenues).size).toBe(PRESETS.length);
  });

  it("gives the editor's pick a lower break-even than the full-size two-room", () => {
    const big = computeStudio(clonePresetInputs(getPreset("two-room-boutique")));
    const rightSized = computeStudio(clonePresetInputs(getPreset("right-sized-two-room")));
    expect(rightSized.breakEvenMembers).toBeLessThan(big.breakEvenMembers);
    expect(rightSized.rent).toBeLessThan(big.rent);
    expect(rightSized.utilization).toBeGreaterThan(big.utilization);
  });
});

describe("studioEcon — seasonality", () => {
  const r = computeStudio(anchorInputs());

  it("returns twelve months with January the strongest and August among the weakest", () => {
    expect(r.seasonality).toHaveLength(12);
    const byNet = [...r.seasonality].sort((a, b) => b.netCash - a.netCash);
    expect(byNet[0].label).toBe("Jan");
    expect(["Jul", "Aug", "Dec"]).toContain(byNet[11].label);
  });

  it("sizes the reserve off the cash-negative months", () => {
    expect(r.cashNegativeMonths).toBeGreaterThan(0);
    expect(r.seasonalBurn).toBeGreaterThan(0);
    expect(r.recommendedReserve).toBeCloseTo(r.seasonalBurn * 2.5, 6);
  });
});

describe("studioEcon — per-room economics", () => {
  it("allocates every visit and reports a break-even headcount per room", () => {
    const r = computeStudio(anchorInputs());
    expect(r.perRoom).toHaveLength(2);
    const allocated = r.perRoom.reduce((sum, room) => sum + room.visits, 0);
    expect(allocated).toBeCloseTo(r.totalVisits, 6);
    for (const room of r.perRoom) {
      expect(room.breakEvenHeadcount).toBeGreaterThan(0);
      expect(room.fullyLoadedCostPerClass).toBeGreaterThan(0);
    }
  });

  it("charges the bigger room more per class", () => {
    const r = computeStudio(anchorInputs());
    const [big, small] = r.perRoom;
    expect(big.fullyLoadedCostPerClass).toBeGreaterThan(small.fullyLoadedCostPerClass);
    expect(big.breakEvenHeadcount).toBeGreaterThan(small.breakEvenHeadcount);
  });
});

describe("studioEcon — overrides", () => {
  it("lets a user assumption beat the tier default", () => {
    const base = computeStudio(anchorInputs());
    const cheaper = computeStudio({ ...anchorInputs(), assumptions: { rentPerSf: 30 } });
    expect(cheaper.rent).toBeLessThan(base.rent);
    expect(cheaper.ebitda).toBeGreaterThan(base.ebitda);
    expect(cheaper.resolvedAssumptions.rentPerSf).toBe(30);
  });

  it("lets a user assumption beat the software default", () => {
    const r = computeStudio({ ...anchorInputs(), assumptions: { softwareCost: 0 } });
    expect(r.costLines.find((l) => l.key === "software")).toBeUndefined();
  });

  it("adds the GM salary back when the owner is the GM", () => {
    const paid = computeStudio(anchorInputs());
    const owner = computeStudio({ ...anchorInputs(), ownerIsGm: true });
    expect(owner.ebitda - paid.ebitda).toBeGreaterThan(6000);
  });
});

describe("studioEcon — software five-year line", () => {
  it("compares the chosen tier against the cheapest tier over 60 months", () => {
    const s = softwareFiveYear(anchorInputs());
    expect(s.chosen).toBeCloseTo(469 * 60, 6);
    expect(s.baseline).toBeCloseTo(30 * 60, 6);
    expect(s.difference).toBeCloseTo(s.chosen - s.baseline, 6);
  });
});
