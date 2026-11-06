/**
 * Super properties for every analytics event (portfolio taxonomy) and the
 * app_opened cold-start event.
 *
 * install_source / install_campaign are the first-party first touch: the
 * campaign tags (or, without tags, the channel) of the first visit this
 * browser made, kept once in localStorage and never overwritten. Inside the
 * native apps the web view has no landing URL, so they stay empty there; iOS
 * campaign installs are read per campaign in App Store Connect instead.
 */

import { classifyChannel } from "./channel";
import { parseLanding } from "./landing";
import type { FunnelProps } from "../funnel";

export const ANALYTICS_SCHEMA_VERSION = 1;

const FIRST_TOUCH_KEY = "tandava.first_touch";
const OPENED_KEY = "tandava.opened";

export type Platform = "web" | "ios" | "android";

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

/** ios / android inside the Capacitor shells, web everywhere else. */
export function detectPlatform(w: { Capacitor?: CapacitorGlobal } | undefined = typeof window === "undefined" ? undefined : (window as unknown as { Capacitor?: CapacitorGlobal })): Platform {
  try {
    const cap = w?.Capacitor;
    if (!cap?.isNativePlatform?.()) return "web";
    const p = cap.getPlatform?.();
    return p === "ios" || p === "android" ? p : "web";
  } catch {
    return "web";
  }
}

/** tandava on the web; tandava_member / tandava_studio in the native builds (VITE_NATIVE_APP). */
export function appName(nativeApp: string | undefined | null, platform: Platform): string {
  if (platform === "web") return "tandava";
  return nativeApp === "studio" ? "tandava_studio" : nativeApp === "member" ? "tandava_member" : "tandava";
}

/** Lowercase with underscores, the UTM vocabulary in PRD-024 and the store `ct` format. */
export function campaignToken(raw: string | undefined | null, max = 40): string | undefined {
  const t = String(raw ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, max)
    .replace(/_$/, "");
  return t || undefined;
}

export interface FirstTouch {
  source: string;
  campaign?: string;
}

/** What a landing URL and referrer say about the original source. Pure. */
export function firstTouchFrom(url: string, referrer: string | null | undefined): FirstTouch {
  const facts = parseLanding(url);
  const channel = classifyChannel({
    utmSource: facts.utm.source,
    utmMedium: facts.utm.medium,
    referrer: referrer || null,
    ...facts.clickIds,
  });
  return {
    source: campaignToken(facts.utm.source) ?? channel,
    campaign: campaignToken(facts.utm.campaign, 100),
  };
}

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** The stored first touch, if this browser has one. Never writes. */
export function readFirstTouch(): FirstTouch | null {
  try {
    const raw = storage()?.getItem(FIRST_TOUCH_KEY);
    const parsed = raw ? (JSON.parse(raw) as FirstTouch) : null;
    return parsed && typeof parsed.source === "string" ? parsed : null;
  } catch {
    return null;
  }
}

/** The stored first touch, recording this visit as it when there is none. */
export function rememberFirstTouch(url: string, referrer: string | null | undefined): FirstTouch {
  const stored = readFirstTouch();
  if (stored) return stored;
  const st = storage();
  const touch = firstTouchFrom(url, referrer);
  try {
    st?.setItem(FIRST_TOUCH_KEY, JSON.stringify(touch));
  } catch {
    // Not kept; next load records again.
  }
  return touch;
}

/** True the first time this browser (or app install) opens Tandava. */
export function consumeFirstOpen(): boolean {
  const st = storage();
  try {
    if (st?.getItem(OPENED_KEY) === "1") return false;
    st?.setItem(OPENED_KEY, "1");
  } catch {
    // Storage blocked: every load counts as first, which PostHog's own person
    // properties correct for.
  }
  return true;
}

export interface AppContextInput {
  env: Record<string, string | undefined>;
  url: string;
  referrer?: string | null;
  platform?: Platform;
}

export function superPropertiesFor({ env, url, referrer, platform = detectPlatform() }: AppContextInput): FunnelProps {
  const touch = platform === "web" ? rememberFirstTouch(url, referrer) : undefined;
  return {
    app: appName(env.VITE_NATIVE_APP, platform),
    app_version: env.VITE_APP_VERSION?.trim() || undefined,
    platform,
    schema_version: ANALYTICS_SCHEMA_VERSION,
    install_source: touch?.source,
    install_campaign: touch?.campaign,
  };
}
