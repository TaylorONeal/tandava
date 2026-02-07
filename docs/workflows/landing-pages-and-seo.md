# Landing Pages and SEO

**Purpose:** This guide explains how to create SEO-optimized landing pages in Tandava, use content blocks to build compelling pages, follow the platform's editorial guidance for search engine visibility, and track how your pages convert visitors into students.

---

## Where to Manage Landing Pages

**Navigate to:** Studio Management > Landing Pages

This page displays all your landing pages with their status, view count, conversion count, and conversion rate. It also surfaces SEO recommendations -- specific pages the system suggests you create based on your offerings, location, and search opportunity.

---

## What Landing Pages Are and Why They Matter

A landing page is a standalone page designed for a specific audience or goal. Unlike your general studio homepage or schedule, a landing page focuses on one topic and guides the visitor toward one action (booking a class, signing up for a membership, registering for an event).

For studios, landing pages are how you get found in search engines. When someone searches "hot yoga SOMA" or "prenatal yoga San Francisco," a targeted landing page with the right content, title, and meta description can rank in search results and bring that person to your studio.

### Why This Matters for Your Studio

- **Search engines drive discovery.** Most new students find studios through Google. A landing page targeting "yoga for beginners [your city]" can bring 10-50 new visitors per month.
- **Targeted pages convert better.** A page about "prenatal yoga" that speaks directly to expecting parents converts better than a generic homepage that mentions it in passing.
- **You own the traffic.** Unlike social media or paid ads, organic search traffic is free and compounds over time. A well-ranked page keeps working for you month after month.

> **Tip:** You do not need to be an SEO expert. Tandava provides templates, editorial guidance, and recommendations that handle the technical details. Focus on writing authentic content about what your studio offers -- the platform handles the structure.

---

## Creating a Landing Page

### Step-by-Step

1. Go to **Studio Management > Landing Pages**.
2. Click **Create Page** in the top right.
3. Choose a **template** (see below for descriptions).
4. Enter a **Page Title** (e.g., "Hot Yoga in SOMA").
5. Click **Create Page** to save as a draft and open the editor.

### Available Templates

| Template | Best For | Includes |
|----------|----------|----------|
| **New Student** | Converting first-time visitors. Your most important page. | Hero section, intro offer, schedule preview, testimonials, CTA |
| **Class Style** | Showcasing a specific style (hot yoga, yin, vinyasa, pilates). | Benefits, filtered schedule, teacher profiles, FAQ |
| **Event Promo** | Promoting a workshop, training, or retreat. | Rich media, agenda, pricing tiers, countdown, registration CTA |
| **Teacher Profile** | Featuring a specific instructor. | Bio, credentials, schedule, specialties, student reviews |
| **Seasonal** | Time-limited promotions (holiday, summer, new year). | Limited-time offer, urgency elements, themed design |
| **Custom** | Anything else. Start from a blank canvas. | Empty -- add content blocks in any order |

> **Note:** The system recommends specific pages you should create based on your offerings. Check the **SEO Recommendations** section on the Landing Pages management page for suggestions like "Create a Prenatal Yoga page" with estimated search volume and target keywords.

---

## Content Block Types

Each landing page is composed of content blocks that you arrange in order. The available block types are:

| Block Type | Purpose |
|------------|---------|
| **Hero** | A full-width section with a headline, subheadline, background image, and primary CTA button. Use this at the top of every page. |
| **Text** | A rich text section with markdown support. Use for descriptions, stories, or detailed information. |
| **Features** | A grid of features or benefits with icons. Use to highlight what makes your studio or offering special. |
| **Testimonials** | Student quotes with names and photos. Social proof that builds trust. |
| **CTA (Call to Action)** | A prominent button section encouraging the visitor to take action (book, sign up, register). |
| **FAQ** | An accordion-style question-and-answer section. Addresses common concerns and improves SEO by targeting question-based searches. |
| **Schedule** | An embedded schedule widget filtered to relevant classes. Shows visitors real availability. |
| **Pricing** | A pricing comparison table for memberships, class packs, or event tiers. |
| **Teachers** | A teacher showcase grid with photos, bios, and specialties. |
| **Newsletter** | An email signup form with configurable consent text and double opt-in. |

### Arranging Blocks

