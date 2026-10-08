/**
 * How a class time is shown to a person who may not be where the studio is.
 *
 * Rules (PRD-022 "Time zones"):
 *   1. A scheduled class (in person, hybrid or livestream) is shown in the
 *      STUDIO's time zone, always with the zone named in plain words:
 *      "6:00 AM Hawaii time". The studio's clock is the one on the door.
 *   2. When the viewer's own zone has a different offset at that moment, add one
 *      line with their time: "That's 11:00 AM your time (Central time)". Never a
 *      bare abbreviation the viewer has to decode.
 *   3. If the viewer's day differs from the studio's day, say which day.
 *   4. On-demand video has no start time. Show "Watch any time", no clock.
 *
 * Pure and deterministic given (instant, zones, locale), so the cases that
 * Mindbody gets wrong (booking Hawaii from Austin, DST weekends, date-line
 * crossings) are unit tests, not hopes.
 */

export type ClassDelivery = "in_person" | "hybrid" | "virtual" | "on_demand";

export interface ClassTimeInput {
  startsAt: string | Date;
  endsAt?: string | Date | null;
  /** IANA zone of the studio (or the location, when locations carry one). */
  studioTimeZone: string;
  /** IANA zone of the viewer's device. Omit when unknown (SSR, tests). */
  viewerTimeZone?: string | null;
  delivery?: ClassDelivery;
  /** BCP 47 locale for formatting. Defaults to en-US. */
  locale?: string;
}

export interface ClassTimeDisplay {
  /** "Sat, Oct 10 · 6:00 – 7:00 AM", or "Watch any time" for on-demand. */
  primary: string;
  /** "Hawaii time (HST)". Null for on-demand. */
  zoneLabel: string | null;
  /** Primary + zone in one line, for compact rows. */
  short: string;
  /** "That's 11:00 AM your time (Central time)". Null when it adds nothing. */
  viewerNote: string | null;
  /** True when the viewer is (by offset) in the studio's zone at that instant. */
  sameZoneAsViewer: boolean;
}

/** Friendly names for common zones; everything else falls back to the IANA city. */
const ZONE_NAMES: Record<string, string> = {
  "Pacific/Honolulu": "Hawaii time",
  "America/Anchorage": "Alaska time",
  "America/Los_Angeles": "Pacific time",
  "America/Vancouver": "Pacific time",
  "America/Phoenix": "Arizona time",
  "America/Denver": "Mountain time",
  "America/Boise": "Mountain time",
  "America/Chicago": "Central time",
  "America/Mexico_City": "Mexico City time",
  "America/New_York": "Eastern time",
  "America/Detroit": "Eastern time",
  "America/Toronto": "Eastern time",
  "America/Puerto_Rico": "Atlantic time",
  "Europe/London": "UK time",
  "Europe/Dublin": "Ireland time",
  "Asia/Makassar": "Bali time",
  "Asia/Jakarta": "Jakarta time",
  "Asia/Bangkok": "Thailand time",
  "Asia/Kolkata": "India time",
  "Asia/Tokyo": "Japan time",
  "Australia/Sydney": "Sydney time",
};

/** Plain-language name for a zone: "Hawaii time", "Lisbon time". */
export function zoneName(timeZone: string): string {
  if (ZONE_NAMES[timeZone]) return ZONE_NAMES[timeZone];
  const city = timeZone.split("/").pop()?.replace(/_/g, " ");
  return city && city !== timeZone ? `${city} time` : timeZone;
}

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Zone abbreviation at an instant, or null when Intl only knows "GMT+8". */
export function zoneAbbreviation(timeZone: string, at: Date, locale = "en-US"): string | null {
  try {
    const part = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "short" })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName")?.value;
    if (!part || /^(GMT|UTC)/.test(part)) return null;
    return part;
  } catch {
    return null;
  }
}

/** Offset in minutes from UTC for a zone at an instant (DST-aware). */
export function offsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000);
}

/** Calendar day key (YYYY-MM-DD) of an instant in a zone. */
function dayKey(timeZone: string, at: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

function fmt(at: Date, timeZone: string, locale: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { timeZone, ...opts }).format(at);
}

const TIME: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
const DATE: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };

export function describeClassTime(input: ClassTimeInput): ClassTimeDisplay {
  const locale = input.locale ?? "en-US";
  const delivery = input.delivery ?? "in_person";

  if (delivery === "on_demand") {
    return {
      primary: "Watch any time",
      zoneLabel: null,
      short: "Watch any time",
      viewerNote: null,
      sameZoneAsViewer: true,
    };
  }

  const start = toDate(input.startsAt);
  const end = input.endsAt ? toDate(input.endsAt) : null;
  const tz = input.studioTimeZone;

  const date = fmt(start, tz, locale, DATE);
  const startTime = fmt(start, tz, locale, TIME);
  let range = startTime;
  if (end && end.getTime() > start.getTime()) {
    const endTime = fmt(end, tz, locale, TIME);
    // "6:00 – 7:00 AM" when both share a period, else "11:30 AM – 12:30 PM".
    // Browsers may put a narrow no-break space (U+202F) before AM/PM.
    const startParts = startTime.split(/[\s\u202f]+/);
    const endParts = endTime.split(/[\s\u202f]+/);
    range =
      startParts.length === 2 && endParts.length === 2 && startParts[1] === endParts[1]
        ? `${startParts[0]} – ${endTime}`
        : `${startTime} – ${endTime}`;
  }
  const primary = `${date} · ${range}`;

  const abbr = zoneAbbreviation(tz, start, locale);
  const name = zoneName(tz);
  const zoneLabel = abbr ? `${name} (${abbr})` : name;

  const viewer = input.viewerTimeZone || null;
  const sameZone = !viewer || offsetMinutes(viewer, start) === offsetMinutes(tz, start);

  let viewerNote: string | null = null;
  if (viewer && !sameZone) {
    const viewerTime = fmt(start, viewer, locale, TIME);
    const otherDay = dayKey(viewer, start) !== dayKey(tz, start);
    const day = otherDay ? ` ${fmt(start, viewer, locale, { weekday: "short" })}` : "";
    viewerNote = `That's ${viewerTime}${day} your time (${zoneName(viewer)})`;
  }

  return {
    primary,
    zoneLabel,
    short: `${primary} ${name}`,
    viewerNote,
    sameZoneAsViewer: sameZone,
  };
}

/** The device's IANA zone, or null when unavailable. */
export function deviceTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}
