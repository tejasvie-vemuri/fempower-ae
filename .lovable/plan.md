## Goal

Give you one place to upload and manage every image on the site — hero, team/mentors, event covers, and the Community Moments gallery — without touching code, Drive, or Sheets again.

## How it will work

A single public storage bucket holds every image. A small `site_images` table tracks what each image is for (category, title, alt text, sort order, visibility). A new admin page at `/admin/images` lets you upload, label, reorder, and delete. The site's sections read from this table on load.

```
Admin → /admin/images
   ↓ upload + tag
[ site-images bucket ]  ←→  [ site_images table ]
   ↓ public URLs                ↓ category filter
Hero · Team · Events · Gallery sections
```

## What gets built

**1. Storage + database**
- Public bucket `site-images` (read = everyone, write = admins only)
- Table `site_images`: `id`, `category` (`hero` | `team` | `event` | `gallery`), `title`, `alt`, `subtitle`, `link_url`, `image_path`, `sort_order`, `is_active`, timestamps
- RLS: public can read active rows; only admins can insert/update/delete

**2. Admin page — `/admin/images`** (admin-only, behind existing `AdminRoute`)
- Tabs for the 4 categories
- Drag-and-drop upload (auto-compress, stores to `site-images/{category}/...`)
- Edit title/alt/subtitle/sort order inline
- Toggle active, delete
- Live preview thumbnail

**3. Wire sections to the library**
- **Hero**: optional background image from `category=hero` (first active by sort order). If none, current static hero stays.
- **Team / Mentors**: new "Meet the Team" subsection on About — renders all active `category=team` as portrait cards (photo, name in `title`, role in `subtitle`).
- **Event covers**: events keep coming from Google Sheets, but each event row can reference an uploaded image by its filename — `EventsCalendarSection` resolves it from `site-images/event/`. Sheet still wins if it has a full URL.
- **Community Moments gallery**: `GallerySection` switches from Google Drive to `category=gallery`. Drive fallback kept for one release in case you want to compare.

**4. Header link** in admin nav to the new Images page.

## Technical details

- Migration creates bucket via `storage.buckets` insert, table, RLS policies, and `update_updated_at_column` trigger.
- Front-end fetches via `supabase.from('site_images').select().eq('category', X).eq('is_active', true).order('sort_order')` — cached per section with React Query (already used elsewhere).
- Upload path convention: `{category}/{uuid}-{slug}.{ext}`. Public URL via `supabase.storage.from('site-images').getPublicUrl(path)`.
- Image compression client-side (max 1920px wide, ~80% jpeg) before upload to keep bucket light.
- Gallery section keeps masonry layout; team section is a new responsive grid of portrait cards.
- No change to `member-photos` bucket (member directory keeps its own flow).

## Out of scope (call out if you want them later)

- Replacing Google Sheets for events entirely
- Per-image cropping/focal-point editor
- Versioned image history
