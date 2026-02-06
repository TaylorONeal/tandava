# PRD-010: Schedule Automation

## Overview
**Phase:** 3
**Priority:** P1
**Status:** Planned
**Owner:** TBD
**Dependencies:** Core scheduling, Booking system

---

## Jobs to Be Done

### Job 1: Optimize Studio Turnover
**When** scheduling back-to-back classes,
**I want to** automatically add buffer time for cleaning and setup,
**So I can** maintain studio quality without manual scheduling adjustments.

### Job 2: Maximize Capacity Utilization
**When** classes are consistently over or under-filled,
**I want to** see recommendations for schedule adjustments,
**So I can** optimize revenue and member experience.

### Job 3: Handle Cancellation Recovery
**When** a class is cancelled due to low enrollment,
**I want to** automatically handle rebooking and notifications,
**So I can** minimize manual work and member frustration.

### Job 4: Manage Teacher Coverage
**When** a teacher calls out or requests time off,
**I want to** automatically find coverage options,
**So I can** maintain schedule consistency with minimal effort.

---

## User Stories

### US-10.1: Cleaning/Turnover Buffers
**As a** studio owner,
**I want** to define buffer time between classes,
**So that** there's always time for cleaning and setup.

**Acceptance Criteria:**
- [ ] Configurable default buffer (e.g., 15 minutes)
- [ ] Buffer by room/location (hot room needs more time)
- [ ] Buffer by class type (equipment classes need setup)
- [ ] Visual indication on schedule when buffer is active
- [ ] Warning when scheduling would violate buffer
- [ ] Buffer time blocked from bookings

### US-10.2: Automated Capacity Alerts
**As a** studio manager,
**I want** alerts when classes are consistently over or under capacity,
**So that** I can adjust the schedule proactively.

**Acceptance Criteria:**
- [ ] Define thresholds (e.g., >90% full, <30% full)
- [ ] Alerts after pattern detected (3+ occurrences)
- [ ] Suggestions: add another class, increase capacity, reduce frequency
- [ ] Trend visualization over time
- [ ] Seasonal pattern recognition

### US-10.3: Low-Enrollment Class Handling
**As a** studio manager,
**I want** automatic handling when classes have low enrollment,
**So that** I can make decisions without manual tracking.

**Acceptance Criteria:**
- [ ] Configurable threshold (e.g., <3 students, 4 hours before)
- [ ] Auto-notification to booked students with options
- [ ] Offer alternative classes at similar times
- [ ] Staff alert for manual review
- [ ] One-click cancel with automatic notifications
- [ ] Track cancellation reasons for analysis

### US-10.4: Smart Capacity Recommendations
**As a** studio owner,
**I want** AI-powered schedule recommendations,
**So that** I can optimize class times and offerings.

**Acceptance Criteria:**
- [ ] Analyze historical attendance patterns
- [ ] Recommend optimal class times
- [ ] Suggest class type changes based on demand
- [ ] Show projected impact of changes
- [ ] Compare similar studios' patterns (anonymized benchmarks)

### US-10.5: Room/Equipment Conflict Prevention
**As a** studio manager,
**I want** automatic conflict detection for rooms and equipment,
**So that** I never double-book resources.

**Acceptance Criteria:**
- [ ] Track room assignments per class
- [ ] Track equipment requirements per class type
- [ ] Alert on scheduling conflicts
- [ ] Show availability when creating classes
- [ ] Handle equipment quantity limits (e.g., 20 reformers)

### US-10.6: Weather/Event Impact Handling
**As a** studio owner,
**I want** to account for weather and events affecting attendance,
**So that** I can adjust staffing and expectations.

**Acceptance Criteria:**
- [ ] Manual "expected low attendance" flag
- [ ] Optional weather API integration
- [ ] Adjust capacity warnings accordingly
- [ ] Historical weather/attendance correlation
- [ ] Pre-emptive notifications to students

---

## Edge Cases

### EC-1: Buffer Overlaps Existing Class
**Scenario:** Adding buffer would overlap with an already-scheduled class.
**Handling:**
- Show warning but allow override
- Log override for audit
- Suggest alternative times

### EC-2: Equipment Shared Across Locations
**Scenario:** Mobile equipment (e.g., props) used at multiple locations.
**Handling:**
- Track equipment by location
- Allow transfer scheduling
- Warn if equipment won't arrive in time

### EC-3: Multi-Room Class
**Scenario:** Large workshop needs two connected rooms.
**Handling:**
- Support multi-room assignment
- Block both rooms for duration
- Unified buffer after

