/**
 * DEMO MODE — For the live demo site only.
 *
 * This file powers the interactive demo at demo.tandava.yoga (or wherever you host it).
 * It lets visitors switch between roles (Owner, Admin, Teacher, Front Desk, Student)
 * to experience the platform from different perspectives without real authentication.
 *
 * DEMO STUDIO: Oxatl Yoga (Austin, TX)
 * - Owner: Mariana Trench
 * - Front Desk: Cassia Ray
 * - Teachers: Beyonce Pangolin, Adele Capybara, Travis Jones, etc.
 *
 * HOW TO DISABLE FOR YOUR STUDIO:
 * ──────────────────────────────
 * 1. Set VITE_DEMO_MODE=false in your .env (or just don't set it — it defaults to off)
 * 2. That's it. The DemoPanel won't render, and the DemoProvider passes through normally.
 *
 * You can also safely delete this file, DemoPanel.tsx, and src/data/demo/ entirely
 * if you want to remove demo code from your fork. Just remove the <DemoProvider>
 * wrapper in App.tsx.
 */

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { UserRole, Profile, Studio } from '@/types/database';
import {
  OXATL_STUDIO,
  OXATL_OWNER,
  OXATL_FRONT_DESK,
  OXATL_TEACHERS,
  OXATL_MEMBERS,
  OXATL_STATS,
} from '@/data/demo/oxatl-yoga';

// ============================================================================
// Check if demo mode is enabled via environment variable
// ============================================================================
export const DEMO_MODE_ENABLED = import.meta.env.VITE_DEMO_MODE === 'true';

// ============================================================================
// Demo Studio
// ============================================================================
export const DEMO_STUDIO: Studio = OXATL_STUDIO;

// ============================================================================
// Demo personas — using Oxatl Yoga staff
// ============================================================================
export interface DemoPersona {
  role: UserRole;
  label: string;
  name: string;
  email: string;
  description: string;
  canAccess: string[];
  profileId: string;
}

// Pick a sample teacher for the teacher persona
const sampleTeacher = OXATL_TEACHERS[0]; // Beyonce Pangolin
// Pick a sample student from members
const sampleStudent = OXATL_MEMBERS[0];

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    role: 'owner',
    label: 'Studio Owner',
    name: OXATL_OWNER.profile.display_name!,
    email: OXATL_OWNER.profile.email,
    profileId: OXATL_OWNER.profile.id,
    description: 'Full access to everything — settings, financials, analytics, staff management, and all student-facing features.',
    canAccess: ['Dashboard', 'Schedule', 'Students', 'Teachers', 'Offerings', 'Events', 'Promo Codes', 'Financials', 'Landing Pages', 'Reports', 'Analytics', 'Campaigns', 'Tasks', 'Import', 'Settings', 'All student pages'],
  },
  {
    role: 'front_desk',
    label: 'Front Desk',
    name: OXATL_FRONT_DESK.profile.display_name!,
    email: OXATL_FRONT_DESK.profile.email,
    profileId: OXATL_FRONT_DESK.profile.id,
    description: 'Check students in, process walk-in purchases, manage waitlists, handle day-of operations.',
    canAccess: ['Dashboard', 'Schedule', 'Students', 'Check-in', 'Tasks', 'All student pages'],
  },
  {
    role: 'teacher',
    label: 'Teacher',
    name: sampleTeacher.profile.display_name!,
    email: sampleTeacher.profile.email,
    profileId: sampleTeacher.profile.id,
    description: `View your schedule, manage sub requests, see class rosters, track earnings. Teaches ${sampleTeacher.specialties.join(', ')}.`,
    canAccess: ['Teach Dashboard', 'My Schedule', 'Sub Requests', 'Earnings', 'All student pages'],
  },
  {
    role: 'student',
    label: 'Student',
    name: sampleStudent.profile.display_name!,
    email: sampleStudent.profile.email,
    profileId: sampleStudent.profile.id,
    description: 'Browse classes, book sessions, manage membership, view practice history, connect with community.',
    canAccess: ['Schedule', 'My Schedule', 'Studios', 'Instructors', 'Community', 'On-Demand', 'Account'],
  },
];

