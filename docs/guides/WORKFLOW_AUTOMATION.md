# Workflow Automation Guide

Connect Tandava to your favorite automation tools to streamline operations.

---

## Overview

Tandava emits events when important things happen in your studio. You can use these events to:

- Automatically add new members to your email marketing platform
- Send Slack notifications when classes are cancelled
- Sync sales data to Google Sheets in real-time
- Trigger SMS reminders through Twilio
- Update your CRM when memberships change

---

## Supported Platforms

| Platform | Integration Type | Setup Difficulty |
|----------|------------------|------------------|
| **Zapier** | Native trigger app | Easy |
| **Make (Integromat)** | Webhook module | Easy |
| **n8n** | Webhook node | Moderate |
| **Custom** | Direct webhook | Advanced |

---

## Event Catalog

### Sales & Payments

| Event | Trigger | Key Data |
|-------|---------|----------|
| `sale.created` | Transaction completed | transaction_id, member, products, total, payment_method |
| `sale.refunded` | Refund processed | refund_id, original_transaction, amount, reason |
| `payout.received` | Stripe payout deposited | payout_id, amount, deposit_date, transactions |

### Memberships

| Event | Trigger | Key Data |
|-------|---------|----------|
| `membership.created` | New membership starts | member, membership_type, start_date, price |
| `membership.renewed` | Auto-renewal processed | member, membership_type, renewal_date |
| `membership.cancelled` | Membership cancelled | member, membership_type, end_date, reason |
| `membership.paused` | Membership paused | member, pause_start, pause_end |
| `membership.expiring` | Membership expires in 7 days | member, membership_type, expiration_date |

### Bookings & Attendance

| Event | Trigger | Key Data |
|-------|---------|----------|
| `booking.created` | Class booked | member, class, booking_time |
| `booking.cancelled` | Booking cancelled | member, class, cancellation_reason |
| `checkin.completed` | Member checked in | member, class, checkin_time |
| `class.cancelled` | Class cancelled by studio | class, reason, affected_bookings |

### Members

| Event | Trigger | Key Data |
|-------|---------|----------|
| `member.created` | New account created | member_id, email, first_name, source |
| `member.first_class` | Completed first class | member, class, date |
| `member.milestone` | 10th, 50th, 100th class | member, milestone_count, date |

### Staff

| Event | Trigger | Key Data |
|-------|---------|----------|
| `payroll.finalized` | Pay period closed | period_start, period_end, teacher_summaries |
| `sub.requested` | Teacher needs sub | class, original_teacher, date |

---

## Setting Up Webhooks

### Step 1: Create Webhook in Tandava

1. Go to **Settings → Integrations → Webhooks**
2. Click **Add Webhook**
3. Enter your endpoint URL
4. Select events to subscribe to
5. Copy the generated signing secret
6. Click **Save**

### Step 2: Verify Webhook Signatures

All webhook payloads include a signature header for security:

```
X-Tandava-Signature: sha256=abc123...
```

Verify the signature in your endpoint:

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return `sha256=${expected}` === signature;
}

// In your webhook handler:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-tandava-signature'];
  const isValid = verifySignature(
    JSON.stringify(req.body),
    signature,
    process.env.TANDAVA_WEBHOOK_SECRET
  );

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // Process event...
  res.status(200).send('OK');
});
```

### Step 3: Handle Retry Logic

Tandava retries failed deliveries:
- 3 attempts total
- Exponential backoff: 1 min, 5 min, 30 min
- Events older than 24 hours are not retried

Your endpoint should:
- Return 2xx status for success
- Return 4xx for permanent failures (don't retry)
- Return 5xx for temporary failures (will retry)

---

## Zapier Integration

### Using Tandava with Zapier

1. **In Zapier:** Create a new Zap
2. **Search for:** "Webhooks by Zapier" → "Catch Hook"
3. **Copy** the webhook URL Zapier provides
4. **In Tandava:** Add webhook with Zapier URL
5. **Test:** Trigger the event (e.g., create a test booking)
6. **In Zapier:** Test trigger and continue building your Zap

### Popular Zap Templates

#### New Member → Mailchimp
```
Trigger: member.created
Action: Add subscriber to Mailchimp list
Mapping:
  - Email → req.body.data.member.email
  - First Name → req.body.data.member.first_name
  - Tags → ["new_student", req.body.data.source]
