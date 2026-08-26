import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, toolError, toolJson } from "../supabase";

export default defineTool({
  name: "rsvp_to_meetup",
  title: "RSVP to a meetup",
  description:
    "RSVP the signed-in member to a published member meetup. Use list_meetups first to get the meetup id.",
  inputSchema: {
    meetup_id: z.string().uuid().describe("The meetup id returned by list_meetups."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ meetup_id }, ctx) => {
    if (!ctx.isAuthenticated()) return toolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("meetup_rsvps")
      .upsert(
        { meetup_id, user_id: ctx.getUserId() },
        { onConflict: "meetup_id,user_id", ignoreDuplicates: true },
      )
      .select();
    if (error) return toolError(error.message);
    return toolJson("RSVP confirmed. See it at https://fempowerae.com/meetups", {
      rsvp: data?.[0] ?? { meetup_id, already_rsvped: true },
    });
  },
});
