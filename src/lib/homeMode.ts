/**
 * Root route (`/`) decision, extracted as a pure function so it can be tested.
 *
 * Order matters and is unchanged from the original Home.tsx:
 *   1. studio subdomain       → that studio's storefront
 *   2. demo / no backend      → demo landing
 *   3. session still loading  → spinner
 *   4. signed out             → platform landing OR Discover (VITE_HOME_MODE)
 *   5. signed in              → their workspace
 *
 * VITE_HOME_MODE=discover makes the student Discover experience the front door.
 * Default is "platform" so nothing changes until an operator opts in (flip it
 * once enough studios are live; see docs/plans/2026-10-04-launch-v1.md).
 */

export type HomeMode = "platform" | "discover";

export type HomeTarget =
  | "storefront"
  | "demo"
  | "loading"
  | "discover"
  | "platform"
  | "workspace-manage"
  | "workspace-member";

export function parseHomeMode(value: string | undefined | null): HomeMode {
  return value?.trim().toLowerCase() === "discover" ? "discover" : "platform";
}

export interface HomeInputs {
  studioSlug: string | null;
  isDemoMode: boolean;
  isLoading: boolean;
  hasProfile: boolean;
  canManage: boolean;
  homeMode: HomeMode;
}

export function resolveHomeTarget(i: HomeInputs): HomeTarget {
  if (i.studioSlug) return "storefront";
  if (i.isDemoMode) return "demo";
  if (i.isLoading) return "loading";
  if (!i.hasProfile) return i.homeMode === "discover" ? "discover" : "platform";
  return i.canManage ? "workspace-manage" : "workspace-member";
}

/**
 * Where a signed-in visitor's workspace starts. Managers go to /manage.
 * Students go to /discover: /schedule and /my-schedule still show sample
 * data until they are wired to the live backend (LP-4).
 */
export function workspacePath(target: "workspace-manage" | "workspace-member"): string {
  return target === "workspace-manage" ? "/manage" : "/discover";
}

/** Studio name in the manage header: the owner's studio when live, the sample studio in the demo. */
export function manageHeaderName(live: boolean, myStudioName: string | null | undefined, demoName: string): string {
  return live ? (myStudioName ?? "") : demoName;
}
