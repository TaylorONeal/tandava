/**
 * For studios: /for-studios (and "/" on the hosted product until Discover has
 * enough studios to be the front door; see lib/homeMode.ts).
 *
 * Audience: a studio owner or manager deciding whether to run their studio on
 * the hosted Tandava. Not developers (that is /open-source) and not students
 * (that is /discover). No pricing numbers here until decision D1 is made.
 */
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { STUDIO_SIGNUP_HREF } from "@/lib/audience";

const STEPS = [
  { title: "Create your studio", body: "Add your name, location, teachers and class types. The setup wizard saves as you go, so you can stop and pick it up later." },
  { title: "Set up payouts", body: "Students pay by card when they book. You add your bank details once, in a short form run by our payments partner Stripe, and payouts go to your account." },
  { title: "Publish your schedule", body: "You get a booking page you can share, and a schedule you can embed on your own website. Opt in to Discover and students searching for a class can find you." },
];

const WHAT_YOU_RUN = [
  "Class schedule, rooms and teachers",
  "Drop-ins, class packs and memberships",
  "Online booking, waitlists and cancellations",
  "Front desk check-in, including a kiosk screen",
  "Student records, with import from your current system",
  "Teacher schedules, subs and pay tracking",
  "Revenue and attendance reports",
  "Workshops and events",
];

export default function ForStudios() {
  return (
    <MarketingShell>
      <SEOHead
        title="Run your studio on Tandava"
        description="Scheduling, memberships, payments and a public booking page for yoga, pilates and movement studios. Students find you on Tandava Discover."
        canonical="/for-studios"
      />

      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 sm:pt-24">
        <p className="text-sm font-medium text-muted-foreground mb-4">For studio owners</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl">
          Run your studio. Get found by students.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          Schedule, memberships, payments and a booking page that works on a phone. Your classes can also show up
          on Tandava Discover, where students search for a class before they have picked a studio.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg">
            <Link to={STUDIO_SIGNUP_HREF}>Set up your studio <ArrowRight className="ms-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/demo">Look around a demo studio</Link>
          </Button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold">From signup to a bookable schedule</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-border p-6">
              <span className="text-sm text-muted-foreground">Step {i + 1}</span>
              <h3 className="mt-1 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold">What you run from one place</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {WHAT_YOU_RUN.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="rounded-xl border border-border bg-secondary/40 p-6 sm:p-8">
          <h2 className="text-xl font-semibold">We are starting with a few studios</h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Tandava is new. We are onboarding our first studios in Austin and working with each owner directly, so
            when something is rough you talk to the person who can fix it. Pricing is agreed with you before you
            take a single payment.
          </p>
          <Button asChild className="mt-5">
            <Link to={STUDIO_SIGNUP_HREF}>Set up your studio</Link>
          </Button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pt-4">
        <p className="text-sm text-muted-foreground">
          Technical and want to run it yourself? Tandava is open source.{" "}
          <Link to="/open-source" className="underline underline-offset-4">Self-hosting and the code</Link>.
        </p>
      </section>
    </MarketingShell>
  );
}
