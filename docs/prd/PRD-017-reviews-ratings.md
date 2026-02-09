# PRD-017: Reviews & Ratings System

## Overview
**Phase:** 2
**Priority:** P1
**Status:** In Progress (UI scaffolded)
**Owner:** TBD
**Dependencies:** PRD-006 (Review Automation), PRD-008 (Check-In)

---

## Jobs to Be Done

### Job 1: Verified Student Feedback
**When** I attend a class and have an experience worth sharing,
**I want to** leave a review that other students can trust,
**So I can** help others choose the right class and teacher.

### Job 2: Teacher Reputation Building
**When** I consistently deliver great classes,
**I want** my reviews to build my public profile,
**So I can** attract more students and demonstrate my value.

### Job 3: Studio Quality Monitoring
**When** I'm managing my studio,
**I want to** see aggregated review data across teachers and class types,
**So I can** identify quality issues and celebrate wins.

### Job 4: Review Integrity
**When** someone tries to game the review system,
**I want** the system to prevent fake or malicious reviews,
**So that** reviews remain trustworthy and useful.

---

## Architecture

### Review Aggregation Levels

Reviews aggregate at three levels:

1. **Studio Level** — Overall studio rating (weighted avg of all reviews)
2. **Teacher Level** — Per-teacher rating, broken down by class type
3. **Class Type Level** — Per-offering (e.g., "Vinyasa Flow") rating

### Review Eligibility (Verification)

A student can only review:
- A **class** they have been **checked in** to (via check-in system)
- A **teacher** they have **attended at least one class** with
- The **studio** if they have **attended at least one class**

This prevents:
- Competitors posting fake reviews
- Non-attendees leaving reviews
- Mass-creation attacks (no check-in = no review)

### Rating Visibility Rules

| Condition | Behavior |
|-----------|----------|
| Teacher avg >= 3.0 stars | Show rating + review count on public profile |
| Teacher avg < 3.0 stars | Hide rating from public profile entirely |
| Teacher has < 5 reviews | Show "New Teacher" badge instead of stars |
| Studio avg >= 3.0 stars | Show on studio page |
| Studio avg < 3.0 stars | Hide from landing page |

**Rationale:** Reviews below 3 stars hidden from profiles protects new teachers from a single bad review tanking their public image. The threshold is rechecked as new reviews come in.

### Security & Anti-Abuse

| Attack Vector | Mitigation |
|---------------|------------|
| Fake accounts creating reviews | Require verified check-in record (not just booking — actual attendance) |
| Mass review creation | Rate limit: 1 review per student per class per 90 days |
| Review bombing | Max 3 reviews per student per day across all classes |
| Self-reviews by teachers | Block reviews where reviewer_id = teacher_id |
| Competitor sabotage | Cross-reference IP/device fingerprint for suspicious patterns |
| Review farms | Require minimum account age (7 days) before reviewing |

### Data Model

```
reviews
├── id (uuid)
├── studio_id (fk → studios)
├── reviewer_id (fk → profiles, the student)
├── reviewable_type (enum: 'studio', 'teacher', 'class_type')
├── reviewable_id (uuid)
├── class_occurrence_id (fk → class_occurrences, nullable)
├── rating (integer, 1-5)
├── title (text, nullable)
├── body (text, nullable, max 2000 chars)
├── is_verified (boolean, auto-set based on check-in)
├── is_visible (boolean, default true)
├── deleted_by (uuid, nullable — studio owner who deleted it)
├── deleted_at (timestamptz, nullable)
├── created_at (timestamptz)
├── updated_at (timestamptz)
└── UNIQUE(reviewer_id, reviewable_type, reviewable_id, class_occurrence_id)

review_aggregates (materialized / cached)
├── reviewable_type
├── reviewable_id
├── avg_rating (decimal)
├── review_count (integer)
├── last_updated (timestamptz)
```

---

## User Stories

### US-17.1: Leave a Review
**As a** student who attended a class,
**I want to** rate and optionally write about my experience,
**So that** other students benefit from my feedback.

**Acceptance Criteria:**
- [ ] 1-5 star rating (required)
- [ ] Optional title (max 100 chars)
- [ ] Optional body (max 2000 chars)
- [ ] Can only review classes I've been checked in to
- [ ] Can edit my review within 48 hours
- [ ] Confirmation before submitting

### US-17.2: View Reviews on Teacher Profile
**As a** student browsing teachers,
**I want to** see reviews organized by class type,
**So I can** choose teachers who excel at styles I prefer.

**Acceptance Criteria:**
- [ ] Show star rating + review count (if avg >= 3.0)
- [ ] Reviews grouped by class type
- [ ] Most recent reviews first
- [ ] "Verified Attendee" badge on reviews

### US-17.3: Studio Owner Review Management
**As a** studio owner,
**I want to** moderate reviews from my dashboard,
**So I can** remove inappropriate content.

**Acceptance Criteria:**
- [ ] View all reviews in manage dashboard
- [ ] Delete reviews with reason logged
- [ ] See flagged reviews (1-star, suspicious patterns)
- [ ] Cannot edit review content (only delete)
- [ ] Deleted reviews excluded from aggregates

### US-17.4: Review Security
**As a** platform,
**I want to** prevent abuse of the review system,
**So that** reviews remain trustworthy.

**Acceptance Criteria:**
- [ ] Block reviews from non-attendees
- [ ] Rate limit: 1 per class per 90 days, 3 per day max
- [ ] Block self-reviews (teacher reviewing their own class)
- [ ] Minimum account age: 7 days
- [ ] Reviews below 3.0 avg hidden from public profiles

---

## Impact

Reviews increase bookings by approximately 35% for studios with positive reviews displayed prominently. Key metrics to track:

- **Booking conversion rate** with/without reviews shown
- **Teacher profile views** before/after review display
- **Review submission rate** (target: 15% of checked-in students)
- **Average rating** (studio health indicator)

---

## Implementation Status

### Scaffolded (Demo)
- [x] Star ratings on teacher cards (manage/Teachers.tsx)
- [x] Review counts displayed
- [x] Feature toggle in studio settings (ManageSettings.tsx)
- [x] Review visibility rules documented

### Remaining (Backend Required)
- [ ] `reviews` table + RLS policies
- [ ] Review submission API (with check-in verification)
- [ ] Rate limiting middleware
- [ ] Review aggregation (materialized view or trigger)
- [ ] Review moderation UI in manage dashboard
- [ ] Student-facing review form post-check-in
- [ ] Review display on teacher/studio public profiles
