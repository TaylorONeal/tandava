# PRD-005: Push Notifications & Two-Way SMS

## Overview
**Phase:** 2
**Priority:** P0
**Status:** Planned
**Owner:** TBD

---

## Jobs to Be Done

### Job 1: Real-Time Class Updates
**When** there's a last-minute change to a class I'm booked for,
**I want to** receive an immediate notification on my phone,
**So I can** adjust my plans without missing important information.

### Job 2: Booking Confirmations
**When** I book a class,
**I want to** receive instant confirmation,
**So I can** feel confident my spot is secured.

### Job 3: Two-Way Communication
**When** I have a question about a class or need to communicate with the studio,
**I want to** reply directly to an SMS notification,
**So I can** get answers quickly without calling or opening an app.

### Job 4: Engagement Reminders
**When** I haven't visited in a while,
**I want to** receive a friendly reminder about upcoming classes,
**So I can** stay motivated and connected to my practice.

---

## User Stories

### US-5.1: Web Push Notifications
**As a** member with the web app open,
**I want** to receive browser push notifications for important updates,
**So that** I don't miss time-sensitive information.

**Acceptance Criteria:**
- [ ] Permission request on first visit (non-intrusive)
- [ ] Notifications for: booking confirmations, class reminders, cancellations, waitlist promotions
- [ ] Click notification to open relevant page
- [ ] Works on desktop Chrome, Firefox, Safari, Edge
- [ ] Works on mobile browsers that support Web Push

### US-5.2: SMS Notifications
**As a** member,
**I want** to receive SMS notifications for critical updates,
**So that** I'm informed even when not using the app.

**Acceptance Criteria:**
- [ ] Opt-in during registration or in account settings
- [ ] SMS for: booking confirmations, class reminders (configurable timing), cancellations, payment failures
- [ ] Comply with SMS regulations (TCPA, opt-out instructions)
- [ ] Include studio name in sender ID where supported
- [ ] Character-efficient messages (avoid multi-part SMS)

### US-5.3: Two-Way SMS Conversations
**As a** member,
**I want** to reply to SMS notifications and have a conversation,
**So that** I can ask questions or confirm attendance easily.

**Acceptance Criteria:**
- [ ] Replies routed to studio inbox in admin dashboard
- [ ] Staff can respond from admin dashboard
- [ ] Conversation history visible to staff
- [ ] Auto-replies for common keywords (STOP, HELP, YES, NO)
- [ ] Quick replies: "Reply YES to confirm" functionality

### US-5.4: Notification Preferences
**As a** member,
**I want** to control which notifications I receive and how,
**So that** I'm not overwhelmed but stay informed.

**Acceptance Criteria:**
- [ ] Per-notification-type preferences (booking, reminder, marketing)
- [ ] Per-channel preferences (push, SMS, email)
- [ ] Quiet hours setting (no notifications between X and Y)
- [ ] One-click unsubscribe from marketing
- [ ] Preferences saved across devices

---

## Edge Cases

### EC-1: SMS Delivery Failure
**Scenario:** SMS fails to deliver (invalid number, carrier block).
**Handling:**
- Retry once after 5 minutes
- Fall back to email if SMS fails twice
- Log delivery failure for admin review
- Don't charge for undelivered messages

### EC-2: User Replies After Hours
**Scenario:** Member replies to SMS at 2am.
**Handling:**
- Queue message for staff review
- Auto-reply: "Thanks for your message! We'll respond during business hours."
- Urgent keywords (CANCEL) processed automatically

### EC-3: Spam/Abuse Detection
**Scenario:** User sends many rapid messages.
**Handling:**
- Rate limit: 10 messages per hour per user
- Flag for review if exceeded
- Auto-reply: "We've received your messages and will respond shortly."

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Push notification opt-in rate | 40%+ | Opted in / total visitors |
| SMS opt-in rate | 60%+ | SMS enabled / total members |
| Notification open rate | 25%+ | Opens / sent |
| SMS reply rate | 15%+ | Replies / sent (for conversational) |
| Unsubscribe rate | <2%/month | Unsubscribes / active subscribers |

---

## Technical Design

### Database Schema

```sql
-- Notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  studio_id UUID REFERENCES studios(id),  -- null = global preference

  -- Channel preferences
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,

  -- Type preferences
  booking_confirmations BOOLEAN DEFAULT true,
  class_reminders BOOLEAN DEFAULT true,
  class_changes BOOLEAN DEFAULT true,
  waitlist_updates BOOLEAN DEFAULT true,
  payment_alerts BOOLEAN DEFAULT true,
  marketing BOOLEAN DEFAULT true,

  -- Timing
  reminder_hours_before INTEGER DEFAULT 2,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'UTC',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(profile_id, studio_id)
);

-- Push subscriptions (Web Push)
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Web Push subscription data
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,

  -- Metadata
  user_agent TEXT,
  device_type TEXT,  -- 'desktop', 'mobile', 'tablet'

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,

  UNIQUE(profile_id, endpoint)
);

-- SMS conversations
CREATE TABLE sms_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  phone_number TEXT NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,

  -- Assignment
  assigned_to UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES sms_conversations(id) ON DELETE CASCADE,

  -- Direction
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),

  -- Content
  body TEXT NOT NULL,
  media_urls TEXT[],

  -- Delivery
  twilio_sid TEXT,
  status TEXT DEFAULT 'queued',  -- queued, sent, delivered, failed
  error_message TEXT,

  -- Sender (for outbound)
  sent_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Integration: Twilio

```typescript
// SMS Service Interface
interface SmsService {
  send(to: string, body: string, studioId: string): Promise<SendResult>;
  handleInbound(webhook: TwilioWebhook): Promise<void>;
  getConversation(conversationId: string): Promise<Conversation>;
}

// Web Push Service Interface
interface PushService {
  subscribe(userId: string, subscription: PushSubscription): Promise<void>;
  send(userId: string, notification: PushPayload): Promise<SendResult>;
  broadcast(studioId: string, notification: PushPayload): Promise<BatchResult>;
}
```

---

## Dependencies

- Twilio account for SMS
- VAPID keys for Web Push
- Service Worker for push handling

---

## Rollout Plan

1. **Phase A:** Web Push notifications (no external dependency cost)
2. **Phase B:** SMS notifications (outbound only)
3. **Phase C:** Two-way SMS conversations
4. **GA:** Full release with all features

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-02-05 | 1.0 | Claude | Initial PRD |
