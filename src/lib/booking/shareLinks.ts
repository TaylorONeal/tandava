/**
 * Share links (PRD-026).
 *
 * Pure, framework-free construction of the public links a studio hands out:
 * their branded storefront, and a direct link to one class that books in a
 * single tap (`/s/:slug/book/:occurrenceId`, PRD-020).
 *
 * The capability already existed and nothing in the product told an owner those
 * URLs were there. That is what this module and the `/manage/share` page fix.
 *
 * Why links are built here rather than inline in the page: the per-channel UTM
 * tagging is the only thing that makes "which post actually filled that class"
 * answerable, and getting it subtly wrong (inconsistent casing, a dropped
 * campaign, a double `?`) silently destroys attribution without any visible
 * symptom. That deserves tests.
 *
 * No I/O. Takes an origin and a slug, returns strings.
 */

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

/**
 * Where a studio is putting the link.
 *
 * These are the places studios actually paste a booking link, not a generic
 * taxonomy. `direct` means "no tagging", for a link going somewhere we would
 * rather not guess at, or when an owner just wants the clean URL.
 */
export type ShareChannel =
  | "direct"
  | "instagram_bio"
  | "instagram_story"
  | "linktree"
  | "teachertree"
  | "facebook"
  | "google_profile"
  | "email_signature"
  | "newsletter"
  | "sms"
  | "qr_print";

export interface ChannelPreset {
  /** What the owner sees in the picker. */
  label: string;
  /** One line on where this belongs, written for a studio owner. */
  hint: string;
  utmSource: string;
  utmMedium: string;
}

/**
 * UTM values per channel.
 *
 * Deliberately lowercase and underscore-free where possible: analytics tools
 * treat `Instagram` and `instagram` as different sources, and a studio that
 * ends up with both in their reports stops trusting the numbers. Normalizing
 * here means they can never diverge.
 */
export const CHANNEL_PRESETS: Record<ShareChannel, ChannelPreset> = {
  direct: {
    label: "Plain link (no tracking)",
    hint: "The clean URL. Use it when you don't need to know where the booking came from.",
    utmSource: "",
    utmMedium: "",
  },
  instagram_bio: {
    label: "Instagram bio",
    hint: "The one link in your profile. Tracks as Instagram so you can see what your posts are worth.",
    utmSource: "instagram",
    utmMedium: "bio",
  },
  instagram_story: {
    label: "Instagram story link",
    hint: "A story sticker pointing at one class. Best paired with a specific class link, not the schedule.",
    utmSource: "instagram",
    utmMedium: "story",
  },
  linktree: {
    label: "Linktree",
    hint: "One of several buttons on your Linktree page.",
    utmSource: "linktree",
    utmMedium: "link_in_bio",
  },
  teachertree: {
    label: "TeacherTree",
    hint: "Your teacher or studio profile page.",
    utmSource: "teachertree",
    utmMedium: "link_in_bio",
  },
  facebook: {
    label: "Facebook",
    hint: "Your page's button or a post.",
    utmSource: "facebook",
    utmMedium: "social",
  },
  google_profile: {
    label: "Google Business Profile",
    hint: "The booking or website link on your Google listing. Often a studio's busiest link.",
    utmSource: "google",
    utmMedium: "business_profile",
  },
  email_signature: {
    label: "Email signature",
    hint: "Under your name, so every reply is a soft invitation.",
    utmSource: "email",
    utmMedium: "signature",
  },
  newsletter: {
    label: "Newsletter",
    hint: "A button or link in an email you send out.",
    utmSource: "email",
    utmMedium: "newsletter",
  },
  sms: {
    label: "Text message",
    hint: "Replying to someone who asked about a class.",
    utmSource: "sms",
    utmMedium: "direct_message",
  },
  qr_print: {
    label: "Printed QR code",
    hint: "A card at the front desk, a flyer, a studio window.",
    utmSource: "qr",
    utmMedium: "print",
  },
};

/** The channels the share page offers, in the order an owner is likely to want them. */
export const SHARE_CHANNEL_ORDER: ShareChannel[] = [
  "instagram_bio",
  "linktree",
  "teachertree",
  "google_profile",
  "qr_print",
  "email_signature",
  "newsletter",
  "facebook",
  "instagram_story",
  "sms",
  "direct",
];

// ---------------------------------------------------------------------------
// Slugs
// ---------------------------------------------------------------------------

