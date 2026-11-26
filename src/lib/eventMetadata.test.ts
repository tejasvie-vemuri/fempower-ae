import { describe, expect, it } from "vitest";
import { eventMetadata, eventTimezone, type EventPreviewData } from "./eventMetadata";

const event: EventPreviewData = {
  slug: "when-ai-does-the-work-who-decides", title: "When AI does the work, Who Decides?",
  description: null, location: "Lolo House, Dubai", starts_at: "2026-10-24T06:00:00Z",
  timezone: "Asia/Dubai", price_cents: 2900, currency: "AED",
  members_only: false, cover_image_url: "/event-poster.jpg",
};
describe("event preview data", () => {
  it("uses the event's Dubai timezone rather than the viewer's timezone", () => {
    expect(eventMetadata(event).description).toContain("24 Oct 2026, 10:00 am");
  });
  it("uses the configured AED 29 price", () => {
    expect(eventMetadata(event).description).toContain("AED 29");
  });
  it("preserves decimal ticket prices and free events", () => {
    expect(eventMetadata({ ...event, price_cents: 2950 }).description).toContain("AED 29.5");
    expect(eventMetadata({ ...event, price_cents: 0 }).description).toContain("Free");
  });
  it("distinguishes guest-accessible events from members-only events", () => {
    expect(eventMetadata(event).access).toBe("Members & guests welcome");
    expect(eventMetadata({ ...event, members_only: true }).access).toBe("Members only");
  });
  it("resolves event assets against the actual public domain", () => {
    expect(eventMetadata(event).image).toBe("https://fempowerae.com/event-poster.jpg");
    expect(eventMetadata({ ...event, cover_image_url: "javascript:alert(1)" }).image).toBeNull();
  });
  it("falls back to Dubai for missing or unusable timezones", () => {
    expect(eventTimezone("Asia/Dubai")).toBe("Asia/Dubai");
    expect(eventTimezone(null)).toBe("Asia/Dubai");
    expect(eventTimezone("Mars/Phobos")).toBe("Asia/Dubai");
  });
  it("shows a 5:00 am Dubai hike as 5:00 am, not the viewer's local hour", () => {
    const hike = { ...event, starts_at: "2026-12-12T01:00:00Z" };
    const shown = new Date(hike.starts_at).toLocaleTimeString("en-AE", {
      hour: "2-digit", minute: "2-digit", hour12: true, timeZone: eventTimezone(hike.timezone),
    });
    expect(shown.toLowerCase()).toBe("05:00 am");
    expect(eventMetadata(hike).description).toContain("12 Dec 2026, 5:00 am");
  });
});