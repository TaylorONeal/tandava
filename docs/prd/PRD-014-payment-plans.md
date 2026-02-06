# PRD-014: Payment Plans & Universal Payment Abstraction

## Overview
**Phase:** 8
**Priority:** P0
**Status:** Planned
**Owner:** TBD
**Dependencies:** Core membership and transaction system

---

## Design Philosophy

### Provider-Agnostic Architecture

Tandava treats payment processing as an **abstracted capability**, not a specific vendor integration. The system defines:

1. **Universal data shapes** - Standard types for payments, subscriptions, refunds
2. **Provider interface** - What any payment provider must implement
3. **Adapter pattern** - Provider-specific adapters that conform to the interface

This enables:
- **Stripe** for direct card processing
- **Shopify Payments** for studios using Shopify ecosystem
- **App Store / Google Play** for mobile app subscriptions
- **Square** for in-person POS
- **PayPal** for alternative payment methods
- **Buy Now Pay Later (BNPL):**
  - **Affirm** — US-focused, 0% financing options
  - **Klarna** — Europe/US, pay in 4 or monthly
  - **Afterpay** — Australia/US, pay in 4
  - **Sezzle** — Pay in 4, no interest
  - **Amazon Pay** — With Affirm integration
  - **Zip** (formerly Quadpay) — Pay in 4
- **Custom providers** for regional payment systems

---

## Jobs to Be Done

### Job 1: Offer Flexible Payment Options
**When** selling high-ticket items (teacher trainings, retreats, annual memberships),
**I want to** offer payment plans that split the cost over time,
**So I can** make expensive offerings accessible without discounting.

### Job 2: Abstract Payment Provider
**When** integrating payment processing,
**I want to** use a provider-agnostic interface,
**So I can** switch or add payment providers without rewriting business logic.

### Job 3: Handle Failed Payments Gracefully
**When** a payment fails (card expired, insufficient funds),
**I want** automatic retry with intelligent timing,
**So I can** recover revenue without manual intervention.

### Job 4: Support Multiple Payment Methods
**When** a student wants to pay,
**I want** to accept cards, ACH/bank transfer, and digital wallets,
**So I can** accommodate different preferences and reduce friction.

### Job 5: Reconcile Across Providers
**When** using multiple payment providers,
**I want** unified reporting and reconciliation,
**So I can** manage finances without juggling multiple dashboards.

---

## User Stories

### US-14.1: Payment Plan Creation
**As a** studio owner,
**I want** to create payment plans for expensive offerings,
**So that** students can pay over time.

**Acceptance Criteria:**
- [ ] Define plan: total amount, number of installments, frequency
- [ ] Down payment option (e.g., 25% now, rest in 3 monthly payments)
- [ ] Attach plans to specific offerings (trainings, retreats, memberships)
- [ ] Show total cost vs. single payment (optional discount for full payment)
- [ ] Preview payment schedule before purchase

### US-14.2: Universal Payment Interface
**As a** developer,
**I want** a provider-agnostic payment interface,
**So that** business logic doesn't depend on specific providers.

**Acceptance Criteria:**
- [ ] `PaymentProvider` interface with standard methods
- [ ] Adapter implementations for each provider
- [ ] Configuration-based provider selection
- [ ] Unified webhook handling
- [ ] Consistent error types across providers

### US-14.3: Automatic Retry Logic
**As a** studio owner,
**I want** failed payments to automatically retry,
**So that** I recover revenue without manual follow-up.

**Acceptance Criteria:**
- [ ] Configurable retry schedule (e.g., 3 days, 5 days, 7 days)
- [ ] Smart timing (avoid weekends, try different times)
- [ ] Student notification before each retry
- [ ] Escalation after final failure (staff alert, membership pause)
- [ ] Easy manual retry trigger
- [ ] Track recovery rate

### US-14.4: ACH / Bank Transfer Support
**As a** studio owner,
**I want** to accept bank transfers for subscriptions,
**So that** I can reduce processing fees for recurring payments.

**Acceptance Criteria:**
- [ ] Bank account verification flow
- [ ] ACH for recurring (memberships)
- [ ] Clear timeline expectations (ACH takes 3-5 days)
- [ ] Fallback to card if ACH fails
- [ ] Proper handling of ACH-specific failures

### US-14.5: Multi-Provider Configuration
**As a** studio owner,
**I want** to configure multiple payment providers,
**So that** I can use different providers for different use cases.

