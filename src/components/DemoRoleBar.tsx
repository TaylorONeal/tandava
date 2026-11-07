/**
 * DemoRoleBar — Prominent role indicator + switcher for demo mode
 *
 * Sits at the very top of every page (above all other headers).
 * Shows the current role with accent color and provides instant
 * one-click switching to any other role.
 *
 * Only renders when VITE_DEMO_MODE=true.
 */

import { useState } from "react";
import { GuidedTour, ROLE_TOURS } from "@/components/tour/GuidedTour";
import { useNavigate, useLocation } from "react-router-dom";
import { useDemo, DEMO_MODE_ENABLED } from "@/contexts/DemoContext";
import type { UserRole } from "@/types/database";
import {
  LayoutDashboard,
  GraduationCap,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface RoleOption {
  role: UserRole;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
  destination: string;
  accent: string;
  activeBg: string;
}

// Labels are resolved at render time via i18n
const ROLES: Omit<RoleOption, 'label' | 'shortLabel'>[] = [
  {
    role: "owner",
    icon: LayoutDashboard,
    destination: "/manage",
    accent: "text-foreground",
    activeBg: "bg-accent border-foreground/10 text-accent-foreground",
  },
  {
    role: "teacher",
    icon: GraduationCap,
    destination: "/teach",
    accent: "text-foreground",
    activeBg: "bg-accent border-foreground/10 text-accent-foreground",
  },
  {
    role: "front_desk",
    icon: ClipboardCheck,
    destination: "/staff/checkin",
    accent: "text-foreground",
    activeBg: "bg-accent border-foreground/10 text-accent-foreground",
  },
  {
    role: "student",
    icon: Sparkles,
    destination: "/home",
    accent: "text-foreground",
    activeBg: "bg-accent border-foreground/10 text-accent-foreground",
  },
];

export function DemoRoleBar() {
  if (!DEMO_MODE_ENABLED) return null;
  return <DemoRoleBarInner />;
}

function DemoRoleBarInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activePersona, switchPersona } = useDemo();
  const { t } = useTranslation('common');
  const [tourState, setTourState] = useState<{ role: string; step: number } | null>(null);
  const tour = ROLE_TOURS[activePersona.role];

  // Resolve role labels from i18n
  const roleLabelMap: Record<string, string> = {
    owner: t('demo.studioOwner'),
    teacher: t('roles.teacher'),
    front_desk: t('roles.front_desk'),
    student: t('roles.student'),
  };
  const roleShortMap: Record<string, string> = {
    owner: t('roles.owner'),
    teacher: t('roles.teacher'),
    front_desk: t('roles.front_desk'),
    student: t('roles.student'),
  };

  // Hide on landing page — role selection happens there
  if (location.pathname === "/" || location.pathname === "/demo") return null;
  // Embeddable widget + kiosk are chrome-less public surfaces.
  if (location.pathname.startsWith("/embed/") || location.pathname.startsWith("/kiosk/")) return null;

  const currentRole = ROLES.find((r) => r.role === activePersona.role) ?? ROLES[0];
  const CurrentIcon = currentRole.icon;

  const handleSwitch = (option: typeof ROLES[number]) => {
    setTourState(null);
    if (option.role === activePersona.role) {
      // Already this role — navigate to its home (refresh effect)
      navigate(option.destination);
      return;
    }
    switchPersona(option.role);
    navigate(option.destination);
  };

  return (
    <>
    <div className="sticky top-0 z-[110] bg-card/95 backdrop-blur-md border-b border-border">
      <div className="max-w-screen-2xl mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* Tandava demo branding */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-mint opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-mint" />
          </span>
          <button
            onClick={() => navigate("/")}
            className="min-h-11 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Return to demo home"
          >
            <span className="hidden sm:inline">{t('demo.title')}</span>
            <span className="sm:hidden">Demo home</span>
          </button>
          <span className="text-border hidden sm:inline">|</span>
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold", currentRole.activeBg)}>
            <CurrentIcon className="h-3 w-3" />
            <span>{roleLabelMap[currentRole.role]}</span>
          </div>
          <span className="text-xs text-muted-foreground hidden md:inline">
            {activePersona.name}
          </span>
        </div>

        {/* Role switcher buttons */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider me-2 hidden sm:inline">
            {t('demo.switchRole')}
          </span>
          {tour && <button className="min-h-11 px-2 text-xs text-foreground" onClick={() => {
            setTourState({ role: activePersona.role, step: 0 });
            navigate(tour.steps[0].route);
          }}>Take tour</button>}
          {ROLES.map((option) => {
            const Icon = option.icon;
            const isActive = option.role === activePersona.role;
            return (
              <button
                key={option.role}
                onClick={() => handleSwitch(option)}
                aria-label={`Switch to ${roleLabelMap[option.role]}`}
                aria-pressed={isActive}
                className={cn(
                  "min-h-11 min-w-11 justify-center flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                  isActive
                    ? cn("border", option.activeBg)
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{roleShortMap[option.role]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
    {tour && tourState?.role === activePersona.role && (
      <GuidedTour tour={tour} currentStep={tourState.step}
        onStepChange={(step) => setTourState({ role: activePersona.role, step })}
        onDismiss={() => setTourState(null)} />
    )}
    </>
  );
}
