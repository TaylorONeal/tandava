/**
 * Website analytics: Vercel Web Analytics and Google Analytics 4.
 *
 * - Vercel Web Analytics (cookie-free) counts public pages only: the marketing
 *   pages, Discover and studio pages. Signed-in areas (/manage, /teach, /staff,
 *   /account, /admin...) are dropped before anything is sent.
 * - GA4 runs on the public marketing pages only, never in the booking app or
 *   the studio dashboard. It loads only when VITE_GA4_MEASUREMENT_ID is set,
 *   never for a browser that sends Do Not Track or Global Privacy Control, and
 *   never inside the native apps. Moving to an app page switches it off with
 *   Google's own `ga-disable-<ID>` flag until the visitor is back on a
 *   marketing page.
 * - Consent Mode v2: analytics and ad storage denied by default in the EEA,
 *   the UK and Switzerland; analytics granted elsewhere; ad storage always
 *   denied (no ads). A small Allow / No thanks notice shows only when the
 *   browser's time zone is in Europe, and the choice is kept in this browser.
 * - `?notrack=1` on any page turns both off in this browser (for the team's own
 *   devices); `?track=1` turns them back on. /privacy has the same switch.
 *
 * Events (GA4 and Vercel): store_click, outbound_click, contact_click.
 * store_click also goes to the product analytics facade (src/lib/funnel.ts).
 * No names, emails, ids or free text go into any of them.
 */

import { STUDIO_APP_APPLE_ID } from "../../config/studioApp";
import type { WebAnalyticsConfig } from "../../config/analytics";
import { trackFunnel } from "../funnel";
import { sanitizeUrl } from "./landing";

const OPT_OUT_KEY = "tandava.no_analytics";
const CONSENT_KEY = "tandava.analytics_consent";

/** EEA (EU 27 + Iceland, Liechtenstein, Norway), the UK and Switzerland. */
export const CONSENT_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  "IS", "LI", "NO", "GB", "CH",
] as const;

const MARKETING_PREFIXES = ["/blog", "/tools"];
const MARKETING_EXACT = new Set([
  "/for-studios",
  "/studio-app",
  "/yoga-studio-software",
  "/class-booking-software",
  "/open-source",
  "/support",
  "/terms",
  "/privacy",
  "/refunds",
]);

function normalize(pathname: string): string {
  const p = pathname.replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

/**
 * A public marketing page. `rootIsMarketing` is false on a studio subdomain and
 * when VITE_HOME_MODE=discover, where `/` is part of the booking app.
 */
export function isMarketingPath(pathname: string, rootIsMarketing: boolean): boolean {
  const p = normalize(pathname);
  if (p === "/") return rootIsMarketing;
  if (MARKETING_EXACT.has(p)) return true;
  return MARKETING_PREFIXES.some((pre) => p === pre || p.startsWith(`${pre}/`));
}

/** Pages anyone can open without signing in: marketing, Discover and studio pages. */
export function isPublicPath(pathname: string, rootIsMarketing: boolean): boolean {
  const p = normalize(pathname);
  if (p === "/" || isMarketingPath(p, rootIsMarketing)) return true;
  return p === "/discover" || p.startsWith("/s/");
}

interface PrivacySignals {
  doNotTrack?: string | null;
  globalPrivacyControl?: boolean;
}

/** Do Not Track or Global Privacy Control. */
export function privacySignalOn(nav: PrivacySignals | undefined, winDnt?: string | null): boolean {
  return nav?.doNotTrack === "1" || winDnt === "1" || nav?.globalPrivacyControl === true;
}

export function inEuropeTimeZone(timeZone?: string): boolean {
  try {
    const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    return tz.startsWith("Europe/");
  } catch {
    return false;
  }
}

/** The two Consent Mode v2 defaults, in the order gtag needs them (region first). */
export function consentDefaults() {
  return [
    {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      region: [...CONSENT_REGIONS],
      wait_for_update: 500,
    },
    {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "granted",
    },
  ] as const;
}

export type StoreName = "app_store" | "google_play";

export interface ClassifiedLink {
  event: "store_click" | "outbound_click" | "contact_click";
  params: Record<string, string>;
}

/** What a clicked link means for analytics, or null for an internal link. Pure. */
export function classifyLink(href: string, pageHost: string, opts: { playStudioPackage?: string } = {}): ClassifiedLink | null {
  let u: URL;
  try {
    u = new URL(href, `https://${pageHost}`);
  } catch {
    return null;
  }
  if (u.protocol === "mailto:") return { event: "contact_click", params: { method: "email" } };
  if (u.protocol === "tel:") return { event: "contact_click", params: { method: "phone" } };
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.host === "apps.apple.com") {
    const app = u.pathname.includes(`id${STUDIO_APP_APPLE_ID}`) ? "tandava_studio" : "tandava";
    return { event: "store_click", params: { store: "app_store", app } };
  }
  if (u.host === "play.google.com") {
    const pkg = u.searchParams.get("id") ?? "";
    const app = opts.playStudioPackage && pkg === opts.playStudioPackage ? "tandava_studio" : "tandava";
    return { event: "store_click", params: { store: "google_play", app } };
  }
  if (u.host === pageHost) return null;
  return { event: "outbound_click", params: { host: u.host } };
}