**Acceptance Criteria:**
- [ ] Primary provider for online payments
- [ ] POS provider for in-studio
- [ ] Mobile provider for app purchases
- [ ] Routing rules based on context
- [ ] Unified transaction history

### US-14.6: Subscription Management
**As a** student,
**I want** to manage my payment methods and view upcoming payments,
**So that** I can keep my account in good standing.

**Acceptance Criteria:**
- [ ] Add/remove payment methods
- [ ] Set default payment method
- [ ] View upcoming payments and dates
- [ ] View payment history
- [ ] Update card before expiration

### US-14.7: Buy Now Pay Later (BNPL) Support
**As a** studio owner,
**I want** to offer BNPL options (Affirm, Klarna, Afterpay),
**So that** students can pay in installments without me managing the risk.

**Acceptance Criteria:**
- [ ] Enable/disable BNPL providers per studio
- [ ] Configure minimum purchase amount for BNPL
- [ ] BNPL option shown at checkout for eligible purchases
- [ ] Provider handles credit check and approval
- [ ] Studio receives full payment immediately (minus fees)
- [ ] Clear display of BNPL terms to student
- [ ] Proper handling of BNPL-specific refunds

**BNPL Provider Integration:**
| Provider | Pay in 4 | Monthly Plans | Regions | Min Cart |
|----------|----------|---------------|---------|----------|
| Affirm | ✓ | 3-36 months | US, CA | $50 |
| Klarna | ✓ | 6-36 months | US, EU, UK, AU | $35 |
| Afterpay | ✓ | - | US, AU, UK, NZ | $35 |
| Sezzle | ✓ | - | US, CA | $35 |
| Zip | ✓ | - | US, AU, UK | $35 |

**BNPL Benefits:**
- **For Studios:** Get paid in full upfront, BNPL provider assumes risk
- **For Students:** Split payments without affecting studio relationship
- **Conversion lift:** 20-30% increase in high-ticket conversions

---

## Universal Payment Types

### Core Interfaces

