/**
 * The next two weeks of real classes, with one-tap cancel (LP-1d).
 *
 * Cancelling shows the owner exactly who is affected and what happens to each
 * person's payment before anything changes (preview_class_cancellation), then
 * the cancel-class edge function does it all at once: credits back, drop-ins
 * refunded, everyone emailed.
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api as backendApi, data as backendData } from "@/lib/backend";
import type { ClassCancelPreview, UpcomingClass } from "@/lib/backend/types";
import {
  describeCancellation, formatMoney, summarizeCancellation, type CancelPerson,
} from "@/lib/classCancel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CalendarX2, CheckCircle2, Loader2 } from "lucide-react";

const DAYS_AHEAD = 14;

const SOURCE_LABEL: Record<CancelPerson["source"], string> = {
  pack: "Pack class back",
  membership: "Membership class back",
  drop_in: "Refund",
  free: "Free booking",
  waitlist: "Waitlist",
};

function dayKey(iso: string, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}
function dayHeading(iso: string, tz: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "short", day: "numeric" }).format(new Date(iso));
}
function timeOf(iso: string, tz: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

interface CancelResult {
  people: CancelPerson[];
  refunds: { sent: number; failed: number; sentCents?: number };
  emailed: number;
  emailUnavailable?: boolean;
}

export function UpcomingClasses({ studioId }: { studioId: string }) {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<UpcomingClass | null>(null);

  const classesQuery = useQuery({
    queryKey: ["studio-classes-ahead", studioId, DAYS_AHEAD],
    queryFn: async () => {
      const { data, error } = await backendData.getStudioClassesAhead(studioId, DAYS_AHEAD);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const timezone = classesQuery.data?.[0]?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const byDay = useMemo(() => {
    const groups = new Map<string, UpcomingClass[]>();
    for (const c of classesQuery.data ?? []) {
      const k = dayKey(c.starts_at, timezone);
      groups.set(k, [...(groups.get(k) ?? []), c]);
    }
    return [...groups.values()];
  }, [classesQuery.data, timezone]);

  return (
    <section className="space-y-3" aria-labelledby="upcoming-heading">
      <div>
        <h2 id="upcoming-heading" className="text-lg font-semibold">Next two weeks</h2>
        <p className="text-sm text-muted-foreground">
          Teacher out? Cancel one class here. Everyone booked gets their class or money back and an email.
        </p>
      </div>

      {classesQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading classes</div>
      ) : classesQuery.error ? (
        <p className="text-sm text-destructive">Could not load upcoming classes: {(classesQuery.error as Error).message}</p>
      ) : byDay.length === 0 ? (
        <Card><CardContent className="py-6 text-sm text-muted-foreground">No classes in the next two weeks yet.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {byDay.map((classes) => (
            <div key={classes[0].id} className="space-y-1.5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {dayHeading(classes[0].starts_at, timezone)}
              </h3>
              <Card>
                <CardContent className="p-0 divide-y">
                  {classes.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3" data-testid="upcoming-class">
                      <span className="w-20 shrink-0 text-sm tabular-nums">{timeOf(c.starts_at, timezone)}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-medium ${c.is_cancelled ? "line-through text-muted-foreground" : ""}`}>{c.class_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.booked} of {c.capacity} booked{c.waitlisted ? ` · ${c.waitlisted} waiting` : ""}
                        </p>
                      </div>
                      {c.is_cancelled ? (
                        <Badge variant="secondary">Cancelled</Badge>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setTarget(c)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <CancelClassDialog
        target={target}
        timezone={timezone}
        onClose={() => setTarget(null)}
        onDone={() => queryClient.invalidateQueries({ queryKey: ["studio-classes-ahead", studioId] })}
      />
    </section>
  );
}

function CancelClassDialog({
  target, timezone, onClose, onDone,
}: { target: UpcomingClass | null; timezone: string; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CancelResult | null>(null);

  const previewQuery = useQuery({
    queryKey: ["class-cancel-preview", target?.id],
    enabled: Boolean(target),
    staleTime: 0,
    queryFn: async (): Promise<ClassCancelPreview> => {
      const { data, error: e } = await backendData.previewClassCancellation(target!.id);
      if (e || !data) throw new Error(e?.message ?? "Could not load who is booked");
      return data;
    },
  });

  const people = previewQuery.data?.people ?? [];
  const summary = summarizeCancellation(people);
  const lines = describeCancellation(summary);
  const affected = summary.booked + summary.waitlisted;
  const toTell = summary.reachable;

  const close = () => {
    setNote(""); setError(null); setResult(null); setWorking(false);
    onClose();
  };

  const retryRefunds = async () => {
    if (!target || !result) return;
    setWorking(true);
    const { data, error: e } = await backendApi.invoke<{ refunds?: { sent: number; failed: number; sentCents?: number }; error?: string }>(
      "cancel-class", { occurrenceId: target.id, retryRefunds: true },
    );
    setWorking(false);
    if (!data?.refunds || data.error || e) {
      setError(data?.error ?? e?.message ?? "Could not retry the refunds.");
      return;
    }
    const r = data.refunds;
    setError(null);
    setResult({
      ...result,
      refunds: {
        sent: result.refunds.sent + r.sent,
        failed: r.failed,
        sentCents: (result.refunds.sentCents ?? 0) + (r.sentCents ?? 0),
      },
    });
  };

  const confirm = async () => {
    if (!target) return;
    setWorking(true);
    setError(null);
    const { data, error: e } = await backendApi.invoke<CancelResult & { error?: string }>("cancel-class", {
      occurrenceId: target.id,
      reason: note.trim() || undefined,
      message: note.trim() || undefined,
    });
    setWorking(false);
    if (!data || data.error || e) {
      setError(data?.error ?? e?.message ?? "Could not cancel the class.");
      return;
    }
    setResult(data);
    onDone();
  };

  const when = target ? `${dayHeading(target.starts_at, timezone)}, ${timeOf(target.starts_at, timezone)}` : "";
  const done = result ? summarizeCancellation(result.people) : null;

  return (
    <Dialog open={target !== null} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="max-w-lg">
        {result && done ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" />Class cancelled</DialogTitle>
              <DialogDescription>{target?.class_name}, {when}</DialogDescription>
            </DialogHeader>
            <ul className="space-y-1.5 text-sm" data-testid="cancel-result">
              {done.packReturns + done.membershipReturns > 0 && (
                <li>{done.packReturns + done.membershipReturns} {done.packReturns + done.membershipReturns === 1 ? "class" : "classes"} returned to packs and memberships.</li>
              )}
              {result.refunds.sent > 0 && <li>{formatMoney(result.refunds.sentCents ?? 0, done.currency)} refunded to {result.refunds.sent} {result.refunds.sent === 1 ? "card" : "cards"}.</li>}
              {result.emailUnavailable
                ? <li className="text-destructive">Email is not set up for this studio yet, so nobody was emailed. Please let them know.</li>
                : <li>{result.emailed} {result.emailed === 1 ? "email" : "emails"} sent.</li>}
              {done.booked + done.waitlisted === 0 && <li>Nobody was booked.</li>}
            </ul>
            {result.refunds.failed > 0 && (
              <p className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                {result.refunds.failed} {result.refunds.failed === 1 ? "refund" : "refunds"} did not go through yet. The bookings are cancelled and those students were told you are arranging it. Refund them from Stripe, or contact support.
              </p>
            )}
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <DialogFooter className="gap-2 sm:gap-0">
              {result.refunds.failed > 0 && (
                <Button variant="outline" onClick={() => void retryRefunds()} disabled={working}>
                  {working && <Loader2 className="h-4 w-4 me-2 animate-spin" />}Try refunds again
                </Button>
              )}
              <Button onClick={close}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><CalendarX2 className="h-5 w-5" />Cancel {target?.class_name}?</DialogTitle>
              <DialogDescription>{when}</DialogDescription>
            </DialogHeader>

            {previewQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Checking who is booked</div>
            ) : previewQuery.error ? (
              <p className="text-sm text-destructive">{(previewQuery.error as Error).message}</p>
            ) : (
              <div className="space-y-4">
                <ul className="space-y-1 text-sm" data-testid="cancel-consequences">
                  {lines.map((l) => <li key={l}>{l}</li>)}
                </ul>
                {people.length > 0 && (
                  <ul className="max-h-48 overflow-y-auto rounded-md border divide-y text-sm">
                    {people.map((p) => (
                      <li key={p.booking_id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="truncate">{p.name ?? p.email ?? "Student"}</span>
                        <Badge variant={p.source === "drop_in" ? "default" : "secondary"} className="shrink-0">
                          {p.source === "drop_in" ? `${SOURCE_LABEL.drop_in} ${formatMoney(p.refund_cents, p.currency)}` : SOURCE_LABEL[p.source]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
                {affected > 0 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="cancel-note">Note to students (optional)</Label>
                    <Textarea
                      id="cancel-note"
                      value={note}
                      maxLength={500}
                      rows={3}
                      placeholder="Maya is unwell tonight. Sorry, and see you Thursday."
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={close} disabled={working}>Keep class</Button>
              <Button
                variant="destructive"
                onClick={() => void confirm()}
                disabled={working || previewQuery.isLoading || Boolean(previewQuery.error)}
              >
                {working && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                {toTell > 0 ? `Cancel and tell ${toTell} ${toTell === 1 ? "person" : "people"}` : "Cancel class"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
