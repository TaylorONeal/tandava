/**
 * "What the model says": three to five sentences assembled from the current
 * results. Templates rather than generation, so every claim ties to a number
 * that is visible elsewhere on the page.
 */
import { FileText } from "lucide-react";
import type { StudioInputs, StudioResults } from "@/lib/studioEcon";
import { buildNarrative } from "@/lib/studioNarrative";

export function NarrativePanel({
  inputs,
  results,
}: {
  inputs: StudioInputs;
  results: StudioResults;
}) {
  const lines = buildNarrative(inputs, results);

  return (
    <section
      className="rounded-xl border border-border bg-muted/50 p-4"
      aria-live="polite"
      data-testid="narrative-panel"
    >
      <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <FileText className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        What the model says
      </h3>
      <ul className="mt-2 space-y-1.5">
        {lines.map((line, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground">
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
