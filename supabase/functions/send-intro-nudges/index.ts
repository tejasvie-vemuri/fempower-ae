// Scheduled job: send a one-time "introduce yourself" nudge to approved members
// ~48 hours after their approval, if they still haven't posted a Circle intro.
// Runs hourly via pg_cron. Header-authed via x-cron-secret (DIGEST_CRON_SECRET).

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-cron-secret',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const cronSecret = Deno.env.get('DIGEST_CRON_SECRET')
  const headerSecret = req.headers.get('x-cron-secret') ?? ''
  if (!cronSecret || headerSecret !== cronSecret) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    return new Response(JSON.stringify({ error: 'config' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const supabase = createClient(url, key)

  const now = Date.now()
  const windowStart = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
  const windowEnd = new Date(now - 42 * 60 * 60 * 1000).toISOString()

  const { data: candidates, error } = await supabase
    .from('member_profiles')
    .select('user_id, name, approved_at, intro_posted_at, intro_nudge_email_sent_at, digest_opt_out, status')
    .eq('status', 'approved')
    .is('intro_posted_at', null)
    .is('intro_nudge_email_sent_at', null)
    .lte('approved_at', windowEnd)
    .gte('approved_at', windowStart)
    .eq('digest_opt_out', false)
    .limit(100)

  if (error) {
    console.error('[intro-nudge] query failed', error)
    return new Response(JSON.stringify({ error: 'query_failed', message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  let failures = 0
  for (const m of candidates ?? []) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('user_id', m.user_id)
      .maybeSingle()
    const recipient = profile?.email
    if (!recipient) {
      failures++
      continue
    }

    const { error: sendErr } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'intro-nudge',
        recipientEmail: recipient,
        idempotencyKey: `intro-nudge-${m.user_id}`,
        templateData: {
          name: (m.name || profile?.name || '').split(' ')[0] || '',
          siteUrl: 'https://fempowerae.com',
        },
        diagnostics: { userId: m.user_id, source: 'intro-nudge-cron' },
      },
    })
    if (sendErr) {
      console.error('[intro-nudge] send failed', { user_id: m.user_id, error: sendErr })
      failures++
      continue
    }
    await supabase
      .from('member_profiles')
      .update({ intro_nudge_email_sent_at: new Date().toISOString() })
      .eq('user_id', m.user_id)
    sent++
  }

  console.log('[intro-nudge] done', { candidates: candidates?.length ?? 0, sent, failures })
  return new Response(JSON.stringify({ processed: candidates?.length ?? 0, sent, failures }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
