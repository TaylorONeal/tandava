import { createRoot } from "react-dom/client";
import { initSentry } from "./lib/sentry";
import { setFunnelSink, setSuperProperties, trackFunnel } from "./lib/funnel";
import { funnelSinkFromEnv } from "./lib/funnelSink";
import { getVisitorId } from "./lib/analytics/session";
import { consumeFirstOpen, superPropertiesFor } from "./lib/analytics/appContext";
import { analyticsOptedOut, applySelfExclusion, initWebAnalytics } from "./lib/analytics/web";
import { WEB_ANALYTICS } from "./config/analytics";
import { resolveStudioSlug } from "./lib/studio-host";
import { parseHomeMode } from "./lib/homeMode";
import "./i18n"; // Initialize i18n before rendering
import App from "./App.tsx";
import "./index.css";

// Initialize error monitoring (no-op when VITE_SENTRY_DSN is not set)
initSentry();

// Product analytics (funnel + shared taxonomy) go to PostHog when VITE_POSTHOG_KEY
// is set; otherwise dropped. `?notrack=1` turns it off in this browser.
const env = import.meta.env as Record<string, string | undefined>;
applySelfExclusion(window.location.search);
const funnelSink = analyticsOptedOut() ? null : funnelSinkFromEnv(env, () => getVisitorId());
setFunnelSink(funnelSink);
if (funnelSink) {
  setSuperProperties(superPropertiesFor({ env, url: window.location.href, referrer: document.referrer }));
  trackFunnel("app_opened", { first_open: consumeFirstOpen() });
}

// Vercel Web Analytics (public pages) and GA4 (marketing pages only). Both off
// unless configured; see src/config/analytics.ts and docs/ANALYTICS.md.
initWebAnalytics({
  config: WEB_ANALYTICS,
  rootIsMarketing: !resolveStudioSlug() && parseHomeMode(env.VITE_HOME_MODE) === "platform",
});

createRoot(document.getElementById("root")!).render(<App />);
