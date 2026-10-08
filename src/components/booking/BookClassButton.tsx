/**
 * "Book" button for a class on a public studio page.
 *
 * Signed out  -> sends the visitor to sign up and brings them back to this exact
 *                class afterwards (see lib/authReturn.ts).
 * Signed in   -> asks the server (book_class_auto) to use their membership or
 *                class pack. If neither covers the class, starts a drop-in
 *                checkout at the server-side price.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBookClassAuto } from "@/hooks/useBooking";
import { checkoutDropIn } from "@/lib/stripe";
import { authHref } from "@/lib/authReturn";
import { trackFunnel } from "@/lib/funnel";

interface Props {
  occurrenceId: string;
  studioSlug: string;
  className?: string;
}

export function BookClassButton({ occurrenceId, studioSlug, className }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const book = useBookClassAuto();
  const [done, setDone] = useState<"confirmed" | "waitlisted" | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm" className={className}>
        <Link to={authHref("/auth/register", `/s/${studioSlug}?class=${occurrenceId}`)}>Book</Link>
      </Button>
    );
  }

  if (done) {
    return (
      <Button variant="secondary" size="sm" className={className} disabled>
        <Check className="me-1 h-4 w-4" />
        {done === "waitlisted" ? "On waitlist" : "Booked"}
      </Button>
    );
  }

  const onClick = async () => {
    try {
      const result = await book.mutateAsync(occurrenceId);
      if (result.result === "booked") {
        setDone(result.status);
        trackFunnel("booking_completed", { source: result.source_type, status: result.status });
        toast({
          title: result.status === "waitlisted" ? "You're on the waitlist" : "You're booked",
          description:
            result.status === "waitlisted"
              ? "We'll confirm your spot if one opens up."
              : `Covered by your ${result.source_type === "membership" ? "membership" : "class pack"}.`,
        });
        return;
      }

      // Nothing on file covers this class: pay for it as a drop-in.
      trackFunnel("checkout_started", { kind: "drop_in", price_cents: result.drop_in_price_cents });
      setRedirecting(true);
      const { error } = await checkoutDropIn(occurrenceId);
      if (error) {
        setRedirecting(false);
        toast({ title: "Couldn't start checkout", description: error, variant: "destructive" });
      }
    } catch (err) {
      const message = (err as Error).message;
      if (message.startsWith("Already booked")) setDone("confirmed");
      toast({
        title: message.startsWith("Already booked") ? "You're already booked" : "Couldn't book this class",
        description: message.startsWith("Already booked") ? undefined : message,
        variant: message.startsWith("Already booked") ? "default" : "destructive",
      });
    }
  };

  const busy = book.isPending || redirecting;
  return (
    <Button variant="outline" size="sm" className={className} onClick={onClick} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Book"}
    </Button>
  );
}