Drag and drop blocks to reorder them. A typical high-converting page follows this structure:

1. **Hero** -- Hook the visitor with a compelling headline and image.
2. **Features/Text** -- Explain what you offer and why it matters.
3. **Testimonials** -- Social proof.
4. **Schedule or Pricing** -- Show them what is available and what it costs.
5. **FAQ** -- Address objections.
6. **CTA** -- Repeat the call to action at the bottom.

> **Tip:** Every page should have a clear primary CTA. Decide what you want the visitor to do (book a class, buy a membership, register for an event) and make that action obvious. The default CTA text is "Book Your First Class" -- customize it to match the page's goal.

---

## SEO Recommendations

Tandava provides editorial guidance to help your pages rank well in search engines. The system evaluates your content and surfaces recommendations.

### What the System Checks

| Element | Guidance |
|---------|----------|
| **Page Title** | Should be 50-60 characters. Include your primary keyword and location. Example: "Hot Yoga Classes in SOMA, San Francisco" |
| **Meta Title** | The title that appears in search results. If not set, the page title is used. Keep it under 60 characters. |
| **Meta Description** | The description shown in search results. Should be 150-160 characters and include a clear value proposition and call to action. |
| **Headings** | Use a clear heading hierarchy (H1 for the page title, H2 for sections, H3 for subsections). Include keywords naturally. |
| **Image Alt Text** | Every image should have descriptive alt text. This helps search engines understand your images and improves accessibility. |
| **URL Slug** | Should be short, descriptive, and include the primary keyword. Example: `/s/tandava-yoga/hot-yoga-soma` |
| **Content Length** | Pages with 300+ words of unique content tend to rank better. Aim for substance over filler. |
| **Internal Links** | Link to your schedule, other landing pages, and event pages. Internal links help search engines understand your site structure. |

### Recommendation Types

The SEO Recommendations panel surfaces three types of suggestions:

1. **Landing Page Suggestions:** Specific pages the system thinks you should create based on your offerings and local search opportunity. Includes estimated monthly search volume and target keywords.

2. **Meta Tag Improvements:** Specific changes to improve the titles and descriptions of existing pages.

3. **Content Recommendations:** Suggestions for improving page content (adding FAQ sections, including location keywords, adding testimonials).

Each recommendation has a priority level (high, medium, low) to help you focus on the highest-impact improvements first.

---

## Conversion Tracking

Every landing page tracks two key metrics:

### Views

A view is counted each time an analytics session includes the landing page. The `analytics_sessions` table records the landing page ID, and the `landing_pages` table maintains a running `total_views` counter.

### Conversions

A conversion is counted when a visitor who arrived via a landing page takes a qualifying action:

- Books a class
- Signs up for an account
- Purchases a membership or class pack
- Registers for an event
- Subscribes to the newsletter

The `total_conversions` counter and **conversion rate** (conversions / views as a percentage) are displayed on the Landing Pages management page.

### Understanding Your Numbers

| Conversion Rate | Assessment |
|-----------------|------------|
| 10%+ | Excellent. Your page is well-targeted and compelling. |
| 5-10% | Good. Above average for studio landing pages. |
| 2-5% | Average. Look for opportunities to improve the headline, CTA, or offer. |
| Below 2% | Needs attention. The page may be attracting the wrong audience or the CTA may not be compelling enough. |

> **Tip:** The "New Student Special" template consistently produces the highest conversion rates because it targets visitors with high intent (they are already searching for a studio) and presents a clear, low-risk offer (first class free or discounted trial). Make this your first landing page if you do not have one yet.

---

## Connecting Landing Pages to Analytics

### UTM Parameters

When sharing landing page URLs in marketing campaigns, append UTM parameters to track where traffic comes from:

```
https://yourstudio.com/s/tandava-yoga/hot-yoga-soma?utm_source=instagram&utm_medium=social&utm_campaign=summer_promo
```

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `utm_source` | Where the traffic comes from | `instagram`, `google`, `newsletter` |
| `utm_medium` | The marketing medium | `social`, `cpc`, `email` |
| `utm_campaign` | The specific campaign | `summer_promo`, `teacher_training_2025` |
| `utm_content` | Differentiates ad variants | `banner_v1`, `story_ad` |
| `utm_term` | The search term (for paid search) | `hot_yoga_sf` |

