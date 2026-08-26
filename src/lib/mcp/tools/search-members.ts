import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, toolError, toolJson } from "../supabase";

export default defineTool({
  name: "search_members",
  title: "Search the member directory",
  description:
    "Search approved Fempower members by name, role, company, city, industry, expertise or interests. Returns only what the member chose to publish.",
  inputSchema: {
    query: z.string().trim().min(2).describe("Free-text search, e.g. 'fintech Dubai' or 'coach'."),
    limit: z.number().int().min(1).max(25).optional().describe("Max results. Defaults to 10."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return toolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    // Escape PostgREST `or` separators so a comma in the query can't inject filters.
    const term = query.replace(/[,()*]/g, " ").trim();
    if (!term) return toolError("Please provide a searchable term.");

    const { data, error } = await supabase
      .from("member_profiles")
      .select("name,role,company,city,industry,expertise_tags,interests,looking_for,bio,linkedin_url")
      .eq("status", "approved")
      .or(
        [
          `name.ilike.%${term}%`,
          `role.ilike.%${term}%`,
          `company.ilike.%${term}%`,
          `city.ilike.%${term}%`,
          `industry.ilike.%${term}%`,
          `bio.ilike.%${term}%`,
        ].join(","),
      )
      .limit(limit ?? 10);
    if (error) return toolError(error.message);

    const members = data ?? [];
    const text = members.length
      ? members
          .map(
            (m) =>
              `${m.name}${m.role ? ` — ${m.role}` : ""}${
                m.company ? ` at ${m.company}` : ""
              }${m.city ? ` (${m.city})` : ""}`,
          )
          .join("\n")
      : `No approved members matched "${term}".`;

    return toolJson(text, { members });
  },
});
