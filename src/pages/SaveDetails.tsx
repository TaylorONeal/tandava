/**
 * /s/:slug/save-details: where the "save your details" automation email lands
 * (PRD-027 phase 1, guest-to-member step 0).
 *
 * The email cannot carry a working password-set link (those expire within the
 * hour), so this page asks for the email address and sends a fresh claim link
 * on demand, the same way the post-booking card does (PRD-020). The address is
 * typed, never passed in the URL.
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStudioStorefront } from "@/hooks/useBooking";
import { trackVisit } from "@/lib/analytics/session";
import { isBackendConfigured } from "@/lib/backend";
import { SEOHead } from "@/components/seo/SEOHead";
import { HelpTip } from "@/components/help/HelpTip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Mail } from "lucide-react";

export default function SaveDetails() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { resetPassword, user } = useAuth();
  const { data: storefront } = useStudioStorefront(slug);
  const studioName = storefront?.studio.name ?? "the studio";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isBackendConfigured() && slug) void trackVisit(slug, "landing");
  }, [slug]);

  const next = `/s/${encodeURIComponent(slug)}`;

  const send = async () => {
    const to = email.trim();
    if (!to.includes("@")) {
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
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`Save your details · ${studioName}`} description="Set a password so booking is one tap next time." noindex />
      <main className="mx-auto max-w-md px-4 py-12 space-y-4">
        {user ? (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h1 className="text-xl font-semibold">You're already signed in</h1>
              <p className="text-sm text-muted-foreground">Your details are saved. Book your next class in one tap.</p>
              <Button asChild>
                <Link to={next}>See the schedule</Link>
              </Button>
            </CardContent>
          </Card>
        ) : state === "sent" ? (
          <Card>
            <CardContent className="pt-6 space-y-2">
              <Mail className="h-5 w-5" aria-hidden="true" />
              <h1 className="text-xl font-semibold">Check your email</h1>
              <p className="text-sm text-muted-foreground">
                If {email.trim()} has booked at {studioName}, a link is on its way. Open it to set a password. It works
                once and expires after a short time.
              </p>
              <Link to={next} className="text-sm text-primary hover:underline">
                Back to {studioName}
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-1">
                <h1 className="text-xl font-semibold">Save your details for next time</h1>
                <HelpTip id="save-your-details" />
              </div>
              <p className="text-sm text-muted-foreground">
                Set a password on the email you booked {studioName} with. Next time booking is one tap, and you can buy a
                class pack or membership.
              </p>
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
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
                <Button type="submit" disabled={state === "sending"}>
                  {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Email me a link"}
                </Button>
              </form>
              {error && (
                <p role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              )}
              <Link to={next} className="text-sm text-muted-foreground hover:underline">
                No thanks, take me to the schedule
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
