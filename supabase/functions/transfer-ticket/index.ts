// Transfer a confirmed event ticket to someone else.
// The caller must own the registration. If the new holder is already a
// Fempower member the ticket is reassigned to their account, otherwise it
// becomes a guest ticket with their contact details.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,19}$/;

const newTicketCode = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Not authenticated" }, 401);
    const callerId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const registrationId = typeof body.registration_id === "string" ? body.registration_id : "";
    const name = String(body.name ?? "").trim().slice(0, 120);
    const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);
    const phone = String(body.phone ?? "").trim().slice(0, 32);
    const linkedin = String(body.linkedin_url ?? "").trim().slice(0, 300);

    if (!registrationId) return json({ error: "registration_id required" }, 400);
    if (name.length < 2) return json({ error: "Please enter the new attendee's full name" }, 400);
    if (!EMAIL_RE.test(email)) return json({ error: "Please enter a valid email address" }, 400);
    if (phone && !PHONE_RE.test(phone)) return json({ error: "Please enter a valid phone number" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: reg } = await admin
      .from("registrations")
      .select(
        "id, event_id, user_id, status, quantity, cancellation_requested_at, event:events(id, slug, title, starts_at, location)",
      )
      .eq("id", registrationId)
      .maybeSingle();

    if (!reg || reg.user_id !== callerId) return json({ error: "Ticket not found" }, 404);
    if (reg.status !== "confirmed") return json({ error: "Only confirmed tickets can be transferred" }, 400);
    if (reg.cancellation_requested_at) {
      return json({ error: "This ticket has a cancellation request pending" }, 400);
    }

    const ev = (reg as unknown as {
      event: { slug: string; title: string; starts_at: string; location: string | null } | null;
    }).event;
    if (ev && new Date(ev.starts_at).getTime() < Date.now()) {
      return json({ error: "This event has already taken place" }, 400);
    }

    // Who is receiving it?
    const { data: recipientProfile } = await admin
      .from("profiles")
      .select("user_id, name, email")
      .ilike("email", email)
      .maybeSingle();

    if (recipientProfile?.user_id === callerId) {
      return json({ error: "That's your own email — enter the new attendee's email" }, 400);
    }

    // Guard against a duplicate registration for the recipient.
    if (recipientProfile) {
      const { data: dupe } = await admin
        .from("registrations")
        .select("id")
        .eq("event_id", reg.event_id)
        .eq("user_id", recipientProfile.user_id)
        .neq("id", reg.id)
        .maybeSingle();
      if (dupe) return json({ error: "That person is already registered for this event" }, 400);
    } else {
      const { data: dupe } = await admin
        .from("registrations")
        .select("id")
        .eq("event_id", reg.event_id)
        .ilike("guest_email", email)
        .neq("id", reg.id)
        .maybeSingle();
      if (dupe) return json({ error: "That email is already registered for this event" }, 400);
    }

    const ticketCode = newTicketCode();
    const update = recipientProfile
      ? {
          user_id: recipientProfile.user_id,
          guest_name: null,
          guest_email: null,
          guest_phone: null,
          guest_linkedin_url: null,
          ticket_code: ticketCode,
        }
      : {
          user_id: null,
          guest_name: name,
          guest_email: email,
          guest_phone: phone || null,
          guest_linkedin_url: linkedin || null,
          ticket_code: ticketCode,
        };

    const { error: updErr } = await admin
      .from("registrations")
      .update(update)
      .eq("id", reg.id);
    if (updErr) return json({ error: updErr.message }, 500);

    const origin = String(body.origin ?? req.headers.get("origin") ?? "").replace(/\/+$/, "");
    const siteUrl = origin || Deno.env.get("PUBLIC_SITE_URL") || "https://fempowerae.com";

    try {
      await admin.functions.invoke("send-app-email", {
        body: {
          templateName: "event-registration-confirmation",
          recipientEmail: email,
          idempotencyKey: `ticket-transfer-${reg.id}-${ticketCode}`,
          templateData: {
            name: recipientProfile?.name ?? name,
            eventTitle: ev?.title ?? "Fempower event",
            startsAt: ev?.starts_at,
            location: ev?.location,
            ticketCode,
            quantity: reg.quantity ?? 1,
            eventUrl: ev ? `${siteUrl}/events/${ev.slug}` : siteUrl,
          },
        },
      });
    } catch (e) {
      console.warn("transfer-ticket: email failed", e);
    }

    return json({
      ok: true,
      transferred_to_member: !!recipientProfile,
      ticket_code: ticketCode,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("transfer-ticket error:", msg);
    return json({ error: msg }, 500);
  }
});
