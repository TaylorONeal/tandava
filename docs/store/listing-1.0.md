# Tandava Studio 1.0: store listing (paste-ready)

Drafted Nov 6, 2026. App: Tandava Studio, bundle `com.tandava.studio`, iPhone only, free. Scope: phase 1 in tandava PR 113 (stacked on PR 109). Only claims what that build does: scan to check in, roster check-in, teaching schedule (14 days), weekly schedule and price edits, sharing the booking link, offline banner. Nothing here is entered in App Store Connect.

Counts in [brackets] are characters, counted by script (all ASCII, so characters equal bytes).
Limits checked against Apple's App Store Connect help (promo text 170, description 4000, keywords 100 bytes, each keyword over 2 characters, no other app or company names), read Nov 6, 2026: https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information

---

## 1. App Store

### Name and subtitle

**Recommended (A)** bets on three terms: *check-in*, *yoga*, *scan*.

| Field | A (recommended) | B (brand only in name) |
|---|---|---|
| Name (30) | Tandava Studio: Class Check-In [30] | Tandava Studio [14] |
| Subtitle (30) | Scan yoga passes at the door [28] | Yoga class check-in and roster [30] |

Why A: the name field carries the most search weight, and "Tandava" alone earns nothing in search until people know it. "Class check-in" is the job; "scan" and "door" say why it's an app and not a website. The home-screen label stays "Tandava Studio" (`CFBundleDisplayName` in `native/studio/ios/App/App/Info.plist`), so the store name can carry keywords without changing the icon label.
Why B: cleaner brand, and "roster" moves up. Pick B if you want the store name to match the web brand exactly.

### Keywords (100, comma-separated, no spaces, no word already in name or subtitle)

A, with name and subtitle A [99]:
```
pilates,barre,front,desk,roster,attendance,teacher,instructor,schedule,staff,member,fitness,booking
```

B, with name and subtitle B [99]:
```
scan,pilates,barre,front,desk,attendance,teacher,instructor,schedule,staff,member,pass,door,fitness
```

Notes: "qr" is left out because Apple ignores keywords of 2 characters or fewer; "QR" lives in the description instead. No competitor brands. Singular forms. Script check: no duplicates, no overlap with name or subtitle.

### Promotional text (170, editable any time without review)

A (recommended) [139]:
```
The front desk in your pocket. Scan a member's pass with your camera, feel the buzz, and they're in. No pass? Tap their name on the roster.
```

B [145]:
```
Scan members in at the door with your camera. No pass? Tap the roster. Then move a class, update prices and share your link, all from your phone.
```

### Description (4000) [1537]

```
Check members in at the door in a second.

Tandava Studio is the staff app for yoga, pilates and barre studios that run on Tandava. Point your camera at a member's check-in pass, feel the buzz, and they're in. No clipboard. No laptop on the front desk.

SCAN THEM IN
- Tap Scan passes and point your camera at the member's pass.
- A green card and a quick buzz tell you they're checked in.
- Already in? The app says so and nothing changes. Keep scanning.
- Waitlisted, cancelled or too early? You see why right away.
- A running count shows how many people you've checked in.
- Front desk and owners can scan anyone booked at the studio. Teachers scan for the classes they teach.

NO PASS? TAP THE ROSTER
- Open the class and tap Check in next to a name.
- A check-in only shows as done once Tandava has saved it.

FOR TEACHERS
- See the classes you teach for the next 14 days.
- Open each roster to see who's coming.

FOR OWNERS
- See today's classes on one screen.
- Add classes to your weekly schedule and change times.
- Set drop-in, class pack and membership prices.
- Share your booking page from the iPhone share sheet.

MADE FOR THE DOOR
- Big buttons you can use with one hand.
- A clear banner when you're offline.

HOW IT WORKS
Tandava Studio is for staff at studios that use Tandava. Sign in with the email your studio invited. Studio owners set up their studio and invite staff from the Tandava dashboard on the web. Members show their check-in pass from My Schedule in Tandava.

Questions? Email hello@purafieldstudio.com.
```

### What's New, 1.0 [177]

```
Welcome to Tandava Studio. Scan check-in passes at the door, check people in from the roster, see your teaching week, edit your schedule and prices, and share your booking page.
```

