# PRD-022: Home studio, travelling members, time zones, add to calendar

## Overview
**Priority:** P1 for the member app (store launch), P0 for time zones and calendar (they affect web booking today)
**Status:** Time zones and add-to-calendar implemented (this PR). Home studio: spec only.
**Origin:** Taylor, Oct 8 2026. Mindbody handles several studios, time zones and visiting another city badly.

---

## 1. Home studio, with room for several

### The tension to design around
A member wants one tap into their studio and an easy way to book elsewhere when they travel. A studio owner shares their link so members book with *them*. If a studio's own page or embed shows other studios' classes, owners stop sharing it, and the deep link (STORE-APPS.md) loses its reason to exist.

### The rule: the chrome is ours, the canvas is theirs
Every screen has two layers. The **canvas** (studio page, schedule, class, booking form, confirmation, emails) belongs to the studio: its name, colors, classes, passes, and nothing from any other business. The **chrome** (the app's header and tab bar, the member's own profile area, the studio switcher) belongs to Tandava and to the member. The rest of the app is always reachable from the chrome, never from inside the canvas. Nothing on a studio's canvas ever says "find another studio".

| Surface | Canvas (studio's) | Chrome (member's) |
|---|---|---|
| Member app, any studio screen | Studio header, schedule, booking | Tab bar: **Studio · Bookings · Passes · Me**; studio name with a chevron in the header (switcher) |
| Web studio page `/s/:slug` | Everything on the page | Signed in: the avatar menu top right **is** the web's Me surface (My bookings, Passes, Explore, Account); the web has no tab bar. Signed out: a small "Booking by Tandava" wordmark in the footer, no call to action |
| Embed on the studio's own site | Schedule and Book buttons | Nothing. The embed is the studio's site |
| Booking confirmation, emails | Studio, class, calendar, save-your-details | Nothing |

"Explore" (never "find another studio") lives in exactly two places: the last row of the studio switcher, and the **Me** surface (the Me tab in the app, the avatar menu on the web). Two taps from anywhere, zero taps on a studio's canvas. Explore shows studios on Tandava near the member, with the network classes from PRD-023 when that ships. Until there are enough studios in a city to make browsing useful, Explore shows the member's own studios plus a search box, and nothing else.

### Rules
1. **Home studio is automatic at first, chosen after that.** Someone with one studio has it as home without being asked. The first time they book at a second studio, the confirmation asks once: "Make Ubud Yoga your home studio?" (default no). Never auto-switch home.
2. **Deep link sets the studio for this visit, not the home.** Opening `/s/aloha-yoga` from Instagram shows Aloha Yoga; home stays where it was. Back in the app later, the member lands on home again.
3. **Switcher, not a marketplace.** The header shows the current studio's name with a chevron (the Slack-workspace pattern). The sheet lists: Home (starred), other studios they belong to or starred (most recent first), then a quieter "Explore" row. One tap to switch.
4. **Favorite is not home.** Star any studio to keep it in the switcher. Home is the one starred studio the app opens to. Unstar removes it from the list, not the bookings.
5. **Travelling is detected, not configured.** When the device time zone differs from home's at app open, show one dismissible line on the member's own home tab: "You're on Hawaii time. Studios near you?" Tapping it opens Explore filtered to that zone. No location permission needed. Never repeated the same day.
6. **Passes: say what works, link to the rest, quietly.** On a booking screen the options shown are the ones that apply here: a covering pass or membership, a network credit (PRD-023), or the drop-in price. Passes from other studios are not listed as "doesn't apply here"; a muted "Your passes" link under the options opens the Passes tab, where every pass is grouped by the studio it belongs to and shows where it works. The studio's screen stays about the studio; the member can still find everything they own in one tap.

### Data (migration when built)
- `studio_members.is_favorite BOOLEAN DEFAULT FALSE`, `studio_members.last_visited_at TIMESTAMPTZ`
- `profiles.home_studio_id UUID NULL REFERENCES studios(id)`; unset means "the only studio"
- Fix the existing gap first: `book_class()` and member drop-in checkout must upsert `studio_members` (today only Express Booking and CSV import create the row, so self-registered members belong to no studio)
- `get_my_effective_role()` returns the highest role across all studios; the switcher needs a per-studio role or an owner at A is treated as owner at B

### Acceptance
- One-studio member: app opens straight to that studio's schedule, no switcher prompt.
- Deep link to another studio: shows that studio, home unchanged, switcher shows both after booking.
- Studio page, embed, confirmation and emails contain no link to other studios and no "explore" wording in their content; the signed-in avatar menu (chrome) is the only place the word appears on a web studio page.
- From any studio screen: Explore is reachable in two taps through the chrome.
- Booking screen at a studio where the member holds no pass: drop-in (and network credit when live) shown, "Your passes" link present, no "doesn't apply" message.
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

## Help entries (src/content/help.ts)
`class-time-zone`, `add-to-calendar`, `explore-on-studio-page`, `save-your-details`, `existing-account-booking`. The home-studio prompt ("Make Ubud Yoga your home studio?") carries an info icon explaining that home is where the app opens and nothing else changes.

## Open questions
1. Explore in v1 of the member app is the "your studios + search" version. The browsable version waits for PRD-023 supply. Decided Oct 8: Explore exists from v1 but only in the chrome.
2. Guests have no account, so no home studio. Fine: Express Booking is per-studio by design.

## Related
- PRD-023 Studio Network (cross-studio credits, the thing Explore eventually shows)
- PRD-024 Attribution everywhere (deep links, switcher and Explore are all attribution sources)
- `docs/app-store/STORE-APPS.md` (deep links open the member app on the studio)
