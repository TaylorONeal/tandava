import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  /** Page title — will be appended with " | Tandava" */
  title?: string;
  /** Meta description (max ~155 characters for search results) */
  description?: string;
  /** Canonical URL path (e.g., "/studios/lotus-flow") */
  canonical?: string;
  /** Open Graph image URL */
  ogImage?: string;
  /** Open Graph type (default: "website") */
  ogType?: "website" | "article" | "profile" | "place";
  /** JSON-LD structured data object — will be serialized into a script tag */
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
  /** Prevent search engines from indexing this page */
  noindex?: boolean;
}

const DEFAULTS = {
  siteName: import.meta.env.VITE_APP_NAME || "Tandava",
  siteUrl: import.meta.env.VITE_APP_URL || "https://tandava.yoga",
  defaultDescription:
    "Book yoga classes, workshops, and appointments. Track your practice, connect with teachers, and join our wellness community.",
  defaultImage: "/og-image.png",
  twitterHandle: "@TandavaYoga",
};

export function SEOHead({
  title,
  description = DEFAULTS.defaultDescription,
  canonical,
  ogImage = DEFAULTS.defaultImage,
  ogType = "website",
  structuredData,
  noindex = false,
}: SEOHeadProps) {
  const fullTitle = title
    ? `${title} | ${DEFAULTS.siteName}`
    : `${DEFAULTS.siteName} | Book Classes & Track Your Practice`;

  const fullCanonical = canonical
    ? `${DEFAULTS.siteUrl}${canonical}`
    : undefined;

  const fullImage = ogImage.startsWith("http")
    ? ogImage
    : `${DEFAULTS.siteUrl}${ogImage}`;

  return (
    <Helmet>
      {/* Core */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {fullCanonical && <link rel="canonical" href={fullCanonical} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={fullImage} />
      {fullCanonical && <meta property="og:url" content={fullCanonical} />}
      <meta property="og:site_name" content={DEFAULTS.siteName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={DEFAULTS.twitterHandle} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(structuredData) ? structuredData : structuredData
          )}
        </script>
      )}
    </Helmet>
  );
}
