/**
 * Demo landing page (/demo): a sample studio for owners evaluating hosted
 * Tandava. Self-hosting and the code live on /open-source; this page points
 * there once.
 *
 * Flow: what this is -> pick a seat (owner, front desk, teacher, member) ->
 * jump straight to one screen -> who it suits -> questions -> set up yours.
 *
 * The "Enter as ..." button labels are used by the store screenshot scripts;
 * keep them stable. Look: docs/design/DESIGN_SYSTEM.md.
 */
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";
import type { UserRole } from "@/types/database";
import { STUDIO_SIGNUP_HREF } from "@/lib/audience";
import { SEOHead } from "@/components/seo/SEOHead";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { Band, CtaLink, Eyebrow } from "@/components/marketing/brand";
import { PassStub, Section, TickList } from "@/components/marketing/primitives";
import { OXATL_STUDIO, OXATL_LOCATIONS, OXATL_TEACHERS, OXATL_CLASS_TYPES } from "@/data/demo";

// ----------------------------------------------------------------------------
// Seats: one per role
// ----------------------------------------------------------------------------

interface RoleConfig {
  role: UserRole;
  title: string;
  tag: string;
  description: string;
  destination: string;
  sees: string[];
}

const ROLES: RoleConfig[] = [
  {
    role: "owner",
    title: "Studio Owner",
    tag: "Owner",
    description: "The whole studio from one dashboard.",
    destination: "/manage",
    sees: ["Schedule", "Revenue", "Students", "Teachers"],
  },
  {
    role: "front_desk",
    title: "Front Desk",
    tag: "Desk",
    description: "Today's classes and who's walking in.",
    destination: "/staff/checkin",
    sees: ["Check-in", "Waitlists", "Member lookup", "Rosters"],
  },
  {
    role: "teacher",
    title: "Instructor",
    tag: "Teacher",
    description: "What you teach, who's coming, what you've earned.",
    destination: "/teach",
    sees: ["Your classes", "Check-in", "Sub requests", "Earnings"],
  },
  {
    role: "student",
    title: "Member",
    tag: "Member",
    description: "What a student sees when they book.",
    destination: "/home",
    sees: ["Book a class", "Packs and memberships", "Streaks", "Community"],
  },
];

const TAG: Record<string, string> = { owner: "Owner", front_desk: "Desk", teacher: "Teacher", student: "Member" };

// ----------------------------------------------------------------------------
// Screen index: jump to one screen as the right role
// ----------------------------------------------------------------------------

interface Screen {
  name: string;
  description: string;
  route: string;
  role: UserRole;
}

const SCREEN_GROUPS: { title: string; screens: Screen[] }[] = [
  {
    title: "Classes",
    screens: [
      { name: "Class schedule", description: "Weekly classes, one-off changes, three locations.", route: "/manage/schedule", role: "owner" },
      { name: "Sub requests", description: "A teacher asks for cover; qualified teachers hear about it.", route: "/teach/subs", role: "teacher" },
      { name: "Waitlists", description: "When a spot opens, the next person moves in.", route: "/staff/waitlist", role: "front_desk" },
      { name: "On-demand", description: "Recorded classes members can stream.", route: "/on-demand", role: "student" },
    ],
  },
  {
    title: "People and check-in",
    screens: [
      { name: "Check-in", description: "Scan a pass, search a name or run the kiosk.", route: "/staff/checkin", role: "front_desk" },
      { name: "Student records", description: "Visits, waivers and notes for each student.", route: "/manage/students", role: "owner" },
      { name: "Streaks and community", description: "Practice streaks and milestones for members.", route: "/community", role: "student" },
      { name: "Notifications", description: "Which reminders and confirmations go out, and when.", route: "/manage/notification-settings", role: "owner" },
    ],
  },
  {
    title: "Money",
    screens: [
      { name: "Payments", description: "Memberships, packs, drop-ins and workshops through Stripe.", route: "/manage/financials", role: "owner" },
      { name: "Analytics", description: "Revenue, attendance and retention by class and teacher.", route: "/manage/analytics", role: "owner" },
      { name: "Reports", description: "Pick a date range, filter, export to CSV.", route: "/manage/reports", role: "owner" },
    ],
  },
  {
    title: "Your data and your site",
    screens: [
      { name: "Import", description: "Bring students and history over from your old system.", route: "/manage/import", role: "owner" },
      { name: "Campaigns", description: "Email a group of your students.", route: "/manage/campaigns", role: "owner" },
      { name: "Website embed", description: "Your schedule on your own site with one line of code.", route: "/manage/embed", role: "owner" },
      { name: "Exports", description: "Take everything with you, any time.", route: "/manage/connectors", role: "owner" },
    ],
  },
];

