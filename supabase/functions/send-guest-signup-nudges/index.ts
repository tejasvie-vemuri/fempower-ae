// Scheduled job: ~24 hours after someone registers for an event as a guest,
// invite them to finish creating a Fempower account with their details pre-filled.
// Runs hourly via pg_cron. Header-authed via x-cron-secret (DIGEST_CRON_SECRET).

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-cron-secret',
}

const SITE_URL = 'https://fempowerae.com'

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
  const windowEnd = new Date(now - 24 * 60 * 60 * 1000).toISOString()

  const { data: candidates, error } = await supabase
    .from('registrations')
    .select(
      'id, event_id, guest_email, guest_name, guest_phone, guest_linkedin_url, created_at, status',
    )
    .is('user_id', null)
    .not('guest_email', 'is', null)
    .is('guest_signup_nudge_sent_at', null)
    .eq('status', 'confirmed')
    .lte('created_at', windowEnd)
    .gte('created_at', windowStart)
    .limit(100)

  if (error) {
    console.error('[guest-signup-nudge] query failed', error)
    return new Response(JSON.stringify({ error: 'query_failed', message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  let skipped = 0
  let failures = 0

  for (const r of candidates ?? []) {
    const email = (r.guest_email ?? '').trim()
    if (!email) {
      skipped++
      continue
    }

    // They may have signed up in the meantime — never nudge an existing member.
    const { data: existing } = await supabase
      .from('profiles')
      .select('user_id')
      .ilike('email', email)
      .maybeSingle()
    if (existing) {
      await supabase
        .from('registrations')
        .update({ guest_signup_nudge_sent_at: new Date().toISOString() })
        .eq('id', r.id)
      skipped++
      continue
    }

    const { data: ev } = await supabase
      .from('events')
      .select('title')
      .eq('id', r.event_id)
      .maybeSingle()

    const qs = new URLSearchParams({ tab: 'signup', ref: 'guest-nudge' })
    if (r.guest_name) qs.set('name', r.guest_name)
    qs.set('email', email)
    if (r.guest_linkedin_url) qs.set('linkedin_url', r.guest_linkedin_url)

    const { error: sendErr } = await supabase.functions.invoke('send-app-email', {
      headers: { Authorization: `Bearer ${key}` },
      body: {
        templateName: 'guest-signup-nudge',
        recipientEmail: email,
        idempotencyKey: `guest-signup-nudge-${r.id}`,
        templateData: {
          name: (r.guest_name || '').split(' ')[0] || '',
          eventTitle: ev?.title ?? '',
          signupUrl: `${SITE_URL}/auth?${qs.toString()}`,
        },
        diagnostics: { registrationId: r.id, source: 'guest-signup-nudge-cron' },
      },
    })
    if (sendErr) {
      console.error('[guest-signup-nudge] send failed', { id: r.id, error: sendErr })
      failures++
      continue
    }

    await supabase
      .from('registrations')
      .update({ guest_signup_nudge_sent_at: new Date().toISOString() })
      .eq('id', r.id)
    sent++
  }

  console.log('[guest-signup-nudge] done', {
    candidates: candidates?.length ?? 0,
    sent,
    skipped,
    failures,
  })
  return new Response(
    JSON.stringify({ processed: candidates?.length ?? 0, sent, skipped, failures }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
