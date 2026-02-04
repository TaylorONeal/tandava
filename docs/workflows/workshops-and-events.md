# Workshops and Events

**Purpose:** This guide covers how to create and manage workshops, trainings, retreats, series, and special events in Tandava. Events are first-class entities in the platform -- separate from your regular class schedule -- with their own pricing, registration, capacity management, and marketing tools.

---

## Where to Manage Events

**Navigate to:** Studio Management > Events

This page displays all your events with their type, status, registration count, fill rate, and revenue. From here you can create new events, edit existing ones, and monitor registrations.

---

## Event Types

Tandava supports six event types, each suited to a different format:

| Type | Description | Typical Duration |
|------|-------------|-----------------|
| **Workshop** | A single focused session on a specific topic or skill. | 1-4 hours |
| **Training** | A multi-day certification or professional development program (e.g., 200-hour YTT). | Days to months |
| **Retreat** | An immersive multi-day experience, often off-site or virtual. | 2-7 days |
| **Series** | A recurring multi-week program where students attend the same time each week. | 3-8 weeks |
| **Immersion** | A weekend or multi-day deep-dive into a practice or topic. | 1-3 days |
| **Event** | A general-purpose category for sound baths, socials, guest teachers, or anything else. | Varies |

> **Tip:** Choose the type that best describes the format. The type affects how the event appears in search filters and discovery, and helps students understand what to expect before they register.

---

## Creating an Event

### Step-by-Step

1. Go to **Studio Management > Events**.
2. Click **Create Event** in the top right.
3. Select the **Event Type** from the dropdown.
4. Enter the **Title** (e.g., "Arm Balance Workshop with Maya").
5. Set the **Start Date & Time** and **End Date & Time**.
6. Enter the **Price** in dollars.
7. Set the **Capacity** (maximum number of registrants).
8. Optionally toggle **Virtual / Hybrid** if the event includes online attendance.
9. Click **Create & Edit** to save the event as a draft and open the full editor.

The full editor allows you to configure all remaining details:

| Field | Description |
|-------|-------------|
| **Subtitle** | A short tagline displayed below the title |
| **Description** | Rich text description with markdown support |
| **Cover Image** | A hero image for the event page |
| **Gallery** | Additional images |
| **Promo Video** | A video URL for the event marketing page |
| **Location** | Select a studio location and room, or mark as virtual |
| **Virtual URL** | Zoom/Meet link (only shown to registered students) |
| **What to Expect** | A markdown section describing the experience |
| **Who It's For** | Target audience description |
| **What to Bring** | A list of items students should bring |
| **Prerequisites** | Any requirements for attendance |
| **Cancellation Policy** | Event-specific cancellation terms |
| **Tags** | Keywords for filtering and discovery (e.g., "Inversions", "Beginner") |
| **Style / Level** | Yoga style and difficulty level, if applicable |
| **SEO Fields** | Meta title and meta description for search engines |
| **Featured** | Toggle to feature this event prominently in the schedule |
| **Discoverable** | Toggle to make the event visible in public search |

> **Note:** Events are created in "draft" status. Students cannot see or register for an event until you publish it.

---

## Multi-Session Events

For trainings, series, immersions, and retreats that span multiple sessions:

1. In the event editor, toggle **Multi-Session** to on.
2. Set the **Session Count** (e.g., 4 sessions for a 4-week series, 12 sessions for a YTT).
3. Add individual sessions:

Each session includes:

| Field | Description |
|-------|-------------|
| **Title** | A descriptive name (e.g., "Session 1: Foundations" or "Day 3: Teaching Methodology") |
| **Description** | What this specific session covers |
| **Session Number** | The order within the series |
| **Start / End Time** | The specific date and time for this session |
| **Location Override** | A different room or location for this session, if needed |
| **Teacher Override** | A different teacher for this session, if needed |

When a student registers for a multi-session event, they are registered for all sessions. Attendance is tracked per session using the `sessions_attended` field.

> **Tip:** For a weekly series, create sessions on the same day and time each week. For a training, lay out the full schedule upfront so students can plan around it.

---

## Assigning Teachers to Events

### Primary Teacher

Every event has a primary teacher assigned at creation. This teacher is displayed prominently on the event page.

### Additional Teachers

For events with multiple instructors (common in teacher trainings and retreats):

1. Open the event editor.
2. In the **Teachers** section, add additional teachers.
3. For each teacher, set their role:
   - **Lead:** Primary instructor for the event
   - **Assistant:** Supporting instructor
   - **Guest:** A guest teacher for a specific session

4. Optionally add an **event-specific bio** override for each teacher. This is useful when a teacher's standard bio does not emphasize their relevant expertise for this particular event.

Individual sessions within a multi-session event can also have teacher overrides, allowing different teachers to lead different sessions.

---

## Setting Up Pricing Tiers

Beyond the base event price, Tandava supports flexible pricing:

### Built-In Pricing Options

| Pricing Option | Description |
|----------------|-------------|
| **Regular Price** | The standard registration price |
| **Early Bird Price** | A discounted price available until a specified date |
| **Member Price** | A special price for students with active memberships |

### Custom Pricing Tiers

For more complex pricing, you can create custom tiers:

1. In the event editor, go to the **Pricing** section.
2. Click **Add Pricing Tier**.
3. Configure:

