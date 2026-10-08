import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "@/lib/backend";
import { resolveAfterAuth } from "@/lib/authReturn";
import { safeNextPath } from "@/lib/auth/next";
import { readAuthLinkError, type AuthLinkError } from "@/lib/auth/linkError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Turnstile, useCaptchaReady } from "@/components/auth/Turnstile";

/**
 * Landing page for OAuth redirects and emailed sign-up links.
 *
 * Normal case: the auth client picks the tokens out of the URL, we find a
 * session and continue to where the person was headed.
 *
 * Link failed (expired, already used, or opened first by a mail scanner):
 * say so plainly and let them ask for a new confirmation email right here,
 * instead of bouncing them to sign in where they would hit "email not confirmed".
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const [linkError] = useState<AuthLinkError | null>(() =>
    typeof window === "undefined" ? null : readAuthLinkError(window.location.hash, window.location.search),
  );

  useEffect(() => {
    if (linkError) return;
    auth.getSession().then(({ user }) => {
      if (user) {
        navigate(resolveAfterAuth({ next: next === "/" ? null : next }), { replace: true });
      } else {
        navigate("/auth/login", { replace: true });
      }
    });
  }, [navigate, next, linkError]);

  if (linkError?.emailLink) return <LinkFailed error={linkError} next={next} />;
  if (linkError) return <SignInFailed next={next} />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}

function SignInFailed({ next }: { next: string }) {
  const login = next === "/" ? "/auth/login" : `/auth/login?next=${encodeURIComponent(next)}`;
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Sign-in did not finish</h1>
        <p className="text-sm text-muted-foreground">
          The sign-in was cancelled or the provider sent us back without an account. Nothing was changed.
        </p>
        <Button asChild className="w-full">
          <Link to={login}>Try again</Link>
        </Button>
      </div>
    </div>
  );
}

function LinkFailed({ error, next }: { error: AuthLinkError; next: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const captchaReady = useCaptchaReady();

  const resend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    const { error: sendError } = await auth.resendConfirmation(email.trim(), next);
    if (sendError) {
      setState("failed");
      setMessage(sendError.message);
    } else {
      setState("sent");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-5">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">
            {error.expired ? "That link has expired" : "That link did not work"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Email links work once and expire after a short time. Some email apps open links to scan them, which uses
            them up. Enter your email and we will send a fresh one.
          </p>
        </div>

        {state === "sent" ? (
          <p className="rounded-md border border-border p-3 text-sm">
            Sent. Check your inbox for a new confirmation email from Tandava.
          </p>
        ) : (
          <form onSubmit={resend} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="resend-email">Email</Label>
              <Input
                id="resend-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {state === "failed" && message && <p className="text-sm text-destructive">{message}</p>}
            <Turnstile />
            <Button type="submit" className="w-full" disabled={state === "sending" || !captchaReady}>
              {state === "sending" ? "Sending..." : "Send a new link"}
            </Button>
          </form>
        )}

        <p className="text-sm text-muted-foreground">
          Already confirmed?{" "}
          <Link to={next === "/" ? "/auth/login" : `/auth/login?next=${encodeURIComponent(next)}`} className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
          . Forgot your password?{" "}
          <Link to="/auth/reset" className="text-primary underline-offset-4 hover:underline">
            Reset it
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
