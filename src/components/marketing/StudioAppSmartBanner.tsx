/**
 * Safari's Smart App Banner for Tandava Studio on /manage pages.
 *
 * Off while the app is in review. On launch day VITE_STUDIO_APP_LIVE=true
 * (src/config/studioApp.ts) turns on the badge, the /studio-app page and this
 * banner together. Safari draws the banner itself from Apple's meta tag, so
 * there is no artwork to keep in sync.
 */
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { STUDIO_APP_LIVE, studioAppBannerContent } from "@/config/studioApp";
import { nativeApp } from "@/lib/native/platform";

export function StudioAppSmartBanner({ live = STUDIO_APP_LIVE }: { live?: boolean }) {
  const { pathname } = useLocation();
  const content = studioAppBannerContent(pathname, live, nativeApp);
  if (!content) return null;
  return (
    <Helmet>
      <meta name="apple-itunes-app" content={content} />
    </Helmet>
  );
}
