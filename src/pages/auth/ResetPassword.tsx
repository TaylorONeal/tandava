import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AuthCard } from "@/components/auth/AuthCard";

/** /auth/reset: ask for the account email and send a recovery link. */
export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await resetPassword(email.trim());
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  if (sent) {
    return (
      <AuthCard title="Check your email" subtitle={`If an account exists for ${email.trim()}, we sent a link to set a new password.`}>
        <Button asChild variant="outline" className="w-full"><Link to="/auth/login">Back to sign in</Link></Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset your password" subtitle="Enter your email and we will send you a link.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy || !email}>{busy ? "Sending..." : "Send reset link"}</Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/auth/login" className="text-primary hover:underline">Back to sign in</Link>
        </p>
      </form>
    </AuthCard>
  );
}
