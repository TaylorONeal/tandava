/**
 * The privacy page's analytics wording, written from the same switches the
 * code reads (src/config/analytics.ts), so the policy names exactly the
 * providers this deployment turns on.
 */
import type { WebAnalyticsConfig } from "../../config/analytics";

type Switches = Pick<WebAnalyticsConfig, "ga4Id" | "vercel" | "posthog">;

/** Providers for the "Service providers" list, in the order they appear there. */
export function analyticsProviders(c: Switches): string[] {
  const out: string[] = [];
  if (c.vercel) out.push("Vercel Web Analytics (cookie-free visit counts on public pages)");
  if (c.ga4Id) out.push("Google Analytics (visits and link clicks on our marketing pages)");
  if (c.posthog) out.push("PostHog (product analytics)");
  return out;
}

/** "a, b and c". */
export function andList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function anyAnalytics(c: Switches): boolean {
  return Boolean(c.vercel || c.ga4Id || c.posthog);
}

export function websiteAnalyticsParagraphs(c: Switches): string[] {
  const lines: string[] = [];
  if (c.vercel) {
    lines.push(
      "- Vercel Web Analytics counts visits to our public pages (this website, Discover and studio pages) without cookies. Signed-in pages are not counted.",
    );
  }
  if (c.ga4Id) {
    lines.push(
      "- Google Analytics runs only on our marketing pages, not on booking pages, accounts or the studio dashboard. It shows us which pages and links help studios find us, including clicks on App Store links. It sets first-party cookies. Google signals and ad features are off and we do not run ads. If your browser sends Do Not Track or Global Privacy Control, it does not load. In the EEA, the UK and Switzerland it stores nothing until you allow it, and you can say no.",
    );
  }
  if (c.posthog) {
    lines.push(
      "- Product analytics (PostHog) records what you do in Tandava, such as opening the app, booking a class or checking someone in, tied to a random ID. Each event also notes the app version, whether you use the website or an app, and the campaign that first brought this browser to us. It never includes your name, email or anything you type.",
    );
  }
  if (lines.length === 0) {
    return ["This site does not use website or product analytics."];
  }
  return [
    lines.join("\n"),
    "None of these use an advertising ID or track you across other companies' apps or websites. To turn them off in this browser, use the switch below.",
  ];
}
