import { lazy } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/types/roles";
import { resolveStudioSlug } from "@/lib/studio-host";
import { parseHomeMode, resolveHomeTarget } from "@/lib/homeMode";

const Demo = lazy(() => import("./Demo"));
const OpenSource = lazy(() => import("./OpenSource"));
const StudioStorefront = lazy(() => import("./StudioStorefront"));
const Discover = lazy(() => import("./Discover"));

/**
 * Root route (`/`) resolver.
 *
 * The demo landing (role picker + Oxatl sample data) is the front door ONLY on
 * demo or no-backend deployments. On a real production deployment it must never
 * appear at the root — a visitor to e.g. tandavastudio.com would otherwise see
 * a fictional studio's personas instead of a real entry point.
 *
 *   demo / no backend  → the demo landing (unchanged showcase behavior)
 *   production, guest  → the platform landing ("start your studio" / try demo)
 *   production, signed in → their workspace (studio admin or member schedule)
 */
export default function Home() {
  const { isDemoMode, isLoading, profile, permissions } = useAuth();

  // Per-studio subdomain (e.g. oxatl.tandavastudio.com) → that studio's public
  // storefront. Off unless VITE_ROOT_DOMAIN is configured, so this never fires
  // on the apex, previews, localhost, or self-hosted single-domain setups.
  const studioSlug = resolveStudioSlug();

  // Decision lives in lib/homeMode.ts (pure, unit-tested). `isDemoMode` is true
  // when VITE_DEMO_MODE is set OR no backend is configured. Anonymous visitors
  // see the platform landing, or the student Discover experience when
  // VITE_HOME_MODE=discover.
  const target = resolveHomeTarget({
    studioSlug,
    isDemoMode,
    isLoading,
    hasProfile: Boolean(profile),
    canManage: hasPermission(permissions, "studio.manage_schedule"),
    homeMode: parseHomeMode(import.meta.env.VITE_HOME_MODE as string | undefined),
  });

  switch (target) {
    case "storefront":
      return <StudioStorefront slug={studioSlug!} />;
    case "demo":
      return <Demo />;
    case "loading":
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      );
    case "discover":
      return <Discover />;
    case "platform":
      return <OpenSource />;
    case "workspace-manage":
      return <Navigate to="/manage" replace />;
    case "workspace-member":
      return <Navigate to="/schedule" replace />;
  }
}
