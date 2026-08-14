import { defineConfig, type Plugin, build as viteBuild } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";
import { componentTagger } from "lovable-tagger";

const PRERENDER_ROUTES = [
  "/",
  "/join",
  "/meetups",
  "/privacy",
  "/terms",
  // Public content pages. These exist to be found by search engines and AI
  // assistants, so prerendering them is not optional — crawlers do not run JS.
  "/lonely-in-dubai",
  "/roundtables",
  "/women-networking-dubai",
];

const SITE = "https://fempowerae.com";

type BuildEvent = {
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  price_cents: number;
  currency: string;
  cover_image_url: string | null;
  capacity: number;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Writes dist/events/<slug>/index.html for every published, upcoming event.
 *
 * The body stays client-rendered — the SSR bundle has no database access —
 * but the head carries a real title, description, canonical and schema.org
 * Event markup, which is what search engines and AI assistants actually read
 * when answering "what women's events are on in Dubai".
 */
async function writeEventShells(
  distRoot: string,
  template: string,
  env: Record<string, string>,
) {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("[prerender] no Supabase env — skipping event shells");
    return;
  }

  let events: BuildEvent[] = [];
  try {
    const res = await fetch(
      `${url}/rest/v1/events?select=slug,title,description,location,starts_at,ends_at,price_cents,currency,cover_image_url,capacity&status=eq.published&starts_at=gte.${new Date().toISOString()}&order=starts_at.asc&limit=100`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    events = (await res.json()) as BuildEvent[];
  } catch (err) {
    console.warn(
      "[prerender] could not fetch events, skipping event shells:",
      (err as Error).message,
    );
    return;
  }

  for (const ev of events) {
    const canonical = `${SITE}/events/${ev.slug}`;
    const description = (
      ev.description?.replace(/\s+/g, " ").trim() ||
      `${ev.title} — a Fempower gathering for women in the UAE${
        ev.location ? ` at ${ev.location}` : ""
      }. Open to Fempower members.`
    ).slice(0, 155);
    const title = `${ev.title} — Fempower event in the UAE`.slice(0, 60);

    const jsonLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: ev.title,
      url: canonical,
      startDate: ev.starts_at,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      description,
      location: {
        "@type": "Place",
        name: ev.location || "United Arab Emirates",
        address: {
          "@type": "PostalAddress",
          addressLocality: ev.location || "Dubai",
          addressCountry: "AE",
        },
      },
      organizer: {
        "@type": "Organization",
        name: "Fempower",
        url: SITE,
        "@id": `${SITE}/#organization`,
      },
      isAccessibleForFree: ev.price_cents === 0,
      inLanguage: "en-AE",
      offers: {
        "@type": "Offer",
        url: canonical,
        price: (ev.price_cents / 100).toFixed(2),
        priceCurrency: ev.currency,
        availability: "https://schema.org/InStock",
        category: "Members only — Fempower membership required to register",
      },
    };
    if (ev.ends_at) jsonLd.endDate = ev.ends_at;
    if (ev.cover_image_url) jsonLd.image = [ev.cover_image_url];

    const head = [
      `<title>${escapeHtml(title)}</title>`,
      `<meta name="description" content="${escapeHtml(description)}" />`,
      `<link rel="canonical" href="${canonical}" />`,
      `<meta property="og:type" content="article" />`,
      `<meta property="og:title" content="${escapeHtml(ev.title)} — Fempower" />`,
      `<meta property="og:description" content="${escapeHtml(description)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(
        /</g,
        "\\u003c",
      )}</script>`,
    ].join("\n    ");

    const html = template
      .replace(/<title>[\s\S]*?<\/title>/, "")
      .replace(/<meta\s+name="description"[^>]*>/, "")
      .replace(/<link\s+rel="canonical"[^>]*>/, "")
      .replace("</head>", `    ${head}\n  </head>`);

    const outPath = path.join(distRoot, "events", ev.slug, "index.html");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, "utf-8");
    console.log(`[prerender] wrote events/${ev.slug}/index.html`);
  }
}

/**
 * Runs after the client build finishes. Programmatically kicks off a second
 * Vite build in SSR mode against src/entry-server.tsx, imports the resulting
 * render() function, prerenders each public route into a static HTML file
 * inside dist/, then removes the SSR output. Uses an env flag to prevent
 * the nested SSR build from re-triggering this plugin recursively.
 */
