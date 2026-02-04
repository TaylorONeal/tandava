# Onboarding a New Studio

**Purpose:** This guide walks you through every step of setting up a brand-new studio on Tandava -- from creating your account to publishing your schedule and accepting your first booking. By the end, your studio will be live and ready for students.

**Who this is for:** Studio owners or administrators setting up Tandava for the first time.

**Estimated time:** 30--60 minutes (you can save progress and return at any point).

---

## Before You Begin

You will need the following information on hand:

- Your studio name, description, and contact details
- Your physical address and a list of rooms/spaces at your location
- Your logo file (PNG, SVG, or JPG -- 512x512px recommended)
- At least one class type you plan to offer (name, style, duration, capacity, drop-in price)
- Your cancellation and no-show policy details
- Teacher names, email addresses, and pay rates
- A Stripe account (or the information needed to create one)

---

## Step 1: Create Your Studio Account

1. Navigate to the Tandava registration page at `/auth/register`.
2. Enter your name, email address, and a strong password.
3. Verify your email address by clicking the confirmation link sent to your inbox.
4. Once verified, you will be prompted to create your first studio. This launches the guided setup wizard.

> **Tip:** The person who creates the studio is automatically assigned the **Owner** role. Owners have full access to every management feature, including billing, staff management, and settings.

---

## Step 2: Set Up Basic Studio Information

**Navigate to:** Studio Management > Onboarding > Step 1 (Studio Info), or later via Studio Management > Settings > General tab.

1. Enter your **Studio Name** (e.g., "Tandava Yoga"). This is the public-facing name students will see.
2. Write a brief **Description** of your studio. Keep it to two or three sentences -- what makes your space special, what styles you teach, and the vibe students can expect.
3. Select your **Timezone** from the dropdown (Eastern, Central, Mountain, or Pacific). All class times in your schedule will be displayed in this timezone.
4. Select your **Currency** (USD, EUR, GBP, CAD, or AUD). This applies to all pricing across memberships, class packs, and drop-ins.
5. Click **Save & Continue**.

> **Note:** Your studio is also assigned a unique **URL slug** (e.g., `tandava-yoga`). You can customize this later from Settings > General. The slug is used in your public studio page URL.

---

## Step 3: Add Your First Location

**Navigate to:** Studio Management > Onboarding > Step 2 (Location), or later via Studio Management > Settings > Locations tab.

1. Enter your **Street Address** (e.g., "123 Folsom St, San Francisco, CA 94105").
2. List your **Rooms** as a comma-separated list (e.g., "Main Studio, Hot Room, Meditation Room"). Each room represents a distinct space where classes can be scheduled.
3. Add any **Amenities** your location offers (e.g., "Showers, Mat Rentals, Changing Rooms, Lockers").
4. Click **Save & Continue**.

> **Tip:** Your first location is automatically marked as the **primary location**. If you plan to operate from multiple locations, you can add more later. See the [Adding a Location](./adding-a-location.md) workflow for details.

---

## Step 4: Configure Your Branding

**Navigate to:** Studio Management > Onboarding > Step 3 (Branding), or later via Studio Management > Settings > Branding tab.

1. Choose a **Primary Color** using the color picker or by entering a hex value. This color is used for buttons, highlights, and navigation elements in your studio's student-facing experience.
2. Choose a **Secondary Color** for accents and supporting elements.
3. Upload your **Logo** by dragging and dropping the file into the upload area, or click the Upload Logo button to browse. Accepted formats: PNG, SVG, or JPG at 512x512px.
4. Click **Save & Continue**.

> **Note:** You can also toggle the **Discovery Directory** listing from Settings > Branding. When enabled, your studio appears in Tandava's public directory so new students can find you. You can turn this on now or wait until you are fully set up.

---

## Step 5: Configure Studio Policies

**Navigate to:** Studio Management > Settings > Policies tab.

1. Set the **Cancellation Window** -- the number of minutes before class start that a student must cancel to avoid a fee. The default is 120 minutes (2 hours).
2. Set the **Late Cancel Fee** -- the dollar amount charged when a student cancels inside the cancellation window.
3. Set the **No-Show Fee** -- the dollar amount charged when a student does not show up and does not cancel.
4. Toggle the **Waitlist** on or off. When enabled, students can join a waitlist when a class is full. They are automatically promoted (in order) when a spot opens.
5. If the waitlist is enabled, set the **Max Waitlist Size** per class.
6. Click **Save Policies**.

