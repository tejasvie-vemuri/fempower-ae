import { test, expect } from "@playwright/test";

/**
 * Mobile header drawer behaviour.
 *
 * Only runs at mobile breakpoints (320, 375). Skipped on tablet/desktop
 * where the hamburger is hidden and the inline desktop nav takes over.
 */

test.describe("Mobile header drawer", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      !/vp-(320|375)/.test(testInfo.project.name),
      "Mobile drawer only renders below the md breakpoint",
    );
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("banner")).toBeVisible();
  });

  test("hamburger is visible and desktop nav links are hidden", async ({ page }) => {
    const toggle = page.getByRole("button", { name: "Toggle menu" });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAttribute("aria-haspopup", "dialog");

    // Desktop nav exists in the DOM but is hidden via Tailwind md:flex.
    await expect(page.getByRole("link", { name: "About", exact: true })).toBeHidden();
  });

  test("opens the drawer and reveals all nav links", async ({ page }) => {
    await page.getByRole("button", { name: "Toggle menu" }).click();

    const drawer = page.getByRole("dialog", { name: /main navigation/i });
    await expect(drawer).toBeVisible();

    for (const label of ["About", "What We Do", "Programs", "Events", "Directory", "Learn"]) {
      await expect(drawer.getByRole("link", { name: label, exact: true })).toBeVisible();
    }

    // Auth CTAs stacked at the bottom of the drawer for logged-out visitors.
    await expect(drawer.getByRole("link", { name: /sign in/i })).toBeVisible();
    await expect(drawer.getByRole("link", { name: /join us/i })).toBeVisible();
  });

  test("traps focus inside the drawer when open", async ({ page }) => {
    await page.getByRole("button", { name: "Toggle menu" }).click();
    const drawer = page.getByRole("dialog", { name: /main navigation/i });
    await expect(drawer).toBeVisible();

    // First focusable element inside the drawer should receive focus.
    const firstLink = drawer.getByRole("link", { name: "About", exact: true });
    await expect(firstLink).toBeFocused();

    // Radix Dialog scopes Tab to the drawer; focused element stays inside it.
    await page.keyboard.press("Tab");
    const focusedInDrawer = await drawer.evaluate(
      (el) => el.contains(document.activeElement),
    );
    expect(focusedInDrawer).toBe(true);
  });

  test("closes the drawer with the Escape key", async ({ page }) => {
    await page.getByRole("button", { name: "Toggle menu" }).click();
    const drawer = page.getByRole("dialog", { name: /main navigation/i });
    await expect(drawer).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();

    // Focus returns to the trigger after close (Radix default).
    await expect(page.getByRole("button", { name: "Toggle menu" })).toBeFocused();
  });

  test("closes the drawer when the Close button is clicked", async ({ page }) => {
    await page.getByRole("button", { name: "Toggle menu" }).click();
    const drawer = page.getByRole("dialog", { name: /main navigation/i });
    await drawer.getByRole("button", { name: /close/i }).click();
    await expect(drawer).toBeHidden();
  });

  test("closes the drawer when a nav link is tapped", async ({ page }) => {
    await page.getByRole("button", { name: "Toggle menu" }).click();
    const drawer = page.getByRole("dialog", { name: /main navigation/i });
    await drawer.getByRole("link", { name: "About", exact: true }).click();
    await expect(drawer).toBeHidden();
  });
});
