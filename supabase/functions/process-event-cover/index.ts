import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { decode, Image } from 'https://deno.land/x/imagescript@1.2.17/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BUCKET = 'event-covers';
const MAX_SIDE = 1600;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleRow) return json({ error: 'Forbidden' }, 403);

    const body = await req.json().catch(() => null);
    const rawPath = typeof body?.path === 'string' ? body.path : '';
    if (!rawPath || !rawPath.startsWith('raw/') || rawPath.includes('..')) {
      return json({ error: 'Invalid path' }, 400);
    }

    const { data: file, error: dlErr } = await admin.storage.from(BUCKET).download(rawPath);
    if (dlErr || !file) return json({ error: 'Source image not found' }, 404);

    const bytes = new Uint8Array(await file.arrayBuffer());
    let img: Image;
    try {
      const decoded = await decode(bytes);
      if (!(decoded instanceof Image)) throw new Error('Unsupported image');
      img = decoded;
    } catch {
      await admin.storage.from(BUCKET).remove([rawPath]);
      return json({ error: 'Could not read that image. Use JPG, PNG or WebP.' }, 400);
    }

    // Keep the full image — only downscale if it is very large.
    const longest = Math.max(img.width, img.height);
    if (longest > MAX_SIDE) {
      const scale = MAX_SIDE / longest;
      img.resize(Math.round(img.width * scale), Math.round(img.height * scale));
    }
    const out = await img.encodeJPEG(88);

    const finalPath = `covers/cover-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.jpg`;
    const { error: upErr } = await admin.storage.from(BUCKET).upload(finalPath, out, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: false,
    });
    if (upErr) throw upErr;

    await admin.storage.from(BUCKET).remove([rawPath]);
    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(finalPath);

    return json({ url: pub.publicUrl, width: img.width, height: img.height });
  } catch (err) {
    console.error('process-event-cover error', err);
    return json({ error: (err as Error)?.message ?? 'Processing failed' }, 500);
  }
});
