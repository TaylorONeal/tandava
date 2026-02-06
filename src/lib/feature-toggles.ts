/**
 * Feature Toggles System
 *
 * Allows studios to enable/disable optional features.
 * When disabled, settings are preserved (grayed out) for easy re-enabling.
 */

// ============================================================================
// FEATURE DEFINITIONS
// ============================================================================

export type FeatureId =
  // Core features (always on, can't be disabled)
  | 'scheduling'
  | 'bookings'
  | 'members'
  | 'payments'

  // Optional features (can be toggled)
  | 'on_demand'           // On-demand video library
  | 'retail'              // Retail/product sales
  | 'campaigns'           // Email/SMS campaigns
  | 'task_management'     // Staff task management
  | 'waitlist'            // Waitlist automation
  | 'check_in_kiosk'      // Self check-in kiosk
  | 'qr_check_in'         // QR code check-in
  | 'notifications_email' // Email notifications
  | 'notifications_sms'   // SMS notifications
  | 'notifications_push'  // Push notifications
  | 'analytics'           // Analytics dashboards
  | 'custom_reports'      // Custom report builder
  | 'import_export'       // Data import/export
  | 'integrations'        // Third-party integrations
  | 'referrals'           // Referral program
  | 'gift_cards'          // Gift cards
  | 'intro_offers'        // Intro offers/trials
  | 'family_plans'        // Family/household memberships
  | 'corporate_accounts'  // Corporate accounts
  | 'tips'                // Tip collection
  | 'commissions'         // Commission tracking
  | 'payroll'             // Payroll management
  | 'lead_scoring'        // Lead scoring
  | 'lifecycle_automation' // Birthday, drip campaigns
  | 'review_automation';  // Review request automation

export interface FeatureDefinition {
  id: FeatureId;
  name: string;
  description: string;
  category: FeatureCategory;
  isCore: boolean;          // Core features can't be disabled
  dependencies?: FeatureId[]; // Features this requires
  defaultEnabled: boolean;
  tier?: 'free' | 'pro' | 'enterprise'; // For future pricing tiers
}

export type FeatureCategory =
  | 'scheduling'
  | 'members'
  | 'payments'
  | 'marketing'
  | 'staff'
  | 'analytics'
  | 'integrations'
  | 'operations';

