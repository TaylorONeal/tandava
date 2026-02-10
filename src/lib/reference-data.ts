/**
 * Reference Data - Canonical Lists
 *
 * Standardized options for class styles, workshop types, credentials, etc.
 * Used for autocomplete, filtering, and data normalization.
 */

// ============================================================================
// CLASS STYLES (50 options)
// ============================================================================

export const CLASS_STYLES = [
  // Core flow & foundation
  'Vinyasa', 'Power Vinyasa', 'Yoga Sculpt', 'Flow Yoga', 'Power Flow',
  'Strength & Flow', 'Core Flow', 'Hatha', 'Slow Flow', 'Gentle Yoga',
  'All Levels Yoga', 'Beginner Yoga', 'Intermediate Yoga', 'Advanced Yoga',
  // Restorative & mindful
  'Yin', 'Restorative', 'Mindful Flow', 'Meditation', 'Breathwork',
  'Breathwork & Meditation', 'Yoga Nidra',
  // Heat & intensity
  'Hot Yoga', 'Heated Flow', 'Hot Power', 'Bikram',
  // Mobility & functional
  'Yoga for Mobility', 'Alignment-Based Yoga', 'Iyengar-Inspired',
  // Lineage & traditional
  'Ashtanga', 'Kundalini', 'Rocket Yoga', 'Jivamukti',
  // Hybrid / specialty
  'Vinyasa & Yin', 'Yoga Barre', 'Pilates', 'Mat Pilates', 'Reformer Pilates',
  'Chair Yoga', 'Chair & Gentle Flow', 'Prenatal Yoga', 'Postnatal Yoga',
  // Experience-based
  'Sound Bath', 'Ecstatic Dance', 'Blacklight Yoga', 'Candlelit Yoga',
  // Other movement
  'Barre', 'HIIT', 'Stretch & Release',
  // Fallback
  'Other',
] as const;

export type ClassStyle = (typeof CLASS_STYLES)[number];

// ============================================================================
// WORKSHOP TYPES (30 options)
// ============================================================================

export const WORKSHOP_TYPES = [
  // Foundational
  'Intro to Yoga', 'Yoga 101', 'Foundations of Yoga', 'Beginner Yoga Intensive',
  'Posture & Alignment', 'Hands-On Assists Training',
  // Philosophy & mind
  'Yoga Philosophy', 'Breathwork Workshop', 'Meditation Intensive',
  'Nervous System Reset', 'Mantra & Chanting', 'Sound Bath',
  // Restorative
  'Yin Yoga Workshop', 'Restorative Yoga Workshop', 'Yoga Nidra Workshop',
  // Therapeutic
  'Yoga for Mobility', 'Chair Yoga Workshop', 'Yoga for Back Care',
  'Hip Opening Workshop', 'Shoulders & Upper Body',
  // Peak pose / advanced
  'Peak Pose Workshop', 'Advanced Asanas', 'Inversions Workshop',
  'Handstand Workshop', 'Arm Balance Workshop',
  // Partner / community
  'Partner Yoga', 'Acroyoga', 'Community Practice',
  // Special
  'Myofascial Release', 'Full Moon Ceremony', 'Glow Yoga',
  // Fallback
  'Other',
] as const;

export type WorkshopType = (typeof WORKSHOP_TYPES)[number];

// ============================================================================
// TEACHER CREDENTIALS
// ============================================================================

export const CORE_TRAINING_OPTIONS = [
  { value: '200hr', label: '200-Hour Teacher Training' },
  { value: '300hr', label: '300-Hour Advanced Training' },
  { value: '500hr', label: '500-Hour Teacher Training' },
  { value: 'other', label: 'Other Teacher Training' },
] as const;

export const YOGA_ALLIANCE_LEVELS = [
  { value: 'RYT-200', label: 'RYT-200' },
  { value: 'RYT-500', label: 'RYT-500' },
  { value: 'E-RYT-200', label: 'E-RYT 200' },
  { value: 'E-RYT-500', label: 'E-RYT 500' },
  { value: 'YACEP', label: 'YACEP' },
] as const;

export const SPECIALTY_OPTIONS = [
  'Yin Yoga', 'Restorative Yoga', 'Prenatal Yoga', 'Postnatal Yoga',
  'Trauma-Informed Yoga', 'Yoga Nidra', 'Breathwork',
  'Meditation / Mindfulness', 'Somatic / Embodiment',
  'Mobility / Functional Movement', 'Alignment / Props-focused',
  'Hands-on Assists', 'Sound Bath / Sound Healing', 'Ayurveda', 'Reiki',
  'Kids Yoga', 'Seniors Yoga', 'Adaptive Yoga',
  'Other',
] as const;

// ============================================================================
// BOOKING PROVIDERS
// ============================================================================

export type BookingProvider =
  | 'mindbody'
  | 'walla'
  | 'momence'
  | 'wellness_living'
  | 'arketa'
  | 'vagaro'
  | 'acuity'
  | 'squarespace'
  | 'stripe'
  | 'other';

