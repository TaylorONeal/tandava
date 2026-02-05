/**
 * DEMO PANEL — For the live demo site only.
 *
 * This floating side panel lets visitors switch between roles and shows
 * contextual information about what they're seeing. It only renders when
 * VITE_DEMO_MODE=true.
 *
 * HOW TO REMOVE:
 * Delete this file and remove the <DemoPanel /> from App.tsx.
 * Or just set VITE_DEMO_MODE=false — the panel won't render.
 */

import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  ChevronLeft,
  Github,
  ExternalLink,
  User,
  Shield,
  GraduationCap,
  Headphones,
  Users,
  Info,
  Code2,
  Rocket,
  X,
} from "lucide-react";
import { useDemo, DEMO_MODE_ENABLED } from "@/contexts/DemoContext";
import type { UserRole } from "@/types/database";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<UserRole, typeof User> = {
  owner: Shield,
  admin: Headphones,
  teacher: GraduationCap,
  front_desk: Users,
  student: User,
};

const ROLE_COLORS: Record<UserRole, string> = {
  owner: "bg-accent-gold/20 text-accent-gold border-accent-gold/30",
  admin: "bg-primary/20 text-primary border-primary/30",
  teacher: "bg-accent-sage/20 text-accent-sage border-accent-sage/30",
  front_desk: "bg-accent-coral/20 text-accent-coral border-accent-coral/30",
  student: "bg-accent-teal/20 text-[color:var(--accent-teal)] border-[color:var(--accent-teal)]/30",
};

// Contextual descriptions for each page
const PAGE_CONTEXT: Record<string, { title: string; description: string; techNote: string }> = {
  "/": {
    title: "Student Home",
    description: "The main landing page students see. Shows upcoming classes, stats, studios, and personalized recommendations.",
    techNote: "Built with React components. Engagement nudges and newsletter signup are conditionally rendered based on user behavior data.",
  },
  "/schedule": {
    title: "Class Schedule",
    description: "Students browse, filter, and book classes here. Supports search by style, level, teacher, and time.",
    techNote: "Schedule data comes from schedule_rules (recurring) and class_occurrences (individual). Filtering happens client-side for speed.",
  },
  "/community": {
    title: "Community & Stats",
    description: "Practice tracking, friend connections, leaderboards. The gamification layer — designed to be energizing, not pushy.",
    techNote: "Powered by engagement_profiles table. Streaks, milestones, and friend activity are computed server-side.",
  },
  "/manage": {
    title: "Management Dashboard",
    description: "The owner/admin command center. Today's schedule, key metrics, alerts, and recent activity at a glance.",
    techNote: "KPIs query analytics_daily for aggregated metrics. Alerts are computed from bookings, memberships, and class_occurrences.",
  },
  "/manage/schedule": {
    title: "Schedule Management",
    description: "Manage recurring class rules, handle sub requests, cancel classes. The operational heart of the studio.",
    techNote: "Uses schedule_rules for recurring patterns and class_occurrences for individual instances. Overrides don't change the rule.",
  },
  "/manage/students": {
    title: "Student Management",
    description: "Search and manage all students. View profiles, memberships, visit history, and engagement status.",
    techNote: "Student list with RLS filtering by studio_id. Engagement profiles provide risk levels for retention management.",
  },
  "/manage/events": {
    title: "Events & Workshops",
    description: "Create and manage workshops, trainings, retreats, and series. First-class event entities with tiered pricing.",
    techNote: "Events are separate from regular classes — they have their own sessions, pricing tiers, and registration flow.",
  },
  "/manage/financials": {
    title: "Financials",
    description: "Membership types, class packs, and transaction history. The financial backbone of studio operations.",
    techNote: "Transactions table tracks all payments. Stripe Connect handles multi-tenant payment processing.",
  },
  "/manage/analytics": {
    title: "Analytics Hub",
    description: "The analytics home page. Provides a studio health score, benchmark comparisons, and routes to detailed dashboards.",
    techNote: "Aggregates data from analytics_daily, engagement_profiles, mrr_snapshots, and clv_cohorts tables.",
  },
  "/manage/settings": {
    title: "Studio Settings",
    description: "Configure studio info, locations, policies, branding, payment processing, and notifications.",
    techNote: "Settings are stored on the studios table. Theme customization uses CSS custom properties that override the base theme.",
  },
  "/manage/import": {
    title: "Data Import",
    description: "Migrate data from another platform using CSV with intelligent column mapping and data quality checks.",
    techNote: "Import connectors recognize common column layouts. Dry-run mode validates without saving. Duplicates matched by email.",
  },
  "/manage/onboarding": {
    title: "Studio Onboarding",
    description: "Guided setup wizard with three paths: Fresh Start, Import & Setup, and Quick Launch. Can run in test mode.",
    techNote: "Progress tracked in studio_onboarding table. All steps are skippable and revisitable. Saves progress automatically.",
  },
};

