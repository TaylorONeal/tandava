# Digital Presence Checklist for Studios

Complete guide to establishing and optimizing your studio's online presence across all discovery platforms.

---

## Overview

Your digital presence extends far beyond your website. Students discover studios through:

1. **Search Engines** – Google, Bing, DuckDuckGo
2. **AI Assistants** – ChatGPT, Claude, Perplexity, Siri
3. **Maps & Navigation** – Google Maps, Apple Maps, Waze
4. **Review Platforms** – Yelp, TripAdvisor, Google Reviews
5. **Social Platforms** – Instagram, Facebook, TikTok
6. **Directory Listings** – Foursquare/Swarm, ClassPass, Mindbody directory
7. **Local Guides** – Neighborhood blogs, local news sites

This checklist ensures you're visible and accurate across all channels.

---

## The One-Time Setup Checklist

### Priority 1: Claim Your Core Listings

| Platform | Why It Matters | Status |
|----------|----------------|--------|
| **Google Business Profile** | #1 local search ranking factor. Powers Google Maps and "near me" searches. | ☐ Claimed |
| **Apple Business Connect** | Powers Apple Maps, Siri, and iOS native search. | ☐ Claimed |
| **Yelp Business** | Major review platform. Often appears in Google results. | ☐ Claimed |
| **Facebook Business Page** | Social proof, events, and ad targeting. | ☐ Claimed |
| **Instagram Business Account** | Visual discovery and engagement. | ☐ Claimed |

### Priority 2: Secondary Listings

| Platform | Why It Matters | Status |
|----------|----------------|--------|
| **TripAdvisor** | Important for destination studios and retreats. | ☐ Claimed |
| **Foursquare/Swarm** | Powers many third-party apps (Uber, Instagram location). | ☐ Claimed |
| **Bing Places** | Second-largest search engine. Powers Cortana. | ☐ Claimed |
| **ClassPass Business** | Discovery for boutique fitness. | ☐ Claimed |
| **Mindbody Connect** | If using Mindbody, optimize your listing. | ☐ Claimed |

### Priority 3: Local & Niche

| Platform | Why It Matters | Status |
|----------|----------------|--------|
| **Nextdoor Business** | Hyperlocal community discovery. | ☐ Claimed |
| **YogaTrail** | Yoga-specific directory. | ☐ Claimed |
| **Yoga Alliance Find a Studio** | If Yoga Alliance registered. | ☐ Claimed |
| **Local Chamber of Commerce** | Business legitimacy and local backlinks. | ☐ Listed |
| **Neighborhood Business Directories** | City-specific directories. | ☐ Listed |

---

## Google Business Profile Deep Dive

Your Google Business Profile (GBP) is the most important listing. Here's how to optimize it.

### Required Information

```
Business Name: [Exact legal name, no keyword stuffing]
Category:
  Primary: Yoga Studio (or Pilates, Gym, etc.)
  Additional: Meditation Center, Fitness Center, etc.

Address: [Exact street address]
Service Area: [If you offer private sessions or corporate yoga]

Phone: [Local number, not toll-free]
Website: [Your Tandava URL]

Hours: [Accurate, including holiday hours]
```

### Optimization Checklist

- [ ] **Photos**: 10+ high-quality photos
  - [ ] Exterior (so people can find you)
  - [ ] Interior (studio space, lobby)
  - [ ] Team (instructors)
  - [ ] Classes in session
  - [ ] Logo and branding
- [ ] **Services**: List all class types with descriptions
- [ ] **Products**: Add retail items if selling
- [ ] **Attributes**:
  - [ ] "Women-owned" (if applicable)
  - [ ] "LGBTQ+ friendly"
  - [ ] "Wheelchair accessible"
  - [ ] "Appointment required" (for private sessions)
- [ ] **Intro Offer**: Add your new student offer
- [ ] **Booking Button**: Link to your Tandava schedule
- [ ] **Description**: 750 characters, include location keywords
- [ ] **Q&A**: Seed with common questions (you can ask/answer yourself)

### Ongoing Tasks

