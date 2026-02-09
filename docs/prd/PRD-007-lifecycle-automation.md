# PRD-007: Lifecycle Automation

## Overview
**Phase:** 2
**Priority:** P2
**Status:** Planned
**Owner:** TBD
**Dependencies:** Notification system (PRD-005), Campaign infrastructure (PRD-011)

---

## Jobs to Be Done

### Job 1: Celebrate Milestones
**When** a student reaches a meaningful milestone (birthday, anniversary, 100th class),
**I want to** automatically recognize and celebrate them,
**So I can** strengthen our relationship and increase retention.

### Job 2: Nurture New Leads
**When** someone signs up but hasn't attended their first class,
**I want to** send a sequence of helpful messages,
**So I can** convert them from signup to active member.

### Job 3: Re-Engage Lapsed Members
**When** a regular student stops attending,
**I want to** reach out with relevant win-back messaging,
**So I can** bring them back before they're truly gone.

### Job 4: Score Lead Quality
**When** evaluating which leads to prioritize,
**I want to** see engagement scores and predicted conversion likelihood,
**So I can** focus outreach efforts effectively.

### Job 5: Automate Routine Communications
**When** predictable events occur (membership expiring, pack running low),
**I want** to automatically send relevant communications,
**So I can** reduce manual work while maintaining personal touch.

---

## User Stories

### US-7.1: Birthday Automation
**As a** studio owner,
**I want** to automatically send birthday greetings to students,
**So that** they feel valued without manual effort.

**Acceptance Criteria:**
- [ ] Configurable birthday message (email/SMS)
- [ ] Option to include birthday offer (discount, free class)
- [ ] Send date configurable (day of, day before)
- [ ] Respect notification preferences
- [ ] Track redemption of birthday offers
- [ ] Dashboard showing upcoming birthdays

### US-7.2: Membership Anniversary
**As a** studio owner,
**I want** to celebrate membership anniversaries,
**So that** members feel appreciated for their loyalty.

**Acceptance Criteria:**
- [ ] Automatic message on membership anniversary
- [ ] Configurable for 1 year, 2 year, 5 year milestones
- [ ] Include loyalty stats (classes attended, hours practiced)
- [ ] Option to include anniversary gift/offer
- [ ] Track anniversary celebrations sent

### US-7.3: Practice Milestones
**As a** studio owner,
**I want** to celebrate practice milestones (10th, 50th, 100th class),
**So that** students feel accomplished and motivated.

**Acceptance Criteria:**
- [ ] Configurable milestone thresholds
- [ ] Automatic recognition message when reached
- [ ] Optional in-studio announcement (teacher notification)
- [ ] Milestone badge on student profile
- [ ] Share option for social media

### US-7.4: New Lead Drip Campaign
**As a** studio owner,
**I want** to nurture new signups with a welcome sequence,
**So that** I convert more leads to active members.

**Acceptance Criteria:**
- [ ] Multi-step email sequence (3-7 messages)
- [ ] Conditional logic (skip steps if already booked)
- [ ] Configurable delays between messages
- [ ] A/B testing of subject lines and content
- [ ] Stop sequence when goal achieved (first booking)
- [ ] Track conversion rate by sequence

### US-7.5: Lapsed Member Win-Back
**As a** studio owner,
**I want** to automatically reach out to lapsing members,
**So that** I can retain them before they fully churn.

**Acceptance Criteria:**
- [ ] Define "at risk" criteria (no visit in X days)
- [ ] Tiered outreach (warning at 14 days, urgent at 30 days)
- [ ] Personalized based on past preferences
- [ ] Option to include win-back offer
- [ ] Track return rate by campaign
- [ ] Alert staff for high-value members at risk

### US-7.6: Lead Scoring
**As a** studio owner,
**I want** to see engagement scores for leads,
**So that** I can prioritize follow-up efforts.

**Acceptance Criteria:**
- [ ] Automatic score based on actions (visits, opens, clicks)
- [ ] Configurable score weights
- [ ] Score decay over time
- [ ] Lead quality tiers (hot, warm, cold)
- [ ] Sort leads by score in CRM view
- [ ] Score change alerts for significant movements

