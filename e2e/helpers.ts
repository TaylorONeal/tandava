import type { Page } from "@playwright/test";

export const STUDIO = {
  studio: {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Test Studio",
    slug: "test-studio",
    description: "A studio for tests",
    primary_color: null,
    secondary_color: null,
    font: null,
    timezone: "America/Chicago",
    currency: "usd",
  },
  offerings: [],
  memberships: [],
  packs: [],
};

export const CLASS_ROW = {
  occurrence_id: "22222222-2222-2222-2222-222222222222",
  starts_at: new Date(Date.now() + 36 * 3600_000).toISOString(),
  ends_at: new Date(Date.now() + 37 * 3600_000).toISOString(),
  offering_name: "Vinyasa Flow",
  style: "Vinyasa",
  level: "All levels",
  is_heated: false,
  duration_minutes: 60,
  drop_in_price_cents: 2200,
  currency: "usd",
  spots_left: 8,
  teacher_name: "Sam",
  location_name: "Main room",
  city: "Austin",
  state: "TX",
  studio_slug: "test-studio",
  studio_name: "Test Studio",
  studio_timezone: "America/Chicago",
  studio_primary_color: null,
};

/** Mock the Supabase RPCs the guest path touches. Anything else answers an empty 200. */
export async function mockSupabase(page: Page) {
  await page.route("http://127.0.0.1:54321/**", async (route) => {
    const url = route.request().url();
    const json = (body: unknown) =>
      route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
    if (route.request().method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    }
    if (url.includes("/rpc/discover_classes")) return json([CLASS_ROW]);
    if (url.includes("/rpc/get_studio_storefront")) return json(STUDIO);
    if (url.includes("/rpc/get_public_schedule")) return json([]);
    if (url.includes("/auth/v1/")) return json({});
    return json([]);
  });
}
