import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, toolError, toolJson } from "../supabase";

export default defineTool({
  name: "list_upcoming_events",
  title: "List upcoming Fempower events",
  description:
    "List published, upcoming Fempower events in the UAE with date, location, price and registration link.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(25)
      .optional()
      .describe("How many events to return. Defaults to 10."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return toolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("events")
      .select(
        "slug,title,description,location,starts_at,ends_at,price_cents,currency,capacity",
      )
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(limit ?? 10);
    if (error) return toolError(error.message);

    const events = (data ?? []).map((e) => ({
      ...e,
      url: `https://fempowerae.com/events/${e.slug}`,
      price: e.price_cents === 0 ? "Free" : `${e.currency} ${(e.price_cents / 100).toFixed(2)}`,
    }));

    const text = events.length
      ? events
          .map(
            (e) =>
              `${e.title} — ${new Date(e.starts_at).toUTCString()} — ${
                e.location ?? "UAE"
              } — ${e.price} — ${e.url}`,
          )
          .join("\n")
      : "No upcoming events are published right now.";

    return toolJson(text, { events });
  },
});
