/**
 * Express Booking rules (PRD-020).
 *
 * Pure, framework-free logic for the login-free booking path: a visitor who has
 * never had an account books a class with name, email, and phone, in one step,
 * with no password and no email confirmation round-trip.
 *
 * This module answers three questions and nothing else:
 *   1. Is the guest's input usable? (`validateGuestInput`)
 *   2. Is this occurrence claimable by a guest right now? (`checkOccurrenceEligibility`)
 *   3. What should happen for THIS guest on THIS occurrence? (`decideExpressBooking`)
 *
 * It performs no I/O. The caller supplies facts it has already established
 * server-side (does an account exist for this email, has this email already
 * claimed this occurrence). The `express-book` Edge Function is the only
 * production caller that may act on a decision, because only it holds the
 * service-role credential needed to create the guest's identity.
 *
 * Why decisions live here rather than in the function: the security-relevant
 * branches (never book into an existing account from an anonymous request,
 * never accept a claim after the cutoff) are the part worth testing
 * exhaustively, and Deno Edge Function bodies are not covered by the JS test
 * suite. Same split as `src/lib/hosted/*` and `src/lib/booking/entitlements.ts`.
 */

// ---------------------------------------------------------------------------
// Guest input
// ---------------------------------------------------------------------------

/** Raw, untrusted guest-form input. Every field arrives as a string or absent. */
export interface ExpressGuestInput {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  marketingConsent?: boolean;
  waiverAccepted?: boolean;
}

/** Guest input after trimming and normalization. Safe to persist. */
export interface ExpressGuest {
  firstName: string;
  lastName: string;
  /** Lowercased and trimmed. This is the identity key for a guest. */
  email: string;
  /** Digits (plus a leading `+`) only; null when not supplied. */
  phone: string | null;
  displayName: string;
  marketingConsent: boolean;
  waiverAccepted: boolean;
}

export type GuestFieldError =
  | "first_name_required"
  | "last_name_required"
  | "email_required"
  | "email_invalid"
  | "phone_invalid";

/**
 * Tagged with a string rather than a boolean `ok`: this project compiles with
 * `strict: false`, and without `strictNullChecks` TypeScript will not narrow a
 * union on a boolean literal discriminant. A string tag narrows either way, so
 * callers get real type safety on the branch they take.
 */
export type GuestValidation =
  | { status: "valid"; guest: ExpressGuest }
  | { status: "invalid"; errors: GuestFieldError[] };

/**
 * Deliberately permissive single-pass email shape check: one `@`, a non-empty
 * local part, and a dotted domain with a 2+ character TLD. Rejecting valid
 * addresses costs a booking, so this checks shape only. Deliverability is
 * established by the confirmation email actually arriving, not by a regex.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** E.164-ish: optional `+`, then 7 to 15 digits once separators are stripped. */
const PHONE_DIGITS_RE = /^\+?\d{7,15}$/;

const trim = (v: string | null | undefined): string => (typeof v === "string" ? v.trim() : "");

/** Strip spaces, dashes, dots, and parentheses; keep a leading `+`. */
export function normalizePhone(raw: string | null | undefined): string | null {
  const s = trim(raw);
  if (!s) return null;
  const plus = s.startsWith("+");
  const digits = s.replace(/\D/g, "");
  if (!digits) return null;
  return (plus ? "+" : "") + digits;
}

/** Lowercase + trim. The identity key for a guest, so normalization must be stable. */
export function normalizeEmail(raw: string | null | undefined): string {
  return trim(raw).toLowerCase();
}

/**
 * Validate and normalize guest-form input.
 *
 * Collects every field error rather than failing on the first one, so the form
 * can mark all bad fields in a single round-trip.
 */
export function validateGuestInput(input: ExpressGuestInput): GuestValidation {
  const errors: GuestFieldError[] = [];

  const firstName = trim(input.firstName);
  const lastName = trim(input.lastName);
  const email = normalizeEmail(input.email);
  const rawPhone = trim(input.phone);
  const phone = normalizePhone(rawPhone);

  if (!firstName) errors.push("first_name_required");
  if (!lastName) errors.push("last_name_required");
  if (!email) {
    errors.push("email_required");
  } else if (!EMAIL_RE.test(email)) {
    errors.push("email_invalid");
  }
  // Phone is optional, but a supplied phone that cannot be a phone number is an
  // error rather than a silent drop: studios text their rosters.
  if (rawPhone && (!phone || !PHONE_DIGITS_RE.test(phone))) {
    errors.push("phone_invalid");
  }

  if (errors.length > 0) return { status: "invalid", errors };

  return {
    status: "valid",
    guest: {
      firstName,
      lastName,
      email,
      phone,
      displayName: `${firstName} ${lastName}`.trim(),
      marketingConsent: input.marketingConsent === true,
      waiverAccepted: input.waiverAccepted === true,
    },
  };
}

