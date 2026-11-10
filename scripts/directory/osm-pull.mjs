#!/usr/bin/env node
/**
 * Pull yoga studio candidates for each directory market from OpenStreetMap
 * through the public Overpass API, and save the raw response.
 *
 *   node scripts/directory/osm-pull.mjs [--market austin] [--out data/directory/raw]
 *
 * One query per market, a pause between markets, an honest user agent.
 * OpenStreetMap data is (c) OpenStreetMap contributors, ODbL 1.0. Anything we
 * publish from it carries that attribution (see /studios/about).
 *
 * This reads the map only. It never fetches a studio's own website.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
export const USER_AGENT =
  "TandavaStudioDirectory/1.0 (+https://tandavastudio.com/studios/about; hello@purafieldstudio.com)";
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

/** Overpass QL for one bbox. Exported for tests. */
export function buildQuery([s, w, n, e]) {
  const bb = `(${s},${w},${n},${e})`;
  const studioWords = "yoga|pilates|ashtanga|vinyasa|bikram|kundalini|iyengar";
  return `[out:json][timeout:180];
(
  nwr["sport"~"yoga|pilates",i]${bb};
  nwr["disused:sport"~"yoga|pilates",i]${bb};
  nwr["leisure"]["name"~"${studioWords}",i]${bb};
  nwr["club"]["name"~"${studioWords}",i]${bb};
  nwr["healthcare"]["name"~"yoga",i]${bb};
  nwr["amenity"~"community_centre|social_centre|events_venue"]["name"~"yoga",i]${bb};
  nwr["shop"~"yoga"]${bb};
  nwr["disused:leisure"]["name"~"${studioWords}",i]${bb};
  nwr["was:name"~"yoga",i]${bb};
);
out center tags meta;`;
}

async function overpass(query) {
  let lastErr;
  for (const url of ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ data: query }),
        });
        if (res.status === 429 || res.status === 504) {
          lastErr = new Error(`${url} answered ${res.status}`);
          await new Promise((r) => setTimeout(r, 30_000));
          continue;
        }
        if (!res.ok) throw new Error(`${url} answered ${res.status}`);
        return { endpoint: url, json: await res.json() };
      } catch (err) {
        lastErr = err;
      }
    }
  }
  throw lastErr;
}

async function main() {
  const args = process.argv.slice(2);
  const only = args.includes("--market") ? args[args.indexOf("--market") + 1] : null;
  const outDir = args.includes("--out") ? args[args.indexOf("--out") + 1] : join(root, "data", "directory", "raw");
  const { markets } = JSON.parse(await readFile(join(here, "markets.json"), "utf8"));
  await mkdir(outDir, { recursive: true });
  const list = markets.filter((m) => !only || m.id === only);
  if (!list.length) throw new Error(`No market ${only}`);
  for (const [i, m] of list.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, 10_000));
    const query = buildQuery(m.bbox);
    const fetchedAt = new Date().toISOString();
    const { endpoint, json } = await overpass(query);
    const elements = (json.elements ?? []).sort((a, b) => `${a.type}${a.id}`.localeCompare(`${b.type}${b.id}`));
    const out = {
      market: m.id,
      fetched_at: fetchedAt,
      endpoint,
      osm_base: json.osm3s?.timestamp_osm_base ?? null,
      license: "ODbL-1.0",
      attribution: "(c) OpenStreetMap contributors",
      query,
      elements,
    };
    await writeFile(join(outDir, `osm-${m.id}.json`), JSON.stringify(out, null, 1) + "\n");
    console.log(`${m.id}: ${elements.length} elements from ${endpoint}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
