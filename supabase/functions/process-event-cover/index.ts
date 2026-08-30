import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { decode, Image } from 'https://deno.land/x/imagescript@1.2.17/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BUCKET = 'event-covers';
const TARGET_WIDTH = 1600;
const TARGET_HEIGHT = 700;
const TARGET_RATIO = TARGET_WIDTH / TARGET_HEIGHT;
const RATIO_TOLERANCE = 0.1;

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

    const ratio = img.width / img.height;
    if (Math.abs(ratio - TARGET_RATIO) / TARGET_RATIO > RATIO_TOLERANCE) {
      await admin.storage.from(BUCKET).remove([rawPath]);
      return json(
        {
          error: `Cover must be close to 16:7. Yours is ${img.width}×${img.height} (${ratio.toFixed(2)}:1). Please upload a wide 1600×700 image.`,
        },
        400,
      );
    }

    // Centre-crop to an exact 16:7 frame, then resize to 1600×700.
    const cropWidth = ratio > TARGET_RATIO ? Math.round(img.height * TARGET_RATIO) : img.width;
    const cropHeight = ratio > TARGET_RATIO ? img.height : Math.round(img.width / TARGET_RATIO);
    img.crop(
      Math.round((img.width - cropWidth) / 2),
      Math.round((img.height - cropHeight) / 2),
      cropWidth,
      cropHeight,
    );
    img.resize(TARGET_WIDTH, TARGET_HEIGHT);
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

    return json({ url: pub.publicUrl, width: TARGET_WIDTH, height: TARGET_HEIGHT });
  } catch (err) {
    console.error('process-event-cover error', err);
    return json({ error: (err as Error)?.message ?? 'Processing failed' }, 500);
  }
});
