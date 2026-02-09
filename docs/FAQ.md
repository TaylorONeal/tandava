# Tandava FAQ

Frequently asked questions for studio owners and admins.

---

## Getting Started

### What is Tandava?

Tandava is an open-source studio management platform built for yoga, pilates, and movement studios. It handles scheduling, memberships, payments, student management, events, and growth tools -- all in one system that you own and control. The code is transparent, the data is portable, and you are never locked in.

### Who is Tandava for?

Tandava is designed for 1-3 location studios with small teams -- the kind of studios where the owner is often also the lead teacher, the front desk, and the bookkeeper. Whether you run a yoga shala, a pilates reformer studio, a barre studio, a martial arts dojo, or a wellness center, Tandava is built with your workflows in mind.

### Is Tandava free?

Yes. Tandava is free and open-source under the AGPL-3.0 license. You can use, modify, and deploy it without paying a license fee. If you self-host, your only costs are infrastructure (database hosting, a static file host, and Stripe transaction fees). Managed hosting options may be offered in the future for studios that prefer not to handle infrastructure.

### What is the difference between self-hosted and managed hosting?

Self-hosted means you run Tandava on your own infrastructure -- your own Supabase instance, your own static hosting (Vercel, Netlify, Cloudflare Pages, or any web server). You have full control over the database, the code, and the deployment. Managed hosting means a hosted service handles the infrastructure for you, so you just log in and use it. Both options give you full data ownership and export capability.

### What do I need to get started?

For local development and self-hosting, you need Node.js 18+, npm 9+, the Supabase CLI, and Docker (required by Supabase for local development). For production, you need a Supabase project (or self-hosted Supabase instance) and any static hosting provider for the frontend. No proprietary dependencies are required.

### How long does setup take?

If you are comfortable with the command line, you can have a local development environment running in under 10 minutes. The onboarding wizard then walks you through configuring your studio information, locations, offerings, schedule, pricing, staff, waivers, and payment processing step by step. For a detailed walkthrough, see [Onboarding Workflow](workflows/onboarding.md).

### Can I import my data from another system?

Yes. Tandava includes a CSV import tool with intelligent column mapping that recognizes common export formats from other studio management systems. You upload your CSV, map columns to Tandava fields (with auto-detection for common formats), and import students, teachers, class schedules, memberships, attendance history, and transactions. For a detailed walkthrough, see [Data Import Workflow](workflows/data-import.md).

---

## Studio Management

### How do I add a new location?

Navigate to Settings and add a new location with its address, rooms, and amenities. Each location is tied to your studio and can have its own schedule rules, capacity settings, and room configurations. You can designate one location as your primary location. For a detailed walkthrough, see [Location Setup Workflow](workflows/location-setup.md).

### How do I set up my class schedule?

Tandava uses a two-layer scheduling model: schedule rules define recurring patterns (such as "Vinyasa Flow every Tuesday at 9:00 AM"), and class occurrences are the individual instances generated from those rules. You create rules by selecting an offering, a location, a teacher, a recurrence pattern, a day and time, and an effective date range. The system generates occurrences automatically. For a detailed walkthrough, see [Schedule Management Workflow](workflows/schedule-management.md).

### How do I manage teachers and their pay?

Add teachers as studio staff with their role, pay configuration, and availability. Tandava supports multiple pay models: per-class flat rate, hourly rate, revenue share (percentage of class revenue), hybrid (base + share), tiered (rate varies by attendance), per-student, and combinations with bonuses. Payroll entries are generated per class occurrence and include attendee count and class revenue for calculations. For a detailed walkthrough, see [Teacher Management Workflow](workflows/teacher-management.md) and [Compensation Guide](guides/COMPENSATION_GUIDE.md).

### How do I track attendance?

Students check in to classes through the booking system. When a booking status changes to checked in, the system automatically updates the class occurrence counts and the student's attendance stats (total classes attended, last class date, lifetime metrics). Staff can also check students in manually from the class roster. For a detailed walkthrough, see [Attendance Tracking Workflow](workflows/attendance-tracking.md).

### Can I manage multiple studios from one account?

Tandava is built for multi-tenant operation. A single user profile can be associated with multiple studios in different roles (owner at one studio, teacher at another). Each studio has its own data, settings, and membership base, fully isolated by Row Level Security policies at the database level. You switch between studios from the management dashboard.

---

## Teacher Compensation and Payroll

### What pay models does Tandava support?

Tandava supports seven pay model types:

| Model | Description | Best For |
|-------|-------------|----------|
| **Per Class** | Flat rate per class taught | Simple, predictable budgeting |
| **Hourly** | Rate × class duration | Fair for varying class lengths |
| **Revenue Share** | Percentage of class revenue | Align teacher and studio interests |
| **Hybrid** | Base pay + revenue share | Balance security with incentives |
| **Tiered** | Rate varies by attendance | Reward popular classes |
| **Per Student** | Fixed $ per attending student | Fair for high-variability classes |
| **Per Student + Base** | Base pay + per-student bonus | Security plus growth incentive |

