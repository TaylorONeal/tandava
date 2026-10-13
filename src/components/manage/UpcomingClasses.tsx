/**
 * The next two weeks of real classes, with one-tap cancel (LP-1d).
 *
 * Cancelling shows the owner exactly who is affected and what happens to each
 * person's payment before anything changes (preview_class_cancellation), then
 * the cancel-class edge function does it all at once: credits back, drop-ins
 * refunded, everyone emailed.
 *
 * What was sent is always read back from the database (class_cancel_followup),
 * so a lost response or a half-finished run shows what is still owed, and a
 * cancelled class with anything outstanding offers "Finish follow-up".
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api as backendApi, data as backendData } from "@/lib/backend";
import type { ClassCancelPreview, UpcomingClass } from "@/lib/backend/types";
import {
  describeCancellation, describeFollowup, formatMoney, summarizeCancellation,
  type CancelFollowup, type CancelPerson,
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

interface CancelResponse {
  cancelled?: boolean;
  followup?: CancelFollowup;
  emailUnavailable?: boolean;
  error?: string;
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

  // Past cancelled classes come back only while they still owe a refund or an email.
  const { overdue, byDay } = useMemo(() => {
    const now = Date.now();
    const groups = new Map<string, UpcomingClass[]>();
    const late: UpcomingClass[] = [];
    for (const c of classesQuery.data ?? []) {
      if (new Date(c.starts_at).getTime() < now) { late.push(c); continue; }
      const k = dayKey(c.starts_at, timezone);
      groups.set(k, [...(groups.get(k) ?? []), c]);
    }
    return { overdue: late, byDay: [...groups.values()] };
  }, [classesQuery.data, timezone]);

  const renderRow = (c: UpcomingClass, past = false) => (
    <div key={c.id} className="flex items-center gap-3 px-4 py-3" data-testid="upcoming-class">
      <span className="w-20 shrink-0 text-sm tabular-nums">{past ? dayHeading(c.starts_at, timezone).split(",")[0] : timeOf(c.starts_at, timezone)}</span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${c.is_cancelled ? "line-through text-muted-foreground" : ""}`}>{c.class_name}</p>
        <p className="text-xs text-muted-foreground">
          {past
            ? `${dayHeading(c.starts_at, timezone)}, ${timeOf(c.starts_at, timezone)}`
            : `${c.booked} of ${c.capacity} booked${c.waitlisted ? ` · ${c.waitlisted} waiting` : ""}`}
        </p>
      </div>
      {c.is_cancelled ? (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Cancelled</Badge>
          {c.followup_outstanding > 0 && (
            <Button variant="outline" size="sm" onClick={() => setTarget(c)}>Finish follow-up</Button>
          )}
        </div>
      ) : (
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setTarget(c)}>
          Cancel
        </Button>
      )}
    </div>
  );

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
      ) : (
        <div className="space-y-4">
          {overdue.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-amber-700">Still to finish</h3>
              <Card><CardContent className="p-0 divide-y">{overdue.map((c) => renderRow(c, true))}</CardContent></Card>
            </div>
          )}
          {byDay.length === 0 ? (
            <Card><CardContent className="py-6 text-sm text-muted-foreground">No classes in the next two weeks yet.</CardContent></Card>
          ) : byDay.map((classes) => (
            <div key={classes[0].id} className="space-y-1.5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {dayHeading(classes[0].starts_at, timezone)}
              </h3>
              <Card><CardContent className="p-0 divide-y">{classes.map((c) => renderRow(c))}</CardContent></Card>
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
  const [followup, setFollowup] = useState<CancelFollowup | null>(null);
  const [emailUnavailable, setEmailUnavailable] = useState(false);

  const alreadyCancelled = Boolean(target?.is_cancelled);

  const previewQuery = useQuery({
    queryKey: ["class-cancel-preview", target?.id],
    enabled: Boolean(target) && !alreadyCancelled,
    staleTime: 0,
    queryFn: async (): Promise<ClassCancelPreview> => {
      const { data, error: e } = await backendData.previewClassCancellation(target!.id);
      if (e || !data) throw new Error(e?.message ?? "Could not load who is booked");
      return data;
    },
  });

  // A class cancelled earlier: show what its follow-up still owes.
  const followupQuery = useQuery({
    queryKey: ["class-cancel-followup", target?.id],
    enabled: Boolean(target) && alreadyCancelled,
    staleTime: 0,
    queryFn: async (): Promise<CancelFollowup> => {
      const { data, error: e } = await backendData.getClassCancelFollowup(target!.id);
      if (e || !data) throw new Error(e?.message ?? "Could not load this cancellation");
      return data;
    },
  });

  const state = followup ?? followupQuery.data ?? null;

  const people = previewQuery.data?.people ?? [];
  const summary = summarizeCancellation(people);
  const lines = describeCancellation(summary);
  const affected = summary.booked + summary.waitlisted;
  const toTell = summary.reachable;

  const close = () => {
    setNote(""); setError(null); setFollowup(null); setEmailUnavailable(false); setWorking(false);
    onClose();
  };

  /** After an unclear response, read what actually happened instead of guessing. */
  const recover = async (fallback: string) => {
    const { data } = await backendData.getClassCancelFollowup(target!.id);
    if (data?.cancelled) {
      setFollowup(data);
      setError("The class is cancelled, but the follow-up may not have finished. Try again to finish it.");
      onDone();
    } else {
      setError(fallback);
    }
  };

  const run = async (body: Record<string, unknown>, fallback: string) => {
    if (!target) return;
    setWorking(true);
    setError(null);
    const { data, error: e } = await backendApi.invoke<CancelResponse>("cancel-class", { occurrenceId: target.id, ...body });
    if (data?.followup && !data.error && !e) {
      setFollowup(data.followup);
      setEmailUnavailable(Boolean(data.emailUnavailable));
      onDone();
    } else {
      await recover(data?.error ?? e?.message ?? fallback);
    }
    setWorking(false);
  };

  const confirm = () => run({ reason: note.trim() || undefined, message: note.trim() || undefined }, "Could not cancel the class.");
  const resume = () => run({ resume: true }, "Could not finish the follow-up.");

  const markHandled = async () => {
    if (!target) return;
    setWorking(true);
    setError(null);
    const { error: e } = await backendData.markClassCancelHandled(target.id);
    const { data } = await backendData.getClassCancelFollowup(target.id);
    if (data) setFollowup(data);
    if (e) setError(e.message);
    else onDone();
    setWorking(false);
  };

  const when = target ? `${dayHeading(target.starts_at, timezone)}, ${timeOf(target.starts_at, timezone)}` : "";
  const report = state ? describeFollowup(state, emailUnavailable) : null;

  return (
    <Dialog open={target !== null} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="max-w-lg">
        {state && report ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {report.problems.length
                  ? <AlertTriangle className="h-5 w-5 text-amber-600" />
                  : <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                Class cancelled
              </DialogTitle>
              <DialogDescription>{target?.class_name}, {when}</DialogDescription>
            </DialogHeader>
            <ul className="space-y-1.5 text-sm" data-testid="cancel-result">
              {report.done.map((l) => <li key={l}>{l}</li>)}
            </ul>
            {report.problems.length > 0 && (
              <ul className="space-y-1.5 rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert" data-testid="cancel-problems">
                {report.problems.map((l) => (
                  <li key={l} className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />{l}</li>
                ))}
              </ul>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter className="gap-2 sm:gap-0">
              {report.canMarkHandled && (
                <Button variant="ghost" onClick={() => void markHandled()} disabled={working}>Mark as handled</Button>
              )}
              {report.canRetry && (
                <Button variant="outline" onClick={() => void resume()} disabled={working}>
                  {working && <Loader2 className="h-4 w-4 me-2 animate-spin" />}Try again
                </Button>
              )}
              <Button onClick={close}>Done</Button>
            </DialogFooter>
          </>
        ) : alreadyCancelled ? (
          <>
            <DialogHeader>
              <DialogTitle>{target?.class_name}</DialogTitle>
              <DialogDescription>{when}</DialogDescription>
            </DialogHeader>
            {followupQuery.error
              ? <p className="text-sm text-destructive">{(followupQuery.error as Error).message}</p>
              : <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Checking what went out</div>}
            <DialogFooter><Button onClick={close}>Close</Button></DialogFooter>
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
