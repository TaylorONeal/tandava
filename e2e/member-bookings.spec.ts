import { expect, test } from "@playwright/test";

test("member sees their bookings and cancels only after server confirmation", async ({ page }) => {
  const user = { id: "0a000000-0000-0000-0000-00000000000b", email: "member@test.dev", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {} };
  await page.addInitScript((user) => localStorage.setItem("sb-127-auth-token", JSON.stringify({
    access_token: "e2e-token", refresh_token: "e2e-refresh", token_type: "bearer", expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600, user,
  })), user);
  let cancelled = false;
  let rejectCancellation = true;
  const booking = {
    booking_id: "22222222-2222-2222-2222-222222222222", occurrence_id: "33333333-3333-3333-3333-333333333333",
    status: "confirmed", starts_at: new Date(Date.now() + 86400000).toISOString(),
    ends_at: new Date(Date.now() + 90000000).toISOString(), is_cancelled: false,
    offering_name: "Member Vinyasa", teacher_name: "Sam", room: "Main", location_name: "Downtown",
    studio_name: "Test Studio", studio_slug: "test-studio", studio_timezone: "America/Chicago", cancellation_minutes: 120,
  };
  await page.route("http://127.0.0.1:54321/**", async route => {
    const req = route.request();
    const url = req.url();
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
    const json = (body: unknown, status = 200) => route.fulfill({ status, headers, contentType: "application/json", body: JSON.stringify(body) });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (url.includes("/rpc/get_my_effective_role")) return json("student");
    if (url.includes("/rest/v1/profiles")) return json({ ...user, first_name: "Test", last_name: "Member" });
    if (url.includes("/rpc/get_my_bookings")) return json(cancelled ? [] : [booking]);
    if (url.includes("/rpc/cancel_booking")) {
      expect(req.postDataJSON()).toEqual({ p_booking_id: booking.booking_id });
      if (rejectCancellation) return json({ message: "Please retry cancellation" }, 400);
      cancelled = true;
      return json({ ...booking, status: "cancelled" });
    }
    if (url.includes("/auth/v1/user")) return json(user);
    return json([]);
  });
  await page.goto("/my-schedule");
  await expect(page.getByRole("heading", { name: "Member Vinyasa" })).toBeVisible();
  await expect(page.getByText("Power Vinyasa Flow", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Cancel Booking", exact: true }).click();
  await expect(page.getByText("Please retry cancellation").first()).toBeVisible();
  expect(cancelled).toBe(false);
  rejectCancellation = false;
  await page.getByRole("button", { name: "Cancel Booking", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No upcoming bookings" })).toBeVisible();
  expect(cancelled).toBe(true);
});
