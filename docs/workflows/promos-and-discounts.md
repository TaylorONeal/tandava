# Promos and Discounts

**Purpose:** This guide covers how to create, manage, and measure promotional offers in Tandava. Whether you are running a seasonal sale, rewarding referrals, welcoming new students, or issuing gift cards, this document walks you through every tool available for discounting and promotion.

---

## Where to Manage Promos

**Navigate to:** Studio Management > Promo Codes

This page shows all promo codes, their status, redemption counts, and attributed revenue. From here you can create new promos, enable or disable existing ones, and track performance.

Related promotional features (intro offers, referral programs, gift cards) are also accessible from this area.

---

## Types of Promos

Tandava supports three discount types:

| Discount Type | How It Works | Example |
|---------------|-------------|---------|
| **Percentage Off** | Reduces the price by a percentage (0-100%) | 20% off any membership |
| **Fixed Amount Off** | Reduces the price by a fixed dollar amount | $10 off a class pack |
| **Free Classes** | Grants a number of free classes | 1 free drop-in class |

Each promo code can be restricted to specific purchase types and offerings, giving you precise control over what gets discounted and for whom.

---

## Creating a Promo Code

### Step-by-Step

1. Go to **Studio Management > Promo Codes**.
2. Click **Create Promo** in the top right.
3. Fill in the following fields:

| Field | Description | Required |
|-------|-------------|----------|
| **Code** | The alphanumeric code students enter at checkout (e.g., WELCOME20). Automatically converted to uppercase. | Yes |
| **Display Name** | A human-readable name for your reference (e.g., "New Student Welcome"). Visible only to staff. | Yes |
| **Discount Type** | Percentage Off, Fixed Amount Off, or Free Classes. | Yes |
| **Discount Value** | The percentage (e.g., 20), dollar amount (e.g., 10), or class count (e.g., 1) depending on the discount type. | Yes |
| **Max Total Uses** | The total number of times this code can be redeemed across all students. Leave blank for unlimited. | No |
| **Max Uses Per Student** | How many times a single student can use this code. Defaults to 1. | No |
| **Expires** | The date after which the code is no longer valid. Leave blank for no expiration. | No |
| **New Students Only** | When enabled, only students who have never booked a class can use this code. | No |

4. Click **Create Promo Code**.

The promo is immediately active unless you set a future start date.

> **Tip:** Choose codes that are easy to type and remember. Short, uppercase codes like SUMMER10, FRIEND15, or NEWYEAR work well. Avoid ambiguous characters (0 vs O, 1 vs l).

---

## Restricting Promos to Specific Offerings

By default, a promo code applies to any purchase. You can narrow its scope:

- **Applies To:** Restrict the promo to specific purchase types -- memberships, class packs, drop-in classes, workshops, or retreats. Select one or more.
- **Specific Offerings:** Restrict the promo to particular offerings (e.g., only "Unlimited Monthly" memberships, or only "10-Class Pack").
- **Specific Membership Types:** Restrict the promo so it only applies to certain membership tiers.

This allows you to create targeted promotions. For example:

- A code that gives 20% off only your premium unlimited membership.
- A code that gives $10 off any class pack but not memberships.
- A code that gives 1 free drop-in class for any offering.

> **Note:** When a promo has both purchase type restrictions and specific offering restrictions, both must be satisfied. For example, a promo restricted to "memberships" and the "Unlimited Monthly" offering will only apply when a student purchases that exact membership.

---

## First-Time-Only Promos vs. General-Use Promos

### First-Time-Only (New Students Only)

Toggle the **New Students Only** switch when creating a promo to restrict it to students who have never booked a class at your studio. This is useful for:

- Welcome discounts advertised on your website or social media.
- Codes shared in partnership with local businesses.
- Trial offers meant to reduce the barrier for first-timers.

The system checks the student's booking history automatically. If they have any prior bookings, the code will be rejected at checkout.

