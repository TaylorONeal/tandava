/**
 * Account page (live): profile form mapping and the entitlement list.
 * Pure and unit-tested.
 */
import type { Profile, MyProfilePatch, MyEntitlementRow } from "@/types/database";

export interface MyProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  pronouns: string;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  instagramHandle: string;
}

export function profileToForm(p: Profile | null): MyProfileForm {
  return {
    firstName: p?.first_name ?? "",
    lastName: p?.last_name ?? "",
    phone: p?.phone ?? "",
    pronouns: p?.pronouns ?? "",
    dateOfBirth: p?.date_of_birth ?? "",
    emergencyContactName: p?.emergency_contact_name ?? "",
    emergencyContactPhone: p?.emergency_contact_phone ?? "",
    instagramHandle: p?.instagram_handle ?? "",
  };
}

const blank = (v: string) => (v.trim() === "" ? null : v.trim());

/** Form to a profile patch, or the errors the person can fix. */
export function formToPatch(f: MyProfileForm, today: Date = new Date()): { patch?: MyProfilePatch; errors?: string[] } {
  const errors: string[] = [];
  const dob = blank(f.dateOfBirth);
  if (dob) {
    const d = new Date(`${dob}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(d.getTime())) errors.push("Date of birth must be a valid date.");
    else if (d.getTime() > today.getTime()) errors.push("Date of birth can't be in the future.");
  }
  if (errors.length) return { errors };
  return {
    patch: {
      first_name: blank(f.firstName),
      last_name: blank(f.lastName),
      phone: blank(f.phone),
      pronouns: blank(f.pronouns),
      date_of_birth: dob,
      emergency_contact_name: blank(f.emergencyContactName),
      emergency_contact_phone: blank(f.emergencyContactPhone),
      instagram_handle: blank(f.instagramHandle)?.replace(/^@/, "") ?? null,
    },
  };
}

export interface EntitlementView {
  id: string;
  kind: "membership" | "pack";
  studioId: string;
  studioName: string;
  name: string;
  /** "Active", "Past due", ... */
  statusLabel: string;
  isActive: boolean;
  /** "$99 / month" or "$80" */
  priceLabel: string | null;
  /** "Renews Nov 9, 2026", "Expires Jan 7, 2027", "Ended Oct 1, 2026" */
  dateLabel: string | null;
  /** Packs: "4 classes left" */
  remainingLabel: string | null;
  canManageBilling: boolean;
}

const CYCLE: Record<string, string> = { weekly: "week", monthly: "month", quarterly: "quarter", annual: "year" };

function money(cents: number, currency: string | null): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", minimumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
  }
}

function day(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(iso));
}

export function toEntitlementView(r: MyEntitlementRow, now: Date = new Date()): EntitlementView {
  const ended = r.ends_at ? new Date(r.ends_at).getTime() < now.getTime() : false;
  const isActive = r.status === "active" && !ended;
  const statusLabel = ended && r.status === "active"
    ? (r.kind === "pack" ? "Expired" : "Ended")
    : r.status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  let dateLabel: string | null = null;
  if (r.ends_at) {
    if (!isActive) dateLabel = `${r.kind === "pack" ? "Expired" : "Ended"} ${day(r.ends_at)}`;
    else if (r.kind === "membership") dateLabel = `${r.status === "active" ? "Renews" : "Period ends"} ${day(r.ends_at)}`;
    else dateLabel = `Expires ${day(r.ends_at)}`;
  }
  return {
    id: r.entitlement_id,
    kind: r.kind,
    studioId: r.studio_id,
    studioName: r.studio_name,
    name: r.name,
    statusLabel,
    isActive,
    priceLabel: r.price_cents == null ? null
      : r.kind === "membership" && r.billing_cycle ? `${money(r.price_cents, r.currency)} / ${CYCLE[r.billing_cycle] ?? r.billing_cycle}`
      : money(r.price_cents, r.currency),
    dateLabel,
    remainingLabel: r.kind === "pack" && r.classes_remaining != null
      ? `${r.classes_remaining} ${r.classes_remaining === 1 ? "class" : "classes"} left` : null,
    canManageBilling: r.kind === "membership" && r.has_subscription,
  };
}
