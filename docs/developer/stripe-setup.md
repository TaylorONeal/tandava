# Stripe Setup Guide (Developer)

## Architecture Overview

Tandava uses **Stripe Connect (Standard)** for payments:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Member     │────▶│  Tandava App │────▶│  Stripe Checkout │
│  (browser)   │     │  (frontend)  │     │  (hosted page)   │
└─────────────┘     └──────┬───────┘     └────────┬────────┘
                           │                       │
                    Supabase Edge Function   Stripe webhook
                           │                       │
                    ┌──────▼───────┐     ┌────────▼────────┐
                    │   Supabase   │◀────│  stripe-webhook  │
                    │  (database)  │     │  (Edge Function) │
                    └──────────────┘     └─────────────────┘
```

- **Frontend** (`src/lib/stripe.ts`): Loads Stripe.js, calls Edge Functions for checkout/portal URLs
- **Edge Functions**: Create Stripe Checkout Sessions, Customer Portal sessions, handle webhooks
- **Stripe Connect**: Each studio links their own Stripe account — the platform never holds funds

## Setup Steps

### 1. Create a Stripe Account

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Create an account (or use existing)
3. Start in **test mode** (toggle in top-right)

### 2. Get API Keys

1. Go to **Developers → API keys**
2. Copy the **Publishable key** (`pk_test_...`)
3. Copy the **Secret key** (`sk_test_...`)

### 3. Configure Environment

Frontend (in `.env`):
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51abc...
```

Backend (Supabase secrets):
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_51abc...
```

### 4. Set Up Webhooks

1. Go to **Developers → Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. URL: `https://<your-supabase-ref>.supabase.co/functions/v1/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (`whsec_...`)

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5. Deploy the Webhook Function

```bash
supabase functions deploy stripe-webhook
```

### 6. Enable Stripe Connect (for multi-studio)

1. Go to **Connect → Settings** in Stripe Dashboard
2. Enable **Standard accounts**
3. Configure the OAuth redirect URL to your app

### 7. Test with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhook events to local function
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

## Payment Models

### Drop-in (One-time)
- Single class purchase via Stripe Checkout
- Metadata includes `booking_id` for confirmation
- Webhook creates/confirms the booking record

### Membership (Subscription)
- Recurring monthly/annual via Stripe Checkout (subscription mode)
- Webhook creates membership record with Stripe subscription ID
- Subscription updates sync status automatically

### Class Pack (One-time with credits)
- Fixed number of classes purchased one-time
- Tracked in `memberships` table with `classes_remaining` count
- Decremented when booking a class

## Webhook Event Flow

```
checkout.session.completed
  ├── type=drop_in     → update booking to "confirmed"
  ├── type=membership  → upsert membership record
  └── type=class_pack  → insert membership with classes_remaining

customer.subscription.updated
  └── sync status (active/past_due/cancelled/trialing/paused)

customer.subscription.deleted
  └── mark membership as "cancelled"

invoice.payment_failed
  └── mark membership as "past_due"
```

## Testing

Use Stripe's test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`
- **Insufficient funds**: `4000 0000 0000 9995`

Any future date for expiry, any 3 digits for CVC.

## Customer Portal

Members can manage their billing via Stripe's hosted Customer Portal:
- View/update payment methods
- View invoice history
- Cancel or change subscription
- Download receipts

The portal is opened via `openCustomerPortal(studioId)` in `src/lib/stripe.ts`.

## Going Live

1. Complete Stripe account activation
2. Switch to live API keys (`pk_live_...`, `sk_live_...`)
3. Update webhook endpoint to use live signing secret
4. Test a real transaction with a small amount
5. Update `.env` on your production deployment
