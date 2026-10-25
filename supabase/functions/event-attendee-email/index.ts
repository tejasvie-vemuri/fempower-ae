import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.25.76';
import { EmailAPIError } from 'npm:@lovable.dev/email-js@0.1.0';
import { sendAttendeeEmail } from '../_shared/attendee-email.ts';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const schema = z.object({ registration_id: z.string().uuid(), kind: z.enum(['confirmation', 'reminder']).default('confirmation') }).strict();
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json({ error: 'Server configuration error' }, 500);
  const db = createClient(url, key);
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const cronSecret = Deno.env.get('DIGEST_CRON_SECRET');
  const trusted = token === key || (!!cronSecret && req.headers.get('x-cron-secret') === cronSecret);
  let userId: string | undefined;
  if (!trusted) {
    if (!token) return json({ error: 'Unauthorized' }, 401);
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) return json({ error: 'Unauthorized' }, 401);
    userId = data.user.id;
  }
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return json({ error: 'A valid registration ID and email kind are required' }, 400);
  if (!trusted) {
    if (body.data.kind !== 'confirmation') return json({ error: 'Forbidden' }, 403);
    const { data: reg } = await db.from('registrations').select('user_id').eq('id', body.data.registration_id).maybeSingle();
    if (!reg || reg.user_id !== userId) return json({ error: 'Ticket not found' }, 404);
  }
  try {
    return json(await sendAttendeeEmail(db, body.data.registration_id, body.data.kind));
  } catch (error) {
    console.error('Attendee email failed', { registrationId: body.data.registration_id, code: error instanceof EmailAPIError ? error.code : 'send_failed' });
    if (error instanceof EmailAPIError && error.status === 429) return json({ error: 'Rate limited', retry_after_seconds: error.retryAfterSeconds ?? 60 }, 429);
    return json({ error: 'Email could not be sent' }, 500);
  }
});