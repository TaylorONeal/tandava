# Tandava Detailed FAQ

In-depth answers for operational edge cases and complex scenarios. This document covers the nuanced questions that come up once your studio is live and running. For general questions, see [FAQ.md](FAQ.md).

---

## Scheduling Edge Cases

### What happens if a teacher calls in sick?

When a teacher is unavailable, you create a schedule override on the specific class occurrence with the override type set to `sub`. You assign a substitute teacher, and the system records the original teacher, the sub, the reason, and the timestamp. The original teacher remains linked via the `original_teacher_id` field on the class occurrence so payroll and reporting stay accurate. Students who have already booked can be notified of the teacher change, and the notification status is tracked on the override record.

### How do recurring schedule rules work with holidays?

Schedule rules define ongoing patterns (weekly, biweekly, etc.) with an effective date range (`effective_from` and `effective_until`). When a holiday falls on a scheduled day, you have two options: cancel the specific class occurrence that was generated for that date, or deactivate the schedule rule for a short window and reactivate it afterward. Cancelling individual occurrences is usually the cleaner approach because it preserves the rule and only affects the specific dates you choose. For studios that close for extended periods, you can set `effective_until` to pause generation entirely and create a new rule when you reopen.

### Can I override a single occurrence without changing the whole series?

Yes. This is exactly what the schedule overrides system is for. Each class occurrence is its own database record, even when generated from a recurring rule. You can create an override on any individual occurrence to change the teacher, room, start time, or end time -- or to cancel it entirely -- without touching the parent rule or any other occurrences in the series. The override records the type of change (`sub`, `cancellation`, `room_change`, `time_change`, `one_off`), the new values, the reason, and who made the change. See the `schedule_overrides` table in the `00001_initial_schema.sql` migration for the full data model.

### How does the waitlist work when a spot opens?

When a confirmed booking is cancelled or late-cancelled, a database trigger (`promote_from_waitlist`) automatically promotes the next student on the waitlist. The trigger selects the waitlisted booking with the lowest `waitlist_position` for that class occurrence, changes its status to `confirmed`, and clears the waitlist position. This happens at the database level, so it is immediate and consistent regardless of how the cancellation was initiated. The class occurrence's `booked_count` and `waitlist_count` are updated automatically by a separate trigger. The waitlist size per class is governed by the studio's `max_waitlist_size` setting.

### What happens if a class gets cancelled after students have booked?

When you cancel a class occurrence (setting `is_cancelled` to true with a reason), all existing bookings for that occurrence need to be addressed. Students with confirmed bookings should be refunded or credited depending on their payment source: membership classes are restored to the cycle count, class pack bookings restore the class to the pack balance, and drop-in payments are refunded through Stripe. The system tracks the cancellation reason and timestamp on both the class occurrence and each affected booking. Notifications can be sent to all booked students. For a detailed walkthrough, see [Class Cancellation Workflow](workflows/class-cancellation.md).

---

## Membership Complexity

### Can a student have multiple active memberships?

Yes. The data model does not enforce a one-membership-per-student constraint. A student could hold an unlimited monthly membership at one location and a class pack at another, or carry two memberships scoped to different offering types. When a student books a class, the booking records which specific membership or class pack was used as the payment source via the `membership_id` or `class_pack_id` field on the booking. Studio admins should design their membership types with clear scoping (by location or offering) to avoid confusion about which membership covers which classes.

### What happens when a membership auto-renews but the card declines?

When a recurring Stripe payment fails, the membership status transitions to `past_due`. The system logs a `membership.payment_failed` event to the event log, which can trigger webhook notifications to your CRM or email tool. Stripe's built-in retry logic will attempt the charge again according to your Stripe account's retry schedule. The membership record tracks the Stripe subscription ID and payment method ID, so you can see exactly which payment method failed. If all retries fail, the membership can be moved to `cancelled` or `expired` depending on your studio's policy. Students retain access during the `past_due` window to avoid disrupting their practice while the payment issue is resolved.

### How do membership upgrades/downgrades work mid-cycle?

Membership changes mid-cycle are handled by cancelling the current membership and creating a new one with the desired membership type. The `current_period_start` and `current_period_end` fields on the membership record define the billing cycle boundaries, so you can prorate by calculating the unused portion of the current cycle. On the Stripe side, subscription updates handle proration automatically when you switch the subscription to a new price. The old membership record preserves the full history (started date, cancelled date, cancellation reason), and the new membership starts its own lifecycle. This approach keeps the audit trail clean and avoids ambiguity about which terms applied during which period.

