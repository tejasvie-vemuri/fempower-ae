# Fempower — Women's Community Platform

> Rooted Together, Rising Together.

Fempower is a members-only community platform for women in Dubai and the UAE.
It connects 300+ women across 15+ nationalities through mentorship, peer
coaching, in-person events, and a safe digital space for real conversations.

Live site → https://fempowerae.com

---

## ⚠️ Brand, domain & entity (read before writing any URL)

**The official website is `fempowerae.com`. Never write `fempower.ae` as a URL.**

`fempower.ae` is **not our domain**. It is registered to FEMPOWERMENT MOVEMENT EVENTS L.L.C.
and 301-redirects to `thefempowerment.com`, a separate Dubai women's organisation with a
confusingly similar name. Any link to `fempower.ae` sends our members, our search traffic,
and AI crawlers to a different company.

`@fempower.ae` **is** correct when it refers to the Instagram handle. The handle is fine.
The domain form is not.

Canonical identifiers, use these exact strings everywhere:

| Property | Canonical value |
|----------|-----------------|
| Website | `https://fempowerae.com` |
| Instagram | `https://www.instagram.com/fempower.ae` (no `igsh` or `utm` tracking params) |
| LinkedIn | `https://www.linkedin.com/company/fempowerae/` |

Consistency matters beyond tidiness: search engines and LLMs use matching URLs across a site
and its social profiles to confirm they describe one organisation. Mixed variants weaken that
signal, and in our case a weak signal risks being merged with the similarly named company above.

---

## What the platform does

