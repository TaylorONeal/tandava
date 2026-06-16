import { useParams } from "react-router-dom";
import { EmbedLayout, openHosted } from "./EmbedLayout";
import { CalendarDays } from "lucide-react";

/**
 * Compact single-event embed. Registration (and payment) happens on the hosted
 * event page in a new tab, so checkout/auth aren't trapped in the iframe.
 */
export default function EmbedEvent() {
  const { id } = useParams();

  return (
    <EmbedLayout>
      <div className="rounded-lg border border-border bg-card/60 p-4 text-center space-y-3">
        <div
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-white"
          style={{ background: "var(--embed-primary, #4fd1c5)" }}
        >
          <CalendarDays className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium">Register for this event</p>
        <button
          onClick={() => openHosted(`/events/${id ?? ""}`)}
          className="w-full rounded-md px-3 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--embed-primary, #4fd1c5)" }}
        >
          View details & register
        </button>
        <p className="text-[10px] text-muted-foreground">Powered by Tandava</p>
      </div>
    </EmbedLayout>
  );
}
