# FAQ & Training Pages Structure

Organization of help content by role and topic.

---

## Overview

Each user role has dedicated help content:

```
/help
├── /help/member          # Member FAQs and guides
├── /help/teacher         # Instructor training
├── /help/owner           # Admin training
└── /help/glossary        # Shared definitions
```

---

## Page Structure Template

Each help page follows this structure:

```typescript
interface HelpPage {
  slug: string;
  title: string;
  category: string;
  role: 'member' | 'teacher' | 'owner' | 'all';
  shortAnswer: string;      // Quick answer (shown in search)
  fullContent: string;      // Detailed explanation (markdown)
  relatedPages: string[];   // Related help page slugs
  keywords: string[];       // For search
  lastUpdated: Date;
}
```

---

## Member FAQs

### Account & Profile

| Question | Category |
|----------|----------|
| How do I create an account? | Getting Started |
| How do I reset my password? | Account |
| How do I update my profile? | Account |
| How do I change my email? | Account |
| How do I add emergency contact info? | Account |
| How do I delete my account? | Account |

### Booking Classes

| Question | Category |
|----------|----------|
| How do I book a class? | Booking |
| What is Quick Book? | Booking |
| How do I cancel a booking? | Booking |
| What happens if I miss a class? | Booking |
| How do I join a waitlist? | Booking |
| What time is the class in my timezone? | Booking |
| How do I book a workshop? | Booking |
| Can I book for a friend? | Booking |

### Memberships & Payments

| Question | Category |
|----------|----------|
| What's included in my membership? | Membership |
| How do I view my membership status? | Membership |
| How do I cancel my membership? | Membership |
| Can I pause my membership? | Membership |
| How do I upgrade my membership? | Membership |
| What's a class pack? | Membership |
| How do I use my class credits? | Membership |
| How do I update my payment method? | Payments |
| Where can I see my receipts? | Payments |
| Do I get a member discount on retail? | Membership |

### Classes & Schedule

| Question | Category |
|----------|----------|
| How do I find classes? | Schedule |
| What does "heated" mean? | Classes |
| What should I bring to class? | Classes |
| When should I arrive? | Classes |
| What if I'm late to class? | Classes |
| What are virtual classes? | Classes |
| How do I join a virtual class? | Classes |
| What is a hybrid class? | Classes |
| What's a donation-based class? | Classes |

### On-Demand

| Question | Category |
|----------|----------|
| What is on-demand? | On-Demand |
| How do I access on-demand videos? | On-Demand |
| Can I download videos offline? | On-Demand |
| Do on-demand views count toward my membership? | On-Demand |

---

## Teacher FAQs

### Getting Started

| Question | Category |
|----------|----------|
| How do I set up my profile? | Getting Started |
| How do I add my certifications? | Getting Started |
| How do I set my availability? | Getting Started |
| How do I complete onboarding? | Getting Started |

### Schedule & Classes

| Question | Category |
|----------|----------|
| How do I view my schedule? | Schedule |
| How do I check in students? | Classes |
| What if a student arrives late? | Classes |
| How do I mark attendance? | Classes |
| How do I handle a no-show? | Classes |
| What if I need to cancel a class? | Schedule |
| How do I request a sub? | Subs |
| How do I pick up a sub request? | Subs |
| How do I start a virtual class stream? | Classes |

### Payments & Earnings

| Question | Category |
|----------|----------|
| How do I view my earnings? | Earnings |
| When do I get paid? | Earnings |
| How is my pay calculated? | Earnings |
| How do I update my payment info? | Earnings |
| What about sub coverage pay? | Earnings |

### Students

| Question | Category |
|----------|----------|
| How do I see who's coming to my class? | Students |
| How do I view a student's profile? | Students |
| How do I handle a difficult student? | Students |

---

## Owner/Admin FAQs

### Getting Started

| Question | Category |
|----------|----------|
| How do I complete studio setup? | Onboarding |
| How do I import from Mindbody? | Import |
| How do I add my first class? | Schedule |
| How do I invite my teachers? | Staff |

### Schedule Management

| Question | Category |
|----------|----------|
| How do I create a class schedule? | Schedule |
| How do I create a recurring class? | Schedule |
| How do I cancel a class? | Schedule |
| How do I bulk edit classes? | Schedule |
| How do I create a workshop? | Schedule |
| How do I set up a retreat? | Schedule |

### Staff Management

| Question | Category |
|----------|----------|
| How do I add a new teacher? | Staff |
| How do I set pay rates? | Staff |
| What happens when a teacher leaves? | Staff |
| How do I manage sub requests? | Staff |
| How do I view teacher schedules? | Staff |

### Member Management

| Question | Category |
|----------|----------|
| How do I view member details? | Members |
| How do I add a member manually? | Members |
| How do I handle a member complaint? | Members |
| How do I issue a refund? | Members |
| How do I pause a membership? | Members |
| How do I see at-risk members? | Members |

