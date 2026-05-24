
# School & Nursery Reviews — UAE

A one-stop hub where Fempower members can research schools and nurseries (fees, curriculum, waitlist intel) and contribute their own reviews. Lives at a new `/schools` page with a teaser on the landing page.

## User flows

**Visitor (not signed in)**
- Browses directory, reads public school info + approved reviews.
- "Share your experience" CTA → sign-in wall.

**Approved member**
- Searches/filters schools by emirate, type (school/nursery), curriculum (British/American/IB/Montessori/CBSE/French…), age group.
- Opens a listing → sees aggregated rating, fees range, waitlist intel, member reviews.
- Submits a review (star rating, written experience, curriculum, child age group, waitlist experience, fees paid + year). Goes to moderation queue.
- Can request a new school be added if missing → admin queue.

**Admin (`/admin/schools`)**
- Approve / hide / delete reviews.
- Approve "add school" requests.
- Trigger Firecrawl refresh on a listing (re-scrapes fees, curriculum, waitlist info from official site + Google).
- Edit a listing manually (override scraped data when stale).

## Data model (new tables)

- `schools` — name, slug, type (school|nursery), emirate, area, curriculum[], age_min, age_max, website_url, logo_url, fees_min, fees_max, fees_year, waitlist_status (open|waitlist|closed|unknown), description, source_data (jsonb cache of last scrape), last_scraped_at, status (draft|published|hidden).
- `school_reviews` — school_id, user_id, rating (1–5), body, curriculum, child_age_group, waitlist_experience (text), fees_paid_cents, fees_year, status (pending|published|hidden), timestamps.
- `school_requests` — user_id, name, website_url, notes, status. Member-submitted requests for new listings.

RLS:
- `schools`: published rows readable by everyone; admins manage all.
- `school_reviews`: published rows readable by everyone; approved members insert their own (status forced to `pending`); admins approve/hide/delete.
- `school_requests`: members insert + read own; admins read all + update.

## Firecrawl scraping

- New connector: **Firecrawl** (`standard_connectors--connect`).
- Edge function `schools-scrape` (admin-only via JWT + `has_role` check):
  - Input: school name or website. If only name, runs `firecrawl.search` to find official site.
  - Runs `firecrawl.scrape` with `formats: ['markdown', { type: 'json', schema }]` and a structured schema extracting: official name, curriculum, age range, fees (per grade if available), waitlist status, contact info, logo.
  - Stores raw markdown + parsed JSON into `source_data`, upserts the cleaned fields on `schools`, sets `last_scraped_at`.
- Edge function `schools-search-external` (admin-only): given a query like "British nurseries in JVC", runs `firecrawl.search` + bulk-scrapes top results to bootstrap directory.
- Caching: re-scrape only when admin clicks "refresh" or `last_scraped_at` older than 90 days.

## Surfaces

- **`/schools`** (public): hero, search bar, filter rail (emirate, type, curriculum, age), result grid of school cards (logo, name, area, curriculum chips, avg rating, fees range). Click → detail drawer/page with full info + reviews + "Write a review" (members) / "Sign in to review" (guests).
- **`/admin/schools`**: tabs Pending reviews · School requests · All schools. Per-school: edit, refresh from Firecrawl, hide/delete.
- **Landing page teaser** (`SchoolsTeaser.tsx`): card in the Index page between `ResourcesSection` and `JoinSection`. Headline "School & Nursery Reviews — by real parents", subcopy, CTA "Browse the directory".
- **Header nav**: add "Schools" link.

## Phasing

1. Migration: `schools`, `school_reviews`, `school_requests` + RLS + triggers (updated_at).
2. Connect Firecrawl + write `schools-scrape` and `schools-search-external` edge functions.
3. `/schools` page: list + filters + detail view (read-only first, no reviews yet).
4. Review submission form (members only, validated with zod, admin-moderated).
5. `/admin/schools` moderation + Firecrawl refresh controls + school-request approval.
6. Landing-page teaser + nav link + SEO (`<title>`, JSON-LD `EducationalOrganization` per listing).

## Technical notes

- Stack: same Supabase + Vite/React/Tailwind already in use. Edge functions in `supabase/functions/schools-*/index.ts`.
- Firecrawl key (`FIRECRAWL_API_KEY`) injected by connector; server-only.
- Rate-limit review submissions: 5 reviews / 24h / user (in edge function `schools-submit-review`).
- Input validation: zod on body in edge functions; client-side react-hook-form + zod resolver.
- Aggregations (avg rating, review count) computed in a SECURITY DEFINER function `school_review_stats(school_id)` to avoid N+1.
- No personal data exposed: reviews always show member name + photo (parents stand by their reviews); no anonymous option in v1 unless you want it added.
- Landing teaser uses existing design tokens (Plum/Gold/Ivory, Playfair + DM Sans).

Reply **approve** and I'll start with the migration.
