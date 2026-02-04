# Onboarding a New Member

**Purpose:** This workflow covers everything involved in adding a new student or member to your studio in Tandava -- from initial registration through their first booking and beyond. Whether a student signs up on their own or you create their profile at the front desk, this guide walks you through each step.

---

## Table of Contents

- [Self-Registration vs. Admin-Created Profiles](#self-registration-vs-admin-created-profiles)
- [Setting Up a Member Profile](#setting-up-a-member-profile)
- [Waiver Signing](#waiver-signing)
- [Choosing a Membership or Class Pack](#choosing-a-membership-or-class-pack)
- [First Booking Walkthrough](#first-booking-walkthrough)
- [Intro Offers](#intro-offers)
- [Member Communication Preferences](#member-communication-preferences)
- [Viewing Member Activity and History](#viewing-member-activity-and-history)
- [Member Lifecycle](#member-lifecycle)
- [Related Workflows](#related-workflows)

---

## Self-Registration vs. Admin-Created Profiles

Tandava supports two ways for a new student to enter your system.

### Option A: Student Self-Registration

Students can create their own account through the public-facing registration page.

1. The student navigates to your studio's booking page or registration link (`/auth/register`).
2. They enter their first name, last name, and email address.
3. Supabase Auth creates their account and a profile record is automatically generated.
4. The student is prompted to complete their profile, sign any required waivers, and browse the schedule.

> **Tip:** Share your registration link on your website, social media, and in-studio signage. This reduces front desk workload and lets students sign up on their own time.

### Option B: Admin Creates the Profile

Studio owners, admins, or front desk staff can create a student profile manually.

1. Navigate to **Students** (`/manage/students`).
2. Click the **Add Student** button in the upper right.
3. Enter the student's first name, last name, email, and phone number.
4. Save the profile. The system creates a `profiles` record and a `studio_members` record linking the student to your studio.
5. If the student does not yet have a Tandava account, they will receive an invitation email to set up their password and complete their profile.

> **Note:** Admin-created profiles are useful for walk-ins, phone registrations, or when migrating data from another system. The student can later claim their account by logging in with the email you provided.

---

## Setting Up a Member Profile

A complete member profile helps you provide personalized service and handle emergencies. The profile fields are stored in the `profiles` table and the studio-specific relationship in `studio_members`.

### Core Profile Fields

| Field | Where to Edit | Required |
|-------|--------------|----------|
| First Name | Profile form | Yes |
| Last Name | Profile form | Yes |
| Email | Profile form | Yes |
| Phone | Profile form | No (recommended) |
| Date of Birth | Profile form | No |
| Pronouns | Profile form | No |
| Emergency Contact Name | Profile form | No (recommended) |
| Emergency Contact Phone | Profile form | No (recommended) |

### Studio-Specific Fields

These are visible only to your studio staff and are managed from the **Member Detail** page (`/manage/members/:id`).

- **Notes** -- Private notes visible only to studio staff. Use this for injury information, preferences, or anything your teachers should know. For example: "Mild shoulder injury -- avoid deep chaturangas."
- **Tags** -- Internal labels you can add to organize and segment students (e.g., "VIP", "Teacher Training", "New Student", "At Risk").

### How to Edit a Profile (Admin)

1. Go to **Students** (`/manage/students`).
2. Search for the student by name or email.
3. Click on the student row to open the **Student Profile** dialog, or navigate to their **Member Detail** page.
4. On the Member Detail page, use the **Notes** tab to update notes, tags, and waiver status.

> **Tip:** Encourage students to fill in their emergency contact information during registration. This is important for heated classes, inversions, and any physically demanding practice.

---

## Waiver Signing

Tandava includes a digital waiver system. Waivers are managed through waiver templates that you create, and students sign them electronically before booking.

### Setting Up Waiver Templates

1. Navigate to **Settings** (`/manage/settings`).
2. Under your studio configuration, create or edit a waiver template. Each template has:
   - A **name** (e.g., "Liability Waiver", "Photo Release").
   - **Content** written in markdown or HTML.
   - A **version number** that increments when you update the waiver text.
   - A **required for booking** flag -- when enabled, students cannot complete a booking until the waiver is signed.

### How Students Sign a Waiver

1. During registration or before their first booking, the student is presented with the active waiver.
2. They read the waiver content and type their full legal name as their signature.
3. The system records the signature timestamp, IP address, browser information, and the waiver version that was signed.
4. The signature is stored in the `waiver_signatures` table and the `studio_members.waiver_signed_at` field is updated.

### Checking Waiver Status (Admin)

1. Open the student's **Member Detail** page (`/manage/members/:id`).
2. Go to the **Notes** tab.
3. The **Waiver Status** card shows whether the waiver is signed, along with the date it was signed.
4. You can mark a waiver as signed or revoke it manually if needed.

> **Note:** When you update a waiver template and increment its version, students who signed an older version may be prompted to re-sign. This ensures everyone is covered by your latest terms.

---

## Choosing a Membership or Class Pack

After a student's profile is created and their waiver is signed, the next step is getting them onto a plan.

### Assigning a Membership

1. Open the student's **Member Detail** page (`/manage/members/:id`).
2. On the **Membership** tab, if they have no active plan, click **Add Membership**.
3. Select a membership type from the options your studio has configured (e.g., "Unlimited Monthly", "8x Monthly", "4x Monthly", "Annual Unlimited").
4. Confirm the billing cycle and price.
5. If Stripe is connected, the student's payment method is charged and a recurring subscription is created.

### Assigning a Class Pack

1. On the student's **Member Detail** page, scroll to the **Class Packs** section.
2. Click **Add Pack** and select a pack type (e.g., "10-Class Pack", "5-Class Intro", "Single Drop-in").
3. The pack is added to their account with the configured number of classes and expiration window.

> **Tip:** For new students who are unsure about committing to a membership, a small intro class pack (like a 5-Class Intro) is a great way to let them try the studio. See the [Intro Offers](#intro-offers) section below for how to automate this.

---

## First Booking Walkthrough

Once a student has an active membership or class pack, they can book classes.

### Student Self-Booking

1. The student navigates to the **Schedule** page (`/schedule`).
2. They browse or filter classes by style, level, teacher, or time.
3. They select a class and click **Book**.
4. The system checks:
   - Is the waiver signed? (If required and unsigned, they are prompted to sign first.)
   - Do they have an active membership or class pack with remaining classes?
   - Is there space in the class?
5. If all checks pass, the booking is confirmed. If the class is full and the waitlist is enabled, they are added to the waitlist.
6. The student sees the booking on their **My Schedule** page (`/my-schedule`).

### Admin Booking on Behalf of a Student

1. Go to **Schedule** (`/manage/schedule`).
2. Find the class occurrence and open it.
3. Add the student to the class by searching for their name.
4. Select which membership or class pack to use for this booking.
5. Confirm the booking.

> **Tip:** Walk first-time students through the booking process on their phone during their first visit. This builds confidence and reduces future front desk workload.

---

## Intro Offers

Intro offers are special pricing or free classes that apply automatically to new students. They are configured in the `intro_offers` table and tracked via `intro_offer_redemptions`.

### Types of Intro Offers

| Offer Type | Description |
|-----------|-------------|
| Free Class | One or more free classes for new students |
| Discounted Pack | A class pack at a reduced price (e.g., 5 classes for $75 instead of $125) |
| Discounted Membership | A reduced rate on the first month of a membership |
| Trial Period | A set number of free trial days on a membership |

### How Intro Offers Work

1. You configure an intro offer in your studio settings with:
   - A name and description.
   - The offer type and pricing details.
   - Whether it is limited to new students only.
   - An optional time window (e.g., must redeem within 14 days of registration).
   - An optional cap on total redemptions.
2. When a new student registers and browses pricing options, eligible intro offers are surfaced automatically.
3. The student can select the intro offer during checkout or booking.
4. The redemption is recorded, and the `intro_offer_redemptions` table tracks who redeemed what.

> **Note:** Intro offers are designed to be automatic and frictionless. The student should not need to ask for a code or know a special URL. If they qualify, the offer appears.

---

## Member Communication Preferences

Tandava supports multiple notification channels and respects student preferences.

### Available Channels

- **Email** -- Booking confirmations, reminders, membership renewal notices.
- **SMS** -- Time-sensitive alerts like class cancellations or waitlist promotions.
- **Push Notifications** -- In-app nudges and reminders (when the PWA is installed).
- **In-App** -- Notifications visible within the Tandava interface.

### How Preferences Are Managed

1. Students can manage their own notification preferences from the **Account** page (`/account`).
2. Admins can view and adjust preferences from the student's **Member Detail** page.
3. All engagement nudges are:
   - **Dismissible** -- every nudge can be closed permanently.
   - **Frequency-capped** -- backend rules prevent notification fatigue.
   - **Contextual** -- messages are based on actual behavior, not generic blasts.

> **Tip:** During onboarding, let students know that Tandava will only send them relevant, useful notifications. This builds trust and reduces opt-outs.

---

## Viewing Member Activity and History

The **Member Detail** page (`/manage/members/:id`) is the central hub for everything about a student. It is organized into tabs:

### Overview Cards

At the top of the page, you see at-a-glance stats:

- **Total Classes** -- Lifetime count of classes attended.
- **Current Streak** -- Consecutive weeks with at least one class.
- **Lifetime Revenue** -- Total amount this student has spent at your studio.
- **Last Visit** -- How recently they attended a class.

### Membership Tab

- Current membership type, status (active, paused, expired), billing cycle, price, and next renewal date.
- Classes used this billing cycle vs. the allowed limit.
- Actions: Pause, Resume, Cancel, or Change Plan.
- Active class packs with remaining/total classes and expiration dates.
- Full purchase history.

### Bookings Tab

- A filterable list of all bookings: confirmed, checked in, cancelled, no-show, and late cancel.
- Each entry shows the date, time, class name, teacher, and status.

### Notes Tab

- Private studio notes (free-text, visible only to staff).
- Internal tags for segmentation.
- Waiver status with signed date.

### Billing Tab

- Full transaction history with dates, descriptions, amounts, and statuses (completed, failed, refunded).
- Payment methods on file (card type, last four digits, expiration, default status).
- Gift card balance.
- Account credit balance.

---

## Member Lifecycle

Understanding where each student is in their relationship with your studio helps you take the right action at the right time. Tandava tracks engagement signals that map to a five-stage lifecycle.

### The Five Stages

```
New --> Active --> At-Risk --> Lapsed --> Re-Engaged
```

| Stage | Definition | Typical Signals |
|-------|-----------|-----------------|
| **New** | Registered within the last 30 days | Account created, 0-2 classes attended, may have an intro offer active |
| **Active** | Attending classes regularly | Consistent bookings, active membership or class pack, steady streak |
| **At-Risk** | Engagement dropping | Streak broken, visits declining, membership approaching expiration without renewal, pack nearly exhausted |
| **Lapsed** | No activity for an extended period | No bookings in 30+ days, membership expired or cancelled, no active pack |
| **Re-Engaged** | Returning after a lapse | New booking after 30+ day gap, membership reactivated, new pack purchased |

### How Tandava Supports Each Stage

**New Students**
- Intro offers are surfaced automatically.
- The system logs a `student.registered` event.
- After their first class, a `student.first_class` event is logged.
- Tags like "New Student" or "Intro Offer" can be applied automatically or manually.

**Active Students**
- Streak tracking and milestone celebrations keep engagement visible.
- The engagement profile tracks activation scoring.
- Referral programs reward them for bringing friends.

**At-Risk Students**
- Engagement nudges fire when a streak is at risk or a pack is running low.
- The "At Risk" tag can be applied manually or based on rules.
- The dashboard alerts surface members with expiring packs or failed payment renewals.

**Lapsed Students**
- Comeback nudges can be configured to reach out after a period of inactivity.
- You can filter the Students list to find members with no recent activity.
- Targeted promo codes or re-engagement offers can be created.

**Re-Engaged Students**
- When a lapsed student books again, the system can celebrate the return.
- Their history and preferences are fully preserved -- nothing is lost during the lapse.

> **Tip:** Use the Students page (`/manage/students`) to filter and export students by lifecycle stage. This lets you run targeted outreach campaigns through your email marketing tool via the webhook/integration architecture.

---

## Related Workflows

- [First-Time Guest Experience](./first-time-guest.md) -- What happens when someone walks in without an account.
- [Passes and Memberships](./passes-and-memberships.md) -- Detailed guide to setting up and managing pricing plans.
- [Guest Passes](./guest-passes.md) -- How members can buy a class for someone else.
