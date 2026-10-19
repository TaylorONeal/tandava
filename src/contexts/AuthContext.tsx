import { useQueryClient } from "@tanstack/react-query";
import { createAuthCacheBoundary } from "@/lib/authCache";
import { Fragment, createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { auth, data, isBackendConfigured } from "@/lib/backend";
import type { AuthUser, AuthError, SignUpMetadata } from "@/lib/backend";
import type { Profile } from "@/types/database";
import type { Permission } from "@/types/roles";
import { getPermissionsForUserRole } from "@/types/roles";
import { useDemo } from "@/contexts/DemoContext";
import { forgetVisitor, linkVisitorOnce, resolveVisitorIdentity } from "@/lib/analytics/session";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  formatRetryAfter,
  recordFailedLoginAttempt,
} from "@/lib/security/loginRateLimit";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  permissions: Permission[];
  isLoading: boolean;
  isDemoMode: boolean;
}

interface AuthContextValue extends AuthState {
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    metadata: SignUpMetadata,
    next?: string
  ) => Promise<{ error: AuthError | null; requiresEmailConfirmation?: boolean }>;
  signInWithGoogle: (next?: string, consentNonce?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (
    email: string,
    options?: { next?: string; claim?: boolean }
  ) => Promise<{ error: AuthError | null }>;
  /** Set a password for the signed-in user; with `claim`, also marks a guest profile claimed. */
  updatePassword: (password: string, options?: { claim?: boolean }) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const boundary = useRef(createAuthCacheBoundary(queryClient)).current;
  const [cacheEpoch, setCacheEpoch] = useState(0);
  const demo = useDemo();
  const isDemoMode = demo.isDemoMode || !isBackendConfigured();

  /** The signed-in user the listener last saw, to spot a sign-out from elsewhere. */
  const lastUserId = useRef<string | null>(null);
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: isDemoMode ? { ...demo.activeProfile, role: demo.activePersona.role } : null,
    permissions: isDemoMode ? getPermissionsForUserRole(demo.activePersona.role) : [],
    isLoading: !isDemoMode,
    isDemoMode,
  });

  // -----------------------------------------------------------------------
  // Sync auth state with demo persona changes
  // When user switches role in DemoPanel, update profile + permissions
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!isDemoMode) return;
    setState((prev) => ({
      ...prev,
      profile: { ...demo.activeProfile, role: demo.activePersona.role },
      permissions: getPermissionsForUserRole(demo.activePersona.role),
    }));
    // demo.activeProfile is memoized in DemoContext
  }, [isDemoMode, demo.activePersona.role, demo.activeProfile]);

  // -----------------------------------------------------------------------
  // Fetch user profile (production mode only)
  // -----------------------------------------------------------------------
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (isDemoMode) return { ...demo.activeProfile, role: demo.activePersona.role };

    const { data: profile, error } = await data.getProfile(userId);

    if (error) {
      console.error("Failed to fetch profile:", error.message);
      return null;
    }
    return profile;
  }, [isDemoMode, demo.activeProfile, demo.activePersona.role]);

  const refreshProfile = useCallback(async () => {
    const userId = state.user?.id;
    if (!userId) return;

    const revision = boundary.revision;
    const profile = await fetchProfile(userId);
    if (profile && boundary.isCurrent(revision)) {
      setState((prev) => ({
        ...prev,
        profile,
        permissions: getPermissionsForUserRole(profile.role),
      }));
    }
  }, [state.user?.id, fetchProfile, boundary]);

  // -----------------------------------------------------------------------
  // Auth state listener (production mode only)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (isDemoMode) return;

    let active = true;
    const applyUser = async (user: AuthUser | null) => {
      if (!active) return;
      const transition = boundary.transition(user?.id ?? null);
      setCacheEpoch(transition.epoch);
      // Remove the previous profile immediately while the next read is pending.
      setState({ user, profile: null, permissions: [], isLoading: !!user, isDemoMode: false });
      if (lastUserId.current && lastUserId.current !== user?.id) forgetVisitor();
      lastUserId.current = user?.id ?? null;
      resolveVisitorIdentity(user?.id ?? null);
      if (user) void linkVisitorOnce(user.id);
      const profile = user ? await fetchProfile(user.id) : null;
      if (!active || !boundary.isCurrent(transition.revision)) return;
      setState({
        user, profile,
        permissions: profile ? getPermissionsForUserRole(profile.role) : [],
        isLoading: false, isDemoMode: false,
      });
    };
    const initialRevision = boundary.revision;
    const unsubscribe = auth.onAuthStateChange((user) => { void applyUser(user); });
    void auth.getSession().then(({ user }) => {
      // A slow initial session must not overwrite a newer auth event.
      if (active && boundary.isCurrent(initialRevision)) void applyUser(user);
    });
    return () => {
      active = false;
      boundary.invalidate();
      unsubscribe();
    };
  }, [isDemoMode, fetchProfile, boundary]);

  // -----------------------------------------------------------------------
  // Auth methods
  // -----------------------------------------------------------------------
  const signInWithEmail = async (email: string, password: string) => {
    if (isDemoMode) return { error: null };

    const rateLimit = checkLoginRateLimit(email);
    if (!rateLimit.allowed) {
      return {
        error: {
          message: `Too many login attempts. Try again in ${formatRetryAfter(rateLimit.retryAfterMs)}.`,
        },
      };
    }

    const { error } = await auth.signInWithEmail(email, password);

    if (error) {
      const attemptResult = recordFailedLoginAttempt(email);
      if (!attemptResult.allowed) {
        return {
          error: {
            message: `Too many login attempts. Try again in ${formatRetryAfter(attemptResult.retryAfterMs)}.`,
          },
        };
      }
      return { error };
    }

    clearLoginRateLimit(email);
    return { error };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata: SignUpMetadata,
    next?: string
  ) => {
    if (isDemoMode) return { error: null };
    return auth.signUpWithEmail(email, password, metadata, next);
  };

  const signInWithGoogle = async (next?: string, consentNonce?: string) => {
    if (isDemoMode) return { error: null };
    const { error } = await auth.signInWithOAuth("google", next, consentNonce);
    return { error };
  };

  const signOut = async () => {
    if (isDemoMode) return;
    const transition = boundary.transition(null);
    setCacheEpoch(transition.epoch);
    setState({ user: null, profile: null, permissions: [], isLoading: false, isDemoMode: false });
    await auth.signOut();
    forgetVisitor();
  };

  const resetPassword = async (email: string, options?: { next?: string; claim?: boolean }) => {
    if (isDemoMode) return { error: null };
    const { error } = await auth.resetPassword(email, options);
    return { error };
  };

  const updatePassword = async (password: string, options?: { claim?: boolean }) => {
    if (isDemoMode) return { error: null };
    const { error } = await auth.updatePassword(password);
    if (error) return { error };
    const userId = state.user?.id;
    if (options?.claim && userId) {
      const { error: claimError } = await data.markProfileClaimed(userId);
      await refreshProfile();
      if (claimError) {
        // The password is set, and the server already treats a guest with a
        // password as an account (get_profile_identity_by_email). Report it so
        // the page offers a retry instead of announcing success.
        return {
          error: {
            message:
              "Your password is saved, but we couldn't finish setting up your account. Try again in a moment.",
          },
        };
      }
    }
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
      }}
    >
      <Fragment key={cacheEpoch}>{children}</Fragment>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
