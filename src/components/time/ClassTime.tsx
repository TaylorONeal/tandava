import { useMemo } from "react";
import { Clock } from "lucide-react";
import { describeClassTime, deviceTimeZone, type ClassDelivery } from "@/lib/time/classTime";

/**
 * A class time as people read it: studio time first, the zone in plain words,
 * and the viewer's own time underneath only when it differs (PRD-022).
 */
export function ClassTime({
  startsAt,
  endsAt,
  studioTimeZone,
  delivery,
  compact = false,
  showIcon = true,
}: {
  startsAt: string;
  endsAt?: string | null;
  studioTimeZone: string;
  delivery?: ClassDelivery;
  /** One line ("Sat, Oct 10 · 6:00 AM Hawaii time"), viewer line below when it differs. */
  compact?: boolean;
  showIcon?: boolean;
}) {
  const t = useMemo(
    () =>
      describeClassTime({
        startsAt,
        endsAt,
        studioTimeZone,
        viewerTimeZone: deviceTimeZone(),
        delivery,
      }),
    [startsAt, endsAt, studioTimeZone, delivery],
  );

  if (compact) {
    // The viewer line is visible text, not a tooltip: touch devices can't hover.
    return (
      <span>
        {t.short}
        {t.viewerNote && <span className="block">{t.viewerNote}</span>}
      </span>
    );
  }

  return (
    <div className="flex items-start gap-2">
      {showIcon && <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" aria-hidden="true" />}
      <div>
        <p>
          {t.primary}
          {t.zoneLabel && <span className="text-muted-foreground"> · {t.zoneLabel}</span>}
        </p>
        {t.viewerNote && <p className="text-xs text-muted-foreground">{t.viewerNote}</p>}
      </div>
    </div>
  );
}
