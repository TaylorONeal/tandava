/**
 * Booking entitlements engine.
 *
 * Pure, framework-free logic that answers the questions the booking flow needs:
 *   - Which of a member's memberships / class packs cover THIS class?
 *   - How many classes remain on each?
 *   - Which source should we recommend?
 *   - Is a cancellation late (and therefore fee-eligible)?
 *
 * This is the single source of truth for eligibility, shared by the booking UI
 * and (eventually) the server-side booking function. The schema already models
 * everything we check (membership/pack scope by offering + location, usage
 * limits, status, expiry); this turns that model into decisions.
 */

import type {
  Membership,
  ClassPack,
  Offering,
} from "@/types/database";
import type { PaymentSource } from "@/components/booking/PaymentSourceSelector";

export interface Coverage {
  covers: boolean;
  /** Classes left on this source after consideration; null = unlimited. */
  remaining: number | null;
  /** Machine-readable reason a source does NOT cover (for UI/debugging). */
  reason?: CoverageReason;
}

export type CoverageReason =
  | "inactive"
  | "expired"
  | "out_of_period"
  | "offering_not_covered"
  | "location_not_covered"
  | "no_classes_left"
  | "missing_type";

interface CoverageContext {
  offeringId: string;
  locationId: string;
  now: Date;
}

/** Does the array scope (empty = "all") include the given id? */
function scopeIncludes(scope: string[] | undefined, id: string): boolean {
  if (!scope || scope.length === 0) return true; // empty = all
  return scope.includes(id);
}

/** Determine whether a membership covers a specific class occurrence. */
export function membershipCoverage(
  membership: Membership,
  ctx: CoverageContext,
): Coverage {
  const mt = membership.membership_type;
  if (!mt) return { covers: false, remaining: null, reason: "missing_type" };

  if (membership.status !== "active") {
    return { covers: false, remaining: null, reason: "inactive" };
  }

  const now = ctx.now.getTime();
  if (membership.expires_at && now > new Date(membership.expires_at).getTime()) {
    return { covers: false, remaining: null, reason: "expired" };
  }
  const periodStart = new Date(membership.current_period_start).getTime();
  const periodEnd = new Date(membership.current_period_end).getTime();
  if (now < periodStart || now > periodEnd) {
    return { covers: false, remaining: null, reason: "out_of_period" };
  }

  if (!scopeIncludes(mt.offering_ids, ctx.offeringId)) {
    return { covers: false, remaining: null, reason: "offering_not_covered" };
  }
  if (!scopeIncludes(mt.locations, ctx.locationId)) {
    return { covers: false, remaining: null, reason: "location_not_covered" };
  }

  // Usage limits: null classes_per_cycle = unlimited.
  if (mt.classes_per_cycle == null) {
    return { covers: true, remaining: null };
  }
  const remaining = mt.classes_per_cycle - membership.classes_used_this_cycle;
  if (remaining <= 0) {
    return { covers: false, remaining: 0, reason: "no_classes_left" };
  }
  return { covers: true, remaining };
}

/** Determine whether a class pack covers a specific class occurrence. */
export function packCoverage(pack: ClassPack, ctx: CoverageContext): Coverage {
  const pt = pack.class_pack_type;
  if (!pt) return { covers: false, remaining: null, reason: "missing_type" };

  if (pack.status !== "active") {
    return { covers: false, remaining: pack.classes_remaining, reason: "inactive" };
  }
  if (ctx.now.getTime() > new Date(pack.expires_at).getTime()) {
    return { covers: false, remaining: pack.classes_remaining, reason: "expired" };
  }
  if (pack.classes_remaining <= 0) {
    return { covers: false, remaining: 0, reason: "no_classes_left" };
  }
  if (!scopeIncludes(pt.offering_ids, ctx.offeringId)) {
    return { covers: false, remaining: pack.classes_remaining, reason: "offering_not_covered" };
  }
  if (!scopeIncludes(pt.locations, ctx.locationId)) {
    return { covers: false, remaining: pack.classes_remaining, reason: "location_not_covered" };
  }
  return { covers: true, remaining: pack.classes_remaining };
}

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export interface ResolveInput {
  offering: Pick<Offering, "id" | "drop_in_price_cents">;
  locationId: string;
  memberships: Membership[];
  packs: ClassPack[];
  now?: Date;
}

