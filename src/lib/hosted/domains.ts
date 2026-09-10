/** Pure routing rules. Authorization must still check studio membership on the server. */
const reservedSlugs = new Set([
  'www', 'app', 'admin', 'api', 'demo', 'support', 'help', 'mail', 'status',
  'billing', 'auth', 'login', 'signup', 'static', 'assets', 'cdn', 'docs',
]);

export function validateStudioSlug(input: string): { slug: string; error: string | null } {
  const slug = input.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/.test(slug)) {
    return { slug, error: 'Use 3–63 lowercase letters, numbers or internal hyphens.' };
  }
  if (reservedSlugs.has(slug)) return { slug, error: 'This address is reserved.' };
  return { slug, error: null };
}

/** Accept a hostname, not a URL, path, port, or arbitrary forwarded-header value. */
export function normalizeHostname(input: string): string | null {
  const hostname = input.trim().toLowerCase().replace(/\.$/, '');
  if (hostname.length > 253 || !hostname.includes('.')) return null;
  const labels = hostname.split('.');
  if (!labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null;
  return hostname;
}

export interface StudioDomain {
  hostname: string;
  studioId: string;
  verified: boolean;
  active: boolean;
}

export type DomainResolution =
  | { kind: 'platform' }
  | { kind: 'studio'; studioId: string }
  | { kind: 'not_found' };

export function resolveStudioDomain(
  hostname: string,
  platformHostname: string,
  domains: readonly StudioDomain[],
): DomainResolution {
  const host = normalizeHostname(hostname);
  const platform = normalizeHostname(platformHostname);
  if (!host || !platform) return { kind: 'not_found' };
  if (host === platform) return { kind: 'platform' };
  // Exact matches only; duplicate mappings fail closed even if only one is active.
  const matches = domains.filter(domain => normalizeHostname(domain.hostname) === host);
  if (matches.length !== 1) return { kind: 'not_found' };
  const domain = matches[0];
  if (!domain.verified || !domain.active || !domain.studioId.trim()) return { kind: 'not_found' };
  return { kind: 'studio', studioId: domain.studioId };
}
