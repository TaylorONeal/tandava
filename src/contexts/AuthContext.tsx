import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Profile } from "@/types/database";
import type { Permission } from "@/types/roles";
import { getPermissionsForUserRole } from "@/types/roles";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AuthState {
  session: Session | null;
  user: User | null;
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
// Demo mode fallback (when Supabase is not configured)
// ---------------------------------------------------------------------------
const DEMO_PROFILE: Profile = {
  id: "demo-user-id",
  email: "sarah@example.com",
  first_name: "Sarah",
  last_name: "Chen",
  avatar_url: null,
  role: "member",
  phone: null,
  bio: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
  marketing_consent: false,
  onboarding_completed: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isDemoMode = !isSupabaseConfigured();

  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: isDemoMode ? DEMO_PROFILE : null,
    permissions: isDemoMode ? getPermissionsForUserRole(DEMO_PROFILE.role) : [],
    isLoading: !isDemoMode,
    isDemoMode,
  });

  // -----------------------------------------------------------------------
  // Fetch user profile from Supabase
  // -----------------------------------------------------------------------
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (isDemoMode) return DEMO_PROFILE;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch profile:", error.message);
      return null;
    }
    return data;
  }, [isDemoMode]);

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
  // Auth state listener
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (isDemoMode) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      let profile: Profile | null = null;
      let permissions: Permission[] = [];

      if (user) {
        profile = await fetchProfile(user.id);
        if (profile) {
          permissions = getPermissionsForUserRole(profile.role);
        }
      }

      setState({
        session,
        user,
        profile,
        permissions,
        isLoading: false,
        isDemoMode: false,
      });
    });

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      let profile: Profile | null = null;
      let permissions: Permission[] = [];

      if (user) {
        profile = await fetchProfile(user.id);
        if (profile) {
          permissions = getPermissionsForUserRole(profile.role);
        }
      }

      setState({
        session,
        user,
        profile,
        permissions,
        isLoading: false,
        isDemoMode: false,
      });
    });

    return () => subscription.unsubscribe();
  }, [isDemoMode, fetchProfile]);

  // -----------------------------------------------------------------------
  // Auth methods
  // -----------------------------------------------------------------------
  const signInWithEmail = async (email: string, password: string) => {
    if (isDemoMode) {
      setState((prev) => ({ ...prev, profile: DEMO_PROFILE, permissions: getPermissionsForUserRole(DEMO_PROFILE.role) }));
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata: { first_name: string; last_name: string; marketing_consent?: boolean }
  ) => {
    if (isDemoMode) return { error: null };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    if (isDemoMode) {
      setState((prev) => ({ ...prev, profile: DEMO_PROFILE, permissions: getPermissionsForUserRole(DEMO_PROFILE.role) }));
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error };
  };

  const signOut = async () => {
    if (isDemoMode) {
      setState((prev) => ({ ...prev, profile: null, permissions: [], user: null, session: null }));
      return;
    }
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    if (isDemoMode) return { error: null };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-confirm`,
    });
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
