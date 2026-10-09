import { expect, test, type Page } from "@playwright/test";

// LP-5: a signed-in owner edits a class price and adds a weekly class on the live
// backend. Supabase is mocked; the writes are captured and checked. The database
// side (RLS, triggers, class generation) is supabase/tests/022_catalog_edits.test.sql.

const OWNER = { id: "0a000000-0000-0000-0000-00000000000a", email: "owner@test.dev" };
const STUDIO_ID = "11111111-1111-1111-1111-111111111111";
const OFFERING = {
  id: "33333333-3333-3333-3333-333333333333", name: "Vinyasa Flow", slug: "vinyasa", description: null,
  duration_minutes: 75, capacity: 20, drop_in_price_cents: 2200, is_active: true,
};
const LOCATION = { id: "44444444-4444-4444-4444-444444444444", name: "Main Location", is_primary: true };

async function signInAsOwner(page: Page) {
  const session = {
    access_token: "e2e-token", refresh_token: "e2e-refresh", token_type: "bearer",
    expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: OWNER.id, email: OWNER.email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {} },
  };
  await page.addInitScript((s) => window.localStorage.setItem("sb-127-auth-token", JSON.stringify(s)), session);
}

type Write = { method: string; table: string; url: string; body: Record<string, unknown> };

async function mockOwnerBackend(page: Page, writes: Write[]) {
  await page.route("http://127.0.0.1:54321/**", async (route) => {
    const req = route.request();
    const url = req.url();
    const headers = { "access-control-allow-origin": "*", "content-type": "application/json" };
    const json = (body: unknown) => route.fulfill({ status: 200, headers, body: JSON.stringify(body) });
    if (req.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    }
    const table = new URL(url).pathname.split("/rest/v1/")[1] ?? "";
    if (req.method() === "PATCH" || req.method() === "POST") {
      if (!table.startsWith("rpc/")) {
        writes.push({ method: req.method(), table, url, body: req.postDataJSON() });
        return json(req.method() === "PATCH" ? [{ id: OFFERING.id }] : []);
      }
    }
    if (url.includes("/auth/v1/user")) return json(session());
    if (url.includes("/auth/v1/")) return json({});
    if (table === "profiles") return json({ id: OWNER.id, email: OWNER.email, first_name: "Olive", last_name: "Owner", role: "student" });
    if (table === "rpc/get_my_effective_role") return json("owner");
    if (table === "rpc/get_my_admin_studio") return json([{ studio_id: STUDIO_ID, name: "Test Studio", slug: "test-studio", currency: "usd", staff_role: "owner" }]);
    if (table === "rpc/get_studio_staff_names") return json([{ profile_id: OWNER.id, name: "Olive Owner", role: "owner" }]);
    if (table === "offerings") return json([OFFERING]);
    if (table === "locations") return json([LOCATION]);
    return json([]);
  });
  function session() {
    return { id: OWNER.id, email: OWNER.email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {} };
  }
}

test("owner changes a class price", async ({ page }) => {
  const writes: Write[] = [];
  await signInAsOwner(page);
  await mockOwnerBackend(page, writes);

  await page.goto("/manage/offerings");
  await expect(page.getByRole("heading", { name: "Classes and pricing" })).toBeVisible();
  await expect(page.getByText("Drop-in: $22.00")).toBeVisible();

  await page.getByRole("button", { name: "Edit Vinyasa Flow" }).click();
  await page.getByLabel("Drop-in price").fill("25");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved", { exact: true }).first()).toBeVisible();

  const write = writes.find((w) => w.table.startsWith("offerings"));
  expect(write?.method).toBe("PATCH");
  expect(write?.body).toMatchObject({ drop_in_price_cents: 2500, duration_minutes: 75, capacity: 20 });
  expect(write?.url).toContain(`id=eq.${OFFERING.id}`);
  expect(write?.url).toContain(`studio_id=eq.${STUDIO_ID}`);
});

test("owner adds a weekly class with the end time from the class length", async ({ page }) => {
  const writes: Write[] = [];
  await signInAsOwner(page);
  await mockOwnerBackend(page, writes);

  await page.goto("/manage/schedule");
  await expect(page.getByRole("heading", { name: "Weekly schedule" })).toBeVisible();
  await page.getByRole("button", { name: "Add weekly class" }).click();
  await page.getByLabel("Starts").fill("18:00");
  await expect(page.getByText("Ends 7:15pm (75 min)")).toBeVisible();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Schedule saved").first()).toBeVisible();

  const write = writes.find((w) => w.table.startsWith("schedule_rules"));
  expect(write?.method).toBe("POST");
  expect(write?.body).toMatchObject({
    studio_id: STUDIO_ID, offering_id: OFFERING.id, location_id: LOCATION.id,
    day_of_week: "monday", start_time: "18:00", end_time: "19:15", recurrence: "weekly", teacher_id: null,
  });
});
