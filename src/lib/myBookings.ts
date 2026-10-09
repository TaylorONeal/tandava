/**
 * My Schedule: turn get_my_bookings() rows into what the page shows.
 * Pure and unit-tested; times are shown in the studio's own timezone.
 */
import type { MyBookingRow } from "@/types/database";

export type MyBookingStatus = "BOOKED" | "CHECKED_IN" | "CANCELED" | "NO_SHOW" | "WAITLISTED";

export interface MyBookingView {
  id: string;
  title: string;
  studioName: string;
  studioSlug: string;
  teacherName: string | null;
  when: string;
  durationMinutes: number;
  place: string | null;
  status: MyBookingStatus;
  isUpcoming: boolean;
  canCancel: boolean;
  /** "Cancel by Sat, Oct 10, 8:00 AM" when the studio has a late-cancel window. */
  cancelDeadline: string | null;
  classCancelled: boolean;
}

const STATUS: Record<MyBookingRow["status"], MyBookingStatus> = {
  confirmed: "BOOKED",
  waitlisted: "WAITLISTED",
  checked_in: "CHECKED_IN",
  cancelled: "CANCELED",
  late_cancel: "CANCELED",
  no_show: "NO_SHOW",
};

function formatInZone(iso: string, timeZone: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone,
  };
  try {
    return new Intl.DateTimeFormat("en-US", opts).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" }).format(new Date(iso));
  }
}

export function toMyBookingView(row: MyBookingRow, now: Date = new Date()): MyBookingView {
  const start = new Date(row.starts_at);
  const end = new Date(row.ends_at);
  const status = STATUS[row.status] ?? "BOOKED";
  const isUpcoming = start.getTime() > now.getTime();
  const active = status === "BOOKED" || status === "WAITLISTED";
  const minutes = row.cancellation_minutes ?? 0;
  const deadline = new Date(start.getTime() - minutes * 60_000);
  return {
    id: row.booking_id,
    title: row.offering_name,
    studioName: row.studio_name,
    studioSlug: row.studio_slug,
    teacherName: row.teacher_name,
    when: formatInZone(row.starts_at, row.studio_timezone || "UTC"),
    durationMinutes: Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000)),
    place: [row.room, row.location_name].filter(Boolean).join(", ") || null,
    status,
    isUpcoming,
    canCancel: isUpcoming && active && !row.is_cancelled,
    cancelDeadline:
      isUpcoming && active && minutes > 0 && status === "BOOKED"
        ? `Cancel by ${formatInZone(deadline.toISOString(), row.studio_timezone || "UTC")}`
        : null,
    classCancelled: row.is_cancelled,
  };
}

/** Upcoming soonest first; past most recent first. Cancelled bookings drop out of upcoming. */
export function splitMyBookings(rows: MyBookingRow[], now: Date = new Date()) {
  const views = rows.map((r) => toMyBookingView(r, now));
  const upcoming = views
    .filter((v) => v.isUpcoming && v.status !== "CANCELED")
    .sort((a, b) => rows.find((r) => r.booking_id === a.id)!.starts_at.localeCompare(rows.find((r) => r.booking_id === b.id)!.starts_at));
  const past = views.filter((v) => !v.isUpcoming);
  return { upcoming, past };
}