```

#### Sale → Google Sheets
```
Trigger: sale.created
Action: Create row in Google Sheets
Mapping:
  - Date → req.body.data.created_at
  - Member → req.body.data.member.name
  - Product → req.body.data.line_items[0].name
  - Amount → req.body.data.total_cents / 100
```

#### Class Cancelled → Slack
```
Trigger: class.cancelled
Action: Post to Slack channel
Message: "⚠️ Class cancelled: {{class.name}} on {{class.date}} at {{class.time}}. Reason: {{reason}}. {{affected_count}} students notified."
```

#### Membership Expiring → Email
```
Trigger: membership.expiring
Action: Send email via Gmail/Sendgrid
To: member.email
Subject: "Your membership expires in 7 days"
Body: Personal renewal reminder
```

---

## Make (Integromat) Integration

### Setup

1. Create new scenario in Make
2. Add "Webhooks" → "Custom webhook" module
3. Copy webhook URL
4. Add to Tandava webhook settings
5. Click "Run once" and trigger test event
6. Map data to subsequent modules

### Example: Sync Sales to QuickBooks

```
Webhook (sale.created)
  ↓
Router
  ├── If product_type = "membership" → QuickBooks: Create Invoice
  ├── If product_type = "retail" → QuickBooks: Create Sales Receipt
  └── All → Google Sheets: Log Transaction
```

---

## n8n Integration

### Self-Hosted Webhook Setup

```javascript
// n8n Webhook node configuration
{
  "httpMethod": "POST",
  "path": "tandava-webhook",
  "responseMode": "onReceived",
  "responseData": "allEntries"
}
```

### Example: Member Onboarding Workflow

```
Webhook: member.created
  ↓
IF: source = "intro_offer"
  ├── Yes →
  │   ├── SendGrid: Welcome email series
  │   ├── Wait 3 days
  │   └── SendGrid: "How was your first class?"
  └── No →
      └── SendGrid: Standard welcome email
