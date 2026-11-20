// Studio owner sign-up, end to end, against a throwaway LOCAL Supabase (never production).
// Registers a new owner on the web build, walks every onboarding step, launches the studio,
// signs out and signs back in. Then adds staff the two ways an owner can (setup step and the
// Team page), opens the invite email from the local mail catcher, chooses a password as the
// invited person and signs in as them. Prints one line per step and exits non-zero on any failure.
// usage: OWNER_EMAIL=... OWNER_PASSWORD=... node e2e-owner/owner-signup.mjs [outDir]
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.env.WEB_URL || 'http://localhost:4303';
const EMAIL = process.env.OWNER_EMAIL;
const PW = process.env.OWNER_PASSWORD;
const outDir = process.argv[2] || 'owner-out';
const MAIL = process.env.MAIL_URL || 'http://127.0.0.1:54324';
const RUN = process.env.RUN_ID || String(Date.now());
const WIZARD_STAFF = `teacher-${RUN}@juniper.example`;
const TEAM_STAFF = `desk-${RUN}@juniper.example`;
const STAFF_PW = process.env.STAFF_PASSWORD || PW;
if (!EMAIL || !PW) throw new Error('OWNER_EMAIL and OWNER_PASSWORD (local throwaway) are required');
fs.mkdirSync(outDir, { recursive: true });

const results = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'en-US', timezoneId: 'America/Chicago' });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(String(e)));

