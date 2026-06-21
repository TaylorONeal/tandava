/**
 * JSON-LD Structured Data Generators
 *
 * These functions produce Schema.org structured data objects
 * that are injected into page <head> via <SEOHead structuredData={...} />.
 *
 * Reference: https://schema.org
 * Testing: https://search.google.com/test/rich-results
 */

const SITE_URL = import.meta.env.VITE_APP_URL || "https://tandava.yoga";

/** Organization schema — used on the homepage */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: import.meta.env.VITE_APP_NAME || "Tandava",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${SITE_URL}/contact`,
    },
  };
}

/** WebSite schema with search action — used on the homepage */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: import.meta.env.VITE_APP_NAME || "Tandava",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/schedule?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** LocalBusiness schema for a yoga studio */
export function studioSchema(studio: {
  name: string;
  slug: string;
  description?: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number;
  reviewCount?: number;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    additionalType: "https://schema.org/SportsActivityLocation",
    name: studio.name,
    description: studio.description || undefined,
    url: `${SITE_URL}/events/${studio.slug}`,
    image: studio.image_url || undefined,
    telephone: studio.phone || undefined,
    email: studio.email || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: studio.address,
      addressLocality: studio.city,
      addressRegion: studio.state,
      postalCode: studio.zip,
      addressCountry: studio.country || "US",
    },
  };

  if (studio.latitude && studio.longitude) {
    data.geo = {
      "@type": "GeoCoordinates",
      latitude: studio.latitude,
      longitude: studio.longitude,
    };
  }

  if (studio.rating && studio.reviewCount) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: studio.rating,
      reviewCount: studio.reviewCount,
    };
  }

  if (studio.website) {
    data.sameAs = [studio.website];
  }

  return data;
}

/** Event schema for a yoga class */
export function classEventSchema(classData: {
  title: string;
  description?: string | null;
  starts_at: string;
  ends_at: string;
  studio_name: string;
  studio_slug: string;
  instructor_name: string;
  address: string;
  city: string;
  state: string;
  price_cents?: number | null;
  capacity: number;
  spots_left: number;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: classData.title,
    description: classData.description || `Yoga class at ${classData.studio_name}`,
    startDate: classData.starts_at,
    endDate: classData.ends_at,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: classData.studio_name,
      address: {
        "@type": "PostalAddress",
        streetAddress: classData.address,
        addressLocality: classData.city,
        addressRegion: classData.state,
      },
    },
    organizer: {
      "@type": "Organization",
      name: classData.studio_name,
      url: `${SITE_URL}/events/${classData.studio_slug}`,
    },
    performer: {
      "@type": "Person",
      name: classData.instructor_name,
    },
    maximumAttendeeCapacity: classData.capacity,
    remainingAttendeeCapacity: classData.spots_left,
  };

  if (classData.price_cents != null) {
    data.offers = {
      "@type": "Offer",
      price: (classData.price_cents / 100).toFixed(2),
      priceCurrency: "USD",
      availability:
        classData.spots_left > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
      url: `${SITE_URL}/schedule`,
    };
  }

  return data;
}

/** Person schema for an instructor */
export function instructorSchema(instructor: {
  name: string;
  slug: string;
  bio?: string | null;
  image_url?: string | null;
  specialties?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: instructor.name,
    url: `${SITE_URL}/instructors/${instructor.slug}`,
    description: instructor.bio || undefined,
    image: instructor.image_url || undefined,
    jobTitle: "Yoga Instructor",
    knowsAbout: instructor.specialties || [],
  };
}

/** BlogPosting schema for an individual blog article (SEO + AEO). */
export function blogPostingSchema(post: {
  title: string;
  description: string;
  slug: string;
  author: string;
  datePublished: string;
  dateModified: string;
  image?: string;
  tags?: string[];
  categoryName?: string;
}) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.image
      ? post.image.startsWith("http")
        ? post.image
        : `${SITE_URL}${post.image}`
      : `${SITE_URL}/og-image.png`,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: import.meta.env.VITE_APP_NAME || "Tandava",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/favicon.ico`,
      },
    },
    articleSection: post.categoryName || undefined,
    keywords: post.tags?.length ? post.tags.join(", ") : undefined,
  };
}

/** Blog (CollectionPage) schema listing recent posts — used on /blog. */
export function blogSchema(posts: Array<{ title: string; slug: string; description: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${import.meta.env.VITE_APP_NAME || "Tandava"} Blog`,
    url: `${SITE_URL}/blog`,
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      url: `${SITE_URL}/blog/${p.slug}`,
    })),
  };
}

/**
 * FAQPage schema — Answer Engine Optimization (AEO). Pass question/answer
 * pairs to make content eligible for rich results and AI answer surfaces.
 */
export function faqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/** BreadcrumbList schema */
export function breadcrumbSchema(
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
