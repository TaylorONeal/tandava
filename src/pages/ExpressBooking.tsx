/**
 * Express Booking — /s/:slug/book/:occurrenceId (PRD-020)
 *
 * The login-free booking page. One screen, three fields, no password, no email
 * round-trip: the single highest-conversion pattern in this category and the one
 * Tandava did not have (docs/competitive/MANGOMINT.md section 6, and
 * docs/roadmap/COMPETITOR_ISSUES_PRIORITY.md #3 "5-7 taps to 1-2 taps").
 *
 * Deliberate choices:
 *   - Class details render above the form, so the visitor confirms what they are
 *     booking before they type anything.
 *   - Price, cancellation deadline and waitlist status are stated before the
 *     button, not after it. Nobody should learn the policy from a receipt.
 *   - Every error names what happened and what to do next
 *     (COMPETITOR_ISSUES_PRIORITY #5), using the copy in
 *     `src/lib/booking/express.ts` so the page and the server cannot drift.
 *   - Times render in the STUDIO's timezone, labelled as such
 *     (COMPETITOR_ISSUES_PRIORITY #1).
 *
 * Eligibility shown here is advisory. The authoritative checks run server-side
 * in the `express-book` function and `create_guest_booking`, so a class that
 * fills between page load and submit is handled by the response, not by this
 * component's optimism.
 */

import { LEGAL_PUBLISHED } from "@/content/legal";
import { cancelWindowLabel } from "@/lib/myBookings";
import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { usePublicOccurrence, useExpressBook } from "@/hooks/useBooking";
import { useAuth } from "@/contexts/AuthContext";
import { Turnstile, useCaptchaReady } from "@/components/auth/Turnstile";
import { MemberBookingPanel } from "@/components/booking/MemberBookingPanel";
import { ClassTime } from "@/components/time/ClassTime";
import { AddToCalendar } from "@/components/calendar/AddToCalendar";
import { HelpTip } from "@/components/help/HelpTip";
import { captureSettled, currentSessionId, getVisitorId, trackVisit } from "@/lib/analytics/session";
import type { ClassEventInput } from "@/lib/calendar/classEvent";
import { expressBookingPath, loginHref } from "@/lib/auth/next";
import { isBackendConfigured } from "@/lib/backend";
import {
  checkOccurrenceEligibility,
  rejectMessage,
  type ExpressOccurrence,
} from "@/lib/booking/express";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CalendarCheck,
  Loader2,
  MapPin,
  Mail,
  CheckCircle2,
  AlertCircle,
  User,
} from "lucide-react";
import type { PublicOccurrenceRow } from "@/types/database";

// ---------------------------------------------------------------------------
// Demo fixture
// ---------------------------------------------------------------------------

/**
 * Demo mode has no backend, and this page is the clearest thing to show a studio
 * owner evaluating Tandava, so it renders against a fixture rather than an empty
 * state. The submit path is simulated and says so.
 */
function demoOccurrence(occurrenceId: string): PublicOccurrenceRow {
  const starts = new Date(Date.now() + 5 * 60 * 60 * 1000);
  starts.setMinutes(0, 0, 0); // a realistic on-the-hour class time
  const ends = new Date(starts.getTime() + 60 * 60 * 1000);
  return {
    occurrence_id: occurrenceId,
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    room: "Main Studio",
    is_cancelled: false,
    capacity: 20,
    booked_count: 16,
    offering_name: "Power Vinyasa Flow",
    offering_description: "A strong, breath-led flow. All levels welcome; bring water.",
    drop_in_price_cents: 2200,
    location_name: "Oxatl Yoga, East Austin",
    location_city: "Austin",
    teacher_name: "Daniella Cruz",
    studio_name: "Oxatl Yoga",
    studio_slug: "oxatl",
    studio_timezone: "America/Chicago",
    studio_currency: "USD",
    studio_primary_color: "#4fd1c5",
    express_booking_enabled: true,
    express_booking_cutoff_minutes: 0,
    express_waitlist_enabled: true,
    express_waiver_required: true,
  };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function formatMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

/** Map the public row onto the shape the (tested) rules module expects. */
function toExpressOccurrence(row: PublicOccurrenceRow): ExpressOccurrence {
  return {
    occurrenceId: row.occurrence_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isCancelled: Boolean(row.is_cancelled),
    capacity: row.capacity ?? 0,
    bookedCount: row.booked_count ?? 0,
    dropInPriceCents: row.drop_in_price_cents ?? null,
    expressBookingEnabled: Boolean(row.express_booking_enabled),
    waiverRequired: Boolean(row.express_waiver_required),
    bookingCutoffMinutes: row.express_booking_cutoff_minutes ?? 0,
    waitlistEnabled: Boolean(row.express_waitlist_enabled),
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  marketingConsent: boolean;
  waiverAccepted: boolean;
  saveAccount: boolean;
};

const EMPTY_FORM: Form = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  marketingConsent: false,
  waiverAccepted: false,
  saveAccount: false,
};

/**
 * Survives the Stripe Checkout round trip (same tab), so the page can offer, or
 * send, the save-as-account link when the guest comes back with ?booked=1.
 * sessionStorage only: it is gone when the tab closes, and the page works the
 * same without it (the card just asks for the email).
 */
const PENDING_KEY = "tandava.express.pending";

type PendingGuest = { email: string; saveAccount: boolean; occurrenceId: string };

function readPending(occurrenceId: string | undefined): PendingGuest | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingGuest;
    return parsed.occurrenceId === occurrenceId ? parsed : null;
  } catch {
    return null;
  }
}

