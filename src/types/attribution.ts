/**
 * Row shapes for the PRD-024/027 phase-1 attribution and automation RPCs
 * (migration 00025). Kept apart from the large database.ts so the analytics
 * code has one obvious place to look.
 */

export type AttributionModel = "first" | "last";

/** One row of get_attribution_sources(): a channel + source + campaign bucket. */
export interface AttributionSourceRow {
  channel: string;
  utm_source: string | null;
  utm_campaign: string | null;
  sessions: number;
  new_people: number;
  bookings: number;
  purchases: number;
  revenue_cents: number;
}

/** The frozen description of a session, as stored on conversions. */
export interface TouchSnapshot {
  session_id?: string | null;
  channel?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referrer_host?: string | null;
  surface?: string | null;
  started_at?: string | null;
}

export interface MemberConversion {
  type: string;
  value_cents: number | null;
  currency: string | null;
  occurred_at: string;
  first_touch: TouchSnapshot | null;
  converting_touch: TouchSnapshot | null;
  days_to_convert: number | null;
}

/** get_member_attribution(): how one person found the studio. */
export interface MemberAttribution {
  source: string | null;
  acquired_at: string | null;
  first_touch: TouchSnapshot | null;
  conversions: MemberConversion[];
}

/** automation_settings row (one per studio; absent = defaults). */
export interface AutomationSettingsRow {
  studio_id: string;
  guest_to_member_enabled: boolean;
  first_visit_enabled: boolean;
  lapsed_enabled: boolean;
  lapsed_days_override: number | null;
  intro_offer_url: string | null;
}
