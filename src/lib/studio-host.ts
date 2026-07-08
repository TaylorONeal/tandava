/**
 * Per-studio subdomain resolution.
 *
 * Maps a request host to a studio slug for Tier-1 host-based tenancy, e.g.
 * `oxatl.tandavastudio.com` → "oxatl". The resolved slug mounts the public
 * StudioStorefront for that studio (see pages/Home.tsx and
 * docs/architecture/MULTI_TENANCY.md).
 *
 * OFF BY DEFAULT: returns null unless VITE_ROOT_DOMAIN is configured, so the
 * shared apex deployment and self-hosters are unaffected until an operator
 * opts in (and points a wildcard domain at the app).
 */

// Subdomain labels reserved for the platform — never a studio.
const RESERVED_SUBDOMAINS = new Set([
  "www", "app", "api", "admin", "docs", "staging",
  "preview", "demo", "static", "assets", "cdn", "mail",
]);

// A studio slug is a single DNS label: lowercase alphanumerics and hyphens,
// not starting/ending with a hyphen.
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/**
 * Extract a studio slug from `hostname` given the platform `rootDomain`.
 * Pure and side-effect free so it can be unit-tested exhaustively.
 *
 * Returns null for: no config, the apex/www, a different domain (Vercel
 * previews, localhost, custom domains), reserved labels, multi-level
 * subdomains, or anything that isn't a valid slug.
 */
export function getStudioSlugFromHost(
  hostname: string | undefined | null,
  rootDomain: string | undefined | null,
): string | null {
  if (!hostname || !rootDomain) return null;

  const host = hostname.trim().toLowerCase().replace(/\.+$/, "");
  const root = rootDomain.trim().toLowerCase().replace(/^\.+|\.+$/g, "");
  if (!host || !root) return null;

  if (host === root) return null;               // apex
  if (!host.endsWith(`.${root}`)) return null;  // preview / localhost / custom domain

  const sub = host.slice(0, host.length - root.length - 1);
  if (!sub || sub.includes(".")) return null;   // only single-label subdomains
  if (RESERVED_SUBDOMAINS.has(sub)) return null;
  if (!SLUG_RE.test(sub)) return null;

  return sub;
}

/**
 * Resolve the current studio slug from the live browser location and the
 * configured VITE_ROOT_DOMAIN. Returns null on the server or when unconfigured.
 */
export function resolveStudioSlug(): string | null {
  if (typeof window === "undefined") return null;
  const rootDomain = import.meta.env.VITE_ROOT_DOMAIN as string | undefined;
  return getStudioSlugFromHost(window.location.hostname, rootDomain);
}
