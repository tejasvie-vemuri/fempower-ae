import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for end-to-end / responsive UI tests.
 * Assumes the Vite dev server is already running at http://localhost:8080
 * (Lovable sandbox keeps it up). For local use, run `bun run dev` separately,
 * or uncomment the `webServer` block below.
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
      name: "mobile-320",
      use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 700 } },
    },
    {
      name: "mobile-375",
      use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 800 } },
    },
  ],
  // webServer: {
  //   command: "bun run dev",
  //   url: "http://localhost:8080",
  //   reuseExistingServer: true,
  //   timeout: 60_000,
  // },
});
