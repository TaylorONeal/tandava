# LLM GEO Optimization for Fitness Studios

Preparing Tandava sites for discovery by AI assistants (ChatGPT, Claude, Perplexity, etc.).

---

## What is LLM GEO?

**LLM GEO** (Large Language Model Geographic Optimization) is the practice of structuring website content so that AI assistants can:

1. **Find** your studio when users ask location-based questions
2. **Understand** your offerings, pricing, and policies accurately
3. **Answer** user questions confidently with your site as the source of truth
4. **Recommend** your studio for relevant queries

### The Shift from SEO to LLM GEO

Traditional SEO focuses on ranking #1 on Google search results.

LLM GEO focuses on being the **accurate answer** when users ask:
- "Yoga studio near me with beginner classes"
- "Does [Studio Name] offer teacher training?"
- "How much is a drop-in class at [Studio Name]?"
- "Best hot yoga in [City] for beginners"

As AI assistants become the primary way people search for local services, studios optimized for LLM GEO will have a significant advantage.

---

## Operating Principles

### Integration, Not Replacement

LLM GEO optimization integrates with existing content. It does not replace it.

**DO:**
- Extract what already exists
- Normalize and clarify information
- Make implicit information explicit
- Structure content for AI reasoning

**DO NOT:**
- Rewrite everything
- Invent information
- Override brand tone
- Introduce marketing fluff

### Truth Over Polish

If information is missing or contradictory:
- Leave clear placeholders
- Flag issues for human review
- Never fabricate data

---

## Content Patterns for LLM GEO

### 1. Explicit Entity Declarations

AI systems identify entities better when explicitly declared.

**Before (Implicit):**
```markdown
We offer classes in our SOMA location.
```

**After (Explicit):**
```markdown
Tandava Yoga is a yoga studio located in the SOMA neighborhood of San Francisco, California.

Our primary location:
- **Address:** 123 Folsom Street, San Francisco, CA 94105
- **Neighborhood:** SOMA (South of Market)
- **City:** San Francisco
- **Region:** Bay Area, California, USA
```

### 2. Structured Offerings

Present offerings in a way AI can reason about.

**Before:**
```markdown
We have drop-ins, packs, and memberships available.
```

**After:**
```markdown
## How to Practice at Tandava

### Drop-In Classes
- **Price:** $28 per class
- **Best for:** Visitors and occasional practitioners
- **Booking:** No commitment required, book any class

### Class Packs
| Pack | Price | Per-Class Cost | Valid For |
|------|-------|----------------|-----------|
| 5 Classes | $125 | $25/class | 60 days |
| 10 Classes | $220 | $22/class | 90 days |
| 20 Classes | $380 | $19/class | 6 months |

### Memberships
| Membership | Monthly Price | Commitment | Best For |
|------------|---------------|------------|----------|
| Unlimited | $149/month | Month-to-month | Regular practitioners (3+ classes/week) |
| Annual | $129/month | 12-month commitment | Dedicated students |
| Student | $99/month | Valid student ID required | College students |
```

### 3. FAQ Sections

LLMs heavily weight FAQ content because it matches question-answer patterns.

```markdown
## Frequently Asked Questions

### What should I bring to my first class?
Bring a yoga mat (or rent one for $3), a water bottle, and a towel for hot classes. Wear comfortable, breathable clothing. Arrive 15 minutes early to complete your waiver.

### Do you offer beginner-friendly classes?
Yes! Our "Foundations" and "Slow Flow" classes are designed for beginners. Look for the "Beginner Friendly" badge on the schedule. Our instructors provide modifications for all levels.

### What is your cancellation policy?
Cancel at least 2 hours before class to avoid a late cancellation fee. Memberships can be cancelled with 30 days notice.
```

### 4. Location-Aware Content

Include geographic context throughout the site.

```markdown
## Yoga in SOMA, San Francisco

Tandava Yoga brings authentic yoga to San Francisco's SOMA neighborhood. Located just steps from the Embarcadero BART station, we're accessible from the Financial District, South Beach, and Mission Bay.

**Getting Here:**
- **BART:** Montgomery Street or Embarcadero stations (5-minute walk)
- **Muni:** F-line streetcar, stop at Folsom & 1st
- **Bike:** Bike parking available, near protected bike lanes
- **Driving:** Street parking and ParkSmart garage at 75 Folsom
```

### 5. Class Type Clarity

Define class types unambiguously.

```markdown
## Class Types at Tandava

### Vinyasa Flow
A dynamic, breath-synchronized practice linking movement with breath. Expect sun salutations, standing poses, and creative sequences. Heated to 80°F. 60 minutes.

**Good for:** Those seeking a moderate-to-vigorous workout with variety.
**Not recommended for:** Complete beginners (try Foundations first).
**Intensity:** ●●●○○ (Moderate)

### Hot Power Yoga
A challenging, athletic practice in our hot room (95-100°F). Builds strength, flexibility, and mental focus. 75 minutes.

**Good for:** Experienced yogis seeking intensity and heat.
**Not recommended for:** Those sensitive to heat, pregnant individuals.
**Intensity:** ●●●●● (Vigorous)
```

