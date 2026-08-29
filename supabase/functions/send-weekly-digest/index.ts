// Scheduled job: send a personalised weekly digest to every approved member
// with three concrete nudges (an event, a Circle post to reply to, a member
// to meet). Runs once per week via pg_cron. Idempotent per ISO week.
// Header-authed via x-cron-secret (DIGEST_CRON_SECRET).

import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-cron-secret',
}

const SITE_URL = 'https://fempowerae.com'
const BATCH_SIZE = 100 // members per invocation
const TOPIC_LABELS: Record<string, string> = {
  career: 'Career',
  relationships: 'Relationships',
  motherhood: 'Motherhood',
  'mental-health': 'Mental Health',
  money: 'Money',
  faith: 'Faith',
  'visa-legal': 'Visa & Legal',
  'body-health': 'Body & Health',
  introduction: 'Introduction',
  other: 'From the Circle',
}

function isoWeekKey(d = new Date()): string {
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

async function pickEvent(supabase: SupabaseClient, emirate: string | null) {
  const nowIso = new Date().toISOString()
  const { data } = await supabase
    .from('events')
    .select('id, slug, title, starts_at, location')
    .eq('status', 'published')
    .gte('starts_at', nowIso)
    .order('starts_at', { ascending: true })
    .limit(5)
  if (!data || data.length === 0) return null
  const preferred = emirate ? data.find((e: any) => (e.location ?? '').toLowerCase().includes(emirate.toLowerCase())) : null
  const e = preferred ?? data[0]
  return {
    title: e.title,
    slug: e.slug,
    starts_at: e.starts_at,
    emirate: e.location ?? null,
    url: `${SITE_URL}/events/${e.slug}?ref=digest&slot=event`,
  }
}

async function pickPost(supabase: SupabaseClient, userId: string) {
  const { data: replies } = await supabase
    .from('circle_replies').select('post_id').eq('user_id', userId).limit(200)
  const replied = new Set((replies ?? []).map((r: any) => r.post_id))

  const { data: posts } = await supabase
    .from('circle_posts_public')
    .select('id, topic_tag, body, user_id')
    .order('published_at', { ascending: false })
    .limit(30)
  if (!posts) return null
  const candidate = (posts as any[]).find(
    (p) => p.user_id !== userId && !replied.has(p.id) && p.topic_tag !== 'introduction' && p.body,
  )
  if (!candidate) return null
  const excerpt = String(candidate.body).replace(/\s+/g, ' ').trim().slice(0, 140)
  return {
    id: candidate.id,
    topic_label: TOPIC_LABELS[candidate.topic_tag] ?? TOPIC_LABELS.other,
    excerpt,
    url: `${SITE_URL}/circle?ref=digest&slot=circle#post-${candidate.id}`,
  }
}

async function pickMember(supabase: SupabaseClient, viewer: any) {
  const { data: viewed } = await supabase
    .from('engagement_events')
    .select('target_id')
    .eq('user_id', viewer.user_id)
    .eq('event_type', 'directory_profile_viewed')
    .limit(500)
  const seen = new Set((viewed ?? []).map((r: any) => r.target_id))
  seen.add(viewer.user_id)

  const { data: members } = await supabase
    .from('member_profiles')
    .select('user_id, name, role, city, industry, expertise_tags')
    .eq('status', 'approved')
    .not('user_id', 'is', null)
    .limit(50)
  if (!members) return null

  const scored = (members as any[])
    .filter((m) => !seen.has(m.user_id))
    .map((m) => {
      let score = 0
      if (viewer.city && m.city && m.city.toLowerCase() === viewer.city.toLowerCase()) score += 3
      if (viewer.industry && m.industry && m.industry === viewer.industry) score += 2
      const overlap = ((viewer.expertise_tags ?? []) as string[]).filter((t) =>
        ((m.expertise_tags ?? []) as string[]).includes(t),
      ).length
      score += overlap
      return { m, score }
    })
    .sort((a, b) => b.score - a.score)
  const pick = scored[0]?.m
  if (!pick) return null
  return {
    id: pick.user_id,
    name: pick.name,
    role: pick.role ?? null,
    city: pick.city ?? null,
    url: `${SITE_URL}/directory?ref=digest&slot=member&member=${pick.user_id}`,
  }
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
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const supabase = createClient(url, key)
  const weekKey = isoWeekKey()

  const { data: members, error } = await supabase
    .from('member_profiles')
    .select('user_id, name, city, industry, expertise_tags, digest_opt_out, status')
    .eq('status', 'approved')
    .eq('digest_opt_out', false)
    .limit(BATCH_SIZE)

  if (error) {
    console.error('[weekly-digest] query failed', error)
    return new Response(JSON.stringify({ error: 'query_failed', message: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  let skipped = 0
  let failures = 0
  for (const m of members ?? []) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('user_id', m.user_id)
      .maybeSingle()
    if (!profile?.email) {
      skipped++
      continue
    }
    const [event, post, member] = await Promise.all([
      pickEvent(supabase, m.city ?? null),
      pickPost(supabase, m.user_id),
      pickMember(supabase, m),
    ])
    // Skip if nothing to say — avoid sending an empty email.
    if (!event && !post && !member) {
      skipped++
      continue
    }

    const { error: sendErr } = await supabase.functions.invoke('send-transactional-email', {
      headers: { Authorization: `Bearer ${key}` },
      body: {
        templateName: 'weekly-digest',
        recipientEmail: profile.email,
        idempotencyKey: `weekly-digest-${m.user_id}-${weekKey}`,
        templateData: {
          name: (m.name || profile.name || '').split(' ')[0] || '',
          siteUrl: SITE_URL,
          event,
          post,
          member,
        },
        diagnostics: { userId: m.user_id, source: 'weekly-digest-cron', weekKey },
      },
    })
    if (sendErr) {
      console.error('[weekly-digest] send failed', { user_id: m.user_id, error: sendErr })
      failures++
      continue
    }
    sent++
  }

  console.log('[weekly-digest] done', { weekKey, candidates: members?.length ?? 0, sent, skipped, failures })
  return new Response(
    JSON.stringify({ weekKey, processed: members?.length ?? 0, sent, skipped, failures }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
