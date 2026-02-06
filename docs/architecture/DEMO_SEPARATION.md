# Demo Website Separation Architecture

How to keep the demo/marketing website cleanly separated from the core application.

---

## Overview

The Tandava repository contains two distinct parts:

1. **Core Application** - The actual studio management software
2. **Demo/Marketing Site** - Public website showcasing the product

These should be:
- **Separable**: Demo can be deployed independently
- **Removable**: Studios deploying their own instance can exclude demo
- **Documented**: Clear instructions for both scenarios

---

## Directory Structure

```
tandava/
├── src/
│   ├── app/                    # Core application
│   │   ├── components/         # App components
│   │   ├── pages/              # App pages (schedule, account, manage, teach)
│   │   ├── contexts/           # App contexts
│   │   ├── hooks/              # App hooks
│   │   └── lib/                # App utilities
│   │
│   └── marketing/              # Demo/marketing site (SEPARABLE)
│       ├── components/         # Marketing components
│       │   ├── Hero.tsx
│       │   ├── FeatureSection.tsx
│       │   ├── PricingTable.tsx
│       │   ├── Testimonials.tsx
│       │   └── SEOLandingPage.tsx
│       ├── pages/              # Marketing pages
│       │   ├── Home.tsx        # Landing page
│       │   ├── Demo.tsx        # Interactive demo
│       │   ├── Pricing.tsx     # Pricing page
│       │   ├── Solutions.tsx   # Solutions hub
│       │   └── solutions/      # SEO landing pages
│       │       ├── TimezoneScheduling.tsx
│       │       ├── QuickBooking.tsx
│       │       ├── MembershipManagement.tsx
│       │       └── ...
│       ├── data/               # Marketing content
│       │   ├── testimonials.ts
│       │   ├── features.ts
│       │   ├── competitorIssues.ts
│       │   └── pricing.ts
│       └── index.ts            # Marketing exports
│
├── public/
│   └── marketing/              # Marketing assets
│       ├── screenshots/
│       ├── videos/
│       └── logos/
│
└── config/
    └── features.ts             # Feature flags including ENABLE_MARKETING_SITE
```

---

## Feature Flag Control

```typescript
// config/features.ts

export const FEATURES = {
  // Set to false for studio deployments
  ENABLE_MARKETING_SITE: process.env.VITE_ENABLE_MARKETING ?? true,

  // Individual marketing features
  ENABLE_DEMO_MODE: process.env.VITE_ENABLE_DEMO ?? true,
  ENABLE_SEO_PAGES: process.env.VITE_ENABLE_SEO ?? true,
  ENABLE_PRICING_PAGE: process.env.VITE_ENABLE_PRICING ?? true,
};
```

---

## Route Configuration

```typescript
// src/App.tsx

import { FEATURES } from '@/config/features';

// Conditional imports for tree-shaking
const MarketingRoutes = FEATURES.ENABLE_MARKETING_SITE
  ? lazy(() => import('@/marketing/routes'))
  : null;

function App() {
  return (
    <Routes>
      {/* Core application routes - always included */}
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/my-schedule" element={<MySchedule />} />
      <Route path="/account" element={<Account />} />
      <Route path="/manage/*" element={<ManageRoutes />} />
      <Route path="/teach/*" element={<TeachRoutes />} />
      <Route path="/auth/*" element={<AuthRoutes />} />

      {/* Marketing routes - conditionally included */}
      {FEATURES.ENABLE_MARKETING_SITE && (
        <>
          <Route path="/" element={<MarketingHome />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/solutions/*" element={<SolutionsRoutes />} />
        </>
      )}

      {/* Fallback: If marketing disabled, "/" goes to app */}
      {!FEATURES.ENABLE_MARKETING_SITE && (
        <Route path="/" element={<Navigate to="/schedule" />} />
      )}
    </Routes>
  );
}
```

---

## Build Configurations

### Full Build (Demo + App)
```bash
# Default - includes marketing site
npm run build
```

### App-Only Build (No Marketing)
```bash
# For studio deployments
VITE_ENABLE_MARKETING=false npm run build
```

### Marketing-Only Build (Static Site)
```bash
# For separate marketing deployment
npm run build:marketing

# vite.config.ts addition
export default defineConfig({
  // ...
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        // marketing: resolve(__dirname, 'marketing.html'), // Separate entry
      },
    },
  },
});
```

---

## Deployment Scenarios

### Scenario 1: Full Vercel Deployment (Demo Site)

