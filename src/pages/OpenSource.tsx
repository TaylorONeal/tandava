/**
 * Open Source Landing Page
 *
 * Explains Tandava as an open-source project.
 * Directs visitors to GitHub, documentation, and demo.
 *
 * Target audience:
 * - Studio owners evaluating self-hosting
 * - Developers interested in contributing
 * - Companies considering integration
 */

import { Link } from "react-router-dom";

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

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
    />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const CodeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
    />
  </svg>
);

const ServerIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z"
    />
  </svg>
);

const HeartIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
    />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
    />
  </svg>
);

const BookIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
    />
  </svg>
);

// ============================================================================
// FEATURE CARDS
// ============================================================================

const features = [
  {
    icon: ServerIcon,
    title: "Self-Host Your Data",
    description:
      "Run Tandava on your own infrastructure. Your member data, your control. No vendor lock-in.",
  },
  {
    icon: CodeIcon,
    title: "Fully Customizable",
    description:
      "Modify the source code to fit your exact needs. Add features, change workflows, integrate your tools.",
  },
  {
    icon: ShieldIcon,
    title: "No Subscription Fees",
    description:
      "Free to use, forever. Pay only for your hosting costs. Scale without per-member pricing.",
  },
  {
    icon: HeartIcon,
    title: "Community-Driven",
    description:
      "Built by studio owners, for studio owners. Contribute features back or benefit from others.",
  },
];

// ============================================================================
// WHAT'S INCLUDED
// ============================================================================

const includedFeatures = [
  "Schedule management",
  "Class bookings",
  "Student roster",
  "Teacher management",
  "Membership & packs",
  "Check-in system",
  "Analytics dashboard",
  "Multi-location support",
  "Events & workshops",
  "Teacher pay tracking",
  "Kiosk mode",
  "Mobile-responsive",
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function OpenSource() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <a
        href="#opensource-main"
        className="sr-only absolute left-4 top-4 z-[70] rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-md focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
          >
            <LogoIcon className="h-8 w-8 text-slate-900" />
            <span className="text-xl font-semibold text-slate-900">
              Tandava
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/demo"
              className="inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
            >
              Try Demo
            </Link>
            <a
              href="https://github.com/TaylorONeal/tandava"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
            >
              <GitHubIcon className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main id="opensource-main">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Open Source
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-6">
              Studio management software
              <br />
              <span className="text-slate-500">you actually own</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Tandava is a free, open-source platform for yoga, pilates, and
              movement studios. Self-host it, customize it, and never pay
              per-member fees again.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/demo"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
              >
                Try the Demo
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <a
                href="https://github.com/TaylorONeal/tandava"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
              >
                <GitHubIcon className="h-5 w-5" />
                View on GitHub
              </a>
            </div>
          </div>
        </section>

        {/* Demo Notice */}
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="mx-auto max-w-3xl text-amber-800">
              <strong>Demo Mode:</strong> This site runs with mock data from a
              fictional studio (Oxatl Yoga). No real bookings or payments are
              processed.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-900">
              Why teams choose Tandava
            </h2>
            <p className="mt-2 text-slate-600">
              Built around control, transparency, and long-term flexibility for
              studio operations.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <feature.icon className="h-8 w-8 text-slate-700 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What's Included */}
        <section className="bg-slate-50 border-y border-slate-200 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
              Everything you need to run a studio
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {includedFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <CheckIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Current Status */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Current Status
            </h2>
            <div className="space-y-5">
              <p className="text-slate-600">
                Tandava is in active development. The demo showcases the UI and
                workflows, but some features require backend integration before
                production use:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-slate-900 mb-3">
                  Working in Demo
                </h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    Full UI for scheduling, bookings, roster management
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    Role-based access (Owner, Front Desk, Teacher, Student)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    Analytics dashboard with charts
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    Multi-location support
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    Kiosk check-in mode
                  </li>
                </ul>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h4 className="font-semibold text-slate-900 mb-3">
                  Needs Backend Integration
                </h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    Payment processing (Stripe Connect ready, not connected)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    Real authentication (currently mock users)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    Email/SMS notifications
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    Data persistence (Supabase schema ready)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* For Developers */}
        <section className="bg-slate-900 text-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <CodeIcon className="h-12 w-12 mx-auto mb-6 text-slate-400" />
              <h2 className="text-2xl font-bold mb-4">Built for Developers</h2>
              <p className="text-slate-400 mb-8">
                Modern stack, clean architecture, comprehensive documentation.
              </p>
              <div className="mb-8 grid gap-4 text-left sm:grid-cols-3">
                <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-4">
                  <h4 className="font-semibold mb-2">Stack</h4>
                  <p className="text-sm text-slate-400">
                    React 18 + TypeScript + Vite
                    <br />
                    Tailwind CSS + shadcn/ui
                    <br />
                    Supabase (Postgres + Auth)
                  </p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-4">
                  <h4 className="font-semibold mb-2">Documentation</h4>
                  <p className="text-sm text-slate-400">
                    Domain model with diagrams
                    <br />
                    API architecture
                    <br />
                    Design system + tokens
                  </p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-4">
                  <h4 className="font-semibold mb-2">Quick Start</h4>
                  <p className="text-sm text-slate-400">
                    Clone, npm install
                    <br />
                    Set VITE_DEMO_MODE=true
                    <br />
                    npm run dev
                  </p>
                </div>
              </div>
              <a
                href="https://github.com/TaylorONeal/tandava"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <GitHubIcon className="h-5 w-5" />
                Get Started on GitHub
              </a>
            </div>
          </div>
        </section>

        {/* Who This Is For */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
            Who is Tandava for?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <ServerIcon className="h-6 w-6 text-slate-700" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Self-Hosting Studios
              </h3>
              <p className="text-sm text-slate-600">
                Own your data. Avoid monthly SaaS fees. Customize everything.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <CodeIcon className="h-6 w-6 text-slate-700" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Developers</h3>
              <p className="text-sm text-slate-600">
                Contribute to open source. Learn modern React patterns. Build
                integrations.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <HeartIcon className="h-6 w-6 text-slate-700" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Community</h3>
              <p className="text-sm text-slate-600">
                Studios helping studios. Share improvements. Build together.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to explore?
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Try the demo to see how Tandava works, or dive into the code on
              GitHub.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/demo"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                Try Demo
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <a
                href="https://github.com/TaylorONeal/tandava/blob/main/docs/INDEX.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-600 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <BookIcon className="h-5 w-5" />
                Read Documentation
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <LogoIcon className="h-6 w-6 text-slate-400" />
              <span className="text-slate-500 text-sm">
                Tandava is open source software
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a
                href="https://github.com/TaylorONeal/tandava"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
              >
                GitHub
              </a>
              <a
                href="https://github.com/TaylorONeal/tandava/blob/main/docs/INDEX.md"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
              >
                Docs
              </a>
              <a
                href="https://github.com/TaylorONeal/tandava/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
              >
                Contribute
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