Tandava captures all UTM parameters in the `analytics_sessions` table and associates them with the landing page and any subsequent conversions.

### Campaign Tracking

The **Analytics Daily** dashboard aggregates your top campaigns and referrers, showing which marketing channels are driving the most sessions and conversions. Use this data to allocate your marketing budget toward what works.

---

## Publishing and Unpublishing Pages

### Publishing

1. Open the landing page in the editor.
2. Review all content blocks, SEO fields, and the CTA.
3. Click **Publish**.
4. The page status changes from "draft" to "published" and becomes publicly accessible at its URL.

Once published, the page is visible to anyone with the URL and, if indexed by search engines, appears in search results.

### Unpublishing

To take a page down without deleting it:

1. Open the landing page in the editor.
2. Click **Unpublish** (or change status to "draft" or "archived").
3. The page is no longer publicly accessible. Visitors to the URL see a 404 page.

> **Note:** Archived pages retain all their data (views, conversions, content) and can be republished at any time. Use archiving for seasonal pages you plan to bring back.

---

## Best Practices for Studio SEO

### 1. Local Search Is Your Priority

Most students search for studios near them. Optimize for local keywords:

- Include your city and neighborhood in page titles and meta descriptions.
- Example: "Vinyasa Yoga Classes in SOMA, San Francisco" not just "Vinyasa Yoga Classes".
- Create separate pages for each major style you offer, each targeting "[style] yoga [location]".

### 2. Claim and Optimize Your Google Business Profile

Your Google Business Profile (formerly Google My Business) is often the first thing a potential student sees. Tandava cannot manage this for you directly, but it is a critical complement to your landing pages:

- Ensure your name, address, and phone number match exactly across your Google Business Profile and your Tandava studio settings.
- Add photos, hours, and a description.
- Encourage satisfied students to leave Google reviews.
- Post regular updates (new classes, events, promotions).

### 3. Use Schema Markup

Tandava landing pages include structured data (schema.org markup) that helps search engines understand your content. This can result in rich snippets in search results -- showing class times, prices, ratings, and event dates directly in the search listing.

The schema markup is generated automatically from your page content, event details, and studio information. No manual configuration is needed.

### 4. Write for Humans First, Search Engines Second

Search engines have become sophisticated enough to reward genuinely helpful content. Write landing pages that honestly describe your offering, answer real questions your students have, and reflect the voice of your studio. Keyword stuffing and generic placeholder text will hurt you more than help.

### 5. Build Internal Links

Link your landing pages to each other and to your schedule, event pages, and teacher profiles. For example:

- Your "Hot Yoga" landing page should link to your hot yoga class schedule.
- Your "Teacher Training" landing page should link to the event registration page.
- Your "New Student" page should link to your style-specific pages.

### 6. Update Pages Regularly

Search engines favor fresh content. Review your landing pages quarterly:

- Update testimonials with recent quotes.
- Refresh seasonal references.
- Add new FAQ entries based on questions you hear at the front desk.
- Update pricing if it has changed.

### 7. Track and Iterate

Use the conversion tracking data on the Landing Pages management page to identify which pages are performing well and which need improvement. A page with high views but low conversion needs a better offer or CTA. A page with low views needs better keyword targeting or promotion.

---

## Summary: Your First Three Pages

If you are starting from scratch, create these three landing pages first:

1. **New Student Welcome Page** -- Use the "New Student" template. Include your intro offer, a brief studio description, your schedule, and testimonials. This is your highest-converting page.

2. **Your Most Popular Style** -- Use the "Class Style" template. Target "[your style] yoga in [your city]". Describe the benefits, show the schedule, and feature your teachers.

3. **Your Next Event** -- Use the "Event Promo" template. Link to your next workshop or training. Include the agenda, pricing, teacher bio, and a registration CTA.

These three pages cover your core acquisition funnel: discovery (style page), conversion (new student page), and upsell (event page).

---

## Related Workflows

- [Workshops and Events](./workshops-and-events.md) -- Create event-specific landing pages to boost registrations
- [Promos and Discounts](./promos-and-discounts.md) -- Embed promo offers in landing pages for campaign-specific discounts
- [Pausing a Membership](./pausing-a-membership.md) -- Create a "Welcome Back" landing page for students returning from a pause
