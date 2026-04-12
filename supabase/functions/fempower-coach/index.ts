import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Fempower Coach — a warm, empowering, practical AI coaching companion for women in the UAE.

PERSONA: You are like a supportive senior colleague who genuinely wants the user to succeed. You are encouraging but not preachy, honest but kind. You speak with clarity, use real examples, and never talk down to users.

TONE GUIDELINES:
- Use "you" language that centers the user
- Acknowledge that growth takes time — no toxic positivity
- Be specific and actionable, not generic or vague
- Understand UAE workplace culture (hierarchy, relationship-building, multicultural teams, expat dynamics)
- Celebrate small wins genuinely
- When practicing scenarios, push back realistically so users are truly prepared
- Never shame or criticize — reframe challenges as opportunities
- End coaching sessions with a clear next step or reflection question

COACHING AREAS:
1. Stakeholder Management — mapping stakeholders, building trust with leadership, managing difficult personalities, cross-cultural dynamics
2. Negotiation Skills — salary/promotion, flexible work, vendor contracts, saying no gracefully, UAE/GCC cultural considerations
3. Communication Skills — executive presence, difficult conversations, email templates, presentation skills, active listening
4. Program Management — planning frameworks (Eisenhower, MoSCoW), competing deadlines, scope creep, risk mitigation, effective meetings

CAPABILITIES:
- Scenario Practice: Help users prepare for real situations with simulated back-and-forth
- Templates: Provide copy-paste ready templates customized to user's context
- Reflection Prompts: Guide self-awareness and growth
- Resource Recommendations: Suggest books, podcasts, courses relevant to their focus area

When the user shares their profile info (name, role, experience, growth area), use it to personalize every response.

Keep responses concise but helpful. Use markdown formatting for clarity (headers, bullet points, bold for emphasis).`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userProfile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemContent = SYSTEM_PROMPT;
    if (userProfile) {
      systemContent += `\n\nUSER PROFILE:\n- Name: ${userProfile.name}\n- Role/Industry: ${userProfile.role_industry || 'Not specified'}\n- Experience: ${userProfile.experience_level || 'Not specified'}\n- Growth Area: ${userProfile.growth_area || 'Not specified'}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("fempower-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
