import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  createPaymentIntent,
  getPublicSiteUrl,
  getZiinaTestMode,
} from "../_shared/ziina.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,19}$/;
const LINKEDIN_RE = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/.+$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const eventId = typeof body.event_id === "string" ? body.event_id : "";
    const name = String(body.name ?? "").trim().slice(0, 120);
    const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);
    const phone = String(body.phone ?? "").trim().slice(0, 32);
    const linkedin = String(body.linkedin_url ?? "").trim().slice(0, 300);

    if (!eventId) return json({ error: "event_id required" }, 400);
    if (name.length < 2) return json({ error: "Please enter your full name" }, 400);
    if (!EMAIL_RE.test(email)) return json({ error: "Please enter a valid email address" }, 400);
    if (!PHONE_RE.test(phone)) return json({ error: "Please enter a valid phone number" }, 400);
    if (!LINKEDIN_RE.test(linkedin)) {
      return json({ error: "Please enter a valid LinkedIn profile URL" }, 400);
    }

    const rawResponses =
      body.responses && typeof body.responses === "object" && !Array.isArray(body.responses)
        ? (body.responses as Record<string, unknown>)
        : {};
    const responses: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawResponses)) {
      if (typeof k === "string" && k.length <= 64) {
        responses[k] = (typeof v === "string" ? v : String(v ?? "")).slice(0, 1000);
      }
    }

    const rawQty = Number(body.quantity);
    const quantity =
      Number.isFinite(rawQty) && rawQty >= 1 && rawQty <= 4 ? Math.floor(rawQty) : 1;
    const companions: Array<{ name: string; email?: string }> = [];
    const rawGuests = Array.isArray(body.guests) ? body.guests : [];
    for (let i = 0; i < quantity - 1; i += 1) {
      const g = (rawGuests[i] ?? {}) as Record<string, unknown>;
      const gName = typeof g.name === "string" ? g.name.trim().slice(0, 120) : "";
      const gEmail = typeof g.email === "string" ? g.email.trim().slice(0, 200) : "";
      if (!gName) return json({ error: `Guest ${i + 1}: name is required` }, 400);
      companions.push(gEmail ? { name: gName, email: gEmail } : { name: gName });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: ev } = await admin
      .from("events")
      .select("id, slug, title, starts_at, location, price_cents, currency, capacity, status, members_only")
      .eq("id", eventId)
      .maybeSingle();

    if (!ev) return json({ error: "Event not found" }, 404);
    if (ev.status !== "published") return json({ error: "Event is not open for registration" }, 400);
    if (ev.members_only) return json({ error: "This event is for Fempower members only" }, 403);

    // Already a member? Never create a parallel guest record — send them to sign in.
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("user_id, name")
      .ilike("email", email)
      .maybeSingle();
    if (existingProfile) {
      return json({
        existing_member: true,
        message:
          "Looks like you're already part of Fempower with this email. Please sign in to register — your ticket will be saved to your account.",
      });
    }

    // Capacity
    if (ev.capacity > 0) {
      const { data: seatRows } = await admin
        .from("registrations")
        .select("quantity")
        .eq("event_id", ev.id)
        .eq("status", "confirmed");
      const used = (seatRows ?? []).reduce(
        (acc: number, r: { quantity: number | null }) => acc + (r.quantity ?? 1),
        0,
      );
      const remaining = ev.capacity - used;
      if (remaining <= 0) return json({ error: "Event is sold out" }, 400);
      if (quantity > remaining) {
        return json(
          { error: `Only ${remaining} seat${remaining === 1 ? "" : "s"} left` },
          400,
        );
      }
    }

    const { data: existingReg } = await admin
      .from("registrations")
      .select("id, status")
      .eq("event_id", ev.id)
      .ilike("guest_email", email)
      .maybeSingle();
    if (existingReg?.status === "confirmed") {
      return json({ error: "You are already registered with this email" }, 400);
    }

    const isFree = ev.price_cents <= 0;
    const payload = {
      event_id: ev.id,
      user_id: null,
      status: isFree ? "confirmed" : "pending",
      amount_paid_cents: 0,
      currency: ev.currency,
      responses,
      quantity,
      guests: companions,
      guest_name: name,
      guest_email: email,
      guest_phone: phone,
      guest_linkedin_url: linkedin,
      payment_provider: isFree ? null : "ziina",
    };

    let registrationId = existingReg?.id ?? null;
    let ticketCode: string | null = null;
    if (registrationId) {
      const { data: upd, error: updErr } = await admin
        .from("registrations")
        .update(payload)
        .eq("id", registrationId)
        .select("id, ticket_code")
        .single();
      if (updErr) return json({ error: updErr.message }, 500);
      ticketCode = upd.ticket_code;
    } else {
      const { data: ins, error: insErr } = await admin
        .from("registrations")
        .insert(payload)
        .select("id, ticket_code")
        .single();
      if (insErr) return json({ error: insErr.message }, 500);
      registrationId = ins.id;
      ticketCode = ins.ticket_code;
    }

    const origin = String(
      body.origin ?? req.headers.get("origin") ?? "",
    ).replace(/\/+$/, "");
    const siteUrl = getPublicSiteUrl(origin);

    if (!isFree) {
      const operationId = crypto.randomUUID();
      const baseReturnUrl = `${siteUrl}/events/${ev.slug}`;
      const param = `registration_id=${encodeURIComponent(registrationId!)}`;
      const intent = await createPaymentIntent({
        amount: ev.price_cents * quantity,
        currency_code: String(ev.currency ?? "AED").toUpperCase(),
        message: quantity > 1 ? `${ev.title} (x${quantity})` : ev.title,
        success_url: `${baseReturnUrl}?checkout=success&${param}`,
        cancel_url: `${baseReturnUrl}?checkout=cancelled&${param}`,
        failure_url: `${baseReturnUrl}?checkout=failed&${param}`,
        operation_id: operationId,
        test: getZiinaTestMode(),
        allow_tips: false,
      });
      if (!intent.id || !intent.redirect_url) {
        throw new Error("Ziina did not return a payment redirect URL");
      }
      // Critical write — the webhook and reconciliation match the paid guest
      // registration by payment_intent_id. Fail before redirecting to pay if it
      // can't be stored, so a captured payment is never orphaned as pending.
      const { error: intentErr } = await admin
        .from("registrations")
        .update({
          payment_intent_id: intent.id,
          payment_checkout_url: intent.redirect_url,
          payment_operation_id: intent.operation_id ?? operationId,
        })
        .eq("id", registrationId!);
      if (intentErr) {
        console.error("guest-register: failed to store payment_intent_id", {
          registrationId,
          intentId: intent.id,
          error: intentErr.message,
        });
        return json({ error: "Could not start checkout. Please try again." }, 500);
      }

      return json({ redirect_url: intent.redirect_url, registration_id: registrationId });
    }

    // Free — confirmation email with the ticket code.
    try {
      await admin.functions.invoke("send-app-email", {
        body: {
          templateName: "event-registration-confirmation",
          recipientEmail: email,
          idempotencyKey: `event-reg-${registrationId}`,
          templateData: {
            name,
            eventTitle: ev.title,
            startsAt: ev.starts_at,
            location: ev.location,
            ticketCode,
            quantity,
            eventUrl: `${siteUrl}/events/${ev.slug}`,
          },
        },
      });
    } catch (e) {
      console.warn("guest-register: confirmation email failed", e);
    }

    return json({ registration_id: registrationId, ticket_code: ticketCode });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("guest-register error:", msg);
    return json({ error: msg }, 500);
  }
});
