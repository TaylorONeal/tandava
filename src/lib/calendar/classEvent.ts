/**
 * "Add to calendar" for a booked class: one event description, two outputs.
 *
 *   - .ics (RFC 5545) for Apple Calendar on iPhone/iPad/Mac, Outlook, and any
 *     Android calendar that imports files.
 *   - A Google Calendar template link, which is the reliable path on Android:
 *     Chrome on Android downloads an .ics instead of offering to add it.
 *
 * Times are written in UTC ("Z"). Every calendar converts that to the device's
 * zone, so the event lands at the right instant wherever the person is, with no
 * VTIMEZONE block to get wrong. The studio's zone is still named in the
 * description, and passed to Google as ctz so its editor shows studio time.
 *
 * Title, location and description follow what reads well in a week view and a
 * lock-screen alert:
 *   SUMMARY   "Power Vinyasa Flow at Oxatl Yoga" (class first: it's what you scan for)
 *   LOCATION  full street address on one line, so Apple/Google Maps resolve it;
 *             for a livestream, the join link
 *   GEO       latitude;longitude when known (Apple uses it for travel time)
 *   DESCRIPTION teacher, room, the time in studio words, cancellation deadline,
 *             the manage link. Plain text, short lines.
 *   UID       stable per occurrence + person, so re-adding updates, not duplicates
 *   VALARM    1 hour before (Apple honours it; Google uses the user's default)
 */

import { describeClassTime, type ClassDelivery } from "../time/classTime";

export interface ClassEventInput {
  occurrenceId: string;
  /** Stable per person, e.g. booking id or profile id. Optional for guests. */
  attendeeKey?: string | null;
  className: string;
  studioName: string;
  startsAt: string | Date;
  endsAt: string | Date;
  studioTimeZone: string;
  delivery?: ClassDelivery;
  teacherName?: string | null;
  room?: string | null;
  locationName?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** Join link for a livestream (only for the booked person). */
  joinUrl?: string | null;
  /** Where to view or cancel the booking. */
  manageUrl?: string | null;
  /** Free cancellation until this many minutes before start. */
  cancellationMinutes?: number | null;
  /** Domain for UIDs. */
  uidDomain?: string;
  /** Creation timestamp; injectable for tests. */
  now?: Date;
}

/** "Power Vinyasa Flow at Oxatl Yoga" */
export function eventTitle(e: Pick<ClassEventInput, "className" | "studioName">): string {
  return `${e.className} at ${e.studioName}`;
}

/**
 * One-line, map-resolvable location. Venue name first (Apple shows it as the
 * place name), then street, city, region postcode, country.
 */
export function eventLocation(e: ClassEventInput): string {
  if (e.delivery === "virtual" || e.delivery === "on_demand") {
    return e.joinUrl ? `Online: ${e.joinUrl}` : "Online";
  }
  const cityLine = [e.city, [e.region, e.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const parts = [
    e.locationName && e.locationName !== e.studioName ? `${e.studioName} ${e.locationName}` : e.studioName,
    e.addressLine1,
    e.addressLine2,
    cityLine || null,
    e.country && !["US", "USA", "United States"].includes(e.country) ? e.country : null,
  ];
  return parts.filter((p) => p && String(p).trim()).join(", ");
}

export function eventDescription(e: ClassEventInput): string {
  const t = describeClassTime({
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    studioTimeZone: e.studioTimeZone,
    delivery: e.delivery,
  });
  const lines: string[] = [];
  if (e.teacherName) lines.push(`Teacher: ${e.teacherName}`);
  if (e.room) lines.push(`Room: ${e.room}`);
  lines.push(`Time: ${t.primary}, ${t.zoneLabel ?? ""}`.replace(/, $/, ""));
  if (e.delivery === "hybrid") lines.push("Hybrid class: join in person or online.");
  if (e.cancellationMinutes && e.cancellationMinutes > 0) {
    const deadline = new Date(new Date(e.startsAt).getTime() - e.cancellationMinutes * 60000);
    const d = describeClassTime({ startsAt: deadline, studioTimeZone: e.studioTimeZone });
    lines.push(`Free cancellation until ${d.primary} ${d.zoneLabel ?? ""}`.trim());
  }
  if (e.joinUrl) lines.push(`Join: ${e.joinUrl}`);
  if (e.manageUrl) lines.push(`View or cancel: ${e.manageUrl}`);
  lines.push(`Booked with ${e.studioName} on Tandava.`);
  return lines.join("\n");
}

/** 20261010T160000Z */
export function icsUtc(value: string | Date): string {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** RFC 5545 §3.3.11 text escaping. */
export function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** RFC 5545 §3.1: fold lines longer than 75 octets (UTF-8), CRLF + space. */
export function icsFold(line: string): string {
  const bytes = new TextEncoder();
  if (bytes.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = "";
  let size = 0;
  for (const ch of line) {
    const n = bytes.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (size + n > limit) {
      out.push(current);
      current = ch;
      size = n;
    } else {
      current += ch;
      size += n;
    }
  }
  out.push(current);
  return out.join("\r\n ");
}

export function buildIcs(e: ClassEventInput): string {
  const domain = e.uidDomain ?? "tandava.app";
  const uid = `${e.occurrenceId}${e.attendeeKey ? `-${e.attendeeKey}` : ""}@${domain}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tandava//Class booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsUtc(e.now ?? new Date())}`,
    `DTSTART:${icsUtc(e.startsAt)}`,
    `DTEND:${icsUtc(e.endsAt)}`,
    `SUMMARY:${icsEscape(eventTitle(e))}`,
    `LOCATION:${icsEscape(eventLocation(e))}`,
    `DESCRIPTION:${icsEscape(eventDescription(e))}`,
  ];
  if (e.latitude != null && e.longitude != null && e.delivery !== "virtual") {
    lines.push(`GEO:${e.latitude.toFixed(6)};${e.longitude.toFixed(6)}`);
  }
  const url = e.joinUrl ?? e.manageUrl;
  if (url) lines.push(`URL:${url}`);
  lines.push(
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(eventTitle(e))}`,
    "TRIGGER:-PT1H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  );
  return lines.map(icsFold).join("\r\n") + "\r\n";
}

/** Google Calendar "create event" template link (opens the app on Android). */
export function googleCalendarUrl(e: ClassEventInput): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: eventTitle(e),
    dates: `${icsUtc(e.startsAt)}/${icsUtc(e.endsAt)}`,
    details: eventDescription(e),
    location: eventLocation(e),
    ctz: e.studioTimeZone,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Outlook.com / Microsoft 365 web compose link. */
export function outlookCalendarUrl(e: ClassEventInput): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: eventTitle(e),
    startdt: new Date(e.startsAt).toISOString(),
    enddt: new Date(e.endsAt).toISOString(),
    body: eventDescription(e),
    location: eventLocation(e),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/** File name for the download: "power-vinyasa-flow-2026-10-10.ics". */
export function icsFileName(e: Pick<ClassEventInput, "className" | "startsAt" | "studioTimeZone">): string {
  const slug = e.className.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "class";
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: e.studioTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(e.startsAt));
  return `${slug}-${day}.ics`;
}

export type CalendarPlatform = "apple" | "android" | "other";

/** Which option to put first. User agent only orders buttons; all stay visible. */
export function calendarPlatform(userAgent: string): CalendarPlatform {
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod|macintosh/i.test(userAgent)) return "apple";
  return "other";
}
