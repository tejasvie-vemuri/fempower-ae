import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FOLDER_ID = "1YCaVQ4cCWq6RR3bm3O5TwRDXjmnqaoNW";
const EMBED_URL = `https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}#grid`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const res = await fetch(EMBED_URL);
    if (!res.ok) {
      throw new Error(`Google Drive fetch failed: ${res.status}`);
    }

    const html = await res.text();

    // Extract file links: /file/d/{fileId}/view
    const fileIdRegex = /\/file\/d\/([a-zA-Z0-9_-]+)\/view/g;
    const fileIds = new Set<string>();
    let match;
    while ((match = fileIdRegex.exec(html)) !== null) {
      fileIds.add(match[1]);
    }

    // Extract corresponding filenames to filter out HEIC
    // Pattern: filename.ext](https://drive.google.com/file/d/ID/view
    const fileEntries: { id: string; name: string }[] = [];
    const nameRegex = /([^\s\\]+\.(jpg|jpeg|png|webp|heic|heif))\]\(https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/gi;
    while ((match = nameRegex.exec(html)) !== null) {
      fileEntries.push({ name: match[1], id: match[3] });
    }

    // Filter to browser-supported formats only
    const supportedEntries = fileEntries.filter(
      (e) => !e.name.toLowerCase().endsWith(".heic") && !e.name.toLowerCase().endsWith(".heif")
    );

    // If regex didn't capture names, fall back to all file IDs
    const images = supportedEntries.length > 0
      ? supportedEntries.map((e) => ({
          id: e.id,
          name: e.name,
          // Use Google's thumbnail service for public files - s1200 for high quality
          url: `https://drive.google.com/thumbnail?id=${e.id}&sz=w1200`,
        }))
      : Array.from(fileIds).map((id) => ({
          id,
          name: "",
          url: `https://drive.google.com/thumbnail?id=${id}&sz=w1200`,
        }));

    return new Response(JSON.stringify({ images }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return new Response(
      JSON.stringify({ error: error.message, images: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