### US-7.7: Expiration Reminders
**As a** studio owner,
**I want** automatic reminders for expiring items,
**So that** members renew without staff intervention.

**Acceptance Criteria:**
- [ ] Membership expiration reminders (7 days, 3 days, day of)
- [ ] Class pack low balance alerts (3 classes remaining)
- [ ] Class pack expiration warnings
- [ ] Include direct renewal/purchase link
- [ ] Track renewal rate from reminders

### US-7.8: Drip Campaign Builder
**As a** studio owner,
**I want** to create custom multi-step sequences,
**So that** I can automate complex communication flows.

**Acceptance Criteria:**
- [ ] Visual campaign builder (flow diagram)
- [ ] Trigger conditions (signup, purchase, tag added)
- [ ] Wait steps (1 day, 3 days, 1 week)
- [ ] Conditional branches (if opened, if clicked)
- [ ] Action steps (send email, send SMS, add tag, alert staff)
- [ ] Goal tracking (what ends the sequence)
- [ ] Campaign analytics (funnel conversion)

---

## Edge Cases

### EC-1: Birthday Unknown
**Scenario:** Student didn't provide birthday.
**Handling:**
- Skip birthday automation
- Optional: prompt to add birthday on profile

### EC-2: Multiple Memberships
**Scenario:** Student has had multiple memberships over time.
**Handling:**
- Anniversary based on first membership start (total relationship)
- Or: based on current active membership (current commitment)
- Configurable setting

### EC-3: Timezone Differences
**Scenario:** Member in different timezone than studio.
**Handling:**
- Send based on member's local time if known
- Fallback to studio timezone
- Don't send at inappropriate hours

### EC-4: Overlapping Drip Campaigns
**Scenario:** Member qualifies for multiple drip campaigns.
**Handling:**
- Priority rules (higher priority wins)
- Or: allow parallel campaigns with frequency cap
- Never send more than 1 automated message per day

### EC-5: Member Opts Out Mid-Sequence
**Scenario:** Member unsubscribes during drip campaign.
**Handling:**
- Immediately stop all automated messages
- Mark campaign as "opted out"
- Resume if they re-subscribe (configurable)

### EC-6: Milestone Reached Retroactively
**Scenario:** Data import reveals member already passed 100 classes.
**Handling:**
- Don't send retroactive milestone messages
- Start fresh from current count
- Or: send "belated" celebration (configurable)

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Birthday message open rate | 60%+ | Opens / Sent |
| Birthday offer redemption | 15%+ | Redemptions / Sent |
| Drip campaign conversion | 20%+ | First booking / New signups in sequence |
| Win-back return rate | 10%+ | Returned / Win-back sent |
| Lead score accuracy | 80%+ | High-score leads convert at higher rate |
| Renewal from reminder | 50%+ | Renewals / Expiration reminders |

---

## Technical Design

### Database Schema

