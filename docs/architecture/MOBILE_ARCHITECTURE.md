# Mobile Architecture

Technical architecture for iOS and Android native applications.

---

## Overview

Tandava mobile apps serve **members**—the people who attend classes. Staff and admin functions remain web-only.

```
┌─────────────────────────────────────────────────────────────────┐
│                         TANDAVA                                 │
├─────────────────────────────┬───────────────────────────────────┤
│   WEB APPLICATION           │   MOBILE APPS                     │
│   (Full Platform)           │   (Member Experience)             │
├─────────────────────────────┼───────────────────────────────────┤
│ • Owner dashboard           │ • Schedule browsing               │
│ • Staff scheduling          │ • Class booking                   │
│ • Member management         │ • Check-in (QR)                   │
│ • Financial reports         │ • Push notifications              │
│ • Settings & config         │ • Offline schedule                │
│ • Consumer website          │ • Account overview                │
│ • Booking pages             │                                   │
│ • Payment flows             │                                   │
└─────────────────────────────┴───────────────────────────────────┘
```

**Mobile apps are intentionally focused.** They do one job extremely well: help members book and attend classes.

---

## Architecture Principles

### 1. API-First

Mobile apps consume the same API as the web application. No mobile-specific backends.

```
┌──────────────┐     ┌──────────────┐
│   iOS App    │     │ Android App  │
└──────┬───────┘     └──────┬───────┘
       │                    │
       └────────┬───────────┘
                │
                ▼
        ┌───────────────┐
        │  Supabase     │
        │  REST API     │
        │  + Realtime   │
        └───────────────┘
```

**Benefits:**
- Single source of truth
- Consistent business logic
- No sync issues between platforms
- Easier maintenance

### 2. Offline-First for Critical Paths

Schedule viewing works offline. Booking requires connectivity but queues gracefully.

```
┌─────────────────────────────────────────────────────┐
│                    iOS / Android                    │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐                │
│  │ Local Cache │◄──►│ Sync Engine │                │
│  │ (Schedule,  │    │             │                │
│  │  Bookings)  │    └──────┬──────┘                │
│  └─────────────┘           │                       │
│                            ▼                       │
│                   ┌─────────────────┐              │
│                   │ Network Layer   │              │
│                   │ (Retry, Queue)  │              │
│                   └────────┬────────┘              │
└────────────────────────────┼────────────────────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │   Supabase  │
                      └─────────────┘
```

### 3. Native Where It Matters

Platform APIs for interactions that users expect to "feel right."

| Interaction | Native API |
|-------------|------------|
| Navigation | UIKit/SwiftUI Navigation, Jetpack Navigation |
| Auth | Sign in with Apple, Google Identity |
| Notifications | APNs, FCM |
| Biometrics | LocalAuthentication, BiometricPrompt |
| Camera | AVFoundation, CameraX |
| Calendar | EventKit, CalendarProvider |
| Haptics | UIFeedbackGenerator, VibrationEffect |

---

## Feature Breakdown

### Core Features (P0)

#### Schedule Browsing

```
User opens app
       │
       ▼
┌─────────────────┐
│ Load schedule   │──► Cache hit? Show immediately
│ from cache      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Fetch updates   │──► Merge with cache
│ in background   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Display updated │
│ schedule        │
└─────────────────┘
```

**Data model:**
```
ScheduleCache
├── class_occurrences[]
│   ├── id
│   ├── class_name
│   ├── instructor_name
│   ├── start_time
│   ├── end_time
│   ├── location_name
│   ├── spots_remaining
│   └── is_bookable
├── last_sync_timestamp
└── selected_location_id
```

**Filters:**
- Date (today, tomorrow, this week, custom)
- Location
- Class type
- Instructor
- Time of day

#### Class Booking

```
User taps "Book"
       │
       ▼
┌─────────────────┐     ┌─────────────────┐
│ Check           │────►│ Show entitlement│
│ entitlements    │ No  │ purchase prompt │
└────────┬────────┘     └─────────────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Optimistic UI   │──► Show "Booked" immediately
│ update          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ API request     │────►│ Revert UI       │
│                 │ Fail│ Show error      │
└────────┬────────┘     └─────────────────┘
         │ Success
         ▼
┌─────────────────┐
│ Confirm booking │
│ + haptic + notif│
└─────────────────┘
```

