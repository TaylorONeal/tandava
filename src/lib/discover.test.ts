import { describe, it, expect } from "vitest";
import type { DiscoverClassRow } from "@/types/database";
import {
  availableStyles,
  classHref,
  distinctStudioCount,
  filterClasses,
  groupByDay,
  hasEnoughSupply,
  localDay,
  spotsLabel,
} from "./discover";

function row(over: Partial<DiscoverClassRow> = {}): DiscoverClassRow {
  return {
    occurrence_id: "o1",
    starts_at: "2026-10-05T14:00:00Z",
    ends_at: "2026-10-05T15:00:00Z",
    offering_name: "Vinyasa Flow",
    style: "Vinyasa",
    level: "all",
    is_heated: false,
    duration_minutes: 60,
    drop_in_price_cents: 2200,
    currency: "USD",
    spots_left: 10,
    teacher_name: "Maya",
    location_name: "South Lamar",
    city: "Austin",
    state: "TX",
    studio_slug: "oxatl",
    studio_name: "Oxatl Yoga",
    studio_timezone: "America/Chicago",
    studio_primary_color: null,
    ...over,
  };
}

describe("localDay", () => {
  it("uses the studio timezone, not UTC", () => {
    // 02:00Z on Oct 6 is still Oct 5 evening in Austin.
    expect(localDay("2026-10-06T02:00:00Z", "America/Chicago")).toBe("2026-10-05");
    expect(localDay("2026-10-06T02:00:00Z", "Asia/Makassar")).toBe("2026-10-06");
  });
});

describe("filterClasses", () => {
  const rows = [
    row({ occurrence_id: "a", style: "Vinyasa" }),
    row({ occurrence_id: "b", style: "Yin", offering_name: "Slow Yin", teacher_name: "Sam" }),
    row({ occurrence_id: "c", style: null, offering_name: "Open Studio" }),
  ];

  it("returns everything with no filters", () => {
    expect(filterClasses(rows, {})).toHaveLength(3);
  });
  it("filters style case-insensitively and drops null styles", () => {
    expect(filterClasses(rows, { style: "yin" }).map((r) => r.occurrence_id)).toEqual(["b"]);
  });
  it("filters by studio-local day", () => {
    const next = row({ occurrence_id: "d", starts_at: "2026-10-07T14:00:00Z" });
    expect(filterClasses([...rows, next], { day: "2026-10-07" }).map((r) => r.occurrence_id)).toEqual(["d"]);
  });
  it("searches across class, studio, teacher and location", () => {
    expect(filterClasses(rows, { query: "sam" }).map((r) => r.occurrence_id)).toEqual(["b"]);
    expect(filterClasses(rows, { query: "south lamar" })).toHaveLength(3);
    expect(filterClasses(rows, { query: "nope" })).toHaveLength(0);
  });
  it("handles zero rows without crashing (DISC-02)", () => {
    expect(filterClasses([], { style: "yin", query: "x", day: "2026-10-05" })).toEqual([]);
    expect(groupByDay([])).toEqual([]);
    expect(availableStyles([])).toEqual([]);
  });
});

describe("availableStyles / supply", () => {
  it("returns sorted distinct styles", () => {
    const rows = [row({ style: "Yin" }), row({ style: "Vinyasa" }), row({ style: "Yin" }), row({ style: null })];
    expect(availableStyles(rows)).toEqual(["Vinyasa", "Yin"]);
  });
  it("counts distinct studios and applies the home threshold", () => {
    const rows = ["a", "b", "c", "d", "e"].map((s) => row({ studio_slug: s }));
    expect(distinctStudioCount(rows)).toBe(5);
    expect(hasEnoughSupply(rows)).toBe(true);
    expect(hasEnoughSupply(rows.slice(0, 4))).toBe(false);
    expect(hasEnoughSupply([...rows, ...rows])).toBe(true);
  });
});

describe("groupByDay", () => {
  it("groups by studio-local day in chronological order", () => {
    const rows = [
      row({ occurrence_id: "late", starts_at: "2026-10-06T03:00:00Z" }), // Oct 5 evening Austin
      row({ occurrence_id: "early", starts_at: "2026-10-05T13:00:00Z" }),
      row({ occurrence_id: "next", starts_at: "2026-10-06T14:00:00Z" }),
    ];
    const groups = groupByDay(rows);
    expect(groups.map((g) => g.day)).toEqual(["2026-10-05", "2026-10-06"]);
    expect(groups[0].classes.map((c) => c.occurrence_id)).toEqual(["early", "late"]);
  });
});

describe("spotsLabel / classHref", () => {
  it("labels capacity", () => {
    expect(spotsLabel(0)).toBe("Full");
    expect(spotsLabel(2)).toBe("2 left");
    expect(spotsLabel(9)).toBe("Open");
  });
  it("links to the studio storefront anchored to the class", () => {
    expect(classHref({ studio_slug: "oxatl", occurrence_id: "abc-1" })).toBe("/s/oxatl?class=abc-1");
  });
});