Additionally, any model can include attendance bonuses (extra pay when attendance hits a threshold) or fill-rate bonuses (extra pay when class reaches a capacity percentage).

### Which pay model should I use for my studio?

It depends on your studio's stage and style:

**Startup studios (<1 year):** Start with **per-class flat rates**. This keeps costs predictable while you build your class schedule and student base. You can renegotiate as you grow.

**Growing studios (1-3 years):** Move to **hybrid** models with a modest base plus a small revenue share (5-10%). This gives teachers skin in the game while limiting your downside.

**Established studios with strong attendance:** Consider **tiered** or **per-student** models that reward teachers for filling classes. Your highest-attended classes should compensate teachers accordingly.

**Hot yoga / high-volume studios:** **Per-student** often makes sense because class sizes vary dramatically (10 vs. 40 students). Paying per head ensures fairness.

**Workshop and training leaders:** Use **revenue share** (40-60%) since these teachers often bring their own following and handle their own marketing.

For detailed guidance, see the [Compensation Guide](guides/COMPENSATION_GUIDE.md).

### How do I change a teacher's pay rate?

Navigate to **Settings → Staff → [Teacher] → Compensation** and update their rate. You must specify an **effective date** for the new rate. Classes taught before that date use the old rate; classes on or after use the new rate. Historical payroll is never automatically recalculated—this protects both you and the teacher from surprises.

If you need to backdate a change (rare), the system will warn you about affected classes and require confirmation. All rate changes are logged in the audit trail.

### What happens if I change a pay model mid-pay-period?

The system handles this gracefully:

- Classes taught before the change date: paid at old rate/model
- Classes taught on/after the change date: paid at new rate/model
- Pay statement shows both with itemized breakdown

Example: If you change Maya's rate from $50/class to $60/class effective Feb 10, and the pay period is Feb 1-15:
- Feb 1-9 classes: $50 each
- Feb 10-15 classes: $60 each
- Statement shows both line items clearly

### Are my teachers employees or contractors?

**Most yoga teachers are independent contractors (1099)**, not employees (W-2). This is the industry norm and affects several things:

| Aspect | Contractor (1099) | Employee (W-2) |
|--------|-------------------|----------------|
| Tax withholding | Teacher handles own taxes | Studio withholds |
| Benefits | Not eligible | May be eligible |
| 1099 reporting | Required if paid >$600/year | W-2 instead |
| Overtime rules | Not applicable | Required >40hrs |
| Schedule flexibility | Teacher has more control | Studio sets schedule |

Tandava tracks worker classification per staff member. At year end, you can export 1099 data for contractors paid over $600. Consult your accountant or attorney for classification questions specific to your situation.

### How do I pay front desk staff?

Front desk and hourly staff work differently from teachers—they clock in/out rather than teach classes. Tandava offers three approaches:

1. **External time tracking (recommended):** Use dedicated tools like Homebase, Deputy, or When I Work. They handle clock-in/out, overtime, breaks, and labor law compliance. Export payroll data to Gusto/ADP.

2. **Shift-based scheduling:** Treat front desk shifts like "classes" with hourly pay. Schedule shifts, pay based on scheduled hours.

3. **Basic time entries:** Tandava can track simple clock-in/out, but dedicated time-tracking tools are better for compliance.

For most studios, option 1 is the right choice—time tracking is a solved problem with excellent specialized tools.

### How do I handle teacher tips?

Tips are tracked separately from base pay because they have different tax implications:

- Students can tip after class or from booking history
- Tips go directly to the teacher who taught (not the originally scheduled teacher if there was a sub)
- Tips are shown separately on pay statements
- Year-end tip totals are included in 1099 reporting

You can configure tip distribution: 100% to teacher (default), pooled among all teachers, or a custom split. Some jurisdictions have rules about tip pooling—check your local regulations.

### How do I export payroll for my bookkeeper?

Navigate to **Reports → Payroll** and select your pay period. Export options include:

- **Summary export:** One row per teacher with totals
- **Detailed export:** One row per class with full breakdown
- **Gusto/ADP format:** Formatted for direct import to payroll systems

Exports include pay model used, base rate, attendance, revenue (for share calculations), bonuses, tips, and totals. Your bookkeeper can reconcile every line item.

### Can teachers see their own earnings?

Yes. Teachers access their earnings dashboard at **/teach/earnings**, which shows:

- Current pay period accrual
- Breakdown by class with attendance and calculated pay
- Tips received (with optional student notes)
- Historical pay statements
- Year-to-date totals

