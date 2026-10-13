import { expect, test, type Page } from "@playwright/test";

// LP-1d: the owner cancels one class from /manage/schedule. They see who is
// affected and what happens to each payment first, then one confirm calls the
// cancel-class edge function with their note. Supabase is mocked; the database
// side is supabase/tests/023_class_cancel.test.sql.

const OWNER = { id: "0a000000-0000-0000-0000-00000000000a", email: "owner@test.dev" };
const STUDIO_ID = "11111111-1111-1111-1111-111111111111";
const OCC_ID = "55555555-5555-5555-5555-555555555555";
const OFFERING = {
  id: "33333333-3333-3333-3333-333333333333", name: "Vinyasa Flow", slug: "vinyasa", description: null,
  duration_minutes: 60, capacity: 20, drop_in_price_cents: 2200, is_active: true,
};
const startsAt = new Date(Date.now() + 2 * 86_400_000).toISOString();
const PEOPLE = [
  { booking_id: "b1", profile_id: "p1", name: "Ana Diaz", first_name: "Ana", email: "ana@test.dev", status: "confirmed", source: "pack", refund_cents: 0 },
  { booking_id: "b2", profile_id: "p2", name: "Ben Ito", first_name: "Ben", email: "ben@test.dev", status: "confirmed", source: "drop_in", refund_cents: 2200 },
  { booking_id: "b3", profile_id: "p3", name: "Cy Moss", first_name: "Cy", email: null, status: "waitlisted", source: "waitlist", refund_cents: 0 },
];

type Mode = "ok" | "refundFails" | "responseLost" | "overdue";
const PAST_ID = "66666666-6666-6666-6666-666666666666";
const pastStart = new Date(Date.now() - 86_400_000).toISOString();

function state(over: { refundSent: boolean; emailsSent: boolean }) {
  const { refundSent, emailsSent } = over;
  return {
    occurrence_id: OCC_ID, starts_at: startsAt, class_name: "Vinyasa Flow", cancelled: true,
    people: [
      { ...PEOPLE[0], notice_status: emailsSent ? "sent" : "pending" },
      { ...PEOPLE[1], notice_status: emailsSent ? "sent" : "pending", refund_status: refundSent ? "sent" : "failed" },
      { ...PEOPLE[2], notice_status: "no_email" },
    ],
    refunds_sent: refundSent ? 1 : 0, refunds_sent_cents: refundSent ? 2200 : 0, refunds_outstanding: refundSent ? 0 : 1,
    emails_sent: emailsSent ? 2 : 0, emails_outstanding: emailsSent ? 0 : 2, emails_failed: 0, refund_updates_owed: 0,
  };
}

