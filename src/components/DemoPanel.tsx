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
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
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
  ShieldCheck,
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
  platform_admin: ShieldCheck,
};

const ROLE_COLORS: Record<UserRole, string> = {
  owner: "bg-accent-gold/20 text-accent-gold border-accent-gold/30",
  admin: "bg-primary/20 text-primary border-primary/30",
  teacher: "bg-accent-sage/20 text-accent-sage border-accent-sage/30",
  front_desk: "bg-accent-coral/20 text-accent-coral border-accent-coral/30",
  student: "bg-accent-teal/20 text-[color:var(--accent-teal)] border-[color:var(--accent-teal)]/30",
  platform_admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

// Where each role should land when selected
const ROLE_DESTINATIONS: Record<UserRole, string> = {
  owner: "/manage",
  admin: "/manage",
  teacher: "/teach",
  front_desk: "/manage",
  student: "/home",
  platform_admin: "/admin",
};

// Contextual descriptions for each page
const PAGE_CONTEXT: Record<string, { title: string; description: string; techNote: string }> = {
  "/": {
    title: "Demo Landing",
    description: "Choose a role to explore the platform from different perspectives.",
    techNote: "This is the demo entry point. In production, this would be the studio's public website.",
  },
  "/home": {
    title: "Studio Home",
    description: "The main landing page — today's classes, offerings, teachers, pricing, and locations.",
    techNote: "Uses Oxatl Yoga demo data. Built from OXATL_SCHEDULE, OXATL_CLASS_TYPES, OXATL_TEACHERS, and OXATL_LOCATIONS.",
  },
  "/schedule": {
    title: "Class Schedule",
    description: "Browse, filter, and book classes. Shows classes, workshops, retreats, and private sessions.",
    techNote: "Schedule data from schedule_rules (recurring) and class_occurrences (individual). BookingModal handles payment flow.",
  },
  "/my-schedule": {
    title: "My Schedule",
    description: "View upcoming and past bookings. Cancel bookings, rate past classes.",
    techNote: "Bookings table with status: BOOKED, CHECKED_IN, CANCELED, NO_SHOW, WAITLISTED.",
  },
  "/community": {
    title: "Community & Stats",
    description: "Practice stats, streaks, leaderboards, friend connections. Gamification layer for retention.",
    techNote: "Powered by engagement_profiles table. Streaks, milestones, and friend activity computed server-side.",
  },
  "/account": {
    title: "Account Settings",
    description: "Profile info, memberships, payment methods, billing history, notification preferences.",
    techNote: "Profile stored in profiles table. Memberships link through member_memberships with entitlement tracking.",
  },
  "/on-demand": {
    title: "On-Demand Library",
    description: "Browse recorded classes by style, duration, and difficulty. Stream or download for offline.",
    techNote: "Video content stored in Supabase Storage with streaming via signed URLs. Progress tracking per user.",
  },
  "/studios": {
    title: "Studios",
    description: "Browse studio locations with details, photos, and class schedules per location.",
    techNote: "Studios and locations tables with RLS. Each location has rooms with capacity constraints.",
  },
  "/instructors": {
    title: "Instructors",
    description: "Meet the teaching team — bios, specialties, certifications, and schedules.",
    techNote: "Teacher profiles with specialties array. Schedule pulls from class_occurrences by teacher_id.",
  },
  // ---------- Studio Management ----------
  "/manage": {
    title: "Management Dashboard",
    description: "The owner command center — today's schedule, KPIs, alerts, and recent activity at a glance.",
    techNote: "KPIs from analytics_daily. Alerts computed from bookings, memberships, and class_occurrences.",
  },
  "/manage/schedule": {
    title: "Schedule Management",
    description: "Manage the weekly class schedule. Find subs, cancel classes, notify students.",
    techNote: "Uses schedule_rules for recurring patterns, class_occurrences for instances. Overrides don't change the rule.",
  },
  "/manage/students": {
    title: "Student Management",
    description: "Search all students — profiles, memberships, visit history, engagement status, waivers.",
    techNote: "Student list filtered by studio_id via RLS. Engagement profiles provide churn risk levels.",
  },
  "/manage/teachers": {
    title: "Teacher Management",
    description: "Manage instructor profiles, pay rates, availability, certifications, and performance.",
    techNote: "Teacher profiles with pay_rate, specialties, certification tracking. Linked to schedule via teacher_id.",
  },
  "/manage/offerings": {
    title: "Class Offerings",
    description: "Define class types — names, descriptions, durations, levels, capacity, and colors.",
    techNote: "Offerings table defines templates. class_occurrences reference offering_id for each scheduled class.",
  },
  "/manage/events": {
    title: "Events & Workshops",
    description: "Create workshops, trainings, retreats, and series with tiered pricing and registration.",
    techNote: "Events are separate from regular classes — own sessions, pricing tiers, and registration flow.",
  },
  "/manage/financials": {
    title: "Financials",
    description: "Membership types, class packs, transaction history. The financial backbone of the studio.",
    techNote: "Transactions table tracks all payments. Stripe Connect handles payment processing.",
  },
  "/manage/analytics": {
    title: "Analytics Hub",
    description: "Studio health score, benchmark comparisons, and routes to detailed analytics dashboards.",
    techNote: "Aggregates from analytics_daily, engagement_profiles, mrr_snapshots, and clv_cohorts.",
  },
  "/manage/settings": {
    title: "Studio Settings",
    description: "Configure studio info, locations, rooms, policies, branding, and integrations.",
    techNote: "Settings stored on studios table. Theme customization uses CSS custom properties.",
  },
  "/manage/import": {
    title: "Data Import",
    description: "Migrate from another platform via CSV — intelligent column mapping and data quality checks.",
    techNote: "Import connectors recognize MindBody, Momence, Walla layouts. Dry-run mode validates first.",
  },
  "/manage/onboarding": {
    title: "Studio Onboarding",
    description: "Guided setup wizard — Fresh Start, Import & Setup, or Quick Launch paths.",
    techNote: "Progress in studio_onboarding table. All steps skippable and revisitable.",
  },
  "/manage/products": {
    title: "Products",
    description: "Retail products — mats, props, merchandise. Track inventory and sales.",
    techNote: "Products table with variants, pricing, and inventory levels per location.",
  },
  "/manage/inventory": {
    title: "Inventory",
    description: "Track product stock levels across locations. Low-stock alerts and reorder points.",
    techNote: "Inventory tracked per location. Purchase orders link to vendors for restocking.",
  },
  "/manage/reports": {
    title: "Reports",
    description: "Generate detailed reports — attendance, revenue, teacher performance, retention.",
    techNote: "Reports query analytics_daily and transaction tables with date range filtering.",
  },
  "/manage/promo-codes": {
    title: "Promo Codes",
    description: "Create and manage promotional codes for discounts on memberships and class packs.",
    techNote: "Promo codes with usage limits, expiry dates, and percentage or fixed amount discounts.",
  },
  "/manage/campaigns": {
    title: "Campaigns",
    description: "Email and SMS marketing campaigns to reach students with announcements and promotions.",
    techNote: "Campaign builder with audience segmentation, scheduling, and delivery tracking.",
  },
  "/manage/tasks": {
    title: "Tasks",
    description: "Studio task management — assign and track operational to-dos for your team.",
    techNote: "Simple task system with assignment, due dates, and completion tracking.",
  },
  "/manage/sms-inbox": {
    title: "SMS Inbox",
    description: "Two-way SMS messaging with students. Send reminders, respond to questions.",
    techNote: "SMS via Twilio integration. Messages stored with conversation threading.",
  },
  "/manage/landing-pages": {
    title: "Landing Pages",
    description: "Create custom landing pages for promotions, events, and seasonal campaigns.",
    techNote: "Simple page builder with configurable sections, images, and CTAs.",
  },
  "/manage/utm-builder": {
    title: "UTM Builder",
    description: "Generate UTM-tagged links for tracking marketing campaign effectiveness.",
    techNote: "Generates UTM parameters for Google Analytics tracking. Stores link history.",
  },
  "/manage/notification-settings": {
    title: "Notification Settings",
    description: "Configure which notifications to receive and how — email, SMS, or in-app.",
    techNote: "Notification preferences per user. Provider-agnostic: Resend, SendGrid, SMTP, or console.",
  },
  // ---------- Teacher Portal ----------
  "/teach": {
    title: "Teacher Dashboard",
    description: "Your teaching overview — today's classes with check-in, upcoming schedule, tips, and sub requests.",
    techNote: "Filtered by teacher's profile_id. Shows only their classes and earnings.",
  },
  "/teach/schedule": {
    title: "Teaching Schedule",
    description: "Your full class schedule — upcoming and past classes with enrollment numbers.",
    techNote: "class_occurrences filtered by teacher_id. Shows booked/capacity for each class.",
  },
  "/teach/subs": {
    title: "Sub Management",
    description: "Request subs for your classes or pick up open sub opportunities from other teachers.",
    techNote: "Sub requests table with status tracking. Available subs matched by specialty.",
  },
  "/teach/earnings": {
    title: "Earnings",
    description: "Track your pay — base rate, tips, sub classes. Pay period summaries and history.",
    techNote: "Earnings calculated from class_occurrences with teacher pay rates plus tip allocations.",
  },
  "/teach/availability": {
    title: "Availability",
    description: "Set your weekly availability and time-off requests for scheduling.",
    techNote: "Availability stored as recurring patterns. Time-off requests go to studio owner for approval.",
  },
  "/teach/profile": {
    title: "Teacher Profile",
    description: "Edit your public teacher profile — bio, specialties, certifications, and photo.",
    techNote: "Teacher profile data visible on the public Instructors page.",
  },
  // ---------- Platform Admin ----------
  "/admin": {
    title: "Platform Admin",
    description: "Platform-wide administration — manage studios, users, billing, and system settings.",
    techNote: "Platform admin bypasses studio RLS to access all data. Separated from studio management.",
  },
};

export function DemoPanel() {
  if (!DEMO_MODE_ENABLED) return null;
  return <DemoPanelInner />;
}

function DemoPanelInner() {
  const { activePersona, personas, switchPersona, panelOpen, setPanelOpen } = useDemo();
  const location = useLocation();
  const navigate = useNavigate();
  const [showTechNotes, setShowTechNotes] = useState(false);

  // Find the best matching page context
  const currentPath = location.pathname;
  const pageContext = PAGE_CONTEXT[currentPath] ??
    Object.entries(PAGE_CONTEXT)
      .filter(([path]) => path !== "/")
      .sort((a, b) => b[0].length - a[0].length) // longest match first
      .find(([path]) => currentPath.startsWith(path))?.[1] ??
    { title: "Page", description: "Explore this section of the platform.", techNote: "Check the source code for implementation details." };

  const RoleIcon = ROLE_ICONS[activePersona.role] ?? User;

  // Handle role switch — update demo context AND navigate to the role's home
  const handleRoleSwitch = (role: UserRole) => {
    switchPersona(role);
    const destination = ROLE_DESTINATIONS[role] ?? "/home";
    navigate(destination);
  };

  if (!panelOpen) {
    return (
      <button
        onClick={() => setPanelOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[100] bg-primary text-primary-foreground px-2 py-4 rounded-l-xl shadow-lg hover:px-3 transition-all"
        title="Open demo panel"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="text-[10px] font-bold tracking-wider" style={{ writingMode: 'vertical-rl' }}>
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
              const Icon = ROLE_ICONS[persona.role] ?? User;
              const isActive = persona.role === activePersona.role;
              return (
                <button
                  key={persona.role}
                  onClick={() => handleRoleSwitch(persona.role)}
                  className={cn(
                    "flex items-center gap-3 w-full p-2.5 rounded-xl text-left transition-all text-sm",
                    isActive
                      ? `border ${ROLE_COLORS[persona.role] ?? "border-border"}`
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
