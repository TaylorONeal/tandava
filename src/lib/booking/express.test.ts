import { describe, it, expect } from "vitest";
import {
  validateGuestInput,
  normalizeEmail,
  normalizePhone,
  minutesUntilStart,
  checkOccurrenceEligibility,
  decideExpressBooking,
  rejectMessage,
  guestFieldMessage,
} from "./express";
import type {
  ExpressGuest,
  ExpressOccurrence,
  ExpressContext,
  ExpressRejectReason,
  GuestFieldError,
} from "./express";

const NOW = new Date("2026-06-08T12:00:00Z");

/** A valid, eligible occurrence: starts in 4 hours, 3 spots left, $22 drop-in. */
function occurrence(overrides: Partial<ExpressOccurrence> = {}): ExpressOccurrence {
  return {
    occurrenceId: "occ-1",
    startsAt: "2026-06-08T16:00:00Z",
    endsAt: "2026-06-08T17:00:00Z",
    isCancelled: false,
    capacity: 20,
    bookedCount: 17,
    dropInPriceCents: 2200,
    expressBookingEnabled: true,
    waiverRequired: false,
    bookingCutoffMinutes: 0,
    waitlistEnabled: true,
    ...overrides,
  };
}

function guest(overrides: Partial<ExpressGuest> = {}): ExpressGuest {
  return {
    firstName: "Ana",
    lastName: "Reyes",
    email: "ana@example.com",
    phone: "+15125550100",
    displayName: "Ana Reyes",
    marketingConsent: false,
    waiverAccepted: false,
    ...overrides,
  };
}

function ctx(overrides: Partial<ExpressContext> = {}): ExpressContext {
  return {
    occurrence: occurrence(),
    guest: guest(),
    now: NOW,
    accountExists: false,
    alreadyClaimed: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Ana@Example.COM ")).toBe("ana@example.com");
  });

  it("returns empty string for nullish input", () => {
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(undefined)).toBe("");
  });
});

