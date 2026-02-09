# Google Search Indexing Setup Guide

Complete guide to preparing your Tandava studio site for Google Search indexing.

---

## Overview

This guide helps studio owners:
1. Set up proper SEO meta tags
2. Create and submit a sitemap
3. Configure robots.txt
4. Add structured data for rich results
5. Submit to Google Search Console

---

## Automatic SEO Features

Tandava automatically handles:

- ✅ Mobile-friendly responsive design
- ✅ Fast page load times
- ✅ HTTPS security
- ✅ Semantic HTML structure
- ✅ Canonical URLs
- ✅ Open Graph tags for social sharing

---

## Step 1: Studio SEO Settings

Navigate to **Settings → SEO** in your admin dashboard.

### Required Fields

| Field | Example | Best Practice |
|-------|---------|---------------|
| **Studio Name** | Lotus Flow Yoga | Your business name |
| **Tagline** | Transform your practice in Austin | Include location |
| **Meta Description** | Hot yoga, vinyasa, and meditation classes in downtown Austin. New students get their first week free. | 150-160 characters, include offerings + location + offer |
| **Primary Location** | Austin, TX | City, State format |

### Optional but Recommended

| Field | Purpose |
|-------|---------|
| **Google Business Profile ID** | Links to your Google Business listing |
| **Social Media URLs** | LinkedIn, Instagram, Facebook |
| **Logo URL** | For structured data |
| **Primary Phone** | Displayed in search results |

---

## Step 2: Sitemap Configuration

### Auto-Generated Sitemap

Tandava automatically generates your sitemap at:
```
https://yourstudio.tandava.yoga/sitemap.xml
```

### What's Included

| Page Type | Priority | Update Frequency |
|-----------|----------|------------------|
| Homepage | 1.0 | Weekly |
| Schedule | 0.9 | Daily |
| Classes (by type) | 0.8 | Weekly |
| Instructors | 0.7 | Monthly |
| Landing Pages | 0.8 | Varies |
| Blog Posts | 0.6 | Monthly |

### Manual Refresh

If you make significant changes:
1. Go to **Settings → SEO → Sitemap**
2. Click **Regenerate Sitemap**
3. Check **Last Generated** timestamp

---

## Step 3: Robots.txt

### Default Configuration

Your robots.txt is automatically configured:

```txt
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: *
Allow: /

# Block admin pages from indexing
Disallow: /manage/
Disallow: /teach/
Disallow: /auth/
Disallow: /api/

Sitemap: https://yourstudio.tandava.yoga/sitemap.xml
```

### Customization

To add custom rules:
1. Go to **Settings → SEO → Robots.txt**
2. Add additional rules in the custom section
3. Save changes

---

## Step 4: Structured Data

### Automatic Schema Markup

Tandava adds structured data for:

#### LocalBusiness (Your Studio)
```json
{
  "@context": "https://schema.org",
  "@type": "HealthAndBeautyBusiness",
  "name": "Lotus Flow Yoga",
  "description": "Hot yoga, vinyasa, and meditation classes...",
  "url": "https://lotusflow.tandava.yoga",
  "telephone": "+1-512-555-0123",
  "address": { ... },
  "openingHours": "Mo-Fr 06:00-21:00, Sa-Su 08:00-18:00",
  "priceRange": "$$"
}
```

#### Event (For Classes & Workshops)
```json
{
  "@context": "https://schema.org",
  "@type": "ExerciseAction",
  "name": "Power Vinyasa Flow",
  "description": "Dynamic yoga class...",
  "startTime": "2026-02-10T18:00:00",
  "location": { ... },
  "organizer": { ... }
}
```

#### Course (For Teacher Trainings)
```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "200-Hour Yoga Teacher Training",
  "description": "Become a certified yoga instructor...",
  "provider": { ... },
  "hasCourseInstance": { ... }
}
```

### Verify Structured Data

Use Google's tools to verify:
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)

