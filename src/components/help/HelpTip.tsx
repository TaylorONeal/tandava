import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { helpById } from "@/content/help";

/**
 * The info icon next to a setting or a choice. Opens the help entry in a
 * popover; works on touch (tap), not only hover. Every setting that asks the
 * person to decide something gets one (docs/HELP-AND-FAQ.md).
 */
export function HelpTip({ id, label }: { id: string; label?: string }) {
  const entry = helpById(id);
  if (!entry) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label ?? `About: ${entry.question}`}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="h-4 w-4" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm" align="start">
        <p className="font-medium mb-1">{entry.question}</p>
        {entry.answer.split("\n").map((para, i) => (
          <p key={i} className="text-muted-foreground mb-1 last:mb-0">
            {para}
          </p>
        ))}
        {entry.status === "planned" && (
          <p className="mt-2 text-xs text-muted-foreground">Planned, not live yet.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