---

## Technical Implementation

### Structured Data (JSON-LD)

Add Schema.org structured data that AI systems can parse.

```typescript
// src/lib/seo/structuredData.ts

export function generateLocalBusinessSchema(studio: StudioProfile) {
  return {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    "@id": `${studio.url}#organization`,
    "name": studio.name,
    "description": studio.description,
    "url": studio.url,
    "telephone": studio.phone,
    "email": studio.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": studio.address.street,
      "addressLocality": studio.address.city,
      "addressRegion": studio.address.state,
      "postalCode": studio.address.zip,
      "addressCountry": studio.address.country,
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": studio.geo.lat,
      "longitude": studio.geo.lng,
    },
    "openingHoursSpecification": studio.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": h.day,
      "opens": h.opens,
      "closes": h.closes,
    })),
    "priceRange": studio.priceRange,
    "image": studio.imageUrl,
    "sameAs": [
      studio.socialUrls.instagram,
      studio.socialUrls.facebook,
      studio.socialUrls.yelp,
    ].filter(Boolean),
    "aggregateRating": studio.rating ? {
      "@type": "AggregateRating",
      "ratingValue": studio.rating.value,
      "reviewCount": studio.rating.count,
    } : undefined,
    "makesOffer": studio.offerings.map((offer) => ({
      "@type": "Offer",
      "name": offer.name,
      "description": offer.description,
      "price": offer.price,
      "priceCurrency": "USD",
    })),
  };
}

export function generateEventSchema(classOccurrence: ClassOccurrence) {
  return {
    "@context": "https://schema.org",
    "@type": "ExerciseAction",
    "name": classOccurrence.title,
    "description": classOccurrence.description,
    "startTime": classOccurrence.startTime,
    "endTime": classOccurrence.endTime,
    "location": {
      "@type": "Place",
      "name": classOccurrence.location.name,
      "address": classOccurrence.location.address,
    },
    "organizer": {
      "@type": "Person",
      "name": classOccurrence.instructor.name,
    },
    "offers": {
      "@type": "Offer",
      "price": classOccurrence.dropInPrice,
      "priceCurrency": "USD",
      "availability": classOccurrence.spotsAvailable > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
    },
  };
}
```

### Metadata Generation

Generate LLM-friendly meta tags.

```typescript
// src/lib/seo/metadata.ts

export function generatePageMetadata(page: PageConfig) {
  return {
    title: `${page.title} | ${page.studioName}`,
    description: page.description,

    // Standard meta
    "og:title": page.title,
    "og:description": page.description,
    "og:type": "website",
    "og:locale": "en_US",
    "og:site_name": page.studioName,

    // Location meta (for LLM GEO)
    "geo.region": page.location.region,
    "geo.placename": page.location.city,
    "geo.position": `${page.location.lat};${page.location.lng}`,
    "ICBM": `${page.location.lat}, ${page.location.lng}`,

    // Content classification
    "article:section": page.category,
    "article:tag": page.tags.join(", "),
  };
}
```

### Content Transformation Pipeline

Process content for LLM optimization.

```typescript
// src/lib/llm-geo/optimizer.ts

interface OptimizationInput {
  pageSource: string;
  pagePath: string;
  format: "markdown" | "html";
  siteProfile: SiteProfile;
  pageMetadata: PageMetadata;
}

interface OptimizationOutput {
  optimizedContent: string;
  structuredData: object;
  suggestedFaqs: FAQ[];
  issues: OptimizationIssue[];
}

export async function optimizeForLLM(input: OptimizationInput): Promise<OptimizationOutput> {
  const issues: OptimizationIssue[] = [];

  // 1. Extract existing entities
  const entities = extractEntities(input.pageSource);

  // 2. Check for missing required information
  const requiredFields = getRequiredFields(input.pageMetadata.type);
  for (const field of requiredFields) {
    if (!entities[field]) {
      issues.push({
        type: "missing_field",
        field,
        severity: "warning",
        suggestion: `Add explicit ${field} information to this page.`,
      });
    }
  }

  // 3. Generate structured data
  const structuredData = generateStructuredData(entities, input.siteProfile);

  // 4. Generate FAQ suggestions based on page type
  const suggestedFaqs = generateFaqSuggestions(input.pageMetadata.type, entities);

  // 5. Optimize content structure
  const optimizedContent = optimizeContentStructure(
    input.pageSource,
    entities,
    input.siteProfile
  );

  return {
    optimizedContent,
    structuredData,
    suggestedFaqs,
    issues,
  };
}
```

---

## Page-Type Optimization Guides

### Home Page

Must include:
- Studio name and location
- Primary services offered
- Value proposition (what makes you unique)
- Hours and contact info
- Quick links to schedule and pricing

```markdown
# Tandava Yoga - SOMA, San Francisco

**Hot yoga, vinyasa, and meditation in the heart of San Francisco.**

We're a community-focused yoga studio offering 40+ classes per week for all levels.
New students get their first week free.

