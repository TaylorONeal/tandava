/**
 * i18n Initialization
 *
 * Configures react-i18next with:
 * - Lazy-loaded translation files from /locales/{lng}/{ns}.json
 * - Browser language detection with localStorage persistence
 * - Namespace splitting per UI area (common, booking, schedule, manage, auth, validation, email)
 * - Fallback chain: user preference → browser language → English
 *
 * Developer guide:
 *   1. Use `const { t } = useTranslation('namespace')` in components
 *   2. Add English keys to `public/locales/en/{namespace}.json`
 *   3. Other languages fall back to English until translated
 *   4. For formatting (dates, currency, numbers), use `useLocale()` from LocaleContext
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

/**
 * Supported languages.
 * Add new languages here and create matching directory in public/locales/
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ban', name: 'Balinese', nativeName: 'Basa Bali', flag: '🇮🇩' },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code'];

/**
 * Translation namespaces — each maps to a JSON file per language.
 * Keep namespaces aligned with UI areas so only relevant strings are loaded.
 */
export const NAMESPACES = [
  'common',      // Shared: nav, buttons, roles, status labels, reference data labels
  'booking',     // Booking flow: modal, payment, add-ons, confirmation
  'schedule',    // Schedule view, class cards, class details
  'manage',      // Studio management: dashboard, settings, members, offerings
  'auth',        // Login, register, password reset
  'validation',  // Form errors and validation messages
  'email',       // Email template strings
] as const;

/**
 * For Balinese (not in CLDR), we map to Indonesian for Intl formatting.
 * This is used by LocaleContext for date/number/currency formatting.
 */
export const INTL_LOCALE_MAP: Record<string, string> = {
  ban: 'id', // Balinese → Indonesian for Intl APIs
};

/**
 * Get the Intl-compatible locale code for a given app language.
 * Most languages map 1:1, but Balinese maps to Indonesian.
 */
export function getIntlLocale(language: string): string {
  return INTL_LOCALE_MAP[language] ?? language;
}

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Fallback to English when a translation is missing
    fallbackLng: 'en',

    // Only allow languages we have translations for
    supportedLngs: SUPPORTED_LANGUAGES.map(l => l.code),

    // Namespace configuration
    ns: [...NAMESPACES],
    defaultNS: 'common',

    // Load translation files from public/locales/{lng}/{ns}.json
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Language detection: check localStorage first, then browser, then HTML tag
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'tandava-language',
      caches: ['localStorage'],
    },

    interpolation: {
      // React already escapes values — no double-escaping
      escapeValue: false,
    },

    // Don't wait for all translations to load before rendering
    // Components will use Suspense or show English fallback
    react: {
      useSuspense: false,
    },
  });

export default i18n;
