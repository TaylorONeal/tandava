/**
 * Backend Provider Interfaces
 *
 * These interfaces define the contract between the application and its
 * backend. The default implementation uses Supabase, but any backend
 * (raw Postgres + Express, Firebase, custom API, etc.) can be used by
 * implementing these interfaces.
 *
 * See docs/developer/backend-flexibility.md for architecture details.
 */

import type { Profile, Booking, ClassOccurrence, Membership, ClassPack, PublicScheduleRow, PublicOccurrenceRow, MyStudioRow, StudioStorefront } from "@/types/database";
import type { FeedbackType } from "@/types/database";
import type { AttributionModel, AttributionSourceRow, AutomationSettingsRow, MemberAttribution } from "@/types/attribution";

// ---------------------------------------------------------------------------
// Auth Provider
// ---------------------------------------------------------------------------

/** Minimal user identity — what the app needs from any auth system */
export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthError {
  message: string;
}

export interface SignUpMetadata {
  first_name: string;
  last_name: string;
  marketing_consent?: boolean;
  /** Slug of the studio page the sign-up started from; scopes marketing_consent to that studio. */
  marketing_consent_studio?: string;
}

export interface AuthProvider {
  /** Sign in with email and password */
  signInWithEmail(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }>;

  /**
   * Create a new account with email and password.
   * `requiresEmailConfirmation` is true when the backend created the account
   * but withheld a session until the user confirms their email address.
   */
  signUpWithEmail(
    email: string,
    password: string,
    metadata: SignUpMetadata,
    /** Same-origin path to land on after the confirmation link. */
    next?: string
  ): Promise<{ error: AuthError | null; requiresEmailConfirmation?: boolean }>;

  /** Initiate OAuth flow (redirects the browser) */
  /** `consentNonce` rides on the callback URL so a sign-up's marketing choice applies only to that attempt. */
  signInWithOAuth(provider: "google" | "apple", next?: string, consentNonce?: string): Promise<{ error: AuthError | null }>;

  /** Sign out the current user */
  signOut(): Promise<void>;

  /**
   * Email a link that lets the owner of `email` set a password.
   * Used for "forgot password" and for a guest saving their booking details as
   * an account (`claim: true`). Clicking the link proves control of the mailbox,
   * which is what makes claiming a passwordless guest identity safe.
   * `next` is the same-origin path to land on after the password is set.
   */
  resetPassword(
    email: string,
    options?: { next?: string; claim?: boolean }
  ): Promise<{ error: AuthError | null }>;

  /** Set a new password for the signed-in user (after a reset or claim link). */
  updatePassword(password: string): Promise<{ error: AuthError | null }>;

  /** Get the currently authenticated user (from persisted session) */
  getSession(): Promise<{ user: AuthUser | null }>;

  /**
   * Subscribe to auth state changes.
   * The callback fires on login, logout, token refresh, etc.
   * Returns an unsubscribe function.
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void;
}

// ---------------------------------------------------------------------------
// Data Provider (database operations)
// ---------------------------------------------------------------------------

/** Standard result for single-item queries */
export interface DataResult<T> {
  data: T | null;
  error: { message: string } | null;
}

/** Standard result for mutations */
export interface MutationResult {
  error: { message: string } | null;
}

export interface CreateMessageInput {
  type: FeedbackType;
  studio_id?: string | null;
  class_id?: string | null;
  sender_id?: string | null;
  sender_name?: string | null;
  sender_email?: string | null;
  subject: string;
  body: string;
  honeypot?: string | null;
}

/** Book a class against a covered entitlement (membership or class pack). */
export interface BookClassInput {
  occurrenceId: string;
  sourceType: "membership" | "class_pack";
  sourceId: string;
}

/**
 * Guest-form submission for the login-free booking path (PRD-020).
 * Posted to the `express-book` Edge Function, which owns every write.
 */
export interface ExpressBookInput {
  slug: string;
  occurrenceId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  marketingConsent?: boolean;
  waiverAccepted?: boolean;
  utm?: { source?: string; medium?: string; campaign?: string };
  /** First-party visitor id and the current analytics session (PRD-024). */
  visitorId?: string;
  sessionId?: string;
}

/** What the `express-book` function answers with. */
export interface ExpressBookResult {
  outcome: "booked" | "waitlisted" | "pending_payment" | "continue_link_sent" | "rejected" | "rate_limited";
  bookingId?: string | null;
  waitlistPosition?: number | null;
  /** Present for `pending_payment`: redirect the visitor here to pay. */
  checkoutUrl?: string | null;
  /** Machine-readable rejection code (ExpressRejectReason). */
  reason?: string;
  /** Visitor-facing message. Always render this rather than `reason`. */
  message?: string;
  /** Per-field validation errors for a 400. */
  fields?: { code: string; message: string }[];
}

/** A member's entitlements for resolving booking coverage. */
export interface MemberEntitlements {
  memberships: Membership[];
  packs: ClassPack[];
}

export interface DataProvider {
  /** Fetch a user profile by ID */
  getProfile(userId: string): Promise<DataResult<Profile>>;

