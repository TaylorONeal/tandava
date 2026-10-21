/**
 * Signed-in booking for one class, shown on the Express Booking page
 * (/s/:slug/book/:occurrenceId) when the visitor is already signed in.
 *
 * The guest form cannot serve a member: `express-book` diverts any claimed
 * account to an emailed link, by design. So once someone signs in from that
 * page and comes back, this panel replaces the form and books through the
 * member paths instead:
 *   - a covering membership or class pack → book_class() RPC
 *   - otherwise a paid drop-in → stripe-checkout (type "drop_in")
 * Coverage is resolved with the same tested rules as everywhere else
 * (resolvePaymentSources); book_class() re-checks server-side.
 */

import { CheckoutTermsNote } from "@/components/legal/CheckoutTermsNote";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { captureSettled, checkoutAttribution, currentSessionId } from "@/lib/analytics/session";
import { useMemberEntitlements, useBookingSources, useBookClass } from "@/hooks/useBooking";
import { api as backendApi, data as backendData } from "@/lib/backend";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { Booking, PublicOccurrenceRow } from "@/types/database";
import { AddToCalendar } from "@/components/calendar/AddToCalendar";
import type { ClassEventInput } from "@/lib/calendar/classEvent";

export function MemberBookingPanel({
  row,
  occurrenceId,
  returnPath,
  priceLabel,
  calendarEvent,
}: {
  row: PublicOccurrenceRow;
  occurrenceId: string;
  /** Same-origin path of this booking page, for the Stripe return. */
  returnPath: string;
  /** Formatted drop-in price, when there is one. */
  priceLabel: string | null;
  calendarEvent: ClassEventInput;
}) {
  const { user, profile, signOut } = useAuth();
  const studioId = row.studio_id ?? undefined;
  const { data: entitlements, isLoading, isError: entitlementsFailed, isFetching, refetch } = useMemberEntitlements(user?.id, studioId);
  const queryClient = useQueryClient();
  const actionPending = useRef(false);
  const mounted = useRef(true);
  const latestScope = useRef({ userId: user?.id, occurrenceId });
  latestScope.current = { userId: user?.id, occurrenceId };
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const sources = useBookingSources(
    {
      offering_id: row.offering_id ?? "",
      location_id: row.location_id ?? null,
      offering: row.offering_id
        ? { id: row.offering_id, drop_in_price_cents: row.drop_in_price_cents }
        : null,
    } as Parameters<typeof useBookingSources>[0],
    entitlements,
  );
  const bookClass = useBookClass();
  const [state, setState] = useState<"idle" | "working" | "booked" | "waitlisted" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const covering = sources.filter((s) => s.covers && s.type !== "DROP_IN");
  const dropIn = sources.find((s) => s.type === "DROP_IN") ?? null;
  const name = profile?.first_name || user?.email || "you";

  const acceptBooking = (booking: Booking | null) => {
    if (!booking?.id || !["confirmed", "waitlisted"].includes(booking.status)) {
      throw new Error("We could not verify your booking. Check My Schedule before trying again.");
    }
    setState(booking.status === "waitlisted" ? "waitlisted" : "booked");
    for (const key of ["my-bookings", "entitlements", "upcoming-classes", "public-schedule", "public-occurrence"]) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  };

  const runAction = async (action: (isCurrent: () => boolean) => Promise<void>) => {
    if (actionPending.current || !user) return;
    const userId = user.id;
    const isCurrent = () => mounted.current && latestScope.current.userId === userId && latestScope.current.occurrenceId === occurrenceId;
    actionPending.current = true;
    setState("working");
    setError(null);
    try {
      await action(isCurrent);
    } catch (err) {
      if (!isCurrent()) return;
      setState("error");
      setError(err instanceof Error ? err.message : "Could not book this class. Check My Schedule before trying again.");
    } finally {
      actionPending.current = false;
    }
  };

  const bookWith = (sourceId: string, type: "MEMBERSHIP" | "CLASS_PACK") => runAction(async (isCurrent) => {
    await captureSettled(row.studio_slug ?? undefined);
    if (!isCurrent()) return;
    const booking = await bookClass.mutateAsync({
      sessionId: currentSessionId(row.studio_slug),
      occurrenceId,
      sourceType: type === "MEMBERSHIP" ? "membership" : "class_pack",
      sourceId,
    });
    if (isCurrent()) acceptBooking(booking);
  });

  const isFree = row.drop_in_price_cents === 0;

  const bookFree = () => runAction(async (isCurrent) => {
    await captureSettled(row.studio_slug ?? undefined);
    if (!isCurrent()) return;
    const { data: booking, error: freeError } = await backendData.bookFreeClass(occurrenceId, currentSessionId(row.studio_slug));
    if (!isCurrent()) return;
    if (freeError) throw new Error(freeError.message);
    acceptBooking(booking);
  });

  const payDropIn = () => runAction(async (isCurrent) => {
    await captureSettled(row.studio_slug ?? undefined);
    if (!isCurrent()) return;
    const origin = window.location.origin;
    const { data, error: invokeError } = await backendApi.invoke<{ url?: string; error?: string }>(
      "stripe-checkout",
      {
        type: "drop_in",
        occurrenceId,
        ...checkoutAttribution(row.studio_slug),
        successUrl: `${origin}${returnPath}?booked=1`,
        cancelUrl: `${origin}${returnPath}?cancelled=1`,
      },
    );
    if (!isCurrent()) return;
    if (!data?.url) throw new Error(data?.error ?? invokeError?.message ?? "Could not start payment.");
    window.location.assign(data.url);
  });

  if (state === "booked" || state === "waitlisted") {
    return (
      <Card className="border-emerald-500/40 bg-emerald-500/5">
        <CardContent className="pt-6 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-semibold leading-tight">{state === "waitlisted" ? "You're on the waitlist" : "You're booked"}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {state === "waitlisted"
                ? `You don't have a confirmed spot in ${row.offering_name} yet. Check My Schedule for your booking status.`
                : `Your spot in ${row.offering_name} is confirmed. It's in My Schedule.`}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button asChild variant="outline"><Link to="/my-schedule">View My Schedule</Link></Button>
              {state === "booked" && <AddToCalendar event={{ ...calendarEvent, manageUrl: `${window.location.origin}/my-schedule` }} />}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const busy = state === "working";

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Book as {name}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            You're signed in, so your membership or class pack at {row.studio_name} applies.
          </p>
        </div>

        {isLoading || !studioId ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isLoading ? "Checking your passes" : "This studio's booking details aren't available yet."}
          </div>
        ) : entitlementsFailed ? (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-destructive">We couldn't check your passes. Try again before booking.</p>
            <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
              {isFetching ? "Checking passes…" : "Try again"}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {covering.map((source) => (
              <Button
                key={source.id}
                className="w-full justify-between"
                size="lg"
                disabled={busy}
                onClick={() => void bookWith(source.id, source.type as "MEMBERSHIP" | "CLASS_PACK")}
              >
                <span>Book with {source.name}</span>
                {typeof source.remaining === "number" && (
                  <span className="text-xs opacity-80">{source.remaining} left</span>
                )}
              </Button>
            ))}
            {dropIn && isFree && (
              <Button
                variant={covering.length ? "outline" : "default"}
                className="w-full"
                size="lg"
                disabled={busy}
                onClick={() => void bookFree()}
              >
                Book this free class
              </Button>
            )}
            {dropIn && !isFree && priceLabel && (
              <Button
                variant={covering.length ? "outline" : "default"}
                className="w-full"
                size="lg"
                disabled={busy}
                onClick={() => void payDropIn()}
              >
                Pay {priceLabel} drop-in
              </Button>
            )}
            {dropIn && !isFree && priceLabel && <CheckoutTermsNote />}
            {!covering.length && !dropIn && (
              <p className="text-sm text-muted-foreground">
                None of your passes cover this class and it has no drop-in price. Contact{" "}
                {row.studio_name} to book.
              </p>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error} <Link className="underline" to="/my-schedule">View My Schedule</Link></span>
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Not {name}?{" "}
          <button type="button" className="underline" disabled={busy} onClick={() => void signOut().catch(() => setError("Could not sign out. Try again."))}>
            Sign out
          </button>{" "}
          to book as a guest.
        </p>
      </CardContent>
    </Card>
  );
}