> **Tip:** Many studios start with a 2-hour cancellation window, a $15 late-cancel fee, and a $20 no-show fee. You can always adjust these later as you learn what works for your community.

---

## Step 6: Set Up Payment Processing (Stripe Connect)

**Navigate to:** Studio Management > Onboarding > Step 10 (Stripe Connect), or later via Studio Management > Settings > Billing tab.

1. Click **Connect with Stripe**.
2. You will be redirected to Stripe's onboarding flow. If you already have a Stripe account, sign in. Otherwise, create a new one.
3. Complete the Stripe onboarding steps: verify your identity, connect your bank account, and confirm your business details.
4. Once complete, you will be redirected back to Tandava. A confirmation will appear indicating your Stripe account is connected.

> **Important:** Payment processing must be connected before you can sell memberships, class packs, or accept drop-in payments. You can set up the rest of your studio without Stripe, but students will not be able to purchase anything until it is connected.

Tandava uses **Stripe Connect** for all payment processing. This means payments are PCI-compliant and go directly to your connected Stripe account. Tandava never holds your funds.

---

## Step 7: Invite Your Staff

**Navigate to:** Studio Management > Onboarding > Step 7 (Staff), or later via Studio Management > Teachers.

1. Click **Add Teacher** (from the Teachers page) or fill in the staff fields during onboarding.
2. Enter the teacher's **Full Name** and **Email Address**.
3. Select their **Role**:
   - **Teacher** -- can view their schedule, manage their own classes, request subs, and see their payroll.
   - **Substitute** -- available to pick up sub requests but not assigned to regular classes.
   - **Admin** -- full management access similar to an owner (but cannot change billing or ownership).
4. Select a **Pay Type**: Per Class, Hourly, or Salary.
5. Enter the **Pay Rate** (e.g., $75 per class).
6. Click **Save & Continue** (onboarding) or the save action on the Teachers page.

The teacher will receive an email invitation to create their Tandava account and join your studio.

> **Tip:** You can add more teachers at any time from Studio Management > Teachers. For a detailed walkthrough, see [Onboarding a Teacher](./onboarding-a-teacher.md).

---

## Step 8: Create Your Initial Offerings (Class Types)

**Navigate to:** Studio Management > Onboarding > Step 4 (Offerings), or later via Studio Management > Offerings.

Offerings are the types of classes your studio teaches. Each offering defines a template that you will schedule on specific days and times.

1. Click **New Offering** (from the Offerings page) or use the onboarding form.
2. Enter the **Class Name** (e.g., "Morning Vinyasa").
3. Select the **Style** (e.g., Vinyasa, Hatha, Yin, Power, Restorative).
4. Select the **Level** (All Levels, Beginner, Intermediate, or Advanced).
5. Set the **Duration** in minutes (e.g., 75).
6. Set the **Capacity** -- the maximum number of students per class.
7. Set the **Drop-in Price** -- the price for students paying per class without a membership or pack.
8. Click **Save & Continue** or the save action.
9. Repeat for each class type you offer.

> **Tip:** You do not need to create every offering right now. Start with two or three core classes and add more as your schedule grows. You can also mark offerings as heated if they take place in a hot room.

---

## Step 9: Set Up Pricing Plans

**Navigate to:** Studio Management > Onboarding > Step 6 (Pricing), or later via Studio Management > Financials.

### Memberships

1. Go to the **Memberships** tab in Financials and click **New Membership Type**.
2. Enter the **Membership Name** (e.g., "Unlimited Monthly").
3. Select the **Billing Cycle** (Monthly, Quarterly, or Annual).
4. Enter the **Price** per billing cycle.
5. Toggle whether the membership includes **Unlimited classes** or a set number per cycle.
6. Save the membership type.

### Class Packs

1. Go to the **Class Packs** tab in Financials and click **New Pack Type**.
2. Enter the **Pack Name** (e.g., "10-Class Pack").
3. Enter the number of **Classes** included.
4. Enter the **Price**.
5. The validity period (how many days before unused classes expire) is set automatically but can be adjusted.
6. Save the class pack type.

> **Tip:** A common starting setup includes an Unlimited Monthly membership, an 8x Monthly membership, a 10-Class Pack, and a Single Drop-in option. You can create promotional intro packs (e.g., "5-Class Intro" at a discounted price) to attract new students.

