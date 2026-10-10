import { expect, test } from "@playwright/test";
import { mockSupabase } from "./helpers";

// LP-9: the policies are reachable, and sign-up links to them (it linked to /terms
// and /waiver, neither of which existed).
for (const [path, heading] of [["/terms", "Terms of Service"], ["/privacy", "Privacy Policy"], ["/refunds", "Refund Policy"]]) {
  test(`${path} renders`, async ({ page }) => {
    await mockSupabase(page);
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByText("hello@purafieldstudio.com").first()).toBeVisible();
  });
}

test("sign-up links to the terms and privacy pages", async ({ page }) => {
  await mockSupabase(page);
  await page.goto("/auth/register");
  await expect(page.locator('a[href="/terms"]').first()).toBeVisible();
  await expect(page.locator('a[href="/privacy"]').first()).toBeVisible();
  await expect(page.locator('a[href="/waiver"]')).toHaveCount(0);
});

test("Google sign-up needs the terms box first", async ({ page }) => {
  await mockSupabase(page);
  let oauthStarted = false;
  page.on("request", (r) => { if (r.url().includes("/auth/v1/authorize")) oauthStarted = true; });
  await page.goto("/auth/register");
  await page.getByRole("button", { name: /google/i }).first().click();
  await expect(page.getByText("Terms Required").first()).toBeVisible();
  await page.waitForTimeout(500);
  expect(oauthStarted).toBe(false);
  await expect(page).toHaveURL(/\/auth\/register/);
});
