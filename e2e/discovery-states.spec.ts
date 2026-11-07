import { expect, test } from "@playwright/test";
import { mockSupabase } from "./helpers";

test("empty discovery gives an honest next step and refreshes without an account", async ({ page }) => {
  await mockSupabase(page);
  let requests = 0;
  await page.route("**/rest/v1/rpc/discover_classes", route => {
    requests++;
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.goto("/discover");
  await expect(page.getByRole("heading", { name: "No studio classes are listed here yet" })).toBeVisible();
  await expect(page.getByText(/Signing up does not unlock more listings/)).toBeVisible();
  await expect(page.getByText(/More studios are opening soon/)).toHaveCount(0);
  const before = requests;
  await page.getByRole("button", { name: "Check again", exact: true }).click();
  await expect.poll(() => requests).toBeGreaterThan(before);
  await page.getByRole("button", { name: "About: Why can't I find my studio or a class?" }).click();
  await expect(page.getByRole("dialog")).toContainText("does not mean your studio has closed");
  await expect(page.getByRole("dialog")).toBeFocused();
  await page.getByRole("dialog").press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "About: Why can't I find my studio or a class?" })).toBeFocused();
});

test("unmatched search can be cleared without confusing it with no inventory", async ({ page }) => {
  await mockSupabase(page);
  await page.goto("/discover");
  await page.getByRole("textbox", { name: "Search classes" }).fill("nothing matches this");
  await expect(page.getByRole("heading", { name: "No classes match", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  await expect(page.getByRole("link", { name: /Vinyasa Flow/ })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Search classes" })).toHaveValue("");
});

test("failed discovery does not claim empty inventory and recovers on retry", async ({ page }) => {
  await mockSupabase(page);
  let fail = true;
  await page.route("**/rest/v1/rpc/discover_classes", route => route.fulfill({
    status: fail ? 503 : 200, contentType: "application/json",
    body: fail ? JSON.stringify({ message: "Synthetic service unavailable" }) : "[]",
  }));
  await page.goto("/discover");
  await expect(page.getByRole("heading", { name: "We couldn't load classes" })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "No studio classes are listed here yet" })).toHaveCount(0);
  fail = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No studio classes are listed here yet" })).toBeVisible();
});
