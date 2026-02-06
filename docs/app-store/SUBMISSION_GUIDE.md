# App Store Submission Guide

Complete guide for studios to submit their branded Tandava apps to Apple App Store and Google Play Store.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Pre-Submission Checklist](#pre-submission-checklist)
3. [Apple App Store Submission](#apple-app-store-submission)
4. [Google Play Store Submission](#google-play-store-submission)
5. [Common Rejection Reasons & How to Avoid](#common-rejection-reasons)
6. [Screenshot Requirements](#screenshot-requirements)
7. [Post-Approval Maintenance](#post-approval-maintenance)

---

## Architecture Overview

### Shared Core Strategy

Tandava uses a **single codebase** approach optimized for maintainability:

```
┌─────────────────────────────────────────────────────────────┐
│                     Shared Core (React)                      │
│  - Components, hooks, state management, business logic      │
│  - API clients, data models, utilities                      │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │   Web PWA   │     │   iOS App   │     │ Android App │
    │  (Vite/SPA) │     │ (Capacitor) │     │ (Capacitor) │
    └─────────────┘     └─────────────┘     └─────────────┘
```

**Technology Stack:**
- **Web**: Vite + React + Tailwind (PWA with offline support)
- **iOS/Android**: Capacitor wrapping the same React codebase
- **Native Features**: Capacitor plugins for camera, notifications, biometrics

### Why Capacitor?

| Approach | Pros | Cons |
|----------|------|------|
| **React Native** | True native UI | Different codebase, longer dev time |
| **Capacitor** | Same codebase as web, web-first | WebView-based (mitigated by modern performance) |
| **PWA Only** | Simplest, no app store | Limited native features, no App Store presence |

**Recommendation**: Capacitor for studios because:
1. 95%+ code shared with web
2. Native push notifications (critical for class reminders)
3. Biometric login support
4. App Store presence builds trust
5. Easy updates (web bundle updates don't require store approval)

---

## Pre-Submission Checklist

### 1. Business Requirements

- [ ] **Business Entity**: Legal business registered (LLC, Corp, etc.)
- [ ] **Apple Developer Account**: $99/year - [developer.apple.com](https://developer.apple.com)
- [ ] **Google Play Developer Account**: $25 one-time - [play.google.com/console](https://play.google.com/console)
- [ ] **D-U-N-S Number** (Apple only): Free from Dun & Bradstreet (takes 1-2 weeks)
- [ ] **Privacy Policy URL**: Must be publicly accessible
- [ ] **Terms of Service URL**: Required for apps with accounts
- [ ] **Support Email**: Dedicated support email address
- [ ] **Support URL**: FAQ or help page

### 2. App Assets Required

- [ ] **App Icon**: 1024x1024px PNG, no transparency, no rounded corners
- [ ] **Screenshots**: See [Screenshot Requirements](#screenshot-requirements)
- [ ] **App Preview Video** (optional but recommended): 15-30 seconds
- [ ] **Short Description**: 80 characters max (Google), 30 words (Apple subtitle)
- [ ] **Full Description**: 4000 characters max
- [ ] **Keywords**: Comma-separated, 100 characters max (Apple)
- [ ] **Category**: Health & Fitness
- [ ] **Content Rating**: Complete rating questionnaire

### 3. Technical Requirements

- [ ] **App Bundle/IPA Built**: Production builds for both platforms
- [ ] **Push Notification Certificates**: Apple APNs + Firebase Cloud Messaging
- [ ] **Deep Linking**: Universal Links (iOS) + App Links (Android)
- [ ] **Splash Screen**: Matches app icon branding
- [ ] **App Version**: Semantic versioning (1.0.0)
- [ ] **Minimum OS**: iOS 14+, Android 8+ (API 26)

### 4. Compliance & Legal

- [ ] **GDPR Compliance**: Data export, deletion requests
- [ ] **CCPA Compliance**: California privacy requirements
- [ ] **App Tracking Transparency**: iOS 14.5+ ATT prompt if using analytics
- [ ] **Payment Compliance**: In-app purchases vs external payments (see below)

---

## Apple App Store Submission

### Step-by-Step Process

#### 1. App Store Connect Setup (1-2 hours)

1. Log in to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: "Studio Name Yoga" (unique in App Store)
   - **Primary Language**: English (US)
   - **Bundle ID**: com.studioname.app
   - **SKU**: studioname-ios-app
   - **User Access**: Full Access

#### 2. App Information Tab

```
Name: Studio Name Yoga
Subtitle: Book Classes & Track Practice
Category: Health & Fitness
Secondary Category: Lifestyle (optional)
Content Rights: Does not contain third-party content
Age Rating: Complete questionnaire → typically 4+
```

**Privacy Policy URL**: Must be HTTPS, publicly accessible, specific to your app

#### 3. Pricing and Availability

- Price: Free (subscriptions handled externally)
- Availability: All territories OR specific countries
- Pre-Orders: Disable for first submission

#### 4. Prepare for Submission

**Version Information:**
- Screenshots for each device size
- App Preview (optional)
- Promotional Text (170 chars, can update without new version)
- Description (4000 chars max)
- Keywords (100 chars, comma-separated)
- Support URL
- Marketing URL (optional)
- What's New (for updates)

**Build:**
- Upload via Xcode or Transporter
- Select build once processed (30-60 mins)

**App Review Information:**
```
Sign-in Required: Yes
Demo Account:
  Username: demo@studioname.com
  Password: [provide actual working credentials]

Contact Information:
  First Name: [Owner first name]
  Last Name: [Owner last name]
  Phone: [Direct phone number]
  Email: [Email they can reach you at]

Notes for Reviewer:
  "This app allows members of [Studio Name] yoga studio to:
  - Browse and book yoga classes
  - Check in to classes they've booked
  - View their practice history
  - Purchase class packs and memberships

  Demo account has sample bookings and history.

  Payments are processed through our secure web payment portal,
  not through in-app purchase, as this is a service business
  (similar to ClassPass, Mindbody)."
```

#### 5. Submit for Review

1. Click **Add for Review**
2. Confirm submission
3. Status changes to "Waiting for Review"
4. Review typically takes 24-48 hours (can be faster or slower)

### Apple Review Tips

**From the Reviewer's Perspective:**

1. **They test on real devices** - Ensure smooth performance
2. **They read your description** - Make it clear what the app does
3. **They try the demo account** - It MUST work perfectly
4. **They check your privacy policy** - Must match app functionality
5. **They verify payment compliance** - External payments for services are OK

**Things That Trigger Manual Review:**

- Health/fitness claims
- User-generated content
- Payment mentions
- Location tracking
- Push notifications

---

## Google Play Store Submission

### Step-by-Step Process

#### 1. Google Play Console Setup

1. Go to [Google Play Console](https://play.google.com/console)
2. **Create App** → Fill in:
   - **App name**: Studio Name Yoga
   - **Default language**: English (US)
   - **App or game**: App
   - **Free or paid**: Free

#### 2. Set Up Your App

Navigate through the setup dashboard:

**App Access:**
- All or some functionality is restricted (requires sign-in)
- Provide test credentials

**Ads:**
- Contains ads: No (unless you add advertising)

**Content Rating:**
- Complete IARC questionnaire
- Typically rated "Everyone"

**Target Audience:**
- Not primarily for children
- Target age: 18+ (yoga studio members)

**News App:**
- Not a news app

**COVID-19 Apps:**
- Not a COVID app

**Data Safety:**
- Complete data collection form
- Account data: Yes (email, name)
- Location: Only if using location features
- Device identifiers: If using analytics

**Government Apps:**
- Not a government app

#### 3. Store Listing

**Main Store Listing:**
```
App name: Studio Name Yoga (30 chars max)
Short description: Book yoga classes and track your practice (80 chars max)
Full description: [See template below]
```

**Graphics:**
- App icon: 512x512 PNG
- Feature graphic: 1024x500 PNG (required)
- Screenshots: At least 2, up to 8 per device type
- Phone: Required
- 7-inch tablet: Recommended
- 10-inch tablet: Recommended

#### 4. Release Management

**Create Production Release:**
1. Go to **Production** → **Create new release**
2. Upload AAB (Android App Bundle)
3. Add release notes
4. Review and roll out

### Google Review Tips

**Faster Approval:**
- Complete ALL dashboard items (green checkmarks)
- Provide clear demo credentials
- Data safety section must match actual behavior
- Screenshots must show actual app (no mockups)

---

## Common Rejection Reasons

### Apple Rejections & Solutions

| Rejection | Cause | Solution |
|-----------|-------|----------|
| **Guideline 4.2 - Minimum Functionality** | App seems like a website wrapper | Add native features: push notifications, biometrics, offline mode |
| **Guideline 3.1.1 - In-App Purchase** | Selling digital content without IAP | Memberships for physical services are exempt; clarify in reviewer notes |
| **Guideline 2.1 - App Completeness** | Broken features, crashes | Test thoroughly on real devices, provide working demo account |
| **Guideline 5.1.1 - Data Collection** | Privacy policy mismatch | Update privacy policy to match actual data collection |
| **Guideline 4.3 - Spam** | Too similar to other apps | Emphasize unique studio branding and features |
| **Metadata Rejected** | Screenshots don't match app | Use actual screenshots, not mockups |

### Apple Payment Exemption

**Key Point**: Physical services like yoga classes are EXEMPT from in-app purchase requirements.

Cite in reviewer notes:
> "Per App Store Review Guideline 3.1.3(e), this app provides booking for physical fitness classes at a brick-and-mortar location. Payments for these in-person services are processed through our secure external payment system."

### Google Rejections & Solutions

| Rejection | Cause | Solution |
|-----------|-------|----------|
| **Data Safety Inaccuracy** | Form doesn't match behavior | Audit actual data collection, update form |
| **Broken Functionality** | Crashes or features don't work | Test on multiple Android versions |
| **Deceptive Behavior** | App does something undisclosed | Be transparent about all functionality |
| **Permissions** | Requesting unnecessary permissions | Only request permissions you actually need |
| **Metadata Policy** | Misleading description | Match description to actual app features |

---

## Screenshot Requirements

### Apple (App Store)

**Required Sizes:**
- **6.9" Display** (iPhone 16 Pro Max): 1320 x 2868 or 2868 x 1320
- **6.5" Display** (iPhone 15 Plus): 1284 x 2778 or 2778 x 1284
- **5.5" Display** (iPhone 8 Plus): 1242 x 2208 or 2208 x 1242 (optional)

**Best Practices:**
- 3-10 screenshots per device size
- Show key features: schedule, booking, profile
- Include text overlays explaining features
- First screenshot is most important (shows in search)

### Google Play

**Required:**
- Phone: 1080 x 1920 (or 16:9 equivalent) - 2-8 screenshots
- 7" Tablet: 1600 x 2560 (or 16:10 equivalent) - optional but recommended
- 10" Tablet: 1800 x 2560 (or 16:10 equivalent) - optional but recommended

**Feature Graphic:** 1024 x 500 PNG (required, shows at top of listing)

### Screenshot Checklist

Create screenshots showing:

1. **Schedule View** - Class list with filters
2. **Class Detail** - Description, instructor, book button
3. **Booking Confirmation** - Success state
4. **My Schedule** - Booked classes
5. **Profile/Account** - Stats, membership info
6. **Instructor View** (if relevant) - Today's classes, check-in

See `docs/app-store/screenshots/` for templates and examples.

---

## Post-Approval Maintenance

### Update Strategy

**Types of Updates:**

1. **Hot Fixes** (web bundle update via Capacitor)
   - No store approval needed
   - Deploy in minutes
   - For: bug fixes, content changes, minor UI tweaks

2. **Minor Updates** (store submission)
   - Requires review (usually 24-48 hours)
   - For: new features, significant UI changes

3. **Major Updates** (store submission)
   - Full review process
   - For: major new features, redesigns

### Version Numbering

```
MAJOR.MINOR.PATCH
1.0.0 - Initial release
1.0.1 - Bug fixes (hot fix possible)
1.1.0 - New features (store update)
2.0.0 - Major redesign (store update)
```

### Maintaining Both Stores

- Keep iOS and Android versions in sync
- Update both simultaneously when possible
- Monitor crash reports in both consoles
- Respond to user reviews promptly

---

## Quick Reference

### Timeline Expectations

| Task | Duration |
|------|----------|
| Apple Developer Account setup | 1-3 days |
| D-U-N-S Number | 1-2 weeks |
| Google Play Account setup | 1-2 days |
| Asset preparation | 2-5 days |
| Apple review | 24-48 hours (typical) |
| Google review | 2-7 days (first submission) |
| Total (first submission) | 2-4 weeks |

### Cost Summary

| Item | Cost |
|------|------|
| Apple Developer Program | $99/year |
| Google Play Developer | $25 (one-time) |
| D-U-N-S Number | Free |
| **Total First Year** | **$124** |
| **Annual Renewal** | **$99** |

### Support Resources

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Developer Policy](https://play.google.com/about/developer-content-policy/)
- [Capacitor Documentation](https://capacitorjs.com/docs)

---

*Last Updated: February 2026*
