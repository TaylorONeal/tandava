/**
 * Funnel and product events: the one `track` facade for Tandava.
 *
 * Names are fixed here so dashboards and tests agree. There is deliberately no
 * vendor SDK: events go to an optional sink an operator can set (PostHog,
 * Plausible, a Supabase insert...). With no sink they are dropped.
 *
 * The first six names are the original student funnel and keep their names.
 * The rest follow the shared portfolio taxonomy (docs/ANALYTICS.md):
 * app_opened, activation_reached, key_action, paywall_viewed, purchase_started
 * and store_click. Every event carries the super properties (app, app_version,
 * platform, schema_version, install_source, install_campaign) once they are set.
 */

export type FunnelEvent =
  | "discover_viewed"
  | "discover_filtered"
  | "class_opened"
  | "checkout_started"
  | "booking_completed"
  | "first_attended"
  | "app_opened"
  | "activation_reached"
  | "key_action"
  | "paywall_viewed"
  | "purchase_started"
  | "store_click";

export type FunnelProps = Record<string, string | number | boolean | null | undefined>;
export type FunnelSink = (event: FunnelEvent, props?: FunnelProps) => void;

/** Activation actions (portfolio taxonomy): a student's first booking, a studio's first check-in. */
export type ActivationAction = "first_booking" | "first_checkin";

let sink: FunnelSink | null = null;
let superProps: FunnelProps = {};

export function setFunnelSink(next: FunnelSink | null): void {
  sink = next;
}

/** Properties added to every event. Later calls merge; event props never override them. */
export function setSuperProperties(next: FunnelProps): void {
  superProps = { ...superProps, ...next };
}

export function resetSuperProperties(): void {
  superProps = {};
}

function emit(event: FunnelEvent, props?: FunnelProps): void {
  try {
    if (!sink) return;
    const hasSuper = Object.keys(superProps).length > 0;
    sink(event, hasSuper ? { ...props, ...superProps } : props);
  } catch {
    // Analytics must never break the booking path.
  }
}

const ACTIVATED_PREFIX = "tandava.activated.";

/** Remembered per browser so activation fires once; in memory when storage is blocked. */
const activatedInMemory = new Set<string>();

function activatedBefore(action: ActivationAction): boolean {
  if (activatedInMemory.has(action)) return true;
  try {
    return window.localStorage.getItem(ACTIVATED_PREFIX + action) === "1";
  } catch {
    return false;
  }
}

function rememberActivation(action: ActivationAction): void {
  activatedInMemory.add(action);
  try {
    window.localStorage.setItem(ACTIVATED_PREFIX + action, "1");
  } catch {
    // In memory only.
  }
}

/** Test hook: forget activations remembered in memory. */
export function resetActivationMemory(): void {
  activatedInMemory.clear();
}

/**
 * activation_reached, once per browser per action. PostHog's "first time"
 * filters dedupe across devices; this keeps one browser from repeating it.
 */
export function trackActivation(action: ActivationAction): void {
  // With analytics off nothing is remembered, so turning it on later still counts.
  if (!sink || activatedBefore(action)) return;
  rememberActivation(action);
  emit("activation_reached", { action });
}

export function trackFunnel(event: FunnelEvent, props?: FunnelProps): void {
  emit(event, props);
  // Shared-taxonomy events derived from the funnel, so existing call sites
  // need no change and the original names stay as they are.
  try {
    if (event === "booking_completed" && props?.status !== "waitlisted") {
      emit("key_action", { action: "booking" });
      trackActivation("first_booking");
    } else if (event === "checkout_started") {
      emit("purchase_started", { product_id: typeof props?.kind === "string" ? props.kind : undefined });
    }
  } catch {
    // Never break the caller.
  }
}

/** A check-in the server confirmed (staff or teacher side): the studio's core action. */
export function trackCheckin(): void {
  emit("key_action", { action: "checkin" });
  trackActivation("first_checkin");
}
