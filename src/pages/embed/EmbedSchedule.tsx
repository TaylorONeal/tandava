import { useParams } from "react-router-dom";
import { EmbedLayout, openHosted } from "./EmbedLayout";
import { usePublicStudio, useUpcomingClasses } from "@/hooks/useBooking";
import { Clock, MapPin } from "lucide-react";

interface Row {
  id: string;
  name: string;
  when: string;
  teacher?: string;
  location?: string;
  spotsLeft: number;
}

// Shown in demo mode (no backend) so the widget renders for previews.
const DEMO_ROWS: Row[] = [
  { id: "d1", name: "Power Vinyasa Flow", when: "Today · 6:00 PM", teacher: "Maya R.", location: "Main Studio", spotsLeft: 4 },
  { id: "d2", name: "Gentle Restorative", when: "Tomorrow · 9:00 AM", teacher: "Luna P.", location: "Meditation Room", spotsLeft: 12 },
  { id: "d3", name: "Heated Hatha", when: "Tomorrow · 5:30 PM", teacher: "James P.", location: "Hot Room", spotsLeft: 0 },
  { id: "d4", name: "Sunrise Flow", when: "Wed · 6:30 AM", teacher: "Sarah C.", location: "Main Studio", spotsLeft: 8 },
];

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}

export default function EmbedSchedule() {
  const { slug } = useParams();
  const { data: studio } = usePublicStudio(slug);
  const { data: occurrences } = useUpcomingClasses(studio?.id);

  const rows: Row[] =
    occurrences && occurrences.length > 0
      ? occurrences.slice(0, 8).map((o) => ({
          id: o.id,
          name: o.offering?.name ?? "Class",
          when: formatWhen(o.starts_at),
          teacher: o.teacher?.display_name ?? undefined,
          location: o.location?.name ?? o.room ?? undefined,
          spotsLeft: Math.max(0, (o.capacity ?? 0) - (o.booked_count ?? 0)),
        }))
      : DEMO_ROWS;

  const title = studio?.name ?? "Class Schedule";

  return (
    <EmbedLayout>
      <div className="space-y-2">
        <h2 className="text-base font-semibold mb-1">{title}</h2>
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
        <p className="pt-1 text-center text-[10px] text-muted-foreground">
          Powered by Tandava
        </p>
      </div>
    </EmbedLayout>
  );
}
