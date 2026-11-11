/**
 * Website analytics switches, read once so the code and the privacy page agree.
 *
 * Every provider is off unless its value is set, so a self-hosted install sends
 * nothing to anyone until its operator opts in:
 *
 *   VITE_POSTHOG_KEY                product analytics (see src/lib/funnelSink.ts)
 *   VITE_GA4_MEASUREMENT_ID         Google Analytics 4, public marketing pages only
 *   VITE_VERCEL_ANALYTICS           Vercel Web Analytics (cookie-free). Defaults to
 *                                   on for builds that run on Vercel, off elsewhere;
 *                                   "false" turns it off on Vercel too.
 *   VITE_APP_STORE_PROVIDER_TOKEN   App Store Connect provider token (`pt`) for
 *                                   campaign links. Empty: plain store links.
 *   VITE_PLAY_STUDIO_PACKAGE        Google Play package of the Studio app, when it
 *                                   has a listing. Empty: no Play link.
 *
 * Read by the browser (import.meta.env) and by the Node prerender scripts
 * (process.env), so keep this file free of browser-only imports.
 */

type Env = Record<string, string | undefined>;

function readEnv(): Env {
  // Keep the literal `import.meta.env` so Vite can inline it.
  const viteEnv = import.meta.env as Env | undefined;
  const nodeEnv = (globalThis as { process?: { env?: Env } }).process?.env ?? {};
  return { ...nodeEnv, ...(viteEnv ?? {}) };
}

const GA4_ID = /^G-[A-Z0-9]{4,20}$/;

/** A GA4 measurement ID, or null when unset or malformed (nothing loads). */
export function parseGa4Id(raw: string | undefined | null): string | null {
  const id = String(raw ?? "").trim().toUpperCase();
  return GA4_ID.test(id) ? id : null;
}

/**
 * Vercel Web Analytics: an explicit "true"/"false" wins; otherwise on only when
 * the build ran on Vercel (where the /_vercel/insights script exists).
 */
export function resolveVercelAnalytics(explicit: string | undefined | null, onVercel: string | undefined | null): boolean {
  const v = String(explicit ?? "").trim().toLowerCase();
  if (v === "true") return true;
  if (v === "false") return false;
  return String(onVercel ?? "").trim() === "1";
}

export interface WebAnalyticsConfig {
  ga4Id: string | null;
  vercel: boolean;
  posthog: boolean;
  appStoreProviderToken: string;
  playStudioPackage: string;
}

export function webAnalyticsConfig(env: Env = readEnv()): WebAnalyticsConfig {
  return {
    ga4Id: parseGa4Id(env.VITE_GA4_MEASUREMENT_ID),
    vercel: resolveVercelAnalytics(env.VITE_VERCEL_ANALYTICS, env.VERCEL),
    posthog: Boolean(env.VITE_POSTHOG_KEY?.trim()),
    appStoreProviderToken: (env.VITE_APP_STORE_PROVIDER_TOKEN ?? "").trim(),
    playStudioPackage: (env.VITE_PLAY_STUDIO_PACKAGE ?? "").trim(),
  };
}

export const WEB_ANALYTICS = webAnalyticsConfig();
