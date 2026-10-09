/**
 * Studio settings: the `studios` row an owner edits on /manage/settings.
 *
 * Pure mapping between the database row (cents, integers, nullable text) and
 * the form (strings the inputs hold). Kept here so the conversions are tested
 * and the page stays a thin binding.
 */

export interface StudioSettingsRow {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  timezone: string;
  currency: string;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  default_cancellation_minutes: number | null;
  late_cancel_fee_cents: number | null;
  no_show_fee_cents: number | null;
  waitlist_enabled: boolean | null;
  max_waitlist_size: number | null;
  discoverable: boolean;
  express_booking_enabled: boolean;
  /** Booking page live (00038). Listing on Discover requires it. */
  page_live: boolean;
}

export const STUDIO_SETTINGS_COLUMNS =
  "id, name, slug, email, phone, website, timezone, currency, brand_primary_color, brand_secondary_color, default_cancellation_minutes, late_cancel_fee_cents, no_show_fee_cents, waitlist_enabled, max_waitlist_size, discoverable, express_booking_enabled, page_live";

export interface StudioSettingsForm {
  name: string;
  slug: string;
  email: string;
  phone: string;
  website: string;
  timezone: string;
  currency: string;
  primaryColor: string;
  secondaryColor: string;
  cancelMinutes: string;
  lateCancelFee: string;
  noShowFee: string;
  waitlistEnabled: boolean;
  maxWaitlist: string;
}

/** Columns an owner may change from the settings form. Slug and id are not editable here. */
export type StudioSettingsPatch = Partial<
  Omit<StudioSettingsRow, "id" | "slug" | "discoverable" | "express_booking_enabled" | "page_live">
>;

const centsToDollars = (cents: number | null): string =>
  cents === null || cents === undefined ? "" : (cents / 100).toFixed(2).replace(/\.00$/, "");

export function toForm(row: StudioSettingsRow): StudioSettingsForm {
  return {
    name: row.name ?? "",
    slug: row.slug ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    website: row.website ?? "",
    timezone: row.timezone ?? "America/Chicago",
    currency: row.currency ?? "USD",
    primaryColor: row.brand_primary_color ?? "#4fd1c5",
    secondaryColor: row.brand_secondary_color ?? "#f687b3",
    cancelMinutes: row.default_cancellation_minutes === null ? "" : String(row.default_cancellation_minutes),
    lateCancelFee: centsToDollars(row.late_cancel_fee_cents),
    noShowFee: centsToDollars(row.no_show_fee_cents),
    waitlistEnabled: row.waitlist_enabled ?? true,
    maxWaitlist: row.max_waitlist_size === null ? "" : String(row.max_waitlist_size),
  };
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Form to a column patch, or a list of field errors the owner can fix. */
export function toPatch(
  form: StudioSettingsForm,
): { status: "ok"; patch: StudioSettingsPatch } | { status: "invalid"; errors: string[] } {
  const errors: string[] = [];
  const name = form.name.trim();
  if (!name) errors.push("Studio name is required.");

  const int = (raw: string, label: string, min = 0): number | null => {
    const s = raw.trim();
    if (!s) return null;
    const n = Number(s);
    if (!Number.isInteger(n) || n < min) {
      errors.push(`${label} must be a whole number of ${min} or more.`);
      return null;
    }
    return n;
  };
  const cents = (raw: string, label: string): number | null => {
    const s = raw.trim().replace(/^\$/, "");
    if (!s) return null;
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0) {
      errors.push(`${label} must be an amount of 0 or more.`);
      return null;
    }
    return Math.round(n * 100);
  };
  const color = (raw: string, label: string): string | null => {
    const s = raw.trim();
    if (!s) return null;
    if (!HEX.test(s)) {
      errors.push(`${label} must be a hex color like #4fd1c5.`);
      return null;
    }
    return s.toLowerCase();
  };
  const text = (raw: string): string | null => (raw.trim() ? raw.trim() : null);

  const patch: StudioSettingsPatch = {
    name,
    email: text(form.email),
    phone: text(form.phone),
    website: text(form.website),
    timezone: form.timezone,
    currency: form.currency,
    brand_primary_color: color(form.primaryColor, "Primary color"),
    brand_secondary_color: color(form.secondaryColor, "Secondary color"),
    default_cancellation_minutes: int(form.cancelMinutes, "Cancellation window"),
    late_cancel_fee_cents: cents(form.lateCancelFee, "Late cancel fee"),
    no_show_fee_cents: cents(form.noShowFee, "No-show fee"),
    waitlist_enabled: form.waitlistEnabled,
    max_waitlist_size: int(form.maxWaitlist, "Waitlist size", 1),
  };
  return errors.length ? { status: "invalid", errors } : { status: "ok", patch };
}
