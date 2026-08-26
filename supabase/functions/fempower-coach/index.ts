import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { loadRulesets, pickRuleset, logSlopResult } from "../_shared/coachRulesets.ts";
import { scoreReply } from "../_shared/slopScorer.ts";
import { COACH_BASE_PROMPT as SYSTEM_PROMPT } from "../_shared/coachPrompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


// UAE is UTC+4 year-round (no DST).
function uaeNowBlock(): string {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(now);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dubai", weekday: "long" }).format(now);
  return `\n\nTODAY IN THE UAE: ${date} (${weekday}), Gulf Standard Time (UTC+4). The UAE weekend is Saturday–Sunday — resolve "this weekend", "next week" etc. against this date, never from memory. Be seasonally aware: Ramadan and Eid reshape working hours and social energy, summer (June–September) is quieter with many families travelling, and September–December / January–April are peak hiring and events seasons.`;
}

function fmtUaeDateTime(iso: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", weekday: "short", day: "numeric", month: "short" }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dubai", hour: "numeric", minute: "2-digit" }).format(d);
  return `${date}, ${time} GST`;
}

// Live events from the Fempower database (source of truth for fempowerae.com/events).
async function fetchEventsFromDb(): Promise<string[]> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return [];
  const now = new Date().toISOString();
  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };
  const [evRes, muRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/events?select=title,location,starts_at,price_cents,currency&status=eq.published&starts_at=gte.${encodeURIComponent(now)}&order=starts_at.asc&limit=6`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/meetups_public?select=title,place,emirate,starts_at&starts_at=gte.${encodeURIComponent(now)}&order=starts_at.asc&limit=4`, { headers }),
  ]);
  const lines: string[] = [];
  if (evRes.ok) {
    const events = await evRes.json() as Array<{ title: string; location: string | null; starts_at: string; price_cents: number | null; currency: string | null }>;
    for (const e of events) {
      const price = !e.price_cents ? "Free" : `${e.currency ?? "AED"} ${(e.price_cents / 100).toFixed(0)}`;
      lines.push(`- ${e.title} — ${fmtUaeDateTime(e.starts_at)}${e.location ? ` · ${e.location}` : ""} · ${price}`);
    }
  }
  if (muRes.ok) {
    const meetups = await muRes.json() as Array<{ title: string; place: string | null; emirate: string | null; starts_at: string }>;
    for (const m of meetups) {
      lines.push(`- ${m.title} (member meetup) — ${fmtUaeDateTime(m.starts_at)}${m.place ? ` · ${m.place}` : ""}${m.emirate ? `, ${m.emirate}` : ""}`);
    }
  }
  return lines;
}