### General-Use

Leave "New Students Only" off to create a promo that any student can use. Control usage through:

- **Max Uses Per Student:** Set to 1 for one-time use, or higher for repeat use.
- **Max Total Uses:** Cap the total number of redemptions across all students.
- **Date Range:** Limit the promo to a specific time window.

---

## How Promos Apply at Checkout

When a student enters a promo code during checkout:

1. The system validates the code exists and is active.
2. It checks whether the code has reached its total usage limit.
3. It checks whether this specific student has reached their per-student usage limit.
4. It checks whether the code is restricted to new students only, and whether this student qualifies.
5. It checks whether the purchase type and offering match the promo's restrictions.
6. If all checks pass, the discount is applied and the adjusted total is shown.
7. The original price, discount amount, and final price are all recorded in the transaction.

If any check fails, the student sees a clear message explaining why the code cannot be applied (e.g., "This code is for new students only" or "This code has expired").

---

## Tracking Redemptions and Measuring ROI

Every promo redemption is tracked in the `promo_redemptions` table, recording:

- Which student used the code
- The original price and discount amount
- The associated transaction
- The date of redemption

On the **Promo Codes** management page, you can see at a glance:

| Metric | What It Tells You |
|--------|-------------------|
| **Active Promos** | How many promos are currently live |
| **Total Redemptions** | Total uses across all promo codes |
| **Revenue Attributed** | Total revenue from transactions where a promo was applied |
| **Average Redemptions** | Average number of uses per promo |

For each individual promo, you can see its current uses (vs. maximum), remaining capacity, and the total revenue it has generated.

> **Tip:** A promo's attributed revenue is the revenue from transactions where that promo was used -- not the discount amount. This helps you understand whether a promo is driving real purchases, not just discounting existing demand.

---

## Intro Offers: A Special Category

Intro offers are distinct from promo codes. They are designed specifically for new student acquisition and appear prominently in the student-facing experience.

### Types of Intro Offers

| Offer Type | Description |
|------------|-------------|
| **Free Class** | New students get one or more free classes (configurable count). |
| **Discounted Pack** | A special-price class pack available only to new students. |
| **Discounted Membership** | A reduced first-month price on a membership. |
| **Trial Period** | A free trial period (configurable days) on a membership before billing begins. |

### Creating an Intro Offer

1. Go to **Studio Management > Promo Codes** (Intro Offers section).
2. Click **Create Intro Offer**.
3. Select the offer type.
4. Configure the details (free class count, trial days, discounted price, etc.).
5. Set eligibility rules:
   - **New Students Only:** On by default for intro offers.
   - **Max Days Since Registration:** Optionally limit the offer to students who registered within a certain window (e.g., 30 days).
6. Set maximum redemptions (or leave unlimited).
7. Set a date range if the offer is seasonal.
8. Click **Create**.

> **Note:** Unlike promo codes, intro offers do not require students to enter a code. They are automatically surfaced during the booking or purchase flow for eligible students.

---

## Referral Program Discounts

Tandava includes a built-in referral program that rewards both the referrer and the referred student.

### How It Works

1. An existing student shares their unique referral code or link.
2. A new student signs up using that code.
3. When the referred student makes their first qualifying purchase (if required), both parties receive their rewards.

### Configuring a Referral Program

1. Go to **Studio Management > Promo Codes** (Referral Programs section).
2. Click **Create Referral Program**.
3. Configure rewards:

| Setting | Description |
|---------|-------------|
| **Referrer Reward Type** | Credit, free class, or discount |
| **Referrer Reward Value** | Dollar amount, class count, or percentage |
| **Referee Reward Type** | Credit, free class, or discount |
| **Referee Reward Value** | Dollar amount, class count, or percentage |
| **Require Referee Purchase** | Whether the referred student must make a purchase before rewards are granted |
| **Max Referrals Per Student** | How many times a single student can refer (leave blank for unlimited) |

