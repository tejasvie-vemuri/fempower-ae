// Zoya's core: the system prompt, her tools, and the agentic tool-calling
// loop against the Lovable AI gateway. Both zoya-chat (web) and the WhatsApp
// webhook call runZoyaBrain so every channel shares one identical brain.
//
// Every query here is scoped by userId explicitly, so it's correct whether the
// caller hands us an RLS-scoped client (web) or a service-role admin client
// (WhatsApp webhook).

const MODEL = "google/gemini-3-flash-preview";
// Cap the read → act → reply loop so a misbehaving turn can't spin forever.
const MAX_TOOL_ROUNDS = 4;

// ── Date helpers (UAE is UTC+4, no DST) ──────────────────────────────
function uaeTodayIso(): string {
  return new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// ISO date strings compare lexically, so plain string math is safe here.
function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T00:00:00Z`).getTime();
  const b = new Date(`${toIso}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

// Next occurrence of a yearly date (birthday/anniversary) on or after today.
function nextYearlyIso(dateIso: string, todayIso: string): string {
  const [, mm, dd] = dateIso.split("-");
  const todayYear = Number(todayIso.slice(0, 4));
  const thisYear = `${todayYear}-${mm}-${dd}`;
  return thisYear < todayIso ? `${todayYear + 1}-${mm}-${dd}` : thisYear;
}

function relativeLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days}d`;
}

// ── Context loading: what Zoya already knows about her ───────────────
interface LmContext {
  city: string | null;
  assistantName: string;
  preferredName: string | null;
  summary: string;
}

async function loadContext(
  db: any,
  userId: string,
  todayIso: string,
  fallbackAssistant: string,
  fallbackPreferred: string | null,
): Promise<LmContext> {
  const [profileRes, remindersRes, datesRes, groceriesRes, peopleRes] = await Promise.all([
    db.from("lm_profile").select("assistant_name, preferred_name, city").eq("user_id", userId).maybeSingle(),
    db.from("reminders").select("title, due_date").eq("user_id", userId).eq("status", "pending").order("due_date", { ascending: true }).limit(25),
    db.from("important_dates").select("label, date, recurrence, people(name)").eq("user_id", userId).limit(50),
    db.from("grocery_items").select("item_name").eq("user_id", userId).eq("status", "active").order("created_at", { ascending: false }).limit(50),
    db.from("people").select("name, relationship, notes").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
  ]);

  const profile = profileRes.data;
  const assistantName = profile?.assistant_name || fallbackAssistant;
  const preferredName = profile?.preferred_name ?? fallbackPreferred;
  const city = profile?.city ?? null;

  const parts: string[] = [];

  const reminders = (remindersRes.data ?? []) as Array<{ title: string; due_date: string | null }>;
  if (reminders.length) {
    const lines = reminders.map((r) =>
      r.due_date ? `- ${r.title} (${relativeLabel(daysBetween(todayIso, r.due_date))}, ${r.due_date})` : `- ${r.title} (no date set)`,
    );
    parts.push(`PENDING REMINDERS (${reminders.length}):\n${lines.join("\n")}`);
  }

  const dates = (datesRes.data ?? []) as Array<{ label: string; date: string; recurrence: string; people: { name: string } | null }>;
  if (dates.length) {
    const lines = dates
      .map((d) => {
        const who = d.people?.name ?? "someone";
        const next = d.recurrence === "yearly" ? nextYearlyIso(d.date, todayIso) : d.date;
        return { line: `- ${who}'s ${d.label} (${relativeLabel(daysBetween(todayIso, next))}, ${next})`, days: daysBetween(todayIso, next) };
      })
      .sort((a, b) => a.days - b.days)
      .map((x) => x.line);
    parts.push(`IMPORTANT DATES (${dates.length}):\n${lines.join("\n")}`);
  }

  const groceries = (groceriesRes.data ?? []) as Array<{ item_name: string }>;
  if (groceries.length) {
    parts.push(`GROCERY LIST (${groceries.length} active): ${groceries.map((g) => g.item_name).join(", ")}`);
  }

  const people = (peopleRes.data ?? []) as Array<{ name: string; relationship: string | null; notes: string | null }>;
  if (people.length) {
    const lines = people.map((p) => {
      const bits = [p.name];
      if (p.relationship) bits.push(`(${p.relationship})`);
      if (p.notes) bits.push(`— ${p.notes}`);
      return `- ${bits.join(" ")}`;
    });
    parts.push(`PEOPLE SHE'S TOLD YOU ABOUT (${people.length}):\n${lines.join("\n")}`);
  }

  const summary = parts.length
    ? parts.join("\n\n")
    : "She hasn't tracked anything with you yet — this is a fresh start.";

  return { city, assistantName, preferredName, summary };
}

