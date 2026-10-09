/**
 * Classes, prices and the weekly schedule an owner edits after onboarding
 * (LP-5). Pure mapping between rows (cents, minutes, TIME strings) and the
 * strings the inputs hold, plus the checks that run before saving. The
 * database repeats the important ones (00042).
 */

export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export const BILLING_CYCLES = ["weekly", "monthly", "quarterly", "annual"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];
export const cycleNoun = (c: BillingCycle): string =>
  ({ weekly: "week", monthly: "month", quarterly: "quarter", annual: "year" })[c] ?? c;

/** Stripe Checkout refuses smaller charges. */
export const MIN_PAID_CENTS = 50;

export interface CatalogOffering {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  capacity: number;
  drop_in_price_cents: number | null;
  is_active: boolean | null;
}
export interface CatalogPack {
  id: string;
  name: string;
  class_count: number;
  price_cents: number;
  validity_days: number;
  is_active: boolean | null;
}
export interface CatalogMembership {
  id: string;
  name: string;
  billing_cycle: BillingCycle;
  price_cents: number;
  classes_per_cycle: number | null;
  is_active: boolean | null;
}
export interface CatalogRule {
  id: string;
  offering_id: string;
  location_id: string;
  teacher_id: string | null;
  day_of_week: Weekday;
  start_time: string;
  end_time: string;
  recurrence: string;
  is_active: boolean | null;
}
export interface CatalogLocation {
  id: string;
  name: string;
  is_primary: boolean | null;
}
export interface StaffName {
  profile_id: string;
  name: string;
  role: string;
}
export interface StudioCatalog {
  offerings: CatalogOffering[];
  packs: CatalogPack[];
  memberships: CatalogMembership[];
  rules: CatalogRule[];
  locations: CatalogLocation[];
}

export const CATALOG_COLUMNS = {
  offerings: "id, name, slug, description, duration_minutes, capacity, drop_in_price_cents, is_active",
  class_pack_types: "id, name, class_count, price_cents, validity_days, is_active",
  membership_types: "id, name, billing_cycle, price_cents, classes_per_cycle, is_active",
  schedule_rules: "id, offering_id, location_id, teacher_id, day_of_week, start_time, end_time, recurrence, is_active",
  locations: "id, name, is_primary",
} as const;

export type CatalogTable = "offerings" | "class_pack_types" | "membership_types" | "schedule_rules";

// ---------------------------------------------------------------------------
// Money and numbers
// ---------------------------------------------------------------------------

export const centsToInput = (cents: number | null | undefined): string =>
  cents === null || cents === undefined ? "" : (cents / 100).toFixed(2).replace(/\.00$/, "");

