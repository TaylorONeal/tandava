/**
 * Optional funnel sink: PostHog's capture endpoint over plain fetch, no SDK.
 * Set VITE_POSTHOG_KEY (and VITE_POSTHOG_HOST for the EU cloud or a
 * self-hosted PostHog) to turn it on; without a key, funnel events are dropped.
 * Events carry an anonymous visitor id and the funnel props, never names or emails.
 */
import type { FunnelSink } from "./funnel";

export interface PostHogSinkOptions {
  key: string;
  host?: string;
  distinctId: () => string;
  fetchImpl?: typeof fetch;
}

export function postHogSink({ key, host, distinctId, fetchImpl }: PostHogSinkOptions): FunnelSink {
  const base = (host || "https://us.i.posthog.com").replace(/\/+$/, "");
  const send = fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
  return (event, props) => {
    const body = JSON.stringify({
      api_key: key,
      event,
      distinct_id: distinctId(),
      properties: { ...props, $current_url: typeof location !== "undefined" ? location.pathname : undefined },
      timestamp: new Date().toISOString(),
    });
    void send(`${base}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  };
}

/** The sink for this build, or null when no key is configured. */
export function funnelSinkFromEnv(env: Record<string, string | undefined>, distinctId: () => string): FunnelSink | null {
  const key = env.VITE_POSTHOG_KEY?.trim();
  if (!key) return null;
  return postHogSink({ key, host: env.VITE_POSTHOG_HOST?.trim() || undefined, distinctId });
}