---

## Step 5: Google Search Console Setup

### 1. Add Your Property

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **Add property**
3. Choose **URL prefix**
4. Enter: `https://yourstudio.tandava.yoga`

### 2. Verify Ownership

**Recommended: HTML meta tag**

1. Copy the meta tag Google provides
2. Go to **Settings → SEO → Verification**
3. Paste the code
4. Save and return to Google to verify

### 3. Submit Sitemap

1. In Search Console, go to **Sitemaps**
2. Enter: `sitemap.xml`
3. Click **Submit**

### 4. Request Indexing

1. Go to **URL Inspection**
2. Enter your homepage URL
3. Click **Request Indexing**
4. Repeat for important landing pages

---

## Step 6: Open Graph & Social Tags

### Automatic Tags

Every page includes:

```html
<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://yourstudio.tandava.yoga/..." />
<meta property="og:title" content="Page Title | Studio Name" />
<meta property="og:description" content="Page description..." />
<meta property="og:image" content="https://yourstudio.tandava.yoga/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Page Title | Studio Name" />
<meta name="twitter:description" content="Page description..." />
<meta name="twitter:image" content="https://yourstudio.tandava.yoga/og-image.png" />
```

### Custom OG Image

1. Create a 1200×630 pixel image
2. Include your logo and key message
3. Upload at **Settings → SEO → Social Image**

### Test Social Sharing

- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

---

## Step 7: Local SEO

### Google Business Profile

1. Claim your listing at [business.google.com](https://business.google.com)
2. Verify your address
3. Add your Tandava booking link
4. Enable the **Book** button

### Link to Tandava

In Google Business Profile:
1. Go to **Info → Website**
2. Enter your Tandava URL
3. Under **Appointments**, add your schedule link

### NAP Consistency

Ensure your **N**ame, **A**ddress, **P**hone are identical everywhere:
- Google Business Profile
- Tandava settings
- Social media profiles
- Yelp, Mindbody, other directories

---

## SEO Checklist

### One-Time Setup
- [ ] Complete studio SEO settings
- [ ] Upload custom OG image
- [ ] Add Google Search Console verification
- [ ] Submit sitemap to Google
- [ ] Request indexing for homepage
- [ ] Claim Google Business Profile
- [ ] Link Google Business to Tandava

### Monthly Tasks
- [ ] Check Search Console for errors
- [ ] Review search performance
- [ ] Create/update landing pages for new programs
- [ ] Respond to Google reviews

### When Adding New Programs
- [ ] Create landing page with keywords
- [ ] Ensure SEO score above 70
- [ ] Submit new URL for indexing
- [ ] Share on social media
- [ ] Update sitemap if needed

---

## Troubleshooting

### "Page not indexed" in Search Console

**Causes:**
- Page too new (wait 1-2 weeks)
- Thin content (add more text)
- Duplicate content (check canonical)
- Blocked by robots.txt (check rules)

**Fix:**
1. Check URL in Search Console
2. Click "Request Indexing"
3. Improve content if thin
4. Wait and check again

### Structured Data Errors

**Causes:**
- Missing required fields
- Invalid format

**Fix:**
1. Run [Rich Results Test](https://search.google.com/test/rich-results)
2. Note errors
3. Update required fields in Settings
4. Re-test

### OG Image Not Showing

**Causes:**
- Image too small (need 1200×630)
- Wrong format (use PNG or JPG)
- Cache issue

**Fix:**
1. Upload correct size image
2. Use Facebook Debugger to clear cache
3. Wait 24 hours for propagation

---

## Advanced: Custom Meta Tags

For advanced users, add custom meta tags per page:

```typescript
// In landing page settings
{
  "customMetaTags": [
    { "name": "author", "content": "Lotus Flow Yoga" },
    { "property": "article:author", "content": "Maya Johnson" }
  ]
}
```

---

*Need help? Contact support@tandava.yoga*
