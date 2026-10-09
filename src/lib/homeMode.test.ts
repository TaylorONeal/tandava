import { describe, it, expect } from "vitest";
import { parseHomeMode, resolveHomeTarget, workspacePath, manageHeaderName, type HomeInputs } from "./homeMode";

const base: HomeInputs = {
  studioSlug: null,
  isDemoMode: false,
  isLoading: false,
  hasProfile: false,
  canManage: false,
  homeMode: "platform",
};

describe("parseHomeMode", () => {
  it("defaults to platform", () => {
    expect(parseHomeMode(undefined)).toBe("platform");
    expect(parseHomeMode("")).toBe("platform");
    expect(parseHomeMode("nonsense")).toBe("platform");
  });
  it("accepts discover case-insensitively", () => {
    expect(parseHomeMode("discover")).toBe("discover");
    expect(parseHomeMode(" Discover ")).toBe("discover");
  });
});

describe("resolveHomeTarget (HOME-01)", () => {
  it("studio subdomain always wins", () => {
    expect(resolveHomeTarget({ ...base, studioSlug: "oxatl", isDemoMode: true, homeMode: "discover" })).toBe("storefront");
  });
  it("demo mode shows the demo, never Discover", () => {
    expect(resolveHomeTarget({ ...base, isDemoMode: true, homeMode: "discover" })).toBe("demo");
  });
  it("waits for the session before choosing", () => {
    expect(resolveHomeTarget({ ...base, isLoading: true, homeMode: "discover" })).toBe("loading");
  });
  it("guest + platform mode → platform landing (current behavior preserved)", () => {
    expect(resolveHomeTarget(base)).toBe("platform");
  });
  it("guest + discover mode → Discover", () => {
    expect(resolveHomeTarget({ ...base, homeMode: "discover" })).toBe("discover");
  });
  it("signed-in users go to their workspace regardless of mode", () => {
    expect(resolveHomeTarget({ ...base, hasProfile: true, canManage: true, homeMode: "discover" })).toBe("workspace-manage");
    expect(resolveHomeTarget({ ...base, hasProfile: true, homeMode: "discover" })).toBe("workspace-member");
  });
});

describe("workspacePath", () => {
  it("sends managers to /manage", () => {
    expect(workspacePath("workspace-manage")).toBe("/manage");
  });
  it("sends students to Discover, not the sample-data schedule", () => {
    expect(workspacePath("workspace-member")).toBe("/discover");
  });
});

describe("manageHeaderName", () => {
  it("shows the owner's studio when live", () => {
    expect(manageHeaderName(true, "Purafield Studio (test)", "Oxatl Yoga")).toBe("Purafield Studio (test)");
  });
  it("never shows the sample studio to a live owner while loading", () => {
    expect(manageHeaderName(true, undefined, "Oxatl Yoga")).toBe("");
  });
  it("shows the sample studio in the demo", () => {
    expect(manageHeaderName(false, null, "Oxatl Yoga")).toBe("Oxatl Yoga");
  });
});
