import { lazy } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/types/roles";

const Demo = lazy(() => import("./Demo"));
const OpenSource = lazy(() => import("./OpenSource"));

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

  // `isDemoMode` is true when VITE_DEMO_MODE is set OR no backend is configured.
  if (isDemoMode) return <Demo />;

  // Production: wait for the initial session check before choosing.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Anonymous visitor → the platform landing.
  if (!profile) return <OpenSource />;

  // Signed-in user → their workspace. Owners/admins manage; everyone else books.
  return hasPermission(permissions, "studio.manage_schedule")
    ? <Navigate to="/manage" replace />
    : <Navigate to="/schedule" replace />;
}
