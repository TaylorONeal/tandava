/**
 * The App Store spot for Tandava Studio.
 *
 * Coming soon: a plain label, no Apple artwork (Apple's badge is only for apps
 * that are on the store). Live: Apple's official badge, linked to the listing.
 * The switch is VITE_STUDIO_APP_LIVE (src/config/studioApp.ts).
 */
import { Smartphone } from "lucide-react";
import { STUDIO_APP, STUDIO_APP_LIVE, studioAppAvailability } from "@/config/studioApp";

export function StudioAppBadge({ live = STUDIO_APP_LIVE, className = "" }: { live?: boolean; className?: string }) {
  if (live) {
    return (
      <a
        href={STUDIO_APP.appStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-block ${className}`}
        data-testid="studio-app-badge-live"
      >
        <img src={STUDIO_APP.badgeUrl} alt={STUDIO_APP.badgeAlt} width={120} height={40} className="h-10 w-auto" />
      </a>
    );
  }
  return (
    <span
      className={`inline-flex h-10 items-center gap-2 rounded-xl border-2 border-current px-3 text-sm font-bold ${className}`}
      data-testid="studio-app-badge-soon"
    >
      <Smartphone className="h-4 w-4" aria-hidden />
      {studioAppAvailability(false)}
    </span>
  );
}
