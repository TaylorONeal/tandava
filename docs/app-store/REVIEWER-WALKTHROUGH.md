# Member and Studio reviewer walkthrough — preparation, not acceptance

October 20, 2026. Applies to the two native apps on draft PR102. This document is
an internal execution packet. Do not paste it into App Review as completed notes
until the actual uploaded candidate passes each required journey.

## Candidate and environment record

| Field | Verified value / remaining work |
|---|---|
| Member bundle | `com.tandava.app` |
| Studio bundle | `com.tandava.studio` |
| Local candidates |1.0 (2), signed development builds and App Store exports; simulator launch observed |
| Source changes after export | Discovery empty/error guidance changed after build2; rebuild before accepting that screen in a store candidate |
| Upload / App Store IDs | NOT RUN / absent at latest API check. Creating records and conditional binary validation/TestFlight transmission are approved. This does not approve public App Review submission. |
| Runtime | Intended existing backend; no hidden review-only backend or post-review switch |
| Identities | Member, assigned teacher and owner must each be verified against existing synthetic Auth identities; none is established by the local browser mocks |
| Credentials | Enter directly in the store's secure review-information fields after verifying each account; never put passwords in this repo, screenshots, logs or chat |
| Current acceptance | All physical authenticated journeys below NOT RUN; successful CI does not change that status |

Before any hosted write, confirm the authorized synthetic record bounds, inspect
outbound hooks, resolve real Auth UUIDs and reconcile prior writes. Do not create
credentials, grant real tenants new access or seed fixtures into production as a
shortcut. Existing local SQL fixtures belong only in disposable PostgreSQL.

## Resolve the synthetic studio's booking-page prerequisite

The prepared private seed manifest sets `discoverable=false` and does not set
`page_live`. In the actual schema, `page_live` defaults to false (migration00038).
`get_studio_storefront`, `get_public_schedule` and `get_public_occurrence` all require
`page_live=true`; a signed-in reviewer or direct URL does not bypass that gate.
Therefore the proposed seed, unchanged, cannot establish the Member booking journey.

Discovery listing and public booking-page access are separate choices. An approved
unlisted but public synthetic booking page (`page_live=true`, `discoverable=false`)
could support the normal direct-link path, but the page and its published class
facts would be publicly readable to anyone with the URL. Confirm that scope before
publishing it, or use an already-approved pilot page. Do not silently expose a page,
weaken RLS, add reviewer exceptions or fake inventory to make a test pass. A truly
private studio needs a separately specified ordinary member-access feature.

Record the verified studio slug and exact future class URL after setup. Check its
contents as signed-out, Member, Teacher and Owner, and confirm it stays absent from
Discover when unlisted. Keep all names and class details visibly synthetic.

## Tandava Member

1. Install the identified signed candidate while preserving existing data. Record
   install origin/version, OS and device. Launch without authentication. Discover
   must show the actual public inventory or an honest empty/error state; no sample
   studios or signup-to-unlock promise.
2. Sign in with the verified Member account using email. Confirm that no Owner or
   Teacher authority appears. Password recovery/deep links need their own controlled
   email test; do not use the operator's personal account.
3. Open the verified studio/class through the app's supported navigation or a
   validated app link. Confirm that the link actually stays in the native app.
   Browser success does not prove native deep-link delivery. If no path exists,
   record a failure and repair the normal user flow before submission.
4. Select an authorized future free class or use the synthetic class pack. Confirm
   price/credit use, studio time zone, location and cancellation terms before booking.
   Book once; wait for server confirmation. Repeated taps must not create another
   booking or consume another credit. A timeout requires status reconciliation.
5. Open My Schedule, match the class and confirmed status, fully close the process,
   reopen and find the same booking. Record actual server and app observations.
6. Cancel only the authorized synthetic booking. An error must preserve the visible
   booking; success must follow server confirmation and the documented credit rule.
7. Sign out and verify private schedule data disappears. Reopen signed out and verify
   the prior member's data remains inaccessible. Test another synthetic account
   separately for cache/tenant isolation.

Current limitation: native paid checkout, guest express checkout and Stripe portal
are blocked by `blocksNativePayment`; first-party email is the native sign-in path.
Do not promise reviewers that paid checkout, social login or a complete deletion
flow works in this candidate. Resolve product/release scope before submission.

## Tandava Studio — Teacher

1. Sign in as the verified assigned Teacher, without owner/admin privileges.
2. Open the teaching schedule and the authorized synthetic class roster. Confirm
   another tenant's classes and an unassigned teacher's roster are unavailable.
3. Check in the one authorized synthetic confirmed booking. A waitlisted person
   must not become checked in through this action. Verify server status, close and
   reopen, and confirm attendance persists.
4. Exercise a failed request/retry in the controlled test environment. Verify a lost
   response is reconciled from the roster and is not counted as a second mutation.
5. Sign out. Verify no privileged data persists and that a Member cannot enter the
   teacher portal by direct navigation.

## Tandava Studio — Owner

1. Sign in as the verified Owner of only the authorized synthetic studio(s).
2. Open Classes and pricing, edit the synthetic offering, save and reopen. Confirm
   values and currency; verify another studio's offering cannot be changed by ID.
3. Open Weekly schedule, add an authorized synthetic recurrence, confirm duration,
   studio time zone and generated occurrences. Repeated submission must not duplicate
   the schedule. Do not cancel a class if notification side effects are unverified.
4. Confirm the assigned Teacher and Member have only their intended privileges.
   Review account identities and role grants against the backend; a role label in
   the UI is not sufficient evidence.
5. Reopen the app and verify saved data. Sign out and verify private data is cleared.

## Evidence and submission handoff

For each journey record: candidate hash, version/build, OS/device, account role,
synthetic record IDs, step, expected result, observed result, PASS/FAILED/NOT RUN,
private evidence path and blocker. Do not capture real members or passwords.
Keep Member and Studio screenshots and walkthrough videos separate.

Remaining P0 gates: verified review identities and reachable studio page, physical
role journeys, native authentication/link delivery, complete account-deletion
fulfillment/retention/recovery, accurate payment scope and privacy declarations.
Use `docs/testing/RELEASE-RISK-PLAN.md` for the broader matrix. Profile scrubbing,
mocked browser tests, a signature check or an uploaded binary do not close these gates.
