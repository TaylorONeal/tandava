import { describe, it, expect, vi, afterEach } from "vitest";
import { classifyLink, consentDefaults, inEuropeTimeZone, initWebAnalytics, isMarketingPath, isPublicPath, privacySignalOn, resetWebAnalyticsForTests, CONSENT_REGIONS } from "./web";

describe("which pages get which analytics", () => {
  it("GA4 only on marketing pages", () => {
    for (const p of ["/for-studios", "/studio-app", "/blog", "/blog/some-post", "/tools/studio-calculator", "/privacy", "/support/"]) {
      expect(isMarketingPath(p, true)).toBe(true);
    }
    for (const p of ["/discover", "/s/oxatl", "/s/oxatl/book/abc", "/manage", "/manage/analytics", "/teach", "/staff/checkin", "/account", "/auth/login", "/kiosk/x", "/embed/schedule/x", "/blogger", "/admin"]) {
      expect(isMarketingPath(p, true)).toBe(false);
    }
  });
  it("the root is marketing only when it shows the platform landing", () => {
    expect(isMarketingPath("/", true)).toBe(true);
    expect(isMarketingPath("/", false)).toBe(false);
  });
  it("Vercel counts public pages and never signed-in areas", () => {
    expect(isPublicPath("/discover", false)).toBe(true);
    expect(isPublicPath("/s/oxatl", false)).toBe(true);
    expect(isPublicPath("/manage/members/123", true)).toBe(false);
    expect(isPublicPath("/my-schedule", true)).toBe(false);
  });
});

describe("privacy signals and consent", () => {
  it("honors DNT and GPC", () => {
    expect(privacySignalOn({ doNotTrack: "1" })).toBe(true);
    expect(privacySignalOn({ globalPrivacyControl: true })).toBe(true);
    expect(privacySignalOn({}, "1")).toBe(true);
    expect(privacySignalOn({ doNotTrack: "unspecified" })).toBe(false);
  });
  it("denies analytics by default in the EEA, UK and CH and ads everywhere", () => {
    const [regional, global] = consentDefaults();
    expect(regional.analytics_storage).toBe("denied");
    expect(regional.region).toEqual(expect.arrayContaining(["DE", "FR", "GB", "CH", "NO", "IS", "LI"]));
    expect(CONSENT_REGIONS).toHaveLength(32);
    expect(global.analytics_storage).toBe("granted");
    expect(global.ad_storage).toBe("denied");
    expect(global.ad_user_data).toBe("denied");
  });
  it("shows the notice only for European time zones", () => {
    expect(inEuropeTimeZone("Europe/Berlin")).toBe(true);
    expect(inEuropeTimeZone("America/Chicago")).toBe(false);
  });
});

describe("classifyLink", () => {
  it("names store clicks", () => {
    expect(classifyLink("https://apps.apple.com/app/id6831459731?mt=8", "tandavastudio.com")).toEqual({
      event: "store_click",
      params: { store: "app_store", app: "tandava_studio" },
    });
    expect(classifyLink("https://play.google.com/store/apps/details?id=com.x", "tandavastudio.com", { playStudioPackage: "com.x" })).toEqual({
      event: "store_click",
      params: { store: "google_play", app: "tandava_studio" },
    });
  });
  it("names outbound and contact clicks, ignores internal links", () => {
    expect(classifyLink("https://github.com/x", "tandavastudio.com")?.event).toBe("outbound_click");
    expect(classifyLink("mailto:someone@example.com", "tandavastudio.com")).toEqual({ event: "contact_click", params: { method: "email" } });
    expect(classifyLink("/for-studios", "tandavastudio.com")).toBeNull();
  });
});

describe("initWebAnalytics in a page", () => {
  function fakePage(path: string, nav: Record<string, unknown> = {}) {
    const scripts: { src: string }[] = [];
    const store = new Map<string, string>();
    const listeners: Record<string, () => void> = {};
    const loc = { pathname: path, search: "", href: `https://tandavastudio.com${path}`, host: "tandavastudio.com" };
    const history = {
      pushState: (_s: unknown, _t: string, url: string) => {
        loc.pathname = url;
        loc.href = `https://tandavastudio.com${url}`;
      },
      replaceState: () => {},
    };
    const w = {
      location: loc,
      history,
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
      addEventListener: (n: string, f: () => void) => void (listeners[n] = f),
    } as Record<string, unknown>;
    vi.stubGlobal("window", w);
    vi.stubGlobal("navigator", nav);
    vi.stubGlobal("document", {
      title: "Tandava",
      referrer: "",
      head: { appendChild: (s: { src: string }) => scripts.push(s) },
      body: null,
      createElement: () => ({}),
      addEventListener: () => {},
    });
    return { w, scripts, history };
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    resetWebAnalyticsForTests();
  });

  const config = { ga4Id: "G-TEST123", vercel: false, posthog: false, appStoreProviderToken: "", playStudioPackage: "" };

  it("does not load GA4 in the studio dashboard, and loads it on a marketing page", () => {
    const { w, scripts, history } = fakePage("/manage");
    initWebAnalytics({ config, rootIsMarketing: true });
    expect(scripts).toHaveLength(0);
    expect(w["ga-disable-G-TEST123"]).toBe(true);
    (w.history as typeof history).pushState(null, "", "/for-studios");
    expect(scripts.map((s) => s.src)).toEqual(["https://www.googletagmanager.com/gtag/js?id=G-TEST123"]);
    expect(w["ga-disable-G-TEST123"]).toBe(false);
    (w.history as typeof history).pushState(null, "", "/s/oxatl");
    expect(w["ga-disable-G-TEST123"]).toBe(true);
  });

  it("never loads GA4 when the browser sends Global Privacy Control", () => {
    const { scripts } = fakePage("/for-studios", { globalPrivacyControl: true });
    initWebAnalytics({ config, rootIsMarketing: true });
    expect(scripts).toHaveLength(0);
  });

  it("loads nothing without a measurement ID", () => {
    const { scripts } = fakePage("/for-studios");
    initWebAnalytics({ config: { ...config, ga4Id: null }, rootIsMarketing: true });
    expect(scripts).toHaveLength(0);
  });
});
