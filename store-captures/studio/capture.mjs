// Store captures of the Tandava Studio build against a LOCAL Supabase (never production).
// usage: node store-captures/studio/capture.mjs ios|play <outDir>
//
// The Capacitor app renders this same web bundle (built with VITE_NATIVE_APP=studio). In the
// browser, window.CapacitorCustomPlatform tells @capacitor/core it runs on iOS or Android, so
// every native-only branch (Scan passes card, /scan) renders as it does in the app. The one
// native call faked here is the camera: CapacitorBarcodeScanner.scanBarcode answers with the
// member's pass text instead of opening the camera. The check-in itself is real: the app sends
// it to check_in_with_pass on the local database and shows the server's answer.
import { webkit, chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const [target = 'ios', outDir = 'store-out/raw'] = process.argv.slice(2);
const STUDIO = process.env.STUDIO_URL || 'http://localhost:4301';
const MEMBER = process.env.MEMBER_URL || 'http://localhost:4302';
const PW = process.env.REVIEW_PASSWORD;
if (!PW) throw new Error('REVIEW_PASSWORD (local throwaway) missing');
const mail = r => `review-${r}@juniper.example`;
// Fixed booking ids from supabase/review/studio-review-seed.sql
const PASS = n => `tandava:checkin:v1:f5a1d000-0000-4000-8000-0000000000e${n}`;

const T = {
  ios: { browser: webkit, platform: 'ios', viewport: { width: 440, height: 860 },
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148' },
  play: { browser: chromium, platform: 'android', viewport: { width: 360, height: 616 },
    ua: 'Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36' },
}[target];

fs.mkdirSync(outDir, { recursive: true });
const browser = await T.browser.launch();
const log = (...a) => console.log(`[${target}]`, ...a);

async function session(base, who) {
  const ctx = await browser.newContext({
    viewport: T.viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: T.ua,
    timezoneId: 'America/Chicago', locale: 'en-US', colorScheme: 'light', reducedMotion: 'reduce',
  });
  await ctx.addInitScript(platform => {
    window.CapacitorCustomPlatform = { name: platform };
    window.Capacitor = {
      PluginHeaders: [{ name: 'CapacitorBarcodeScanner', methods: [{ name: 'scanBarcode', rtype: 'promise' }] }],
      nativePromise: (plugin, method) => (plugin === 'CapacitorBarcodeScanner' && method === 'scanBarcode')
        ? new Promise(r => setTimeout(() => r({ ScanResult: sessionStorage.getItem('__scan') || '' }), 250))
        : Promise.reject(new Error('not available in capture')),
    };
  }, T.platform);
  const page = await ctx.newPage();
  page.on('pageerror', e => log('pageerror', e.message));
  await page.goto(`${base}/auth/login`);
  await page.fill('#email', mail(who));
  await page.fill('#password', PW);
  await page.click('button[type=submit]');
  await page.waitForURL(u => !new URL(u).pathname.startsWith('/auth/'), { timeout: 30000 });
  await settle(page);
  log('signed in', who, '->', new URL(page.url()).pathname);
  return page;
}

async function settle(page, ms = 1200) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(ms);
}

async function shot(page, name, scrollToText) {
  const file = path.join(outDir, `${name}.png`);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  if (scrollToText) {
    await page.evaluate(t => {
      const el = [...document.querySelectorAll('h1,h2,h3')].find(e => e.textContent.trim().startsWith(t));
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 76, behavior: 'instant' });
    }, scrollToText);
  }
  await page.waitForTimeout(900);
  await page.screenshot({ path: file, animations: 'disabled', caret: 'hide' });
  // Long screens get a full-page copy too, for crop choices.
  await page.screenshot({ path: path.join(outDir, 'full', `${name}.png`), fullPage: true, animations: 'disabled', caret: 'hide' }).catch(() => {});
  log('shot', name, new URL(page.url()).pathname);
}
fs.mkdirSync(path.join(outDir, 'full'), { recursive: true });

async function go(page, base, route) { await page.goto(base + route); await settle(page); }
let failures = 0;
async function step(name, page, fn) {
  try { await fn(); }
  catch (e) {
    failures++; log('STEP FAILED', name, e.message.split('\n')[0]);
    if (page) await page.screenshot({ path: path.join(outDir, `ERR-${name}.png`) }).catch(() => {});
  }
}

// Member app: the pass the front desk scans.
await step('member', null, async () => {
  const m = await session(MEMBER, 'member-1');
  await go(m, MEMBER, '/my-schedule');
  await shot(m, 'member-schedule');
  const passBtn = m.getByRole('button', { name: /Check-in pass/ }).first();
  await passBtn.click();
  await m.getByRole('dialog').waitFor();
  await settle(m, 1500);
  await shot(m, 'member-pass');
  await m.context().close();
});

const teacher = await session(STUDIO, 'teacher');
await go(teacher, STUDIO, '/teach/schedule');
await shot(teacher, '04-teach');

const owner = await session(STUDIO, 'owner');
await go(owner, STUDIO, '/manage');
await shot(owner, '02-dashboard');

await step('scan', owner, async () => {
await go(owner, STUDIO, '/scan');
await shot(owner, 'scan-ready');
await owner.evaluate(p => sessionStorage.setItem('__scan', p), PASS(1));
await owner.getByRole('button', { name: /Scan a pass/ }).click();
await owner.getByTestId('scan-result').waitFor({ timeout: 20000 });
await settle(owner, 1500);
await shot(owner, '01-scan-success');
});

// Roster: Avery came in by scan; check Jordan in from the roster, leave the rest.
await step('roster', teacher, async () => {
await go(teacher, STUDIO, '/teach/schedule');
await teacher.getByRole('button', { name: /View roster for Open Flow/ }).first().click();
await teacher.getByRole('dialog').waitFor();
await settle(teacher, 1500);
await teacher.getByRole('button', { name: /Check in Jordan/ }).click();
await teacher.waitForFunction(() => !document.body.innerText.includes('Recording…'), null, { timeout: 20000 });
await teacher.waitForTimeout(6500); // let the confirmation toast clear
await shot(teacher, '03-roster');
});

await go(owner, STUDIO, '/manage/schedule');
await shot(owner, '05-schedule');
await go(owner, STUDIO, '/manage/offerings');
await shot(owner, '06-offerings');
await go(owner, STUDIO, '/manage/share');
await shot(owner, 'share-top');
await shot(owner, '07-share', 'Links to one class');

await browser.close();
log('done, failures:', failures);
