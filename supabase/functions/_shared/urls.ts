/**
 * Return-URL allowlist for Stripe Checkout (shared by edge functions).
 *
 * Checkout accepted any success/cancel URL from the client, so a crafted link
 * could send a paying customer to a look-alike site right after payment. A URL
 * is accepted only when it points at the app itself (APP_URL), one of its
 * studio subdomains, or is a plain path on the app.
 *
 * Pure TypeScript with no Deno APIs so it is unit tested with vitest
 * (src/lib/safeReturnUrl.test.ts).
 */
export function safeReturnUrl(candidate: unknown, fallback: string, appUrl: string): string {
  if (typeof candidate !== "string" || candidate.length === 0 || candidate.length > 2048) return fallback;

  let app: URL;
  try {
    app = new URL(appUrl);
  } catch {
    return fallback;
  }

  // A path on the app: "/account?checkout=success"
  if (candidate.startsWith("/") && !candidate.startsWith("//") && !candidate.includes("\\")) {
    return new URL(candidate, app).href;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return fallback;
  }

  if (url.username || url.password) return fallback; // https://app@evil.com tricks
  const isLocal = app.hostname === "localhost" || app.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) return fallback;

  const sameHost = url.hostname === app.hostname && url.port === app.port;
  const subdomain = !isLocal && url.hostname.endsWith("." + app.hostname) && url.port === app.port;
  return sameHost || subdomain ? url.href : fallback;
}
