import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * Responsive header / navigation snapshot tests.
 *
 * Captures a screenshot of the header at each common breakpoint (320, 375,
 * 768, 1024) and asserts which navigation surface should be present:
 *   - <768  → hamburger trigger only, desktop nav hidden
 *   - >=768 → inline desktop nav visible, hamburger hidden
 *
 * Screenshots are written under tests/e2e/__screenshots__/header-<viewport>.png
 * for visual review. We don't use Playwright's snapshot matcher to avoid
 * baseline-management overhead in this sandbox.
 */

const screenshotsDir = path.join(process.cwd(), "tests", "e2e", "__screenshots__");
fs.mkdirSync(screenshotsDir, { recursive: true });

test.describe("Responsive header layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("banner")).toBeVisible();
  });

  test("renders the correct navigation surface for the viewport", async ({
    page,
  }, testInfo) => {
    const header = page.getByRole("banner");
    const viewport = page.viewportSize();
    const width = viewport?.width ?? 0;
    const isMobile = width < 768;

    const hamburger = header.getByRole("button", { name: "Toggle menu" });
    const desktopAbout = header.getByRole("link", { name: "About", exact: true });

    if (isMobile) {
      await expect(hamburger).toBeVisible();
      await expect(desktopAbout).toBeHidden();
    } else {
      await expect(hamburger).toBeHidden();
      // At least one of the desktop nav links is visible. Different links
      // appear at md/lg/xl per the showFrom matrix, but "About" appears
      // from md upwards and "Events" from md upwards.
      await expect(desktopAbout).toBeVisible();
    }

    const file = path.join(
      screenshotsDir,
      `header-${testInfo.project.name}-${width}.png`,
    );
    await header.screenshot({ path: file });
  });

  test("logo always links back to home", async ({ page }) => {
    const header = page.getByRole("banner");
    const logoLink = header.getByRole("link").first();
    await expect(logoLink).toHaveAttribute("href", "/");
  });
});
