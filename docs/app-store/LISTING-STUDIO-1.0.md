# Tandava Studio 1.0: listing proposal and store creative

Paste-ready base text stays in `docs/store/listing-1.0.md` and `native/studio/store/metadata/`. This file proposes changes. Nothing here is entered in App Store Connect.

## Nov 7, 2026: lane proposal (front desk, not teacher)

Goal: keep Tandava Studio in the front-desk lane (check-in, roster, attendance, QR, passes, owner, staff) and stop competing with TeacherTree, whose keywords are `yoga,teacher,instructor,class,schedule,timetable,studio,pilates,fitness,graphic,story,booking` (`teachertree-phase1-release/docs/store/SUBMISSION.md`). Counts by script; all ASCII, no em dashes, not AI-led.

| Field | Live in ASC now | Proposed |
|---|---|---|
| Name (30) | Tandava Studio: Class Check-In [30] | unchanged |
| Subtitle (30) | Scan yoga passes at the door [28] | **Scan member passes at the door [30]** |
| Keywords (100) | pilates,barre,front,desk,roster,attendance,teacher,instructor,schedule,staff,member,fitness,booking [99] | **front,desk,roster,attendance,qrcode,owner,staff,yoga,pilates,barre,signin,tracker,reception,manager [99]** |
| Promo text (170) | The front desk in your pocket. Scan a member's pass with your camera, feel the buzz, and they're in. No pass? Tap their name on the roster. [139] | **The front desk in your pocket. Scan a member's QR pass, feel the buzz, and they're checked in. No pass? Tap their name on the class roster. [139]** |
| Primary category | Business | unchanged |
| Secondary category | Health & Fitness | unchanged (already saved) |

Why:
- **Dropped** `teacher`, `instructor`, `schedule` (TeacherTree's lane), `booking` (TeacherTree has it and Studio 1.0 does not take bookings), `fitness` (TeacherTree has it; Health & Fitness category covers it), `member` (now in the subtitle).
- **Added** `qrcode` (people search "qr code check in"; Apple may ignore 2-letter `qr`), `owner`, `signin` (sign-in sheet), `tracker` (attendance tracker), `reception`, `manager` (studio manager).
- **Kept** `yoga` and `pilates`: the only overlap with TeacherTree, but they say who the app is for. Swap `pilates` for `dance` if you want zero overlap.
- Subtitle moves `yoga` to keywords and adds `member` and `passes`; no word repeats name or keywords.
- Alternative subtitle B: `Front desk pass scanner` [23], then swap `front,desk` in keywords for `member,door`.

Apply: on Taylor's yes, edit `native/studio/store/metadata/en-US/{subtitle,keywords,promotional_text}.txt` and run the Codemagic workflow `studio-ios-screenshots` (uploads text and screenshots, no binary, no submission). Promo text can change any time without review.

## Nov 7, 2026: "night shift" screenshot variation (not uploaded)

A darker, front-desk version of the bold set: near-black fields, one neon accent per frame (lime, teal, coral), bigger headlines with the second line glowing, a ghost outline word, viewfinder brackets on each enlarged crop. Own style, not TeacherTree, JetSweep or CueCraft.

- Renders: `store-captures/studio/out/night/ios-01..07-1320x2868.png` (iPhone 6.9", RGB, no alpha).
- Review sheet: `store-captures/studio/out/review-sheet-night-ios.png`.
- Set file: `store-captures/studio/engine/set_tandavastudio_night.py`; run `python3 engine_ios.py tandavastudio_night` in `store-captures/studio/engine`.
- Captures: real WebKit 440x956 @3x captures from the #115 workflow (run 42422954740, branch `store-captures/studio-20261106-out`), Studio and member native bundles against a throwaway local Supabase seeded with the synthetic Juniper studio. Nothing drawn inside a screen.
- Frame 5 subline now says "Add weekly classes and move times." (no cancel claim until class cancel is verified on a device).
- To use them instead of the live set: copy to `native/studio/store/screenshots/en-US/0N_iPhone69.png` and run `studio-ios-screenshots`. Taylor's pick.

Known limit: frame 1 shows the result card from a browser capture. A real iPhone screen recording of the scan (below) is the stronger proof for guideline 4.2.

## App Preview shot list (20 s scan flow)

Apple spec ([App preview specifications](https://developer.apple.com/help/app-store-connect/reference/app-preview-specifications)): 15 to 30 s, iPhone 6.9" portrait **886 x 1920**, H.264, 30 fps, .mov or .mp4, up to 500 MB. Capture on the device (iPhone screen recording, or QuickTime > New Movie Recording with the iPhone as camera). Only footage captured from the app: no device frame and no footage filmed from outside the phone (the camera view inside the scanner is fine). Text overlays are fine if they describe what is on screen. You pick the poster frame in ASC.

Setup: iPhone 12 mini, TestFlight build, signed in as the review owner, Do Not Disturb on, battery charged, no notifications. The 12 mini records 1080x2340, the same shape as 886x1920, so it scales with no bars. Record it while doing section C of `DEVICE-TEST-STUDIO-1.0.md` (member 3), so QR 1 stays fresh for Apple. Pixel 4 XL showing member 3's Check-in pass. Record on the iPhone, then scale to 886x1920 (`ffmpeg -i in.mov -vf "scale=886:1920:force_original_aspect_ratio=decrease,pad=886:1920:(ow-iw)/2:(oh-ih)/2,fps=30" -c:v libx264 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 256k out.mp4`; add a silent AAC track if there is no audio).

| # | Time | On screen (real app only) | Overlay text (optional) |
|---|---|---|---|
| 1 | 0.0 to 2.5 s | Dashboard, Scan passes card on top | scan them in. |
| 2 | 2.5 to 4.0 s | Tap Scan passes; Scan passes screen | |
| 3 | 4.0 to 8.0 s | Tap Scan a pass; camera view finds the pass on the Pixel | point at the pass |
| 4 | 8.0 to 11.0 s | Green "is checked in" card, count "1 checked in this session" | checked in. |
| 5 | 11.0 to 13.5 s | Scan next, same pass: amber "is already in" | no double check-ins |
| 6 | 13.5 to 16.5 s | Back, open the review class roster, tap Check in next to member 2 (never member 1) | no pass? tap the roster. |
| 7 | 16.5 to 20.0 s | Teaching schedule or dashboard with today's classes | front desk to go. |

Rules: show only what build 7/8 does; no prices, payments or install prompts; members are synthetic review members. The haptic cannot be seen, so do not claim it in overlay text. The same footage cut to 15 to 30 s also serves Play (YouTube link) later.
