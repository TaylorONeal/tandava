# Passes, Packs, and Memberships

**Purpose:** This workflow covers how to set up and manage the pricing structures that power your studio's revenue -- drop-in rates, class packs, recurring memberships, and intro offers. It explains how to create each type, configure billing, handle upgrades and downgrades, and think about pricing strategy.

---

## Table of Contents

- [Types of Pricing](#types-of-pricing)
- [Creating a Membership Type](#creating-a-membership-type)
- [Creating a Class Pack](#creating-a-class-pack)
- [Configuring Offering Coverage](#configuring-offering-coverage)
- [How Billing Works (Stripe Integration)](#how-billing-works-stripe-integration)
- [Membership Upgrades and Downgrades](#membership-upgrades-and-downgrades)
- [Membership Pausing](#membership-pausing)
- [Class Pack Renewals](#class-pack-renewals)
- [Viewing Active Subscriptions and Pack Balances](#viewing-active-subscriptions-and-pack-balances)
- [Revenue Impact and Pricing Strategy](#revenue-impact-and-pricing-strategy)
- [Related Workflows](#related-workflows)

---

## Types of Pricing

Tandava supports four core pricing models. Most studios use a combination of these.

| Type | Description | Best For |
|------|-------------|----------|
| **Drop-in** | Single-class purchase, no commitment | Occasional visitors, tourists, students trying out your studio |
| **Class Pack** | A bundle of classes purchased upfront with an expiration window | Students who want flexibility without a recurring charge |
| **Recurring Membership** | A subscription billed on a regular cycle (weekly, monthly, quarterly, or annually) | Your committed, regular students |
| **Intro Offer** | Special pricing for new students (free class, discounted pack, trial period) | First-time guests and new registrations |

### How They Relate in the Data Model

- **Drop-in pricing** is configured per offering on the `offerings` table (`drop_in_price_cents`).
- **Membership types** are defined in the `membership_types` table. Individual student subscriptions are tracked in the `memberships` table.
- **Class pack types** are defined in the `class_pack_types` table. Individual purchased packs are tracked in the `class_packs` table.
- **Intro offers** are defined in the `intro_offers` table with redemptions tracked in `intro_offer_redemptions`.

---

## Creating a Membership Type

Membership types define the recurring plans available at your studio. You can create as many as you need.

### Step-by-Step

1. Navigate to **Financials** (`/manage/financials`).
2. Select the **Memberships** tab.
3. Click **New Membership Type**.
4. Fill in the configuration:

| Field | Description | Example |
|-------|-------------|---------|
| **Name** | The display name students will see | "Unlimited Monthly" |
| **Description** | A brief explanation of what is included | "Unlimited classes at all locations" |
| **Billing Cycle** | How often the student is charged | Monthly, Quarterly, Annual, or Weekly |
| **Price** | The recurring charge per cycle (in cents internally) | $149/month |
| **Classes Per Cycle** | The maximum number of classes allowed per billing period. Leave blank for unlimited. | 8, or blank for unlimited |
| **Auto-Renew** | Whether the membership renews automatically at the end of each cycle | Yes (default) |
| **Trial Days** | Number of free trial days before billing begins | 0 (default), or 7 for a one-week trial |
| **Trial Price** | A reduced rate during the trial period (if applicable) | $0 for a free trial, or $49 for a reduced first period |

5. Click **Save**. The membership type is now available for purchase and assignment.

### Configuring Pause Rules

Each membership type can have its own pause policy:

| Field | Description | Default |
|-------|-------------|---------|
| **Allow Pause** | Whether students can pause this membership | No |
| **Max Pause Days** | Maximum days per individual pause | No limit |
| **Max Pauses Per Year** | How many times a student can pause per year | Unlimited |
| **Min Active Days Before Pause** | How long the membership must be active before the first pause | 30 days |
| **Pause Extends Billing** | Whether the billing date shifts forward by the length of the pause | Yes |

### Configuring Commitment and Cancellation

| Field | Description | Default |
|-------|-------------|---------|
| **Commitment Months** | Minimum months before cancellation is allowed without a fee | 0 (no commitment) |
| **Early Cancellation Fee** | Fee charged if a student cancels before the commitment period ends | $0 |

> **Tip:** Start simple. Most small studios do well with three membership tiers: an unlimited plan, a limited plan (e.g., 8 classes/month), and a smaller plan (e.g., 4 classes/month). You can always add more later.

### Current Membership Types (Example)

The **Financials** page shows each membership type as a card with key information:

- Plan name and price per cycle.
- Number of active subscribers.
- Estimated monthly recurring revenue (active subscribers x price).
- Actions: Edit, View Members, Deactivate.

---

## Creating a Class Pack

Class packs are prepaid bundles of classes with an expiration window. They are a good option for students who want commitment-free access.

### Step-by-Step

1. Navigate to **Financials** (`/manage/financials`).
2. Select the **Class Packs** tab.
3. Click **New Pack Type**.
4. Fill in the configuration:

| Field | Description | Example |
|-------|-------------|---------|
| **Name** | The display name | "10-Class Pack" |
| **Description** | What is included | "10 classes, valid for 90 days" |
| **Class Count** | Total number of classes in the pack | 10 |
| **Price** | The one-time purchase price (in cents internally) | $220 |
| **Validity Days** | How many days after purchase before the pack expires | 90 |

5. Click **Save**. The pack type is now available for purchase.

### Pack Economics

The **Financials** page displays each pack type with:

- Pack name, price, class count, and validity window.
- Per-class cost (price / class count) so you can see the effective rate.
- Total packs sold (all time).
- Actions: Edit, Deactivate.

> **Tip:** Price your class packs so the per-class rate is meaningfully cheaper than drop-in but more expensive than an equivalent membership. This creates a natural upgrade path: drop-in --> class pack --> membership.

### Common Pack Configurations

| Pack | Classes | Validity | Price | Per-Class Rate |
|------|---------|----------|-------|----------------|
| Single Drop-in | 1 | 1 day | $25 | $25 |
| 5-Class Intro | 5 | 30 days | $75 | $15 |
| 10-Class Pack | 10 | 90 days | $220 | $22 |
| 20-Class Pack | 20 | 180 days | $380 | $19 |

---

## Configuring Offering Coverage

Not every membership or pack needs to cover every class type. Tandava lets you restrict which offerings each plan covers.

### For Membership Types

The `membership_types` table includes:

- **`offering_ids`** -- An array of offering IDs. If empty, the membership covers all offerings. If populated, it only covers the listed class types.
- **`locations`** -- An array of location identifiers. If empty, the membership covers all locations. If populated, it restricts access to specific locations.

### For Class Pack Types

The `class_pack_types` table includes the same fields:

- **`offering_ids`** -- Which class types the pack can be used for.
- **`locations`** -- Which locations the pack is valid at.

### Practical Examples

| Plan | Offering Coverage | Location Coverage |
|------|------------------|-------------------|
| Unlimited Monthly | All classes | All locations |
| Yoga Only Monthly | Only offerings tagged as yoga | All locations |
| Workshop Pack | Only workshop-style offerings | Primary location only |
| 10-Class Pack | All classes | All locations |

> **Note:** When a student tries to book a class, the system checks whether their active membership or pack covers that specific offering and location. If it does not, they will be prompted to purchase a drop-in or a different pack.

---

## How Billing Works (Stripe Integration)

Tandava uses Stripe Connect for payment processing. Each studio has its own Stripe Connect account, ensuring your revenue goes directly to you.

### Initial Setup

1. During studio onboarding (`/manage/onboarding`), you connect your Stripe account in the **Payments** step.
2. Stripe handles the PCI compliance, card storage, and billing infrastructure.
3. Tandava never stores full card numbers. Only Stripe payment method references, card brand, last four digits, and expiration are stored in the `payment_methods` table.

### How Recurring Memberships Are Billed

1. When a student purchases a membership, a Stripe subscription is created.
2. The `memberships` table stores the `stripe_subscription_id` and tracks the current billing period.
3. At the end of each billing cycle, Stripe automatically charges the student's default payment method.
4. On successful charge:
   - A `transactions` record is created with type `membership_renewal`.
   - The membership's `current_period_start` and `current_period_end` are updated.
   - The `classes_used_this_cycle` counter resets to 0.
5. On failed charge:
   - The membership status changes to `past_due`.
   - A `membership.payment_failed` event is logged.
   - The dashboard alerts surface the failure so you can follow up.

### How Class Packs Are Billed

1. Class pack purchases are one-time charges through Stripe.
2. A `transactions` record is created with type `class_pack_purchase`.
3. The `class_packs` table tracks the remaining class count and expiration date.
4. Each time a booking is confirmed using the pack, the `classes_remaining` count decrements automatically.

### How Drop-Ins Are Billed

1. A drop-in booking triggers a one-time charge at the offering's `drop_in_price_cents`.
2. A `transactions` record is created with type `drop_in`.

### Viewing Transactions

All financial activity is visible on the **Financials** page (`/manage/financials`) under the **Transactions** tab. Each transaction shows:

- Student name
- Transaction type (membership renewal, class pack purchase, drop-in, late cancel fee, refund)
- Amount
- Date
- Status (completed, failed, refunded)

> **Tip:** Check the Financials page regularly for failed payments. A quick, friendly follow-up ("Hey, your card didn't go through -- want to update it?") prevents involuntary churn and keeps your revenue steady.

---

## Membership Upgrades and Downgrades

Students' needs change over time. Tandava supports plan changes through the Member Detail page.

### Upgrading a Membership

1. Navigate to the student's **Member Detail** page (`/manage/members/:id`).
2. On the **Membership** tab, click **Change Plan**.
3. Select the new (higher-tier) membership type.
4. Choose when the change takes effect:
   - **Immediately** -- Prorated charges are calculated for the remainder of the current billing period.
   - **At next renewal** -- The current period finishes at the old rate, and the new plan starts at the next billing date.
5. Confirm the change. Stripe handles the subscription update and proration.

### Downgrading a Membership

1. Follow the same steps as an upgrade, but select a lower-tier plan.
2. Downgrades typically take effect at the next renewal to avoid mid-cycle class limit confusion.

> **Note:** If a student is downgrading from an unlimited plan to a limited plan mid-cycle, and they have already used more classes than the new plan allows, the system will let them keep their current bookings but prevent new bookings beyond the new limit once the downgrade takes effect.

---

## Membership Pausing

Pausing is a powerful retention tool. Instead of cancelling when life gets busy, students can pause and come back.

### How to Pause a Membership (Admin)

1. Open the student's **Member Detail** page (`/manage/members/:id`).
2. On the **Membership** tab, click **Pause Membership**.
3. In the dialog, select the pause duration (1 week, 2 weeks, 1 month, or 2 months).
4. Optionally enter a reason (travel, injury, personal).
5. Click **Pause Membership** to confirm.

### What Happens During a Pause

- The membership status changes to `paused`.
- Billing is suspended for the pause duration.
- A scheduled resume date is set automatically.
- The student cannot book new classes during the pause.
- A `membership.paused` event is logged.
- If "Pause Extends Billing" is enabled on the membership type, the next renewal date shifts forward by the length of the pause.

### Resuming a Membership

- **Automatically:** The membership resumes on the scheduled resume date. Billing restarts and the student can book again.
- **Manually:** On the Member Detail page, click **Resume Membership** to end the pause early.

### Pause History

Each pause is recorded in the `membership_pauses` table with:

- Start date, scheduled resume date, actual resume date.
- Reason for pause.
- Who initiated the pause (student or staff) and who resumed it.

> **Tip:** Offering a pause option reduces cancellations significantly. A student who pauses for a month is far more likely to return than one who cancels and has to re-sign up.

---

## Class Pack Renewals

When a student's class pack runs out or is about to expire, they may want to purchase another.

### Automatic Alerts

- When a pack is running low (e.g., 2 or fewer classes remaining), the engagement system can send a `pack_running_low` nudge.
- When a pack is about to expire, a notification is sent.

### Purchasing a New Pack

1. The student can purchase a new pack from the booking flow or pricing page at any time.
2. Admins can add a new pack from the student's **Member Detail** page.
3. Multiple packs can be active simultaneously. When booking, the system uses the pack that expires soonest first.

### Pack Expiration

- When a pack's `expires_at` date passes with remaining classes, the pack status changes to `expired`.
- Expired classes are not refunded by default, but you can issue a credit or new pack manually.

> **Note:** If a student has both an active membership and an active class pack, bookings will default to using the membership first (unless the class is not covered by the membership). This ensures pack classes are preserved for the classes that need them.

---

## Viewing Active Subscriptions and Pack Balances

### Studio-Wide View

The **Financials** page (`/manage/financials`) provides a comprehensive overview:

- **Overview tab:** Revenue (month-to-date), active members count, active packs count, and average revenue per student.
- **Memberships tab:** All membership types with their active subscriber counts and estimated recurring revenue.
- **Class Packs tab:** All pack types with total sold counts and per-class economics.
- **Transactions tab:** Full transaction history with student name, type, amount, date, and status.

### Per-Student View

On any student's **Member Detail** page (`/manage/members/:id`):

- **Membership tab:** Shows the current plan, status, billing cycle, price, next renewal date, classes used this cycle, and full purchase history.
- **Class Packs section:** Shows each active pack with remaining/total classes, expiration date, and status (active, used up, expired).
- **Billing tab:** Full transaction history, payment methods on file, gift card balance, and account credit.

### Exporting Data

- On the **Financials** page, click **Export Transactions** to download a CSV of your transaction history.
- On the **Students** page (`/manage/students`), click **Export** to download your full student list with membership and pack status.

---

## Revenue Impact and Pricing Strategy

Your pricing structure directly affects your studio's financial health. Here are some practical guidelines.

### The Pricing Ladder

Structure your offerings so there is a clear path from casual to committed:

```
Drop-in ($25) --> Intro Pack ($75/5) --> Class Pack ($220/10) --> Monthly Membership ($149/mo)
```

Each step should offer a better per-class rate, incentivizing students to commit more deeply.

### Key Metrics to Watch

| Metric | Where to Find It | What It Tells You |
|--------|-----------------|-------------------|
| Revenue (MTD) | Financials > Overview | How your current month is tracking |
| Active Members | Financials > Overview | Size of your recurring revenue base |
| Active Packs | Financials > Overview | How many non-recurring students are engaged |
| Avg Revenue/Student | Financials > Overview | Whether you are maximizing per-student value |
| Failed Payments | Dashboard alerts | Revenue at risk from card declines |
| Expiring Packs | Dashboard alerts | Students who may need a nudge to renew |

### Pricing Principles

1. **Simplicity wins.** Three to four clear options are better than ten confusing ones. If a prospective student cannot understand your pricing in 30 seconds, you will lose them.

2. **Anchor high.** Show the drop-in rate first so that memberships look like a good deal by comparison.

3. **Reward commitment.** The per-class cost should decrease meaningfully as the commitment level increases. If your unlimited membership works out to $7/class for a regular attendee, but drop-in is $25, the value proposition is obvious.

4. **Use intro offers strategically.** A generous intro offer (first class free, or a $49 intro month) lowers the barrier to entry. The lifetime value of a member who stays 12+ months far exceeds the discount.

5. **Review quarterly.** Use the Reports page (`/manage/reports`) to analyze attendance trends, revenue per class, and churn. Adjust pricing based on data, not intuition.

> **Tip:** The most common pricing mistake small studios make is undercharging. If your classes are consistently full, that is a signal you may have room to raise prices. If classes are consistently empty, the issue is usually marketing or scheduling, not price.

---

## Related Workflows

- [Onboarding a Member](./onboarding-a-member.md) -- How to get a new student set up with a membership or pack.
- [First-Time Guest Experience](./first-time-guest.md) -- How intro offers apply to walk-in guests.
- [Guest Passes](./guest-passes.md) -- How members can gift classes to others.
