import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runZoyaBrain } from "../_shared/zoya-brain.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeNumber(n: string) {
  return n.replace(/\D/g, "");
}

async function sendWhatsAppMessage(to: string, body: string, phoneNumberId: string, accessToken: string) {
  const resp = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });
  if (!resp.ok) {
    console.error("whatsapp-webhook: send failed", resp.status, await resp.text());
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Meta's webhook verification handshake, done once when the webhook is configured.
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token === verifyToken && challenge) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();
    const change = payload?.entry?.[0]?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    // Delivery/read status updates, or anything without an actual message, just acknowledge.
    if (!message || message.type !== "text") {
      return new Response("OK", { status: 200 });
    }

    const fromNumber = message.from as string;
    const text = message.text?.body?.trim();
    if (!text) return new Response("OK", { status: 200 });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;

    // Service-role client, every query below explicitly filters by user_id,
    // the same discipline the RLS-scoped web client already relies on.
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: profiles } = await admin
      .from("lm_profile")
      .select("user_id, assistant_name, preferred_name, whatsapp_number")
      .not("whatsapp_number", "is", null);

    const normalizedFrom = normalizeNumber(fromNumber);
    const profile = (profiles ?? []).find((p) => normalizeNumber(p.whatsapp_number ?? "") === normalizedFrom);

    if (!profile) {
      await sendWhatsAppMessage(
        fromNumber,
        "I don't recognize this number yet. Add it under Settings in your FemPower Lifestyle Manager first, then text me again.",
        phoneNumberId,
        accessToken,
      );
      return new Response("OK", { status: 200 });
    }

    const userId = profile.user_id;

    // Full history across both channels, so switching between the website
    // chat and WhatsApp feels like one continuous conversation, not two.
    const { data: history } = await admin
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(30);

    await admin.from("chat_messages").insert({ user_id: userId, role: "user", content: text, channel: "whatsapp" });

    const result = await runZoyaBrain({
      db: admin,
      userId,
      messages: [...(history ?? []), { role: "user", content: text }],
      assistantName: profile.assistant_name || "Zoya",
      preferredName: profile.preferred_name || null,
      lovableApiKey: LOVABLE_API_KEY,
      logPrefix: "whatsapp-webhook",
    });

    await admin.from("chat_messages").insert({
      user_id: userId,
      role: "assistant",
      content: result.reply,
      channel: "whatsapp",
      intent: result.toolsUsed?.[0] ?? null,
    });

    await sendWhatsAppMessage(fromNumber, result.reply, phoneNumberId, accessToken);

    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("whatsapp-webhook error:", e);
    // Always 200 back to Meta even on our own errors, otherwise it retries
    // the same message repeatedly.
    return new Response("OK", { status: 200 });
  }
});
