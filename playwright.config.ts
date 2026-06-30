import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for end-to-end / responsive UI tests.
 * Assumes the Vite dev server is already running at http://localhost:8080.
 *
 * Project matrix covers the four key breakpoints; individual specs decide
 * which viewports they're meaningful in via `test.skip(...)` based on
 * `testInfo.project.name`.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:8080",
    trace: "retain-on-failure",
  },
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
