

## Plan: Substack Publications Feed via Google Sheet

### How it works

1. **You create a Google Sheet** with columns: `Name`, `Substack URL` (e.g., `harnidh`, `odetoapoet`, `guhapriyavelu`). You can add/remove publications anytime.

2. **New edge function** (`fetch-substacks`) reads the sheet, then fetches the RSS feed (`yourname.substack.com/feed`) for each publication listed. It extracts the latest posts (title, author, description, date, link, image).

3. **New frontend component** (`SubstackFeedSection`) displays the aggregated posts in a card grid, sorted by date, with author name, post title, excerpt, date, and a link to read on Substack. Styled to match the existing site with Gulf decorative elements.

### Technical details

**Edge function** (`supabase/functions/fetch-substacks/index.ts`):
- Reads publication slugs from Google Sheet (same pattern as `fetch-resources`)
- For each slug, fetches `https://{slug}.substack.com/feed` (RSS/XML)
- Parses XML to extract latest 3 posts per publication
- Returns aggregated, date-sorted array of posts
- Config: `verify_jwt = false` in `supabase/config.toml`

**Frontend** (`src/components/SubstackFeedSection.tsx`):
- Fetches from the edge function on mount
- Displays posts in a responsive grid (similar to ResourcesSection)
- Each card shows: post image, author, title, excerpt, date, "Read on Substack" link
- Loading spinner + graceful empty state
- Added to `Index.tsx` (near the Resources section)

### What you need to do

Create a new Google Sheet (or a new tab in your existing one) with two columns:
| Name | URL slug |
|------|----------|
| hk's newsletter | harnidh.xyz |
| odetoapoet | odetoapoet |
| Guhapriya Velu | guhapriyavelu |

Then share the Sheet ID with me so I can wire it up.

