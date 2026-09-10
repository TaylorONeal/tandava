/**
 * Round-trip tests for shared studio-calculator scenarios.
 *
 * The acceptance bar is exact: paste a shared link, get the identical scenario.
 * These tests compare the decoded inputs field by field AND compare the model
 * output, so a field that silently fails to encode shows up as a different
 * EBITDA rather than passing unnoticed.
 */
import { describe, it, expect } from "vitest";
import { encodeScenario, decodeScenario, scenarioUrl, modifiedAssumptionKeys } from "./studioCalcUrl";
import { PRESETS, clonePresetInputs, computeStudio, getPreset, type StudioInputs } from "./studioEcon";

function roundTrip(inputs: StudioInputs, presetId: string) {
  return decodeScenario(encodeScenario(inputs, presetId));
}

describe("studioCalcUrl — round trip", () => {
  it("round-trips every preset exactly", () => {
    for (const preset of PRESETS) {
      const inputs = clonePresetInputs(preset);
      const back = roundTrip(inputs, preset.id);
      expect(back.presetId).toBe(preset.id);
      expect(back.inputs).toEqual(inputs);
      expect(computeStudio(back.inputs).ebitda).toBeCloseTo(computeStudio(inputs).ebitda, 6);
    }
  });

  it("round-trips a heavily customized scenario", () => {
    const inputs: StudioInputs = {
      cityTier: 1,
      rooms: [
        { mats: 44, classesPerWeek: 31, heated: true },
        { mats: 22, classesPerWeek: 19, heated: false },
        { mats: 12, classesPerWeek: 7, heated: true },
      ],
      membershipPrice: 217.5,
      businessModel: "pack-led",
      software: "custom",
      classPass: { enabled: true, shareOfVisits: 0.185, netPerVisit: 11.25 },
      members: 412,
      memberVisitsPerMonth: 6.15,
      teacherPay: { base: 55, perHeadBonus: 2.5, bonusThreshold: 14 },
      ownerIsGm: true,
      ancillary: { teacherTraining: true, workshops: true, rentals: true },
      assumptions: {
        rentPerSf: 58.5,
        softwareCost: 412,
        payrollBurdenRate: 0.135,
        marketingFloor: 3200,
        donationAverage: 18,
      },
    };
    const back = roundTrip(inputs, "two-room-boutique");
    expect(back.inputs).toEqual(inputs);
    expect(computeStudio(back.inputs)).toEqual(computeStudio(inputs));
  });

  it("round-trips through a full URL", () => {
    const inputs = clonePresetInputs(getPreset("heated-power"));
    inputs.members = 287;
    const url = scenarioUrl(inputs, "heated-power", "https://www.cuecraftyoga.com");
    expect(url.startsWith("https://www.cuecraftyoga.com/tools/studio-calculator?")).toBe(true);
    const back = decodeScenario(new URL(url).search);
    expect(back.inputs).toEqual(inputs);
  });

  it("preserves the ClassPass off state rather than dropping the toggle", () => {
    const inputs = clonePresetInputs(getPreset("two-room-boutique"));
    inputs.classPass = { enabled: false, shareOfVisits: 0.22, netPerVisit: 13 };
    const back = roundTrip(inputs, "two-room-boutique");
    expect(back.inputs.classPass.enabled).toBe(false);
  });
});

describe("studioCalcUrl — malformed input", () => {
  it("falls back to the default preset for an empty query", () => {
    const back = decodeScenario("");
    expect(back.presetId).toBe("two-room-boutique");
    expect(back.inputs).toEqual(clonePresetInputs(getPreset("two-room-boutique")));
  });

  it("ignores a malformed room string instead of building a nonsense studio", () => {
    const back = decodeScenario("?p=two-room-boutique&r=abc,99x");
    expect(back.inputs.rooms).toEqual(clonePresetInputs(getPreset("two-room-boutique")).rooms);
  });

  it("rejects out-of-range and negative values", () => {
    const back = decodeScenario("?p=two-room-boutique&t=9&m=-40&mb=-5&vf=900&a=rps:-20");
    const base = clonePresetInputs(getPreset("two-room-boutique"));
    expect(back.inputs.cityTier).toBe(base.cityTier);
    expect(back.inputs.membershipPrice).toBe(base.membershipPrice);
    expect(back.inputs.members).toBe(base.members);
    expect(back.inputs.memberVisitsPerMonth).toBe(base.memberVisitsPerMonth);
    expect(back.inputs.assumptions.rentPerSf).toBeUndefined();
  });

  it("ignores an unknown preset, business model, and software id", () => {
    const back = decodeScenario("?p=nope&bm=nope&sw=nope");
    expect(back.presetId).toBe("two-room-boutique");
    expect(back.inputs.businessModel).toBe("membership-boutique");
    expect(back.inputs.software).toBe("enterprise-suite");
  });

  it("rejects a four-room studio", () => {
    const back = decodeScenario("?p=two-room-boutique&r=30x20,30x20,30x20,30x20");
    expect(back.inputs.rooms).toHaveLength(2);
  });
});

describe("studioCalcUrl — modified assumption tracking", () => {
  it("reports no modifications for an untouched preset", () => {
    const preset = getPreset("two-room-boutique");
    expect(modifiedAssumptionKeys(clonePresetInputs(preset), preset.id).size).toBe(0);
  });

  it("reports an edited assumption", () => {
    const inputs = clonePresetInputs(getPreset("two-room-boutique"));
    inputs.assumptions = { insurance: 900 };
    const modified = modifiedAssumptionKeys(inputs, "two-room-boutique");
    expect(modified.has("insurance")).toBe(true);
    expect(modified.size).toBe(1);
  });

  it("does not count a rent value that merely matches the selected tier", () => {
    const inputs = clonePresetInputs(getPreset("two-room-boutique"));
    inputs.assumptions = { rentPerSf: 43 }; // Tier 2's own number
    expect(modifiedAssumptionKeys(inputs, "two-room-boutique").has("rentPerSf")).toBe(false);
  });
});
