/**
 * studioCalcUrl.ts — scenario sharing for /tools/studio-calculator.
 *
 * The whole configuration is serialized into the query string so a scenario can
 * be pasted into an email, a lease negotiation, or a text to a business
 * partner, and come back identical on the other end. No server, no account, no
 * stored state.
 *
 * The encoding is deliberately short and human-legible rather than
 * base64-of-JSON: a shared link that reads `?t=2&r=60x32,30x28&m=149` survives
 * being wrapped by an email client, and can be edited by hand.
 *
 * Round-tripping is unit-tested. If you add a field to StudioInputs, add it
 * here and to the round-trip test, or shared links will silently drop it.
 */
import {
  BUSINESS_MODELS,
  SOFTWARE_OPTIONS,
  CITY_TIERS,
  clonePresetInputs,
  getPreset,
  DEFAULT_PRESET_ID,
  type Assumptions,
  type BusinessModelId,
  type CityTier,
  type RoomConfig,
  type SoftwareChoiceId,
  type StudioInputs,
} from "./studioEcon";

/** Assumption keys that may travel in a URL, with their short aliases. */
const ASSUMPTION_ALIASES: Record<string, keyof Assumptions> = {
  rps: "rentPerSf",
  sw$: "softwareCost",
  spm: "sfPerMat",
  ssb: "supportSfBase",
  sse: "supportSfPerExtraRoom",
  lf: "loadFactor",
  ub: "utilitiesBase",
  fdh: "frontDeskHourly",
  fdb: "frontDeskBaseHours",
  fdr: "frontDeskHoursPerRoom",
  fdm: "frontDeskMaxHours",
  gms: "gmSalary",
  apm: "asstProgrammingMulti",
  aps: "asstProgrammingSingle",
  pbr: "payrollBurdenRate",
  ins: "insurance",
  mkf: "marketingFloor",
  mkr: "marketingRate",
  cln: "cleaningBase",
  lnd: "laundryBase",
  rep: "repairs",
  mus: "music",
  net: "internet",
  acc: "accounting",
  msc: "miscFailedPayments",
  mch: "merchantRate",
  rpm: "retailPerMember",
  rmg: "retailMargin",
  pkr: "packPriceRatio",
  dir: "dropInRatio",
  dav: "donationAverage",
  ttr: "teacherTrainingRevenue",
  ttm: "teacherTrainingMargin",
  wsr: "workshopRevenue",
  wsh: "workshopHouseShare",
  rnr: "rentalRevenue",
};

const ALIAS_BY_KEY = Object.fromEntries(
  Object.entries(ASSUMPTION_ALIASES).map(([alias, key]) => [key, alias]),
) as Record<keyof Assumptions, string>;

function encodeRooms(rooms: RoomConfig[]): string {
  return rooms.map((r) => `${r.mats}x${r.classesPerWeek}${r.heated ? "h" : ""}`).join(",");
}

function decodeRooms(raw: string | null): RoomConfig[] | null {
  if (!raw) return null;
  const rooms: RoomConfig[] = [];
  for (const chunk of raw.split(",")) {
    const match = /^(\d{1,3})x(\d{1,3})(h?)$/.exec(chunk.trim());
    if (!match) return null;
    const mats = Number(match[1]);
    const classesPerWeek = Number(match[2]);
    // Reject nonsense rather than letting a malformed link produce a nonsense
    // studio that looks authoritative.
    if (mats < 1 || mats > 300 || classesPerWeek < 0 || classesPerWeek > 200) return null;
    rooms.push({ mats, classesPerWeek, heated: match[3] === "h" });
  }
  return rooms.length >= 1 && rooms.length <= 3 ? rooms : null;
}

/** Trim float noise so links stay short: 5.800000000000001 becomes 5.8. */
function num(n: number): string {
  return String(Math.round(n * 1e6) / 1e6);
}

function readNumber(
  params: URLSearchParams,
  key: string,
  lo: number,
  hi: number,
): number | null {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < lo || value > hi) return null;
  return value;
}

export function encodeScenario(inputs: StudioInputs, presetId: string): string {
  const params = new URLSearchParams();
  params.set("p", presetId);
  params.set("t", String(inputs.cityTier));
  params.set("r", encodeRooms(inputs.rooms));
  params.set("m", num(inputs.membershipPrice));
  params.set("bm", inputs.businessModel);
  params.set("sw", inputs.software);
  params.set("mb", num(inputs.members));
  params.set("vf", num(inputs.memberVisitsPerMonth));
  params.set(
    "tp",
    [inputs.teacherPay.base, inputs.teacherPay.perHeadBonus, inputs.teacherPay.bonusThreshold]
      .map(num)
      .join("|"),
  );
  params.set(
    "cp",
    inputs.classPass.enabled
      ? `1|${num(inputs.classPass.shareOfVisits)}|${num(inputs.classPass.netPerVisit)}`
      : "0",
  );
  params.set("gm", inputs.ownerIsGm ? "1" : "0");
  params.set(
    "an",
    [inputs.ancillary.teacherTraining, inputs.ancillary.workshops, inputs.ancillary.rentals]
      .map((b) => (b ? "1" : "0"))
      .join(""),
  );

  const overrides = Object.entries(inputs.assumptions)
    .filter(([key, value]) => ALIAS_BY_KEY[key as keyof Assumptions] && typeof value === "number")
    .map(([key, value]) => `${ALIAS_BY_KEY[key as keyof Assumptions]}:${num(value as number)}`);
  if (overrides.length > 0) params.set("a", overrides.join(";"));

  return params.toString();
}

