import { useMemo } from "react";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildIcs,
  calendarPlatform,
  googleCalendarUrl,
  icsFileName,
  outlookCalendarUrl,
  type ClassEventInput,
} from "@/lib/calendar/classEvent";

/**
 * Add-to-calendar buttons for a booked class.
 *
 * Every option stays visible; the platform only decides the order, so nobody
 * is locked out by a wrong user-agent guess:
 *   iPhone / iPad / Mac  → Apple Calendar (.ics) first
 *   Android              → Google Calendar first (Chrome downloads .ics files
 *                          instead of offering to add them)
 *   everything else      → Google, Apple/.ics, Outlook
 */
export function AddToCalendar({ event }: { event: ClassEventInput }) {
  const platform = useMemo(
    () => calendarPlatform(typeof navigator === "undefined" ? "" : navigator.userAgent),
    [],
  );

  const downloadIcs = () => {
    const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = icsFileName(event);
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Safari needs the URL alive until the sheet opens.
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  const apple = (
    <Button key="apple" variant="outline" size="sm" onClick={downloadIcs}>
      Apple Calendar
    </Button>
  );
  const google = (
    <Button key="google" asChild variant="outline" size="sm">
      <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
        Google Calendar
      </a>
    </Button>
  );
  const outlook = (
    <Button key="outlook" asChild variant="ghost" size="sm">
      <a href={outlookCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
        Outlook
      </a>
    </Button>
  );
  const ics = (
    <Button key="ics" variant="ghost" size="sm" onClick={downloadIcs}>
      Other (.ics)
    </Button>
  );

  const ordered =
    platform === "apple"
      ? [apple, google, outlook]
      : platform === "android"
        ? [google, outlook, ics]
        : [google, apple, outlook];

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-sm font-medium">
        <CalendarPlus className="h-4 w-4" aria-hidden="true" />
        Add to calendar
      </p>
      <div className="flex flex-wrap gap-2">{ordered}</div>
    </div>
  );
}