// Legacy fallback: the community Google Sheet, in case the DB has nothing published.
async function fetchEventsFromSheet(): Promise<string[]> {
  const sheetId = Deno.env.get("EVENTS_SHEET_ID");
  if (!sheetId) return [];
  const res = await fetch(
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&_=${Date.now()}`,
    { cache: "no-store", redirect: "follow" }
  );
  if (!res.ok) return [];
  const csv = await res.text();
  const lines = csv.split("\n").filter((l) => l.trim()).slice(1);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return lines
    .map((line) => {
      const cells: string[] = [];
      let cur = "", inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
        else if (c === "," && !inQ) { cells.push(cur.trim()); cur = ""; }
        else cur += c;
      }
      cells.push(cur.trim());
      const [title, date, time, location] = cells.map((s) => s.replace(/^"|"$/g, ""));
      const [d, m, y] = (date || "").split("/");
      const iso = y && m && d ? `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` : "";
      return { title, iso, time, location };
    })
    .filter((e) => e.title && e.iso && new Date(e.iso) >= today)
    .sort((a, b) => a.iso.localeCompare(b.iso))
    .slice(0, 8)
    .map((e) => `- ${e.title} — ${e.iso}${e.time ? " at " + e.time : ""}${e.location ? " · " + e.location : ""}`);
}

async function fetchUpcomingEvents(): Promise<string> {
  try {
    let lines = await fetchEventsFromDb();
    if (!lines.length) lines = await fetchEventsFromSheet();
    if (!lines.length) return "\n\nUPCOMING EVENTS: (none currently published — point her to fempowerae.com or @fempowerae for the latest)";
    return "\n\nUPCOMING EVENTS (live from fempowerae.com — recommend these by name when relevant, and close event chats by pointing to the matching one):\n" + lines.join("\n");
  } catch (_e) {
    return "";
  }
}

// Lightweight in-memory per-IP rate limit to prevent anonymous abuse of the
// LOVABLE_API_KEY quota. The coach is intentionally public (discovery feature),
// so we don't require auth — but we cap each IP to a small burst per minute.
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20
const rateBuckets = new Map<string, { count: number; resetAt: number }>()

function rateLimitKey(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') ?? ''
  const ip = xff.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || 'unknown'
  return ip
}

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const b = rateBuckets.get(key)
  if (!b || now > b.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (b.count >= RATE_LIMIT_MAX) return false
  b.count++
  return true
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ipKey = rateLimitKey(req)
  if (!checkRateLimit(ipKey)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please slow down and try again in a minute." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  try {
    const { messages, userProfile, checklistHistory, saveChecklists, bucketKey, rulesetSlug } =
      await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // A/B: pick the style overlay this conversation runs on. Sticky per bucket
    // key so a member never flips variant mid-chat.
    const allSets = await loadRulesets(true);
    const ruleset = rulesetSlug
      ? (allSets.find((s) => s.slug === rulesetSlug) ?? null)
      : pickRuleset(allSets, String(bucketKey ?? ipKey));

    const eventsBlock = await fetchUpcomingEvents();
    let systemContent = SYSTEM_PROMPT + uaeNowBlock() + eventsBlock;
    if (ruleset?.rules?.trim()) {
      systemContent += `\n\n---\n\n${ruleset.rules.trim()}\n\nThese overlay rules win over anything above them.`;
    }

    if (userProfile && userProfile.name) {
      const lines = [
        `- Name: ${userProfile.name}`,
        userProfile.city ? `- City: ${userProfile.city}` : null,
        userProfile.role ? `- Role: ${userProfile.role}` : null,
        userProfile.industry ? `- Industry: ${userProfile.industry}` : null,
        Array.isArray(userProfile.looking_for) && userProfile.looking_for.length
          ? `- She's open to: ${userProfile.looking_for.join(", ")}`
          : null,
      ].filter(Boolean);
      systemContent += `\n\nSIGNED-IN MEMBER PROFILE (she is a logged-in Fempower member — use this naturally):\n${lines.join("\n")}\nGreet her by her first name once, early — not in every message. Tailor examples and suggestions to her city and industry. When her "open to" list matches something she's asking about (mentoring, collaborators, friends), weave it in. Never recite this profile back to her as a list.`;
    }

    // Checklist privacy + memory. The app decides what is saved; we only tell Zara
    // the truth about it so she never over- or under-promises.
    if (saveChecklists === false) {
      systemContent += `\n\nCHECKLIST PRIVACY: She has turned OFF saving. Her checklist summaries stay in this conversation only and are erased when she closes the chat. If she asks, say exactly that, and mention she can turn saving on from the privacy toggle in the chat header. Still output the save marker — the app discards it.`;
    } else if (saveChecklists === true) {
      systemContent += `\n\nCHECKLIST PRIVACY: She has saving ON, so her checklist summaries (not the full conversation) are saved to her private member profile and only she can see them. She can turn this off, or delete saved results, from the privacy toggle in the chat header.`;
    }

    if (Array.isArray(checklistHistory) && checklistHistory.length) {
      const hist = checklistHistory
        .slice(0, 6)
        .map((h: { label?: string; created_at?: string; summary?: string }) =>
          `- ${h.label ?? "Checklist"} (${(h.created_at ?? "").slice(0, 10)}): ${h.summary ?? ""}`)
        .join("\n");
      systemContent += `\n\nSAVED CHECKLIST HISTORY (her own past results, most recent first — she chose to save these):\n${hist}\n\nHow to use it: reference it lightly and specifically, like a coach who remembers. "Last time you did the Invisible Labour Audit, the thing you wanted to hand over was the school run — did that ever move?" Compare then vs now when she repeats a checklist, and name any progress out loud. Never dump the history back at her, never open with it, and never assume nothing has changed — ask.`;
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

    // Tee the stream so the member sees tokens immediately while we accumulate
    // the full reply and score it against the anti-slop rules afterwards.
    const lastUser = [...(messages ?? [])].reverse().find((m: { role: string }) => m.role === "user");
    const prevAssistant = [...(messages ?? [])].reverse().find((m: { role: string }) => m.role === "assistant");
    let captured = "";
    const decoder = new TextDecoder();
    const monitor = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(chunk);
        try {
          for (const line of decoder.decode(chunk, { stream: true }).split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === "[DONE]") continue;
            const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
            if (typeof delta === "string") captured += delta;
          }
        } catch (_e) { /* partial SSE frame — ignore */ }
      },
      flush() {
        const clean = captured.replace(/\[\[CHECKLIST_SAVE:[\s\S]*?\]\]/g, "").trim();
        if (!clean) return;
        const result = scoreReply(clean, {
          userMessage: lastUser?.content ?? "",
          prevAssistant: prevAssistant?.content ?? "",
          profile: userProfile ?? null,
        });
        console.log(
          `[anti-slop] ruleset=${ruleset?.slug ?? "none"} score=${result.score} fired=${
            result.violations.map((v) => v.rule).join(",") || "none"
          }`,
        );
        logSlopResult({
          ruleset_id: ruleset?.id ?? null,
          ruleset_slug: ruleset?.slug ?? null,
          source: "production",
          user_id: userProfile?.user_id ?? null,
          user_message: (lastUser?.content ?? "").slice(0, 2000),
          reply: clean.slice(0, 6000),
          score: result.score,
          violations: result.violations,
          checks: { ...result.checks, _meta: result.meta },
        });
      },
    });

    return new Response(response.body!.pipeThrough(monitor), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("fempower-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
