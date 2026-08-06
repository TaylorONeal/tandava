/**
 * The five studio presets. Selecting one populates every input, which is how
 * the page gets from landing to a credible answer in three clicks.
 */
import { Star, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PRESETS, type StudioPreset } from "@/lib/studioEcon";
import { usePrefersReducedMotion } from "./useAnimatedNumber";

interface Props {
  activePresetId: string;
  /** True once the user has edited away from the preset's own numbers. */
  dirty: boolean;
  onSelect: (preset: StudioPreset) => void;
}

export function PresetCards({ activePresetId, dirty, onSelect }: Props) {
  const reduced = usePrefersReducedMotion();

  return (
    <div>
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Start from a studio
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRESETS.map((preset) => {
          const active = preset.id === activePresetId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset)}
              aria-pressed={active}
              // Press feedback is a 2px settle. Under reduced motion the
              // transition class is dropped and the card simply stays put.
              className={`relative rounded-xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                reduced ? "" : "transition-[colors,transform] duration-150 active:translate-y-0.5"
              } ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              }`}
              data-testid={`preset-${preset.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-display text-base leading-tight text-foreground">
                  {preset.name}
                </span>
                {preset.editorsPick && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-[11px] font-medium text-secondary"
                        tabIndex={0}
                        role="note"
                        aria-label={`Editor's pick. ${preset.editorsPickReason}`}
                      >
                        <Star className="h-3 w-3" aria-hidden />
                        Editor&apos;s pick
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs leading-relaxed">
                      {preset.editorsPickReason}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {preset.blurb}
              </p>
              {active && dirty && (
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Info className="h-3 w-3" aria-hidden />
                  edited
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
