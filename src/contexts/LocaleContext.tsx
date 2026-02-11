/**
 * Locale Context
 *
 * Provides locale-aware formatting throughout the app. This context combines:
 * - Language preference (from i18next)
 * - Studio settings (timezone, currency)
 * - Formatting utilities that respect the active locale
 *
 * Two-level language model:
 *   1. Studio default language — set by studio owner, affects emails & landing pages
 *   2. User preferred language — set by member, overrides studio default for their UI
 *
 * Usage:
 *   const { formatPrice, formatDate, formatTime, formatNumber, locale } = useLocale();
 *   <span>{formatPrice(6500)}</span>         // → "$65.00" or "฿2,100"
 *   <span>{formatDate(dateStr)}</span>        // → "Sat, Dec 7" or "ส. 7 ธ.ค."
 *   <span>{formatTime('18:00')}</span>        // → "6:00 PM" (US calendar style)
 *   <span>{formatNumber(1234.5)}</span>       // → "1,234.5" or "1.234,5"
 */

import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { getIntlLocale } from '@/i18n';

// ============================================================================
// Types
// ============================================================================

export interface StudioLocaleSettings {
  /** Studio's default language code (e.g., 'en', 'th', 'es') */
  defaultLocale: string;
  /** Languages this studio has enabled for members */
  supportedLocales: string[];
  /** Studio's currency code (e.g., 'USD', 'THB', 'MXN') */
  currency: string;
  /** Studio's IANA timezone (e.g., 'America/Chicago', 'Asia/Bangkok') */
  timezone: string;
}

interface LocaleContextType {
  /** Current active language code */
  locale: string;
  /** Intl-compatible locale (handles Balinese→Indonesian mapping) */
  intlLocale: string;
  /** Studio locale settings */
  studioSettings: StudioLocaleSettings;

  // ---- Formatting utilities ----

  /** Format cents to currency string. Uses studio currency by default. */
  formatPrice: (cents: number, currencyOverride?: string) => string;

  /** Format a date string with locale-aware formatting. */
  formatDate: (
    dateOrString: Date | string,
    options?: Intl.DateTimeFormatOptions
  ) => string;

  /**
   * Format a time string (HH:MM) for display.
   * Uses 12-hour AM/PM format (US calendar style per project requirement).
   * Pass a timezone to render in that zone (defaults to studio timezone).
   */
  formatTime: (
    time: string,
    options?: { timezone?: string }
  ) => string;

  /**
   * Format a full datetime for class display.
   * Renders the time in the CLASS LOCATION's timezone, not the user's device.
   * This prevents VPN/travel confusion (a class at 6 PM in Austin shows 6 PM
   * regardless of where the user is browsing from).
   */
  formatClassDateTime: (
    startsAt: string | Date,
    options?: {
      timezone?: string;
      includeDate?: boolean;
    }
  ) => string;

  /** Format a number with locale-appropriate separators. */
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;

  /** Format a relative time ("2 hours ago", "in 3 days"). */
  formatRelativeTime: (date: Date | string) => string;

  /** Get localized day name from index (0=Sunday for US calendar). */
  getDayName: (dayIndex: number, style?: 'long' | 'short' | 'narrow') => string;
}

const DEFAULT_STUDIO_SETTINGS: StudioLocaleSettings = {
  defaultLocale: 'en',
  supportedLocales: ['en'],
  currency: 'USD',
  timezone: 'America/Chicago',
};

// ============================================================================
// Context
// ============================================================================

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface LocaleProviderProps {
  children: ReactNode;
  /** Override studio settings (from studio record when available) */
  studioSettings?: Partial<StudioLocaleSettings>;
}

