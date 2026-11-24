/**
 * Site checker: finds which studio software a studio uses from its own homepage.
 *
 * For each studio website in data/directory/studios.json it:
 *   1. reads robots.txt and skips the site if our user agent (or *) may not fetch "/",
 *   2. fetches the homepage once (no sign-in, no forms, no query strings added),
 *   3. looks for links, iframes and scripts that point at a known vendor
 *      (src/data/taxonomy/studio-software.json signatures).
 *
 * Results go to data/directory/site-checks.json, keyed by website domain. The
 * build (build-studios.mjs) merges them into each record's software history.
 *
 * Polite by design: one homepage per studio, a few sites at a time, a pause
 * between requests, a 10 second timeout, results cached for 25 days.
 * Runs in GitHub Actions (directory-refresh.yml), never on a person's machine.
 *
 * Usage: node scripts/directory/site-check.mjs [--force] [--limit N] [--market id]
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileSignatures, detectSoftware } from "./detect.mjs";

export const USER_AGENT = "TandavaStudioDirectory/1.0 (+https://tandavastudio.com/studios/about)";
const ROBOTS_TOKEN = "tandavastudiodirectory";
const TIMEOUT_MS = 10_000;
const MAX_BYTES = 1_500_000;
const CONCURRENCY = 4;
const PAUSE_MS = 1_000;
const FRESH_DAYS = 25;

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const p = (...a) => join(root, ...a);

/**
 * Minimal robots.txt reader: is `path` allowed for our agent?
 * Uses the most specific group (our token beats *), longest matching rule wins,
 * Allow wins a tie. Good enough for "/" and simple prefixes.
 */
export function robotsAllows(robotsTxt, path = "/") {
  if (!robotsTxt) return true;
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  for (const raw of robotsTxt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === "user-agent") {
      if (!lastWasAgent || !current) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (!current) continue;
      if (key === "allow" || key === "disallow") current.rules.push({ allow: key === "allow", path: value });
    }
  }
  const mine = groups.filter((g) => g.agents.some((a) => a !== "*" && ROBOTS_TOKEN.includes(a)));
  const chosen = mine.length ? mine : groups.filter((g) => g.agents.includes("*"));
  let best = null;
  for (const g of chosen) {
    for (const r of g.rules) {
      if (r.path === "") continue; // "Disallow:" with no path allows everything
      // Google-style patterns: * is any run of characters, a trailing $ anchors the end.
      const anchored = r.path.endsWith("$");
      const body = anchored ? r.path.slice(0, -1) : r.path;
      const re = new RegExp("^" + body.split("*").map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + (anchored ? "$" : ""));
      if (!re.test(path)) continue;
      const len = r.path.length;
      if (!best || len > best.len || (len === best.len && r.allow)) best = { len, allow: r.allow };
    }
  }
  return best ? best.allow : true;
}

