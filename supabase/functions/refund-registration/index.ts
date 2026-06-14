import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createRefund, getZiinaTestMode } from "../_shared/ziina.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsErr } = await supabaseUser.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin");
    if (!roles?.length) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const registrationId: string | undefined = body.registration_id;
    if (!registrationId) {
      return new Response(JSON.stringify({ error: "registration_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: reg, error: regErr } = await supabaseAdmin
      .from("registrations")
      .select("id, status, payment_intent_id, amount_paid_cents, currency, refund_id")
      .eq("id", registrationId)
      .maybeSingle();

    if (regErr || !reg) {
      return new Response(JSON.stringify({ error: "Registration not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (reg.status === "refunded") {
      return new Response(JSON.stringify({ error: "Already refunded" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!reg.payment_intent_id) {
      return new Response(JSON.stringify({ error: "No Ziina payment intent found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const refundId = reg.refund_id ?? crypto.randomUUID();
    const refund = await createRefund({
      id: refundId,
      payment_intent_id: reg.payment_intent_id,
      amount: reg.amount_paid_cents,
      currency_code: String(reg.currency ?? "AED").toUpperCase(),
      test: getZiinaTestMode(),
    });

    const nextStatus = refund.status === "completed" ? "refunded" : reg.status;
    await supabaseAdmin
      .from("registrations")
      .update({
        status: nextStatus,
        refund_id: refund.id,
        payment_provider: "ziina",
      })
      .eq("id", registrationId);

    return new Response(
      JSON.stringify({ refunded: nextStatus === "refunded", refund_status: refund.status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("refund-registration error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
