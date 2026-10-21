import { expect, test, type Page } from "@playwright/test";

async function studioSession(page: Page) {
  const user = {
    id: "0a000000-0000-0000-0000-00000000000a", email: "owner@test.dev",
    aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {},
  };
  await page.addInitScript(user => {
    if (sessionStorage.getItem("e2e-owner-seeded")) return;
    sessionStorage.setItem("e2e-owner-seeded", "yes");
    localStorage.setItem("sb-127-auth-token", JSON.stringify({
      access_token: "e2e-token", refresh_token: "e2e-refresh", token_type: "bearer",
      expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user,
    }));
  }, user);
  const state: { logoutAttempts: number; rejectLogout: boolean; timezone: string | null; savedTimezone: string | null } = {
    logoutAttempts: 0, rejectLogout: false, timezone: null, savedTimezone: null,
  };
  await page.route("http://127.0.0.1:54321/**", async route => {
    const request = route.request();
    const url = request.url();
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
    const json = (body: unknown, status = 200) => route.fulfill({ status, headers, contentType: "application/json", body: JSON.stringify(body) });
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (url.includes("/auth/v1/logout")) {
      state.logoutAttempts++;
      return json(state.rejectLogout ? { message: "Please retry sign out" } : {}, state.rejectLogout ? 503 : 200);
    }
    if (url.includes("/auth/v1/user")) return json(user);
    if (url.includes("/rpc/get_my_effective_role")) return json("owner");
    if (url.includes("/rest/v1/profiles")) return json({ ...user, first_name: "Olive", last_name: "Owner" });
    if (url.includes("/rpc/get_my_admin_studio")) return json([{ studio_id: "11111111-1111-1111-1111-111111111111", name: "Test Studio", slug: "test-studio", currency: "usd", staff_role: "owner" }]);
    if (url.includes("/functions/v1/onboarding")) {
      const body = request.postDataJSON();
      if (body.step === "studio") {
        state.savedTimezone = body.data.timezone;
        return json({ ok: true });
      }
      return json({ studioId: state.timezone ? "11111111-1111-1111-1111-111111111111" : null, studio: state.timezone ? { timezone: state.timezone } : undefined, completedSteps: [], currentStep: "studio" });
    }
    return json([]);
  });
  return state;
}

test("phone setup has named steps and keeps the selected step within the screen", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await studioSession(page);
  await page.goto("/manage/onboarding");
  const steps = page.getByRole("navigation", { name: "Studio setup steps" });
  await expect(steps.getByRole("button", { name: "Studio Info", exact: true })).toBeVisible();
  await expect(steps.getByRole("button", { name: "Studio Info", exact: true })).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("link", { name: "Student View", exact: true })).toHaveAttribute("href", "/discover");
  await page.screenshot({ path: testInfo.outputPath("onboarding-phone-after.png"), fullPage: true });
  await steps.getByRole("button", { name: "Location", exact: true }).click();
  await expect(page.getByLabel("Street Address")).toBeVisible();
  await expect(steps.getByRole("button", { name: "Location", exact: true })).toHaveAttribute("aria-current", "step");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await steps.getByRole("button", { name: "Studio Info", exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: testInfo.outputPath("onboarding-desktop-after.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
});

test("studio setup searches global time zones, saves the choice and restores the stored zone", async ({ page }) => {
  const state = await studioSession(page);
  await page.goto("/manage/onboarding");
  const localZone = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  await expect(page.getByLabel("Timezone", { exact: true })).toHaveText(localZone.replace(/_/g, " ").replace(/\//g, " / "));
  await page.getByLabel("Timezone", { exact: true }).click();
  await page.getByRole("combobox", { name: "Search time zones" }).fill("Bali");
  await page.getByRole("option", { name: "Asia / Makassar" }).click();
  await page.getByLabel("Studio Name").fill("Synthetic Studio");
  await page.getByRole("button", { name: "Save & Continue" }).click();
  await expect(page.getByLabel("Street Address")).toBeVisible();
  expect(state.savedTimezone).toBe("Asia/Makassar");
  state.timezone = "Europe/London";
  await page.reload();
  await expect(page.getByLabel("Timezone", { exact: true })).toHaveText("Europe / London");
  await page.getByRole("button", { name: "Branding", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Branding", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Upload Logo" })).toHaveCount(0);
});

test("phone navigation scrolls to Settings and closes after choosing a route", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await studioSession(page);
  await page.goto("/manage/onboarding");
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  const navigation = page.getByRole("navigation", { name: "Studio navigation" });
  const settings = navigation.getByRole("link", { name: "Settings", exact: true });
  await settings.scrollIntoViewIfNeeded();
  await expect(settings).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath("studio-navigation-phone-after.png") });
  await settings.click();
  await expect(page).toHaveURL(/\/manage\/settings$/);
  await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeVisible();
});

test("studio sign out ends the session and a failed request remains retryable", async ({ page }) => {
  const state = await studioSession(page);
  state.rejectLogout = true;
  await page.goto("/manage/onboarding");
  await page.getByRole("button", { name: "Open user menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
  await expect(page.getByText("Couldn't sign out").first()).toBeVisible();
  expect(state.logoutAttempts).toBe(1);
  await expect(page).toHaveURL(/\/manage\/onboarding$/);
  state.rejectLogout = false;
  await page.getByRole("button", { name: "Open user menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
  expect(state.logoutAttempts).toBe(2);
  expect(await page.evaluate(() => localStorage.getItem("sb-127-auth-token"))).toBeNull();
  await page.goto("/manage/onboarding");
  await expect(page).toHaveURL(/\/auth\/login$/);
});
