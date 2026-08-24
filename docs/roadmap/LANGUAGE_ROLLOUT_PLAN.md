# Language Rollout Plan

*How Tandava adds languages: the architecture that keeps it cheap, the validation that keeps it correct, and the order in which the roadmap languages shipped.*

See [LOCALIZATION_ANALYSIS.md](../LOCALIZATION_ANALYSIS.md) for the full i18n architecture and per-language linguistic notes.

---

## Principles

1. **One registration point.** A language exists when it appears in `SUPPORTED_LANGUAGES` (`src/i18n/index.ts`) and has a matching `public/locales/<code>/` directory. The switcher UI, the i18next config, and the `SupportedLanguage` type all derive from that array — adding a language never touches component code.
2. **Validated, always.** `scripts/check-locales.mjs` runs before every build (`prebuild`) and fails the build on structural problems: invalid JSON, unregistered locale directories, namespace files that don't exist in English, and `{{placeholder}}` sets that don't match English. Missing translations are warnings, not errors — they fall back to English by design.

   The checker reports **two** numbers per locale, because they can disagree badly:

   | Column | Means | Failure it catches |
   |--------|-------|--------------------|
   | `keys` | share of English keys that exist in the locale | missing strings (they fall back to English) |
   | `text` | share of present values that are actually translated | a locale shipped as verbatim English |

   A locale can sit at 100% `keys` and 0% `text` — every string present, every string still English. That is exactly how Thai, Spanish, Hindi, Portuguese and Balinese shipped in the first wave, and it stayed invisible while only key coverage was measured. A locale below 50% `text` now raises a warning naming it as untranslated scaffolding.
3. **CLDR-correct plurals.** Each locale ships exactly the plural forms its language uses (`Intl.PluralRules` categories): `_other` only for Indonesian/Malay/Chinese/Korean/Thai/Japanese/Vietnamese/Balinese, `_one`/`_other` for Filipino/German/Hindi/Tamil, `_one`/`_many`/`_other` for Spanish/Portuguese/French/Italian. The checker verifies this per locale.

   One trap worth knowing: `Intl.PluralRules` does **not** throw on a well-formed but unknown tag such as `ban`. It quietly negotiates down to the runtime's default locale, so a naive check would demand English plural forms for Balinese — and would demand something different on a build machine with a different default. The checker therefore resolves through `INTL_LOCALE_MAP` first and confirms Intl actually honoured the request before trusting its categories.
4. **Script-aware Chinese.** `zh` (Simplified) and `zh-Hant` (Traditional) are separate locales with separate files. Browser codes are normalized in the language detector: `zh-TW`/`zh-HK`/`zh-MO`/`*-Hant` → `zh-Hant`, all other Chinese → `zh`. Missing `zh-Hant` strings fall back through `zh` before English (intelligible, if not script-pure).
5. **Direction-ready.** `<html lang>` and `<html dir>` are synced centrally on every language change. RTL languages (Arabic, Hebrew, Farsi, Urdu) are pre-listed in `RTL_LANGUAGES`, so a future RTL locale is a data change plus a layout audit — not a plumbing change.
6. **Machine-drafted, human-finished.** New locales launch with machine-drafted translations so the feature is usable immediately, and each locale should get a native-speaker review pass before being promoted to studios in that market. Track review status in the table below.

## Rollout order (and why)

Languages shipped in dependency order — each wave reused the freshest prior work:

| Wave | Language | Code | Rationale for position |
|------|----------|------|------------------------|
| 1 | Indonesian | `id` | Bali market; Balinese already mapped to `id` for Intl formatting |
| 1 | Mandarin (Simplified) | `zh` | Largest new-market reach; established the CJK string patterns |
| 2 | Malay | `ms` | Structurally closest to just-shipped Indonesian; covers Singapore & Malaysia |
| 2 | Traditional Chinese | `zh-Hant` | Derived from just-shipped `zh` with HK vocabulary; serves the Cantonese-speaking market |
| 2 | Korean | `ko` | Standalone CJK; large yoga/pilates market |
| 2 | Filipino | `fil` | First `one/other` plural language of the wave |
| 2 | German | `de` | Longest text expansion (30-40%) — the UI stress test — shipped last so overflow findings apply to a finished set |
| 3 | Japanese | `ja` | `other`-only plurals, reusing the CJK patterns from waves 1-2; large yoga market |
| 3 | Tamil | `ta` | Completes Singapore's four official languages alongside `en`/`zh`/`ms` |
| 3 | Vietnamese | `vi` | `other`-only, adjacent to the Southeast Asian set already shipped |
| 3 | French | `fr` | First `one`/`many`/`other` locale of the wave, sharing the category set with `es`/`pt` |
| 3 | Italian | `it` | Same plural shape as French, so it reused that work directly |

## Status

| Language | Code | Keys | Text | Native review |
|----------|------|------|------|---------------|
| English | `en` | source of truth | — | — |
| Thai | `th` | 100% | 100% | pending |
| Spanish | `es` | 100% | 100% | pending |
| Hindi | `hi` | 100% | 100% | pending |
| Portuguese | `pt` | 100% | 100% | pending |
| Indonesian | `id` | 100% | 98% | pending |
| Malay | `ms` | 100% | 99% | pending |
| Balinese | `ban` | 100% | 99% | pending |
| Simplified Chinese | `zh` | 100% | 100% | pending |
| Traditional Chinese | `zh-Hant` | 100% | 100% | pending |
| Korean | `ko` | 100% | 100% | pending |
| Filipino | `fil` | 100% | 87% | pending |
| German | `de` | 100% | 97% | pending |
| French | `fr` | 100% | 97% | pending |
| Italian | `it` | 100% | 99% | pending |
| Japanese | `ja` | 100% | 99% | pending |
| Tamil | `ta` | 100% | 100% | pending |
| Vietnamese | `vi` | 100% | 100% | pending |

`text` below 100% is normal: brand names, loanwords and units that a language
keeps verbatim in English count as untranslated by the string comparison.
Filipino is lowest because written Filipino keeps a lot of English vocabulary.

Coverage numbers come from `npm run check:locales` — rerun it rather than trusting this table.

## Adding the next language

1. `mkdir public/locales/<code>` and translate the seven namespace files from `public/locales/en/`, using the plural forms `Intl.PluralRules('<code>')` requires. For a language CLDR does not know, add it to `INTL_LOCALE_MAP` first (see principle 3) so both formatting and validation resolve it consistently.
2. Register the language in `SUPPORTED_LANGUAGES` in `src/i18n/index.ts` (code, English name, native name, flag).
3. If the language is written right-to-left, add its base subtag to `RTL_LANGUAGES` and audit layouts.
4. If browsers report regional variants that shouldn't language-only-fallback correctly (as with Chinese scripts), extend `convertDetectedLanguage` in the detector config.
5. Run `npm run check:locales` — the new locale must reach 100% `keys`, and its `text` figure must reflect real translation rather than copied English.
6. `npm run build` and verify the switcher, a booking flow, and a form-validation message in the new language.

## Future candidates

- **Arabic (`ar`)** — next up, and the first RTL language. `RTL_LANGUAGES` and the
  `dir` syncing are already in place, so the locale files are the easy half; the
  work is the layout audit (directional padding/margin utilities, icon flipping,
  chart and calendar axes). Treat it as its own wave, not an add-on.
- **Colloquial written Cantonese (`yue`)** — only if HK studios ask; `zh-Hant` covers standard HK usage
- **Regional variants** (`es-MX`, `pt-PT`, `de-CH`, `fr-CA`) — only on demand; the base locales serve them via fallback
- **Korean/Japanese honorific tiers** — if studios want a more formal register than the current 해요체 / です・ます
- Further languages by studio demand; the add-a-language checklist above is the whole process.
