/**
 * Event / workshop pricing + registration logic.
 *
 * Pure, framework-free rules behind the Mindbody-style registration panel:
 *   - which price actually applies (early-bird vs member vs regular vs tier)
 *   - whether registration is currently open (status + window + capacity)
 *   - which sessions a partial-registration tier includes
 *
 * Amounts are integer cents; dates are ISO strings.
 */

export type PriceLabel = "regular" | "early_bird" | "member" | "tier" | "tier_member";

export interface ResolvedPrice {
  /** What the member pays, in cents. */
  cents: number;
  /** Which rule won, for the UI badge. */
  label: PriceLabel;
  /** The undiscounted price, for strikethrough display. */
  regularCents: number;
  /** regularCents - cents (0 when no discount applied). */
  savingsCents: number;
}

export interface PriceInput {
  regularCents: number;
  memberCents?: number | null;
  earlyBirdCents?: number | null;
  earlyBirdEndsAt?: string | null;
  isMember?: boolean;
  now?: Date;
}

/** Is the event's early-bird window still open? */
export function isEarlyBirdActive(
  earlyBirdCents: number | null | undefined,
  earlyBirdEndsAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (earlyBirdCents == null) return false;
  if (!earlyBirdEndsAt) return true; // early-bird price with no deadline = always
  return now.getTime() <= new Date(earlyBirdEndsAt).getTime();
}

/**
 * Resolve the price the user actually pays: the lowest applicable of
 * regular / early-bird / member. Ties prefer the member label, then early-bird.
 */
export function resolveEventPrice(input: PriceInput): ResolvedPrice {
  const now = input.now ?? new Date();
  const regular = input.regularCents;

  const candidates: { cents: number; label: PriceLabel }[] = [
    { cents: regular, label: "regular" },
  ];

  if (isEarlyBirdActive(input.earlyBirdCents, input.earlyBirdEndsAt, now)) {
    candidates.push({ cents: input.earlyBirdCents as number, label: "early_bird" });
  }
  if (input.isMember && input.memberCents != null) {
    candidates.push({ cents: input.memberCents, label: "member" });
  }

  // Lowest price wins; on a tie, prefer member > early_bird > regular.
  const rank: Record<PriceLabel, number> = {
    member: 3, tier_member: 3, early_bird: 2, tier: 1, regular: 0,
  };
  candidates.sort((a, b) => (a.cents - b.cents) || (rank[b.label] - rank[a.label]));
  const winner = candidates[0];

  return {
    cents: winner.cents,
    label: winner.label,
    regularCents: regular,
    savingsCents: Math.max(0, regular - winner.cents),
  };
}

export interface TierInput {
  priceCents: number;
  memberPriceCents?: number | null;
}

/** Resolve a pricing tier's price (member price applied when eligible). */
export function resolveTierPrice(tier: TierInput, isMember?: boolean): ResolvedPrice {
  const useMember = Boolean(isMember && tier.memberPriceCents != null);
  const cents = useMember ? (tier.memberPriceCents as number) : tier.priceCents;
  return {
    cents,
    label: useMember ? "tier_member" : "tier",
    regularCents: tier.priceCents,
    savingsCents: Math.max(0, tier.priceCents - cents),
  };
}

// ---------------------------------------------------------------------------
// Deposits / payment plans
// ---------------------------------------------------------------------------

export interface DepositSplit {
  /** Charged now. */
  dueNowCents: number;
  /** Owed later (0 when paid in full). */
  balanceCents: number;
  /** Whether a partial deposit is being taken. */
  isDeposit: boolean;
}

/**
 * Split a total into a deposit-now / balance-later pair. A deposit that is
 * absent or >= the total degrades to paying in full.
 */
export function resolveDeposit(totalCents: number, depositCents?: number | null): DepositSplit {
  if (depositCents == null || depositCents <= 0 || depositCents >= totalCents) {
    return { dueNowCents: totalCents, balanceCents: 0, isDeposit: false };
  }
  return { dueNowCents: depositCents, balanceCents: totalCents - depositCents, isDeposit: true };
}

// ---------------------------------------------------------------------------
// Registration availability
// ---------------------------------------------------------------------------

export type RegistrationState =
  | "open"
  | "not_open_yet"
  | "closed"
  | "sold_out"
  | "waitlist";

export interface RegistrationInput {
  status?: string; // event_status; defaults to 'published'
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
  spotsLeft: number;
  waitlistEnabled?: boolean;
  now?: Date;
}

/** Current registration state for the CTA. */
export function registrationState(input: RegistrationInput): RegistrationState {
  const now = (input.now ?? new Date()).getTime();
  const status = input.status ?? "published";

  if (status === "cancelled" || status === "completed" || status === "draft") {
    return "closed";
  }
  if (input.registrationOpensAt && now < new Date(input.registrationOpensAt).getTime()) {
    return "not_open_yet";
  }
  if (input.registrationClosesAt && now > new Date(input.registrationClosesAt).getTime()) {
    return "closed";
  }
  if (input.spotsLeft <= 0 || status === "sold_out") {
    return input.waitlistEnabled ? "waitlist" : "sold_out";
  }
  return "open";
}

// ---------------------------------------------------------------------------
// Partial-series sessions
// ---------------------------------------------------------------------------

export interface SessionLike {
  session_number: number;
}

/**
 * Filter a multi-session event's sessions to those a tier includes.
 * An empty `includesSessions` means the tier covers every session.
 */
export function sessionsForTier<T extends SessionLike>(
  sessions: T[],
  includesSessions: number[] | undefined,
): T[] {
  if (!includesSessions || includesSessions.length === 0) return sessions;
  const set = new Set(includesSessions);
  return sessions.filter((s) => set.has(s.session_number));
}
