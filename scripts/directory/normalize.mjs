/**
 * Pure helpers that turn one OpenStreetMap element into a studio record
 * (app-launch-playbook/taxonomy/studio-record.schema.json). No I/O here so
 * every rule is unit-testable.
 */

export const US_STATES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky",
  LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island",
  SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", PR: "Puerto Rico",
};
const STATE_BY_NAME = Object.fromEntries(Object.entries(US_STATES).map(([k, v]) => [v.toLowerCase(), k]));

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
export const countryName = (code) => {
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
};

export function regionCode(raw, countryCode, fallback) {
  if (!raw) return fallback ?? null;
  const t = String(raw).trim();
  if (countryCode === "US") {
    if (US_STATES[t.toUpperCase()]) return t.toUpperCase();
    return STATE_BY_NAME[t.toLowerCase()] ?? fallback ?? null;
  }
  return t;
}

export function regionName(code, countryCode) {
  if (!code) return null;
  return countryCode === "US" ? US_STATES[code] ?? code : code;
}

export function slugify(s) {
  return String(s)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const SOCIAL_HOSTS = {
  "instagram.com": "instagram",
  "facebook.com": "facebook",
  "fb.com": "facebook",
  "youtube.com": "youtube",
  "youtu.be": "youtube",
  "tiktok.com": "tiktok",
};

export function normalizeUrl(raw) {
  if (!raw) return null;
  let t = String(raw).trim().split(/[;\s]+/)[0];
  if (!t) return null;
  if (!/^https?:\/\//i.test(t)) t = `https://${t}`;
  try {
    const u = new URL(t);
    if (!u.hostname.includes(".")) return null;
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Registrable-ish domain: last two labels, or three for co.uk style. */
export function baseDomain(host) {
  if (!host) return null;
  const parts = host.split(".");
  const two = parts.slice(-2).join(".");
  if (/^(co|com|org|net|ac)\.[a-z]{2}$/.test(two) && parts.length >= 3) return parts.slice(-3).join(".");
  return two;
}

export function socialKind(url) {
  const h = hostOf(url);
  if (!h) return null;
  for (const [host, kind] of Object.entries(SOCIAL_HOSTS)) if (h === host || h.endsWith(`.${host}`)) return kind;
  return null;
}

/** Instagram handle from a URL, "@handle" or bare handle. */
export function instagramHandle(raw) {
  if (!raw) return null;
  const t = String(raw).trim();
  const m = t.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  const h = (m ? m[1] : t.replace(/^@/, "")).replace(/\/$/, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(h) || ["p", "reel", "explore", "accounts"].includes(h.toLowerCase())) return null;
  return h.toLowerCase();
}

/** E.164 for North American numbers; otherwise the trimmed original. */
export function normalizePhone(raw, countryCode) {
  if (!raw) return null;
  const first = String(raw).split(";")[0].trim();
  const digits = first.replace(/[^\d+]/g, "");
  if (countryCode === "US" || countryCode === "CA") {
    const d = digits.replace(/^\+/, "");
    if (d.length === 10) return `+1${d}`;
    if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  }
  return digits.startsWith("+") ? digits : first;
}

/** Word-boundary alias match of style ids against free text. */
export function inferStyles(text, styles) {
  const t = ` ${String(text).toLowerCase().replace(/[^a-z0-9+&/]+/g, " ")} `;
  const hits = new Set();
  for (const s of styles) {
    if (s.kind === "fallback" || s.kind === "level") continue;
    for (const a of s.aliases ?? []) {
      const needle = ` ${a.replace(/[^a-z0-9+&/]+/g, " ").trim()} `;
      if (needle.trim().length >= 3 && t.includes(needle)) {
        hits.add(s.id);
        break;
      }
    }
  }
  // Drop a parent when a child already says more.
  for (const s of styles) if (s.parent && hits.has(s.id)) hits.delete(s.parent);
  return [...hits].sort();
}

/** Is this element plausibly a studio (not a clothing shop or a park lawn)? */
export function isStudioCandidate(tags) {
  const name = tags.name ?? tags["was:name"] ?? tags["disused:name"] ?? tags["old_name"];
  if (!name) return false;
  if (tags.shop && !/yoga/i.test(tags.shop)) return false;
  if (["park", "garden", "pitch", "playground", "nature_reserve"].includes(tags.leisure) && !/yoga|pilates/i.test(tags.sport ?? "")) return false;
  if (tags.highway || tags.building === "house") return false;
  // Needs a yoga or studio signal of its own: a gym with no yoga tag is not a studio.
  const signal = [name, tags.sport, tags["disused:sport"], tags["was:sport"], tags.shop, tags.description].filter(Boolean).join(" ");
  if (!/yoga|pilates|barre|vinyasa|ashtanga|bikram|kundalini|iyengar|mysore/i.test(signal) && !Object.keys(tags).some((k) => /^yoga:/.test(k))) return false;
  return true;
}

export function statusOf(tags) {
  const disused = Object.keys(tags).some((k) => /^(disused|abandoned|was|demolished|razed):/.test(k));
  if (disused && !tags.name) return "permanently_closed";
  if (disused && tags["disused:sport"]) return "permanently_closed";
  if (/^(closed|off)$/i.test(tags.opening_hours ?? "")) return "permanently_closed";
  return "open";
}

export function businessType(tags, styles) {
  const name = (tags.name ?? "").toLowerCase();
  const sport = (tags.sport ?? "").toLowerCase();
  const yoga = /yoga|ashtanga|vinyasa|bikram|kundalini|iyengar/.test(name) || sport.includes("yoga");
  const pilates = /pilates/.test(name) || sport.includes("pilates");
  if (!yoga && pilates) return "pilates_studio";
  if (styles.some((s) => ["hot", "heated-flow", "hot-power", "bikram", "hot-26-2", "infrared-hot", "hot-hatha"].includes(s)) && yoga) return "hot_yoga_studio";
  if (yoga && pilates) return "multi_discipline_studio";
  if (!yoga && tags.leisure === "fitness_centre") return "gym_with_yoga";
  if (tags.amenity === "community_centre" || tags.amenity === "social_centre") return "community_space";
  if (tags.healthcare) return "wellness_center";
  return yoga ? "yoga_studio" : "other";
}

const TYPE_WORDS = {
  yoga_studio: "yoga studio",
  hot_yoga_studio: "hot yoga studio",
  pilates_studio: "pilates studio",
  multi_discipline_studio: "yoga and pilates studio",
  gym_with_yoga: "fitness studio with yoga",
  wellness_center: "wellness center",
  retreat_center: "retreat center",
  community_space: "community space with yoga",
  other: "studio",
};

/** Our own one-line description from facts we hold. Never copied text. */
export function describe({ name, business_type, address }) {
  const where = [address.area, address.locality].filter(Boolean).join(", ");
  const region = address.region_code && address.country_code === "US" ? `, ${address.region_code}` : `, ${address.country_name}`;
  const words = TYPE_WORDS[business_type] ?? "studio";
  const article = /^[aeiou]/i.test(words) ? "an" : "a";
  return `${name} is ${article} ${words} in ${where}${region}.`;
}