// ============================================================================
// Demo profile generators
// ============================================================================
function getProfileForPersona(persona: DemoPersona): Profile {
  // Find the actual profile from demo data
  if (persona.role === 'owner') {
    return OXATL_OWNER.profile;
  }
  if (persona.role === 'front_desk') {
    return OXATL_FRONT_DESK.profile;
  }
  if (persona.role === 'teacher') {
    return sampleTeacher.profile;
  }
  if (persona.role === 'student') {
    return sampleStudent.profile;
  }

  // Fallback
  const [first, last] = persona.name.split(' ');
  return {
    id: persona.profileId,
    first_name: first,
    last_name: last ?? '',
    display_name: persona.name,
    email: persona.email,
    phone: '+1 (512) 555-0100',
    avatar_url: null,
    date_of_birth: '1990-01-01',
    pronouns: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    bio: persona.description,
    specialties: [],
    certifications: [],
    instagram_handle: null,
    website: null,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };
}

// ============================================================================
// Context
// ============================================================================
interface DemoContextType {
  isDemoMode: boolean;
  demoStudio: Studio;
  demoStats: typeof OXATL_STATS;
  activePersona: DemoPersona;
  activeProfile: Profile;
  personas: DemoPersona[];
  switchPersona: (role: UserRole) => void;
  tourStep: number | null;
  setTourStep: (step: number | null) => void;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [activeRole, setActiveRole] = useState<UserRole>('owner');
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(DEMO_MODE_ENABLED);

  const activePersona = useMemo(
    () => DEMO_PERSONAS.find(p => p.role === activeRole) ?? DEMO_PERSONAS[0],
    [activeRole]
  );
  const activeProfile = useMemo(
    () => getProfileForPersona(activePersona),
    [activePersona]
  );

  const switchPersona = useCallback((role: UserRole) => {
    setActiveRole(role);
  }, []);

  // If demo mode is disabled, just render children without context
  if (!DEMO_MODE_ENABLED) {
    return <>{children}</>;
  }

  return (
    <DemoContext.Provider
      value={{
        isDemoMode: true,
        demoStudio: DEMO_STUDIO,
        demoStats: OXATL_STATS,
        activePersona,
        activeProfile,
        personas: DEMO_PERSONAS,
        switchPersona,
        tourStep,
        setTourStep,
        panelOpen,
        setPanelOpen,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  // If not in demo mode, return a safe default
  if (context === undefined) {
    const defaultPersona = DEMO_PERSONAS[0];
    return {
      isDemoMode: false,
      demoStudio: DEMO_STUDIO,
      demoStats: OXATL_STATS,
      activePersona: defaultPersona,
      activeProfile: getProfileForPersona(defaultPersona),
      personas: DEMO_PERSONAS,
      switchPersona: () => {},
      tourStep: null,
      setTourStep: () => {},
      panelOpen: false,
      setPanelOpen: () => {},
    };
  }
  return context;
}

// ============================================================================
// Demo Data Access Helpers
// ============================================================================

/**
 * Get all demo teachers for display in teacher lists
 */
export function getDemoTeachers() {
  return OXATL_TEACHERS;
}

/**
 * Get demo members for display in student/member lists
 */
export function getDemoMembers(limit?: number) {
  return limit ? OXATL_MEMBERS.slice(0, limit) : OXATL_MEMBERS;
}

/**
 * Get a specific demo teacher by ID
 */
export function getDemoTeacherById(id: string) {
  return OXATL_TEACHERS.find(t => t.profile.id === id);
}

/**
 * Get a specific demo member by ID
 */
export function getDemoMemberById(id: string) {
  return OXATL_MEMBERS.find(m => m.profile.id === id);
}