// Master feature registry
export const FEATURE_DEFINITIONS: Record<FeatureId, FeatureDefinition> = {
  // Core (always on)
  scheduling: {
    id: 'scheduling',
    name: 'Class Scheduling',
    description: 'Manage your class schedule with recurring rules and teacher assignments',
    category: 'scheduling',
    isCore: true,
    defaultEnabled: true,
  },
  bookings: {
    id: 'bookings',
    name: 'Class Bookings',
    description: 'Allow members to book classes online',
    category: 'scheduling',
    isCore: true,
    defaultEnabled: true,
  },
  members: {
    id: 'members',
    name: 'Member Management',
    description: 'Manage member profiles, memberships, and history',
    category: 'members',
    isCore: true,
    defaultEnabled: true,
  },
  payments: {
    id: 'payments',
    name: 'Payment Processing',
    description: 'Accept payments for memberships, class packs, and services',
    category: 'payments',
    isCore: true,
    defaultEnabled: true,
  },

  // Optional features
  on_demand: {
    id: 'on_demand',
    name: 'On-Demand Video',
    description: 'Host and sell on-demand video classes',
    category: 'scheduling',
    isCore: false,
    defaultEnabled: false,
    tier: 'pro',
  },
  retail: {
    id: 'retail',
    name: 'Retail & Products',
    description: 'Sell merchandise and retail products',
    category: 'payments',
    isCore: false,
    defaultEnabled: false,
  },
  campaigns: {
    id: 'campaigns',
    name: 'Email/SMS Campaigns',
    description: 'Send marketing campaigns to members',
    category: 'marketing',
    isCore: false,
    dependencies: ['notifications_email'],
    defaultEnabled: false,
  },
  task_management: {
    id: 'task_management',
    name: 'Task Management',
    description: 'Assign and track staff tasks with Kanban board',
    category: 'staff',
    isCore: false,
    defaultEnabled: false,
  },
  waitlist: {
    id: 'waitlist',
    name: 'Waitlist Automation',
    description: 'Automatically promote members from waitlist when spots open',
    category: 'scheduling',
    isCore: false,
    defaultEnabled: true,
  },
  check_in_kiosk: {
    id: 'check_in_kiosk',
    name: 'Self Check-In Kiosk',
    description: 'Tablet mode for member self check-in',
    category: 'operations',
    isCore: false,
    defaultEnabled: false,
  },
  qr_check_in: {
    id: 'qr_check_in',
    name: 'QR Code Check-In',
    description: 'Members scan QR codes to check in',
    category: 'operations',
    isCore: false,
    defaultEnabled: false,
  },
  notifications_email: {
    id: 'notifications_email',
    name: 'Email Notifications',
    description: 'Send email confirmations and reminders',
    category: 'marketing',
    isCore: false,
    defaultEnabled: true,
  },
  notifications_sms: {
    id: 'notifications_sms',
    name: 'SMS Notifications',
    description: 'Send text message confirmations and reminders',
    category: 'marketing',
    isCore: false,
    defaultEnabled: false,
    tier: 'pro',
  },
  notifications_push: {
    id: 'notifications_push',
    name: 'Push Notifications',
    description: 'Send browser/app push notifications',
    category: 'marketing',
    isCore: false,
    defaultEnabled: false,
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics Dashboards',
    description: 'View member, sales, and financial analytics',
    category: 'analytics',
    isCore: false,
    defaultEnabled: true,
  },
  custom_reports: {
    id: 'custom_reports',
    name: 'Custom Reports',
    description: 'Build and save custom reports',
    category: 'analytics',
    isCore: false,
    dependencies: ['analytics'],
    defaultEnabled: false,
    tier: 'pro',
  },
  import_export: {
    id: 'import_export',
    name: 'Data Import/Export',
    description: 'Import data from other platforms and export your data',
    category: 'integrations',
    isCore: false,
    defaultEnabled: true,
  },
  integrations: {
    id: 'integrations',
    name: 'Third-Party Integrations',
    description: 'Connect to external services like Mailchimp, Zoom, etc.',
    category: 'integrations',
    isCore: false,
    defaultEnabled: false,
    tier: 'pro',
  },
  referrals: {
    id: 'referrals',
    name: 'Referral Program',
    description: 'Reward members for referring friends',
    category: 'marketing',
    isCore: false,
    defaultEnabled: false,
  },
  gift_cards: {
    id: 'gift_cards',
    name: 'Gift Cards',
    description: 'Sell and redeem gift cards',
    category: 'payments',
    isCore: false,
    defaultEnabled: false,
  },
  intro_offers: {
    id: 'intro_offers',
    name: 'Intro Offers',
    description: 'Offer trial classes and first-time discounts',
    category: 'marketing',
    isCore: false,
    defaultEnabled: true,
  },
  family_plans: {
    id: 'family_plans',
    name: 'Family Plans',
    description: 'Offer family/household memberships',
    category: 'members',
    isCore: false,
    defaultEnabled: false,
  },
  corporate_accounts: {
    id: 'corporate_accounts',
    name: 'Corporate Accounts',
    description: 'Manage corporate wellness programs',
    category: 'members',
    isCore: false,
    defaultEnabled: false,
    tier: 'enterprise',
  },
  tips: {
    id: 'tips',
    name: 'Tip Collection',
    description: 'Accept tips for instructors',
    category: 'staff',
    isCore: false,
    defaultEnabled: false,
  },
  commissions: {
    id: 'commissions',
    name: 'Commission Tracking',
    description: 'Track sales commissions for staff',
    category: 'staff',
    isCore: false,
    defaultEnabled: false,
  },
  payroll: {
    id: 'payroll',
    name: 'Payroll Management',
    description: 'Calculate and track instructor payroll',
    category: 'staff',
    isCore: false,
    defaultEnabled: true,
  },
  lead_scoring: {
    id: 'lead_scoring',
    name: 'Lead Scoring',
    description: 'Automatically score and prioritize leads',
    category: 'marketing',
    isCore: false,
    defaultEnabled: false,
    tier: 'pro',
  },
  lifecycle_automation: {
    id: 'lifecycle_automation',
    name: 'Lifecycle Automation',
    description: 'Birthday messages, drip campaigns, win-back sequences',
    category: 'marketing',
    isCore: false,
    dependencies: ['notifications_email'],
    defaultEnabled: false,
    tier: 'pro',
  },
  review_automation: {
    id: 'review_automation',
    name: 'Review Automation',
    description: 'Request reviews automatically after classes',
    category: 'marketing',
    isCore: false,
    dependencies: ['notifications_email'],
    defaultEnabled: false,
  },
};