Teachers can also download their pay statements as PDFs.

---

## Students and Members

### How do students sign up?

Students create an account through Supabase Auth (email and password, with support for social logins). When a student signs up, a profile is automatically created. When they book their first class or join a studio, they become a studio member with their own attendance history, membership records, and waiver status.

### What membership options can I create?

Membership types are fully configurable. You set the name, description, billing cycle (weekly, monthly, quarterly, or annual), price, and optional class limits per cycle. You can restrict memberships to specific locations or specific offerings. Each membership type can have its own trial period, auto-renewal settings, pause rules, and commitment terms.

### How do class packs work?

Class packs are prepaid bundles of classes. You define pack types with a class count, price, validity period (in days), and optional restrictions by offering or location. When a student purchases a pack, they get a set number of classes to use within the validity window. Each booking against a pack automatically decrements the remaining count, and the pack status updates to exhausted when all classes are used.

### Can students pause their membership?

Yes, if you enable it. Pause rules are configured per membership type and include maximum pause duration, maximum pauses per year, minimum active days before a pause is allowed, and whether the pause extends the billing cycle. Each pause is tracked with start and end dates, reason, and who initiated it. For a detailed walkthrough, see [Membership Pause Workflow](workflows/membership-pause.md).

### How do waivers work?

You create waiver templates with your liability and consent language. Waivers can be marked as required for booking, which means students must sign before they can reserve a class. Signatures are recorded with a timestamp, the signer's full name, IP address, and the specific waiver version they signed. If you update a waiver, the new version number ensures you know exactly what each student agreed to.

### How do I handle first-time guests?

Tandava offers several tools for new students: intro offers (first class free, trial packs, welcome discounts), guest passes (existing students can buy a class for someone else), and promo codes targeted at new students only. You can also track which students were referred and through which referral program. For a detailed walkthrough, see [New Student Workflow](workflows/new-student.md).

---

## Payments and Billing

### How does payment processing work?

Tandava uses Stripe Connect for payment processing. Each studio connects its own Stripe account, so payments go directly to you. The platform handles membership subscriptions, one-time purchases (class packs, drop-ins, workshops), and refunds through the Stripe API. Transaction records track the full lifecycle including amount, tax, platform fees, net amount, and Stripe references.

### What payment methods are supported?

Through Stripe, students can pay with credit and debit cards, Apple Pay, Google Pay, and bank accounts (ACH). Payment methods are stored securely per student per studio -- Tandava never stores full card numbers, only the Stripe reference, brand, last four digits, and expiration. Students can set a default payment method for recurring charges.

### How do refunds work?

Refunds are processed through Stripe and tracked in the transactions table with the refund amount, reason, and Stripe refund ID. The system supports both full and partial refunds. Refunded amounts are recorded against the original transaction so you always have a complete financial trail. For a detailed walkthrough, see [Refund Workflow](workflows/refunds.md).

### How do I set up promos and discounts?

Promo codes support three discount types: percentage off, fixed amount off, and free classes. Each code can be scoped to specific offerings, membership types, or purchase types (memberships, class packs, drop-ins, workshops). You can set usage limits (total and per student), date ranges, minimum purchase amounts, maximum discount caps, and whether the code is for new students only. For a detailed walkthrough, see [Promo Code Workflow](workflows/promo-codes.md).

### How do gift cards work?

You can issue gift cards with a set dollar amount, an optional recipient name and email, and a personal message. Each gift card has a unique redemption code and an optional expiration date. When a gift card is used for a purchase, the system deducts the amount and tracks the running balance. Gift card transactions maintain a full history of every redemption against the card.

---

## Events and Workshops

### How do I create a workshop or event?

Events are first-class entities in Tandava, separate from regular classes. You create an event with a type (workshop, training, retreat, immersion, series), detailed content (description, what to expect, who it is for, prerequisites), pricing, capacity, and teacher assignments. Events support rich media including cover images, galleries, and promo videos. For a detailed walkthrough, see [Event Creation Workflow](workflows/event-creation.md).

### Can I set up tiered pricing (early bird, etc.)?

Yes. Every event supports a base price, an early bird price with an end date, and a member-specific price. Beyond that, you can create custom pricing tiers for complex events -- for example, "Full Immersion," "Weekend Only," and "Audit" tiers for a training, each with its own price, member price, per-tier capacity, and specification of which sessions are included.

### How do multi-session trainings work?

For events that span multiple days or sessions (teacher trainings, immersions, series), you enable multi-session mode and define individual sessions with their own title, description, timing, location, and teacher. Registrations are tracked at the event level, and attendance is tracked per session. Students see which sessions they have attended, and staff can report on completion rates.

---

## Growth and Marketing

### How do landing pages work?

