import { describe, expect, it } from "vitest";
import { isStudioAppLive, studioAppAvailability } from "../../config/studioApp";
import { homeContent, landingPageFor, LANDING_ROUTES } from "./pages";
import { homeLd, studioAppLd } from "./schema";

const SITE = "https://tandavastudio.com";
const allText = (o: unknown) => JSON.stringify(o);

describe("studio app launch flag", () => {
  it("is live only when the flag says true", () => {
    expect(isStudioAppLive("true")).toBe(true);
    expect(isStudioAppLive(" TRUE ")).toBe(true);
    for (const v of [undefined, null, "", "false", "1", "yes"]) expect(isStudioAppLive(v)).toBe(false);
  });

  it("says coming soon until launch", () => {
    expect(studioAppAvailability(false)).toMatch(/coming soon/i);
    expect(studioAppAvailability(true)).not.toMatch(/coming soon/i);
  });

  it("only puts install links in structured data once live", () => {
    expect(studioAppLd(SITE, false)).not.toHaveProperty("installUrl");
    expect(studioAppLd(SITE, true)).toHaveProperty("installUrl");
  });
});

describe("marketing copy", () => {
  const variants = [false, true].flatMap((live) => [
    homeContent(live),
    ...LANDING_ROUTES.map((r) => landingPageFor(r, live)),
  ]);

  it("has a page for every landing route", () => {
    for (const r of LANDING_ROUTES) expect(landingPageFor(r, false)?.route).toBe(r);
    expect(landingPageFor("/nope", false)).toBeUndefined();
  });

  it("uses no em dashes, no prices and never names the method", () => {
    for (const v of variants) {
      const t = allText(v);
      expect(t).not.toContain("—");
      expect(t).not.toMatch(/\$\d/);
      expect(t).not.toMatch(/embodied flow/i);
    }
  });

  it("does not promise the app is downloadable before launch", () => {
    const t = allText([homeContent(false), ...LANDING_ROUTES.map((r) => landingPageFor(r, false))]);
    expect(t).not.toMatch(/download (it|the app) (now|today)/i);
    expect(allText(homeLd(SITE, false))).not.toContain("apps.apple.com");
  });

  it("keeps titles and descriptions in search-friendly lengths", () => {
    for (const v of variants) {
      if (!v) continue;
      expect(v.title.length).toBeLessThanOrEqual(60);
      expect(v.description.length).toBeGreaterThanOrEqual(70);
      expect(v.description.length).toBeLessThanOrEqual(170);
    }
  });
});

describe("home FAQ", () => {
  it("only lists questions about things that work today", async () => {
    const { HELP } = await import("../help");
    const { HOME_FAQ_IDS } = await import("./pages");
    for (const id of HOME_FAQ_IDS) {
      const entry = HELP.find((e) => e.id === id);
      expect(entry, id).toBeDefined();
      expect(entry?.status).toBeUndefined();
    }
  });
});
