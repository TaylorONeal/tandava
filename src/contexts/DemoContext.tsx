/**
 * DEMO MODE — For the live demo site only.
 *
 * This file powers the interactive demo at demo.tandava.yoga (or wherever you host it).
 * It lets visitors switch between roles (Owner, Admin, Teacher, Front Desk, Student)
 * to experience the platform from different perspectives without real authentication.
 *
 * HOW TO DISABLE FOR YOUR STUDIO:
 * ──────────────────────────────
 * 1. Set VITE_DEMO_MODE=false in your .env (or just don't set it — it defaults to off)
 * 2. That's it. The DemoPanel won't render, and the DemoProvider passes through normally.
 *
 * You can also safely delete this file and DemoPanel.tsx entirely if you want to
 * remove demo code from your fork. Just remove the <DemoProvider> wrapper in App.tsx.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { UserRole, Profile } from '@/types/database';

// ============================================================================
// Check if demo mode is enabled via environment variable
// ============================================================================
export const DEMO_MODE_ENABLED = import.meta.env.VITE_DEMO_MODE === 'true';

// ============================================================================
// Demo personas — one for each role
// ============================================================================
export interface DemoPersona {
  role: UserRole;
  label: string;
  name: string;
  email: string;
  description: string;
  canAccess: string[];
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    role: 'owner',
    label: 'Studio Owner',
    name: 'Sarah Chen',
    email: 'sarah@tandava.yoga',
    description: 'Full access to everything — settings, financials, analytics, staff management, and all student-facing features.',
    canAccess: ['Dashboard', 'Schedule', 'Students', 'Teachers', 'Offerings', 'Events', 'Promo Codes', 'Financials', 'Landing Pages', 'Reports', 'Analytics', 'Import', 'Settings', 'All student pages'],
  },
  {
    role: 'admin',
    label: 'Studio Admin',
    name: 'David Park',
    email: 'david@tandava.yoga',
    description: 'Day-to-day management — schedule, students, check-ins, reports. Cannot change billing or studio settings.',
    canAccess: ['Dashboard', 'Schedule', 'Students', 'Teachers', 'Offerings', 'Events', 'Reports', 'All student pages'],
  },
  {
    role: 'teacher',
    label: 'Teacher',
    name: 'Maya Patel',
    email: 'maya@tandava.yoga',
    description: 'View their own schedule, manage sub requests, see class rosters, track their pay.',
    canAccess: ['My Schedule', 'Class Rosters', 'Sub Requests', 'Pay History', 'All student pages'],
  },
  {
    role: 'front_desk',
    label: 'Front Desk',
    name: 'Jordan Blake',
    email: 'jordan@tandava.yoga',
    description: 'Check students in, process walk-in purchases, manage waitlists, handle day-of operations.',
    canAccess: ['Dashboard', 'Schedule', 'Students', 'Check-in', 'All student pages'],
  },
  {
    role: 'student',
    label: 'Student',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    description: 'Browse classes, book sessions, manage membership, track practice stats, connect with community.',
    canAccess: ['Schedule', 'My Schedule', 'Studios', 'Instructors', 'Community', 'On-Demand', 'Account'],
  },
];

// ============================================================================
// Demo profile generators
// ============================================================================
function makeProfile(persona: DemoPersona): Profile {
  const [first, last] = persona.name.split(' ');
  return {
    id: `demo-${persona.role}-001`,
    first_name: first,
    last_name: last,
    display_name: persona.name,
    email: persona.email,
    phone: '+1 (415) 555-0100',
    avatar_url: null,
    date_of_birth: '1990-01-01',
    pronouns: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    bio: persona.description,
    specialties: persona.role === 'teacher' ? ['Vinyasa', 'Yin', 'Meditation'] : [],
    certifications: persona.role === 'teacher' ? ['RYT-500'] : [],
    instagram_handle: null,
    website: null,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-12-01T00:00:00Z',
  };
}

// ============================================================================
// Context
// ============================================================================
interface DemoContextType {
  isDemoMode: boolean;
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

  const activePersona = DEMO_PERSONAS.find(p => p.role === activeRole) ?? DEMO_PERSONAS[0];
  const activeProfile = makeProfile(activePersona);

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
    return {
      isDemoMode: false,
      activePersona: DEMO_PERSONAS[0],
      activeProfile: makeProfile(DEMO_PERSONAS[0]),
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
