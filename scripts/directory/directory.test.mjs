import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compileSignatures, detectSoftware, matchUrl } from "./detect.mjs";
import { inferStyles, isStudioCandidate, statusOf, normalizePhone, instagramHandle, describe, businessType } from "./normalize.mjs";
import { recordFromElement, dedupe, carryHistory, toPublic, applySiteCheck } from "./build-studios.mjs";
import { robotsAllows, vendorCandidates, checkSite } from "./site-check.mjs";
import { freshEnough } from "./osm-pull.mjs";

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const software = read("../../src/data/taxonomy/studio-software.json");
const { styles } = read("../../src/data/taxonomy/styles.json");
const { markets } = read("./markets.json");
const sigs = compileSignatures(software);
const austin = markets.find((m) => m.id === "austin");
const ctx = { market: austin, fetchedAt: "2026-11-10T09:00:00Z", styles, styleById: new Map(styles.map((s) => [s.id, s])), sigs, observedOn: "2026-11-10" };

test("vendored taxonomy matches the pinned hashes", async () => {
  const { createHash } = await import("node:crypto");
  const source = read("../../src/data/taxonomy/SOURCE.json");
  for (const [file, hash] of Object.entries(source.files)) {
    const body = readFileSync(new URL(`../../src/data/taxonomy/${file}`, import.meta.url));
    assert.equal(createHash("sha256").update(body).digest("hex"), hash, file);
  }
});

test("booking links map to the right platform", () => {
  const cases = {
    "https://clients.mindbodyonline.com/classic/ws?studioid=1": "mindbody",
    "https://app.arketa.co/sunyoga/schedule": "arketa",
    "https://momence.com/Sun-Yoga/123": "momence",
    "https://www.eversports.de/s/the-yoga-studio": "eversports",
    "https://www.vagaro.com/sunyoga": "vagaro",
    "https://sunyoga.pike13.com/schedule": "pike13",
    "https://tandavastudio.com/s/sun-yoga": "tandava",
  };
  for (const [url, id] of Object.entries(cases)) assert.equal(matchUrl(url, sigs)?.platform.id, id, url);
  assert.equal(matchUrl("https://sunyoga.com", sigs), null);
  assert.equal(matchUrl("https://tandavastudio.com/discover", sigs), null);
});

test("a site builder is never shown as booking software", () => {
  const obs = detectSoftware([{ url: "https://sunyoga.squarespace.com", via: "map_listing_tag" }], sigs, { observedOn: "2026-11-10" });
  assert.equal(obs[0].role, "website");
});

test("styles: child style beats its parent, levels are not styles", () => {
  const ids = inferStyles("Black Swan Power Vinyasa", styles);
  assert.ok(ids.includes("power-vinyasa"), ids.join());
  assert.ok(!ids.includes("power"));
  assert.deepEqual(inferStyles("Crossfit Box", styles), []);
});

test("candidates, closures and contact normalization", () => {
  assert.ok(isStudioCandidate({ name: "Sun Yoga", sport: "yoga" }));
  assert.ok(!isStudioCandidate({ name: "Gold's Gym", leisure: "fitness_centre" }));
  assert.ok(isStudioCandidate({ name: "Gold's Gym", leisure: "fitness_centre", sport: "fitness;yoga" }));
  assert.equal(statusOf({ "disused:sport": "yoga", "was:name": "Old Yoga" }), "permanently_closed");
  assert.equal(statusOf({ sport: "yoga" }), "open");
  assert.equal(normalizePhone("(512) 555-0100", "US"), "+15125550100");
  assert.equal(instagramHandle("https://instagram.com/sunyoga_atx/"), "sunyoga_atx");
  assert.match(describe({ name: "Sun Yoga", business_type: "yoga_studio", address: { area: "Zilker", locality: "Austin", region_code: "TX", country_code: "US" } }), /Sun Yoga is a yoga studio in Zilker, Austin, TX\./);
});

const el = (id, tags) => ({ type: "node", id, lat: 30.26, lon: -97.74, tags: { sport: "yoga", ...tags } });

test("map element becomes a record with software from its booking tag", () => {
  const r = recordFromElement(el(1, { name: "Sun Yoga", website: "https://sunyoga.com", "reservation:website": "https://app.arketa.co/sunyoga", phone: "512-555-0100", "addr:city": "Austin", "addr:state": "TX" }), ctx);
  assert.equal(r.slug, "sun-yoga-austin");
  assert.equal(r.software.current[0].platform_id, "arketa");
  assert.equal(r.address.region_code, "TX");
  assert.equal(r.review_state, "published");
});