### Category

- Primary: **Business**. Mindbody Business and Arketa Business App sit here; most other studio staff apps (WellnessLiving Elevate, Glofox Pro) sit in Health & Fitness, so Business is less crowded for these terms.
- Secondary: **Health & Fitness**.

### Age rating questionnaire (expected result: 4+)

Answers for Apple's age rating questions as updated in 2025. Confirm against the live form in App Store Connect > App > App Information > Age Rating.

| Question | Answer | Why |
|---|---|---|
| Parental controls | No | None in the app |
| Age assurance | No | None |
| Unrestricted web access | No | No general web browsing. App content is bundled locally (`server.hostname: 'localhost'` in `capacitor.config.ts`); outside links open in a system browser view (`@capacitor/browser`) |
| User-generated content | No | No public posts, comments or sharing between users in the app |
| Messaging and chat | No | None |
| Advertising | No | No ads SDK in `package.json` |
| Profanity or crude humor | None | |
| Horror or fear themes | None | |
| Alcohol, tobacco or drug use or references | None | |
| Medical or treatment information | None | Scheduling and attendance only |
| Health or wellness topics | None | Business tool; no health content |
| Sexual content or nudity / graphic sexual content | None | |
| Cartoon, realistic or graphic violence | None | |
| Simulated gambling, contests, gambling, loot boxes | None / No | |
| Made for Kids | No | Staff app |

### App Privacy (nutrition label)

Tracking: **No.** No ad SDKs, no IDFA, no data brokers. No App Tracking Transparency prompt needed.

Apple's rule: "collect" means sent off the device and kept longer than needed to answer the request (https://developer.apple.com/app-store/app-privacy-details/).

| Data type | Collected? | Linked to user? | Tracking? | Purpose | Code |
|---|---|---|---|---|---|
| Contact Info: Name | Yes | Yes | No | App Functionality | Staff profile; Account fields `firstName`, `lastName` in `src/pages/account/LiveAccount.tsx` |
| Contact Info: Email Address | Yes | Yes | No | App Functionality | Email sign-in, `src/pages/auth/Login.tsx` (Supabase Auth) |
| Contact Info: Phone Number | Yes (optional field) | Yes | No | App Functionality | `phone` field, `LiveAccount.tsx` |
| Contact Info: Other User Contact Info | Yes (optional) | Yes | No | App Functionality | `instagramHandle`, emergency contact, `LiveAccount.tsx` |
| Identifiers: User ID | Yes | Yes | No | App Functionality | Supabase account id; `checked_in_by` set to the scanning staff id (`supabase/migrations/00030_booking_integrity.sql`, used by `check_in_with_pass` in `00052_scan_check_in.sql`); Sentry user id (`setSentryUser` in `src/lib/sentry.ts`) |
| User Content: Other User Content | Yes | Yes | No | App Functionality | Class schedule, class and price edits an owner saves (`src/pages/manage/LiveOfferings.tsx`) |
| Other Data | Yes (optional) | Yes | No | App Functionality | `dateOfBirth`, `pronouns` fields in `LiveAccount.tsx` |
| Diagnostics: Crash Data | Yes, **only if** `VITE_SENTRY_DSN` is set in the Studio build | Yes (Sentry user id) | No | App Functionality | `src/lib/sentry.ts` (`initSentry`, `setSentryUser`) |
| Diagnostics: Performance Data | Same as above | Yes | No | App Functionality | `tracesSampleRate: 0.1` in `src/lib/sentry.ts` |
| Usage Data: Product Interaction | **Only if** `VITE_POSTHOG_KEY` is set | No (random visitor id, no name or email) | No | Analytics | `src/lib/funnelSink.ts`, wired in `src/main.tsx`. Recommend leaving the key unset in the Studio build: the funnel events are for public booking pages, so the label stays simpler |
| Camera / photos / video | **Not collected** | | | | The system scanner reads the QR on the device; only the decoded pass text (a booking id, `tandava:checkin:v1:<uuid>`) is sent. `src/lib/native/scanner.ts`, `src/lib/checkin/pass.ts`. That id belongs to the member, not the app user |
| Location, contacts, health, financial info, purchases, browsing history, search history | Not collected | | | | No such code in the Studio flows |

