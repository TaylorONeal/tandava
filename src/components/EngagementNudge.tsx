import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Flame, Trophy, Sparkles, Heart, Clock, Gift, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type NudgeType =
  | "streak_at_risk"
  | "milestone_approaching"
  | "comeback"
  | "new_class_suggestion"
  | "pack_running_low"
  | "event_recommendation"
  | "friend_activity";

interface EngagementNudgeProps {
  type: NudgeType;
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  /** Whether the user can dismiss this nudge */
  dismissible?: boolean;
  /** Optional extra context — streak count, class name, etc. */
  context?: string;
  className?: string;
  onDismiss?: () => void;
  onAction?: () => void;
}

const nudgeConfig: Record<NudgeType, { icon: typeof Flame; accentClass: string }> = {
  streak_at_risk: { icon: Flame, accentClass: "border-accent-coral/30 bg-accent-coral/5" },
  milestone_approaching: { icon: Trophy, accentClass: "border-accent-gold/30 bg-accent-gold/5" },
  comeback: { icon: Heart, accentClass: "border-primary/30 bg-primary/5" },
  new_class_suggestion: { icon: Sparkles, accentClass: "border-accent-sage/30 bg-accent-sage/5" },
  pack_running_low: { icon: Clock, accentClass: "border-accent-coral/30 bg-accent-coral/5" },
  event_recommendation: { icon: Gift, accentClass: "border-primary/30 bg-primary/5" },
  friend_activity: { icon: Heart, accentClass: "border-accent-sage/30 bg-accent-sage/5" },
};

/**
 * Contextual engagement nudge — designed to feel helpful, not pushy.
 * Follows Reforge principles: right message, right time, right place.
 * - Always dismissible (respects the user)
 * - Frequency-capped (handled by backend nudge_rules)
 * - Contextual (knows what the user cares about)
 */
export function EngagementNudge({
  type,
  title,
  message,
  actionLabel,
  actionUrl,
  dismissible = true,
  context,
  className,
  onDismiss,
  onAction,
}: EngagementNudgeProps) {
  const [dismissed, setDismissed] = useState(false);
  const config = nudgeConfig[type];
  const Icon = config.icon;

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
    // In production: log nudge dismissal via engagement_events
  };

  const handleAction = () => {
    onAction?.();
    // In production: log nudge click via engagement_events
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl border transition-all animate-fade-in",
        config.accentClass,
        className
      )}
    >
      <div className="shrink-0 mt-0.5">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
        {context && (
          <p className="text-xs font-medium mt-1">{context}</p>
        )}
        {actionLabel && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs mt-1.5 -ml-2"
            onClick={handleAction}
            asChild={!!actionUrl}
          >
            {actionUrl ? (
              <a href={actionUrl}>
                {actionLabel} <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            ) : (
              <span>{actionLabel} <ArrowRight className="h-3 w-3 ml-1" /></span>
            )}
          </Button>
        )}
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/**
 * Milestone celebration — shown when a student hits a milestone.
 * Designed to feel like a genuine moment, not gamification theater.
 */
export function MilestoneCelebration({
  milestoneName,
  icon,
  message,
  reward,
  onShare,
  onDismiss,
  className,
}: {
  milestoneName: string;
  icon?: string;
  message: string;
  reward?: string;
  onShare?: () => void;
  onDismiss?: () => void;
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-accent-gold/30 bg-gradient-to-r from-accent-gold/10 to-primary/10 p-5 animate-fade-in-scale",
      className
    )}>
      <button
        onClick={() => { setDismissed(true); onDismiss?.(); }}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="text-center">
        <div className="text-3xl mb-2">{icon || "🎉"}</div>
        <Trophy className="h-6 w-6 text-accent-gold mx-auto mb-1" />
        <h3 className="text-base font-semibold">{milestoneName}</h3>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
        {reward && (
          <p className="text-sm font-medium text-accent-gold mt-2">
            <Gift className="h-3.5 w-3.5 inline mr-1" />
            {reward}
          </p>
        )}
        <div className="flex justify-center gap-2 mt-4">
          {onShare && (
            <Button size="sm" variant="outline" onClick={onShare}>
              Share
            </Button>
          )}
          <Button size="sm" onClick={() => { setDismissed(true); onDismiss?.(); }}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
