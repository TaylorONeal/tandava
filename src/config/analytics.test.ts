import { describe, it, expect } from "vitest";
import { parseGa4Id, resolveVercelAnalytics, webAnalyticsConfig } from "./analytics";

describe("analytics switches", () => {
  it("everything is off with an empty environment", () => {
    expect(webAnalyticsConfig({})).toEqual({ ga4Id: null, vercel: false, posthog: false, appStoreProviderToken: "", playStudioPackage: "" });
  });
  it("accepts only a well-formed GA4 ID", () => {
    expect(parseGa4Id(" g-abc1234 ")).toBe("G-ABC1234");
    expect(parseGa4Id("UA-1234-1")).toBeNull();
    expect(parseGa4Id("")).toBeNull();
  });
  it("Vercel Web Analytics is on for Vercel builds unless turned off", () => {
    expect(resolveVercelAnalytics(undefined, "1")).toBe(true);
    expect(resolveVercelAnalytics("false", "1")).toBe(false);
    expect(resolveVercelAnalytics(undefined, undefined)).toBe(false);
    expect(resolveVercelAnalytics("true", undefined)).toBe(true);
  });
});