// ============================================================================
// STUDIO FEATURE STATE
// ============================================================================

export interface StudioFeatureState {
  featureId: FeatureId;
  isEnabled: boolean;
  enabledAt?: Date;
  disabledAt?: Date;
  configuration?: Record<string, unknown>;  // Feature-specific settings (preserved when disabled)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all features in a category
 */
export function getFeaturesByCategory(category: FeatureCategory): FeatureDefinition[] {
  return Object.values(FEATURE_DEFINITIONS).filter(f => f.category === category);
}

/**
 * Get all optional (non-core) features
 */
export function getOptionalFeatures(): FeatureDefinition[] {
  return Object.values(FEATURE_DEFINITIONS).filter(f => !f.isCore);
}

/**
 * Check if a feature can be enabled (dependencies met)
 */
export function canEnableFeature(
  featureId: FeatureId,
  enabledFeatures: Set<FeatureId>
): { canEnable: boolean; missingDependencies: FeatureId[] } {
  const definition = FEATURE_DEFINITIONS[featureId];
  if (!definition.dependencies || definition.dependencies.length === 0) {
    return { canEnable: true, missingDependencies: [] };
  }

  const missingDependencies = definition.dependencies.filter(dep => !enabledFeatures.has(dep));
  return {
    canEnable: missingDependencies.length === 0,
    missingDependencies,
  };
}

/**
 * Get features that depend on a given feature
 */
export function getDependentFeatures(featureId: FeatureId): FeatureDefinition[] {
  return Object.values(FEATURE_DEFINITIONS).filter(
    f => f.dependencies?.includes(featureId)
  );
}

// ============================================================================
// FEATURE CATEGORIES UI
// ============================================================================

export const FEATURE_CATEGORY_INFO: Record<FeatureCategory, { name: string; description: string; icon: string }> = {
  scheduling: {
    name: 'Scheduling',
    description: 'Class scheduling, bookings, and attendance',
    icon: 'calendar',
  },
  members: {
    name: 'Members',
    description: 'Member management and membership types',
    icon: 'users',
  },
  payments: {
    name: 'Payments & Sales',
    description: 'Payment processing, retail, and billing',
    icon: 'credit-card',
  },
  marketing: {
    name: 'Marketing',
    description: 'Campaigns, referrals, and engagement',
    icon: 'megaphone',
  },
  staff: {
    name: 'Staff',
    description: 'Staff management, payroll, and tasks',
    icon: 'briefcase',
  },
  analytics: {
    name: 'Analytics',
    description: 'Reports and business intelligence',
    icon: 'bar-chart',
  },
  integrations: {
    name: 'Integrations',
    description: 'Third-party connections and data import/export',
    icon: 'plug',
  },
  operations: {
    name: 'Operations',
    description: 'Check-in, kiosks, and daily operations',
    icon: 'settings',
  },
};