#### Check-In

Two modes:
1. **QR Code** — Scan studio's QR code
2. **Tap Check-in** — One-tap when at location (with geofencing)

```
┌─────────────────┐
│ Camera View     │
│ (QR Scanner)    │
└────────┬────────┘
         │ QR Detected
         ▼
┌─────────────────┐
│ Validate        │
│ • Booking exists│
│ • Within window │
│ • Correct class │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Confirm         │
│ check-in        │
│ + haptic        │
└─────────────────┘
```

#### Push Notifications

| Notification Type | Trigger | Timing |
|-------------------|---------|--------|
| Class reminder | Booking exists | 2hr before, 30min before |
| Booking confirmed | Booking created | Immediate |
| Booking cancelled | Booking cancelled | Immediate |
| Waitlist promoted | Spot opened | Immediate |
| Class cancelled | Class cancelled | Immediate |
| New schedule posted | Weekly schedule | Studio-configured |

**Payload structure:**
```json
{
  "type": "class_reminder",
  "booking_id": "uuid",
  "class_name": "Vinyasa Flow",
  "start_time": "2024-01-15T09:00:00Z",
  "location_name": "Downtown Studio",
  "deep_link": "tandava://booking/uuid"
}
```

### Supporting Features (P1)

#### Offline Schedule Cache

- Store 7 days of schedule data
- Background refresh when app opens
- Graceful degradation messaging

**iOS:** Core Data with NSPersistentCloudKitContainer
**Android:** Room with WorkManager for background sync

#### Account Overview

Read-only view of:
- Current membership status
- Remaining class pack credits
- Recent bookings
- Upcoming bookings

**Not editable in app** — changes redirect to web.

#### Favorites

- Favorite instructors
- Favorite class types
- Quick filters on schedule

### Future Features (P2)

| Feature | Description |
|---------|-------------|
| Widgets | "Next class" home screen widget |
| App Shortcuts | "Book my usual class" Siri/Assistant |
| Apple Watch | Glanceable upcoming class |
| Calendar sync | Export bookings to system calendar |
| Location-aware | Auto-show nearest location |

---

## Data Architecture

### Local Storage

**iOS:**
```swift
// Core Data entities
ClassOccurrence
├── id: UUID
├── className: String
├── instructorName: String
├── startTime: Date
├── endTime: Date
├── locationId: UUID
├── spotsRemaining: Int16
├── lastSynced: Date

Booking
├── id: UUID
├── classOccurrenceId: UUID
├── status: String (confirmed, cancelled, checked_in)
├── createdAt: Date

UserProfile
├── id: UUID
├── membershipType: String?
├── packCreditsRemaining: Int16
└── studioId: UUID
```

**Android:**
```kotlin
// Room entities
@Entity
data class ClassOccurrence(
    @PrimaryKey val id: String,
    val className: String,
    val instructorName: String,
    val startTime: Instant,
    val endTime: Instant,
    val locationId: String,
    val spotsRemaining: Int,
    val lastSynced: Instant
)

@Entity
data class Booking(
    @PrimaryKey val id: String,
    val classOccurrenceId: String,
    val status: BookingStatus,
    val createdAt: Instant
)
```

### Sync Strategy

```
App Launch
    │
    ├──► Load from cache (immediate display)
    │
    └──► Fetch delta from server
            │
            ├──► Merge changes
            │
            └──► Update UI reactively
```

**Conflict resolution:** Server wins. Mobile is read-heavy, write-light.

---

## Authentication

### Supported Methods

| Method | iOS | Android |
|--------|-----|---------|
| Email + Password | Yes | Yes |
| Sign in with Apple | Yes (required) | Optional |
| Sign in with Google | Yes | Yes |
| Magic Link | Yes | Yes |

### Session Management