---

## Step 10: Build Your First Schedule

**Navigate to:** Studio Management > Onboarding > Step 5 (Schedule), or later via Studio Management > Schedule.

1. Click **Add Class** from the Schedule page.
2. Select the **Offering** (the class type you created in the previous step).
3. Select the **Teacher** who will lead this class.
4. Choose the **Day of the Week**.
5. Set the **Start Time**.
6. Select the **Room** within your location.
7. Save the recurring schedule entry.
8. Repeat for each class on your weekly schedule.

> **Tip:** Tandava uses recurring schedule rules. When you add a class on "Monday at 7:00 AM," it automatically repeats every Monday. You can always create one-off overrides, assign subs, or cancel individual occurrences later from the Schedule management page.

---

## Step 11: Set Up Waivers

**Navigate to:** Studio Management > Onboarding > Step 8 (Waivers).

1. Enter a **Waiver Name** (e.g., "Liability Waiver").
2. Write or paste your **Waiver Content** into the text area. This is the full waiver text that students must agree to before booking their first class.
3. Click **Save & Continue**.

> **Note:** Students will be required to sign this waiver before they can book a class at your studio. If you have an existing waiver from another platform, you can paste it directly into the text field.

---

## Step 12: Import Existing Data (Optional)

**Navigate to:** Studio Management > Onboarding > Step 9 (Import), or later via Studio Management > Import Data.

If you are migrating from another platform (Mindbody, Momoyoga, Walla, Arketa, or any platform that exports CSV), you can import your existing student list, class history, memberships, and transactions.

1. Click **Go to Import Tool**.
2. Select your **Source Platform** to auto-map column formats.
3. Upload your CSV file.
4. Review the column mapping and make adjustments if needed.
5. Run the import.

> **Tip:** You can always come back to the import tool later. It is not required to launch your studio. If you are starting fresh with no existing data, skip this step.

---

## Step 13: Configure Notifications

**Navigate to:** Studio Management > Settings > Notifications tab.

Review and toggle each notification type:

- **Booking confirmation** -- sent when a student books a class (recommended: on)
- **Class reminder** -- sent 2 hours before class (recommended: on)
- **Cancellation notice** -- sent when a class is cancelled (recommended: on)
- **Sub notification** -- sent when a teacher is subbed (recommended: on)
- **Waitlist promotion** -- sent when a student is promoted from the waitlist (recommended: on)
- **Membership expiring** -- warns students 7 days before expiration (optional)
- **Pack running low** -- alerts students when they have 2 or fewer classes remaining (optional)

Click **Save Notifications** when you are satisfied with your choices.

---

## Step 14: Review and Launch

**Navigate to:** Studio Management > Onboarding > Step 11 (Launch).

1. Review the **setup checklist**. Each completed step will be marked with a "Done" badge.
2. If any step is incomplete, click on it in the sidebar to go back and finish it.
3. When you are ready, click **Launch Studio**.
4. Your studio is now live. Students can discover your studio (if you enabled the Discovery Directory), view your schedule, and book classes.

> **Important:** You can launch even if not every step is complete -- but at minimum, you should have your studio info, at least one location, one offering, one schedule entry, Stripe connected, and your policies configured. The rest can be added after launch.

---

## Post-Launch Checklist

Use this checklist to confirm everything is in order:

- [ ] Studio name, description, and contact details are accurate
- [ ] Timezone and currency are set correctly
- [ ] At least one location is configured with rooms
- [ ] Logo and brand colors are uploaded
- [ ] Cancellation, late-cancel, and no-show policies are configured
- [ ] Waitlist is enabled (or intentionally disabled)
- [ ] Stripe Connect is connected and verified
- [ ] At least one teacher has been invited
- [ ] Offerings (class types) are created and active
- [ ] Membership types and/or class packs are configured
- [ ] Weekly schedule is built with recurring classes
- [ ] Liability waiver is set up
- [ ] Notification preferences are reviewed
- [ ] Existing data has been imported (if migrating from another platform)
- [ ] Discovery Directory is toggled on (if you want public visibility)
- [ ] You have tested the student-facing experience by visiting your studio's public page

---

## Related Workflows

- [Adding a Location](./adding-a-location.md) -- How to add a second (or third) location to your studio
- [Onboarding a Teacher](./onboarding-a-teacher.md) -- Detailed guide for adding and configuring a new teacher
