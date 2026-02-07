import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Permission } from "@/types/roles";
import { hasPermission } from "@/types/roles";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Permission required to access this route */
  permission?: Permission;
  /** Redirect target when not authenticated (default: /auth/login) */
  loginRedirect?: string;
  /** Redirect target when authenticated but unauthorized (default: /) */
  unauthorizedRedirect?: string;
}

export function ProtectedRoute({
  children,
  permission,
  loginRedirect = "/auth/login",
  unauthorizedRedirect = "/",
}: ProtectedRouteProps) {
  const { user, profile, permissions, isLoading, isDemoMode } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // In demo mode, allow access to everything for development
  if (isDemoMode) {
    return <>{children}</>;
  }

  // Not authenticated
  if (!user || !profile) {
    return <Navigate to={loginRedirect} state={{ from: location }} replace />;
  }

  // Authenticated but missing required permission
  if (permission && !hasPermission(permissions, permission)) {
    return <Navigate to={unauthorizedRedirect} replace />;
  }

  return <>{children}</>;
}
