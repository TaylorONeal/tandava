/**
 * Studio Theming System
 *
 * Allows each studio to customize the consumer-facing (student) experience
 * with different color schemes, fonts, and visual styles. The management
 * dashboard always uses the default Tandava theme for consistency.
 *
 * Studios can:
 * 1. Choose a starter theme (Mystic Night, Morning Light, Clean Studio)
 * 2. Override individual colors (primary, secondary, accent)
 * 3. Upload a custom logo
 * 4. Choose a display font
 *
 * Theme customization is stored on the studio record and applied via
 * CSS custom properties at runtime.
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// ============================================================================
// Theme definitions
// ============================================================================

export interface StudioTheme {
  id: string;
  name: string;
  description: string;
  previewColors: string[]; // 4 colors for the preview card
  cssVariables: Record<string, string>;
}

export const STARTER_THEMES: StudioTheme[] = [
  {
    id: 'mystic-night',
    name: 'Mystic Night',
    description: 'Dark, contemplative. Teal and coral accents with deep backgrounds. The default Tandava look.',
    previewColors: ['#0f172a', '#4fd1c5', '#f687b3', '#d4a574'],
    cssVariables: {
      '--bg-primary': '#0a0e1a',
      '--bg-secondary': '#111827',
      '--bg-card': '#141c2e',
      '--text-primary': '#e8edf5',
      '--text-secondary': '#94a3b8',
      '--text-muted': '#64748b',
      '--accent-teal': '#4fd1c5',
      '--accent-coral': '#f687b3',
      '--accent-gold': '#d4a574',
      '--accent-sage': '#7d9e6a',
      '--primary': '174 60% 51%',
      '--primary-foreground': '220 20% 8%',
      '--background': '222 47% 6%',
      '--foreground': '220 20% 93%',
      '--card': '222 36% 13%',
      '--card-foreground': '220 20% 93%',
      '--secondary': '217 33% 17%',
      '--secondary-foreground': '220 20% 93%',
      '--muted': '217 33% 17%',
      '--muted-foreground': '215 20% 55%',
      '--accent': '217 33% 17%',
      '--accent-foreground': '220 20% 93%',
      '--border': '217 25% 18%',
    },
  },
  {
    id: 'morning-light',
    name: 'Morning Light',
    description: 'Warm and inviting. Cream backgrounds with sage green and earthy terracotta. Feels like sunrise yoga.',
    previewColors: ['#faf7f2', '#7d9e6a', '#c4856a', '#d4a574'],
    cssVariables: {
      '--bg-primary': '#faf7f2',
      '--bg-secondary': '#f3ede4',
      '--bg-card': '#ffffff',
      '--text-primary': '#2d2418',
      '--text-secondary': '#6b5d4f',
      '--text-muted': '#9c8e7e',
      '--accent-teal': '#7d9e6a',
      '--accent-coral': '#c4856a',
      '--accent-gold': '#d4a574',
      '--accent-sage': '#7d9e6a',
      '--primary': '100 22% 51%',
      '--primary-foreground': '40 30% 97%',
      '--background': '36 33% 96%',
      '--foreground': '30 25% 14%',
      '--card': '0 0% 100%',
      '--card-foreground': '30 25% 14%',
      '--secondary': '33 25% 92%',
      '--secondary-foreground': '30 25% 14%',
      '--muted': '33 25% 92%',
      '--muted-foreground': '28 16% 50%',
      '--accent': '33 25% 92%',
      '--accent-foreground': '30 25% 14%',
      '--border': '33 18% 86%',
    },
  },
  {
    id: 'clean-studio',
    name: 'Clean Studio',
    description: 'Minimal and modern. White space with a single bold accent color. Professional and distraction-free.',
    previewColors: ['#ffffff', '#1a1a2e', '#0ea5e9', '#f0f0f0'],
    cssVariables: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f8fafc',
      '--bg-card': '#ffffff',
      '--text-primary': '#1a1a2e',
      '--text-secondary': '#475569',
      '--text-muted': '#94a3b8',
      '--accent-teal': '#0ea5e9',
      '--accent-coral': '#f43f5e',
      '--accent-gold': '#eab308',
      '--accent-sage': '#22c55e',
      '--primary': '199 89% 48%',
      '--primary-foreground': '0 0% 100%',
      '--background': '0 0% 100%',
      '--foreground': '234 27% 14%',
      '--card': '0 0% 100%',
      '--card-foreground': '234 27% 14%',
      '--secondary': '210 40% 98%',
      '--secondary-foreground': '234 27% 14%',
      '--muted': '210 40% 96%',
      '--muted-foreground': '215 16% 47%',
      '--accent': '210 40% 96%',
      '--accent-foreground': '234 27% 14%',
      '--border': '214 32% 91%',
    },
  },
];

// ============================================================================
// Studio customization on top of a base theme
// ============================================================================

export interface StudioBranding {
  themeId: string;
  logoUrl: string | null;
  primaryColorOverride: string | null;
  secondaryColorOverride: string | null;
  fontOverride: string | null;
}

const DEFAULT_BRANDING: StudioBranding = {
  themeId: 'mystic-night',
  logoUrl: null,
  primaryColorOverride: null,
  secondaryColorOverride: null,
  fontOverride: null,
};

// ============================================================================
// Context
// ============================================================================

interface ThemeContextType {
  activeTheme: StudioTheme;
  branding: StudioBranding;
  themes: StudioTheme[];
  setTheme: (themeId: string) => void;
  setBranding: (branding: Partial<StudioBranding>) => void;
  applyTheme: () => void;
  resetToDefault: () => void;
  isManagementPage: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [branding, setBrandingState] = useState<StudioBranding>(DEFAULT_BRANDING);

  const activeTheme = STARTER_THEMES.find(t => t.id === branding.themeId) ?? STARTER_THEMES[0];

  const setTheme = useCallback((themeId: string) => {
    setBrandingState(prev => ({ ...prev, themeId }));
  }, []);

  const setBranding = useCallback((updates: Partial<StudioBranding>) => {
    setBrandingState(prev => ({ ...prev, ...updates }));
  }, []);

  const applyTheme = useCallback(() => {
    const root = document.documentElement;

    // Apply theme CSS variables
    Object.entries(activeTheme.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Apply overrides if set
    if (branding.primaryColorOverride) {
      root.style.setProperty('--accent-teal', branding.primaryColorOverride);
    }
    if (branding.secondaryColorOverride) {
      root.style.setProperty('--accent-coral', branding.secondaryColorOverride);
    }
    if (branding.fontOverride) {
      root.style.setProperty('--font-body', branding.fontOverride);
    }
  }, [activeTheme, branding]);

  const resetToDefault = useCallback(() => {
    setBrandingState(DEFAULT_BRANDING);
    // Remove inline styles to revert to CSS defaults
    const root = document.documentElement;
    Object.keys(STARTER_THEMES[0].cssVariables).forEach(key => {
      root.style.removeProperty(key);
    });
  }, []);

  // Apply theme whenever it changes
  // Only apply to student-facing pages (management always uses default)
  useEffect(() => {
    // For now, we apply theme globally. In production, this would check
    // if we're on a student-facing route and only apply there.
    applyTheme();

    return () => {
      // Cleanup: remove custom properties on unmount
      const root = document.documentElement;
      Object.keys(activeTheme.cssVariables).forEach(key => {
        root.style.removeProperty(key);
      });
    };
  }, [activeTheme, branding, applyTheme]);

  return (
    <ThemeContext.Provider
      value={{
        activeTheme,
        branding,
        themes: STARTER_THEMES,
        setTheme,
        setBranding,
        applyTheme,
        resetToDefault,
        isManagementPage: false, // Will be set by route
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
