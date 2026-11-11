import { describe, it, expect, beforeEach, vi } from "vitest";
import { appName, campaignToken, consumeFirstOpen, detectPlatform, firstTouchFrom, readFirstTouch, rememberFirstTouch, superPropertiesFor } from "./appContext";

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  };
}

beforeEach(() => {
  vi.stubGlobal("window", { localStorage: memoryStorage() });
});

describe("detectPlatform / appName", () => {
  it("is web without Capacitor", () => {
    expect(detectPlatform({})).toBe("web");
    expect(appName("member", "web")).toBe("tandava");
  });
  it("reads the native platform and app", () => {
    const cap = { Capacitor: { isNativePlatform: () => true, getPlatform: () => "ios" } };
    expect(detectPlatform(cap)).toBe("ios");
    expect(appName("studio", "ios")).toBe("tandava_studio");
    expect(appName("member", "android")).toBe("tandava_member");
  });
});

describe("campaignToken", () => {
  it("lowercases and uses underscores", () => {
    expect(campaignToken("Spring-Launch 2026")).toBe("spring_launch_2026");
    expect(campaignToken("  ")).toBeUndefined();
  });
});

describe("first touch", () => {
  it("uses utm_source and utm_campaign when tagged", () => {
    expect(firstTouchFrom("https://x.test/?utm_source=Instagram&utm_medium=organic_social&utm_campaign=Launch-Week", null)).toEqual({
      source: "instagram",
      campaign: "launch_week",
    });
  });
  it("falls back to the channel", () => {
    expect(firstTouchFrom("https://x.test/", "https://www.google.com/")).toEqual({ source: "organic_search", campaign: undefined });
    expect(firstTouchFrom("https://x.test/", "")).toEqual({ source: "direct", campaign: undefined });
  });
  it("is set once and never overwritten", () => {
    rememberFirstTouch("https://x.test/?utm_source=newsletter&utm_campaign=oct", null);
    rememberFirstTouch("https://x.test/?utm_source=instagram", null);
    expect(readFirstTouch()).toEqual({ source: "newsletter", campaign: "oct" });
  });
});

describe("app_opened helpers", () => {
  it("first_open is true once", () => {
    expect(consumeFirstOpen()).toBe(true);
    expect(consumeFirstOpen()).toBe(false);
  });
  it("builds the super properties", () => {
    const p = superPropertiesFor({ env: { VITE_APP_VERSION: "1.2.3" }, url: "https://x.test/?utm_source=qr&utm_campaign=door", referrer: null, platform: "web" });
    expect(p).toEqual({ app: "tandava", app_version: "1.2.3", platform: "web", schema_version: 1, install_source: "qr", install_campaign: "door" });
  });
  it("leaves install source empty in the native apps", () => {
    const p = superPropertiesFor({ env: { VITE_NATIVE_APP: "member" }, url: "capacitor://localhost/", platform: "ios" });
    expect(p.app).toBe("tandava_member");
    expect(p.install_source).toBeUndefined();
  });
});
