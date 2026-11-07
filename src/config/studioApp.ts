/**
 * Tandava Studio, the staff app (iPhone). One switch for launch day.
 *
 * While the app is in review, every page shows "Coming soon to the App Store".
 * On launch day set VITE_STUDIO_APP_LIVE=true in Vercel (Production and
 * Preview) and redeploy. The site, the prerendered HTML, llms.txt and the
 * structured data then all show the official App Store badge and link.
 *
 * Read by the browser (import.meta.env) and by the postbuild scripts
 * (process.env), so keep this file free of browser-only imports.
 */

/** App Store Connect record "Tandava Studio", Apple ID 6831459731. */
export const STUDIO_APP_APPLE_ID = "6831459731";

export const STUDIO_APP = {
  name: "Tandava Studio",
  platform: "iPhone",
  appStoreUrl: `https://apps.apple.com/app/id${STUDIO_APP_APPLE_ID}`,
  /**
   * Apple's own hosted badge (Apple Marketing Tools). Apple asks that the
   * badge is used unaltered and only once the app is on the App Store.
   */
  badgeUrl: "https://tools.applemarketingtools.com/api/badges/download-on-the-app-store/black/en-us",
  badgeAlt: "Download on the App Store",
} as const;

/** Pure, so the browser and the build scripts read the flag the same way. */
export function isStudioAppLive(raw: string | undefined | null): boolean {
  return String(raw ?? "").trim().toLowerCase() === "true";
}

function readFlag(): string | undefined {
  // Vite inlines import.meta.env at build time. In the Node postbuild scripts
  // import.meta.env is undefined, so fall back to process.env.
  // Keep the literal `import.meta.env` so Vite can inline it.
  const viteEnv = import.meta.env as Record<string, string | undefined> | undefined;
  const fromVite = viteEnv?.VITE_STUDIO_APP_LIVE;
  if (fromVite !== undefined) return fromVite;
  const nodeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return nodeEnv?.VITE_STUDIO_APP_LIVE;
}

export const STUDIO_APP_LIVE = isStudioAppLive(readFlag());

/** The one line every page uses for the app's availability. */
export function studioAppAvailability(live: boolean = STUDIO_APP_LIVE): string {
  return live ? "On the App Store for iPhone" : "Coming soon to the App Store";
}
