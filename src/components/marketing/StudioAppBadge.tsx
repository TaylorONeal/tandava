/**
 * The App Store spot for Tandava Studio.
 *
 * Coming soon: a plain label, no Apple artwork (Apple's badge is only for apps
 * that are on the store). Live: Apple's official badge, linked to the listing.
 * The switch is VITE_STUDIO_APP_LIVE (src/config/studioApp.ts).
 *
 * The live link carries App Store campaign tags (pt, ct, mt) when a provider
 * token is configured, with the visitor's original campaign when there is one
 * (src/lib/analytics/storeLinks.ts). Clicks are counted as store_click.
 */
import { useMemo } from "react";
import { Smartphone } from "lucide-react";
import { STUDIO_APP_APPLE_ID, STUDIO_APP, STUDIO_APP_LIVE, studioAppAvailability } from "@/config/studioApp";
import { WEB_ANALYTICS } from "@/config/analytics";
import { readFirstTouch } from "@/lib/analytics/appContext";
import { appStoreUrl, siteCampaign } from "@/lib/analytics/storeLinks";

export function StudioAppBadge({
  live = STUDIO_APP_LIVE,
  className = "",
  placement = "app_badge",
}: { live?: boolean; className?: string; placement?: string }) {
  const href = useMemo(
    () =>
      appStoreUrl({
        appId: STUDIO_APP_APPLE_ID,
        providerToken: WEB_ANALYTICS.appStoreProviderToken,
        campaign: siteCampaign(placement, readFirstTouch()?.campaign),
      }),
    [placement],
  );
  if (live) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-block ${className}`}
        data-testid="studio-app-badge-live"
        data-placement={placement}
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