4. Click **Create**.

### Tracking Referrals

Each referral is tracked through its lifecycle:

- **Pending:** The referral link was shared but the referee has not signed up or purchased yet.
- **Completed:** The referee fulfilled the required action. Rewards are granted.
- **Expired:** The referral was not completed within the allowed timeframe.
- **Rewarded:** Both referrer and referee received their rewards.

> **Tip:** A strong referral program is often your best marketing channel. Existing students who refer friends have a personal stake in those friends having a good experience. Consider generous rewards -- the cost of a free class is far less than the lifetime value of a new student.

---

## Gift Cards

Gift cards let students purchase studio credit for someone else. They are a powerful tool for holidays, birthdays, and word-of-mouth growth.

### Issuing a Gift Card

Gift cards can be issued in two ways:

1. **Student-purchased:** A student buys a gift card through the student portal, choosing an amount and optionally adding a personal message and recipient email.
2. **Admin-issued:** Staff can issue gift cards directly from the admin panel (useful for promotional giveaways or customer service gestures).

Each gift card receives a unique code and tracks:

| Field | Description |
|-------|-------------|
| **Code** | Unique redemption code |
| **Original Amount** | The value loaded onto the card |
| **Remaining Balance** | Current balance after partial redemptions |
| **Status** | Active, Partially Used, Exhausted, Expired, or Revoked |
| **Recipient** | Name, email, and linked profile (if they have an account) |
| **Personal Message** | Optional message from the purchaser |
| **Expiration** | Optional expiration date |

### Redemption

When a student uses a gift card at checkout:

1. They enter the gift card code.
2. The system applies the gift card balance toward the purchase total.
3. If the gift card balance covers the full amount, no additional payment is needed.
4. If the gift card balance is less than the total, the remaining amount is charged to the student's payment method.
5. The gift card's remaining balance is updated.
6. Each use is recorded in the `gift_card_transactions` table with the amount used and remaining balance.

> **Note:** Gift cards and promo codes can be used together in the same transaction. The promo code discount is applied first, and the gift card balance covers any remaining amount.

---

## Best Practices for Studio Promotions

1. **Do not devalue your offering.** Frequent or deep discounts train students to wait for sales. Use promos sparingly and for specific goals: new student acquisition, seasonal fill-rate boosts, or rewarding loyalty.

2. **Set clear end dates.** Open-ended promos with no expiration tend to linger and create confusion. A promo that runs for 2 weeks creates urgency. One that runs forever creates entitlement.

3. **Track everything.** Every promo in Tandava tracks redemptions and attributed revenue. Review these numbers monthly. If a promo is not driving the behavior you want, disable it.

4. **Use intro offers for acquisition, referrals for growth.** First-time offers bring people in the door. Referral programs turn your best students into ambassadors. These two tools work together.

5. **Be strategic with gift cards.** Promote gift cards during holidays (they make excellent gifts). Issue small-value gift cards as customer service recovery tools when something goes wrong.

6. **Cap your exposure.** Use the "Max Total Uses" and "Max Discount Amount" fields to limit your financial exposure. A 50% off code with no usage cap and no expiration is a risk.

7. **Segment your promos.** A promo for "20% off any purchase" is blunt. A promo for "20% off your first Unlimited Monthly membership" is targeted and drives the behavior you actually want.

8. **Avoid stacking complexity.** If you have 15 active promos running simultaneously, your students (and your staff) will be confused. Keep it simple: one or two active promos, a referral program, and an intro offer.

---

## Related Workflows

- [Pausing a Membership](./pausing-a-membership.md) -- Offer a "welcome back" promo to students resuming from a pause
- [Workshops and Events](./workshops-and-events.md) -- Apply promo codes to event registrations
- [Landing Pages and SEO](./landing-pages-and-seo.md) -- Create landing pages with embedded promo offers for campaign tracking
