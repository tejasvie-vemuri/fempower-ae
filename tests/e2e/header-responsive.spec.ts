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
    // First item of the primary nav in Header.tsx. The nav was trimmed to
    // three items ("What We Do", "Events", "Directory"); there is no longer
    // an "About" or "Programs" link.
    const desktopNavLink = header.getByRole("link", { name: "What We Do", exact: true });

    if (isMobile) {
      await expect(hamburger).toBeVisible();
      // The desktop nav is still in the DOM, hidden by Tailwind's `md:flex`.
      await expect(desktopNavLink).toBeHidden();
    } else {
      await expect(hamburger).toBeHidden();
      await expect(desktopNavLink).toBeVisible();
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
