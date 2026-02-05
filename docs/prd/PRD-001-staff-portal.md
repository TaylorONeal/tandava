# PRD-001: Staff Portal & Instructor Self-Service

## Overview
**Phase:** 1
**Priority:** P0
**Status:** Planned
**Owner:** TBD

---

## Jobs to Be Done

### Job 1: Instructor Schedule Visibility
**When** I'm an instructor planning my week,
**I want to** see all my upcoming classes, earnings, and sub opportunities in one place,
**So I can** manage my teaching schedule efficiently without calling the studio.

### Job 2: Availability Management
**When** I have personal commitments or want to take time off,
**I want to** mark myself unavailable for specific dates/times,
**So I can** prevent being scheduled during those periods and the studio can plan accordingly.

### Job 3: Sub Request Response
**When** another instructor needs a sub for their class,
**I want to** see available sub opportunities and claim them quickly,
**So I can** pick up extra classes that fit my schedule and earn more.

### Job 4: Sub Request Submission
**When** I can't teach a scheduled class,
**I want to** request a substitute and optionally suggest specific teachers,
**So I can** ensure coverage without playing phone tag with the studio manager.

### Job 5: Earnings Transparency
**When** I want to understand my compensation,
**I want to** see a breakdown of my earnings by class, tips, and period,
**So I can** verify my pay is accurate and plan my finances.

---

## User Stories

### US-1.1: Instructor Dashboard
**As an** instructor,
**I want** a dedicated dashboard showing my schedule, earnings, and notifications,
**So that** I have a single place to manage my teaching life.

**Acceptance Criteria:**
- [ ] Shows upcoming 2 weeks of scheduled classes by default
- [ ] Displays total earnings for current pay period
- [ ] Shows pending sub requests (incoming and outgoing)
- [ ] Shows any studio announcements or alerts
- [ ] Works on mobile (responsive design, touch-friendly)
- [ ] Accessible via `/teach` route (separate from `/manage`)

### US-1.2: Set Availability
**As an** instructor,
**I want** to set my availability by marking specific dates/times as unavailable,
**So that** the studio doesn't schedule me during those times.

**Acceptance Criteria:**
- [ ] Can block entire days (vacation, sick)
- [ ] Can block specific time ranges (e.g., "unavailable before 10am")
- [ ] Can set recurring unavailability (e.g., "never available Sundays")
- [ ] Changes visible to studio admin immediately
- [ ] Conflicts with existing scheduled classes flagged as warnings
- [ ] Can add optional notes (reason for unavailability)

### US-1.3: Request a Sub
**As an** instructor who can't teach a scheduled class,
**I want** to submit a sub request through the app,
**So that** qualified teachers are notified and can claim it.

**Acceptance Criteria:**
- [ ] Select class from upcoming schedule
- [ ] Must provide reason (optional visibility to other teachers)
- [ ] Can suggest specific teachers (optional)
- [ ] Notification sent to eligible teachers immediately
- [ ] Request shows status: pending, claimed, approved, denied
- [ ] Admin can override/approve sub assignment
- [ ] Original teacher notified when sub is confirmed

### US-1.4: Claim a Sub Opportunity
**As an** instructor looking for extra classes,
**I want** to see available sub opportunities and claim them,
**So that** I can pick up shifts that work for my schedule.

**Acceptance Criteria:**
- [ ] See list of open sub requests filtered by: location, class type, date
- [ ] One-tap claim (first-come or requires approval based on studio setting)
- [ ] See class details: time, location, style, expected attendance
- [ ] See pay rate for the sub
- [ ] Claimed subs appear in my schedule immediately
- [ ] Can withdraw claim before approval (within time limit)

### US-1.5: View Earnings History
**As an** instructor,
**I want** to see my earnings broken down by class, tips, and time period,
**So that** I can verify my compensation is correct.

