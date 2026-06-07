/**
 * Stripe Client Configuration
 *
 * This module provides the frontend Stripe.js instance for use with
 * Stripe Checkout, Elements, and the Customer Portal.
 *
 * Architecture:
 *   - Frontend: @stripe/stripe-js (this file) — redirects to Stripe Checkout
 *   - Backend:  Backend API provider — creates sessions, handles webhooks
 *   - Connect:  Stripe Connect (Standard) — each studio links their own account
 *
 * See docs/developer/stripe-setup.md for full configuration guide.
 */

import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get the Stripe.js instance (lazy-loaded singleton).
 * Returns null if VITE_STRIPE_PUBLISHABLE_KEY is not configured.
 */
export function getStripe(): Promise<Stripe | null> {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  if (!key || key.includes("your-key")) {
    console.warn(
      "Stripe publishable key not configured. Payment features disabled. " +
        "See .env.example for configuration."
    );
    return Promise.resolve(null);
  }

  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }

  return stripePromise;
}

/** Returns true when Stripe is properly configured */
export function isStripeConfigured(): boolean {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  return Boolean(key && !key.includes("your-key"));
}

// ---------------------------------------------------------------------------
// Checkout helpers (call backend API functions)
// ---------------------------------------------------------------------------
import { api } from "@/lib/backend";

/** Redirect to Stripe Checkout for a class drop-in (by class occurrence id) */
export async function checkoutDropIn(occurrenceId: string): Promise<{ error?: string }> {
  const { data, error } = await api.invoke<{ url: string }>("stripe-checkout", {
    type: "drop_in",
    occurrenceId,
  });

  if (error) return { error: error.message };

  if (data?.url) {
    window.location.href = data.url;
    return {};
  }

  return { error: "No checkout URL returned" };
}

/** Redirect to Stripe Checkout for a membership/subscription */
export async function checkoutMembership(
  studioId: string,
  membershipTypeId: string
): Promise<{ error?: string }> {
  const { data, error } = await api.invoke<{ url: string }>("stripe-checkout", {
    type: "membership",
    studioId,
    membershipTypeId,
  });

  if (error) return { error: error.message };

  if (data?.url) {
    window.location.href = data.url;
    return {};
  }

  return { error: "No checkout URL returned" };
}

/** Redirect to Stripe Checkout for a class pack (by class pack type id) */
export async function checkoutClassPack(
  studioId: string,
  classPackTypeId: string
): Promise<{ error?: string }> {
  const { data, error } = await api.invoke<{ url: string }>("stripe-checkout", {
    type: "class_pack",
    studioId,
    classPackTypeId,
  });

  if (error) return { error: error.message };

  if (data?.url) {
    window.location.href = data.url;
    return {};
  }

  return { error: "No checkout URL returned" };
}

/** Open the Stripe Customer Portal for self-service billing management */
export async function openCustomerPortal(studioId: string): Promise<{ error?: string }> {
  const { data, error } = await api.invoke<{ url: string }>("stripe-portal", {
    studioId,
  });

  if (error) return { error: error.message };

  if (data?.url) {
    window.location.href = data.url;
    return {};
  }

  return { error: "No portal URL returned" };
}
