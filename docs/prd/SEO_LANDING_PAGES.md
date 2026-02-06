# Studio SEO Landing Pages

Enable non-technical studio owners to create high-converting landing pages that rank well in Google.

---

## Problem Statement

### Current Pain Points

1. **Poor SEO**: Studios don't know how to optimize for search
2. **High-Friction Funnels**: Landing pages link to general homepage, not direct signup
3. **404 Disasters**: Promotions end, pages disappear, Google penalizes
4. **Technical Barriers**: Creating landing pages requires developers
5. **Keyword Ignorance**: Studios don't know what terms to target

### Goals

1. **Rank Higher Organically**: Studio programs appear in Google search
2. **Direct Conversion**: Click → Landing Page → Signup (minimal steps)
3. **No 404s Ever**: Graceful promotion lifecycle, no dead links
4. **Self-Service**: Non-technical owners create pages via wizard
5. **Data-Driven**: Keyword suggestions based on studio type and programs

---

## Feature Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SEO Landing Pages                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ SEO Setup    │  │ Keyword      │  │ Landing Page │       │
│  │ Wizard       │  │ Research     │  │ Builder      │       │
│  │              │  │ Guide        │  │              │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           │                                  │
│                    ┌──────▼──────┐                          │
│                    │  Published   │                          │
│                    │  Pages       │                          │
│                    └──────┬──────┘                          │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │                │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐         │
│  │ Programs    │  │ Promotions  │  │ Location    │         │
│  │ (Permanent) │  │ (Temporary) │  │ Pages       │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Model

```sql
-- Landing pages created by studios
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id),

  -- Page Identity
  slug VARCHAR(100) NOT NULL,                    -- "200-hour-teacher-training-2025"
  page_type VARCHAR(50) NOT NULL,                -- 'program', 'promotion', 'location', 'custom'

  -- Content
  title VARCHAR(200) NOT NULL,                   -- H1
  meta_title VARCHAR(70),                        -- SEO title (defaults to title if null)
  meta_description VARCHAR(160),                 -- SEO description
  headline VARCHAR(200),                         -- Hero headline (can differ from title)
  subheadline TEXT,
  body_content TEXT,                             -- Markdown/rich text
  hero_image_url TEXT,
  gallery_images TEXT[],

  -- SEO
  primary_keyword VARCHAR(100),                  -- Main target keyword
  secondary_keywords TEXT[],                     -- Supporting keywords
  canonical_url TEXT,                            -- If different from default
  noindex BOOLEAN DEFAULT false,                 -- Exclude from search

  -- Conversion
  cta_text VARCHAR(50) DEFAULT 'Sign Up Now',    -- Button text
  cta_destination VARCHAR(50) NOT NULL,          -- 'registration', 'booking', 'contact', 'external'
  cta_target_id UUID,                            -- Event/class/workshop ID if booking
  cta_external_url TEXT,                         -- If external destination

  -- Linked Content
  linked_event_id UUID REFERENCES events(id),    -- Workshop, retreat, training
  linked_promo_id UUID REFERENCES promo_codes(id),
  linked_location_id UUID REFERENCES locations(id),

  -- Lifecycle
  status VARCHAR(20) DEFAULT 'draft',            -- 'draft', 'published', 'archived', 'expired'
  publish_date TIMESTAMPTZ,
  expire_date TIMESTAMPTZ,                       -- When promotion ends
  expired_redirect_behavior VARCHAR(50),         -- 'show_alternatives', 'redirect_parent', 'custom'
  expired_redirect_url TEXT,                     -- Custom redirect when expired
  expired_message TEXT,                          -- Message shown if keeping page visible

  -- Analytics
  views INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  UNIQUE(studio_id, slug)
);

-- Structured data for different page types
CREATE TABLE landing_page_schema_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id),
  schema_type VARCHAR(50) NOT NULL,              -- 'Event', 'Course', 'Product', 'LocalBusiness'
  schema_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track keyword performance over time
CREATE TABLE landing_page_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id),
  keyword VARCHAR(200) NOT NULL,
  search_volume INTEGER,                         -- Monthly search volume
  difficulty INTEGER,                            -- 0-100 difficulty score
  current_position INTEGER,                      -- Current Google ranking
  target_position INTEGER,
  checked_at TIMESTAMPTZ,
  UNIQUE(landing_page_id, keyword)
);
```

