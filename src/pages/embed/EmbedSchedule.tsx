import { useParams } from "react-router-dom";
import { EmbedLayout, openHosted } from "./EmbedLayout";
import { usePublicSchedule } from "@/hooks/useBooking";
import { isBackendConfigured } from "@/lib/backend";
import { Clock, MapPin } from "lucide-react";

interface Row {
  id: string;
  name: string;
  when: string;
  location?: string;
  spotsLeft: number;
}

// Shown only in demo mode (no backend) so the widget renders for previews.
const DEMO_ROWS: Row[] = [
  { id: "d1", name: "Power Vinyasa Flow", when: "Today · 6:00 PM", location: "Main Studio", spotsLeft: 4 },
  { id: "d2", name: "Gentle Restorative", when: "Tomorrow · 9:00 AM", location: "Meditation Room", spotsLeft: 12 },
  { id: "d3", name: "Heated Hatha", when: "Tomorrow · 5:30 PM", location: "Hot Room", spotsLeft: 0 },
  { id: "d4", name: "Sunrise Flow", when: "Wed · 6:30 AM", location: "Main Studio", spotsLeft: 8 },
];

// Render class times in the STUDIO's timezone, not the visitor's browser zone.
function formatWhen(iso: string, timeZone: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      timeZone,
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return new Date(iso).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
  }
}

export default function EmbedSchedule() {
  const { slug } = useParams();
  const live = isBackendConfigured();
  const { data: schedule, isLoading } = usePublicSchedule(slug);

  // Live deployment: use real data (and a real empty state). Demo: sample rows.
  const studioName = schedule?.[0]?.studio_name;
  const rows: Row[] = live
    ? (schedule ?? []).map((r) => ({
        id: r.occurrence_id,
        name: r.offering_name,
        when: formatWhen(r.starts_at, r.studio_timezone),
        location: r.location_name ?? r.room ?? undefined,
        spotsLeft: Math.max(0, (r.capacity ?? 0) - (r.booked_count ?? 0)),
      }))
    : DEMO_ROWS;

  const title = studioName ?? "Class Schedule";

  return (
    <EmbedLayout>
      <div className="space-y-2">
        <h2 className="text-base font-semibold mb-1">{title}</h2>

        {live && isLoading && (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading classes…</p>
        )}

        {live && !isLoading && rows.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No upcoming classes right now — check back soon.
          </p>
        )}

        {rows.map((r) => {
          const full = r.spotsLeft <= 0;
          return (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/60 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.name}</p>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {r.when}
                  {r.location && (
                    <>
                      <MapPin className="h-3 w-3" /> <span className="truncate">{r.location}</span>
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => openHosted("/schedule")}
                className="shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold text-white"
                style={{ background: full ? "#9ca3af" : "var(--embed-primary, #4fd1c5)" }}
              >
                {full ? "Waitlist" : "Book"}
              </button>
            </div>
          );
        })}

        <p className="pt-1 text-center text-[10px] text-muted-foreground">Powered by Tandava</p>
      </div>
    </EmbedLayout>
  );
}
