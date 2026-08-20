# Language Rollout Plan

*How Tandava adds languages: the architecture that keeps it cheap, the validation that keeps it correct, and the order in which the roadmap languages shipped.*

See [LOCALIZATION_ANALYSIS.md](../LOCALIZATION_ANALYSIS.md) for the full i18n architecture and per-language linguistic notes.

---

## Principles

1. **One registration point.** A language exists when it appears in `SUPPORTED_LANGUAGES` (`src/i18n/index.ts`) and has a matching `public/locales/<code>/` directory. The switcher UI, the i18next config, and the `SupportedLanguage` type all derive from that array — adding a language never touches component code.
2. **Validated, always.** `scripts/check-locales.mjs` runs before every build (`prebuild`) and fails the build on structural problems: invalid JSON, unregistered locale directories, namespace files that don't exist in English, and `{{placeholder}}` sets that don't match English. Missing translations are warnings, not errors — they fall back to English by design, and the script reports per-locale coverage so drift is visible.
3. **CLDR-correct plurals.** Each locale ships exactly the plural forms its language uses (`Intl.PluralRules` categories): `_other` only for Indonesian/Malay/Chinese/Korean/Thai, `_one`/`_other` for Filipino/German/Hindi, `_one`/`_many`/`_other` for Spanish/Portuguese. The checker verifies this per locale.
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

## Status

| Language | Code | Files | Native review |
|----------|------|-------|---------------|
| English | `en` | source of truth | — |
| Thai | `th` | partial (~81%) | pending |
| Spanish | `es` | partial (~81%) | pending |
| Hindi | `hi` | partial (~81%) | pending |
| Portuguese | `pt` | partial (~81%) | pending |
| Indonesian | `id` | complete | pending |
| Malay | `ms` | complete | pending |
| Balinese | `ban` | partial (~81%) | pending |
| Simplified Chinese | `zh` | complete | pending |
| Traditional Chinese | `zh-Hant` | complete | pending |
| Korean | `ko` | complete | pending |
| Filipino | `fil` | complete | pending |
| German | `de` | complete | pending |

Coverage numbers come from `npm run check:locales` — rerun it rather than trusting this table.

## Adding the next language

1. `mkdir public/locales/<code>` and translate the seven namespace files from `public/locales/en/`, using the plural forms `Intl.PluralRules('<code>')` requires.
2. Register the language in `SUPPORTED_LANGUAGES` in `src/i18n/index.ts` (code, English name, native name, flag).
3. If the language is written right-to-left, add its base subtag to `RTL_LANGUAGES` and audit layouts.
4. If browsers report regional variants that shouldn't language-only-fallback correctly (as with Chinese scripts), extend `convertDetectedLanguage` in the detector config.
5. Run `npm run check:locales` — it must pass with 100% coverage for the new locale.
6. `npm run build` and verify the switcher, a booking flow, and a form-validation message in the new language.

## Future candidates

- **Tamil (`ta`)** — completes Singapore's four official languages
- **Colloquial written Cantonese (`yue`)** — only if HK studios ask; `zh-Hant` covers standard HK usage
- **Japanese (`ja`)** — large yoga market; straightforward (`other`-only plurals)
- **Regional variants** (`es-MX`, `pt-PT`, `de-CH`) — only on demand; the base locales serve them via fallback
- **Arabic (`ar`)** — first RTL language; requires the layout audit in step 3 above
- **Vietnamese (`vi`), French (`fr`), Italian (`it`)** — no blockers, prioritize by studio demand
