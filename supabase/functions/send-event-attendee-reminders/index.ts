import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { EmailAPIError } from 'npm:@lovable.dev/email-js@0.1.0';
import { sendAttendeeEmail } from '../_shared/attendee-email.ts';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const cronSecret = Deno.env.get('DIGEST_CRON_SECRET');
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) return json({ error: 'Unauthorized' }, 401);
  if (!url || !key) return json({ error: 'Server configuration error' }, 500);
  const db = createClient(url, key);
  // Each registration is its own expected event, not a recipient-list campaign.
  const { data: events, error } = await db.from('events').select('id').eq('status', 'published').gt('starts_at', new Date().toISOString()).lte('starts_at', new Date(Date.now() + 86400000).toISOString());
  if (error) return json({ error: 'Event lookup failed' }, 500);
  let sent = 0, skipped = 0, failures = 0;
  for (const event of events || []) {
    let offset = 0;
    while (true) {
      const { data: registrations, error: regError } = await db.from('registrations').select('id').eq('event_id', event.id).eq('status', 'confirmed').is('cancellation_requested_at', null).order('id').range(offset, offset + 99);
      if (regError) return json({ error: 'Registration lookup failed' }, 500);
      for (const reg of registrations || []) {
        try {
          const result = await sendAttendeeEmail(db, reg.id, 'reminder');
          if ('sent' in result && result.sent) sent++; else skipped++;
        } catch (error) {
          failures++;
          console.error('Event reminder failed', { registrationId: reg.id, code: error instanceof EmailAPIError ? error.code : 'send_failed' });
          if (error instanceof EmailAPIError && error.status === 429) return json({ sent, skipped, failures, retry_after_seconds: error.retryAfterSeconds ?? 60 }, 429);
        }
      }
      if (!registrations || registrations.length < 100) break;
      offset += 100;
    }
  }
  return json({ sent, skipped, failures });
});