/**
 * JSON-LD for the hosted marketing pages. Plain functions of (siteUrl, live)
 * so the React pages and scripts/prerender-pages.ts emit the same objects.
 */
import { STUDIO_APP, STUDIO_APP_APPLE_ID } from "../../config/studioApp";
import type { MarketingFaq, MarketingPage } from "./pages";

export const ORG_NAME = "Tandava";
export const PUBLISHER_NAME = "Purafield Studio LLC";
export const SUPPORT_EMAIL = "hello@purafieldstudio.com";
export const REPO_URL = "https://github.com/TaylorONeal/tandava";

export function organizationLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: ORG_NAME,
    url: siteUrl,
    logo: `${siteUrl}/icon-512.png`,
    email: SUPPORT_EMAIL,
    parentOrganization: { "@type": "Organization", name: PUBLISHER_NAME },
    sameAs: [REPO_URL],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SUPPORT_EMAIL,
      url: `${siteUrl}/support`,
    },
  };
}

export function websiteLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: ORG_NAME,
    url: siteUrl,
    publisher: { "@id": `${siteUrl}/#organization` },
  };
}

/** The hosted web product. No price is published until decision D1. */
export function webAppLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${siteUrl}/#web-app`,
    name: "Tandava",
    description:
      "Studio management software for yoga, pilates and movement studios: class schedule, class packs, memberships, online booking, check-in and reports.",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Studio management",
    operatingSystem: "Web",
    url: siteUrl,
    publisher: { "@id": `${siteUrl}/#organization` },
    license: "https://www.gnu.org/licenses/agpl-3.0.html",
    codeRepository: REPO_URL,
  };
}

/** The iPhone staff app. Install links only once it is on the App Store. */
export function studioAppLd(siteUrl: string, live: boolean) {
  return {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    "@id": `${siteUrl}/studio-app#app`,
    name: STUDIO_APP.name,
    description:
      "Staff app for studios on Tandava: scan members' check-in passes with the camera, check in from the class roster, see today's classes and share the booking link.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "iOS",
    url: `${siteUrl}/studio-app`,
    publisher: { "@id": `${siteUrl}/#organization` },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    ...(live
      ? { installUrl: STUDIO_APP.appStoreUrl, downloadUrl: STUDIO_APP.appStoreUrl, sameAs: [STUDIO_APP.appStoreUrl] }
      : { releaseNotes: "Coming soon to the App Store.", identifier: `id${STUDIO_APP_APPLE_ID}` }),
  };
}

export function faqLd(faq: MarketingFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbLd(siteUrl: string, page: Pick<MarketingPage, "route" | "h1">) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Tandava", item: siteUrl },
      { "@type": "ListItem", position: 2, name: page.h1, item: `${siteUrl}${page.route}` },
    ],
  };
}

export function homeLd(siteUrl: string, live: boolean) {
  return [organizationLd(siteUrl), websiteLd(siteUrl), webAppLd(siteUrl), studioAppLd(siteUrl, live)];
}

export function landingLd(siteUrl: string, page: MarketingPage, live: boolean) {
  const out: Record<string, unknown>[] = [breadcrumbLd(siteUrl, page)];
  if (page.isAppPage) out.push(studioAppLd(siteUrl, live));
  else out.push(webAppLd(siteUrl));
  if (page.faq.length) out.push(faqLd(page.faq));
  return out;
}
