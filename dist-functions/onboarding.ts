// tandava main d8c1b43, bundled single file (dashboard deploy 2026-11-11)
// supabase/functions/onboarding/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
var supabaseUrl = Deno.env.get("SUPABASE_URL");
var serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
var anonKey = Deno.env.get("SUPABASE_ANON_KEY");
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
function slugify(s) {
  return (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `s-${Date.now()}`;
}
var dollarsToCents = (v) => Math.round(parseFloat(String(v ?? "0")) * 100) || 0;
var intOf = (v, d = 0) => parseInt(String(v ?? d), 10) || d;
var STEP_ORDER = [
  "studio_info",
  "location",
  "branding",
  "offerings",
  "schedule",
  "pricing",
  "staff",
  "waivers",
  "import",
  "stripe",
  "launch"
];
var toEnumStep = (clientKey) => {
  const key = clientKey === "studio" ? "studio_info" : clientKey;
  return STEP_ORDER.includes(key) ? key : null;
};
var toClientKey = (enumStep) => enumStep === "studio_info" ? "studio" : enumStep;
var FLAG_BY_STEP = {
  location: "has_location",
  branding: "has_branding",
  offerings: "has_offerings",
  schedule: "has_schedule",
  pricing: "has_pricing",
  staff: "has_staff",
  waivers: "has_waiver"
};
async function recordProgress(db, studioId, enumStep, completed) {
  const idx = STEP_ORDER.indexOf(enumStep);
  const nextStep = STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
  const { data: existing } = await db.from("studio_onboarding").select("id, completed_steps").eq("studio_id", studioId).maybeSingle();
  const steps = new Set(existing?.completed_steps ?? []);
  if (completed) steps.add(enumStep);
  const row = {
    completed_steps: [...steps],
    current_step: nextStep
  };
  const flag = FLAG_BY_STEP[enumStep];
  if (completed && flag) row[flag] = true;
  if (completed && enumStep === "launch") {
    row.is_launched = true;
    row.completed_at = (/* @__PURE__ */ new Date()).toISOString();
  }
  if (existing) {
    await db.from("studio_onboarding").update(row).eq("id", existing.id);
  } else {
    await db.from("studio_onboarding").insert({ studio_id: studioId, ...row });
  }
}
async function buildStatus(db, studioId) {
  if (!studioId) return { ok: true, studioId: null };
  const [studioRes, progressRes, offeringsRes, staffRes, locationsRes] = await Promise.all([
    db.from("studios").select("id, name, description, timezone, currency, brand_primary_color, brand_secondary_color, stripe_account_id, stripe_onboarding_complete, discoverable, page_live").eq("id", studioId).single(),
    db.from("studio_onboarding").select("completed_steps, current_step, is_launched").eq("studio_id", studioId).maybeSingle(),
    db.from("offerings").select("id, name").eq("studio_id", studioId).order("created_at"),
    db.from("studio_staff").select("profile_id, role, profiles(first_name, last_name, display_name)").eq("studio_id", studioId).eq("is_active", true),
    db.from("locations").select("address_line1, rooms, is_primary").eq("studio_id", studioId)
  ]);
  const studio = studioRes.data;
  const progress = progressRes.data;
  const rooms = (locationsRes.data ?? []).flatMap(
    (loc) => (Array.isArray(loc.rooms) ? loc.rooms : []).map(
      (r) => typeof r === "string" ? r : r?.name ?? ""
    )
  ).filter(Boolean);
  const staff = (staffRes.data ?? []).map((s) => {
    const p = s.profiles;
    const name = p?.display_name || [p?.first_name, p?.last_name].filter(Boolean).join(" ");
    return { id: s.profile_id, name: name || "Staff member", role: s.role };
  });
  const completed = new Set(progress?.completed_steps ?? []);
  let currentStep = progress?.current_step ?? "studio_info";
  let cursor = STEP_ORDER.indexOf(currentStep);
  while (cursor >= 0 && cursor < STEP_ORDER.length - 1 && completed.has(STEP_ORDER[cursor])) {
    cursor++;
  }
  if (cursor >= 0) currentStep = STEP_ORDER[cursor];
  return {
    ok: true,
    studioId,
    studio: studio ? {
      name: studio.name,
      description: studio.description,
      timezone: studio.timezone,
      currency: studio.currency,
      primaryColor: studio.brand_primary_color,
      secondaryColor: studio.brand_secondary_color,
      discoverable: studio.discoverable,
      pageLive: studio.page_live,
      address: (locationsRes.data ?? []).find((l) => l.is_primary)?.address_line1 ?? locationsRes.data?.[0]?.address_line1 ?? null
    } : null,
    completedSteps: (progress?.completed_steps ?? []).map(toClientKey),
    currentStep: toClientKey(currentStep),
    isLaunched: progress?.is_launched ?? false,
    stripeConnected: Boolean(studio?.stripe_onboarding_complete),
    stripeAccountId: studio?.stripe_account_id ?? null,
    offerings: offeringsRes.data ?? [],
    staff,
    rooms
  };
}
var WIZARD_ROLE_MAP = {
  teacher: "teacher",
  sub: "teacher",
  admin: "admin",
  front_desk: "front_desk"
};
var PAY_TYPES = ["per_class", "revenue_share", "hourly", "salary"];
async function provisionStaff(db, studioId, members) {
  let invited = 0;
  const errors = [];
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
      let profileId = null;
      const { data: existing } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
      if (existing) {
        profileId = existing.id;
      } else {
        const meta = { first_name: firstName, last_name: lastName };
        const { data: invite, error: inviteErr } = await db.auth.admin.inviteUserByEmail(email, {
          data: meta
        });
        if (invite?.user) {
          profileId = invite.user.id;
        } else {
          const { data: created, error: createErr } = await db.auth.admin.createUser({
            email,
            email_confirm: true,
            password: crypto.randomUUID(),
            user_metadata: meta
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
          can_sub: member.role === "sub" || void 0
        },
        { onConflict: "studio_id,profile_id" }
      );
      if (linkErr) {
        errors.push({ email, message: linkErr.message });
        continue;
      }
      invited++;
    } catch (err) {
      errors.push({ email, message: err.message ?? "Unknown error" });
    }
  }
  return { invited, errors };
}
var DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: "Not authenticated" }, 401);
  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const step = String(payload.step ?? "");
  const f = payload.data ?? {};
  const db = createClient(supabaseUrl, serviceKey);
  const { data: ownerRow } = await db.from("studio_staff").select("studio_id").eq("profile_id", user.id).eq("role", "owner").eq("is_active", true).limit(1).maybeSingle();
  let studioId = ownerRow?.studio_id;
  try {
    if (step === "status") {
      return json(await buildStatus(db, studioId));
    }
    const enumStep = toEnumStep(step);
    if (!enumStep) return json({ error: `Unknown step "${step}"` }, 400);
    if (payload.skip) {
      if (studioId) await recordProgress(db, studioId, enumStep, false);
      return json({ ok: true, studioId: studioId ?? null, skipped: true });
    }
    if (!studioId) {
      if (step !== "studio") {
        return json({ error: "Complete the Studio Info step first" }, 409);
      }
      const name = String(f.studioName ?? "My Studio");
      const { data: studio, error } = await db.from("studios").insert({
        name,
        slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
        description: f.studioDesc ?? null,
        timezone: f.timezone ?? "America/New_York",
        currency: f.currency ?? "USD",
        brand_primary_color: f.primaryColor ?? void 0,
        brand_secondary_color: f.secondaryColor ?? void 0
      }).select("id").single();
      if (error) return json({ error: error.message }, 500);
      studioId = studio.id;
      await db.from("studio_staff").insert({ studio_id: studioId, profile_id: user.id, role: "owner" });
      await recordProgress(db, studioId, "studio_info", true);
      return json({ ok: true, studioId });
    }
    switch (step) {
      case "studio":
        await db.from("studios").update({
          name: f.studioName ?? void 0,
          description: f.studioDesc ?? null,
          timezone: f.timezone ?? void 0,
          currency: f.currency ?? void 0
        }).eq("id", studioId);
        break;
      case "branding":
        await db.from("studios").update({
          brand_primary_color: f.primaryColor ?? void 0,
          brand_secondary_color: f.secondaryColor ?? void 0
        }).eq("id", studioId);
        break;
      case "location": {
        const rooms = String(f.rooms ?? "").split(",").map((r) => r.trim()).filter(Boolean);
        const amenities = String(f.amenities ?? "").split(",").map((a) => a.trim()).filter(Boolean);
        const { data: existing } = await db.from("locations").select("id").eq("studio_id", studioId).order("is_primary", { ascending: false }).limit(1).maybeSingle();
        const row = {
          studio_id: studioId,
          name: "Main Location",
          address_line1: f.address ?? null,
          rooms,
          amenities,
          is_primary: true
        };
        if (existing) await db.from("locations").update(row).eq("id", existing.id);
        else await db.from("locations").insert(row);
        break;
      }
      case "offerings":
      case "pricing": {
        const dropInEarly = dollarsToCents(f.classPrice);
        const packClassesEarly = intOf(f.packClasses, 10);
        const unlimitedEarly = f.memberUnlimited === true || f.memberUnlimited === "true";
        const membership = {
          studio_id: studioId,
          name: String(f.memberName ?? "").trim() || (unlimitedEarly ? "Unlimited" : "Membership"),
          billing_cycle: String(f.memberCycle ?? "monthly"),
          classes_per_cycle: unlimitedEarly ? null : packClassesEarly,
          price_cents: f.memberPrice ? dollarsToCents(f.memberPrice) : unlimitedEarly ? dropInEarly * 12 : dropInEarly * packClassesEarly
        };
        const { data: progress } = step === "pricing" ? await db.from("studio_onboarding").select("starter_pack_type_id, starter_membership_type_id").eq("studio_id", studioId).maybeSingle() : { data: null };
        const { data: starter } = progress?.starter_membership_type_id ? await db.from("membership_types").select("id, billing_cycle, classes_per_cycle").eq("id", progress.starter_membership_type_id).maybeSingle() : { data: null };
        if (starter && (starter.billing_cycle !== membership.billing_cycle || (starter.classes_per_cycle ?? null) !== membership.classes_per_cycle)) {
          return json({
            error: "Your membership already exists, so its billing and class limit cannot change here. Add a new membership in Classes and pricing (/manage/offerings) and turn the old one off."
          }, 409);
        }
        const durationEarly = intOf(f.classDuration, 60);
        const capacityEarly = intOf(f.classCapacity, 20);
        const negative = [f.classPrice, f.packPrice, f.memberPrice].some((v) => v !== void 0 && v !== null && v !== "" && dollarsToCents(v) < 0);
        if (durationEarly < 1 || capacityEarly < 1 || negative || step === "pricing" && packClassesEarly < 1 || step === "pricing" && membership.classes_per_cycle !== null && membership.classes_per_cycle < 1) {
          return json({ error: "Length, capacity and class counts must be at least 1, and prices cannot be negative." }, 400);
        }
        const style = String(f.classStyle ?? "Class");
        const offeringName = String(f.className ?? "").trim() || style.charAt(0).toUpperCase() + style.slice(1);
        const { error: offeringErr } = await db.from("offerings").upsert(
          {
            studio_id: studioId,
            name: offeringName,
            slug: slugify(style),
            style,
            level: f.classLevel ?? "all",
            duration_minutes: durationEarly,
            capacity: capacityEarly,
            drop_in_price_cents: f.classPrice ? dollarsToCents(f.classPrice) : null
          },
          { onConflict: "studio_id,slug" }
        );
        if (offeringErr) return json({ error: offeringErr.message }, 400);
        if (step === "pricing") {
          const dropIn = dollarsToCents(f.classPrice);
          const packClasses = intOf(f.packClasses, 10);
          const unlimited = f.memberUnlimited === true || f.memberUnlimited === "true";
          const pack = {
            studio_id: studioId,
            name: String(f.packName ?? "").trim() || `${packClasses}-Class Pack`,
            class_count: packClasses,
            price_cents: f.packPrice ? dollarsToCents(f.packPrice) : dropIn * packClasses,
            validity_days: 90
          };
          const packId = progress?.starter_pack_type_id ?? null;
          const { data: savedPack, error: packErr } = packId ? await db.from("class_pack_types").update(pack).eq("id", packId).select("id").maybeSingle() : await db.from("class_pack_types").insert(pack).select("id").single();
          if (packErr) return json({ error: packErr.message }, 400);
          let membershipId = starter?.id ?? null;
          if (!starter) {
            const { data: inserted, error: insErr } = await db.from("membership_types").insert(membership).select("id").single();
            if (insErr) return json({ error: insErr.message }, 400);
            membershipId = inserted?.id ?? null;
          } else if (starter.billing_cycle === membership.billing_cycle && (starter.classes_per_cycle ?? null) === membership.classes_per_cycle) {
            const { error: updErr } = await db.from("membership_types").update({ name: membership.name, price_cents: membership.price_cents }).eq("id", starter.id);
            if (updErr) return json({ error: updErr.message }, 400);
          }
          const starterIds = {
            starter_pack_type_id: savedPack?.id ?? packId,
            starter_membership_type_id: membershipId
          };
          const { data: onboardingRow } = await db.from("studio_onboarding").select("id").eq("studio_id", studioId).maybeSingle();
          const { error: idsErr } = onboardingRow ? await db.from("studio_onboarding").update(starterIds).eq("id", onboardingRow.id) : await db.from("studio_onboarding").insert({ studio_id: studioId, ...starterIds });
          if (idsErr) return json({ error: idsErr.message }, 500);
        }
        break;
      }
      case "schedule": {
        const { data: offerings } = await db.from("offerings").select("id, slug, duration_minutes").eq("studio_id", studioId);
        const wanted = String(f.schedOffering ?? "");
        const offering = (offerings ?? []).find((o) => o.id === wanted) ?? (offerings ?? []).find((o) => o.slug === wanted) ?? offerings?.[0];
        if (!offering) {
          return json({ error: "Create a class offering before scheduling" }, 409);
        }
        let { data: location } = await db.from("locations").select("id").eq("studio_id", studioId).order("is_primary", { ascending: false }).limit(1).maybeSingle();
        if (!location) {
          const { data: created, error: locErr } = await db.from("locations").insert({ studio_id: studioId, name: "Main Location", is_primary: true }).select("id").single();
          if (locErr) return json({ error: locErr.message }, 500);
          location = created;
        }
        const day = DAYS.includes(String(f.schedDay ?? "")) ? String(f.schedDay) : "monday";
        const startTime = /^\d{2}:\d{2}/.test(String(f.schedTime ?? "")) ? String(f.schedTime) : "09:00";
        const duration = offering.duration_minutes ?? 60;
        const [h, m] = startTime.split(":").map(Number);
        const endMinutes = (h * 60 + m + duration) % (24 * 60);
        const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
        let teacherId = null;
        if (f.schedTeacher) {
          const { data: teacherRow } = await db.from("studio_staff").select("profile_id").eq("studio_id", studioId).eq("profile_id", String(f.schedTeacher)).maybeSingle();
          teacherId = teacherRow?.profile_id ?? null;
        }
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
          is_active: true
        };
        const { data: existingRule } = await db.from("schedule_rules").select("id").eq("studio_id", studioId).order("created_at", { ascending: true }).limit(1).maybeSingle();
        const { error: ruleErr } = existingRule ? await db.from("schedule_rules").update(rule).eq("id", existingRule.id) : await db.from("schedule_rules").insert(rule);
        if (ruleErr) return json({ error: ruleErr.message }, 500);
        break;
      }
      case "staff": {
        const members = Array.isArray(f.staff) ? f.staff : f.teacherEmail ? [{
          name: String(f.teacherName ?? ""),
          email: String(f.teacherEmail ?? ""),
          role: String(f.teacherRole ?? "teacher"),
          payType: String(f.payType ?? ""),
          payRate: f.payRate
        }] : [];
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
        const { data: existingWaiver } = await db.from("waiver_templates").select("id, version").eq("studio_id", studioId).eq("name", name).limit(1).maybeSingle();
        const { error: waiverErr } = existingWaiver ? await db.from("waiver_templates").update({ content, version: (existingWaiver.version ?? 1) + 1 }).eq("id", existingWaiver.id) : await db.from("waiver_templates").insert({
          studio_id: studioId,
          name,
          content,
          required_for_booking: true,
          created_by: user.id
        });
        if (waiverErr) return json({ error: waiverErr.message }, 500);
        break;
      }
      case "launch": {
        const launchPatch = {};
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
    return json({ error: err.message ?? "Onboarding step failed" }, 500);
  }
});
