# PRD-012: Staff Task Management

## Overview
**Phase:** 5
**Priority:** P0
**Status:** Planned
**Owner:** TBD

---

## Jobs to Be Done

### Job 1: Operational Task Tracking
**When** there are daily tasks that need to be done at the studio (cleaning, restocking, setup),
**I want to** assign them to staff members and track completion,
**So I can** ensure nothing falls through the cracks.

### Job 2: Recurring Task Automation
**When** I have tasks that happen on a regular schedule (daily wipe-down, weekly inventory count),
**I want to** set them up once and have them auto-assign,
**So I can** focus on running the studio instead of managing checklists.

### Job 3: Shift Handoff
**When** ending my shift,
**I want to** see incomplete tasks and hand them off to the next person,
**So I can** ensure continuity of operations.

### Job 4: Accountability
**When** reviewing staff performance,
**I want to** see task completion rates per staff member,
**So I can** recognize great work and address issues.

---

## User Stories

### US-12.1: Task Board
**As a** studio manager,
**I want** a visual task board showing all tasks by status,
**So that** I can quickly see what needs attention.

**Acceptance Criteria:**
- [ ] Kanban-style board with columns: To Do, In Progress, Done
- [ ] Filter by: assignee, category, due date, location
- [ ] Drag-and-drop to change status
- [ ] Quick-add task inline
- [ ] Due date highlighting (overdue in red)

### US-12.2: Task Creation
**As a** manager,
**I want** to create tasks with details and assignments,
**So that** staff knows exactly what to do.

**Acceptance Criteria:**
- [ ] Title (required) and description (optional)
- [ ] Category: cleaning, inventory, setup, maintenance, admin, custom
- [ ] Priority: low, normal, high, urgent
- [ ] Due date/time
- [ ] Assignee (optional - can be unassigned)
- [ ] Location (if multi-location)
- [ ] Checklist items within task
- [ ] Attachments (photos, documents)

### US-12.3: Recurring Tasks
**As a** manager,
**I want** to set up tasks that repeat automatically,
**So that** routine work is never forgotten.

**Acceptance Criteria:**
- [ ] Recurrence: daily, weekly (select days), monthly
- [ ] Time of day for task creation
- [ ] Auto-assign to: specific person, role rotation, or unassigned
- [ ] Skip weekends/holidays option
- [ ] Pause/resume recurring tasks

### US-12.4: Staff Task View
**As a** staff member,
**I want** to see my assigned tasks on my phone,
**So that** I know what I need to do today.

**Acceptance Criteria:**
- [ ] "My Tasks" view filtered to assigned tasks
- [ ] Mark task as in-progress or complete
- [ ] Add notes or photos to completed tasks
- [ ] See task history I've completed
- [ ] Push notification for new urgent tasks

### US-12.5: Task Reports
**As a** owner,
**I want** reports on task completion,
**So that** I can track operational efficiency.

**Acceptance Criteria:**
- [ ] Completion rate by: staff member, category, location
- [ ] Average time to complete by category
- [ ] Overdue task trends
- [ ] Export to CSV

---

## Edge Cases

### EC-1: Assignee No Longer Works Here
**Scenario:** Task assigned to staff member who was terminated.
**Handling:**
- Move task to unassigned automatically
- Notify manager of orphaned tasks
- Include in handoff report

### EC-2: Recurring Task Creates Duplicate
**Scenario:** Recurring daily task hasn't been completed from yesterday.
**Handling:**
- Option A: Create new task anyway (allows backlog to build)
- Option B: Don't create until previous is done (configurable per task)
- Show warning if backlog grows beyond threshold

---

## Technical Design

### Database Schema

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id),

  -- Content
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Checklist
  checklist JSONB DEFAULT '[]',  -- [{id, text, completed}]

  -- Assignment
  assigned_to UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ,

  -- Timeline
  due_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),

  -- Status
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),

  -- Recurrence (if from template)
  recurring_task_id UUID REFERENCES recurring_tasks(id),

  -- Notes
  completion_notes TEXT,
  attachments TEXT[],

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE recurring_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Template
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'normal',
  checklist JSONB DEFAULT '[]',

  -- Schedule
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  days_of_week INTEGER[],  -- 0-6 for weekly
  day_of_month INTEGER,    -- 1-31 for monthly
  time_of_day TIME,

  -- Assignment
  assign_to_profile_id UUID REFERENCES profiles(id),
  assign_to_role TEXT,     -- Rotate among role
  location_id UUID REFERENCES locations(id),

  -- Behavior
  skip_weekends BOOLEAN DEFAULT false,
  create_if_previous_incomplete BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_created_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-02-05 | 1.0 | Claude | Initial PRD |
