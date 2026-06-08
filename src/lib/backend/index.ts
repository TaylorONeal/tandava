/**
 * Backend Provider Entry Point
 *
 * This module exports the active backend provider. All application code
 * should import from here — never directly from a specific provider.
 *
 * To switch backends:
 *   1. Implement the Backend interface (see types.ts)
 *   2. Change the export below to point to your implementation
 *   3. Update environment variables
 *
 * See docs/developer/backend-flexibility.md for full guide.
 */

export type {
  AuthProvider,
  AuthUser,
  AuthError,
  SignUpMetadata,
  DataProvider,
  DataResult,
  MutationResult,
  CreateMessageInput,
  BookClassInput,
  ApiProvider,
  ApiResult,
  Backend,
} from "./types";

// ---------------------------------------------------------------------------
// Active backend provider
// ---------------------------------------------------------------------------
// To use a different backend, swap this import:
//   import { myCustomBackend as activeBackend } from "./my-custom-provider";
import { supabaseBackend as activeBackend } from "./supabase";

/** The active backend instance — use this throughout the application */
export const backend = activeBackend;

/** Shorthand exports for convenience */
export const auth = activeBackend.auth;
export const data = activeBackend.data;
export const api = activeBackend.api;
export const isBackendConfigured = () => activeBackend.isConfigured();
