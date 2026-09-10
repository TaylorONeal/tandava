import { describe, expect, it } from "vitest";
import {
  badges,
  forecast,
  IDEAS,
  initialPlan,
  initialStudio,
  playWeek,
  ROOMS,
  WEEKS,
} from "./engine";

describe("Studio Sprout economics", () => {
  it("reconciles income, every cost, owner pay and opening cash", () => {
    const r = forecast(initialStudio(), initialPlan());
    expect(r.revenue).toBe(116 * 18);
    expect(r.costs).toBe(900 + 300 + 12 * 55 + 70);
    expect(r.net).toBe(r.revenue - r.costs);
    expect(r.cash).toBe(3200 + r.net);
    expect(r.breakEvenVisits).toBe(108);
  });
  it("pays teachers for scheduled classes, including unfilled ones", () => {
    const small = forecast(initialStudio(), { ...initialPlan(), classes: 10 });
    const large = forecast(initialStudio(), { ...initialPlan(), classes: 16 });
    expect(small.visits).toBe(large.visits);
    expect(large.net).toBe(small.net - 6 * 55);
  });
  it("separates workshop income and costs and caps class attendance", () => {
    const r = forecast(initialStudio(), {
      classes: 8,
      yield: 14,
      idea: "workshop",
    });
    expect(r.visits).toBe(112);
    expect(r.extraRevenue).toBe(330);
    expect(r.initiative).toBe(190);
    expect(r.breakEvenVisits).toBe(Math.ceil((r.costs - 330) / 14));
  });
  it("makes room capacity and rent matter independently", () => {
    const plan = { ...initialPlan(), classes: 8, idea: "welcome" as const };
    const cozy = forecast(initialStudio("cozy"), plan);
    const loft = forecast(initialStudio("sunny"), plan);
    expect(cozy.visits).toBe(112);
    expect(loft.visits).toBe(132);
    expect(loft.fixed - cozy.fixed).toBe(250);
  });
  it("applies growth only to later weeks and does not mutate earlier state", () => {
    const start = initialStudio();
    const next = playWeek(start, initialPlan());
    expect(start.history).toHaveLength(0);
    expect(next.growth).toBe(12);
    expect(forecast(next, initialPlan()).demand).toBe(108 + 12 + 12 + 8);
  });
  it("completes six weeks, preserves cash reconciliation, and rejects a seventh", () => {
    let state = initialStudio();
    for (let week = 0; week < WEEKS.length; week++)
      state = playWeek(state, { ...initialPlan(), classes: 10 });
    expect(state.cash).toBe(
      3200 + state.history.reduce((sum, r) => sum + r.net, 0),
    );
    expect(state.history.reduce((sum, r) => sum + r.ownerPay, 0)).toBe(1800);
    expect(badges(state).every((b) => b.earned)).toBe(true);
    expect(() => playWeek(state, initialPlan())).toThrow(/complete/);
  });
  it("keeps every supported room and plan finite and internally consistent", () => {
    for (const room of ROOMS)
      for (const classes of [8, 10, 12, 14, 16])
        for (const yieldValue of [14, 18, 22])
          for (const idea of IDEAS) {
            let state = initialStudio(room.id);
            for (let week = 0; week < 6; week++) {
              state = playWeek(state, {
                classes,
                yield: yieldValue,
                idea: idea.id,
              });
              const r = state.history[week];
              expect(Number.isFinite(r.cash)).toBe(true);
              expect(r.visits).toBeLessThanOrEqual(r.capacity);
              expect(r.occupancy).toBeGreaterThanOrEqual(0);
              expect(r.occupancy).toBeLessThanOrEqual(1);
              expect(r.net).toBe(r.classRevenue + r.extraRevenue - r.costs);
            }
          }
  });
  it("rejects invalid plan values instead of leaking NaN into the UI", () => {
    expect(() =>
      forecast(initialStudio(), { ...initialPlan(), classes: NaN }),
    ).toThrow();
  });
});