// ---------------------------------------------------------------------------
// Occurrence eligibility
// ---------------------------------------------------------------------------

/**
 * The public, guest-bookable facts about one class occurrence.
 *
 * Mirrors the `get_public_occurrence()` row (migration 00019). It carries only
 * columns that are safe to serve to an anonymous visitor; nothing here is
 * member data.
 */
export interface ExpressOccurrence {
  occurrenceId: string;
  startsAt: string;
  endsAt: string;
  isCancelled: boolean;
  capacity: number;
  bookedCount: number;
  /** null means the studio has not priced drop-ins for this offering. */
  dropInPriceCents: number | null;
  /** Studio-level switch: `studios.express_booking_enabled`. */
  expressBookingEnabled: boolean;
  /** Studio requires an accepted waiver before a first visit. */
  waiverRequired: boolean;
  /** Minutes before start after which booking closes. 0 = open until start. */
  bookingCutoffMinutes: number;
  /** Whether a full class offers the waitlist to guests. */
  waitlistEnabled: boolean;
}

export type ExpressRejectReason =
  | "express_disabled"
  | "cancelled"
  | "already_started"
  | "cutoff_passed"
  | "full"
  | "not_priced"
  | "duplicate_claim"
  | "waiver_not_accepted";

export type Placement = "confirmed" | "waitlisted";

export interface OccurrenceEligibility {
  eligible: boolean;
  reason?: ExpressRejectReason;
  /** Where a successful claim would land. Absent when not eligible. */
  placement?: Placement;
  /** Spots left, floored at 0. Always present, for UI copy. */
  spotsLeft: number;
}

/** Minutes from `now` until the class starts. Negative once it has started. */
export function minutesUntilStart(startsAt: string, now: Date): number {
  const start = new Date(startsAt).getTime();
  if (!Number.isFinite(start)) return Number.NaN;
  return (start - now.getTime()) / 60000;
}

/**
 * Is this occurrence claimable by a guest at `now`, ignoring who the guest is?
 *
 * Order matters: the reason returned is the one shown to the visitor, so the
 * most fundamental blocker wins. A cancelled class reads "cancelled" even if it
 * is also past its cutoff.
 */
export function checkOccurrenceEligibility(
  occurrence: ExpressOccurrence,
  now: Date,
): OccurrenceEligibility {
  const spotsLeft = Math.max(0, (occurrence.capacity ?? 0) - (occurrence.bookedCount ?? 0));

  if (!occurrence.expressBookingEnabled) {
    return { eligible: false, reason: "express_disabled", spotsLeft };
  }
  if (occurrence.isCancelled) {
    return { eligible: false, reason: "cancelled", spotsLeft };
  }

  const mins = minutesUntilStart(occurrence.startsAt, now);
  // An unparseable timestamp is treated as past rather than open: failing closed
  // is the safe direction for a public write path.
  if (!Number.isFinite(mins) || mins <= 0) {
    return { eligible: false, reason: "already_started", spotsLeft };
  }
  const cutoff = Math.max(0, occurrence.bookingCutoffMinutes ?? 0);
  if (mins < cutoff) {
    return { eligible: false, reason: "cutoff_passed", spotsLeft };
  }

  if (spotsLeft <= 0) {
    if (!occurrence.waitlistEnabled) {
      return { eligible: false, reason: "full", spotsLeft };
    }
    return { eligible: true, placement: "waitlisted", spotsLeft };
  }

  return { eligible: true, placement: "confirmed", spotsLeft };
}

// ---------------------------------------------------------------------------
// The decision
// ---------------------------------------------------------------------------

export interface ExpressContext {
  occurrence: ExpressOccurrence;
  guest: ExpressGuest;
  now: Date;
  /**
   * Whether an account already exists for `guest.email`, established
   * server-side. True sends the visitor through a emailed continue link
   * instead of booking, because an anonymous request must never act on an
   * existing member's account. See `decideExpressBooking`.
   */
  accountExists: boolean;
  /**
   * Whether this email already holds a live claim on this occurrence. Prevents
   * the double-tap duplicate that `COMPETITOR_ISSUES_PRIORITY.md` #6 names.
   */
  alreadyClaimed: boolean;
}