```typescript
// ============================================================================
// UNIVERSAL PAYMENT TYPES
// These types are provider-agnostic and used throughout the application
// ============================================================================

/**
 * Supported payment providers
 * Each provider has an adapter implementing PaymentProvider interface
 */
type PaymentProviderType =
  | 'stripe'
  | 'square'
  | 'shopify'
  | 'paypal'
  | 'apple_pay'
  | 'google_pay'
  | 'ach'
  // BNPL Providers
  | 'affirm'
  | 'klarna'
  | 'afterpay'
  | 'sezzle'
  | 'zip'
  // App Store
  | 'apple_iap'    // Apple In-App Purchase
  | 'google_play'  // Google Play Billing
  // Other
  | 'amazon_pay'
  | 'manual'  // Cash, check, comp
  | 'custom';

/**
 * Payment method types supported across providers
 */
type PaymentMethodType =
  | 'card'           // Credit/debit card
  | 'bank_account'   // ACH, direct debit
  | 'digital_wallet' // Apple Pay, Google Pay
  | 'bnpl'           // Buy now pay later
  | 'manual'         // Cash, check, comp
  | 'credit_balance'; // Studio credit

/**
 * Universal payment method representation
 */
interface UniversalPaymentMethod {
  id: string;
  type: PaymentMethodType;
  provider: PaymentProviderType;

  // Display info
  displayName: string;      // "Visa •••• 4242"
  brand?: string;           // "visa", "mastercard", "amex"
  last4?: string;           // "4242"
  expiryMonth?: number;
  expiryYear?: number;

  // For bank accounts
  bankName?: string;
  accountType?: 'checking' | 'savings';

  // Metadata
  isDefault: boolean;
  isExpired: boolean;
  billingAddress?: Address;

  // Provider reference (opaque to business logic)
  providerRef: string;      // Provider's ID for this method

  // BNPL-specific (when type === 'bnpl')
  bnplProvider?: BnplProviderType;
  bnplPlan?: BnplPlanDetails;
}

/**
 * BNPL Provider types
 */
type BnplProviderType =
  | 'affirm'
  | 'klarna'
  | 'afterpay'
  | 'sezzle'
  | 'zip';

/**
 * BNPL Plan details (provided by BNPL provider)
 */
interface BnplPlanDetails {
  planType: 'pay_in_4' | 'monthly';
  installmentCount: number;
  installmentAmountCents: number;
  apr: number;              // 0 for pay-in-4, varies for monthly
  totalAmountCents: number; // May include interest for monthly plans
  firstPaymentCents: number;
  firstPaymentDate: Date;
  lastPaymentDate: Date;
}

/**
 * BNPL checkout session (for initiating BNPL payment)
 */
interface BnplCheckoutSession {
  id: string;
  provider: BnplProviderType;

  // What they're buying
  orderAmountCents: number;
  currency: string;
  description: string;
  items: BnplLineItem[];

  // Where to redirect
  redirectUrl: string;      // URL for BNPL provider's checkout
  confirmUrl: string;       // Where to return on success
  cancelUrl: string;        // Where to return on cancel

  // Status
  status: 'pending' | 'approved' | 'declined' | 'expired';
  expiresAt: Date;

  // Approved plan (set after customer chooses)
  approvedPlan?: BnplPlanDetails;
}

interface BnplLineItem {
  name: string;
  sku?: string;
  quantity: number;
  unitPriceCents: number;
  category?: string;        // Helps with approval rates
  imageUrl?: string;
}

/**
 * Universal charge/payment representation
 */
interface UniversalPayment {
  id: string;
  provider: PaymentProviderType;
  providerRef: string;      // Provider's transaction ID

  // Amount
  amountCents: number;
  currency: string;         // "USD"

  // Status
  status: PaymentStatus;
  statusReason?: string;

  // Method used
  paymentMethodId: string;
  paymentMethodSnapshot: UniversalPaymentMethod;

  // Timing
  createdAt: Date;
  processedAt?: Date;

  // For refunds
  refundedAmountCents: number;
  refunds: UniversalRefund[];

  // Metadata
  metadata: Record<string, unknown>;
}

type PaymentStatus =
  | 'pending'           // Awaiting processing
  | 'processing'        // Being processed
  | 'succeeded'         // Completed successfully
  | 'failed'            // Failed, may retry
  | 'cancelled'         // Cancelled before processing
  | 'refunded'          // Fully refunded
  | 'partially_refunded'// Partially refunded
  | 'disputed';         // Chargeback/dispute opened

/**
 * Universal refund representation
 */
interface UniversalRefund {
  id: string;
  paymentId: string;
  provider: PaymentProviderType;
  providerRef: string;

  amountCents: number;
  reason: RefundReason;
  notes?: string;

  status: RefundStatus;
  createdAt: Date;
  processedAt?: Date;
}

type RefundReason =
  | 'customer_request'
  | 'duplicate'
  | 'fraudulent'
  | 'product_issue'
  | 'other';

type RefundStatus =
  | 'pending'
  | 'succeeded'
  | 'failed';

/**
 * Universal subscription representation
 */
interface UniversalSubscription {
  id: string;
  provider: PaymentProviderType;
  providerRef: string;

  // Plan details
  planId: string;
  planName: string;
  amountCents: number;
  currency: string;
  interval: SubscriptionInterval;
  intervalCount: number;   // e.g., 1 for monthly, 3 for quarterly

  // Status
  status: SubscriptionStatus;

  // Payment method
  paymentMethodId: string;

  // Billing cycle
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate?: Date;

  // Trial
  trialEnd?: Date;

  // Cancellation
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;

  // Metadata
  metadata: Record<string, unknown>;
}

type SubscriptionInterval = 'day' | 'week' | 'month' | 'year';

type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'cancelled'
  | 'paused'
  | 'trialing';

/**
 * Payment plan for installment payments
 */
interface PaymentPlan {
  id: string;
  name: string;

  // Total amount
  totalAmountCents: number;
  currency: string;

  // Installments
  installmentCount: number;
  interval: SubscriptionInterval;
  intervalCount: number;

  // Down payment
  downPaymentCents: number;
  downPaymentPercent: number;

  // Per-installment amount (calculated)
  installmentAmountCents: number;

  // Applicable to
  applicableOfferingTypes: string[];  // 'membership', 'training', 'retreat'
  applicableOfferingIds?: string[];   // Specific offerings

  // Status
  isActive: boolean;
}

/**
 * Payment plan enrollment (student on a plan)
 */
interface PaymentPlanEnrollment {
  id: string;
  planId: string;
  profileId: string;

  // What they're paying for
  offeringType: string;
  offeringId: string;

  // Payment tracking
  totalAmountCents: number;
  paidAmountCents: number;
  remainingAmountCents: number;

  // Installments
  installments: PaymentPlanInstallment[];

  // Status
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';

  // Dates
  startedAt: Date;
  completedAt?: Date;
}

interface PaymentPlanInstallment {
  id: string;
  enrollmentId: string;

  sequenceNumber: number;  // 1, 2, 3...
  amountCents: number;
  dueDate: Date;

  // Payment
  paymentId?: string;
  status: 'pending' | 'paid' | 'failed' | 'waived';
  paidAt?: Date;

  // Retry tracking
  attemptCount: number;
  lastAttemptAt?: Date;
  nextAttemptAt?: Date;
}
```

