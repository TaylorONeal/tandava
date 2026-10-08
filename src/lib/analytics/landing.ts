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
export function withEmbedHandoff(path: string, visitorId: string, parentHost?: string | null): string {
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("tv", visitorId);
  if (!params.has("utm_medium")) params.set("utm_medium", "embed");
  if (!params.has("utm_source") && parentHost) params.set("utm_source", parentHost);
  return `${base}?${params.toString()}`;
}