/** "25", "$25.50", "25.5" -> cents. Blank -> null. Anything else -> NaN. */
export function parseMoney(input: string): number | null {
  const s = input.trim().replace(/^\$/, "").replace(/,/g, "");
  if (s === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return Number.NaN;
  return Math.round(Number(s) * 100);
}

const parseWhole = (input: string): number | null => {
  const s = input.trim();
  if (s === "") return null;
  return /^\d+$/.test(s) ? Number(s) : Number.NaN;
};

export function formatPrice(cents: number | null, currency = "USD"): string {
  if (cents === null) return "Members and packs only";
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export interface OfferingForm {
  name: string;
  description: string;
  duration: string;
  capacity: string;
  dropIn: string;
  isActive: boolean;
}

export const emptyOfferingForm = (): OfferingForm => ({
  name: "", description: "", duration: "60", capacity: "20", dropIn: "", isActive: true,
});

export const offeringToForm = (o: CatalogOffering): OfferingForm => ({
  name: o.name,
  description: o.description ?? "",
  duration: String(o.duration_minutes),
  capacity: String(o.capacity),
  dropIn: centsToInput(o.drop_in_price_cents),
  isActive: o.is_active !== false,
});

export type OfferingPatch = Pick<CatalogOffering, "name" | "description" | "duration_minutes" | "capacity" | "drop_in_price_cents" | "is_active">;

export function offeringFromForm(f: OfferingForm): { patch?: OfferingPatch; errors?: string[] } {
  const errors: string[] = [];
  const name = f.name.trim();
  if (!name) errors.push("Give the class a name.");
  const duration = parseWhole(f.duration);
  if (duration === null || Number.isNaN(duration) || duration < 5 || duration > 600) {
    errors.push("Length must be 5 to 600 minutes.");
  }
  const capacity = parseWhole(f.capacity);
  if (capacity === null || Number.isNaN(capacity) || capacity < 1 || capacity > 1000) {
    errors.push("Capacity must be 1 to 1000.");
  }
  const dropIn = parseMoney(f.dropIn);
  if (Number.isNaN(dropIn)) errors.push("Drop-in price must be a number like 25 or 25.50.");
  else if (dropIn !== null && dropIn > 0 && dropIn < MIN_PAID_CENTS) {
    errors.push("A paid drop-in must be at least $0.50. Use 0 for a free class.");
  }
  if (errors.length) return { errors };
  return {
    patch: {
      name,
      description: f.description.trim() || null,
      duration_minutes: duration as number,
      capacity: capacity as number,
      drop_in_price_cents: dropIn,
      is_active: f.isActive,
    },
  };
}

export function slugify(name: string): string {
  const s = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || "class";
}

/** A slug not in `taken`: name, then name-2, name-3 ... */
export function uniqueSlug(name: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const base = slugify(name);
  if (!used.has(base)) return base;
  for (let i = 2; ; i++) if (!used.has(`${base}-${i}`)) return `${base}-${i}`;
}

// ---------------------------------------------------------------------------
// Packs and memberships
// ---------------------------------------------------------------------------

export interface PackForm { name: string; classes: string; price: string; validDays: string; isActive: boolean }
export const emptyPackForm = (): PackForm => ({ name: "", classes: "10", price: "", validDays: "90", isActive: true });
export const packToForm = (p: CatalogPack): PackForm => ({
  name: p.name,
  classes: String(p.class_count),
  price: centsToInput(p.price_cents),
  validDays: String(p.validity_days),
  isActive: p.is_active !== false,
});
export type PackPatch = Pick<CatalogPack, "name" | "class_count" | "price_cents" | "validity_days" | "is_active">;

function paidPrice(input: string, label: string, errors: string[]): number {
  const cents = parseMoney(input);
  if (cents === null || Number.isNaN(cents) || cents < MIN_PAID_CENTS) {
    errors.push(`${label} must be at least $0.50.`);
    return 0;
  }
  return cents;
}

export function packFromForm(f: PackForm): { patch?: PackPatch; errors?: string[] } {
  const errors: string[] = [];
  const classes = parseWhole(f.classes);
  if (classes === null || Number.isNaN(classes) || classes < 1 || classes > 500) errors.push("Classes must be 1 to 500.");
  const price = paidPrice(f.price, "Pack price", errors);
  const days = parseWhole(f.validDays);
  if (days === null || Number.isNaN(days) || days < 1 || days > 3650) errors.push("Valid for must be 1 to 3650 days.");
  if (errors.length) return { errors };
  return {
    patch: {
      name: f.name.trim() || `${classes}-Class Pack`,
      class_count: classes as number,
      price_cents: price,
      validity_days: days as number,
      is_active: f.isActive,
    },
  };
}

export interface MembershipForm { name: string; cycle: BillingCycle; price: string; classesPerCycle: string; isActive: boolean }
export const emptyMembershipForm = (): MembershipForm => ({ name: "", cycle: "monthly", price: "", classesPerCycle: "", isActive: true });
export const membershipToForm = (m: CatalogMembership): MembershipForm => ({
  name: m.name,
  cycle: m.billing_cycle,
  price: centsToInput(m.price_cents),
  classesPerCycle: m.classes_per_cycle === null ? "" : String(m.classes_per_cycle),
  isActive: m.is_active !== false,
});
export type MembershipPatch = Pick<CatalogMembership, "name" | "billing_cycle" | "price_cents" | "classes_per_cycle" | "is_active">;

export function membershipFromForm(f: MembershipForm): { patch?: MembershipPatch; errors?: string[] } {
  const errors: string[] = [];
  const price = paidPrice(f.price, "Membership price", errors);
  const perCycle = parseWhole(f.classesPerCycle);
  if (Number.isNaN(perCycle) || (perCycle !== null && (perCycle < 1 || perCycle > 500))) {
    errors.push("Classes per cycle must be 1 to 500, or blank for unlimited.");
  }
  if (!BILLING_CYCLES.includes(f.cycle)) errors.push("Pick how often it bills.");
  if (errors.length) return { errors };
  return {
    patch: {
      name: f.name.trim() || (perCycle === null ? "Unlimited" : "Membership"),
      billing_cycle: f.cycle,
      price_cents: price,
      classes_per_cycle: perCycle,
      is_active: f.isActive,
    },
  };
}

// ---------------------------------------------------------------------------
// Weekly schedule
// ---------------------------------------------------------------------------

/** "18:00:00" or "18:00" -> "18:00". */
export const hhmm = (t: string): string => t.slice(0, 5);

/** End time on the same day: start + length, clamped to 23:59 (a TIME cannot pass midnight). */
export function ruleEndTime(start: string, durationMinutes: number): string {
  const [h, m] = hhmm(start).split(":").map(Number);
  const end = Math.min(h * 60 + m + durationMinutes, 24 * 60 - 1);
  return `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
}

export function formatTime(t: string): string {
  const [h, m] = hhmm(t).split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, "0")}${suffix}`;
}

export const dayLabel = (d: Weekday): string => d.charAt(0).toUpperCase() + d.slice(1);

export interface RuleForm { offeringId: string; day: Weekday; start: string; teacherId: string; locationId: string; isActive: boolean }

export const ruleToForm = (r: CatalogRule): RuleForm => ({
  offeringId: r.offering_id,
  day: r.day_of_week,
  start: hhmm(r.start_time),
  teacherId: r.teacher_id ?? "",
  locationId: r.location_id,
  isActive: r.is_active !== false,
});

export type RulePatch = Pick<CatalogRule, "offering_id" | "location_id" | "teacher_id" | "day_of_week" | "start_time" | "end_time" | "is_active"> & { recurrence: "weekly" };

export function ruleFromForm(
  f: RuleForm,
  offerings: Pick<CatalogOffering, "id" | "duration_minutes">[],
): { patch?: RulePatch; errors?: string[] } {
  const errors: string[] = [];
  const offering = offerings.find((o) => o.id === f.offeringId);
  if (!offering) errors.push("Pick a class.");
  if (!WEEKDAYS.includes(f.day)) errors.push("Pick a day.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(f.start)) errors.push("Pick a start time.");
  if (!f.locationId) errors.push("Add a location in Settings first.");
  if (errors.length || !offering) return { errors };
  return {
    patch: {
      offering_id: offering.id,
      location_id: f.locationId,
      teacher_id: f.teacherId || null,
      day_of_week: f.day,
      start_time: f.start,
      end_time: ruleEndTime(f.start, offering.duration_minutes),
      is_active: f.isActive,
      recurrence: "weekly",
    },
  };
}

/** Rules grouped by weekday in Monday-first order, each day sorted by start time. */
export function rulesByDay<T extends Pick<CatalogRule, "day_of_week" | "start_time">>(rules: T[]): { day: Weekday; rules: T[] }[] {
  return WEEKDAYS.map((day) => ({
    day,
    rules: rules.filter((r) => r.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time)),
  })).filter((g) => g.rules.length > 0);
}