describe("normalizePhone", () => {
  it("strips formatting but keeps a leading plus", () => {
    expect(normalizePhone("+1 (512) 555-0100")).toBe("+15125550100");
    expect(normalizePhone("512.555.0100")).toBe("5125550100");
  });

  it("returns null when there are no digits", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
    expect(normalizePhone("n/a")).toBeNull();
    expect(normalizePhone(null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Guest input validation
// ---------------------------------------------------------------------------

describe("validateGuestInput", () => {
  it("accepts a complete form and normalizes it", () => {
    const result = validateGuestInput({
      firstName: "  Ana ",
      lastName: "Reyes",
      email: "  Ana@Example.com ",
      phone: "(512) 555-0100",
      marketingConsent: true,
    });
    expect(result.status).toBe("valid");
    if (result.status !== "valid") return;
    expect(result.guest).toMatchObject({
      firstName: "Ana",
      lastName: "Reyes",
      email: "ana@example.com",
      phone: "5125550100",
      displayName: "Ana Reyes",
      marketingConsent: true,
      waiverAccepted: false,
    });
  });

  it("accepts a form with no phone", () => {
    const result = validateGuestInput({ firstName: "Ana", lastName: "Reyes", email: "ana@example.com" });
    expect(result.status).toBe("valid");
    if (result.status !== "valid") return;
    expect(result.guest.phone).toBeNull();
  });

  it("collects every field error at once rather than stopping at the first", () => {
    const result = validateGuestInput({ firstName: " ", lastName: "", email: "nope", phone: "123" });
    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") return;
    expect(result.errors).toEqual(
      expect.arrayContaining(["first_name_required", "last_name_required", "email_invalid", "phone_invalid"]),
    );
  });

  it("distinguishes a missing email from a malformed one", () => {
    const missing = validateGuestInput({ firstName: "Ana", lastName: "Reyes", email: "  " });
    expect(missing.status).toBe("invalid");
    if (missing.status === "invalid") expect(missing.errors).toContain("email_required");

    const malformed = validateGuestInput({ firstName: "Ana", lastName: "Reyes", email: "ana@example" });
    expect(malformed.status).toBe("invalid");
    if (malformed.status === "invalid") expect(malformed.errors).toContain("email_invalid");
  });

  it.each([
    "ana@example.com",
    "ana.reyes+yoga@example.co.uk",
    "a_b-c@sub.domain.io",
  ])("accepts the real-world address %s", (email) => {
    const result = validateGuestInput({ firstName: "Ana", lastName: "Reyes", email });
    expect(result.status).toBe("valid");
  });

  it.each(["ana@@example.com", "ana example@test.com", "@example.com", "ana@.com", "ana@example."])(
    "rejects the malformed address %s",
    (email) => {
      const result = validateGuestInput({ firstName: "Ana", lastName: "Reyes", email });
      expect(result.status).toBe("invalid");
    },
  );

  it("treats a blank phone as absent, not invalid", () => {
    const result = validateGuestInput({ firstName: "Ana", lastName: "Reyes", email: "ana@example.com", phone: "   " });
    expect(result.status).toBe("valid");
  });

  it("rejects a supplied phone that cannot be a phone number", () => {
    for (const phone of ["12345", "1234567890123456"]) {
      const result = validateGuestInput({ firstName: "Ana", lastName: "Reyes", email: "ana@example.com", phone });
      expect(result.status).toBe("invalid");
      if (result.status === "invalid") expect(result.errors).toContain("phone_invalid");
    }
  });
});

// ---------------------------------------------------------------------------
// Occurrence eligibility
// ---------------------------------------------------------------------------

describe("minutesUntilStart", () => {
  it("is positive before the class and negative after it starts", () => {
    expect(minutesUntilStart("2026-06-08T16:00:00Z", NOW)).toBe(240);
    expect(minutesUntilStart("2026-06-08T11:00:00Z", NOW)).toBe(-60);
  });

  it("is NaN for an unparseable timestamp", () => {
    expect(Number.isNaN(minutesUntilStart("not-a-date", NOW))).toBe(true);
  });
});

describe("checkOccurrenceEligibility", () => {
  it("allows a future class with spots left", () => {
    expect(checkOccurrenceEligibility(occurrence(), NOW)).toEqual({
      eligible: true,
      placement: "confirmed",
      spotsLeft: 3,
    });
  });

  it("offers the waitlist on a full class when the waitlist is on", () => {
    const result = checkOccurrenceEligibility(occurrence({ bookedCount: 20 }), NOW);
    expect(result).toEqual({ eligible: true, placement: "waitlisted", spotsLeft: 0 });
  });

  it("rejects a full class when the waitlist is off", () => {
    const result = checkOccurrenceEligibility(occurrence({ bookedCount: 20, waitlistEnabled: false }), NOW);
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("full");
  });

  it("floors spotsLeft at zero when a class is oversold", () => {
    const result = checkOccurrenceEligibility(occurrence({ capacity: 20, bookedCount: 23 }), NOW);
    expect(result.spotsLeft).toBe(0);
  });

  it("rejects when the studio has express booking turned off", () => {
    const result = checkOccurrenceEligibility(occurrence({ expressBookingEnabled: false }), NOW);
    expect(result.reason).toBe("express_disabled");
  });

  it("reports cancellation ahead of any other blocker", () => {
    const result = checkOccurrenceEligibility(
      occurrence({ isCancelled: true, bookedCount: 20, waitlistEnabled: false }),
      NOW,
    );
    expect(result.reason).toBe("cancelled");
  });

  it("rejects a class that has already started", () => {
    const result = checkOccurrenceEligibility(occurrence({ startsAt: "2026-06-08T11:59:00Z" }), NOW);
    expect(result.reason).toBe("already_started");
  });

  it("rejects a class starting exactly now", () => {
    const result = checkOccurrenceEligibility(occurrence({ startsAt: "2026-06-08T12:00:00Z" }), NOW);
    expect(result.reason).toBe("already_started");
  });

  it("fails closed on an unparseable start time", () => {
    const result = checkOccurrenceEligibility(occurrence({ startsAt: "tomorrow-ish" }), NOW);
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("already_started");
  });

  it("enforces the booking cutoff", () => {
    // Starts in 240 minutes; a 300-minute cutoff has already passed.
    const closed = checkOccurrenceEligibility(occurrence({ bookingCutoffMinutes: 300 }), NOW);
    expect(closed.reason).toBe("cutoff_passed");

    const open = checkOccurrenceEligibility(occurrence({ bookingCutoffMinutes: 120 }), NOW);
    expect(open.eligible).toBe(true);
  });

  it("treats a class exactly at the cutoff as still open", () => {
    const result = checkOccurrenceEligibility(occurrence({ bookingCutoffMinutes: 240 }), NOW);
    expect(result.eligible).toBe(true);
  });

  it("treats a negative cutoff as no cutoff", () => {
    const result = checkOccurrenceEligibility(occurrence({ bookingCutoffMinutes: -60 }), NOW);
    expect(result.eligible).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// The decision
// ---------------------------------------------------------------------------

describe("decideExpressBooking", () => {
  it("books a new guest into an open class and charges the drop-in price", () => {
    expect(decideExpressBooking(ctx())).toEqual({
      action: "book",
      placement: "confirmed",
      requiresPayment: true,
      amountCents: 2200,
    });
  });

  it("books without payment when the class is free", () => {
    expect(decideExpressBooking(ctx({ occurrence: occurrence({ dropInPriceCents: 0 }) }))).toEqual({
      action: "book",
      placement: "confirmed",
      requiresPayment: false,
      amountCents: 0,
    });
  });

  it("never charges for a waitlist claim", () => {
    const decision = decideExpressBooking(ctx({ occurrence: occurrence({ bookedCount: 20 }) }));
    expect(decision).toEqual({
      action: "book",
      placement: "waitlisted",
      requiresPayment: false,
      amountCents: 0,
    });
  });

  it("rejects an unpriced class because a guest holds no entitlements", () => {
    const decision = decideExpressBooking(ctx({ occurrence: occurrence({ dropInPriceCents: null }) }));
    expect(decision).toEqual({ action: "reject", reason: "not_priced" });
  });

  it("still offers the waitlist on an unpriced class, since no payment is taken", () => {
    const decision = decideExpressBooking(
      ctx({ occurrence: occurrence({ dropInPriceCents: null, bookedCount: 20 }) }),
    );
    expect(decision).toMatchObject({ action: "book", placement: "waitlisted" });
  });

  // --- Rule 2: an existing account is never booked into anonymously ---

  it("sends an existing account through an emailed link instead of booking", () => {
    const decision = decideExpressBooking(ctx({ accountExists: true }));
    expect(decision).toEqual({ action: "email_continue_link", reason: "account_exists" });
  });

  it("does not reveal an existing account when the class is not bookable anyway", () => {
    // Same rejection for an unbookable class whether or not the email is known,
    // so a dead class cannot be used to enumerate members.
    const cancelled = occurrence({ isCancelled: true });
    const known = decideExpressBooking(ctx({ occurrence: cancelled, accountExists: true }));
    const unknown = decideExpressBooking(ctx({ occurrence: cancelled, accountExists: false }));
    expect(known).toEqual(unknown);
    expect(known).toEqual({ action: "reject", reason: "cancelled" });
  });

  it.each<[string, Partial<ExpressOccurrence>]>([
    ["express disabled", { expressBookingEnabled: false }],
    ["already started", { startsAt: "2026-06-08T11:00:00Z" }],
    ["cutoff passed", { bookingCutoffMinutes: 300 }],
    ["full with no waitlist", { bookedCount: 20, waitlistEnabled: false }],
  ])("gives the same answer for a known and unknown email when the class is %s", (_label, overrides) => {
    const occ = occurrence(overrides);
    expect(decideExpressBooking(ctx({ occurrence: occ, accountExists: true }))).toEqual(
      decideExpressBooking(ctx({ occurrence: occ, accountExists: false })),
    );
  });

  it("prefers the emailed link over a duplicate-claim rejection", () => {
    // Both are true; the account branch must win so we never confirm to an
    // anonymous caller that a member already holds a spot.
    const decision = decideExpressBooking(ctx({ accountExists: true, alreadyClaimed: true }));
    expect(decision).toEqual({ action: "email_continue_link", reason: "account_exists" });
  });

  // --- Duplicates and waivers ---

  it("rejects a second claim from the same guest on the same class", () => {
    const decision = decideExpressBooking(ctx({ alreadyClaimed: true }));
    expect(decision).toEqual({ action: "reject", reason: "duplicate_claim" });
  });

  it("requires the waiver when the studio demands one", () => {
    const occ = occurrence({ waiverRequired: true });
    expect(decideExpressBooking(ctx({ occurrence: occ }))).toEqual({
      action: "reject",
      reason: "waiver_not_accepted",
    });
    expect(
      decideExpressBooking(ctx({ occurrence: occ, guest: guest({ waiverAccepted: true }) })),
    ).toMatchObject({ action: "book" });
  });

  it("requires the waiver for a waitlist claim too", () => {
    const occ = occurrence({ waiverRequired: true, bookedCount: 20 });
    expect(decideExpressBooking(ctx({ occurrence: occ }))).toEqual({
      action: "reject",
      reason: "waiver_not_accepted",
    });
  });
});

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

describe("visitor-facing copy", () => {
  const reasons: ExpressRejectReason[] = [
    "express_disabled",
    "cancelled",
    "already_started",
    "cutoff_passed",
    "full",
    "not_priced",
    "duplicate_claim",
    "waiver_not_accepted",
  ];

  it.each(reasons)("has a non-empty message for %s", (reason) => {
    const msg = rejectMessage(reason);
    expect(msg.length).toBeGreaterThan(0);
    // Reason codes are for logs, not for visitors.
    expect(msg).not.toContain("_");
  });

  const fieldErrors: GuestFieldError[] = [
    "first_name_required",
    "last_name_required",
    "email_required",
    "email_invalid",
    "phone_invalid",
  ];

  it.each(fieldErrors)("has a non-empty message for %s", (error) => {
    expect(guestFieldMessage(error).length).toBeGreaterThan(0);
  });
});
