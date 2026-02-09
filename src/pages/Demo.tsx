/**
 * Demo Landing Page
 *
 * Public-facing demo experience for Tandava.
 * Showcases the platform with role-based instant access.
 *
 * Design inspiration:
 * - Linear: Clean, product-focused hero
 * - Notion: Role/persona cards
 * - Stripe: Dashboard previews
 * - Figma: Zero friction access
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo, DEMO_PERSONAS, type DemoPersona } from '@/contexts/DemoContext';
import type { UserRole } from '@/types/database';

// ============================================================================
// ICONS
// ============================================================================

const LogoIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
    <path
      d="M16 8C16 8 12 12 12 16C12 20 16 24 16 24C16 24 20 20 20 16C20 12 16 8 16 8Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="16" r="2" fill="currentColor" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const BuildingIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);

const UserGroupIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const AcademicCapIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
  </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const CreditCardIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);

const ChartIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

// ============================================================================
// ROLE ICONS
// ============================================================================

const ClipboardIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
);

const RoleIcons: Record<UserRole, React.FC<{ className?: string }>> = {
  owner: BuildingIcon,
  admin: BuildingIcon,
  front_desk: ClipboardIcon,
  teacher: AcademicCapIcon,
  student: SparklesIcon,
};

// ============================================================================
// ROLE CARDS CONFIG
// ============================================================================

interface RoleCardConfig {
  role: UserRole;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  gradient: string;
  destination: string;
}

const ROLE_CARDS: RoleCardConfig[] = [
  {
    role: 'owner',
    title: 'Studio Owner',
    subtitle: 'Run your entire business',
    description: 'Full access to scheduling, members, payments, analytics, staff management, and marketing tools.',
    features: ['Dashboard & Analytics', 'Schedule Management', 'Member CRM', 'Payments & Financials', 'Staff & Payroll', 'Marketing Campaigns'],
    gradient: 'from-stone-800 to-stone-900',
    destination: '/manage',
  },
  {
    role: 'teacher',
    title: 'Instructor',
    subtitle: 'Teach with confidence',
    description: 'View your schedule, manage sub requests, see class rosters, and track your earnings.',
    features: ['My Schedule', 'Class Rosters', 'Sub Requests', 'Earnings Tracking', 'Student Notes'],
    gradient: 'from-amber-600 to-amber-700',
    destination: '/teach',
  },
  {
    role: 'front_desk',
    title: 'Front Desk',
    subtitle: 'Streamline operations',
    description: 'Check in members, manage waitlists, and handle day-to-day studio operations.',
    features: ['Class Check-in', 'Waitlist Management', 'Member Lookup', 'QR Scan Support', 'Daily Roster'],
    gradient: 'from-violet-600 to-violet-700',
    destination: '/staff/checkin',
  },
  {
    role: 'student',
    title: 'Member',
    subtitle: 'Practice made simple',
    description: 'Browse classes, book sessions, manage your membership, and track your practice journey.',
    features: ['Browse Schedule', 'Book Classes', 'On-Demand Library', 'Practice Stats', 'Community'],
    gradient: 'from-teal-600 to-teal-700',
    destination: '/home',
  },
];

// ============================================================================
// FEATURE HIGHLIGHTS
// ============================================================================

const FEATURES = [
  {
    icon: CalendarIcon,
    title: 'Smart Scheduling',
    description: 'Recurring classes, workshops, retreats, and private sessions with waitlist management.',
  },
  {
    icon: CreditCardIcon,
    title: 'Flexible Payments',
    description: 'Memberships, class packs, drop-ins, and payment plans. Powered by Stripe Connect.',
  },
  {
    icon: ChartIcon,
    title: 'Deep Analytics',
    description: 'Understand your business with member retention, revenue trends, and class performance insights.',
  },
  {
    icon: SparklesIcon,
    title: 'On-Demand Video',
    description: 'Build your content library with live-to-recorded workflow and access control.',
  },
];

// ============================================================================
// ROLE CARD COMPONENT
// ============================================================================

interface RoleCardProps {
  config: RoleCardConfig;
  onSelect: () => void;
}

function RoleCard({ config, onSelect }: RoleCardProps) {
  const Icon = RoleIcons[config.role];

  return (
    <button
      onClick={onSelect}
      className="group relative flex flex-col text-left rounded-2xl overflow-hidden bg-white border border-stone-200 hover:border-stone-300 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* Header */}
      <div className={`bg-gradient-to-br ${config.gradient} p-6 text-white`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{config.title}</h3>
            <p className="text-sm opacity-80">{config.subtitle}</p>
          </div>
        </div>
        <p className="text-sm opacity-90 leading-relaxed">
          {config.description}
        </p>
      </div>

      {/* Features */}
      <div className="flex-1 p-6">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">
          What you'll see
        </p>
        <ul className="space-y-2">
          {config.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-stone-600">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between px-4 py-3 bg-stone-100 rounded-xl group-hover:bg-stone-200 transition-colors">
          <span className="font-medium text-stone-900">Try this view</span>
          <ArrowRightIcon className="w-5 h-5 text-stone-600 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Demo() {
  const navigate = useNavigate();
  const { switchPersona } = useDemo();

  const handleRoleSelect = (config: RoleCardConfig) => {
    // Switch to the selected persona
    switchPersona(config.role);
    // Navigate to the appropriate destination
    navigate(config.destination);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoIcon className="w-8 h-8 text-stone-800" />
            <span className="text-xl font-bold text-stone-900">Tandava</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/TaylorONeal/tandava"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              <GitHubIcon className="w-5 h-5" />
              <span className="hidden sm:inline">View on GitHub</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-6">
            <SparklesIcon className="w-4 h-4" />
            Open Source Studio Management
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 tracking-tight mb-6">
            The platform yoga studios{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-teal-600">
              deserve
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Tandava is a complete studio management platform built for yoga, pilates, and wellness studios.
            Scheduling, payments, members, marketing, analytics — all in one place.
          </p>

          <p className="text-sm text-stone-500 mb-2">
            Choose a perspective to explore the demo
          </p>
          <div className="flex justify-center">
            <svg className="w-6 h-6 text-stone-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Role Selection */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROLE_CARDS.map((config) => (
              <RoleCard
                key={config.role}
                config={config}
                onSelect={() => handleRoleSelect(config)}
              />
            ))}
          </div>

          {/* Demo studio info */}
          <div className="mt-12 text-center">
            <p className="text-sm text-stone-500">
              Demo studio: <span className="font-medium text-stone-700">Oxatl Yoga</span> — Austin, TX
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Sample data includes classes, members, transactions, and more
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white border-y border-stone-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">
              Everything you need to run your studio
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              From scheduling to payments to marketing, Tandava handles it all so you can focus on what matters — your community.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-stone-100 flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-stone-700" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-stone-900 mb-6">
            <GitHubIcon className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-stone-900 mb-4">
            Free and open source
          </h2>
          <p className="text-stone-600 max-w-xl mx-auto mb-8 leading-relaxed">
            Tandava is licensed under AGPL-3.0. Self-host it for your studio, contribute features, or fork it for your own platform.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/TaylorONeal/tandava"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800 transition-colors"
            >
              <GitHubIcon className="w-5 h-5" />
              View on GitHub
            </a>
            <a
              href="https://github.com/TaylorONeal/tandava#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-stone-900 font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors"
            >
              Read the docs
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-stone-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-stone-600">
            <LogoIcon className="w-5 h-5" />
            <span className="text-sm">Tandava — Open Source Studio Management</span>
          </div>
          <p className="text-sm text-stone-500">
            AGPL-3.0 License
          </p>
        </div>
      </footer>
    </div>
  );
}
