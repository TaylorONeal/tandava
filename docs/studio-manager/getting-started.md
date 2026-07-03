# Studio Manager — Getting Started

Welcome! This guide walks you through setting up and managing your yoga studio on Tandava.

> **You don't install or deploy anything.** Go to **[tandavastudio.com](https://tandavastudio.com)**, create an account, and a setup wizard walks you through the rest. No servers, no DNS, no technical setup. You'll need an email address, about 15 minutes, and — when you're ready to take payments — a Stripe account (the wizard helps you create or connect one). To add Tandava to your phone or front-desk tablet like an app, see [Installing on your devices](../guides/DEVICE_INSTALLATION.md).

## What You Can Do

As a studio owner or manager, you have access to the **Studio Manager** panel at `/manage`. From here you can:

- **Schedule** — Create and manage your class schedule, assign instructors, set capacity
- **Members** — View your member directory, check membership status, see attendance
- **Instructors** — Manage your teaching roster and availability
- **Billing** — Connect your Stripe account, set pricing for classes and memberships
- **Inbox** — Read and respond to member messages and visitor inquiries
- **Analytics** — See bookings, revenue, and retention metrics
- **Settings** — Update studio info, location, hours, and cancellation policy

## The Setup Wizard

After you sign up, open **Studio Setup** at `/manage/onboarding`. It's a step-by-step wizard, and two things make it stress-free:

- **Skip anything.** Not ready to write your waiver or import members? Click **Skip for now** and come back later.
- **Everything saves.** Your progress is stored as you go, so you can close the tab and pick up where you left off — even on a different device.

The steps:

1. **Studio Info** — name, description, timezone, currency
2. **Location** — address and room names
3. **Branding** — your colors and logo
4. **Offerings** — your class types (e.g. Vinyasa, Yin), with duration, capacity, drop-in price
5. **Schedule** — add a recurring class to your weekly schedule
6. **Pricing** — a membership and a class pack (you can refine these later in Financials)
7. **Staff** — invite teachers and front-desk staff by email; each gets an invitation to join
8. **Waivers** — the liability waiver students agree to before their first class
9. **Import** — bring your students/schedule over from Mindbody, Momoyoga, Walla, Arketa, or a CSV (or skip)
10. **Stripe** — connect your Stripe account so you can accept payments (see below)
11. **Launch** — review and go live

### Connecting Payments (the Stripe step)

On the **Stripe** step, click **Connect with Stripe**. You'll be sent to Stripe to link your existing account or create a new one, then brought right back to the wizard. Once connected, you can accept payments for classes, memberships, and class packs — and payouts go **directly to your bank account**, not through anyone else.

## Your Studio's Web Address

On the hosted version, your studio lives at the same address your students already know — you sign in and manage everything there, and students book from the public schedule. You don't set up a domain, DNS, or hosting; that's all handled for you.

A few things worth knowing:

- **Today:** your studio runs on the shared hosted address. You can share a direct link to your booking page and embed your schedule on your existing website with a one-line snippet (see [Website Embed](../guides/website-embed.md)) — so your current site, Instagram, and Google listing all keep working.
- **Coming soon — your own subdomain:** a clean address like `yourstudio.tandavastudio.com`, set up for you automatically, nothing to configure.
- **Later — your own domain:** point a domain you own (e.g. `book.yourstudio.com`) at your Tandava studio. This will be an optional extra once available.

If you'd rather run everything on your own domain and infrastructure from day one, that's the self-hosted path — it needs a developer. See [DEPLOYMENT.md](../../DEPLOYMENT.md).

**What you need to know about Stripe:**
- Stripe charges a standard processing fee (typically 2.9% + $0.30 per transaction)
- Payouts go directly to your linked bank account on Stripe's schedule
- Members can manage their own billing through Stripe's Customer Portal
- You can view transactions, issue refunds, and manage disputes in your [Stripe Dashboard](https://dashboard.stripe.com)

### Step 3: Create Your Schedule

Go to **Schedule** → **Add Class**:
- Set the class title, style, and level
- Assign an instructor
- Set date, time, and duration
- Set capacity (how many students)
- Set pricing (drop-in price, or include in membership)
- Optionally set up recurring classes

### Inviting Your Team

You can invite staff during the wizard's **Staff** step, or any time afterward from **Teachers** / **Settings**. Each person you add by email receives an invitation to join your studio with the role you choose:
- **Admin** — Can manage schedule, members, and instructors
- **Instructor** — Can view their own class analytics
- **Front Desk** — Can check in members and manage waitlists

### Step 5: Set Cancellation Policy

Go to **Settings → Cancellation Policy**:
- Write your policy (e.g., "Cancel at least 2 hours before class for a full refund")
- This is displayed to members when they book

## Day-to-Day Operations

### Checking In Members

Your front desk staff can access the check-in screen at **Front Desk** (from the user menu):
1. Search for the member by name or email
2. Click to check them in
3. Walk-ins can be handled as drop-in bookings

### Managing Waitlists

When a class reaches capacity, additional bookings go to the waitlist:
- If someone cancels, the next person on the waitlist is automatically promoted
- They receive an email notification when moved from waitlist to confirmed
- Staff can manually promote from the waitlist in the **Front Desk → Waitlist** screen

### Reading Messages

Your **Inbox** has three tabs:
- **Inquiries** — Messages from visitors who haven't signed up yet
- **Member Messages** — Messages from logged-in members
- **Class Feedback** — Post-class feedback from students

## Pricing Options

You can offer three types of pricing:

| Type | How It Works |
|------|-------------|
| **Drop-in** | One-time purchase for a single class |
| **Membership** | Recurring subscription (monthly/annual) for unlimited classes |
| **Class Pack** | Pre-paid bundle (e.g., 10-class pack) — deducted per booking |

Configure these in **Settings → Payment Setup** after connecting Stripe.

## Getting Help

If you need help with your studio setup:
- Go to **Settings → Need Help?** → **Contact Platform Support**
- Your platform administrator will receive your message and assist you
