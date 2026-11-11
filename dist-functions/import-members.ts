// tandava main d8c1b43, bundled single file (dashboard deploy 2026-11-11)
// supabase/functions/import-members/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
var supabaseUrl = Deno.env.get("SUPABASE_URL");
var serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
var anonKey = Deno.env.get("SUPABASE_ANON_KEY");
var VALID_SOURCES = ["mindbody", "walla", "arketa", "momoyoga", "generic_csv"];
var STAFF_ROLES = ["owner", "admin", "front_desk"];
var MAX_RECORDS = 5e3;
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
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "Not authenticated" }, 401);
  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const records = Array.isArray(payload.records) ? payload.records : [];
  if (records.length === 0) return json({ error: "No records to import" }, 400);
  if (records.length > MAX_RECORDS) {
    return json({ error: `Too many records (max ${MAX_RECORDS} per request)` }, 413);
  }
  const db = createClient(supabaseUrl, serviceKey);
  let staffQuery = db.from("studio_staff").select("studio_id, role").eq("profile_id", user.id).eq("is_active", true).in("role", STAFF_ROLES);
  if (payload.studioId) staffQuery = staffQuery.eq("studio_id", payload.studioId);
  const { data: staffRows, error: staffError } = await staffQuery.limit(1);
  if (staffError) return json({ error: staffError.message }, 500);
  if (!staffRows || staffRows.length === 0) {
    return json({ error: "Not authorized to import for this studio" }, 403);
  }
  const studioId = staffRows[0].studio_id;
  const source = VALID_SOURCES.includes(payload.source ?? "") ? payload.source : "generic_csv";
  const { data: job } = await db.from("import_jobs").insert({
    studio_id: studioId,
    source,
    status: "processing",
    import_type: "clients",
    file_name: payload.fileName ?? null,
    total_rows: records.length,
    created_by: user.id,
    started_at: (/* @__PURE__ */ new Date()).toISOString()
  }).select("id").single();
  let success = 0;
  let skipped = 0;
  const errors = [];
  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const rowNum = i + 1;
    const email = (rec.email ?? "").trim().toLowerCase();
    try {
      if (!email || !rec.first_name?.trim() || !rec.last_name?.trim()) {
        errors.push({ row: rowNum, message: "Missing required field (first/last name or email)" });
        continue;
      }
      let profileId = null;
      let createdProfile = false;
      const { data: existing } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
      if (existing) {
        profileId = existing.id;
      } else {
        const { data: created, error: createErr } = await db.auth.admin.createUser({
          email,
          email_confirm: true,
          password: crypto.randomUUID(),
          user_metadata: { first_name: rec.first_name, last_name: rec.last_name }
        });
        if (createErr || !created?.user) {
          errors.push({ row: rowNum, message: createErr?.message ?? "Could not create account" });
          continue;
        }
        profileId = created.user.id;
        createdProfile = true;
      }
      if (createdProfile) {
        await db.from("profiles").update({
          phone: rec.phone || null,
          date_of_birth: rec.date_of_birth || null,
          pronouns: rec.pronouns || null,
          emergency_contact_name: rec.emergency_contact_name || null,
          emergency_contact_phone: rec.emergency_contact_phone || null
        }).eq("id", profileId);
      }
      const tags = (rec.tags ?? "").split(/[;,|]/).map((t) => t.trim()).filter(Boolean);
      const { error: linkErr } = await db.from("studio_members").upsert(
        { studio_id: studioId, profile_id: profileId, notes: rec.notes || null, tags, source: "import" },
        { onConflict: "studio_id,profile_id", ignoreDuplicates: true }
      );
      if (linkErr) {
        errors.push({ row: rowNum, message: linkErr.message });
        continue;
      }
      success++;
    } catch (err) {
      errors.push({ row: rowNum, message: err.message ?? "Unknown error" });
    }
  }
  skipped = records.length - success - errors.length;
  const status = errors.length === 0 ? "completed" : success > 0 ? "partial" : "failed";
  if (success > 0) {
    const { data: onboarding } = await db.from("studio_onboarding").select("id, completed_steps").eq("studio_id", studioId).maybeSingle();
    if (onboarding) {
      const steps = new Set(onboarding.completed_steps ?? []);
      steps.add("import");
      await db.from("studio_onboarding").update({ completed_steps: [...steps], has_imported_data: true }).eq("id", onboarding.id);
    }
  }
  if (job?.id) {
    await db.from("import_jobs").update({
      status,
      processed_rows: records.length,
      success_rows: success,
      error_rows: errors.length,
      skipped_rows: skipped,
      errors,
      completed_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", job.id);
  }
  return json({
    jobId: job?.id ?? null,
    total: records.length,
    success,
    skipped,
    errors
  });
});
