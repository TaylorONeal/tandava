/**
 * /unsubscribe?t=<token>: the footer link in automation emails (PRD-027).
 * Shows who the email came from and asks for one tap; opening the page never
 * changes anything (mail scanners open links). The unsubscribe Edge Function
 * verifies the signed token and records the opt-out.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, isBackendConfigured } from "@/lib/backend";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Result = { ok: boolean; studioName?: string | null; error?: string };

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("t") ?? "";
  const [studioName, setStudioName] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "saving" | "done" | "invalid" | "error">("loading");

  useEffect(() => {
    if (!token || !isBackendConfigured()) {
      setState("invalid");
      return;
    }
    void api.invoke<Result>("unsubscribe", { t: token, preview: true }).then(({ data, error }) => {
      if (error || !data?.ok) return setState("invalid");
      setStudioName(data.studioName ?? null);
      setState("ready");
    });
  }, [token]);

  const confirm = async () => {
    setState("saving");
    const { data, error } = await api.invoke<Result>("unsubscribe", { t: token });
    setState(!error && data?.ok ? "done" : "error");
  };

  const from = studioName ?? "this studio";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Unsubscribe" description="Stop marketing emails from a studio." noindex />
      <main className="mx-auto max-w-md px-4 py-12">
        <Card>
          <CardContent className="pt-6 space-y-3">
            {state === "loading" && <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" />}
            {state === "invalid" && (
              <>
                <h1 className="text-xl font-semibold">This link doesn't work</h1>
                <p className="text-sm text-muted-foreground">
                  The unsubscribe link is incomplete or was changed. Reply to the studio's email and they can take you
                  off the list.
                </p>
              </>
            )}
            {(state === "ready" || state === "saving" || state === "error") && (
              <>
                <h1 className="text-xl font-semibold">Unsubscribe</h1>
                <p className="text-sm text-muted-foreground">
                  Stop marketing emails from {from}? Booking confirmations and receipts still arrive.
                </p>
                <Button onClick={() => void confirm()} disabled={state === "saving"}>
                  {state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Unsubscribe"}
                </Button>
                {state === "error" && (
                  <p role="alert" className="text-xs text-destructive">
                    We couldn't save that. Please try again in a minute.
                  </p>
                )}
              </>
            )}
            {state === "done" && (
              <>
                <h1 className="text-xl font-semibold">You're unsubscribed</h1>
                <p className="text-sm text-muted-foreground">
                  {from} won't send you marketing emails. Booking confirmations and receipts still arrive.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
