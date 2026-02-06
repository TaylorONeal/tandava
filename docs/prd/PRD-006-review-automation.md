# PRD-006: Review Request Automation

## Overview
**Phase:** 2
**Priority:** P1
**Status:** Planned
**Owner:** TBD
**Dependencies:** Notification system (PRD-005), Booking completion tracking

---

## Jobs to Be Done

### Job 1: Capture Positive Experiences
**When** a student has a great class experience,
**I want to** prompt them to share a review while the experience is fresh,
**So I can** build social proof that attracts new students.

### Job 2: Identify Unhappy Students Early
**When** a student has a negative experience,
**I want to** know about it before they share publicly,
**So I can** address their concerns and retain them.

### Job 3: Improve Teacher Feedback Loop
**When** teachers consistently receive positive or negative feedback,
**I want to** surface that to them and management,
**So we can** celebrate wins and address coaching opportunities.

### Job 4: Manage Review Reputation
**When** deciding which platform needs more reviews (Google, Yelp, Facebook),
**I want to** direct happy students to the platform where we need presence,
**So I can** strategically build our online reputation.

---

## User Stories

### US-6.1: Post-Class Review Request
**As a** studio owner,
**I want** to automatically request reviews after class attendance,
**So that** I capture feedback while the experience is fresh.

**Acceptance Criteria:**
- [ ] Configurable delay after check-in (default: 2 hours)
- [ ] Only send to students who completed class (checked in)
- [ ] Frequency cap: don't ask same student more than once per 30 days
- [ ] Skip if student has already reviewed recently
- [ ] Different templates for first-timers vs. regulars
- [ ] Respect notification preferences (opt-out honored)

### US-6.2: Sentiment Pre-Filter
**As a** studio owner,
**I want** to ask for a private rating before directing to public reviews,
**So that** I can address unhappy students privately first.

**Acceptance Criteria:**
- [ ] Initial message asks "How was your class?" with emoji scale (1-5)
- [ ] 4-5 stars: direct to public review platform
- [ ] 1-3 stars: route to private feedback form
- [ ] Track sentiment scores over time
- [ ] Alert owner/manager when low scores received

### US-6.3: Platform Routing
**As a** studio owner,
**I want** to direct happy students to specific review platforms,
**So that** I can build presence where I need it most.

**Acceptance Criteria:**
- [ ] Configure priority platforms (Google, Yelp, Facebook, ClassPass, etc.)
- [ ] Weighted rotation based on platform priorities
- [ ] Deep links directly to review form where possible
- [ ] Track which platform each review was requested for
- [ ] Dashboard showing review counts by platform

### US-6.4: Teacher-Specific Feedback
**As a** studio owner,
**I want** to capture teacher-specific feedback,
**So that** I can share wins and identify coaching needs.

