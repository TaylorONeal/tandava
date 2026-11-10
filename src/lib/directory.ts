/**
 * Studio directory (/studios): pure helpers over the generated public data.
 *
 * Data: src/data/directory/studios.public.json, built from public map data by
 * scripts/directory/build-studios.mjs. Taxonomy: src/data/taxonomy/, the
 * vendored copy of app-launch-playbook/taxonomy (styles + studio software).
 * Spec: docs/prd/PRD-028-studio-directory.md and docs/directory/.
 */

import stylesFile from "../data/taxonomy/styles.json";
import softwareFile from "../data/taxonomy/studio-software.json";

export type DirectoryStatus = "open" | "temporarily_closed" | "permanently_closed" | "historic" | "unknown";

export interface DirectorySoftware {
  platform_id: string;
  role: string;
  verified: boolean;
}

export interface DirectoryStudio {
  slug: string;
  name: string;
  brand: string | null;
  business_type: string;
  status: DirectoryStatus;
  is_active: boolean;
  status_note: string | null;
  opened_year: number | null;
  closed_year: number | null;
  address: {
    street?: string | null;
    postal_code?: string | null;
    area: string | null;
    locality: string;
    region_code: string | null;
    region_name: string | null;
    country_code: string;
    country_name: string;
  };
  geo: { lat: number; lng: number } | null;
  links: {
    website: string | null;
    instagram: string | null;
    facebook: string | null;
    youtube: string | null;
    tiktok: string | null;
    booking: string | null;
  };
  phone?: string | null;
  description: string | null;
  styles: string[];
  levels: string[];
  software: { current: DirectorySoftware[]; previous: DirectorySoftware[] };
  offers: Record<string, boolean | null>;
  map_ref: string | null;
  last_refreshed_at: string;
  last_verified_at: string | null;
}

export interface StyleDef {
  id: string;
  label: string;
  kind: string;
  parent: string | null;
  visibility: "public" | "hidden";
}

export interface PlatformDef {
  id: string;
  name: string;
  category: string;
  status?: string;
}

export const STYLES: StyleDef[] = (stylesFile as { styles: StyleDef[] }).styles;
export const PLATFORMS: PlatformDef[] = (softwareFile as { platforms: PlatformDef[] }).platforms;
export const SOFTWARE_CATEGORIES: { id: string; label: string }[] = (softwareFile as { categories: { id: string; label: string }[] }).categories;

const styleById = new Map(STYLES.map((s) => [s.id, s]));
const platformById = new Map(PLATFORMS.map((p) => [p.id, p]));

/** The public facet a style counts toward (itself, or its public parent). */
export function styleFacet(id: string): StyleDef | null {
  const s = styleById.get(id);
  if (!s || s.kind === "level" || s.kind === "fallback") return null;
  if (s.parent) {
    const parent = styleById.get(s.parent);
    if (s.visibility === "public" && parent?.kind === "experience") return s;
    return parent && parent.visibility === "public" ? parent : null;
  }
  return s.visibility === "public" ? s : null;
}

export function styleLabel(id: string): string {
  return styleById.get(id)?.label ?? id;
}

export function platformName(id: string): string {
  return platformById.get(id)?.name ?? id;
}

/** "Booking via Arketa. Previously: Mindbody." (BOOKING-PLATFORMS section 3) */
export function softwareLine(s: DirectoryStudio): string | null {
  const current = s.software.current.filter((x) => x.role === "system_of_record" || x.role === "scheduling").map((x) => platformName(x.platform_id));
  const previous = s.software.previous.map((x) => platformName(x.platform_id));
  const parts: string[] = [];
  if (current.length) parts.push(`Booking via ${current.join(" and ")}.`);
  if (previous.length) parts.push(`Previously: ${previous.join(", ")}.`);
  return parts.length ? parts.join(" ") : null;
}

export interface DirectoryFilters {
  q?: string;
  country?: string;
  region?: string;
  city?: string;
  style?: string;
  software?: string;
  /** "active" (default), "archived" or "all" */
  show?: "active" | "archived" | "all";
}

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

