/**
 * Admin-only anti-slop test harness.
 *
 * Runs the example chats in _shared/slopCases.ts against one or more style
 * rulesets, scores every reply with the same deterministic scorer that runs in
 * production, and writes the results to coach_slop_logs (source = 'eval') so
 * an A/B comparison is one query away.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { loadRulesets, logSlopResult } from "../_shared/coachRulesets.ts";
import { scoreReply, SLOP_RULE_LABELS } from "../_shared/slopScorer.ts";
import { SLOP_CASES } from "../_shared/slopCases.ts";
import { COACH_BASE_PROMPT } from "../_shared/coachPrompt.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type CaseResult = {
  case_key: string;
  label: string;
  trap: string;
  user_message: string;
  reply: string;
  score: number;
  violations: { rule: string; label: string; weight: number; detail: string }[];
  checks: Record<string, string>;
};

async function runCase(
  apiKey: string,
  systemPrompt: string,
  c: (typeof SLOP_CASES)[number],
): Promise<CaseResult> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: systemPrompt }, ...c.messages],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`gateway ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  const reply: string = json?.choices?.[0]?.message?.content ?? "";
  const lastUser = [...c.messages].reverse().find((m) => m.role === "user");
  const prevAssistant = [...c.messages].reverse().find((m) => m.role === "assistant");
  const scored = scoreReply(reply, {
    userMessage: lastUser?.content ?? "",
    prevAssistant: prevAssistant?.content ?? "",
    profile: c.profile ?? null,
  });
  return {
    case_key: c.key,
    label: c.label,
    trap: c.trap,
    user_message: lastUser?.content ?? "",
    reply,
    score: scored.score,
    violations: scored.violations,
    checks: scored.checks,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const authed = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await authed.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const slugs: string[] = Array.isArray(body?.slugs) ? body.slugs : [];
    const caseKeys: string[] = Array.isArray(body?.caseKeys) ? body.caseKeys : [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const all = await loadRulesets(false);
    const sets = (slugs.length ? all.filter((s) => slugs.includes(s.slug)) : all.filter((s) => s.is_active));
    if (!sets.length) {
      return new Response(JSON.stringify({ error: "No matching rulesets" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cases = caseKeys.length ? SLOP_CASES.filter((c) => caseKeys.includes(c.key)) : SLOP_CASES;

    const results: Record<string, CaseResult[]> = {};
    for (const set of sets) {
      const systemPrompt = set.rules?.trim()
        ? `${COACH_BASE_PROMPT}\n\n---\n\n${set.rules.trim()}\n\nThese overlay rules win over anything above them.`
        : COACH_BASE_PROMPT;
      const rows: CaseResult[] = [];
      for (const c of cases) {
        try {
          const r = await runCase(LOVABLE_API_KEY, systemPrompt, c);
          rows.push(r);
          await logSlopResult({
            ruleset_id: set.id,
            ruleset_slug: set.slug,
            source: "eval",
            case_key: c.key,
            user_id: user.id,
            user_message: r.user_message.slice(0, 2000),
            reply: r.reply.slice(0, 6000),
            score: r.score,
            violations: r.violations,
            checks: r.checks,
          });
        } catch (e) {
          rows.push({
            case_key: c.key, label: c.label, trap: c.trap,
            user_message: "", reply: `ERROR: ${e instanceof Error ? e.message : String(e)}`,
            score: 0, violations: [], checks: {},
          });
        }
      }
      results[set.slug] = rows;
    }

    return new Response(
      JSON.stringify({ results, ruleLabels: SLOP_RULE_LABELS, ranAt: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("coach-slop-eval error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
