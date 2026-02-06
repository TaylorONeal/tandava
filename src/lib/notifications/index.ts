/**
 * Notification System
 *
 * Provider-agnostic notification infrastructure.
 * Supports email (SendGrid, Resend, Postmark), SMS (Twilio, Vonage),
 * and push notifications (Firebase, Web Push).
 */

export * from './types';

// Provider registry - maps provider type to implementation
// Implementations are loaded dynamically based on studio configuration

import type {
  NotificationChannel,
  NotificationProvider,
  SendNotificationRequest,
  SendNotificationResult,
  NotificationStatus,
  NotificationError,
} from './types';

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

/**
 * Main notification service that routes to configured providers
 */
export class NotificationService {
  private emailProvider: NotificationProvider | null = null;
  private smsProvider: NotificationProvider | null = null;
  private pushProvider: NotificationProvider | null = null;

  /**
   * Configure a provider for a specific channel
   */
  setProvider(channel: NotificationChannel, provider: NotificationProvider): void {
    switch (channel) {
      case 'email':
        this.emailProvider = provider;
        break;
      case 'sms':
        this.smsProvider = provider;
        break;
      case 'push':
        this.pushProvider = provider;
        break;
      case 'in_app':
        // In-app notifications are handled directly via database/realtime
        break;
    }
  }

  /**
   * Send a notification through the appropriate provider
   */
  async send(request: SendNotificationRequest): Promise<SendNotificationResult> {
    const provider = this.getProvider(request.channel);

    if (!provider) {
      return {
        success: false,
        notificationId: '',
        status: 'failed',
        error: {
          code: 'NO_PROVIDER',
          message: `No provider configured for channel: ${request.channel}`,
          retryable: false,
        },
      };
    }

    // Check recipient preferences
    if (request.recipient.preferences) {
      const blocked = this.isBlockedByPreferences(request);
      if (blocked) {
        return {
          success: false,
          notificationId: '',
          status: 'unsubscribed',
          error: {
            code: 'UNSUBSCRIBED',
            message: blocked,
            retryable: false,
          },
        };
      }
    }

    // Get recipient address based on channel
    const to = this.getRecipientAddress(request);
    if (!to) {
      return {
        success: false,
        notificationId: '',
        status: 'failed',
        error: {
          code: 'NO_ADDRESS',
          message: `Recipient has no ${request.channel} address`,
          retryable: false,
        },
      };
    }

    try {
      const result = await provider.send({
        to,
        content: request.content,
        metadata: request.metadata,
      });

      return {
        success: result.success,
        notificationId: crypto.randomUUID(),
        providerMessageId: result.messageId,
        status: result.success ? 'sent' : 'failed',
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        notificationId: '',
        status: 'failed',
        error: {
          code: 'PROVIDER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          providerError: error,
        },
      };
    }
  }

  private getProvider(channel: NotificationChannel): NotificationProvider | null {
    switch (channel) {
      case 'email':
        return this.emailProvider;
      case 'sms':
        return this.smsProvider;
      case 'push':
        return this.pushProvider;
      default:
        return null;
    }
  }

  private getRecipientAddress(request: SendNotificationRequest): string | null {
    switch (request.channel) {
      case 'email':
        return request.recipient.email || null;
      case 'sms':
        return request.recipient.phone || null;
      case 'push':
        return request.recipient.pushTokens?.[0] || null;
      default:
        return null;
    }
  }

  private isBlockedByPreferences(request: SendNotificationRequest): string | null {
    const prefs = request.recipient.preferences;
    if (!prefs) return null;

    // Global opt-out
    if (prefs.unsubscribedAll) {
      return 'Recipient has unsubscribed from all notifications';
    }

    // Channel-specific opt-out
    if (request.channel === 'email' && !prefs.emailEnabled) {
      return 'Recipient has disabled email notifications';
    }
    if (request.channel === 'sms' && !prefs.smsEnabled) {
      return 'Recipient has disabled SMS notifications';
    }
    if (request.channel === 'push' && !prefs.pushEnabled) {
      return 'Recipient has disabled push notifications';
    }

    // Type-specific opt-out
    if (prefs.disabledTypes.includes(request.type)) {
      return `Recipient has disabled ${request.type} notifications`;
    }

    // Quiet hours check
    if (prefs.quietHoursEnabled && prefs.quietHoursStart && prefs.quietHoursEnd) {
      const now = new Date();
      const timezone = prefs.quietHoursTimezone || 'UTC';

      // Simple quiet hours check (production should use proper timezone library)
      const hours = now.getHours();
      const startHour = parseInt(prefs.quietHoursStart.split(':')[0], 10);
      const endHour = parseInt(prefs.quietHoursEnd.split(':')[0], 10);

      // Handle overnight quiet hours (e.g., 22:00 to 08:00)
      if (startHour > endHour) {
        if (hours >= startHour || hours < endHour) {
          return 'Currently in quiet hours - notification will be queued';
        }
      } else {
        if (hours >= startHour && hours < endHour) {
          return 'Currently in quiet hours - notification will be queued';
        }
      }
    }

    return null;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create notification content from a template with variable substitution
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Mask sensitive data for logging (email, phone)
 */
export function maskAddress(address: string, type: 'email' | 'phone'): string {
  if (type === 'email') {
    const [local, domain] = address.split('@');
    if (!domain) return '***';
    const maskedLocal = local.length > 2
      ? `${local[0]}***${local[local.length - 1]}`
      : '***';
    return `${maskedLocal}@${domain}`;
  }

  if (type === 'phone') {
    // Show last 4 digits
    return `***${address.slice(-4)}`;
  }

  return '***';
}

/**
 * Check if a notification type is transactional (vs marketing)
 * Transactional notifications may bypass some opt-outs
 */
export function isTransactional(type: string): boolean {
  const transactionalTypes = [
    'class_booking_confirmed',
    'class_booking_cancelled',
    'class_cancelled_by_studio',
    'payment_successful',
    'payment_failed',
    'password_reset',
    'email_verification',
    'refund_processed',
    'class_waitlist_promoted',
  ];
  return transactionalTypes.includes(type);
}

// Singleton instance
export const notificationService = new NotificationService();
