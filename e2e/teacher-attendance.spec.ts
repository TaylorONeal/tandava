import { expect, test, type Page } from "@playwright/test";

async function mockTeacher(page: Page, role = "teacher") {
  const user = { id: "0a000000-0000-0000-0000-00000000000c", email: "teacher@test.dev", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {} };
  await page.addInitScript(user => localStorage.setItem("sb-127-auth-token", JSON.stringify({ access_token: "e2e-token", refresh_token: "e2e-refresh", token_type: "bearer", expires_at: Math.floor(Date.now()/1000)+3600, expires_in: 3600, user })), user);
  const state = { rejectLogout: false, reads: 0, checkedIn: false, calls: 0, failSchedule: false, failRoster: false, reject: false, loseResponse: false, delay: 0 };
  await page.route("http://127.0.0.1:54321/**", async route => {
    const req = route.request();
    const url = req.url();
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
    const json = (body: unknown, status = 200) => route.fulfill({ status, headers, contentType: "application/json", body: JSON.stringify(body) });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (url.includes("/rpc/get_my_effective_role")) return json(role);
    if (url.includes("/rest/v1/profiles")) return json({ ...user, first_name: "Taylor", last_name: "Teacher" });
    if (url.includes("/rpc/get_my_teaching_classes") || url.includes("/rpc/get_teaching_roster")) state.reads++;
    if (url.includes("/rpc/get_my_teaching_classes")) return state.failSchedule ? json({ message: "Schedule unavailable" }, 500) : json([{
      occurrence_id: "11111111-1111-1111-1111-111111111111", offering_name: "Assigned Vinyasa", studio_name: "Real Studio", studio_timezone: "America/Chicago",
      location_name: "Downtown", room: "Main", starts_at: new Date(Date.now()+600000).toISOString(), ends_at: new Date(Date.now()+4200000).toISOString(),
      capacity: 12, is_cancelled: false, booked: 1, checked_in: state.checkedIn ? 1 : 0,
    }]);
    if (url.includes("/rpc/get_teaching_roster")) {
      expect(req.postDataJSON()).toEqual({ p_occurrence_id: "11111111-1111-1111-1111-111111111111" });
      return state.failRoster ? json({ message: "Roster unavailable" }, 500) : json([
        { booking_id: "22222222-2222-2222-2222-222222222222", student_name: "Alex Student", status: state.checkedIn ? "checked_in" : "confirmed" },
        { booking_id: "33333333-3333-3333-3333-333333333333", student_name: "Waiting Student", status: "waitlisted" },
      ]);
    }
    if (url.includes("/rpc/check_in_teaching_booking")) {
      state.calls++;
      expect(req.postDataJSON()).toEqual({ p_booking_id: "22222222-2222-2222-2222-222222222222" });
      if (state.delay) await new Promise(resolve => setTimeout(resolve, state.delay));
      if (state.reject) return json({ message: "Check-in is not open yet" }, 400);
      state.checkedIn = true;
      if (state.loseResponse) return route.abort("failed");
      return json({ id: "22222222-2222-2222-2222-222222222222", status: "checked_in" });
    }
    if (url.includes("/auth/v1/logout")) return state.rejectLogout ? json({ message: "Sign out unavailable" }, 500) : json({});
    if (url.includes("/auth/v1/user")) return json(user);
    return json([]);
  });
  return state;
}

async function openRoster(page: Page) {
  await page.goto("/teach");
  await expect(page.getByRole("heading", { name: "Teaching dashboard" })).toBeVisible();
  await page.getByRole("button", { name: "View roster for Assigned Vinyasa" }).click();
  await expect(page.getByText("Alex Student", { exact: true })).toBeVisible();
}

test("teacher records real attendance, prevents duplicate clicks and preserves server errors", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await mockTeacher(page);
  state.reject = true;
  await openRoster(page);
  await expect(page.getByRole("button", { name: "Check in Waiting Student" })).toHaveCount(0);
  await page.getByRole("button", { name: "Check in Alex Student" }).click();
  await expect(page.getByText("Could not confirm check-in").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Check in Alex Student" })).toBeEnabled();
  state.reject = false; state.delay = 1000;
  await page.getByRole("button", { name: "Check in Alex Student" }).dblclick();
  await expect(page.getByRole("button", { name: "Check in Alex Student" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Checked in", { exact: true })).toBeVisible();
  expect(state.calls).toBe(2);
  await page.reload();
  await page.getByRole("button", { name: "View roster for Assigned Vinyasa" }).click();
  await expect(page.getByText("Checked in", { exact: true })).toBeVisible();
});

test("lost check-in response recovers committed attendance without a second mutation", async ({ page }) => {
  const state = await mockTeacher(page); state.loseResponse = true;
  await openRoster(page);
  await page.getByRole("button", { name: "Check in Alex Student" }).click();
  await expect(page.getByText("Checked in", { exact: true })).toBeVisible();
  await expect(page.getByText("Attendance confirmed from roster").first()).toBeVisible();
  expect(state.calls).toBe(1);
});

test("teacher can retry schedule and roster failures", async ({ page }) => {
  const state = await mockTeacher(page); state.failSchedule = true;
  await page.goto("/teach/schedule");
  await expect(page.getByText("Couldn't load your teaching schedule.")).toBeVisible();
  state.failSchedule = false;
  await page.getByRole("button", { name: "Retry schedule" }).click();
  state.failRoster = true;
  await page.getByRole("button", { name: "View roster for Assigned Vinyasa" }).click();
  await expect(page.getByText("Couldn't load this roster.")).toBeVisible();
  state.failRoster = false;
  await page.getByRole("button", { name: "Retry roster" }).click();
  await expect(page.getByText("Alex Student", { exact: true })).toBeVisible();
});

test("live teacher routes do not expose sample earnings or unsupported controls", async ({ page }) => {
  await mockTeacher(page);
  await page.goto("/teach/earnings");
  await expect(page.getByRole("heading", { name: "Not available yet" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Earnings", exact: true })).toHaveCount(0);
  await expect(page.getByText("Oxatl Yoga", { exact: true })).toHaveCount(0);
});

test("student cannot enter the teacher portal", async ({ page }) => {
  const state = await mockTeacher(page, "student");
  await page.goto("/teach");
  await expect(page).toHaveURL(/\/(discover)?$/);
  await expect(page.getByRole("heading", { name: "Teaching dashboard" })).toHaveCount(0);
  expect(state.reads).toBe(0);
});


test("teacher sign-out reports errors and navigates only after success", async ({ page }) => {
  const state = await mockTeacher(page); state.rejectLogout = true;
  await page.goto("/teach");
  await page.getByRole("button", { name: "Teacher account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByText("Couldn't sign out").first()).toBeVisible();
  await expect(page).toHaveURL(/\/teach$/);
  state.rejectLogout = false;
  await page.getByRole("button", { name: "Teacher account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
});