/** Every software id a studio has touched (current and previous), for the software filter. */
export function studioSoftwareIds(s: DirectoryStudio, which: "current" | "any" = "current"): string[] {
  const ids = s.software.current.map((x) => x.platform_id);
  return which === "current" ? ids : [...ids, ...s.software.previous.map((x) => x.platform_id)];
}

export function filterStudios(rows: DirectoryStudio[], f: DirectoryFilters): DirectoryStudio[] {
  const q = norm(f.q).trim();
  const show = f.show ?? "active";
  return rows.filter((s) => {
    // Archived studios stay listed but are hidden from search unless asked for.
    if (show === "active" && !s.is_active) return false;
    if (show === "archived" && s.is_active) return false;
    if (f.country && s.address.country_code !== f.country) return false;
    if (f.region && s.address.region_code !== f.region) return false;
    if (f.city && s.address.locality !== f.city) return false;
    if (f.style && !s.styles.some((id) => id === f.style || styleFacet(id)?.id === f.style)) return false;
    if (f.software) {
      if (f.software === "unknown") {
        if (s.software.current.length) return false;
      } else if (!studioSoftwareIds(s).includes(f.software)) return false;
    }
    if (q) {
      const hay = norm([s.name, s.brand, s.address.area, s.address.locality, s.address.region_name, ...s.styles.map(styleLabel)].join(" "));
      if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  });
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

function tally(values: { value: string; label: string }[]): FacetOption[] {
  const m = new Map<string, FacetOption>();
  for (const v of values) {
    const cur = m.get(v.value);
    if (cur) cur.count++;
    else m.set(v.value, { ...v, count: 1 });
  }
  return [...m.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/**
 * Facet options with counts. Each facet is counted against the rows that
 * match every *other* active filter, so options never lead to zero results.
 */
export function facets(rows: DirectoryStudio[], f: DirectoryFilters) {
  const without = (k: keyof DirectoryFilters) => filterStudios(rows, { ...f, [k]: undefined });
  return {
    country: tally(without("country").map((s) => ({ value: s.address.country_code, label: s.address.country_name }))),
    region: tally(without("region").filter((s) => s.address.region_code).map((s) => ({ value: s.address.region_code as string, label: s.address.region_name ?? (s.address.region_code as string) }))),
    city: tally(without("city").map((s) => ({ value: s.address.locality, label: s.address.locality }))),
    style: tally(
      without("style").flatMap((s) => [...new Set(s.styles.map((id) => styleFacet(id)).filter(Boolean).map((x) => x!.id))].map((id) => ({ value: id, label: styleLabel(id) }))),
    ),
    software: [
      ...tally(without("software").flatMap((s) => [...new Set(studioSoftwareIds(s))].map((id) => ({ value: id, label: platformName(id) })))),
      ...(() => {
        const n = without("software").filter((s) => !s.software.current.length).length;
        return n ? [{ value: "unknown", label: "Not detected yet", count: n }] : [];
      })(),
    ],
  };
}

export const STATUS_LABEL: Record<DirectoryStatus, string> = {
  open: "Open",
  temporarily_closed: "Temporarily closed",
  permanently_closed: "Closed",
  historic: "Historic",
  unknown: "Unknown",
};

export function placeLine(s: DirectoryStudio): string {
  const a = s.address;
  const region = a.country_code === "US" ? a.region_code : a.region_name;
  return [a.area, a.locality, region, a.country_code === "US" ? null : a.country_name].filter(Boolean).join(", ");
}

export function formatRefreshed(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(iso));
}

/** mailto for update/removal requests, subject prefilled with the studio. */
export function updateMailto(email: string, s?: Pick<DirectoryStudio, "name" | "slug">, kind: "update" | "remove" | "add" = "update"): string {
  const subject =
    kind === "add" ? "Studio directory: add a studio" : `Studio directory: ${kind === "remove" ? "remove" : "update"} ${s?.name ?? ""}`.trim();
  const body = s ? `Listing: https://tandavastudio.com/studios/${s.slug}\n\nWhat should change:\n` : "Studio name, city and website:\n";
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
