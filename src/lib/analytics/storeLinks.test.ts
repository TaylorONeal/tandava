import { describe, it, expect } from "vitest";
import { appStoreUrl, playStoreUrl, siteCampaign } from "./storeLinks";

describe("appStoreUrl", () => {
  it("stays plain (with mt=8) without a provider token", () => {
    expect(appStoreUrl({ appId: "123", campaign: "tandava_site_hero" })).toBe("https://apps.apple.com/app/id123?mt=8");
  });
  it("adds pt and an underscore ct of at most 40 chars", () => {
    const u = new URL(appStoreUrl({ appId: "123", providerToken: "999", campaign: "Spring Launch-2026 IG story with a very long name" }));
    expect(u.searchParams.get("pt")).toBe("999");
    expect(u.searchParams.get("mt")).toBe("8");
    const ct = u.searchParams.get("ct")!;
    expect(ct).toMatch(/^[a-z0-9_]+$/);
    expect(ct.length).toBeLessThanOrEqual(40);
    expect(ct.startsWith("spring_launch_2026_ig_story")).toBe(true);
  });
});

describe("playStoreUrl", () => {
  it("encodes utm fields into referrer", () => {
    const u = new URL(playStoreUrl({ packageName: "com.example.app", source: "tandava_site", medium: "organic_social", campaign: "launch" }));
    expect(u.searchParams.get("id")).toBe("com.example.app");
    expect(u.searchParams.get("referrer")).toBe("utm_source=tandava_site&utm_medium=organic_social&utm_campaign=launch");
  });
  it("omits referrer when there is nothing to pass", () => {
    expect(playStoreUrl({ packageName: "com.example.app" })).toBe("https://play.google.com/store/apps/details?id=com.example.app");
  });
});

describe("siteCampaign", () => {
  it("prefers the visitor's original campaign", () => {
    expect(siteCampaign("hero", "ig_bio")).toBe("ig_bio");
  });
  it("falls back to the site and placement", () => {
    expect(siteCampaign("app_badge")).toBe("tandava_site_app_badge");
  });
});
