/**
 * Onboarding Provisioning (Supabase Edge Function)
 *
 * Persists the studio setup wizard (/manage/onboarding) step by step and
 * tracks progress in studio_onboarding so owners can leave and resume.
 *
 * Actions (POST body):
 *   { step: "status" }                  — progress + prefill data for resume
 *   { step: "<key>", skip: true }       — advance current_step without completing
 *   { step: "<key>", data: {...} }      — provision the step's entities and
 *                                         record it in completed_steps
 *
 * Step keys (client) map 1:1 to the onboarding_step enum, except
 * "studio" → 'studio_info'. Each call is idempotent: it ensures the caller's
 * studio exists (creating it + linking the caller as owner on the first
 * 'studio' step) and upserts the entities a step produces. Values like
 * pack/membership pricing are sensible starters the owner refines later in
 * Financials.
 *
 * Deploy: supabase functions deploy onboarding
 *
 * NOTE: integration-test against a live project before production use.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `s-${Date.now()}`;
}

const dollarsToCents = (v: unknown) => Math.round(parseFloat(String(v ?? "0")) * 100) || 0;
const intOf = (v: unknown, d = 0) => parseInt(String(v ?? d), 10) || d;

// ---------------------------------------------------------------------------
// Step bookkeeping (client key ↔ onboarding_step enum)
// ---------------------------------------------------------------------------

const STEP_ORDER = [
  "studio_info", "location", "branding", "offerings", "schedule",
  "pricing", "staff", "waivers", "import", "stripe", "launch",
] as const;
type EnumStep = (typeof STEP_ORDER)[number];

const toEnumStep = (clientKey: string): EnumStep | null => {
  const key = clientKey === "studio" ? "studio_info" : clientKey;
  return (STEP_ORDER as readonly string[]).includes(key) ? (key as EnumStep) : null;
};
const toClientKey = (enumStep: string) => (enumStep === "studio_info" ? "studio" : enumStep);

// Quick flags studio_onboarding keeps per step. import/stripe flags are set by
// their dedicated flows (import-members, stripe-connect), not by step saves.
const FLAG_BY_STEP: Partial<Record<EnumStep, string>> = {
  location: "has_location",
  branding: "has_branding",
  offerings: "has_offerings",
  schedule: "has_schedule",
  pricing: "has_pricing",
  staff: "has_staff",
  waivers: "has_waiver",
};

/** Upsert studio_onboarding: mark a step done (or just move the cursor on skip). */
async function recordProgress(
  db: SupabaseClient,
  studioId: string,
  enumStep: EnumStep,
  completed: boolean,
) {
  const idx = STEP_ORDER.indexOf(enumStep);
  const nextStep = STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];

  const { data: existing } = await db
    .from("studio_onboarding")
    .select("id, completed_steps")
    .eq("studio_id", studioId)
    .maybeSingle();

  const steps = new Set<string>(existing?.completed_steps ?? []);
  if (completed) steps.add(enumStep);

  const row: Record<string, unknown> = {
    completed_steps: [...steps],
    current_step: nextStep,
  };
  const flag = FLAG_BY_STEP[enumStep];
  if (completed && flag) row[flag] = true;
  if (completed && enumStep === "launch") {
    row.is_launched = true;
    row.completed_at = new Date().toISOString();
  }

  if (existing) {
    await db.from("studio_onboarding").update(row).eq("id", existing.id);
  } else {
    await db.from("studio_onboarding").insert({ studio_id: studioId, ...row });
  }
}

// ---------------------------------------------------------------------------
// Status: everything the wizard needs to resume where the owner left off
// ---------------------------------------------------------------------------