### Provider Interface

```typescript
/**
 * Interface that all payment providers must implement
 */
interface PaymentProvider {
  readonly providerType: PaymentProviderType;

  // ============================================================================
  // PAYMENT METHODS
  // ============================================================================

  /**
   * Create a setup intent for adding a new payment method
   */
  createSetupIntent(params: {
    customerId: string;
    paymentMethodTypes?: PaymentMethodType[];
    metadata?: Record<string, string>;
  }): Promise<{ clientSecret: string; setupIntentId: string }>;

  /**
   * Attach a payment method to a customer
   */
  attachPaymentMethod(params: {
    customerId: string;
    paymentMethodToken: string;  // From client-side
    setAsDefault?: boolean;
  }): Promise<UniversalPaymentMethod>;

  /**
   * List payment methods for a customer
   */
  listPaymentMethods(customerId: string): Promise<UniversalPaymentMethod[]>;

  /**
   * Remove a payment method
   */
  removePaymentMethod(paymentMethodId: string): Promise<void>;

  // ============================================================================
  // CHARGES
  // ============================================================================

  /**
   * Create a one-time charge
   */
  createCharge(params: {
    customerId: string;
    amountCents: number;
    currency: string;
    paymentMethodId: string;
    description?: string;
    metadata?: Record<string, string>;
    idempotencyKey?: string;
  }): Promise<UniversalPayment>;

  /**
   * Refund a charge (full or partial)
   */
  refundCharge(params: {
    paymentId: string;
    amountCents?: number;  // Undefined = full refund
    reason: RefundReason;
    notes?: string;
  }): Promise<UniversalRefund>;

  // ============================================================================
  // SUBSCRIPTIONS
  // ============================================================================

  /**
   * Create a subscription
   */
  createSubscription(params: {
    customerId: string;
    planId: string;
    paymentMethodId: string;
    trialDays?: number;
    metadata?: Record<string, string>;
  }): Promise<UniversalSubscription>;

  /**
   * Update subscription (change plan, payment method)
   */
  updateSubscription(params: {
    subscriptionId: string;
    planId?: string;
    paymentMethodId?: string;
  }): Promise<UniversalSubscription>;

  /**
   * Cancel subscription
   */
  cancelSubscription(params: {
    subscriptionId: string;
    cancelImmediately?: boolean;  // false = cancel at period end
  }): Promise<UniversalSubscription>;

  /**
   * Pause subscription (if supported)
   */
  pauseSubscription?(params: {
    subscriptionId: string;
    resumeDate?: Date;
  }): Promise<UniversalSubscription>;

  // ============================================================================
  // CUSTOMERS
  // ============================================================================

  /**
   * Create or get customer in provider's system
   */
  ensureCustomer(params: {
    internalId: string;  // Tandava profile ID
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<{ customerId: string; isNew: boolean }>;

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  /**
   * Verify and parse incoming webhook
   */
  parseWebhook(params: {
    body: string | Buffer;
    signature: string;
  }): Promise<UniversalWebhookEvent>;
}

/**
 * Standardized webhook event
 */
interface UniversalWebhookEvent {
  id: string;
  type: WebhookEventType;
  provider: PaymentProviderType;

  // The affected object (payment, subscription, etc.)
  objectType: 'payment' | 'subscription' | 'refund' | 'dispute' | 'payment_method';
  objectId: string;
  object: unknown;  // Provider-specific, but we map to universal types

  // Timing
  createdAt: Date;
}

type WebhookEventType =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.refunded'
  | 'payment.disputed'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'subscription.past_due'
  | 'payment_method.attached'
  | 'payment_method.detached'
  | 'payment_method.updated';
```

---

## Database Schema

