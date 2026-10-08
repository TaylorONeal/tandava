import { describe, expect, it } from "vitest";
import { describeClassTime, offsetMinutes, zoneAbbreviation, zoneName } from "./classTime";

// Instants are written in UTC so the tests mean the same thing on any machine.

describe("booking a class in another time zone", () => {
  it("Austin visitor booking a Hawaii class sees Hawaii time first, then their own", () => {
    // Sat Oct 10 2026, 6:00-7:00 AM in Honolulu (HST, UTC-10) = 16:00Z.
    const t = describeClassTime({
      startsAt: "2026-10-10T16:00:00Z",
      endsAt: "2026-10-10T17:00:00Z",
      studioTimeZone: "Pacific/Honolulu",
      viewerTimeZone: "America/Chicago",
    });
    expect(t.primary).toBe("Sat, Oct 10 · 6:00 – 7:00 AM");
    expect(t.zoneLabel).toBe("Hawaii time (HST)");
    expect(t.viewerNote).toBe("That's 11:00 AM your time (Central time)");
    expect(t.sameZoneAsViewer).toBe(false);
  });

  it("no extra line when the viewer is in the studio's zone", () => {
    const t = describeClassTime({
      startsAt: "2026-10-10T23:00:00Z", // 6 PM CDT
      studioTimeZone: "America/Chicago",
      viewerTimeZone: "America/Chicago",
    });
    expect(t.primary).toBe("Sat, Oct 10 · 6:00 PM");
    expect(t.zoneLabel).toBe("Central time (CDT)");
    expect(t.viewerNote).toBeNull();
  });

  it("names the viewer's day when it differs (Bali visitor, Austin evening class)", () => {
    // Fri Oct 9, 7:00 PM CDT = Sat 00:00Z = Sat 8:00 AM in Makassar (UTC+8).
    const t = describeClassTime({
      startsAt: "2026-10-10T00:00:00Z",
      studioTimeZone: "America/Chicago",
      viewerTimeZone: "Asia/Makassar",
    });
    expect(t.primary).toBe("Fri, Oct 9 · 7:00 PM");
    expect(t.viewerNote).toBe("That's 8:00 AM Sat your time (Bali time)");
  });

  it("handles a period change across the range (11:30 AM – 12:30 PM)", () => {
    const t = describeClassTime({
      startsAt: "2026-10-10T16:30:00Z",
      endsAt: "2026-10-10T17:30:00Z",
      studioTimeZone: "America/Chicago",
    });
    expect(t.primary).toBe("Sat, Oct 10 · 11:30 AM – 12:30 PM");
  });

  it("Arizona does not observe DST: same offset as Pacific in summer, not in winter", () => {
    const summer = "2026-07-15T17:00:00Z";
    const winter = "2026-12-15T17:00:00Z";
    expect(
      describeClassTime({ startsAt: summer, studioTimeZone: "America/Phoenix", viewerTimeZone: "America/Los_Angeles" })
        .viewerNote,
    ).toBeNull();
    expect(
      describeClassTime({ startsAt: winter, studioTimeZone: "America/Phoenix", viewerTimeZone: "America/Los_Angeles" })
        .viewerNote,
    ).toBe("That's 9:00 AM your time (Pacific time)");
  });

  it("follows the DST change: Austin class the morning after fall-back", () => {
    // Sun Nov 1 2026: US clocks fall back at 2 AM. 9:00 AM CST = 15:00Z.
    const t = describeClassTime({
      startsAt: "2026-11-01T15:00:00Z",
      studioTimeZone: "America/Chicago",
      viewerTimeZone: "Pacific/Honolulu",
    });
    expect(t.primary).toBe("Sun, Nov 1 · 9:00 AM");
    expect(t.zoneLabel).toBe("Central time (CST)");
    expect(t.viewerNote).toBe("That's 5:00 AM your time (Hawaii time)");
  });

  it("unknown viewer zone: studio time and zone only, never a guess", () => {
    const t = describeClassTime({ startsAt: "2026-10-10T16:00:00Z", studioTimeZone: "Pacific/Honolulu" });
    expect(t.viewerNote).toBeNull();
    expect(t.short).toBe("Sat, Oct 10 · 6:00 AM Hawaii time");
  });

  it("a livestream is still shown in studio time with the viewer line", () => {
    const t = describeClassTime({
      startsAt: "2026-10-10T16:00:00Z",
      studioTimeZone: "Pacific/Honolulu",
      viewerTimeZone: "America/New_York",
      delivery: "virtual",
    });
    expect(t.zoneLabel).toBe("Hawaii time (HST)");
    expect(t.viewerNote).toBe("That's 12:00 PM your time (Eastern time)");
  });

  it("on-demand video has no clock at all", () => {
    const t = describeClassTime({
      startsAt: "2026-10-10T16:00:00Z",
      studioTimeZone: "Pacific/Honolulu",
      viewerTimeZone: "America/Chicago",
      delivery: "on_demand",
    });
    expect(t.primary).toBe("Watch any time");
    expect(t.zoneLabel).toBeNull();
    expect(t.viewerNote).toBeNull();
  });
});

describe("zone helpers", () => {
  it("plain-language names, with an IANA-city fallback", () => {
    expect(zoneName("Pacific/Honolulu")).toBe("Hawaii time");
    expect(zoneName("Europe/Lisbon")).toBe("Lisbon time");
    expect(zoneName("America/Argentina/Buenos_Aires")).toBe("Buenos Aires time");
  });

  it("drops GMT-style abbreviations rather than show 'GMT+8'", () => {
    expect(zoneAbbreviation("Asia/Makassar", new Date("2026-10-10T00:00:00Z"))).toBeNull();
    expect(zoneAbbreviation("America/Chicago", new Date("2026-10-10T00:00:00Z"))).toBe("CDT");
  });

  it("offsets are DST-aware", () => {
    expect(offsetMinutes("America/Chicago", new Date("2026-07-01T12:00:00Z"))).toBe(-300);
    expect(offsetMinutes("America/Chicago", new Date("2026-12-01T12:00:00Z"))).toBe(-360);
    expect(offsetMinutes("Pacific/Honolulu", new Date("2026-07-01T12:00:00Z"))).toBe(-600);
  });
});
