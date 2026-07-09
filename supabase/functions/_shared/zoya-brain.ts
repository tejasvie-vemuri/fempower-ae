// Zoya's core: the system prompt, her tools, and the two-pass tool-calling
// loop against the Lovable AI gateway. Both zoya-chat (web) and the WhatsApp
// webhook call runZoyaBrain so every channel shares one identical brain.

export function buildSystemPrompt(assistantName: string, preferredName: string | null) {
  // UAE is UTC+4 year round, no DST, safe to compute directly.
  const uaeNow = new Date(Date.now() + 4 * 60 * 60 * 1000);
  const todayIso = uaeNow.toISOString().slice(0, 10);
  const weekday = uaeNow.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });

  return `You are ${assistantName}, a personal Lifestyle Manager inside FemPower AE, built for a busy woman in the UAE juggling a career, a household, and everyone else's everything.

TODAY'S DATE IS ${todayIso} (${weekday}), in the UAE. Always resolve relative dates like "tomorrow", "Friday", "next month" against this actual date, never guess a date from memory or training data.

${preferredName ? `You call her ${preferredName}.` : "You don't know her preferred name yet, so keep it warm without a name."}

WHO SHE IS: professional, often running between errands and commitments, carrying real mental load. Your entire job is to make that load lighter, never heavier.

VOICE:
- Warm, human, like a trusted friend, never corporate. No "task", "action item", or "workflow", just "thing to remember".
- One decision at a time. Never hand her a list of choices to sort through herself.
- Never guilt her. No "you forgot X". Only ever forward-looking and supportive.
- Minimum viable input. If she can answer in a few words, don't make her type a paragraph.
- Acknowledge her load before adding to it, when it fits naturally, don't force it into every reply.
- Keep replies short. Two or three sentences is usually enough, this matters even more on WhatsApp than on the website.

WHAT YOU CAN ACTUALLY DO RIGHT NOW: remember people she cares about and their important dates, keep reminders, and hold her grocery list. Use the tools you're given to actually do these things, don't just talk about doing them.

WHAT YOU CANNOT DO YET, BE HONEST ABOUT THIS: you can't book restaurants or check her calendar yet, that's coming soon. If she asks, say so plainly and warmly, don't pretend.

When she mentions a person, a date, a reminder, or a grocery item, call the matching tool immediately rather than just acknowledging it in words.`;
}

export const zoyaTools = [
  {
    type: "function",
    function: {
      name: "add_person",
      description: "Add someone she cares about to her people list.",
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
      description: "Add an item to her grocery list.",
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
];

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

async function runTool(db: any, userId: string, name: string, args: any): Promise<string> {
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
      return `Added the reminder: ${args.title}.`;
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
    default:
      return `Unknown tool: ${name}`;
  }
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
  const systemContent = buildSystemPrompt(assistantName, preferredName);

  const firstResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: systemContent }, ...messages],
      tools: zoyaTools,
      tool_choice: "auto",
    }),
  });

  if (!firstResp.ok) {
    const t = await firstResp.text();
    console.error(`${logPrefix}: AI gateway error (first pass):`, firstResp.status, t);
    return { reply: "Sorry, something went wrong on my end, try again in a moment.", toolsUsed: [] };
  }

  const firstJson = await firstResp.json();
  const choice = firstJson.choices?.[0]?.message;
  const toolCalls = choice?.tool_calls as Array<{ id: string; function: { name: string; arguments: string } }> | undefined;

  if (!toolCalls || toolCalls.length === 0) {
    console.log(
      `${logPrefix}: no tool_calls returned`,
      JSON.stringify({ finish_reason: firstJson.choices?.[0]?.finish_reason, content: choice?.content }),
    );
    return { reply: choice?.content ?? "Sorry, I didn't quite catch that, can you try again?", toolsUsed: [] };
  }

  console.log(`${logPrefix}: tool_calls returned`, JSON.stringify(toolCalls.map((c) => ({ name: c.function.name, args: c.function.arguments }))));

  const toolResults: { tool_call_id: string; output: string }[] = [];
  const toolsUsed: string[] = [];
  for (const call of toolCalls) {
    let output: string;
    try {
      const args = JSON.parse(call.function.arguments || "{}");
      output = await runTool(db, userId, call.function.name, args);
      toolsUsed.push(call.function.name);
    } catch (e) {
      console.error(`${logPrefix}: tool execution error`, call.function.name, e);
      output = `Something went wrong trying to do that: ${e instanceof Error ? e.message : "unknown error"}`;
    }
    toolResults.push({ tool_call_id: call.id, output });
  }

  const secondResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemContent },
        ...messages,
        choice,
        ...toolResults.map((r) => ({ role: "tool", tool_call_id: r.tool_call_id, content: r.output })),
      ],
    }),
  });

  if (!secondResp.ok) {
    const t = await secondResp.text();
    console.error(`${logPrefix}: AI gateway error (second pass):`, secondResp.status, t);
    return { reply: toolResults.map((r) => r.output).join(" "), toolsUsed };
  }

  const secondJson = await secondResp.json();
  const reply = secondJson.choices?.[0]?.message?.content ?? toolResults.map((r) => r.output).join(" ");

  return { reply, toolsUsed };
}