/** Links with how they were found: iframe, script or a plain link. */
export function vendorCandidates(html, baseUrl) {
  const out = [];
  const seen = new Set();
  const push = (raw, via) => {
    let u;
    try {
      u = new URL(raw.trim(), baseUrl);
    } catch {
      return;
    }
    if (!/^https?:$/.test(u.protocol)) return;
    const key = `${u.origin}${u.pathname}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ url: key, via });
  };
  const tagRe = /<(iframe|script|a|link|form|img)\b[^>]*>/gi;
  let m;
  while ((m = tagRe.exec(html))) {
    const tag = m[1].toLowerCase();
    const attrRe = /\b(href|src|action|data-src|data-url|data-widget-url)\s*=\s*["']([^"'#]+)["']/gi;
    let a;
    while ((a = attrRe.exec(m[0]))) {
      const via = tag === "iframe" ? "iframe" : tag === "script" ? "script_fingerprint" : "booking_link_domain";
      push(a[2], via);
    }
  }
  // Widgets often load from inline script config, so catch bare vendor URLs too.
  const bare = /https?:\/\/[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s"'<>)\\]*)?/gi;
  while ((m = bare.exec(html))) push(m[0], "script_fingerprint");
  return out;
}

async function fetchText(url, { accept = "text/html" } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": USER_AGENT, accept },
    });
    const reader = res.body?.getReader();
    let size = 0;
    const chunks = [];
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        chunks.push(value);
        if (size > MAX_BYTES) {
          ctrl.abort();
          break;
        }
      }
    }
    const text = new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));
    return { status: res.status, finalUrl: res.url || url, text };
  } finally {
    clearTimeout(timer);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Check one site. Never throws; failures are recorded. */
export async function checkSite(website, sigs, { today, fetcher = fetchText } = {}) {
  const base = new URL(website);
  const result = { checked_on: today, homepage: base.origin + "/", status: "ok", http_status: null, platforms: [] };
  try {
    const robots = await fetcher(`${base.origin}/robots.txt`, { accept: "text/plain" }).catch(() => null);
    const robotsText = robots && robots.status === 200 && !/<html/i.test(robots.text.slice(0, 300)) ? robots.text : "";
    if (!robotsAllows(robotsText, "/")) {
      result.status = "robots_disallowed";
      return result;
    }
    await sleep(PAUSE_MS);
    const page = await fetcher(base.origin + "/");
    result.http_status = page.status;
    if (page.status >= 400) {
      result.status = "http_error";
      return result;
    }
    const items = [{ url: page.finalUrl, via: "branded_subdomain" }, ...vendorCandidates(page.text, page.finalUrl)];
    result.platforms = detectSoftware(items, sigs, { observedOn: today, sourceIndex: null }).map((s) => ({
      platform_id: s.platform_id,
      role: s.role,
      detected_via: s.detected_via,
      evidence: s.evidence,
      confidence: s.confidence,
    }));
  } catch (e) {
    result.status = e?.name === "AbortError" ? "timeout" : "fetch_error";
  }
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const limit = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;
  const onlyMarket = args.includes("--market") ? args[args.indexOf("--market") + 1] : null;
  const today = new Date().toISOString().slice(0, 10);

  const software = JSON.parse(await readFile(p("src", "data", "taxonomy", "studio-software.json"), "utf8"));
  const sigs = compileSignatures(software);
  const { studios } = JSON.parse(await readFile(p("data", "directory", "studios.json"), "utf8"));
  const cachePath = p("data", "directory", "site-checks.json");
  const cache = existsSync(cachePath)
    ? JSON.parse(await readFile(cachePath, "utf8"))
    : { note: "Site checker results by website domain. Written by scripts/directory/site-check.mjs.", user_agent: USER_AGENT, sites: {} };

  const fresh = (d) => d && (Date.parse(today) - Date.parse(d)) / 86_400_000 < FRESH_DAYS;
  const queue = [];
  const seen = new Set();
  for (const r of studios) {
    if (!r.links?.website || !r.links?.website_domain) continue;
    if (!["open", "temporarily_closed"].includes(r.status)) continue;
    if (onlyMarket && r.market !== onlyMarket) continue;
    const d = r.links.website_domain;
    if (seen.has(d)) continue;
    seen.add(d);
    const c = cache.sites[d];
    // A good result stays fresh for 25 days; anything else is tried again next run.
    if (!force && c?.status === "ok" && fresh(c.last_attempt_on ?? c.checked_on)) continue;
    queue.push({ domain: d, website: r.links.website });
  }
  const work = queue.slice(0, limit);
  console.log(`Checking ${work.length} sites (${seen.size - queue.length} still fresh).`);

  let i = 0;
  const counts = {};
  async function worker() {
    while (i < work.length) {
      const job = work[i++];
      const res = await checkSite(job.website, sigs, { today });
      const prior = cache.sites[job.domain];
      // A timeout or error says nothing about the software, so keep the last good result.
      if (res.status !== "ok" && prior?.status === "ok") {
        cache.sites[job.domain] = { ...prior, last_attempt_on: today, last_attempt_status: res.status };
      } else {
        cache.sites[job.domain] = res;
      }
      counts[res.status] = (counts[res.status] ?? 0) + 1;
      if (res.platforms.length) console.log(`${job.domain}: ${res.platforms.map((x) => x.platform_id).join(", ")}`);
      await sleep(PAUSE_MS);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  cache.user_agent = USER_AGENT;
  cache.sites = Object.fromEntries(Object.entries(cache.sites).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(cachePath, JSON.stringify(cache, null, 2) + "\n");
  const withSoftware = Object.values(cache.sites).filter((s) => s.platforms.some((x) => x.role !== "website")).length;
  console.log(JSON.stringify({ checked: work.length, ...counts, sites_with_software: withSoftware }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