/**
 * Resolve a member's entitlements into the PaymentSource list the booking UI
 * renders. Covering sources first; a drop-in option is appended when the
 * offering has a drop-in price.
 */
export function resolvePaymentSources(input: ResolveInput): PaymentSource[] {
  const ctx: CoverageContext = {
    offeringId: input.offering.id,
    locationId: input.locationId,
    now: input.now ?? new Date(),
  };

  const sources: PaymentSource[] = [];

  for (const membership of input.memberships) {
    const coverage = membershipCoverage(membership, ctx);
    sources.push({
      id: membership.id,
      type: "MEMBERSHIP",
      name: membership.membership_type?.name ?? "Membership",
      description: coverage.remaining == null ? "All classes included" : undefined,
      remaining: coverage.remaining ?? undefined,
      expiresAt: formatExpiry(membership.current_period_end),
      covers: coverage.covers,
    });
  }

  for (const pack of input.packs) {
    const coverage = packCoverage(pack, ctx);
    sources.push({
      id: pack.id,
      type: "CLASS_PACK",
      name: pack.class_pack_type?.name ?? "Class Pack",
      remaining: coverage.remaining ?? undefined,
      expiresAt: formatExpiry(pack.expires_at),
      covers: coverage.covers,
    });
  }

  if (input.offering.drop_in_price_cents != null) {
    sources.push({
      id: "drop-in",
      type: "DROP_IN",
      name: "Drop-in",
      description: "One-time payment",
      covers: true,
      priceCents: input.offering.drop_in_price_cents,
    });
  }

  return sortByPreference(sources);
}

/** Sort covering sources first, in the order we'd recommend consuming them. */
export function sortByPreference(sources: PaymentSource[]): PaymentSource[] {
  return [...sources].sort((a, b) => preferenceScore(b) - preferenceScore(a));
}

/**
 * Higher score = more preferred. Use an unlimited membership before a pack
 * (don't burn finite classes), a pack before a limited membership, and a paid
 * drop-in last. Non-covering sources sink to the bottom.
 */
function preferenceScore(s: PaymentSource): number {
  if (!s.covers) return -1;
  if (s.type === "MEMBERSHIP" && s.remaining === undefined) return 100; // unlimited
  if (s.type === "CLASS_PACK") return 80;
  if (s.type === "WORKSHOP_PASS") return 70;
  if (s.type === "MEMBERSHIP") return 60; // limited membership
  return 10; // drop-in
}

/** The source we'd pre-select: the highest-preference covering source. */
export function pickRecommended(sources: PaymentSource[]): PaymentSource | null {
  const covering = sortByPreference(sources).filter((s) => s.covers);
  // Prefer a non-drop-in covering source for quick-book; fall back to drop-in.
  return covering.find((s) => s.type !== "DROP_IN") ?? covering[0] ?? null;
}

// ---------------------------------------------------------------------------
// Cancellation policy
// ---------------------------------------------------------------------------

/** The moment after which a cancellation counts as "late". */
export function cancellationDeadline(startsAt: string, cancellationMinutes: number): Date {
  return new Date(new Date(startsAt).getTime() - cancellationMinutes * 60_000);
}

/** Is cancelling now a late cancel (inside the studio's cancellation window)? */
export function isLateCancel(
  startsAt: string,
  cancellationMinutes: number,
  now: Date = new Date(),
): boolean {
  return now.getTime() > cancellationDeadline(startsAt, cancellationMinutes).getTime();
}