| Task | Frequency |
|------|-----------|
| Respond to reviews | Within 24-48 hours |
| Post updates (events, offers) | 1-2x per week |
| Update hours for holidays | Before each holiday |
| Add new photos | Monthly |
| Check for suggested edits | Weekly |

---

## NAP Consistency

**NAP = Name, Address, Phone**

Your NAP must be identical across all platforms. Inconsistencies confuse search engines and AI systems.

### NAP Audit

```
Official NAP:
Name: Tandava Yoga Studio
Address: 123 Folsom Street, San Francisco, CA 94105
Phone: (415) 555-0100
Website: https://tandava.yoga
```

Check each platform matches exactly:
- [ ] Google Business Profile
- [ ] Apple Business Connect
- [ ] Yelp
- [ ] Facebook
- [ ] Instagram
- [ ] Foursquare
- [ ] Your website (footer, contact page)
- [ ] Mindbody/booking system

### Common Mistakes

| Wrong | Right |
|-------|-------|
| 123 Folsom St | 123 Folsom Street |
| 123 Folsom Street, Suite 100 | 123 Folsom Street #100 |
| San Francisco | San Francisco, CA |
| (415) 555-0100 | 415-555-0100 |

Pick one format and use it everywhere.

---

## Review Management Strategy

### Review Request System

Configure automated review requests:

1. **When**: 24-48 hours after first class
2. **Who**: Only students who completed a class (not cancellations)
3. **How**: Email with direct link to Google review

### Response Templates

**Positive Review (5 stars):**
```
Thank you so much, [Name]! We're thrilled you enjoyed your class with [Instructor].
We can't wait to see you on the mat again. Namaste 🙏

— The Tandava Team
```

**Constructive Feedback (3-4 stars):**
```
Thank you for your feedback, [Name]. We appreciate you taking the time to share your experience.
We'd love to hear more about how we can improve. Please reach out to us at hello@tandava.yoga.

— [Owner Name]
```

**Negative Review (1-2 stars):**
```
We're sorry your experience didn't meet expectations, [Name].
This isn't the standard we hold ourselves to, and we'd like to make it right.
Please contact us directly at [phone] or [email] so we can address your concerns.

— [Owner Name]
```

### Review Platform Priority

1. **Google** – Most impactful for search visibility
2. **Yelp** – High visibility, often appears in search
3. **Facebook** – Social proof for ads and referrals
4. **TripAdvisor** – Important for destination studios

---

## Multi-Touch Attribution Tracking

Understanding how students discover your studio across multiple touchpoints.

### Attribution Models

| Model | Description | Best For |
|-------|-------------|----------|
| **First Touch** | Credit to first interaction | Brand awareness |
| **Last Touch** | Credit to final interaction | Direct conversion |
| **Linear** | Equal credit to all touchpoints | Full journey understanding |
| **Time Decay** | More credit to recent touches | Complex purchase paths |

### Implementation in Tandava

#### UTM Parameters

Use UTM parameters for all external links:

```
https://tandava.yoga/schedule?
  utm_source=google
  &utm_medium=cpc
  &utm_campaign=new_student_2026
  &utm_content=hot_yoga_ad
```

#### Tracking Sources

```typescript
// src/lib/analytics/attribution.ts

interface TouchPoint {
  source: string;        // google, facebook, instagram, direct, etc.
  medium: string;        // organic, cpc, social, referral, email
  campaign?: string;     // Campaign name
  content?: string;      // Ad or link variant
  timestamp: Date;
  landingPage: string;
  referrer?: string;
}

interface AttributionJourney {
  memberId: string;
  touchpoints: TouchPoint[];
  conversionEvent: string;   // signup, first_class, membership
  conversionValue: number;   // Revenue attributed
}
```

#### Data Collection Points

| Touchpoint | Data Captured |
|------------|---------------|
| **First Visit** | Referrer URL, UTM params, landing page |
| **Return Visits** | Updated referrer/UTM if different |
| **Signup** | Form submission source |
| **First Class** | Attribution frozen at conversion |
| **Membership** | Full journey with value |

### Analytics Dashboard Integration

Display attribution data in the analytics hub:

