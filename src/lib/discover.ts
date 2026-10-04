/**
 * Discover: pure helpers for the student-facing class search.
 *
 * Everything here is side-effect free so it can be unit-tested. The data comes
 * from the public `discover_classes()` RPC (migration 00019); filtering that is
 * cheap (style, day) is repeated client-side so the UI reacts instantly to
 * chips without a round trip.
 */

import type { DiscoverClassRow } from "@/types/database";

/** Minimum distinct studios with upcoming classes before the home page flips to Discover. */
export const DISCOVER_HOME_MIN_STUDIOS = 5;

export interface DiscoverFilters {
  /** Case-insensitive style, e.g. "vinyasa". Empty/undefined = any. */
  style?: string;
  /** Local calendar day as YYYY-MM-DD in the studio's timezone. Empty/undefined = any. */
  day?: string;
  /** Free-text over class, studio, teacher and location names. */
  query?: string;
}

/** YYYY-MM-DD for an ISO instant, in the given IANA timezone. */
export function localDay(iso: string, timeZone: string): string {
  const d = new Date(iso);
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function filterClasses(rows: DiscoverClassRow[], f: DiscoverFilters): DiscoverClassRow[] {
  const style = f.style?.trim().toLowerCase();
  const q = f.query?.trim().toLowerCase();
  return rows.filter((r) => {
    if (style && (r.style ?? "").toLowerCase() !== style) return false;
    if (f.day && localDay(r.starts_at, r.studio_timezone) !== f.day) return false;
    if (q) {
      const hay = [r.offering_name, r.studio_name, r.teacher_name, r.location_name, r.city]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Distinct, sorted styles present in the rows (for filter chips). */
export function availableStyles(rows: DiscoverClassRow[]): string[] {
  const set = new Set<string>();
  for (const r of rows) if (r.style) set.add(r.style.trim());
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function distinctStudioCount(rows: DiscoverClassRow[]): number {
  return new Set(rows.map((r) => r.studio_slug)).size;
}

/** True when there is enough live supply to make Discover the front door. */
export function hasEnoughSupply(rows: DiscoverClassRow[], min = DISCOVER_HOME_MIN_STUDIOS): boolean {
  return distinctStudioCount(rows) >= min;
}

export interface DayGroup {
  day: string;
  classes: DiscoverClassRow[];
}

/** Group classes by the studio-local day, preserving chronological order. */
export function groupByDay(rows: DiscoverClassRow[]): DayGroup[] {
  const groups = new Map<string, DiscoverClassRow[]>();
  for (const r of [...rows].sort((a, b) => a.starts_at.localeCompare(b.starts_at))) {
    const day = localDay(r.starts_at, r.studio_timezone);
    const list = groups.get(day);
    if (list) list.push(r);
    else groups.set(day, [r]);
  }
  return [...groups.entries()].map(([day, classes]) => ({ day, classes }));
}

export function spotsLabel(spotsLeft: number): string {
  if (spotsLeft <= 0) return "Full";
  if (spotsLeft <= 3) return `${spotsLeft} left`;
  return "Open";
}

/** Where tapping a class goes: the studio's storefront, anchored to the class. */
export function classHref(r: Pick<DiscoverClassRow, "studio_slug" | "occurrence_id">): string {
  return `/s/${encodeURIComponent(r.studio_slug)}?class=${encodeURIComponent(r.occurrence_id)}`;
}
