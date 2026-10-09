/**
 * Settings > Billing on the live backend: real Stripe payout status from the
 * stripe-connect function. Payment readiness is Stripe's charges_enabled, the
 * same flag stripe-checkout requires, not just "details submitted".
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/backend";
import { payoutState, type PayoutStatus } from "@/lib/hosted/payouts";
import { CreditCard, Loader2 } from "lucide-react";

/** Studios use Stripe Standard accounts: the owner manages bank and business details in their own Stripe dashboard. */
const STRIPE_DASHBOARD_URL = "https://dashboard.stripe.com";

export function PayoutsCard() {
  const { toast } = useToast();
  const [status, setStatus] = useState<PayoutStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await api.invoke<PayoutStatus>("stripe-connect", { action: "status" });
      if (!cancelled) setStatus({ connected: Boolean(data?.connected), chargesEnabled: Boolean(data?.chargesEnabled) });
    })();
    return () => { cancelled = true; };
  }, []);

  const state = payoutState(status);

  const startOnboarding = async () => {
    setBusy(true);
    const { data, error } = await api.invoke<{ url?: string }>("stripe-connect", { action: "start" });
    setBusy(false);
    if (error || !data?.url) {
      toast({ title: "Couldn't open payout setup", description: error?.message ?? "Try again in a moment.", variant: "destructive" });
      return;
    }
    window.location.href = data.url;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Payments
          {state.kind === "ready" && <Badge variant="secondary">Payouts on</Badge>}
          {state.kind === "pending" && <Badge variant="outline">Stripe review</Badge>}
        </CardTitle>
        <CardDescription>Students pay by card; Stripe pays the money out to your bank.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">{state.message}</p>
          </div>
          {state.kind === "ready" ? (
            <Button variant="outline" asChild>
              <a href={STRIPE_DASHBOARD_URL} target="_blank" rel="noreferrer">Open Stripe</a>
            </Button>
          ) : (
            <Button onClick={startOnboarding} disabled={busy || state.kind === "loading"}>
              {busy && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {state.kind === "pending" ? "Finish in Stripe" : "Set up payouts"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
