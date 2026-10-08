/**
 * Phase-1 email automations (PRD-027): who gets which message, when.
 *
 * Pure: the runner (supabase/functions/run-automations) loads facts with
 * get_automation_candidates(), asks decideNext() per person, sends, and records
 * the send in automation_sends. Everything that decides is here and tested.
 *
 * Rules that apply to every automation:
 *   - Email marketing consent required (latest consent_records row).
 *   - Quiet hours: nothing between 21:00 and 08:00 in the studio's time zone.
 *   - At most one automation email per person per 24 hours, across all three.
 *   - Each step sends once per episode; a stop condition ends the sequence.
 */

export type AutomationKey = "guest_to_member" | "first_visit" | "lapsed";

export interface AutomationSettings {
  guestToMemberEnabled: boolean;
  firstVisitEnabled: boolean;
  lapsedEnabled: boolean;
  lapsedDaysOverride?: number | null;
}

export const DEFAULT_SETTINGS: AutomationSettings = {
  guestToMemberEnabled: true,
  firstVisitEnabled: true,
  lapsedEnabled: true,
  lapsedDaysOverride: null,
};

export interface PriorSend {
  key: AutomationKey;
  step: number;
  episode: string;
  sentAt: string;
  /**
   * Claimed but not confirmed by the provider (status 'sending'). It may have
   * gone out, so it counts for the daily cap, recency windows and the
   * intro-offer rule, but it never advances a sequence.
   */
  pending?: boolean;
}

export interface PersonFacts {
  profileId: string;
  isGuest: boolean;
  claimedAt?: string | null;
  emailConsent: boolean;
  guestBookingAt?: string | null;
  firstCheckInAt?: string | null;
  lastVisitAt?: string | null;
  visitCount: number;
  bookingCount: number;
  medianGapDays?: number | null;
  hasActiveMembership: boolean;
  hasActivePack: boolean;
  /** A confirmed or waitlisted future class at this studio. */
  hasUpcomingBooking?: boolean;
  sends: PriorSend[];
}

export interface Decision {
  key: AutomationKey;
  step: number;
  episode: string;
  /** Template id the runner renders. */
  template: string;
}

export type SkipReason =
  | "no_consent"
  | "quiet_hours"
  | "daily_cap"
  | "nothing_due";

const HOUR = 3600_000;
const DAY = 24 * HOUR;

/** Hour of day (0-23) in a time zone. */
export function localHour(now: Date, timeZone: string): number {
  const h = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" }).format(now);
  return Number(h);
}

export function inQuietHours(now: Date, timeZone: string): boolean {
  const h = localHour(now, timeZone);
  return h >= 21 || h < 8;
}

/**
 * Days without a visit before someone counts as lapsed: twice their own usual
 * gap, clamped to 14..45, default 21 when there isn't enough history. A
 * studio's override wins.
 */
export function lapsedThresholdDays(medianGapDays: number | null | undefined, override?: number | null): number {
  if (override) return override;
  if (!medianGapDays || medianGapDays <= 0) return 21;
  return Math.min(45, Math.max(14, Math.round(medianGapDays * 2)));
}

function sent(f: PersonFacts, key: AutomationKey, step: number, episode: string): boolean {
  return f.sends.some((s) => !s.pending && s.key === key && s.step === step && s.episode === episode);
}

/** True when this automation step went out to the person in the last `days`, any episode. */
function sentWithin(f: PersonFacts, key: AutomationKey, step: number, days: number, now: Date): boolean {
  return f.sends.some(
    (s) => s.key === key && s.step === step && now.getTime() - new Date(s.sentAt).getTime() < days * DAY,
  );
}

/** Both sequences end in the same intro offer; a person gets it once. */
function introOfferSent(f: PersonFacts): boolean {
  return f.sends.some((s) => (s.key === "guest_to_member" || s.key === "first_visit") && s.step === 1);
}

function since(iso: string | null | undefined, now: Date): number {
  return iso ? now.getTime() - new Date(iso).getTime() : -Infinity;
}

function isCustomer(f: PersonFacts): boolean {
  return f.hasActiveMembership || f.hasActivePack;
}

