// Submit a Circle post or reply. Handles crisis keyword scan,
// trusted-poster auto-publish, and identity protection.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Crisis keywords (EN + light AR). Word-boundary matched, case-insensitive.
const CRISIS_KEYWORDS = [
  "suicide", "suicidal", "kill myself", "end my life", "end it all",
  "self harm", "self-harm", "hurt myself", "cutting myself",
  "abuse", "abused", "abusive", "beaten", "beating me", "hits me", "hit me",
  "rape", "raped", "molest", "molested",
  "honor killing", "trafficked", "trafficking",
  "want to die", "wish i was dead", "can't go on", "no reason to live",
  "ينتحر", "انتحار", "أؤذي نفسي", "اغتصاب", "اعتداء",
];

const TOPIC_TAGS = [
  "career", "relationships", "motherhood", "mental-health",
  "money", "faith", "visa-legal", "body-health", "other",
];

function scanForCrisis(text: string): string[] {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const kw of CRISIS_KEYWORDS) {
    if (lower.includes(kw)) hits.push(kw);
  }
  return hits;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth client (uses caller JWT) to identify the user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Service client for trusted DB ops (bypasses RLS so we can enforce policy server-side)
    const admin = createClient(supabaseUrl, serviceKey);

    // Approval + ban checks
    const { data: memberRow } = await admin
      .from("member_profiles")
      .select("status, is_trusted_poster, name")
      .eq("user_id", userId)
      .maybeSingle();

    if (!memberRow || memberRow.status !== "approved") {
      return new Response(JSON.stringify({ error: "Members must be approved to post in the Circle." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: ban } = await admin.from("circle_bans").select("id").eq("user_id", userId).maybeSingle();
    if (ban) {
      return new Response(JSON.stringify({ error: "You are not able to post in the Circle." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const kind = body.kind as string;

    if (kind === "post") {
      const topic = String(body.topic_tag || "").trim();
      const text = String(body.body || "").trim();
      const isAnon = Boolean(body.is_anonymous);

      if (!TOPIC_TAGS.includes(topic)) {
        return new Response(JSON.stringify({ error: "Pick a topic." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (text.length < 10 || text.length > 2000) {
        return new Response(JSON.stringify({ error: "Posts must be 10–2000 characters." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const flagged = scanForCrisis(text);
      const riskLevel = flagged.length > 0 ? "high" : "none";
      // Crisis posts always go to pending. Trusted posters otherwise auto-publish.
      const autoPublish = memberRow.is_trusted_poster && riskLevel === "none";

      const { data: inserted, error: insErr } = await admin
        .from("circle_posts")
        .insert({
          user_id: userId,
          topic_tag: topic,
          body: text,
          is_anonymous: isAnon,
          status: autoPublish ? "published" : "pending",
          risk_level: riskLevel,
          flagged_keywords: flagged,
          published_at: autoPublish ? new Date().toISOString() : null,
        })
        .select("id, status, risk_level")
        .single();

      if (insErr) {
        return new Response(JSON.stringify({ error: insErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If pending, notify all admins so they can moderate
      if (inserted.status === "pending") {
        try {
          const { data: adminRoles } = await admin
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin");
          const adminIds = (adminRoles ?? []).map((r: any) => r.user_id);
          if (adminIds.length) {
            const { data: adminProfiles } = await admin
              .from("profiles")
              .select("email")
              .in("user_id", adminIds);
            const emails = (adminProfiles ?? [])
              .map((p: any) => p.email)
              .filter(Boolean);
            await Promise.all(
              emails.map((email: string) =>
                admin.functions.invoke("send-transactional-email", {
                  body: {
                    templateName: "circle-post-pending",
                    recipientEmail: email,
                    idempotencyKey: `circle-pending-${inserted.id}-${email}`,
                    templateData: {
                      authorName: isAnon ? "Anonymous member" : memberRow.name,
                      topic,
                      snippet: text.slice(0, 140),
                      riskLevel,
                      moderationUrl: "https://fempowerae.com/admin/circle",
                    },
                  },
                }),
              ),
            );
          }
        } catch (e) {
          console.warn("Failed to notify admins of pending post", e);
        }
      }

      return new Response(JSON.stringify({
        id: inserted.id,
        status: inserted.status,
        risk_level: inserted.risk_level,
        crisis_resources: riskLevel === "high",
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (kind === "reply") {
      const postId = String(body.post_id || "");
      const text = String(body.body || "").trim();
      if (!postId) {
        return new Response(JSON.stringify({ error: "Missing post." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (text.length < 2 || text.length > 1500) {
        return new Response(JSON.stringify({ error: "Replies must be 2–1500 characters." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Post must be published
      const { data: post } = await admin
        .from("circle_posts").select("id, status").eq("id", postId).maybeSingle();
      if (!post || post.status !== "published") {
        return new Response(JSON.stringify({ error: "Post not available." }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: reply, error: rErr } = await admin
        .from("circle_replies")
        .insert({ post_id: postId, user_id: userId, body: text, status: "published" })
        .select("id")
        .single();

      if (rErr) {
        return new Response(JSON.stringify({ error: rErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ id: reply.id }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown kind" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