---

## Promotion Lifecycle (No 404s)

### The Problem with 404s

1. **Google Penalty**: Dead links hurt domain authority
2. **User Frustration**: Clicked from cached search/email, page gone
3. **Lost Opportunity**: Could have shown alternatives

### Lifecycle States

```
                    ┌─────────────┐
                    │    Draft    │
                    └──────┬──────┘
                           │ Publish
                    ┌──────▼──────┐
                    │  Published  │◀──────┐
                    └──────┬──────┘       │
                           │ Expire       │ Extend
                    ┌──────▼──────┐       │
              ┌─────│   Expired   │───────┘
              │     └──────┬──────┘
              │            │ Archive (optional)
              │     ┌──────▼──────┐
              │     │  Archived   │
              │     └─────────────┘
              │
              └──▶ Page Still Accessible
                   (with expired handling)
```

### Expired Page Behavior Options

```typescript
type ExpiredBehavior =
  | 'show_alternatives'   // Show similar programs (recommended)
  | 'redirect_parent'     // 301 to parent category
  | 'show_message'        // Keep page, show "ended" message
  | 'custom_redirect';    // Studio-specified URL

// Example: Show Alternatives (Recommended)
function handleExpiredPage(page: LandingPage) {
  if (page.status === 'expired') {
    // Find similar active programs
    const alternatives = await findSimilarPrograms(page);

    return (
      <ExpiredPageLayout>
        <ExpiredNotice
          title="This Program Has Ended"
          message={page.expired_message || `${page.title} is no longer available.`}
        />

        {alternatives.length > 0 && (
          <AlternativesSection
            title="You Might Be Interested In"
            programs={alternatives}
          />
        )}

        <CTASection
          title="Stay Updated"
          description="Sign up to be notified when similar programs are offered."
          action={<EmailSignupForm />}
        />
      </ExpiredPageLayout>
    );
  }
}
```

### SEO-Safe Expired Handling

```typescript
// HTTP Response for expired pages
function getExpiredPageResponse(page: LandingPage) {
  switch (page.expired_redirect_behavior) {
    case 'show_alternatives':
      // Return 200 with modified content (Google-friendly)
      return {
        status: 200,
        headers: {
          'X-Robots-Tag': 'noindex',  // Remove from future searches
        },
        body: renderExpiredWithAlternatives(page),
      };

    case 'redirect_parent':
      // 301 permanent redirect (passes SEO value)
      return {
        status: 301,
        headers: {
          'Location': `/programs/${page.page_type}s`,
        },
      };

    case 'show_message':
      // Keep page indexed but updated
      return {
        status: 200,
        body: renderExpiredWithMessage(page),
      };

    case 'custom_redirect':
      // 302 temporary (if might come back) or 301 (permanent)
      return {
        status: 302,
        headers: {
          'Location': page.expired_redirect_url,
        },
      };
  }
}
```

### Auto-Expiration Rules

```typescript
// Cron job: Check for pages needing expiration
async function processPageExpiration() {
  const expiredPages = await db.query(`
    SELECT * FROM landing_pages
    WHERE status = 'published'
      AND expire_date IS NOT NULL
      AND expire_date < NOW()
  `);

  for (const page of expiredPages) {
    // Update status
    await db.update('landing_pages', page.id, { status: 'expired' });

    // Notify studio owner
    await sendNotification({
      to: page.studio.owner,
      type: 'landing_page_expired',
      data: { page },
    });

    // Update sitemap
    await regenerateSitemap(page.studio_id);
  }
}
```

---

## Landing Page Builder Wizard

### Step 1: Choose Page Type

