/**
 * Universal Notification System Types
 *
 * Provider-agnostic notification interfaces for email, SMS, and push.
 * Each provider (SendGrid, Resend, Twilio, etc.) implements the NotificationProvider interface.
 */

// ============================================================================
// NOTIFICATION CHANNELS
// ============================================================================

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

// ============================================================================
// NOTIFICATION TYPES (what triggers the notification)
// ============================================================================

export type NotificationType =
  // Class-related
  | 'class_booking_confirmed'
  | 'class_booking_cancelled'
  | 'class_reminder'           // e.g., 24h or 1h before
  | 'class_cancelled_by_studio'
  | 'class_teacher_changed'
  | 'class_time_changed'
  | 'class_waitlist_added'
  | 'class_waitlist_promoted'
  // Payment-related
  | 'payment_successful'
  | 'payment_failed'
  | 'payment_retry_scheduled'
  | 'payment_method_expiring'
  | 'membership_renewed'
  | 'membership_expiring'
  | 'membership_expired'
  | 'class_pack_low'
  | 'class_pack_expired'
  | 'refund_processed'
  | 'invoice_created'
  // Account-related
  | 'welcome'
  | 'password_reset'
  | 'email_verification'
  | 'account_deactivated'
  // Task-related (staff)
  | 'task_assigned'
  | 'task_due_soon'
  | 'task_overdue'
  // Other
  | 'custom';

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export type EmailProviderType =
  | 'sendgrid'
  | 'resend'
  | 'postmark'
  | 'ses'        // AWS SES
  | 'mailgun'
  | 'smtp'       // Generic SMTP
  | 'console';   // Development: log to console

export type SmsProviderType =
  | 'twilio'
  | 'vonage'     // formerly Nexmo
  | 'messagebird'
  | 'plivo'
  | 'sns'        // AWS SNS
  | 'console';   // Development: log to console

export type PushProviderType =
  | 'firebase'   // Firebase Cloud Messaging
  | 'onesignal'
  | 'web_push'   // Native Web Push API
  | 'console';   // Development: log to console

// ============================================================================
// NOTIFICATION CONTENT
// ============================================================================

export interface NotificationContent {
  // Core content
  subject?: string;        // Email subject line
  title?: string;          // Push notification title
  body: string;            // Main message body (plain text)
  bodyHtml?: string;       // HTML version for email

  // Personalization
  templateId?: string;     // Provider template ID (SendGrid dynamic templates, etc.)
  templateData?: Record<string, unknown>;

  // Actions
  primaryAction?: NotificationAction;
  secondaryAction?: NotificationAction;

  // Rich content (push)
  imageUrl?: string;
  badgeCount?: number;
  sound?: string;
  data?: Record<string, unknown>;  // Custom payload
}

export interface NotificationAction {
  label: string;
  url?: string;
  action?: string;  // For push action handlers
}

// ============================================================================
// RECIPIENT
// ============================================================================

export interface NotificationRecipient {
  profileId: string;
  email?: string;
  phone?: string;
  pushTokens?: string[];

  // For personalization
  name?: string;
  firstName?: string;
  timezone?: string;

  // Preferences (pre-filtered before calling provider)
  preferences?: NotificationPreferences;
}

export interface NotificationPreferences {
  // Global opt-out
  unsubscribedAll: boolean;

  // Channel preferences
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;

  // Type preferences (which notifications they want)
  disabledTypes: NotificationType[];

  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart?: string;  // "22:00"
  quietHoursEnd?: string;    // "08:00"
  quietHoursTimezone?: string;
}

// ============================================================================
// SEND REQUEST
// ============================================================================

export interface SendNotificationRequest {
  // What to send
  type: NotificationType;
  channel: NotificationChannel;
  content: NotificationContent;

  // Who to send to
  recipient: NotificationRecipient;

  // Context
  studioId: string;

  // Options
  scheduledFor?: Date;       // Send at specific time
  idempotencyKey?: string;   // Prevent duplicates
  priority?: 'high' | 'normal' | 'low';

  // Tracking
  metadata?: Record<string, string>;
}

// ============================================================================
// SEND RESULT
// ============================================================================

export interface SendNotificationResult {
  success: boolean;

  // IDs
  notificationId: string;    // Our internal ID
  providerMessageId?: string; // Provider's ID (for tracking)

  // Error info
  error?: NotificationError;

  // Delivery tracking
  status: NotificationStatus;
  deliveredAt?: Date;
}

export type NotificationStatus =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'bounced'
  | 'failed'
  | 'unsubscribed'
  | 'spam_reported';

export interface NotificationError {
  code: string;
  message: string;
  retryable: boolean;
  providerError?: unknown;
}

// ============================================================================
// PROVIDER INTERFACE
// ============================================================================

/**
 * Interface that all notification providers must implement.
 * Tandava calls these methods; provider adapters translate to vendor APIs.
 */
export interface NotificationProvider<TConfig = unknown> {
  readonly providerType: string;
  readonly channel: NotificationChannel;

  /**
   * Initialize the provider with credentials and configuration
   */
  initialize(config: TConfig): Promise<void>;

  /**
   * Send a single notification
   */
  send(request: ProviderSendRequest): Promise<ProviderSendResult>;

  /**
   * Send multiple notifications (batch)
   */
  sendBatch?(requests: ProviderSendRequest[]): Promise<ProviderSendResult[]>;

  /**
   * Check delivery status (if supported)
   */
  getStatus?(providerMessageId: string): Promise<NotificationStatus>;

  /**
   * Verify webhook signature (for delivery callbacks)
   */
  verifyWebhook?(payload: string | Buffer, signature: string): boolean;

  /**
   * Parse webhook event
   */
  parseWebhookEvent?(payload: unknown): NotificationWebhookEvent;
}

