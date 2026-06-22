/**
 * Demo Landing Page — Tandava Open Source Studio Management
 *
 * The FIRST thing visitors see. Explains what the project is, who it's for,
 * shows features, then invites visitors to explore the platform by choosing a role.
 *
 * Flow: Project intro → Who it's for → Feature showcase → Role picker → FAQ → About
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDemo } from "@/contexts/DemoContext";
import type { UserRole } from "@/types/database";
import {
  OXATL_STUDIO,
  OXATL_LOCATIONS,
  OXATL_TEACHERS,
  OXATL_CLASS_TYPES,
} from "@/data/demo";
import {
  Calendar,
  MapPin,
  Users,
  LayoutDashboard,
  GraduationCap,
  ClipboardCheck,
  Sparkles,
  ArrowRight,
  Github,
  ChevronDown,
  ChevronUp,
  Code2,
  Database,
  Shield,
  CreditCard,
  BarChart3,
  BookOpen,
  ExternalLink,
  Server,
  Lock,
  Zap,
  ListChecks,
  Bell,
  Receipt,
  QrCode,
  UserCheck,
  RotateCcw,
  Video,
  FileBarChart,
  Megaphone,
  Upload,
  CheckCircle2,
  GitFork,
  Terminal,
  Layers,
} from "lucide-react";

// ============================================================================
// ROLE CARDS
// ============================================================================

interface RoleConfig {
  role: UserRole;
  title: string;
  description: string;
  icon: typeof LayoutDashboard;
  destination: string;
  accent: string;
  bg: string;
  features: string[];
}

const ROLES: RoleConfig[] = [
  {
    role: "owner",
    title: "Studio Owner",
    description: "Run your entire studio from one dashboard",
    icon: LayoutDashboard,
    destination: "/manage",
    accent: "text-amber-400",
    bg: "from-amber-500/20 to-amber-600/5 hover:from-amber-500/30 hover:to-amber-600/10 border-amber-500/20 hover:border-amber-400/40",
    features: [
      "Schedule management",
      "Revenue & analytics",
      "Member CRM",
      "Teacher management",
    ],
  },
  {
    role: "teacher",
    title: "Instructor",
    description: "Focus on teaching, not admin",
    icon: GraduationCap,
    destination: "/teach",
    accent: "text-blue-400",
    bg: "from-blue-500/20 to-blue-600/5 hover:from-blue-500/30 hover:to-blue-600/10 border-blue-500/20 hover:border-blue-400/40",
    features: [
      "Check-in students",
      "Earnings tracking",
      "Sub requests",
      "Availability",
    ],
  },
  {
    role: "front_desk",
    title: "Front Desk",
    description: "Streamlined daily operations",
    icon: ClipboardCheck,
    destination: "/staff/checkin",
    accent: "text-violet-400",
    bg: "from-violet-500/20 to-violet-600/5 hover:from-violet-500/30 hover:to-violet-600/10 border-violet-500/20 hover:border-violet-400/40",
    features: [
      "Quick check-in",
      "Waitlist management",
      "Member lookup",
      "Class rosters",
    ],
  },
  {
    role: "student",
    title: "Member",
    description: "Book classes, track your practice",
    icon: Sparkles,
    destination: "/home",
    accent: "text-teal-400",
    bg: "from-teal-500/20 to-teal-600/5 hover:from-teal-500/30 hover:to-teal-600/10 border-teal-500/20 hover:border-teal-400/40",
    features: [
      "Browse & filter classes",
      "Memberships & packs",
      "Practice streaks",
      "Community",
    ],
  },
];

// ============================================================================
// FAQ DATA
// ============================================================================

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Who is Tandava for?",
    answer:
      "Studios with an internal engineering team, technical founder, or trusted dev partner. Developer-led collectives building studio software together. If you don't have someone who can deploy and maintain a web app, this is not ready for you yet — but we're working on making it more accessible over time.",
  },
  {
    question: "Is this actually free?",
    answer:
      "Yes. Tandava is licensed under AGPL-3.0. You can self-host it forever at no cost. The code is fully open — every line is auditable. If you modify the source and make it available over a network, you share your modifications under the same license.",
  },
  {
    question: "How is this different from MindBody or Momence?",
    answer:
      "Your data stays yours — run it on your own infrastructure. No per-member pricing that scales against you. No features hidden behind enterprise tiers. Export everything, anytime, in standard formats. And the code is open, so if something doesn't work for your studio, you change it.",
  },
  {
    question: "What's the tech stack?",
    answer:
      "React 18 + TypeScript + Vite on the frontend with shadcn/ui + Tailwind CSS. Supabase (PostgreSQL + Auth + Storage + Edge Functions) on the backend. Stripe Connect (Standard) for payments. Row-Level Security for multi-tenant isolation. Static SPA — deploy on Vercel, Netlify, or any host.",
  },
  {
    question: "What's the current status?",
    answer:
      "The UI and workflows are complete and interactive. Payment processing (Stripe Connect), authentication (Supabase Auth), and email/SMS notifications are architecturally ready but need configuration for your deployment. This demo shows everything the platform does.",
  },
  {
    question: "Can I contribute?",
    answer:
      "Yes. We welcome bug fixes, documentation improvements, new export formats, and connector improvements. Read CONTRIBUTING.md first — it explains the project's core bias toward deployability and what kinds of contributions are prioritized.",
  },
];

// ============================================================================
// PLATFORM FEATURES
// ============================================================================

const FEATURE_HIGHLIGHTS = [
  {
    icon: Calendar,
    label: "Smart Scheduling",
    description: "Recurring classes, one-off changes, subs, and multi-location",
  },
  {
    icon: Users,
    label: "Member Management",
    description:
      "Profiles, visit history, engagement scores, lifecycle tracking",
  },
  {
    icon: CreditCard,
    label: "Payments",
    description:
      "Stripe Connect — memberships, class packs, drop-ins, workshops",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    description:
      "Revenue, attendance, retention, teacher performance, churn prediction",
  },
  {
    icon: QrCode,
    label: "Check-In",
    description: "Kiosk mode, QR codes, front desk manual, teacher-led",
  },
  {
    icon: Upload,
    label: "Data Migration",
    description: "Import from MindBody, Momence, Walla, Arketa, WellnessLiving",
  },
  {
    icon: Shield,
    label: "Multi-Tenant",
    description:
      "Row-Level Security — each studio's data is completely isolated",
  },
  {
    icon: Database,
    label: "Data Portability",
    description: "Export everything, anytime. QuickBooks, Xero, CSV",
  },
];

const FEATURE_CATEGORIES = [
  {
    title: "Scheduling & Classes",
    features: [
      {
        icon: Calendar,
        name: "Class Scheduling",
        description: "Recurring rules, one-off changes, multi-location",
        demoRoute: "/manage/schedule",
        demoRole: "owner" as UserRole,
      },
      {
        icon: RotateCcw,
        name: "Sub Management",
        description: "Teachers request subs, qualified instructors notified",
        demoRoute: "/teach/subs",
        demoRole: "teacher" as UserRole,
      },
      {
        icon: ListChecks,
        name: "Waitlist Automation",
        description: "Auto-promote when spots open",
        demoRoute: "/staff/waitlist",
        demoRole: "front_desk" as UserRole,
      },
      {
        icon: Video,
        name: "On-Demand Library",
        description: "Recorded classes with streaming and progress",
        demoRoute: "/on-demand",
        demoRole: "student" as UserRole,
      },
    ],
  },
  {
    title: "Members & Check-In",
    features: [
      {
        icon: UserCheck,
        name: "Member Profiles",
        description: "Visit history, waivers, engagement",
        demoRoute: "/manage/students",
        demoRole: "owner" as UserRole,
      },
      {
        icon: QrCode,
        name: "Self Check-In",
        description: "Kiosk, QR code, front desk manual",
        demoRoute: "/staff/checkin",
        demoRole: "front_desk" as UserRole,
      },
      {
        icon: Users,
        name: "Community & Streaks",
        description: "Practice tracking, leaderboards, milestones",
        demoRoute: "/community",
        demoRole: "student" as UserRole,
      },
      {
        icon: Bell,
        name: "Notifications",
        description: "Email, SMS, push — reminders and marketing",
        demoRoute: "/manage/notification-settings",
        demoRole: "owner" as UserRole,
      },
    ],
  },
  {
    title: "Payments & Revenue",
    features: [
      {
        icon: CreditCard,
        name: "Stripe Connect",
        description: "Memberships, packs, drop-ins, workshops",
        demoRoute: "/manage/financials",
        demoRole: "owner" as UserRole,
      },
      {
        icon: Receipt,
        name: "Memberships & Packs",
        description: "Monthly/annual, class packs, family, promos",
        demoRoute: "/manage/financials",
        demoRole: "owner" as UserRole,
      },
      {
        icon: BarChart3,
        name: "Revenue Analytics",
        description: "MRR, churn, LTV, teacher performance",
        demoRoute: "/manage/analytics",
        demoRole: "owner" as UserRole,
      },
      {
        icon: FileBarChart,
        name: "Custom Reports",
        description: "Date ranges, filters, CSV export",
        demoRoute: "/manage/reports",
        demoRole: "owner" as UserRole,
      },
    ],
  },
  {
    title: "Data & Marketing",
    features: [
      {
        icon: Upload,
        name: "Platform Migration",
        description: "Import from 6 platforms with auto-detection",
        demoRoute: "/manage/import",
        demoRole: "owner" as UserRole,
      },
      {
        icon: FileBarChart,
        name: "Accounting Exports",
        description: "QuickBooks IIF, Xero CSV, standard CSV",
        demoRoute: "/manage/financials",
        demoRole: "owner" as UserRole,
      },
      {
        icon: Megaphone,
        name: "Campaign Hub",
        description: "Email/SMS campaigns with segmentation",
        demoRoute: "/manage/campaigns",
        demoRole: "owner" as UserRole,
      },
      {
        icon: Lock,
        name: "Data Portability",
        description: "Your data is always yours. Export everything.",
        demoRoute: "/manage/connectors",
        demoRole: "owner" as UserRole,
      },
      {
        icon: Code2,
        name: "Website Embed",
        description: "Put booking on your own site — one-line script widget",
        demoRoute: "/manage/embed",
        demoRole: "owner" as UserRole,
      },
    ],
  },
];

// ============================================================================
// FAQ ACCORDION
// ============================================================================

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex min-h-12 w-full items-center justify-between p-4 text-left transition-colors hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      >
        <span className="font-medium text-sm pr-4">{item.question}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
          {item.answer}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function Demo() {
  const navigate = useNavigate();
  const { switchPersona } = useDemo();

  const handleRoleSelect = (config: RoleConfig) => {
    switchPersona(config.role);
    navigate(config.destination);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ================================================================ */}
      {/* TOP BAR — Tandava Open Source Demo                               */}
      {/* ================================================================ */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0712]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400/60 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
              </span>
              <span className="text-sm font-semibold text-white/90">
                Tandava Open Source Studio Demo
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/TaylorONeal/tandava"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Github className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <Link
              to="/blog"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Blog</span>
            </Link>
            <a
              href="#explore"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <span>Try Demo</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* HERO — What is Tandava                                           */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Code2 className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">
                Open Source · AGPL-3.0 · Self-Hosted
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-tight mb-6 leading-[1.1]">
              Studio management software you{" "}
              <span className="text-primary">fork, deploy, and own</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mb-8">
              Tandava is open-source scheduling, membership, payment, and
              analytics software for yoga, pilates, and movement studios. No
              vendor lock-in. No per-member pricing. Your data stays yours.
            </p>

            <div className="mb-10 flex flex-wrap gap-3">
              <a
                href="#explore"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Explore the Demo
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/TaylorONeal/tandava"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Github className="w-4 h-4" />
                View Source
              </a>
            </div>

            {/* Quick stats */}
            <ul className="grid max-w-3xl gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground sm:grid-cols-2">
              <li className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-primary" />
                React + TypeScript + Vite
              </li>
              <li className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-primary" />
                Supabase (PostgreSQL)
              </li>
              <li className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-primary" />
                Stripe Connect
              </li>
              <li className="flex items-center gap-1.5">
                <GitFork className="w-4 h-4 text-primary" />
                Fork & Deploy
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* WHO THIS IS FOR / NOT FOR                                        */}
      {/* ================================================================ */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-border/80 bg-background/70 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent-sage" />
                Built for
              </h2>
              <ul className="space-y-3">
                {[
                  "Studios with a technical founder or engineering team",
                  "Developer-led collectives building studio tools together",
                  "Studios with a trusted dev partner for deployment",
                  "Technical evaluators exploring what studio software should look like",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4 text-accent-sage shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border/80 bg-background/70 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-muted-foreground" />
                Not yet for
              </h2>
              <ul className="space-y-3">
                {[
                  "Non-technical studio owners without dev support",
                  "Studios expecting hosted SaaS or guided onboarding",
                  "Anyone looking for a turnkey Mindbody replacement",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <span className="w-4 h-4 shrink-0 mt-0.5 text-center text-xs text-muted-foreground/50">
                      —
                    </span>
                    {item}
                  </li>
                ))}
                <li className="text-xs text-muted-foreground/70 pl-6 pt-1">
                  We aspire to make this more accessible over time, with the
                  community.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FEATURE HIGHLIGHTS — Quick overview                              */}
      {/* ================================================================ */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-display font-semibold mb-2">
            What you get
          </h2>
          <p className="text-muted-foreground mb-8">
            Everything a studio needs — scheduling, payments, analytics, and
            more
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_HIGHLIGHTS.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.label}
                  className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{feat.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* EXPLORE THE PLATFORM — Role Picker                               */}
      {/* ================================================================ */}
      <section
        id="explore"
        className="border-t border-border bg-gradient-to-b from-card/50 to-background"
      >
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-semibold mb-3">
              Explore the platform
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              This demo loads{" "}
              <strong className="text-foreground">{OXATL_STUDIO.name}</strong>,
              a fictional Austin studio with {OXATL_LOCATIONS.length} locations,{" "}
              {OXATL_TEACHERS.length} teachers, and {OXATL_CLASS_TYPES.length}{" "}
              class types. Pick a role to see how Tandava works for everyone.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((config) => {
              const Icon = config.icon;
              return (
                <button
                  key={config.role}
                  onClick={() => handleRoleSelect(config)}
                  className={`group relative min-h-[320px] text-left rounded-2xl border bg-gradient-to-br ${config.bg} p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transform-none`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-11 h-11 rounded-xl bg-card/50 flex items-center justify-center ${config.accent}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{config.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {config.description}
                  </p>
                  <ul className="space-y-1.5 mb-5">
                    {config.features.map((f) => (
                      <li
                        key={f}
                        className="text-xs text-muted-foreground flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3 h-3 text-primary/60" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div
                    className={`flex items-center gap-2 text-sm font-medium ${config.accent} transition-all group-hover:gap-3`}
                  >
                    Enter as {config.title}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FULL FEATURE LIST                                                */}
      {/* ================================================================ */}
      <section id="features" className="border-t border-border bg-card/20">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-display font-semibold mb-2">
            All features
          </h2>
          <p className="text-muted-foreground mb-8">
            Click any feature to see it in action
          </p>

          <div className="space-y-10">
            {FEATURE_CATEGORIES.map((category) => (
              <div
                key={category.title}
                className="rounded-2xl border border-border/80 bg-background/70 p-5 sm:p-6"
              >
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {category.title}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {category.features.map((feat) => {
                    const Icon = feat.icon;
                    return (
                      <button
                        key={feat.name}
                        onClick={() => {
                          switchPersona(feat.demoRole);
                          navigate(feat.demoRoute);
                        }}
                        className="group rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">
                            {feat.name}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {feat.description}
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-xs text-primary/90 transition-colors group-hover:text-primary">
                          Try it <ArrowRight className="w-3 h-3" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* WHY OPEN SOURCE                                                  */}
      {/* ================================================================ */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-display font-semibold mb-8">
            Why open source
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border bg-card">
              <Lock className="w-5 h-5 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Your Data Stays Yours</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Run it on your own infrastructure. Export everything, anytime.
                No vendor lock-in by design.
              </p>
            </div>
            <div className="p-5 rounded-xl border bg-card">
              <Server className="w-5 h-5 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Self-Hosted</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Deploy on Vercel, Netlify, or your own server. No per-member
                pricing. No features behind paywalls.
              </p>
            </div>
            <div className="p-5 rounded-xl border bg-card">
              <Zap className="w-5 h-5 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Modern Stack</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                React 18, TypeScript, Vite, shadcn/ui, Supabase, Stripe Connect.
                Production-grade architecture with RLS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* QUICK START                                                      */}
      {/* ================================================================ */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-display font-semibold mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Get started
            </h2>
            <p className="text-muted-foreground mb-6">
              Clone, install, and run in under 2 minutes
            </p>

            <div className="mb-6 overflow-x-auto rounded-xl border bg-background p-5 font-mono text-sm text-muted-foreground">
              <p className="text-primary/70">
                $ git clone https://github.com/TaylorONeal/tandava.git
              </p>
              <p className="text-primary/70">$ cd tandava && npm install</p>
              <p className="text-primary/70">
                $ echo "VITE_DEMO_MODE=true" &gt; .env.local
              </p>
              <p className="text-primary/70">$ npm run dev</p>
              <p className="mt-2 text-muted-foreground/50">
                # → http://localhost:8080
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/blog"
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/20 bg-background px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <BookOpen className="w-4 h-4" /> Blog
              </Link>
              <a
                href="https://github.com/TaylorONeal/tandava"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/20 bg-background px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Github className="w-4 h-4" /> Repository{" "}
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://github.com/TaylorONeal/tandava/blob/main/DEPLOYMENT.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/20 bg-background px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Deployment Guide <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://github.com/TaylorONeal/tandava/blob/main/ARCHITECTURE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/20 bg-background px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Architecture <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://github.com/TaylorONeal/tandava/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/20 bg-background px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Contributing <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FAQ                                                               */}
      {/* ================================================================ */}
      <section className="border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-display font-semibold mb-6">FAQ</h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <FAQAccordion key={i} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* OPEN SOURCE                                                      */}
      {/* ================================================================ */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-3xl mx-auto px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            Tandava is open-source software. Built by the community, for the community.
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* CTA — Try the Demo                                               */}
      {/* ================================================================ */}
      <section className="border-t border-border bg-gradient-to-br from-primary/10 to-background">
        <div className="max-w-6xl mx-auto px-6 py-14 text-center">
          <h2 className="text-2xl font-display font-semibold mb-3">
            Ready to explore?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            See how Tandava handles scheduling, payments, check-in, and
            analytics — with real data from a demo studio.
          </p>
          <a
            href="#explore"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Choose a Role & Explore
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FOOTER                                                           */}
      {/* ================================================================ */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Tandava</span>
            <span>·</span>
            <span>Open-source studio management</span>
          </div>
          <p className="text-xs text-muted-foreground">
            AGPL-3.0 · Self-hosted ·{" "}
            <a
              href="https://github.com/TaylorONeal/tandava"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
