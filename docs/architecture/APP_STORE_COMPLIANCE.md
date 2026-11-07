# App store release checks

Updated October 20, 2026 against the current official sources below. This is a
preparation checklist, not a declaration of compliance or store approval.
Candidate evidence lives in [Store apps](../app-store/STORE-APPS.md),
[Reviewer walkthrough](../app-store/REVIEWER-WALKTHROUGH.md) and
[Release acceptance](../testing/RELEASE-RISK-PLAN.md).

## Current Tandava candidate

Member and Studio 1.0 (3) are signed local App Store exports from `270a0a1`.
Neither has passed physical authenticated acceptance or been uploaded to Apple.
The native apps use first-party email sign-in. Native paid checkout, express
checkout and the Stripe portal are intentionally blocked. Review notes must not
claim Apple/Google login, paid checkout, push delivery, biometric login, widgets,
Siri integration, QR scanning or offline booking without candidate-specific proof.
Earlier versions of this document described planned features as implemented and
included an unverified demo identity. Those notes must not be used for submission.

## Apple policy references

Source: [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/),
checked October 20, 2026.

- **4.2:** Demonstrate lasting utility beyond a repackaged website. This is not a
  fixed checklist of native APIs or a blanket prohibition on WebViews.
- **4.2.6:** Concerns commercial templates/app-generation services, not a rule
  named “Web Content.”
- **4.8:** Third-party/social primary-account login requires an equivalent
  privacy-preserving alternative unless an exception applies. Exclusively
  first-party account setup/sign-in is an exception; email is not inherently
  third-party login. Reassess when adding social login.
- **3.1.3(e):** Physical services consumed outside the app use payment methods
  other than IAP. Do not apply this exemption indiscriminately to digital content.
- **5.1.1:** Privacy information must match actual data practices; account creation
  requires in-app account deletion. A request button alone does not prove fulfillment.

For Tandava, complete deletion fulfillment remains a release blocker. The local
profile-scrubbing stage is not a complete Auth/storage/processor/retention workflow
and has not been deployed. See [Account deletion](../operations/ACCOUNT-DELETION.md).

## Google Play target and data safety

[Official target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878),
checked October 20, 2026: phone/tablet new apps and updates require Android16
(API36) from August31,2026; an extension may be requested until November1,2026.
No extension is assumed or requested here. API34 in the previous checklist was
outdated. Verify the actual release AAB's target SDK and Play Console result.
No Android candidate acceptance is established by the iOS build results.

Do not reuse the old speculative privacy tables as Data Safety or Apple privacy
answers. Inventory the exact bundle, SDK configuration and backend flows, including
account identifiers, profile/class information, diagnostics, analytics, recipients,
retention and deletion. Resolve collection, sharing and identity-linkage from
actual behavior; “optional” and “no” are not defaults. Do not infer that disabled
session replay means no diagnostics are collected.

## Required evidence before submission

- [ ] Correct app record, version, bundle/package, team and uploaded build selected.
- [ ] Real signed-candidate Member, Teacher and Owner journeys passed, including
      authorization, booking/check-in, restart persistence and sign-out isolation.
- [ ] Existing review identities verified privately; reachable approved studio
      page and synthetic classes; credentials supplied only through secure fields.
- [ ] Native auth and class links tested; checkout limitations accurately described.
- [ ] Complete account deletion and retained-data handling verified through the
      approved workflow; no real account erasure used as QA.
- [ ] Privacy policy, support and terms URLs verified; accurate store disclosures
      reconciled against the candidate and its providers.
- [ ] Separate truthful Member/Studio screenshots and reviewer notes; no placeholders,
      invented demo credentials or unsupported feature claims.
- [ ] App Review submission/release authorized separately from TestFlight upload.

Use the actual step-by-step [reviewer walkthrough](../app-store/REVIEWER-WALKTHROUGH.md).
It remains preparation until its observed results are recorded. Signed, uploaded,
installed, tested, submitted, approved and live are distinct milestones.
