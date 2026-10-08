/**
 * Planning for the run-automations Edge Function (PRD-027 phase 1).
 *
 * Turns get_automation_candidates() rows and an automation_settings row into
 * a list of sends. Pure and tested; the Edge Function only loads, sends and
 * records.
 */

import { decideNext, DEFAULT_SETTINGS, type AutomationKey, type AutomationSettings, type Decision, type PersonFacts, type SkipReason } from "./automations";

/** One row of get_automation_candidates() as PostgREST returns it. */
export interface CandidateRow {
  profile_id: string;
  email: string | null;
  first_name: string | null;
  is_guest: boolean | null;
  claimed_at: string | null;
  email_consent: boolean | null;
  first_booking_at: string | null;
  guest_booking_at: string | null;
  first_check_in_at: string | null;
  last_visit_at: string | null;
  visit_count: number | string | null;
  booking_count: number | string | null;
  median_gap_days: number | string | null;
  has_active_membership: boolean | null;
  has_active_pack: boolean | null;
  has_upcoming_booking?: boolean | null;
  sends: { key: string; step: number; episode: string; sent_at: string }[] | null;
}

export interface SettingsRow {
  guest_to_member_enabled?: boolean | null;
  first_visit_enabled?: boolean | null;
  lapsed_enabled?: boolean | null;
  lapsed_days_override?: number | null;
}

const KEYS = new Set<AutomationKey>(["guest_to_member", "first_visit", "lapsed"]);

const num = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export function factsFromCandidate(r: CandidateRow): PersonFacts {
  return {
    profileId: r.profile_id,
    isGuest: Boolean(r.is_guest),
    claimedAt: r.claimed_at,
    emailConsent: Boolean(r.email_consent),
    guestBookingAt: r.guest_booking_at,
    firstCheckInAt: r.first_check_in_at,
    lastVisitAt: r.last_visit_at,
    visitCount: num(r.visit_count) ?? 0,
    bookingCount: num(r.booking_count) ?? 0,
    medianGapDays: num(r.median_gap_days),
    hasActiveMembership: Boolean(r.has_active_membership),
    hasActivePack: Boolean(r.has_active_pack),
    hasUpcomingBooking: Boolean(r.has_upcoming_booking),
    sends: (r.sends ?? [])
      .filter((s) => KEYS.has(s.key as AutomationKey))
      .map((s) => ({ key: s.key as AutomationKey, step: Number(s.step), episode: s.episode, sentAt: s.sent_at })),
  };
}

export function settingsFromRow(row: SettingsRow | null | undefined): AutomationSettings {
  if (!row) return DEFAULT_SETTINGS;
  return {
    guestToMemberEnabled: row.guest_to_member_enabled ?? true,
    firstVisitEnabled: row.first_visit_enabled ?? true,
    lapsedEnabled: row.lapsed_enabled ?? true,
    lapsedDaysOverride: row.lapsed_days_override ?? null,
  };
}

export interface PlannedSend {
  profileId: string;
  email: string;
  firstName: string | null;
  decision: Decision;
}

export interface StudioPlan {
  sends: PlannedSend[];
  skipped: Partial<Record<SkipReason | "no_email" | "over_limit", number>>;
}

/** Decide every person's next email for one studio, capped per run. */
export function planStudio(
  rows: CandidateRow[],
  settingsRow: SettingsRow | null | undefined,
  now: Date,
  timeZone: string,
  maxSends = 200,
): StudioPlan {
  const settings = settingsFromRow(settingsRow);
  const plan: StudioPlan = { sends: [], skipped: {} };
  const skip = (k: keyof StudioPlan["skipped"]) => (plan.skipped[k] = (plan.skipped[k] ?? 0) + 1);
  for (const r of rows) {
    const email = r.email?.trim();
    if (!email || !email.includes("@")) {
      skip("no_email");
      continue;
    }
    const result = decideNext(factsFromCandidate(r), now, timeZone, settings);
    if ("skip" in result) {
      skip(result.skip);
      continue;
    }
    if (plan.sends.length >= maxSends) {
      skip("over_limit");
      continue;
    }
    plan.sends.push({ profileId: r.profile_id, email, firstName: r.first_name, decision: result.decision });
  }
  return plan;
}

/** One line of postal address from a location row, or null when incomplete. */
export function formatAddress(loc: {
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
} | null | undefined): string | null {
  if (!loc?.address_line1 || !loc.city) return null;
  const line = [loc.address_line1, loc.address_line2].filter(Boolean).join(" ");
  const region = [loc.state, loc.zip].filter(Boolean).join(" ");
  return [line, loc.city, region].filter(Boolean).join(", ");
}
