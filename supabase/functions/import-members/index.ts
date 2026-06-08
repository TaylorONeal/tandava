/**
 * Member Import (Supabase Edge Function)
 *
 * Persists the validated/deduped client records the import wizard produces
 * (src/lib/connectors) into a studio's roster:
 *   - creates an auth user per new member (the handle_new_user trigger then
 *     creates their profile), or reuses an existing profile by email
 *   - fills in the rest of the profile (phone, DOB, emergency contacts, …)
 *   - links the member to the studio via studio_members (dedupes on the
 *     UNIQUE(studio_id, profile_id) constraint)
 *   - writes an import_jobs row for history
 *
 * Auth: the caller's JWT must belong to studio staff (owner/admin/front_desk).
 * The studio is derived from that staff row unless studioId is provided.
 *
 * Deploy: supabase functions deploy import-members
 * (uses SUPABASE_SERVICE_ROLE_KEY, set automatically in the Supabase runtime)
 *
 * NOTE: integration-test against a live project before production use; large
 * imports should be chunked by the client to stay within the function timeout.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const VALID_SOURCES = ["mindbody", "walla", "arketa", "momoyoga", "generic_csv"];
const STAFF_ROLES = ["owner", "admin", "front_desk"];
const MAX_RECORDS = 5000;

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

interface MemberRecord {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  pronouns?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  tags?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Identify the caller.
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "Not authenticated" }, 401);

  let payload: { studioId?: string; source?: string; fileName?: string; records?: MemberRecord[] };
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

  // Authorize: the caller must be studio staff. Derive the studio if not given.
  let staffQuery = db
    .from("studio_staff")
    .select("studio_id, role")
    .eq("profile_id", user.id)
    .in("role", STAFF_ROLES);
  if (payload.studioId) staffQuery = staffQuery.eq("studio_id", payload.studioId);

  const { data: staffRows, error: staffError } = await staffQuery.limit(1);
  if (staffError) return json({ error: staffError.message }, 500);
  if (!staffRows || staffRows.length === 0) {
    return json({ error: "Not authorized to import for this studio" }, 403);
  }
  const studioId = staffRows[0].studio_id as string;
  const source = VALID_SOURCES.includes(payload.source ?? "") ? payload.source! : "generic_csv";

  // Open the import job.
  const { data: job } = await db
    .from("import_jobs")
    .insert({
      studio_id: studioId,
      source,
      status: "processing",
      import_type: "clients",
      file_name: payload.fileName ?? null,
      total_rows: records.length,
      created_by: user.id,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  let success = 0;
  let skipped = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const rowNum = i + 1;
    const email = (rec.email ?? "").trim().toLowerCase();

    try {
      if (!email || !rec.first_name?.trim() || !rec.last_name?.trim()) {
        errors.push({ row: rowNum, message: "Missing required field (first/last name or email)" });
        continue;
      }

      // Find an existing profile by email, else create the auth user.
      let profileId: string | null = null;
      const { data: existing } = await db
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        profileId = existing.id as string;
      } else {
        const { data: created, error: createErr } = await db.auth.admin.createUser({
          email,
          email_confirm: true,
          password: crypto.randomUUID(),
          user_metadata: { first_name: rec.first_name, last_name: rec.last_name },
        });
        if (createErr || !created?.user) {
          errors.push({ row: rowNum, message: createErr?.message ?? "Could not create account" });
          continue;
        }
        profileId = created.user.id;
      }

      // Fill in the rest of the profile (the trigger only sets name + email).
      await db
        .from("profiles")
        .update({
          phone: rec.phone || null,
          date_of_birth: rec.date_of_birth || null,
          pronouns: rec.pronouns || null,
          emergency_contact_name: rec.emergency_contact_name || null,
          emergency_contact_phone: rec.emergency_contact_phone || null,
        })
        .eq("id", profileId);

      // Link to the studio (dedupe on UNIQUE(studio_id, profile_id)).
      const tags = (rec.tags ?? "").split(/[;,|]/).map((t) => t.trim()).filter(Boolean);
      const { error: linkErr } = await db
        .from("studio_members")
        .upsert(
          { studio_id: studioId, profile_id: profileId, notes: rec.notes || null, tags },
          { onConflict: "studio_id,profile_id", ignoreDuplicates: true },
        );
      if (linkErr) {
        errors.push({ row: rowNum, message: linkErr.message });
        continue;
      }

      success++;
    } catch (err) {
      errors.push({ row: rowNum, message: (err as Error).message ?? "Unknown error" });
    }
  }

  skipped = records.length - success - errors.length;
  const status = errors.length === 0 ? "completed" : success > 0 ? "partial" : "failed";

  if (job?.id) {
    await db
      .from("import_jobs")
      .update({
        status,
        processed_rows: records.length,
        success_rows: success,
        error_rows: errors.length,
        skipped_rows: skipped,
        errors,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);
  }

  return json({
    jobId: job?.id ?? null,
    total: records.length,
    success,
    skipped,
    errors,
  });
});