/** Where on the page a link sits: an explicit data-placement, else the page region. */
export function placementOf(el: Element): string {
  const tagged = el.closest("[data-placement]")?.getAttribute("data-placement");
  if (tagged) return tagged.slice(0, 40);
  if (el.closest("header")) return "header";
  if (el.closest("nav")) return "menu";
  if (el.closest("footer")) return "footer";
  return "body";
}

function store(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getItem(key: string): string | null {
  try {
    return store()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function setItem(key: string, value: string | null) {
  try {
    if (value === null) store()?.removeItem(key);
    else store()?.setItem(key, value);
  } catch {
    // Not kept; applies to this page only.
  }
}

export function analyticsOptedOut(): boolean {
  return getItem(OPT_OUT_KEY) === "1";
}

/** The /privacy switch. Takes effect on the next page load. */
export function setAnalyticsOptOut(off: boolean): void {
  setItem(OPT_OUT_KEY, off ? "1" : null);
}

/** `?notrack=1` / `?track=1` on any page. */
export function applySelfExclusion(search: string): void {
  if (/[?&]notrack=1(&|$)/.test(search)) setItem(OPT_OUT_KEY, "1");
  if (/[?&]track=1(&|$)/.test(search)) setItem(OPT_OUT_KEY, null);
}

type Gtag = (...args: unknown[]) => void;
type Va = (...args: unknown[]) => void;
interface AnalyticsWindow extends Window {
  dataLayer?: unknown[];
  gtag?: Gtag;
  va?: Va;
  vaq?: unknown[];
  Capacitor?: { isNativePlatform?: () => boolean };
  [flag: `ga-disable-${string}`]: boolean | undefined;
}

export interface WebAnalyticsOptions {
  config: WebAnalyticsConfig;
  rootIsMarketing: boolean;
}

let started = false;

/** Start website analytics once, at app startup. Never throws. */
export function initWebAnalytics({ config, rootIsMarketing }: WebAnalyticsOptions): void {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    const w = window as unknown as AnalyticsWindow;
    if (w.Capacitor?.isNativePlatform?.()) return; // Native apps: product analytics only.
    applySelfExclusion(w.location.search);
    if (analyticsOptedOut()) return;

    const useVercel = config.vercel;
    const gaId = config.ga4Id && !privacySignalOn(navigator as PrivacySignals, (w as unknown as { doNotTrack?: string }).doNotTrack) ? config.ga4Id : null;
    if (!useVercel && !gaId) {
      listenForClicks(w, null, false, config, rootIsMarketing);
      return;
    }

    if (useVercel) startVercel(w, rootIsMarketing);

    let gaLoaded = false;
    const onRoute = () => {
      if (!gaId) return;
      const path = w.location.pathname;
      const marketing = isMarketingPath(path, rootIsMarketing);
      w[`ga-disable-${gaId}`] = !marketing;
      if (!marketing) return;
      if (!gaLoaded) {
        gaLoaded = true;
        startGa(w, gaId);
      }
      const location = sanitizeUrl(w.location.href) ?? undefined;
      w.gtag?.("set", { page_location: location, page_referrer: sanitizeUrl(document.referrer) ?? undefined });
      // Give the new page a moment to set its title; skip if the visitor already moved on.
      setTimeout(() => {
        if (w.location.pathname !== path) return;
        w.gtag?.("event", "page_view", { page_location: location, page_path: path, page_title: document.title });
      }, 300);
    };
    watchRoutes(w, onRoute);
    onRoute();
    listenForClicks(w, gaId, useVercel, config, rootIsMarketing);
  } catch {
    // Analytics must never break the page.
  }
}

function startVercel(w: AnalyticsWindow, rootIsMarketing: boolean) {
  w.va = w.va || ((...args: unknown[]) => { (w.vaq = w.vaq || []).push(args); });
  // Drop signed-in pages and strip query strings down to campaign tags.
  w.va("beforeSend", (event: { url: string }) => {
    try {
      const u = new URL(event.url);
      if (!isPublicPath(u.pathname, rootIsMarketing)) return null;
      const url = sanitizeUrl(event.url);
      return url ? { ...event, url } : null;
    } catch {
      return null;
    }
  });
  const s = document.createElement("script");
  s.defer = true;
  s.src = "/_vercel/insights/script.js";
  document.head.appendChild(s);
}

function startGa(w: AnalyticsWindow, id: string) {
  w.dataLayer = w.dataLayer || [];
  // gtag must push the arguments object itself, not an array copy.
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  for (const d of consentDefaults()) w.gtag("consent", "default", d);
  const choice = getItem(CONSENT_KEY);
  if (choice === "granted" || choice === "denied") w.gtag("consent", "update", { analytics_storage: choice });
  w.gtag("js", new Date());
  w.gtag("config", id, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    transport_type: "beacon",
  });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
  if (!choice && inEuropeTimeZone()) showConsentNotice(w);
}

/** React Router navigates with pushState; see every route change without touching the router. */
function watchRoutes(w: AnalyticsWindow, onRoute: () => void) {
  let last = w.location.pathname;
  const check = () => {
    if (w.location.pathname === last) return;
    last = w.location.pathname;
    onRoute();
  };
  for (const method of ["pushState", "replaceState"] as const) {
    const original = w.history[method].bind(w.history);
    w.history[method] = (...args: Parameters<History["pushState"]>) => {
      const result = original(...args);
      try {
        check();
      } catch {
        // Ignore.
      }
      return result;
    };
  }
  w.addEventListener("popstate", check);
}

function listenForClicks(w: AnalyticsWindow, gaId: string | null, useVercel: boolean, config: WebAnalyticsConfig, rootIsMarketing: boolean) {
  document.addEventListener(
    "click",
    (e) => {
      try {
        const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
        if (!a) return;
        const link = classifyLink(a.href, w.location.host, { playStudioPackage: config.playStudioPackage });
        if (!link) return;
        const path = w.location.pathname;
        const params: Record<string, string> = { ...link.params, placement: placementOf(a), page_path: path };
        if (link.event === "store_click") {
          trackFunnel("store_click", { store: params.store, app: params.app, placement: params.placement });
        }
        if (gaId && isMarketingPath(path, rootIsMarketing)) w.gtag?.("event", link.event, params);
        if (useVercel && isPublicPath(path, rootIsMarketing)) {
          w.va?.("event", { name: link.event, data: { app: params.app ?? params.host ?? params.method, placement: params.placement } });
        }
      } catch {
        // Ignore.
      }
    },
    true,
  );
}

function showConsentNotice(w: AnalyticsWindow) {
  const box = document.createElement("div");
  box.setAttribute("role", "region");
  box.setAttribute("aria-label", "Analytics choice");
  box.style.cssText =
    "position:fixed;left:16px;right:16px;bottom:16px;z-index:60;max-width:420px;margin:0 auto;padding:14px 16px;" +
    "border-radius:12px;border:1px solid hsl(var(--border,0 0% 85%));background:hsl(var(--background,0 0% 100%));" +
    "color:hsl(var(--foreground,0 0% 10%));font:14px/1.45 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.12)";
  const text = document.createElement("p");
  text.style.margin = "0 0 10px";
  text.append("We use Google Analytics cookies on these pages to see which ones help studios. No ads. ");
  const more = document.createElement("a");
  more.href = "/privacy";
  more.textContent = "Privacy";
  more.style.textDecoration = "underline";
  text.append(more);
  const row = document.createElement("div");
  row.style.cssText = "display:flex;gap:8px;justify-content:flex-end";
  const button = (label: string, value: "granted" | "denied", primary: boolean) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.style.cssText =
      "padding:6px 14px;border-radius:8px;cursor:pointer;font:inherit;border:1px solid hsl(var(--border,0 0% 80%));" +
      (primary ? "background:hsl(var(--foreground,0 0% 10%));color:hsl(var(--background,0 0% 100%))" : "background:transparent;color:inherit");
    b.addEventListener("click", () => {
      setItem(CONSENT_KEY, value);
      w.gtag?.("consent", "update", { analytics_storage: value });
      box.remove();
    });
    return b;
  };
  row.append(button("No thanks", "denied", false), button("Allow", "granted", true));
  box.append(text, row);
  const attach = () => document.body?.appendChild(box);
  if (document.body) attach();
  else w.addEventListener("DOMContentLoaded", attach, { once: true });
}

/** Test hook. */
export function resetWebAnalyticsForTests(): void {
  started = false;
}
