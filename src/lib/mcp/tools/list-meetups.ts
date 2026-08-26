import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, toolError, toolJson } from "../supabase";

export default defineTool({
  name: "list_meetups",
  title: "List member meetups",
  description:
    "List published member-hosted meetups across the UAE. Host identity is masked according to each host's chosen visibility.",
  inputSchema: {
    emirate: z
      .string()
      .trim()
      .optional()
      .describe("Filter to one emirate, e.g. 'Dubai' or 'Abu Dhabi'."),
    limit: z.number().int().min(1).max(25).optional().describe("Max results. Defaults to 10."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ emirate, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return toolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    // The RPC applies the host-privacy masking rules; never query `meetups` raw.
    const { data, error } = await supabase.rpc("get_meetups_public");
    if (error) return toolError(error.message);

    const now = Date.now();
    const meetups = (data ?? [])
      .filter((m: { starts_at: string; emirate: string | null }) => {
        if (new Date(m.starts_at).getTime() < now) return false;
        if (!emirate) return true;
        return (m.emirate ?? "").toLowerCase() === emirate.toLowerCase();
      })
      .sort(
        (a: { starts_at: string }, b: { starts_at: string }) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      )
      .slice(0, limit ?? 10);

    const text = meetups.length
      ? meetups
          .map(
            (m: { id: string; title: string; place: string; emirate: string | null; starts_at: string }) =>
              `${m.title} — ${new Date(m.starts_at).toUTCString()} — ${m.place}${
                m.emirate ? `, ${m.emirate}` : ""
              } (id: ${m.id})`,
          )
          .join("\n")
      : "No upcoming meetups match that filter.";

    return toolJson(text, { meetups });
  },
});
