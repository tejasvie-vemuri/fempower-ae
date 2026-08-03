// Fetch latest Instagram posts via Instagram Graph API
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

interface CacheEntry {
  at: number;
  data: { posts: unknown[] };
}

// Fresh window: serve from memory without hitting Instagram
const FRESH_TTL_MS = 30 * 60 * 1000; // 30 min
// Stale window: serve stale immediately, refresh in background
const STALE_TTL_MS = 6 * 60 * 60 * 1000; // 6 h
// Browser/CDN cache hints
const BROWSER_MAX_AGE = 600; // 10 min
const SWR_MAX_AGE = 3600; // 1 h

let cache: CacheEntry | null = null;
let inflight: Promise<CacheEntry | null> | null = null;

const cacheHeaders = (status: 'HIT' | 'MISS' | 'STALE' | 'ERROR') => ({
  ...corsHeaders,
  'Content-Type': 'application/json',
  'Cache-Control': `public, max-age=${BROWSER_MAX_AGE}, stale-while-revalidate=${SWR_MAX_AGE}`,
  'X-Cache': status,
});

let lastUpstreamError: string | null = null;

async function fetchFromInstagram(token: string): Promise<CacheEntry | null> {
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=12&access_token=${token}`;
  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok) {
    console.error('Instagram API error', json);
    const msg = json?.error?.message ?? 'Unknown Instagram API error';
    lastUpstreamError =
      json?.error?.code === 190
        ? `Instagram access token is invalid or expired (${msg}). Update INSTAGRAM_ACCESS_TOKEN.`
        : msg;
    return null;
  }

  lastUpstreamError = null;

  const posts = ((json.data ?? []) as IgMedia[]).map((m) => ({
    id: m.id,
    caption: m.caption ?? '',
    mediaType: m.media_type,
    image: m.media_type === 'VIDEO' ? (m.thumbnail_url ?? m.media_url) : m.media_url,
    permalink: m.permalink,
    timestamp: m.timestamp,
  }));

  const entry: CacheEntry = { at: Date.now(), data: { posts } };
  cache = entry;
  return entry;
}

function refreshInBackground(token: string) {
  if (inflight) return;
  inflight = fetchFromInstagram(token)
    .catch((err) => {
      console.error('background refresh failed', err);
      return null;
    })
    .finally(() => {
      inflight = null;
    });
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
    if (cache && now - cache.at < FRESH_TTL_MS) {
      return new Response(JSON.stringify(cache.data), { headers: cacheHeaders('HIT') });
    }

    // Stale cache: serve stale, refresh in background
    if (cache && now - cache.at < STALE_TTL_MS) {
      refreshInBackground(token);
      return new Response(JSON.stringify(cache.data), { headers: cacheHeaders('STALE') });
    }

    // Cold or fully expired: fetch synchronously, coalesce concurrent misses
    if (!inflight) {
      inflight = fetchFromInstagram(token).finally(() => {
        inflight = null;
      });
    }
    const entry = await inflight;

    if (entry) {
      return new Response(JSON.stringify(entry.data), { headers: cacheHeaders('MISS') });
    }

    // Upstream failed — fall back to stale if we still have anything
    if (cache) {
      return new Response(JSON.stringify(cache.data), { headers: cacheHeaders('STALE') });
    }

    // Degrade gracefully: 200 + empty posts so the client shows the
    // "Follow us on Instagram" fallback instead of throwing on a 502.
    return new Response(
      JSON.stringify({ error: lastUpstreamError ?? 'Instagram API error', posts: [] }),
      { status: 200, headers: cacheHeaders('ERROR') },
    );
  } catch (err) {
    console.error('fetch-instagram error', err);
    if (cache) {
      return new Response(JSON.stringify(cache.data), { headers: cacheHeaders('STALE') });
    }
    return new Response(
      JSON.stringify({ error: String(err), posts: [] }),
      { status: 500, headers: cacheHeaders('ERROR') },
    );
  }
});