export const BOOKING_PROVIDERS: { value: BookingProvider; label: string }[] = [
  { value: 'mindbody', label: 'Mindbody' },
  { value: 'walla', label: 'Walla' },
  { value: 'momence', label: 'Momence' },
  { value: 'wellness_living', label: 'WellnessLiving' },
  { value: 'arketa', label: 'Arketa' },
  { value: 'vagaro', label: 'Vagaro' },
  { value: 'acuity', label: 'Acuity Scheduling' },
  { value: 'squarespace', label: 'Squarespace' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'other', label: 'Other' },
];

// URL patterns for provider detection
const PROVIDER_PATTERNS: Record<BookingProvider, RegExp[]> = {
  mindbody: [/mindbodyonline\.com/i, /clients\.mindbodyonline\.com/i, /healcode\.com/i, /\.mindbody\.io/i],
  walla: [/hellowalla\.com/i, /walla\.co/i],
  momence: [/momence\.com/i, /app\.momence\.com/i],
  wellness_living: [/wellnessliving\.com/i, /\.wellnessliving\./i],
  arketa: [/arketa\.co/i, /book\.arketa\.co/i],
  vagaro: [/vagaro\.com/i, /\.vagaro\./i],
  acuity: [/acuityscheduling\.com/i, /\.acuity\./i],
  squarespace: [/squarespace\.com/i, /\.squarespace\./i],
  stripe: [/checkout\.stripe\.com/i, /buy\.stripe\.com/i],
  other: [],
};

/**
 * Detect booking provider from URL
 */
export function detectBookingProvider(url: string): BookingProvider {
  const normalizedUrl = url.toLowerCase();
  for (const [provider, patterns] of Object.entries(PROVIDER_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(normalizedUrl))) {
      return provider as BookingProvider;
    }
  }
  return 'other';
}

/**
 * Analyze a booking URL for display and validation
 */
export interface BookingUrlAnalysis {
  provider: BookingProvider;
  providerDisplayName: string;
  isValid: boolean;
  feedbackMessage: string;
  feedbackType: 'success' | 'warning' | 'info' | 'error';
}

export function analyzeBookingUrl(url: string): BookingUrlAnalysis {
  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return {
      provider: 'other',
      providerDisplayName: 'Unknown',
      isValid: false,
      feedbackMessage: 'Please enter a valid URL',
      feedbackType: 'error',
    };
  }

  const provider = detectBookingProvider(url);
  const providerInfo = BOOKING_PROVIDERS.find(p => p.value === provider);

  return {
    provider,
    providerDisplayName: providerInfo?.label ?? 'Other',
    isValid: true,
    feedbackMessage: provider !== 'other'
      ? `Detected: ${providerInfo?.label}`
      : 'Custom booking link',
    feedbackType: provider !== 'other' ? 'success' : 'info',
  };
}

// ============================================================================
// PAYMENT METHODS
// ============================================================================

export const PAYMENT_METHODS = [
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'cashapp', label: 'Cash App' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value'];

// ============================================================================
// CTA SUGGESTIONS
// ============================================================================

export const CTA_SUGGESTIONS = [
  'Practice with me', 'Join me this week', 'Flow with me',
  'See you on the mat', 'Come practice', 'Move with me',
  'Book your spot', 'Reserve your mat', 'Sign up now',
  'Join the practice', 'Take class with me', 'Practice IRL',
  'Slow down with me', "Let's move", "Let's flow",
  'Come as you are', 'Take a breath with me', 'Stretch it out with me',
  'Build strength with me', 'Find your flow', 'Ground with me',
  'Reset with me', 'Start your week with me', 'End your week with me',
] as const;

// ============================================================================
// TIME & DATE UTILITIES
// ============================================================================

/**
 * English day names — kept as fallback constants for contexts where
 * a locale isn't available (e.g., static data, server-side).
 * For UI rendering, prefer `useLocale().getDayName()` instead.
 */
export const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

export const DAYS_OF_WEEK_SHORT = [
  'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
] as const;

export function getDayName(dayOfWeek: number, short = false): string {
  return short ? DAYS_OF_WEEK_SHORT[dayOfWeek] : DAYS_OF_WEEK[dayOfWeek];
}

/**
 * Format time from HH:MM to display format (e.g., "9:00 AM").
 *
 * @param time - Time string in HH:MM format
 * @param locale - BCP 47 locale code (default: 'en-US'). For locale-aware
 *   rendering in React components, prefer `useLocale().formatTime()` instead.
 */
export function formatTime(time: string, locale = 'en-US'): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(2000, 0, 1, hours, minutes);
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Format price from cents to display (e.g., 6500 → "$65").
 *
 * @param cents - Price in cents
 * @param currency - ISO 4217 currency code (default: 'USD')
 * @param locale - BCP 47 locale code (default: 'en-US'). For locale-aware
 *   rendering in React components, prefer `useLocale().formatPrice()` instead.
 */
export function formatPrice(cents: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Format date for display.
 *
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormat options
 * @param locale - BCP 47 locale code (default: 'en-US'). For locale-aware
 *   rendering in React components, prefer `useLocale().formatDate()` instead.
 */
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions, locale = 'en-US'): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, options ?? {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