// Provider-level request (after our abstraction layer processes)
export interface ProviderSendRequest {
  to: string;              // Email address, phone number, or push token
  content: NotificationContent;
  metadata?: Record<string, string>;
}

export interface ProviderSendResult {
  success: boolean;
  messageId?: string;
  error?: NotificationError;
}

export interface NotificationWebhookEvent {
  eventType: 'delivered' | 'bounced' | 'opened' | 'clicked' | 'unsubscribed' | 'spam_reported';
  messageId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// PROVIDER CONFIGURATIONS
// ============================================================================

export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  sandboxMode?: boolean;
}

export interface ResendConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  messagingServiceSid?: string;
}

export interface FirebaseConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
}

export interface WebPushConfig {
  vapidPublicKey: string;
  vapidPrivateKey: string;
  subject: string;  // mailto: or URL
}

// ============================================================================
// NOTIFICATION QUEUE
// ============================================================================

export interface QueuedNotification {
  id: string;
  studioId: string;

  // Request data
  type: NotificationType;
  channel: NotificationChannel;
  recipientId: string;
  content: NotificationContent;

  // Scheduling
  scheduledFor: Date;
  priority: 'high' | 'normal' | 'low';

  // Retry tracking
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  nextAttemptAt?: Date;
  lastError?: NotificationError;

  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

  // Metadata
  idempotencyKey?: string;
  metadata?: Record<string, string>;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// NOTIFICATION LOG (for history/analytics)
// ============================================================================

export interface NotificationLogEntry {
  id: string;
  studioId: string;

  // What was sent
  type: NotificationType;
  channel: NotificationChannel;
  provider: string;

  // Who it was sent to
  recipientId: string;
  recipientAddress: string;  // Email/phone (masked for privacy)

  // Content snapshot
  subject?: string;
  bodyPreview: string;

  // Delivery tracking
  status: NotificationStatus;
  providerMessageId?: string;

  // Timestamps
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;

  // Errors
  error?: NotificationError;

  // Metadata
  metadata?: Record<string, string>;
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface NotificationTemplate {
  id: string;
  studioId: string;

  // Identity
  name: string;
  type: NotificationType;
  channel: NotificationChannel;

  // Content
  subject?: string;
  body: string;
  bodyHtml?: string;

  // Provider template (optional)
  providerTemplateId?: string;

  // Variables available
  variables: TemplateVariable[];

  // Status
  isActive: boolean;
  isDefault: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
  required: boolean;
}

// Default template variables available for all notification types
export const DEFAULT_TEMPLATE_VARIABLES: TemplateVariable[] = [
  { name: 'studio_name', description: 'Studio name', example: 'Oxatl Yoga', required: false },
  { name: 'member_name', description: 'Member full name', example: 'Sarah Johnson', required: false },
  { name: 'member_first_name', description: 'Member first name', example: 'Sarah', required: false },
  { name: 'current_date', description: 'Current date', example: 'February 6, 2025', required: false },
];

// Type-specific template variables
export const NOTIFICATION_TEMPLATE_VARIABLES: Record<NotificationType, TemplateVariable[]> = {
  class_booking_confirmed: [
    { name: 'class_name', description: 'Class name', example: 'Power Vinyasa', required: true },
    { name: 'class_date', description: 'Class date', example: 'Monday, Feb 10', required: true },
    { name: 'class_time', description: 'Class time', example: '9:00 AM', required: true },
    { name: 'teacher_name', description: 'Teacher name', example: 'Maya Rivers', required: true },
    { name: 'location_name', description: 'Location name', example: 'Downtown Studio', required: true },
    { name: 'booking_id', description: 'Booking reference', example: 'BK-12345', required: false },
  ],
  class_reminder: [
    { name: 'class_name', description: 'Class name', example: 'Power Vinyasa', required: true },
    { name: 'class_date', description: 'Class date', example: 'Monday, Feb 10', required: true },
    { name: 'class_time', description: 'Class time', example: '9:00 AM', required: true },
    { name: 'teacher_name', description: 'Teacher name', example: 'Maya Rivers', required: true },
    { name: 'location_name', description: 'Location name', example: 'Downtown Studio', required: true },
    { name: 'hours_until', description: 'Hours until class', example: '24', required: false },
  ],
  payment_successful: [
    { name: 'amount', description: 'Payment amount', example: '$99.00', required: true },
    { name: 'description', description: 'What was purchased', example: 'Monthly Membership', required: true },
    { name: 'payment_method', description: 'Payment method', example: 'Visa ••••4242', required: false },
    { name: 'receipt_url', description: 'Receipt link', example: 'https://...', required: false },
  ],
  payment_failed: [
    { name: 'amount', description: 'Payment amount', example: '$99.00', required: true },
    { name: 'description', description: 'What was being paid', example: 'Monthly Membership', required: true },
    { name: 'failure_reason', description: 'Why it failed', example: 'Card declined', required: false },
    { name: 'update_payment_url', description: 'Link to update payment', example: 'https://...', required: true },
  ],
  // Add more as needed...
  class_booking_cancelled: [],
  class_cancelled_by_studio: [],
  class_teacher_changed: [],
  class_time_changed: [],
  class_waitlist_added: [],
  class_waitlist_promoted: [],
  payment_retry_scheduled: [],
  payment_method_expiring: [],
  membership_renewed: [],
  membership_expiring: [],
  membership_expired: [],
  class_pack_low: [],
  class_pack_expired: [],
  refund_processed: [],
  invoice_created: [],
  welcome: [],
  password_reset: [],
  email_verification: [],
  account_deactivated: [],
  task_assigned: [],
  task_due_soon: [],
  task_overdue: [],
  custom: [],
};
