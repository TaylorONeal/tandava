# PRD-020: Predictable language preferences

**Priority:** P1  
**Status:** Implemented and automated checks pass; browser/release verification pending  
**Date:** 2026-09-22

## Problem and evidence

The demo screenshot shows Spanish navigation and member labels beside English demo copy. The existing detector can reproduce an unexpected Spanish selection with browser preferences `en-US, es`: i18next prioritizes an exact supported match (`es`) over a regional fallback (`en-US` to `en`). Automatic localStorage caching then makes that result sticky. The screenshot alone does not establish the reporting browser's stored values or language list.

## Decision

Use explicit language choice, then the device's ordered language list, then English. Normalize each candidate before language negotiation so secondary exact matches cannot jump ahead of the preferred regional language. English is the fallback, not a forced override for Spanish-speaking visitors. Do not infer language from IP, travel location, studio location, or demo persona.

- Preserve all 19 supported languages and existing translation namespaces.
- Preserve Traditional Chinese region/script routing and legacy Filipino/Indonesian aliases.
- Cache only explicit selections; never cache automatic device detection.
- Demo builds use `tandava-demo-language-choice-v1`; non-demo builds retain `tandava-language` for compatibility.
- Do not migrate the old demo cache: it cannot distinguish a deliberate choice from automatic detection. Previous demo choices must be selected once again. Do not delete the non-demo preference.
- Expose the existing language switcher, including its language name, in the demo role bar on desktop and mobile. Keep its menu above the bar.
- Offer “Use device language” to clear the explicit preference and resolve again immediately.
- Role switching/navigation must not write language preferences.
- Storage restrictions must not prevent switching for the current session.
- Existing HTML lang/dir synchronization continues to apply.

## Acceptance and task tracking

- [x] LANG-01: Normalize regional candidates before matching, with ordered-device regression coverage.
- [x] LANG-02: Isolate demo explicit preferences and stop automatic caching.
- [x] LANG-03: Add accessible demo language control and device reset using the shared switcher.
- [x] LANG-04: Cover legacy Spanish cache, unsupported preferences, fallback, aliases, Traditional Chinese, explicit persistence/reset, and blocked storage in tests.
- [ ] LANG-05: Complete mobile/desktop browser verification and release verification; see PR validation results.
- [ ] LANG-06: Extract remaining hardcoded demo/tour/page copy and obtain native-speaker review. Translation-file completeness does not mean every page is localized. The new reset label falls back to English until localized.

## Scope limits

No database, account-language sync, studio default, timezone/currency changes, new dependencies, or translation rewrite. Device changes apply on reload or explicit device reset; live OS-language event handling is outside this patch. Non-demo legacy preferences remain compatible and can be cleared with device reset.

## Verification evidence

- `npm test`: 154 tests pass, including 14 language regression cases.
- `npm run typecheck`: passes.
- Targeted ESLint on both changed components and i18n implementation/tests: passes.
- Demo production build: passes, including locale checks and prerendering.
- Browser verification is blocked in this execution environment: agent-browser daemon failed to start; its Chrome download failed certificate validation, and the Playwright fallback returned an invalid/truncated archive. No visual or live deployment verification is claimed.
- Release checklist: on a 390px and desktop viewport, use browser languages `en-US, es` with legacy `tandava-language=es`; confirm English navigation, visible language menu above the demo bar, no horizontal overflow, explicit Spanish persistence across reload and persona switches, reset to English, and Arabic RTL/English LTR recovery. Repeat against the released deployment before closing LANG-05.
