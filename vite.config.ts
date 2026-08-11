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
];

/**
 * Runs after the client build finishes. Programmatically kicks off a second
 * Vite build in SSR mode against src/entry-server.tsx, imports the resulting
 * render() function, prerenders each public route into a static HTML file
 * inside dist/, then removes the SSR output. Uses an env flag to prevent
 * the nested SSR build from re-triggering this plugin recursively.
 */
function prerenderPlugin(): Plugin {
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
