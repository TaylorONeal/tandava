# PRD-009: Waitlist Automation

## Overview
**Phase:** 3
**Priority:** P0
**Status:** Planned
**Owner:** TBD

---

## Jobs to Be Done

### Job 1: Never Miss a Spot
**When** someone cancels their class booking,
**I want** the next person on the waitlist to be notified immediately,
**So I can** fill the spot without manual intervention.

### Job 2: Fair Waitlist Management
**When** multiple people are on the waitlist,
**I want** a fair and transparent system for promotion,
**So I can** maintain trust with my members.

### Job 3: Quick Response Collection
**When** a spot opens up,
**I want** the waitlisted member to confirm quickly,
**So I can** offer the spot to the next person if they don't respond.

---

## User Stories

### US-9.1: Automatic Waitlist Promotion
**As a** studio owner,
**I want** the system to automatically promote from waitlist when a spot opens,
**So that** classes stay full without staff intervention.

**Acceptance Criteria:**
- [ ] When booking cancelled, next waitlisted person is notified within 30 seconds
- [ ] Notification sent via configured channels (push, SMS, email)
- [ ] Clear deadline shown: "Confirm within 15 minutes or spot goes to next person"
- [ ] If no response, auto-promote next person
- [ ] Continue until spot filled or waitlist exhausted

### US-9.2: Member Confirmation Flow
**As a** waitlisted member who gets promoted,
**I want** a simple way to confirm my spot,
**So that** I don't miss the opportunity.

**Acceptance Criteria:**
- [ ] One-tap confirm from push notification
- [ ] Reply "YES" to SMS to confirm
- [ ] Click link in email to confirm
- [ ] Show countdown timer to deadline
- [ ] Decline option if plans changed

### US-9.3: Configurable Settings
**As a** studio admin,
**I want** to configure waitlist automation rules,
**So that** it matches my studio's policies.

**Acceptance Criteria:**
- [ ] Enable/disable auto-promotion
- [ ] Set response deadline (5-60 minutes)
- [ ] Set promotion window (only within X hours of class)
- [ ] Choose notification channels
- [ ] Prioritize members over drop-ins (optional)

---

## Edge Cases

### EC-1: Everyone Declines or Times Out
**Scenario:** All waitlisted people decline or don't respond.
**Handling:**
- Mark spot as "open" in class listing
- Notify admin of unfilled spot
- Allow walk-in/last-minute booking

### EC-2: Multiple Cancellations at Once
**Scenario:** Three people cancel at the same time.
**Handling:**
- Promote top 3 from waitlist simultaneously
- Each has their own deadline
- Handle race conditions gracefully

### EC-3: Cancellation Within Minutes of Class
**Scenario:** Someone cancels 10 minutes before class starts.
**Handling:**
- Shorten response deadline (5 min max)
- SMS only (fastest channel)
- If no response in 5 min, mark as open

---

## Technical Design

### Automation Flow

```
1. Booking cancelled
   └─> Trigger: booking.status = 'cancelled'

2. Check waitlist settings
   └─> Is auto_promote_enabled?
   └─> Is class within promotion_window_minutes?

3. Find next in waitlist
   └─> ORDER BY created_at ASC (or member priority)
   └─> LIMIT 1 WHERE status = 'waitlisted'

4. Create promotion record
   └─> waitlist_promotions with deadline

5. Send notifications
   └─> Push, SMS, Email based on settings
   └─> Include confirm/decline links

6. Wait for response
   └─> Webhook/poll for confirmation
   └─> Timeout job at deadline

7. Process response
   └─> Confirmed: Update booking to 'confirmed'
   └─> Declined/Timeout: Repeat from step 3
```

### Edge Function: process-waitlist-promotion

```typescript
// Triggered by booking cancellation
export async function processWaitlistPromotion(bookingId: string) {
  const booking = await getBooking(bookingId);
  const settings = await getWaitlistSettings(booking.studio_id);

  if (!settings.auto_promote_enabled) return;

  const classTime = await getClassTime(booking.class_occurrence_id);
  const minutesUntilClass = (classTime - Date.now()) / 60000;

  if (minutesUntilClass > settings.promotion_window_minutes) return;

  const nextWaitlisted = await getNextWaitlisted(booking.class_occurrence_id);
  if (!nextWaitlisted) return;

  const promotion = await createPromotion({
    booking_id: nextWaitlisted.id,
    deadline_at: new Date(Date.now() + settings.response_deadline_minutes * 60000),
  });

  await sendPromotionNotifications(promotion, settings.notification_channels);

  // Schedule timeout check
  await scheduleJob('check-promotion-timeout', promotion.id, promotion.deadline_at);
}
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Auto-promotion fill rate | 80%+ | Promoted & confirmed / cancellations with waitlist |
| Average response time | <5 minutes | Time from notification to confirmation |
| Manual intervention rate | <10% | Staff-handled promotions / total promotions |
| Member satisfaction | 4.5+ | Survey rating on waitlist experience |

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-02-05 | 1.0 | Claude | Initial PRD |
