import { test, expect } from "@playwright/test";

/**
 * Mobile header drawer behaviour.
 *
 * The Playwright project matrix (see playwright.config.ts) runs this file at
 * both 320px and 375px viewports, so we exercise the smallest phones and the
 * common iPhone SE width without duplicating test bodies.
 */

test.describe("Mobile header drawer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Wait for the header to mount.
    await expect(page.getByRole("banner")).toBeVisible();
  });

  test("hamburger is visible and desktop nav links are hidden", async ({ page }) => {
    await expect(page.getByLabel("Toggle menu")).toBeVisible();

    // The desktop <nav> is hidden on mobile (md:flex). Its links should not be
    // visible until the drawer is opened.
    await expect(page.getByRole("link", { name: "About", exact: true })).toBeHidden();
  });

  test("opens the drawer and reveals all nav links", async ({ page }) => {
    await page.getByLabel("Toggle menu").click();

    for (const label of ["About", "What We Do", "Programs", "Events", "Directory", "Learn"]) {
      await expect(page.getByRole("link", { name: label, exact: true })).toBeVisible();
    }

    // Auth CTAs are stacked at the bottom of the drawer for logged-out users.
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /join us/i })).toBeVisible();
  });

  test("closes the drawer when the X icon is clicked", async ({ page }) => {
    const toggle = page.getByLabel("Toggle menu");
    await toggle.click();
    await expect(page.getByRole("link", { name: "About", exact: true })).toBeVisible();

    await toggle.click();
    await expect(page.getByRole("link", { name: "About", exact: true })).toBeHidden();
  });

  test("closes the drawer when a nav link is tapped", async ({ page }) => {
    await page.getByLabel("Toggle menu").click();
    const aboutLink = page.getByRole("link", { name: "About", exact: true });
    await expect(aboutLink).toBeVisible();

    await aboutLink.click();

    // After navigating via hash link, the drawer should auto-close.
    await expect(aboutLink).toBeHidden();
  });
});