async function setUp(page: Page, calls: { fn: string; body: Record<string, unknown> }[], mode: Mode = "ok") {
  const session = {
    access_token: "e2e-token", refresh_token: "e2e-refresh", token_type: "bearer",
    expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: OWNER.id, email: OWNER.email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {} },
  };
  await page.addInitScript((s) => window.localStorage.setItem("sb-127-auth-token", JSON.stringify(s)), session);
  let cancelled = false;
  let current = state({ refundSent: false, emailsSent: false });
  let pastOwed = mode === "overdue";
  await page.route("http://127.0.0.1:54321/**", async (route) => {
    const req = route.request();
    const url = req.url();
    const headers = { "access-control-allow-origin": "*", "content-type": "application/json" };
    const json = (body: unknown, status = 200) => route.fulfill({ status, headers, body: JSON.stringify(body) });
    if (req.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    }
    if (url.includes("/functions/v1/cancel-class")) {
      const body = req.postDataJSON();
      calls.push({ fn: "cancel-class", body });
      if (body.resume) {
        if (body.occurrenceId === PAST_ID) pastOwed = false;
        current = state({ refundSent: true, emailsSent: true });
        return json({ cancelled: false, followup: current, emailUnavailable: false });
      }
      cancelled = true;
      if (mode === "responseLost") return json({ error: "upstream timed out" }, 504);
      current = state({ refundSent: mode === "ok", emailsSent: true });
      return json({ cancelled: true, followup: current, emailUnavailable: false });
    }
    const table = new URL(url).pathname.split("/rest/v1/")[1] ?? "";
    if (url.includes("/auth/v1/user")) return json(session.user);
    if (url.includes("/auth/v1/")) return json({});
    if (table === "profiles") return json({ id: OWNER.id, email: OWNER.email, first_name: "Olive", last_name: "Owner", role: "student" });
    if (table === "rpc/get_my_effective_role") return json("owner");
    if (table === "rpc/get_my_admin_studio") return json([{ studio_id: STUDIO_ID, name: "Test Studio", slug: "test-studio", currency: "usd", staff_role: "owner" }]);
    if (table === "rpc/get_studio_staff_names") return json([]);
    if (table === "rpc/preview_class_cancellation") {
      calls.push({ fn: "preview", body: req.postDataJSON() });
      return json({ occurrence_id: OCC_ID, starts_at: startsAt, class_name: "Vinyasa Flow", already_cancelled: false, started: false, people: PEOPLE });
    }
    if (table === "rpc/class_cancel_followup") {
      calls.push({ fn: "followup", body: req.postDataJSON() });
      const asked = req.postDataJSON()?.p_occurrence_id;
      return json(cancelled || asked === PAST_ID ? { ...current, occurrence_id: asked } : { ...current, cancelled: false });
    }
    if (table === "refund_requests") return json(pastOwed ? [{ occurrence_id: PAST_ID }] : []);
    if (table === "class_occurrences" && url.includes("id=in.")) {
      return json([{
        id: PAST_ID, starts_at: pastStart, ends_at: pastStart, capacity: 20, is_cancelled: true,
        offering: { name: "Yin" }, studio: { timezone: "America/Chicago" }, bookings: [],
        refund_requests: [{ status: pastOwed ? "failed" : "sent" }], class_cancel_notices: [],
      }]);
    }
    if (table === "class_occurrences") {
      const refundRows = cancelled ? [{ status: current.refunds_outstanding ? "failed" : "sent" }] : [];
      const noticeRows = cancelled ? current.people.map((p) => ({ status: p.notice_status, refund_told: null })) : [];
      return json([{
        id: OCC_ID, starts_at: startsAt, ends_at: startsAt, capacity: 20, is_cancelled: cancelled,
        offering: { name: "Vinyasa Flow" }, studio: { timezone: "America/Chicago" },
        bookings: cancelled ? [] : [{ status: "confirmed" }, { status: "confirmed" }, { status: "waitlisted" }],
        refund_requests: refundRows, class_cancel_notices: noticeRows,
      }]);
    }
    if (table === "offerings") return json([OFFERING]);
    if (table === "locations") return json([{ id: "44444444-4444-4444-4444-444444444444", name: "Main", is_primary: true }]);
    return json([]);
  });
}

