/**
 * Social-preview (WhatsApp / LinkedIn / X) head tags for every public page.
 * Social crawlers don't run JavaScript, so these are written into the static
 * HTML at build time. Pages may still set richer tags with Helmet; those win.
 */
export const SITE = "https://fempowerae.com";
export const DEFAULT_SHARE_IMAGE = `${SITE}/og-default.jpg`;
export const DEFAULT_SHARE_IMAGE_ALT = "Fempower — Rooted Together, Rising Together";

export interface PageMeta {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
}

/** Public routes that are not prerendered still get their own preview. */
export const SHELL_PAGES: PageMeta[] = [
  {
    path: "/circle",
    title: "The Circle — Honest Conversations for Women in the UAE",
    description: "A safe, moderated space for women in the UAE to share what's really going on — careers, relocation, motherhood, money and more.",
  },
  {
    path: "/directory",
    title: "Member Directory — Fempower Women's Community UAE",
    description: "Find and connect with Fempower members across the UAE by industry, expertise and what they're open to.",
  },
  {
    path: "/auth",
    title: "Sign in or join — Fempower",
    description: "Sign in to your Fempower account or create one to join the UAE's women-only community.",
  },
  {
    path: "/account/tickets",
    title: "My tickets — Fempower",
    description: "Your Fempower event tickets: view, cancel or transfer them.",
  },
  {
    path: "/learn",
    title: "Learn — Short guided lessons for women | Fempower",
    description: "Bite-sized courses with reflections, built for women growing their careers in the UAE.",
  },
  {
    path: "/starter-kit",
    title: "Newcomer Starter Kit — Your UAE relocation checklist | Fempower",
    description: "A personalised, downloadable checklist for women moving to the UAE.",
  },
  {
    path: "/ai-edge",
    title: "AI Edge — Practical AI prompts for women at work | Fempower",
    description: "Ready-to-use AI prompts and step-by-step guides for women in the UAE.",
  },
];

export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function absoluteImage(src: string | null | undefined): string | null {
  if (!src) return null;
  try {
    const u = new URL(src, SITE);
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

export function pageTags(meta: PageMeta): string[] {
  const esc = escapeHtml;
  const url = `${SITE}${meta.path === "/" ? "/" : meta.path}`;
  const image = absoluteImage(meta.image) ?? DEFAULT_SHARE_IMAGE;
  const alt = meta.image && absoluteImage(meta.image) ? meta.imageAlt ?? meta.title : DEFAULT_SHARE_IMAGE_ALT;
  return [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Fempower" />`,
    `<meta property="og:locale" content="en_AE" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:alt" content="${esc(alt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    `<meta name="twitter:image:alt" content="${esc(alt)}" />`,
  ];
}

const SOCIAL_META = /(?:name|property)\s*=\s*["'](?:description|og:[^"']+|twitter:[^"']+)["']/i;

/** Strip every title/description/canonical/og/twitter tag from a <head>. */
export function stripSocialTags(head: string) {
  return head.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\b[^>]*>/gi, (tag) => (SOCIAL_META.test(tag) ? "" : tag))
    .replace(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/gi, "");
}

/** Replace, never append to, the homepage's preview tags. */
export function replaceHeadTags(html: string, tags: string[]) {
  return html.replace(/<head>([\s\S]*?)<\/head>/i, (_, head: string) =>
    `<head>${stripSocialTags(head)}\n${tags.join("\n")}\n</head>`);
}

const attr = (tag: string, name: string) =>
  new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i").exec(tag)?.[1];

/**
 * Read the title/description/canonical/image a page set through Helmet so the
 * build can write one clean, complete set of preview tags for it.
 */
export function metaFromHelmet(headTags: string, path: string): PageMeta | null {
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(headTags)?.[1]?.trim();
  if (!title) return null;
  const metas = headTags.match(/<meta\b[^>]*>/gi) ?? [];
  const find = (key: string) => {
    const tag = metas.find((t) => attr(t, "name") === key || attr(t, "property") === key);
    return tag ? attr(tag, "content") : undefined;
  };
  const unescape = (s: string) => s.replace(/&quot;/g, '"').replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&");
  const description = find("description") ?? find("og:description");
  if (!description) return null;
  const image = find("og:image") ?? find("twitter:image");
  return {
    path,
    title: unescape(find("og:title") ?? title),
    description: unescape(description),
    image: image ? unescape(image) : null,
    imageAlt: find("og:image:alt") ? unescape(find("og:image:alt")!) : undefined,
  };
}
