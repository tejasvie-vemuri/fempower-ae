import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SHEET_ID = "1dTN0rn9BIRmTDntCk9SV-BxgQcUkFIBRT2wmrxNKJhA";
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

    // Find the header row (skip empty rows)
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.some((c) => c.replace(/^"|"$/g, "").toLowerCase() === "title")) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      return new Response(JSON.stringify({ resources: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resources = lines.slice(headerIndex + 1).map((line) => {
      const cols = parseCSVLine(line);
      return {
        title: cols[0]?.replace(/^"|"$/g, "") || "",
        description: cols[1]?.replace(/^"|"$/g, "") || "",
        type: (cols[2]?.replace(/^"|"$/g, "") || "link").toLowerCase(),
        url: cols[3]?.replace(/^"|"$/g, "") || "",
      };
    }).filter((r) => r.title && r.url);

    return new Response(JSON.stringify({ resources }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return new Response(
      JSON.stringify({ error: error.message, resources: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
