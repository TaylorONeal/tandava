/**
 * Demo Landing — Oxatl Yoga
 *
 * The FIRST thing visitors see. This IS the landing page.
 * Built around the demo studio Oxatl Yoga with prominent role switching
 * so studio owners can explore the platform from every perspective.
 *
 * Includes: demo indicator, role picker, today's schedule, class types,
 * locations, teachers, open source project info, FAQ, about section.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '@/contexts/DemoContext';
import type { UserRole } from '@/types/database';
import {
  OXATL_STUDIO,
  OXATL_LOCATIONS,
  OXATL_TEACHERS,
  OXATL_CLASS_TYPES,
  OXATL_SCHEDULE,
} from '@/data/demo';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  LayoutDashboard,
  GraduationCap,
  ClipboardCheck,
  Sparkles,
  ArrowRight,
  Github,
  Monitor,
  ChevronDown,
  ChevronUp,
  Code2,
  Database,
  Shield,
  CreditCard,
  BarChart3,
  Globe,
  BookOpen,
  ExternalLink,
  Server,
  Lock,
  Zap,
  Heart,
} from 'lucide-react';

// ============================================================================
// TODAY'S SCHEDULE (derived from Oxatl demo data)
// ============================================================================

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
const today = DAYS[new Date().getDay()];

const todaysClasses = OXATL_SCHEDULE
  .filter((slot) => slot.day === today)
  .sort((a, b) => a.time.localeCompare(b.time))
  .slice(0, 5)
  .map((slot) => {
    const classType = OXATL_CLASS_TYPES.find((c) => c.id === slot.class_type_id);
    const teacher = OXATL_TEACHERS.find((t) => t.profile.id === slot.teacher_id);
    const location = OXATL_LOCATIONS.find((l) => l.id === slot.location_id);
    return { ...slot, classType, teacher, location };
  });

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

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
}

const ROLES: RoleConfig[] = [
  {
    role: 'owner',
    title: 'Studio Owner',
    description: 'Dashboard, schedule, members, payments, analytics, marketing',
    icon: LayoutDashboard,
    destination: '/manage',
    accent: 'text-amber-400',
    bg: 'from-amber-500/20 to-amber-600/5 hover:from-amber-500/30 hover:to-amber-600/10 border-amber-500/20 hover:border-amber-400/40',
  },
  {
    role: 'teacher',
    title: 'Instructor',
    description: 'Teaching schedule, sub requests, earnings, availability',
    icon: GraduationCap,
    destination: '/teach',
    accent: 'text-blue-400',
    bg: 'from-blue-500/20 to-blue-600/5 hover:from-blue-500/30 hover:to-blue-600/10 border-blue-500/20 hover:border-blue-400/40',
  },
  {
    role: 'front_desk',
    title: 'Front Desk',
    description: 'Check-in members, manage waitlists, daily roster',
    icon: ClipboardCheck,
    destination: '/staff/checkin',
    accent: 'text-violet-400',
    bg: 'from-violet-500/20 to-violet-600/5 hover:from-violet-500/30 hover:to-violet-600/10 border-violet-500/20 hover:border-violet-400/40',
  },
  {
    role: 'student',
    title: 'Member',
    description: 'Browse classes, book sessions, track practice, community',
    icon: Sparkles,
    destination: '/home',
    accent: 'text-teal-400',
    bg: 'from-teal-500/20 to-teal-600/5 hover:from-teal-500/30 hover:to-teal-600/10 border-teal-500/20 hover:border-teal-400/40',
  },
];

// ============================================================================
// FAQ DATA
// ============================================================================

interface FAQItem {
  question: string;
  answer: string;
  audience: 'studio' | 'developer' | 'both';
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is Tandava?",
    answer: "Tandava is open-source studio management software for yoga, pilates, and movement studios. It handles scheduling, memberships, payments, check-in, analytics, and operations — all self-hosted and under your control. No vendor lock-in, no per-member pricing, no data you can't export.",
    audience: 'both',
  },
  {
    question: "Is this actually free?",
    answer: "Yes. Tandava is licensed under AGPL-3.0. You can self-host it for free, forever. The code is fully open — every line is auditable. If you modify the source and make it available over a network, you share your modifications under the same license.",
    audience: 'both',
  },
  {
    question: "What does my studio get?",
    answer: "Full scheduling with recurring classes and substitutions. Membership and class pack management. Student profiles with visit history. Teacher management with pay rates. Check-in with kiosk mode and QR codes. Analytics dashboards for attendance, revenue, and retention. Event and workshop management. Data import from MindBody, Momence, Walla, and others.",
    audience: 'studio',
  },
  {
    question: "How is this different from MindBody or Momence?",
    answer: "Your data stays yours — run it on your own infrastructure or use managed hosting. Export everything, anytime, in standard formats. No per-member pricing that scales against you. No features hidden behind enterprise tiers. And the code is open, so if something doesn't work for your studio, you can change it.",
    audience: 'studio',
  },
  {
    question: "What's the tech stack?",
    answer: "React 18 + TypeScript + Vite on the frontend with shadcn/ui + Tailwind CSS. Supabase (PostgreSQL + Auth + Storage) on the backend. Stripe Connect for payments. Row-Level Security for multi-tenant isolation. The entire app runs as a static SPA that you can deploy on Vercel, Netlify, or any static host.",
    audience: 'developer',
  },
  {
    question: "Can I contribute?",
    answer: "Absolutely. We welcome bug fixes, performance improvements, new export formats, connector improvements, tests, refactors, and documentation. The project values contributions that solve real problems studios face, reduce complexity, and improve correctness. Start with an issue or discussion for anything beyond a small fix.",
    audience: 'developer',
  },
  {
    question: "What about data portability?",
    answer: "Tandava is built on a foundational principle: business records generated by a studio's operations are owned and controlled by the studio. We're building toward a standardized data interchange format so moving to or from Tandava is straightforward. All data structures are vendor-agnostic and model universal business concepts.",
    audience: 'both',
  },
  {
    question: "What's the current status?",
    answer: "The UI and workflows are complete — scheduling, bookings, roster management, role-based access, analytics, and demo mode all work. Payment processing (Stripe Connect), real authentication, email/SMS notifications, and full data persistence are in integration phase. This demo shows everything the platform can do.",
    audience: 'both',
  },
];

// ============================================================================
// PLATFORM FEATURES
// ============================================================================

const PLATFORM_FEATURES = [
  { icon: Calendar, label: "Scheduling", description: "Recurring classes, subs, cancellations" },
  { icon: Users, label: "Members", description: "Profiles, visit history, waivers" },
  { icon: CreditCard, label: "Payments", description: "Stripe Connect, memberships, packs" },
  { icon: BarChart3, label: "Analytics", description: "Attendance, revenue, retention" },
  { icon: Shield, label: "Multi-tenant", description: "Row-Level Security isolation" },
  { icon: Database, label: "Your Data", description: "Self-hosted, export everything" },
  { icon: Code2, label: "Open Source", description: "AGPL-3.0, fully auditable" },
  { icon: Globe, label: "Import", description: "MindBody, Momence, Walla, CSV" },
];

// ============================================================================
// FAQ ACCORDION COMPONENT
// ============================================================================

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-card/50 transition-colors"
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
  const [faqFilter, setFaqFilter] = useState<'all' | 'studio' | 'developer'>('all');

  const handleRoleSelect = (config: RoleConfig) => {
    switchPersona(config.role);
    navigate(config.destination);
  };

  const filteredFAQ = FAQ_ITEMS.filter(
    (item) => faqFilter === 'all' || item.audience === faqFilter || item.audience === 'both'
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ================================================================ */}
      {/* DEMO INDICATOR BANNER                                            */}
      {/* ================================================================ */}
      <div className="sticky top-0 z-50 bg-primary/95 backdrop-blur-sm text-primary-foreground">
        <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground/60 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-foreground" />
              </span>
              <span className="text-sm font-semibold">Interactive Demo</span>
            </div>
            <span className="hidden sm:inline text-xs opacity-80">
              Exploring Tandava with sample data from Oxatl Yoga (Austin, TX)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/TaylorONeal/tandava"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity bg-primary-foreground/15 rounded-full px-3 py-1"
            >
              <Github className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Source</span>
            </a>
            <a
              href="#about-tandava"
              className="text-xs font-medium hover:opacity-80 transition-opacity bg-primary-foreground/15 rounded-full px-3 py-1"
            >
              About
            </a>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* HERO — Oxatl Yoga + Role Picker                                 */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

        <div className="relative max-w-6xl mx-auto px-6 pt-10 pb-16">
          {/* Studio header */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="text-lg font-display font-bold text-primary">O</span>
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold">{OXATL_STUDIO.name}</h2>
              <p className="text-xs text-muted-foreground">Austin, Texas</p>
            </div>
          </div>

          {/* Main headline */}
          <div className="max-w-3xl mb-12">
            <p className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Powered by Tandava — Open Source Studio Management
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-tight mb-5">
              {OXATL_STUDIO.name}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              {OXATL_STUDIO.description}
            </p>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {OXATL_LOCATIONS.length} locations
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {OXATL_TEACHERS.length} teachers
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {OXATL_CLASS_TYPES.length} class types
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* ROLE PICKER — The main interaction                           */}
          {/* ============================================================ */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-1">Explore the platform</h2>
            <p className="text-sm text-muted-foreground">
              Choose a role to see how Tandava works for everyone in the studio
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLES.map((config) => {
              const Icon = config.icon;
              return (
                <button
                  key={config.role}
                  onClick={() => handleRoleSelect(config)}
                  className={`group relative text-left rounded-2xl border bg-gradient-to-br ${config.bg} p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-card/50 flex items-center justify-center ${config.accent}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{config.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {config.description}
                  </p>
                  <div className={`flex items-center gap-2 text-sm font-medium ${config.accent} group-hover:gap-3 transition-all`}>
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
      {/* TODAY'S SCHEDULE                                                 */}
      {/* ================================================================ */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Today at Oxatl</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={() => { switchPersona('student'); navigate('/schedule'); }}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Full schedule <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todaysClasses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {todaysClasses.map((cls, i) => (
              <button
                key={i}
                onClick={() => { switchPersona('student'); navigate('/schedule'); }}
                className="text-left p-4 rounded-xl border bg-card hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cls.classType?.color || "#888" }}
                  />
                  <span className="text-sm font-medium truncate">{cls.classType?.name}</span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(cls.time)} · {cls.classType?.duration_minutes}min
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {cls.teacher?.profile.display_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {cls.location?.name}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground rounded-xl border bg-card">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No classes today. Check the full schedule.</p>
          </div>
        )}
      </section>

      {/* ================================================================ */}
      {/* CLASS TYPES + LOCATIONS                                          */}
      {/* ================================================================ */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Class types */}
          <div>
            <h2 className="text-lg font-semibold mb-4">What We Offer</h2>
            <div className="grid grid-cols-2 gap-3">
              {OXATL_CLASS_TYPES.map((ct) => (
                <div key={ct.id} className="p-3 rounded-xl border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ct.color }} />
                    <span className="text-sm font-medium">{ct.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{ct.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{ct.duration_minutes} min</p>
                </div>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Our Locations</h2>
            <div className="space-y-3">
              {OXATL_LOCATIONS.map((loc) => (
                <div key={loc.id} className="p-4 rounded-xl border bg-card">
                  <h3 className="font-medium mb-1">{loc.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {loc.address_line1}, {loc.city}, {loc.state} {loc.postal_code}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{loc.rooms.map((r) => r.name).join(", ")}</span>
                    <span>· Capacity: {loc.capacity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* OUR TEACHERS                                                     */}
      {/* ================================================================ */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <h2 className="text-lg font-semibold mb-4">Our Teachers</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {OXATL_TEACHERS.slice(0, 8).map((teacher) => (
            <div key={teacher.profile.id} className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {teacher.profile.first_name?.[0]}{teacher.profile.last_name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{teacher.profile.display_name}</p>
                  <p className="text-xs text-muted-foreground">{teacher.pay_type === 'per_class' ? 'Per-class' : 'Hourly'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {teacher.specialties.slice(0, 2).map((s) => (
                  <span key={s} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/* ABOUT TANDAVA — Open Source Project Panel                        */}
      {/* ================================================================ */}
      <section id="about-tandava" className="border-t border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-center gap-3 mb-2">
            <Code2 className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-display font-semibold">About Tandava</h2>
          </div>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Open-source studio management for yoga, pilates, and movement studios.
            Scheduling, memberships, payments, check-in, analytics — all self-hosted, all under your control.
          </p>

          {/* Feature grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {PLATFORM_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.label} className="flex items-start gap-3 p-4 rounded-xl border bg-card">
                  <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{feat.label}</p>
                    <p className="text-xs text-muted-foreground">{feat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Philosophy cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="p-5 rounded-xl border bg-card">
              <Lock className="w-5 h-5 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Your Data Stays Yours</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Run it on your own infrastructure. Export everything, anytime, in standard formats. No vendor lock-in by design.
              </p>
            </div>
            <div className="p-5 rounded-xl border bg-card">
              <Server className="w-5 h-5 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Self-Hosted</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Deploy on Vercel, Netlify, or your own server. No per-member pricing that scales against you. No features behind enterprise tiers.
              </p>
            </div>
            <div className="p-5 rounded-xl border bg-card">
              <Zap className="w-5 h-5 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Modern Stack</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                React 18, TypeScript, Vite, shadcn/ui, Supabase, Stripe Connect. Production-grade architecture with Row-Level Security.
              </p>
            </div>
          </div>

          {/* Quick start + links */}
          <div className="p-6 rounded-xl border bg-card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Quick Start
            </h3>
            <div className="bg-background rounded-lg p-4 mb-4 font-mono text-sm text-muted-foreground">
              <p>git clone https://github.com/TaylorONeal/tandava.git</p>
              <p>cd tandava && npm install</p>
              <p>echo "VITE_DEMO_MODE=true" &gt; .env.local</p>
              <p>npm run dev</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/TaylorONeal/tandava"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Github className="w-4 h-4" />
                GitHub Repository
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://github.com/TaylorONeal/tandava/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Contributing Guide
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://github.com/TaylorONeal/tandava/blob/main/DATA_INTEROPERABILITY.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Data Interoperability
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://github.com/TaylorONeal/tandava/tree/main/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Full Documentation
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FAQ                                                               */}
      {/* ================================================================ */}
      <section className="border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-display font-semibold mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground mb-6">
            Common questions from studio owners and developers
          </p>

          {/* Audience filter */}
          <div className="flex gap-2 mb-6">
            {([
              { value: 'all' as const, label: 'All' },
              { value: 'studio' as const, label: 'For Studios' },
              { value: 'developer' as const, label: 'For Developers' },
            ]).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFaqFilter(tab.value)}
                className={`text-sm px-4 py-1.5 rounded-full transition-colors ${
                  faqFilter === tab.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredFAQ.map((item, i) => (
              <FAQAccordion key={i} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* ABOUT THE CREATOR                                                */}
      {/* ================================================================ */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-display font-bold text-primary shrink-0">
              TO
            </div>
            <div>
              <h2 className="text-xl font-display font-semibold mb-1">Taylor O'Neal</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Product Management, Yoga Practitioner
              </p>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-4">
                <p>
                  I build digital products and practice yoga. Both require systems thinking,
                  creative problem-solving, and a deep respect for the people you serve.
                </p>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Yoga Roots</h3>
                  <p>
                    I did my 200-hour Yoga Teacher Training in Seattle, WA. I have a full resume of workshops
                    and trainings from places like Koh Phangan, Thailand and Whidbey Island. I always struggled
                    with the overwhelming number of options and the challenge of actually practicing and memorizing
                    sequences. More than that, I wanted to understand how to describe cueing, transitions, deepening,
                    and activations. That's why I built{' '}
                    <a href="https://cuecraftyoga.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      CueCraft Yoga
                    </a>
                    {' '}— and it's the same practitioner-first mindset behind Tandava.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Product & Systems Background</h3>
                  <p>
                    I have master's degrees in business and tech. From digital transformation to product management
                    for websites, apps, and e-commerce, I work with both a systems mindset and a creative one —
                    that started back in high school designing websites for punk bands. I bring an integration mindset
                    to every product I touch, combining user insights, data storytelling, and cross-functional leadership
                    to design experiences that drive both engagement and revenue.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Teaching & Content</h3>
                  <p>
                    I also teach Product Management and Digital Analytics at Miami University, where I built two
                    curricula and created online channels to help students use data and AI tools to build better
                    digital products faster.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-5">
                <a
                  href="https://tayloroneal.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  tayloroneal.com
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://cuecraftyoga.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Heart className="w-4 h-4" />
                  CueCraft Yoga
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://www.linkedin.com/in/tayloroneal/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  LinkedIn
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://github.com/TaylorONeal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FOOTER                                                           */}
      {/* ================================================================ */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{OXATL_STUDIO.name}</span>
            <span>·</span>
            <span>Powered by <a href="https://github.com/TaylorONeal/tandava" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Tandava</a></span>
          </div>
          <p className="text-xs text-muted-foreground">
            Open source · AGPL-3.0 · Self-hosted
          </p>
        </div>
      </footer>
    </div>
  );
}
