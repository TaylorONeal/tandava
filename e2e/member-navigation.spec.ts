import { expect, test, type Page } from '@playwright/test';
async function memberSession(page: Page) {
  const user = { id: '0a000000-0000-0000-0000-00000000000b', email: 'member@test.dev', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} };
  const state = { rejectLogout: false, logoutAttempts: 0 };
  await page.addInitScript(user => localStorage.setItem('sb-127-auth-token', JSON.stringify({ access_token: 'e2e-token', refresh_token: 'e2e-refresh', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user })), user);
  await page.route('http://127.0.0.1:54321/**', async route => {
    const req = route.request(); const url = req.url();
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    const json = (body: unknown, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (url.includes('/auth/v1/logout')) { state.logoutAttempts++; return state.rejectLogout ? json({ message: 'Please retry sign out' }, 500) : json({}); }
    if (url.includes('/auth/v1/user')) return json(user);
    if (url.includes('/rpc/get_my_effective_role')) return json('student');
    if (url.includes('/rest/v1/profiles')) return json({ ...user, first_name: 'Test', last_name: 'Member' });
    return json([]);
  });
  return state;
}

test('live member navigation uses Tandava and supported paths without fake notifications', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await memberSession(page); await page.goto('/account');
  await expect(page.getByRole('banner').getByRole('link', { name: 'Tandava', exact: false })).toBeVisible();
  await expect(page.getByText('Oxatl Yoga', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'View notifications' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await expect(page.getByRole('link', { name: 'On-Demand', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Community', exact: true })).toHaveCount(0);
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('href', '/discover');
  await page.getByRole('navigation').evaluate(async node => {
    await Promise.all((node.parentElement?.getAnimations({ subtree: true }) ?? []).map(animation => animation.finished.catch(() => undefined)));
  });
  await page.screenshot({ path: test.info().outputPath('live-member-phone.png'), fullPage: true });
});

test('live users cannot enter sample home, digital, community or preference pages', async ({ page }) => {
  await memberSession(page);
  for (const path of ['/home', '/on-demand', '/schedule', '/community', '/account/notifications']) {
    await page.goto(path); await expect(page).toHaveURL(/\/discover$/);
  }
});

test('member sign-out failure is visible and retryable', async ({ page }) => {
  const state = await memberSession(page); state.rejectLogout = true; await page.goto('/account');
  await page.getByRole('button', { name: 'Open user menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click();
  await expect(page.getByText('Could not sign out').first()).toBeVisible();
  await expect(page).toHaveURL(/\/account$/);
  state.rejectLogout = false;
  await page.getByRole('button', { name: 'Open user menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
  expect(state.logoutAttempts).toBeGreaterThanOrEqual(2);
  expect(await page.evaluate(() => localStorage.getItem('sb-127-auth-token'))).toBeNull();
});
