import { describe, it, expect } from "vitest";
import { buildNarrative } from "./studioNarrative";
import { PRESETS, clonePresetInputs, computeStudio, getPreset } from "./studioEcon";

const BANNED_VERBS = /\b(must|should|need to (?!\d)|unlock|supercharge|maximize|skyrocket)\b/i;

describe("studioNarrative", () => {
  it("produces three to five sentences for every preset", () => {
    for (const preset of PRESETS) {
      const inputs = clonePresetInputs(preset);
      const lines = buildNarrative(inputs, computeStudio(inputs));
      expect(lines.length).toBeGreaterThanOrEqual(3);
      expect(lines.length).toBeLessThanOrEqual(5);
    }
  });

  it("never uses exclamation points or hype language", () => {
    for (const preset of PRESETS) {
      const inputs = clonePresetInputs(preset);
      for (const line of buildNarrative(inputs, computeStudio(inputs))) {
        expect(line).not.toContain("!");
        expect(line).not.toMatch(BANNED_VERBS);
        expect(line).not.toContain("—");
      }
    }
  });

  it("puts a number in every sentence", () => {
    for (const preset of PRESETS) {
      const inputs = clonePresetInputs(preset);
      for (const line of buildNarrative(inputs, computeStudio(inputs))) {
        expect(line).toMatch(/\d/);
      }
    }
  });

  it("reports being above break-even for a profitable studio", () => {
    const inputs = clonePresetInputs(getPreset("two-room-boutique"));
    const lines = buildNarrative(inputs, computeStudio(inputs));
    expect(lines[0]).toContain("above cash break-even");
  });

  it("reports being below break-even when members are cut", () => {
    const inputs = clonePresetInputs(getPreset("two-room-boutique"));
    inputs.members = 180;
    const lines = buildNarrative(inputs, computeStudio(inputs));
    expect(lines[0]).toContain("below cash break-even");
  });

  it("mentions aggregator dilution only when the share is above the threshold", () => {
    const inputs = clonePresetInputs(getPreset("two-room-boutique"));
    inputs.classPass = { enabled: true, shareOfVisits: 0.2, netPerVisit: 9.5 };
    expect(buildNarrative(inputs, computeStudio(inputs)).join(" ")).toContain("Aggregator visits");

    inputs.classPass = { enabled: true, shareOfVisits: 0.08, netPerVisit: 9.5 };
    expect(buildNarrative(inputs, computeStudio(inputs)).join(" ")).not.toContain("Aggregator visits");
  });

  it("uses consider rather than a stronger verb for the reserve advice", () => {
    const inputs = clonePresetInputs(getPreset("two-room-boutique"));
    const joined = buildNarrative(inputs, computeStudio(inputs)).join(" ");
    expect(joined).toContain("consider holding");
  });
});
