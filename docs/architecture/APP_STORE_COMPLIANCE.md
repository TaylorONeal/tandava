# App Store Compliance

Requirements and checklist for iOS App Store and Google Play approval.

---

## Overview

This document ensures Tandava mobile apps meet platform requirements for approval and continued listing. Both stores have guidelines that, if violated, result in rejection or removal.

---

## iOS App Store

### Relevant Guidelines

| Guideline | Summary | Risk Level |
|-----------|---------|------------|
| **4.2 Minimum Functionality** | Apps must have sufficient features beyond a website | High |
| **4.2.6 Web Content** | WebView-only apps will be rejected | High |
| **4.8 Sign in with Apple** | Required if any third-party login | High |
| **5.1.1 Data Collection** | Privacy labels must be accurate | Medium |
| **5.1.2 Data Use** | Clear purpose for all data collected | Medium |
| **3.1.1 In-App Purchase** | Digital goods require IAP; services exempt | Medium |

### 4.2 Minimum Functionality

**What Apple looks for:**
- Substantial native functionality
- Features that justify a native app over a website
- Proper use of iOS capabilities

**How Tandava meets this:**

| Native Feature | Implementation |
|----------------|----------------|
| Push notifications | Class reminders, booking confirmations |
| Offline support | Cached schedule, works without network |
| Camera | QR code check-in |
| Biometrics | Face ID / Touch ID login |
| Calendar integration | Export bookings to iOS Calendar |
| Widgets | Next class home screen widget |
| Siri Shortcuts | "Book my usual class" |
| Haptic feedback | Booking confirmation, check-in success |

**Minimum required for submission:**
- [ ] Native schedule viewing (not WebView)
- [ ] Native booking flow (not WebView)
- [ ] Push notifications implemented
- [ ] Offline schedule cache
- [ ] At least one additional platform integration (widgets OR Siri OR calendar)

### 4.8 Sign in with Apple

**Requirement:** If the app offers any third-party sign-in (Google, Facebook, email), it must also offer Sign in with Apple as an option.

**Implementation:**
```swift
// Required for submission
ASAuthorizationAppleIDButton
ASAuthorizationController
```

**Position:** Sign in with Apple must be displayed with equal or greater prominence than other options.

### 5.1 Privacy

**App Privacy Label (required for submission):**

| Data Type | Collected? | Purpose | Linked to Identity? |
|-----------|------------|---------|---------------------|
| Email address | Yes | Account creation | Yes |
| Name | Yes | Profile display | Yes |
| Phone number | Optional | Account recovery | Yes |
| Location | Optional | Nearest studio | No |
| Usage data | Yes | Analytics | No |
| Crash data | Yes | Diagnostics | No |

**Privacy Policy:** Must link to accessible privacy policy in app and App Store listing.

### 3.1.1 In-App Purchase

**What requires IAP:**
- Digital content downloads
- Subscriptions to digital content
- Virtual goods / credits

**What does NOT require IAP (service exemption):**
- Physical class bookings (real-world service)
- Memberships for physical studio access
- Class packs for in-person classes

**Tandava position:** All purchases are for physical services (attending classes at a real studio). This qualifies for the service exemption. Memberships and class packs do NOT require IAP.

**Evidence to prepare if challenged:**
- Studios are physical locations
- Classes are in-person experiences
- Memberships grant access to physical facilities
- This is equivalent to booking a hotel room or buying a gym membership

---

## Google Play

### Relevant Policies

| Policy | Summary | Risk Level |
|--------|---------|------------|
| **Minimum Functionality** | Must provide value beyond web | Medium |
| **User Data** | Transparent data handling | Medium |
| **Payments** | Play billing for digital goods | Medium |
| **Deceptive Behavior** | App must do what it claims | Low |

### Data Safety Section

Required disclosures for Google Play:

| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Email | Yes | No | Account, authentication |
| Name | Yes | No | Profile |
| Location | Optional | No | Nearest studio |
| App activity | Yes | No | Analytics |
| Crash logs | Yes | No | Stability |

### Google Play Billing