**Acceptance Criteria:**
- [ ] View by pay period, month, or custom date range
- [ ] Breakdown: base pay, per-class, revenue share, tips
- [ ] List of individual classes with amount earned
- [ ] Export to CSV for personal records
- [ ] Compare to previous periods
- [ ] Year-to-date totals visible

### US-1.6: Shift Trading (Phase 1.1)
**As an** instructor,
**I want** to directly trade shifts with another instructor,
**So that** we can swap without involving the studio manager.

**Acceptance Criteria:**
- [ ] Propose trade: "I'll take your Tuesday 6pm if you take my Thursday 9am"
- [ ] Other teacher receives proposal, can accept/decline
- [ ] Admin notified of proposed trade
- [ ] Trade requires admin approval OR is auto-approved based on setting
- [ ] Both schedules updated atomically on approval
- [ ] Trade history logged for auditing

---

## Edge Cases

### EC-1: Sub Request for Class in <24 Hours
**Scenario:** Instructor requests sub for class starting in 2 hours.
**Handling:**
- Flag as "urgent" in notifications
- Send SMS in addition to push notification
- Escalate to admin immediately if not claimed within 30 minutes
- Allow admin to manually assign sub

### EC-2: Multiple Teachers Claim Same Sub
**Scenario:** Two instructors tap "claim" at nearly the same time.
**Handling:**
- First claim wins (optimistic locking on database)
- Second teacher sees "already claimed" message
- Optional: waitlist for sub claims

### EC-3: Instructor Marks Unavailable After Being Scheduled
**Scenario:** Instructor sets vacation for dates with existing classes.
**Handling:**
- Show warning: "You have 3 classes during this period"
- Offer to auto-generate sub requests for affected classes
- Require confirmation to proceed
- Admin notified of the unavailability + pending subs

### EC-4: Pay Rate Discrepancy
**Scenario:** Instructor believes earnings calculation is wrong.
**Handling:**
- Show calculation breakdown: (rate type) x (value) = amount
- Flag discrepancy to admin with one tap
- Admin can adjust with audit trail
- All adjustments logged with reason

### EC-5: Instructor Hasn't Completed Onboarding
**Scenario:** New instructor accesses portal before paperwork complete.
**Handling:**
- Show limited view (schedule only, no earnings)
- Banner: "Complete your setup to access all features"
- Block sub claiming until onboarding complete
- Checklist: profile, payment info, certifications, waiver

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sub request response time | <4 hours avg | Time from request to claim |
| Admin time on scheduling | -50% | Self-reported or measured |
| Instructor app usage | 80% weekly active | Unique logins / total instructors |
| Sub coverage rate | 95%+ | Classes with subs / classes needing subs |
| Earnings dispute rate | <2% | Flagged discrepancies / total pay periods |

---

## Technical Design

### Database Schema