### EC-4: Buffer for Different Class Types
**Scenario:** Hot yoga needs 20 min buffer, vinyasa needs 10 min.
**Handling:**
- Buffer rules by class type
- Larger buffer takes precedence between back-to-back
- Clear visualization of which buffer applies

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Double-booking incidents | 0 | Scheduling conflicts created |
| Average class fill rate | 70%+ | Attendees / Capacity |
| Low-enrollment cancellations | <5% | Cancelled / Total classes |
| Time to find sub coverage | <2 hours | Request to acceptance |
| Schedule optimization score | Improving | Composite of utilization metrics |

---

## Technical Design

### Database Schema

```sql
-- ============================================================================
-- BUFFER CONFIGURATION
-- ============================================================================

CREATE TABLE schedule_buffer_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Scope (more specific overrides less specific)
  location_id UUID REFERENCES locations(id),
  room_id UUID,  -- Room within location
  class_type_id UUID REFERENCES class_types(id),

  -- Buffer settings
  buffer_before_minutes INTEGER DEFAULT 0,
  buffer_after_minutes INTEGER DEFAULT 15,

  -- Reason
  buffer_purpose TEXT,  -- 'cleaning', 'equipment_setup', 'temperature_reset'

  -- Active
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- CAPACITY MONITORING
-- ============================================================================

CREATE TABLE capacity_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- What triggered
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'high_demand',        -- Consistently full
    'low_demand',         -- Consistently empty
    'trending_up',        -- Demand increasing
    'trending_down',      -- Demand decreasing
    'cancellation_risk'   -- Low enrollment for upcoming class
  )),

  -- Context
  class_type_id UUID REFERENCES class_types(id),
  schedule_rule_id UUID REFERENCES schedule_rules(id),
  location_id UUID REFERENCES locations(id),
  day_of_week INTEGER,
  time_slot TIME,

  -- Data
  metric_value NUMERIC,  -- Fill rate, trend percentage, etc.
  threshold_value NUMERIC,
  consecutive_occurrences INTEGER,
  sample_size INTEGER,

  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'actioned', 'dismissed')),

  -- Recommendation
  recommendation TEXT,
  recommendation_type TEXT,  -- 'add_class', 'remove_class', 'change_time', 'increase_capacity'

  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  action_taken TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SCHEDULE OPTIMIZATION SUGGESTIONS
-- ============================================================================

CREATE TABLE schedule_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Suggestion type
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
    'add_class',
    'remove_class',
    'move_class',
    'change_capacity',
    'change_instructor',
    'change_class_type'
  )),

  -- Current state
  current_config JSONB NOT NULL DEFAULT '{}',
  /* Example:
  {
    "schedule_rule_id": "uuid",
    "day_of_week": 2,
    "start_time": "09:00",
    "class_type": "Power Vinyasa",
    "capacity": 25
  }
  */

  -- Suggested change
  suggested_config JSONB NOT NULL DEFAULT '{}',
  /* Example:
  {
    "day_of_week": 2,
    "start_time": "09:30",  -- Moved 30 min later
    "capacity": 30  -- Increased
  }
  */

  -- Reasoning
  reason TEXT NOT NULL,
  supporting_data JSONB DEFAULT '{}',
  /* Example:
  {
    "current_fill_rate": 0.92,
    "waitlist_average": 3.5,
    "similar_class_fill_rate": 0.65,
    "demand_score": 85
  }
  */

  -- Impact projection
  projected_impact JSONB DEFAULT '{}',
  /* Example:
  {
    "additional_bookings_per_week": 12,
    "additional_revenue_monthly": 48000,  -- cents
    "reduced_waitlist_frustration": true
  }
  */

  -- Confidence
  confidence_score NUMERIC(3,2) CHECK (confidence_score BETWEEN 0 AND 1),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'implemented')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- If implemented, track outcome
  implemented_at TIMESTAMPTZ,
  actual_impact JSONB,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ROOM & EQUIPMENT MANAGEMENT
-- ============================================================================

-- Room definitions (within locations)
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Capacity
  default_capacity INTEGER NOT NULL,
  max_capacity INTEGER,

  -- Features
  has_heating BOOLEAN DEFAULT false,
  has_mirrors BOOLEAN DEFAULT true,
  has_sound_system BOOLEAN DEFAULT true,
  square_footage INTEGER,

  -- Equipment available in room
  fixed_equipment JSONB DEFAULT '[]',  -- ["wall_ropes", "barre"]

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Portable equipment
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  quantity_total INTEGER NOT NULL,

  -- Per-location availability
  location_quantities JSONB DEFAULT '{}',  -- {"location_uuid": 20}

  -- Requirements
  setup_time_minutes INTEGER DEFAULT 0,
  cleanup_time_minutes INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Equipment requirements per class type
CREATE TABLE class_type_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_type_id UUID NOT NULL REFERENCES class_types(id) ON DELETE CASCADE,

  equipment_id UUID NOT NULL REFERENCES equipment(id),
  quantity_per_student INTEGER DEFAULT 1,
  is_optional BOOLEAN DEFAULT false,

  UNIQUE(class_type_id, equipment_id)
);

-- ============================================================================
-- LOW ENROLLMENT HANDLING
-- ============================================================================

CREATE TABLE low_enrollment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Thresholds
  min_students_to_run INTEGER DEFAULT 3,
  check_hours_before INTEGER DEFAULT 4,  -- Hours before class to check

  -- Auto-actions
  auto_notify_students BOOLEAN DEFAULT true,
  auto_notify_teacher BOOLEAN DEFAULT true,
  offer_alternatives BOOLEAN DEFAULT true,

  -- Templates
  student_notification_template_id UUID,
  teacher_notification_template_id UUID,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id)
);

CREATE TABLE low_enrollment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  class_occurrence_id UUID NOT NULL REFERENCES class_occurrences(id),

  -- Detection
  detected_at TIMESTAMPTZ DEFAULT now(),
  enrollment_count INTEGER NOT NULL,
  threshold INTEGER NOT NULL,

  -- Resolution
  resolution TEXT CHECK (resolution IN (
    'ran_anyway',     -- Decided to run despite low enrollment
    'cancelled',      -- Class cancelled
    'merged',         -- Students moved to another class
    'filled'          -- More students signed up
  )),

  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,

  -- If cancelled/merged
  alternative_class_id UUID REFERENCES class_occurrences(id),
  students_notified INTEGER,
  students_rebooked INTEGER,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_buffer_rules_studio ON schedule_buffer_rules(studio_id);
CREATE INDEX idx_capacity_alerts_open ON capacity_alerts(studio_id, status)
  WHERE status = 'open';
CREATE INDEX idx_schedule_suggestions_pending ON schedule_suggestions(studio_id, status)
  WHERE status = 'pending';
CREATE INDEX idx_rooms_location ON rooms(location_id, is_active);
CREATE INDEX idx_low_enrollment_events_unresolved ON low_enrollment_events(studio_id, resolution)
  WHERE resolution IS NULL;
```

