# Guest Passes

**Purpose:** This workflow explains how existing members can purchase a class for someone else -- a friend, partner, or family member -- using Tandava's guest pass system. It covers purchasing, delivering, redeeming, and managing guest passes from both the member and studio-admin perspectives. It also clarifies when to use a guest pass versus a gift card.

---

## Table of Contents

- [What Guest Passes Are](#what-guest-passes-are)
- [How to Purchase a Guest Pass](#how-to-purchase-a-guest-pass)
- [How the Recipient Receives and Redeems a Guest Pass](#how-the-recipient-receives-and-redeems-a-guest-pass)
- [Tracking Guest Pass Usage](#tracking-guest-pass-usage)
- [Guest Pass vs. Gift Card](#guest-pass-vs-gift-card)
- [Studio-Side Management of Outstanding Guest Passes](#studio-side-management-of-outstanding-guest-passes)
- [Related Workflows](#related-workflows)

---

## What Guest Passes Are

A guest pass is a prepaid class credit that one person purchases for another. It is one of the simplest and most effective ways for your existing students to introduce friends, family, and colleagues to your studio.

### Key Characteristics

- **Purchaser:** An existing member or student at your studio.
- **Recipient:** Anyone -- they do not need an existing account.
- **Scope:** A guest pass includes a set number of classes (typically 1, but can be more) and an expiration date.
- **Offering restrictions:** A guest pass can optionally be restricted to specific class types, or it can be valid for any class at your studio.
- **Personal message:** The purchaser can include a message for the recipient (e.g., "Happy birthday! Enjoy a yoga class on me.").
- **Unique code:** Each guest pass has a unique, shareable redemption code.

### Why Guest Passes Matter

Guest passes serve double duty. For the purchaser, they are a thoughtful, personal gift. For your studio, they are a low-friction acquisition channel. Every guest pass redeemed is a potential new member walking through your door, introduced by someone who already loves your studio.

---

## How to Purchase a Guest Pass

### For Members (Self-Service)

1. The member navigates to the guest pass section in the app (accessible from their account or during the booking flow).
2. They configure the pass:
   - **Recipient name** -- The name of the person they are gifting the class to.
   - **Recipient email** -- Where the pass will be delivered.
   - **Recipient phone** (optional) -- An alternative delivery channel.
   - **Number of classes** -- How many classes the pass includes (default: 1).
   - **Offering restriction** (optional) -- Whether the pass is valid for any class or specific class types.
   - **Personal message** (optional) -- A note to accompany the pass.
3. They complete the purchase. The charge appears on their payment method.
4. A `transactions` record is created with the purchase, and a `guest_passes` record is generated with a unique redemption code.

### For Admins (On Behalf of a Member)

1. Navigate to **Financials** (`/manage/financials`) or the purchasing member's **Member Detail** page (`/manage/members/:id`).
2. Select the option to create a guest pass.
3. Enter the recipient's details and configure the pass as described above.
4. Choose the payment source (the member's card on file, a cash payment, or a complimentary pass with no charge).
5. Save the guest pass. The unique code is generated and the pass is ready for delivery.

> **Tip:** Complimentary guest passes (no charge) are a great tool for studio owners. Use them as thank-you gifts for loyal members, as part of a referral program, or as community outreach.

---

## How the Recipient Receives and Redeems a Guest Pass

### Delivery

1. After purchase, the recipient receives an email (and optionally an SMS) with:
   - The name of the person who sent the pass.
   - The personal message (if one was included).
   - The number of classes included.
   - The expiration date.
   - The unique redemption code.
   - A link to your studio's booking page.

### Redemption -- New Guest (No Account)

1. The recipient clicks the link in the email, which takes them to your studio's registration page (`/auth/register`) with the guest pass code pre-filled.
2. They create an account (first name, last name, email).
3. They sign the required waiver.
4. They browse the schedule (`/schedule`) and select a class.
5. During booking, they enter or confirm the guest pass code as their payment method.
6. The booking is confirmed. The `guest_passes.classes_used` counter increments by 1.
7. If the pass has no remaining classes, the `is_redeemed` flag is set to `true`.

### Redemption -- Existing Student

1. If the recipient already has a Tandava account, they simply log in.
2. During the booking flow, they enter the guest pass code.
3. The system validates the code (correct studio, not expired, classes remaining).
4. The booking is confirmed using the guest pass.

### Redemption -- At the Front Desk

1. If the recipient walks in and wants to use their guest pass in person, the front desk admin can apply it.
2. Navigate to **Students** (`/manage/students`) and find or create the recipient's profile.
3. Book the recipient into the desired class.
4. During booking, enter the guest pass code as the payment source.
5. The pass is redeemed and the booking is confirmed.

> **Note:** The guest pass code is the key. Whether the recipient books online or walks in, all they need is the code. Make sure the delivery email clearly highlights it.

---

## Tracking Guest Pass Usage

### What the Guest Pass Record Contains

Each guest pass is stored in the `guest_passes` table with the following fields:

| Field | Description |
|-------|-------------|
| `purchased_by_id` | The member who bought the pass |
| `recipient_name` | The intended recipient's name |
| `recipient_email` | The recipient's email address |
| `recipient_profile_id` | Links to the recipient's profile once they create an account |
| `code` | The unique, shareable redemption code |
| `offering_ids` | Which class types the pass covers (empty = any class) |
| `classes_included` | Total number of classes in the pass |
| `classes_used` | How many classes have been redeemed so far |
| `expires_at` | When the pass expires |
| `is_redeemed` | Whether all classes have been used |
| `redeemed_at` | Timestamp of when the pass was fully redeemed |
| `personal_message` | The purchaser's note to the recipient |
| `transaction_id` | Links to the purchase transaction |

### Where to View Guest Pass Activity

**As a studio admin:**

- The **Financials** page (`/manage/financials`) shows guest pass purchases in the transaction history.
- Individual guest passes can be viewed from the purchaser's or recipient's **Member Detail** page.
- You can also see guest pass bookings in the class roster when viewing individual class occurrences on the **Schedule** page (`/manage/schedule`).

**As the purchaser:**

- The member can view the status of guest passes they have purchased from their **Account** page (`/account`), including whether each pass has been redeemed.

---

## Guest Pass vs. Gift Card

Tandava offers both guest passes and gift cards. They serve different purposes.

| Feature | Guest Pass | Gift Card |
|---------|-----------|-----------|
| **What it provides** | A specific number of classes | A dollar balance that can be applied to any purchase |
| **Best for** | "Come try a class with me" | "Here is credit to spend however you want" |
| **Offering restrictions** | Can be restricted to specific class types | No restrictions -- applies to any purchase |
| **How it is redeemed** | As a payment source during class booking | As a payment method during any checkout |
| **Expiration** | Has an expiration date | Can have an expiration date (optional) |
| **Partial use** | Yes (if the pass includes multiple classes) | Yes (balance decrements with each use) |
| **Typical use case** | A member invites a friend to try the studio | Birthday gift, holiday gift, or general "treat yourself" |
| **Recipient experience** | Directed toward booking a class immediately | Can browse all options (memberships, packs, workshops, drop-ins) |
| **Acquisition impact** | High -- the recipient is guided into a specific class | Moderate -- the recipient chooses when and how to engage |

### When to Recommend Each

**Recommend a guest pass when:**
- A member wants to bring a friend to a specific class.
- You are running a "bring a friend" promotion.
- The goal is to get someone into the studio for the first time with minimal friction.

**Recommend a gift card when:**
- Someone is buying a gift for a practitioner who already knows what they want.
- The recipient might want to use the credit toward a membership, a workshop, or retail.
- You want to give the recipient full flexibility.

> **Tip:** For studio-driven referral campaigns, guest passes are almost always the better tool. They create a specific, actionable next step ("Book a class") rather than an open-ended option ("Spend this credit someday").

---

## Studio-Side Management of Outstanding Guest Passes

As a studio owner or admin, you should periodically review your outstanding guest passes to understand their status and impact.

### Viewing All Guest Passes

1. Navigate to **Financials** (`/manage/financials`).
2. In the transaction history, filter by guest pass purchases to see all passes that have been sold.
3. For each pass, you can see:
   - Who purchased it.
   - Who the intended recipient is.
   - How many classes are included and how many have been used.
   - Whether the pass is still active or has been fully redeemed.
   - The expiration date.

### Common Management Tasks

**Extending an expiration:**

If a recipient has not had a chance to use their pass and the purchaser or recipient requests an extension:

1. Find the guest pass record.
2. Update the `expires_at` date to the new expiration.
3. Notify the recipient of the extension.

> **Note:** Being flexible with guest pass expirations builds goodwill and increases the chance the pass is actually used, which means a potential new member walking through your door.

**Issuing a complimentary guest pass:**

1. Create a new guest pass from the admin interface without an associated payment.
2. Enter the recipient's name and email.
3. The pass is generated and delivered just like a purchased pass.
4. Use complimentary passes for:
   - Thanking loyal members.
   - Compensating for a poor experience (e.g., a cancelled class).
   - Community outreach (partnering with local businesses, charity events).
   - Staff gifting.

**Handling expired, unredeemed passes:**

- Expired guest passes with unused classes represent a liability that has resolved itself -- the revenue was collected, and the class was never delivered.
- If a purchaser asks about an expired, unused pass, consider issuing a fresh complimentary pass as a gesture of goodwill. The cost to your studio is one class slot, and the benefit is a happy member and a potential new student.

### Reporting on Guest Pass Performance

Track these metrics to understand how guest passes contribute to your studio:

| Metric | What It Tells You |
|--------|-------------------|
| Total passes sold (period) | Volume of gifting activity |
| Redemption rate | What percentage of purchased passes are actually used |
| Conversion rate | What percentage of guest pass recipients become members |
| Revenue from guest pass purchases | Direct revenue from pass sales |
| Average time to redemption | How quickly recipients use their passes |

> **Tip:** A low redemption rate may mean your passes are expiring before recipients get a chance to use them. Consider extending the default validity window. A high redemption rate with a low conversion rate means people are trying the class but not coming back -- look at the first-visit experience and follow-up sequence.

---

## Related Workflows

- [Onboarding a Member](./onboarding-a-member.md) -- What happens after a guest pass recipient decides to become a regular member.
- [First-Time Guest Experience](./first-time-guest.md) -- The full first-visit flow, including when the guest arrives via a guest pass.
- [Passes and Memberships](./passes-and-memberships.md) -- Setting up the pricing plans that guest pass recipients may convert to.