### Pricing & Memberships

| Question | Category |
|----------|----------|
| How do I create a membership type? | Pricing |
| How do I create a class pack? | Pricing |
| How do I set drop-in pricing? | Pricing |
| How do I create a promo code? | Pricing |
| How do I set up intro offers? | Pricing |
| How do I configure retail discounts? | Pricing |

### Locations

| Question | Category |
|----------|----------|
| How do I add a new location? | Locations |
| What happens when I close a location? | Locations |
| How do I manage multi-location memberships? | Locations |

### Financials & Reporting

| Question | Category |
|----------|----------|
| How do I view revenue reports? | Reports |
| How do I export data? | Reports |
| How do I close the month? | Accounting |
| How do I prepare for year-end? | Accounting |
| How do I reconcile payments? | Accounting |
| How do I handle chargebacks? | Payments |

### Settings & Configuration

| Question | Category |
|----------|----------|
| How do I set cancellation policies? | Policies |
| How do I configure notification settings? | Settings |
| How do I customize email templates? | Settings |
| How do I set up online waivers? | Settings |
| How do I enable features? | Settings |

---

## Content Template

### FAQ Page Template

```markdown
# {Question}

**Quick Answer:**
{One sentence answer}

---

## Detailed Steps

{Step by step with screenshots}

1. Go to **[Page Name]**
2. Click **[Button]**
3. ...

## Common Issues

### Issue: {Problem}
**Solution:** {How to fix}

## Related Topics

- [Related FAQ 1](/help/role/related-1)
- [Related FAQ 2](/help/role/related-2)

---

*Last updated: {Date}*
```

### Training Guide Template

```markdown
# {Topic} Training Guide

**For:** {Role}
**Time to complete:** {X minutes}

---

## Overview

{What this guide covers and why it matters}

## Prerequisites

- [ ] Account created
- [ ] {Other requirements}

## Step-by-Step

### 1. {First Step}

{Explanation with screenshot}

### 2. {Second Step}

{Explanation with screenshot}

## Practice Exercise

Try this on your own:
1. {Task 1}
2. {Task 2}

## Quiz (Optional)

1. {Question}
   - [ ] A) {Wrong answer}
   - [x] B) {Correct answer}
   - [ ] C) {Wrong answer}

## Next Steps

Now that you've learned {topic}, continue to:
- [{Next guide}](/help/role/next-guide)

---

*Estimated completion: {X} minutes*
```

---

## Implementation

### Database Schema

```sql
CREATE TABLE help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'member', 'teacher', 'owner', 'all'
  short_answer TEXT,
  full_content TEXT NOT NULL, -- Markdown
  keywords TEXT[],
  related_slugs TEXT[],
  views INTEGER DEFAULT 0,
  helpful_votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_help_role ON help_articles(role);
CREATE INDEX idx_help_category ON help_articles(category);
CREATE INDEX idx_help_keywords ON help_articles USING GIN(keywords);
```

### Search Implementation

```typescript
async function searchHelp(
  query: string,
  role: 'member' | 'teacher' | 'owner'
): Promise<HelpArticle[]> {
  return await db.query(`
    SELECT *,
      ts_rank(
        to_tsvector('english', title || ' ' || short_answer || ' ' || array_to_string(keywords, ' ')),
        plainto_tsquery('english', $1)
      ) AS rank
    FROM help_articles
    WHERE (role = $2 OR role = 'all')
      AND to_tsvector('english', title || ' ' || short_answer || ' ' || array_to_string(keywords, ' '))
          @@ plainto_tsquery('english', $1)
    ORDER BY rank DESC
    LIMIT 10
  `, [query, role]);
}
```

### UI Components

```typescript
// Help search bar (in navigation)
<HelpSearch role={currentUser.role} />

// Help page layout
<HelpLayout>
  <HelpSidebar categories={categories} />
  <HelpContent article={article} />
  <HelpFeedback articleId={article.id} />
</HelpLayout>

// Inline help tooltip
<HelpTooltip topic="quick-book">
  Learn about Quick Book
</HelpTooltip>

// Contextual help panel
<ContextualHelp page="booking-modal" />
```

---

## Help Content Locations

```
src/content/help/
├── member/
│   ├── getting-started/
│   │   ├── create-account.md
│   │   └── first-booking.md
│   ├── booking/
│   │   ├── how-to-book.md
│   │   ├── cancel-booking.md
│   │   └── waitlist.md
│   ├── membership/
│   │   └── ...
│   └── ...
├── teacher/
│   ├── getting-started/
│   ├── schedule/
│   ├── students/
│   └── earnings/
├── owner/
│   ├── onboarding/
│   ├── schedule/
│   ├── staff/
│   ├── members/
│   ├── financials/
│   └── settings/
└── shared/
    ├── glossary.md
    └── contact-support.md
```

---

*Keep help content updated as features change.*
