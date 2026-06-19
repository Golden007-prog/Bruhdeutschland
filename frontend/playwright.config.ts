import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright e2e config (work order §13). Runs the key journey against a local dev server.
 * To run: `npx playwright install chromium` (once) then `npx playwright test`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
