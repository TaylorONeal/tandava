/**
 * DemoRoleBar — Prominent role indicator + switcher for demo mode
 *
 * Sits at the very top of every page (above all other headers).
 * Shows the current role with accent color and provides instant
 * one-click switching to any other role.
 *
 * Only renders when VITE_DEMO_MODE=true.
 */

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

interface RoleOption {
  role: UserRole;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
  destination: string;
  accent: string;
  activeBg: string;
}

const ROLES: RoleOption[] = [
  {
    role: "owner",
    label: "Studio Owner",
    shortLabel: "Owner",
    icon: LayoutDashboard,
    destination: "/manage",
    accent: "text-amber-400",
    activeBg: "bg-amber-500/20 border-amber-400/50 text-amber-300",
  },
  {
    role: "teacher",
    label: "Instructor",
    shortLabel: "Instructor",
    icon: GraduationCap,
    destination: "/teach",
    accent: "text-blue-400",
    activeBg: "bg-blue-500/20 border-blue-400/50 text-blue-300",
  },
  {
    role: "front_desk",
    label: "Front Desk",
    shortLabel: "Front Desk",
    icon: ClipboardCheck,
    destination: "/staff/checkin",
    accent: "text-violet-400",
    activeBg: "bg-violet-500/20 border-violet-400/50 text-violet-300",
  },
  {
    role: "student",
    label: "Member",
    shortLabel: "Member",
    icon: Sparkles,
    destination: "/home",
    accent: "text-teal-400",
    activeBg: "bg-teal-500/20 border-teal-400/50 text-teal-300",
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

  // Hide on landing page — role selection happens there
  if (location.pathname === "/" || location.pathname === "/demo") return null;

  const currentRole = ROLES.find((r) => r.role === activePersona.role) ?? ROLES[0];
  const CurrentIcon = currentRole.icon;

  const handleSwitch = (option: RoleOption) => {
    if (option.role === activePersona.role) {
      // Already this role — navigate to its home (refresh effect)
      navigate(option.destination);
      return;
    }
    switchPersona(option.role);
    // Small delay to let context update, then navigate
    setTimeout(() => navigate(option.destination), 0);
  };

  return (
    <div className="sticky top-0 z-[110] bg-[#0a0712]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-screen-2xl mx-auto px-4 py-1.5 flex items-center justify-between gap-4">
        {/* Tandava demo branding */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
          </span>
          <button
            onClick={() => navigate("/")}
            className="text-xs text-white/50 hover:text-white/80 transition-colors hidden sm:inline"
          >
            Tandava Open Source Studio Demo
          </button>
          <span className="text-white/20 hidden sm:inline">|</span>
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold", currentRole.activeBg)}>
            <CurrentIcon className="h-3 w-3" />
            <span>{currentRole.label}</span>
          </div>
          <span className="text-xs text-white/40 hidden md:inline">
            {activePersona.name}
          </span>
        </div>

        {/* Role switcher buttons */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-white/30 uppercase tracking-wider mr-2 hidden sm:inline">
            Switch:
          </span>
          {ROLES.map((option) => {
            const Icon = option.icon;
            const isActive = option.role === activePersona.role;
            return (
              <button
                key={option.role}
                onClick={() => handleSwitch(option)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                  isActive
                    ? cn("border", option.activeBg)
                    : "text-white/40 hover:text-white/80 hover:bg-white/5"
                )}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{option.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
