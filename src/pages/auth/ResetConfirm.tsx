import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AuthCard } from "@/components/auth/AuthCard";

/**
 * /auth/reset-confirm: landing page for the emailed recovery link.
 * Supabase signs the visitor in from the link; we wait for that session, then
 * set the new password. A missing or expired link gets a way to request another.
 */
export default function ResetConfirm() {
  const { user, isLoading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [waited, setWaited] = useState(false);

  // The recovery session arrives asynchronously from the URL hash.
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await updatePassword(password);
    setBusy(false);
    if (error) setError(error.message);
    else navigate("/", { replace: true });
  };

  if (!user && (waited || !isLoading)) {
    if (!waited) {
      return <AuthCard title="One moment" subtitle="Checking your reset link..." />;
    }
    return (
      <AuthCard title="This link has expired" subtitle="Reset links work once and expire quickly. Request a new one.">
        <Button asChild className="w-full"><Link to="/auth/reset">Send a new link</Link></Button>
      </AuthCard>
    );
  }

  if (!user) return <AuthCard title="One moment" subtitle="Checking your reset link..." />;

  return (
    <AuthCard title="Choose a new password" subtitle="You are signed in. Set a password for next time.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="text-xs text-muted-foreground">8+ characters</p>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy || password.length < 8}>{busy ? "Saving..." : "Save password"}</Button>
      </form>
    </AuthCard>
  );
}
