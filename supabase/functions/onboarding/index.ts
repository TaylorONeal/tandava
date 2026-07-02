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
      .select("id, name, description, timezone, currency, brand_primary_color, brand_secondary_color, stripe_account_id, stripe_onboarding_complete, discoverable")
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

async function provisionStaff(
  db: SupabaseClient,
  studioId: string,
  members: StaffInput[],
): Promise<{ invited: number; errors: { email: string; message: string }[] }> {
  let invited = 0;
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
        });
        if (invite?.user) {
          profileId = invite.user.id;
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

      const payType = PAY_TYPES.includes(String(member.payType ?? "")) ? member.payType : null;
      const { error: linkErr } = await db.from("studio_staff").upsert(
        {
          studio_id: studioId,
          profile_id: profileId,
          role,
          pay_type: payType,
          pay_rate_cents: member.payRate ? dollarsToCents(member.payRate) : null,
          can_sub: member.role === "sub" || undefined,
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

  return { invited, errors };
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

  // Resolve the caller's studio (as owner), creating it on the 'studio' step.
  const { data: ownerRow } = await db
    .from("studio_staff")
    .select("studio_id")
    .eq("profile_id", user.id)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  let studioId = ownerRow?.studio_id as string | undefined;

  try {
    if (step === "status") {
      return json(await buildStatus(db, studioId));
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
        // Upsert a starter offering keyed by slug; set price on the pricing step.
        const style = String(f.classStyle ?? "Class");
        const offeringName = String(f.className ?? "").trim()
          || style.charAt(0).toUpperCase() + style.slice(1);
        await db.from("offerings").upsert(
          {
            studio_id: studioId,
            name: offeringName,
            slug: slugify(style),
            style,
            level: f.classLevel ?? "all",
            duration_minutes: intOf(f.classDuration, 60),
            capacity: intOf(f.classCapacity, 20),
            drop_in_price_cents: f.classPrice ? dollarsToCents(f.classPrice) : null,
          },
          { onConflict: "studio_id,slug" },
        );

        if (step === "pricing") {
          const dropIn = dollarsToCents(f.classPrice);
          const packClasses = intOf(f.packClasses, 10);
          const unlimited = f.memberUnlimited === true || f.memberUnlimited === "true";
          // Starter pricing — the owner refines these in Financials. Use the
          // owner's numbers when given, else derive from the drop-in price.
          // Re-saving the step updates the starter plan instead of duplicating it.
          const pack = {
            studio_id: studioId,
            name: String(f.packName ?? "").trim() || `${packClasses}-Class Pack`,
            class_count: packClasses,
            price_cents: f.packPrice ? dollarsToCents(f.packPrice) : dropIn * packClasses,
            validity_days: 90,
          };
          const { data: existingPack } = await db
            .from("class_pack_types").select("id").eq("studio_id", studioId)
            .order("created_at").limit(1).maybeSingle();
          if (existingPack) await db.from("class_pack_types").update(pack).eq("id", existingPack.id);
          else await db.from("class_pack_types").insert(pack);

          const membership = {
            studio_id: studioId,
            name: String(f.memberName ?? "").trim() || (unlimited ? "Unlimited" : "Membership"),
            billing_cycle: String(f.memberCycle ?? "monthly"),
            classes_per_cycle: unlimited ? null : packClasses,
            price_cents: f.memberPrice ? dollarsToCents(f.memberPrice) : (unlimited ? dropIn * 12 : dropIn * packClasses),
          };
          const { data: existingMembership } = await db
            .from("membership_types").select("id").eq("studio_id", studioId)
            .order("created_at").limit(1).maybeSingle();
          if (existingMembership) await db.from("membership_types").update(membership).eq("id", existingMembership.id);
          else await db.from("membership_types").insert(membership);
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
        // Clamp to end-of-day: a TIME end before the start would read as a
        // negative-length class downstream.
        const endMinutes = Math.min(h * 60 + m + duration, 24 * 60 - 1);
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

        // Re-saving the step updates the matching rule instead of stacking a
        // duplicate recurring class on the same slot.
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
        };
        const { data: existingRule } = await db
          .from("schedule_rules")
          .select("id")
          .eq("studio_id", studioId)
          .eq("offering_id", offering.id)
          .eq("day_of_week", day)
          .eq("start_time", startTime)
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
        const result = await provisionStaff(db, studioId, members);
        if (result.invited === 0) {
          return json({ error: result.errors[0]?.message ?? "Could not invite staff", staffErrors: result.errors }, 500);
        }
        await recordProgress(db, studioId, "staff", true);
        return json({ ok: true, studioId, invited: result.invited, staffErrors: result.errors });
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
        if (typeof f.discoverable === "boolean") {
          await db.from("studios").update({ discoverable: f.discoverable }).eq("id", studioId);
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
