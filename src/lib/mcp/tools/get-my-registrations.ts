import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, toolError, toolJson } from "../supabase";

export default defineTool({
  name: "get_my_registrations",
  title: "Get my event registrations",
  description:
    "List the signed-in member's Fempower event registrations, including ticket code, status and event date.",
  inputSchema: {
    upcoming_only: z
      .boolean()
      .optional()
      .describe("Only return registrations for events that have not happened yet. Defaults to true."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ upcoming_only }, ctx) => {
    if (!ctx.isAuthenticated()) return toolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("registrations")
      .select(
        "status,ticket_code,quantity,checked_in_at,created_at,events(slug,title,starts_at,location)",
      )
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return toolError(error.message);

    const now = Date.now();
    const rows = (data ?? []).filter((r) => {
      if (upcoming_only === false) return true;
      const ev = r.events as { starts_at?: string } | null;
      return ev?.starts_at ? new Date(ev.starts_at).getTime() >= now : true;
    });

    const text = rows.length
      ? rows
          .map((r) => {
            const ev = r.events as { title?: string; starts_at?: string } | null;
            return `${ev?.title ?? "Event"} — ${
              ev?.starts_at ? new Date(ev.starts_at).toUTCString() : "date TBC"
            } — ${r.status} — ticket ${r.ticket_code} (x${r.quantity})`;
          })
          .join("\n")
      : "No registrations found.";

    return toolJson(text, { registrations: rows });
  },
});