test("owner cancels a class and sees who gets what back", async ({ page }) => {
  const calls: { fn: string; body: Record<string, unknown> }[] = [];
  await setUp(page, calls);

  await page.goto("/manage/schedule");
  const row = page.getByTestId("upcoming-class").first();
  await expect(row).toContainText("Vinyasa Flow");
  await expect(row).toContainText("2 of 20 booked · 1 waiting");

  await row.getByRole("button", { name: "Cancel" }).click();
  const consequences = page.getByTestId("cancel-consequences");
  await expect(consequences).toContainText("2 people are booked.");
  await expect(consequences).toContainText("1 class goes back on class packs.");
  await expect(consequences).toContainText("1 drop-in refunded in full: $22.00.");
  await expect(consequences).toContainText("1 person on the waitlist removed.");
  await expect(consequences).toContainText("Everyone with an email on file is told (2 of 3).");
  await expect(page.getByText("Refund $22.00")).toBeVisible();

  await page.getByLabel("Note to students (optional)").fill("Maya is unwell. See you Thursday!");
  await page.getByRole("button", { name: "Cancel and tell 2 people" }).click();

  await expect(page.getByRole("heading", { name: "Class cancelled" })).toBeVisible();
  const result = page.getByTestId("cancel-result");
  await expect(result).toContainText("1 class returned to packs and memberships.");
  await expect(result).toContainText("$22.00 refunded to 1 card.");
  await expect(result).toContainText("2 emails sent.");
  await expect(page.getByTestId("cancel-problems")).toHaveText("No email on file for Cy Moss. Contact them directly.");
  await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0);

  const cancel = calls.find((c) => c.fn === "cancel-class");
  expect(cancel?.body).toMatchObject({ occurrenceId: OCC_ID, message: "Maya is unwell. See you Thursday!" });
  expect(calls.find((c) => c.fn === "preview")?.body).toMatchObject({ p_occurrence_id: OCC_ID });

  await page.getByRole("button", { name: "Done" }).click();
  const after = page.getByTestId("upcoming-class").first();
  await expect(after).toContainText("Cancelled");
  await expect(after.getByRole("button", { name: "Finish follow-up" })).toHaveCount(0);
});

test("a refund that fails is flagged and can be retried", async ({ page }) => {
  const calls: { fn: string; body: Record<string, unknown> }[] = [];
  await setUp(page, calls, "refundFails");
  await page.goto("/manage/schedule");
  await page.getByTestId("upcoming-class").first().getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: "Cancel and tell 2 people" }).click();
  await expect(page.getByTestId("cancel-problems")).toContainText("1 refund did not go through yet");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByTestId("cancel-result")).toContainText("$22.00 refunded to 1 card.");
  await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0);
  expect(calls.filter((c) => c.fn === "cancel-class").map((c) => c.body.resume ?? false)).toEqual([false, true]);
});

test("a lost response is recovered and the follow-up can be finished later", async ({ page }) => {
  const calls: { fn: string; body: Record<string, unknown> }[] = [];
  await setUp(page, calls, "responseLost");
  await page.goto("/manage/schedule");
  await page.getByTestId("upcoming-class").first().getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: "Cancel and tell 2 people" }).click();

  // The dialog reads what really happened instead of saying the cancel failed.
  await expect(page.getByRole("heading", { name: "Class cancelled" })).toBeVisible();
  await expect(page.getByText("the follow-up may not have finished")).toBeVisible();
  await expect(page.getByTestId("cancel-problems")).toContainText("2 people have not been emailed yet.");
  await page.getByRole("button", { name: "Done" }).click();

  // Later, from the schedule: the cancelled class says it still owes follow-up.
  const row = page.getByTestId("upcoming-class").first();
  await row.getByRole("button", { name: "Finish follow-up" }).click();
  await expect(page.getByTestId("cancel-problems")).toContainText("1 refund did not go through yet");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByTestId("cancel-result")).toContainText("2 emails sent.");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(row.getByRole("button", { name: "Finish follow-up" })).toHaveCount(0);
  expect(calls.filter((c) => c.fn === "cancel-class").map((c) => c.body.resume ?? false)).toEqual([false, true]);
});

test("a past cancelled class that still owes a refund stays on the list until finished", async ({ page }) => {
  const calls: { fn: string; body: Record<string, unknown> }[] = [];
  await setUp(page, calls, "overdue");
  await page.goto("/manage/schedule");
  await expect(page.getByText("Still to finish")).toBeVisible();
  const row = page.getByTestId("upcoming-class").filter({ hasText: "Yin" });
  await row.getByRole("button", { name: "Finish follow-up" }).click();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByTestId("cancel-result")).toContainText("$22.00 refunded to 1 card.");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByText("Still to finish")).toHaveCount(0);
  expect(calls.find((c) => c.fn === "cancel-class")?.body).toMatchObject({ occurrenceId: PAST_ID, resume: true });
});
