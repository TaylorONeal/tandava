# Tandava Studio 1.0: phase 1 scope and path to the App Store

Written November 5, 2026. Builds on draft PR #109 (`codex/app-store-excellence`), which
already carries both Capacitor apps. Canonical store state stays in
[STORE-APPS.md](STORE-APPS.md); this file is the scope and the gap list for the
**Tandava Studio** app (`com.tandava.studio`) only.

## Why Studio first can ship sooner than Member

The Studio app sells nothing. Studios pay for hosting off-store and members pay on the
web, so the Stripe money-proof gate (LP-1) and the in-app purchase questions that hold
up the Member app do not block Studio review. What Studio needs is real, native,
everyday utility (guideline 4.2) and an honest reviewer path.

## Decisions (who decided, when)

| Date | Decision | By |
|---|---|---|
| Nov 5, 2026 | Ship Tandava Studio phase 1 to the App Store as soon as possible, before the member app | Taylor |
| Nov 5, 2026 | Scan to check in is the core native feature for guideline 4.2 | Agent pick, in Taylor's brief |
| Nov 5, 2026 | iPhone only for 1.0; iPad in an update | Agent pick |
| Nov 6, 2026 | 1.0 is sign-in only; owners set up on the web, staff are invited | Taylor |
| Done Nov 6 | Migration 00052 (scan check-in) applied to tandava-prod (org Purafield Studio, id `mkaixgjwakfufmmwembn`) with `scripts/db/prod/apply-00052.sql`, verified with `verify-00052.sql` | Taylor's yes to 00050-00052. Prod was at 00044, so 00050 and 00051 are held: 00051 needs 00047, and 00046 to 00051 need review first |
| Open | Seed the synthetic review studio on production | Waits for Taylor's yes |
| Open | Submit for review | Waits for Taylor's yes |

GTM plan: Claude Doc "Tandava Studio 1.0 go-to-market plan". Store set and preview
plan: app-launch-playbook draft PR #12.

## Phase 1 scope

Who: studio owners, admins, front desk and teachers. iPhone only for 1.0 (iPad later;
adding iPad in an update is allowed, and it removes the 13-inch screenshot set now).

| # | Feature | State |
|---|---|---|
| 1 | Email sign-in only, role routing (owner to dashboard, teacher to teaching schedule) | Built in #109; sign-up removed from the Studio app in this PR |
| 2 | Teaching schedule (14 days) and class roster | Built in #109 |
| 3 | One-tap roster check-in, server-confirmed, lost-response reconciliation | Built in #109 |
| 4 | **Scan to check in**: camera scanner for the member's check-in pass, haptic confirm, works for front desk, owners and the assigned teacher | **This PR** |
| 5 | Member check-in pass (real QR) in My Schedule, web and member app | **This PR** |
| 6 | Weekly schedule, class and price edits | Built (LP-5), live surface narrowed in #109 |
| 7 | Share booking links through the iOS share sheet | Built in #109 |
| 8 | Offline banner, safe external links, account deletion request | Built in #109 (deletion switch off) |

Out of phase 1: account sign-up in the app, payments setup inside the app, reports, CRM, campaigns, retail, push,
Sign in with Apple (not required while sign-in is email only).

## Native value for guideline 4.2

The reviewer should see things a website can't do from the home screen:
camera scanning with the system scanner (`@capacitor/barcode-scanner`, official, SPM),
haptic success and error feedback (`@capacitor/haptics`), the native share sheet, and a
front-desk flow built for one hand at the door. Review notes must only claim what the
uploaded candidate does.

## Scan to check in: how it works

- Member pass: QR of `tandava:checkin:v1:<booking id>`. It is an identifier, not a
  credential. Screenshots of it only help someone get checked in for that one booking.
- Server: `check_in_with_pass(text)` (migration 00052). Owners, admins and front desk may
  check in any booking at their studio; teachers only bookings in their assigned classes
  (same rule as the roster). Anything else answers `not_found`, so a scan never reveals
  another studio's booking. Repeat scans answer `already_checked_in`. Attendance still
  goes through `check_in_booking`, recorded with method `qr_scan`.
