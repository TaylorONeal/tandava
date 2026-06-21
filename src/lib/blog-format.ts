/**
 * Small formatting helpers for blog dates. Kept separate from the parser so
 * presentation concerns don't leak into the isomorphic parsing module.
 */

import { format, parseISO } from "date-fns";

/** Format an ISO `YYYY-MM-DD` date as e.g. "Jun 1, 2026". */
export function formatBlogDate(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}
