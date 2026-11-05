import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, XCircle, ScanLine, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/types/roles";
import { data } from "@/lib/backend";
import { runScan } from "@/lib/checkin/scanFlow";
import { canScanPasses, scanFeedback, scanOnce } from "@/lib/native/scanner";

type Shown = { title: string; detail: string; tone: "success" | "warning" | "error"; at: string };

/** Front desk and teacher scan-to-check-in. Native Studio app only; the server decides who may check whom in. */
export default function ScanCheckin() {
  const { permissions } = useAuth();
  const queryClient = useQueryClient();
  const [shown, setShown] = useState<Shown | null>(null);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(0);
  const inFlight = useRef(false);
  const allowed = hasPermission(permissions, "studio.checkin") || hasPermission(permissions, "studio.teach");

  const show = async (next: Omit<Shown, "at"> & { recorded?: boolean }) => {
    setShown({ title: next.title, detail: next.detail, tone: next.tone, at: new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) });
    await scanFeedback(next.tone);
  };

  const scan = async () => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true);
    try {
      const view = await runScan(scanOnce, pass => data.checkInWithPass(pass));
      if (!view) return;
      await show(view);
      if (view.recorded) {
        setCount(n => n + 1);
        await queryClient.invalidateQueries({ queryKey: ["teaching-roster"] });
        await queryClient.invalidateQueries({ queryKey: ["teaching-classes"] });
      }
    } finally {
      inFlight.current = false; setBusy(false);
    }
  };

  const Icon = shown?.tone === "success" ? CheckCircle2 : shown?.tone === "warning" ? AlertTriangle : XCircle;
  const toneClass = shown?.tone === "success" ? "bg-emerald-500 text-white" : shown?.tone === "warning" ? "bg-amber-400 text-black" : "bg-rose-600 text-white";

  return (
    <div className="min-h-screen bg-background flex flex-col px-5 pb-10 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <SEOHead title="Scan passes" noindex />
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ChevronLeft className="h-4 w-4" />Back</Link>
      <h1 className="mt-4 text-4xl font-black tracking-tight">Scan passes</h1>
      <p className="mt-2 text-muted-foreground">Members open My Schedule and tap Check-in pass. Scan it and they're in.</p>
      {!allowed ? (
        <p role="alert" className="mt-8 rounded-2xl border p-5">Scanning is for studio staff. Ask the studio owner to add you as front desk or teacher.</p>
      ) : !canScanPasses() ? (
        <p role="note" className="mt-8 rounded-2xl border p-5">Scanning works in the Tandava Studio app on iPhone. On the web, check people in from the class roster.</p>
      ) : (
        <>
          <div aria-live="polite" className="mt-8 min-h-48">
            {shown && (
              <div className={`rounded-3xl p-6 ${toneClass}`} data-testid="scan-result">
                <Icon className="h-10 w-10" aria-hidden />
                <p className="mt-3 text-2xl font-extrabold leading-tight">{shown.title}</p>
                <p className="mt-2 opacity-90">{shown.detail}</p>
                <p className="mt-3 text-xs opacity-75">Scanned {shown.at}</p>
              </div>
            )}
          </div>
          <div className="mt-auto space-y-3">
            {count > 0 && <p className="text-center text-sm text-muted-foreground">{count} checked in this session</p>}
            <Button size="lg" className="h-16 w-full rounded-2xl text-lg font-bold" disabled={busy} onClick={scan}>
              <ScanLine className="h-6 w-6 me-2" aria-hidden />{busy ? "Scanning…" : shown ? "Scan next" : "Scan a pass"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