Same exemption as iOS: physical services do not require Google Play billing.

> "Apps that facilitate the sale of physical products or services (such as ride-sharing, food delivery, or event tickets) are not required to use Google Play's billing system."

Studio class bookings are event tickets for physical attendance.

---

## Submission Checklist

### Pre-Submission (Both Platforms)

- [ ] App runs without crashes on latest OS versions
- [ ] All placeholder content removed
- [ ] Test accounts available for review
- [ ] Privacy policy URL active and accurate
- [ ] Terms of service URL active
- [ ] Support contact email configured
- [ ] App screenshots meet size requirements
- [ ] App description accurate and complete

### iOS-Specific

- [ ] Sign in with Apple implemented and prominent
- [ ] App Privacy labels completed in App Store Connect
- [ ] Push notification entitlement configured
- [ ] All native features functional
- [ ] No private API usage
- [ ] App Transport Security enabled (HTTPS only)
- [ ] 64-bit architecture only
- [ ] Tested on physical devices (not just simulator)

### Android-Specific

- [ ] Data safety section completed in Play Console
- [ ] Target SDK meets Play requirements (current: API 34)
- [ ] App bundle (.aab) not APK
- [ ] ProGuard/R8 enabled for release
- [ ] Tested on variety of screen sizes
- [ ] Adaptive icon provided

---

## Common Rejection Reasons and Fixes

### iOS Rejections

| Rejection Reason | Fix |
|------------------|-----|
| "App is primarily a web wrapper" | Add more native features (notifications, offline, camera) |
| "Missing Sign in with Apple" | Implement ASAuthorizationController |
| "Inaccurate privacy labels" | Audit all data collection, update labels |
| "App crashes during review" | Test on same iOS version as reviewers |
| "Insufficient metadata" | Add detailed description, screenshots |
| "Login required with no way to test" | Provide demo account in review notes |

### Android Rejections

| Rejection Reason | Fix |
|------------------|-----|
| "Data safety incomplete" | Complete all required disclosures |
| "Deceptive behavior" | Ensure app does what description claims |
| "Target SDK too low" | Update to current requirement |
| "Permissions without justification" | Explain each permission in listing |

---

## Review Notes Template

### iOS

```
Demo Account:
Email: demo@tandavastudio.com
Password: [provided securely]

This app allows yoga studio members to:
1. Browse class schedules (native UI, works offline)
2. Book classes with single tap
3. Receive push notifications for class reminders
4. Check in to classes via QR code scanning
5. View their membership and booking history

All class bookings are for physical, in-person classes at real yoga studios.
Memberships and class packs grant access to physical studio facilities.
This qualifies for the physical services exemption under guideline 3.1.1.

Sign in with Apple is available and prominently displayed.
```

### Android

```
Test Account:
Email: demo@tandavastudio.com
Password: [provided]

The app provides yoga studio members with:
- Schedule browsing with offline support
- Class booking with instant confirmation
- QR code check-in for class attendance
- Push notifications for reminders

All purchases are for physical class attendance, qualifying for the
physical services exemption from Play billing requirements.
```

---

## Ongoing Compliance

### Quarterly Review

- [ ] Privacy policy still accurate
- [ ] App Privacy labels / Data Safety current
- [ ] Target SDK meets platform requirements
- [ ] No deprecated APIs in use
- [ ] Third-party SDKs updated

### Version Updates

When submitting updates:
- [ ] Test on latest OS beta (if available)
- [ ] Verify no new permissions required
- [ ] Update screenshots if UI changed significantly
- [ ] Update description if features changed
- [ ] Review any new platform guidelines

---

## Contact Information

**Apple App Review:**
- Resolution Center in App Store Connect
- Appeal process available for rejections

**Google Play Support:**
- Policy status page in Play Console
- Appeal process available for rejections

---

## Related Documentation

- [MOBILE_ARCHITECTURE.md](MOBILE_ARCHITECTURE.md) — Technical architecture
- [../design/06-cross-platform.md](../design/06-cross-platform.md) — Design system
- [Privacy Policy template] — Link to legal docs

