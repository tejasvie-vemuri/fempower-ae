import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, toolError, toolJson } from "../supabase";

export default defineTool({
  name: "get_my_checklists",
  title: "Get my saved Zara checklist results",
  description:
    "Return the signed-in member's saved coaching checklist summaries (Invisible Labour Audit, The Ask, Am I Actually Fine?, Relocation Load).",
  inputSchema: {
    limit: z.number().int().min(1).max(20).optional().describe("Max summaries. Defaults to 5."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return toolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("coach_checklist_results")
      .select("checklist_key,checklist_label,summary,created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 5);
    if (error) return toolError(error.message);

    const results = data ?? [];
    const text = results.length
      ? results
          .map(
            (r) =>
              `${r.checklist_label} (${new Date(r.created_at).toDateString()})\n${r.summary}`,
          )
          .join("\n\n")
      : "No saved checklist results. Run one with Zara at https://fempowerae.com/ai-coach-for-women-uae";

    return toolJson(text, { results });
  },
});