**Location:** 123 Folsom Street, SOMA, San Francisco, CA 94105
**Hours:** Mon-Fri 6am-9pm, Sat-Sun 8am-6pm
**Phone:** (415) 555-0100

[View Schedule](/schedule) | [Pricing](/pricing) | [New Students](/welcome)
```

### Schedule Page

Must include:
- Clear day/time structure
- Class type descriptions
- Instructor information
- Booking/availability status

### Pricing Page

Must include:
- All pricing options in table format
- Comparison between options
- "Best for" recommendations
- Intro offers for new students

### Class/Service Pages

Must include:
- Class type name and description
- Duration and intensity level
- Prerequisites and who it's for
- What to expect
- Instructor qualifications

### Event/Retreat Pages

Must include:
- Event name, dates, and location
- Price and what's included
- Detailed itinerary
- Booking deadline and availability
- Cancellation/refund policy

---

## Verification & Testing

### Manual Testing

Ask AI assistants questions about your studio after optimization:

1. "What is [Studio Name] and where is it located?"
2. "How much does a drop-in class cost at [Studio Name]?"
3. "Does [Studio Name] offer beginner yoga classes?"
4. "What are the hours for [Studio Name]?"
5. "How do I book a class at [Studio Name]?"

### Automated Testing

```typescript
// src/lib/llm-geo/verify.ts

interface VerificationResult {
  score: number;
  checks: Check[];
}

export function verifyLLMOptimization(page: Page): VerificationResult {
  const checks: Check[] = [];

  // Check 1: Explicit location declaration
  checks.push({
    name: "Location Declaration",
    pass: hasExplicitLocation(page),
    recommendation: "Add explicit location with city, state, and neighborhood.",
  });

  // Check 2: Structured pricing
  checks.push({
    name: "Structured Pricing",
    pass: hasStructuredPricing(page),
    recommendation: "Present pricing in tables with comparison columns.",
  });

  // Check 3: FAQ section
  checks.push({
    name: "FAQ Section",
    pass: hasFaqSection(page),
    recommendation: "Add FAQ section with common questions and answers.",
  });

  // Check 4: Schema.org data
  checks.push({
    name: "Structured Data",
    pass: hasSchemaOrgData(page),
    recommendation: "Add JSON-LD structured data for LocalBusiness.",
  });

  // Check 5: Contact information
  checks.push({
    name: "Contact Info",
    pass: hasContactInfo(page),
    recommendation: "Include phone, email, and address on every page.",
  });

  const score = Math.round((checks.filter(c => c.pass).length / checks.length) * 100);

  return { score, checks };
}
```

---

## Claude Skill for LLM GEO

The Tandava codebase includes a Claude skill for optimizing content.

### Usage

```jsonc
{
  "skill": "llm-geo-optimize",
  "args": {
    "page_path": "/pages/retreats/bali-2026.md",
    "format": "markdown"
  }
}
```

### Input Schema

```jsonc
{
  "page_source": "string – raw page content (Markdown or HTML)",
  "page_path": "string – repo path, e.g. /pages/retreats/bali-2026.md",
  "format": "markdown | html",

  "site_profile": {
    "studio_name": "string",
    "brand_voice": "short description of tone & style",
    "primary_location": {
      "city": "string",
      "region": "string",
      "country": "string",
      "neighborhood": "string (optional)"
    },
    "locations": [{
      "name": "string",
      "address": "string",
      "city": "string",
      "geo": { "lat": number, "lng": number }
    }],
    "primary_services": ["yoga", "pilates", "..."],
    "booking_system": "Mindbody | Arketa | Walla | Custom",
    "booking_url": "string",
    "core_offers": ["drop-in", "intro offer", "class packs", "memberships"]
  },

  "page_metadata": {
    "title": "string",
    "type": "home|schedule|pricing|promo|training|retreat|event|blog|other",
    "canonical_url": "string (optional)"
  }
}
```

### Output

The skill returns:
1. Optimized content with explicit entities and structure
2. JSON-LD structured data to embed
3. Suggested FAQ entries
4. Issues that need human review

---

## Future Evolution

As LLM technology evolves, this optimization approach will adapt:

### Near-Term (2025-2026)
- Schema.org structured data
- Explicit entity declarations
- FAQ sections
- Clear pricing tables

### Medium-Term (2026-2027)
- AI-readable sitemaps
- Conversational schema (Q&A training data)
- Real-time availability APIs for LLM plugins

### Long-Term (2027+)
- Direct LLM API integrations (booking via AI)
- Personalized responses based on user context
- Multi-modal optimization (images, video)

---

## Integration with Tandava

### For Studios

Studios using Tandava automatically benefit from LLM GEO optimization:

1. **Structured Data:** Auto-generated from studio settings
2. **FAQ Pages:** Template-driven with studio customization
3. **Pricing Tables:** Formatted for AI parsing
4. **Location Data:** Geo-tagged and normalized

### For Developers

When building Tandava features:

1. Use structured data components from `src/lib/seo/`
2. Follow the content patterns in this guide
3. Test with AI assistants during development
4. Run the verification tool before merging

---

*This document will be updated as LLM technology and best practices evolve.*