```

---

## Event Payload Reference

### sale.created

```json
{
  "id": "evt_abc123",
  "type": "sale.created",
  "created_at": "2026-02-01T14:30:00Z",
  "data": {
    "transaction_id": "txn_xyz789",
    "member": {
      "id": "mem_456",
      "email": "sarah@example.com",
      "first_name": "Sarah",
      "last_name": "Chen"
    },
    "location": {
      "id": "loc_def",
      "name": "SOMA"
    },
    "line_items": [
      {
        "product_id": "prod_uvw",
        "product_type": "membership",
        "name": "Unlimited Monthly",
        "quantity": 1,
        "unit_price_cents": 14900,
        "discount_cents": 0,
        "tax_cents": 0,
        "total_cents": 14900
      }
    ],
    "subtotal_cents": 14900,
    "discount_total_cents": 0,
    "tax_total_cents": 0,
    "total_cents": 14900,
    "payment_method": "card",
    "channel": "direct",
    "stripe_payment_intent_id": "pi_xxx"
  }
}
```

### membership.cancelled

```json
{
  "id": "evt_def456",
  "type": "membership.cancelled",
  "created_at": "2026-02-01T10:15:00Z",
  "data": {
    "member": {
      "id": "mem_789",
      "email": "mike@example.com",
      "first_name": "Mike",
      "last_name": "Johnson"
    },
    "membership": {
      "id": "mbr_abc",
      "type": "unlimited_monthly",
      "name": "Unlimited Monthly",
      "started_at": "2025-06-15",
      "ends_at": "2026-02-28",
      "total_months": 9
    },
    "cancellation": {
      "reason": "moving_away",
      "feedback": "Loved the studio, just relocating for work",
      "requested_at": "2026-02-01T10:15:00Z",
      "effective_date": "2026-02-28"
    }
  }
}
```

### checkin.completed

```json
{
  "id": "evt_ghi789",
  "type": "checkin.completed",
  "created_at": "2026-02-01T09:02:00Z",
  "data": {
    "member": {
      "id": "mem_123",
      "email": "lisa@example.com",
      "first_name": "Lisa"
    },
    "class": {
      "id": "cls_456",
      "name": "Morning Vinyasa",
      "type": "vinyasa",
      "instructor": {
        "id": "staff_789",
        "name": "Maya Patel"
      },
      "start_time": "2026-02-01T09:00:00-08:00",
      "location": "SOMA"
    },
    "checkin": {
      "method": "qr_code",
      "time": "2026-02-01T09:02:00-08:00",
      "booking_id": "bkg_xyz"
    },
    "member_stats": {
      "total_classes": 47,
      "classes_this_month": 8,
      "streak_days": 12
    }
  }
}
```

---

## Use Case Recipes

### 1. Win-Back Campaign for Churned Members

**Trigger:** `membership.cancelled`

**Workflow:**
1. Wait 30 days
2. Check if member has returned (API call)
3. If not returned → Send win-back email with special offer
4. Wait 7 days
5. If no response → Send SMS reminder
6. Log outreach in CRM

### 2. Real-Time Sales Dashboard

**Trigger:** `sale.created`

**Workflow:**
1. Extract sale data
2. Append row to Google Sheet
3. Update running totals
4. If daily total exceeds goal → Send Slack celebration

### 3. Automated Review Requests

**Trigger:** `checkin.completed`

**Conditions:**
- Member has attended 5+ classes
- Last review request was 30+ days ago
- Class rating was 4+ stars (if collected)

**Workflow:**
1. Wait 2 hours
2. Send email: "How was your class with {instructor}?"
3. Include links to Google, Yelp review pages

### 4. Teacher Sub Finder

**Trigger:** `sub.requested`

**Workflow:**
1. Get list of available teachers (API call)
2. Send SMS to each: "Can you cover {class} on {date}?"
3. First to reply "yes" gets assigned
4. Notify original teacher and update schedule

### 5. Monthly Accounting Sync

**Trigger:** Scheduled (1st of month at 6am)

**Workflow:**
1. Call Tandava export API for previous month
2. Parse CSV response
3. Create QuickBooks journal entries
4. Send summary email to accountant

---

## Testing Webhooks

### Using Tandava's Test Feature

1. Go to **Settings → Integrations → Webhooks**
2. Click **Test** next to your webhook
3. Select event type to simulate
4. View delivery status and response

### Using RequestBin for Debugging

1. Go to [requestbin.com](https://requestbin.com)
2. Create a new bin
3. Use bin URL as temporary webhook
4. Trigger events in Tandava
5. Inspect payloads in RequestBin

### Local Development with ngrok

```bash
# Start your local server
node server.js  # Listening on :3000

# Start ngrok tunnel
ngrok http 3000

# Use ngrok URL in Tandava
# https://abc123.ngrok.io/webhook
```

---

## Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook is active** in Tandava settings
2. **Verify URL is accessible** from the internet
3. **Check event types** selected match expected triggers
4. **View delivery logs** for error details

### Signature Verification Failing

1. **Use raw body** for signature calculation
2. **Check secret** matches exactly (no extra whitespace)
3. **Ensure UTF-8 encoding** of payload

### Events Arriving Out of Order

- Events are delivered in near-real-time but order isn't guaranteed
- Use `created_at` timestamp for ordering
- Design workflows to be idempotent

### Missing Data in Payload

- Not all fields are present in all events
- Check for null/undefined before accessing nested properties
- Use optional chaining: `data?.member?.email`

---

## Rate Limits

| Limit Type | Value |
|------------|-------|
| Webhooks per studio | 10 |
| Events per second | 100 |
| Payload size | 256 KB |
| Retry window | 24 hours |

---

## Security Best Practices

1. **Always verify signatures** - Don't trust payloads without verification
2. **Use HTTPS endpoints** - Tandava won't deliver to HTTP
3. **Rotate secrets periodically** - Regenerate secrets annually
4. **Limit exposed data** - Only subscribe to events you need
5. **Log and monitor** - Track failed deliveries for security issues

---

*Automate your studio operations and focus on what matters: your community.*
