/**
 * Validation Utilities
 *
 * Patterns from Vajra:
 * - Zod for auth (email, password)
 * - Manual validation for complex forms with Record<string, string> error state
 */

import { z } from 'zod';
import i18n from '@/i18n';

// Helper to get current translation (resolved at call time, not import time)
const vt = (key: string, options?: Record<string, unknown>) => i18n.t(key, { ns: 'validation', ...options });

// ============================================================================
// ZOD SCHEMAS (Auth & Simple Forms)
// Use getter functions so error messages resolve in the user's current language.
// ============================================================================

export function getEmailSchema() {
  return z.string().min(1, vt('emailRequired')).email(vt('emailInvalid'));
}

export function getPasswordSchemaSignIn() {
  return z.string().min(6, vt('passwordMinLength', { min: 6 }));
}

export function getPasswordSchemaReset() {
  return z.string().min(12, vt('passwordMinLength', { min: 12 }));
}

export function getPhoneSchema() {
  return z.string().regex(/^\+?[\d\s()-]{10,}$/, vt('phoneInvalid')).optional().or(z.literal(''));
}

export function getUrlSchema() {
  return z.string().url(vt('urlInvalid')).optional().or(z.literal(''));
}

export function getHandleSchema() {
  return z.string().min(3, vt('handleMinLength', { min: 3 })).max(30, vt('handleMaxLength', { max: 30 })).regex(/^[a-z0-9_-]+$/i, vt('handleFormat'));
}

// Backwards-compatible static exports (English, evaluated at import time).
// New code should prefer the getter functions above for proper i18n.
export const emailSchema = z.string().min(1, 'Email is required').email('Please enter a valid email address');
export const passwordSchemaSignIn = z.string().min(6, 'Password must be at least 6 characters');
export const passwordSchemaReset = z.string().min(12, 'Password must be at least 12 characters');
export const phoneSchema = z.string().regex(/^\+?[\d\s()-]{10,}$/, 'Please enter a valid phone number').optional().or(z.literal(''));
export const urlSchema = z.string().url('Please enter a valid URL').optional().or(z.literal(''));
export const handleSchema = z.string().min(3, 'Handle must be at least 3 characters').max(30, 'Handle must be less than 30 characters').regex(/^[a-z0-9_-]+$/i, 'Handle can only contain letters, numbers, underscores, and hyphens');

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export type ValidationErrors = Record<string, string>;

/**
 * Validate a single field with Zod schema
 */
export function validateField<T>(
  schema: z.ZodType<T>,
  value: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0].message };
}

/**
 * Check if a value is empty (null, undefined, empty string, or whitespace only)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Validate required field
 */
export function validateRequired(
  value: unknown,
  fieldName: string
): string | undefined {
  if (isEmpty(value)) {
    return vt('fieldRequired', { field: fieldName });
  }
  return undefined;
}

/**
 * Validate URL (optional field)
 */
export function validateUrl(
  value: string | undefined,
  fieldName = 'URL'
): string | undefined {
  if (!value || value.trim() === '') return undefined;
  try {
    new URL(value);
    return undefined;
  } catch {
    return vt('fieldInvalidUrl', { field: fieldName });
  }
}

/**
 * Validate email
 */
export function validateEmail(value: string): string | undefined {
  const result = emailSchema.safeParse(value);
  if (!result.success) {
    return result.error.errors[0].message;
  }
  return undefined;
}

/**
 * Validate time range (end must be after start)
 */
export function validateTimeRange(
  startTime: string,
  endTime: string
): string | undefined {
  if (startTime >= endTime) {
    return vt('endTimeAfterStart');
  }
  return undefined;
}

/**
 * Validate date range (end must be after or equal to start)
 */
export function validateDateRange(
  startDate: string,
  endDate: string
): string | undefined {
  if (new Date(endDate) < new Date(startDate)) {
    return vt('endDateAfterStart');
  }
  return undefined;
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(
  value: number,
  fieldName = 'Value'
): string | undefined {
  if (value <= 0) {
    return vt('mustBePositive', { field: fieldName });
  }
  return undefined;
}

/**
 * Validate price in cents (must be positive integer)
 */
export function validatePriceCents(
  value: number,
  fieldName = 'Price'
): string | undefined {
  if (!Number.isInteger(value) || value < 0) {
    return vt('mustBeValidAmount', { field: fieldName });
  }
  return undefined;
}

/**
 * Validate capacity (must be positive integer)
 */
export function validateCapacity(
  value: number,
  fieldName = 'Capacity'
): string | undefined {
  if (!Number.isInteger(value) || value <= 0) {
    return vt('mustBePositiveNumber', { field: fieldName });
  }
  return undefined;
}

// ============================================================================
// FORM VALIDATION PATTERN
// ============================================================================

/**
 * Example form validation pattern (from Vajra):
 *
 * const [errors, setErrors] = useState<ValidationErrors>({});
 *
 * const validate = (): boolean => {
 *   const newErrors: ValidationErrors = {};
 *
 *   const titleError = validateRequired(formData.title, 'Title');
 *   if (titleError) newErrors.title = titleError;
 *
 *   const urlError = validateUrl(formData.bookingUrl, 'Booking URL');
 *   if (urlError) newErrors.bookingUrl = urlError;
 *
 *   const timeError = validateTimeRange(formData.startTime, formData.endTime);
 *   if (timeError) newErrors.endTime = timeError;
 *
 *   setErrors(newErrors);
 *   return Object.keys(newErrors).length === 0;
 * };
 *
 * // Clear error on field change:
 * onChange={(e) => {
 *   setFieldValue(e.target.value);
 *   if (errors.fieldName) {
 *     setErrors(prev => ({ ...prev, fieldName: undefined }));
 *   }
 * }}
 *
 * // Display error:
 * {errors.fieldName && (
 *   <p className="text-sm text-destructive">{errors.fieldName}</p>
 * )}
 */

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Sanitize handle/username (lowercase, remove special chars)
 */
export function sanitizeHandle(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 30);
}

/**
 * Sanitize phone number (keep only digits and +)
 */
export function sanitizePhone(input: string): string {
  return input.replace(/[^\d+]/g, '');
}

/**
 * Sanitize price input to cents
 */
export function parsePriceToCents(input: string): number {
  const cleaned = input.replace(/[^\d.]/g, '');
  const dollars = parseFloat(cleaned);
  if (isNaN(dollars)) return 0;
  return Math.round(dollars * 100);
}
