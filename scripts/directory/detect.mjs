/**
 * Studio software detection from public URLs.
 *
 * Input: URLs we already hold for a studio (map listing tags today; the
 * studio's own booking links once the site check is switched on).
 * Output: candidate observations with the matched evidence. Detection is
 * evidence, not a verdict (docs/directory/BOOKING-PLATFORMS.md section 2).
 *
 * Signatures come from src/data/taxonomy/studio-software.json, the vendored
 * copy of app-launch-playbook/taxonomy/studio-software.json.
 */

const ROLE_BY_CATEGORY = {
  studio_management: "system_of_record",
  gym_management: "system_of_record",
  salon_spa: "system_of_record",
  health_practice: "system_of_record",
  scheduling_generic: "scheduling",
  website_builder_booking: "website",
  course_ondemand: "on_demand",
  marketplace: "marketplace",
  payments_events: "payments",
};

/** Parse "host" or "host/path" signature strings once. */
export function compileSignatures(software) {
  const sigs = [];
  for (const p of software.platforms) {
    for (const raw of p.detect?.domains ?? []) {
      const s = raw.toLowerCase().replace(/^https?:\/\//, "").replace(/^\*\./, "").replace(/^www\./, "");
      const slash = s.indexOf("/");
      sigs.push({
        platform: p,
        host: slash === -1 ? s : s.slice(0, slash),
        path: slash === -1 ? null : s.slice(slash),
        raw,
      });
    }
  }
  // Longest host first so cart.mindbodyonline.com beats a shorter overlapping rule.
  return sigs.sort((a, b) => b.host.length + (b.path?.length ?? 0) - (a.host.length + (a.path?.length ?? 0)));
}

function hostMatches(hostname, host) {
  return hostname === host || hostname.endsWith(`.${host}`);
}

/** Match one URL. Returns { platform, evidence, signature } or null. */
export function matchUrl(url, sigs) {
  let u;
  try {
    u = new URL(url.startsWith("http") ? url : `https://${url}`);
  } catch {
    return null;
  }
  const hostname = u.hostname.toLowerCase().replace(/^www\./, "");
  const path = u.pathname.toLowerCase();
  for (const sig of sigs) {
    if (!hostMatches(hostname, sig.host)) continue;
    if (sig.path && !path.startsWith(sig.path)) continue;
    return { platform: sig.platform, evidence: u.origin + u.pathname, signature: sig.raw };
  }
  return null;
}

/**
 * Detect software from a list of { url, via } items.
 * via is the detection method recorded on the observation.
 */
export function detectSoftware(items, sigs, { observedOn, sourceIndex = null } = {}) {
  const found = new Map();
  for (const { url, via } of items) {
    if (!url) continue;
    const m = matchUrl(url, sigs);
    if (!m) continue;
    if (found.has(m.platform.id)) continue;
    const role = ROLE_BY_CATEGORY[m.platform.category] ?? "system_of_record";
    found.set(m.platform.id, {
      platform_id: m.platform.id,
      role,
      detected_via: via,
      evidence: m.evidence,
      observed_from: observedOn ?? null,
      observed_to: null,
      // A vendor domain in a booking link is close to proof; a website built
      // on a site builder only says where the site is hosted.
      confidence: role === "website" ? 0.5 : 0.95,
      verified: false,
      source: sourceIndex,
    });
  }
  return [...found.values()];
}

/**
 * Pull candidate links out of fetched HTML (href, src, action). Used only
 * when the site check is switched on; see site-check.mjs.
 */
export function linksFromHtml(html, baseUrl) {
  const out = new Set();
  const re = /\b(?:href|src|action|data-src)\s*=\s*["']([^"'#]+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      out.add(new URL(m[1], baseUrl).toString());
    } catch {
      /* not a URL */
    }
  }
  return [...out];
}
