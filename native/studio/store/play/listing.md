# Tandava Studio on Google Play: listing package (Nov 8, 2026)

App: Tandava Studio, package `com.tandava.studio`, developer account **Purafield Studio LLC** (never a personal account). Free, no ads, no in-app purchases. Phone only.
Images in this folder: `icon-512.png`, `feature-graphic.png` (1024x500), `phone-01.png` to `phone-07.png` (1080x1920). Text below is paste-ready. No em dashes.

**Screenshot status (Nov 8):** `phone-01.png` to `phone-07.png` are web captures (Playwright, local Supabase), not frames from the Android build that will be uploaded. Status: web-capture, replace. Use them as layout references only. Replacement frames come from the release candidate on the Pixel 4 XL: the sign-in and offline frames are captured (`~/repos/_share/play-assets/tandava-studio/2026-11-08/raw/`); the signed-in frames (dashboard, scan, roster, schedule) need a review staff account on prod first.

## Main store listing (Grow users > Store presence > Main store listing)

- **App name (30):** Tandava Studio: Class Check-In
- **Short description (80):** Scan members in at the door, check rosters and edit your yoga studio's week.
- **Full description:** the block below.

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

## Store settings (Grow users > Store presence > Store settings)

- **App category:** Business. **Tags:** Business management, Productivity (pick the closest offered).
- **Contact email:** hello@purafieldstudio.com
- **Website:** https://tandavastudio.com/for-studios
- **Phone:** the Purafield business phone only (never the maintainer's personal number), or leave empty.

## App content (Policy and programs > App content)

| Section | Answer |
|---|---|
| Privacy policy | https://tandavastudio.com/privacy |
| App access | All or some functionality is restricted. Instructions: "Sign in with the owner account below. Tap Scan passes to check a member in, or open a class roster and tap Check in." Username: review-owner@purafieldstudio.com. Password: typed by the maintainer only. |
| Ads | No, the app does not contain ads |
| Content rating (IARC) | Category: All other app types (Utility/Productivity). Every content question: No. Shares location: No. Users interact or exchange content: No. Digital purchases: No. Expected: Everyone / PEGI 3 |
| Target audience | 18 and over only. Not designed for children |
| News app | No |
| COVID-19 contact tracing | No |
| Data safety | See below |
| Government app | No |
| Financial features | My app doesn't provide any financial features |
| Health apps | My app does not have any health features |
| Account deletion URL | https://tandavastudio.com/support (section "Deleting your account or data") |

## Data safety

- Collects or shares any required user data: **Yes**. Encrypted in transit: **Yes**. Users can request deletion: **Yes**. Account creation: the app only signs in; accounts are made on the web (choose "My app lets users log in with accounts created outside the app" if offered).
- Shared with third parties: **No** (Supabase, Cloudflare and Sentry act as service providers).

| Data type | Collected | Optional? | Purpose |
|---|---|---|---|
| Personal info: Name | Yes | Required | App functionality, Account management |
| Personal info: Email address | Yes | Required | App functionality, Account management |
| Personal info: Phone number | Yes | Optional | App functionality |
| Personal info: Other info (pronouns, date of birth, emergency contact) | Yes | Optional | App functionality |
| Personal info: User IDs | Yes | Required | App functionality, Account management |
| App activity: Other user-generated content (class schedule, prices an owner saves) | Yes | Required | App functionality |
| App info and performance: Diagnostics (Cloudflare bot check on sign-in) | Yes | Required | Fraud prevention, security and compliance |
| App info and performance: Crash logs | Only if Sentry is on in the build (`VITE_SENTRY_DSN`) | | App functionality |
| Photos and videos | **No.** The camera reads the QR pass on the phone; only the pass text is sent | | |
| Location, contacts, financial info, health, messages, web history | No | | |

## Release (Test and release)

1. Internal testing first: upload the signed AAB from Codemagic workflow `studio-android-aab`, release name `1.0 (1xx)`.
2. Production needs a closed test with 12 testers for 14 days on a new personal-style account. Check whether Purafield Studio LLC (organization account) is exempt before planning that.
3. Nothing is sent for review without the maintainer's yes.
