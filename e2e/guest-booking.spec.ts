import { expect, test } from "@playwright/test";
import { CLASS_ROW, mockSupabase } from "./helpers";

// E2E-01 (UI half): a signed-out visitor finds a class, opens the studio, and is sent to
// sign up with the class carried through. The server half (book_class_auto) is covered by
// supabase/tests/037_book_auto.test.sql.
test("guest finds a class and is sent to sign up with the class preserved", async ({ page }) => {
  await mockSupabase(page);

  await page.goto("/discover");
  await expect(page.getByText("Vinyasa Flow").first()).toBeVisible();

  await page.getByText("Vinyasa Flow").first().click();
  await expect(page).toHaveURL(new RegExp(`/s/test-studio\\?class=${CLASS_ROW.occurrence_id}`));
  await expect(page.getByRole("heading", { name: "Test Studio" }).first()).toBeVisible();

  const book = page.getByRole("link", { name: /book/i }).first();
  await expect(book).toBeVisible();
  await book.click();

  await expect(page).toHaveURL(/\/auth\/register/);
  const next = new URL(page.url()).searchParams.get("next");
  expect(next).toBe(`/s/test-studio?class=${CLASS_ROW.occurrence_id}`);
});

test("open redirect in next= is ignored", async ({ page }) => {
  await mockSupabase(page);
  await page.goto("/auth/login?next=https://evil.example/steal");
  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.getByRole("button", { name: /sign in|log in/i }).first()).toBeVisible();
});
