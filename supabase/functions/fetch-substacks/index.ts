import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// TODO: Replace with actual Sheet ID once user provides it
const SHEET_ID = Deno.env.get("SUBSTACKS_SHEET_ID") ?? "";
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

function extractText(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const match = xml.match(regex);
  return (match?.[1] || match?.[2] || "").trim();
}

function extractImageFromContent(content: string): string {
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
  return imgMatch?.[1] || "";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

interface Post {
  title: string;
  author: string;
  description: string;
  date: string;
  link: string;
  image: string;
}

async function fetchSubstackFeed(slug: string, name: string): Promise<Post[]> {
  try {
    // Try slug.substack.com first, then try as custom domain
    let feedUrl = `https://${slug}.substack.com/feed`;
    let res = await fetch(feedUrl);
    
    if (!res.ok && slug.includes(".")) {
      // Might be a custom domain
      feedUrl = `https://${slug}/feed`;
      res = await fetch(feedUrl);
    }
    
    if (!res.ok) {
      console.error(`Failed to fetch feed for ${slug}: ${res.status}`);
      return [];
    }

    const xml = await res.text();
    
    // Extract items from RSS
    const items: Post[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;
    
    while ((match = itemRegex.exec(xml)) !== null && count < 3) {
      const itemXml = match[1];
      const title = stripHtml(extractText(itemXml, "title"));
      const link = extractText(itemXml, "link");
      const pubDate = extractText(itemXml, "pubDate");
      const contentEncoded = extractText(itemXml, "content:encoded") || extractText(itemXml, "description");
      const description = stripHtml(contentEncoded).substring(0, 200);
      const image = extractImageFromContent(contentEncoded);
      
      if (title) {
        items.push({
          title,
          author: name || slug,
          description: description + (description.length >= 200 ? "…" : ""),
          date: pubDate,
          link,
          image,
        });
        count++;
      }
    }
    
    return items;
  } catch (err) {
    console.error(`Error fetching feed for ${slug}:`, err);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // If sheet ID hasn't been configured yet, return empty (component will hide itself)
    if (SHEET_ID === "PLACEHOLDER_SHEET_ID") {
      return new Response(JSON.stringify({ posts: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch publication list from Google Sheet
    const sheetRes = await fetch(CSV_URL);
    if (!sheetRes.ok) {
      // Gracefully degrade — return empty list instead of 500
      console.error(`Google Sheets fetch failed: ${sheetRes.status}`);
      return new Response(JSON.stringify({ posts: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const csv = await sheetRes.text();
    const lines = csv.split("\n").filter((l) => l.trim());

    // Skip header row, extract name and slug
    const publications = lines.slice(1).map((line) => {
      const cols = parseCSVLine(line);
      return {
        name: cols[0]?.replace(/^"|"$/g, "") || "",
        slug: cols[1]?.replace(/^"|"$/g, "") || "",
      };
    }).filter((p) => p.slug);

    // Fetch RSS feeds in parallel
    const feedPromises = publications.map((p) => fetchSubstackFeed(p.slug, p.name));
    const feeds = await Promise.all(feedPromises);

    // Flatten and sort by date (newest first)
    const allPosts = feeds.flat().sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      return dateB - dateA;
    });

    return new Response(JSON.stringify({ posts: allPosts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching substacks:", error);
    return new Response(
      JSON.stringify({ error: error.message, posts: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