export type ExpressDecision =
  | {
      action: "book";
      placement: Placement;
      /** True when the guest must pay before the booking is confirmed. */
      requiresPayment: boolean;
      /** Amount to charge, in cents. 0 when no payment is required. */
      amountCents: number;
    }
  | {
      action: "email_continue_link";
      reason: "account_exists";
    }
  | {
      action: "reject";
      reason: ExpressRejectReason;
    };

/**
 * Decide what happens when a guest submits the express booking form.
 *
 * Three security-relevant rules, in priority order:
 *
 * 1. **Occurrence eligibility first.** A closed, cancelled, or full class is
 *    rejected before the email is considered at all, so the response for an
 *    unbookable class is identical whether or not an account exists for that
 *    address. This is what keeps a dead class from becoming an account oracle.
 *
 * 2. **An existing account is never booked into anonymously.** If the address
 *    belongs to a member, we do not create the booking and we do not reveal
 *    their membership state; we return `email_continue_link` and the caller
 *    emails a signed link to that address. Anyone can type anyone's email, so
 *    the only safe response is one that requires control of the mailbox.
 *
 * 3. **Waitlist entries never take payment.** A waitlisted guest has no spot
 *    yet, so charging them creates the refund problem this platform is
 *    supposed to avoid. Payment is collected when a waitlist promotion is
 *    confirmed, not at claim time.
 *
 * `not_priced` matters because a guest has no entitlements by definition: if
 * the offering has no drop-in price, there is nothing a guest could pay, so the
 * class is not guest-bookable no matter how many spots are open.
 */
export function decideExpressBooking(ctx: ExpressContext): ExpressDecision {
  const { occurrence, guest, now, accountExists, alreadyClaimed } = ctx;

  const eligibility = checkOccurrenceEligibility(occurrence, now);
  if (!eligibility.eligible) {
    return { action: "reject", reason: eligibility.reason! };
  }

  const placement = eligibility.placement!;

  // Rule 2: hand an existing member back to an email they must control.
  // Checked after eligibility (rule 1) and before anything that writes.
  if (accountExists) {
    return { action: "email_continue_link", reason: "account_exists" };
  }

  if (alreadyClaimed) {
    return { action: "reject", reason: "duplicate_claim" };
  }

  if (occurrence.waiverRequired && !guest.waiverAccepted) {
    return { action: "reject", reason: "waiver_not_accepted" };
  }

  // Rule 3: a waitlist claim is free; it is not a spot.
  if (placement === "waitlisted") {
    return { action: "book", placement, requiresPayment: false, amountCents: 0 };
  }

  const price = occurrence.dropInPriceCents;
  if (price === null || price === undefined) {
    return { action: "reject", reason: "not_priced" };
  }
  if (price <= 0) {
    // A deliberately free class (intro offer, community class) books outright.
    return { action: "book", placement, requiresPayment: false, amountCents: 0 };
  }

  return { action: "book", placement, requiresPayment: true, amountCents: price };
}

// ---------------------------------------------------------------------------
// Visitor-facing copy
// ---------------------------------------------------------------------------

/**
 * Message for a rejection, written for the visitor rather than the developer
 * (`COMPETITOR_ISSUES_PRIORITY.md` #5: every error says what happened and what
 * to do next). Kept here so the page and the Edge Function cannot drift.
 */
export function rejectMessage(reason: ExpressRejectReason): string {
  switch (reason) {
    case "express_disabled":
      return "This studio asks you to sign in before booking. Create an account or sign in to continue.";
    case "cancelled":
      return "This class was cancelled. Pick another time on the schedule.";
    case "already_started":
      return "This class has already started. Pick another time on the schedule.";
    case "cutoff_passed":
      return "Online booking for this class has closed. Contact the studio to be added at the door.";
    case "full":
      return "This class is full and the waitlist is closed. Pick another time on the schedule.";
    case "not_priced":
      return "This class is not available for drop-in booking. Sign in with a membership or class pack to book it.";
    case "duplicate_claim":
      return "You are already booked for this class. Check your email for the confirmation.";
    case "waiver_not_accepted":
      return "This studio requires you to accept the waiver before your first class.";
  }
}

/** Message for each guest-form field error. */
export function guestFieldMessage(error: GuestFieldError): string {
  switch (error) {
    case "first_name_required":
      return "Enter your first name.";
    case "last_name_required":
      return "Enter your last name.";
    case "email_required":
      return "Enter your email so we can send your confirmation.";
    case "email_invalid":
      return "That email does not look right. Check it and try again.";
    case "phone_invalid":
      return "That phone number does not look right, or leave it blank.";
  }
}
