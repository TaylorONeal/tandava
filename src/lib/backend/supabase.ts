/**
 * Supabase Backend Provider
 *
 * Implements AuthProvider, DataProvider, and ApiProvider using the
 * Supabase JS SDK. This is the default (and recommended) backend.
 *
 * Supabase provides:
 *   - PostgreSQL database with Row-Level Security
 *   - Built-in auth (email, OAuth, magic links, MFA)
 *   - Edge Functions (serverless, Deno runtime)
 *   - Realtime subscriptions
 *
 * All in one SDK with zero custom backend code.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  AuthProvider,
  AuthUser,
  AuthError,
  SignUpMetadata,
  DataProvider,
  DataResult,
  MutationResult,
  CreateMessageInput,
  BookClassInput,
  MemberEntitlements,
  ApiProvider,
  ApiResult,
  Backend,
} from "./types";
import type { Profile, Booking, ClassOccurrence, Membership, ClassPack, PublicScheduleRow } from "@/types/database";

// ---------------------------------------------------------------------------
// Supabase client singleton
// ---------------------------------------------------------------------------

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient<Database> | null = null;

function getClient(): SupabaseClient<Database> {
  if (!client) {
    client = createClient<Database>(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseAnonKey || "placeholder-key",
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    );
  }
  return client;
}

function isConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes("placeholder") &&
      !supabaseAnonKey.includes("placeholder")
  );
}

// ---------------------------------------------------------------------------
// Auth Provider
// ---------------------------------------------------------------------------

function mapUser(supabaseUser: { id: string; email?: string } | null): AuthUser | null {
  if (!supabaseUser) return null;
  return { id: supabaseUser.id, email: supabaseUser.email || "" };
}

function mapError(err: unknown): AuthError | null {
  if (!err) return null;
  if (typeof err === "object" && err !== null && "message" in err) {
    return { message: (err as { message: string }).message };
  }
  return { message: String(err) };
}

const supabaseAuth: AuthProvider = {
  async signInWithEmail(email, password) {
    const { data, error } = await getClient().auth.signInWithPassword({ email, password });
    return { user: mapUser(data?.user ?? null), error: mapError(error) };
  },

  async signUpWithEmail(email, password, metadata: SignUpMetadata) {
    const { error } = await getClient().auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    return { error: mapError(error) };
  },

  async signInWithOAuth(provider) {
    const { error } = await getClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error: mapError(error) };
  },

  async signOut() {
    await getClient().auth.signOut();
  },

  async resetPassword(email) {
    const { error } = await getClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-confirm`,
    });
    return { error: mapError(error) };
  },

  async getSession() {
    const { data } = await getClient().auth.getSession();
    return { user: mapUser(data?.session?.user ?? null) };
  },

  onAuthStateChange(callback) {
    const { data: { subscription } } = getClient().auth.onAuthStateChange((_event, session) => {
      callback(mapUser(session?.user ?? null));
    });
    return () => subscription.unsubscribe();
  },
};

// ---------------------------------------------------------------------------
// Data Provider
// ---------------------------------------------------------------------------

const supabaseData: DataProvider = {
  async getProfile(userId): Promise<DataResult<Profile>> {
    const { data, error } = await getClient()
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    return { data, error: error ? { message: error.message } : null };
  },

  async createMessage(input: CreateMessageInput): Promise<MutationResult> {
    const { error } = await getClient().from("messages").insert({
      type: input.type,
      studio_id: input.studio_id || null,
      class_id: input.class_id || null,
      sender_id: input.sender_id || null,
      sender_name: input.sender_name || null,
      sender_email: input.sender_email || null,
      subject: input.subject,
      body: input.body,
      honeypot: input.honeypot || null,
    });

    return { error: error ? { message: error.message } : null };
  },

  async bookClass(input: BookClassInput): Promise<DataResult<Booking>> {
    const { data, error } = await getClient().rpc("book_class", {
      p_occurrence_id: input.occurrenceId,
      p_source_type: input.sourceType,
      p_source_id: input.sourceId,
    });

    return {
      data: (data as Booking) ?? null,
      error: error ? { message: error.message } : null,
    };
  },

  async cancelBooking(bookingId): Promise<DataResult<Booking>> {
    const { data, error } = await getClient().rpc("cancel_booking", {
      p_booking_id: bookingId,
    });
    return {
      data: (data as Booking) ?? null,
      error: error ? { message: error.message } : null,
    };
  },

  async getPublicSchedule(slug, limit = 12): Promise<DataResult<PublicScheduleRow[]>> {
    const { data, error } = await getClient().rpc("get_public_schedule", {
      p_slug: slug,
      p_limit: limit,
    });
    return {
      data: (data as PublicScheduleRow[]) ?? null,
      error: error ? { message: error.message } : null,
    };
  },

  async getUpcomingClasses(studioId): Promise<DataResult<ClassOccurrence[]>> {
    const { data, error } = await getClient()
      .from("class_occurrences")
      .select("*, offering:offerings(*), location:locations(*)")
      .eq("studio_id", studioId)
      .eq("is_cancelled", false)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true });

    return {
      data: (data as ClassOccurrence[]) ?? null,
      error: error ? { message: error.message } : null,
    };
  },

  async getMemberEntitlements(profileId, studioId): Promise<DataResult<MemberEntitlements>> {
    const client = getClient();
    const [membershipsRes, packsRes] = await Promise.all([
      client
        .from("memberships")
        .select("*, membership_type:membership_types(*)")
        .eq("profile_id", profileId)
        .eq("studio_id", studioId),
      client
        .from("class_packs")
        .select("*, class_pack_type:class_pack_types(*)")
        .eq("profile_id", profileId)
        .eq("studio_id", studioId),
    ]);

    const error = membershipsRes.error || packsRes.error;
    if (error) return { data: null, error: { message: error.message } };

    return {
      data: {
        memberships: (membershipsRes.data as Membership[]) ?? [],
        packs: (packsRes.data as ClassPack[]) ?? [],
      },
      error: null,
    };
  },
};

// ---------------------------------------------------------------------------
// API Provider (Edge Functions)
// ---------------------------------------------------------------------------

const supabaseApi: ApiProvider = {
  async invoke<T = unknown>(functionName: string, body: Record<string, unknown>): Promise<ApiResult<T>> {
    const { data, error } = await getClient().functions.invoke(functionName, { body });

    return {
      data: data as T | null,
      error: error ? { message: error.message } : null,
    };
  },
};

// ---------------------------------------------------------------------------
// Combined backend export
// ---------------------------------------------------------------------------

export const supabaseBackend: Backend = {
  auth: supabaseAuth,
  data: supabaseData,
  api: supabaseApi,
  isConfigured,
};