function writePending(value: PendingGuest | null) {
  try {
    if (value) window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(value));
    else window.sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Private mode or blocked storage: the card falls back to asking.
  }
}

export default function ExpressBooking() {
  const { slug, occurrenceId } = useParams<{ slug: string; occurrenceId: string }>();
  const [searchParams] = useSearchParams();
  const live = isBackendConfigured();
  const { user } = useAuth();
  // A signed-in visitor books through their membership, pack or a member
  // drop-in, never the guest form (express-book diverts claimed accounts).
  const signedIn = live && Boolean(user);

  const { data: fetched, isLoading, isError } = usePublicOccurrence(slug, occurrenceId);

  // First-party visit capture (PRD-024). Adopts a visitor id handed over from
  // the embed widget (tv) so the widget visit and this booking join.
  useEffect(() => {
    if (slug && live) void trackVisit(slug, "booking");
  }, [slug, live]);
  const expressBook = useExpressBook();

  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [demoResult, setDemoResult] = useState<"booked" | "waitlisted" | null>(null);

  // Stripe returns here with ?booked=1 after a successful drop-in payment. The
  // booking itself is created by the webhook, so this flag only drives the copy.
  const returnedFromPayment = searchParams.get("booked") === "1";
  const paymentCancelled = searchParams.get("cancelled") === "1";

  const row = live ? fetched : demoOccurrence(occurrenceId ?? "demo-occurrence");

  const eligibility = useMemo(() => {
    if (!row) return null;
    return checkOccurrenceEligibility(toExpressOccurrence(row), new Date());
  }, [row]);

  // Keep the UTM parameters that brought the visitor here, so a studio can tell
  // which post or ad produced the booking (PRD-011 attribution).
  const utm = useMemo(
    () => ({
      source: searchParams.get("utm_source") ?? undefined,
      medium: searchParams.get("utm_medium") ?? undefined,
      campaign: searchParams.get("utm_campaign") ?? undefined,
    }),
    [searchParams],
  );

  // A pending_payment outcome hands back a Checkout URL to follow. Remember the
  // email and the save-account choice first, for the ?booked=1 return.
  useEffect(() => {
    const url = expressBook.data?.outcome === "pending_payment" ? expressBook.data.checkoutUrl : null;
    if (url) {
      if (occurrenceId) writePending({ email: form.email.trim(), saveAccount: form.saveAccount, occurrenceId });
      window.location.assign(url);
    }
  }, [expressBook.data, form.email, form.saveAccount, occurrenceId]);

  const pending = useMemo(() => (returnedFromPayment ? readPending(occurrenceId) : null), [returnedFromPayment, occurrenceId]);
  const bookingPath = slug && occurrenceId ? expressBookingPath(slug, occurrenceId) : "/";
  const signInHref = loginHref(bookingPath);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});

    if (!live) {
      // Demo mode: no backend to post to. Show the outcome the real flow would
      // produce, labelled as simulated.
      setDemoResult(eligibility?.placement === "waitlisted" ? "waitlisted" : "booked");
      return;
    }
    if (!slug || !occurrenceId) return;

    // Let this visit's capture land first so the booking credits it.
    if (live) await captureSettled(slug);
    const result = await expressBook.mutateAsync({
      slug,
      occurrenceId,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
      marketingConsent: form.marketingConsent,
      waiverAccepted: form.waiverAccepted,
      utm,
      visitorId: live ? getVisitorId() : undefined,
      sessionId: live && slug ? currentSessionId(slug) : undefined,
    });

    if (result.fields?.length) {
      // Field codes are `first_name_required` etc.; map them back to form keys.
      const next: Record<string, string> = {};
      for (const f of result.fields) {
        if (f.code.startsWith("first_name")) next.firstName = f.message;
        else if (f.code.startsWith("last_name")) next.lastName = f.message;
        else if (f.code.startsWith("email")) next.email = f.message;
        else if (f.code.startsWith("phone")) next.phone = f.message;
      }
      setFieldErrors(next);
    }
  };

  // --- Shell states -----------------------------------------------------

  if (live && isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading class details</span>
        </div>
      </Shell>
    );
  }

  // Failing to load must never be a dead end for someone who wants to book.
  //
  // This branch covers a stale link, a class the studio removed, AND a
  // deployment where migration 00019 has not been applied yet, so
  // get_public_occurrence() does not exist. Storefront and embed "Book" buttons
  // now point here, so without a booking route out of this state a studio that
  // has not run the migration would have a *worse* path than before the feature
  // landed. The account route always works, so it is always offered.
  if (live && (isError || !row)) {
    return (
      <Shell>
        <Notice
          tone="error"
          title="We couldn't load that class"
          body="The link may be out of date, or this studio may not have instant booking turned on. You can still book with an account, or pick another time from the schedule."
          action={{ to: `/auth/register?next=${encodeURIComponent(bookingPath)}`, label: "Book with an account" }}
          secondaryAction={slug ? { to: `/s/${slug}`, label: "See the schedule" } : undefined}
        />
      </Shell>
    );
  }

  if (!row) return null;

  const calendarEvent = toCalendarEvent(row, occurrenceId ?? row.occurrence_id, signedIn);
  const price = row.drop_in_price_cents;
  const result = expressBook.data;

  // --- Terminal states --------------------------------------------------

  if (returnedFromPayment) {
    return (
      <Shell>
        <Notice
          tone="success"
          title="You're booked"
          body={`Your payment went through and your spot in ${row.offering_name} is held. Stripe emails your receipt.`}
          action={slug ? { to: `/s/${slug}`, label: `Back to ${row.studio_name}` } : undefined}
        />
        <Card>
          <CardContent className="pt-6">
            <AddToCalendar event={calendarEvent} />
          </CardContent>
        </Card>
        {live && !signedIn && (
          <SaveAccountCard
            studioName={row.studio_name}
            initialEmail={pending?.email ?? ""}
            autoSend={Boolean(pending?.saveAccount && pending.email)}
            next={slug ? `/s/${slug}` : "/my-schedule"}
            onDone={() => writePending(null)}
          />
        )}
      </Shell>
    );
  }

  if (result?.outcome === "booked" || result?.outcome === "waitlisted" || demoResult) {
    const placement = demoResult ?? result!.outcome;
    const waitlisted = placement === "waitlisted";
    return (
      <Shell>
        <Notice
          tone="success"
          title={waitlisted ? "You're on the waitlist" : "You're booked"}
          body={
            waitlisted
              ? `${row.offering_name} is full, so you're on the waitlist${
                  result?.waitlistPosition ? ` at position ${result.waitlistPosition}` : ""
                }. We'll email you the moment a spot opens, and you won't be charged unless you get in.`
              : `Your spot in ${row.offering_name} is confirmed.`
          }
          action={slug ? { to: `/s/${slug}`, label: `Back to ${row.studio_name}` } : undefined}
          footnote={
            demoResult
              ? "Demo mode: this confirmation is simulated. No booking was created and no email was sent."
              : undefined
          }
        />
        {!waitlisted && (
          <Card>
            <CardContent className="pt-6">
              <AddToCalendar event={calendarEvent} />
            </CardContent>
          </Card>
        )}
        {live && !demoResult && (
          <SaveAccountCard
            studioName={row.studio_name}
            initialEmail={form.email.trim()}
            autoSend={form.saveAccount}
            next={slug ? `/s/${slug}` : "/my-schedule"}
          />
        )}
      </Shell>
    );
  }

  if (result?.outcome === "continue_link_sent") {
    return (
      <Shell>
        <Notice
          tone="info"
          icon={<Mail className="h-5 w-5" aria-hidden="true" />}
          title="This email already has an account"
          body={
            result.message ??
            "We sent you a link to finish booking this class. It expires in 30 minutes."
          }
          action={{ to: signInHref, label: "Sign in and book now" }}
          secondaryAction={slug ? { to: `/s/${slug}`, label: "See the schedule" } : undefined}
          footnote="We don't book straight away from a public form when the address already has an account, because anyone can type anyone's email. Signing in is the fastest way through, and it also lets you use a membership or class pack."
        />
      </Shell>
    );
  }

  // --- Blocked before the form -------------------------------------------
  //
  // Express policy (express_booking_enabled, the guest cutoff, "full" for
  // guests) governs the guest form only. A signed-in member books through
  // their own path, so for them only universal blockers apply: cancelled or
  // already started. express_disabled is the database default and must not
  // hide the member panel.
  const universalBlock =
    eligibility && !eligibility.eligible && (eligibility.reason === "cancelled" || eligibility.reason === "already_started");

  if (eligibility && !eligibility.eligible && (!signedIn || universalBlock)) {
    return (
      <Shell>
        <ClassSummary row={row} spotsLeft={eligibility.spotsLeft} />
        <Notice
          tone="error"
          title="This class can't be booked"
          body={rejectMessage(eligibility.reason!)}
          action={slug ? { to: `/s/${slug}`, label: "See other times" } : undefined}
        />
      </Shell>
    );
  }

  // --- Signed in: member booking instead of the guest form ---------------

  if (signedIn && occurrenceId) {
    return (
      <Shell>
        <ClassSummary row={row} spotsLeft={eligibility?.spotsLeft ?? 0} />
        {paymentCancelled && (
          <Notice
            tone="info"
            title="Payment cancelled"
            body="Nothing was charged and your spot was not held."
            inline
          />
        )}
        <MemberBookingPanel
          row={row}
          occurrenceId={occurrenceId}
          returnPath={bookingPath}
          priceLabel={price && price > 0 ? formatMoney(price, row.studio_currency || "USD") : null}
          calendarEvent={calendarEvent}
        />
      </Shell>
    );
  }

  // --- The form ---------------------------------------------------------

  const waitlisting = eligibility?.placement === "waitlisted";
  const submitting = expressBook.isPending;
  const rejection = result?.outcome === "rejected" || result?.outcome === "rate_limited" ? result : null;

  return (
    <Shell>
      <SEOHead
        title={`Book ${row.offering_name} · ${row.studio_name}`}
        description={`Reserve your spot in ${row.offering_name} at ${row.studio_name}. No account needed.`}
      />

      <ClassSummary row={row} spotsLeft={eligibility?.spotsLeft ?? 0} />

      {paymentCancelled && (
        <Notice
          tone="info"
          title="Payment cancelled"
          body="Nothing was charged and your spot was not held. Fill in the form again when you're ready."
          inline
        />
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              {waitlisting ? "Join the waitlist" : "Reserve your spot"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              No account or password needed. We only need enough to hold your spot and reach you if
              anything changes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="firstName"
                label="First name"
                value={form.firstName}
                onChange={(v) => set("firstName", v)}
                error={fieldErrors.firstName}
                autoComplete="given-name"
                required
              />
              <Field
                id="lastName"
                label="Last name"
                value={form.lastName}
                onChange={(v) => set("lastName", v)}
                error={fieldErrors.lastName}
                autoComplete="family-name"
                required
              />
            </div>

            <Field
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              error={fieldErrors.email}
              autoComplete="email"
              hint="Your confirmation goes here."
              required
            />

            <Field
              id="phone"
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(v) => set("phone", v)}
              error={fieldErrors.phone}
              autoComplete="tel"
              hint="Optional. Used only if the studio needs to reach you about this class."
            />

            {row.express_waiver_required && (
              <label className="flex items-start gap-3 rounded-md border bg-muted/30 p-3 text-sm">
                <Checkbox
                  checked={form.waiverAccepted}
                  onCheckedChange={(v) => set("waiverAccepted", v === true)}
                  aria-describedby="waiver-text"
                />
                <span id="waiver-text">
                  I accept {row.studio_name}'s liability waiver and studio policies.
                </span>
              </label>
            )}

            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <Checkbox
                checked={form.marketingConsent}
                onCheckedChange={(v) => set("marketingConsent", v === true)}
              />
              <span>Email me about new classes and offers from {row.studio_name}. We'll send one email to confirm.</span>
            </label>

            {live && (
              <label className="flex items-start gap-3 text-sm text-muted-foreground">
                <Checkbox
                  checked={form.saveAccount}
                  onCheckedChange={(v) => set("saveAccount", v === true)}
                />
                <span>
                  Save my details for next time. After booking we'll email a link to set a password,
                  so you can rebook in one tap and use class packs.{" "}
                  <HelpTip id="save-your-details" />
                </span>
              </label>
            )}

            {/* State the commitment before the button, not after it. */}
            <div className="rounded-md bg-muted/40 p-3 text-sm">
              {waitlisting ? (
                <p>
                  This class is full. Joining the waitlist is free, and you'll only be charged if a
                  spot opens and you take it.
                </p>
              ) : price && price > 0 ? (
                <p>
                  You'll pay{" "}
                  <strong>{formatMoney(price, row.studio_currency || "USD")}</strong> on the next
                  screen. Already have a membership or class pack?{" "}
                  <Link to={signInHref} className="underline">
                    Sign in instead
                  </Link>
                  .
                </p>
              ) : (
                <p>This class is free. No payment needed.</p>
              )}
            </div>

            {LEGAL_PUBLISHED && (
            <p className="text-xs text-muted-foreground">
              By booking you agree to the{" "}
              <Link target="_blank" rel="noopener noreferrer" to="/terms" className="underline">Terms</Link> and{" "}
              <Link target="_blank" rel="noopener noreferrer" to="/privacy" className="underline">Privacy Policy</Link>. Cancellations and refunds follow the{" "}
              <Link target="_blank" rel="noopener noreferrer" to="/refunds" className="underline">refund policy</Link>.
            </p>
            )}

            {rejection && (
              <div
                className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{rejection.message}</span>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                  Holding your spot
                </>
              ) : waitlisting ? (
                "Join the waitlist"
              ) : price && price > 0 ? (
                `Book and pay ${formatMoney(price, row.studio_currency || "USD")}`
              ) : (
                "Book this class"
              )}
            </Button>

            {!live && (
              <p className="text-xs text-muted-foreground text-center">
                Demo mode: submitting simulates the confirmation. No booking is created.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

/**
 * The account nudge (PRD-020 Job 3). Shown after a guest books, never before:
 * the booking is the point, the account is the follow-up.
 *
 * It sends the password-set link (resetPassword with claim), which proves the
 * guest controls the mailbox before any password is attached to the identity
 * the public form created. With `autoSend` (the guest ticked "Save my details"
 * in the form) the link goes out on mount and the card confirms it.
 */
function SaveAccountCard({
  studioName,
  initialEmail,
  autoSend,
  next,
  onDone,
}: {
  studioName: string;
  initialEmail: string;
  autoSend: boolean;
  next: string;
  onDone?: () => void;
}) {
  const { resetPassword } = useAuth();
  const captchaReady = useCaptchaReady();
  const autoSent = useRef(false);
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const send = async (address: string) => {
    const to = address.trim();
    if (!to || !to.includes("@")) {
      setState("error");
      setError("Enter the email you booked with.");
      return;
    }
    setState("sending");
    setError(null);
    const { error: sendError } = await resetPassword(to, { claim: true, next });
    if (sendError) {
      setState("error");
      setError(sendError.message);
      return;
    }
    setState("sent");
    onDone?.();
  };

  useEffect(() => {
    // Send once when the guest opted in, as soon as the captcha (if any) has a
    // token; later sends are manual.
    if (!autoSend || !initialEmail || autoSent.current || !captchaReady) return;
    autoSent.current = true;
    void send(initialEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captchaReady]);

  if (state === "sent") {
    return (
      <Notice
        tone="info"
        icon={<Mail className="h-5 w-5" aria-hidden="true" />}
        title="Check your email"
        body={`We sent a link to ${email.trim()}. Open it to set a password and your booking at ${studioName} stays with your account.`}
        footnote="The link works once and expires after a short time. Nothing changes if you ignore it."
        inline
      />
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div>
          <h2 className="font-semibold leading-tight">Save your details for next time</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Set a password on the email you booked with. Next time it's one tap, and you can buy
            a class pack or membership at {studioName}.
          </p>
        </div>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void send(email);
          }}
          noValidate
        >
          <Input
            type="email"
            aria-label="Email you booked with"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Button type="submit" disabled={state === "sending" || !captchaReady} className="shrink-0">
            {state === "sending" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              "Email me a link"
            )}
          </Button>
        </form>
        <Turnstile />
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/** Calendar event for this class from the public row (address, studio zone, policy). */
function toCalendarEvent(row: PublicOccurrenceRow, occurrenceId: string, signedIn: boolean): ClassEventInput {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return {
    occurrenceId,
    className: row.offering_name,
    studioName: row.studio_name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    studioTimeZone: row.studio_timezone,
    teacherName: row.teacher_name,
    room: row.room,
    locationName: row.location_name,
    addressLine1: row.location_address_line1 ?? null,
    addressLine2: row.location_address_line2 ?? null,
    city: row.location_city,
    region: row.location_state ?? null,
    postalCode: row.location_zip ?? null,
    country: row.location_country ?? null,
    latitude: row.location_latitude ?? null,
    longitude: row.location_longitude ?? null,
    cancellationMinutes: row.cancellation_minutes ?? null,
    // Only a page that can actually show or cancel the booking is a "manage"
    // link. Guests get the studio page as plain info until the signed guest
    // manage link (PRD-020) exists.
    manageUrl: signedIn && origin ? `${origin}/my-schedule` : null,
    studioUrl: origin ? `${origin}/s/${encodeURIComponent(row.studio_slug)}` : null,
  };
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-lg px-4 py-10 space-y-5">{children}</div>
    </div>
  );
}

function ClassSummary({
  row,
  spotsLeft,
}: {
  row: PublicOccurrenceRow;
  spotsLeft: number;
}) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{row.studio_name}</p>
            <h1 className="text-xl font-semibold leading-tight mt-0.5">{row.offering_name}</h1>
          </div>
          {spotsLeft > 0 ? (
            <Badge variant="secondary" className="shrink-0">
              {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left
            </Badge>
          ) : (
            <Badge variant="outline" className="shrink-0">
              Full
            </Badge>
          )}
        </div>

        {row.offering_description && (
          <p className="text-sm text-muted-foreground">{row.offering_description}</p>
        )}

        <div className="space-y-1.5 text-sm">
          <ClassTime startsAt={row.starts_at} endsAt={row.ends_at} studioTimeZone={row.studio_timezone} />
          {row.teacher_name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <span>{row.teacher_name}</span>
            </div>
          )}
          {(row.location_name || row.room) && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <span>{[row.location_name, row.room].filter(Boolean).join(" · ")}</span>
            </div>
          )}
          {/* Shown before any booking or payment; the late-cancel rule depends on it. */}
          <p className="text-muted-foreground">
            {cancelWindowLabel(row.cancellation_minutes)} Later than that, the class counts as used.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {!required && <span className="text-muted-foreground font-normal"> (optional)</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        className={error ? "border-destructive" : undefined}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Notice({
  tone,
  title,
  body,
  action,
  secondaryAction,
  footnote,
  icon,
  inline,
}: {
  tone: "success" | "error" | "info";
  title: string;
  body: string;
  action?: { to: string; label: string };
  secondaryAction?: { to: string; label: string };
  footnote?: string;
  icon?: React.ReactNode;
  inline?: boolean;
}) {
  const toneIcon =
    icon ??
    (tone === "success" ? (
      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
    ) : tone === "error" ? (
      <AlertCircle className="h-5 w-5" aria-hidden="true" />
    ) : (
      <CalendarCheck className="h-5 w-5" aria-hidden="true" />
    ));

  const toneClass =
    tone === "success"
      ? "border-emerald-500/40 bg-emerald-500/5"
      : tone === "error"
        ? "border-destructive/40 bg-destructive/5"
        : "border-border bg-muted/40";

  return (
    <Card className={toneClass}>
      <CardContent className={inline ? "py-4" : "pt-6"}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0">{toneIcon}</span>
          <div className="space-y-2">
            <h2 className="font-semibold leading-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{body}</p>
            {footnote && <p className="text-xs text-muted-foreground">{footnote}</p>}
            {(action || secondaryAction) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {action && (
                  <Button asChild variant="outline" size="sm">
                    <Link to={action.to}>{action.label}</Link>
                  </Button>
                )}
                {secondaryAction && (
                  <Button asChild variant="ghost" size="sm">
                    <Link to={secondaryAction.to}>{secondaryAction.label}</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
