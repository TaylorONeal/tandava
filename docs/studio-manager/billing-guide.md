# Studio Manager — Billing & Payments Guide

## How Payments Work

Tandava uses **Stripe** to process all payments. When a member books a class or purchases a membership, they're redirected to a secure Stripe Checkout page. You receive the funds directly in your Stripe account.

### Your Stripe Dashboard

After connecting your Stripe account, you can access your full Stripe Dashboard at [dashboard.stripe.com](https://dashboard.stripe.com) to:

- View all transactions
- Issue refunds
- Manage disputes
- Download reports and invoices
- Configure payout schedules
- Update your bank account

## Payment Types

### Drop-in Classes

When a member books a single class:
1. They click "Book" on the class page
2. They're redirected to Stripe Checkout
3. Payment is processed immediately
4. The booking is confirmed automatically
5. They receive a confirmation email

**Refunds:** Process refunds from your Stripe Dashboard under **Payments → [transaction] → Refund**.

### Memberships (Subscriptions)

When a member subscribes to a membership:
1. They select a plan from your pricing options
2. They're redirected to Stripe Checkout (subscription mode)
3. First payment is charged immediately
4. Subsequent payments are charged automatically each billing period
5. Members can manage their subscription via the Customer Portal

**If a payment fails:** The membership is marked as "past due" and the member is notified. Stripe will retry the payment according to your retry settings.

**Cancellations:** Members can cancel their subscription through the Customer Portal. They retain access until the end of their current billing period.

### Class Packs

When a member purchases a class pack:
1. They pay a one-time price for a bundle of classes (e.g., 10 classes)
2. Each time they book a class, one credit is deducted
3. When credits run out, they need to purchase another pack or drop-in

## The Customer Portal

Members can access Stripe's Customer Portal from their account to:
- Update their credit card
- View past invoices and receipts
- Cancel or change their subscription

You don't need to handle these requests manually — members self-serve.

## Stripe Fees

Stripe charges standard processing fees:
- **Online transactions:** 2.9% + $0.30 per successful charge
- **Subscriptions:** Same fee per recurring payment
- **Refunds:** Stripe does not refund its processing fee

You keep everything minus Stripe's fee. There are no additional Tandava platform fees.

## Payout Schedule

By default, Stripe sends payouts to your bank account on a 2-day rolling basis. You can change this to weekly or monthly in your Stripe Dashboard under **Settings → Payouts**.

## Tax Considerations

Stripe can be configured to collect and report sales tax. Set this up in your Stripe Dashboard under **Settings → Tax**. Consult with your accountant for your specific tax obligations.

## Common Questions

**Q: How do I change my pricing?**
A: Update your pricing in Tandava under **Settings**, then update the corresponding prices in your Stripe Dashboard.

**Q: A member wants a refund — what do I do?**
A: Go to your Stripe Dashboard → Payments → find the transaction → click Refund.

**Q: What happens if my Stripe account gets restricted?**
A: Contact Stripe Support directly. Your Tandava studio will show payments as unavailable until resolved.

**Q: Can I use PayPal / Square / another processor?**
A: Tandava currently supports Stripe only. We chose Stripe for its reliability, developer tools, and global availability.
