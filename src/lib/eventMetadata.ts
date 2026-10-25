import { pageTags, replaceHeadTags } from "./pageMetadata";
export const EVENT_SITE = "https://fempowerae.com";

export interface EventPreviewData {
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  timezone?: string | null;
  price_cents: number;
  currency: string;
  cover_image_url: string | null;
  members_only?: boolean;
}

export function eventMetadata(event: EventPreviewData) {
  const date = new Date(event.starts_at);
  let timezone = event.timezone || "Asia/Dubai";
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: timezone });
  } catch {
    timezone = "Asia/Dubai";
  }
  const when = date.toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: timezone,
  });
  const price = event.price_cents === 0
    ? "Free"
    : `${event.currency} ${Number((event.price_cents / 100).toFixed(2))}`;
  const access = event.members_only === false ? "Members & guests welcome" : "Members only";
  const details = [when, timezone === "Asia/Dubai" ? "Dubai time" : timezone,
    event.location, price, access].filter(Boolean).join(" · ");
  const summary = event.description?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  let image: string | null = null;
  if (event.cover_image_url) {
    try {
      const resolved = new URL(event.cover_image_url, EVENT_SITE);
      if (resolved.protocol === "https:") image = resolved.href;
    } catch { /* An invalid image must not break event publishing. */ }
  }
  return {
    title: `${event.title} — Fempower`,
    url: `${EVENT_SITE}/events/${encodeURIComponent(event.slug)}`,
    description: summary ? `${details}. ${summary.slice(0, 180)}` : details,
    image,
    access,
  };
}

export function escapeEventHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Replace, rather than append to, the homepage's social-preview tags. */
export function eventHtml(template: string, event: EventPreviewData, jsonLd: Record<string, unknown>) {
  const meta = eventMetadata(event);
  const tags = [
    ...pageTags({
      path: `/events/${encodeURIComponent(event.slug)}`,
      title: meta.title,
      description: meta.description,
      image: meta.image,
      imageAlt: event.title,
    }),
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`,
  ];
  return replaceHeadTags(template, tags);
}
