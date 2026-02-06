/**
 * Email Template System
 *
 * This module provides a complete set of email templates for studio operations.
 * Templates are built with React components that render to HTML-email compatible markup.
 *
 * Usage:
 * - Import templates and render them with your email sending service
 * - Each template has an example data export for preview/testing
 * - The EmailLayout provides consistent branding and structure
 *
 * Customization:
 * - Update emailColors in EmailLayout.tsx to match your brand
 * - Add studioLogo prop for logo display
 * - Templates support both light backgrounds (recommended for email)
 */

// Base layout and components
export {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailDivider,
  EmailInfoRow,
  emailColors,
} from "./EmailLayout";

// Templates
export {
  BookingConfirmationEmail,
  bookingConfirmationEmailExample,
} from "./templates/BookingConfirmationEmail";

export {
  WelcomeEmail,
  welcomeEmailExample,
} from "./templates/WelcomeEmail";

export {
  ClassReminderEmail,
  classReminderEmailExample,
} from "./templates/ClassReminderEmail";

export {
  PurchaseReceiptEmail,
  purchaseReceiptEmailExample,
} from "./templates/PurchaseReceiptEmail";

/**
 * Template Reference
 *
 * BookingConfirmationEmail - Sent after successful booking
 * WelcomeEmail - Sent after account creation
 * ClassReminderEmail - Sent 24h and/or 2h before class
 * PurchaseReceiptEmail - Sent after membership/pack purchase
 *
 * Planned templates:
 * - WaitlistConfirmationEmail - When added to waitlist
 * - WaitlistSpotOpenEmail - When spot becomes available
 * - MembershipExpiringEmail - 7 days before expiration
 * - PackRunningLowEmail - When pack reaches low threshold
 * - InstructorSubRequestEmail - Sub request to instructors
 * - InstructorEarningsEmail - Weekly/monthly earnings summary
 * - OwnerDailySummaryEmail - Daily studio performance
 */
