import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  school_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(10).max(4000),
  curriculum: z.string().trim().max(100).optional().nullable(),
  child_age_group: z.string().trim().max(50).optional().nullable(),
  waitlist_experience: z.string().trim().max(1000).optional().nullable(),
  fees_paid_aed: z.number().int().min(0).max(1000000).optional().nullable(),
  fees_year: z.string().trim().max(20).optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await authClient.auth.getUser();
    if (!userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const admin = createClient(supabaseUrl, serviceKey);

    // Approved member check
    const { data: memberRow } = await admin.from("member_profiles").select("status").eq("user_id", userData.user.id).maybeSingle();
    if (!memberRow || memberRow.status !== "approved") {
      return new Response(JSON.stringify({ error: "Approved members only" }), { status: 403, headers: corsHeaders });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400, headers: corsHeaders });
    }
    const b = parsed.data;

    // Rate limit: 5 reviews / 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await admin.from("school_reviews").select("id", { count: "exact", head: true })
      .eq("user_id", userData.user.id).gte("created_at", since);
    if ((count ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: "Rate limit: max 5 reviews per day" }), { status: 429, headers: corsHeaders });
    }

    const { data: review, error } = await admin.from("school_reviews").insert({
      school_id: b.school_id,
      user_id: userData.user.id,
      rating: b.rating,
      body: b.body,
      curriculum: b.curriculum || null,
      child_age_group: b.child_age_group || null,
      waitlist_experience: b.waitlist_experience || null,
      fees_paid_cents: b.fees_paid_aed != null ? b.fees_paid_aed * 100 : null,
      fees_year: b.fees_year || null,
      status: "pending",
    }).select().single();
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, review }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("schools-submit-review error:", msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