```sql
-- ============================================================================
-- LIFECYCLE AUTOMATION SETTINGS
-- ============================================================================

CREATE TABLE lifecycle_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,

  -- Type
  automation_type TEXT NOT NULL CHECK (automation_type IN (
    'birthday',
    'membership_anniversary',
    'practice_milestone',
    'new_lead_drip',
    'win_back',
    'expiration_reminder',
    'custom_drip'
  )),

  -- Status
  is_active BOOLEAN DEFAULT false,

  -- Trigger (when this starts)
  trigger_config JSONB NOT NULL DEFAULT '{}',
  /* Examples:
  Birthday: {"days_before": 0}
  Anniversary: {"years": [1, 2, 5]}
  Milestone: {"thresholds": [10, 25, 50, 100, 250, 500]}
  New Lead: {"event": "signup", "delay_hours": 24}
  Win Back: {"inactive_days": 14, "member_only": true}
  Expiration: {"days_before": [7, 3, 1]}
  */

  -- Goal (what ends this automation)
  goal_config JSONB DEFAULT '{}',
  /* Examples:
  {"event": "booking_completed"}
  {"event": "membership_renewed"}
  {"event": "check_in"}
  */

  -- Steps (for multi-step sequences)
  steps JSONB NOT NULL DEFAULT '[]',
  /* Example:
  [
    {
      "step_id": "step_1",
      "delay_hours": 0,
      "action": "send_email",
      "template_id": "uuid",
      "conditions": []
    },
    {
      "step_id": "step_2",
      "delay_hours": 72,
      "action": "send_email",
      "template_id": "uuid",
      "conditions": [{"type": "not_opened", "step_id": "step_1"}]
    }
  ]
  */

  -- Frequency caps
  cooldown_days INTEGER,  -- Don't re-enter for X days after completion

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, slug)
);

-- ============================================================================
-- AUTOMATION ENROLLMENTS
-- ============================================================================

CREATE TYPE automation_enrollment_status AS ENUM (
  'active',
  'completed',
  'goal_achieved',
  'opted_out',
  'cancelled'
);

CREATE TABLE automation_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  automation_id UUID NOT NULL REFERENCES lifecycle_automations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),

  -- Status
  status automation_enrollment_status DEFAULT 'active',

  -- Progress
  current_step TEXT,  -- step_id
  steps_completed TEXT[] DEFAULT '{}',

  -- Timing
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  last_step_at TIMESTAMPTZ,
  next_step_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Context (why they enrolled)
  trigger_data JSONB DEFAULT '{}',
  /* Examples:
  {"birthday": "1990-05-15"}
  {"membership_start": "2023-01-01", "years": 2}
  {"last_visit": "2024-01-15", "inactive_days": 30}
  */

  -- Outcome
  goal_achieved BOOLEAN DEFAULT false,
  goal_achieved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(automation_id, profile_id, enrolled_at)
);

-- ============================================================================
-- AUTOMATION STEP LOGS
-- ============================================================================

CREATE TABLE automation_step_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES automation_enrollments(id) ON DELETE CASCADE,

  step_id TEXT NOT NULL,
  action_type TEXT NOT NULL,  -- 'send_email', 'send_sms', 'add_tag', 'alert_staff'

  -- Execution
  executed_at TIMESTAMPTZ DEFAULT now(),
  was_skipped BOOLEAN DEFAULT false,
  skip_reason TEXT,

  -- Result
  notification_id UUID REFERENCES notifications(id),
  success BOOLEAN,
  error_message TEXT,

  -- Engagement (for email/sms)
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- ============================================================================
-- LEAD SCORING
-- ============================================================================

CREATE TABLE lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),

  -- Current score
  score INTEGER NOT NULL DEFAULT 0,
  tier TEXT CHECK (tier IN ('hot', 'warm', 'cold', 'inactive')),

  -- Score breakdown
  score_components JSONB DEFAULT '{}',
  /* Example:
  {
    "profile_complete": 10,
    "email_opened": 5,
    "class_booked": 30,
    "membership_active": 50,
    "decay": -15
  }
  */

  -- History
  previous_tier TEXT,
  tier_changed_at TIMESTAMPTZ,

  -- Predictions (future: ML-based)
  conversion_probability NUMERIC(5,4),  -- 0.0000 to 1.0000
  predicted_ltv_cents INTEGER,

  calculated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, profile_id)
);

-- Lead score events (what actions affect score)
CREATE TABLE lead_score_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),

  event_type TEXT NOT NULL,
  /* Event types:
  'profile_created', 'profile_updated', 'email_opened', 'email_clicked',
  'booking_created', 'booking_completed', 'membership_started',
  'membership_cancelled', 'purchase_completed', 'page_visited', 'decay'
  */

  points INTEGER NOT NULL,  -- Can be negative for decay
  score_before INTEGER NOT NULL,
  score_after INTEGER NOT NULL,

  -- Context
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lead scoring configuration
CREATE TABLE lead_score_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Point values
  score_weights JSONB NOT NULL DEFAULT '{
    "profile_complete": 10,
    "email_opened": 2,
    "email_clicked": 5,
    "class_booked": 15,
    "class_completed": 20,
    "membership_started": 50,
    "purchase_completed": 10,
    "page_visited": 1,
    "referral_made": 25
  }',

  -- Decay
  decay_enabled BOOLEAN DEFAULT true,
  decay_points_per_week INTEGER DEFAULT 5,
  decay_floor INTEGER DEFAULT 0,  -- Don't decay below this

  -- Tier thresholds
  tier_thresholds JSONB DEFAULT '{
    "hot": 80,
    "warm": 40,
    "cold": 10
  }',  -- Below 10 = inactive

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id)
);

-- ============================================================================
-- MILESTONE TRACKING
-- ============================================================================

CREATE TABLE practice_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),

  milestone_type TEXT NOT NULL CHECK (milestone_type IN (
    'classes_attended',
    'hours_practiced',
    'consecutive_weeks',
    'membership_years'
  )),

  threshold INTEGER NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT now(),

  -- Recognition
  recognized BOOLEAN DEFAULT false,
  recognized_at TIMESTAMPTZ,
  recognition_method TEXT,  -- 'email', 'in_class', 'badge'

  -- Sharing
  shared_to_social BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, profile_id, milestone_type, threshold)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_lifecycle_automations_studio ON lifecycle_automations(studio_id, is_active);
CREATE INDEX idx_automation_enrollments_active ON automation_enrollments(automation_id, status)
  WHERE status = 'active';
CREATE INDEX idx_automation_enrollments_next_step ON automation_enrollments(next_step_at)
  WHERE status = 'active' AND next_step_at IS NOT NULL;
CREATE INDEX idx_lead_scores_studio ON lead_scores(studio_id, score DESC);
CREATE INDEX idx_lead_scores_tier ON lead_scores(studio_id, tier);
CREATE INDEX idx_practice_milestones_profile ON practice_milestones(profile_id, achieved_at DESC);
```

