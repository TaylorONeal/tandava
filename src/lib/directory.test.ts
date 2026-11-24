import { describe, expect, it } from "vitest";
import { type DirectoryStudio, facets, filterStudios, softwareLine, styleFacet, updateMailto, STYLES, PLATFORMS } from "./directory";

const base: DirectoryStudio = {
  slug: "sun-yoga-austin",
  name: "Sun Yoga",
  brand: null,
  business_type: "yoga_studio",
  status: "open",
  is_active: true,
  status_note: null,
  opened_year: null,
  closed_year: null,
  address: { area: "Zilker", locality: "Austin", region_code: "TX", region_name: "Texas", country_code: "US", country_name: "United States" },
  geo: null,
  links: { website: "https://sunyoga.com", instagram: "sunyoga", facebook: null, youtube: null, tiktok: null, booking: null },
  description: "Sun Yoga is a yoga studio in Zilker, Austin, TX.",
  styles: ["power-vinyasa"],
  levels: [],
  software: { current: [{ platform_id: "arketa", role: "system_of_record", verified: false }], previous: [{ platform_id: "mindbody", role: "system_of_record", verified: false }] },
  offers: { teacher_training: null, on_demand: null, retreats: null, drop_in: null },
  map_ref: "https://www.openstreetmap.org/node/1",
  last_refreshed_at: "2026-11-10T09:00:00Z",
  last_verified_at: null,
} as DirectoryStudio;

const closed: DirectoryStudio = {
  ...base,
  slug: "old-yoga-seattle",
  name: "Old Yoga",
  status: "permanently_closed",
  is_active: false,
  address: { ...base.address, area: null, locality: "Seattle", region_code: "WA", region_name: "Washington" },
  styles: ["yin"],
  software: { current: [], previous: [{ platform_id: "mindbody", role: "system_of_record", verified: false }] },
};

describe("studio directory", () => {
  it("taxonomy loads", () => {
    expect(STYLES.length).toBeGreaterThan(50);
    expect(PLATFORMS.some((p) => p.id === "momence")).toBe(true);
  });

  it("hides closed studios unless asked", () => {
    expect(filterStudios([base, closed], {}).map((s) => s.name)).toEqual(["Sun Yoga"]);
    expect(filterStudios([base, closed], { show: "all" })).toHaveLength(2);
    expect(filterStudios([base, closed], { show: "archived" }).map((s) => s.name)).toEqual(["Old Yoga"]);
  });

  it("a hidden sub-style counts as its public parent", () => {
    expect(styleFacet("power-vinyasa")?.id).toBe("power");
    expect(filterStudios([base], { style: "power" })).toHaveLength(1);
  });

  it("software filter is about what a studio uses now", () => {
    expect(filterStudios([base], { software: "arketa" })).toHaveLength(1);
    expect(filterStudios([base], { software: "mindbody" })).toHaveLength(0);
    expect(filterStudios([base, closed], { software: "unknown", show: "all" }).map((s) => s.name)).toEqual(["Old Yoga"]);
  });

  it("filters by place and search words", () => {
    expect(filterStudios([base, closed], { region: "WA", show: "all" }).map((s) => s.name)).toEqual(["Old Yoga"]);
    expect(filterStudios([base], { q: "zilker power" })).toHaveLength(1);
  });

  it("facets count the other filters", () => {
    const f = facets([base, closed], { show: "all" });
    expect(f.city.map((o) => o.value).sort()).toEqual(["Austin", "Seattle"]);
  });

  it("software line uses the shared wording", () => {
    expect(softwareLine(base)).toBe("Booking via Arketa. Previously: Mindbody.");
    expect(softwareLine(closed)).toBe("Previously: Mindbody.");
  });

  it("update email links carry the listing", () => {
    const href = updateMailto("hello@purafieldstudio.com", base, "remove");
    expect(href.startsWith("mailto:hello@purafieldstudio.com?subject=")).toBe(true);
    expect(decodeURIComponent(href)).toContain("tandavastudio.com/studios/sun-yoga-austin");
  });
});
