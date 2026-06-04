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

let cache: { at: number; data: any } | null = null;
const TTL_MS = 10 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (cache && Date.now() - cache.at < TTL_MS) {
      return new Response(JSON.stringify(cache.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = Deno.env.get('INSTAGRAM_ACCESS_TOKEN');
    if (!token) {
      return new Response(JSON.stringify({ error: 'INSTAGRAM_ACCESS_TOKEN not configured', posts: [] }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
    const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=12&access_token=${token}`;
    const res = await fetch(url);
    const json = await res.json();

    if (!res.ok) {
      console.error('Instagram API error', json);
      return new Response(
        JSON.stringify({ error: json?.error?.message || 'Instagram API error', posts: [] }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const posts = ((json.data ?? []) as IgMedia[]).map((m) => ({
      id: m.id,
      caption: m.caption ?? '',
      mediaType: m.media_type,
      image: m.media_type === 'VIDEO' ? (m.thumbnail_url ?? m.media_url) : m.media_url,
      permalink: m.permalink,
      timestamp: m.timestamp,
    }));

    const payload = { posts };
    cache = { at: Date.now(), data: payload };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('fetch-instagram error', err);
    return new Response(JSON.stringify({ error: String(err), posts: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