```typescript
const pageTypes = [
  {
    type: 'teacher_training',
    title: 'Teacher Training',
    description: 'Certification programs (200hr, 300hr, specialty)',
    icon: 'GraduationCap',
    suggestedKeywords: ['yoga teacher training', '200 hour yoga certification', 'RYT 200'],
  },
  {
    type: 'retreat',
    title: 'Retreat',
    description: 'Multi-day immersive experiences',
    icon: 'Mountain',
    suggestedKeywords: ['yoga retreat', 'wellness retreat', 'meditation retreat'],
  },
  {
    type: 'workshop',
    title: 'Workshop',
    description: 'Single or multi-session specialty classes',
    icon: 'Lightbulb',
    suggestedKeywords: ['yoga workshop', 'inversions workshop', 'arm balance workshop'],
  },
  {
    type: 'promotion',
    title: 'Promotion',
    description: 'Limited-time offers and deals',
    icon: 'Tag',
    suggestedKeywords: ['yoga deals', 'yoga class discount', 'new student special'],
  },
  {
    type: 'location',
    title: 'Location Page',
    description: 'Optimize for local search',
    icon: 'MapPin',
    suggestedKeywords: ['yoga near me', 'yoga studio [city]', 'yoga classes [neighborhood]'],
  },
  {
    type: 'custom',
    title: 'Custom Page',
    description: 'Build from scratch',
    icon: 'FileEdit',
    suggestedKeywords: [],
  },
];
```

### Step 2: Keyword Research Guide

```typescript
interface KeywordSuggestion {
  keyword: string;
  category: 'primary' | 'secondary' | 'long_tail';
  searchVolume: 'high' | 'medium' | 'low';
  competition: 'high' | 'medium' | 'low';
  recommended: boolean;
  tip: string;
}

// Get suggestions based on page type and studio location
function getKeywordSuggestions(
  pageType: string,
  studioType: string,
  location: { city: string; state: string; neighborhood?: string }
): KeywordSuggestion[] {
  const base = keywordTemplates[pageType];

  return [
    // Primary keywords
    {
      keyword: `${studioType} teacher training ${location.city}`,
      category: 'primary',
      searchVolume: 'medium',
      competition: 'medium',
      recommended: true,
      tip: 'Include your city for local intent',
    },
    {
      keyword: `200 hour yoga teacher training`,
      category: 'primary',
      searchVolume: 'high',
      competition: 'high',
      recommended: pageType === 'teacher_training',
      tip: 'High volume but competitive - combine with location',
    },

    // Long-tail keywords
    {
      keyword: `RYT 200 certification near me`,
      category: 'long_tail',
      searchVolume: 'low',
      competition: 'low',
      recommended: true,
      tip: 'Lower volume but high intent - these convert well',
    },
    {
      keyword: `weekend yoga teacher training ${location.state}`,
      category: 'long_tail',
      searchVolume: 'low',
      competition: 'low',
      recommended: true,
      tip: 'Schedule-specific terms attract serious searchers',
    },

    // Location variations
    {
      keyword: `yoga ${location.neighborhood || location.city}`,
      category: 'secondary',
      searchVolume: 'medium',
      competition: 'medium',
      recommended: true,
      tip: 'Neighborhood terms have less competition',
    },
  ];
}
```

### Step 3: Content Builder

