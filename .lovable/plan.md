# Getting recommended by ChatGPT, Claude and Perplexity

Goal: when someone asks an AI assistant "where can a woman network in Dubai?", Fempower is in the retrieval set, is easy to quote, and is described accurately.

Four pieces, built in this order.

---

## 1. Answer page: `/women-networking-dubai`

A genuinely useful guide, not a brochure. Assistants quote pages that answer the whole question, including the parts that mention other options — a page that only sells itself gets skipped.

Structure:
- H1: "Women's networking in Dubai and the UAE: a practical guide"
- Short intro answering the query in the first 60 words (this is the snippet models lift).
- **The landscape** — a comparison table of real UAE women's communities: free WhatsApp groups, paid membership clubs, professional councils, small-format communities. Same honest framing already used on `/lonely-in-dubai`, which names The Ipchics, Soul Sisters Dubai, The Endless Club, Dubai Business Women Council, IBWG Abu Dhabi.
- **How to choose** — breadth (large events, contacts) vs depth (capped recurring groups, friendships).
- **Where Fempower fits** — format, cost, cadence, emirates covered, who it suits and who it does not.
- **FAQ block** — 6–8 self-contained Q/As, each quotable standing alone: "Are there women-only networking groups in Dubai?", "Is women's networking in Dubai free?", "What's the best networking group for a woman new to Dubai?", "Where can I network as a woman in Abu Dhabi / Sharjah?", "Do I need to be a business owner?".
- Clear next step: join WhatsApp / see upcoming events.

Wiring: route in `App.tsx`, added to `PRERENDER_ROUTES` in `vite.config.ts` (crawlers do not run JS, so this is mandatory), Helmet title/description/canonical/OG, `PageJsonLd` for FAQPage + BreadcrumbList, entry in `sitemap.xml`, links from the footer and from `/lonely-in-dubai`.

Facts rule: every claim about another organisation stays generic and verifiable (format, whether it is free, which emirates). No invented member counts, prices or ratings.

---

## 2. Entity data, site-wide

New `src/components/OrganizationJsonLd.tsx`, rendered once in the app shell so it appears on every prerendered page:

- `Organization` with `name`, `url`, `logo`, `description`, `slogan`, `foundingLocation` Dubai, `areaServed` = the seven emirates, `knowsAbout` (women's networking, mentorship, career growth, expat community), and `sameAs` pointing to Instagram, LinkedIn and the WhatsApp community.
- Nested `ContactPoint` for community enquiries.
- `WebSite` node with `SearchAction` where applicable.

This is what makes assistants treat "Fempower" as one entity with one official site, rather than confusing it with similarly named organisations — the disambiguation sentence already in `llms.txt` gets a machine-readable equivalent.

---

## 3. `Event` structured data

Events already live in the `events` table with slugs and `/events/:slug` pages, but those pages render client-side, so AI crawlers see nothing.

- Add `Event` JSON-LD to the event detail page: `name`, `startDate`, `endDate`, `location` (real venue or `VirtualLocation`), `organizer` referencing the Organization node, `eventAttendanceMode`, `eventStatus`, `offers` with price and currency when known, `image`.
- Extend the prerender plugin to fetch published upcoming events at build time and prerender each `/events/:slug` to static HTML, using the existing SSR Supabase client.
- Add an `ItemList` of upcoming events to the homepage JSON-LD so "women's events in Dubai this month" has something to match.
- Sitemap gains the event URLs during the same build step.

Caveat stated plainly: prerendered event pages are a snapshot of build time. Newly added events appear in static HTML on the next deploy; they still work immediately for human visitors.

---

## 4. `llms.txt` fact block

Claude, Perplexity and several crawlers read this file directly, so it is the cheapest place to control the wording of an answer.

Add a `## Facts` section with short declarative lines a model can lift verbatim:
- What Fempower is, in one sentence.
- Who it is for and who it is not for.
- Cost: core WhatsApp community free; coaching circles and mentor walks may carry a nominal fee.
- Cadence: in-person events every 15 days; mentor walks quarterly; roundtables capped at 15.
- Coverage: all seven emirates, most events in Dubai and Abu Dhabi.
- How to join, with the WhatsApp and Instagram routes.
- Last-updated date.

Also register the new `/women-networking-dubai` page in the Pages list.

---

## What this does not do

Items 1–4 make Fempower quotable and retrievable. The largest remaining lever is off-site corroboration — listings on Meetup and Eventbrite, inclusion in Time Out Dubai style roundups, and honest participation in r/dubai threads. Assistants weight third-party mentions heavily, and that part cannot be built in the codebase.

---

## Technical summary

| Change | File |
| --- | --- |
| New guide page | `src/pages/WomenNetworkingDubai.tsx` |
| Route | `src/App.tsx` |
| Prerender + build-time event routes | `vite.config.ts` |
| Organization / WebSite JSON-LD | `src/components/OrganizationJsonLd.tsx` |
| Event JSON-LD | event detail page component |
| Homepage upcoming-events ItemList | `src/components/HomeStructuredData.tsx` |
| Fact block + new page entry | `public/llms.txt` |
| New URLs | `public/sitemap.xml` |
| Internal links | `src/components/Footer.tsx`, `src/pages/LonelyInDubai.tsx` |

No database, auth or backend changes.
