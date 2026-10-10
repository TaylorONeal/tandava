import { defineConfig, devices } from "@playwright/test";

// E2E runs against the Vite dev server with a fake Supabase URL. Network calls
// to Supabase are mocked inside each test (see e2e/helpers.ts), so no backend is needed.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npx vite preview --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      VITE_SUPABASE_URL: "http://127.0.0.1:54321",
      VITE_SUPABASE_ANON_KEY: "e2e-anon-key",
      VITE_HOME_MODE: "platform",
      // The hosted policies publish only on tandavastudio.com or in a hosted build.
      VITE_LEGAL_HOSTED: "true",
    },
  },
});
