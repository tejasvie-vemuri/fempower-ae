import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { resolvePromo } from "../_shared/promo.ts";
const schema = z.object({ event_id: z.string().uuid(), promo_code: z.string().trim().min(2).max(40), quantity: z.number().int().min(1).max(4) });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Enter a valid promo code and ticket quantity" }, 400);
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let userId: string | null = null;
    const bearer = req.headers.get("Authorization")?.replace(/^Bearer /, "");
    if (bearer) {
      const { data } = await db.auth.getUser(bearer);
      userId = data.user?.id ?? null;
    }
    const { data: event, error } = await db.from("events").select("id,price_cents,currency,status").eq("id", parsed.data.event_id).maybeSingle();
    if (error || !event || event.status !== "published") return json({ error: "Event is not open for registration" }, 400);
    return json(await resolvePromo(db, parsed.data.promo_code, event, parsed.data.quantity, userId));
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Could not check promo code" }, 400); }
});