test("duplicates merge on website domain", () => {
  const a = recordFromElement(el(1, { name: "Sun Yoga", website: "https://sunyoga.com" }), ctx);
  const b = recordFromElement(el(2, { name: "Sun Yoga South", website: "https://www.sunyoga.com/south", "contact:instagram": "sunyoga" }), ctx);
  const out = dedupe([a, b], sigs);
  assert.equal(out.length, 1);
  assert.equal(out[0].links.instagram, "sunyoga");
});

test("a switch moves the old platform to previous with an end date", () => {
  const prev = recordFromElement(el(1, { name: "Sun Yoga", "reservation:website": "https://clients.mindbodyonline.com/x" }), { ...ctx, observedOn: "2026-06-01" });
  const now = recordFromElement(el(1, { name: "Sun Yoga", "reservation:website": "https://app.arketa.co/sunyoga" }), ctx);
  carryHistory(now, prev, "2026-11-10");
  assert.deepEqual(now.software.current.map((s) => s.platform_id), ["arketa"]);
  assert.equal(now.software.previous[0].platform_id, "mindbody");
  assert.equal(now.software.previous[0].observed_to, "2026-11-10");
});

test("public record hides internal fields and closed studios show history only", () => {
  const display = { show_phone: false, show_street_address: false };
  const open = toPublic(recordFromElement(el(1, { name: "Sun Yoga", phone: "512-555-0100", email: "x@sunyoga.com", "addr:street": "Main St", "reservation:website": "https://app.arketa.co/s" }), ctx), display);
  assert.equal(open.phone, undefined);
  assert.equal(open.email, undefined);
  assert.equal(open.address.street, undefined);
  assert.equal(open.software.current[0].platform_id, "arketa");
  const closed = toPublic(recordFromElement(el(2, { sport: undefined, "disused:sport": "yoga", "was:name": "Old Yoga", "reservation:website": "https://clients.mindbodyonline.com/x" }), ctx), display);
  assert.equal(closed.is_active, false);
  assert.equal(closed.links.booking, null);
  assert.deepEqual(closed.software.current, []);
  assert.equal(closed.software.previous[0].platform_id, "mindbody");
  assert.equal(toPublic(recordFromElement(el(3, { name: "A", phone: "512-555-0100" }), ctx), { show_phone: true }).phone, "+15125550100");
});

test("Ubud seeds build, and map data merges into them", async () => {
  const { recordFromSeed } = await import("./build-studios.mjs");
  const ubud = markets.find((m) => m.id === "ubud");
  const seeds = read("../../data/directory/seeds.json").studios;
  const uctx = { ...ctx, market: ubud };
  const recs = seeds.map((s) => recordFromSeed(s, uctx));
  assert.equal(recs.filter(Boolean).length, seeds.length);
  const barn = recs.find((r) => r.name === "Yoga Barn");
  assert.equal(barn.address.locality, "Ubud");
  assert.equal(barn.address.country_code, "ID");
  assert.equal(barn.address.region_name, "Bali");
  assert.ok(barn.styles.includes("vinyasa"));
  assert.match(barn.description, /Ubud, Indonesia\.$/);
  const osm = recordFromElement({ type: "node", id: 9, lat: -8.52, lon: 115.26, tags: { name: "The Yoga Barn", sport: "yoga", website: "https://www.theyogabarn.com/", "addr:city": "Gianyar" } }, uctx);
  const [merged] = dedupe([osm, barn], sigs);
  assert.equal(merged.id, "osm-node-9");
  assert.equal(merged.address.locality, "Ubud");
  assert.ok(merged.sources.some((x) => x.type === "manual"));
});

test("gyms that list yoga stay off the studio list, studios with gym-like words stay on", () => {
  assert.equal(businessType({ name: "Flushing YMCA", sport: "yoga" }, []), "gym_with_yoga");
  assert.equal(businessType({ name: "Round Rock Krav Maga & Kick Boxing", sport: "yoga" }, []), "gym_with_yoga");
  assert.equal(businessType({ name: "Yogis & Yoginis", leisure: "sports_centre", sport: "yoga" }, []), "yoga_studio");
  assert.equal(businessType({ name: "Absolute Studio", leisure: "sports_centre", sport: "yoga;pilates" }, []), "multi_discipline_studio");
  assert.equal(isStudioCandidate({ name: "& Fitness", sport: "yoga" }), false);
});

test("Nosara seeds are listed even though map data has none", () => {
  const seeds = JSON.parse(readFileSync(new URL("../../data/directory/seeds.json", import.meta.url))).studios;
  const nosara = seeds.filter((s) => s.market === "nosara");
  assert.ok(nosara.length >= 10);
  assert.ok(nosara.every((s) => s.source && (s.website || s.instagram)));
});

