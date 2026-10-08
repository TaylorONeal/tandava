# PRD-022: Home studio, travelling members, time zones, add to calendar

## Overview
**Priority:** P1 for the member app (store launch), P0 for time zones and calendar (they affect web booking today)
**Status:** Time zones and add-to-calendar implemented (this PR). Home studio: spec only.
**Origin:** Taylor, Oct 8 2026. Mindbody handles several studios, time zones and visiting another city badly.

---

## 1. Home studio, with room for several

### The tension to design around
A member wants one tap into their studio and an easy way to book elsewhere when they travel. A studio owner shares their link so members book with *them*. If a studio's own page or embed shows other studios' classes, owners stop sharing it, and the deep link (STORE-APPS.md) loses its reason to exist. So: **studio surfaces are single-studio, always. Discovery lives only in member-owned surfaces** (app home, the studio switcher, "Explore").

### Rules
1. **Home studio is automatic at first, chosen after that.** Someone with one studio has it as home without being asked. The first time they book at a second studio, the confirmation asks once: "Make Ubud Yoga your home studio?" (default no). Never auto-switch home.
2. **Deep link sets the studio for this visit, not the home.** Opening `/s/aloha-yoga` from Instagram shows Aloha Yoga; home stays where it was. Back in the app later, the member lands on home again.
3. **Switcher, not a marketplace.** The member app header shows the current studio's name with a chevron (the Slack-workspace pattern). The sheet lists: Home (starred), other studios they belong to or favorited (most recent first), then a quieter "Find another studio" row. One tap to switch.
4. **Favorite ≠ home.** Star any studio to keep it in the switcher. Home is the one starred studio the app opens to. Unstar removes it from the list, not the bookings.
5. **Discovery is present but quiet.** "Find another studio" appears in the switcher sheet and on the member's own schedule when it's empty, never on a studio page, embed, booking confirmation or email.
6. **Travelling is detected, not configured.** When the device time zone differs from home's at app open, show one dismissible line on the member's home: "You're on Hawaii time. Classes near you?" Tapping it opens Explore filtered to studios in that zone. No location permission needed; zone is enough to suggest, and the person picks.
7. **Passes stay with their studio.** A pack from Oxatl doesn't work at Aloha; the booking screen says so before checkout ("Your Oxatl pass doesn't apply here"), not after.

### Data (migration when built)
- `studio_members.is_favorite BOOLEAN DEFAULT FALSE`, `studio_members.last_visited_at TIMESTAMPTZ`
- `profiles.home_studio_id UUID NULL REFERENCES studios(id)`; unset means "the only studio"
- Fix the existing gap first: `book_class()` and member drop-in checkout must upsert `studio_members` (today only Express Booking and CSV import create the row, so self-registered members belong to no studio)
- `get_my_effective_role()` returns the highest role across all studios; the switcher needs a per-studio role or an owner at A is treated as owner at B

### Acceptance
- One-studio member: app opens straight to that studio's schedule, no switcher prompt.
- Deep link to another studio: shows that studio, home unchanged, switcher shows both after booking.
- Studio page, embed and confirmation contain no link to other studios.
- Device zone differs from home: one line, dismissible, never repeated the same day.

---

## 2. Time zones (implemented)

**Rule:** a scheduled class is shown in the studio's time, with the zone in plain words. When the viewer's device is in a different zone at that moment, add one line with their time. On-demand video shows no clock.

| Where | Before | Now |
|---|---|---|
| Storefront `/s/:slug` | Viewer's device time, no zone (a Hawaii class viewed from Austin showed Austin times) | Studio time + zone name |
| Express Booking | Studio time + "(CDT)" | Studio time, "Central time (CDT)", plus "That's 8:34 PM Wed your time (Hawaii time)" when different |
| Embed widget | Studio time, no zone | Studio time + zone name |
| Calendar file | none | UTC instant (lands correctly on any device) + studio zone named in the description |

