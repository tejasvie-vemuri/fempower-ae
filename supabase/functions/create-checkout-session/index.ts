import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  createPaymentIntent,
  getPublicSiteUrl,
  getZiinaTestMode,
} from "../_shared/ziina.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

    const body = await req.json().catch(() => ({}));
    const eventId: string | undefined = body.event_id;
    const origin = String(
      body.origin ?? req.headers.get("origin") ?? req.headers.get("referer") ?? "",
    ).replace(/\/+$/, "");
    const siteUrl = getPublicSiteUrl(origin);
    const rawResponses =
      body.responses && typeof body.responses === "object" && !Array.isArray(body.responses)
        ? (body.responses as Record<string, unknown>)
        : {};
    const responses: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawResponses)) {
      if (typeof k === "string" && k.length <= 64) {
        const s = typeof v === "string" ? v : String(v ?? "");
        responses[k] = s.slice(0, 1000);
      }
    }

    const MAX_QTY = 4;
    const rawQty = Number(body.quantity);
    const quantity =
      Number.isFinite(rawQty) && rawQty >= 1 && rawQty <= MAX_QTY
        ? Math.floor(rawQty)
        : 1;
    const rawGuests = Array.isArray(body.guests) ? body.guests : [];
    const guests: Array<{ name: string; email?: string }> = [];
    for (let i = 0; i < quantity - 1; i += 1) {
      const g = rawGuests[i];
      if (!g || typeof g !== "object") {
        return new Response(
          JSON.stringify({ error: `Guest ${i + 1}: name is required` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const o = g as Record<string, unknown>;
      const name = typeof o.name === "string" ? o.name.trim().slice(0, 120) : "";
      const email = typeof o.email === "string" ? o.email.trim().slice(0, 200) : "";
      if (!name) {
        return new Response(
          JSON.stringify({ error: `Guest ${i + 1}: name is required` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      guests.push(email ? { name, email } : { name });
    }

    if (!eventId) {
      return new Response(JSON.stringify({ error: "event_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Event sign-ups are members-only. The free path is enforced inside
    // confirm_free_registration; the paid path is enforced here, before any
    // payment intent is created.
    const { data: isMember, error: memberErr } = await supabaseAdmin.rpc(
      "is_approved_member",
      { _user_id: userId },
    );
    if (memberErr || !isMember) {
      return new Response(
        JSON.stringify({
          error:
            "Fempower membership required to book events. Join the community first and we'll approve you.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: ev, error: evErr } = await supabaseAdmin
      .from("events")
      .select("id, slug, title, price_cents, currency, capacity, status, waitlist_enabled")
      .eq("id", eventId)
      .maybeSingle();

    if (evErr || !ev) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (ev.status !== "published") {
      return new Response(JSON.stringify({ error: "Event is not open for registration" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (ev.price_cents <= 0) {
      return new Response(JSON.stringify({ error: "Event is free — use direct registration" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ev.capacity > 0) {
      const { data: seatRows } = await supabaseAdmin
        .from("registrations")
        .select("quantity")
        .eq("event_id", ev.id)
        .eq("status", "confirmed");
      const used = (seatRows ?? []).reduce(
        (acc: number, r: { quantity: number | null }) => acc + (r.quantity ?? 1),
        0,
      );
      const remaining = ev.capacity - used;
      if (remaining <= 0) {
        return new Response(JSON.stringify({ error: "Event is sold out" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (quantity > remaining) {
        return new Response(
          JSON.stringify({ error: `Only ${remaining} seat${remaining === 1 ? "" : "s"} left` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const { data: existingReg } = await supabaseAdmin
      .from("registrations")
      .select("id, status")
      .eq("event_id", ev.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingReg?.status === "confirmed") {
      return new Response(JSON.stringify({ error: "You are already registered" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let registrationId = existingReg?.id;
    if (!registrationId) {
      const { data: reg, error: regErr } = await supabaseAdmin
        .from("registrations")
        .insert({
          event_id: ev.id,
          user_id: userId,
          status: "pending",
          amount_paid_cents: 0,
          currency: ev.currency,
          payment_provider: "ziina",
          responses,
          quantity,
          guests,
        })
        .select("id")
        .single();
      if (regErr || !reg) {
        return new Response(
          JSON.stringify({ error: regErr?.message ?? "Failed to create registration" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      registrationId = reg.id;
    } else {
      await supabaseAdmin
        .from("registrations")
        .update({
          status: "pending",
          amount_paid_cents: 0,
          currency: ev.currency,
          responses,
          quantity,
          guests,
          payment_provider: "ziina",
        })
        .eq("id", registrationId);
    }

    const operationId = crypto.randomUUID();
    const baseReturnUrl = `${siteUrl}/events/${ev.slug}`;
    const registrationReturnParam = `registration_id=${encodeURIComponent(registrationId!)}`;
    const intent = await createPaymentIntent({
      amount: ev.price_cents * quantity,
      currency_code: String(ev.currency ?? "AED").toUpperCase(),
      message: quantity > 1 ? `${ev.title} (x${quantity})` : ev.title,
      success_url: `${baseReturnUrl}?checkout=success&${registrationReturnParam}`,
      cancel_url: `${baseReturnUrl}?checkout=cancelled&${registrationReturnParam}`,
      failure_url: `${baseReturnUrl}?checkout=failed&${registrationReturnParam}`,
      operation_id: operationId,
      test: getZiinaTestMode(),
      allow_tips: false,
    });

    if (!intent.id || !intent.redirect_url) {
      throw new Error("Ziina did not return a payment redirect URL");
    }

    await supabaseAdmin
      .from("registrations")
      .update({
        payment_provider: "ziina",
        payment_intent_id: intent.id,
        payment_checkout_url: intent.redirect_url,
        payment_operation_id: intent.operation_id ?? operationId,
      })
      .eq("id", registrationId!);

    return new Response(
      JSON.stringify({
        payment_intent_id: intent.id,
        redirect_url: intent.redirect_url,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("create-checkout-session error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
