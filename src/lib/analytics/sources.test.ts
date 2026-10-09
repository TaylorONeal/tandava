import { describe, expect, it } from "vitest";
import { channelLabel, lastDays, sourceLine, summariseSources } from "./sources";
import type { AttributionSourceRow } from "@/types/attribution";

const row = (p: Partial<AttributionSourceRow>): AttributionSourceRow => ({
  channel: "direct",
  utm_source: null,
  utm_campaign: null,
  sessions: 0,
  new_people: 0,
  bookings: 0,
  purchases: 0,
  revenue_cents: 0,
  ...p,
});

describe("summariseSources", () => {
  it("groups by channel, sums, and sorts by revenue", () => {
    const s = summariseSources([
      row({ channel: "organic_social", utm_source: "instagram", utm_campaign: "a", sessions: 40, bookings: 4, revenue_cents: 2000 }),
      row({ channel: "organic_social", utm_source: "instagram", utm_campaign: "b", sessions: 10, bookings: 1, revenue_cents: 9000, purchases: 1 }),
      row({ channel: "direct", sessions: 100, bookings: 2, revenue_cents: 4000 }),
    ]);
    expect(s.channels.map((c) => c.channel)).toEqual(["organic_social", "direct"]);
    const social = s.channels[0];
    expect(social.sessions).toBe(50);
    expect(social.revenueCents).toBe(11000);
    expect(social.bookingRate).toBe(10);
    expect(social.rows[0].utm_campaign).toBe("b"); // highest revenue first
    expect(s.totals.sessions).toBe(150);
    expect(s.totals.bookings).toBe(7);
    expect(s.totals.bookingRate).toBe(4.7);
  });

  it("does not divide by zero when conversions have no tracked visits", () => {
    const s = summariseSources([row({ channel: "unknown", bookings: 3, revenue_cents: 1500 })]);
    expect(s.channels[0].bookingRate).toBeNull();
    expect(s.totals.bookingRate).toBeNull();
  });

  it("handles an empty report", () => {
    const s = summariseSources([]);
    expect(s.channels).toEqual([]);
    expect(s.totals.revenueCents).toBe(0);
  });
});

describe("labels", () => {
  it("names channels in plain words", () => {
    expect(channelLabel("embed")).toBe("Your website");
    expect(channelLabel("unknown")).toBe("Before tracking started");
    expect(channelLabel("some_new")).toBe("some new");
  });
  it("describes a source line", () => {
    expect(sourceLine({ utm_source: "instagram", utm_campaign: "fall" })).toBe("instagram · fall");
    expect(sourceLine({ utm_source: null, utm_campaign: null })).toBe("No campaign tags");
  });
  it("computes a day range", () => {
    const now = new Date("2026-10-08T12:00:00Z");
    expect(lastDays(30, now).from.toISOString()).toBe("2026-09-08T12:00:00.000Z");
  });
});
