/**
 * GuidedTour — Reusable guided tour component
 *
 * Shows a floating modal with step-by-step guidance as users navigate
 * role-specific flows. Uses DemoContext tourStep for state.
 *
 * In demo mode: tour content explains the platform to evaluating studio owners
 * In production: same component can be used for staff training with different copy
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronLeft,
  X,
  Lightbulb,
  MapPin,
} from "lucide-react";

// ============================================================================
// TOUR STEP TYPES
// ============================================================================

export interface TourStep {
  /** Route pattern this step applies to (exact match or startsWith) */
  route: string;
  /** Step title */
  title: string;
  /** Descriptive body text */
  body: string;
  /** Optional hint about what to try */
  hint?: string;
  /** Icon component */
  icon?: typeof Lightbulb;
}

export interface TourConfig {
  /** Unique tour ID for localStorage persistence */
  id: string;
  /** Tour name shown in header */
  name: string;
  /** Steps in order */
  steps: TourStep[];
}

// ============================================================================
// ROLE-SPECIFIC TOUR CONFIGS
// ============================================================================

export const OWNER_TOUR: TourConfig = {
  id: "tour-owner",
  name: "Studio Owner Tour",
  steps: [
    {
      route: "/manage",
      title: "Owner Dashboard",
      body: "This is your command center. Today's schedule, key metrics, recent activity, and alerts — everything you need at a glance. Revenue, attendance trends, and action items are all surfaced here.",
      hint: "Try clicking different date ranges on the charts or review the alerts panel.",
    },
    {
      route: "/manage/schedule",
      title: "Schedule Management",
      body: "Create and manage your class schedule with recurring rules, one-off changes, and substitutions. Each class shows enrollment, capacity, and waitlist status in real time.",
      hint: "Try adding a new class or editing an existing one.",
    },
    {
      route: "/manage/members",
      title: "Member Management",
      body: "Every member's profile, visit history, membership status, and waivers in one place. Filter by status, search by name, and click any member for their full record.",
      hint: "Try searching for a member or filtering by membership type.",
    },
    {
      route: "/manage/financials",
      title: "Financial Overview",
      body: "Memberships, class packs, transactions, and revenue tracking. See MRR, churn, and payment health. Export reports for your accountant.",
      hint: "Try the export button or switch between membership and class pack views.",
    },
    {
      route: "/manage/analytics",
      title: "Analytics & Reports",
      body: "Attendance patterns, revenue trends, teacher performance, and retention metrics. Make data-driven decisions about your schedule and pricing.",
      hint: "Explore the different analytics tabs and chart views.",
    },
    {
      route: "/manage/settings",
      title: "Studio Settings",
      body: "Configure your studio: locations, policies, branding, payment processing, notification preferences, and feature toggles. Everything is customizable.",
      hint: "Review the different settings sections to see what's configurable.",
    },
  ],
};

export const TEACHER_TOUR: TourConfig = {
  id: "tour-teacher",
  name: "Instructor Tour",
  steps: [
    {
      route: "/teach",
      title: "Instructor Dashboard",
      body: "Your personal teaching hub. See upcoming classes, recent activity, and key stats. Quick access to your schedule, sub requests, and earnings.",
      hint: "Check your upcoming classes and any pending sub requests.",
    },
    {
      route: "/teach/schedule",
      title: "Your Teaching Schedule",
      body: "All your assigned classes across locations. See enrollment numbers, request substitutes when you need coverage, and manage your teaching calendar.",
      hint: "Try requesting a sub for one of your upcoming classes.",
    },
    {
      route: "/teach/earnings",
      title: "Earnings & Pay",
      body: "Track your pay across classes, workshops, and tips. See breakdowns by period, with per-class and hourly rate visibility.",
      hint: "Switch between time periods to see earnings trends.",
    },
    {
      route: "/teach/availability",
      title: "Set Your Availability",
      body: "Tell the studio when you're available to teach. Set weekly recurring availability and manage sub preferences so the right opportunities come your way.",
      hint: "Toggle days on/off and set your preferred time ranges.",
    },
    {
      route: "/teach/profile",
      title: "Your Public Profile",
      body: "Manage what students see about you: bio, specialties, certifications, and teaching style. A strong profile helps students find and connect with you.",
      hint: "Update your bio and add specialties.",
    },
  ],
};

export const FRONTDESK_TOUR: TourConfig = {
  id: "tour-frontdesk",
  name: "Front Desk Tour",
  steps: [
    {
      route: "/staff/checkin",
      title: "Member Check-In",
      body: "The daily check-in view. See today's classes, search for members, and process check-ins. Members can also self-check-in via kiosk mode or QR code.",
      hint: "Try checking in a member from the roster.",
    },
    {
      route: "/staff/waitlist",
      title: "Waitlist Management",
      body: "When classes hit capacity, members join the waitlist. Promote members when spots open, configure auto-promotion rules, and track response deadlines.",
      hint: "Try promoting a waitlisted member and see the confirmation flow.",
    },
  ],
};