export function buildSystemPrompt(ctx: LmContext, todayIso: string) {
  const weekday = new Date(`${todayIso}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });

  return `You are ${ctx.assistantName}, a personal Lifestyle Manager inside FemPower AE, built for a busy woman in the UAE juggling a career, a household, and everyone else's everything.

TODAY'S DATE IS ${todayIso} (${weekday}), in the UAE. Always resolve relative dates like "tomorrow", "Friday", "next month" against this actual date, never guess a date from memory or training data.

${ctx.preferredName ? `You call her ${ctx.preferredName}.` : "You don't know her preferred name yet, so keep it warm without a name."}
${ctx.city ? `She's based in ${ctx.city}, UAE — factor that in for anything local (groceries, timing, errands).` : ""}

WHO SHE IS: professional, often running between errands and commitments, carrying real mental load. Your entire job is to make that load lighter, never heavier.

WHAT YOU ALREADY KNOW ABOUT HER LIFE (use this to answer her directly — you have real memory now, so never say "I don't know" about anything listed here, and never re-ask for something you can already see):
${ctx.summary}

The snapshot above is current as of this moment. If she asks what's coming up, what's on her list, or about a person, answer straight from it. Use the read tools (get_upcoming, list_groceries, find_person) only when you need something not shown above or want to double-check before acting.

VOICE:
- Warm, human, like a trusted friend, never corporate. No "task", "action item", or "workflow", just "thing to remember".
- One decision at a time. Never hand her a list of choices to sort through herself.
- Never guilt her. No "you forgot X". Only ever forward-looking and supportive.
- Minimum viable input. If she can answer in a few words, don't make her type a paragraph.
- Acknowledge her load before adding to it, when it fits naturally, don't force it into every reply.
- Keep replies short. Two or three sentences is usually enough, this matters even more on WhatsApp than on the website.

WHAT YOU CAN ACTUALLY DO RIGHT NOW: remember people she cares about and their important dates, keep reminders, hold her grocery list, and look any of it back up for her. Use the tools you're given to actually do these things, don't just talk about doing them. Before adding a person or a grocery item, check what she already has (it's in the snapshot, or use a read tool) so you don't create duplicates.

WHAT YOU CANNOT DO YET, BE HONEST ABOUT THIS: you can't book restaurants or check her calendar yet, that's coming soon. If she asks, say so plainly and warmly, don't pretend.

When she mentions a person, a date, a reminder, or a grocery item, call the matching tool immediately rather than just acknowledging it in words.`;
}

export const zoyaTools = [
  {
    type: "function",
    function: {
      name: "add_person",
      description: "Add someone she cares about to her people list. Check first that they aren't already there.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          relationship: { type: "string", description: "e.g. Mum, sister, best friend, colleague" },
          notes: { type: "string", description: "Anything worth remembering about them" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_important_date",
      description: "Remember a birthday, anniversary, or other recurring date for someone. Creates the person first if they don't already exist.",
      parameters: {
        type: "object",
        properties: {
          person_name: { type: "string" },
          label: { type: "string", description: "e.g. Birthday, Anniversary" },
          date: { type: "string", description: "ISO date, YYYY-MM-DD" },
          recurrence: { type: "string", enum: ["yearly", "once"] },
        },
        required: ["person_name", "label", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_reminder",
      description: "Add a general reminder or thing to remember, optionally tied to a due date and a person.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          due_date: { type: "string", description: "ISO date, YYYY-MM-DD, optional" },
          person_name: { type: "string", description: "Optional, if this reminder relates to someone she already mentioned" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_reminder_done",
      description: "Mark an existing pending reminder as done, matched by title.",
      parameters: {
        type: "object",
        properties: { title: { type: "string" } },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_grocery_item",
      description: "Add an item to her grocery list. Check first that it isn't already on the active list.",
      parameters: {
        type: "object",
        properties: {
          item_name: { type: "string" },
          is_recurring: { type: "boolean", description: "True if this is a weekly staple she reorders often" },
        },
        required: ["item_name"],
      },
    },
  },
  // ── Read tools: let her look her own life back up mid-conversation ──
  {
    type: "function",
    function: {
      name: "get_upcoming",
      description: "Look up her pending reminders and upcoming important dates (birthdays, anniversaries), soonest first. Use when she asks what's coming up, what she has on, or before deciding whether a reminder already exists.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_groceries",
      description: "List the items currently on her active grocery list. Use before adding an item so you don't duplicate it.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "find_person",
      description: "Look up someone she's told you about by name, returning their relationship, notes, and any important dates. Use before adding a person, or when she asks about someone.",
      parameters: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      },
    },
  },
];

const WRITE_TOOLS = new Set(["add_person", "add_important_date", "add_reminder", "mark_reminder_done", "add_grocery_item"]);

async function findOrCreatePerson(db: any, userId: string, name: string) {
  const { data: existing } = await db
    .from("people")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", name)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await db
    .from("people")
    .insert({ user_id: userId, name })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

async function runTool(db: any, userId: string, todayIso: string, name: string, args: any): Promise<string> {
  switch (name) {
    case "add_person": {
      const { error } = await db
        .from("people")
        .insert({ user_id: userId, name: args.name, relationship: args.relationship ?? null, notes: args.notes ?? null });
      if (error) throw error;
      return `Added ${args.name} to her people.`;
    }
    case "add_important_date": {
      const personId = await findOrCreatePerson(db, userId, args.person_name);
      const { error } = await db.from("important_dates").insert({
        user_id: userId,
        person_id: personId,
        label: args.label,
        date: args.date,
        recurrence: args.recurrence ?? "yearly",
      });
      if (error) throw error;
      return `Remembered ${args.person_name}'s ${args.label} on ${args.date}.`;
    }
    case "add_reminder": {
      let personId: string | null = null;
      if (args.person_name) {
        personId = await findOrCreatePerson(db, userId, args.person_name);
      }
      const { error } = await db.from("reminders").insert({
        user_id: userId,
        title: args.title,
        due_date: args.due_date ?? null,
        person_id: personId,
        source: "chat",
      });
      if (error) throw error;
      return `Added the reminder: ${args.title}${args.due_date ? ` (${args.due_date})` : ""}.`;
    }
    case "mark_reminder_done": {
      const { data: match } = await db
        .from("reminders")
        .select("id, title")
        .eq("user_id", userId)
        .eq("status", "pending")
        .ilike("title", `%${args.title}%`)
        .limit(1)
        .maybeSingle();
      if (!match) return `Couldn't find a pending reminder matching "${args.title}".`;
      await db.from("reminders").update({ status: "done" }).eq("id", match.id);
      return `Marked "${match.title}" done.`;
    }
    case "add_grocery_item": {
      const { error } = await db.from("grocery_items").insert({
        user_id: userId,
        item_name: args.item_name,
        is_recurring: Boolean(args.is_recurring),
      });
      if (error) throw error;
      return `Added ${args.item_name} to her grocery list.`;
    }
    case "get_upcoming": {
      const [remRes, dateRes] = await Promise.all([
        db.from("reminders").select("title, due_date").eq("user_id", userId).eq("status", "pending").order("due_date", { ascending: true }).limit(25),
        db.from("important_dates").select("label, date, recurrence, people(name)").eq("user_id", userId).limit(50),
      ]);
      const items: Array<{ text: string; days: number }> = [];
      for (const r of (remRes.data ?? []) as Array<{ title: string; due_date: string | null }>) {
        const days = r.due_date ? daysBetween(todayIso, r.due_date) : 99999;
        items.push({ text: r.due_date ? `${r.title} — ${relativeLabel(days)} (${r.due_date})` : `${r.title} — no date set`, days });
      }
      for (const d of (dateRes.data ?? []) as Array<{ label: string; date: string; recurrence: string; people: { name: string } | null }>) {
        const next = d.recurrence === "yearly" ? nextYearlyIso(d.date, todayIso) : d.date;
        const days = daysBetween(todayIso, next);
        items.push({ text: `${d.people?.name ?? "someone"}'s ${d.label} — ${relativeLabel(days)} (${next})`, days });
      }
      if (!items.length) return "Nothing on her list right now.";
      return items.sort((a, b) => a.days - b.days).map((i) => `- ${i.text}`).join("\n");
    }
    case "list_groceries": {
      const { data } = await db.from("grocery_items").select("item_name").eq("user_id", userId).eq("status", "active").order("created_at", { ascending: false }).limit(100);
      const items = (data ?? []) as Array<{ item_name: string }>;
      if (!items.length) return "Her grocery list is empty right now.";
      return items.map((g) => g.item_name).join(", ");
    }
    case "find_person": {
      const { data: person } = await db
        .from("people")
        .select("id, name, relationship, notes")
        .eq("user_id", userId)
        .ilike("name", `%${args.name}%`)
        .limit(1)
        .maybeSingle();
      if (!person) return `She hasn't told you about anyone named "${args.name}" yet.`;
      const { data: dates } = await db
        .from("important_dates")
        .select("label, date, recurrence")
        .eq("user_id", userId)
        .eq("person_id", person.id);
      const dateLines = ((dates ?? []) as Array<{ label: string; date: string; recurrence: string }>).map((d) => {
        const next = d.recurrence === "yearly" ? nextYearlyIso(d.date, todayIso) : d.date;
        return `${d.label}: ${next} (${relativeLabel(daysBetween(todayIso, next))})`;
      });
      const bits = [person.name];
      if (person.relationship) bits.push(`relationship: ${person.relationship}`);
      if (person.notes) bits.push(`notes: ${person.notes}`);
      if (dateLines.length) bits.push(`dates — ${dateLines.join("; ")}`);
      return bits.join(" | ");
    }
    default:
      return `Unknown tool: ${name}`;
  }
}

