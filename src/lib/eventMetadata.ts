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
  const esc = escapeEventHtml;
  const tags = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<link rel="canonical" href="${esc(meta.url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Fempower" />`,
    `<meta property="og:locale" content="en_AE" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(meta.url)}" />`,
    `<meta name="twitter:card" content="${meta.image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    ...(meta.image ? [
      `<meta property="og:image" content="${esc(meta.image)}" />`,
      `<meta property="og:image:alt" content="${esc(event.title)}" />`,
      `<meta name="twitter:image" content="${esc(meta.image)}" />`,
      `<meta name="twitter:image:alt" content="${esc(event.title)}" />`,
    ] : []),
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`,
  ];
  return template.replace(/<head>([\s\S]*?)<\/head>/i, (_, head: string) => {
    const clean = head.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
      .replace(/<meta\b[^>]*>/gi, (tag) =>
        /(?:name|property)\s*=\s*["'](?:description|og:[^"']+|twitter:[^"']+)["']/i.test(tag) ? "" : tag)
      .replace(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/gi, "");
    return `<head>${clean}\n${tags.join("\n")}\n</head>`;
  });
}