### Can I offer family or couple memberships?

The current data model associates each membership with a single profile. To offer family or couple plans, the recommended approach is to create a membership type priced for the group (for example, "Family Unlimited") and assign individual memberships of that type to each family member. This keeps booking, attendance, and check-in tracking accurate per person. Tags on the `studio_members` records (for example, tagging two profiles as "Smith Family") let you group related accounts for administrative purposes. A dedicated household or family entity is on the roadmap for a future release.

### How does the system handle membership freezes during studio closures (e.g., holidays)?

Studio-wide closures are distinct from individual membership pauses. For a studio closure, the recommended approach is to pause all affected memberships in bulk and set `pause_extends_billing` to true on the relevant membership types, which shifts the billing cycle end date forward by the duration of the pause. Each pause is recorded in the `membership_pauses` table with the reason (for example, "Holiday closure Dec 23-Jan 2"), the scheduled resume date, and who initiated it. The `membership_pause_status` tracks whether each pause is active, ended, or cancelled. When the studio reopens, pauses can be ended individually or in bulk, and billing resumes from where it left off.

---

## Financial Edge Cases

### How are partial refunds handled?

The transactions table tracks both the original `amount_cents` and the `refunded_amount_cents` as separate fields. A partial refund increments the `refunded_amount_cents` without replacing the original amount, and changes the transaction status to `partially_refunded`. The Stripe refund ID is recorded for reconciliation. You can issue multiple partial refunds against the same transaction as long as the total refunded does not exceed the original amount. This design means your financial reports can distinguish between full refunds, partial refunds, and unrefunded transactions without ambiguity.

### What happens if a promo code is used on a membership that later gets cancelled?

The promo redemption is a permanent record -- it captures the original amount, the discount amount, and the redeemed-at timestamp, linked to both the promo code and the transaction. If the membership is later cancelled and a refund is issued, the refund is processed against the transaction (the amount the student actually paid after the discount), not the pre-discount price. The promo code's `current_uses` count is not decremented on cancellation, because the code was validly used. If your studio policy is to restore promo uses on cancellation, that would be a manual adjustment to the promo code record. The `promo_redemptions` table in `00002_operational_workflows.sql` provides the full audit trail.

### How does payroll calculation work for teachers with mixed rate types?

Each staff member has a `pay_type` and `pay_rate_cents` or `pay_revenue_share_pct` configured on their `studio_staff` record. The `payroll_entries` table generates one entry per class occurrence per teacher, recording the pay type used, the base rate or revenue share percentage, and the calculated amount. For per-class teachers, the calculation is straightforward: flat rate per class taught. For revenue-share teachers, the entry includes the class revenue and attendee count so the percentage can be applied accurately. A teacher who works at your studio in different capacities (for example, teaching regular classes at a flat rate but leading workshops on revenue share) can have different pay configurations reflected in different payroll entries. The Reports page provides payroll summaries by teacher, date range, and pay period.

### Can I run financial reports across multiple locations?

Yes. Every transaction, booking, and payroll entry is scoped to a `studio_id`, and class occurrences are linked to a specific `location_id`. The Reports page can filter and aggregate by location, offering, teacher, or date range within a studio. Since all locations under one studio share the same database tables and the same RLS scope, cross-location reporting is a matter of query filters rather than data federation. The `analytics_daily` table also aggregates revenue, bookings, check-ins, and student counts at the studio level for fast dashboard queries.

---

## Multi-Location Management

### Can students book across locations with one membership?

It depends on how you configure the membership type. The `membership_types` table has a `locations` field (a text array). If the array is empty, the membership is valid at all locations. If you list specific location IDs, the membership is restricted to those locations only. This means you can create an "All Access" membership that works everywhere and a "Downtown Only" membership limited to a single location, and students will only see booking options that match their membership's location scope.

### How do I restrict certain memberships to specific locations?

Set the `locations` array on the membership type to include only the location IDs where it should be valid. The same mechanism works for class pack types, which also have a `locations` field. When a student attempts to book using a membership or pack, the system checks whether the class occurrence's location matches the allowed locations on the membership or pack. An empty array means "all locations," so leave it empty for unrestricted access.

### How do I handle teachers who work at multiple locations?