  /**
   * Mark the signed-in user's guest profile as claimed (PRD-020 claim flow):
   * is_guest = false, claimed_at = now. A no-op for a profile that was never a
   * guest, and harmless where migration 00019 is not applied yet.
   */
  markProfileClaimed(userId: string): Promise<MutationResult>;

  /** Create a new message (contact form, feedback, etc.) */
  createMessage(input: CreateMessageInput): Promise<MutationResult>;

  /**
   * Atomically book a class against a membership or class pack via the
   * book_class() RPC (server-side eligibility check + entitlement decrement).
   * Drop-in/paid bookings use the Stripe checkout flow instead.
   */
  bookClass(input: BookClassInput): Promise<DataResult<Booking>>;

  /** Book the signed-in user into a zero-price class (book_free_class() RPC, migration 00023). */
  bookFreeClass(occurrenceId: string): Promise<DataResult<Booking>>;

  /** Cancel a booking via the cancel_booking() RPC (late-cancel detection + refund/fee). */
  cancelBooking(bookingId: string): Promise<DataResult<Booking>>;

  /** Public upcoming schedule for a discoverable studio (by slug) — used by the embed widget. */
  getPublicSchedule(slug: string, limit?: number): Promise<DataResult<PublicScheduleRow[]>>;

  /** Public storefront (profile + offerings + pricing) for a discoverable studio by slug. Null if not discoverable. */
  getStudioStorefront(slug: string): Promise<DataResult<StudioStorefront>>;

  /**
   * Public booking-relevant facts for ONE occurrence of a discoverable studio —
   * what the express booking page renders. Returns the row even when the class
   * is cancelled or past, so the page can say why it cannot be booked.
   */
  getPublicOccurrence(slug: string, occurrenceId: string): Promise<DataResult<PublicOccurrenceRow>>;

  /**
   * The signed-in staff member's own studio — slug, branding and flags for
   * owner-facing screens. Null when the caller has no active staff record.
   */
  getMyStudio(): Promise<DataResult<MyStudioRow>>;

  /** Upcoming (non-cancelled, future) class occurrences for a studio, with offering + location joined. */
  getUpcomingClasses(studioId: string): Promise<DataResult<ClassOccurrence[]>>;

  /** A member's memberships + class packs (with their types joined) for entitlement resolution. */
  getMemberEntitlements(profileId: string, studioId: string): Promise<DataResult<MemberEntitlements>>;

  /**
   * Join this browser's anonymous visitor id to the signed-in person
   * (link_my_visitor RPC, migration 00025), so visits before sign-in count
   * toward their journey. Best effort; never rewrites another person's link.
   */
  linkMyVisitor(visitorId: string, via: string): Promise<MutationResult>;

  /**
   * Record the sign-up marketing choice for the studio the person signed up
   * from, once (migration 00025). Email sign-ups carry it in auth metadata;
   * OAuth sign-ups pass the choice kept in the browser across the redirect.
   */
  applyMySignupConsent(pending?: { slug: string; granted: boolean; startedAt: string }): Promise<MutationResult>;

  /** Owner/admin report: sessions, new people, bookings and revenue by channel + source + campaign. */
  getAttributionSources(from: Date, to: Date, model: AttributionModel): Promise<DataResult<AttributionSourceRow[]>>;

  /** How one person found the studio (staff only; null when they are not a member of the caller's studio). */
  getMemberAttribution(profileId: string): Promise<DataResult<MemberAttribution>>;

  /** The studio's automation switches; null data means no row yet (defaults apply). */
  getAutomationSettings(studioId: string): Promise<DataResult<AutomationSettingsRow>>;

  /** Create or update the studio's automation switches (owner/admin by RLS). */
  saveAutomationSettings(row: AutomationSettingsRow): Promise<MutationResult>;
}

// ---------------------------------------------------------------------------
// API Provider (serverless function calls)
// ---------------------------------------------------------------------------

export interface ApiResult<T = unknown> {
  data: T | null;
  error: { message: string } | null;
}

export interface ApiProvider {
  /**
   * Invoke a backend function by name.
   * In Supabase, this maps to Edge Functions.
   * In a custom backend, this maps to API endpoints.
   */
  invoke<T = unknown>(functionName: string, body: Record<string, unknown>): Promise<ApiResult<T>>;
}

// ---------------------------------------------------------------------------
// Combined backend — all three providers in one object
// ---------------------------------------------------------------------------

export interface Backend {
  auth: AuthProvider;
  data: DataProvider;
  api: ApiProvider;
  /** Whether this backend is fully configured and operational */
  isConfigured(): boolean;
}