async function callModel(apiKey: string, messages: any[], withTools: boolean) {
  const body: any = { model: MODEL, messages };
  if (withTools) {
    body.tools = zoyaTools;
    body.tool_choice = "auto";
  }
  return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export interface ZoyaBrainResult {
  reply: string;
  toolsUsed: string[];
}

export async function runZoyaBrain({
  db,
  userId,
  messages,
  assistantName,
  preferredName,
  lovableApiKey,
  logPrefix,
}: {
  db: any;
  userId: string;
  messages: Array<{ role: string; content: string }>;
  assistantName: string;
  preferredName: string | null;
  lovableApiKey: string;
  logPrefix: string;
}): Promise<ZoyaBrainResult> {
  const todayIso = uaeTodayIso();

  // Load her real state so the model reasons with memory, not a blank slate.
  const ctx = await loadContext(db, userId, todayIso, assistantName, preferredName);
  const systemContent = buildSystemPrompt(ctx, todayIso);

  // Agentic loop: read → act → reply, until the model stops asking for tools.
  const conversation: any[] = [{ role: "system", content: systemContent }, ...messages];
  const toolsUsed: string[] = [];
  const lastToolOutputs: string[] = [];
  let reply: string | null = null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const resp = await callModel(lovableApiKey, conversation, true);
    if (!resp.ok) {
      const t = await resp.text();
      console.error(`${logPrefix}: AI gateway error (round ${round}):`, resp.status, t);
      // If we already did useful work, surface it plainly rather than failing.
      if (lastToolOutputs.length) return { reply: lastToolOutputs.join(" "), toolsUsed };
      return { reply: "Sorry, something went wrong on my end, try again in a moment.", toolsUsed: [] };
    }

    const json = await resp.json();
    const choice = json.choices?.[0]?.message;
    const toolCalls = choice?.tool_calls as Array<{ id: string; function: { name: string; arguments: string } }> | undefined;

    if (!toolCalls || toolCalls.length === 0) {
      reply = choice?.content ?? null;
      break;
    }

    console.log(`${logPrefix}: tool_calls (round ${round})`, JSON.stringify(toolCalls.map((c) => c.function.name)));
    conversation.push(choice);
    for (const call of toolCalls) {
      let output: string;
      try {
        const args = JSON.parse(call.function.arguments || "{}");
        output = await runTool(db, userId, todayIso, call.function.name, args);
        if (WRITE_TOOLS.has(call.function.name)) toolsUsed.push(call.function.name);
      } catch (e) {
        console.error(`${logPrefix}: tool execution error`, call.function.name, e);
        output = `Something went wrong trying to do that: ${e instanceof Error ? e.message : "unknown error"}`;
      }
      lastToolOutputs.push(output);
      conversation.push({ role: "tool", tool_call_id: call.id, content: output });
    }
  }

  // Hit the round cap while still calling tools: force one tool-free wrap-up.
  if (reply === null) {
    const wrapResp = await callModel(lovableApiKey, conversation, false);
    if (wrapResp.ok) {
      const wrapJson = await wrapResp.json();
      reply = wrapJson.choices?.[0]?.message?.content ?? null;
    }
  }

  if (!reply) {
    reply = lastToolOutputs.length ? lastToolOutputs.join(" ") : "Sorry, I didn't quite catch that, can you try again?";
  }

  return { reply, toolsUsed };
}
