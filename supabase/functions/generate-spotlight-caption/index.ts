import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing');

    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin-only: caption generation is a moderation/curation action.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      memberName,
      roleCompany,
      headline,
      identityTag,
      stoppedWaitingFor,
      pullQuote,
      rallyLine,
      the_before,
      the_turning_point,
      the_now,
      advice,
    } = body ?? {};

    const prompt = `You are writing a LinkedIn caption for FemPower AE — a UAE-based women's community with the ethos "Rooted Together, Rising Together" and "for women who stopped waiting for permission". Voice: warm, editorial, empowering, never corporate, never salesy. Emoji: sparing (max 2, e.g. 🦋💛).

Write a LinkedIn caption to accompany a Member Spotlight image about ${memberName} (${roleCompany}).

Structure (about 150–200 words):
1. Hook line — bold, arresting, in her voice or about her.
2. 3–4 short paragraphs weaving her story (before → turning point → now). Use line breaks. Don't restate the poster verbatim.
3. Her advice as a highlighted takeaway.
4. Close with the FemPower rally: "Rooted Together, Rising Together."
5. Hashtags on the final line: #FemPowerAE #WomenInUAE #CommunityOverCompetition and 1–2 tasteful topical tags inferred from her story.

Story ingredients:
- Headline: ${headline}
- One-liner about her: ${identityTag}
- She stopped waiting for: ${stoppedWaitingFor}
- Before: ${the_before}
- Turning point: ${the_turning_point}
- Now: ${the_now}
- Her advice: ${advice}
- Pull quote featured on poster: ${pullQuote}
- Rally line: ${rallyLine}

Return ONLY the caption text — no preamble, no markdown code fences.`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error(`[generate-spotlight-caption] AI gateway error [${aiRes.status}]: ${errText}`);
      return new Response(
        JSON.stringify({ error: 'AI request failed', status: aiRes.status, details: errText }),
        { status: aiRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const aiData = await aiRes.json();
    const caption: string = (aiData?.choices?.[0]?.message?.content ?? '').trim();
    if (!caption) {
      return new Response(JSON.stringify({ error: 'Empty caption from AI' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ caption }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[generate-spotlight-caption] error:', err);
    return new Response(JSON.stringify({ error: err.message ?? String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