/** Next due step for one automation, ignoring consent/quiet/cap. */
export function dueStep(f: PersonFacts, key: AutomationKey, now: Date, settings: AutomationSettings): Decision | null {
  switch (key) {
    case "guest_to_member": {
      if (!settings.guestToMemberEnabled || !f.isGuest || f.claimedAt || !f.guestBookingAt || isCustomer(f)) return null;
      // guestBookingAt is the LATEST guest booking. Only a recent booking
      // starts a follow-up (an old one, a fresh opt-in or an import must not
      // trigger a backlog), and a guest who keeps booking hears from us at
      // most once a month.
      const episode = f.guestBookingAt.slice(0, 10);
      const age = since(f.guestBookingAt, now);
      if (age >= 1 * DAY && age < 7 * DAY && !sent(f, key, 0, episode) && !sentWithin(f, key, 0, 30, now))
        return { key, step: 0, episode, template: "automation_guest_save_details" };
      // Step 1 follows the step 0 that actually went out, not the latest
      // booking: a guest who books again in between still gets the intro
      // offer (only claiming the account or buying stops the sequence).
      const lastStep0 = f.sends
        .filter((x) => x.key === key && x.step === 0 && !x.pending)
        .sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0];
      if (lastStep0 && !introOfferSent(f) && !sent(f, key, 1, lastStep0.episode)) {
        // Same timing as before, counted from that episode's booking date.
        const episodeAge = since(`${lastStep0.episode}T00:00:00Z`, now);
        if (episodeAge >= 3 * DAY && episodeAge < 14 * DAY)
          return { key, step: 1, episode: lastStep0.episode, template: "automation_guest_intro_offer" };
      }
      return null;
    }
    case "first_visit": {
      if (!settings.firstVisitEnabled || !f.firstCheckInAt) return null;
      const episode = f.firstCheckInAt.slice(0, 10);
      const age = since(f.firstCheckInAt, now);
      // Welcome only in the first week; never for someone with real history.
      // Not for someone who already booked their next class: the welcome's
      // whole ask is "book your next class".
      if (f.visitCount === 1 && f.bookingCount <= 1 && !f.hasUpcomingBooking && age >= 2 * HOUR && age < 7 * DAY && !sent(f, key, 0, episode))
        return { key, step: 0, episode, template: "automation_first_visit_welcome" };
      if (
        f.bookingCount <= 1 &&
        !isCustomer(f) &&
        age >= 3 * DAY &&
        age < 14 * DAY &&
        sent(f, key, 0, episode) &&
        !introOfferSent(f)
      )
        return { key, step: 1, episode, template: "automation_first_visit_intro_offer" };
      return null;
    }
    case "lapsed": {
      if (!settings.lapsedEnabled || !f.lastVisitAt || f.visitCount < 2 || f.hasUpcomingBooking) return null;
      const threshold = lapsedThresholdDays(f.medianGapDays, settings.lapsedDaysOverride);
      const episode = f.lastVisitAt.slice(0, 10);
      const age = since(f.lastVisitAt, now);
      if (age >= threshold * DAY && age < (threshold + 30) * DAY && !sent(f, key, 0, episode))
        return { key, step: 0, episode, template: "automation_lapsed" };
      return null;
    }
  }
}

const PRIORITY: AutomationKey[] = ["guest_to_member", "first_visit", "lapsed"];

export function decideNext(
  f: PersonFacts,
  now: Date,
  studioTimeZone: string,
  settings: AutomationSettings = DEFAULT_SETTINGS,
): { decision: Decision } | { skip: SkipReason } {
  const due = PRIORITY.map((k) => dueStep(f, k, now, settings)).find((d): d is Decision => d !== null);
  if (!due) return { skip: "nothing_due" };
  if (!f.emailConsent) return { skip: "no_consent" };
  if (inQuietHours(now, studioTimeZone)) return { skip: "quiet_hours" };
  if (f.sends.some((s) => now.getTime() - new Date(s.sentAt).getTime() < DAY)) return { skip: "daily_cap" };
  return { decision: due };
}
