/**
 * Pure parsing for first-party session capture (PRD-024): what a landing URL
 * and referrer say about where a visit came from. No storage, no network.
 */

export interface LandingFacts {
  utm: { source?: string; medium?: string; campaign?: string; content?: string; term?: string };
  clickIds: { fbclid?: string; gclid?: string; gbraid?: string; wbraid?: string; ttclid?: string; msclkid?: string };
  /** Visitor id handed over from the embed widget's Book link (`tv`). */
  handoffVisitorId?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clip = (v: string | null, n = 200) => (v ? v.trim().slice(0, n) || undefined : undefined);

export function parseLanding(url: string): LandingFacts {
  let params: URLSearchParams;
  try {
    params = new URL(url, "https://placeholder.invalid").searchParams;
  } catch {
    params = new URLSearchParams();
  }
  const facts: LandingFacts = {
    utm: {
      source: clip(params.get("utm_source")),
      medium: clip(params.get("utm_medium")),
      campaign: clip(params.get("utm_campaign")),
      content: clip(params.get("utm_content")),
      term: clip(params.get("utm_term")),
    },
    clickIds: {
      fbclid: clip(params.get("fbclid"), 500),
      gclid: clip(params.get("gclid"), 500),
      gbraid: clip(params.get("gbraid"), 500),
      wbraid: clip(params.get("wbraid"), 500),
      ttclid: clip(params.get("ttclid"), 500),
      msclkid: clip(params.get("msclkid"), 500),
    },
  };
  const tv = params.get("tv");
  if (tv && UUID.test(tv)) facts.handoffVisitorId = tv.toLowerCase();
  return facts;
}

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID.test(v);
}

export function deviceType(userAgent: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

/**
 * A Book link from the embed widget: carry the visitor id and, when the studio
 * didn't tag the link itself, mark it as coming from the embed on their site.
 */
const CLICK_ID_KEYS = ["fbclid", "gclid", "gbraid", "wbraid", "ttclid", "msclkid"];

export function withEmbedHandoff(
  path: string,
  visitorId: string,
  parentHost?: string | null,
  /** The embed iframe's own query string: studio-supplied campaign tags and click ids carry through. */
  carry?: string | null,
): string {
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  const from = new URLSearchParams(carry ?? "");
  let carried = false;
  for (const [k, v] of from) {
    if ((k.startsWith("utm_") || CLICK_ID_KEYS.includes(k)) && v && !params.has(k)) {
      params.set(k, v);
      carried = true;
    }
  }
  params.set("tv", visitorId);
  // Untagged embeds are credited to the studio's own site; a tagged one keeps
  // its campaign so the booking page continues the same session.
  const tagged = carried || [...params.keys()].some((k) => k.startsWith("utm_") || CLICK_ID_KEYS.includes(k));
  if (!tagged) {
    params.set("utm_medium", "embed");
    if (parentHost) params.set("utm_source", parentHost);
  }
  return `${base}?${params.toString()}`;
}

const KEEP_PARAMS = /^(utm_(source|medium|campaign|content|term)|fbclid|gclid|gbraid|wbraid|ttclid|msclkid)$/;

/**
 * A URL safe to store for analytics: scheme, host and path, plus only campaign
 * tags and ad click ids. Everything else (continuation tokens, auth codes,
 * emails, the embed handoff id) is dropped, as is any fragment. Null for
 * anything that isn't an http(s) URL.
 */
export function sanitizeUrl(url: string | null | undefined, max = 1000): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const kept = new URLSearchParams();
    for (const [k, v] of u.searchParams) if (KEEP_PARAMS.test(k)) kept.append(k, v);
    const q = kept.toString();
    return `${u.origin}${u.pathname}${q ? `?${q}` : ""}`.slice(0, max);
  } catch {
    return null;
  }
}