```sql
-- ============================================================================
-- PAYMENT PROVIDER CONFIGURATION
-- ============================================================================

CREATE TABLE payment_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  provider_type TEXT NOT NULL,  -- 'stripe', 'square', 'shopify'

  -- Display
  display_name TEXT,
  is_enabled BOOLEAN DEFAULT true,

  -- Credentials (encrypted)
  credentials_encrypted TEXT,

  -- Settings
  settings JSONB DEFAULT '{}',
  /* Example:
  {
    "webhook_signing_secret": "...",
    "default_currency": "USD",
    "statement_descriptor": "OXATL YOGA"
  }
  */

  -- Routing
  use_for_online BOOLEAN DEFAULT true,
  use_for_pos BOOLEAN DEFAULT false,
  use_for_subscriptions BOOLEAN DEFAULT true,

  -- Provider-specific IDs
  provider_account_id TEXT,  -- Connected account ID

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, provider_type)
);

-- ============================================================================
-- CUSTOMER MAPPING (Tandava profile -> Provider customer)
-- ============================================================================

CREATE TABLE payment_customer_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  provider_type TEXT NOT NULL,
  provider_customer_id TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, profile_id, provider_type),
  UNIQUE(provider_type, provider_customer_id)
);

-- ============================================================================
-- UNIVERSAL PAYMENT METHODS
-- ============================================================================

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Type
  method_type TEXT NOT NULL,  -- 'card', 'bank_account', 'digital_wallet'
  provider_type TEXT NOT NULL,
  provider_ref TEXT NOT NULL,  -- Provider's ID

  -- Display info
  display_name TEXT NOT NULL,
  brand TEXT,
  last4 TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  bank_name TEXT,

  -- Status
  is_default BOOLEAN DEFAULT false,
  is_expired BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT true,  -- For ACH

  -- Metadata
  billing_address JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(provider_type, provider_ref)
);

-- ============================================================================
-- PAYMENT PLANS
-- ============================================================================

CREATE TABLE payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Amount
  total_amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Installments
  installment_count INTEGER NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('day', 'week', 'month', 'year')),
  interval_count INTEGER DEFAULT 1,

  -- Down payment
  down_payment_cents INTEGER DEFAULT 0,
  down_payment_percent INTEGER DEFAULT 0,

  -- Calculated
  installment_amount_cents INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN installment_count > 0 THEN
        (total_amount_cents - down_payment_cents) / installment_count
      ELSE 0
    END
  ) STORED,

  -- Applicability
  applicable_offering_types TEXT[] DEFAULT '{}',
  applicable_offering_ids UUID[] DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PAYMENT PLAN ENROLLMENTS
-- ============================================================================

CREATE TABLE payment_plan_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES payment_plans(id),
  profile_id UUID NOT NULL REFERENCES profiles(id),

  -- What they're paying for
  offering_type TEXT NOT NULL,
  offering_id UUID NOT NULL,

  -- Payment method to charge
  payment_method_id UUID REFERENCES payment_methods(id),

  -- Totals
  total_amount_cents INTEGER NOT NULL,
  paid_amount_cents INTEGER DEFAULT 0,
  remaining_amount_cents INTEGER GENERATED ALWAYS AS (
    total_amount_cents - paid_amount_cents
  ) STORED,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'completed', 'defaulted', 'cancelled'
  )),

  -- Dates
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INSTALLMENTS
-- ============================================================================

CREATE TABLE payment_plan_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES payment_plan_enrollments(id) ON DELETE CASCADE,

  sequence_number INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  due_date DATE NOT NULL,

  -- Payment
  transaction_id UUID REFERENCES transactions(id),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'paid', 'failed', 'waived'
  )),
  paid_at TIMESTAMPTZ,

  -- Retry tracking
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ,
  last_error TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(enrollment_id, sequence_number)
);

-- ============================================================================
-- RETRY CONFIGURATION
-- ============================================================================

CREATE TABLE payment_retry_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Retry schedule (days after failure)
  retry_schedule INTEGER[] DEFAULT '{3, 5, 7}',
  max_attempts INTEGER DEFAULT 4,

  -- Smart retry (avoid weekends, try different times)
  smart_timing_enabled BOOLEAN DEFAULT true,
  preferred_hours INTEGER[] DEFAULT '{9, 14, 18}',  -- Try at these hours

  -- Notifications
  notify_before_retry BOOLEAN DEFAULT true,
  notify_hours_before INTEGER DEFAULT 24,

  -- Escalation
  escalate_after_final_failure BOOLEAN DEFAULT true,
  escalation_action TEXT DEFAULT 'pause_membership',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id)
);

-- ============================================================================
-- FAILED PAYMENT QUEUE
-- ============================================================================

CREATE TABLE payment_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- What failed
  source_type TEXT NOT NULL,  -- 'subscription', 'installment', 'one_time'
  source_id UUID NOT NULL,    -- ID of the thing that failed

  -- Payment details
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method_id UUID REFERENCES payment_methods(id),
  profile_id UUID NOT NULL REFERENCES profiles(id),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'scheduled', 'processing', 'recovered', 'exhausted', 'cancelled'
  )),

  -- Attempts
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER NOT NULL,
  last_attempt_at TIMESTAMPTZ,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ,

  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolution TEXT,  -- 'recovered', 'exhausted', 'manual', 'cancelled'
  successful_transaction_id UUID REFERENCES transactions(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_retry_queue_next_attempt ON payment_retry_queue(next_attempt_at)
  WHERE status IN ('pending', 'scheduled');

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_payment_methods_profile ON payment_methods(profile_id, is_default DESC);
CREATE INDEX idx_plan_enrollments_profile ON payment_plan_enrollments(profile_id, status);
CREATE INDEX idx_plan_enrollments_active ON payment_plan_enrollments(status)
  WHERE status = 'active';
CREATE INDEX idx_installments_due ON payment_plan_installments(due_date, status)
  WHERE status = 'pending';
```

