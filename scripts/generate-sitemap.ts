/**
 * Writes public/sitemap.xml before dev and build.
 *
 * Static public routes are listed by hand below. Every published event is
 * added automatically from the database, so event pages stop being invisible
 * to search engines and AI crawlers the moment an admin publishes them.
 */

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://fempowerae.com";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? "https://uaiymunelgvvnznkxeik.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaXltdW5lbGd2dm56bmt4ZWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ2NzUsImV4cCI6MjA4ODExMDY3NX0.sL1kcUsg10yNj5YVjUNUhoHlVafpdFnDHH1RsJyIesU";

interface SitemapEntry {
  path: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/join", changefreq: "monthly", priority: "0.9" },
  { path: "/events", changefreq: "daily", priority: "0.9" },
  { path: "/lonely-in-dubai", changefreq: "monthly", priority: "0.9" },
  { path: "/roundtables", changefreq: "monthly", priority: "0.9" },
  { path: "/women-networking-dubai", changefreq: "monthly", priority: "0.9" },
  { path: "/ai-coach-for-women-uae", changefreq: "monthly", priority: "0.9" },
  { path: "/try/invisible-labour-audit", changefreq: "monthly", priority: "0.8" },
  { path: "/try/the-ask-checklist", changefreq: "monthly", priority: "0.8" },
  { path: "/try/am-i-actually-fine", changefreq: "monthly", priority: "0.8" },
  { path: "/try/relocation-load", changefreq: "monthly", priority: "0.8" },
  { path: "/meetups", changefreq: "daily", priority: "0.7" },
  { path: "/circle", changefreq: "daily", priority: "0.7" },
  { path: "/directory", changefreq: "weekly", priority: "0.6" },
  { path: "/auth", changefreq: "yearly", priority: "0.4" },
  { path: "/account/tickets", changefreq: "monthly", priority: "0.3" },
  { path: "/account/profile", changefreq: "monthly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

async function fetchEventPaths(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/events?select=slug,starts_at&status=eq.published&order=starts_at.desc&limit=500`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as { slug: string; starts_at: string }[];
    if (!Array.isArray(rows)) throw new Error("unexpected response shape");
    const now = Date.now();
    return rows
      .filter((r) => !!r.slug)
      .map((r) => ({
        path: `/events/${r.slug}`,
        changefreq:
          new Date(r.starts_at).getTime() > now
            ? ("daily" as const)
            : ("yearly" as const),
        priority: new Date(r.starts_at).getTime() > now ? "0.9" : "0.5",
      }));
  } catch (err) {
    console.warn(
      "[sitemap] could not fetch events, writing static routes only:",
      (err as Error).message,
    );
    return [];
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

const entries = [...staticEntries, ...(await fetchEventPaths())];
writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