export function LocaleProvider({ children, studioSettings: studioOverrides }: LocaleProviderProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const intlLocale = getIntlLocale(locale);

  const studioSettings: StudioLocaleSettings = useMemo(() => ({
    ...DEFAULT_STUDIO_SETTINGS,
    ...studioOverrides,
  }), [studioOverrides]);

  // ---- Currency formatting ----
  const formatPrice = useCallback((cents: number, currencyOverride?: string) => {
    const curr = currencyOverride ?? studioSettings.currency;
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: curr,
      // Omit cents for round numbers (e.g., "$65" not "$65.00")
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  }, [intlLocale, studioSettings.currency]);

  // ---- Date formatting ----
  const formatDate = useCallback((
    dateOrString: Date | string,
    options?: Intl.DateTimeFormatOptions,
  ) => {
    const date = typeof dateOrString === 'string' ? new Date(dateOrString) : dateOrString;
    return new Intl.DateTimeFormat(intlLocale, options ?? {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }, [intlLocale]);

  // ---- Time formatting ----
  // Always uses 12-hour AM/PM (US calendar style per project requirement)
  const formatTime = useCallback((
    time: string,
    options?: { timezone?: string },
  ) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, minutes);
    return new Intl.DateTimeFormat(intlLocale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,       // US calendar style: always AM/PM
      timeZone: options?.timezone,
    }).format(date);
  }, [intlLocale]);

  // ---- Class datetime formatting ----
  // KEY DESIGN DECISION: Class times render in the CLASS LOCATION's timezone,
  // not the user's device timezone. This prevents confusion from VPNs, travel,
  // or remote booking. A 6 PM class in Austin always shows "6:00 PM" regardless
  // of where the member's browser thinks it is.
  //
  // For on-demand / non-location-bound content, pass no timezone to use studio default.
  const formatClassDateTime = useCallback((
    startsAt: string | Date,
    options?: { timezone?: string; includeDate?: boolean },
  ) => {
    const date = typeof startsAt === 'string' ? new Date(startsAt) : startsAt;
    const tz = options?.timezone ?? studioSettings.timezone;
    const includeDate = options?.includeDate ?? true;

    if (includeDate) {
      return new Intl.DateTimeFormat(intlLocale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: tz,
      }).format(date);
    }

    return new Intl.DateTimeFormat(intlLocale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: tz,
    }).format(date);
  }, [intlLocale, studioSettings.timezone]);

  // ---- Number formatting ----
  const formatNumber = useCallback((
    value: number,
    options?: Intl.NumberFormatOptions,
  ) => {
    return new Intl.NumberFormat(intlLocale, options).format(value);
  }, [intlLocale]);

  // ---- Relative time formatting ----
  const formatRelativeTime = useCallback((dateOrString: Date | string) => {
    const date = typeof dateOrString === 'string' ? new Date(dateOrString) : dateOrString;
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    const rtf = new Intl.RelativeTimeFormat(intlLocale, { numeric: 'auto' });

    if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
    if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
    return rtf.format(diffDay, 'day');
  }, [intlLocale]);

  // ---- Day name ----
  // Uses Sunday=0 convention (US calendar week start)
  const getDayName = useCallback((
    dayIndex: number,
    style: 'long' | 'short' | 'narrow' = 'long',
  ) => {
    // Create a date that falls on the correct day of week
    // Jan 2, 2000 is a Sunday (index 0)
    const date = new Date(2000, 0, 2 + dayIndex);
    return new Intl.DateTimeFormat(intlLocale, { weekday: style }).format(date);
  }, [intlLocale]);

  const value = useMemo<LocaleContextType>(() => ({
    locale,
    intlLocale,
    studioSettings,
    formatPrice,
    formatDate,
    formatTime,
    formatClassDateTime,
    formatNumber,
    formatRelativeTime,
    getDayName,
  }), [
    locale, intlLocale, studioSettings,
    formatPrice, formatDate, formatTime, formatClassDateTime,
    formatNumber, formatRelativeTime, getDayName,
  ]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Access locale-aware formatting utilities.
 *
 * @example
 * const { formatPrice, formatDate, formatClassDateTime } = useLocale();
 *
 * // Currency — uses studio's currency setting
 * formatPrice(6500)              // "$65" (en-US, USD)
 * formatPrice(210000, 'THB')     // "฿2,100" (th, THB)
 *
 * // Dates — locale-aware but consistent week start
 * formatDate('2026-02-10')       // "Tue, Feb 10" (en)  /  "อ. 10 ก.พ." (th)
 *
 * // Class times — always in the CLASS location's timezone
 * formatClassDateTime(startsAt, { timezone: 'America/Chicago' })  // "Sat, Feb 7, 6:00 PM"
 */
export function useLocale(): LocaleContextType {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