Module: `src/lib/time/classTime.ts` (`describeClassTime`). Component: `src/components/time/ClassTime.tsx`.

### Test cases (`src/lib/time/classTime.test.ts`)
| Case | Studio | Viewer | Expect |
|---|---|---|---|
| Austin books Hawaii | Pacific/Honolulu 6:00 AM | America/Chicago | "Sat, Oct 10 · 6:00 – 7:00 AM", "Hawaii time (HST)", "That's 11:00 AM your time (Central time)" |
| Same zone | Chicago | Chicago | No viewer line |
| Date changes for viewer | Chicago Fri 7 PM | Asia/Makassar | "That's 8:00 AM Sat your time (Bali time)" |
| AM/PM across range | Chicago 11:30 | none | "11:30 AM – 12:30 PM" |
| Arizona, no DST | Phoenix | Los Angeles | No line in July, one-hour line in December |
| DST weekend | Chicago Sun Nov 1, 9 AM | Honolulu | "Central time (CST)", "5:00 AM your time" |
| Viewer zone unknown | Honolulu | none | Studio time and zone only |
| Livestream | Honolulu | New York | Studio time first, viewer line (12:00 PM Eastern) |
| On-demand | any | any | "Watch any time", no zone |

### Not covered yet
- Locations don't carry their own zone (only the studio does). A studio with locations in two zones needs `locations.timezone`; until then the studio zone is used.
- `delivery_mode` exists in TypeScript types but not in the database; livestream and on-demand rows can't be told apart from in-person in public RPCs yet.

---

## 3. Add to calendar (implemented)

One event, three outputs (`src/lib/calendar/classEvent.ts`, `src/components/calendar/AddToCalendar.tsx`):

| Platform | First button | Why |
|---|---|---|
| iPhone, iPad, Mac | Apple Calendar (.ics download) | Safari opens .ics in the "Add Event" sheet |
| Android | Google Calendar (template link) | Chrome on Android downloads .ics instead of offering to add it; the Google link opens the Calendar app |
| Other | Google, Apple/.ics, Outlook | |

All options stay visible; the user agent only sets the order.

**Event content**
- Title: "Power Vinyasa Flow at Oxatl Yoga" (class first, it's what you scan a week view for)
- Location: one line, venue then street, city, state ZIP, country when not US, so Apple Maps and Google Maps resolve it. Livestream: the join link.
- GEO latitude/longitude when the studio set it (Apple uses it for travel-time alerts)
- Description: teacher, room, time in studio words with zone, free-cancellation deadline in studio time, view/cancel link
- Times in UTC: correct instant on any device, no VTIMEZONE block to get wrong. Google link also passes `ctz` so its editor shows studio time.
- UID per occurrence + person, so adding twice updates rather than duplicates
- 1-hour reminder (Apple honours it; Google applies the user's default)

Validated: unit tests (escaping, 75-octet folding, CRLF, UTC, GEO, Google params) and parsed with the Python `icalendar` library.

### Device QA (still to do on real phones)
1. iPhone (Safari): Apple Calendar button opens the Add Event sheet, title, Hawaii class at the right local hour, address tappable into Maps.
2. iPhone in the member app (Capacitor WKWebView): blob downloads don't open the sheet in a WebView. Native shell needs the share sheet or a hosted `.ics` URL (`/api/ics/<booking>`). Gate for the app, not the web.
3. Pixel (Chrome): Google Calendar button opens the Calendar app with all fields; "Other (.ics)" downloads a file that Google Calendar can import.
4. Pixel set to Hawaii time, Austin class: event shows at the converted local time.
5. Outlook web: compose opens with title, time, location.

---

## Open questions
1. Should Explore be in v1 of the member app, or only the switcher (studios you already belong to)? Recommendation: switcher in v1, Explore once there are enough studios to make it worth a tap.
2. Guests have no account, so no home studio. Fine: Express Booking is per-studio by design.
