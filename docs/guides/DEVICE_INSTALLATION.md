# Installing Tandava on Studio Devices

How a studio owner gets Tandava onto a Chromebook, MacBook, iPad, or Windows PC — and why there is no MSI, EXE, or DMG to download.

> Looking for how to *deploy* Tandava (hosting, database, Stripe)? That's [DEPLOYMENT.md](../../DEPLOYMENT.md). This guide covers what happens **after** deployment: getting the app onto the devices at the front desk and in the office.

---

## TL;DR

Tandava is a **web application delivered as an installable PWA** (Progressive Web App). "Installing" it means visiting your studio's URL and clicking **Install** (or **Add to Home Screen**). That's the whole install.

There are deliberately **no native installers**:

| Format | Why not |
|--------|---------|
| MSI / EXE (Windows) | Won't run on a Chromebook or iPad — the two most common front-desk devices |
| DMG / PKG (Mac) | Mac-only; every update would need to be re-downloaded and re-installed |
| Electron/Tauri wrapper | Ships a whole browser to display a web page the device's browser already displays; adds megabytes, update infrastructure, and code-signing costs while removing nothing |

A studio owner with a Chromebook, a MacBook, and an iPad at the front desk gets the **same app, same data, same URL** on all three — updated centrally the moment you deploy, with nothing to patch on any device.

---

## Why the web is the right distribution for studios

1. **The devices studios actually own.** Chromebooks and iPads cannot run desktop installers at all. Any MSI/DMG strategy immediately excludes most real front desks.
2. **Zero-touch updates.** The app updates on the server. Nobody walks around the studio updating software between classes.
3. **Nothing to lose.** All data lives in the backend (Supabase). A dropped iPad or a swapped Chromebook means signing in on the new device — not restoring from backup.
4. **Multi-device by default.** Owner on a MacBook in the office, front desk on a Chromebook, check-in kiosk on an iPad — concurrently, with role-based access (see [ROLE_ACCESS_CONTROL.md](../architecture/ROLE_ACCESS_CONTROL.md)).
5. **It's already built.** The repo ships a [web app manifest](../../public/manifest.json) and service worker (`public/sw.js`), so browsers offer real installation: an icon, its own window, no browser chrome.

---

## Installing on each device

Your studio's URL is wherever the frontend was deployed (e.g. `https://app.yourstudio.com` — see [DEPLOYMENT.md](../../DEPLOYMENT.md)).

### Chromebook (and Windows/Linux with Chrome or Edge)

1. Open your studio URL in Chrome.
2. Click the **install icon** in the address bar (a monitor with a down-arrow), or menu **⋮ → Cast, save and share → Install page as app**.
3. Tandava opens in its own window and appears in the launcher/taskbar like any app.

### MacBook

- **Safari:** open the studio URL → **File → Add to Dock**.
- **Chrome:** same as Chromebook — install icon in the address bar.

The app appears in the Dock and behaves like a Mac app.

### iPad / iPhone

1. Open the studio URL in **Safari**.
2. Tap the **Share** button → **Add to Home Screen** → **Add**.
3. Tandava launches full-screen from its home-screen icon.

### Front-desk kiosk mode

For a check-in station, point the device at the kiosk route (`/kiosk/:studioId`) and lock it down:

- **iPad:** Settings → Accessibility → **Guided Access** pins the device to the app.
- **Chromebook:** a managed kiosk session (Google Admin console) or a dedicated browser profile.

---

## What works offline

The service worker caches the application shell, so the app opens instantly and tolerates brief connectivity blips. Live data — bookings, check-ins, payments — requires a connection, the same as any cloud system a studio replaces. Plan for the studio's Wi-Fi to be the dependency, not the device.

---

## First run: from install to a working studio

The production path a new studio owner walks:

1. **Create an account** at `/auth/register` (email confirmation may be required depending on backend settings).
2. **Studio Setup wizard** at `/manage/onboarding` — studio info, location, branding, offerings, schedule, pricing, staff invitations, waivers, data import, and Stripe Connect. Every step supports **Save & Continue** or **Skip for now**; progress is saved server-side, so setup can be resumed later from any device.
3. **Import existing data** (or skip) at `/manage/import` — CSV import from Mindbody, Walla, Arketa, Momoyoga, or generic CSV. See [data-import-and-migration](../workflows/data-import-and-migration.md).
4. **Launch** — the final wizard step marks the studio live (optionally listed in the public directory).

Demo mode (`VITE_DEMO_MODE=true`) leaves all of this in dry-run: the same screens work, nothing is written. Production behavior activates when `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are configured.

---

## If you ever need app-store presence

App-store distribution is a marketing/discoverability decision, not a technical requirement — and it's additive, not a replacement. The path would be wrapping this same web app with PWABuilder or Capacitor and submitting the wrapper, keeping the web app as the source of truth. Groundwork for that decision lives in [docs/app-store/SUBMISSION_GUIDE.md](../app-store/SUBMISSION_GUIDE.md) and [APP_STORE_COMPLIANCE.md](../architecture/APP_STORE_COMPLIANCE.md). Until then, the PWA delivers the "real app" experience on every device a studio owns with zero distribution overhead.