/**
 * Decode a query string back into inputs. Anything missing or malformed falls
 * back to the named preset (or the default preset), so a mangled link degrades
 * into a working calculator instead of a blank page.
 */
export function decodeScenario(search: string): { inputs: StudioInputs; presetId: string } {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const presetId = params.get("p") ?? DEFAULT_PRESET_ID;
  const preset = getPreset(presetId);
  const inputs = clonePresetInputs(preset);

  const tier = readNumber(params, "t", 1, 4);
  if (tier !== null && Number.isInteger(tier)) inputs.cityTier = tier as CityTier;

  const rooms = decodeRooms(params.get("r"));
  if (rooms) inputs.rooms = rooms;

  const price = readNumber(params, "m", 0, 10000);
  if (price !== null) inputs.membershipPrice = price;

  const bm = params.get("bm");
  if (bm && bm in BUSINESS_MODELS) inputs.businessModel = bm as BusinessModelId;

  const sw = params.get("sw");
  if (sw && SOFTWARE_OPTIONS.some((s) => s.id === sw)) inputs.software = sw as SoftwareChoiceId;

  const members = readNumber(params, "mb", 0, 100000);
  if (members !== null) inputs.members = members;

  const freq = readNumber(params, "vf", 0, 31);
  if (freq !== null) inputs.memberVisitsPerMonth = freq;

  const tp = params.get("tp")?.split("|").map(Number);
  if (tp && tp.length === 3 && tp.every((n) => Number.isFinite(n) && n >= 0)) {
    inputs.teacherPay = { base: tp[0], perHeadBonus: tp[1], bonusThreshold: tp[2] };
  }

  const cp = params.get("cp");
  if (cp === "0") {
    inputs.classPass = { ...inputs.classPass, enabled: false };
  } else if (cp) {
    const parts = cp.split("|").map(Number);
    if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
      inputs.classPass = {
        enabled: parts[0] === 1,
        shareOfVisits: Math.min(0.9, Math.max(0, parts[1])),
        netPerVisit: Math.max(0, parts[2]),
      };
    }
  }

  const gm = params.get("gm");
  if (gm === "0" || gm === "1") inputs.ownerIsGm = gm === "1";

  const an = params.get("an");
  if (an && /^[01]{3}$/.test(an)) {
    inputs.ancillary = {
      teacherTraining: an[0] === "1",
      workshops: an[1] === "1",
      rentals: an[2] === "1",
    };
  }

  const a = params.get("a");
  if (a) {
    const assumptions: Partial<Assumptions> = {};
    for (const pair of a.split(";")) {
      const [alias, rawValue] = pair.split(":");
      const key = ASSUMPTION_ALIASES[alias];
      const value = Number(rawValue);
      // Negative costs would let a shared link fabricate a profitable studio.
      if (key && Number.isFinite(value) && value >= 0) {
        assumptions[key] = value;
      }
    }
    if (Object.keys(assumptions).length > 0) inputs.assumptions = assumptions;
  }

  return { inputs, presetId: getPreset(presetId).id };
}

/** Absolute shareable URL for the current scenario. */
export function scenarioUrl(inputs: StudioInputs, presetId: string, origin?: string): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "https://tandava.yoga");
  return `${base}/tools/studio-calculator?${encodeScenario(inputs, presetId)}`;
}

/** Which assumption keys differ from the preset, for the "modified" dots. */
export function modifiedAssumptionKeys(
  inputs: StudioInputs,
  presetId: string,
): Set<keyof Assumptions> {
  const preset = getPreset(presetId);
  const modified = new Set<keyof Assumptions>();
  const presetAssumptions = preset.inputs.assumptions;
  const keys = new Set<string>([
    ...Object.keys(inputs.assumptions),
    ...Object.keys(presetAssumptions),
  ]);
  Array.from(keys).forEach((key) => {
    const typed = key as keyof Assumptions;
    if (inputs.assumptions[typed] !== presetAssumptions[typed]) modified.add(typed);
  });
  // The tier owns rentPerSf unless the user overrode it, so a tier change alone
  // is not a "modified assumption".
  if (
    inputs.assumptions.rentPerSf !== undefined &&
    inputs.assumptions.rentPerSf === CITY_TIERS[inputs.cityTier].rentPerSf
  ) {
    modified.delete("rentPerSf");
  }
  return modified;
}
