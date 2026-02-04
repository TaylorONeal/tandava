# Pausing a Membership

**Purpose:** This guide explains how membership pausing works in Tandava, how to configure pause rules for each membership type, and how to manage individual pause requests. Membership pausing gives your students flexibility during travel, injury, or life changes -- without losing their place in your community.

---

## Why Offer Membership Pauses

Students pause memberships for many reasons: vacations, injuries, family obligations, work travel, seasonal schedules, or financial constraints. Offering a structured pause option benefits your studio in several ways:

- **Reduces cancellations.** A student who can pause for two weeks is far less likely to cancel outright.
- **Builds trust.** Fair pause policies show students that you respect their lives beyond the studio.
- **Preserves revenue.** A paused membership that resumes is worth more than a cancelled membership that never comes back.
- **Simplifies administration.** Clear rules mean fewer one-off negotiations and exceptions.

> **Tip:** Studios that offer reasonable pause policies see significantly lower churn rates. Even if a student pauses, they remain in your system as an active relationship -- not a lost customer.

---

## Where to Configure Pause Rules

Pause rules are configured per membership type. Each membership type can have its own pause policy.

**Navigate to:** Studio Management > Settings > Policies

You can also manage individual student pauses from the member detail page:

**Navigate to:** Studio Management > Students > [Select a Member] > Membership tab

---

## Configuring Pause Rules Per Membership Type

Each membership type has the following pause settings:

| Setting | Description | Default |
|---------|-------------|---------|
| **Allow Pause** | Whether members on this plan can pause at all | Off |
| **Max Pause Duration** | Maximum number of days a single pause can last | No limit |
| **Max Pauses Per Year** | How many times a member can pause within a 12-month period | Unlimited |
| **Min Active Days Before Pause** | How many days a membership must be active before the first pause is allowed (cooling period) | 30 days |
| **Pause Extends Billing** | Whether the billing cycle end date shifts forward by the length of the pause | On |

### Step-by-Step: Enabling Pause for a Membership Type

1. Go to **Studio Management > Settings > Policies**.
2. Locate the membership type you want to configure (e.g., "Unlimited Monthly").
3. Toggle **Allow Pause** to on.
4. Set the **Max Pause Duration** in days (e.g., 60 days). Leave blank for no maximum.
5. Set the **Max Pauses Per Year** (e.g., 2). Leave blank for unlimited pauses.
6. Set the **Min Active Days Before Pause** (e.g., 30). This prevents members from signing up and immediately pausing.
7. Confirm whether **Pause Extends Billing** should be on. When enabled, the membership end date and next billing date shift forward by the number of paused days.
8. Click **Save Policies**.

> **Note:** These rules apply to all members on that membership type. If you need to make a one-time exception for a specific student, you can initiate a pause directly from their member detail page regardless of the rules -- admin-initiated pauses can override configured limits.

---

## How a Student Requests a Pause

Tandava supports two pause workflows:

### Self-Service (Student-Initiated)

When pause is enabled for a membership type, students can request a pause from their account:

1. The student navigates to their membership details in the student portal.
2. They select **Pause Membership**.
3. They choose a pause duration from the available options (1 week, 2 weeks, 1 month, or 2 months).
4. They optionally provide a reason (travel, injury, personal).
5. The system validates the request against the pause rules for their membership type.
6. If the request meets all rules, the pause takes effect immediately.
7. The student receives a confirmation with their scheduled resume date.

### Admin-Initiated

Studio owners and staff can pause a membership on behalf of any student:

1. Go to **Studio Management > Students**.
2. Select the member whose membership you want to pause.
3. Open the **Membership** tab.
4. Click **Pause Membership**.
5. Select a pause duration.
6. Optionally enter a reason.
7. Click **Pause Membership** to confirm.

> **Tip:** Admin-initiated pauses are logged with the staff member's identity in the pause history, creating a clear audit trail of who authorized the pause and when.

---

## What Happens During a Pause

When a membership is paused, several things change:

| Behavior | During Pause |
|----------|-------------|
| **Billing** | Suspended. No charges are processed until the membership resumes. |
| **Class access** | Suspended. The member cannot book classes using this membership. |
| **Membership status** | Changes from "active" to "paused". |
| **Billing cycle dates** | If "Pause Extends Billing" is enabled, the current period end date and next renewal date shift forward by the duration of the pause. |
| **Class packs** | Unaffected. Class packs owned by the student remain usable independently of the membership pause. |
| **Existing bookings** | Future bookings made under the paused membership are not automatically cancelled. Review and cancel them manually if needed. |

### Practice Streaks

Whether a student's practice streak is preserved or reset during a pause is configurable at the studio level:

- **Preserve streak:** The streak counter freezes for the duration of the pause and resumes where it left off. This is the recommended default -- it rewards loyalty and removes a disincentive to pause.
- **Reset streak:** The streak resets to zero when the pause begins. Some studios prefer this for competitive leaderboard integrity.

> **Note:** If you preserve streaks during pauses, make sure your students know. It removes a common objection to pausing: "But I'll lose my streak!"

---

## Resuming from a Pause

### Automatic Resume

When a pause is created, a scheduled resume date is set. On that date:

1. The membership status changes from "paused" back to "active".
2. Billing resumes on the next scheduled billing date (which may have shifted if "Pause Extends Billing" is enabled).
3. The student regains the ability to book classes using their membership.
4. A notification is sent to the student confirming their membership is active again.

### Manual Resume (Early)

A student or admin can end a pause before the scheduled resume date:

1. Go to **Studio Management > Students > [Member] > Membership** tab.
2. Click **Resume Membership**.
3. The membership immediately returns to "active" status.
4. Billing resumes on the adjusted schedule.

Alternatively, the student can resume early from their own account in the student portal.

> **Tip:** Encourage students who return early from travel or recover from injury sooner than expected to resume their membership. It is good for their practice and good for your revenue.

---

## Pause History Tracking

Every pause is recorded in the `membership_pauses` table with the following details:

- **Paused at:** When the pause started
- **Scheduled resume date:** When the pause was set to end
- **Actual resume date:** When the pause actually ended (may differ if resumed early or extended)
- **Reason:** The reason provided by the student or admin
- **Initiated by:** Who started the pause (student or staff member)
- **Resumed by:** Who ended the pause (automatic, student, or staff member)
- **Status:** Active (currently paused), Ended (resumed normally), or Cancelled (ended early)

You can review a member's full pause history from their detail page:

**Navigate to:** Studio Management > Students > [Select a Member] > Membership tab

This history helps you identify patterns -- for example, a student who pauses every summer may benefit from a seasonal membership option.

---

## Edge Cases

### A Student Tries to Pause Again Within the Cooling Period

If a membership type requires a minimum number of active days between pauses (the "Min Active Days Before Pause" setting), the system will block the request.

**What happens:**
- Self-service: The student sees a message explaining that they must wait N more days before pausing again.
- Admin-initiated: The admin sees a warning but can choose to override the restriction.

### A Membership Expires During a Pause

If a membership has a fixed end date and that date falls within the pause period:

- If **Pause Extends Billing** is enabled, the expiration date shifts forward by the length of the pause. The membership will not expire during the pause.
- If **Pause Extends Billing** is disabled, the membership expires on its original date even while paused. The student will not be billed, but the membership will transition to "expired" status.

### A Student Has Reached Their Maximum Pauses Per Year

If the student has already used all allowed pauses for the year:

- Self-service: The pause option is not available. A message explains that the annual pause limit has been reached.
- Admin-initiated: The admin sees the limit warning but can override it if circumstances warrant an exception.

### Billing Fails When a Membership Resumes

If a membership resumes and the next billing attempt fails (e.g., expired credit card):

- The membership transitions to "past_due" status.
- Standard payment retry logic applies (same as any failed membership renewal).
- The student is notified of the payment failure.

---

## Tips for Setting Fair Pause Policies

1. **Start generous, tighten if needed.** It is easier to reduce pause allowances later than to deal with frustrated students who feel locked in. A good starting point: 2 pauses per year, up to 30 days each, with a 30-day cooling period.

2. **Match pause policies to membership value.** Premium unlimited memberships can afford more generous pause rules. Class-limited or budget memberships may warrant tighter controls.

3. **Communicate your policy clearly.** Add pause terms to your membership descriptions, your website, and your waiver. Students who understand the rules up front are less likely to feel surprised.

4. **Use the cooling period wisely.** The "Min Active Days Before Pause" setting prevents abuse (signing up, pausing immediately, and effectively getting a cheaper membership). Thirty days is a reasonable default.

5. **Review pause patterns quarterly.** If many students are pausing at the same time (e.g., summer), consider offering a seasonal rate instead. The data is there -- use it.

6. **Preserve streaks by default.** Resetting practice streaks when a student pauses penalizes them for being responsible about their schedule. Preserving streaks encourages them to come back.

7. **Train your front desk staff.** Make sure everyone who handles member inquiries knows the pause policy and how to initiate a pause from the admin side.

---

## Related Workflows

- [Promos and Discounts](./promos-and-discounts.md) -- Offer returning members a discount when they resume from a long pause
- [Workshops and Events](./workshops-and-events.md) -- Paused members can still register for workshops and events separately
- [Landing Pages and SEO](./landing-pages-and-seo.md) -- Create a "Welcome Back" landing page targeting students resuming from a pause