```typescript
interface LandingPageSection {
  id: string;
  type: 'hero' | 'benefits' | 'curriculum' | 'instructor' | 'testimonials' |
        'pricing' | 'faq' | 'cta' | 'gallery' | 'schedule' | 'custom';
  required: boolean;
  config: SectionConfig;
}

// Template for Teacher Training page
const teacherTrainingTemplate: LandingPageSection[] = [
  {
    id: 'hero',
    type: 'hero',
    required: true,
    config: {
      fields: ['headline', 'subheadline', 'hero_image', 'cta_button'],
      placeholders: {
        headline: '200-Hour Yoga Teacher Training',
        subheadline: 'Transform your practice. Share your passion. Begin your teaching journey.',
      },
    },
  },
  {
    id: 'program_overview',
    type: 'benefits',
    required: true,
    config: {
      title: 'What You\'ll Learn',
      suggestedBenefits: [
        'Deep understanding of yoga philosophy and history',
        'Anatomy and physiology for safe sequencing',
        'Teaching methodology and classroom management',
        'Hands-on adjustments and modifications',
        'Business skills for yoga teachers',
      ],
    },
  },
  {
    id: 'curriculum',
    type: 'curriculum',
    required: true,
    config: {
      title: 'Curriculum',
      modules: [
        { title: 'Foundation', hours: 50, topics: ['Philosophy', 'History', 'Ethics'] },
        { title: 'Anatomy', hours: 30, topics: ['Musculoskeletal', 'Breathing', 'Safety'] },
        { title: 'Teaching', hours: 50, topics: ['Sequencing', 'Cueing', 'Adjustments'] },
        { title: 'Practicum', hours: 70, topics: ['Practice teaching', 'Observation', 'Feedback'] },
      ],
    },
  },
  {
    id: 'instructors',
    type: 'instructor',
    required: true,
    config: {
      title: 'Your Teachers',
      fields: ['name', 'photo', 'bio', 'credentials'],
    },
  },
  {
    id: 'schedule',
    type: 'schedule',
    required: true,
    config: {
      title: 'Dates & Schedule',
      fields: ['start_date', 'end_date', 'schedule_pattern', 'location'],
    },
  },
  {
    id: 'pricing',
    type: 'pricing',
    required: true,
    config: {
      title: 'Investment',
      showEarlyBird: true,
      showPaymentPlan: true,
      fields: ['price', 'early_bird_price', 'early_bird_deadline', 'deposit', 'payment_plan'],
    },
  },
  {
    id: 'testimonials',
    type: 'testimonials',
    required: false,
    config: {
      title: 'Graduate Stories',
      minTestimonials: 2,
    },
  },
  {
    id: 'faq',
    type: 'faq',
    required: true,
    config: {
      title: 'Frequently Asked Questions',
      suggestedQuestions: [
        'Do I need to be flexible to do teacher training?',
        'What certification will I receive?',
        'Can I teach immediately after graduating?',
        'What if I miss a session?',
        'Is there homework?',
      ],
    },
  },
  {
    id: 'cta',
    type: 'cta',
    required: true,
    config: {
      title: 'Ready to Begin?',
      buttonText: 'Apply Now',
      urgencyMessage: 'Only {spots} spots remaining',
    },
  },
];
```

### Step 4: SEO Optimization Review

```typescript
interface SEOScore {
  overall: number;  // 0-100
  checks: SEOCheck[];
}

interface SEOCheck {
  id: string;
  name: string;
  passed: boolean;
  score: number;
  recommendation?: string;
}

function analyzeLandingPageSEO(page: LandingPage): SEOScore {
  const checks: SEOCheck[] = [
    // Title
    {
      id: 'title_length',
      name: 'Title length (50-60 chars)',
      passed: page.meta_title.length >= 50 && page.meta_title.length <= 60,
      score: page.meta_title.length >= 50 && page.meta_title.length <= 60 ? 10 : 5,
      recommendation: page.meta_title.length < 50
        ? 'Title is too short. Add more descriptive keywords.'
        : page.meta_title.length > 60
          ? 'Title is too long. Google will truncate it.'
          : undefined,
    },
    {
      id: 'title_keyword',
      name: 'Primary keyword in title',
      passed: page.meta_title.toLowerCase().includes(page.primary_keyword.toLowerCase()),
      score: page.meta_title.toLowerCase().includes(page.primary_keyword.toLowerCase()) ? 15 : 0,
      recommendation: 'Include your primary keyword near the beginning of the title.',
    },

    // Meta description
    {
      id: 'description_length',
      name: 'Description length (150-160 chars)',
      passed: page.meta_description.length >= 150 && page.meta_description.length <= 160,
      score: page.meta_description.length >= 150 && page.meta_description.length <= 160 ? 10 : 5,
    },
    {
      id: 'description_keyword',
      name: 'Primary keyword in description',
      passed: page.meta_description.toLowerCase().includes(page.primary_keyword.toLowerCase()),
      score: 10,
    },

    // Content
    {
      id: 'h1_keyword',
      name: 'Primary keyword in H1',
      passed: page.title.toLowerCase().includes(page.primary_keyword.toLowerCase()),
      score: 15,
    },
    {
      id: 'content_length',
      name: 'Sufficient content (300+ words)',
      passed: countWords(page.body_content) >= 300,
      score: 10,
      recommendation: 'Add more content. Google prefers pages with substantial, helpful content.',
    },
    {
      id: 'keyword_density',
      name: 'Keyword density (1-3%)',
      passed: getKeywordDensity(page) >= 1 && getKeywordDensity(page) <= 3,
      score: 10,
    },

    // Technical
    {
      id: 'has_image',
      name: 'Has hero image',
      passed: !!page.hero_image_url,
      score: 5,
    },
    {
      id: 'has_schema',
      name: 'Has structured data',
      passed: page.schema_data && page.schema_data.length > 0,
      score: 10,
    },
    {
      id: 'mobile_friendly',
      name: 'Mobile-friendly layout',
      passed: true,  // Always true with our templates
      score: 5,
    },
  ];

  const overall = checks.reduce((sum, check) => sum + check.score, 0);

  return { overall, checks };
}
```