- App: `/scan` (Studio app only). Entry points: a Scan passes card on the live dashboard
  and a button on the teaching schedule. Web visitors see a note to use the roster.
- Camera permission: `NSCameraUsageDescription` in the Studio app only. The member app
  does not include the scanner plugin (`includePlugins` in `capacitor.config.ts`).
- Tests: SCAN-01..13 in `supabase/tests/029_scan_check_in.test.sql`;
  `src/lib/checkin/*.test.ts`.

## Gap list to submission (Studio 1.0)

| # | Gap | Owner | Notes |
|---|---|---|---|
| 1 | App Store Connect app record for `com.tandava.studio` (name Tandava Studio, SKU `tandava-studio-ios`) | Taylor, in the store-accounts thread | Bundle ID registered Oct 8 (`Q29237U4L4`). Taylor confirmed Nov 6 the Apple Account is not locked |
| 2 | New signed candidate from #109 plus this PR | Mac (Xcode) | 1.0 (3) is stale. Xcode must resolve the new SPM packages (barcode scanner, haptics) and update `Package.resolved` |
| 3 | Migration 00052 on `tandava-prod` (org Purafield Studio, id `mkaixgjwakfufmmwembn`) | Done Nov 6 | Applied alone. 00046 to 00051 are not on prod and wait for review; Studio 1.0 needs none of them |
| 4 | Review studio and accounts | Taylor's yes, then seed | Synthetic studio with `page_live`, a verified owner, an assigned teacher and a member. Add an all-day synthetic class with a standing member booking during review week so a reviewer can scan any time (check-in only opens 60 minutes before class) |
| 5 | Studio sign-up in the app | Decided Nov 6 (Taylor): sign-in only | `allowsSignUp('studio')` is false: no sign-up link on sign-in, `/auth/register` redirects to sign-in, and the email sign-up call refuses. Owners set up on the web, staff are invited. Deletion fulfillment is not a Studio blocker |
| 6 | Privacy label | Prep | Contact info (name, email) linked to the user for app function; no tracking; camera frames are processed on device and not collected. Reconcile with Sentry and analytics in the candidate. Verified Nov 6: the scanner library (OSBarcodeLib, AVFoundation and Vision) has no network or photo-saving code, and the app sends only the decoded text |
| 7 | Listing: subtitle, keywords, description, support URL, privacy URL, category Business, age rating | Partly done | Nov 6: /support and the privacy camera section went live on main through PR 114 (Taylor's yes). App Store Connect record created (Apple ID 6831459731, SKU tandava-studio-ios) with promo text, description, keywords, subtitle, categories Business and Health & Fitness, support, marketing and privacy URLs saved. Then, on Taylor's yes: price free, United States only, age rating 4+, content rights (no third-party content), not a regulated medical device, App Privacy published, App Review contact and notes saved. Left: demo accounts (review seed), screenshots, build (`codemagic.yaml` workflow `studio-ios-testflight`, TestFlight only) |
| 8 | Screenshots: iPhone 6.9-inch set (1320 x 2868) | Mac capture, then `store-sets` engine | Set file: `app-launch-playbook/store-sets/set_tandavastudio.py` |
| 9 | App preview video (optional, recommended) | Mac recording | Shot list in the playbook store-sets folder |
| 10 | Physical iPhone acceptance of the Teacher and Owner journeys plus a real scan | Mac + iPhone | See [REVIEWER-WALKTHROUGH.md](REVIEWER-WALKTHROUGH.md) |
| 11 | Export compliance | Done here | `ITSAppUsesNonExemptEncryption = false` (HTTPS only) in both apps |

## Google Play

Not cheap yet. There is no Android project (`npx cap add android`), the target must be
API 36, and the Sidecraft Media personal Play account needs a closed test with 12 testers
for 14 days before production. Start the closed test as soon as an Android build exists,
because the 14 days are the long pole.
