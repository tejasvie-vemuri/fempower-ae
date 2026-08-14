import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for end-to-end / responsive UI tests.
 * Assumes the Vite dev server is already running at http://localhost:8080.
 *
 * Project matrix covers the four key breakpoints; individual specs decide
 * which viewports they're meaningful in via `test.skip(...)` based on
 * `testInfo.project.name`.
 */
/**
 * Where the app under test is served. Defaults to 8080 (what CI starts), but
 * can be pointed elsewhere when that port is already taken locally:
 *   PLAYWRIGHT_BASE_URL=http://localhost:8081 npx playwright test
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080";
const port = new URL(baseURL).port || "8080";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }], ["github"]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: process.env.CI
    ? {
        command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : undefined,
  projects: [
    {
      name: "vp-320",
      use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 700 } },
    },
    {
      name: "vp-375",
      use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 800 } },
    },
    {
      name: "vp-768",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 900 } },
    },
    {
      name: "vp-1024",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 900 } },
    },
  ],
});