Cloudflare Turnstile runs on sign-in in the native build (tandava-prod requires it since Nov 2026; the app frames `https://tandavastudio.com/captcha-bridge.html`, PR 121). Add one row: **Diagnostics: Other Diagnostic Data**, collected, not linked to the user, not tracking, purpose App Functionality (Cloudflare's bot check reads device and browser signals). Apple counts third-party partners' collection too.

Data the member gives the studio (their name shown after a scan) is the studio's member data, covered by the privacy policy, not this app user's label.

### URLs

| Field | URL | Exists? |
|---|---|---|
| Privacy Policy URL | https://tandavastudio.com/privacy | Route exists (`/privacy` in `src/App.tsx`, text in `src/content/legal/index.ts`, updated Oct 10, 2026). The page is a client-side app, so a fetch shows only "Loading..."; open it in a browser to confirm. **Gap:** it doesn't mention the camera. Add one line: "The Tandava Studio app uses your camera only to read a member's check-in pass on your device. No photos or video are stored or sent." |
| Support URL | **None yet.** | No `/support` or `/help` route in `src/App.tsx`. Apple says the support URL must lead to real contact info. Options: add `https://tandavastudio.com/support` (contact email, Austin TX, short FAQ: how staff get invited, camera permission, how to delete an account), or add Tandava Studio to https://www.purafieldstudio.com/support, which today covers CueCraft, WakeState, JetSweep and Alpine Pack only. |
| Marketing URL (optional) | https://tandavastudio.com/for-studios | Route exists in `src/App.tsx` |

### App Review notes (paste into App Store Connect > App Review Information > Notes) [2820]

Fill every `<...>`. Put the Owner password only in the Sign-In Information password field, never in notes, files or chat. Attach a PDF with QR codes 1 to 3 (passes `tandava:checkin:v1:<booking id>` for three seeded bookings, made with `passFor()` in `src/lib/checkin/pass.ts`) and QR code 4 (any non-Tandava QR, for example one that says "hello").

```
Tandava Studio is the staff app for fitness studios that use Tandava (tandavastudio.com). Studio owners, front desk staff and teachers use it to check members in at the door and run the class week from a phone.

ACCOUNTS
The app is sign-in only. It has no sign-up and no account creation. A studio owner creates the studio on the web and invites staff by email, the same way staff are added in other business tools.

Demo accounts (synthetic review studio "<REVIEW STUDIO NAME>"):
- Owner (use this one first): <OWNER EMAIL>, password in the Sign-In Information fields above
- Teacher: <TEACHER EMAIL> / <TEACHER PASSWORD PLACEHOLDER>
- Member (for the pass, optional): <MEMBER EMAIL> / <MEMBER PASSWORD PLACEHOLDER>

HOW TO TEST THE SCAN (the core feature)
1. Sign in as the Owner. The dashboard opens.
2. Tap Scan passes. Allow camera access when asked.
3. Point the camera at QR code 1 in the attached PDF. You get a green "is checked in" card and a success vibration.
4. Scan QR code 1 again. You get "is already in" and a warning vibration. Nothing changes.
5. Scan QR code 4 (not a Tandava pass). You get "Not a Tandava pass".
QR codes 1 to 3 are passes for three synthetic members booked into "<REVIEW CLASS NAME>", an all-day class that runs every day of the review window so check-in is always open. (Check-in normally opens 60 minutes before a class starts.)
To see a live pass instead of the PDF: on any browser, sign in at https://tandavastudio.com as the Member, open My Schedule and tap Check-in pass, then scan the screen.

OTHER THINGS TO TRY
- Roster check-in: sign in as the Teacher, open the review class, tap Check in next to a name.
- Owner tools: Classes and pricing (edit a price and save), Weekly schedule (add a class), Share (opens the iOS share sheet).

NATIVE FEATURES
Camera scanning with the system barcode scanner, haptic success and error feedback, the iOS share sheet and an offline banner. The camera is used only to read the pass on the device. No photos or video are stored or sent.

PAYMENTS
There are no purchases, prices for the app or payment links in the app. The app is free. Studios pay Tandava for the business service on the web (guideline 3.1.3(c), sold to organizations for their staff). Class prices an owner edits are what the studio charges its own members for in-person classes.

ACCOUNT DELETION
<CHOOSE ONE BEFORE SUBMITTING>
(a) If the deletion switch is on in this build: Account > Delete account starts a deletion request in the app.
(b) If it is off: accounts are not created in this app. Staff can ask for deletion at hello@purafieldstudio.com, and the studio owner can remove staff from the web dashboard.

Contact: <REVIEW CONTACT NAME>, hello@purafieldstudio.com, <PHONE>
```

**Guideline notes behind these notes**

- **4.2 Minimum functionality (thin web wrapper).** Highest risk. The app is a Capacitor wrapper around the web app. Defense: the reviewer's first action is a camera scan with haptics, which a website on a phone can't do from the home screen. Keep step 2 to 5 short and first. Risks that remain: most owner screens look like the website; the "This tool is not available yet" page (`src/components/manage/StudioFeatureBoundary.tsx`) shows for any non-live `/manage` link, which reads as unfinished. Make sure no menu item in the Studio build leads there. Guideline text: "features, content, and UI that elevate it beyond a repackaged website" (https://developer.apple.com/app-store/review/guidelines/#minimum-functionality).
- **2.1 Demo account.** Required because the app has a login: "include demo account info (and turn on your back-end service!)". The all-day review class is required, not optional, because `check_in_with_pass` returns `outside_window` outside 60 minutes before class (`src/lib/checkin/pass.ts`).
- **5.1.1(v) Account deletion.** "If your app supports account creation, you must also offer account deletion within the app." Studio 1.0 has no sign-up (`allowsSignUp('studio')` is false in `src/lib/native/platform.ts`), so the rule arguably does not apply. But Apple's FAQ says an app that *links out* to the browser for account creation still needs in-app deletion (https://developer.apple.com/support/offering-account-deletion-in-your-app/). The sign-in screen says "New studio? Set up at tandavastudio.com on the web" (`Login.tsx`). It isn't a link, but a reviewer may read it as one. Safest path: turn on `VITE_ACCOUNT_DELETION_REQUESTS_ENABLED` for the Studio build once fulfillment is ready (the Account > Delete account card already exists in `src/pages/account/AccountDeletion.tsx`), and use review note option (a). If it stays off, use option (b) and consider changing the sign-in line to "Staff: sign in with the email your studio invited."
- **3.1.3 and in-app purchase.** The app sells nothing. Studios pay for the service on the web. The fitting exception is 3.1.3(c) Enterprise Services ("sold directly by you to organizations or groups for their employees"). 3.1.3(f) (free stand-alone companion) lists only VoIP, cloud storage, email and web hosting, and forbids "calls to action for purchase outside of the app", so don't lean on it. Keep any "set up your studio" or pricing wording out of the app UI. Check Settings > payouts (`PayoutsCard` in `src/pages/manage/Settings.tsx`, `/manage/settings` is a live route): payouts are the studio receiving member money for in-person classes (3.1.3(e)), but phase 1 says payments setup is not in 1.0, so hide it in the Studio build or be ready to explain it.
- **4.8 Login services.** Email sign-in only, no Google or Apple sign-in in native (`offersSocialAuth`), so Sign in with Apple is not required.

### Screenshot headline captions (in order, from `store-sets/set_tandavastudio.py`, playbook PR 12)

Headline is the big lowercase line; subline sits under it. Top terms (scan, check in, front desk, roster) appear in frames 1 to 3.

| # | Headline | Subline |
|---|---|---|
| 1 | scan them in. [13] | Check members in at the door with your camera. [46] |
| 2 | front desk to go. [17] | Your studio, today, on one screen. [34] |
| 3 | tap. checked in. [16] | No pass? The roster works too. [30] |
| 4 | teachers get theirs. [20] | Assigned classes and rosters, nothing else. [43] |
| 5 | your week, your way. [20] | Add classes, move times, cancel when needed. [44] |
| 6 | set your prices. [16] | Drop-ins, class packs and memberships. [38] |
| 7 | share the link. [15] | Members book from your page. You see them here. [47] |

Watch frame 5: "cancel when needed" must match the candidate. The reviewer walkthrough says not to cancel a class until notification side effects are verified (`docs/app-store/REVIEWER-WALKTHROUGH.md`). If class cancel isn't verified, change the subline to "Add classes and move times." Frame 1 needs a real iPhone capture of a scan (the simulator has no camera), per `TANDAVA-STUDIO-PREVIEW-PLAN.md`.

---

## 2. Google Play (if/when Android ships)

There is no Android project yet (`docs/app-store/STUDIO-PHASE-1.md`, Google Play section). Play's closed test needs 12 testers for 14 days before production.

| Field | Text |
|---|---|
| Title (30) | Tandava Studio: Class Check-In [30] |
| Short description (80) | Scan members in at the door, check rosters and edit your yoga studio's week. [76] |

Full description (4000) [1548]: same as the App Store text, with iPhone-only words swapped ("vibration" for "buzz", "share menu" for "iPhone share sheet").

```
Check members in at the door in a second.

Tandava Studio is the staff app for yoga, pilates and barre studios that run on Tandava. Point your camera at a member's check-in pass, feel the vibration, and they're in. No clipboard. No laptop on the front desk.

SCAN THEM IN
- Tap Scan passes and point your camera at the member's pass.
- A green card and a quick vibration tell you they're checked in.
- Already in? The app says so and nothing changes. Keep scanning.
- Waitlisted, cancelled or too early? You see why right away.
- A running count shows how many people you've checked in.
- Front desk and owners can scan anyone booked at the studio. Teachers scan for the classes they teach.

NO PASS? TAP THE ROSTER
- Open the class and tap Check in next to a name.
- A check-in only shows as done once Tandava has saved it.

FOR TEACHERS
- See the classes you teach for the next 14 days.
- Open each roster to see who's coming.

FOR OWNERS
- See today's classes on one screen.
- Add classes to your weekly schedule and change times.
- Set drop-in, class pack and membership prices.
- Share your booking page from your phone's share menu.

MADE FOR THE DOOR
- Big buttons you can use with one hand.
- A clear banner when you're offline.

HOW IT WORKS
Tandava Studio is for staff at studios that use Tandava. Sign in with the email your studio invited. Studio owners set up their studio and invite staff from the Tandava dashboard on the web. Members show their check-in pass from My Schedule in Tandava.

Questions? Email hello@purafieldstudio.com.
```

---

## 3. Keyword research

Method: aso-listing-research skill (Google autocomplete plus competitor titles; no paid volume data). Scores 1 to 3: R = relevance to this build, D = demand proxy, C = competition (3 = fewer strong competitors titled with it).

| Term | R | D | C | Where | Why |
|---|---|---|---|---|---|
| check-in / check in | 3 | 3 | 2 | Name A, subtitle B | The core job. Mindbody's staff app and its kiosk app both lean on it ("checking clients in", "Mindbody Check-In") |
| yoga | 3 | 3 | 2 | Subtitle | Autocomplete: "yoga studio software", "yoga studio management software", "yoga studio scheduling software" |
| scan | 3 | 2 | 3 | Subtitle A, keywords B | None of the 6 competitors below mention scanning in their store text. Our clearest difference |
| class | 3 | 3 | 2 | Name A, subtitle B | Autocomplete: "class attendance app", "yoga class software", "pilates class app" |
| studio | 3 | 3 | 1 | Name (brand) | In the brand; crowded |
| roster | 3 | 1 | 3 | Keywords A, subtitle B | Exact staff word; low competition |
| attendance | 3 | 3 | 2 | Keywords | Autocomplete: "class attendance app", "student attendance app" |
| front, desk | 3 | 2 | 3 | Keywords | "front desk app" in autocomplete; Mindbody uses "front desk" in its description |
| pilates, barre | 2 | 2 | 3 | Keywords | Same studio model; "pilates studio app" in autocomplete |
| teacher, instructor, staff | 3 | 2 | 2 | Keywords | Role words staff search with |
| schedule | 3 | 3 | 1 | Keywords | High demand, crowded |
| member, pass, door | 3 | 1 | 3 | Keywords, subtitle | Long tail; matches the app's own words |
| booking | 2 | 3 | 1 | Keywords A | Sharing the booking page; crowded |
| fitness | 2 | 3 | 1 | Keywords | Broad catch-all; filler at the end |
| qr | 3 | 2 | 2 | Description only | "qr check in app", "qr code event check in app" in autocomplete, but Apple ignores keywords of 2 characters |
| gym, crm, payments, pos | 1 | | | Dropped | Not in this build or not the audience |

Autocomplete sources (Google suggest, opened Nov 6, 2026):
- https://suggestqueries.google.com/complete/search?client=firefox&q=yoga%20studio%20software
- https://suggestqueries.google.com/complete/search?client=firefox&q=class%20attendance%20app
- https://suggestqueries.google.com/complete/search?client=firefox&q=qr%20check%20in%20app
- https://suggestqueries.google.com/complete/search?client=firefox&q=front%20desk%20app
- https://suggestqueries.google.com/complete/search?client=firefox&q=pilates%20studio%20app
- "studio check in app" and "yoga studio app for" returned no suggestions (low volume).

### Competitors (US App Store pages opened Nov 6, 2026)

| App | Title / subtitle | Category | Rating | Check-in or scan in listing? | URL |
|---|---|---|---|---|---|
| Mindbody Business | Mindbody Business / no subtitle shown | Business | 4.6 (24K) | Check-in yes ("checking clients in"), no scanning | https://apps.apple.com/us/app/mindbody-business/id599125654 |
| Mindbody Check-In | Mindbody Check-In / no subtitle shown | Health & Fitness | 1.8 (49) | Kiosk self check-in, no scanning | https://apps.apple.com/us/app/-/id978183901 |
| Arketa Business App | Arketa Business App / "Run your fitness biz on the go" | Business | 2.9 (43) | No. A review asks for a better check-in flow | https://apps.apple.com/us/app/id6450321424 |
| WellnessLiving Elevate | WellnessLiving Elevate / no subtitle shown | Health & Fitness | 4.2 (910) | No (check-in is a separate app) | https://apps.apple.com/us/app/-/id1606344009 |
| Glofox Pro - Staff App | Glofox Pro - Staff App / "Manage your Studio on the go" | Health & Fitness | 2.5 (47) | No | https://apps.apple.com/app/id1464934622 |
| Momence | Momence / no subtitle shown | Health & Fitness | 4.9 (47K) | No. It's the client app, not a staff app | https://apps.apple.com/us/app/momence/id1577856009 |
| Walla App | Walla App / "Work out with Walla studios" | Health & Fitness | 4.9 (4.7K) | No. Client app | https://apps.apple.com/us/app/-/id1611230665 |

What this says: staff apps from the big platforms rate low (1.8 to 2.9) except Mindbody Business, and none sells the door scan. Lead every field with scanning and check-in, not "manage your studio", which everyone already says.

---

## 4. Missing before submission (updated Nov 8, 2026)

Done: App Store Connect record (app id 6831459731); support page (`/support`, PR 114); camera line in the privacy policy (PR 114); migrations 00047 to 00052 on tandava-prod; scan check-in (PR 113); redesign screenshots rendered.

- [ ] Merge PR 121: native sign-in works with captcha on; Billing tab hidden in the apps; social buttons follow the server.
- [ ] Add `VITE_TURNSTILE_SITE_KEY` (the website's public key) and `VITE_ACCOUNT_DELETION_REQUESTS_ENABLED=true` to Codemagic group `tandava_native`, then a new TestFlight build.
- [ ] Sign in on the iPhone mini (TestFlight) and the Pixel 4 as review-owner; scan one pass.
- [ ] Reviewer password in App Review Information (the maintainer only).
- [ ] Review seed on tandava-prod and the QR PDF, then the review notes with real names.
- [ ] Privacy label: add the Turnstile row above. Leave `VITE_POSTHOG_KEY` unset in `tandava_native`.
- [ ] Name/subtitle: variant A unless the maintainer says B.
- [ ] Export compliance: uses only standard HTTPS, so "None of the algorithms mentioned above" (`ITSAppUsesNonExemptEncryption` is already false in Info.plist).
