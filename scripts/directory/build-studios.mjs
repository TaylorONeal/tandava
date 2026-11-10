#!/usr/bin/env node
/**
 * Build studio records from the raw map pulls.
 *
 *   node scripts/directory/build-studios.mjs [--today 2026-11-10]
 *
 * Reads   data/directory/raw/osm-*.json        (osm-pull.mjs output)
 *         data/directory/overrides.json         (hand corrections, studio requests)
 *         data/directory/suppressions.json      (removed on request: never relisted)
 *         data/directory/studios.json           (last build, for software history)
 * Writes  data/directory/studios.json           (full records, every tier)
 *         src/data/directory/studios.public.json (public tier only, what the site ships)
 *         src/data/directory/meta.json
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileSignatures, detectSoftware } from "./detect.mjs";
import {
  baseDomain, businessType, countryName, describe, hostOf, inferStyles, instagramHandle,
  isStudioCandidate, normalizePhone, normalizeUrl, regionCode, regionName, slugify, socialKind, statusOf,
} from "./normalize.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const p = (...a) => join(root, ...a);
const readJson = async (f, fallback) => (existsSync(f) ? JSON.parse(await readFile(f, "utf8")) : fallback);

/** Public confidence floor for an unverified software observation. */
export const PUBLIC_SOFTWARE_CONFIDENCE = 0.9;

export function recordFromElement(el, ctx) {
  const { market, fetchedAt, styles, styleById, sigs, observedOn } = ctx;
  const tags = el.tags ?? {};
  if (!isStudioCandidate(tags)) return null;
  const name = (tags.name ?? tags["was:name"] ?? tags["disused:name"] ?? tags.old_name).trim();
  const country = (tags["addr:country"] ?? market.country_code).toUpperCase();
  // Outside the US, map tags mix scripts and admin levels ("Hessen", Thai script,
  // a regency instead of a town), so the market's own names keep the filters clean.
  const local = country !== "US" && country === market.country_code;
  const rc = local ? market.region_code : regionCode(tags["addr:state"], country, market.region_code);
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  const osmRef = `${el.type}/${el.id}`;

  const links = { website: null, website_domain: null, instagram: null, facebook: null, youtube: null, tiktok: null, booking: null };
  const urlCandidates = [tags.website, tags["contact:website"], tags.url].map(normalizeUrl).filter(Boolean);
  for (const u of urlCandidates) {
    const kind = socialKind(u);
    if (kind === "instagram") links.instagram ??= instagramHandle(u);
    else if (kind) links[kind] ??= u;
    else links.website ??= u;
  }
  links.instagram ??= instagramHandle(tags["contact:instagram"] ?? tags.instagram);
  links.facebook ??= normalizeUrl(tags["contact:facebook"] ?? tags.facebook);
  links.youtube ??= normalizeUrl(tags["contact:youtube"]);
  links.tiktok ??= normalizeUrl(tags["contact:tiktok"]);
  links.booking = normalizeUrl(tags["reservation:website"] ?? tags.booking ?? tags["booking:url"] ?? tags["contact:booking"]);
  links.website_domain = baseDomain(hostOf(links.website));

  const yogaKeys = Object.keys(tags).filter((k) => /^yoga:/.test(k) && tags[k] === "yes").map((k) => k.slice(5).replace(/_/g, " "));
  const styleText = [name, tags.sport, tags.description, ...yogaKeys].filter(Boolean).join(" ");
  const styleIds = inferStyles(styleText, styles);
  const status = statusOf(tags);
  const address = {
    street: [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") || null,
    area: tags["addr:suburb"] ?? tags["addr:neighbourhood"] ?? tags["addr:district"] ?? tags["addr:quarter"] ?? null,
    locality: local ? market.label : tags["addr:city"] ?? market.label,
    region_code: rc,
    region_name: local ? market.region_name ?? rc : regionName(rc, country),
    postal_code: tags["addr:postcode"] ?? null,
    country_code: country,
    country_name: countryName(country),
  };
  const bt = businessType(tags, styleIds);
  const software = detectSoftware(
    [
      { url: links.booking, via: "map_listing_tag" },
      { url: links.website, via: "map_listing_tag" },
    ],
    sigs,
    { observedOn, sourceIndex: 0 },
  );
  const fieldSources = { name: [0], status: [0], address: [0], geo: [0] };
  for (const k of Object.keys(links)) if (links[k]) fieldSources[`links.${k}`] = [0];
  if (styleIds.length) fieldSources.styles = [0];

  return {
    id: `osm-${el.type}-${el.id}`,
    slug: slugify(`${name} ${address.locality}`),
    name,
    alt_names: [tags.old_name, tags["was:name"], tags.alt_name].filter((x) => x && x !== name),
    brand: tags.brand ?? null,
    business_type: bt,
    status,
    is_active: status === "open" || status === "temporarily_closed",
    status_note: null,
    opened_year: /^\d{4}/.test(tags.start_date ?? "") ? Number(tags.start_date.slice(0, 4)) : null,
    closed_year: /^\d{4}/.test(tags.end_date ?? "") ? Number(tags.end_date.slice(0, 4)) : null,
    market: market.id,
    address,
    geo: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng, precision: el.type === "node" ? "rooftop" : "street" } : null,
    time_zone: market.time_zone,
    links,
    phone: normalizePhone(tags.phone ?? tags["contact:phone"], country),
    email: tags.email ?? tags["contact:email"] ?? null,
    description: describe({ name, business_type: bt, address }),
    styles: styleIds,
    levels: [],
    software: { current: software, previous: [] },
    offers: { teacher_training: null, on_demand: null, retreats: null, drop_in: null },
    cross_refs: { osm: osmRef, wikidata: tags.wikidata ?? null, tandava_studio_id: null, teachertree_studio_id: null },
    review_state: status === "open" ? "published" : "verified",
    sources: [{ type: "openstreetmap", ref: `https://www.openstreetmap.org/${osmRef}`, license: "ODbL-1.0", fetched_at: fetchedAt }],
    field_sources: fieldSources,
    first_seen_at: fetchedAt,
    last_refreshed_at: fetchedAt,
    last_verified_at: null,
    internal_notes: styleIds.length ? "Styles inferred from the name and map tags." : null,
  };
}

