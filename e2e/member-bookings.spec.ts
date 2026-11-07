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

for (const source of ['free', 'class_pack'] as const) {
  for (const outcome of ['confirmed', 'waitlisted', 'missing'] as const) {
  test(`member books with ${source}: ${outcome} response stays truthful after reopening`, async ({ page }) => {
    const user = { id: '0a000000-0000-0000-0000-00000000000b', email: 'member@test.dev', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} };
    await page.addInitScript(user => localStorage.setItem('sb-127-auth-token', JSON.stringify({
      access_token: 'e2e-token', refresh_token: 'e2e-refresh', token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600, user,
    })), user);
    const occurrence = {
      occurrence_id: '33333333-3333-3333-3333-333333333333', studio_id: '11111111-1111-1111-1111-111111111111',
      offering_id: '44444444-4444-4444-4444-444444444444', location_id: '55555555-5555-5555-5555-555555555555',
      offering_name: 'Synthetic Review Flow', offering_description: 'Local test fixture', room: 'Main',
      starts_at: new Date(Date.now() + 86400000).toISOString(), ends_at: new Date(Date.now() + 90000000).toISOString(),
      is_cancelled: false, capacity: 12, booked_count: 0, drop_in_price_cents: source === 'free' ? 0 : 2200,
      location_name: 'Downtown', location_city: 'Austin', teacher_name: 'Sam', studio_name: 'Test Studio', studio_slug: 'test-studio',
      studio_timezone: 'America/Chicago', studio_currency: 'USD', express_booking_enabled: true,
      express_booking_cutoff_minutes: 0, express_waitlist_enabled: true, express_waiver_required: false,
    };
    const packId = '66666666-6666-6666-6666-666666666666';
    let booked = false;
    let reject = true;
    let calls = 0;
    let missingResponse = outcome === 'missing';
    const status = outcome === 'waitlisted' ? 'waitlisted' : 'confirmed';
    await page.route('http://127.0.0.1:54321/**', async route => {
      const req = route.request(); const url = req.url();
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      const json = (body: unknown, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (url.includes('/auth/v1/user')) return json(user);
      if (url.includes('/rpc/get_my_effective_role')) return json('student');
      if (url.includes('/rest/v1/profiles')) return json({ ...user, first_name: 'Test', last_name: 'Member' });
      if (url.includes('/rpc/get_public_occurrence')) return json([occurrence]);
      if (url.includes('/rest/v1/class_packs')) return json(source === 'free' ? [] : [{
        id: packId, status: 'active', classes_remaining: 5, expires_at: new Date(Date.now() + 864000000).toISOString(),
        class_pack_type: { name: 'Review five pack', offering_ids: [], locations: [] },
      }]);
      if (url.includes('/rpc/book_free_class') || url.endsWith('/rpc/book_class')) {
        calls++;
        expect(req.postDataJSON()).toMatchObject({ p_occurrence_id: occurrence.occurrence_id });
        if (source === 'class_pack') expect(req.postDataJSON()).toMatchObject({ p_source_type: 'class_pack', p_source_id: packId });
        if (reject) return json({ message: 'Synthetic booking unavailable' }, 400);
        if (missingResponse) return json(null);
        booked = true;
        return json({ id: '22222222-2222-2222-2222-222222222222', status });
      }
      if (url.includes('/rpc/get_my_bookings')) return json(booked ? [{ ...occurrence,
        booking_id: '22222222-2222-2222-2222-222222222222', status, cancellation_minutes: 120,
      }] : []);
      if (url.includes('/functions/v1/stripe-')) throw new Error('Synthetic booking must not create a payment');
      return json([]);
    });
    await page.goto(`/s/test-studio/book/${occurrence.occurrence_id}`);
    const button = page.getByRole('button', { name: source === 'free' ? 'Book this free class' : /Book with Review five pack/ });
    await button.click();
    await expect(page.getByRole('alert')).toContainText('Synthetic booking unavailable');
    expect(booked).toBe(false);
    reject = false;
    await button.click();
    if (missingResponse) {
      await expect(page.getByRole('alert')).toContainText('could not verify');
      await expect(page.getByRole('heading', { name: "You're booked" })).toHaveCount(0);
      expect(booked).toBe(false);
      missingResponse = false;
      await button.click();
    }
    await expect(page.getByRole('heading', { name: status === 'waitlisted' ? "You're on the waitlist" : "You're booked" })).toBeVisible();
    if (status === 'waitlisted') {
      await expect(page.getByText(/Your spot in .* is confirmed/)).toHaveCount(0);
      await expect(page.getByRole('button', { name: /Add to calendar/i })).toHaveCount(0);
    }
    expect(calls).toBe(outcome === 'missing' ? 3 : 2);
    await page.goto('/my-schedule');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Synthetic Review Flow' })).toBeVisible();
  });
}
}
