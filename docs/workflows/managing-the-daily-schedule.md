# Managing the Daily Schedule

**Purpose:** This guide covers the day-to-day operations of running your studio schedule in Tandava -- from opening the schedule view each morning, to handling subs and cancellations, to reconciling attendance at the end of the day.

**Navigate to:** Studio Management > Schedule (`/manage/schedule`)

---

## Opening the Schedule View

When you open the Schedule page, you see your full week at a glance. Each day tab (Mon through Sun) shows all class occurrences for that day, including class name, style, teacher, time, room, and real-time booking numbers.

1. Click **Schedule** in the left sidebar to open the schedule management view.
2. Use the **day tabs** (Mon, Tue, Wed, Thu, Fri, Sat, Sun) to switch between days.
3. Use the **left/right arrows** beside the day tabs to navigate to the previous or next week.
4. Use the **search bar** to filter classes by class name or teacher name.

Each class card displays:

- Start and end time
- Class name and style (e.g., "Morning Vinyasa" / Vinyasa)
- Assigned teacher
- Room and location
- Booking count vs. capacity (e.g., 22/25)
- Waitlist count, if any
- Check-in count for classes currently in progress or completed
- Status badges for cancelled or subbed classes

---

## How Recurring Schedule Rules Generate Individual Class Occurrences

Tandava separates **schedule rules** from **class occurrences**. This is a core concept to understand.

- A **schedule rule** defines a recurring pattern: "Morning Vinyasa runs every Monday and Wednesday at 7:00 AM in the Main Studio, taught by Maya Patel."
- A **class occurrence** is a single, concrete instance of that rule on a specific date -- for example, "Morning Vinyasa on Monday, March 10 at 7:00 AM."

The system automatically generates class occurrences from your active schedule rules. Each occurrence is its own record, which means you can modify a single class without affecting the rest of the recurring series.

> **Note:** Schedule rules have an `effective_from` and optional `effective_until` date. When you change a recurring class (say, moving it from 7:00 AM to 7:30 AM going forward), create a new rule with the new time and set an `effective_until` on the old one. This preserves your historical data cleanly.

---

## Overriding a Single Class

Sometimes you need to change just one class without touching the recurring rule. Tandava supports several override types:

### Change the Time

1. Open the class occurrence from the schedule view.
2. Select a new start time and end time.
3. Choose whether to notify booked students of the time change.
4. Save the override.

### Change the Room

1. Open the class occurrence.
2. Select a different room from the available rooms at that location.
3. Save. The capacity may update automatically if the new room has a different default capacity.

### Change the Teacher

See the "Handling Sub Requests" section below for the full sub workflow. You can also directly reassign a teacher from the class override options.

### Cancel a Single Class

1. Click the **three-dot menu** on the class card.
2. Select **Cancel Class**.
3. Review the cancellation summary, which shows how many students are currently booked.
4. Check the **Notify students** option (enabled by default) to send cancellation emails.
5. Click **Cancel Class** to confirm.

The class card will display a red "Cancelled" badge. Cancelled classes remain visible on the schedule for record-keeping but are clearly marked.

> **Tip:** Tandava records the override type for every change (sub, cancellation, room_change, time_change, one_off), so you can report on schedule stability over time. Frequent overrides may indicate a need to restructure the recurring schedule.

---

## Handling Sub Requests

When a teacher cannot make a class, Tandava provides a structured sub workflow.

### Step 1: Teacher Requests a Sub

The assigned teacher flags that they need a substitute for a specific class occurrence. This can be initiated by the teacher through their own account or by a studio admin from the Schedule page.

### Step 2: Find a Substitute

1. Click the **three-dot menu** on the class card.
2. Select **Find Sub**.
3. A dialog opens showing the class details (name, day, time, current teacher).
4. The **Select Substitute Teacher** dropdown lists available teachers, filtered to exclude the currently assigned teacher. Each teacher's specialties are shown (e.g., "Vinyasa, Power") so you can choose someone qualified for the class style.
5. Select a substitute teacher.
6. Check the **Notify booked students** option if you want students to know about the teacher change.

### Step 3: Confirm the Sub

1. Click **Confirm Sub**.
2. The system records the original teacher, assigns the substitute, and (if selected) sends notifications to all booked students.
3. The class card now displays a "Sub: [Teacher Name]" badge with the original teacher shown with a strikethrough.

> **Note:** Teachers with `can_sub` enabled and `notify_on_sub_request` turned on in their staff profile will receive automatic notifications when sub requests are posted. This allows you to broadcast sub needs to your full teaching roster.

---

## Last-Minute Cancellations -- What Happens to Booked Students

When a class is cancelled and students are already booked:

1. **Automatic notifications:** If the "Notify students" checkbox is selected during cancellation, all booked students receive an email and/or push notification informing them of the cancellation.
2. **Booking status update:** Each student's booking status is updated to `cancelled`. If the cancellation falls within the studio's cancellation window, no late-cancel fee applies.
3. **Credits and passes:** If students used a class pack credit or membership class to book, the credit or class count is automatically restored to their account.
4. **Waitlist students:** Waitlisted students are also notified and their waitlist entries are cleared.

> **Tip:** Your studio's cancellation window and late-cancel/no-show fee policies are configured in Studio Management > Settings > Policies. Make sure these are set before your first classes go live.

---

## Adding a Pop-Up or One-Off Class

To add a class that is not part of your recurring schedule:

1. Click the **Add Class** button in the top-right corner of the Schedule page.
2. Select the offering (class type) from your existing offerings, or create a new one.
3. Set the date, start time, and end time.
4. Assign a teacher.
5. Choose a location and room.
6. Set the capacity (or accept the default from the offering).
7. Save the class.

This creates a standalone class occurrence with no linked schedule rule. It appears on the schedule like any other class but is internally marked as a `one_off` override type.

> **Tip:** Pop-up classes are great for testing new class styles, hosting guest teachers, or running seasonal specials. Track their fill rates to decide whether to add them to your recurring schedule.

---

## Capacity Management

### Adjusting Spots

Each class occurrence inherits its capacity from the offering definition or the schedule rule's capacity override. To change the capacity for a single class:

1. Open the class occurrence details.
2. Edit the **Capacity** field.
3. Save. If you increase capacity and there are students on the waitlist, the system can automatically promote waitlisted students into the newly opened spots.

### Opening Overflow

If a class is full and demand is high, you may choose to temporarily increase the capacity beyond the room's standard limit. Consider:

- The physical space limitations of the room.
- Safety and comfort for students and the teacher.
- Your studio's insurance requirements.

> **Note:** When the waitlist is enabled (configured in Settings > Policies), students who try to book a full class are automatically placed on the waitlist. When a spot opens -- whether through a cancellation or a capacity increase -- the next student on the waitlist is promoted and notified automatically.

---

## Viewing Attendance for a Specific Class

1. Click the **three-dot menu** on any class card.
2. Select **View Roster**.
3. The roster shows all students with their booking status:
   - **Confirmed** -- Booked but not yet checked in
   - **Checked In** -- Present in the studio
   - **Waitlisted** -- Waiting for a spot to open
   - **Late Cancel** -- Cancelled after the cancellation window
   - **No Show** -- Did not attend and did not cancel
   - **Cancelled** -- Cancelled within the allowed window

4. Use the roster to check students in as they arrive.

---

## End-of-Day Reconciliation

At the end of each day, reconcile your schedule to ensure accurate records:

1. Open the Schedule page and select the current day.
2. For each completed class, open the roster and review:
   - **Booked vs. Checked In:** Identify students who booked but never checked in. These are potential no-shows.
   - **No-show handling:** Mark unchecked-in students as no-shows. Depending on your studio policies, this may trigger a no-show fee.
3. Review any cancelled classes to confirm that student credits were properly restored.
4. Check the overall booking numbers across the day to inform staffing and scheduling decisions.

> **Tip:** Make end-of-day reconciliation a daily habit for your front-desk staff. Accurate attendance data feeds into your reports, teacher payroll calculations, and student engagement metrics. A few minutes of reconciliation each evening prevents hours of cleanup later.

---

## Tips for Schedule Optimization

### Review Fill Rates

Regularly check how full your classes are running. On the Schedule page, every class card shows its booked/capacity ratio (e.g., 22/25). Over time, patterns emerge:

- **Consistently full classes (90%+ fill rate):** Consider adding a second session at the same time slot, or moving to a larger room.
- **Consistently low classes (below 40% fill rate):** Evaluate whether the time slot, class style, or teacher assignment is the issue. Try moving the class to a more popular time before eliminating it.
- **High waitlist counts:** Strong signal to add capacity or duplicate the class.

### Adjust Underperforming Time Slots

Use the Reports page (Studio Management > Reports) for deeper analytics on attendance trends by time of day, day of week, teacher, and class style. Common adjustments include:

- Moving a mid-afternoon class that draws 5 students to a 6:00 PM slot.
- Swapping a niche style (e.g., Ashtanga Primary) from a prime time slot to a dedicated time where its smaller audience can be served without underutilizing the room.
- Testing weekend workshop formats for styles that do not fill a weekly recurring slot.

> **Tip:** Before making major schedule changes, communicate with your teachers and your students. Announce changes at least two weeks in advance. Your students build their routines around your schedule -- respect that consistency while still optimizing.

---

## Related Workflows

- [Referral Programs](./referral-programs.md) -- Drive new student enrollment through word of mouth
- [Data Import and Migration](./data-import-and-migration.md) -- Import your existing schedule from another platform
