/**
 * Store links that carry their source (docs/ANALYTICS.md, "Store links").
 *
 * App Store: `pt` (provider token) + `ct` (campaign) + `mt=8`, which App Store
 * Connect reports under App Analytics > Acquisition > Campaigns. Apple ignores
 * `ct` without `pt`, so with no provider token configured the link stays plain.
 *
 * Google Play: `referrer` with utm_source / utm_medium / utm_campaign, which
 * Play Console reports and the app can read through the Install Referrer API.
 *
 * Campaign values use the shared vocabulary: lowercase with underscores, `ct`
 * at most 40 characters. The site's own CTAs pass the visitor's original
 * campaign when there is one, so the store sees the first source, not the site.
 */

import { campaignToken } from "./appContext";

export interface AppStoreLinkInput {
  appId: string;
  providerToken?: string | null;
  campaign?: string | null;
}

export function appStoreUrl({ appId, providerToken, campaign }: AppStoreLinkInput): string {
  const url = new URL(`https://apps.apple.com/app/id${appId}`);
  const pt = providerToken?.trim();
  const ct = campaignToken(campaign, 40);
  if (pt) {
    url.searchParams.set("pt", pt);
    if (ct) url.searchParams.set("ct", ct);
  }
  url.searchParams.set("mt", "8");
  return url.toString();
}

export interface PlayLinkInput {
  packageName: string;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
}

export function playStoreUrl({ packageName, source, medium, campaign }: PlayLinkInput): string {
  const url = new URL("https://play.google.com/store/apps/details");
  url.searchParams.set("id", packageName);
  const ref = new URLSearchParams();
  const s = campaignToken(source, 100);
  const m = campaignToken(medium, 100);
  const c = campaignToken(campaign, 100);
  if (s) ref.set("utm_source", s);
  if (m) ref.set("utm_medium", m);
  if (c) ref.set("utm_campaign", c);
  const referrer = ref.toString();
  if (referrer) url.searchParams.set("referrer", referrer);
  return url.toString();
}

/** The campaign a site CTA passes on: the visitor's own campaign, else the site and placement. */
export function siteCampaign(placement: string, firstTouchCampaign?: string | null): string {
  return campaignToken(firstTouchCampaign, 40) ?? campaignToken(`tandava_site_${placement}`, 40)!;
}