### Step 5: Preview & Publish

```typescript
// Pre-publish checklist
const publishChecklist = [
  { id: 'seo_score', label: 'SEO score above 70', required: true },
  { id: 'mobile_preview', label: 'Mobile preview reviewed', required: true },
  { id: 'links_tested', label: 'All links tested', required: true },
  { id: 'cta_configured', label: 'CTA destination configured', required: true },
  { id: 'images_optimized', label: 'Images optimized', required: false },
  { id: 'expiration_set', label: 'Expiration date set (if promotion)', required: false },
];
```

---

## Keyword Templates by Program Type

```typescript
// Comprehensive keyword templates
const keywordTemplates = {
  teacher_training: {
    primary: [
      'yoga teacher training',
      '200 hour yoga certification',
      'RYT 200 program',
      'yoga instructor course',
    ],
    modifiers: {
      certification: ['RYT 200', 'RYT 500', 'Yoga Alliance certified'],
      schedule: ['weekend', 'intensive', 'online', 'hybrid', 'part-time'],
      style: ['vinyasa', 'hatha', 'yin', 'hot yoga', 'ashtanga'],
    },
    questions: [
      'how to become a yoga teacher',
      'yoga teacher training near me',
      'best yoga teacher training programs',
      'how long is yoga teacher training',
      'yoga teacher training cost',
    ],
  },

  retreat: {
    primary: [
      'yoga retreat',
      'wellness retreat',
      'meditation retreat',
    ],
    modifiers: {
      duration: ['weekend', '5 day', '7 day', 'week long'],
      style: ['yoga', 'meditation', 'silent', 'wellness', 'detox'],
      location: ['beach', 'mountain', 'tropical', 'local'],
      audience: ['women\'s', 'couples', 'beginner', 'advanced'],
    },
    questions: [
      'yoga retreats near me',
      'affordable yoga retreats',
      'best yoga retreats 2026',
      'what to expect at a yoga retreat',
    ],
  },

  workshop: {
    primary: [
      'yoga workshop',
      'yoga class',
    ],
    modifiers: {
      focus: ['inversions', 'arm balances', 'backbends', 'hip openers', 'meditation'],
      level: ['beginner', 'intermediate', 'advanced', 'all levels'],
      duration: ['2 hour', 'half day', 'full day'],
    },
    questions: [
      'yoga workshops near me',
      'how to do handstand yoga',
      'yoga for beginners workshop',
    ],
  },

  promotion: {
    primary: [
      'yoga deals',
      'yoga special offer',
      'yoga discount',
    ],
    modifiers: {
      type: ['new student', 'first class free', 'unlimited', 'class pack'],
      urgency: ['limited time', 'this week only', 'flash sale'],
    },
    questions: [
      'cheap yoga classes near me',
      'yoga studio deals',
      'first class free yoga',
    ],
  },

  location: {
    primary: [
      'yoga studio',
      'yoga classes',
      'yoga near me',
    ],
    modifiers: {
      style: ['hot yoga', 'vinyasa', 'beginner yoga', 'prenatal yoga'],
      amenity: ['with childcare', 'with showers', 'parking'],
    },
    // Location-specific generated: "yoga studio [city]", "yoga classes [neighborhood]"
  },
};
```

---

## External Keyword Research Tools Guide

### For Studio Owners

