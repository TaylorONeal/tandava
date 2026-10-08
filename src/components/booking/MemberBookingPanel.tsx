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

import { useState } from "react";
import { useMemberEntitlements, useBookingSources, useBookClass } from "@/hooks/useBooking";
import { api as backendApi } from "@/lib/backend";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { PublicOccurrenceRow } from "@/types/database";
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
  const { data: entitlements, isLoading } = useMemberEntitlements(user?.id, studioId);
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
  const [state, setState] = useState<"idle" | "working" | "booked" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const covering = sources.filter((s) => s.covers && s.type !== "DROP_IN");
  const dropIn = sources.find((s) => s.type === "DROP_IN") ?? null;
  const name = profile?.first_name || user?.email || "you";

  const bookWith = async (sourceId: string, type: "MEMBERSHIP" | "CLASS_PACK") => {
    setState("working");
    setError(null);
    try {
      await bookClass.mutateAsync({
        occurrenceId,
        sourceType: type === "MEMBERSHIP" ? "membership" : "class_pack",
        sourceId,
      });
      setState("booked");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Could not book this class.");
    }
  };

  const payDropIn = async () => {
    setState("working");
    setError(null);
    const origin = window.location.origin;
    const { data, error: invokeError } = await backendApi.invoke<{ url?: string; error?: string }>(
      "stripe-checkout",
      {
        type: "drop_in",
        occurrenceId,
        successUrl: `${origin}${returnPath}?booked=1`,
        cancelUrl: `${origin}${returnPath}?cancelled=1`,
      },
    );
    if (data?.url) {
      window.location.assign(data.url);
      return;
    }
    setState("error");
    setError(data?.error ?? invokeError?.message ?? "Could not start payment.");
  };

  if (state === "booked") {
    return (
      <Card className="border-emerald-500/40 bg-emerald-500/5">
        <CardContent className="pt-6 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-semibold leading-tight">You're booked</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your spot in {row.offering_name} is confirmed. It's in My Schedule.
            </p>
            <div className="mt-4">
              <AddToCalendar event={{ ...calendarEvent, manageUrl: `${window.location.origin}/my-schedule` }} />
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
            {dropIn && priceLabel && (
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
            {!covering.length && !(dropIn && priceLabel) && (
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
            {error}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Not {name}?{" "}
          <button type="button" className="underline" onClick={() => void signOut()}>
            Sign out
          </button>{" "}
          to book as a guest.
        </p>
      </CardContent>
    </Card>
  );
}