function prerenderPlugin(env: Record<string, string>): Plugin {
  return {
    name: "fempower-prerender",
    apply: "build",
    async closeBundle() {
      // Skip when this closeBundle fires for the SSR build itself, or when
      // explicitly disabled.
      if (process.env.FEMPOWER_SSR_BUILD === "1") return;
      if (process.env.FEMPOWER_SKIP_PRERENDER === "1") return;
      // Only prerender the client build (which writes dist/index.html).
      const distRoot = path.resolve(__dirname, "dist");
      const clientIndex = path.join(distRoot, "index.html");
      if (!fs.existsSync(clientIndex)) return;

      const ssrOutDir = path.resolve(__dirname, "dist-ssr");

      // eslint-disable-next-line no-console
      console.log("\n[prerender] building SSR bundle…");
      process.env.FEMPOWER_SSR_BUILD = "1";
      try {
        await viteBuild({
          configFile: false,
          root: __dirname,
          logLevel: "warn",
          resolve: {
            alias: { "@": path.resolve(__dirname, "./src") },
          },
          plugins: [
            react(),
            // Rewrite any import that resolves to the real supabase client
            // (matches both `@/integrations/supabase/client` and the
            // relative `../supabase/client` used by the auto-generated
            // lovable integration) to the SSR-safe stub.
            {
              name: "fempower-ssr-supabase-stub",
              enforce: "pre",
              async resolveId(source, importer) {
                if (!/\/supabase\/client(?:\.ts)?$/.test(source) &&
                    source !== "@/integrations/supabase/client") {
                  return null;
                }
                const resolved = await this.resolve(source, importer, {
                  skipSelf: true,
                });
                if (!resolved) return null;
                if (resolved.id.endsWith("/src/integrations/supabase/client.ts")) {
                  return path.resolve(
                    __dirname,
                    "./src/integrations/supabase/client.ssr.ts",
                  );
                }
                return null;
              },
            },
          ],
          build: {
            ssr: path.resolve(__dirname, "src/entry-server.tsx"),
            outDir: ssrOutDir,
            emptyOutDir: true,
            rollupOptions: {
              input: path.resolve(__dirname, "src/entry-server.tsx"),
              output: { format: "esm", entryFileNames: "entry-server.mjs" },
            },
          },
        });
      } finally {
        delete process.env.FEMPOWER_SSR_BUILD;
      }

      const ssrEntry = path.join(ssrOutDir, "entry-server.mjs");
      if (!fs.existsSync(ssrEntry)) {
        console.warn("[prerender] SSR entry missing, skipping prerender");
        return;
      }

      const mod: { render: (url: string) => { html: string; headTags: string } } =
        await import(pathToFileURL(ssrEntry).href);

      const template = fs.readFileSync(clientIndex, "utf-8");

      // Event pages: emit a static shell per published event with real head
      // metadata and schema.org Event JSON-LD. We do not SSR the body (the
      // SSR bundle has no database access), but crawlers and AI assistants
      // read the head — which is what "women's events in Dubai" answers use.
      await writeEventShells(distRoot, template, env);


      for (const route of PRERENDER_ROUTES) {
        let rendered: { html: string; headTags: string };
        try {
          rendered = mod.render(route);
        } catch (err) {
          console.warn(
            `[prerender] ${route} threw during renderToString — leaving client-rendered:`,
            (err as Error).message,
          );
          continue;
        }

        // Only strip a static tag when Helmet supplied a replacement, so
        // routes without their own Helmet fall back to the sitewide static
        // <title>, <meta name="description"> and <link rel="canonical">.
        const helmetTitleMatch = /<title[^>]*>([\s\S]*?)<\/title>/.exec(
          rendered.headTags,
        );
        const hasHelmetTitle =
          !!helmetTitleMatch && helmetTitleMatch[1].trim().length > 0;
        const hasHelmetDesc =
          /<meta[^>]*name="description"/.test(rendered.headTags);
        const hasHelmetCanonical =
          /<link[^>]*rel="canonical"/.test(rendered.headTags);

        // Drop the empty title placeholder Helmet emits when no <Helmet>
        // set a title on this route — otherwise it blanks the static one.
        let headTagsToInject = rendered.headTags;
        if (!hasHelmetTitle) {
          headTagsToInject = headTagsToInject.replace(
            /<title[^>]*>\s*<\/title>/,
            "",
          );
        }

        let head = template;
        if (hasHelmetTitle) {
          head = head.replace(/<title>[\s\S]*?<\/title>/, "");
        }
        if (hasHelmetDesc) {
          head = head.replace(/<meta\s+name="description"[^>]*>/, "");
        }
        if (hasHelmetCanonical) {
          head = head.replace(/<link\s+rel="canonical"[^>]*>/, "");
        }

        head = head.replace(
          "</head>",
          `    ${headTagsToInject}\n  </head>`,
        );


        // Replace <div id="root"></div> with rendered markup (no hydrate —
        // client createRoot replaces children).
        const finalHtml = head.replace(
          /<div id="root">[\s\S]*?<\/div>/,
          `<div id="root">${rendered.html}</div>`,
        );

        const outPath =
          route === "/"
            ? path.join(distRoot, "index.html")
            : path.join(distRoot, route.replace(/^\//, ""), "index.html");
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, finalHtml, "utf-8");
        console.log(`[prerender] wrote ${path.relative(__dirname, outPath)}`);
      }

      // Clean up SSR output — not served in production.
      try {
        fs.rmSync(ssrOutDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
      console.log("[prerender] done\n");
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode, isSsrBuild }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Only attach the prerender plugin to the client build. The nested SSR
    // build sets FEMPOWER_SSR_BUILD but we also guard here for clarity.
    !isSsrBuild && prerenderPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
}));