/** A listing we hold from a named source (data/directory/seeds.json), built like a map element. */
export function recordFromSeed(seed, ctx) {
  const tags = {
    name: seed.name,
    sport: "yoga",
    website: seed.website,
    "contact:instagram": seed.instagram,
    "addr:street": seed.street ?? undefined,
    "addr:suburb": seed.area ?? undefined,
    description: seed.styles_text,
  };
  const r = recordFromElement({ type: "seed", id: slugify(seed.name), tags }, ctx);
  if (!r) return null;
  r.id = `seed-${slugify(`${seed.name} ${ctx.market.id}`)}`;
  r.geo = null;
  if (seed.business_type) r.business_type = seed.business_type;
  r.description = describe({ name: r.name, business_type: r.business_type, address: r.address });
  r.cross_refs.osm = null;
  r.sources = [{ type: "manual", ref: seed.source, license: null, fetched_at: ctx.fetchedAt }];
  r.internal_notes = `Seeded from ${seed.source}.`;
  return r;
}

/** Merge records that are the same studio (same site, or same name in the same city). */
export function dedupe(records, sigs) {
  const out = [];
  const byKey = new Map();
  const richness = (r) => Object.values(r.links).filter(Boolean).length + (r.phone ? 1 : 0) + (r.address.street ? 1 : 0);
  for (const r of records) {
    const platformHosted = r.links.website && sigs.some((s) => (hostOf(r.links.website) ?? "").endsWith(s.host));
    const keys = [
      r.links.website_domain && !platformHosted ? `d:${r.links.website_domain}` : null,
      r.links.instagram ? `i:${r.links.instagram}` : null,
      `n:${slugify(r.name)}|${slugify(r.address.locality)}`,
    ].filter(Boolean);
    const hit = keys.map((k) => byKey.get(k)).find(Boolean);
    if (!hit) {
      out.push(r);
      keys.forEach((k) => byKey.set(k, r));
      continue;
    }
    // A map element keeps its id (stable slugs); a seed only adds to it.
    const osm = (x) => x.sources[0]?.type === "openstreetmap";
    const [keep, drop] = osm(r) !== osm(hit) ? (osm(r) ? [r, hit] : [hit, r]) : richness(r) > richness(hit) ? [r, hit] : [hit, r];
    for (const k of Object.keys(keep.links)) keep.links[k] ??= drop.links[k];
    keep.phone ??= drop.phone;
    keep.styles = [...new Set([...keep.styles, ...drop.styles])].sort();
    keep.alt_names = [...new Set([...keep.alt_names, ...(drop.name !== keep.name ? [drop.name] : []), ...drop.alt_names])];
    for (const s of drop.software.current) if (!keep.software.current.some((c) => c.platform_id === s.platform_id)) keep.software.current.push(s);
    keep.geo ??= drop.geo;
    keep.cross_refs.osm ??= drop.cross_refs.osm;
    for (const k of ["street", "area", "postal_code"]) keep.address[k] ??= drop.address[k];
    for (const src of drop.sources) if (!keep.sources.some((x) => x.ref === src.ref)) keep.sources.push(src);
    keep.internal_notes = [keep.internal_notes, drop.cross_refs.osm ? `Merged map element ${drop.cross_refs.osm}.` : `Merged ${drop.id}.`].filter(Boolean).join(" ");
    if (keep !== hit) {
      out[out.indexOf(hit)] = keep;
    }
    keys.forEach((k) => byKey.set(k, keep));
  }
  return out;
}

