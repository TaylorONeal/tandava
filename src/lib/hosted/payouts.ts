/** Payout status for Settings > Billing, from stripe-connect `status`. */
export interface PayoutStatus {
  connected: boolean;      // Stripe has the account details
  chargesEnabled: boolean; // Stripe lets the account take payments (what checkout requires)
}

export type PayoutState =
  | { kind: "loading"; message: string }
  | { kind: "not_started"; message: string }
  | { kind: "pending"; message: string }
  | { kind: "ready"; message: string };

export function payoutState(s: PayoutStatus | null): PayoutState {
  if (!s) return { kind: "loading", message: "Checking your payout account…" };
  if (s.chargesEnabled) return { kind: "ready", message: "Your studio can take payments. Bank and business details live in your Stripe account." };
  if (s.connected) return { kind: "pending", message: "Stripe has your details but has not turned on payments yet. Students cannot pay online until it does." };
  return { kind: "not_started", message: "Payouts are not set up yet, so students cannot pay online." };
}
