import { createRoot } from "react-dom/client";
import { initSentry } from "./lib/sentry";
import { setFunnelSink } from "./lib/funnel";
import { funnelSinkFromEnv } from "./lib/funnelSink";
import { getVisitorId } from "./lib/analytics/session";
import "./i18n"; // Initialize i18n before rendering
import App from "./App.tsx";
import "./index.css";

// Initialize error monitoring (no-op when VITE_SENTRY_DSN is not set)
initSentry();

// Student funnel events go to PostHog when VITE_POSTHOG_KEY is set; otherwise dropped.
setFunnelSink(funnelSinkFromEnv(import.meta.env as Record<string, string | undefined>, () => getVisitorId()));

createRoot(document.getElementById("root")!).render(<App />);
