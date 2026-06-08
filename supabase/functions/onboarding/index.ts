/**
 * Onboarding Provisioning (Supabase Edge Function)
 *
 * Persists the studio setup wizard (/manage/onboarding) step by step. Each call
 * is idempotent: it ensures the caller's studio exists (creating it + linking
 * the caller as owner on the first 'studio' step) and upserts the entities a
 * step produces. Values like pack/membership pricing are sensible starters the
 * owner refines later in Financials.
 *
 * Request: { step: "studio"|"location"|"branding"|"offerings"|"pricing"|..., data: { ...formFields } }
 *
 * Deploy: supabase functions deploy onboarding
 *
 * NOTE: integration-test against a live project before production use.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: "Not authenticated" }, 401);

  let payload: { step?: string; data?: Record<string, unknown> };
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
        await db.from("locations").insert({
          studio_id: studioId,
          name: "Main Location",
          address_line1: f.address ?? null,
          rooms,
        });
        break;
      }

      case "offerings":
      case "pricing": {
        // Upsert a starter offering keyed by slug; set price on the pricing step.
        const style = String(f.classStyle ?? "Class");
        const offeringName = style.charAt(0).toUpperCase() + style.slice(1);
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
          // Starter pricing — the owner refines these in Financials.
          await db.from("class_pack_types").insert({
            studio_id: studioId,
            name: `${packClasses}-Class Pack`,
            class_count: packClasses,
            price_cents: dropIn * packClasses,
            validity_days: 90,
          });
          await db.from("membership_types").insert({
            studio_id: studioId,
            name: unlimited ? "Unlimited" : "Membership",
            billing_cycle: String(f.memberCycle ?? "monthly"),
            classes_per_cycle: unlimited ? null : packClasses,
            price_cents: unlimited ? dropIn * 12 : dropIn * packClasses,
          });
        }
        break;
      }

      // schedule / staff / waivers / import / stripe / launch are acknowledged
      // here; they're handled by their own dedicated flows (import-members,
      // stripe Connect onboarding) or future steps.
      default:
        break;
    }

    return json({ ok: true, studioId });
  } catch (err) {
    console.error("[onboarding] error:", err);
    return json({ error: (err as Error).message ?? "Onboarding step failed" }, 500);
  }
});