async function buildStatus(db: SupabaseClient, studioId: string | undefined) {
  if (!studioId) return { ok: true, studioId: null };

  const [studioRes, progressRes, offeringsRes, staffRes, locationsRes] = await Promise.all([
    db.from("studios")
      .select("id, name, description, timezone, currency, brand_primary_color, brand_secondary_color, stripe_account_id, stripe_onboarding_complete, discoverable, page_live")
      .eq("id", studioId).single(),
    db.from("studio_onboarding")
      .select("completed_steps, current_step, is_launched")
      .eq("studio_id", studioId).maybeSingle(),
    db.from("offerings").select("id, name").eq("studio_id", studioId).order("created_at"),
    db.from("studio_staff")
      .select("profile_id, role, profiles(first_name, last_name, display_name)")
      .eq("studio_id", studioId).eq("is_active", true),
    db.from("locations").select("address_line1, rooms, is_primary").eq("studio_id", studioId),
  ]);

  const studio = studioRes.data;
  const progress = progressRes.data;

  // rooms is JSONB: historic rows may hold strings or {name} objects.
  const rooms = (locationsRes.data ?? []).flatMap((loc) =>
    (Array.isArray(loc.rooms) ? loc.rooms : []).map((r: unknown) =>
      typeof r === "string" ? r : (r as { name?: string })?.name ?? "",
    ),
  ).filter(Boolean);

  const staff = (staffRes.data ?? []).map((s) => {
    const p = s.profiles as { first_name?: string; last_name?: string; display_name?: string } | null;
    const name = p?.display_name || [p?.first_name, p?.last_name].filter(Boolean).join(" ");
    return { id: s.profile_id, name: name || "Staff member", role: s.role };
  });

  // The import/stripe flows mark their steps complete without moving the
  // cursor — resume on the first step that still needs attention.
  const completed = new Set(progress?.completed_steps ?? []);
  let currentStep = progress?.current_step ?? "studio_info";
  let cursor = STEP_ORDER.indexOf(currentStep as EnumStep);
  while (cursor >= 0 && cursor < STEP_ORDER.length - 1 && completed.has(STEP_ORDER[cursor])) {
    cursor++;
  }
  if (cursor >= 0) currentStep = STEP_ORDER[cursor];

  return {
    ok: true,
    studioId,
    studio: studio
      ? {
          name: studio.name,
          description: studio.description,
          timezone: studio.timezone,
          currency: studio.currency,
          primaryColor: studio.brand_primary_color,
          secondaryColor: studio.brand_secondary_color,
          discoverable: studio.discoverable,
          pageLive: studio.page_live,
          address: (locationsRes.data ?? []).find((l) => l.is_primary)?.address_line1
            ?? locationsRes.data?.[0]?.address_line1 ?? null,
        }
      : null,
    completedSteps: (progress?.completed_steps ?? []).map(toClientKey),
    currentStep: toClientKey(currentStep),
    isLaunched: progress?.is_launched ?? false,
    stripeConnected: Boolean(studio?.stripe_onboarding_complete),
    stripeAccountId: studio?.stripe_account_id ?? null,
    offerings: offeringsRes.data ?? [],
    staff,
    rooms,
  };
}

// ---------------------------------------------------------------------------
// Staff invites
// ---------------------------------------------------------------------------

interface StaffInput {
  name?: string;
  email?: string;
  role?: string;
  payType?: string;
  payRate?: string | number;
}

// Roles an owner may grant through the wizard. "sub" is a substitute teacher.
const WIZARD_ROLE_MAP: Record<string, string> = {
  teacher: "teacher",
  sub: "teacher",
  admin: "admin",
  front_desk: "front_desk",
};
const PAY_TYPES = ["per_class", "revenue_share", "hourly", "salary"];

// Where the invite email sends a new staff member: a page that asks them to choose a
// password, which they need to sign in to the Tandava Studio app. Only our own sites and
// local development may be the target; anything else falls back to the public site.
const PUBLIC_SITE = "https://tandavastudio.com";
function inviteRedirect(origin: string | null): string {
  const ok = origin !== null
    && (origin === PUBLIC_SITE || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin));
  return `${ok ? origin : PUBLIC_SITE}/auth/reset-confirm?invite=1`;
}

