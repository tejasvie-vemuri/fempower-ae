// Scheduled job: send a one-time profile-completion reminder to approved
// members ~1 hour after their approval. Runs every few minutes via pg_cron.
//
// Eligibility:
//   status = 'approved'
//   approved_at <= now() - 1 hour
//   approved_at >= now() - 7 days  (don't backfill ancient approvals)
//   profile_completion_email_sent_at IS NULL
//   profile is still incomplete (missing core fields)

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

interface MemberRow {
  user_id: string
  name: string | null
  photo_url: string | null
  role: string | null
  city: string | null
  bio: string | null
  expertise_tags: string[] | null
  industry: string | null
}

function missingProfileFields(m: MemberRow): string[] {
  const missing: string[] = []
  if (!m.photo_url) missing.push('photo')
  if (!m.bio || m.bio.trim().length < 20) missing.push('bio')
  if (!m.role) missing.push('role')
  if (!m.city) missing.push('city')
  if (!m.industry) missing.push('industry')
  if (!m.expertise_tags || m.expertise_tags.length === 0) missing.push('expertise')
  return missing
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Restrict to service_role callers only (pg_cron / internal invocations).
  // Without this, any anonymous caller can trigger up to 50 reminder emails.
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : ''
  let callerRole = 'anon'
  try {
    const parts = token.split('.')
    if (parts.length >= 2) {
      let p = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      while (p.length % 4) p += '='
      const claims = JSON.parse(atob(p)) as { role?: string }
      callerRole = claims?.role ?? 'anon'
    }
  } catch {
    callerRole = 'anon'
  }
  if (callerRole !== 'service_role') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[profile-completion-reminders] missing env')
    return new Response(JSON.stringify({ error: 'config' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Optional one-time backfill mode: nudge ALL approved members whose
  // profile is still incomplete, regardless of approval date or whether
  // they were already reminded once. Uses a distinct idempotency suffix so
  // previously-reminded members still receive this nudge.
  let backfill = false
  try {
    const body = await req.json()
    backfill = body?.backfill === true
  } catch {
    // no body — normal cron mode
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Find candidates
  let query = supabase
    .from('member_profiles')
    .select(
      'user_id, name, photo_url, role, city, bio, expertise_tags, industry',
    )
    .eq('status', 'approved')
    .lte('approved_at', oneHourAgo)
    .limit(50)

  if (!backfill) {
    query = query
      .is('profile_completion_email_sent_at', null)
      .gte('approved_at', sevenDaysAgo)
  }

  const { data: candidates, error: queryError } = await query

  if (queryError) {
    console.error('[profile-completion-reminders] query failed', queryError)
    return new Response(
      JSON.stringify({ error: 'query_failed', message: queryError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  if (!candidates || candidates.length === 0) {
    return new Response(
      JSON.stringify({ processed: 0, message: 'no eligible members' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  let sent = 0
  let skippedComplete = 0
  let failures = 0
  const results: Array<Record<string, unknown>> = []

  for (const m of candidates as MemberRow[]) {
    const missing = missingProfileFields(m)

    // If they've already filled everything in, mark sent without emailing.
    if (missing.length === 0) {
      await supabase
        .from('member_profiles')
        .update({ profile_completion_email_sent_at: new Date().toISOString() })
        .eq('user_id', m.user_id)
      skippedComplete++
      results.push({ user_id: m.user_id, skipped: 'profile_complete' })
      continue
    }

    // Look up the email from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('user_id', m.user_id)
      .maybeSingle()

    const recipient = profile?.email
    if (!recipient) {
      failures++
      results.push({ user_id: m.user_id, skipped: 'no_email' })
      continue
    }

    const { error: sendError } = await supabase.functions.invoke(
      'send-app-email',
      {
        headers: { Authorization: `Bearer ${supabaseServiceKey}` },
        body: {
          templateName: 'profile-completion-reminder',
          recipientEmail: recipient,
          idempotencyKey: `profile-completion-${m.user_id}${backfill ? '-nudge' : ''}`,
          templateData: {
            name: m.name || profile?.name || '',
            siteUrl: 'https://fempowerae.com',
            missingFields: missing,
          },
          diagnostics: {
            userId: m.user_id,
            source: 'profile-completion-reminders-cron',
            missingFields: missing,
          },
        },
      },
    )

    // Pace sends to stay under the function-invoke rate limit (~30/min)
    await new Promise((r) => setTimeout(r, 2100))

    if (sendError) {
      console.error(
        '[profile-completion-reminders] send failed',
        { userId: m.user_id, error: sendError },
      )
      failures++
      results.push({ user_id: m.user_id, error: sendError.message })
      continue
    }

    const { error: stampError } = await supabase
      .from('member_profiles')
      .update({ profile_completion_email_sent_at: new Date().toISOString() })
      .eq('user_id', m.user_id)

    if (stampError) {
      console.error(
        '[profile-completion-reminders] stamp failed',
        { userId: m.user_id, error: stampError },
      )
    }

    sent++
    results.push({ user_id: m.user_id, sent: true, missing })
  }

  console.log('[profile-completion-reminders] done', {
    candidates: candidates.length,
    sent,
    skippedComplete,
    failures,
  })

  // Detailed per-user results are kept in server logs only; the response
  // intentionally omits user_ids and missing fields to avoid leaking PII.
  console.log('[profile-completion-reminders] results', { results })

  return new Response(
    JSON.stringify({
      processed: candidates.length,
      sent,
      skippedComplete,
      failures,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )

})