| Field | Description |
|-------|-------------|
| **Name** | Tier name (e.g., "Full Immersion", "Weekend Only", "Audit") |
| **Description** | What this tier includes |
| **Price** | The price for this tier |
| **Member Price** | Optional discounted price for members |
| **Capacity** | Per-tier capacity limit (optional -- leave blank to share the event's overall capacity) |
| **Included Sessions** | Which session numbers are included in this tier (empty = all sessions) |

This is particularly useful for teacher trainings where students may want to attend only specific modules, or retreats where different accommodation levels have different prices.

> **Tip:** Use early bird pricing strategically. Set the early bird deadline 1-2 weeks before the event to create urgency. A $15-$25 discount is often enough to motivate early registration, which helps you plan capacity and marketing.

---

## Managing Registrations

### Registration List

From the event detail page, view all registrations with their status:

| Status | Meaning |
|--------|---------|
| **Registered** | Confirmed and paid |
| **Waitlisted** | Capacity full; student is on the waitlist |
| **Cancelled** | Student cancelled their registration |
| **Attended** | Student attended the event (checked in) |
| **No Show** | Student did not attend |

### Waitlist

If **Waitlist Enabled** is on for the event, students who register after the event reaches capacity are placed on a waitlist with a position number. When a registered student cancels, the first waitlisted student is promoted to registered status and notified.

### Check-In

For multi-session events, check-in is tracked per session. The `sessions_attended` field records which session numbers each student attended.

For single-session events, check-in works the same as regular class check-in: mark the student as "Attended" on the day of the event.

---

## Event Landing Pages

Each published event automatically gets a dedicated URL based on its slug. You can also create a full landing page for marketing:

1. Go to **Studio Management > Landing Pages**.
2. Click **Create Page** and select the **Event Promo** template.
3. Link it to the event.
4. Customize with content blocks: rich media, agenda, pricing comparison, teacher bios, testimonials, and countdown timer.
5. Use this landing page URL in your marketing campaigns.

> **Tip:** For high-value events like teacher trainings or destination retreats, a dedicated landing page significantly increases conversion. Include testimonials from past participants, detailed agendas, and clear pricing breakdowns.

---

## Promoting Events Through the Schedule

Published events appear in several places:

- **Student-facing schedule:** Events appear alongside regular classes, marked with their event type badge.
- **Studio discovery page:** If marked as discoverable, events appear in search results.
- **Featured events:** Events marked as "featured" are highlighted prominently on the studio's main page.

To maximize visibility:

1. Mark the event as **Featured** if it is a priority.
2. Add relevant **tags** so students can find it through filters.
3. Set the event as **Discoverable** so it appears in public search.
4. Share the event URL or landing page URL through email, social media, and your studio's website.

---

## Cancellation and Refund Policies for Events

Each event can have its own cancellation policy, separate from your studio's general class cancellation policy.

### Setting a Cancellation Policy

In the event editor, add your cancellation terms to the **Cancellation Policy** field. This is displayed to students during registration so they understand the terms before paying.

### Processing Cancellations

When a student requests a cancellation:

1. Go to **Studio Management > Events > [Event] > Registrations**.
2. Find the student and click **Cancel Registration**.
3. Choose the refund amount:
   - Full refund
   - Partial refund (enter a custom amount)
   - No refund
4. The refund is processed and the registration status changes to "cancelled".
5. If there is a waitlist, the next student is promoted.

The cancellation date, refund amount, and original payment are all recorded in the registration record.

> **Note:** Communicate your cancellation policy clearly before registration. Common approaches for studio events include: full refund up to 7 days before, 50% refund up to 48 hours before, no refund after that. For expensive trainings, consider offering the option to transfer to a future cohort instead of refunding.

---

## Post-Event Follow-Up

After an event completes, use Tandava's tools to close the loop:

1. **Mark attendance.** Go through the registration list and mark each student as "Attended" or "No Show". For multi-session events, record per-session attendance.

2. **Update the event status.** Change the status from "published" to "completed". This removes it from the active schedule while preserving all data.

3. **Review the numbers.** Check total registrations, revenue, fill rate, and waitlist size. These metrics help you decide whether to repeat the event.

4. **Follow up with attendees.** Use the registration list to send a thank-you email, request feedback, or promote the next event. If you have an email integration configured (Mailchimp, ConvertKit, etc.), export the attendee list or use the event log webhook to trigger an automated follow-up sequence.

5. **Duplicate for next time.** If the event was successful and you plan to run it again, use the **Duplicate** button on the Events page to create a copy with the same details. Update the dates, pricing, and capacity for the new instance.

> **Tip:** Post-event surveys are invaluable. Even a simple "What did you love? What would you change?" email can shape your next offering and make students feel heard.

---

## Event Summary Metrics

The Events management page shows aggregate metrics at the top:

| Metric | Description |
|--------|-------------|
| **Published Events** | Number of currently published events |
| **Total Registered** | Sum of all registered students across events |
| **Event Revenue** | Total revenue from event registrations |
| **Avg Fill Rate** | Average registration count as a percentage of capacity |

Use these metrics to understand your event program's overall health and identify trends.

---

## Related Workflows

- [Promos and Discounts](./promos-and-discounts.md) -- Apply promo codes to event registrations for early access or group discounts
- [Landing Pages and SEO](./landing-pages-and-seo.md) -- Create dedicated landing pages for high-value events
- [Pausing a Membership](./pausing-a-membership.md) -- Paused members can still register for events independently of their membership status