```
tandava.yoga/                → Marketing home
tandava.yoga/demo            → Interactive demo
tandava.yoga/solutions/*     → SEO landing pages
tandava.yoga/schedule        → App (after login)
tandava.yoga/manage          → Admin (after login)
```

### Scenario 2: Studio White-Label Deployment

```
lotusflowstudio.com/         → Redirect to /schedule
lotusflowstudio.com/schedule → Class schedule
lotusflowstudio.com/manage   → Admin dashboard
(No /demo, /pricing, /solutions pages)
```

**Environment:**
```env
VITE_ENABLE_MARKETING=false
VITE_STUDIO_NAME="Lotus Flow Studio"
VITE_STUDIO_BRANDING_PRIMARY="#custom-color"
```

### Scenario 3: Separate Marketing Site

Marketing site deployed separately (e.g., Webflow, Framer, or separate Vercel):

```
tandava.yoga/            → Marketing site (separate deploy)
app.tandava.yoga/        → Application only
```

---

## Removing Marketing for Custom Deployment

### Quick Removal Script

```bash
#!/bin/bash
# scripts/remove-marketing.sh

# Remove marketing directory
rm -rf src/marketing

# Remove marketing assets
rm -rf public/marketing

# Update environment
echo "VITE_ENABLE_MARKETING=false" >> .env.local

# Remove marketing dependencies (if any specific)
# npm uninstall marketing-specific-package

echo "Marketing site removed. Build with 'npm run build'"
```

### Manual Removal Checklist

1. [ ] Delete `src/marketing/` directory
2. [ ] Delete `public/marketing/` directory
3. [ ] Set `VITE_ENABLE_MARKETING=false` in environment
4. [ ] Remove marketing routes from `App.tsx` (optional, tree-shaking handles)
5. [ ] Update `index.html` meta tags for studio branding
6. [ ] Update `manifest.json` for studio name

---

## SEO Landing Pages Structure

### Page Generation Pattern

```typescript
// src/marketing/pages/solutions/index.tsx

const solutionPages = [
  {
    slug: 'timezone-scheduling',
    title: 'Timezone-Aware Scheduling',
    problem: 'Mindbody shows wrong times for classes in different timezones',
    solution: 'Tandava displays studio time for in-person, your time for virtual',
    keywords: ['mindbody timezone', 'yoga scheduling software', 'class booking'],
  },
  {
    slug: 'quick-booking',
    title: 'One-Tap Class Booking',
    problem: 'Competitors require 5-7 taps to book a single class',
    solution: 'Book in one tap with Quick Book for members',
    keywords: ['quick booking', 'fast class booking', 'yoga app'],
  },
  // ... 18 more based on competitor issues
];

// Dynamic route generation
function SolutionsRoutes() {
  return (
    <Routes>
      <Route index element={<SolutionsHub />} />
      {solutionPages.map(page => (
        <Route
          key={page.slug}
          path={page.slug}
          element={<SEOLandingPage {...page} />}
        />
      ))}
    </Routes>
  );
}
```

### SEO Metadata

```typescript
// Each landing page includes
<Helmet>
  <title>{page.title} | Tandava Yoga Studio Software</title>
  <meta name="description" content={page.metaDescription} />
  <meta name="keywords" content={page.keywords.join(', ')} />
  <link rel="canonical" href={`https://tandava.yoga/solutions/${page.slug}`} />

  {/* Structured data */}
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Tandava",
      "applicationCategory": "BusinessApplication",
      "offers": { "@type": "Offer", "price": "0" },
    })}
  </script>
</Helmet>
```

---

## Content Management

### Marketing Content Files

```typescript
// src/marketing/data/competitorIssues.ts

export const competitorIssues = [
  {
    id: 1,
    competitor: 'Mindbody',
    issue: 'Timezone Display Bugs',
    description: 'Shows wrong time for classes in different timezones, causing missed classes.',
    solution: 'Smart timezone display based on class delivery mode.',
    landingPageSlug: 'timezone-scheduling',
    testimonial: {
      quote: "We had members showing up 2 hours late because of timezone confusion.",
      author: "Sarah, Studio Owner",
    },
  },
  // ...
];

// src/marketing/data/features.ts
export const features = [
  {
    title: 'Quick Book',
    description: 'Members book in one tap',
    icon: 'Zap',
    screenshot: '/marketing/screenshots/quick-book.png',
  },
  // ...
];
```

---

## Testing Marketing Removal

```bash
# Test build without marketing
VITE_ENABLE_MARKETING=false npm run build

# Verify bundle size reduction
npm run analyze

# Test that app still works
npm run preview
```

---

*Keep marketing cleanly separated to support multiple deployment models.*
