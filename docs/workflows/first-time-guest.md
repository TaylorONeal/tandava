# First-Time Guest Experience

**Purpose:** This workflow covers the complete journey of a first-time guest -- from the moment they walk through your door (or land on your website) to converting them into a regular member. It includes quick registration, waiver signing, intro offer application, their first booking, post-visit follow-up, and practical tips for making their first experience welcoming.

---

## Table of Contents

- [When Someone Walks In Off the Street](#when-someone-walks-in-off-the-street)
- [Quick Registration at the Front Desk](#quick-registration-at-the-front-desk)
- [Waiver Signing](#waiver-signing)
- [Intro Offer Application](#intro-offer-application)
- [Booking Their First Class](#booking-their-first-class)
- [Converting from Guest to Regular Member](#converting-from-guest-to-regular-member)
- [Follow-Up Nudge Architecture](#follow-up-nudge-architecture)
- [Tips for Making the First Visit Welcoming](#tips-for-making-the-first-visit-welcoming)
- [Related Workflows](#related-workflows)

---

## When Someone Walks In Off the Street

A walk-in guest is someone who arrives at your studio without an existing account or booking. This is one of the most important moments in your studio's relationship with a potential long-term member. Tandava is designed to make this process fast and frictionless so you can spend more time on the human connection and less on data entry.

Here is the typical flow:

```
Walk-in --> Quick Registration --> Waiver Signed --> Intro Offer Applied --> First Class Booked --> Class Attended
```

The goal is to get the guest from "standing at the front desk" to "on a mat in class" in under five minutes.

---

## Quick Registration at the Front Desk

There are two ways to register a walk-in guest: they can do it themselves on their phone, or you can do it from the admin interface.

### Option A: Guest Self-Registration (Recommended)

1. Direct the guest to your studio's registration page (`/auth/register`) -- consider having a QR code posted at the front desk that links directly to this page.
2. The guest enters their first name, last name, and email address on their phone.
3. Their account is created immediately. A `profiles` record and `studio_members` record are generated automatically.
4. They are prompted to sign the waiver and browse the schedule.

> **Tip:** Print a small card or poster with a QR code linking to your registration page. Place it at the front desk, in the changing room, and by the entrance. This lets guests start the process while they wait.

### Option B: Admin Registration

1. Navigate to **Students** (`/manage/students`).
2. Click **Add Student**.
3. Enter the minimum required information:
   - First name
   - Last name
   - Email address
   - Phone number (optional but recommended)
4. Save the profile.
5. The student record is created and linked to your studio.

> **Note:** With admin registration, the guest will not have set a password yet. They can claim their account later by using the "Forgot Password" flow with the email you entered. For the immediate visit, the admin can handle booking and check-in on their behalf.

### What Gets Created

When a new guest registers (either way), Tandava creates:

| Record | Table | Purpose |
|--------|-------|---------|
| User account | `auth.users` | Authentication credentials |
| Profile | `profiles` | Name, email, phone, emergency contact |
| Studio membership | `studio_members` | Links the student to your studio, tracks stats |

---

## Waiver Signing

Before the guest can attend a class, they need to sign your studio's liability waiver (if you have marked it as required for booking).

### For Self-Registered Guests

1. After creating their account, the guest is automatically prompted to review and sign the active waiver.
2. They read the waiver content on their phone.
3. They type their full legal name as a digital signature.
4. The signature is recorded with a timestamp, IP address, and waiver version.

### For Admin-Registered Guests

1. If the guest is standing at the front desk and you registered them manually, you have two options:
   - **Digital:** Hand them a tablet or direct them to the waiver page on their phone.
   - **Manual override:** On the guest's **Member Detail** page (`/manage/members/:id`), go to the **Notes** tab and use the **Waiver Status** section to mark the waiver as signed. Use this only if you have collected a physical signature.
2. The waiver status is visible at a glance on the Member Detail page so you can confirm it before check-in.

> **Note:** The waiver must be signed before the guest can complete a booking if you have enabled the "required for booking" flag on your waiver template. This protects your studio legally and ensures no one slips through the cracks.

---

## Intro Offer Application

Tandava's intro offer system is designed to apply automatically to eligible new students. No codes, no special links, no manual intervention required.

### How It Works for First-Time Guests

1. When a new student registers, the system checks for active intro offers configured for your studio.
2. If the guest qualifies (based on the `new_students_only` flag and the `max_days_since_registration` window), the offer is surfaced during their first purchase or booking flow.
3. Common intro offer types:

| Offer | Example | How It Appears |
|-------|---------|----------------|
| First class free | 1 free class, no purchase required | The guest can book without selecting a pack or membership |
| Discounted intro pack | 5 classes for $75 (normally $125) | Appears as a pricing option during checkout |
| Discounted first month | First month at $99 (normally $149) | Appears when selecting a membership |
| Trial period | 7-day free trial on any membership | Membership starts with a trial period before billing begins |

4. Once the guest selects and redeems the offer, a record is created in `intro_offer_redemptions`. Each student can redeem a given intro offer only once.

> **Tip:** Keep your intro offer simple and generous. A single, clear offer ("Your first class is on us") converts better than a confusing menu of options. You can always create targeted promo codes for more specific promotions.

### Applying an Intro Offer Manually (Admin)

If the system did not automatically surface an offer (for example, the guest was admin-registered and is being booked directly by staff):

1. Navigate to the guest's **Member Detail** page (`/manage/members/:id`).
2. When adding a purchase or booking, look for the intro offer option in the pricing selection.
3. Select the applicable intro offer.
4. The discount or free class is applied, and the redemption is recorded.

---

## Booking Their First Class

Once the guest is registered, has signed the waiver, and has an intro offer or payment method ready, it is time to get them into a class.

### If the Guest Is Booking Themselves

1. The guest navigates to the **Schedule** page (`/schedule`).
2. They browse available classes, filtering by time, style, level, or teacher if desired.
3. They tap a class to view details (description, teacher, capacity, spots remaining).
4. They tap **Book**.
5. The system validates:
   - Waiver is signed.
   - They have a valid payment source (intro offer, class pack, membership, or drop-in payment).
   - The class has available spots (or they are added to the waitlist).
6. Booking is confirmed. The class appears on their **My Schedule** page (`/my-schedule`).

### If the Admin Is Booking for the Guest

1. Go to **Schedule** (`/manage/schedule`).
2. Find the class the guest wants to attend.
3. Open the class detail and add the guest by searching for their name.
4. Select the payment source (intro offer, drop-in, etc.).
5. Confirm the booking.
6. Check the guest in immediately if the class is about to start by clicking **Check In** on the Member Detail page or directly in the class roster.

> **Tip:** For a true walk-in who wants to take the class that is starting in 10 minutes, the fastest path is: Admin creates profile, marks waiver signed (if physical signature collected), books the guest into the class using a drop-in or intro offer, and checks them in. Total admin time: under two minutes.

---

## Converting from Guest to Regular Member

The first visit is the beginning. The real goal is to convert a one-time guest into a committed member. Here is how Tandava supports that transition.

### During the First Visit

1. After the guest completes their first class, a `student.first_class` event is logged in the event system.
2. If they used a free intro class, their intro offer redemption is recorded.
3. The guest's **Member Detail** page now shows:
   - 1 class attended.
   - The date of their last visit.
   - The intro offer they used (if any).

### Encouraging the Next Step

1. **At the front desk:** After class, ask the guest how it went. If they enjoyed it, mention your membership options or class packs.
2. **In the app:** Tandava can surface contextual suggestions based on the guest's activity, such as recommending a class pack if they attended a single drop-in.
3. **Via follow-up nudges:** The follow-up system (described below) handles automated outreach.

### Assigning a Membership or Pack

1. Navigate to the guest's **Member Detail** page (`/manage/members/:id`).
2. On the **Membership** tab, click **Add Membership** to start them on a recurring plan.
3. Alternatively, add a class pack from the **Class Packs** section if they prefer a non-recurring commitment.
4. If a promo code applies (e.g., "WELCOME20"), it can be entered during checkout. See the **Promo Codes** page (`/manage/promo-codes`) for active codes.

> **Note:** Do not pressure the guest during their first visit. The most effective conversion happens when the guest feels genuinely welcomed and the next step is easy to take. Tandava's automated follow-up handles the rest.

---

## Follow-Up Nudge Architecture

After a first-time guest visits, Tandava's engagement system provides a structured follow-up sequence. All nudges are non-obtrusive, dismissible, and frequency-capped.

### The Post-First-Visit Sequence

| Timing | Nudge Type | Channel | Content |
|--------|-----------|---------|---------|
| Immediately after class | Milestone celebration | In-app | "Welcome! You just completed your first class." |
| 24 hours later | Booking reminder | Email / Push | "How did you enjoy [class name]? Here are upcoming classes you might like." |
| 3 days later | New class suggestion | Email | "Based on your first class, you might also enjoy [recommended class]." |
| 7 days later (if no second booking) | Comeback nudge | Email | "We'd love to see you again. Your intro offer is still available." |
| 14 days later (if still no booking) | Pack/membership suggestion | Email | "Ready to make it a habit? Here are our membership options." |

### How It Works Behind the Scenes

1. When a booking status changes to `checked_in`, the system logs an event in the `event_log` table.
2. Nudge rules (configured in the `nudge_rules` table in the growth schema) evaluate engagement events against timing and frequency rules.
3. If a nudge fires, it is delivered through the configured channel (in-app, push, or email).
4. The student can dismiss any nudge permanently. Dismissals are tracked to prevent repeat delivery.
5. If you have configured webhook endpoints or integrations (e.g., Mailchimp, ConvertKit), the events can trigger automations in your external email marketing tool as well.

> **Tip:** The follow-up sequence is most effective when it references the specific class the guest attended and the specific teacher who taught it. Personalization drives engagement.

### Customizing the Sequence

Studio owners can adjust nudge behavior from the settings:

- Enable or disable specific nudge types.
- Adjust timing windows.
- Customize message templates.
- Set frequency caps (e.g., no more than one nudge per week).

---

## Tips for Making the First Visit Welcoming

Technology handles the logistics, but the human experience is what brings people back. Here are practical suggestions.

### Before They Arrive

- Make sure your registration link and any pre-visit instructions (what to wear, where to park, what to bring) are easy to find on your website and social media.
- If someone books online before their first visit, consider sending a personalized welcome email. This can be automated through the integration/webhook system.

### At the Front Desk

- Greet them by name. Tandava's student list shows new registrations, so you know who to expect.
- Have the registration/waiver process ready. If they have not completed it online, hand them a tablet or point them to the QR code.
- Briefly explain what to expect in the class: where to put their shoes, where the mats/props are, whether the room is heated, and the general class format.
- Introduce them to the teacher before class starts if possible.

### During Class

- Ask the teacher to acknowledge first-timers at the start of class (without singling anyone out uncomfortably). A simple "If this is your first time here, welcome -- please let me know if you have any questions or injuries" is enough.
- Teachers should offer modifications and check in visually throughout class.

### After Class

- Thank them for coming. Ask a genuine question about their experience.
- Do not hard-sell memberships. Instead, let them know the options are available whenever they are ready.
- If they express interest, point them to the app or website where they can browse plans at their own pace.
- The follow-up nudge system handles the rest automatically.

### In Your Space

- Make sure your studio is clean, well-lit, and easy to navigate for someone who has never been there before.
- Clear signage for changing rooms, restrooms, water, and the practice space goes a long way.
- A small personal touch -- a handwritten welcome note on the sign-in sheet, a complimentary tea after class -- creates a lasting impression.

> **Tip:** The studios with the highest guest-to-member conversion rates are not the ones with the slickest sales pitches. They are the ones where first-timers feel genuinely seen and cared for. Let the technology handle the follow-up so your team can focus on being present.

---

## Related Workflows

- [Onboarding a Member](./onboarding-a-member.md) -- Full member onboarding including profile setup, memberships, and lifecycle tracking.
- [Passes and Memberships](./passes-and-memberships.md) -- How to set up the pricing plans your guests will see.
- [Guest Passes](./guest-passes.md) -- How existing members can buy a class for a friend (a common way first-time guests discover your studio).
