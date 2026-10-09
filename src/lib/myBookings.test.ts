import { describe, it, expect } from "vitest";
import { toMyBookingView, splitMyBookings } from "./myBookings";
import type { MyBookingRow } from "@/types/database";

const NOW = new Date("2026-10-09T12:00:00Z");
const row = (over: Partial<MyBookingRow> = {}): MyBookingRow => ({
  booking_id: "b1",
  status: "confirmed",
  occurrence_id: "o1",
  starts_at: "2026-10-10T15:00:00Z", // Sat 10:00 Chicago
  ends_at: "2026-10-10T16:00:00Z",
  is_cancelled: false,
  offering_name: "Test Vinyasa",
  room: "Main",
  location_name: "Downtown",
  teacher_name: "Maya",
  studio_name: "Purafield Studio (test)",
  studio_slug: "purafield-studio-test-eejz",
  studio_timezone: "America/Chicago",
  cancellation_minutes: 120,
  ...over,
});

describe("toMyBookingView", () => {
  it("shows the class in the studio's timezone with a cancel deadline", () => {
    const v = toMyBookingView(row(), NOW);
    expect(v.when).toBe("Sat, Oct 10, 10:00 AM");
    expect(v.cancelDeadline).toBe("Cancel by Sat, Oct 10, 8:00 AM");
    expect(v.durationMinutes).toBe(60);
    expect(v.place).toBe("Main, Downtown");
    expect(v.status).toBe("BOOKED");
    expect(v.canCancel).toBe(true);
  });
  it("cannot cancel a past, checked-in or studio-cancelled class", () => {
    expect(toMyBookingView(row({ starts_at: "2026-10-08T15:00:00Z", ends_at: "2026-10-08T16:00:00Z" }), NOW).canCancel).toBe(false);
    expect(toMyBookingView(row({ status: "checked_in" }), NOW).canCancel).toBe(false);
    expect(toMyBookingView(row({ is_cancelled: true }), NOW).canCancel).toBe(false);
  });
  it("lets a waitlisted student leave the waitlist, with no fee deadline", () => {
    const v = toMyBookingView(row({ status: "waitlisted" }), NOW);
    expect(v.status).toBe("WAITLISTED");
    expect(v.canCancel).toBe(true);
    expect(v.cancelDeadline).toBeNull();
  });
  it("uses cancel_booking's 120-minute default when the studio left the policy blank", () => {
    expect(toMyBookingView(row({ cancellation_minutes: null }), NOW).cancelDeadline).toBe("Cancel by Sat, Oct 10, 8:00 AM");
  });
  it("maps late cancels to canceled", () => {
    expect(toMyBookingView(row({ status: "late_cancel" }), NOW).status).toBe("CANCELED");
  });
});

describe("splitMyBookings", () => {
  it("puts upcoming soonest first, drops cancelled from upcoming, keeps past", () => {
    const rows = [
      row({ booking_id: "later", starts_at: "2026-10-17T15:00:00Z", ends_at: "2026-10-17T16:00:00Z" }),
      row({ booking_id: "sooner" }),
      row({ booking_id: "gone", status: "cancelled" }),
      row({ booking_id: "past", starts_at: "2026-10-01T15:00:00Z", ends_at: "2026-10-01T16:00:00Z", status: "checked_in" }),
    ];
    const { upcoming, past } = splitMyBookings(rows, NOW);
    expect(upcoming.map((v) => v.id)).toEqual(["sooner", "later"]);
    expect(past.map((v) => v.id)).toEqual(["past"]);
  });
});
