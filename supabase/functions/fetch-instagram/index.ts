// Fetch latest Instagram posts via Instagram Graph API
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface IgMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

interface TokenRow {
  id: number;
  access_token: string;
  token_expires_at: string;
  token_refreshed_at: string;
  posts: unknown[];
  posts_fetched_at: string | null;
}

// Fresh window: serve from memory without hitting Instagram
const FRESH_TTL_MS = 30 * 60 * 1000; // 30 min
// Stale window: serve stale immediately, refresh in background
const STALE_TTL_MS = 6 * 60 * 60 * 1000; // 6 h
// Browser/CDN cache hints
const BROWSER_MAX_AGE = 600; // 10 min
const SWR_MAX_AGE = 3600; // 1 h
// Instagram refuses to refresh a token younger than 24h; give it margin.
const MIN_REFRESH_AGE_MS = 25 * 60 * 60 * 1000;
// Long-lived tokens are valid ~60 days; assumed only for the very first
// bootstrap row, before we've ever completed a real refresh.
const ASSUMED_INITIAL_VALIDITY_MS = 60 * 24 * 60 * 60 * 1000;

let memCache: { at: number; posts: unknown[] } | null = null;
let inflight: Promise<unknown[] | null> | null = null;

const cacheHeaders = (status: 'HIT' | 'MISS' | 'STALE' | 'ERROR') => ({
  ...corsHeaders,
  'Content-Type': 'application/json',
  'Cache-Control': `public, max-age=${BROWSER_MAX_AGE}, stale-while-revalidate=${SWR_MAX_AGE}`,
  'X-Cache': status,
});

function admin() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}

async function loadTokenRow(db: ReturnType<typeof admin>, seedToken: string): Promise<TokenRow> {
  const { data } = await db.from('instagram_feed_cache').select('*').eq('id', 1).maybeSingle();
  if (data) return data as TokenRow;

  const now = new Date();
  const seeded: Partial<TokenRow> = {
    id: 1,
    access_token: seedToken,
    token_expires_at: new Date(now.getTime() + ASSUMED_INITIAL_VALIDITY_MS).toISOString(),
    // Backdated so the opportunistic refresh below is eligible to run right away.
    token_refreshed_at: new Date(now.getTime() - MIN_REFRESH_AGE_MS - 1000).toISOString(),
    posts: [],
  };
  const { data: inserted } = await db
    .from('instagram_feed_cache')
    .upsert(seeded, { onConflict: 'id' })
    .select('*')
    .single();
  return (inserted as TokenRow) ?? { ...seeded, posts_fetched_at: null } as TokenRow;
}

// Instagram allows refreshing a long-lived token any time after it's 24h
// old, extending it another ~60 days. Doing this whenever the feed is
// fetched means the token renews itself forever and never silently expires.
async function maybeRefreshToken(db: ReturnType<typeof admin>, row: TokenRow): Promise<string> {
  const age = Date.now() - new Date(row.token_refreshed_at).getTime();
  if (age < MIN_REFRESH_AGE_MS) return row.access_token;

  try {
    const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${row.access_token}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok || !json.access_token) {
      console.error('Instagram token refresh failed', json);
      return row.access_token;
    }
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + (json.expires_in ?? 60 * 24 * 60 * 60) * 1000);
    await db
      .from('instagram_feed_cache')
      .update({
        access_token: json.access_token,
        token_expires_at: newExpiresAt.toISOString(),
        token_refreshed_at: now.toISOString(),
      })
      .eq('id', 1);
    return json.access_token as string;
  } catch (err) {
    console.error('Instagram token refresh error', err);
    return row.access_token;
  }
}

async function recordError(db: ReturnType<typeof admin>, message: string) {
  await db
    .from('instagram_feed_cache')
    .update({ last_error: message, last_error_at: new Date().toISOString() })
    .eq('id', 1);
}

async function fetchFromInstagram(seedToken: string): Promise<unknown[] | null> {
  const db = admin();
  const row = await loadTokenRow(db, seedToken);
  const token = await maybeRefreshToken(db, row);

  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=12&access_token=${token}`;
  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok) {
    const message = json?.error?.message || 'Instagram API error';
    console.error('Instagram API error', json);
    await recordError(db, message);
    return null;
  }

  const posts = ((json.data ?? []) as IgMedia[]).map((m) => ({
    id: m.id,
    caption: m.caption ?? '',
    mediaType: m.media_type,
    image: m.media_type === 'VIDEO' ? (m.thumbnail_url ?? m.media_url) : m.media_url,
    permalink: m.permalink,
    timestamp: m.timestamp,
  }));

  memCache = { at: Date.now(), posts };
  await db
    .from('instagram_feed_cache')
    .update({ posts, posts_fetched_at: new Date().toISOString(), last_error: null, last_error_at: null })
    .eq('id', 1);
  return posts;
}

function refreshInBackground(seedToken: string) {
  if (inflight) return;
  inflight = fetchFromInstagram(seedToken)
    .catch((err) => {
      console.error('background refresh failed', err);
      return null;
    })
    .finally(() => {
      inflight = null;
    });
}

// Durable fallback: the last posts we ever successfully fetched, read from
// the DB so a cold start (which wipes memCache) doesn't blank the feed.
async function lastKnownPosts(): Promise<unknown[]> {
  const { data } = await admin()
    .from('instagram_feed_cache')
    .select('posts')
    .eq('id', 1)
    .maybeSingle();
  return (data?.posts as unknown[]) ?? [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const token = Deno.env.get('INSTAGRAM_ACCESS_TOKEN');
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'INSTAGRAM_ACCESS_TOKEN not configured', posts: [] }),
        { status: 500, headers: cacheHeaders('ERROR') },
      );
    }

    const now = Date.now();

    // Fresh cache: return immediately
    if (memCache && now - memCache.at < FRESH_TTL_MS) {
      return new Response(JSON.stringify({ posts: memCache.posts }), { headers: cacheHeaders('HIT') });
    }

    // Stale cache: serve stale, refresh in background
    if (memCache && now - memCache.at < STALE_TTL_MS) {
      refreshInBackground(token);
      return new Response(JSON.stringify({ posts: memCache.posts }), { headers: cacheHeaders('STALE') });
    }

    // Cold or fully expired: fetch synchronously, coalesce concurrent misses
    if (!inflight) {
      inflight = fetchFromInstagram(token).finally(() => {
        inflight = null;
      });
    }
    const posts = await inflight;

    if (posts) {
      return new Response(JSON.stringify({ posts }), { headers: cacheHeaders('MISS') });
    }

    // Upstream failed — fall back to whatever we last fetched successfully,
    // even across a cold start, rather than showing an empty feed.
    const fallback = await lastKnownPosts();
    if (fallback.length > 0) {
      return new Response(JSON.stringify({ posts: fallback }), { headers: cacheHeaders('STALE') });
    }

    return new Response(
      JSON.stringify({ error: 'Instagram API error', posts: [] }),
      { status: 502, headers: cacheHeaders('ERROR') },
    );
  } catch (err) {
    console.error('fetch-instagram error', err);
    const fallback = await lastKnownPosts().catch(() => []);
    if (fallback.length > 0) {
      return new Response(JSON.stringify({ posts: fallback }), { headers: cacheHeaders('STALE') });
    }
    return new Response(
      JSON.stringify({ error: String(err), posts: [] }),
      { status: 500, headers: cacheHeaders('ERROR') },
    );
  }
});