/**
 * Merge a site check (data/directory/site-checks.json) into a record: vendors
 * found on the studio's own homepage join software.current with the page as source.
 */
export function applySiteCheck(rec, check) {
  if (!check || check.status !== "ok" || !check.platforms?.length) return rec;
  let idx = rec.sources.findIndex((s) => s.type === "website" && s.ref === check.homepage);
  if (idx === -1) {
    rec.sources.push({ type: "website", ref: check.homepage, license: null, fetched_at: `${check.checked_on}T00:00:00Z` });
    idx = rec.sources.length - 1;
  }
  for (const f of check.platforms) {
    if (rec.software.current.some((s) => s.platform_id === f.platform_id)) continue;
    rec.software.current.push({
      platform_id: f.platform_id,
      role: f.role,
      detected_via: f.detected_via,
      evidence: f.evidence,
      observed_from: check.checked_on,
      observed_to: null,
      confidence: f.confidence,
      verified: false,
      source: idx,
    });
  }
  return rec;
}

/** Carry software history and first-seen dates from the previous build. */
export function carryHistory(rec, prev, today) {
  if (!prev) return rec;
  rec.first_seen_at = prev.first_seen_at ?? rec.first_seen_at;
  rec.last_verified_at = prev.last_verified_at ?? null;
  const nowIds = new Set(rec.software.current.map((s) => s.platform_id));
  const previous = [...(prev.software?.previous ?? [])];
  for (const old of prev.software?.current ?? []) {
    const still = rec.software.current.find((s) => s.platform_id === old.platform_id);
    if (still) {
      still.observed_from = old.observed_from ?? still.observed_from;
      still.verified = old.verified || still.verified;
    } else if (old.detected_via !== "manual" && old.detected_via !== "studio_stated") {
      previous.unshift({ ...old, observed_to: today });
    } else {
      rec.software.current.push(old);
      nowIds.add(old.platform_id);
    }
  }
  rec.software.previous = previous.filter((s) => !nowIds.has(s.platform_id));
  return rec;
}

/** Hand corrections win over map data. Keys are record id or slug. */
export function applyOverride(rec, o) {
  if (!o) return rec;
  for (const k of ["name", "status", "status_note", "description", "brand", "business_type", "opened_year", "closed_year", "review_state", "internal_notes"]) {
    if (o[k] !== undefined) rec[k] = o[k];
  }
  if (o.styles) rec.styles = o.styles;
  if (o.levels) rec.levels = o.levels;
  if (o.offers) Object.assign(rec.offers, o.offers);
  if (o.links) Object.assign(rec.links, o.links);
  if (o.phone !== undefined) rec.phone = o.phone;
  if (o.software) {
    if (o.software.current) rec.software.current = o.software.current;
    if (o.software.previous) rec.software.previous = o.software.previous;
  }
  if (o.verified_at) rec.last_verified_at = o.verified_at;
  rec.is_active = rec.status === "open" || rec.status === "temporarily_closed";
  if (o.source) {
    rec.sources.push(o.source);
    rec.field_sources.override = [rec.sources.length - 1];
  }
  return rec;
}