**Acceptance Criteria:**
- [ ] Option to ask about specific teacher in feedback
- [ ] Teacher feedback visible on teacher profile (internal)
- [ ] Aggregate ratings per teacher over time
- [ ] Share positive feedback with teacher automatically
- [ ] Flag low ratings for manager review (don't auto-share negative)

### US-6.5: Review Dashboard
**As a** studio owner,
**I want** to see all review activity in one place,
**So that** I can monitor our reputation and respond quickly.

**Acceptance Criteria:**
- [ ] List of all review requests sent
- [ ] Response rate tracking
- [ ] Sentiment distribution chart
- [ ] Recent feedback (both public and private)
- [ ] Alerts for new low ratings
- [ ] Links to external review pages

### US-6.6: First-Timer Follow-Up
**As a** studio owner,
**I want** special review handling for first-time students,
**So that** I can capture their fresh perspective and improve conversion.

**Acceptance Criteria:**
- [ ] Detect first visit (no prior bookings)
- [ ] Different message template: "How was your first class?"
- [ ] Ask what brought them to try us
- [ ] Capture what would make them return
- [ ] Feed into activation/conversion analysis

---

## Edge Cases

### EC-1: Student Visited Multiple Locations
**Scenario:** Student took classes at two locations same day.
**Handling:**
- Send one review request, not two
- Ask about overall experience
- Option to specify location in feedback

### EC-2: Class Cancelled After Check-In
**Scenario:** Student checked in, but class was cancelled.
**Handling:**
- Don't send review request for cancelled classes
- Consider sending apology message instead
- Track cancellation rate separately

### EC-3: Student Already Left Negative Review
**Scenario:** Student left 1-star review last week, now attended another class.
**Handling:**
- Still ask for feedback (they might have improved opinion)
- Different message: "We hope your recent experience was better"
- Route to private feedback first (give chance to update)

### EC-4: No-Show Marked as Checked In
**Scenario:** Front desk accidentally marked no-show as attended.
**Handling:**
- If no-show corrected within 24 hours, cancel review request
- Log the correction for accuracy tracking

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Review request send rate | 80%+ of eligible | Requests sent / Eligible check-ins |
| Response rate | 15%+ | Responses / Requests sent |
| Public review conversion | 5%+ | Public reviews / Requests sent |
| Sentiment score average | 4.2+/5 | Average of all ratings |
| Low rating catch rate | 90%+ | Low ratings caught private / All low ratings |
| Review platform coverage | Balanced | Reviews per platform within 20% of target |

---

## Technical Design

### Database Schema

```sql
-- Review request configuration
CREATE TABLE review_request_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  is_enabled BOOLEAN DEFAULT true,

  -- Timing
  delay_after_checkin_minutes INTEGER DEFAULT 120,  -- 2 hours
  send_window_start TIME DEFAULT '09:00',
  send_window_end TIME DEFAULT '21:00',

  -- Frequency caps
  min_days_between_requests INTEGER DEFAULT 30,
  max_requests_per_student_per_month INTEGER DEFAULT 1,

  -- Sentiment pre-filter
  use_sentiment_filter BOOLEAN DEFAULT true,
  positive_threshold INTEGER DEFAULT 4,  -- 4+ stars = happy

  -- Platform routing
  platform_weights JSONB DEFAULT '{"google": 50, "yelp": 25, "facebook": 25}',
  platform_deep_links JSONB DEFAULT '{}',

  -- Templates
  first_timer_template_id UUID REFERENCES email_templates(id),
  regular_template_id UUID REFERENCES email_templates(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id)
);

-- Review requests sent
CREATE TABLE review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Recipient
  profile_id UUID NOT NULL REFERENCES profiles(id),
  booking_id UUID REFERENCES bookings(id),

  -- Context
  class_occurrence_id UUID REFERENCES class_occurrences(id),
  teacher_id UUID REFERENCES profiles(id),
  location_id UUID REFERENCES locations(id),

  -- Request details
  target_platform TEXT,  -- 'google', 'yelp', 'facebook', 'classpass'
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'opened', 'clicked', 'responded', 'failed'
  )),

  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Response (if sentiment filter used)
  initial_rating INTEGER CHECK (initial_rating BETWEEN 1 AND 5),
  rated_at TIMESTAMPTZ,

  -- Outcome
  public_review_submitted BOOLEAN DEFAULT false,
  private_feedback_submitted BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Private feedback (low ratings)
CREATE TABLE review_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_request_id UUID NOT NULL REFERENCES review_requests(id),
  studio_id UUID NOT NULL REFERENCES studios(id),

  -- Rating
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  teacher_rating INTEGER CHECK (teacher_rating BETWEEN 1 AND 5),

  -- Feedback
  feedback_text TEXT,
  what_went_wrong TEXT[],  -- Multiple choice options selected
  improvement_suggestions TEXT,

  -- For first-timers
  how_heard_about_us TEXT,
  likelihood_to_return INTEGER CHECK (likelihood_to_return BETWEEN 1 AND 10),
  what_would_bring_back TEXT,

  -- Follow-up
  wants_follow_up BOOLEAN DEFAULT false,
  follow_up_contact TEXT,

  -- Staff response
  responded_by UUID REFERENCES profiles(id),
  response_notes TEXT,
  responded_at TIMESTAMPTZ,

  is_resolved BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Teacher ratings aggregate
CREATE TABLE teacher_review_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id),

  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  total_ratings INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2),
  rating_distribution JSONB DEFAULT '{}',  -- {"5": 10, "4": 5, "3": 2, "2": 0, "1": 1}

  positive_feedback_count INTEGER DEFAULT 0,
  negative_feedback_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, teacher_id, period_start)
);

-- Indexes
CREATE INDEX idx_review_requests_studio ON review_requests(studio_id, created_at DESC);
CREATE INDEX idx_review_requests_profile ON review_requests(profile_id, created_at DESC);
CREATE INDEX idx_review_requests_pending ON review_requests(status, sent_at)
  WHERE status = 'pending';
CREATE INDEX idx_review_feedback_unresolved ON review_feedback(studio_id, is_resolved)
  WHERE is_resolved = false;
```

### API Endpoints

```
# Configuration
GET    /api/manage/review-settings          # Get settings
PUT    /api/manage/review-settings          # Update settings

# Review Requests
GET    /api/manage/review-requests          # List requests
GET    /api/manage/review-requests/stats    # Request statistics
POST   /api/manage/review-requests/send     # Manually send request

# Feedback
GET    /api/manage/review-feedback          # List feedback
GET    /api/manage/review-feedback/:id      # Get feedback detail
PUT    /api/manage/review-feedback/:id      # Mark resolved, add notes

# Teacher Reports
GET    /api/manage/teachers/:id/reviews     # Teacher review summary

# Public (for students)
POST   /api/reviews/rate                    # Submit initial rating
POST   /api/reviews/feedback                # Submit detailed feedback
GET    /api/reviews/platforms/:studioSlug   # Get deep links for platform
```

### Edge Function: `send-review-requests`

Triggered by cron every 15 minutes:

1. Find check-ins from 2+ hours ago that haven't been processed
2. Filter out: opted-out users, recent requests, cancelled classes
3. Check if first-timer (different template)
4. Select platform based on weighted rotation
5. Send via preferred channel (email > SMS > push)
6. Log request in `review_requests`

---

## UI Routes

```
/manage/reviews                  # Review dashboard
/manage/reviews/settings         # Configuration
/manage/reviews/feedback         # Private feedback inbox
/manage/teachers/:id/reviews     # Teacher review summary

# Public (student-facing)
/review/:requestId               # Rating submission page
/review/:requestId/feedback      # Detailed feedback form
/review/:requestId/platforms     # Platform selection (for happy students)
```

---

## Rollout Plan

### Phase A: Basic Flow (Week 1-2)
1. Review request settings UI
2. Post-check-in trigger (Edge Function)
3. Basic email template
4. Rating submission page

### Phase B: Sentiment Filter (Week 3)
1. Emoji rating UI
2. Platform routing for happy students
3. Private feedback form for unhappy students
4. Feedback inbox for staff

### Phase C: Analytics & Refinement (Week 4)
1. Review dashboard with stats
2. Teacher aggregate reports
3. Platform performance tracking
4. A/B testing for templates

---

## Open Questions

1. **Third-party review tracking:** Should we try to verify if students actually left reviews on Google/Yelp?
2. **Incentives:** Should we allow offering discounts for reviews (check legal implications)?
3. **Photo reviews:** Should we allow students to upload photos with feedback?
4. **Public testimonials:** Should positive feedback be publishable on studio website?

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-02-06 | 1.0 | Claude | Initial PRD |
