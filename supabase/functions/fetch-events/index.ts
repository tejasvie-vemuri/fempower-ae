import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SHEET_ID = Deno.env.get("EVENTS_SHEET_ID") ?? "";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

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

function parseDate(dateStr: string): string | null {
  // Expects DD/MM/YYYY
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const res = await fetch(`${CSV_URL}&_=${Date.now()}`, { cache: "no-store", redirect: "follow" });
    if (!res.ok) {
      throw new Error(`Google Sheets fetch failed: ${res.status}`);
    }

    const csv = await res.text();
    const lines = csv.split("\n").filter((l) => l.trim());

    // Skip header row
    const events = lines.slice(1).map((line) => {
      const [title, date, time, location] = parseCSVLine(line);
      return {
        title: title?.replace(/^"|"$/g, "") || "",
        date: parseDate(date?.replace(/^"|"$/g, "") || "") || "",
        time: time?.replace(/^"|"$/g, "") || "",
        location: location?.replace(/^"|"$/g, "") || "",
      };
    }).filter((e) => e.title && e.date);

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return new Response(
      JSON.stringify({ error: error.message, events: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