```markdown
# How to Find the Best Keywords for Your Landing Pages

## Free Tools

### 1. Google Autocomplete
- Go to Google.com
- Start typing your program type + location
- Note what Google suggests (these are real searches!)
- Example: Type "yoga teacher training San..." and see suggestions

### 2. Google "People Also Ask"
- Search for your main keyword
- Look at the "People also ask" box
- These are great FAQ questions for your page

### 3. AnswerThePublic (answerthepublic.com)
- Enter your keyword (e.g., "yoga teacher training")
- Get hundreds of question-based keywords
- Focus on "how", "what", "where" questions

### 4. Google Trends (trends.google.com)
- Compare keyword variations
- See seasonal trends (retreats peak in January!)
- Find rising related topics

## Paid Tools (If You Want to Go Deeper)

### Ahrefs / Semrush / Moz
- See exact search volumes
- Analyze competitor keywords
- Track your rankings over time

## Quick Tips

1. **Include Your City**: "yoga teacher training" = hard to rank
   "yoga teacher training Austin" = much easier

2. **Use Long-Tail Keywords**: More specific = less competition
   "200 hour weekend yoga teacher training Texas"

3. **Answer Questions**: FAQ-style content ranks for voice search

4. **Check Competitors**: What are other studios ranking for?
   Search your keywords and see who appears.
```

---

## Structured Data Templates

### Event Schema (Workshops, Trainings, Retreats)

```json
{
  "@context": "https://schema.org",
  "@type": "EducationEvent",
  "name": "200-Hour Yoga Teacher Training",
  "description": "Become a certified yoga instructor...",
  "startDate": "2026-03-15",
  "endDate": "2026-06-15",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "eventStatus": "https://schema.org/EventScheduled",
  "location": {
    "@type": "Place",
    "name": "Lotus Flow Studio",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Yoga Lane",
      "addressLocality": "Austin",
      "addressRegion": "TX",
      "postalCode": "78701"
    }
  },
  "organizer": {
    "@type": "Organization",
    "name": "Lotus Flow Studio",
    "url": "https://lotusflowstudio.com"
  },
  "offers": {
    "@type": "Offer",
    "price": "3500",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "validFrom": "2026-01-01",
    "url": "https://lotusflowstudio.com/teacher-training-2026"
  },
  "performer": {
    "@type": "Person",
    "name": "Maya Johnson"
  }
}
```

### LocalBusiness Schema (Location Pages)

```json
{
  "@context": "https://schema.org",
  "@type": "HealthAndBeautyBusiness",
  "name": "Lotus Flow Studio",
  "image": "https://lotusflowstudio.com/images/studio.jpg",
  "@id": "https://lotusflowstudio.com",
  "url": "https://lotusflowstudio.com",
  "telephone": "+1-512-555-0123",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Yoga Lane",
    "addressLocality": "Austin",
    "addressRegion": "TX",
    "postalCode": "78701",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 30.2672,
    "longitude": -97.7431
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "06:00",
      "closes": "21:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday", "Sunday"],
      "opens": "08:00",
      "closes": "18:00"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
}
```

---

## URL Structure

### Recommended URL Patterns

```
/programs/teacher-training                    # Category
/programs/teacher-training/200hr-spring-2026  # Specific program

/retreats                                      # Category
/retreats/bali-transformation-march-2026      # Specific retreat

/workshops                                     # Category
/workshops/inversions-january-2026            # Specific workshop

/specials                                      # Promotions category
/specials/new-year-unlimited                  # Specific promotion

/locations/downtown                            # Location page
```

### Slug Generation

```typescript
function generateSlug(title: string, date?: Date): string {
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  if (date) {
    const month = format(date, 'MMMM').toLowerCase();
    const year = format(date, 'yyyy');
    slug = `${slug}-${month}-${year}`;
  }

  return slug;
}

// Examples:
// "200 Hour Teacher Training" → "200-hour-teacher-training"
// "Bali Transformation Retreat" + March 2026 → "bali-transformation-retreat-march-2026"
```

---

## Admin UI Location

```
/manage/marketing
├── /landing-pages              # List all pages
│   ├── /new                    # Create new (wizard)
│   ├── /:id/edit               # Edit existing
│   └── /:id/analytics          # Page performance
├── /seo-setup                  # Google indexing setup
├── /keyword-research           # Keyword tools & guide
└── /sitemap                    # View/regenerate sitemap
```

---

*This feature empowers studios to compete with larger competitors in search results.*