---

## API Endpoints

```
# Provider Config (Admin)
GET    /api/manage/payment-providers         # List configured providers
POST   /api/manage/payment-providers         # Add provider
PUT    /api/manage/payment-providers/:type   # Update provider config
DELETE /api/manage/payment-providers/:type   # Remove provider

# Payment Plans (Admin)
GET    /api/manage/payment-plans             # List plans
POST   /api/manage/payment-plans             # Create plan
PUT    /api/manage/payment-plans/:id         # Update plan
DELETE /api/manage/payment-plans/:id         # Deactivate plan

# Plan Enrollments (Admin)
GET    /api/manage/payment-plan-enrollments  # List enrollments
GET    /api/manage/payment-plan-enrollments/:id  # Enrollment detail
POST   /api/manage/payment-plan-enrollments/:id/waive  # Waive installment

# Retry Queue (Admin)
GET    /api/manage/payment-retries           # View retry queue
POST   /api/manage/payment-retries/:id/retry # Manual retry
POST   /api/manage/payment-retries/:id/cancel # Cancel retry

# Retry Settings (Admin)
GET    /api/manage/payment-retry-settings    # Get settings
PUT    /api/manage/payment-retry-settings    # Update settings

# Payment Methods (Student)
GET    /api/me/payment-methods               # My payment methods
POST   /api/me/payment-methods/setup         # Start adding method
POST   /api/me/payment-methods               # Attach method
PUT    /api/me/payment-methods/:id/default   # Set default
DELETE /api/me/payment-methods/:id           # Remove method

# Upcoming Payments (Student)
GET    /api/me/upcoming-payments             # View upcoming charges

# Checkout (with payment plan option)
POST   /api/checkout                         # Standard checkout
POST   /api/checkout/payment-plan            # Checkout with payment plan

# Webhooks (one endpoint, routes by provider)
POST   /api/webhooks/payments/:provider      # Handle webhook
```

---

## UI Routes

```
# Admin
/manage/settings/payments            # Payment provider config
/manage/settings/payment-plans       # Payment plan management
/manage/settings/payment-retries     # Retry settings

/manage/financials/retries           # Failed payment queue
/manage/financials/installments      # Active installment plans

# Student
/account/payment-methods             # Manage payment methods
/account/payments                    # Payment history
/account/upcoming-payments           # Upcoming charges

# Checkout
/checkout/:offeringType/:id          # Standard checkout
/checkout/:offeringType/:id/plan     # Payment plan selection
```

---

## Rollout Plan

### Phase A: Universal Types & Interface (Week 1)
1. Define TypeScript interfaces
2. Create database schema
3. Build Stripe adapter (reference implementation)

### Phase B: Payment Methods (Week 2)
1. Add/remove payment methods UI
2. Card update flow
3. Default selection

### Phase C: Payment Plans (Week 3-4)
1. Plan creation UI
2. Checkout with plan selection
3. Installment tracking
4. Automated charging

### Phase D: Retry Logic (Week 5)
1. Failed payment queue
2. Retry scheduler
3. Student notifications
4. Admin dashboard

### Phase E: Additional Providers (Future)
1. Square adapter
2. PayPal adapter
3. ACH support

---

## Open Questions

1. **Proration:** How do we handle mid-cycle plan changes?
2. **Currency support:** Multi-currency per studio or single currency?
3. **Chargebacks:** How much chargeback handling to automate?
4. **PCI compliance:** What level of card data can we store?
5. **Offline payments:** How to reconcile cash/check with payment plans?

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-02-06 | 1.0 | Claude | Initial PRD with universal abstraction |