```typescript
// Attribution Overview
{
  "total_signups": 423,
  "attribution_breakdown": {
    "organic_search": 156,      // 37%
    "google_ads": 89,           // 21%
    "instagram": 67,            // 16%
    "referral": 45,             // 11%
    "direct": 34,               // 8%
    "facebook": 32              // 7%
  },
  "top_converting_pages": [
    { "page": "/welcome", "conversions": 89, "rate": 12.3 },
    { "page": "/schedule", "conversions": 67, "rate": 4.5 },
    { "page": "/teacher-training", "conversions": 23, "rate": 8.1 }
  ],
  "journey_length": {
    "average_touchpoints": 2.7,
    "average_days_to_convert": 4.2
  }
}
```

---

## Platform-Specific Guides

### Google Business Profile

**Booking Integration:**
1. Go to GBP Dashboard → Info → Booking
2. Add your Tandava schedule URL
3. Enable "Book" button

**Posts:**
- Create weekly posts about classes, events, offers
- Use high-quality images
- Include clear CTAs

### Apple Business Connect

**Setup:**
1. Visit business.apple.com
2. Verify ownership via phone or document
3. Add all business details
4. Upload photos

**Showcase:**
- Create "Showcases" for featured classes
- Add seasonal promotions
- Link to booking

### Yelp for Business

**Optimization:**
- Complete all business details
- Respond to every review
- Add photos monthly
- Use Yelp Deals for intro offers (optional paid feature)

### Instagram Business

**Profile Optimization:**
```
Name: Tandava Yoga | SOMA SF
Bio: Hot yoga, vinyasa, meditation 🧘
     New students → First week FREE
     📍 123 Folsom St, SOMA
Category: Yoga Studio
Action Button: Book Now → [schedule URL]
```

**Link in Bio:**
Use Linktree or Tandava's built-in link page with:
- Class schedule
- New student offer
- Pricing
- Teacher training
- Retreat info

---

## Monitoring & Maintenance

### Weekly Tasks

| Task | Platform | Time |
|------|----------|------|
| Respond to reviews | Google, Yelp, Facebook | 15 min |
| Check for listing edits | Google Business Profile | 5 min |
| Post update | Google, Instagram | 20 min |
| Monitor mentions | Social media | 10 min |

### Monthly Tasks

| Task | Time |
|------|------|
| Update photos on all platforms | 30 min |
| Audit NAP consistency | 20 min |
| Review attribution analytics | 30 min |
| Update seasonal offerings | 30 min |

### Quarterly Tasks

| Task | Time |
|------|------|
| Full listing audit across all platforms | 2 hours |
| Review and update business descriptions | 1 hour |
| Competitive analysis (what are nearby studios doing?) | 1 hour |
| Update strategy based on attribution data | 1 hour |

---

## Tandava Integration

### Automatic Features

Tandava automatically handles:

- [ ] **Structured Data**: Schema.org JSON-LD on all pages
- [ ] **Meta Tags**: OpenGraph and Twitter cards
- [ ] **Sitemap**: Auto-generated and updated
- [ ] **Robots.txt**: Properly configured
- [ ] **UTM Builder**: Built-in tool at `/manage/utm-builder`
- [ ] **Attribution Tracking**: Automatic touchpoint capture

### Admin Configuration

In **Settings → Marketing**:

1. **Google Business Profile ID**: Connect for review sync
2. **Facebook Pixel**: Add for conversion tracking
3. **Google Analytics**: GA4 property ID
4. **UTM Defaults**: Set default campaign parameters

### Analytics Hub

View all attribution data at `/manage/analytics`:

- Traffic sources breakdown
- Conversion paths
- Top performing pages
- Campaign ROI tracking

---

## Checklist Summary

### One-Time Setup

- [ ] Google Business Profile claimed and optimized
- [ ] Apple Business Connect claimed
- [ ] Yelp business claimed
- [ ] Facebook and Instagram business accounts
- [ ] Foursquare verified
- [ ] NAP consistency audit completed
- [ ] Analytics tracking configured
- [ ] UTM templates created

### Ongoing

- [ ] Weekly: Respond to reviews, post updates
- [ ] Monthly: Photo updates, listing checks
- [ ] Quarterly: Full audit and strategy review

---

*Your digital presence is your 24/7 marketing team. Keep it accurate and active.*