const FAQ_ITEMS = [
  {
    q: "Is this demo real?",
    a: "The screens are the ones a live studio uses. The studio and its people are made up, and nothing you do here is saved or charged.",
  },
  {
    q: "Who is Tandava for?",
    a: "Independent yoga, pilates and movement studios that want scheduling, memberships, payments and a booking page that works on a phone. We host it, so you don't need a developer.",
  },
  {
    q: "What does it cost?",
    a: "We're onboarding our first studios now and agree pricing with each owner before you take a single payment. Card fees are Stripe's, paid from your own Stripe account.",
  },
  {
    q: "How is it different from MindBody or Momence?",
    a: "No per-member pricing that grows against you, no features held back for a bigger plan, and you can export everything in standard formats whenever you like. Your classes also show up on Find a class, where students look before they pick a studio.",
  },
  {
    q: "Where does the money go?",
    a: "Straight to your own Stripe account through Stripe Connect. Tandava never holds your revenue.",
  },
  {
    q: "Can I run it myself?",
    a: "Yes. Tandava is open source under AGPL-3.0. If you have a developer and want to self-host, start at the open source page.",
  },
];

export default function Demo() {
  const navigate = useNavigate();
  const { switchPersona } = useDemo();

  const go = (role: UserRole, route: string) => {
    switchPersona(role);
    navigate(route);
  };

  return (
    <MarketingShell maxWidth="max-w-6xl">
      <SEOHead
        title="Live demo"
        description="Try Tandava with a sample studio: schedule, bookings, memberships and check-in. No sign-up needed."
        canonical="/demo"
      />

      <section className="mkt-grid">
        <div className="max-w-6xl mx-auto grid items-center gap-12 px-6 pb-20 pt-12 sm:pt-20 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <Eyebrow>Demo studio. Sample data. Nothing is saved.</Eyebrow>
            <h1 className="mt-5 font-brand text-[2.55rem] font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-[3.9rem]">
              Click around a working studio <Band>before you set up yours.</Band>
            </h1>
            <p className="mt-7 max-w-[54ch] text-lg leading-relaxed text-ink/75">
              {OXATL_STUDIO.name} is a made-up Austin studio with {OXATL_LOCATIONS.length} locations,{" "}
              {OXATL_TEACHERS.length} teachers and {OXATL_CLASS_TYPES.length} kinds of class. Sit in any seat: owner,
              front desk, teacher or member. Every screen is the one a live studio uses.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#explore"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-bold tracking-tight text-paper transition-colors hover:bg-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
              >
                Pick a seat <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <CtaLink to={STUDIO_SIGNUP_HREF} variant="secondary">Set up your studio</CtaLink>
            </div>
          </div>

          <div aria-hidden className="relative mx-auto hidden h-[17rem] w-full max-w-[20rem] md:block">
            <PassStub className="absolute left-0 top-0 w-[17rem] -rotate-6" label="Owner" name="Studio dashboard" detail="Revenue, schedule, students" code="/manage" />
            <PassStub className="absolute left-8 top-[5.25rem] w-[17rem] rotate-2" label="Front desk" name="Today's check-in" detail="Scan, search, kiosk" code="/staff" />
            <PassStub className="absolute left-3 top-[10.5rem] w-[17rem] -rotate-2" label="Member" name="Book a class" detail="Packs, streaks, schedule" code="/home" status="In" />
          </div>
        </div>
      </section>

      <Section
        id="explore"
        eyebrow="Pick a seat"
        title="Who do you want to be?"
        lead="You can switch seats any time from the bar at the top of the demo."
        className="scroll-mt-6 pt-4"
      >
        <ul className="divide-y divide-ink/15 border-y border-ink/15">
          {ROLES.map((r, i) => (
            <li key={r.role} className="grid gap-4 py-6 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center">
              <span className="hidden font-brand-mono text-sm font-semibold tabular-nums text-ink/45 sm:block">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="font-brand text-2xl font-extrabold tracking-tight">{r.tag}</p>
                <p className="mt-1 text-ink/70">{r.description}</p>
                <p className="mt-2 font-brand-mono text-xs uppercase tracking-[0.12em] text-ink/55">{r.sees.join("  /  ")}</p>
              </div>
              <button
                type="button"
                onClick={() => go(r.role, r.destination)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-ink px-5 font-bold tracking-tight transition-colors hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 active:translate-y-px"
              >
                Enter as {r.title} <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="screens"
        eyebrow="Screen index"
        title="Or jump to one screen."
        lead="Each link opens the screen as the person who'd use it."
        className="mt-20"
      >
        <div className="grid gap-x-10 gap-y-10 lg:grid-cols-2">
          {SCREEN_GROUPS.map((g) => (
            <div key={g.title} className="min-w-0">
              <h3 className="font-brand-mono text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">{g.title}</h3>
              <ul className="mt-3 divide-y divide-ink/10 border-y border-ink/15">
                {g.screens.map((s) => (
                  <li key={s.name}>
                    <button
                      type="button"
                      onClick={() => go(s.role, s.route)}
                      className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                    >
                      <span className="min-w-0">
                        <span className="block font-semibold group-hover:underline group-hover:underline-offset-4">{s.name}</span>
                        <span className="block text-sm text-ink/65">{s.description}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="rounded-full bg-ink/5 px-2 py-0.5 font-brand-mono text-[0.65rem] font-semibold uppercase tracking-wide text-ink/70">
                          {TAG[s.role]}
                        </span>
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section id="fit" eyebrow="Fit" title="Who it suits today." className="mt-20">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <TickList
              items={[
                "Independent yoga, pilates and movement studios",
                "Owners who want students to book from a phone in one step",
                "Studios paying per-member fees that grow faster than they do",
                "Owners who want their data exportable, any time",
              ]}
            />
          </div>
          <div className="min-w-0 rounded-2xl border-2 border-dashed border-ink/30 p-5">
            <p className="font-brand-mono text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Not yet</p>
            <ul className="mt-3 space-y-2 text-[0.95rem] text-ink/75">
              <li>Large chains that need franchise reporting</li>
              <li>Gyms built around booking equipment rather than classes</li>
            </ul>
            <p className="mt-4 text-sm text-ink/60">We're onboarding our first studios in Austin and working with each owner directly.</p>
          </div>
        </div>
      </Section>

      <Section id="questions" eyebrow="Questions" title="Before you ask." className="mt-20">
        <div className="divide-y divide-ink/15 border-y border-ink/15">
          {FAQ_ITEMS.map((f) => (
            <details key={f.q} className="group py-1">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-2 font-brand text-lg font-bold tracking-tight [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden className="font-brand-mono text-xl font-semibold text-ink/50 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-[62ch] pb-4 leading-relaxed text-ink/70">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-sm text-ink/65">
          Technical and want to run it yourself?{" "}
          <Link to="/open-source" className="font-semibold underline underline-offset-4">Self-hosting and the code</Link>.
        </p>
      </Section>

      <section className="mt-20 bg-lime" aria-labelledby="demo-cta">
        <div className="max-w-6xl mx-auto grid gap-6 px-6 py-12 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="min-w-0">
            <h2 id="demo-cta" className="font-brand text-3xl font-extrabold tracking-[-0.03em] sm:text-[2.6rem]">
              Ready for your own studio?
            </h2>
            <p className="mt-3 max-w-[60ch] text-ink/80">
              Add your classes, prices and Stripe. Your booking page goes live when you publish the schedule.
            </p>
          </div>
          <CtaLink to={STUDIO_SIGNUP_HREF}>
            Set up your studio <ArrowRight className="h-4 w-4" aria-hidden />
          </CtaLink>
        </div>
      </section>
    </MarketingShell>
  );
}
