# Data API permission correction (PR #106)

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

PR #106 is independent of PR #102. It contains none of PR #102's native/deletion changes.
PR #102's pending 00045/00046/00047 migrations still require their own ledger check
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
- Real PostgREST16.5 HTTP over private Unix sockets now passes 34 checks,
  including the exact schedule embedding and status filters, Member profile
  PATCH, Teacher sensitive-column/RPC denials, Owner settings UPSERT and follow-up
  RPC, service-role reads/updates, and direct-write denials. Each server uses a
  fixed database role plus a fixture-only claims hook; no credentials/JWTs are
  created. This verifies HTTP authorization, **not hosted JWT sign-in** or
  external provider calls. Several server mutation probes use zero matching rows and prove
  privilege availability, not provider-side behavior. Existing app UI/e2e CI
  checks use their configured test environment, not deployed permission proof.

Before any production approval: identify deployed ledger and object creators;
read table/column/default ACLs plus role memberships; reconcile PR #102 separately;
verify hosted version/JWT behavior using an isolated synthetic Supabase environment
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

## Repeat the isolated HTTP checks

Install/use PostgreSQL and an official PostgREST executable, then run:

```sh
POSTGREST_BIN=/path/to/postgrest bash scripts/db-http-test.sh
```

Put PostgreSQL's `initdb`, `pg_ctl`, `createdb`, `psql` and Python3 on PATH. The
runner creates a new mode-0700 temporary directory, private PostgreSQL socket and
three private HTTP Unix sockets. It accepts no database URL, opens no TCP
listener, ignores inherited libpq routing options, creates no credentials, loads
all migrations plus synthetic fixtures, and stops all servers on exit. The
fixture hook is a test-support file, never an application migration. Do not load
it on a hosted project. The retained temporary logs/data are synthetic only.

HTTP denials in this no-JWT setup return 401 with SQLSTATE42501 because each
server uses its configured anonymous database role; they are checked as actual
permission failures, not accepted on arbitrary status/errors. A first UPSERT
returns 201; its conflict-update returns 200 in PostgREST16.5. Both persisted
values are checked. Hosted auth/session behavior remains separate.


## October 21 local release integration and endpoint corrections

PR #106's scoped-grant source is now integrated locally with main and native PR #102
on `codex/app-store-excellence`; no remote merge or production SQL occurred.
Deletion migrations were renumbered 47–49 after grants 46. The integrated disposable
SQL suite passed, including the privilege tests and deletion/capacity/credit races.
Prior PostgREST HTTP 34-check evidence above remains scoped to its original PR #106
revision, not the new native integration or hosted JWT acceptance.

Additional source findings were reproduced with isolated mocks and corrected:

| Risk | Correction | Regression evidence |
|---|---|---|
| High: unauthenticated or ordinary-user generic email/SMS/push dispatch | Low-level sending endpoints require the trusted service bearer before reading/dispatching payloads. Existing in-repo express continuation service caller remains supported. Browser wrappers have no in-repo consumers; external consumers must be checked at rollout. | Actual handlers deny missing, member and forged-role credentials without provider calls; trusted synthetic service path works. |
| High: cross-studio shared-profile modification by CSV import | Existing profiles may gain the authorized studio-membership link but no imported global contact overwrite; only newly created profiles receive initial import fields. | Existing-person sentinel contacts remain unchanged; new-person initialization still succeeds. |
| High: inactive studio staff in privileged Edge handlers | stripe-connect, onboarding and import-members require active staff in the claimed studio and the appropriate role. | Inactive staff cannot reach service-backed mutation; authorized active paths preserved. |
| Medium: checkout/portal return redirect escapes | Parse then enforce the intended origin for relative paths, including stripped control characters; portal uses shared validation. | Malformed slash/tab/newline and external destinations fall back; valid application returns remain. |
| Broken returning-guest path | Register the continuation template and use the existing sign-in-with-return-to-class URL. No fake unconsumed token/expiry. | Template and actual handler tests verify the destination and best-effort provider error handling. |

These are source/synthetic findings; no live exploitation or customer impact was
established, and no test message was sent. Deployment needs separate review and
acceptance, especially trusted out-of-repository callers. `check:edge` now covers
all changed handlers including push; its namespace import matches the checked
module exports. Current exact checks/limits are recorded in PROGRESS.

The scheduled Stripe smoke failed before network activity because its test
credentials were absent. It also assumes direct service-role reads/cleanup of
financial tables that grants 46 deliberately removes. The integrated harness now uses a loopback-only, explicitly marked disposable
database adapter for fixed inspection/cleanup SQL; it does not restore runtime
privileges. Local regression and SQL checks pass. The scheduled workflow still
requires provisioned local Supabase fixtures and matching sandbox inputs before
it can run, and does not establish hosted provider delivery. See the maintained
[Stripe setup procedure](../developer/stripe-setup.md).