Tandava includes a landing page builder that lets you create SEO-optimized pages for your studio. Each page is composed of ordered content blocks (hero sections, text, schedule embeds, pricing tables, testimonials, calls to action, newsletter signups, teacher spotlights). Pages have full meta tag support (title, description, keywords, Open Graph images) and track views and conversions. The system also generates SEO recommendations to help you decide which pages to create.

### How does the newsletter signup work?

Newsletter signup forms can be embedded at multiple touchpoints: page footers, popups, checkout flows, event pages, landing pages, and booking confirmations. Every subscription records the source, supports double opt-in with a confirmation token, and stores explicit consent text for GDPR and CAN-SPAM compliance. Subscribers can select preferences (general updates, events, promotions) and unsubscribe at any time.

### What analytics does Tandava provide?

Tandava tracks analytics sessions with full UTM attribution (source, medium, campaign, content, term), referrer information, device type, and landing page. Sessions track page views, duration, and whether they converted (booking, signup, purchase, newsletter). Daily analytics are aggregated into a dashboard view with traffic, conversions, revenue, top sources, class fill rates, and new versus returning student counts.

### How do referral programs work?

You configure a referral program with rewards for both the referrer and the referred student. Reward types include account credits, free classes, and discounts. You can require that the referred student make a purchase before either reward is granted, and you can cap the number of referrals per student. Each referral generates a unique code, and the system tracks the full lifecycle from referral sent to reward granted.

### What are engagement nudges?

Engagement nudges are contextual, respectful messages triggered by student behavior -- for example, a reminder when a streak is at risk, a suggestion when a class pack is running low, or a note when a friend books a class. Every nudge is dismissible, frequency-capped (per week and per month with cooldown hours), and delivered through configurable channels (in-app, push, or email). Studios configure their own nudge rules and templates.

---

## Data and Privacy

### Who owns my data?

You do. Tandava is open-source and your data lives in your own database (your Supabase instance). There is no intermediary, no data licensing agreement, and no scenario where a vendor holds your information hostage. If you stop using Tandava, your data remains exactly where it is, fully accessible.

### Can I export my data?

Yes. Every data table in Tandava supports CSV export with standardized column names designed for maximum interoperability. You can export students, teachers, memberships, class packs, attendance, transactions, events, and any other data at any time. This is a core design principle, not an afterthought.

### How is student data protected?

Student data is protected by Row Level Security (RLS) policies enforced at the database level by Supabase (PostgreSQL). Students can only see their own profiles, bookings, memberships, and transactions. Studio staff can only see data for their own studio. Payment information is stored in Stripe, not in the Tandava database -- only tokenized references (last four digits, brand, Stripe IDs) are kept locally.

### What happens if I stop using Tandava?

Nothing changes about your data. Because Tandava runs on your own infrastructure (or your own Supabase project), stopping use of the software does not affect your database. Export everything as CSV, keep the database running, or migrate to another system. There is no account closure process that deletes your data, and no vendor to negotiate with.

---

## Technical

### What tech stack does Tandava use?

The frontend is React 18 with TypeScript, built with Vite, styled with Tailwind CSS, and uses shadcn/ui (Radix primitives) for accessible, composable UI components. The backend is Supabase, which provides PostgreSQL for the database, built-in authentication, file storage, and real-time subscriptions. Payment processing uses Stripe Connect. The application is PWA-first and can be deployed to any static hosting provider.

### Can I customize the look and feel?

Yes. Studio branding is configurable in the settings: primary color, secondary color, and font. These values are stored per studio and applied to the student-facing experience. Beyond branding settings, Tandava uses Tailwind CSS and shadcn/ui, which are designed for deep customization -- you can modify the theme, component styles, and layout as needed since you have full access to the source code.

### How do webhooks and integrations work?

Tandava provides an event-driven integration architecture. Every significant action (booking, cancellation, membership change, milestone, etc.) is logged to a structured event log. You can configure webhook endpoints that receive HTTP POST requests signed with HMAC for specific event types. You can also connect managed integrations (email marketing, CRM, advertising, accounting, calendar) through the integrations registry. For a detailed walkthrough, see [Integrations Workflow](workflows/integrations.md).

### Is there an API?

Tandava's backend runs on Supabase, which automatically exposes a full REST API and a real-time API for every database table, governed by the same Row Level Security policies that protect the web application. You can use the Supabase client libraries (JavaScript, Python, Dart, and others) or direct HTTP calls to read and write data programmatically. A dedicated public API layer is planned for a future release.

### How do I update to new versions?

Since Tandava is a standard Git repository with a Vite build, updating is a matter of pulling the latest changes from the upstream repository, running the database migrations (via the Supabase CLI), and rebuilding the frontend. Migration files are numbered sequentially and designed to be applied in order. Always review migration release notes before applying them to a production database.
