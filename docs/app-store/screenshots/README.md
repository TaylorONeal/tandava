# App Store Screenshots

This folder contains screenshot templates and guidelines for app store submissions.

## Required Screenshots

### For Apple App Store

Create screenshots for each device size:

| Device | Resolution | Required |
|--------|------------|----------|
| iPhone 16 Pro Max (6.9") | 1320 x 2868 | Yes |
| iPhone 15 Plus (6.5") | 1284 x 2778 | Yes |
| iPhone 8 Plus (5.5") | 1242 x 2208 | Optional |
| iPad Pro 12.9" | 2048 x 2732 | If supporting iPad |

### For Google Play

| Device | Resolution | Required |
|--------|------------|----------|
| Phone | 1080 x 1920 | Yes (min 2) |
| 7" Tablet | 1600 x 2560 | Recommended |
| 10" Tablet | 1800 x 2560 | Recommended |
| Feature Graphic | 1024 x 500 | Yes |

## Screenshot Sequence

Create these 6 screenshots in order (first screenshot is most important):

### 1. Hero - Schedule (REQUIRED FIRST)
**Filename**: `01-schedule.png`
**Shows**: Class schedule with multiple classes visible
**Text Overlay**: "Book Your Perfect Class"
**Why First**: Schedule browsing is primary user action

### 2. Class Detail & Booking
**Filename**: `02-class-detail.png`
**Shows**: Class detail modal with book button
**Text Overlay**: "Easy Booking in Seconds"

### 3. Booking Confirmation
**Filename**: `03-booking-confirmed.png`
**Shows**: Success confirmation with class details
**Text Overlay**: "You're Booked!"

### 4. My Classes
**Filename**: `04-my-schedule.png`
**Shows**: Upcoming booked classes
**Text Overlay**: "Track Your Practice"

### 5. Profile & Progress
**Filename**: `05-profile.png`
**Shows**: Member profile with stats
**Text Overlay**: "See Your Progress"

### 6. Instructor View (optional)
**Filename**: `06-instructor.png`
**Shows**: Teacher dashboard with check-in
**Text Overlay**: "For Instructors Too"

## Screenshot Style Guide

### Text Overlays

- **Font**: DM Sans Bold or system font
- **Size**: 60-80pt for headlines
- **Color**: White with subtle shadow OR dark on light background
- **Position**: Top 20% of screenshot
- **Keep it short**: 3-5 words max

### Device Frame

Options (choose one style for consistency):
1. **No frame** - Just the screenshot
2. **Minimal frame** - Thin device outline
3. **Full device mockup** - Complete phone render

Recommendation: **No frame** for cleaner look, more content visible.

### Background

If using backgrounds behind device mockups:
- Match brand colors (#D4A72C gold, #FAF8F5 cream)
- Subtle gradient or solid color
- Avoid busy patterns

## Screenshot Capture Process

### Using Simulator (Recommended)

```bash
# iOS Simulator
# Press Cmd+S in Simulator to capture

# Android Emulator
# Press Cmd+S or use Device > Take Screenshot
```

### Using Real Device

**iPhone**:
1. Navigate to screen
2. Press Side button + Volume Up
3. Screenshot saves to Photos
4. AirDrop to Mac or use cloud sync

**Android**:
1. Navigate to screen
2. Press Power + Volume Down
3. Screenshot saves to gallery
4. Transfer via USB or cloud

### Best Practices

1. **Use demo data** that looks realistic
   - Real-sounding class names
   - Believable instructor names
   - Reasonable times and prices

2. **Show success states**
   - Full bookings visible
   - Positive messaging
   - Active engagement

3. **Clean UI state**
   - No error messages
   - No loading spinners
   - No keyboard visible (unless relevant)

4. **Time/Status bar**
   - Full battery
   - Full signal
   - Realistic time (not 9:41 which looks staged)

## File Organization

```
screenshots/
├── README.md (this file)
├── ios/
│   ├── 6.9-inch/
│   │   ├── 01-schedule.png
│   │   ├── 02-class-detail.png
│   │   └── ...
│   ├── 6.5-inch/
│   └── 5.5-inch/
├── android/
│   ├── phone/
│   ├── 7-inch-tablet/
│   └── 10-inch-tablet/
├── feature-graphic.png (1024x500 for Google Play)
└── templates/
    └── text-overlay-template.psd
```

## Feature Graphic (Google Play Only)

**Size**: 1024 x 500 pixels
**Format**: PNG or JPEG

**Content**:
- Studio logo/name
- Tagline: "Book Yoga Classes"
- Preview of app UI (optional)
- Brand colors

**Example Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   [Logo]  Studio Name                                       │
│           ──────────────                                    │
│           Book Yoga Classes Anytime                         │
│                                                             │
│                              [Phone mockup with app]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Localization

If supporting multiple languages, create separate screenshot sets:

```
screenshots/
├── en-US/
│   ├── ios/
│   └── android/
├── es-ES/
│   ├── ios/
│   └── android/
└── ...
```

Update text overlays for each language.

---

## Quick Checklist

Before submission, verify:

- [ ] All required device sizes covered
- [ ] Screenshots show actual app (not mockups)
- [ ] Text is readable and correctly spelled
- [ ] Brand colors consistent across all screenshots
- [ ] No placeholder content visible
- [ ] Feature graphic created (Google Play)
- [ ] Files named and organized correctly