### API Endpoints

```
# Buffer Rules
GET    /api/manage/schedule/buffers         # List buffer rules
POST   /api/manage/schedule/buffers         # Create buffer rule
PUT    /api/manage/schedule/buffers/:id     # Update buffer rule
DELETE /api/manage/schedule/buffers/:id     # Delete buffer rule

# Capacity Alerts
GET    /api/manage/schedule/alerts          # List alerts
PUT    /api/manage/schedule/alerts/:id      # Acknowledge/action alert

# Schedule Suggestions
GET    /api/manage/schedule/suggestions     # List suggestions
PUT    /api/manage/schedule/suggestions/:id # Accept/reject suggestion

# Rooms & Equipment
GET    /api/manage/rooms                    # List rooms
POST   /api/manage/rooms                    # Create room
PUT    /api/manage/rooms/:id                # Update room
GET    /api/manage/equipment                # List equipment
POST   /api/manage/equipment                # Create equipment

# Low Enrollment
GET    /api/manage/schedule/low-enrollment  # Low enrollment settings
PUT    /api/manage/schedule/low-enrollment  # Update settings
GET    /api/manage/schedule/at-risk         # Classes at risk
POST   /api/manage/schedule/:occurrenceId/cancel-low  # Cancel with notifications
```

---

## UI Routes

```
/manage/schedule/settings        # Schedule automation settings
/manage/schedule/buffers         # Buffer configuration
/manage/schedule/alerts          # Capacity alerts
/manage/schedule/suggestions     # AI recommendations
/manage/schedule/rooms           # Room management
/manage/schedule/equipment       # Equipment management
```

---

## Rollout Plan

### Phase A: Buffers (Week 1)
1. Buffer rule management UI
2. Schedule conflict detection
3. Visual buffer indicators

### Phase B: Room/Equipment (Week 2)
1. Room management
2. Equipment tracking
3. Assignment on class creation

### Phase C: Alerts & Low Enrollment (Week 3)
1. Capacity alert engine
2. Low enrollment detection
3. Automatic notifications

### Phase D: AI Suggestions (Week 4)
1. Pattern analysis engine
2. Suggestion generation
3. Impact projection

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-02-06 | 1.0 | Claude | Initial PRD |