async function shot(name) { await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true }).catch(() => {}); }
async function step(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS ${name}`);
  } catch (e) {
    results.push({ name, ok: false, error: String(e.message || e).split('\n')[0] });
    console.log(`FAIL ${name}: ${String(e.message || e).split('\n')[0]}`);
    await shot(`fail-${name.replace(/\W+/g, '-')}`);
  }
}
async function pick(label, option) {
  await page.getByLabel(label, { exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).first().click();
}
// Save the current step and wait for the "<Step> saved" toast, or report the error toast.
async function save(stepLabel) {
  await page.getByRole('button', { name: /Save & Continue/ }).click();
  const ok = page.getByText(`${stepLabel} saved`, { exact: true }).first();
  const bad = page.getByText("Couldn't save", { exact: true }).first();
  await Promise.race([ok.waitFor({ timeout: 20000 }), bad.waitFor({ timeout: 20000 })]);
  if (await bad.isVisible().catch(() => false)) {
    const desc = await bad.locator('xpath=..').innerText().catch(() => '');
    throw new Error(`save failed: ${desc.replace(/\s+/g, ' ')}`);
  }
}
async function skip() { await page.getByRole('button', { name: /^Skip/ }).click(); }
async function heading(text) { await page.getByText(text, { exact: false }).first().waitFor({ timeout: 15000 }); }

await step('register', async () => {
  await page.goto(`${BASE}/auth/register?intent=studio&next=%2Fmanage%2Fonboarding`);
  await page.getByLabel('First name').fill('Jordan');
  await page.getByLabel('Last name').fill('Rivera');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(PW);
  const terms = page.getByRole('checkbox').first();
  if (await terms.isVisible().catch(() => false)) await terms.check();
  await shot('01-register');
  await page.getByRole('button', { name: /Create account/ }).click();
  await page.waitForURL(/\/manage\/onboarding/, { timeout: 20000 });
});

await step('studio info', async () => {
  await heading('Studio Name');
  await page.getByLabel('Studio Name').fill('Juniper Test Studio');
  await page.getByLabel('Description').fill('A throwaway studio for the sign-up test.');
  await pick('Currency', 'USD ($)');
  await shot('02-studio');
  await save('Studio Info');
});

await step('location', async () => {
  await heading('Street Address');
  await page.getByLabel('Street Address').fill('123 Main St, Austin, TX 78704');
  await page.getByLabel('Rooms (comma-separated)').fill('Main Studio');
  await save('Location');
});

await step('branding (skip)', async () => { await skip(); });

await step('offerings', async () => {
  await heading('Class Name');
  await page.getByLabel('Class Name').fill('Morning Vinyasa');
  await pick('Style', 'Vinyasa');
  await pick('Level', 'All Levels');
  await page.getByLabel('Duration (min)').fill('60');
  await page.getByLabel('Capacity').fill('20');
  await page.getByLabel('Drop-in Price ($)').fill('20');
  await save('Offerings');
});

await step('schedule', async () => {
  await heading('Day');
  await pick('Offering', 'Morning Vinyasa');
  await pick('Day', 'Monday');
  await page.getByLabel('Time').fill('07:00');
  await pick('Room', 'Main Studio');
  await save('Schedule');
});

await step('pricing', async () => {
  await heading('Membership Name');
  await page.getByLabel('Membership Name').fill('Unlimited Monthly');
  await pick('Billing Cycle', 'Monthly');
  await page.getByLabel('Price ($)').first().fill('149');
  await page.getByLabel('Pack Name').fill('10-Class Pack');
  await page.getByLabel('Classes').fill('10');
  await page.getByLabel('Price ($)').nth(1).fill('200');
  await save('Pricing');
});

await step('staff (setup step)', async () => {
  await heading('Add Your Team');
  await page.getByLabel('Full Name').fill('Camila Reyes');
  await page.getByLabel('Email').fill(WIZARD_STAFF);
  await save('Staff');
});
await step('waivers', async () => {
  await heading('Waiver Name');
  const name = page.getByLabel('Waiver Name');
  if (!(await name.inputValue())) await name.fill('Liability Waiver');
  const body = page.getByLabel('Waiver Content');
  if (!(await body.inputValue())) await body.fill('I take part at my own risk.');
  await save('Waivers');
});
await step('import (skip)', async () => { await skip(); });
await step('payments (skip)', async () => { await skip(); });

await step('launch', async () => {
  await heading('Ready to Launch');
  const publish = page.getByRole('switch', { name: 'Publish my booking page' });
  if ((await publish.getAttribute('aria-checked')) !== 'true') await publish.click();
  await shot('03-launch');
  await page.getByRole('button', { name: /Launch Studio/ }).click();
  await page.waitForURL(/\/manage(\/?$|\?)/, { timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot('04-manage');
});

await step('sign out and back in', async () => {
  await ctx.clearCookies();
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto(`${BASE}/auth/login`);
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(PW);
  await page.getByRole('button', { name: /^Sign in$/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/auth/login'), { timeout: 20000 });
  await page.goto(`${BASE}/manage`);
  await page.waitForTimeout(1500);
  if (page.url().includes('/auth/')) throw new Error(`owner could not reach /manage, landed on ${page.url()}`);
  await shot('05-signed-back-in');
});

// The invite email for an address, from the local mail catcher (Mailpit, or older Inbucket).
async function inviteLink(address) {
  for (let i = 0; i < 20; i++) {
    let html = '';
    const list = await fetch(`${MAIL}/api/v1/messages`).then((r) => r.ok ? r.json() : null).catch(() => null);
    const hit = list?.messages?.find((m) => (m.To || []).some((t) => t.Address === address));
    if (hit) html = (await fetch(`${MAIL}/api/v1/message/${hit.ID}`).then((r) => r.json())).HTML || '';
    if (!html) {
      const box = address.split('@')[0];
      const old = await fetch(`${MAIL}/api/v1/mailbox/${box}`).then((r) => r.ok ? r.json() : null).catch(() => null);
      if (old?.length) html = (await fetch(`${MAIL}/api/v1/mailbox/${box}/${old[old.length - 1].id}`).then((r) => r.json())).body?.html || '';
    }
    const m = html.match(/href="(https?:[^"]*\/auth\/v1\/verify[^"]*)"/);
    if (m) return m[1].replace(/&amp;/g, '&');
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`no invite email for ${address}`);
}

await step('team page lists the setup invite', async () => {
  await page.goto(`${BASE}/manage/teachers`);
  await page.getByRole('heading', { name: 'Team', exact: true }).waitFor({ timeout: 15000 });
  await page.getByText(WIZARD_STAFF).waitFor({ timeout: 15000 });
  await page.getByText('Invite sent').first().waitFor();
});

await step('add team member from the Team page', async () => {
  await page.getByRole('button', { name: 'Add team member' }).click();
  await page.getByLabel('Full name').fill('Devon Park');
  await page.getByLabel('Email').fill(TEAM_STAFF);
  await pick('Role', 'Front desk');
  await page.getByRole('button', { name: 'Send invite' }).click();
  await page.getByText('Devon Park added', { exact: true }).first().waitFor({ timeout: 20000 });
  await page.getByText(TEAM_STAFF).waitFor({ timeout: 15000 });
  await shot('06-team');
});

// A second person, with their own browser: nothing carries over from the owner.
const staffCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US' });
const staff = await staffCtx.newPage();

await step('invited staff chooses a password from the email', async () => {
  await staff.goto(await inviteLink(TEAM_STAFF));
  await staff.waitForURL(/\/auth\/reset-confirm\?invite=1/, { timeout: 20000 });
  await staff.getByText("Welcome to your studio's team").waitFor({ timeout: 15000 });
  await staff.getByLabel('Password', { exact: true }).fill(STAFF_PW);
  await staff.getByLabel('Confirm password').fill(STAFF_PW);
  await staff.getByRole('button', { name: 'Save password' }).click();
  await staff.getByText("You're set").waitFor({ timeout: 15000 });
  await staff.getByRole('link', { name: 'Get it on Google Play' }).waitFor();
  await staff.screenshot({ path: `${outDir}/07-staff-set.png` }).catch(() => {});
});

await step('invited staff signs in with email and password', async () => {
  await staffCtx.clearCookies();
  await staff.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await staff.goto(`${BASE}/auth/login`);
  await staff.getByLabel('Email').fill(TEAM_STAFF);
  await staff.getByLabel('Password', { exact: true }).fill(STAFF_PW);
  await staff.getByRole('button', { name: /^Sign in$/i }).click();
  await staff.waitForURL((u) => !u.pathname.startsWith('/auth/login'), { timeout: 20000 });
});

await step('owner sees them as Active and can turn them off', async () => {
  await page.reload();
  const row = page.locator('[data-testid="team-member"]').filter({ hasText: TEAM_STAFF });
  await row.getByText('Active', { exact: true }).waitFor({ timeout: 15000 });
  await row.getByRole('button', { name: 'Turn off' }).click();
  await row.getByText('Off', { exact: true }).waitFor({ timeout: 15000 });
});

await browser.close();
fs.writeFileSync(`${outDir}/results.json`, JSON.stringify({ results, consoleErrors: consoleErrors.slice(0, 50) }, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length}/${results.length} steps passed`);
process.exit(failed.length ? 1 : 0);
