# Localization Analysis: Making Tandava Global

*Deep analysis of what it takes to internationalize Tandava — foundation, strategy, language-specific considerations, and developer/studio workflows.*

---

## Table of Contents

1. [Current State](#current-state)
2. [Recommended i18n Stack](#recommended-i18n-stack)
3. [Foundation Setup](#foundation-setup)
4. [String Extraction Inventory](#string-extraction-inventory)
5. [Date, Time, Currency & Number Formatting](#date-time-currency--number-formatting)
6. [Pluralization & Gender](#pluralization--gender)
7. [Target Language Analysis](#target-language-analysis)
8. [Translation Workflow for Developers](#translation-workflow-for-developers)
9. [Studio-Side & User-Side Language Config](#studio-side--user-side-language-config)
10. [Email & Notification Localization](#email--notification-localization)
11. [Reference Data & Domain Terms](#reference-data--domain-terms)
12. [RTL & Layout Considerations](#rtl--layout-considerations)
13. [Other Localization Concerns](#other-localization-concerns)
14. [Phased Implementation Plan](#phased-implementation-plan)

---

## Current State

Tandava has **zero i18n infrastructure** today. Every user-facing string is hardcoded in English directly in JSX/TSX components. Here's what we're working with:

| Category | Approximate Count | Examples |
|----------|-------------------|----------|
| UI labels & headings | 300+ | "Dashboard", "Book Now", "Schedule" |
| Toast/notification messages | 130+ | "You're booked!", "Message sent!" |
| Form labels & placeholders | 220+ | "Email", "you@example.com", "Search offerings..." |
| Accessibility strings (aria-label, alt) | 87+ | alt text, screen reader labels |
| Date/time displays | 180+ | "Today, 6:00 PM", "Saturday, Dec 7" |
| Currency formatting | 41+ | `$65`, `$12.00`, Intl.NumberFormat("en-US") |
| Pluralization/unit strings | 567+ | "3 classes remaining", "1 studio", "60 min" |
| Validation/error messages | 30+ | "Email is required", "End time must be after start time" |
| Email templates | 20+ strings | "You're booked!", "Add to Calendar" |
| Reference data labels | 150+ | "Vinyasa", "Beginner", "Credit/Debit Card" |

**Key problem patterns:**
- Currency formatting hardcoded to `en-US` and `$` symbol in multiple files
- `formatTime()` hardcoded to 12-hour AM/PM format
- `formatDate()` hardcoded to `en-US` locale
- Template literals with embedded English words: `` `See you at ${studio}` ``
- Inline pluralization: `studio${count !== 1 ? 's' : ''}`
- Days of week hardcoded as English arrays: `['Sunday', 'Monday', ...]`

---

## Recommended i18n Stack

### react-i18next + i18next (Recommended)

| Criteria | react-i18next | react-intl (FormatJS) | LinguiJS |
|----------|--------------|----------------------|----------|
| Bundle size | ~15KB | ~25KB | ~5KB |
| React integration | Excellent (hooks, HOC, component) | Good (hooks, component) | Good (macros) |
| Pluralization | ICU + custom | ICU MessageFormat | ICU |
| Vite support | Native | Native | Needs plugin |
| Namespace splitting | Built-in | Manual | Manual |
| Lazy loading | Built-in | Manual | Manual |
| Community | Largest | Large | Medium |
| Thai/Hindi/Balinese | Full CLDR support | Full CLDR support | Full CLDR support |
| Learning curve | Low | Medium | Medium |

**Why react-i18next wins for Tandava:**
- Namespace splitting lets us load only `booking.json` for the booking flow, `manage.json` for admin, etc. — critical for a multi-role app
- Lazy loading means Thai translations don't ship to English users
- The `useTranslation()` hook fits perfectly with Tandava's existing hook-based patterns
- Fallback chains: user language -> studio language -> English
- Interpolation and pluralization work without ICU MessageFormat complexity
- Largest ecosystem for tooling, extraction, and translation management

### Supporting libraries

| Need | Library | Purpose |
|------|---------|---------|
| Date/time | `date-fns` with locale imports | Locale-aware date formatting (already tree-shakable) |
| Numbers/currency | Native `Intl.NumberFormat` | Already in the browser, just needs locale parameter |
| Plural rules | `Intl.PluralRules` | Native browser API, handles Thai/Hindi/Portuguese rules |
| String extraction | `i18next-parser` | Scans source files, extracts keys to JSON |

---

## Foundation Setup

### Directory structure

```
src/
├── i18n/
│   ├── index.ts              # i18next initialization & config
│   ├── detector.ts           # Language detection logic
│   └── locales/
│       ├── en/
│       │   ├── common.json       # Shared: nav, buttons, roles, status labels
│       │   ├── booking.json      # Booking flow strings
│       │   ├── schedule.json     # Schedule & class cards
│       │   ├── manage.json       # Studio admin/management
│       │   ├── auth.json         # Login, register, password reset
│       │   ├── email.json        # Email template strings
│       │   └── validation.json   # Form errors & validation messages
│       ├── th/                   # Thai
│       │   └── (same structure)
│       ├── es/                   # Spanish
│       │   └── (same structure)
│       ├── hi/                   # Hindi
│       │   └── (same structure)
│       ├── pt/                   # Portuguese
│       │   └── (same structure)
│       └── ban/                  # Balinese (custom locale)
│           └── (same structure)
```

### Initialization (`src/i18n/index.ts`)

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)             // Lazy-loads translation JSON files
  .use(LanguageDetector)    // Auto-detects user language
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'th', 'es', 'hi', 'pt', 'ban'],

    // Namespace config — match your JSON file names
    ns: ['common', 'booking', 'schedule', 'manage', 'auth', 'validation'],
    defaultNS: 'common',

    // Lazy load from /locales/{lng}/{ns}.json
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Language detection priority
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'tandava-language',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
```

### Component usage pattern

```typescript
// Before
<Button>Book Now</Button>
<p>{spotsLeft} spots left</p>

// After
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('booking');
<Button>{t('bookNow')}</Button>
<p>{t('spotsLeft', { count: spotsLeft })}</p>
```

```json
// en/booking.json
{
  "bookNow": "Book Now",
  "spotsLeft_one": "{{count}} spot left",
  "spotsLeft_other": "{{count}} spots left"
}

// th/booking.json
{
  "bookNow": "จองเลย",
  "spotsLeft": "เหลืออีก {{count}} ที่"   // Thai has no plural forms
}

// es/booking.json
{
  "bookNow": "Reservar",
  "spotsLeft_one": "Queda {{count}} lugar",
  "spotsLeft_other": "Quedan {{count}} lugares"
}
```

---

## String Extraction Inventory

### High-priority files (most user-facing strings)

| File | Strings | Namespace |
|------|---------|-----------|
| `components/booking/BookingModal.tsx` | ~40 | booking |
| `components/booking/PaymentSourceSelector.tsx` | ~15 | booking |
| `components/booking/BookingAddOns.tsx` | ~12 | booking |
| `components/booking/BookingConfirmation.tsx` | ~10 | booking |
| `components/schedule/ClassCard.tsx` | ~15 | schedule |
| `components/schedule/ClassDetailModal.tsx` | ~12 | schedule |
| `components/manage/ManageLayout.tsx` | ~25 | manage |
| `pages/manage/ManageSchedule.tsx` | ~8 | manage |
| `pages/manage/Offerings.tsx` | ~15 | manage |
| `pages/auth/Login.tsx` | ~15 | auth |
| `pages/auth/Register.tsx` | ~18 | auth |
| `pages/admin/AdminDashboard.tsx` | ~20 | manage |
| `components/contact/ContactForm.tsx` | ~15 | common |
| `components/DemoRoleBar.tsx` | ~8 | common |
| `lib/validation.ts` (Zod messages) | ~15 | validation |
| `lib/reference-data.ts` | ~150 | common |
| `components/email/templates/*` | ~20+ per template | email |

### Problematic patterns that need restructuring

**1. Template literals with embedded grammar:**
```typescript
// BAD — word order is English-specific
`See you at ${studio}`
`Free cancellation up to ${hours}h before class`
`This ${type} doesn't cover this class type`

// GOOD — let the translator control word order
t('seeYouAt', { studio })     // "{{studio}}でお待ちしています" (JP)
t('freeCancellation', { hours }) // Thai puts time differently
```

**2. Inline pluralization:**
```typescript
// BAD
`${count} studio${count !== 1 ? 's' : ''}`

// GOOD — uses i18next plural rules per language
t('studioCount', { count })
```

**3. Concatenated status strings:**
```typescript
// BAD
`Class types and their configurations — ${count} active`

// GOOD
t('offeringsSubtitle', { count })
```

---

## Date, Time, Currency & Number Formatting

### Current problems

| Function | File | Issue |
|----------|------|-------|
| `formatTime()` | `lib/reference-data.ts:243` | Hardcoded 12h AM/PM format |
| `formatDate()` | `lib/reference-data.ts:267` | Hardcoded `en-US` locale |
| `formatPrice()` | `lib/reference-data.ts:253` | Hardcoded `$` and `en-US` |
| `formatCents()` | `types/database.ts:2576` | Hardcoded `en-US` |
| `DAYS_OF_WEEK` | `lib/reference-data.ts:228` | Hardcoded English day names |
| `formatPrice()` | `components/booking/PaymentSourceSelector.tsx:50` | Hardcoded `en-US` |
| `formatPrice()` | `components/booking/BookingAddOns.tsx:36` | Hardcoded `en-US` |

### Solution: Locale-aware formatting utilities

```typescript
// src/lib/format.ts — replaces all hardcoded formatters

export function formatTime(time: string, locale: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(2000, 0, 1, hours, minutes);
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatDate(dateString: string, locale: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, options ?? {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export function formatPrice(cents: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}
```

### How formatting differs by target language

| Format | English (en) | Thai (th) | Spanish (es) | Hindi (hi) | Portuguese (pt) |
|--------|-------------|-----------|--------------|------------|-----------------|
| Time | 6:00 PM | 18:00 น. | 18:00 | शाम 6:00 | 18:00 |
| Date | Sat, Dec 7 | ส. 7 ธ.ค. | sáb, 7 dic | शनि, 7 दिस | sáb, 7 de dez |
| Currency | $65.00 | ฿2,100 | $65.00 / €65,00 | ₹5,400 | R$ 320,00 |
| Number | 1,234.56 | 1,234.56 | 1.234,56 | 1,234.56 | 1.234,56 |
| Week start | Sunday | Sunday | Monday | Sunday | Sunday |

---

## Pluralization & Gender

### Plural rules by target language

| Language | Plural Forms | Rule |
|----------|-------------|------|
| English | 2 (one, other) | `1` = one, everything else = other |
| Thai | 1 (other) | No plural forms — quantity word precedes noun |
| Balinese | 1 (other) | No grammatical plural |
| Spanish | 2 (one, other) | `1` = one, everything else = other |
| Hindi | 2 (one, other) | `0, 1` = one, everything else = other |
| Portuguese | 2 (one, other) | `1` = one, everything else = other (note: Brazilian PT treats 0 as singular) |

**i18next handles all of this automatically** via `Intl.PluralRules`. You write:
```json
// English
{ "classCount_one": "{{count}} class", "classCount_other": "{{count}} classes" }

// Thai (only needs "other")
{ "classCount_other": "{{count}} คลาส" }
```

### Gender considerations

Spanish and Portuguese have grammatical gender. This matters for:
- "1 class remaining" → "1 clase restante" (feminine in ES)
- User-facing status labels may need gendered variants

**Recommendation:** For v1, use gender-neutral phrasing where possible. Add `_male`/`_female` context keys only where unavoidable.

---

## Target Language Analysis

### Thai (th) — Primary

| Consideration | Details |
|---------------|---------|
| Script | Thai script (อักษรไทย) — no spaces between words |
| Text expansion | 10-20% longer than English |
| Fonts | System fonts (Sarabun, Noto Sans Thai) handle it. Tailwind's default `font-sans` stack includes Thai fallbacks |
| Line breaking | Requires dictionary-based word segmentation (CSS `word-break: auto-phrase` or `overflow-wrap`) |
| Numerals | Thai digits (๐๑๒) exist but Arabic numerals (012) are standard in business contexts |
| Calendar | Buddhist Era (BE = CE + 543) — 2026 CE = 2569 BE. Use `Intl.DateTimeFormat('th', { calendar: 'gregory' })` to keep Gregorian |
| Formal/informal | Thai has register levels. Studio context = polite but not royal — use ครับ/ค่ะ particle convention |
| Yoga terms | Many yoga terms (asana names, chakra, etc.) are already Sanskrit-derived in Thai |
| Input | Thai keyboard layout is standard; no special input handling needed |

### Balinese (ban) — Primary

| Consideration | Details |
|---------------|---------|
| Script | Latin alphabet (modern Balinese uses Indonesian Latin orthography) |
| CLDR support | **Not in CLDR** — this is the biggest challenge. No `Intl.DateTimeFormat('ban')` support |
| Fallback strategy | Use Indonesian (`id`) as the Intl locale for dates/numbers, with Balinese UI strings |
| Text expansion | Similar to Indonesian, ~15-30% longer than English |
| Calendar | Balinese Pawukon calendar (210-day cycle) exists but Gregorian is used in business |
| Yoga connection | Bali has deep Hindu/yoga traditions — many domain terms will feel native |
| Translation | Will need manual translation; no major MT engines support Balinese |

**Balinese implementation strategy:**
```typescript
// Register 'ban' as a custom language with 'id' (Indonesian) number/date formatting
i18n.addResourceBundle('ban', 'common', balineseTranslations);
// Use Intl.DateTimeFormat('id') for date/number formatting when locale is 'ban'
```

### Spanish (es) — Primary

| Consideration | Details |
|---------------|---------|
| Variants | es-MX (Mexico), es-ES (Spain), es-AR (Argentina) differ in vocabulary and voseo |
| Text expansion | 20-30% longer than English (plan for UI overflow) |
| Gender | Grammatical gender affects adjectives, articles, past participles |
| Punctuation | Inverted ¿? and ¡! for questions and exclamations |
| Currency | Varies wildly — MXN ($), EUR (€), ARS ($), COP ($), etc. |
| Yoga terms | Keep Sanskrit terms as-is (Vinyasa, Hatha, etc.) — universally understood |

**Recommendation:** Start with neutral Latin American Spanish (`es`), then add regional variants (`es-MX`, `es-ES`) later if needed.

### Hindi (hi) — Secondary

| Consideration | Details |
|---------------|---------|
| Script | Devanagari (देवनागरी) |
| Text expansion | 10-20% — Devanagari is compact |
| Fonts | Noto Sans Devanagari, Mangal. Add to Tailwind font stack |
| Numerals | Devanagari digits (०१२) exist but Arabic numerals standard in UI |
| Calendar | Gregorian is standard in business/tech contexts |
| Yoga terms | Hindi speakers use original Sanskrit terms — this is a natural fit |
| Indian market note | Many Indian users are comfortable with English UI; Hindi adds accessibility |

### Portuguese (pt) — Secondary

| Consideration | Details |
|---------------|---------|
| Variants | pt-BR (Brazil) vs pt-PT (Portugal) — significant differences |
| Text expansion | 20-30% longer than English |
| Pluralization | Brazilian Portuguese: 0 and 1 are singular. European: only 1 is singular |
| Currency | BRL (R$) vs EUR (€) |
| Yoga market | Brazil has one of the largest yoga communities globally |

**Recommendation:** Start with `pt-BR` (larger market), add `pt-PT` later.

---

## Translation Workflow for Developers

### Adding a new string

```bash
# 1. Use the translation key in your component
const { t } = useTranslation('booking');
return <Button>{t('cancelBooking')}</Button>;

# 2. Add the English translation to the namespace file
# src/i18n/locales/en/booking.json
{
  "cancelBooking": "Cancel Booking"
}

# 3. Run the extraction tool to verify (optional, catches missed keys)
npx i18next-parser

# 4. Other language files will fall back to English until translated
```

### Translation file format

```json
// src/i18n/locales/en/booking.json
{
  "bookNow": "Book Now",
  "joinWaitlist": "Join Waitlist",
  "cancelBooking": "Cancel Booking",
  "bookingConfirmed": "You're booked!",
  "seeYouAt": "See you at {{studio}}",
  "spotsLeft_one": "{{count}} spot left",
  "spotsLeft_other": "{{count}} spots left",
  "freeCancellation": "Free cancellation up to {{hours}}h before class",
  "selectPaymentMethod": "Select payment method",
  "classesRemaining": "{{count}} classes remaining",
  "payAmount": "Pay {{amount}}",
  "processing": "Processing..."
}
```

### Key naming conventions

| Pattern | Example | Use for |
|---------|---------|---------|
| `camelCase` | `bookNow` | Simple labels |
| `section.key` | `nav.dashboard` | Grouped by UI section |
| `key_one` / `key_other` | `spotsLeft_one` | Pluralization |
| `key_context` | `open_verb` vs `open_adjective` | Disambiguation |

### Adding a new language

```bash
# 1. Create the locale directory
mkdir src/i18n/locales/ja

# 2. Copy English files as templates
cp src/i18n/locales/en/*.json src/i18n/locales/ja/

# 3. Register in i18n config
# Add 'ja' to supportedLngs array

# 4. Translate the JSON files (or send to translators)

# 5. Test with ?lng=ja or browser language override
```

### Extraction tooling (`i18next-parser`)

```javascript
// i18next-parser.config.js
module.exports = {
  locales: ['en', 'th', 'es', 'hi', 'pt', 'ban'],
  output: 'src/i18n/locales/$LOCALE/$NAMESPACE.json',
  input: ['src/**/*.{ts,tsx}'],
  defaultNamespace: 'common',
  namespaceSeparator: ':',
  keySeparator: '.',
  sort: true,
  createOldCatalogs: false,
};
```

Run `npx i18next-parser` to:
- Scan all source files for `t()` calls
- Add missing keys to each locale's JSON (with empty values)
- Report unused keys

---

## Studio-Side & User-Side Language Config

### Two-level language model

Tandava needs **two independent language settings**:

```
┌─────────────────────────────────────────┐
│ STUDIO DEFAULT LANGUAGE                  │
│ Set by studio owner in Studio Settings   │
│ Affects: emails, notifications, landing  │
│ pages, default UI for new visitors       │
└─────────────────────┬───────────────────┘
                      │ fallback
┌─────────────────────▼───────────────────┐
│ USER PREFERRED LANGUAGE                  │
│ Set by member in their profile/browser   │
│ Affects: their UI, their notifications   │
│ Overrides studio default for that user   │
└─────────────────────────────────────────┘
```

### Studio Settings (owner-facing)

Add to Studio Settings page (`/manage/settings`):

```typescript
// Studio table addition
interface Studio {
  // ... existing fields
  default_locale: string;        // 'en', 'th', 'es', etc.
  supported_locales: string[];   // ['en', 'th'] — languages this studio offers
}
```

**UI:** A "Languages" section in Studio Settings where the owner:
1. Sets the studio's primary language (affects outbound emails, landing pages, default for visitors)
2. Enables additional languages (shows language switcher to members)
3. Optionally provides custom translations for studio-specific content (class names, descriptions, policies)

### User Settings (member-facing)

```typescript
// Profile table addition (or separate preferences table)
interface Profile {
  // ... existing fields
  preferred_locale: string | null;  // null = use studio default
}
```

**UI:** A language selector in:
- User profile/account settings
- Footer or navbar (globe icon dropdown)
- Auto-detected from browser on first visit

### Detection cascade

```
1. User's saved preference (localStorage + profile.preferred_locale)
2. Browser language (navigator.language)
3. Studio's default_locale
4. English (ultimate fallback)
```

### Studio-specific content translation

Studio-created content (class descriptions, policies, bios) can't use static JSON files. Two approaches:

**Option A: JSON fields in database (Recommended for v1)**
```sql
-- Instead of: description TEXT
-- Use: description JSONB DEFAULT '{"en": ""}'
ALTER TABLE offerings ADD COLUMN description_i18n JSONB DEFAULT '{}';
-- {"en": "A flowing vinyasa class...", "th": "คลาสวินยาสะ..."}
```

**Option B: Separate translations table (Better for many languages)**
```sql
CREATE TABLE content_translations (
  entity_type TEXT,      -- 'offering', 'event', 'location'
  entity_id UUID,
  locale TEXT,
  field_name TEXT,
  translation TEXT,
  PRIMARY KEY (entity_type, entity_id, locale, field_name)
);
```

---

## Email & Notification Localization

### Email templates

Current email templates in `src/components/email/templates/` have hardcoded English. Strategy:

```typescript
// BookingConfirmationEmail.tsx
function BookingConfirmationEmail({ locale, ...props }) {
  const t = getEmailTranslations(locale, 'bookingConfirmation');

  return (
    <EmailHeading>{t('youreBooked')}</EmailHeading>
    <EmailText>{t('greeting', { name: props.memberName })}</EmailText>
    <EmailInfoRow label={t('instructor')} value={props.instructor} />
    <EmailInfoRow label={t('dateTime')} value={formatDate(props.dateTime, locale)} />
    <EmailButton href={props.calendarLink}>{t('addToCalendar')}</EmailButton>
  );
}
```

**Key:** Emails use the **studio's default language** unless the recipient has a preferred language set.

### SMS & Push Notifications

Notification templates (`NudgeRule.title_template`, `NudgeRule.body_template`) already support template variables. Extend with locale:

```typescript
// Current
title_template: "Don't forget your class tomorrow!"
// Localized
title_template_i18n: {
  "en": "Don't forget your class tomorrow!",
  "th": "อย่าลืมคลาสพรุ่งนี้นะคะ!"
}
```

---

## Reference Data & Domain Terms

### What to translate vs. what to keep

`src/lib/reference-data.ts` contains lists like class styles, workshop types, credentials, etc.

| Category | Translate? | Reasoning |
|----------|-----------|-----------|
| Class styles ("Vinyasa", "Hatha") | **No** | Sanskrit/English terms are universal in yoga worldwide |
| Level labels ("Beginner", "All Levels") | **Yes** | These are operational labels members need to understand |
| Day names ("Monday", "Tuesday") | **Yes** (via Intl) | Use `Intl.DateTimeFormat` — don't maintain our own arrays |
| Payment methods ("Credit/Debit Card") | **Yes** | Members need to understand payment options |
| Booking providers ("Mindbody", "Walla") | **No** | Brand names, not translatable |
| CTA suggestions ("Book your spot") | **Yes** | Marketing copy should be localized |
| Teacher credentials ("RYT-200") | **No** | Industry-standard abbreviations |
| Delivery mode ("In-Person", "Virtual") | **Yes** | Operational labels |
| Validation messages | **Yes** | Must be in user's language |

### Strategy for reference data

```typescript
// Keep the canonical English key, add display translations
export const LEVEL_LABELS = {
  beginner: 'levels.beginner',      // i18n key
  all_levels: 'levels.allLevels',
  intermediate: 'levels.intermediate',
  advanced: 'levels.advanced',
} as const;

// en/common.json
{
  "levels": {
    "beginner": "Beginner",
    "allLevels": "All Levels",
    "intermediate": "Intermediate",
    "advanced": "Advanced"
  }
}

// th/common.json
{
  "levels": {
    "beginner": "เริ่มต้น",
    "allLevels": "ทุกระดับ",
    "intermediate": "ปานกลาง",
    "advanced": "ขั้นสูง"
  }
}
```

---

## RTL & Layout Considerations

None of the target languages (Thai, Balinese, Spanish, Hindi, Portuguese) are RTL. However, if Arabic or Hebrew are ever added:

- Tailwind CSS supports RTL via `dir="rtl"` and `rtl:` prefix variants
- shadcn/ui components are RTL-compatible
- Would need `logical` CSS properties (margin-inline-start vs margin-left)

**Recommendation:** No RTL work needed now. If added later, it's a CSS-only change with Tailwind's built-in support.

### Layout concerns for non-Latin scripts

| Script | Concern | Solution |
|--------|---------|----------|
| Thai | No word spaces; line breaks need dictionary | `overflow-wrap: anywhere` + test thoroughly |
| Devanagari (Hindi) | Taller line height needed for matras | Add `leading-relaxed` for Hindi locale |
| All | Text expansion (20-30% longer) | Test all UI with pseudo-translation; avoid fixed-width containers |

---

## Other Localization Concerns

### 1. Timezone handling — IMPLEMENTED
**Decision: Class times render in the CLASS LOCATION's timezone, not the user's device.**

This is critical for studios with members who travel, use VPNs, or book from different time zones. MindBody gets this wrong — if you're on a VPN or traveling, class times shift based on your device, creating booking confusion.

**Tandava's approach (implemented in `LocaleContext.formatClassDateTime()`):**

| Content type | Timezone used | Rationale |
|--------------|---------------|-----------|
| Scheduled classes | Location's timezone | A 6 PM class in Austin is always 6 PM, no matter where you browse from |
| On-demand / virtual | Studio's default timezone | No physical location to anchor to |
| Notifications | User's timezone (future) | "Your class starts in 2 hours" should be relative to the user |
| Calendar exports (.ics) | UTC with TZID | Standard iCal format, calendar app handles conversion |

```typescript
// Example: Class in Austin (America/Chicago) viewed from Bangkok
formatClassDateTime(startsAt, { timezone: 'America/Chicago' })
// → "Sat, Feb 7, 6:00 PM"  (always Austin time, regardless of device)
```

This is handled by passing the class location's IANA timezone to `Intl.DateTimeFormat`. The `useLocale().formatClassDateTime()` hook defaults to the studio's timezone and accepts an optional location timezone override.

### 2. Phone number formatting
Different countries have different formats. Use a library like `libphonenumber-js` for display formatting if expanding internationally.

### 3. Address formatting
Address formats vary wildly. Thailand: building, soi, road, district, province, postal code. India: different structure. Consider a locale-aware address component.

### 4. Name ordering
Thai and Hindi names follow Western order (given + family). No special handling needed for target languages. But if Japanese/Chinese/Korean are added, family name comes first.

### 5. Legal/compliance text — English only for now
Waivers, terms of service, privacy policies remain in English for v1. Future support for alternate language legal text can use the same JSONB translation approach as studio content (`content_i18n` field). Professional human translation is required — MT is not sufficient for legal documents.

### 6. Image & media localization
- Screenshots in documentation
- Marketing images with text overlays
- Demo data imagery (currently US-centric)

### 7. Search & filtering
If users search for classes in Thai script, the search needs to match. Consider storing searchable fields in multiple scripts or using transliteration.

### 8. Content direction in rich text
If studio descriptions or class descriptions support rich text, ensure the editor handles mixed-direction content (e.g., Sanskrit terms in Thai text).

### 9. Currency per studio, not per language
Currency is a **business setting** (the studio's `currency` field), not a language setting. A Thai-language studio might still charge in USD. Keep these independent.

### 10. SEO for landing pages
Each locale needs:
- Unique URL slugs (`/es/horario` vs `/schedule`)
- `hreflang` tags
- Translated meta descriptions
- Locale-specific Open Graph tags

---

## Phased Implementation Plan

### Phase 1: Foundation — DONE

- [x] Install `react-i18next`, `i18next`, `i18next-http-backend`, `i18next-browser-languagedetector`
- [x] Create `src/i18n/` directory structure with English JSON namespace files
- [x] Initialize i18next in `main.tsx`
- [x] Create `LocaleProvider` context with `useLocale()` hook
- [x] Wire `LocaleProvider` into App.tsx provider stack
- [x] Create locale-aware formatters: `formatDate()`, `formatTime()`, `formatPrice()`, `formatNumber()`, `formatRelativeTime()`, `formatClassDateTime()`, `getDayName()`
- [x] Timezone-aware class time formatting (renders in class location's timezone, not device)
- [x] Update `formatPrice()`, `formatDate()`, `formatTime()` in `lib/reference-data.ts` to accept locale parameter
- [x] Update `formatCents()` in `types/database.ts` to accept locale parameter
- [x] Replace hardcoded `Intl.NumberFormat("en-US")` in `BookingModal`, `PaymentSourceSelector`, `BookingAddOns` with `useLocale().formatPrice()`
- [x] Add `LanguageSwitcher` component (globe icon dropdown in AppLayout header)
- [x] Create English namespace files: `common`, `booking`, `schedule`, `manage`, `auth`, `validation`, `email`
- [x] Create placeholder translation files for all target languages (th, es, hi, pt, ban)
- [x] Define Balinese → Indonesian Intl fallback mapping
- [x] Configure language detection cascade (localStorage → browser → English)
- [x] US calendar style enforced (12-hour AM/PM, Sunday week start)

### Phase 2: Core String Extraction (Roadmap — estimated 5-8 days)

- [ ] Replace hardcoded strings with `t()` calls in booking flow components
- [ ] Replace hardcoded strings in schedule components (ClassCard, ClassDetailModal)
- [ ] Replace hardcoded strings in auth pages (Login, Register)
- [ ] Replace hardcoded strings in management nav and dashboard
- [ ] Replace validation messages in `lib/validation.ts` and Zod schemas with translation keys
- [ ] Replace toast messages across all components
- [ ] Replace reference data labels (levels, delivery modes, payment methods)
- [ ] Set up `i18next-parser` config for automated key extraction

### Phase 3: First Non-English Language — Thai (Roadmap — 3-5 days + translator)

- [ ] Complete Thai translation of all namespace files
- [ ] Test Thai rendering across all UI surfaces
- [ ] Fix layout/overflow issues with Thai text (no word spaces)
- [ ] Verify date/time/currency formatting with `th` locale
- [ ] Test Thai input in forms

### Phase 4: Additional Languages (Roadmap — 2-3 days each + translator)

- [ ] Spanish (es) — neutral Latin American first, regional variants later
- [ ] Balinese (ban) — manual translation needed, no major MT support
- [ ] Hindi (hi) — add Devanagari font to Tailwind font stack
- [ ] Portuguese (pt-BR) — Brazilian Portuguese first

### Phase 5: Studio-Level Localization (Roadmap — 3-5 days)

- [ ] Database migration: add `default_locale`, `supported_locales` to studios table
- [ ] Database migration: add `preferred_locale` to profiles table
- [ ] Language settings UI in Studio Settings (`/manage/settings`)
- [ ] Pass studio locale settings to `LocaleProvider` from studio record
- [ ] Studio content translation via JSONB fields (offerings, events, policies)
- [ ] Localize email templates with locale parameter
- [ ] Localize SMS/push notification templates

### Phase 6: Polish & QA (Roadmap — 3-5 days)

- [ ] Pseudo-translation testing for text expansion issues
- [ ] Screen reader testing in each language
- [ ] SEO hreflang setup for landing pages
- [ ] Translator documentation (style guide, glossary, process)
- [ ] CI check for missing translation keys

---

## Developer Quick Reference

### Files you need to know

| File | Purpose |
|------|---------|
| `src/i18n/index.ts` | i18next initialization, supported languages, namespace config |
| `src/contexts/LocaleContext.tsx` | `useLocale()` hook — formatting utilities, timezone handling |
| `src/components/LanguageSwitcher.tsx` | Globe icon dropdown for language selection |
| `public/locales/en/*.json` | English translation files (7 namespaces) |
| `public/locales/{lang}/*.json` | Other language translations |

### How to add a translatable string

```tsx
// 1. Import the hook
import { useTranslation } from 'react-i18next';

// 2. Use it in your component
const { t } = useTranslation('booking'); // namespace = JSON filename
return <Button>{t('bookNow')}</Button>;

// 3. Add the key to public/locales/en/booking.json
// { "bookNow": "Book Now" }
```

### How to format prices, dates, and times

```tsx
import { useLocale } from '@/contexts/LocaleContext';

const { formatPrice, formatDate, formatTime, formatClassDateTime } = useLocale();

formatPrice(6500)                    // "$65" (uses studio currency)
formatPrice(210000, 'THB')           // "฿2,100"
formatDate('2026-02-10')             // "Tue, Feb 10"
formatTime('18:00')                  // "6:00 PM" (always AM/PM)
formatClassDateTime(startsAt, {      // "Sat, Feb 7, 6:00 PM"
  timezone: 'America/Chicago'        // renders in CLASS location timezone
})
```

### How to add a new language

1. Create directory: `public/locales/{code}/`
2. Copy English files as templates: `cp public/locales/en/*.json public/locales/{code}/`
3. Add to `SUPPORTED_LANGUAGES` in `src/i18n/index.ts`
4. If the language isn't in CLDR (like Balinese), add an `INTL_LOCALE_MAP` entry
5. Translate the JSON files
6. Test with `?lng={code}` or browser language override

### Key decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Calendar style | US (Sunday start, 12h AM/PM) | Project requirement |
| Class time timezone | Class location's timezone | Prevents VPN/travel confusion |
| Sanskrit yoga terms | Keep as-is, don't translate | Universal in yoga worldwide |
| Legal text | English only (v1) | Requires professional translation |
| Currency | Per-studio setting, not per-language | Business setting, independent of UI language |
| Balinese formatting | Falls back to Indonesian (id) | Balinese not in CLDR |

---

## Summary

**Phase 1 is complete.** The i18n foundation is in place:

- `react-i18next` is installed and configured with namespace splitting and lazy loading
- `LocaleProvider` provides locale-aware formatting throughout the app
- All hardcoded `en-US` formatters in core components have been replaced
- Timezone-aware class time rendering prevents the "MindBody timezone problem"
- Language switcher is live in the app header
- 7 English namespace files are ready for string extraction
- Template files exist for all 6 target languages

**Remaining work is incremental:** extract strings one component at a time (Phase 2), send JSONs to translators (Phase 3-4), and add database-backed studio/user preferences (Phase 5). Each phase is independently shippable.

---

*Analysis prepared for Tandava, February 2026. Updated with Phase 1 implementation status.*