/**
 * Studio slugs are lowercase alphanumeric with internal hyphens.
 *
 * Mirrors the rules in `src/lib/hosted/domains.ts`, because a slug has to work
 * both as a path segment here and as a subdomain there. Kept as a shape check
 * only: whether the slug *exists* is a database question.
 */
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidSlug(slug: string | null | undefined): boolean {
  if (typeof slug !== "string") return false;
  const s = slug.trim();
  if (s.length < 2 || s.length > 63) return false;
  return SLUG_RE.test(s);
}

// ---------------------------------------------------------------------------
// URL construction
// ---------------------------------------------------------------------------

export interface ShareLinkOptions {
  /** Where the app is served from, with no trailing slash (e.g. https://studio.com). */
  origin: string;
  slug: string;
  channel?: ShareChannel;
  /**
   * Campaign name, for telling two pushes of the same channel apart
   * ("spring-challenge"). Normalized the same way as the presets.
   */
  campaign?: string;
}

/** Trim a trailing slash so joins never produce `//`. */
export function normalizeOrigin(origin: string | null | undefined): string {
  const s = (origin ?? "").trim();
  return s.replace(/\/+$/, "");
}

/** Lowercase, collapse whitespace and separators to single hyphens. */
export function normalizeCampaign(campaign: string | null | undefined): string {
  return (campaign ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Append UTM parameters for a channel.
 *
 * `direct` and unknown channels return the path untouched, so a clean link
 * stays clean. Parameters are only added when they have a value, which keeps
 * `?utm_source=&utm_medium=` out of a link an owner is about to paste in
 * their Instagram bio.
 */
function withTracking(path: string, channel: ShareChannel | undefined, campaign: string | undefined): string {
  const preset = channel ? CHANNEL_PRESETS[channel] : undefined;
  if (!preset || !preset.utmSource) return path;

  const params = new URLSearchParams();
  params.set("utm_source", preset.utmSource);
  if (preset.utmMedium) params.set("utm_medium", preset.utmMedium);
  const normalizedCampaign = normalizeCampaign(campaign);
  if (normalizedCampaign) params.set("utm_campaign", normalizedCampaign);

  return `${path}?${params.toString()}`;
}

/**
 * The studio's branded public page: schedule, offerings, pricing.
 *
 * This is the link for an Instagram bio or a Linktree button, where the visitor
 * has not picked a class yet.
 */
export function buildStorefrontUrl(options: ShareLinkOptions): string {
  const origin = normalizeOrigin(options.origin);
  const path = `${origin}/s/${encodeURIComponent(options.slug)}`;
  return withTracking(path, options.channel, options.campaign);
}

/**
 * A direct link to book ONE class in a single tap (PRD-020).
 *
 * This is the link for a story sticker or a text reply to "when's your next
 * class?", because it skips the schedule entirely.
 */
export function buildClassBookingUrl(options: ShareLinkOptions & { occurrenceId: string }): string {
  const origin = normalizeOrigin(options.origin);
  const path = `${origin}/s/${encodeURIComponent(options.slug)}/book/${encodeURIComponent(options.occurrenceId)}`;
  return withTracking(path, options.channel, options.campaign);
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

/**
 * A shortened form for showing a link in the UI.
 *
 * Drops the scheme and any `www.`, and truncates the middle rather than the end
 * so the slug stays visible: an owner checking they copied the right link looks
 * at the studio name in it, not at the UTM tail.
 */
export function displayUrl(url: string, maxLength = 48): string {
  const bare = (url ?? "").replace(/^https?:\/\//, "").replace(/^www\./, "");
  if (bare.length <= maxLength) return bare;
  // Keep more of the head than the tail; the head carries the slug.
  const head = Math.ceil((maxLength - 1) * 0.65);
  const tail = maxLength - 1 - head;
  return `${bare.slice(0, head)}…${bare.slice(bare.length - tail)}`;
}

/**
 * A filename for a downloaded QR code.
 *
 * Studios send these to a printer, so the name has to say what it is without
 * the covering email: `oxatl-yoga-booking-qr.png`, not `download.png`.
 */
export function qrFileName(slug: string, kind: "schedule" | "class" = "schedule"): string {
  const safe = normalizeCampaign(slug) || "studio";
  return kind === "class" ? `${safe}-class-booking-qr.png` : `${safe}-booking-qr.png`;
}
