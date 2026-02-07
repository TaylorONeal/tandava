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

import type { Profile } from "@/types/database";
import type { FeedbackType } from "@/types/database";

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
}

export interface AuthProvider {
  /** Sign in with email and password */
  signInWithEmail(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }>;

  /** Create a new account with email and password */
  signUpWithEmail(email: string, password: string, metadata: SignUpMetadata): Promise<{ error: AuthError | null }>;

  /** Initiate OAuth flow (redirects the browser) */
  signInWithOAuth(provider: "google" | "apple"): Promise<{ error: AuthError | null }>;

  /** Sign out the current user */
  signOut(): Promise<void>;

  /** Send a password reset email */
  resetPassword(email: string): Promise<{ error: AuthError | null }>;

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

export interface DataProvider {
  /** Fetch a user profile by ID */
  getProfile(userId: string): Promise<DataResult<Profile>>;

  /** Create a new message (contact form, feedback, etc.) */
  createMessage(input: CreateMessageInput): Promise<MutationResult>;
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
