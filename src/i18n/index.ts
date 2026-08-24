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
 * Add new languages here and create matching directory in public/locales/ —
 * `npm run check:locales` (run automatically before builds) validates that
 * every registered language has complete, well-formed translation files.
 * See docs/LOCALIZATION_ANALYSIS.md for per-language notes and future candidates.
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'ban', name: 'Balinese', nativeName: 'Basa Bali', flag: '🇮🇩' },
  { code: 'zh', name: 'Simplified Chinese', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'zh-Hant', name: 'Traditional Chinese', nativeName: '繁體中文', flag: '🇭🇰' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇸🇬' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
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
      // Chinese needs script-aware mapping: default language-only fallback
      // would send zh-TW/zh-HK users to Simplified Chinese. Route Traditional
      // regions/scripts to zh-Hant, everything else Chinese to zh (Simplified).
      convertDetectedLanguage: (lng: string) => {
        if (/^zh\b/i.test(lng)) {
          return /hant|tw|hk|mo/i.test(lng) ? 'zh-Hant' : 'zh';
        }
        return lng;
      },
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

/**
 * Right-to-left languages, by base subtag. None are supported yet — this set
 * exists so adding one (e.g. Arabic) flips the document direction with no
 * further code changes.
 */
const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur']);

// Keep <html lang> and <html dir> in sync with the active language, for
// screen readers, SEO, and font/direction selection. Fires on initial
// detection and on every switch, so no component needs to manage this.
i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
    document.documentElement.dir = RTL_LANGUAGES.has(lng.split('-')[0]) ? 'rtl' : 'ltr';
  }
});

export default i18n;