A teacher is a profile with a `studio_staff` record at the studio level, not the location level. This means any teacher on your staff can be assigned to classes at any of your locations. Schedule rules link a teacher to a specific offering at a specific location and time, so a teacher can have Monday morning classes at Location A and Wednesday evening classes at Location B. Payroll entries record the class occurrence (which includes the location), so reporting can break down a teacher's earnings by location.

### Can different locations have different pricing?

Pricing in Tandava is set at the offering level (drop-in price), the membership type level, and the class pack type level -- not at the location level directly. To offer different pricing by location, create location-specific membership types or class pack types with the appropriate `locations` restriction and price. For example, you could have "Monthly Unlimited - Downtown" at one price and "Monthly Unlimited - Suburbs" at a different price, each restricted to its respective location. Drop-in pricing is per offering, so if you need location-specific drop-in rates, create location-specific offerings.

---

## Data Migration

### What data can I import?

The CSV import tool supports five import categories: clients (students and members), classes (offerings and schedule), attendance (booking and check-in history), memberships and subscriptions, and transaction history. Each category has its own column mapping configuration. The `import_jobs` table tracks every import with file information, row counts, success and error tallies, and detailed error and warning logs in JSONB format. See the `import_field_mappings` table in `00001_initial_schema.sql` for the full list of supported source fields and target mappings.

### How do I map columns from my old system?

The import tool provides a column mapping interface where you match each column header from your CSV file to the corresponding Tandava field. For recognized CSV formats from common studio management systems, the system auto-suggests mappings based on known column header patterns. For any CSV format, you can create custom mappings manually. The `column_mapping` field on each import job stores your mapping as JSON, so it is preserved for reference and reuse. Transformation functions (like `to_date`, `to_cents`, `to_phone`, `to_lowercase`) are applied automatically during import to normalize data formats.

### What if my old system uses different field names?

The import system is designed to handle this. The `import_field_mappings` table pre-populates known column header variations from common export formats (for example, "First Name" versus "Client First Name" versus "first_name"). If your CSV uses headers that the system does not recognize, you map them manually in the import interface. You can also select the `generic_csv` source type, which skips auto-detection entirely and lets you build the mapping from scratch. The only requirement is that required fields (like name and email for client imports) are present somewhere in your file.

### Can I do a trial import before committing?

Yes. The import system supports a validation pass that processes your CSV and reports errors and warnings without writing any data to the main tables. The import job tracks `total_rows`, `processed_rows`, `success_rows`, `error_rows`, and `skipped_rows`, along with detailed error and warning logs. Review the validation results, fix issues in your CSV, and run the actual import when you are satisfied. The import status progresses through `pending`, `processing`, `completed`, `failed`, or `partial`, so you always know exactly where things stand.

### How do I handle duplicate student records during import?

The system matches imported student records against existing profiles primarily by email address (unique per profile). If an imported row matches an existing profile's email, the system updates the existing record rather than creating a duplicate. The `studio_members` table enforces a unique constraint on `(studio_id, profile_id)`, which prevents the same student from being added to the same studio twice. For records that cannot be matched confidently (for example, name matches but no email), the system flags them as warnings in the import job's `warnings` JSONB field for manual review. For a detailed walkthrough, see [Data Import Workflow](workflows/data-import.md).

---

## Integration and Customization

### How do I connect Tandava to my email marketing tool?

Tandava's integration registry supports connections to email marketing providers (Mailchimp, ConvertKit, SendGrid, Resend, and others). You add an integration in your studio settings, provide the provider-specific configuration (API keys, list IDs, audience segments), and select which events the integration should listen to. For example, you could subscribe your Mailchimp integration to `student.registered` and `membership.created` events so new students are automatically added to your email list. The integration tracks its last sync time and last error for troubleshooting. See the `integrations` table in `00002_operational_workflows.sql` for the full schema.

### Can I embed the booking widget on my existing website?

Tandava is a PWA (Progressive Web App) that can be linked from any website. The student-facing booking flow is URL-addressable, so you can link directly to your schedule, a specific class, or an event page. For deeper embedding, the Supabase REST API means you can build a custom booking widget in any framework and connect it directly to your Tandava backend. The landing pages feature also provides embeddable, SEO-optimized pages that function as standalone entry points with their own meta tags, content blocks, and conversion tracking.

### How do webhook events work?

When a significant action occurs in Tandava (a booking, a cancellation, a membership change, a check-in, a milestone, etc.), the system writes a structured event to the `event_log` table. If you have configured webhook endpoints, the system delivers the event payload to each subscribed endpoint via HTTP POST. Each request is signed with an HMAC secret unique to that endpoint so you can verify authenticity. The webhook endpoint record tracks total deliveries, total failures, last delivery time, and last failure reason. Webhook delivery uses a retry mechanism for failed deliveries.