const PUBLIC_STATES = new Set(["published"]);

/** Public tier only. display.json decides the two fields the spec keeps internal by default. */
export function toPublic(rec, display) {
  const showSoftware = (s) => s.role !== "website" && (s.verified || (s.confidence ?? 0) >= PUBLIC_SOFTWARE_CONFIDENCE);
  const pick = (s) => ({ platform_id: s.platform_id, role: s.role, verified: !!s.verified });
  const archived = rec.status === "permanently_closed" || rec.status === "historic";
  return {
    slug: rec.slug,
    name: rec.name,
    brand: rec.brand,
    business_type: rec.business_type,
    status: rec.status,
    is_active: rec.is_active,
    status_note: rec.status_note,
    opened_year: rec.opened_year,
    closed_year: rec.closed_year,
    address: {
      ...(display.show_street_address ? { street: rec.address.street, postal_code: rec.address.postal_code } : {}),
      area: rec.address.area,
      locality: rec.address.locality,
      region_code: rec.address.region_code,
      region_name: rec.address.region_name,
      country_code: rec.address.country_code,
      country_name: rec.address.country_name,
    },
    geo: rec.geo ? { lat: Math.round(rec.geo.lat * 1000) / 1000, lng: Math.round(rec.geo.lng * 1000) / 1000 } : null,
    links: {
      website: rec.links.website,
      instagram: rec.links.instagram,
      facebook: rec.links.facebook,
      youtube: rec.links.youtube,
      tiktok: rec.links.tiktok,
      // Closed studios keep no booking framing (Shared Core section 6).
      booking: archived ? null : rec.links.booking,
    },
    ...(display.show_phone ? { phone: rec.phone } : {}),
    description: rec.description,
    styles: rec.styles,
    levels: rec.levels,
    software: {
      // Closed studios show history only, never a current platform.
      current: archived ? [] : rec.software.current.filter(showSoftware).map(pick),
      previous: [...(archived ? rec.software.current : []), ...rec.software.previous].filter(showSoftware).map(pick),
    },
    offers: rec.offers,
    map_ref: rec.sources.find((s) => s.type === "openstreetmap")?.ref ?? null,
    last_refreshed_at: rec.last_refreshed_at,
    last_verified_at: rec.last_verified_at,
  };
}

export function uniqueSlugs(records) {
  const seen = new Map();
  for (const r of records.sort((a, b) => a.id.localeCompare(b.id))) {
    let s = r.slug || slugify(r.id);
    let n = 2;
    while (seen.has(s)) s = `${r.slug}-${n++}`;
    seen.set(s, r);
    r.slug = s;
  }
  return records;
}

