/**
 * Normalise whatever a studio tagged its link with into one channel, so every
 * studio's attribution report groups the same way (PRD-024 "Studios' own
 * UTMs"). The raw utm_* values are always kept alongside; this only decides
 * the grouping. Stored as analytics_sessions.channel (migration 00024).
 */

export type Channel =
  | "paid_social"
  | "organic_social"
  | "paid_search"
  | "organic_search"
  | "email"
  | "sms"
  | "qr"
  | "embed"
  | "network"
  | "referral"
  | "direct";

export interface ChannelInput {
  utmSource?: string | null;
  utmMedium?: string | null;
  referrer?: string | null;
  /** The studio's own website host, if known, for embed detection. */
  studioSiteHost?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  ttclid?: string | null;
  msclkid?: string | null;
}

const SOCIAL = /(^|\.)(instagram|ig|facebook|fb|meta|tiktok|threads|pinterest|linkedin|youtube|x|twitter|linktree|linkinbio|lnk\.bio|teachertree)(\.|$)/;
const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|brave|baidu|yandex)(\.|$)/;
const PAID_MEDIUM = /^(cpc|ppc|paid|paid_social|paidsocial|paid-social|ads?|display|cpm|sponsored)$/;

function host(url?: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function classifyChannel(i: ChannelInput): Channel {
  const source = (i.utmSource ?? "").trim().toLowerCase();
  const medium = (i.utmMedium ?? "").trim().toLowerCase();
  const ref = host(i.referrer);

  // Explicit mediums first: the studio told us.
  if (medium === "network" || source === "tandava_network") return "network";
  if (medium === "embed") return "embed";
  if (medium === "qr" || medium === "print" || source === "qr" || source === "print") return "qr";
  if (/^(email|e-mail|newsletter)$/.test(medium) || source === "newsletter") return "email";
  if (medium === "sms" || medium === "text") return "sms";

  // Paid: an ad click id, or a paid medium.
  const socialSource = SOCIAL.test(source) || SOCIAL.test(ref);
  if (i.gclid || i.gbraid || i.wbraid || i.msclkid) return "paid_search";
  if (i.fbclid && PAID_MEDIUM.test(medium)) return "paid_social";
  if (i.ttclid) return "paid_social";
  if (PAID_MEDIUM.test(medium)) return socialSource ? "paid_social" : SEARCH.test(source) ? "paid_search" : "paid_social";

  // Organic.
  if (socialSource || /social|bio|story|link_in_bio/.test(medium) || i.fbclid) return "organic_social";
  if (SEARCH.test(source) || SEARCH.test(ref) || medium === "organic") return "organic_search";

  // The studio's own website without a medium: it came through their site.
  if (i.studioSiteHost && ref && (ref === i.studioSiteHost || ref.endsWith(`.${i.studioSiteHost}`))) return "embed";
  if (source || ref) return "referral";
  return "direct";
}
