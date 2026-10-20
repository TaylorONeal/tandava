# Tandava in the app stores: two apps, one backend

Current status (October 20, 2026): **Member and Studio 1.0 (2) build and launch in the iPhone simulator; both unsigned Release archives pass. Neither app is uploaded or submitted.** Native projects are on review PR102. Signed device builds, reviewer role acceptance, account-deletion fulfillment and final store assets remain open. See the dated checkpoints below.

Historical planning baseline (October 8): bundle IDs were registered, before the native projects were implemented. Cross-app launch tracking lives in the private `app-launch-playbook` repo ([store brief](https://github.com/TaylorONeal/app-launch-playbook/blob/main/prds/P3-TANDAVA-STORES.md), [decisions](https://github.com/TaylorONeal/app-launch-playbook/blob/main/DECISIONS.md)); release acceptance uses its [final launch checklist](https://github.com/TaylorONeal/app-launch-playbook/blob/main/03-OPERATING-TEMPLATES.md#8-final-launch-checklist).

**2026-10-19 checkpoint:** Hosted cancellation and assigned-teacher controls are released (PR100; see [progress](../plans/PROGRESS.md)). Sandbox payment acceptance and signed-in role walkthroughs remain open. No native project, device-tested release, store-ready screenshot set or store submission was verified. Keep member and Studio screenshot/walkthrough packets separate; use [the existing screenshot brief](screenshots/README.md), checking current platform requirements when producing assets.

This file replaces the per-studio white-label guide (archived as `ARCHIVED-white-label-guide.md`).

## Submission target and verified starting point — 2026-10-19

Taylor's current target is **submit both apps by October 20, 2026 (Asia/Makassar / Bali)**, contingent on passing QA and accurate store material. This supersedes passive deferral of store execution; it does not turn hosted web checks into native acceptance.

Targeted read-only Apple API inspection on October19 returned no App Store Connect app records for either `com.tandava.app` or `com.tandava.studio`. The registered bundle resources **WJF8DWPMZW** and **Q29237U4L4** exist; these are bundle IDs, not App Store app IDs or build IDs. No uploaded candidate or submission version is available through those bundles. Actual local repositories `tandava`, `tandava-independent-20260916`, and `tandava-blog-game` have no ios/android directories or Capacitor configuration. This agrees with the current released main, not just an old plan statement.

Critical path: implement the already-planned two Capacitor role-specific apps → create the two App Store Connect records under existing registered IDs → produce signed candidates using the existing authorized signing setup → install and verify real device member/Studio journeys, auth/deep links/persistence and actual native value → capture separate truthful screenshots/walkthroughs → finish metadata/privacy/reviewer access → submit only passing candidates. New paid build capacity, credentials, security grants or agreements need their own authorization; none were created by this inspection. No native build or submission was attempted.

## The two apps

| | **Tandava** (members) | **Tandava Studio** (owners and staff) |
|---|---|---|
| Bundle id / package | `com.tandava.app` | `com.tandava.studio` |
| Apple bundle id registered | Yes, Oct 8 2026 (`WJF8DWPMZW`) | Yes, Oct 8 2026 (`Q29237U4L4`) |
| Play package | Claimed at first AAB upload | Claimed at first AAB upload |
| Who | Students booking classes | Owners, front desk, teachers |
| Core | Find your studio, schedule, book, pay drop-ins, passes, check-in QR, cancel | Schedule, roster, check-in, payments setup, reports |
| Price | Free | Free download; studio pays hosting off-store |
| In-app purchase | None. Classes, packs and memberships are real-world services (App Store 3.1.3(e)); Stripe stays | None. B2B SaaS billed on the web |

Why the plain `com.tandava.app` goes to the member app: it is the listing people search for. The qualifier goes on the smaller-audience tool.

Why not white-label: one listing, review cycle and screenshot set per studio forever, plus Apple's 4.3 duplicate-app rule. A studio gets its own page, logo and colors inside the member app instead (below).

## "Feels like the studio's own app" without being one

The member app opens straight into a studio when the person came from that studio's link. Same effect as a branded app for the member, one listing for us.

### 1. Links that open the app (installed)

The storefront URL is the deep link. No new URL shape:

| Link a studio shares | Opens in the app | Without the app |
|---|---|---|
| `https://<host>/s/<slug>` | That studio's page, studio colors and logo | Web storefront (works today) |
| `https://<host>/s/<slug>/book/<occurrenceId>` | That class, ready to book | Express Booking on the web (PRD-020) |
| `https://<slug>.<root-domain>/` (when subdomains are on) | That studio's page | Web storefront |

Needs: `public/.well-known/apple-app-site-association` (paths `/s/*`) and `public/.well-known/assetlinks.json`, served as JSON with no redirect, plus the Associated Domains entitlement and Android intent filters in the native shells. Universal links only open the app from a tap in another app (Instagram, Messages, email), not from typing the URL, which is fine for how studios share.

Note: `docs/architecture/MOBILE_ARCHITECTURE.md` proposes `https://[studio].tandava.app/class/{id}`. Use the real routes above instead; one URL shape for web and app.

### 2. Links before install (the harder half)

Neither store passes a URL through a fresh install by default. Plan, cheapest first:

1. **Web first, app second.** The link always works on the web (storefront, Express Booking), so nobody is blocked by not having the app. The page offers the app after a booking, not before it.
2. **Smart App Banner** on `/s/*` pages: `<meta name="apple-itunes-app" content="app-id=…, app-argument=<current URL>">`. Opens the app at that studio when installed.
3. **Android:** Play Install Referrer carries `referrer=studio%3D<slug>` from the Play link through install. The app reads it on first launch and opens that studio. Free, first-party.
4. **iOS first launch:** "Find your studio" with search, plus a short studio code or the studio's QR (front desk poster). No fingerprinting, no paid deferred-link SDK.
5. A member who belongs to several studios gets a studio switcher (data model already allows it; UI does not exist).

### 3. Per-studio look inside one app

Studio page and booking screens take `studios.primary_color` and logo (already on the storefront). App icon and store listing stay Tandava. That keeps us clear of 4.3 while the member mostly sees their studio.

## Guest booking and account conversion

Express Booking (PRD-020) lets someone book a drop-in or free class with name and email, no password. The account step comes after the booking:

- In the form: optional "Save my details for next time" checkbox.
- After booking (and after returning from Stripe): a "Save your details" card. It emails a link to set a password on the same address. The link proves the person controls the mailbox before a password is attached to the identity the public form created.
- `/auth/reset-confirm?claim=1` sets the password and marks the profile claimed (`is_guest = false`, `claimed_at`).
- "Sign in and book now" returns to the same class after sign-in (`?next=`), including Google sign-in.

In the member app the same flow applies: guest booking for a first class, then the account nudge. Sign in with Apple becomes mandatory once Google sign-in ships in the iOS app (guideline 4.8).

## Gates before store work starts

1. Pilot studio live on the web (hosted product review gates: migrations verified, tenancy test, webhook idempotency, Express Booking launch gates in PRD-020).
2. Native shell choice. Recommendation: Capacitor, same as Purafield's shipped apps, with native schedule, booking, push, offline cache and check-in QR so the member app clears 4.2 (minimum functionality). `docs/architecture/APP_STORE_COMPLIANCE.md` has the checklist.
3. Seeded review studio in a real database plus two review accounts (member, owner). Demo mode personas cannot sign in, so they don't count.
4. Sign in with Apple wired (buttons exist, disabled).
5. AASA and assetlinks files, Associated Domains, Android intent filters.
6. Store listings, privacy labels, screenshots per app.

## Not decided here

- Production host for links (`tandavastudio.com` vs another domain). The app links have to match whatever the pilot ships on.
- Whether the owner app ships before or after the member app. Default: member app first (studios can run from the web; members expect an app).

### 2026-10-19 local implementation checkpoint (not a submission candidate)

`codex/native-two-apps` adds separate Capacitor 8 iOS source projects under
`native/member/ios` (`com.tandava.app`) and `native/studio/ios`
(`com.tandava.studio`). They bundle local web assets; no remote-server wrapper.
Member entry resolves to discovery / My Schedule; Studio resolves to login / the
permitted management or teacher workspace. Native builds offer first-party email
sign-in only; web social sign-in remains unchanged. Native sharing, an offline
banner and validated studio-link handling are implemented. Associated-domain
entitlements and cold-launch link delivery still require candidate testing.

Build with existing **public** Supabase configuration in the environment using
`npm run native -- member sync` and `npm run native -- studio sync`. No service
credential belongs in the bundle. Direct Vite builds performed without backend
configuration are compile-only artifacts, not usable release candidates.

Safety changes include auth-identity cache cancellation/clearing and stale-result
protection, removal of Sentry replay and email identification, and a native-only
block on Stripe checkout / guest checkout / portal calls. No IAP or verified
in-person-only product contract is present: native purchases must remain blocked
until the product catalog and payment flow have been reviewed. Existing-credit
and free signed-in booking paths remain available for verification.

Account deletion initiation is implemented with recent-authentication checks,
own-request RLS, sole-owner protection and durable status. The feature defaults
OFF. **This does not satisfy release acceptance yet:** implement and rehearse the
actual fulfillment/retention process in [the deletion runbook](../operations/ACCOUNT-DELETION.md)
before enabling it. Migration 00045 is local only and is outside the previously
approved 00043/00044 production release.

Remaining October 20 gates: public native config and CAPTCHA compatibility;
actual deletion fulfillment; paid/digital catalog policy; clean reviewer accounts
and observed member/teacher/manager journeys; persistence and offline recovery;
accurate privacy declarations; real candidate screenshots; app icon/launch assets;
ASC app records; signed SDK26+ archives and upload; device acceptance. Existing
bundle IDs alone are not ASC app records or uploaded builds. No store writes,
new credentials, paid native builds or legal acceptance occurred here.

#### Configured unsigned artifacts and verification receipt

Source `12c9e538ea7654e06c31fa5479d42902ba70521a`, built 2026-10-19,
Xcode 27.1 / `iphonesimulator27.1`, Debug, `CODE_SIGNING_ALLOWED=NO`.
Both configured targets report **BUILD SUCCEEDED**. Existing public publishable
Supabase and Turnstile settings were reused from the authorized deployment for
project `mkaixgjwakfufmmwembn` in ignored `.env.native.local`; no keys are recorded
here. These are simulator `.app` artifacts, not signed device/store archives.

| Artifact | Executable SHA-256 | Complete app-tree SHA-256 |
| --- | --- | --- |
| Member | `4354c8fececb26b371ac20f5cd286652003770e5a8e22ffeb6f22cb9a1024048` | `6156ea7468b55fa0da5129f7a63aa495b713aade6016464a4edd4bd4cf6f1bf1` |
| Studio | `9dd04d2a43d543cfc95a82ddee29270f6d9f7c76e38baf43f0e53823b231e7fb` | `6e946992e6a680068c0081fce46b4c5574e1065f34cc797ee02804064573883a` |

Tree hash: SHA-256 of newline-joined sorted `relative-path SHA256(file)` records,
with a trailing newline. Persistent workspace artifact paths are
`evidence/tandava/native/member/App.app` and
`evidence/tandava/native/studio/App.app` (under the parent task workspace, outside
the application repo). Both copied trees were rehashed and match the values above.
Workspace evidence: `evidence/tandava/native-candidates.json`.

| Check | Result and limit |
| --- | --- |
| Full JS suite | 43 files / 537 tests plus 32 script tests passed before the final isolated payment/telemetry tests were added. |
| Native routing/payment | 4 tests passed: member stays in member flow even with owner permissions; Studio manager/teacher/no-role routing; malicious deep links rejected; native ambiguous checkout blocked while web/other APIs remain enabled. These are deterministic tests, not logged-in device observations. |
| Auth cache | 3 adversarial tests passed: identity switch/offline clearing, late old-user request cancellation, same-user refresh preserving cache. |
| Deletion | 5 unit tests + 9 SQL checks passed; full disposable PostgreSQL suite passed. No real account deletion or production migration performed. |
| Telemetry | 2 tests passed: no initialization without DSN; configured monitoring has no replay integration and sends no email identity. |
| TypeScript/lint | Typecheck and focused changed-source lint passed. |
| Native compile | Both configured local simulator targets passed; no signing/upload. |
| Simulator installation/launch | **Uncertain installation / launch unverified.** After user-approved Xcode installation, device listing worked and iPhone17ProMax iOS26.2 `7DA5FDCC-3FF5-4800-A65F-64271F49BE38` boot completed. The subsequent chained install/install/launch command exited134 because `CoreSimulatorUtilities.framework/Versions/A/CoreSimulatorUtilities` was missing. Simulator.app was also absent from supported CUA inventory and Xcode's expected Applications path. No resets or repeated recovery attempted. |
| Actual member/teacher/manager workflows | Blocked by runtime installation and absence of approved existing reviewer/test identities. CAPTCHA compatibility, persisted results, plugin sharing and offline recovery remain unobserved. |

The temporary simulator-installation improvement supersedes the initial missing
`simctl` failure, but does **not** prove a complete runtime installation. Verify
installation completion and installed bundle state before retrying. Preserve
other apps/devices. Store icons/splash are generated scaffold defaults, not approved
brand assets. Dependency installation reported audit findings (23 total); no broad
`audit fix` or claim of completed dependency hardening was made.

### 2026-10-20 native launch verification

Apple API read returned no app records for either Tandava bundle. Existing bundle
registrations remain separate from App Store records. No App Review submission
or production SQL was executed.

Both existing 1.0(1) simulator apps now launch and render on iPhone 17 Pro Max,
iOS26.2. Member reaches configured discovery with no classes; Studio reaches
first-party email sign-in. Their executable hashes match the earlier configured
artifacts. This clears the old CoreSimulator launch blocker; it does not prove
signed-in booking, roster/check-in, or persistence acceptance.

A clean local checkout at aef28e8 plus a native discovery-copy correction was
rebuilt as 1.0(2) using the existing public configuration recovered from the
installed bundle. Both simulator targets compile successfully with SDK27.1.
The configuration is ignored and contains no service credential. Typecheck,
changed-file lint and ten focused native/auth-cache/telemetry tests passed.
The native copy no longer tells installed app users that no app is needed.

Owner access was restored and verified on October20: `purafieldstudio@gmail.com`,
Purafield Studio organization `nopyuyyzzvffhxlamsch`, project `tandava-prod` /
`mkaixgjwakfufmmwembn`. The Auth Users page now loads. Use the canonical account
and direct links in [Operator Setup](../OPERATOR_SETUP.md#existing-hosted-service-account-and-entry-points)
before asking for another login. Reviewer identities and seed acceptance remain
separate from dashboard access. No accounts or permissions were created.

Remaining acceptance: actual account-deletion fulfillment and approved hosted
rollout; native CAPTCHA and reviewer sign-in; member booking/reopen and Studio
teacher/manager roster/check-in; reviewed purchase scope; approved icon/launch
assets; App Store app records; existing-team provisioning for both new bundle
IDs; signed device candidates; accurate privacy and support details; separate
iPhone and iPad screenshot sets. Empty discovery and login captures are test
evidence, not a finished marketing set.

#### Listing copy staged for acceptance (not uploaded)

Keep these separate; confirm the corresponding signed-in native journey before
publishing its claims. Native checkout is intentionally unavailable in this
candidate, so these drafts make no purchase, payment, video or offline-booking claim.

| Field | Tandava Member | Tandava Studio |
| --- | --- | --- |
| Name | Tandava | Tandava Studio |
| Subtitle | Find classes. Plan practice. | Schedules, rosters, check-in |
| Description draft | Find participating yoga and movement studios, browse their classes, and keep your upcoming bookings together. Sign in with your existing studio account to manage your schedule. Class availability depends on participating studios. | Manage your studio day from your phone. View your teaching schedule and class rosters, and check in students with the access assigned by your studio. Sign in with an existing staff account; available tools depend on your role. |
| First screenshot captions | Find your next class; Your studio schedule; Your upcoming practice | Your teaching day; Class rosters; Student check-in |
| Required proof before publication | Reviewer sign-in, free/existing-credit booking, saved booking after process restart | Teacher and manager authorization, roster visibility, synthetic check-in and saved attendance |

Privacy URL: https://tandavastudio.com/privacy. Verify the live response and final
build data flows before populating Apple privacy declarations. Support contact
and reviewer credentials still need a verified owner-maintained handoff; never
put reviewer passwords in source.
