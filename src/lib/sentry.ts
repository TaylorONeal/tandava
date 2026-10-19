/**
 * Sentry Error Monitoring
 *
 * Initializes Sentry when VITE_SENTRY_DSN is set.
 * Does nothing when the DSN is absent — zero-config for studios
 * that don't want error monitoring.
 *
 * Source maps are uploaded at build time via @sentry/vite-plugin
 * (configured in vite.config.ts when SENTRY_AUTH_TOKEN is set).
 */

import * as Sentry from "@sentry/react";

const DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!DSN) {
    console.log("[sentry] No DSN configured — error monitoring disabled.");
    return;
  }

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    // Performance: capture 10% of transactions in production
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // No session replay: roster, auth, booking and account data are sensitive.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // Don't send in development unless explicitly configured
    enabled: Boolean(DSN),
    // Filter out noisy browser errors
    beforeSend(event) {
      // Ignore ResizeObserver loop errors (common browser noise)
      if (event.exception?.values?.[0]?.value?.includes("ResizeObserver")) {
        return null;
      }
      return event;
    },
  });
}

/** Wrap a component with Sentry's Error Boundary */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/** Log a non-fatal error to Sentry */
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (!DSN) {
    console.error("[sentry:disabled]", error, context);
    return;
  }
  if (context) {
    Sentry.setContext("additional", context);
  }
  Sentry.captureException(error);
}

/** Set the authenticated user for Sentry context */
export function setSentryUser(user: { id: string; email: string } | null) {
  if (!DSN) return;
  Sentry.setUser(user ? { id: user.id } : null);
}
