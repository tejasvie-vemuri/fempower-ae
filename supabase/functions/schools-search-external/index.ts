import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) throw new Error("FIRECRAWL_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await authClient.auth.getUser();
    if (!userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: corsHeaders });

    const { query, limit = 5 } = await req.json();
    if (!query || typeof query !== "string") return new Response(JSON.stringify({ error: "query required" }), { status: 400, headers: corsHeaders });

    const res = await fetch(`${FIRECRAWL_V2}/search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: `${query} UAE`, limit: Math.min(limit, 10) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Firecrawl search failed: ${JSON.stringify(data)}`);

    const results = data?.data?.web || data?.web || data?.data || [];

    // Create draft school rows for each result (admin can then refresh & publish)
    const inserted: any[] = [];
    for (const r of results) {
      const name = r.title?.split("|")[0]?.split("-")[0]?.trim() || r.url;
      if (!name) continue;
      const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
      const { data: row } = await admin
        .from("schools")
        .insert({ name, slug, website_url: r.url, description: r.description || null, status: "draft", created_by: userData.user.id })
        .select()
        .single();
      if (row) inserted.push(row);
    }

    return new Response(JSON.stringify({ success: true, inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("schools-search-external error:", msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
