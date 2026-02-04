import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Profile, UserRole } from '@/types/database';

interface StudioRole {
  studio_id: string;
  studio_name: string;
  role: UserRole;
}

interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
  studio_roles: StudioRole[];
  active_studio_id: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  activeStudioId: string | null;
  activeRole: UserRole | null;
  setActiveStudio: (studioId: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isStudioStaff: () => boolean;
  isStudioAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for development - simulates an owner account
const MOCK_PROFILE: Profile = {
  id: 'mock-user-001',
  first_name: 'Sarah',
  last_name: 'Chen',
  display_name: 'Sarah Chen',
  email: 'sarah@tandava.yoga',
  phone: '+1 (415) 555-0123',
  avatar_url: null,
  date_of_birth: '1988-03-15',
  pronouns: 'she/her',
  emergency_contact_name: 'Alex Chen',
  emergency_contact_phone: '+1 (415) 555-0456',
  bio: 'Studio owner, E-RYT 500, passionate about making yoga accessible to everyone.',
  specialties: ['Vinyasa', 'Yin', 'Meditation'],
  certifications: ['E-RYT 500', 'YACEP'],
  instagram_handle: '@sarahchen.yoga',
  website: 'https://tandava.yoga',
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-12-01T00:00:00Z',
};

const MOCK_STUDIO_ROLES: StudioRole[] = [
  {
    studio_id: 'studio-001',
    studio_name: 'Tandava Yoga',
    role: 'owner',
  },
];

const MOCK_USER: AuthUser = {
  id: MOCK_PROFILE.id,
  email: MOCK_PROFILE.email,
  profile: MOCK_PROFILE,
  studio_roles: MOCK_STUDIO_ROLES,
  active_studio_id: 'studio-001',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(MOCK_USER);
  const [isLoading, setIsLoading] = useState(false);

  const activeStudioId = user?.active_studio_id ?? null;

  const activeRole = user?.studio_roles.find(
    (r) => r.studio_id === activeStudioId
  )?.role ?? null;

  const setActiveStudio = useCallback((studioId: string) => {
    setUser((prev) => prev ? { ...prev, active_studio_id: studioId } : null);
  }, []);

  const signIn = useCallback(async (_email: string, _password: string) => {
    setIsLoading(true);
    // In production: call supabase.auth.signInWithPassword
    // Then fetch profile and studio roles
    await new Promise((r) => setTimeout(r, 500));
    setUser(MOCK_USER);
    setIsLoading(false);
  }, []);

  const signUp = useCallback(async (_email: string, _password: string, _firstName: string, _lastName: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setUser(MOCK_USER);
    setIsLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    setUser(null);
    setIsLoading(false);
  }, []);

  const hasRole = useCallback((role: UserRole) => {
    if (!user || !activeStudioId) return false;
    const studioRole = user.studio_roles.find((r) => r.studio_id === activeStudioId);
    if (!studioRole) return false;
    const hierarchy: UserRole[] = ['owner', 'admin', 'teacher', 'front_desk', 'student'];
    return hierarchy.indexOf(studioRole.role) <= hierarchy.indexOf(role);
  }, [user, activeStudioId]);

  const isStudioStaff = useCallback(() => {
    return hasRole('front_desk');
  }, [hasRole]);

  const isStudioAdmin = useCallback(() => {
    return hasRole('admin');
  }, [hasRole]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        activeStudioId,
        activeRole,
        setActiveStudio,
        signIn,
        signUp,
        signOut,
        hasRole,
        isStudioStaff,
        isStudioAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
