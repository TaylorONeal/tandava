# PRD-008: Self Check-In & QR Codes

## Overview
**Phase:** 3
**Priority:** P0
**Status:** Planned
**Owner:** TBD

---

## Jobs to Be Done

### Job 1: Frictionless Arrival
**When** I arrive at the studio for class,
**I want to** check in quickly without waiting in line,
**So I can** get to the studio and prepare for class.

### Job 2: Front Desk Efficiency
**When** multiple students arrive at once before a popular class,
**I want** them to self-check-in,
**So I can** handle other tasks and reduce bottlenecks.

### Job 3: Contactless Experience
**When** I prefer minimal contact,
**I want** a touchless check-in option,
**So I can** feel comfortable in the studio environment.

### Job 4: Attendance Accuracy
**When** running reports on class attendance,
**I want** reliable check-in data,
**So I can** make informed decisions about scheduling and capacity.

---

## User Stories

### US-8.1: QR Code Generation
**As a** member,
**I want** a unique QR code in my account,
**So that** I can scan it at the studio to check in instantly.

**Acceptance Criteria:**
- [ ] QR code displayed in mobile account view
- [ ] QR code encodes member ID + validation token
- [ ] Code refreshes periodically for security (daily)
- [ ] Can add to Apple Wallet / Google Wallet
- [ ] Works offline (scanner validates locally)

### US-8.2: Kiosk Mode
**As a** studio owner,
**I want** to set up a tablet as a self-check-in kiosk,
**So that** students can check in without staff assistance.

**Acceptance Criteria:**
- [ ] Dedicated kiosk URL (`/kiosk/:studioId`)
- [ ] Large, touch-friendly interface
- [ ] Shows today's classes with check-in buttons
- [ ] QR scanner integration (camera-based)
- [ ] Manual search by name/phone as fallback
- [ ] Prominent current time display
- [ ] Auto-locks after inactivity (configurable)
- [ ] Kiosk PIN to exit kiosk mode

### US-8.3: Camera-Based QR Scanning
**As a** studio,
**I want** the kiosk to use the tablet camera to scan member QR codes,
**So that** check-in is fast and contactless.

**Acceptance Criteria:**
- [ ] Camera preview shows on kiosk
- [ ] Scans QR code in <1 second
- [ ] Audio/visual feedback on successful scan
- [ ] Shows member name and photo for verification
- [ ] Auto-checks into next upcoming class
- [ ] Handles invalid/expired codes gracefully

### US-8.4: Staff QR Scanning
**As a** front desk staff member,
**I want** to scan member QR codes from my device,
**So that** I can quickly check people in during busy times.

**Acceptance Criteria:**
- [ ] Scan button in staff dashboard
- [ ] Works on phone or tablet
- [ ] Shows member info after scan
- [ ] One-tap check-in to any of their booked classes today
- [ ] Quick actions: check in, view profile, purchase

### US-8.5: Booking-at-Check-In
**As a** member who forgot to book,
**I want** to book and check in at the kiosk,
**So that** I don't have to wait in line or use my phone.

**Acceptance Criteria:**
- [ ] Kiosk shows "Not booked? Book now" option
- [ ] Lists classes with available spots
- [ ] Quick book flow (confirm, pay if needed)
- [ ] Immediate check-in after booking
- [ ] Handles payment (card on file or skip if membership)

---

## Edge Cases

### EC-1: No Booking Found
**Scenario:** Member scans QR but has no booking for today.
**Handling:**
- Show friendly message: "No booking found for today"
- Offer to show available classes to book
- If unlimited membership, allow check-in without booking (configurable)

### EC-2: Already Checked In
**Scenario:** Member scans QR but already checked in.
**Handling:**
- Show confirmation: "You're already checked in for [Class] at [Time]"
- Show class location/room reminder
- Don't create duplicate check-in

### EC-3: Wrong Class Time
**Scenario:** Member checks in 2 hours early for their class.
**Handling:**
- Warning: "Your class starts at [Time]. Check in now anyway?"
- Allow early check-in with confirmation
- Configurable: auto-check-in window (e.g., 30 min before)