### What events trigger webhooks?

Tandava defines a comprehensive set of event types organized by entity: booking events (`booking.created`, `booking.cancelled`, `booking.checked_in`, `booking.waitlist_promoted`), membership events (`membership.created`, `membership.renewed`, `membership.paused`, `membership.resumed`, `membership.cancelled`, `membership.expired`, `membership.payment_failed`), student events (`student.registered`, `student.first_class`, `student.milestone`), class events (`class.cancelled`, `class.teacher_subbed`, `class.spots_available`), transaction events (`transaction.completed`, `transaction.refunded`), and studio events (`studio.onboarding_complete`). You subscribe each webhook endpoint to the specific event types it needs -- there is no all-or-nothing requirement.

### Can I customize the student-facing app's branding?

Yes. Each studio record stores branding settings including `brand_primary_color`, `brand_secondary_color`, and `brand_font`. These values are applied to the student-facing PWA experience so your app reflects your studio's visual identity. Beyond these settings, because Tandava is open-source and built with Tailwind CSS and shadcn/ui, you have full control over the component library, theme configuration, and layout. You can modify the Tailwind config, override component styles, or build entirely custom UI components on top of the same Supabase backend.

---

## Security and Compliance

### How does multi-tenant data isolation work?

Tandava is a multi-tenant system where all studios share the same database tables but are isolated by Row Level Security (RLS) policies enforced at the PostgreSQL level. Nearly every table includes a `studio_id` column, and RLS policies ensure that queries only return rows where the `studio_id` matches a studio the authenticated user belongs to (via the `studio_staff` or `studio_members` join tables). This isolation is enforced by the database engine itself, not by application code, which means it cannot be bypassed by a frontend bug or a misconfigured API call. See the RLS policy definitions at the bottom of `00001_initial_schema.sql` and `00002_operational_workflows.sql` for the complete policy set.

### What is Row Level Security (RLS)?

Row Level Security is a PostgreSQL feature that attaches access policies directly to database tables. Each policy defines which rows a user can select, insert, update, or delete based on the authenticated user's identity. In Tandava, RLS policies check `auth.uid()` (the Supabase authenticated user ID) against the `studio_staff` and `studio_members` tables to determine what data each user can access. For example, the policy "Users can view own bookings" allows a SELECT on the bookings table only where `profile_id = auth.uid()`. Staff policies allow broader access scoped to their studio. Owner and admin roles get additional permissions for sensitive operations like managing integrations, webhooks, import jobs, and payroll.

### How are passwords stored?

Passwords are managed entirely by Supabase Auth, which uses bcrypt hashing. Tandava's application code and database tables never store, see, or handle raw passwords. The `profiles` table references the Supabase `auth.users` table by ID, but all authentication (login, signup, password reset, session management) is handled by the Supabase Auth service. This separation means password security is delegated to a well-audited, purpose-built authentication system rather than custom application code.

### Is Tandava GDPR compliant?

Tandava is designed with GDPR principles in mind. Student data is scoped and isolated per studio through RLS. Newsletter signups use double opt-in with explicit consent text, confirmation tokens, and IP address recording. Waiver signatures record the signer's full name, the exact version of the document signed, and the timestamp. All data tables support CSV export, which supports the right to data portability. For the right to erasure (deletion requests), the database uses cascading deletes on the profile foreign key -- deleting a profile cascades to studio memberships, bookings, transactions, and all associated records. Self-hosted studios are their own data controllers and should implement their own Data Processing Agreements and privacy policies appropriate to their jurisdiction.

### How do I handle a student's data deletion request?

Under GDPR's right to erasure, a student can request that their personal data be deleted. In Tandava, deleting a profile record from the `profiles` table triggers cascading deletes across all related tables: `studio_members`, `bookings`, `memberships`, `class_packs`, `transactions`, `credits`, `payment_methods`, `notifications`, `waiver_signatures`, `referrals`, `engagement_profiles`, `nudge_log`, and `milestone_achievements`. Before processing a deletion, export the student's records for your own compliance archives if required by your local regulations. Note that some records (such as anonymized transaction totals or aggregated analytics) may be retained in non-personally-identifiable form for financial reporting purposes. Studio owners should document their data retention and deletion procedures in their privacy policy.
