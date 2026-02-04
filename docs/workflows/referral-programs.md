# Referral Programs

**Purpose:** This guide explains how to create, configure, and manage referral programs in Tandava. A well-run referral program turns your happiest students into your most effective marketing channel.

**Navigate to:** Studio Management > Settings (`/manage/settings`) for referral program configuration. Referral performance data is also available in Studio Management > Reports (`/manage/reports`).

---

## Why Referral Programs Work for Studios

Word of mouth is consistently the top acquisition channel for local fitness and wellness businesses. Your existing students already trust you, practice regularly, and talk to friends, family, and coworkers about their experience. A referral program gives them a structured reason to act on that enthusiasm.

Key advantages:

- **Low cost per acquisition.** You only pay a reward when a new student actually signs up or attends, unlike advertising where you pay for impressions or clicks regardless of outcome.
- **Higher-quality leads.** Referred students arrive with built-in trust. They already know someone who attends your studio, which lowers the barrier to trying their first class.
- **Better retention.** Students who join through referrals tend to stay longer because they have a social connection at the studio from day one.
- **Compounding returns.** Happy referred students refer their own friends, creating a flywheel effect over time.

---

## Creating a Referral Program

1. Navigate to **Studio Management > Settings**.
2. Open the referral program configuration section.
3. Click **Create Referral Program**.
4. Fill in the following fields:

| Field | Description |
|---|---|
| **Program Name** | A descriptive name for internal use (e.g., "Bring a Friend 2025"). |
| **Description** | Optional public-facing description shown to students (e.g., "Invite a friend and you both get rewarded"). |
| **Referrer Reward Type** | The type of reward the referring student receives (see Reward Types below). |
| **Referrer Reward Value** | The amount or quantity for the referrer's reward. |
| **Referee Reward Type** | The type of reward the new student (the person being referred) receives. |
| **Referee Reward Value** | The amount or quantity for the referee's reward. |
| **Require Referee Purchase** | Whether the referred student must make a purchase before rewards are granted, or if signup alone qualifies. |
| **Max Referrals Per Student** | Optional cap on how many referrals a single student can make. Leave blank for unlimited. |

5. Toggle the program to **Active** when you are ready to launch.
6. Click **Save**.

> **Tip:** Keep the reward structure simple and easy to explain. If a student cannot describe the program in one sentence to a friend, it is too complicated.

---

## Reward Types

Tandava supports three reward types for both referrers and referees. You can mix and match -- for example, the referrer gets account credit while the referee gets free classes.

### Free Classes

Award a set number of free class credits. These are added to the student's account and can be redeemed for any eligible class.

- **Example:** "Refer a friend and get 2 free classes."
- **Best for:** Studios where class packs and drop-ins are the primary purchasing model.

### Account Credit

Award a dollar amount as account credit. The credit is applied automatically to the student's next purchase (membership, class pack, workshop, etc.).

- **Example:** "Refer a friend and get $15 credit toward your next purchase."
- **Best for:** Studios with a mix of product types, since credit is flexible across memberships, packs, and workshops.

### Percentage Discount on Next Purchase

Award a percentage discount that applies to the student's next transaction.

- **Example:** "Refer a friend and get 20% off your next class pack."
- **Best for:** Driving a specific next purchase action, especially for students who might be considering upgrading their membership or buying a larger class pack.

---

## How Students Share Their Referral Link or Code

Each student enrolled in an active referral program receives a unique referral code. They can access it from their account profile.

### Sharing methods:

1. **Referral code.** A short alphanumeric code (e.g., `MAYA-2F8K`) that the referred friend enters during registration or checkout.
2. **Referral link.** A URL that includes the referral code as a parameter. When the friend clicks the link and registers, the attribution is captured automatically.
3. **Social sharing.** Students can copy their referral link and share it through any channel -- text message, email, social media, or in person.

> **Note:** Referral codes are unique per student per program. If you run multiple referral programs simultaneously, a student may have a different code for each one, though in most cases studios run a single active program at a time.

---

## How the System Tracks Referral Attribution

When a new student signs up using a referral link or enters a referral code:

1. The system looks up the referral code to identify the referring student and the active referral program.
2. A **referral record** is created with status `pending`, linking the referrer, the referee's email, and the program.
3. When the referee completes the qualifying action (see below), the referral status moves to `completed`.
4. Rewards are then granted to both parties and the status moves to `rewarded`.

If the referral code is invalid or the program has expired, the new student can still register normally -- they just will not receive the referral reward.

---

## When Rewards Are Granted

The trigger for granting rewards is configurable per program based on the **Require Referee Purchase** setting:

### On Signup (Require Referee Purchase = Off)

Rewards are granted as soon as the referred student creates an account. This is the lowest-friction option and generates the most referral volume, but some referrals may come from people who sign up and never attend.

### On First Purchase (Require Referee Purchase = On)

Rewards are granted when the referred student makes their first paid transaction -- purchasing a membership, class pack, or drop-in. This ensures the referral represents a real revenue event.

### On First Class Attended (Advanced)

For studios that want the strongest signal of a genuine new student, rewards can be configured to trigger when the referred student checks in to their first class. This is the most conservative option.

> **Tip:** For most studios, "on first purchase" strikes the best balance between reward quality and referral volume. If you are just launching a referral program and want momentum, start with "on signup" and tighten the trigger later once the program is established.

---

## Viewing Referral Program Performance

Track your referral program's impact with the following metrics, available on the Reports page:

### Key Metrics

| Metric | What It Tells You |
|---|---|
| **Total Referrals Sent** | How many unique referral codes/links have been shared. |
| **Total Signups from Referrals** | How many new students registered through a referral. |
| **Conversion Rate** | Percentage of referral shares that resulted in a signup (signups / shares). |
| **Referrals Completed** | Number of referrals where the referee met the qualifying action (signup, purchase, or attendance). |
| **Rewards Granted** | Total number of rewards issued to referrers and referees. |
| **Reward Cost** | Total dollar value of rewards issued (free classes valued at drop-in rate, credits at face value, discounts at discount amount). |
| **Revenue from Referred Students** | Total revenue generated by students who arrived through referrals. |
| **Top Referrers** | Leaderboard of students who have generated the most successful referrals. |

### Reviewing Performance

1. Navigate to **Studio Management > Reports**.
2. Select the **Referrals** report section.
3. Filter by date range and referral program (if you have run multiple programs).
4. Review the conversion funnel: shares to signups to completed referrals to revenue.

> **Tip:** A healthy referral program typically converts 10-20% of shares into signups. If your conversion rate is below 5%, consider improving the reward (make it more generous) or the messaging (make it clearer what both parties receive). If shares are low but conversion is high, focus on promoting the program to more students.

---

## Tips for Promoting Your Referral Program

Creating a referral program is only the first step. You need to actively remind students that it exists.

### In-Studio Promotion

- **Front desk mention.** Train your front-desk staff to mention the referral program when students check in, especially after a great class.
- **Studio signage.** Place a simple card or poster near the entrance and in the changing areas.
- **Teacher announcements.** Ask teachers to mention the program at the end of class: "Loved today's class? Bring a friend next time -- you both get rewarded."

### Digital Promotion

- **Email campaigns.** Send a dedicated email introducing the program, and include a referral reminder in your regular newsletter.
- **Post-class email.** Add a referral prompt to the automated post-class follow-up email.
- **Social media.** Post about the program periodically. Highlight top referrers (with their permission) to create social proof.
- **Website and booking flow.** Add a referral program callout on your public schedule page and in the booking confirmation screen.

### Timing Matters

- **After a student's first month.** They have experienced enough classes to genuinely recommend you.
- **After a milestone.** "Congratulations on your 50th class! Know someone who would love it here?" is a natural moment to prompt a referral.
- **Seasonal pushes.** January (New Year's resolutions), September (back-to-routine), and early summer are strong referral windows.

> **Tip:** The single most effective referral prompt is a personal ask from someone the student knows and trusts. Encourage your teachers to build genuine relationships and mention the program naturally, rather than making it feel like a sales pitch.

---

## Related Workflows

- [Managing the Daily Schedule](./managing-the-daily-schedule.md) -- Day-to-day schedule operations for the classes your new referred students will attend
- [Data Import and Migration](./data-import-and-migration.md) -- Import existing student and referral data from another platform
