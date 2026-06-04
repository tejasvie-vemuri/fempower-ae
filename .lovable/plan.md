# Add Instagram Feed to Community Moments

Add a tabbed interface to the Community Moments section so visitors can switch between the curated Moments gallery and a live Instagram feed pulled from @fempower.ae via the Instagram Graph API.

## UX

In `GallerySection.tsx`, wrap the existing grid in a `Tabs` component (shadcn) with two triggers under the section heading:

- **Moments** — current rotating Google Drive gallery (unchanged behavior)
- **Instagram** — horizontal scrollable strip of latest IG posts, each linking out to instagram.com, with a "Follow @fempower.ae" CTA at the end

The Instagram strip uses horizontal snap-scroll on mobile and a grid on desktop, matching the editorial Gulf-inspired styling (rounded-xl, plum/gold accents). Each tile shows the post thumbnail, caption preview (line-clamp-2), and an external-link icon on hover.

## Data flow

```text
Browser → fetch-instagram edge fn → Instagram Graph API → cached JSON
```

1. New edge function `supabase/functions/fetch-instagram/index.ts`:
   - Calls `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=...`
   - Filters to IMAGE / CAROUSEL_ALBUM / VIDEO (use `thumbnail_url` for videos)
   - Returns up to 12 latest items
   - In-memory cache for ~10 min to stay under rate limits
   - CORS headers, no JWT required

2. New hook `src/hooks/useInstagramFeed.ts` fetches from the edge function and exposes `{ posts, loading, error }`.

3. New component `src/components/InstagramStrip.tsx` renders the horizontal scroller; consumed inside the Instagram tab of `GallerySection`.

## Secrets needed

The Instagram Graph API needs a **long-lived access token** tied to a Facebook Page + linked Instagram Business/Creator account. Required secret:

- `INSTAGRAM_ACCESS_TOKEN` — long-lived user token (60-day) or page token from the Meta developer dashboard

I will request it via the secrets tool once you approve the plan. You'll get it from:
1. https://developers.facebook.com → create/select an app with the "Instagram Graph API" product
2. Link your Facebook Page that's connected to @fempower.ae (must be Business/Creator account)
3. Generate a long-lived token (we'll document the refresh step)

If the token is short-lived, the edge function will return a clear error so we know to refresh.

## Files

- create `supabase/functions/fetch-instagram/index.ts`
- create `src/hooks/useInstagramFeed.ts`
- create `src/components/InstagramStrip.tsx`
- edit `src/components/GallerySection.tsx` — wrap grid in `Tabs`, mount `InstagramStrip` in second tab
- secret: `INSTAGRAM_ACCESS_TOKEN`

## Out of scope

- Token auto-refresh cron (manual refresh every ~50 days for now; can add later)
- Storing posts in Supabase (using in-memory edge cache)
- Comments/likes counts (Graph API basic media fields only)
