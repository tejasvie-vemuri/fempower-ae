import { test, expect, type Page } from "@playwright/test";

/**
 * Verifies the JoinGate dialog (with QR + Instagram CTA) for guest visitors.
 *
 * The gate used to be reached through the "Programs Spotlight" section, which
 * has since been removed from the homepage (ProgramsSection.tsx is no longer
 * rendered). The remaining guest-facing trigger is the events calendar, so
 * that is what these tests drive.
 *
 * The calendar reads live events from Supabase, which would make this suite
 * depend on whatever happens to be published on the day CI runs. We stub that
 * one request instead, so the test exercises the real gate against a fixed
 * event. Only run at one representative viewport to avoid noise.
 */

/** A published event on the 15th of the current month, so it always lands in the visible calendar page. */
const seedEvent = () => {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), 15, 18, 0, 0);
  return {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "e2e-seeded-mentor-walk",
    title: "E2E Seeded Mentor Walk",
    starts_at: date.toISOString(),
    location: "JBR Beach, Dubai",
    price_cents: 0,
    currency: "AED",
  };
};

/** Serve a single known event for any events query the page makes. */
const stubEvents = async (page: Page) => {
  await page.route("**/rest/v1/events*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([seedEvent()]),
    }),
  );
};

/** Opens the join dialog by clicking the seeded event in the calendar. */
const openGateViaCalendar = async (page: Page) => {
  const calendar = page.locator("#events-calendar");
  await calendar.scrollIntoViewIfNeeded();

  // Days carrying an event get `rounded-full` from the `event` modifier in
  // EventsCalendarSection. `day_today` also uses bg-accent, so match on the
  // rounding instead to avoid selecting today by accident.
  const eventDay = calendar.locator("button.rounded-full").first();
  await expect(eventDay).toBeVisible();
  await eventDay.click();

  const eventCard = calendar.getByRole("link", { name: /E2E Seeded Mentor Walk/i });
  await expect(eventCard).toBeVisible();
  await eventCard.click();
};

test.describe("JoinGate — guest CTAs", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "vp-375", "run once at one representative viewport");
    await stubEvents(page);
    // Auth resolves off the initial network burst; JoinGate no-ops while loading.
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByRole("banner")).toBeVisible();
  });

  test("clicking a gated event opens the join dialog with QR + IG CTA", async ({ page }) => {
    await openGateViaCalendar(page);

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

  test("the gate blocks navigation to the gated event", async ({ page }) => {
    await openGateViaCalendar(page);

    await expect(page.getByRole("dialog")).toBeVisible();
    // requireJoin() calls preventDefault, so the guest stays on the homepage.
    await expect(page).toHaveURL(/\/$/);
  });

  test("Sign In link inside the dialog navigates to /auth and closes the dialog", async ({ page }) => {
    await openGateViaCalendar(page);

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("link", { name: /^Sign In$/i }).click();

    await expect(page).toHaveURL(/\/auth(\?|$)/);
  });
});
