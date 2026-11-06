import type { PassScanResult } from "@/lib/backend/types";

/**
 * Check-in pass: a QR code a member shows at the door and the Tandava Studio
 * app scans. The payload is an identifier, not a credential. The server
 * (check_in_with_pass, migration 00052) decides whether the scanning staff
 * member may check that booking in.
 */
export const PASS_PREFIX = "tandava:checkin:v1:";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function passFor(bookingId: string): string {
  if (!UUID.test(bookingId)) throw new Error("Not a booking id");
  return PASS_PREFIX + bookingId.toLowerCase();
}

/** Returns the normalised pass, or null for anything that is not a Tandava pass. */
export function readPass(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value.startsWith(PASS_PREFIX)) return null;
  const id = value.slice(PASS_PREFIX.length);
  return UUID.test(id) ? PASS_PREFIX + id.toLowerCase() : null;
}


/** What the front desk sees after a scan. `tone` drives colour and haptics. */
export function describeScan(result: PassScanResult, name: string | null): { title: string; detail: string; tone: "success" | "warning" | "error" } {
  const who = name || "This member";
  switch (result) {
    case "checked_in": return { title: `${who} is checked in`, detail: "Attendance recorded.", tone: "success" };
    case "already_checked_in": return { title: `${who} is already in`, detail: "This pass was checked in earlier. Nothing changed.", tone: "warning" };
    case "outside_window": return { title: "Check-in isn't open", detail: "Check-in opens 60 minutes before class and closes when class ends.", tone: "warning" };
    case "not_confirmed": return { title: `${who} isn't confirmed`, detail: "This booking is waitlisted or cancelled. Check the roster.", tone: "error" };
    case "class_cancelled": return { title: "Class cancelled", detail: "This class was cancelled, so there is nothing to check in.", tone: "error" };
    case "invalid_pass": return { title: "Not a Tandava pass", detail: "Ask the member to open My Schedule and tap Check-in pass.", tone: "error" };
    case "not_found":
    default: return { title: "Pass not found", detail: "It isn't a booking you can check in at this studio.", tone: "error" };
  }
}