- Tokens stored in Keychain (iOS) / EncryptedSharedPreferences (Android)
- Refresh tokens handled automatically
- Biometric unlock for quick re-auth
- Session timeout: 30 days inactive

### Biometric Authentication

```
App Resume (from background)
        │
        ▼
┌─────────────────┐
│ Session valid?  │──► No ──► Full login required
└────────┬────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Biometric       │──► Fail ──► PIN/Password fallback
│ prompt          │
└────────┬────────┘
         │ Success
         ▼
┌─────────────────┐
│ Resume session  │
└─────────────────┘
```

---

## Deep Linking

### URL Scheme

```
tandava://                          # App home
tandava://schedule                  # Schedule view
tandava://schedule?date=2024-01-15  # Specific date
tandava://class/{id}                # Class detail
tandava://booking/{id}              # Booking detail
tandava://checkin                   # Check-in camera
tandava://profile                   # Account view
```

### Universal Links (iOS) / App Links (Android)

```
https://[studio].tandava.app/schedule
https://[studio].tandava.app/class/{id}
https://[studio].tandava.app/book/{id}
```

---

## Error Handling

### Network Errors

| Scenario | Behavior |
|----------|----------|
| No connectivity | Show cached data + "Offline" indicator |
| Request timeout | Retry with exponential backoff (3 attempts) |
| Server error (5xx) | Show error + retry button |
| Auth expired | Silent refresh, then retry |

### Booking Errors

| Error | Message | Action |
|-------|---------|--------|
| Class full | "This class is full" | Offer waitlist |
| No entitlement | "You need a membership or class pack" | Link to web purchase |
| Already booked | "You're already booked" | Show booking |
| Past class | "This class has already started" | Refresh schedule |

---

## Analytics Events

| Event | Parameters | Purpose |
|-------|------------|---------|
| `app_open` | `source` (notification, direct, deep_link) | Usage patterns |
| `schedule_view` | `date`, `location_id` | Popular times/locations |
| `class_view` | `class_id`, `source` | Discovery patterns |
| `booking_tap` | `class_id` | Intent tracking |
| `booking_success` | `class_id`, `entitlement_type` | Conversion |
| `booking_error` | `class_id`, `error_type` | Friction points |
| `checkin_success` | `booking_id`, `method` (qr, tap) | Check-in patterns |
| `notification_tap` | `notification_type` | Engagement |

---

## Security Requirements

- [ ] All API calls over HTTPS
- [ ] Certificate pinning for production
- [ ] Tokens in secure storage only
- [ ] No sensitive data in logs
- [ ] Biometric auth for sensitive actions
- [ ] App Transport Security (iOS) enabled
- [ ] ProGuard/R8 obfuscation (Android)
- [ ] No hardcoded secrets in binary

---

## Testing Strategy

### Unit Tests

- Business logic (booking validation, cache merging)
- Data transformations
- State management

### Integration Tests

- API client against staging
- Database operations
- Authentication flows

### UI Tests

- Critical paths (browse → book → check-in)
- Error states
- Offline behavior

### Manual QA Checklist

- [ ] Fresh install flow
- [ ] Upgrade from previous version
- [ ] Offline → online transition
- [ ] Background → foreground
- [ ] Notification tap behavior
- [ ] Deep link handling
- [ ] Low memory conditions
- [ ] Poor network conditions

---

## Release Process

### Pre-Release

1. Feature complete on `develop`
2. QA regression pass
3. Beta distribution (TestFlight / Firebase App Distribution)
4. Stakeholder sign-off

### App Store Submission

1. Version bump
2. Build archive
3. Submit for review
4. Monitor for rejection feedback
5. Phased rollout (iOS) / staged rollout (Android)

### Post-Release

- Monitor crash reports (Firebase Crashlytics)
- Monitor analytics for regressions
- Hotfix process for critical issues

---

## Related Documentation

- [APP_STORE_COMPLIANCE.md](APP_STORE_COMPLIANCE.md) — Store submission requirements
- [../design/06-cross-platform.md](../design/06-cross-platform.md) — Design token exports
- [../developer/04-integrations.md](../developer/04-integrations.md) — API integration patterns