```sql
-- Instructor availability
CREATE TABLE instructor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Type of availability
  availability_type TEXT NOT NULL CHECK (availability_type IN (
    'unavailable',     -- Blocked time
    'preferred',       -- Prefers to teach
    'available'        -- Open for subs
  )),

  -- Time specification
  start_date DATE NOT NULL,
  end_date DATE,                    -- null = single day
  start_time TIME,                  -- null = all day
  end_time TIME,

  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,          -- 'weekly', 'biweekly', 'monthly'
  recurrence_days INTEGER[],        -- [0,6] for Sunday, Saturday
  recurrence_end_date DATE,

  -- Metadata
  reason TEXT,
  is_visible_to_others BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(profile_id, studio_id, start_date, start_time)
);

-- Sub requests
CREATE TABLE sub_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  class_occurrence_id UUID NOT NULL REFERENCES class_occurrences(id) ON DELETE CASCADE,

  -- Requestor
  requesting_teacher_id UUID NOT NULL REFERENCES profiles(id),
  reason TEXT,
  reason_visible BOOLEAN DEFAULT false,

  -- Suggested teachers
  suggested_teacher_ids UUID[],

  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',           -- Looking for sub
    'claimed',        -- Someone claimed, awaiting approval
    'approved',       -- Sub confirmed
    'denied',         -- Admin denied
    'cancelled',      -- Requestor cancelled
    'expired'         -- Class happened without sub
  )),

  -- Claiming
  claimed_by_id UUID REFERENCES profiles(id),
  claimed_at TIMESTAMPTZ,

  -- Approval
  approved_by_id UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  denial_reason TEXT,

  -- Pay
  sub_pay_cents INTEGER,            -- Override if different from default

  -- Urgency
  is_urgent BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Shift trades
CREATE TABLE shift_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- The proposer and their class
  proposer_id UUID NOT NULL REFERENCES profiles(id),
  proposer_class_id UUID NOT NULL REFERENCES class_occurrences(id),

  -- The recipient and their class
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  recipient_class_id UUID NOT NULL REFERENCES class_occurrences(id),

  -- Status
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN (
    'proposed',
    'accepted',       -- Recipient accepted, awaiting admin approval
    'approved',       -- Trade complete
    'declined',       -- Recipient declined
    'denied',         -- Admin denied
    'cancelled',      -- Proposer cancelled
    'expired'         -- No response in time
  )),

  -- Response
  responded_at TIMESTAMPTZ,
  response_note TEXT,

  -- Approval
  approved_by_id UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_instructor_availability_profile ON instructor_availability(profile_id, start_date);
CREATE INDEX idx_sub_requests_status ON sub_requests(status, studio_id);
CREATE INDEX idx_sub_requests_class ON sub_requests(class_occurrence_id);
CREATE INDEX idx_shift_trades_status ON shift_trades(status, studio_id);
```

### API Endpoints

```
# Instructor Portal
GET    /api/teach/dashboard              # Dashboard data
GET    /api/teach/schedule               # My upcoming classes
GET    /api/teach/earnings               # Earnings summary
GET    /api/teach/earnings/:period       # Earnings for specific period

# Availability
GET    /api/teach/availability           # My availability rules
POST   /api/teach/availability           # Set availability
PUT    /api/teach/availability/:id       # Update availability
DELETE /api/teach/availability/:id       # Remove availability

# Sub Requests
GET    /api/teach/subs/open              # Available sub opportunities
GET    /api/teach/subs/my-requests       # My outgoing requests
POST   /api/teach/subs/request           # Create sub request
POST   /api/teach/subs/:id/claim         # Claim a sub
DELETE /api/teach/subs/:id/claim         # Withdraw claim

# Shift Trades
GET    /api/teach/trades                 # My trade proposals
POST   /api/teach/trades                 # Propose trade
POST   /api/teach/trades/:id/respond     # Accept/decline trade
```

### UI Routes

```
/teach                    # Instructor dashboard
/teach/schedule           # Full schedule view
/teach/availability       # Manage availability
/teach/subs               # Sub marketplace
/teach/subs/my-requests   # My sub requests
/teach/earnings           # Earnings history
/teach/trades             # Shift trades
/teach/profile            # My teaching profile
```

---

## Open Questions

1. **Auto-approval for subs?** Should studios be able to auto-approve subs from "approved" teacher lists, or always require admin approval?

2. **Sub pay rates:** Should subs always get the original teacher's rate, a flat sub rate, or negotiable per request?

3. **Notification preferences:** Should instructors control notification channels (push, SMS, email) per notification type?

4. **Trade deadlines:** How close to class time should trades be allowed? 24 hours? 48 hours?

---

## Dependencies

- Push notification infrastructure (Phase 2, but needed for urgent subs)
- SMS integration for urgent notifications (can use email as fallback)

---

## Rollout Plan

1. **Alpha:** Internal testing with 2-3 friendly studios
2. **Beta:** 10 studios with active instructor pools
3. **GA:** Full release with documentation

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-02-05 | 1.0 | Claude | Initial PRD |
