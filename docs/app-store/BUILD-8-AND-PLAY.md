# Tandava Studio: build 8 and Google Play prep (Nov 7, 2026)

App: Tandava Studio, `com.tandava.studio`, App Store Connect app 6831459731. Nothing here submits, uploads a listing or spends money without Taylor's yes.

## Where builds 4 to 7 came from

Codemagic, not local Xcode. Evidence:

| Fact | Source |
|---|---|
| No Xcode archives dated November on the Mac; no `studio-v*` tags | `~/Library/Developer/Xcode/Archives`, `git tag` |
| Build numbers 4, 5, 6, 7 match the `codemagic.yaml` rule "latest TestFlight + 1, at least 4" | `codemagic.yaml`, workflow `studio-ios-testflight` |
| Build 7 = main `b8f2575` (PRs #109, #113, #121, #122 all in). Check run "Tandava Studio iOS to TestFlight" on that commit, 03:04 to 03:07 UTC Nov 8; ASC shows build 7 uploaded 03:08 UTC, VALID | GitHub check runs; ASC API `/v1/builds?filter[app]=6831459731` |
| Codemagic app id `6aee0686a2e7d99cd5783f3e` (Taylor's Personal Account) | check run details URL |

So build 7 already holds everything merged. **Cut build 8 only when one of these is true:**

1. Sign-in on the iPhone fails with a captcha error (the build ran before `VITE_TURNSTILE_SITE_KEY` was in Codemagic group `tandava_native`), or
2. You turn on in-app deletion: add `VITE_ACCOUNT_DELETION_REQUESTS_ENABLED=true` to `tandava_native` (recommended for guideline 5.1.1(v), see `docs/store/listing-1.0.md`), or
3. New code lands on main.

## Build 8: exact steps

Taylor's click (fastest, no token needed): Codemagic > Apps > tandava > **Start new build** > Branch `main` > Workflow **Tandava Studio iOS to TestFlight** > Start new build.
https://codemagic.io/app/6aee0686a2e7d99cd5783f3e

Or by API (agent, once a working Codemagic token is in the shell as `CM_API_TOKEN`; the plugin token returned 401 tonight):

```bash
curl -fsS -X POST https://api.codemagic.io/builds \
  -H "x-auth-token: $CM_API_TOKEN" -H 'Content-Type: application/json' \
  -d '{"appId":"6aee0686a2e7d99cd5783f3e","workflowId":"studio-ios-testflight","branch":"main"}'
```

What it does: `npm ci`, typecheck and tests, `npm run native -- studio sync`, automatic signing, build number = latest TestFlight + 1 (so **8**), IPA, upload to TestFlight. `submit_to_app_store: false`.

After it lands (agent, read-only): `python3 scripts/asc.py GET '/v1/builds?filter[app]=6831459731&sort=-uploadedDate&limit=1'` in `~/repos/app-launch-playbook` until `processingState` is `VALID`. Attaching the build to version 1.0 is an ASC write: Taylor's yes first.

### Cost

$0. Codemagic gives personal accounts 500 free macOS M2 minutes a month (reset on the 1st); past that it is $0.095 a minute, and only if billing is turned on ([Codemagic pricing](https://docs.codemagic.io/billing/pricing/)). Build 7 took about 4 minutes, so build 8 uses about 4 to 6 free minutes. Billing is not enabled on the account (launch playbook notes), so it cannot charge.

### Local alternative (also free, slower)

Only if Codemagic is down. Needs the distribution certificate in the Mac keychain, which Codemagic created through the API key, so it may not be on the Mac:

```bash
cd ~/repos/tandava && git checkout main && git pull --ff-only
npm ci && VITE_SUPABASE_URL=https://mkaixgjwakfufmmwembn.supabase.co VITE_SUPABASE_ANON_KEY=<public anon key> VITE_TURNSTILE_SITE_KEY=<public site key> npm run native -- studio sync
cd native/studio/ios/App && agvtool new-version -all 8
xcodebuild -project App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath /tmp/TandavaStudio-8.xcarchive archive
xcodebuild -exportArchive -archivePath /tmp/TandavaStudio-8.xcarchive -exportOptionsPlist <app-store ExportOptions.plist> -exportPath /tmp/TandavaStudio-8
xcrun altool --upload-app -f /tmp/TandavaStudio-8/App.ipa -t ios --apiKey <key id> --apiIssuer <issuer id>
```

## Google Play

Play Console account: **purafieldstudio@gmail.com**, developer "Purafield Studio LLC" (account 7616475869865594752), open in Claude's built-in browser pane (regular Chrome holds the wrong Google accounts).

### Taylor's clicks (create the app record)

1. https://play.google.com/console > **All apps** > **Create app**.
2. App name `Tandava Studio: Class Check-In`. Default language English (United States). App (not game). Free.
3. Tick the two declarations (Developer Program Policies, US export laws). **Create app**.

The package name is not typed here: Play takes `com.tandava.studio` from the first uploaded bundle, and it is permanent after that.

### Then the agent does

1. **Signed AAB.** Codemagic workflow `studio-android-aab` (linux_x2; Linux minutes are separate from the macOS free minutes, check the plan before running). It needs the upload keystore saved in Codemagic as `tandava_studio_upload` (Team settings > Code signing identities > Android keystores). The keystore file is on the Mac at `~/tandava-studio-upload.jks` (an older one in `~/Documents/key/` is marked DO NOT USE). Uploading the keystore is Taylor's step because it carries the password. Free alternative: build locally with `npm run native -- studio sync android` then `./gradlew bundleRelease` in `native/studio/android` with the same keystore.
2. Verify the AAB: package `com.tandava.studio`, targetSdk 36 (`native/studio/android/variables.gradle`), 16 KB page alignment, upload certificate fingerprint.
3. **Internal testing** track: create a release `1.0 (101)` and upload the AAB. Taylor clicks Save; rolling out to internal testers is his yes.
4. **Listing and App content**: paste from `native/studio/store/play/listing.md` (main listing, store settings, content rating, target audience 18+, ads No, app access with the review owner account; Taylor types the password).
5. **Data safety**: answers already drafted from the code in `native/studio/store/play/listing.md`. Checked against the Studio build tonight: name, email, optional phone and other info, user ID, owner-saved schedule and prices, Cloudflare bot check diagnostics; crash logs only if `VITE_SENTRY_DSN` is set in `tandava_native`; photos and videos **not** collected (the scanner decodes on the phone and sends only the pass text); encrypted in transit yes; deletion request yes (https://tandavastudio.com/support).
6. **Production gate**: personal developer accounts made after Nov 13, 2023 need a closed test with 12 testers for 14 days; organization accounts do not ([Play Console help](https://support.google.com/googleplay/android-developer/answer/14151465)). Check the account type on the Play Console home page before planning testers.
