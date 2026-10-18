import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { data } from "@/lib/backend";
import { useAuth } from "@/contexts/AuthContext";
import { TeachLayout } from "@/components/teach/TeachLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { TeachingClass } from "@/lib/backend/types";

function classTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    timeZone: timeZone || "UTC", timeZoneName: "short",
  }).format(new Date(value));
}

export function TeachingClasses({ title }: { title: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<TeachingClass | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const inFlight = useRef(false);
  const classes = useQuery({
    queryKey: ["teaching-classes", user?.id], enabled: Boolean(user), retry: 1,
    queryFn: async () => {
      const result = await data.getMyTeachingClasses();
      if (result.error) throw new Error(result.error.message);
      return result.data ?? [];
    },
  });
  const roster = useQuery({
    queryKey: ["teaching-roster", user?.id, selected?.occurrence_id],
    enabled: Boolean(user && selected), retry: 1,
    queryFn: async () => {
      const result = await data.getTeachingRoster(selected!.occurrence_id);
      if (result.error) throw new Error(result.error.message);
      return result.data ?? [];
    },
  });

  const checkIn = async (bookingId: string) => {
    if (inFlight.current || !selected) return;
    inFlight.current = true;
    setPendingId(bookingId);
    try {
      const result = await data.checkInTeachingBooking(bookingId);
      if (result.error) throw new Error(result.error.message);
      if (!result.data || result.data.id !== bookingId || result.data.status !== "checked_in") throw new Error("Attendance was not confirmed. Refresh the roster and try again.");
      // Show only attendance acknowledged by the server, even if the refresh then fails.
      queryClient.setQueryData<typeof roster.data>(["teaching-roster", user?.id, selected.occurrence_id],
        rows => rows?.map(row => row.booking_id === bookingId ? { ...row, status: "checked_in" } : row));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["teaching-roster", user?.id, selected.occurrence_id] }),
        queryClient.invalidateQueries({ queryKey: ["teaching-classes", user?.id] }),
      ]);
      toast({ title: "Attendance recorded" });
    } catch (error) {
      const refreshed = await roster.refetch();
      if (!refreshed.error && refreshed.data?.some(row => row.booking_id === bookingId && row.status === "checked_in")) {
        await queryClient.invalidateQueries({ queryKey: ["teaching-classes", user?.id] });
        toast({ title: "Attendance confirmed from roster" });
      } else {
        toast({ title: "Could not confirm check-in", description: error instanceof Error ? error.message : "Refresh the roster before retrying.", variant: "destructive" });
      }
    } finally {
      inFlight.current = false;
      setPendingId(null);
    }
  };

  return <TeachLayout>
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">Your assigned classes in the next 14 days. Times are shown in each studio's timezone.</p></div>
      {classes.isPending ? <p role="status">Loading your classes…</p>
        : classes.error ? <div role="alert"><p>Couldn't load your teaching schedule.</p><Button onClick={() => classes.refetch()}>Retry schedule</Button></div>
        : !classes.data?.length ? <p>No assigned classes in the next 14 days.</p>
        : classes.data.map(cls => <Card key={cls.occurrence_id}>
          <CardHeader><CardTitle>{cls.offering_name}{cls.is_cancelled ? " — Cancelled" : ""}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p>{cls.studio_name} · {[cls.location_name, cls.room].filter(Boolean).join(" · ")}</p>
            <p>{classTime(cls.starts_at, cls.studio_timezone)}</p>
            <p>{cls.booked} / {cls.capacity} booked · {cls.checked_in} checked in</p>
            <Button onClick={() => setSelected(cls)} disabled={cls.is_cancelled}>View roster for {cls.offering_name}</Button>
          </CardContent>
        </Card>)}
    </div>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open && !inFlight.current) setSelected(null); }}>
      <DialogContent onEscapeKeyDown={event => { if (inFlight.current) event.preventDefault(); }} onPointerDownOutside={event => { if (inFlight.current) event.preventDefault(); }}>
        <DialogHeader><DialogTitle>{selected?.offering_name} roster</DialogTitle>
          <DialogDescription>Check-in opens 60 minutes before class and closes when class ends. Recorded attendance cannot be undone here.</DialogDescription></DialogHeader>
        <Button variant="outline" disabled={pendingId !== null || roster.isFetching} onClick={() => roster.refetch()}>Refresh roster</Button>
        {roster.isPending ? <p role="status">Loading roster…</p>
          : roster.error ? <div role="alert"><p>Couldn't load this roster.</p><Button onClick={() => roster.refetch()}>Retry roster</Button></div>
          : !roster.data?.length ? <p>No attendees available for this class.</p>
          : <ul className="space-y-3 max-h-[60vh] overflow-auto">{roster.data.map(attendee => <li key={attendee.booking_id} className="flex items-center justify-between gap-4">
            <span>{attendee.student_name}</span>
            {attendee.status === "confirmed"
              ? <Button aria-label={`Check in ${attendee.student_name}`} disabled={pendingId !== null} onClick={() => checkIn(attendee.booking_id)}>{pendingId === attendee.booking_id ? "Recording…" : "Check in"}</Button>
              : <span>{attendee.status === "checked_in" ? "Checked in" : "Waitlisted"}</span>}
          </li>)}</ul>}
      </DialogContent>
    </Dialog>
  </TeachLayout>;
}