### API Endpoints

```
# Automations
GET    /api/manage/automations              # List automations
POST   /api/manage/automations              # Create automation
GET    /api/manage/automations/:id          # Get automation detail
PUT    /api/manage/automations/:id          # Update automation
DELETE /api/manage/automations/:id          # Delete automation
POST   /api/manage/automations/:id/activate # Activate
POST   /api/manage/automations/:id/pause    # Pause

# Enrollments
GET    /api/manage/automations/:id/enrollments  # List enrollments
GET    /api/manage/enrollments/:id              # Enrollment detail
POST   /api/manage/enrollments/:id/cancel       # Cancel enrollment

# Lead Scores
GET    /api/manage/leads                    # List leads with scores
GET    /api/manage/leads/:profileId/score   # Get lead score detail
GET    /api/manage/lead-score-settings      # Get scoring config
PUT    /api/manage/lead-score-settings      # Update scoring config

# Milestones
GET    /api/manage/milestones               # Recent milestones
GET    /api/manage/milestones/upcoming      # Upcoming milestones
GET    /api/members/:id/milestones          # Member's milestones
```

### Edge Functions

#### `process-lifecycle-automations`
Cron every 15 minutes:
1. Find enrollments where `next_step_at <= now()`
2. Execute step action (send email, SMS, etc.)
3. Evaluate conditions for next step
4. Update enrollment progress or complete

#### `check-automation-triggers`
Cron every hour:
1. Birthday: find profiles with birthday = today
2. Anniversary: find memberships with anniversary today
3. Win-back: find members inactive for X days
4. Expiration: find expiring memberships/packs
5. Enroll qualifying profiles in automations

#### `calculate-lead-scores`
Cron daily:
1. Apply decay to all scores
2. Update tier classifications
3. Flag significant tier changes for alerts

---

## UI Routes

```
/manage/automations                    # Automation list
/manage/automations/new                # Create automation
/manage/automations/:id                # Edit automation
/manage/automations/:id/enrollments    # View enrollments

/manage/leads                          # Lead scoring dashboard
/manage/leads/:id                      # Lead detail

/manage/milestones                     # Milestone dashboard
```

---

## Rollout Plan

### Phase A: Birthday & Anniversary (Week 1-2)
1. Birthday automation setup
2. Membership anniversary automation
3. Simple one-step sequences

### Phase B: Lead Scoring (Week 3)
1. Score calculation engine
2. Lead dashboard with tiers
3. Score-based sorting

### Phase C: Drip Campaigns (Week 4-5)
1. Multi-step sequence builder
2. New lead welcome sequence
3. Win-back automation

### Phase D: Milestones (Week 6)
1. Practice milestone tracking
2. Milestone celebration automation
3. Social sharing option

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-02-06 | 1.0 | Claude | Initial PRD |