| Feature | Description |
|---------|-------------|
| **Homepage** | Hero, About, Offerings, Programs spotlight, Events calendar, Gallery, Testimonials, FAQs |
| **Ask the Circle** | Members-only forum — post anonymously or by name, moderated by approved members |
| **Pop-up Meetups** | Member-hosted casual gatherings — RSVP or create your own |
| **Member Directory** | Searchable member profiles, gated behind auth |
| **Zara AI Coach** | AI career coach trained on UAE workplace context, powered by Google Gemini |
| **FemPower Learn** | Members-only learning platform — courses, modules, and bite-sized lessons called "Wings" (butterfly metaphor). Each wing has Context, Reflection (saved + optionally shared), and Extension (action). Progress tracking, learning journal, and admin CRUD panel with publish scheduling |
| **Auth** | Email/password + Google OAuth, admin-reviewed membership |
| **Legal** | Privacy Policy (UAE PDPL compliant) + Terms & Conditions |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend & Auth | Supabase (PostgreSQL, Row-Level Security, Storage) |
| AI | Google Gemini via Lovable AI Gateway |
| File Storage | Supabase Storage (private buckets, signed URLs) |
| Content | Google Sheets / Google Drive (events, frameworks, resources) |
| Newsletter | Substack |
| Community | WhatsApp + Instagram (@fempower.ae) |
| Built with | [Lovable](https://lovable.dev) |
| Domain | fempowerae.com |

---

## Pages & Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Homepage (all anchor sections) |
| `/circle` | Members only | Ask the Circle forum |
| `/meetups` | Members only | Pop-up meetups |
| `/directory` | Members only | Member directory |
| `/learn` | Members only | FemPower Learn — course listing with progress |
| `/learn/:courseId` | Members only | Course detail — modules, resources, progress bar |
| `/learn/:courseId/:moduleId` | Members only | Module detail — wing list with completion status |
| `/learn/:courseId/:moduleId/:wingId` | Members only | Wing — Context → Reflection → Extension learning flow |
| `/learn/journal` | Members only | Personal learning journal — all reflections in one place |
| `/admin/learn` | Admin only | Manage courses, modules, wings, and resources (CRUD) |
| `/auth` | Public | Sign in / Create account |
| `/privacy` | Public | Privacy Policy |
| `/terms` | Public | Terms & Conditions |

---

## User Roles

- **Visitor** — Browses public homepage, Zara chatbot, legal pages
- **Member** — Full access to Circle, Meetups, Directory after admin approval
- **Admin** — Moderates content, approves/removes members, manages events
- **Host** — Approved members who can create and manage pop-up meetups

---

## FemPower Learn — Data Model

| Table | Purpose |
|-------|---------|
| `learn_courses` | Top-level courses (title, description, emoji, status: draft/published/scheduled, published_at) |
| `learn_modules` | Sections within a course (title, description, optional published_at for scheduling) |
| `learn_wings` | Individual lessons — context, reflection prompt, extension/action, estimated minutes |
| `learn_resources` | Admin-managed external links per course |
| `learn_progress` | Tracks which wings a user has completed (unique per user+wing) |
| `learn_reflections` | User reflections per wing — saved, optionally shared with other members |

All tables use Row-Level Security. Content tables are readable by authenticated users. Progress and reflections are user-scoped. Admin-only write access on content tables.

### Scheduling

Courses support three statuses: `draft`, `published`, `scheduled`. When set to `scheduled` with a `published_at` timestamp, the course auto-appears to members once the time passes (enforced via RLS policy — no cron job needed). Modules can also have an optional `published_at` for drip-release of content.

---

## SEO & AI discoverability (GEO)

The site is built to be readable and citable by AI assistants (ChatGPT, Claude, Perplexity,
Gemini) as well as traditional search engines. Several pieces work together, so please do not
remove any of them without understanding what they do.

| Piece | Location | Purpose |
|-------|----------|---------|
| **Prerendering** | `vite.config.ts` plugin, outputs `dist/*/index.html` | Renders real HTML at build time. AI crawlers mostly do **not** execute JavaScript, so without this they would see an empty `<div id="root">` and nothing else. This is the single most important piece. |
| **`SeoSummary.tsx`** | Rendered `sr-only` on the homepage | A visually hidden TL;DR and key-facts block written as clean, standalone, quotable sentences. This is typically the passage an LLM extracts and cites. |
| **`HomeStructuredData.tsx`** | Injected per route | `FAQPage` + `BreadcrumbList` JSON-LD. |
| **Organization / WebSite JSON-LD** | `index.html` `<head>` | Entity definition, including `@id`, `disambiguatingDescription` (asserts we are independent of the similarly named company) and `knowsAbout` topics. |
| **`public/llms.txt`** | Served at `/llms.txt` | Plain-text site summary for LLM crawlers, with canonical URLs. |
| **`public/robots.txt`** | Served at `/robots.txt` | Explicitly allows GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot and others so we are eligible to be cited. |
| **`public/sitemap.xml`** | Served at `/sitemap.xml` | Public routes only. |

**When adding a new public page:** add it to `sitemap.xml` and `llms.txt`, register it in the
`PRERENDER_ROUTES` array in `vite.config.ts`, and give it factual, self-contained copy. LLMs quote
concrete specifics (numbers, names, cadence, locations) and skip marketing adjectives.

**After editing any JSON-LD by hand,** verify it still parses. A malformed block is silently
ignored by crawlers, which is worse than having none.

---

## Analytics (Microsoft Clarity)

Product analytics live in `src/lib/analytics/`. One import gives you everything:

```ts
import { track } from "@/lib/analytics";

track("join_cta_click", { location: "hero" });
```

A single `track()` call fans the event out to Microsoft Clarity (custom event +
filterable tags), `window.dataLayer` (so GTM can be added later without touching
components), `gtag`/`plausible` if those scripts happen to be present, a
`fempower:<event>` DOM event, and — for two event types only — the Supabase
`engagement_events` table. Nothing throws, nothing awaits.

### Setup

Set `VITE_CLARITY_PROJECT_ID` in `.env` (Clarity → Settings → Setup → project id).
**With it unset, Clarity never loads** and the rest of the pipeline no-ops — which
is the intended state for local dev and preview builds.

| Variable | Default | Effect |
|----------|---------|--------|
| `VITE_CLARITY_PROJECT_ID` | empty | Clarity project id. Empty → Clarity disabled. |
| `VITE_ANALYTICS_DEBUG` | `false` | Log every tracked event to the console. `?analytics_debug` on any URL does the same for one visit. |
| `VITE_ANALYTICS_ALLOW_LOCALHOST` | `false` | Track from localhost too. Off by default so dev traffic stays out of the dashboards. |
| `VITE_ANALYTICS_RESPECT_DNT` | `false` | Honour the legacy `DNT` header. Off by default because several browsers send it unconditionally. Global Privacy Control is *always* honoured. |

### Files

| File | Purpose |
|------|---------|
| `config.ts` | Env flags, the privacy gate, PII scrubbing, path redaction |
| `clarity.ts` | Lazy Clarity loader (injected on first idle, not in `<head>`) + typed wrapper |
| `events.ts` | The event-name taxonomy and route→section mapping |
| `index.ts` | `track`, `trackPageView`, `identifyMember`, `trackError`, the sink fan-out |
| `autoCapture.ts` | Delegated listeners: outbound clicks, scroll depth, time on page, section views, errors |
| `webVitals.ts` | LCP / CLS / INP / FID / FCP / TTFB via `PerformanceObserver`, no dependency |
| `../../components/Analytics.tsx` | Mounts the pipeline; page views and identity |

### What is captured without any per-component work

Page views, session/device context, scroll-depth milestones, time on page, section
visibility on long pages, outbound link clicks (with WhatsApp / Instagram /
LinkedIn / Substack as their own events), downloads, unhandled errors and promise
rejections, and Core Web Vitals.

Opt in to more without writing a handler:

```tsx
<Link to="/join" data-analytics-event="join_cta_click" data-analytics-location="header">
<form data-analytics-form="newsletter">
<a href="https://wa.me/…" data-location="sticky_mobile">
```

### Rules

- **Event names are a typed union** in `events.ts`. Add the name there first — a
  typo then fails the build instead of quietly creating a second event in Clarity.
- **Never pass personal data.** `sanitizeProps` drops any prop whose key names PII
  and scrubs emails/phones out of the values it keeps, but don't rely on it: pass
  ids and enums, not names or free text. `identifyMember` sends the Supabase UUID
  and nothing else.
- **Mask sensitive UI** with `data-clarity-mask="True"` on any container showing
  credentials or member details. Already applied to the auth card, the contact
  form and the directory grid.
- **`engagement_events` is not a general analytics sink.** RSVPs, circle posts and
  replies, meetup hosting/RSVPs and learn wings are written by SECURITY DEFINER
  triggers in the database, so mirroring them from the client double-counts them
  on the Northstar dashboard. The bridge in `index.ts` covers only
  `whatsapp_cta_click` and `directory_profile_viewed`, and the table has a CHECK
  constraint — adding anything needs a migration first.
- **Everything is browser-only.** The public routes are prerendered through
  `renderToString`, so keep side effects inside effects.

Visitors can turn analytics off per browser from the switch on `/privacy`
(`AnalyticsOptOutToggle`), which the Privacy Policy promises exists — the PDPL
right to object. It's checked on every tracking call, so it takes effect immediately.

---

## Community

- Instagram: [@fempower.ae](https://www.instagram.com/fempower.ae)
- LinkedIn: [linkedin.com/company/fempowerae](https://www.linkedin.com/company/fempowerae/)
- To join: DM @fempower.ae on Instagram
