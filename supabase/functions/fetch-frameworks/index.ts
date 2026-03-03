import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SHEET_ID = "1CwYwxc8DjXYsMIvHxn5SXdRjuCBx8Jx0";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) {
      throw new Error(`Google Sheets fetch failed: ${res.status}`);
    }

    const csv = await res.text();
    const lines = csv.split("\n").filter((l) => l.trim());

    // Skip header row
    const frameworks = lines.slice(1).map((line) => {
      const cols = parseCSVLine(line);
      return {
        name: cols[0]?.replace(/^"|"$/g, "") || "",
        inspiredBy: cols[1]?.replace(/^"|"$/g, "") || "",
        description: cols[2]?.replace(/^"|"$/g, "") || "",
        howUseful: cols[3]?.replace(/^"|"$/g, "") || "",
        howToImplement: cols[4]?.replace(/^"|"$/g, "") || "",
      };
    }).filter((f) => f.name);

    return new Response(JSON.stringify({ frameworks }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching frameworks:", error);
    return new Response(
      JSON.stringify({ error: error.message, frameworks: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
