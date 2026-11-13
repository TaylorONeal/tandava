# Tandava Studio 1.0: device scan test (Taylor's tick list)

Written Nov 7, 2026. About 15 minutes. Do this before submitting.

| Item | Value |
|---|---|
| Studio app | TestFlight on the **iPhone 12 mini**. Build 7 (main `b8f2575`, has scan, captcha sign-in fix and hidden payouts) unless build 8 is out; use the newest |
| Member pass | **Pixel 4 XL**, Chrome, https://tandavastudio.com (member web app) |
| Backend | tandava-prod (org Purafield Studio, id `mkaixgjwakfufmmwembn`). Migration 00052 is on prod (see `MIGRATION-00052-RUNBOOK.md`) |
| Accounts | The synthetic "Juniper Review Studio (synthetic)" owner, teacher and member logins. Emails are in the comments at the top of `supabase/review/studio-review-seed.sql`; passwords are only where Taylor keeps them and in App Store Connect > App Review Information > Sign-In Information. Never in chat or this repo |
| Review class | "Review Check-in (open all review period)", open for check-in until **Nov 27, 2026, 1:14 PM CST**. If review runs later, re-run the seed first (Taylor's yes) |
| Spare passes | `docs/app-store/review/studio-review-passes.pdf`: QR 1 to 3 are the three review members' passes, QR 4 is a plain non-Tandava QR |

Write PASS or FAIL in the box. On a FAIL, screenshot it and keep going.

## A. Sign in (owner)

- [ ] 1. Open Tandava Studio. The sign-in screen shows **no sign-up link**, only "Staff: sign in with the email your studio invited."
- [ ] 2. Sign in as the review **owner**. The captcha check passes and the dashboard opens. (Captcha error here means build 7 lacks `VITE_TURNSTILE_SITE_KEY`: cut build 8, see `BUILD-8-AND-PLAY.md`.)
- [ ] 3. Dashboard: the **Scan passes** card sits on top. No billing or payouts card anywhere in the app (Settings included).

## B. Roster

- [ ] 4. Open the review class roster. The three review members are listed, none checked in yet. Do not tap Check in here (keeps the passes fresh for the scan steps).

## C. Scan (the 4.2 moment)

On the Pixel: sign in at tandavastudio.com as review **member 3** (QR 1 stays fresh for Apple), open **My Schedule**, tap **Check-in pass** on the review class. Turn screen brightness up.

- [ ] 5. iPhone: **Scan passes** > **Scan a pass**. Allow camera when asked (first time only).
- [ ] 6. Scan the Pixel. Green card "**<name> is checked in**", class name and time, "Attendance recorded.", a **success buzz**, and "1 checked in this session".
- [ ] 7. **Scan next**, scan the same pass again. Amber "**is already in**", "Nothing changed.", a **warning buzz**.
- [ ] 8. Scan **QR 4** from the PDF (on the Mac screen). Red "**Not a Tandava pass**", error buzz.
- [ ] 9. Camera off: iOS Settings > Tandava Studio > Camera off, then Scan a pass. Message "Camera access is off. Turn it on in Settings > Tandava Studio > Camera." Turn it back on.

## D. Teacher scope

- [ ] 10. Sign out. Sign in as the review **teacher**. The teaching schedule opens (not the owner dashboard).
- [ ] 11. **Scan passes at the door**, scan **QR 2** (member 2, the teacher's review class). Green "is checked in" (or amber "is already in" if member 2 was checked in from the roster while recording the preview). Either proves the teacher can scan their own class.
- [ ] 12. Scan a pass for a class this teacher does **not** teach (for example a booking at Purafield Studio (test)). Red "**Pass not found**". It must never show the other studio's member.

## E. Account and sign-out

- [ ] 13. Account screen: if **Delete account** shows, tap it and check it explains the request and asks to confirm. Do not confirm on the review owner. If it does not show, the review notes must use option (b) in `docs/store/listing-1.0.md`.
- [ ] 14. Sign out. Relaunch: the app opens on sign-in, no data from the last session.
- [ ] 15. Airplane mode on: the offline banner shows. Off again.

Reply in chat with the 15 results (for example "all pass" or "fail 2, 12"). The agent records them in `docs/plans/PROGRESS.md`.

## What App Review will do (reviewer walkthrough)

Apple follows the App Review notes, not this list. The paste-ready notes are in `docs/store/listing-1.0.md`, section "App Review notes". In short:

1. Sign in with the **owner** login from App Store Connect > App > App Review Information > **Sign-In Information** (Taylor types the password there; it is never in the notes).
2. Tap **Scan passes**, allow the camera, scan **QR 1** from the attached PDF (`docs/app-store/review/studio-review-passes.pdf`, attach it in App Review Information > Attachment). Green card and buzz.
3. Scan QR 1 again: "already in". Scan QR 4: "Not a Tandava pass".
4. Optional: teacher roster check-in, owner Classes and pricing, Weekly schedule, Share.

Reset before submitting: Apple needs QR 1 **not** checked in. This list never scans QR 1. If anyone did, re-run the review seed (Taylor's yes), which recreates the studio with fresh bookings and the same QR ids.
