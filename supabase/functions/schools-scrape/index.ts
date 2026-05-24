import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

const extractionSchema = {
  type: "object",
  properties: {
    official_name: { type: "string" },
    type: { type: "string", description: "school or nursery" },
    emirate: { type: "string" },
    area: { type: "string" },
    curriculum: { type: "array", items: { type: "string" } },
    age_min: { type: "number" },
    age_max: { type: "number" },
    fees_min_aed: { type: "number" },
    fees_max_aed: { type: "number" },
    fees_year: { type: "string" },
    waitlist_status: { type: "string", description: "open, waitlist, closed, or unknown" },
    description: { type: "string" },
    logo_url: { type: "string" },
  },
};

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

    // Auth: require admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await authClient.auth.getUser();
    if (!userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: corsHeaders });

    const { school_id, url, name } = await req.json();
    if (!school_id) return new Response(JSON.stringify({ error: "school_id required" }), { status: 400, headers: corsHeaders });

    let targetUrl = url as string | undefined;

    // If no URL, search for the school
    if (!targetUrl && name) {
      const searchRes = await fetch(`${FIRECRAWL_V2}/search`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: `${name} school nursery UAE official site`, limit: 3 }),
      });
      const searchData = await searchRes.json();
      const first = searchData?.data?.web?.[0] || searchData?.data?.[0] || searchData?.web?.[0];
      targetUrl = first?.url;
    }

    if (!targetUrl) return new Response(JSON.stringify({ error: "Could not find a URL to scrape" }), { status: 400, headers: corsHeaders });

    // Scrape with structured extraction
    const scrapeRes = await fetch(`${FIRECRAWL_V2}/scrape`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: targetUrl,
        formats: ["markdown", { type: "json", schema: extractionSchema, prompt: "Extract UAE school/nursery info: curriculum, age range, fees per year in AED, waitlist availability, and a short description." }],
        onlyMainContent: true,
      }),
    });
    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) throw new Error(`Firecrawl scrape failed: ${JSON.stringify(scrapeData)}`);

    const extracted = scrapeData?.data?.json || scrapeData?.json || {};
    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";

    // Build update payload (only set fields when extracted)
    const update: Record<string, unknown> = {
      website_url: targetUrl,
      source_data: { extracted, markdown: markdown.slice(0, 20000), scraped_at: new Date().toISOString() },
      last_scraped_at: new Date().toISOString(),
    };
    if (extracted.official_name) update.name = extracted.official_name;
    if (extracted.type) update.type = extracted.type.toLowerCase().includes("nurser") ? "nursery" : "school";
    if (extracted.emirate) update.emirate = extracted.emirate;
    if (extracted.area) update.area = extracted.area;
    if (Array.isArray(extracted.curriculum) && extracted.curriculum.length) update.curriculum = extracted.curriculum;
    if (extracted.age_min != null) update.age_min = extracted.age_min;
    if (extracted.age_max != null) update.age_max = extracted.age_max;
    if (extracted.fees_min_aed != null) update.fees_min = Math.round(extracted.fees_min_aed);
    if (extracted.fees_max_aed != null) update.fees_max = Math.round(extracted.fees_max_aed);
    if (extracted.fees_year) update.fees_year = extracted.fees_year;
    if (extracted.waitlist_status) update.waitlist_status = extracted.waitlist_status.toLowerCase();
    if (extracted.description) update.description = extracted.description;
    if (extracted.logo_url) update.logo_url = extracted.logo_url;

    const { data: updated, error } = await admin.from("schools").update(update).eq("id", school_id).select().single();
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, school: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("schools-scrape error:", msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
