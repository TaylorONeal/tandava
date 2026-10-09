/**
 * Settings > Billing on the live backend: real Stripe payout status, and the
 * button that starts or resumes Stripe onboarding (stripe-connect function).
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/backend";
import { CreditCard, Loader2 } from "lucide-react";

export function PayoutsCard() {
  const { toast } = useToast();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await api.invoke<{ connected?: boolean }>("stripe-connect", { action: "status" });
      if (!cancelled) setConnected(Boolean(data?.connected));
    })();
    return () => { cancelled = true; };
  }, []);

  const start = async () => {
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
          {connected === true && <Badge variant="secondary">Payouts on</Badge>}
        </CardTitle>
        <CardDescription>Students pay by card; Stripe pays the money out to your bank.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              {connected === null
                ? "Checking your payout account…"
                : connected
                  ? "Your studio can take payments. Update bank or business details in Stripe."
                  : "Payouts are not set up yet, so students cannot pay online."}
            </p>
          </div>
          <Button onClick={start} disabled={busy || connected === null} variant={connected ? "outline" : "default"}>
            {busy && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {connected ? "Open Stripe" : "Set up payouts"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
