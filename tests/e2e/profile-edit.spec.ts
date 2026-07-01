import { test, expect } from "@playwright/test";

/**
 * Guards the critical profile-edit route. Full form editing requires an
 * authenticated session; here we lock down the guest → auth redirect and
 * the auth page's ability to bounce back to the profile editor.
 */
test.describe("Profile edit — access control", () => {
  test.skip(({}, testInfo) => testInfo.project.name !== "vp-375", "run once");

  test("guest visiting /account/profile is redirected to /auth with a redirect param", async ({ page }) => {
    await page.goto("/account/profile");
    await page.waitForURL(/\/auth/, { timeout: 5000 });
    expect(page.url()).toMatch(/redirect=%2Faccount%2Fprofile|redirect=\/account\/profile/);
  });

  test("auth page renders sign-in surface after the redirect", async ({ page }) => {
    await page.goto("/account/profile");
    await page.waitForURL(/\/auth/);

    // Sign-in surface should expose an email input and a submit control.
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in|log in|continue/i }).first()
    ).toBeVisible();
  });
});