async function provisionStaff(
  db: SupabaseClient,
  studioId: string,
  members: StaffInput[],
  redirectTo: string = inviteRedirect(null),
): Promise<{ invited: number; emailed: number; errors: { email: string; message: string }[] }> {
  let invited = 0;
  let emailed = 0;
  const errors: { email: string; message: string }[] = [];

  for (const member of members) {
    const email = String(member.email ?? "").trim().toLowerCase();
    const name = String(member.name ?? "").trim();
    const role = WIZARD_ROLE_MAP[String(member.role ?? "teacher")];

    if (!email || !name) {
      errors.push({ email: email || "(missing)", message: "Name and email are required" });
      continue;
    }
    if (!role) {
      errors.push({ email, message: `Role "${member.role}" cannot be granted here` });
      continue;
    }

    const [firstName, ...rest] = name.split(/\s+/);
    const lastName = rest.join(" ");

    try {
      // Reuse an existing account, else send an invite email (falling back to
      // a bare account if the project has no email delivery configured).
      let profileId: string | null = null;
      const { data: existing } = await db
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        profileId = existing.id as string;
      } else {
        const meta = { first_name: firstName, last_name: lastName };
        const { data: invite, error: inviteErr } = await db.auth.admin.inviteUserByEmail(email, {
          data: meta,
          redirectTo,
        });
        if (invite?.user) {
          profileId = invite.user.id;
          emailed++;
        } else {
          const { data: created, error: createErr } = await db.auth.admin.createUser({
            email,
            email_confirm: true,
            password: crypto.randomUUID(),
            user_metadata: meta,
          });
          if (createErr || !created?.user) {
            errors.push({ email, message: inviteErr?.message ?? createErr?.message ?? "Could not create account" });
            continue;
          }
          profileId = created.user.id;
        }
      }

      // Never let an invite rewrite the owner's own row (an owner typing their own email).
      const { data: current } = await db.from("studio_staff")
        .select("role").eq("studio_id", studioId).eq("profile_id", profileId).maybeSingle();
      if (current?.role === "owner") {
        errors.push({ email, message: "That email is the studio owner's. Use a different email." });
        continue;
      }

      const payType = PAY_TYPES.includes(String(member.payType ?? "")) ? member.payType : null;
      const { error: linkErr } = await db.from("studio_staff").upsert(
        {
          studio_id: studioId,
          profile_id: profileId,
          role,
          pay_type: payType,
          pay_rate_cents: member.payRate ? dollarsToCents(member.payRate) : null,
          can_sub: member.role === "sub" || undefined,
          is_active: true,
        },
        { onConflict: "studio_id,profile_id" },
      );
      if (linkErr) {
        errors.push({ email, message: linkErr.message });
        continue;
      }
      invited++;
    } catch (err) {
      errors.push({ email, message: (err as Error).message ?? "Unknown error" });
    }
  }

  return { invited, emailed, errors };
}

// Every team change is written to audit_logs (category "staff") before it is applied, so
// there is no change without a record: who did it, to whom, the state before and after.
interface StaffAudit {
  studioId: string;
  actor: { id: string; email?: string | null };
  action: string;
  description: string;
  targetId: string;
  targetEmail?: string | null;
  previous?: Record<string, unknown>;
  next?: Record<string, unknown>;
  severity?: "info" | "notice" | "warning";
  req: Request;
}
async function auditStaff(db: SupabaseClient, a: StaffAudit): Promise<string | null> {
  const { error } = await db.from("audit_logs").insert({
    studio_id: a.studioId,
    category: "staff",
    action: a.action,
    description: a.description,
    actor_id: a.actor.id,
    actor_type: "user",
    actor_email: a.actor.email ?? null,
    actor_role: "owner",
    target_type: "studio_staff",
    target_id: a.targetId,
    target_description: a.targetEmail ?? null,
    previous_state: a.previous ?? null,
    new_state: a.next ?? null,
    severity: a.severity ?? "notice",
    user_agent: a.req.headers.get("User-Agent"),
  });
  return error ? error.message : null;
}

// Upcoming, not-cancelled classes and recurring rules a person is still assigned to teach.
async function teachingLoad(db: SupabaseClient, studioId: string, profileId: string) {
  const now = new Date().toISOString();
  const { count: classes } = await db.from("class_occurrences")
    .select("id", { count: "exact", head: true })
    .eq("studio_id", studioId).eq("teacher_id", profileId).eq("is_cancelled", false).gt("starts_at", now);
  const { count: rules } = await db.from("schedule_rules")
    .select("id", { count: "exact", head: true })
    .eq("studio_id", studioId).eq("teacher_id", profileId);
  return { classes: classes ?? 0, rules: rules ?? 0 };
}

async function auditAdds(
  db: SupabaseClient, studioId: string, actor: { id: string; email?: string | null },
  members: StaffInput[], errors: { email: string }[], req: Request,
) {
  for (const member of members) {
    const email = String(member.email ?? "").trim().toLowerCase();
    if (!email || errors.some((e) => e.email === email)) continue;
    const { data: prof } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
    const { data: added } = prof
      ? await db.from("studio_staff").select("id, role").eq("studio_id", studioId).eq("profile_id", prof.id).maybeSingle()
      : { data: null };
    if (!added) continue;
    await auditStaff(db, {
      studioId, actor, action: "staff.added", targetId: added.id as string, targetEmail: email, req,
      description: `Added ${email} to the team as ${added.role}`,
      next: { role: added.role, is_active: true },
    });
  }
}

async function staffHistory(db: SupabaseClient, studioId: string) {
  const { data, error } = await db.from("audit_logs")
    .select("id, action, description, actor_email, target_description, timestamp")
    .eq("studio_id", studioId).eq("category", "staff")
    .order("timestamp", { ascending: false }).limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id, action: row.action, description: row.description,
    by: row.actor_email ?? "", who: row.target_description ?? "", at: row.timestamp,
  }));
}

