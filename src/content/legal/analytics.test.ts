import { describe, it, expect } from "vitest";
import { analyticsProviders, andList, websiteAnalyticsParagraphs } from "./analytics";

describe("privacy analytics wording follows the switches", () => {
  it("names nothing when everything is off", () => {
    const off = { ga4Id: null, vercel: false, posthog: false };
    expect(analyticsProviders(off)).toEqual([]);
    expect(websiteAnalyticsParagraphs(off).join(" ")).toContain("does not use");
  });
  it("names each provider that is on", () => {
    const on = { ga4Id: "G-TEST123", vercel: true, posthog: true };
    const text = websiteAnalyticsParagraphs(on).join(" ");
    expect(text).toContain("Google Analytics runs only on our marketing pages");
    expect(text).toContain("Global Privacy Control");
    expect(text).toContain("Vercel Web Analytics");
    expect(text).toContain("PostHog");
    expect(text).not.toMatch(/—/);
    expect(analyticsProviders({ ...on, ga4Id: null })).toHaveLength(2);
  });
  it("joins lists in plain English", () => {
    expect(andList(["a", "b", "c"])).toBe("a, b and c");
    expect(andList(["a"])).toBe("a");
  });
});