### EC-4: Expired Membership
**Scenario:** Member's membership expired and they try to check in.
**Handling:**
- Show: "Your membership has expired"
- Offer to renew at kiosk (if enabled)
- Allow drop-in purchase
- Alert staff via notification

### EC-5: Kiosk Offline
**Scenario:** Kiosk loses internet connection.
**Handling:**
- Cache today's bookings and member data locally
- Process check-ins offline, sync when online
- Show "Offline Mode" indicator
- Log offline check-ins for reconciliation

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Self-check-in adoption | 70%+ | Self check-ins / total check-ins |
| Average check-in time | <5 seconds | Time from scan to confirmation |
| QR code usage | 50%+ | QR check-ins / self check-ins |
| Kiosk uptime | 99.5% | Uptime / expected uptime |
| Check-in accuracy | 99%+ | Accurate check-ins / total |

---

## Technical Design

### Database Schema

```sql
-- Member QR codes
CREATE TABLE member_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Code data
  code_token TEXT NOT NULL UNIQUE,
  code_data TEXT NOT NULL,  -- Encrypted payload

  -- Validity
  generated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),

  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0
);

-- Kiosk devices
CREATE TABLE kiosk_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id),

  name TEXT NOT NULL,
  device_token TEXT NOT NULL UNIQUE,

  -- Settings
  auto_lock_minutes INTEGER DEFAULT 30,
  allow_booking BOOLEAN DEFAULT true,
  allow_purchase BOOLEAN DEFAULT false,
  check_in_window_minutes INTEGER DEFAULT 30,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_heartbeat_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Check-in log (enhanced)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS
  check_in_method TEXT CHECK (check_in_method IN ('qr_scan', 'kiosk_manual', 'staff', 'auto'));

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS
  check_in_device_id UUID REFERENCES kiosk_devices(id);
```

### QR Code Format

```typescript
interface QRPayload {
  v: 1;                    // Version
  m: string;               // Member ID (truncated UUID)
  t: string;               // Token (for validation)
  e: number;               // Expiry timestamp
}

// Encoded as base64 URL-safe string
// Example: "v1.m-abc123.t-xyz789.e-1707123456"
```

### Kiosk API

```
GET  /api/kiosk/:deviceToken/classes     # Today's classes
POST /api/kiosk/:deviceToken/scan        # Process QR scan
POST /api/kiosk/:deviceToken/checkin     # Manual check-in
POST /api/kiosk/:deviceToken/book        # Book and check-in
GET  /api/kiosk/:deviceToken/heartbeat   # Keep-alive
```

---

## UI Wireframes

### Kiosk Home Screen
```
┌─────────────────────────────────────┐
│  [Studio Logo]     10:45 AM         │
├─────────────────────────────────────┤
│                                     │
│   ┌─────────────────────────────┐   │
│   │                             │   │
│   │   [QR Scanner Viewfinder]   │   │
│   │                             │   │
│   │   Scan your QR code         │   │
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │
│   ─────────── or ───────────        │
│                                     │
│   [  Find My Booking  ]             │
│                                     │
│   Today's Classes:                  │
│   • 11:00 AM - Vinyasa (5 spots)    │
│   • 12:15 PM - Hot Yoga (2 spots)   │
│   • 5:30 PM - Yin (8 spots)         │
│                                     │
└─────────────────────────────────────┘
```

### Check-In Success
```
┌─────────────────────────────────────┐
│                                     │
│         ✓ Checked In!               │
│                                     │
│   [Member Photo]                    │
│   Sarah Chen                        │
│                                     │
│   11:00 AM Vinyasa Flow             │
│   Room A                            │
│                                     │
│   Enjoy your practice!              │
│                                     │
│   [Auto-dismiss in 5s]              │
│                                     │
└─────────────────────────────────────┘
```

---

## Dependencies

- Camera access (for QR scanning)
- Service Worker (for offline capability)
- Web Crypto API (for token validation)

---

## Rollout Plan

1. **Alpha:** QR codes for members (display only)
2. **Beta:** Staff QR scanning
3. **GA:** Full kiosk mode with all features

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-02-05 | 1.0 | Claude | Initial PRD |