test("robots.txt: our agent group wins, longest rule wins, empty Disallow allows", () => {
  assert.equal(robotsAllows("", "/"), true);
  assert.equal(robotsAllows("User-agent: *\nDisallow: /", "/"), false);
  assert.equal(robotsAllows("User-agent: *\nDisallow:", "/"), true);
  assert.equal(robotsAllows("User-agent: *\nDisallow: /admin", "/"), true);
  assert.equal(robotsAllows("User-agent: *\nDisallow: /\n\nUser-agent: TandavaStudioDirectory\nAllow: /", "/"), true);
  assert.equal(robotsAllows("User-agent: TandavaStudioDirectory\nDisallow: /\n\nUser-agent: *\nAllow: /", "/"), false);
});

test("site check finds vendors in links, iframes and scripts, and respects robots", async () => {
  const html = `<a href="https://clients.mindbodyonline.com/classic/ws?studioid=123">Book</a>
    <iframe src="https://momence.com/u/some-studio"></iframe>
    <script src="https://widgets.healcode.com/javascripts/healcode.js"></script>
    <a href="/about">About</a>`;
  const found = vendorCandidates(html, "https://studio.example/");
  assert.ok(found.some((f) => f.via === "iframe"));
  assert.ok(found.some((f) => f.via === "script_fingerprint"));
  assert.ok(found.every((f) => !f.url.includes("?")), "query strings are never kept");

  const pages = { "https://studio.example/robots.txt": { status: 404, text: "" }, "https://studio.example/": { status: 200, text: html } };
  const fetcher = async (url) => ({ ...pages[url], finalUrl: url });
  const res = await checkSite("https://studio.example/schedule", sigs, { today: "2026-11-10", fetcher });
  assert.equal(res.status, "ok");
  assert.ok(res.platforms.some((p) => p.platform_id === "mindbody"));

  const blocked = await checkSite("https://studio.example/", sigs, {
    today: "2026-11-10",
    fetcher: async (url) => ({ status: 200, text: url.endsWith("robots.txt") ? "User-agent: *\nDisallow: /" : html, finalUrl: url }),
  });
  assert.equal(blocked.status, "robots_disallowed");
  assert.equal(blocked.platforms.length, 0);
});

test("a site check adds software with the homepage as its source", () => {
  const rec = { sources: [{ type: "openstreetmap", ref: "node/1" }], software: { current: [], previous: [] } };
  applySiteCheck(rec, {
    status: "ok",
    checked_on: "2026-11-10",
    homepage: "https://studio.example/",
    platforms: [{ platform_id: "momence", role: "system_of_record", detected_via: "iframe", evidence: "https://momence.com/u/x", confidence: 0.95 }],
  });
  assert.equal(rec.software.current[0].platform_id, "momence");
  assert.equal(rec.sources[rec.software.current[0].source].ref, "https://studio.example/");
  applySiteCheck(rec, { status: "timeout", platforms: [] });
  assert.equal(rec.software.current.length, 1);
});

test("robots.txt wildcards only block what they match", () => {
  const sq = "User-agent: *\nDisallow: /config\nDisallow: /*?author=*\nDisallow: /*&tag=*\nDisallow: /search\n";
  assert.equal(robotsAllows(sq, "/"), true);
  assert.equal(robotsAllows("User-agent: *\nDisallow: /*", "/"), false);
  assert.equal(robotsAllows("User-agent: *\nDisallow: /$", "/"), false);
  assert.equal(robotsAllows("User-agent: *\nDisallow: /$", "/about"), true);
  assert.equal(robotsAllows("User-agent: *\nDisallow: /*.pdf$", "/"), true);
});

test("marketplace and ticketing links stay internal until confirmed", () => {
  const [c] = detectSoftware([{ url: "https://classpass.com/studios/x", via: "booking_link_domain" }], sigs, {});
  assert.equal(c.platform_id, "classpass");
  assert.ok(c.confidence < 0.9);
});

test("a lagging map mirror is not used", () => {
  const now = Date.parse("2026-11-10T20:00:00Z");
  assert.equal(freshEnough("2026-11-10T19:57:39Z", { now }), true);
  assert.equal(freshEnough("2026-06-01T08:52:28Z", { now }), false);
  assert.equal(freshEnough("2026-11-05T00:00:00Z", { now, previousBase: "2026-11-10T19:57:39Z" }), false);
  assert.equal(freshEnough(null, { now }), false);
});
