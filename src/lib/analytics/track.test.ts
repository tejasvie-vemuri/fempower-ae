import { beforeEach, describe, expect, it, vi } from "vitest";

const logEngagement = vi.fn();
vi.mock("@/lib/engagement", () => ({ logEngagement }));

/**
 * The analytics module reads its env flags once at import time, so each test
 * re-imports it with the flags it needs. jsdom serves pages from localhost,
 * which is excluded by default — hence VITE_ANALYTICS_ALLOW_LOCALHOST.
 */
const loadAnalytics = async () => {
  vi.resetModules();
  vi.stubEnv("VITE_CLARITY_PROJECT_ID", "test-project");
  vi.stubEnv("VITE_ANALYTICS_ALLOW_LOCALHOST", "true");
  return import("./index");
};

const clarityQueue = () =>
  Array.from((window.clarity?.q ?? []) as ArrayLike<IArguments>).map((args) => Array.from(args));

const setPrivacySignal = (enabled: boolean) => {
  Object.defineProperty(navigator, "globalPrivacyControl", {
    value: enabled ? true : undefined,
    configurable: true,
  });
};

beforeEach(() => {
  logEngagement.mockClear();
  delete (window as { clarity?: unknown }).clarity;
  delete (window as { dataLayer?: unknown }).dataLayer;
  setPrivacySignal(false);
});

describe("track", () => {
  it("fans an event out to Clarity and the GTM data layer", async () => {
    const { initAnalytics, track } = await loadAnalytics();
    initAnalytics();
    track("join_cta_click", { location: "header" });

    expect(clarityQueue()).toContainEqual(["event", "join_cta_click"]);
    expect(clarityQueue()).toContainEqual(["set", "location", "header"]);

    const layer = (window as { dataLayer?: Record<string, unknown>[] }).dataLayer ?? [];
    const entry = layer.find((e) => e.event === "join_cta_click");
    expect(entry).toMatchObject({ event: "join_cta_click", location: "header" });
  });

  it("never forwards personal data, whatever the caller passes", async () => {
    const { track } = await loadAnalytics();
    track("sign_in_failed", { email: "maya@example.com", reason: "Invalid login" });

    const layer = (window as { dataLayer?: Record<string, unknown>[] }).dataLayer ?? [];
    const entry = layer.find((e) => e.event === "sign_in_failed");
    expect(entry).toMatchObject({ reason: "Invalid login" });
    expect(entry).not.toHaveProperty("email");
    expect(JSON.stringify(layer)).not.toContain("maya@example.com");
  });

  it("dispatches a DOM event so in-app listeners can react", async () => {
    const { track } = await loadAnalytics();
    const listener = vi.fn();
    window.addEventListener("fempower:whatsapp_cta_click", listener);
    track("whatsapp_cta_click", { location: "sticky_mobile" });
    window.removeEventListener("fempower:whatsapp_cta_click", listener);

    expect(listener).toHaveBeenCalledOnce();
  });

  it("bridges the mapped events to engagement_events", async () => {
    const { track } = await loadAnalytics();
    track("whatsapp_cta_click", { location: "sticky_mobile" });

    expect(logEngagement).toHaveBeenCalledWith("whatsapp_cta_click", null, {
      location: "sticky_mobile",
    });
  });

  it("leaves engagement_events alone for Clarity-only events", async () => {
    const { track } = await loadAnalytics();
    track("scroll_depth", { depth: 50 });

    expect(logEngagement).not.toHaveBeenCalled();
  });

  it("passes target_id through as the engagement target", async () => {
    const { track } = await loadAnalytics();
    track("directory_profile_viewed", { target_id: "user-uuid", source: "grid" });

    expect(logEngagement).toHaveBeenCalledWith(
      "directory_profile_viewed",
      "user-uuid",
      expect.objectContaining({ source: "grid" }),
    );
  });

  it("stays silent for a visitor sending Global Privacy Control", async () => {
    const { track } = await loadAnalytics();
    setPrivacySignal(true);
    track("join_cta_click", { location: "header" });

    expect((window as { dataLayer?: unknown[] }).dataLayer ?? []).toHaveLength(0);
    expect(logEngagement).not.toHaveBeenCalled();
  });
});

describe("trackPageView", () => {
  it("reports a redacted path and skips repeat views of the same page", async () => {
    const { trackPageView } = await loadAnalytics();
    trackPageView("/reset-password", "?token=secret&utm_source=email");
    trackPageView("/reset-password", "?token=secret&utm_source=email");

    const layer = (window as { dataLayer?: Record<string, unknown>[] }).dataLayer ?? [];
    const views = layer.filter((e) => e.event === "page_view");
    expect(views).toHaveLength(1);
    expect(views[0].path).toBe("/reset-password?token=[redacted]&utm_source=email");
    expect(views[0].section).toBe("auth");
  });
});

describe("identifyMember", () => {
  it("sends the user id but no name or email", async () => {
    const { identifyMember } = await loadAnalytics();
    identifyMember({ userId: "user-uuid", provider: "google", createdAt: "2026-01-01T00:00:00Z" });

    const queue = clarityQueue();
    expect(queue.some((c) => c[0] === "identify" && c[1] === "user-uuid")).toBe(true);
    expect(queue).toContainEqual(["set", "auth_state", "authenticated"]);
    expect(queue).toContainEqual(["set", "auth_provider", "google"]);
  });
});
