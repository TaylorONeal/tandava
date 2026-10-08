import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "@/lib/backend";
import { resolveAfterAuth } from "@/lib/authReturn";
import { safeNextPath } from "@/lib/auth/next";

/**
 * Handles the OAuth redirect callback.
 * The auth provider picks up tokens from URL fragments after OAuth flows.
 * This component checks for a session and redirects to the intended page.
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));

  useEffect(() => {
    auth.getSession().then(({ user }) => {
      if (user) {
        navigate(resolveAfterAuth({ next: next === "/" ? null : next }), { replace: true });
      } else {
        navigate("/auth/login", { replace: true });
      }
    });
  }, [navigate, next]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