async function main() {
  const args = process.argv.slice(2);
  const today = args.includes("--today") ? args[args.indexOf("--today") + 1] : new Date().toISOString().slice(0, 10);
  const { styles } = await readJson(p("src", "data", "taxonomy", "styles.json"));
  const software = await readJson(p("src", "data", "taxonomy", "studio-software.json"));
  const { markets } = await readJson(join(here, "markets.json"));
  const display = await readJson(p("src", "data", "directory", "display.json"));
  const overrides = await readJson(p("data", "directory", "overrides.json"), { studios: {} });
  const suppressions = await readJson(p("data", "directory", "suppressions.json"), { entries: [] });
  const previous = await readJson(p("data", "directory", "studios.json"), { studios: [] });
  const prevById = new Map(previous.studios.map((r) => [r.id, r]));
  const styleById = new Map(styles.map((s) => [s.id, s]));
  const sigs = compileSignatures(software);

  const rawFiles = (await readdir(p("data", "directory", "raw"))).filter((f) => /^osm-.+\.json$/.test(f)).sort();
  const pulled = new Set();
  let records = [];
  const sources = [];
  for (const f of rawFiles) {
    const raw = JSON.parse(await readFile(p("data", "directory", "raw", f), "utf8"));
    const market = markets.find((m) => m.id === raw.market);
    if (!market) continue;
    pulled.add(market.id);
    sources.push({ market: market.id, fetched_at: raw.fetched_at, osm_base: raw.osm_base, elements: raw.elements.length });
    const ctx = { market, fetchedAt: raw.fetched_at, styles, styleById, sigs, observedOn: raw.fetched_at.slice(0, 10) };
    for (const el of raw.elements) {
      const r = recordFromElement(el, ctx);
      if (r) records.push(r);
    }
  }
  const seeds = await readJson(p("data", "directory", "seeds.json"), { studios: [] });
  for (const seed of seeds.studios) {
    const market = markets.find((m) => m.id === seed.market);
    if (!market) continue;
    const r = recordFromSeed(seed, { market, fetchedAt: `${today}T00:00:00Z`, styles, styleById, sigs, observedOn: today });
    if (r) records.push(r);
  }
  // Link corrections apply before dedupe, so a wrong website on a map element
  // cannot merge two different studios.
  for (const r of records) {
    const o = overrides.studios[r.id];
    if (o?.links) {
      Object.assign(r.links, o.links);
      r.links.website_domain = baseDomain(hostOf(r.links.website));
    }
  }
  records = dedupe(records, sigs);

  // Studios that dropped out of the map since the last build: keep the record,
  // hide it until a person confirms what happened (one missing signal is not a closure).
  const nowIds = new Set(records.map((r) => r.id));
  for (const old of previous.studios) {
    if (nowIds.has(old.id) || !pulled.has(old.market)) {
      if (!nowIds.has(old.id) && !pulled.has(old.market)) records.push(old);
      continue;
    }
    if (old.status === "permanently_closed" || old.status === "historic") {
      records.push(old);
      continue;
    }
    records.push({
      ...old,
      status: "unknown",
      is_active: false,
      review_state: "draft",
      internal_notes: [old.internal_notes, `Missing from map data on ${today}; check before relisting.`].filter(Boolean).join(" "),
    });
  }

  const siteChecks = await readJson(p("data", "directory", "site-checks.json"), { sites: {} });
  for (const r of records) if (r.links.website_domain) applySiteCheck(r, siteChecks.sites[r.links.website_domain]);

  const suppressed = new Set(suppressions.entries.flatMap((e) => [e.id, e.slug, e.website_domain].filter(Boolean)));
  for (const r of records) {
    if (prevById.has(r.id) && r.sources[0]?.type === "openstreetmap") carryHistory(r, prevById.get(r.id), today);
    applyOverride(r, overrides.studios[r.id] ?? overrides.studios[r.slug]);
    if (prevById.get(r.id)?.slug && prevById.get(r.id).review_state === "published") r.slug = prevById.get(r.id).slug;
    if (suppressed.has(r.id) || suppressed.has(r.slug) || (r.links.website_domain && suppressed.has(r.links.website_domain))) {
      r.review_state = "suppressed";
    }
  }
  uniqueSlugs(records);
  records.sort((a, b) => a.address.country_code.localeCompare(b.address.country_code) || (a.address.region_code ?? "").localeCompare(b.address.region_code ?? "") || a.address.locality.localeCompare(b.address.locality) || a.name.localeCompare(b.name));

  const publicRecords = records
    .filter((r) => r.review_state !== "suppressed" && r.status !== "unknown" && r.business_type !== "gym_with_yoga" && (PUBLIC_STATES.has(r.review_state) || r.review_state === "verified"))
    .map((r) => toPublic(r, display));

  await writeFile(p("data", "directory", "studios.json"), JSON.stringify({ generated_on: today, studios: records }, null, 1) + "\n");
  await writeFile(p("src", "data", "directory", "studios.public.json"), JSON.stringify(publicRecords) + "\n");
  const meta = {
    generated_on: today,
    total_public: publicRecords.length,
    active: publicRecords.filter((r) => r.is_active).length,
    archived: publicRecords.filter((r) => !r.is_active).length,
    with_software: publicRecords.filter((r) => r.software.current.length).length,
    markets: sources,
    attribution: "Map data (c) OpenStreetMap contributors, available under the Open Database License (ODbL).",
  };
  await writeFile(p("src", "data", "directory", "meta.json"), JSON.stringify(meta, null, 2) + "\n");
  console.log(JSON.stringify(meta));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