// Team list for the owner's Team page. "pending" means the person has never signed in,
// so they still need to open their invite (or use Forgot password) to choose a password.
async function listStaff(db: SupabaseClient, studioId: string) {
  const { data: rows, error } = await db
    .from("studio_staff")
    .select("id, profile_id, role, is_active, can_sub, created_at")
    .eq("studio_id", studioId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const out = [];
  for (const row of rows ?? []) {
    const { data: profile } = await db.from("profiles")
      .select("first_name, last_name, email").eq("id", row.profile_id).maybeSingle();
    const { data: account } = await db.auth.admin.getUserById(row.profile_id as string);
    out.push({
      id: row.id,
      role: row.role,
      isActive: row.is_active !== false,
      canSub: row.can_sub === true,
      name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" "),
      email: profile?.email ?? account?.user?.email ?? "",
      pending: !account?.user?.last_sign_in_at,
      upcomingClasses: (await teachingLoad(db, studioId, row.profile_id as string)).classes,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: "Not authenticated" }, 401);

  let payload: { step?: string; skip?: boolean; data?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const step = String(payload.step ?? "");
  const f = payload.data ?? {};

  const db = createClient(supabaseUrl, serviceKey);

  // Resolve only an active owner; removed staff must not retain service-role access.
  const { data: ownerRow } = await db
    .from("studio_staff")
    .select("studio_id")
    .eq("profile_id", user.id)
    .eq("role", "owner")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  let studioId = ownerRow?.studio_id as string | undefined;

  try {
    if (step === "status") {
      return json(await buildStatus(db, studioId));
    }

    // Team management after setup. Owner-only: studioId comes from the active owner row above.
    const TEAM_STEPS = ["staff_list", "staff_history", "staff_add", "staff_set_active", "staff_set_role", "staff_resend"];
    if (TEAM_STEPS.includes(step)) {
      if (!studioId) return json({ error: "Only the studio owner can manage the team" }, 403);
      const actor = { id: user.id, email: user.email };
      if (step === "staff_list") return json({ ok: true, staff: await listStaff(db, studioId) });
      if (step === "staff_history") return json({ ok: true, history: await staffHistory(db, studioId) });

      // Same invite as the setup wizard, without moving the wizard's resume cursor.
      if (step === "staff_add") {
        const members = Array.isArray(f.staff) ? (f.staff as StaffInput[]) : [];
        if (members.length === 0) return json({ error: "Add a name and an email" }, 400);
        const result = await provisionStaff(db, studioId, members, inviteRedirect(req.headers.get("Origin")));
        if (result.invited === 0) {
          return json({ error: result.errors[0]?.message ?? "Could not invite staff", staffErrors: result.errors }, 500);
        }
        await auditAdds(db, studioId, actor, members, result.errors, req);
        return json({ ok: true, invited: result.invited, emailed: result.emailed, staffErrors: result.errors });
      }

      const staffId = String(f.staffId ?? "");
      const { data: target } = await db.from("studio_staff")
        .select("id, role, profile_id, is_active").eq("id", staffId).eq("studio_id", studioId).maybeSingle();
      if (!target) return json({ error: "That person is not on this studio's team" }, 404);
      if (target.role === "owner") return json({ error: "The owner cannot be changed here" }, 409);
      if (target.profile_id === user.id) return json({ error: "You cannot change your own access" }, 409);
      const { data: account } = await db.auth.admin.getUserById(target.profile_id as string);
      const targetEmail = account?.user?.email ?? null;

      if (step === "staff_resend") {
        if (!targetEmail) return json({ error: "No email on file for that person" }, 409);
        if (target.is_active === false) return json({ error: "Turn them back on before sending an invite" }, 409);
        if (account?.user?.last_sign_in_at) {
          return json({ error: "They have already signed in. They can use Forgot password on the sign-in screen." }, 409);
        }
        const { error: resendErr } = await db.auth.admin.inviteUserByEmail(targetEmail, {
          redirectTo: inviteRedirect(req.headers.get("Origin")),
        });
        if (resendErr) return json({ error: resendErr.message }, 500);
        await auditStaff(db, {
          studioId, actor, action: "staff.invite_resent", targetId: staffId, targetEmail, req,
          description: `Sent the invite again to ${targetEmail}`, severity: "info",
        });
        return json({ ok: true });
      }

      if (step === "staff_set_role") {
        const role = WIZARD_ROLE_MAP[String(f.role ?? "")];
        if (!role) return json({ error: "Pick teacher, front desk or admin" }, 400);
        if (role === target.role) return json({ ok: true, unchanged: true });
        const logErr = await auditStaff(db, {
          studioId, actor, action: "staff.role_changed", targetId: staffId, targetEmail, req,
          description: `Changed ${targetEmail ?? "a team member"} from ${target.role} to ${role}`,
          previous: { role: target.role }, next: { role }, severity: "warning",
        });
        if (logErr) return json({ error: "Nothing changed: the change could not be recorded. Try again." }, 500);
        const { error: roleErr } = await db.from("studio_staff")
          .update({ role }).eq("id", staffId).eq("studio_id", studioId);
        if (roleErr) {
          await auditStaff(db, {
            studioId, actor, action: "staff.role_change_failed", targetId: staffId, targetEmail, req,
            description: `Role change for ${targetEmail ?? "a team member"} did not apply: ${roleErr.message}`, severity: "warning",
          });
          return json({ error: roleErr.message }, 500);
        }
        return json({ ok: true });
      }

      // staff_set_active. Turning someone off is the offboarding step: access ends on their
      // next request (every policy checks is_active live), and the classes they were due to
      // teach are handed back as "no teacher set" so nothing runs under a removed person.
      const active = f.active === true;
      if (active === (target.is_active !== false)) return json({ ok: true, unchanged: true });
      const load = active ? { classes: 0, rules: 0 } : await teachingLoad(db, studioId, target.profile_id as string);
      const logErr = await auditStaff(db, {
        studioId, actor, req, targetId: staffId, targetEmail,
        action: active ? "staff.access_restored" : "staff.access_removed",
        description: active
          ? `Turned ${targetEmail ?? "a team member"} back on as ${target.role}`
          : `Turned off ${targetEmail ?? "a team member"} (${target.role}). ${load.classes} upcoming classes and ${load.rules} weekly slots handed back with no teacher set`,
        previous: { is_active: !active, role: target.role },
        next: { is_active: active, unassigned_classes: load.classes, unassigned_rules: load.rules },
        severity: "warning",
      });
      if (logErr) return json({ error: "Nothing changed: the change could not be recorded. Try again." }, 500);
      const { error: activeErr } = await db.from("studio_staff")
        .update({ is_active: active }).eq("id", staffId).eq("studio_id", studioId);
      if (activeErr) {
        await auditStaff(db, {
          studioId, actor, req, targetId: staffId, targetEmail, action: "staff.access_change_failed",
          description: `Access change for ${targetEmail ?? "a team member"} did not apply: ${activeErr.message}`, severity: "warning",
        });
        return json({ error: activeErr.message }, 500);
      }
      let handoverError: string | null = null;
      if (!active) {
        const now = new Date().toISOString();
        const { error: occErr } = await db.from("class_occurrences").update({ teacher_id: null })
          .eq("studio_id", studioId).eq("teacher_id", target.profile_id).eq("is_cancelled", false).gt("starts_at", now);
        const { error: ruleErr } = await db.from("schedule_rules").update({ teacher_id: null })
          .eq("studio_id", studioId).eq("teacher_id", target.profile_id);
        handoverError = occErr?.message ?? ruleErr?.message ?? null;
        if (handoverError) {
          await auditStaff(db, {
            studioId, actor, req, targetId: staffId, targetEmail, action: "staff.class_handover_failed",
            description: `Access was removed for ${targetEmail ?? "a team member"} but their classes could not be unassigned: ${handoverError}`,
            severity: "warning",
          });
        }
      }
      return json({ ok: true, unassignedClasses: load.classes, unassignedRules: load.rules, handoverError });
    }

    const enumStep = toEnumStep(step);
    if (!enumStep) return json({ error: `Unknown step "${step}"` }, 400);

    // Skips move the resume cursor but don't complete anything.
    if (payload.skip) {
      if (studioId) await recordProgress(db, studioId, enumStep, false);
      return json({ ok: true, studioId: studioId ?? null, skipped: true });
    }

    if (!studioId) {
      if (step !== "studio") {
        return json({ error: "Complete the Studio Info step first" }, 409);
      }
      const name = String(f.studioName ?? "My Studio");
      const { data: studio, error } = await db
        .from("studios")
        .insert({
          name,
          slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
          description: f.studioDesc ?? null,
          timezone: f.timezone ?? "America/New_York",
          currency: f.currency ?? "USD",
          brand_primary_color: f.primaryColor ?? undefined,
          brand_secondary_color: f.secondaryColor ?? undefined,
        })
        .select("id")
        .single();
      if (error) return json({ error: error.message }, 500);
      studioId = studio.id as string;

      await db.from("studio_staff").insert({ studio_id: studioId, profile_id: user.id, role: "owner" });
      await recordProgress(db, studioId, "studio_info", true);
      return json({ ok: true, studioId });
    }

    switch (step) {
      case "studio":
        await db.from("studios").update({
          name: f.studioName ?? undefined,
          description: f.studioDesc ?? null,
          timezone: f.timezone ?? undefined,
          currency: f.currency ?? undefined,
        }).eq("id", studioId);
        break;

      case "branding":
        await db.from("studios").update({
          brand_primary_color: f.primaryColor ?? undefined,
          brand_secondary_color: f.secondaryColor ?? undefined,
        }).eq("id", studioId);
        break;

      case "location": {
        const rooms = String(f.rooms ?? "").split(",").map((r) => r.trim()).filter(Boolean);
        const amenities = String(f.amenities ?? "").split(",").map((a) => a.trim()).filter(Boolean);
        // One location per wizard run: update the primary if it exists.
        const { data: existing } = await db
          .from("locations")
          .select("id")
          .eq("studio_id", studioId)
          .order("is_primary", { ascending: false })
          .limit(1)
          .maybeSingle();
        const row = {
          studio_id: studioId,
          name: "Main Location",
          address_line1: f.address ?? null,
          rooms,
          amenities,
          is_primary: true,
        };
        if (existing) await db.from("locations").update(row).eq("id", existing.id);
        else await db.from("locations").insert(row);
        break;
      }

      case "offerings":
      case "pricing": {
        // Pricing step: check the membership terms before writing anything, so
        // a refused step saves nothing. The starter plan is the studio's first
        // membership type; its billing and class limit never change once it
        // exists (00042: someone may be buying it).
        const dropInEarly = dollarsToCents(f.classPrice);
        const packClassesEarly = intOf(f.packClasses, 10);
        const unlimitedEarly = f.memberUnlimited === true || f.memberUnlimited === "true";
        const membership = {
          studio_id: studioId,
          name: String(f.memberName ?? "").trim() || (unlimitedEarly ? "Unlimited" : "Membership"),
          billing_cycle: String(f.memberCycle ?? "monthly"),
          classes_per_cycle: unlimitedEarly ? null : packClassesEarly,
          price_cents: f.memberPrice ? dollarsToCents(f.memberPrice) : (unlimitedEarly ? dropInEarly * 12 : dropInEarly * packClassesEarly),
        };
        // The wizard's own starter pack and plan, recorded when it created them
        // (00042). A pack or plan the owner made in Classes and pricing is
        // never overwritten here.
        const { data: progress } = step === "pricing"
          ? await db.from("studio_onboarding").select("starter_pack_type_id, starter_membership_type_id")
              .eq("studio_id", studioId).maybeSingle()
          : { data: null };
        const { data: starter } = progress?.starter_membership_type_id
          ? await db.from("membership_types").select("id, billing_cycle, classes_per_cycle")
              .eq("id", progress.starter_membership_type_id).maybeSingle()
          : { data: null };
        if (starter && (starter.billing_cycle !== membership.billing_cycle
                        || (starter.classes_per_cycle ?? null) !== membership.classes_per_cycle)) {
          return json({
            error: "Your membership already exists, so its billing and class limit cannot change here. Add a new membership in Classes and pricing (/manage/offerings) and turn the old one off.",
          }, 409);
        }

        // Same value rules as 00042, checked up front so a bad value saves nothing.
        const durationEarly = intOf(f.classDuration, 60);
        const capacityEarly = intOf(f.classCapacity, 20);
        const negative = [f.classPrice, f.packPrice, f.memberPrice]
          .some((v) => v !== undefined && v !== null && v !== "" && dollarsToCents(v) < 0);
        if (durationEarly < 1 || capacityEarly < 1 || negative
            || (step === "pricing" && packClassesEarly < 1)
            || (step === "pricing" && membership.classes_per_cycle !== null && membership.classes_per_cycle < 1)) {
          return json({ error: "Length, capacity and class counts must be at least 1, and prices cannot be negative." }, 400);
        }

        // Upsert a starter offering keyed by slug; set price on the pricing step.
        const style = String(f.classStyle ?? "Class");
        const offeringName = String(f.className ?? "").trim()
          || style.charAt(0).toUpperCase() + style.slice(1);
        const { error: offeringErr } = await db.from("offerings").upsert(
          {
            studio_id: studioId,
            name: offeringName,
            slug: slugify(style),
            style,
            level: f.classLevel ?? "all",
            duration_minutes: durationEarly,
            capacity: capacityEarly,
            drop_in_price_cents: f.classPrice ? dollarsToCents(f.classPrice) : null,
          },
          { onConflict: "studio_id,slug" },
        );
        // Checked: 00042 rejects zero or negative length, capacity and price.
        if (offeringErr) return json({ error: offeringErr.message }, 400);

        if (step === "pricing") {
          const dropIn = dollarsToCents(f.classPrice);
          const packClasses = intOf(f.packClasses, 10);
          const unlimited = f.memberUnlimited === true || f.memberUnlimited === "true";
          // Starter pricing: the owner refines these in Classes and pricing (/manage/offerings). Use the
          // owner's numbers when given, else derive from the drop-in price.
          // Re-saving the step updates the starter plan instead of duplicating it.
          const pack = {
            studio_id: studioId,
            name: String(f.packName ?? "").trim() || `${packClasses}-Class Pack`,
            class_count: packClasses,
            price_cents: f.packPrice ? dollarsToCents(f.packPrice) : dropIn * packClasses,
            validity_days: 90,
          };
          // Checked: 00042 rejects negative prices and zero-class packs.
          const packId = progress?.starter_pack_type_id ?? null;
          const { data: savedPack, error: packErr } = packId
            ? await db.from("class_pack_types").update(pack).eq("id", packId).select("id").maybeSingle()
            : await db.from("class_pack_types").insert(pack).select("id").single();
          if (packErr) return json({ error: packErr.message }, 400);

          // The starter plan is the studio's first membership type. Its billing
          // and class limit never change once it exists (00042: someone may be
          // buying it), so a re-save with new terms is refused with a pointer
          // to Classes and pricing; name and price update in place.
          let membershipId = starter?.id ?? null;
          if (!starter) {
            const { data: inserted, error: insErr } = await db.from("membership_types")
              .insert(membership).select("id").single();
            if (insErr) return json({ error: insErr.message }, 400);
            membershipId = inserted?.id ?? null;
          } else if (starter.billing_cycle === membership.billing_cycle
                     && (starter.classes_per_cycle ?? null) === membership.classes_per_cycle) {
            const { error: updErr } = await db.from("membership_types")
              .update({ name: membership.name, price_cents: membership.price_cents })
              .eq("id", starter.id);
            if (updErr) return json({ error: updErr.message }, 400);
          }
          const starterIds = {
            starter_pack_type_id: savedPack?.id ?? packId,
            starter_membership_type_id: membershipId,
          };
          const { data: onboardingRow } = await db.from("studio_onboarding").select("id")
            .eq("studio_id", studioId).maybeSingle();
          const { error: idsErr } = onboardingRow
            ? await db.from("studio_onboarding").update(starterIds).eq("id", onboardingRow.id)
            : await db.from("studio_onboarding").insert({ studio_id: studioId, ...starterIds });
          if (idsErr) return json({ error: idsErr.message }, 500);
        }
        break;
      }

      case "schedule": {
        // Resolve the offering: by id, then slug, then the studio's first.
        const { data: offerings } = await db
          .from("offerings")
          .select("id, slug, duration_minutes")
          .eq("studio_id", studioId);
        const wanted = String(f.schedOffering ?? "");
        const offering = (offerings ?? []).find((o) => o.id === wanted)
          ?? (offerings ?? []).find((o) => o.slug === wanted)
          ?? offerings?.[0];
        if (!offering) {
          return json({ error: "Create a class offering before scheduling" }, 409);
        }

        // Anchor to the primary location, creating one if the step was skipped.
        let { data: location } = await db
          .from("locations")
          .select("id")
          .eq("studio_id", studioId)
          .order("is_primary", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!location) {
          const { data: created, error: locErr } = await db
            .from("locations")
            .insert({ studio_id: studioId, name: "Main Location", is_primary: true })
            .select("id")
            .single();
          if (locErr) return json({ error: locErr.message }, 500);
          location = created;
        }

        const day = DAYS.includes(String(f.schedDay ?? "")) ? String(f.schedDay) : "monday";
        const startTime = /^\d{2}:\d{2}/.test(String(f.schedTime ?? "")) ? String(f.schedTime) : "09:00";
        const duration = offering.duration_minutes ?? 60;
        const [h, m] = startTime.split(":").map(Number);
        // Wrap past midnight: generate_rule_occurrences reads an end at or
        // before the start as an overnight class and uses the class length.
        const endMinutes = (h * 60 + m + duration) % (24 * 60);
        const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

        // Only accept a teacher who is actually staff of this studio.
        let teacherId: string | null = null;
        if (f.schedTeacher) {
          const { data: teacherRow } = await db
            .from("studio_staff")
            .select("profile_id")
            .eq("studio_id", studioId)
            .eq("profile_id", String(f.schedTeacher))
            .maybeSingle();
          teacherId = teacherRow?.profile_id ?? null;
        }

        // This step edits the studio's first recurring class. Re-saving it,
        // even with a different class, day or time, updates that same rule, so
        // an abandoned slot never stays on the schedule (classes follow the
        // rule via the 00036 trigger).
        const rule = {
          studio_id: studioId,
          offering_id: offering.id,
          location_id: location.id,
          teacher_id: teacherId,
          recurrence: "weekly",
          day_of_week: day,
          start_time: startTime,
          end_time: endTime,
          room: f.schedRoom ? String(f.schedRoom) : null,
          is_active: true,
        };
        const { data: existingRule } = await db
          .from("schedule_rules")
          .select("id")
          .eq("studio_id", studioId)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        const { error: ruleErr } = existingRule
          ? await db.from("schedule_rules").update(rule).eq("id", existingRule.id)
          : await db.from("schedule_rules").insert(rule);
        if (ruleErr) return json({ error: ruleErr.message }, 500);
        break;
      }

      case "staff": {
        // Preferred payload: data.staff = [{name, email, role, payType, payRate}].
        // Legacy single-teacher fields are still accepted.
        const members: StaffInput[] = Array.isArray(f.staff)
          ? (f.staff as StaffInput[])
          : f.teacherEmail
            ? [{
                name: String(f.teacherName ?? ""),
                email: String(f.teacherEmail ?? ""),
                role: String(f.teacherRole ?? "teacher"),
                payType: String(f.payType ?? ""),
                payRate: f.payRate as string,
              }]
            : [];
        if (members.length === 0) {
          return json({ error: "Add at least one staff member (or skip this step)" }, 400);
        }
        const result = await provisionStaff(db, studioId, members, inviteRedirect(req.headers.get("Origin")));
        if (result.invited === 0) {
          return json({ error: result.errors[0]?.message ?? "Could not invite staff", staffErrors: result.errors }, 500);
        }
        await auditAdds(db, studioId, { id: user.id, email: user.email }, members, result.errors, req);
        await recordProgress(db, studioId, "staff", true);
        return json({ ok: true, studioId, invited: result.invited, emailed: result.emailed, staffErrors: result.errors });
      }

      case "waivers": {
        const content = String(f.waiverContent ?? "").trim();
        if (!content) {
          return json({ error: "Waiver content is required (or skip this step)" }, 400);
        }
        const name = String(f.waiverName ?? "").trim() || "Liability Waiver";
        // Re-saving revises the wizard's waiver rather than adding a second
        // required-for-booking template.
        const { data: existingWaiver } = await db
          .from("waiver_templates")
          .select("id, version")
          .eq("studio_id", studioId)
          .eq("name", name)
          .limit(1)
          .maybeSingle();
        const { error: waiverErr } = existingWaiver
          ? await db.from("waiver_templates")
              .update({ content, version: (existingWaiver.version ?? 1) + 1 })
              .eq("id", existingWaiver.id)
          : await db.from("waiver_templates").insert({
              studio_id: studioId,
              name,
              content,
              required_for_booking: true,
              created_by: user.id,
            });
        if (waiverErr) return json({ error: waiverErr.message }, 500);
        break;
      }

      case "launch": {
        // Booking page and Discover listing (00038). A trigger keeps them
        // consistent: listing publishes the page, unpublishing unlists.
        const launchPatch: Record<string, boolean> = {};
        if (typeof f.pageLive === "boolean") launchPatch.page_live = f.pageLive;
        if (typeof f.discoverable === "boolean") launchPatch.discoverable = f.discoverable;
        if (Object.keys(launchPatch).length > 0) {
          const { error: launchErr } = await db.from("studios").update(launchPatch).eq("id", studioId);
          if (launchErr) return json({ error: launchErr.message }, 500);
        }
        break;
      }

      // import/stripe step saves just mark wizard progress — the real work
      // happens in the import-members and stripe-connect functions, which set
      // has_imported_data / has_stripe themselves.
      default:
        break;
    }

    await recordProgress(db, studioId, enumStep, true);
    return json({ ok: true, studioId });
  } catch (err) {
    console.error("[onboarding] error:", err);
    return json({ error: (err as Error).message ?? "Onboarding step failed" }, 500);
  }
});
