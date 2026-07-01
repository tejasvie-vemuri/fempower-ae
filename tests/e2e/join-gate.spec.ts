import { test, expect } from "@playwright/test";

/**
 * Verifies the JoinGate dialog (with QR + Instagram CTA) for guest visitors
 * on the landing page. Only run at one representative viewport to avoid noise.
 */
test.describe("JoinGate — guest CTAs", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "vp-375", "run once at one representative viewport");
    await page.goto("/", { waitUntil: "networkidle" });
    // Auth resolves off the initial network burst; JoinGate no-ops while loading.
    await expect(page.getByRole("banner")).toBeVisible();
  });

  test("clicking a Programs Spotlight item opens the join dialog with QR + IG CTA", async ({ page }) => {
    const programs = page.locator("#programs");
    await programs.scrollIntoViewIfNeeded();
    await programs.getByRole("button", { name: /WhatsApp Community/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Join Fempower to continue/i)).toBeVisible();

    // QR image
    await expect(dialog.getByRole("img", { name: /Scan to open @fempower\.ae/i })).toBeVisible();

    // Instagram CTA is an external anchor to the correct URL
    const igLink = dialog.getByRole("link", { name: /Open Instagram/i });
    await expect(igLink).toBeVisible();
    await expect(igLink).toHaveAttribute("href", /instagram\.com\/fempower\.ae/);
    await expect(igLink).toHaveAttribute("target", "_blank");
    await expect(igLink).toHaveAttribute("rel", /noreferrer/);

    // Sign In and Join Us both routes exist
    await expect(dialog.getByRole("link", { name: /^Sign In$/i })).toHaveAttribute("href", "/auth");
    await expect(dialog.getByRole("link", { name: /^Join Us$/i })).toHaveAttribute("href", "/join");
  });

  test("Sign In link inside the dialog navigates to /auth and closes the dialog", async ({ page }) => {
    await page.locator("#programs").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /Mentor Walks/i }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("link", { name: /^Sign In$/i }).click();

    await expect(page).toHaveURL(/\/auth(\?|$)/);
  });
});
