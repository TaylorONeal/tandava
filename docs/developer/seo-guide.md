# SEO Implementation Guide

## Current Implementation

### Per-Page Meta Tags (`react-helmet-async`)

Every page uses `<SEOHead>` to set page-specific titles, descriptions, Open Graph, and Twitter Card data.

```tsx
import { SEOHead } from "@/components/seo/SEOHead";

function MyPage() {
  return (
    <>
      <SEOHead
        title="My Page Title"
        description="Description for search results (max ~155 chars)"
        canonical="/my-page"
        ogType="website"
        structuredData={mySchema()}
      />
      {/* page content */}
    </>
  );
}
```

**Component location:** `src/components/seo/SEOHead.tsx`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | Site name | Appended with " \| Tandava" |
| `description` | string | Default site description | Meta description |
| `canonical` | string | — | Path (e.g., "/studios/zen-flow") |
| `ogImage` | string | `/og-image.png` | Open Graph image URL |
| `ogType` | string | "website" | "website", "article", "profile", "place" |
| `structuredData` | object | — | JSON-LD Schema.org data |
| `noindex` | boolean | false | Prevent indexing (for admin pages) |

### Structured Data (JSON-LD)

Schema.org structured data generators are in `src/lib/structured-data.ts`:

| Function | Schema Type | Used On |
|----------|-------------|---------|
| `organizationSchema()` | Organization | Homepage |
| `websiteSchema()` | WebSite (with SearchAction) | Homepage |
| `studioSchema(studio)` | HealthAndBeautyBusiness | Studio detail pages |
| `classEventSchema(classData)` | Event | Schedule / class detail |
| `instructorSchema(instructor)` | Person | Instructor detail pages |
| `breadcrumbSchema(items)` | BreadcrumbList | Any page with breadcrumbs |

### Sitemap

Generated at build time by `scripts/generate-sitemap.ts`.

```bash
# After build
npx tsx scripts/generate-sitemap.ts
```

For dynamic routes (studios, instructors), extend the script to query Supabase for slugs.

### robots.txt

Located at `public/robots.txt`. Allows all crawlers, disallows authenticated routes, references the sitemap.

## Adding SEO to a New Page

1. Import `SEOHead` and any relevant schema generators
2. Add `<SEOHead>` as the first child of your page component
3. For public pages: set title, description, canonical, and structured data
4. For admin/authenticated pages: set `noindex` to prevent indexing

### Example: Studio Detail Page

```tsx
import { SEOHead } from "@/components/seo/SEOHead";
import { studioSchema, breadcrumbSchema } from "@/lib/structured-data";

function StudioDetail({ studio }) {
  return (
    <>
      <SEOHead
        title={studio.name}
        description={studio.description || `Yoga studio in ${studio.city}`}
        canonical={`/studios/${studio.slug}`}
        ogImage={studio.image_url}
        ogType="place"
        structuredData={[
          studioSchema(studio),
          breadcrumbSchema([
            { name: "Studios", path: "/studios" },
            { name: studio.name, path: `/studios/${studio.slug}` },
          ]),
        ]}
      />
      {/* page content */}
    </>
  );
}
```

## Future: Prerendering

The current SPA architecture means crawlers see an empty `<div id="root">`. For critical SEO improvements:

1. **vite-plugin-prerender** — generates static HTML at build time for specified routes
2. **Routes to prerender**: `/`, `/studios`, `/instructors`, `/schedule`, `/on-demand`
3. Authenticated routes remain as SPA (no crawl value)

This is the recommended next step for SEO — it provides SSR-like benefits without migrating to Next.js.

## Testing SEO

- [Google Rich Results Test](https://search.google.com/test/rich-results) — validate structured data
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) — validate OG tags
- [Twitter Card Validator](https://cards-dev.twitter.com/validator) — validate Twitter cards
- Lighthouse (Chrome DevTools → Lighthouse → SEO audit)
