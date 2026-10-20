# Data API permission correction (PR106)

**Review candidate only. Merge and production SQL require separate approval.**
No live privilege inventory, real account data, or deployed migration ledger was
queried by this work. The two excessive-read findings were reproduced only with
synthetic data in disposable local PostgreSQL16. Stripe account IDs are metadata,
not secret API keys; this review does not establish a live disclosure.

Supabase’s [official announcement](https://github.com/orgs/supabase/discussions/45329)
changes defaults for newly created objects; existing grants remain and RLS is
separate. The existing-table tightening in this PR is an additional reviewed
application decision, not something that announcement automatically applies.

## History and migration ownership

This candidate starts at main `c982696b82eef219d9877f4d977716ad08d47e9b`, including
PR107's `00045_data_api_grants.sql` and PR108's manual rollout bundle. Historical
00045 is unchanged. New **00046_runtime_api_privileges.sql** is a forward
correction; it is tested after the actual 00045, including an upgrade/reapply
probe. The old manual `apply-00045.sql` now fails closed rather than reopening the
broad privileges. Its verification companion is only a read-only inventory.

PR106 is independent of PR102. It contains none of PR102's native/deletion changes.
PR102's pending 00045/00046/00047 migrations still require their own ledger check
and renumbering before integration. This candidate reserves 00046, not those
unmerged deletion migrations. Duplicate versions now fail before a reset connects.
Coordination is recorded on [PR107](https://github.com/TaylorONeal/tandava/pull/107#issuecomment-6289255515).
The merged rollout-bundle PR is not proof that its SQL was executed.

## Exact permission effect

The forward migration normalizes table **and separately granted column** ACLs for
an explicit manifest of the 161 app-owned tables present through 00044. It revokes
all direct privileges held by PUBLIC, anon, authenticated and service_role on
those objects, then applies the runtime grants listed below. It does not iterate
arbitrary public tables. Objects outside the manifest, existing sequences,
schema grants, function grants and RLS policies are unchanged. Inherited role or
other creator/global default grants require a deployment preflight; this migration
does not claim to normalize them.

Of the 161 tables, 30 retain a direct API grant for at least one role; 131 retain
none for these grantees. Business Member, Teacher and Owner users share the
`authenticated` database role; existing RLS and role-checked RPCs distinguish them.
Definer RPCs continue accessing their underlying tables as their existing owner.
No new function EXECUTE grants are introduced.

- **anon:** INSERT messages only (public contact form); discovery remains RPC-based.
- **authenticated:** existing runtime reads on 16 tables, including five column
  projections below; catalog INSERT/UPDATE on five tables; column-limited profile
  and studio UPDATE; INSERT messages. No direct DELETE or booking/payment writes.
- **service_role:** direct SELECT on 27 tables, INSERT on 13, UPDATE on 17, DELETE
  only automation_sends and push_subscriptions. BYPASSRLS does not bypass ACLs.
  Transaction/booking fulfillment remains RPC-based.
- **Future objects:** removes the table/sequence default grants introduced by
  00045 for the executing migration creator in public. Run under the same creator
  as 00045. Future migrations must declare their required role/object grants.

Source evidence: browser calls in `src/lib/backend/supabase.ts` (including dynamic
catalog names and embedded relationships); settings projection in
`src/lib/hosted/studioSettings.ts`; direct server calls in
`supabase/functions/*/index.ts`. The SQL migration is the executable grant list.

### Sensitive projections

Authenticated SELECT on studios is limited to:
`id, name, slug, email, phone, website, timezone, currency, brand_primary_color,
brand_secondary_color, default_cancellation_minutes, late_cancel_fee_cents,
no_show_fee_cents, waitlist_enabled, max_waitlist_size, discoverable,
express_booking_enabled, page_live`.
The direct settings and schedule timezone queries need these fields; Stripe and
platform metadata are excluded.

Authenticated SELECT on refund_requests is limited to
`studio_id, occurrence_id, status`; class_cancel_notices adds `refund_told` to
those three columns. These cover schedule embeddings and outstanding-status
filters. Notice person/email/message/error details and refund payment/error
fields cannot be read directly, even by an owner using authenticated. Authorized
owner/admin/front_desk follow-up still uses `class_cancel_followup` and its existing
role assertion. Teacher attendance/schedule paths remain covered by tests.

The RLS dependency projections remain studio_staff
`studio_id, profile_id, role, is_active` and studio_members `studio_id, profile_id`.

Profile UPDATE is limited to `first_name, last_name, phone, pronouns,
date_of_birth, emergency_contact_name, emergency_contact_phone, instagram_handle,
is_guest, claimed_at`. Studio UPDATE is the SELECT projection above minus `id`
and `slug`. Catalog writes retain their existing RLS and validation triggers.

## Validation and boundaries

- Local PostgreSQL16.15, new private Unix-socket cluster with TCP disabled;
  isolated test database is created/dropped, server stopped on exit.
- All 46 migrations and all SQL suites pass, including tenant isolation,
  owner settings, teacher attendance, discovery, catalog edits, cancellation,
  booking/credits, payment RPCs, attribution and both concurrency races.
- Role tests execute as anon/authenticated/service_role. No blanket grants in
  test bootstrap. Two legacy RLS-only probes use narrow grants inside rolled-back
  transactions; those probes do not establish runtime privileges.
- Upgrade test reapplies actual 00045, injects legacy table/column grants, then
  runs 00046 twice. It proves excess grants removed, default grants removed,
  unrelated table ACL preserved, RLS retained, and correction repeatable.
- Regression tests deny member Stripe reads and teacher notice/payment detail
  reads; teacher schedule status and owner follow-up RPC succeed.
- Reset target guard rejects remote/query/override targets. Duplicate migration
  version regression passes before any DB connection.
- SQL equivalents of PostgREST joins are tested, **not real HTTP PostgREST** or
  provider calls. Several server mutation probes use zero matching rows and prove
  privilege availability, not provider-side behavior. Existing app UI/e2e CI
  checks use their configured test environment, not deployed permission proof.

Before any production approval: identify deployed ledger and object creators;
read table/column/default ACLs plus role memberships; reconcile PR102 separately;
verify hosted PostgREST behavior using an isolated synthetic Supabase environment
with this complete migration chain; review any out-of-repo consumers of the 131
RPC-only/ungranted tables. A production rollout may break undocumented direct
consumers: it intentionally removes their prior broad grants. No automatic SQL
rollout is configured in the inspected repo CI/build scripts, but external
integration settings have not been verified.

## Full retained runtime grant matrix

Columns in parentheses are column grants; all other entries are table grants.

| Table | anon | authenticated | service_role |
|---|---|---|---|
| `analytics_sessions` | — | — | SELECT |
| `automation_sends` | — | — | SELECT; UPDATE; DELETE |
| `automation_settings` | — | SELECT; INSERT, UPDATE | SELECT |
| `booking_attribution_context` | — | — | SELECT; UPDATE |
| `bookings` | — | SELECT | SELECT |
| `class_cancel_notices` | — | SELECT (studio_id, occurrence_id, status, refund_told) | SELECT; UPDATE |
| `class_occurrences` | — | SELECT | SELECT |
| `class_pack_types` | — | SELECT; INSERT, UPDATE | SELECT; INSERT; UPDATE |
| `class_packs` | — | SELECT | — |
| `consent_records` | — | — | SELECT |
| `event_pricing_tiers` | — | — | SELECT |
| `event_registrations` | — | — | SELECT |
| `events` | — | — | SELECT |
| `express_booking_claims` | — | — | INSERT |
| `import_jobs` | — | — | SELECT; INSERT; UPDATE |
| `locations` | — | SELECT | SELECT; INSERT; UPDATE |
| `membership_types` | — | SELECT; INSERT, UPDATE | SELECT; INSERT; UPDATE |
| `memberships` | — | SELECT | SELECT; UPDATE |
| `messages` | INSERT | INSERT | — |
| `offerings` | — | SELECT; INSERT, UPDATE | SELECT; INSERT; UPDATE |
| `profile_visitors` | — | — | SELECT |
| `profiles` | — | SELECT; UPDATE (first_name, last_name, phone, pronouns, date_of_birth, emergency_contact_name, emergency_contact_phone, instagram_handle, is_guest, claimed_at) | SELECT; INSERT; UPDATE |
| `push_subscriptions` | — | — | SELECT; DELETE |
| `refund_requests` | — | SELECT (studio_id, occurrence_id, status) | SELECT; UPDATE |
| `schedule_rules` | — | SELECT; INSERT, UPDATE | SELECT; INSERT; UPDATE |
| `studio_members` | — | SELECT (studio_id, profile_id) | SELECT; INSERT; UPDATE |
| `studio_onboarding` | — | — | SELECT; INSERT; UPDATE |
| `studio_staff` | — | SELECT (studio_id, profile_id, role, is_active) | SELECT; INSERT; UPDATE |
| `studios` | — | SELECT (id, name, slug, email, phone, website, timezone, currency, brand_primary_color, brand_secondary_color, default_cancellation_minutes, late_cancel_fee_cents, no_show_fee_cents, waitlist_enabled, max_waitlist_size, discoverable, express_booking_enabled, page_live); UPDATE (name, email, phone, website, timezone, currency, brand_primary_color, brand_secondary_color, default_cancellation_minutes, late_cancel_fee_cents, no_show_fee_cents, waitlist_enabled, max_waitlist_size, discoverable, express_booking_enabled, page_live) | SELECT; INSERT; UPDATE |
| `waiver_templates` | — | — | SELECT; INSERT; UPDATE |