export function DemoPanel() {
  // Don't render anything if demo mode is off
  if (!DEMO_MODE_ENABLED) return null;

  return <DemoPanelInner />;
}

function DemoPanelInner() {
  const { activePersona, personas, switchPersona, panelOpen, setPanelOpen } = useDemo();
  const location = useLocation();
  const [showTechNotes, setShowTechNotes] = useState(false);

  // Find the best matching page context
  const currentPath = location.pathname;
  const pageContext = PAGE_CONTEXT[currentPath] ??
    Object.entries(PAGE_CONTEXT).find(([path]) =>
      currentPath.startsWith(path) && path !== "/"
    )?.[1] ??
    { title: "Page", description: "Explore this section of the platform.", techNote: "Check the source code for implementation details." };

  const RoleIcon = ROLE_ICONS[activePersona.role];

  if (!panelOpen) {
    return (
      <button
        onClick={() => setPanelOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[100] bg-primary text-primary-foreground px-2 py-4 rounded-l-xl shadow-lg hover:px-3 transition-all"
        title="Open demo panel"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="text-[10px] font-bold tracking-wider writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>
          DEMO
        </span>
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 z-[100] bg-card border-l border-border shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-border p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">T</span>
            </div>
            <div>
              <p className="text-sm font-bold">Tandava Demo</p>
              <Badge variant="outline" className="text-[9px] mt-0.5">Interactive Preview</Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPanelOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Role Switcher */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Viewing as
          </p>
          <div className="space-y-1.5">
            {personas.map((persona) => {
              const Icon = ROLE_ICONS[persona.role];
              const isActive = persona.role === activePersona.role;
              return (
                <button
                  key={persona.role}
                  onClick={() => switchPersona(persona.role)}
                  className={cn(
                    "flex items-center gap-3 w-full p-2.5 rounded-xl text-left transition-all text-sm",
                    isActive
                      ? `border ${ROLE_COLORS[persona.role]}`
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium text-xs", isActive && "text-foreground")}>{persona.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{persona.name}</p>
                  </div>
                  {isActive && (
                    <Badge variant="outline" className="text-[9px] shrink-0">Active</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Current Page Context */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Info className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              What you're seeing
            </p>
          </div>
          <Card>
            <CardContent className="p-3 space-y-2">
              <p className="text-sm font-semibold">{pageContext.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{pageContext.description}</p>

              {/* Role access note */}
              <div className="pt-1">
                <div className="flex items-center gap-1.5">
                  <RoleIcon className="h-3 w-3 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground">
                    {activePersona.role === 'student'
                      ? "Students see the public-facing experience"
                      : `${activePersona.label}s can access this page`}
                  </p>
                </div>
              </div>

              {/* Tech notes toggle */}
              <button
                onClick={() => setShowTechNotes(!showTechNotes)}
                className="flex items-center gap-1.5 text-[10px] text-primary hover:underline pt-1"
              >
                <Code2 className="h-3 w-3" />
                {showTechNotes ? "Hide" : "Show"} technical details
              </button>
              {showTechNotes && (
                <div className="p-2 rounded-lg bg-secondary/50 text-[10px] text-muted-foreground leading-relaxed">
                  {pageContext.techNote}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Access for current role */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {activePersona.label} can access
          </p>
          <div className="flex flex-wrap gap-1">
            {activePersona.canAccess.map((item) => (
              <Badge key={item} variant="secondary" className="text-[10px]">
                {item}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Getting Started */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Rocket className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Run your own
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Tandava is open-source and free to self-host. You can have your own studio platform running in under an hour.
            </p>

            <div className="space-y-1.5">
              <StepItem number={1} text="Clone the repo from GitHub" />
              <StepItem number={2} text="Run npm install && npm run dev" />
              <StepItem number={3} text="Set up Supabase (local or hosted)" />
              <StepItem number={4} text="Connect Stripe for payments" />
              <StepItem number={5} text="Customize your branding and go live" />
            </div>

            <p className="text-[10px] text-muted-foreground pt-1">
              No coding experience? Check our step-by-step guide for using AI coding tools to customize Tandava.
            </p>
          </div>
        </div>

        <Separator />

        {/* Links */}
        <div className="space-y-2">
          <a
            href="https://github.com/TaylorONeal/tandava"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-sm font-medium"
          >
            <Github className="h-4 w-4" />
            <span className="flex-1">View on GitHub</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
          <a
            href="https://github.com/TaylorONeal/tandava/tree/main/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-sm font-medium"
          >
            <Info className="h-4 w-4" />
            <span className="flex-1">Documentation</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        </div>

        {/* Footer */}
        <div className="pt-2 pb-4">
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            AGPL-3.0 Licensed. Your studio, your data, your freedom.
          </p>
        </div>
      </div>
    </div>
  );
}

function StepItem({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary shrink-0">
        {number}
      </span>
      <span className="text-[11px]">{text}</span>
    </div>
  );
}
