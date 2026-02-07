# Cross-Platform Design

How design tokens and components translate across Web, iOS, and Android.

---

## Philosophy: Shared Core, Native Shell

Design tokens are the **single source of truth**. Platform implementation is **native**.

```
┌─────────────────────────────────────────────────────────────────┐
│                    DESIGN TOKEN LAYER                           │
│              tokens/tokens.json (single source)                 │
├─────────────────────────────────────────────────────────────────┤
│                      BUILD PIPELINE                             │
│               Style Dictionary / Token Transform                │
├──────────────────┬──────────────────┬───────────────────────────┤
│    WEB OUTPUT    │   iOS OUTPUT     │    ANDROID OUTPUT         │
│  tokens.css      │  Tokens.swift    │  Tokens.kt                │
│  tailwind.config │  Colors.xcassets │  colors.xml               │
│                  │  Typography.swift│  Typography.kt            │
├──────────────────┼──────────────────┼───────────────────────────┤
│      WEB         │     iOS APP      │     ANDROID APP           │
│  React + Vite    │  SwiftUI/UIKit   │  Jetpack Compose          │
│  Tailwind CSS    │  Native nav      │  Material 3               │
│  Full experience │  Native gestures │  Native patterns          │
└──────────────────┴──────────────────┴───────────────────────────┘
```

**Key principle:** Tokens flow down. Implementation choices stay platform-native.

---

## Token Export Workflow

### Source File

`docs/design/tokens/tokens.json` is the canonical source.

```json
{
  "core": {
    "spacing": { "xs": 4, "sm": 8, "md": 16, "lg": 24, "xl": 32 },
    "radius": { "sm": 4, "md": 8, "lg": 12, "full": 9999 }
  },
  "brand": {
    "color": {
      "primary": "#C41230",
      "secondary": "#169179",
      "accent": "#D4A574"
    }
  }
}
```

### Generated Outputs

#### Web: CSS Custom Properties

```css
/* Generated: tokens.css */
:root {
  /* Core */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Brand */
  --color-primary: #C41230;
  --color-secondary: #169179;
  --color-accent: #D4A574;
}
```

#### iOS: Swift Constants

```swift
// Generated: Tokens.swift
import SwiftUI

enum Spacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
}

enum Radius {
    static let sm: CGFloat = 4
    static let md: CGFloat = 8
    static let lg: CGFloat = 12
    static let full: CGFloat = .infinity
}

extension Color {
    static let brandPrimary = Color(hex: "C41230")
    static let brandSecondary = Color(hex: "169179")
    static let brandAccent = Color(hex: "D4A574")
}
```

#### Android: Kotlin/Compose

```kotlin
// Generated: Tokens.kt
package com.tandava.design

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

object Spacing {
    val xs = 4.dp
    val sm = 8.dp
    val md = 16.dp
    val lg = 24.dp
    val xl = 32.dp
}

object Radius {
    val sm = 4.dp
    val md = 8.dp
    val lg = 12.dp
}

object BrandColors {
    val Primary = Color(0xFFC41230)
    val Secondary = Color(0xFF169179)
    val Accent = Color(0xFFD4A574)
}
```

---

## Platform-Specific Token Mapping

| Token | Web (CSS) | iOS (Swift) | Android (Compose) |
|-------|-----------|-------------|-------------------|
| `spacing.md: 16` | `16px` | `16.0` (CGFloat) | `16.dp` |
| `radius.md: 8` | `8px` | `8.0` (cornerRadius) | `8.dp` (RoundedCornerShape) |
| `color.primary` | `#C41230` | `Color(hex:)` | `Color(0xFFC41230)` |
| `fontSize.base: 16` | `1rem` / `16px` | `16.0` (system scaled) | `16.sp` |
| `shadow.md` | `box-shadow` | `shadow()` modifier | `Modifier.shadow()` |

### Typography Scaling

| Platform | Base Size | Scaling |
|----------|-----------|---------|
| Web | 16px (1rem) | CSS clamp() or media queries |
| iOS | System body | Dynamic Type support required |
| Android | 16sp | sp units respect user settings |

**Requirement:** All platforms must respect user accessibility settings for text size.

---

## Native vs Shared Decision Framework

### Always Native

These must use platform APIs for UX quality and App Store compliance:

| Feature | iOS | Android | Why |
|---------|-----|---------|-----|
| **Navigation** | NavigationStack | NavHost | Gestures, deep links, back behavior |
| **Authentication** | ASAuthorizationController | CredentialManager | Face ID, fingerprint, platform SSO |
| **Push notifications** | APNs + UNUserNotificationCenter | FCM + NotificationManager | Rich notifications, actions |
| **Biometrics** | LAContext | BiometricPrompt | Security, consistent UX |
| **Calendar integration** | EventKit | CalendarContract | System calendar sync |
| **Payment sheets** | PKPaymentAuthorizationController | Google Pay API | Trust, security |
| **Camera/QR scanning** | AVFoundation | CameraX | Performance, permissions |
| **Haptics** | UIFeedbackGenerator | VibrationEffect | Platform-appropriate feedback |
| **Share sheets** | UIActivityViewController | ShareSheet | Native app targets |
| **Pull to refresh** | UIRefreshControl | SwipeRefresh | Expected gesture |

### Token-Driven (Shared Design, Native Implementation)

These use shared tokens but native rendering:

| Component | Shared | Native |
|-----------|--------|--------|
| Buttons | Colors, radius, typography | Touch targets, ripple/highlight |
| Cards | Spacing, elevation, radius | Shadow rendering |
| Forms | Spacing, colors | Input behavior, keyboards |
| Lists | Spacing, dividers | Scroll physics, cell recycling |
| Loading states | Colors, animation timing | Native spinner/skeleton |

### Web-Only (Not in Mobile Apps)

| Feature | Why Web-Only |
|---------|--------------|
| Staff dashboards | Desktop workflow, not mobile use case |
| Data tables | Complex interaction, screen real estate |
| Admin settings | Low frequency, complexity |
| Report generation | Typically exports to PDF/CSV |
| Bulk operations | Desktop efficiency tool |

---

## iOS App Store Compliance

### Rejection Risks and Mitigations

| Risk | Apple's Concern | Mitigation |
|------|-----------------|------------|
| WebView-only app | "Better suited as website" | Substantial native features (below) |
| Non-native navigation | Poor UX | Use NavigationStack, respect swipe-back |
| Missing Sign in with Apple | Required if any social login | Implement ASAuthorizationController |
| WebView for core features | Guideline 4.2 | Native booking flow, schedule, check-in |
| No added value over Safari | Guideline 4.2 | Offline, notifications, widgets, shortcuts |

### Required Native Features (for approval)

- [ ] Native navigation (NavigationStack/UINavigationController)
- [ ] Native schedule viewing and filtering
- [ ] Native class booking confirmation
- [ ] Native check-in (camera/QR)
- [ ] Push notifications (class reminders, booking confirmations)
- [ ] Sign in with Apple (if any third-party auth)
- [ ] Offline schedule cache (Core Data)
- [ ] App Shortcuts / Siri integration
- [ ] Widget for upcoming class

### Acceptable WebView Usage

| Use Case | Acceptable? | Notes |
|----------|-------------|-------|
| Complex checkout with Stripe | Yes | External payment processor |
| Terms of service | Yes | Legal content |
| Help/FAQ pages | Yes | Support content |
| Event custom forms | Yes | Studio-configured content |
| Core booking flow | No | Must be native |
| Schedule viewing | No | Must be native |

---

## Android-Specific Considerations

### Material 3 Alignment

| Tandava Token | Material 3 Equivalent |
|---------------|----------------------|
| `color.primary` | `colorScheme.primary` |
| `color.secondary` | `colorScheme.secondary` |
| `color.surface` | `colorScheme.surface` |
| `radius.md` | `ShapeDefaults.Medium` |
| `elevation.md` | `tonalElevation` |

### Required Adaptations

- **Edge-to-edge** — Support system bars, gesture navigation
- **Predictive back** — Implement predictive back gesture (Android 14+)
- **Large screens** — Tablet/foldable layouts
- **Dynamic color** — Optional Material You support

---

## Component Parity Across Platforms

Where possible, use consistent component names:

| Component | Web (React) | iOS (SwiftUI) | Android (Compose) |
|-----------|-------------|---------------|-------------------|
| ClassCard | `<ClassCard />` | `ClassCardView` | `ClassCard()` |
| BookingButton | `<BookingButton />` | `BookingButton` | `BookingButton()` |
| ScheduleGrid | `<ScheduleGrid />` | `ScheduleGridView` | `ScheduleGrid()` |
| InstructorAvatar | `<InstructorAvatar />` | `InstructorAvatarView` | `InstructorAvatar()` |

**Props/parameters should align:**

```
// All platforms
ClassCard(
  title: String,
  instructor: String,
  time: DateTime,
  spotsRemaining: Int,
  onBook: () -> Void
)
```

---

## Mobile App Scope

### In-App (Native)

| Feature | Priority | Notes |
|---------|----------|-------|
| Schedule browsing | P0 | Filter by location, instructor, class type |
| Class booking | P0 | Single-tap book for entitled members |
| Booking management | P0 | View, cancel upcoming bookings |
| Check-in | P0 | QR scan or tap-to-confirm |
| Push notifications | P0 | Reminders, confirmations, waitlist updates |
| Profile | P1 | View membership, remaining credits |
| Purchase history | P1 | Past transactions |
| Offline schedule | P1 | Cached for poor connectivity |
| Favorites | P2 | Favorite instructors, class types |
| Widgets | P2 | Next class widget |

### Web-Only (Link Out)

| Feature | Reason |
|---------|--------|
| Membership purchase | Complex Stripe flows, edge cases |
| Class pack purchase | Same as above |
| Account settings | Low frequency |
| Payment method management | Stripe customer portal |
| Staff/admin interfaces | Desktop workflow |

---

## Build Pipeline

### Recommended: Style Dictionary

```yaml
# config.json
{
  "source": ["tokens/tokens.json"],
  "platforms": {
    "css": {
      "transformGroup": "css",
      "buildPath": "build/web/",
      "files": [{
        "destination": "tokens.css",
        "format": "css/variables"
      }]
    },
    "ios-swift": {
      "transformGroup": "ios-swift",
      "buildPath": "build/ios/",
      "files": [{
        "destination": "Tokens.swift",
        "format": "ios-swift/class.swift"
      }]
    },
    "android": {
      "transformGroup": "android",
      "buildPath": "build/android/",
      "files": [{
        "destination": "Tokens.kt",
        "format": "compose/object"
      }]
    }
  }
}
```

### CI Validation

```yaml
# Validate token sync on every PR
- name: Build tokens
  run: npx style-dictionary build

- name: Check for changes
  run: |
    git diff --exit-code build/
    # Fails if generated files don't match committed
```

---

## Brand Customization Flow

When a studio customizes their brand:

```
Studio Admin (Web)
       │
       ▼
┌─────────────────┐
│ Brand Settings  │  ← Studio uploads logo, picks colors
│ (Web UI)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Studio Config   │  ← Stored in database
│ (API)           │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│              RUNTIME APPLICATION            │
├─────────────────┬─────────────┬─────────────┤
│ Web             │ iOS         │ Android     │
│ CSS variables   │ @AppStorage │ DataStore   │
│ set at runtime  │ + Color     │ + Compose   │
│                 │ extension   │ theme       │
└─────────────────┴─────────────┴─────────────┘
```

### Mobile Runtime Theming

**iOS:**
```swift
@AppStorage("brandPrimaryColor") var primaryColorHex: String = "C41230"

var brandPrimary: Color {
    Color(hex: primaryColorHex)
}
```

**Android:**
```kotlin
val brandPrimary by remember {
    studioConfig.collectAsState().map { Color(it.primaryColorHex) }
}

MaterialTheme(
    colorScheme = MaterialTheme.colorScheme.copy(
        primary = brandPrimary
    )
)
```

---

## Maintainability Checklist

- [ ] Single token source (`tokens.json`)
- [ ] Automated token export (CI pipeline)
- [ ] Consistent component naming across platforms
- [ ] Shared API contracts (all platforms use same backend)
- [ ] Platform-specific code only where necessary
- [ ] Feature flags for platform-specific rollout
- [ ] Accessibility compliance on all platforms

---

## Related Documentation

- [02-design-tokens.md](02-design-tokens.md) — Token schema details
- [05-components.md](05-components.md) — Component inventory
- [tokens/tokens.json](tokens/tokens.json) — Source token file
- [../developer/02-architecture.md](../developer/02-architecture.md) — System architecture

