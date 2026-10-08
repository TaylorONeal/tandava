import { describe, expect, it } from "vitest";
import {
  buildIcs,
  calendarPlatform,
  eventDescription,
  eventLocation,
  eventTitle,
  googleCalendarUrl,
  icsEscape,
  icsFileName,
  icsFold,
  icsUtc,
  type ClassEventInput,
} from "./classEvent";

const hawaii: ClassEventInput = {
  occurrenceId: "occ-123",
  attendeeKey: "bk-9",
  className: "Sunrise Flow",
  studioName: "Aloha Yoga",
  startsAt: "2026-10-10T16:00:00Z", // 6:00 AM HST
  endsAt: "2026-10-10T17:15:00Z",
  studioTimeZone: "Pacific/Honolulu",
  teacherName: "Kai Akana",
  room: "Lanai",
  locationName: "Kaimuki",
  addressLine1: "3600 Waialae Ave",
  city: "Honolulu",
  region: "HI",
  postalCode: "96816",
  country: "US",
  latitude: 21.2856,
  longitude: -157.8,
  manageUrl: "https://tandavastudio.com/my-schedule",
  cancellationMinutes: 720,
  now: new Date("2026-10-01T00:00:00Z"),
};

describe("event text", () => {
  it("title puts the class first", () => {
    expect(eventTitle(hawaii)).toBe("Sunrise Flow at Aloha Yoga");
  });

  it("location is one map-resolvable line, no 'US' suffix", () => {
    expect(eventLocation(hawaii)).toBe("Aloha Yoga Kaimuki, 3600 Waialae Ave, Honolulu, HI 96816");
  });

  it("keeps a non-US country", () => {
    expect(
      eventLocation({ ...hawaii, studioName: "Ubud Yoga", locationName: null, addressLine1: "Jl. Hanoman 44", city: "Ubud", region: "Bali", postalCode: "80571", country: "Indonesia" }),
    ).toBe("Ubud Yoga, Jl. Hanoman 44, Ubud, Bali 80571, Indonesia");
  });

  it("a livestream's location is the join link", () => {
    expect(eventLocation({ ...hawaii, delivery: "virtual", joinUrl: "https://zoom.us/j/1" })).toBe(
      "Online: https://zoom.us/j/1",
    );
  });

  it("description states the studio's time zone and the cancellation deadline in it", () => {
    const d = eventDescription(hawaii);
    expect(d).toContain("Teacher: Kai Akana");
    expect(d).toContain("Time: Sat, Oct 10 · 6:00 – 7:15 AM, Hawaii time (HST)");
    // 12 hours before 6:00 AM Sat = 6:00 PM Fri, Hawaii time.
    expect(d).toContain("Free cancellation until Fri, Oct 9 · 6:00 PM Hawaii time (HST)");
    expect(d).toContain("View or cancel: https://tandavastudio.com/my-schedule");
  });
});

describe("ics", () => {
  const ics = buildIcs(hawaii);
  const unfolded = ics.replace(/\r\n /g, "");

  it("uses UTC instants so every device lands on the right moment", () => {
    expect(icsUtc("2026-10-10T16:00:00.000Z")).toBe("20261010T160000Z");
    expect(unfolded).toContain("DTSTART:20261010T160000Z");
    expect(unfolded).toContain("DTEND:20261010T171500Z");
  });

  it("is CRLF-delimited, starts and ends correctly, and has a stable UID", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).not.toMatch(/[^\r]\n/);
    expect(unfolded).toContain("UID:occ-123-bk-9@tandava.app");
  });

  it("escapes commas in LOCATION and newlines in DESCRIPTION", () => {
    expect(unfolded).toContain("LOCATION:Aloha Yoga Kaimuki\\, 3600 Waialae Ave\\, Honolulu\\, HI 96816");
    expect(unfolded).toMatch(/DESCRIPTION:Teacher: Kai Akana\\nRoom: Lanai\\n/);
  });

  it("includes GEO, a 1-hour reminder, and no line over 75 octets", () => {
    expect(unfolded).toContain("GEO:21.285600;-157.800000");
    expect(unfolded).toContain("TRIGGER:-PT1H");
    for (const line of ics.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it("escape and fold primitives", () => {
    expect(icsEscape("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
    const long = "DESCRIPTION:" + "é".repeat(60);
    const folded = icsFold(long);
    expect(folded.replace(/\r\n /g, "")).toBe(long);
    for (const part of folded.split("\r\n")) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
  });
});

describe("manage link", () => {
  it("never labels the studio page as a cancel link", () => {
    const guest = eventDescription({ ...hawaii, manageUrl: null, studioUrl: "https://tandavastudio.com/s/aloha" });
    expect(guest).toContain("Studio: https://tandavastudio.com/s/aloha");
    expect(guest).not.toContain("View or cancel");
    expect(buildIcs({ ...hawaii, manageUrl: null, studioUrl: "https://tandavastudio.com/s/aloha" })).toContain(
      "URL:https://tandavastudio.com/s/aloha",
    );
  });
});

describe("google calendar link", () => {
  it("carries UTC dates, the studio zone, title and location", () => {
    const url = new URL(googleCalendarUrl(hawaii));
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("dates")).toBe("20261010T160000Z/20261010T171500Z");
    expect(url.searchParams.get("ctz")).toBe("Pacific/Honolulu");
    expect(url.searchParams.get("text")).toBe("Sunrise Flow at Aloha Yoga");
    expect(url.searchParams.get("location")).toBe("Aloha Yoga Kaimuki, 3600 Waialae Ave, Honolulu, HI 96816");
  });
});

describe("helpers", () => {
  it("file name uses the studio's calendar day", () => {
    // 7 PM Fri in Austin is already Saturday in UTC; the file says Friday.
    expect(icsFileName({ className: "Power Vinyasa Flow", startsAt: "2026-10-10T00:00:00Z", studioTimeZone: "America/Chicago" })).toBe(
      "power-vinyasa-flow-2026-10-09.ics",
    );
  });

  it("orders buttons by platform", () => {
    expect(calendarPlatform("Mozilla/5.0 (Linux; Android 14; Pixel 4 XL)")).toBe("android");
    expect(calendarPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe("apple");
    expect(calendarPlatform("Mozilla/5.0 (Windows NT 10.0)")).toBe("other");
  });
});
