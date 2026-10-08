/**
 * /auth/reset-confirm: set a password from an emailed link.
 *
 * Two entry points share this page:
 *   - "Forgot password" (resetPassword without options).
 *   - A guest saving their express booking as an account (`?claim=1`, PRD-020).
 *     The guest already has a passwordless identity; the emailed link proves they
 *     control the mailbox, which is the only safe way to attach a password to an
 *     identity that a public form created.
 *
 * The auth client exchanges the link's token for a session on load
 * (detectSessionInUrl), so this page waits for a signed-in user, then sets the
 * password and, for a claim, marks the profile claimed.
 */

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { safeNextPath } from "@/lib/auth/next";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Lock } from "lucide-react";

const MIN_PASSWORD = 8;

export default function ResetConfirm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading, isDemoMode, updatePassword } = useAuth();
  const claim = searchParams.get("claim") === "1";
  const next = safeNextPath(searchParams.get("next"), claim ? "/my-schedule" : "/");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const title = claim ? "Save your account" : "Choose a new password";

  if (isLoading) {
    return (
      <Shell title={title}>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="sr-only">Checking your link</span>
        </div>
      </Shell>
    );
  }

  if (!user && !isDemoMode) {
    return (
      <Shell title={title}>
        <div className="flex items-start gap-3 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <div className="space-y-2">
            <p className="font-medium">This link has expired or was already used.</p>
            <p className="text-muted-foreground">
              Links work once and expire after a short time. Request a new one from the sign-in page.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/auth/login">Go to sign in</Link>
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setSaving(true);
    const { error: updateError } = await updatePassword(password, { claim });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    navigate(next, { replace: true });
  };

  return (
    <Shell title={title}>
      <p className="text-sm text-muted-foreground mb-5">
        {claim
          ? "Set a password and your bookings, receipts and studio stay with this email. Next time you can book in one tap and use a class pack or membership."
          : "Pick a password you haven't used here before."}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">Password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="text-xs text-muted-foreground">
            At least {MIN_PASSWORD} characters.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" size="lg" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : <Lock className="h-4 w-4 mr-2" aria-hidden="true" />}
          {claim ? "Save my account" : "Save password"}
        </Button>
      </form>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={title} description="Set a password for your Tandava account." noindex />
      <div className="mx-auto w-full max-w-md px-4 py-16">
        <Card>
          <CardContent className="pt-6">
            <h1 className="text-xl font-semibold mb-2">{title}</h1>
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
