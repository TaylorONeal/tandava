# PRD-019: Schedule UX Improvements

## Overview
**Phase:** 1
**Priority:** P0
**Status:** In Progress (partially implemented)
**Owner:** TBD

---

## Jobs to Be Done

### Job 1: Quick Class Discovery
**When** I open the student homepage,
**I want to** see today's upcoming classes with easy filtering,
**So I can** book a class in seconds.

### Job 2: Multi-Location Filtering
**When** my studio has multiple locations,
**I want to** filter by one or more locations,
**So I can** see classes at the studios convenient for me.

### Job 3: Weekly Overview
**When** I'm planning my practice week,
**I want to** see an at-a-glance weekly view with day headers,
**So I can** visualize my schedule across the week.

### Job 4: Default Location Preference
**When** I mostly attend one location,
**I want** it to be my default filter,
**So I don't** have to re-select it every time.

---

## Features Implemented

### Student Homepage (Index.tsx) - DONE
- [x] Compact hero with studio name (not "Tandava")
- [x] Booking above the fold
- [x] Inline streak/gamification (compact, not full-width cards)
- [x] Filterable "Today's Classes" section:
  - [x] Multi-select location toggle buttons
  - [x] Style dropdown filter
  - [x] In-person / Virtual / All segmented control
- [x] Only show upcoming classes (timezone-aware, past classes filtered)
- [x] Clickable teacher names (link to /instructors)
- [x] Clickable class styles (link to /schedule?style=...)
- [x] "Get Started" hidden when logged in
- [x] Login-aware CTAs (members see "Manage Membership" vs "Start Membership")
- [x] Location cards with image carousel placeholders
- [x] Compact footer CTA for logged-in users

### Teacher Schedule (teach/Schedule.tsx) - EXISTING
- [x] Week/Month toggle view
- [x] Day-of-week headers (Mon-Sun)
- [x] Color-coded status (regular, subbing, pending sub)
- [x] Class details with room, capacity, booking counts

### Remaining
- [ ] Default location preference stored in user profile
- [ ] Location preference auto-detected from most-attended
- [ ] Weekly at-a-glance view on student homepage
- [ ] Manage schedule with day-of-week headers
- [ ] Staff schedule view with day-of-week context

---

## Default Location Preference

### Behavior
1. On first visit, no location filter applied (show all)
2. System tracks which location the student attends most
3. After 5 check-ins, suggest setting a default location
4. Default location pre-selected in all schedule filters
5. Student, teacher, and admin can all set their default in their profile
6. Changeable at any time

### Data Model Addition
```sql
ALTER TABLE profiles ADD COLUMN default_location_id UUID REFERENCES locations(id);
```

### Auto-Detection Logic
```sql
SELECT location_id, COUNT(*) as visits
FROM check_ins ci
JOIN class_occurrences co ON ci.class_occurrence_id = co.id
WHERE ci.profile_id = :user_id
  AND ci.checked_in_at > NOW() - INTERVAL '90 days'
GROUP BY location_id
ORDER BY visits DESC
LIMIT 1;
```
