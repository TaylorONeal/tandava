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

import { captchaOption } from "@/lib/auth/captcha";
import { safeNextPath } from "@/lib/auth/next";
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
import type { Profile, Booking, ClassOccurrence, Membership, ClassPack, PublicScheduleRow, PublicOccurrenceRow, MyStudioRow, MyAdminStudioRow, StudioStorefront, DiscoverClassRow, DiscoverClassesArgs, BookClassAutoResult } from "@/types/database";
import type { AttributionSourceRow, AutomationSettingsRow, MemberAttribution } from "@/types/attribution";

/** Request header carrying the analytics session into booking RPCs (read by the bookings trigger, migration 00035). */
const SESSION_HEADER = "x-tandava-session";

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
    const { data, error } = await getClient().auth.signInWithPassword({ email, password, options: captchaOption() });
    return { user: mapUser(data?.user ?? null), error: mapError(error) };
  },

  async signUpWithEmail(email, password, metadata: SignUpMetadata, next) {
    const path = safeNextPath(next);
    const { data, error } = await getClient().auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        ...captchaOption(),
        // The confirmation link lands on the callback, which forwards to `next`
        // (e.g. the class someone was booking when they registered).
        emailRedirectTo: `${window.location.origin}/auth/callback${path === "/" ? "" : `?next=${encodeURIComponent(path)}`}`,
      },
    });
    // A user without a session means Supabase is waiting for email confirmation.
    const requiresEmailConfirmation = Boolean(data?.user && !data?.session);
    return { error: mapError(error), requiresEmailConfirmation };
  },

  async signInWithOAuth(provider, next, consentNonce) {
    const path = safeNextPath(next);
    const params = new URLSearchParams();
    if (path !== "/") params.set("next", path);
    if (consentNonce) params.set("cn", consentNonce);
    const query = params.toString() ? `?${params.toString()}` : "";
    const { error } = await getClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback${query}` },
    });
    return { error: mapError(error) };
  },

  async signOut() {
    await getClient().auth.signOut();
  },

  async resetPassword(email, options) {
    const params = new URLSearchParams();
    if (options?.next) params.set("next", safeNextPath(options.next));
    if (options?.claim) params.set("claim", "1");
    const query = params.toString();
    const { error } = await getClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-confirm${query ? `?${query}` : ""}`,
      ...captchaOption(),
    });
    return { error: mapError(error) };
  },

  async updatePassword(password) {
    const { error } = await getClient().auth.updateUser({ password });
    return { error: mapError(error) };
  },

  async resendConfirmation(email, next) {
    const path = safeNextPath(next);
    const { error } = await getClient().auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback${path === "/" ? "" : `?next=${encodeURIComponent(path)}`}`,
        ...captchaOption(),
      },
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
  async markProfileClaimed(userId): Promise<MutationResult> {
    // RLS "Users can update own profile" scopes this to the caller. The
    // is_guest filter keeps claimed_at the first-claim time.
    const { error } = await getClient()
      .from("profiles")
      .update({ is_guest: false, claimed_at: new Date().toISOString() })
      .eq("id", userId)
      .eq("is_guest", true);
    return { error: error ? { message: error.message } : null };
  },

  async getProfile(userId): Promise<DataResult<Profile>> {
    const client = getClient();
    // Roles live in studio_staff, not profiles. Resolve the caller's highest
    // studio role server-side so permission gating works in production. The
    // RPC always describes the *session* user, so only stamp it onto their
    // own profile — never onto another user's row.
    const [profileRes, sessionRes, roleRes] = await Promise.all([
      client.from("profiles").select("*").eq("id", userId).single(),
      client.auth.getSession(),
      client.rpc("get_my_effective_role"),
    ]);

    const profile = profileRes.data as Profile | null;
    if (profileRes.error || !profile) {
      return { data: null, error: { message: profileRes.error?.message ?? "Profile not found" } };
    }

    if (roleRes.error) {
      // Older deployments may not have the function yet — default to student.
      console.warn("get_my_effective_role unavailable:", roleRes.error.message);
    }

    const isOwnProfile = sessionRes.data?.session?.user?.id === userId;
    const role = isOwnProfile ? roleRes.data ?? "student" : profile.role;
    return { data: { ...profile, role }, error: null };
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
    const call = getClient().rpc("book_class", {
      p_occurrence_id: input.occurrenceId,
      p_source_type: input.sourceType,
      p_source_id: input.sourceId,
    });
    // The booking trigger reads this header to credit the visit (validated
    // server side against the member's own linked visitors).
    const { data, error } = await (input.sessionId ? call.setHeader(SESSION_HEADER, input.sessionId) : call);

    return {
      data: (data as Booking) ?? null,
      error: error ? { message: error.message } : null,
    };
  },

  async bookClassAuto(occurrenceId, sessionId): Promise<DataResult<BookClassAutoResult>> {
    const call = getClient().rpc("book_class_auto", { p_occurrence_id: occurrenceId } as never);
    const { data, error } = await (sessionId ? call.setHeader(SESSION_HEADER, sessionId) : call);
    return {
      data: (data as BookClassAutoResult) ?? null,
      error: error ? { message: error.message } : null,
    };
  },

  async bookFreeClass(occurrenceId, sessionId): Promise<DataResult<Booking>> {
    const call = getClient().rpc("book_free_class", {
      p_occurrence_id: occurrenceId,
    });
    const { data, error } = await (sessionId ? call.setHeader(SESSION_HEADER, sessionId) : call);
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

  async getStudioStorefront(slug): Promise<DataResult<StudioStorefront>> {
    // The hand-written Database type doesn't satisfy supabase-js's rpc generic,
    // so args resolve to `never` (same as the other rpc calls here); assert.
    const { data, error } = await getClient().rpc("get_studio_storefront", { p_slug: slug } as never);
    return {
      data: (data as StudioStorefront) ?? null,
      error: error ? { message: error.message } : null,
    };
  },

  async discoverClasses(args = {}): Promise<DataResult<DiscoverClassRow[]>> {
    const { data, error } = await getClient().rpc("discover_classes", args as never);
    return {
      data: (data as DiscoverClassRow[]) ?? null,
      error: error ? { message: error.message } : null,
    };
  },

  async getPublicOccurrence(slug, occurrenceId): Promise<DataResult<PublicOccurrenceRow>> {
    // The hand-written Database type doesn't satisfy supabase-js's rpc generic,
    // so args resolve to `never` (same as the other rpc calls here); assert.
    const { data, error } = await getClient().rpc("get_public_occurrence", {
      p_slug: slug,
      p_occurrence_id: occurrenceId,
    } as never);
    const rows = (data as PublicOccurrenceRow[] | null) ?? [];
    return {
      data: rows[0] ?? null,
      error: error ? { message: error.message } : null,
    };
  },

  async linkMyVisitor(visitorId, via): Promise<MutationResult & { owned?: boolean | null }> {
    const { data, error } = await getClient().rpc("link_my_visitor", {
      p_visitor_id: visitorId,
      p_via: via,
    } as never);
    return { error: error ? { message: error.message } : null, owned: error ? undefined : ((data as boolean | null) ?? null) };
  },

  async applyMySignupConsent(pending): Promise<MutationResult> {
    const { error } = await getClient().rpc("apply_my_signup_consent", {
      p_studio_slug: pending?.slug ?? null,
      p_granted: pending?.granted ?? null,
      p_started_at: pending?.startedAt ?? null,
    } as never);
    return { error: error ? { message: error.message } : null };
  },

  async getAttributionSources(studioId, from, to, model): Promise<DataResult<AttributionSourceRow[]>> {
    const { data, error } = await getClient().rpc("get_attribution_sources", {
      p_studio_id: studioId,
      p_from: from.toISOString(),
      p_to: to.toISOString(),
      p_model: model,
    } as never);
    const rows = ((data as AttributionSourceRow[] | null) ?? []).map((r) => ({
      ...r,
      // bigint columns arrive as numbers or numeric strings depending on size.
      sessions: Number(r.sessions),
      new_people: Number(r.new_people),
      bookings: Number(r.bookings),
      purchases: Number(r.purchases),
      revenue_cents: Number(r.revenue_cents),
    }));
    return { data: rows, error: error ? { message: error.message } : null };
  },

  async getMemberAttribution(studioId, profileId): Promise<DataResult<MemberAttribution>> {
    const { data, error } = await getClient().rpc("get_member_attribution", {
      p_studio_id: studioId,
      p_profile_id: profileId,
    } as never);
    const rows = (data as MemberAttribution[] | null) ?? [];
    return { data: rows[0] ?? null, error: error ? { message: error.message } : null };
  },

  async getAutomationSettings(studioId): Promise<DataResult<AutomationSettingsRow>> {
    const { data, error } = await getClient()
      .from("automation_settings" as never)
      .select("studio_id, guest_to_member_enabled, first_visit_enabled, lapsed_enabled, lapsed_days_override, intro_offer_url")
      .eq("studio_id", studioId)
      .maybeSingle();
    return {
      data: (data as AutomationSettingsRow | null) ?? null,
      error: error ? { message: error.message } : null,
    };
  },

  async saveAutomationSettings(row): Promise<MutationResult> {
    const { error } = await getClient()
      .from("automation_settings" as never)
      .upsert({ ...row, updated_at: new Date().toISOString() } as never, { onConflict: "studio_id" });
    return { error: error ? { message: error.message } : null };
  },

  async getMyAdminStudio(): Promise<DataResult<MyAdminStudioRow>> {
    const { data, error } = await getClient().rpc("get_my_admin_studio" as never);
    const rows = (data as MyAdminStudioRow[] | null) ?? [];
    return { data: rows[0] ?? null, error: error ? { message: error.message } : null };
  },

  async getMyStudio(): Promise<DataResult<MyStudioRow>> {
    const { data, error } = await getClient().rpc("get_my_studio");
    const rows = (data as MyStudioRow[] | null) ?? [];
    return {
      data: rows[0] ?? null,
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
