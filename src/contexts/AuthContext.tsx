import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth, data, isBackendConfigured } from "@/lib/backend";
import type { AuthUser, AuthError } from "@/lib/backend";
import type { Profile } from "@/types/database";
import type { Permission } from "@/types/roles";
import { getPermissionsForUserRole } from "@/types/roles";
import { useDemo } from "@/contexts/DemoContext";

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
    metadata: { first_name: string; last_name: string; marketing_consent?: boolean }
  ) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const demo = useDemo();
  const isDemoMode = demo.isDemoMode || !isBackendConfigured();

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

    const profile = await fetchProfile(userId);
    if (profile) {
      setState((prev) => ({
        ...prev,
        profile,
        permissions: getPermissionsForUserRole(profile.role),
      }));
    }
  }, [state.user?.id, fetchProfile]);

  // -----------------------------------------------------------------------
  // Auth state listener (production mode only)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (isDemoMode) return;

    const unsubscribe = auth.onAuthStateChange(async (user) => {
      let profile: Profile | null = null;
      let permissions: Permission[] = [];

      if (user) {
        profile = await fetchProfile(user.id);
        if (profile) {
          permissions = getPermissionsForUserRole(profile.role);
        }
      }

      setState({
        user,
        profile,
        permissions,
        isLoading: false,
        isDemoMode: false,
      });
    });

    // Initial session check
    auth.getSession().then(async ({ user }) => {
      let profile: Profile | null = null;
      let permissions: Permission[] = [];

      if (user) {
        profile = await fetchProfile(user.id);
        if (profile) {
          permissions = getPermissionsForUserRole(profile.role);
        }
      }

      setState({
        user,
        profile,
        permissions,
        isLoading: false,
        isDemoMode: false,
      });
    });

    return unsubscribe;
  }, [isDemoMode, fetchProfile]);

  // -----------------------------------------------------------------------
  // Auth methods
  // -----------------------------------------------------------------------
  const signInWithEmail = async (email: string, password: string) => {
    if (isDemoMode) return { error: null };
    const { error } = await auth.signInWithEmail(email, password);
    return { error };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata: { first_name: string; last_name: string; marketing_consent?: boolean }
  ) => {
    if (isDemoMode) return { error: null };
    const { error } = await auth.signUpWithEmail(email, password, metadata);
    return { error };
  };

  const signInWithGoogle = async () => {
    if (isDemoMode) return { error: null };
    const { error } = await auth.signInWithOAuth("google");
    return { error };
  };

  const signOut = async () => {
    if (isDemoMode) return;
    await auth.signOut();
  };

  const resetPassword = async (email: string) => {
    if (isDemoMode) return { error: null };
    const { error } = await auth.resetPassword(email);
    return { error };
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
        refreshProfile,
      }}
    >
      {children}
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
