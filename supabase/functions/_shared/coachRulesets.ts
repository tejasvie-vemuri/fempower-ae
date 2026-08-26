/**
 * Style-ruleset loading + A/B assignment + slop logging.
 *
 * Rulesets are rows the admin edits in /admin/zara-style. Active rows with a
 * traffic weight above zero split live traffic; the assignment is sticky per
 * conversation via a caller-supplied bucket key so a member does not flip
 * variants mid-chat.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export type Ruleset = {
  id: string;
  name: string;
  slug: string;
  rules: string;
  is_active: boolean;
  traffic_weight: number;
  is_control: boolean;
};

async function rest(path: string, init: RequestInit = {}): Promise<Response> {
  return await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export async function loadRulesets(activeOnly = true): Promise<Ruleset[]> {
  try {
    const q = activeOnly ? "&is_active=eq.true" : "";
    const res = await rest(`coach_style_rulesets?select=*${q}&order=created_at.asc`);
    if (!res.ok) return [];
    return (await res.json()) as Ruleset[];
  } catch (_e) {
    return [];
  }
}

/** Stable 32-bit hash so a bucket key always lands in the same variant. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function pickRuleset(sets: Ruleset[], bucketKey: string): Ruleset | null {
  const eligible = sets.filter((s) => s.is_active && s.traffic_weight > 0);
  if (!eligible.length) return sets.find((s) => s.is_control) ?? null;
  const total = eligible.reduce((a, s) => a + s.traffic_weight, 0);
  let point = hash(bucketKey) % total;
  for (const s of eligible) {
    point -= s.traffic_weight;
    if (point < 0) return s;
  }
  return eligible[0];
}

export async function logSlopResult(row: {
  ruleset_id?: string | null;
  ruleset_slug?: string | null;
  source?: string;
  case_key?: string | null;
  user_id?: string | null;
  user_message?: string | null;
  reply?: string | null;
  score: number;
  violations: unknown;
  checks: unknown;
}): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_KEY) return;
  try {
    const res = await rest("coach_slop_logs", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ source: "production", ...row }),
    });
    if (!res.ok) console.error("slop log insert failed", res.status, await res.text());
  } catch (e) {
    console.error("slop log error", e);
  }
}
