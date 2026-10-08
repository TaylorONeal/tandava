import { describe, expect, it } from "vitest";
import { decideNext, inQuietHours, lapsedThresholdDays, type PersonFacts } from "./automations";

const TZ = "America/Chicago";
// 2026-10-08 15:00 CDT = 20:00Z: inside sending hours.
const NOW = new Date("2026-10-08T20:00:00Z");
const daysAgo = (d: number, h = 0) => new Date(NOW.getTime() - d * 86400_000 - h * 3600_000).toISOString();

const base: PersonFacts = {
  profileId: "p1",
  isGuest: false,
  emailConsent: true,
  visitCount: 0,
  bookingCount: 0,
  hasActiveMembership: false,
  hasActivePack: false,
  sends: [],
};

describe("guards", () => {
  it("needs consent", () => {
    const f = { ...base, isGuest: true, guestBookingAt: daysAgo(2), emailConsent: false };
    expect(decideNext(f, NOW, TZ)).toEqual({ skip: "no_consent" });
  });
  it("respects quiet hours in the studio's zone", () => {
    const late = new Date("2026-10-09T03:00:00Z"); // 22:00 CDT
    expect(inQuietHours(late, TZ)).toBe(true);
    expect(inQuietHours(NOW, TZ)).toBe(false);
    const f = { ...base, isGuest: true, guestBookingAt: daysAgo(2) };
    expect(decideNext(f, late, TZ)).toEqual({ skip: "quiet_hours" });
  });
  it("one email per person per day across automations", () => {
    const f = {
      ...base,
      isGuest: true,
      guestBookingAt: daysAgo(5),
      sends: [{ key: "guest_to_member" as const, step: 0, episode: daysAgo(5).slice(0, 10), sentAt: daysAgo(0, 5) }],
    };
    expect(decideNext(f, NOW, TZ)).toEqual({ skip: "daily_cap" });
  });
  it("nothing due for someone with no activity", () => {
    expect(decideNext(base, NOW, TZ)).toEqual({ skip: "nothing_due" });
  });
});

describe("guest to member", () => {
  const guest = { ...base, isGuest: true, guestBookingAt: daysAgo(1, 1), bookingCount: 1 };
  it("step 0 a day after the guest booking", () => {
    expect(decideNext(guest, NOW, TZ)).toMatchObject({ decision: { key: "guest_to_member", step: 0 } });
  });
  it("not before a day has passed", () => {
    expect(decideNext({ ...guest, guestBookingAt: daysAgo(0, 5) }, NOW, TZ)).toEqual({ skip: "nothing_due" });
  });
  it("step 1 (intro offer) on day 3 after step 0", () => {
    const f = {
      ...guest,
      guestBookingAt: daysAgo(3, 1),
      sends: [{ key: "guest_to_member" as const, step: 0, episode: daysAgo(3, 1).slice(0, 10), sentAt: daysAgo(2) }],
    };
    expect(decideNext(f, NOW, TZ)).toMatchObject({ decision: { step: 1, template: "automation_guest_intro_offer" } });
  });
  it("ignores an old guest booking (no backlog when someone opts in later or is imported)", () => {
    expect(decideNext({ ...guest, guestBookingAt: daysAgo(40) }, NOW, TZ)).toEqual({ skip: "nothing_due" });
  });
  it("a repeat guest gets the nudge at most once a month", () => {
    const f = {
      ...guest,
      guestBookingAt: daysAgo(1, 1),
      sends: [{ key: "guest_to_member" as const, step: 0, episode: daysAgo(10).slice(0, 10), sentAt: daysAgo(10) }],
    };
    expect(decideNext(f, NOW, TZ)).toEqual({ skip: "nothing_due" });
    const later = { ...f, sends: [{ ...f.sends[0], episode: daysAgo(35).slice(0, 10), sentAt: daysAgo(35) }] };
    expect(decideNext(later, NOW, TZ)).toMatchObject({ decision: { step: 0 } });
  });
  it("stops once claimed or a customer", () => {
    expect(decideNext({ ...guest, claimedAt: daysAgo(0) }, NOW, TZ)).toEqual({ skip: "nothing_due" });
    expect(decideNext({ ...guest, hasActivePack: true }, NOW, TZ)).toEqual({ skip: "nothing_due" });
  });
});