export const MEMBER_TOUR: TourConfig = {
  id: "tour-member",
  name: "Member Tour",
  steps: [
    {
      route: "/home",
      title: "Your Home",
      body: "Welcome to your practice hub. Quick-book your favorite classes, see upcoming sessions, track your practice streak, and stay connected with the community.",
      hint: "Try booking a class from the quick-book section.",
    },
    {
      route: "/schedule",
      title: "Browse Classes",
      body: "Find classes by style, teacher, time, or location. Filter and search to find your perfect practice. Click any class to see details and book your spot.",
      hint: "Try filtering by class style or searching for a teacher.",
    },
    {
      route: "/my-schedule",
      title: "Your Schedule",
      body: "All your upcoming and past bookings in one place. Cancel or modify bookings, see your waitlist status, and review your class history.",
      hint: "Check your upcoming bookings and past attendance.",
    },
    {
      route: "/account",
      title: "Your Account",
      body: "Membership details, class pack balance, billing history, and notification preferences. Everything about your account in one place.",
      hint: "Review your membership status and billing history.",
    },
  ],
};

// Map role → tour config
export const ROLE_TOURS: Record<string, TourConfig> = {
  owner: OWNER_TOUR,
  teacher: TEACHER_TOUR,
  front_desk: FRONTDESK_TOUR,
  student: MEMBER_TOUR,
};

// ============================================================================
// TOUR COMPONENT
// ============================================================================

interface GuidedTourProps {
  tour: TourConfig;
  currentStep: number;
  onStepChange: (step: number) => void;
  onDismiss: () => void;
}

export function GuidedTour({ tour, currentStep, onStepChange, onDismiss }: GuidedTourProps) {
  const location = useLocation();
  const step = tour.steps[currentStep];

  if (!step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === tour.steps.length - 1;
  const isOnCorrectPage = location.pathname === step.route || location.pathname.startsWith(step.route + "/");

  return (
    <div className="fixed bottom-6 left-6 z-[60] w-[380px] max-w-[calc(100vw-3rem)]">
      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border-b border-border">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">{tour.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} / {tour.steps.length}
            </span>
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tour.steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold mb-1.5">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{step.body}</p>

          {step.hint && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 mb-3">
              <Lightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-primary">{step.hint}</p>
            </div>
          )}

          {!isOnCorrectPage && (
            <p className="text-xs text-amber-600 mb-3">
              Navigate to this page to explore this feature.
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-4 pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStepChange(currentStep - 1)}
            disabled={isFirst}
            className="text-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Previous
          </Button>

          {isLast ? (
            <Button size="sm" onClick={onDismiss} className="text-xs">
              Finish Tour
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => onStepChange(currentStep + 1)}
              className="text-xs"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TOUR LAUNCHER — Shown once per role on first visit
// ============================================================================

interface TourLauncherProps {
  tour: TourConfig;
  onStart: () => void;
  onSkip: () => void;
}

export function TourLauncher({ tour, onStart, onSkip }: TourLauncherProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-[420px] max-w-[calc(100vw-2rem)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">{tour.name}</h2>
            <p className="text-xs text-muted-foreground">{tour.steps.length} stops</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Take a quick guided tour to see what's available in this view.
          We'll highlight key features and show you where everything is.
        </p>

        <div className="space-y-1.5 mb-6">
          {tour.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                {i + 1}
              </div>
              <span className="text-muted-foreground">{step.title}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip tour
          </Button>
          <Button size="sm" onClick={onStart}>
            Start tour
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HOOK — Manages tour state with localStorage persistence
// ============================================================================

export function useTour(role: string | null) {
  const tour = role ? ROLE_TOURS[role] : null;
  const [step, setStep] = useState<number | null>(null);
  const [showLauncher, setShowLauncher] = useState(false);

  // Check if this tour has been seen before
  useEffect(() => {
    if (!tour) return;
    const seen = localStorage.getItem(`${tour.id}-seen`);
    if (!seen) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setShowLauncher(true), 800);
      return () => clearTimeout(timer);
    }
  }, [tour]);

  const startTour = useCallback(() => {
    setShowLauncher(false);
    setStep(0);
  }, []);

  const skipTour = useCallback(() => {
    if (tour) localStorage.setItem(`${tour.id}-seen`, "true");
    setShowLauncher(false);
    setStep(null);
  }, [tour]);

  const dismissTour = useCallback(() => {
    if (tour) localStorage.setItem(`${tour.id}-seen`, "true");
    setStep(null);
  }, [tour]);

  const changeStep = useCallback((newStep: number) => {
    setStep(newStep);
  }, []);

  return {
    tour,
    step,
    showLauncher,
    startTour,
    skipTour,
    dismissTour,
    changeStep,
  };
}
