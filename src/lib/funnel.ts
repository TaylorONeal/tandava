/**
 * Student funnel events (growth-ux: acquisition → activation).
 *
 * Names are fixed here so dashboards and tests agree. There is deliberately no
 * vendor SDK: events go to an optional sink an operator can set (PostHog,
 * Plausible, a Supabase insert...). With no sink they are dropped.
 */

export type FunnelEvent =
  | "discover_viewed"
  | "discover_filtered"
  | "class_opened"
  | "checkout_started"
  | "booking_completed"
  | "first_attended";

export type FunnelProps = Record<string, string | number | boolean | null | undefined>;
export type FunnelSink = (event: FunnelEvent, props?: FunnelProps) => void;

let sink: FunnelSink | null = null;

export function setFunnelSink(next: FunnelSink | null): void {
  sink = next;
}

export function trackFunnel(event: FunnelEvent, props?: FunnelProps): void {
  try {
    sink?.(event, props);
  } catch {
    // Analytics must never break the booking path.
  }
}