describe("lapsed stops when they've booked again", () => {
  it("no check-in for someone with a class coming up", () => {
    const f = { ...base, lastVisitAt: daysAgo(30), firstCheckInAt: daysAgo(90), visitCount: 8, bookingCount: 9, medianGapDays: 7 };
    expect(decideNext(f, NOW, TZ)).toMatchObject({ decision: { key: "lapsed" } });
    expect(decideNext({ ...f, hasUpcomingBooking: true }, NOW, TZ)).toEqual({ skip: "nothing_due" });
  });
});

describe("one intro offer per person", () => {
  it("a guest who got the guest intro offer doesn't get the first-visit one too", () => {
    const f = {
      ...base,
      isGuest: true,
      guestBookingAt: daysAgo(6),
      firstCheckInAt: daysAgo(4),
      lastVisitAt: daysAgo(4),
      visitCount: 1,
      bookingCount: 1,
      sends: [
        { key: "guest_to_member" as const, step: 0, episode: daysAgo(6).slice(0, 10), sentAt: daysAgo(5) },
        { key: "guest_to_member" as const, step: 1, episode: daysAgo(6).slice(0, 10), sentAt: daysAgo(3) },
        { key: "first_visit" as const, step: 0, episode: daysAgo(4).slice(0, 10), sentAt: daysAgo(2) },
      ],
    };
    expect(decideNext(f, NOW, TZ)).toEqual({ skip: "nothing_due" });
  });
});

describe("first visit", () => {
  const fresh = { ...base, firstCheckInAt: daysAgo(0, 3), lastVisitAt: daysAgo(0, 3), visitCount: 1, bookingCount: 1 };
  it("welcome a few hours after the first check-in", () => {
    expect(decideNext(fresh, NOW, TZ)).toMatchObject({ decision: { key: "first_visit", step: 0 } });
  });
  it("intro-offer follow-up on day 3 if they haven't rebooked", () => {
    const f = {
      ...fresh,
      firstCheckInAt: daysAgo(3, 1),
      lastVisitAt: daysAgo(3, 1),
      sends: [{ key: "first_visit" as const, step: 0, episode: daysAgo(3, 1).slice(0, 10), sentAt: daysAgo(3) }],
    };
    expect(decideNext(f, NOW, TZ)).toMatchObject({ decision: { step: 1 } });
    expect(decideNext({ ...f, bookingCount: 2 }, NOW, TZ)).toEqual({ skip: "nothing_due" });
  });
  it("no welcome for someone whose first visit was weeks ago", () => {
    expect(decideNext({ ...fresh, firstCheckInAt: daysAgo(20) }, NOW, TZ)).toEqual({ skip: "nothing_due" });
  });
});

describe("lapsed", () => {
  it("threshold is twice their usual gap, clamped, default 21", () => {
    expect(lapsedThresholdDays(null)).toBe(21);
    expect(lapsedThresholdDays(3)).toBe(14);
    expect(lapsedThresholdDays(10)).toBe(20);
    expect(lapsedThresholdDays(40)).toBe(45);
    expect(lapsedThresholdDays(10, 30)).toBe(30);
  });
  const regular = {
    ...base,
    firstCheckInAt: daysAgo(120),
    lastVisitAt: daysAgo(22),
    visitCount: 12,
    bookingCount: 12,
    medianGapDays: 7,
    hasActiveMembership: true,
  };
  it("sends once per lapse episode, members included", () => {
    expect(decideNext(regular, NOW, TZ)).toMatchObject({ decision: { key: "lapsed", step: 0 } });
    const after = { ...regular, sends: [{ key: "lapsed" as const, step: 0, episode: daysAgo(22).slice(0, 10), sentAt: daysAgo(2) }] };
    expect(decideNext(after, NOW, TZ)).toEqual({ skip: "nothing_due" });
  });
  it("not yet lapsed, and gives up after a month past the threshold", () => {
    expect(decideNext({ ...regular, lastVisitAt: daysAgo(10) }, NOW, TZ)).toEqual({ skip: "nothing_due" });
    expect(decideNext({ ...regular, lastVisitAt: daysAgo(60) }, NOW, TZ)).toEqual({ skip: "nothing_due" });
  });
  it("respects a studio turning it off", () => {
    expect(
      decideNext(regular, NOW, TZ, { guestToMemberEnabled: true, firstVisitEnabled: true, lapsedEnabled: false }),
    ).toEqual({ skip: "nothing_due" });
  });
});
