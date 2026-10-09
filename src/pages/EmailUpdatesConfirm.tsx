/**
 * /email-updates?c=<token>: confirms an opt-in made on the public booking
 * form (confirmed opt-in). Opening the page changes nothing (mail scanners
 * open links); one tap records the consent through the unsubscribe Edge
 * Function, which verifies the signed, expiring token.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, isBackendConfigured } from "@/lib/backend";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Result = { ok: boolean; studioName?: string | null; error?: string };

export default function EmailUpdatesConfirm() {
  const [params] = useSearchParams();
  const token = params.get("c") ?? "";
  const [studioName, setStudioName] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "saving" | "done" | "invalid" | "superseded" | "error">("loading");

  useEffect(() => {
    if (!token || !isBackendConfigured()) {
      setState("invalid");
      return;
    }
    void api.invoke<Result>("unsubscribe", { c: token, preview: true }).then(({ data, error }) => {
      if (!error && data?.error === "superseded") return setState("superseded");
      if (error || !data?.ok) return setState("invalid");
      setStudioName(data.studioName ?? null);
      setState("ready");
    });
  }, [token]);

  const confirm = async () => {
    setState("saving");
    const { data, error } = await api.invoke<Result>("unsubscribe", { c: token });
    if (!error && data?.error === "superseded") return setState("superseded");
    setState(!error && data?.ok ? "done" : "error");
  };

  const from = studioName ?? "the studio";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Confirm email updates" description="Confirm email updates from a studio." noindex />
      <main className="mx-auto max-w-md px-4 py-12">
        <Card>
          <CardContent className="pt-6 space-y-3">
            {state === "loading" && <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" />}
            {state === "invalid" && (
              <>
                <h1 className="text-xl font-semibold">This link doesn't work</h1>
                <p className="text-sm text-muted-foreground">
                  It may be older than 14 days or incomplete. Tick the email box next time you book and we'll send a new
                  one.
                </p>
              </>
            )}
            {state === "superseded" && (
              <>
                <h1 className="text-xl font-semibold">You unsubscribed after this email</h1>
                <p className="text-sm text-muted-foreground">
                  We kept your unsubscribe, so this older link no longer turns updates on. Tick the email box next time you
                  book if you want them again.
                </p>
              </>
            )}
            {(state === "ready" || state === "saving" || state === "error") && (
              <>
                <h1 className="text-xl font-semibold">Email updates</h1>
                <p className="text-sm text-muted-foreground">
                  Get occasional emails from {from} about classes and offers? You can unsubscribe from any of them in one
                  tap.
                </p>
                <Button onClick={() => void confirm()} disabled={state === "saving"}>
                  {state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Yes, send me updates"}
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
                <h1 className="text-xl font-semibold">You're in</h1>
                <p className="text-sm text-muted-foreground">
                  {from} can now send you occasional updates. Every email has a one-tap unsubscribe link.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
