import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import EventJsonLd from "@/components/EventJsonLd";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import HashLink from "@/components/HashLink";
import {
  parseQuestions,
  validateResponses,
  DEFAULT_ATTENDEE_QUESTIONS,
  DEFAULT_ATTENDEE_QUESTION_IDS,
  type AttendeeQuestion,
  type AttendeeResponses,
} from "@/lib/attendeeQuestions";

import { AttendeeQuestionsForm } from "@/components/AttendeeQuestionsForm";
import { EventResources } from "@/components/EventResources";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MAX_QUANTITY,
  sanitizeGuests,
  validateGuests,
  type Guest,
} from "@/lib/guests";
import { track } from "@/lib/analytics";
import { Minus, Plus } from "lucide-react";
import {
  Loader2,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  ArrowLeft,
  Users,
  Check,
} from "lucide-react";

interface EventData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  price_cents: number;
  currency: string;
  capacity: number;
  status: string;
  waitlist_enabled: boolean;
  attendee_questions: unknown;
}

const EventDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // Log weekly-digest attribution once when a member lands here via ?ref=digest
  useEffect(() => {
    if (searchParams.get("ref") !== "digest") return;
    import("@/lib/engagement").then(({ logEngagement }) =>
      logEngagement("digest_click", null, {
        slot: searchParams.get("slot") ?? "event",
        page: "event_detail",
        slug,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [myReg, setMyReg] = useState<{ status: string; ticket_code: string } | null>(null);
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [acting, setActing] = useState(false);
  const [responses, setResponses] = useState<AttendeeResponses>({});
  const [responseErrors, setResponseErrors] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [guests, setGuests] = useState<Guest[]>([]);
  // Event sign-ups are members-only. "none" = signed in but no profile yet.
  const [memberStatus, setMemberStatus] = useState<
    "unknown" | "none" | "pending" | "rejected" | "approved"
  >("unknown");
  const isMember = memberStatus === "approved";

  const questions: AttendeeQuestion[] = useMemo(() => {
    // Per-event custom questions, skipping any that collide with default IDs.
    const custom = parseQuestions(event?.attendee_questions).filter(
      (q) => !DEFAULT_ATTENDEE_QUESTION_IDS.has(q.id),
    );
    return [...DEFAULT_ATTENDEE_QUESTIONS, ...custom];
  }, [event?.attendee_questions]);


  const load = async () => {
    if (!slug) return;
    setLoading(true);
    const { data: ev, error } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !ev) {
      setLoading(false);
      return;
    }
    setEvent(ev as EventData);

    // Confirmed seats = SUM(quantity) on confirmed registrations
    const { data: seatRows } = await supabase
      .from("registrations")
      .select("quantity")
      .eq("event_id", ev.id)
      .eq("status", "confirmed");
    const seatTotal = (seatRows ?? []).reduce(
      (acc: number, r: { quantity: number | null }) => acc + (r.quantity ?? 1),
      0,
    );
    setConfirmedCount(seatTotal);

    if (user) {
      const { data: reg } = await supabase
        .from("registrations")
        .select("status, ticket_code")
        .eq("event_id", ev.id)
        .eq("user_id", user.id)
        .maybeSingle();
      setMyReg(reg ?? null);

      const { data: wl } = await supabase
        .from("waitlist")
        .select("id")
        .eq("event_id", ev.id)
        .eq("user_id", user.id)
        .maybeSingle();
      setOnWaitlist(!!wl);

      const { data: profile } = await supabase
        .from("member_profiles")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();
      setMemberStatus(
        (profile?.status as "pending" | "rejected" | "approved" | undefined) ??
          "none",
      );
    } else {
      setMemberStatus("unknown");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, user, authLoading]);

  // Top of the ticketing funnel: one `event_viewed` per event, with the
  // dimensions we want to segment conversion by (price, seats, auth state).
  useEffect(() => {
    if (!event) return;
    track("event_viewed", {
      target_id: event.id,
      slug: event.slug,
      title: event.title,
      is_free: event.price_cents === 0,
      price_cents: event.price_cents,
      currency: event.currency,
      capacity: event.capacity,
      seats_taken: confirmedCount,
      status: event.status,
      authenticated: !!user,
      already_registered: !!myReg,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  // Handle return from Ziina hosted checkout.
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const rawPaymentIntentId = searchParams.get("payment_intent_id");
    const paymentIntentId =
      rawPaymentIntentId && !rawPaymentIntentId.includes("{") ? rawPaymentIntentId : null;
    const registrationId = searchParams.get("registration_id");
    if (checkout === "success" && user && (paymentIntentId || registrationId || event?.id)) {
      (async () => {
        const { data, error } = await supabase.functions.invoke("verify-checkout-session", {
          body: {
            payment_intent_id: paymentIntentId,
            registration_id: registrationId,
            event_id: event?.id,
          },
        });
        if (error) {
          track("checkout_failed", {
            target_id: event?.id,
            stage: "verify",
            reason: error.message,
          });
          toast.error(error.message ?? "Could not verify payment");
        } else if (data?.paid) {
          track("payment_succeeded", { target_id: event?.id, slug: event?.slug });
          toast.success("Payment confirmed — you're registered!");
        } else {
          track("checkout_failed", {
            target_id: event?.id,
            stage: "verify",
            reason: data?.payment_status ?? "unknown",
          });
          toast.info(`Payment status: ${data?.payment_status ?? "unknown"}`);
        }
        searchParams.delete("checkout");
        searchParams.delete("payment_intent_id");
        searchParams.delete("registration_id");
        setSearchParams(searchParams, { replace: true });
        load();
      })();
    } else if (checkout === "cancelled") {
      track("checkout_failed", { target_id: event?.id, stage: "return", reason: "cancelled" });
      toast.info("Checkout cancelled");
      searchParams.delete("checkout");
      searchParams.delete("payment_intent_id");
      searchParams.delete("registration_id");
      setSearchParams(searchParams, { replace: true });
      load();
    } else if (checkout === "failed") {
      track("checkout_failed", { target_id: event?.id, stage: "return", reason: "payment_failed" });
      toast.error("Payment failed. You can try again whenever you're ready.");
      searchParams.delete("checkout");
      searchParams.delete("payment_intent_id");
      searchParams.delete("registration_id");
      setSearchParams(searchParams, { replace: true });
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, event?.id]);

  const isFree = event && event.price_cents === 0;
  const seatsLeft =
    !!event && event.capacity > 0
      ? Math.max(0, event.capacity - confirmedCount)
      : null;
  const isFull = seatsLeft !== null && seatsLeft === 0;
  const maxSelectable = Math.min(
    MAX_QUANTITY,
    seatsLeft === null ? MAX_QUANTITY : Math.max(1, seatsLeft),
  );

  const handleRegister = async () => {
    if (!event) return;
    const funnel = {
      target_id: event.id,
      slug: event.slug,
      is_free: event.price_cents === 0,
      quantity,
    };
    track("event_register_started", { ...funnel, authenticated: !!user });
    if (!user) {
      // Bounced to sign-in — the single biggest drop-off in this funnel.
      track("event_register_failed", { ...funnel, reason: "not_authenticated" });
      navigate(`/auth?redirect=/events/${event.slug}`);
      return;
    }
    if (!isMember) {
      // Members-only sign-ups. The database enforces this too; this branch
      // just avoids a raw error toast.
      track("event_register_failed", {
        ...funnel,
        reason: "not_a_member",
        member_status: memberStatus,
      });
      navigate(memberStatus === "none" ? "/account/profile" : "/pending-approval");
      return;
    }
    if (questions.length) {
      const v = validateResponses(questions, responses);
      setResponseErrors(v.errors);
      if (!v.ok) {
        track("event_register_failed", {
          ...funnel,
          reason: "questions_invalid",
          fields: Object.keys(v.errors).join(","),
        });
        toast.error("Please answer the required questions");
        return;
      }
    }
    const safeQty = Math.max(1, Math.min(MAX_QUANTITY, quantity));
    const cleanGuests = sanitizeGuests(safeQty, guests);
    const guestErr = validateGuests(safeQty, cleanGuests);
    if (guestErr) {
      track("event_register_failed", { ...funnel, reason: "guests_invalid" });
      toast.error(guestErr);
      return;
    }
    if (seatsLeft !== null && safeQty > seatsLeft) {
      track("event_register_failed", { ...funnel, reason: "not_enough_seats", seats_left: seatsLeft });
      toast.error(`Only ${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} left`);
      return;
    }
    const responsesPayload = JSON.parse(JSON.stringify(responses));
    const guestsPayload = JSON.parse(JSON.stringify(cleanGuests));
    setActing(true);
    if (isFree) {
      const { error } = await supabase.rpc("confirm_free_registration", {
        _event_id: event.id,
        _responses: responsesPayload,
        _quantity: safeQty,
        _guests: guestsPayload,
      });
      setActing(false);
      if (error) {
        track("event_register_failed", { ...funnel, reason: "rpc_error", message: error.message });
        toast.error(error.message);
        return;
      }
      // Analytics only — the `event_rsvp` row in engagement_events is written
      // by the registrations trigger, so we must not log it again here.
      track("event_register_succeeded", { ...funnel, quantity: safeQty, guests: cleanGuests.length });
      toast.success("You're registered!");

      // Send confirmation email (free registrations)
      try {
        const { data: reg } = await supabase
          .from("registrations")
          .select("id, ticket_code, quantity")
          .eq("event_id", event.id)
          .eq("user_id", user.id)
          .maybeSingle();
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, name")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile?.email && reg) {
          await supabase.functions.invoke("send-app-email", {
            body: {
              templateName: "event-registration-confirmation",
              recipientEmail: profile.email,
              idempotencyKey: `event-reg-${reg.id}`,
              templateData: {
                name: profile.name,
                eventTitle: event.title,
                startsAt: event.starts_at,
                location: event.location,
                ticketCode: reg.ticket_code,
                quantity: reg.quantity,
                eventUrl: `${window.location.origin}/events/${event.slug}`,
              },
            },
          });
        }
      } catch (e) {
        console.warn("Failed to send event registration email", e);
      }

      load();
    } else {
      track("checkout_started", {
        ...funnel,
        quantity: safeQty,
        price_cents: event.price_cents,
        currency: event.currency,
      });
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          event_id: event.id,
          origin: window.location.origin,
          responses: responsesPayload,
          quantity: safeQty,
          guests: guestsPayload,
        },
      });
      setActing(false);
      if (error || !data?.redirect_url) {
        const reason = error?.message ?? data?.error ?? "Could not start checkout";
        track("checkout_failed", { ...funnel, reason });
        toast.error(reason);
        return;
      }
      window.location.assign(data.redirect_url);
    }

  };

  const handleJoinWaitlist = async () => {
    if (!event || !user) {
      if (event) navigate(`/auth?redirect=/events/${event.slug}`);
      return;
    }
    if (!isMember) {
      navigate(memberStatus === "none" ? "/account/profile" : "/pending-approval");
      return;
    }
    setActing(true);
    const { count } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id);
    const position = (count ?? 0) + 1;
    const { error } = await supabase.from("waitlist").insert({
      event_id: event.id,
      user_id: user.id,
      position,
    });
    setActing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    track("waitlist_joined", { target_id: event.id, slug: event.slug, position });
    toast.success(`You're on the waitlist (position ${position})`);
    load();
  };

  const handleLeaveWaitlist = async () => {
    if (!event || !user) return;
    setActing(true);
    const { error } = await supabase
      .from("waitlist")
      .delete()
      .eq("event_id", event.id)
      .eq("user_id", user.id);
    setActing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    track("waitlist_left", { target_id: event.id, slug: event.slug });
    toast.success("Removed from waitlist");
    load();
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="font-heading text-2xl text-primary mb-2">Event not found</h1>
        <p className="text-muted-foreground mb-6">
          This event may have been removed or is not yet published.
        </p>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
        </Button>
      </div>
    );
  }

  const startDate = new Date(event.starts_at);
  const fmtDate = startDate.toLocaleDateString("en-AE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const fmtTime = startDate.toLocaleTimeString("en-AE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const spotsLeft =
    event.capacity > 0 ? Math.max(event.capacity - confirmedCount, 0) : null;

  const metaDescription = (
    event.description?.replace(/\s+/g, " ").trim() ||
    `${event.title} — a Fempower gathering for women in the UAE on ${fmtDate}${
      event.location ? ` at ${event.location}` : ""
    }. Open to Fempower members.`
  ).slice(0, 155);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${event.title} — Fempower event in the UAE`.slice(0, 60)}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={`https://fempowerae.com/events/${event.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${event.title} — Fempower`} />
        <meta property="og:description" content={metaDescription} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <EventJsonLd
        slug={event.slug}
        title={event.title}
        description={event.description}
        location={event.location}
        startsAt={event.starts_at}
        endsAt={event.ends_at}
        priceCents={event.price_cents}
        currency={event.currency}
        coverImageUrl={event.cover_image_url}
        status={event.status}
        capacity={event.capacity}
        seatsTaken={confirmedCount}
      />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <HashLink
          to="/#events-calendar"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          All events
        </HashLink>

        {event.cover_image_url && (
          <div className="w-full max-w-2xl mx-auto aspect-square rounded-2xl overflow-hidden mb-8 bg-muted">
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl text-primary">
                {event.title}
              </h1>
            </div>

            <div className="space-y-3 text-foreground">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <span>{fmtDate}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <span>{fmtTime}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.capacity > 0 && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Users className="h-5 w-5" />
                  <span>
                    {confirmedCount} / {event.capacity} registered
                    {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 5 && (
                      <span className="ml-2 text-blush-dark font-medium">
                        Only {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            <div>
              <AddToCalendarButton
                event={{
                  title: event.title,
                  description: event.description,
                  location: event.location,
                  startsAt: event.starts_at,
                  endsAt: event.ends_at,
                  url: typeof window !== "undefined" ? window.location.href : undefined,
                  uid: `event-${event.id}@fempowerae.com`,
                }}
                size="sm"
              />
            </div>

            {event.description && (
              <div className="prose prose-sm max-w-none whitespace-pre-line text-foreground/80">
                {event.description}
              </div>
            )}

            <EventResources
              eventId={event.id}
              isRegistered={myReg?.status === "confirmed"}
            />

            {questions.length > 0 &&
              (!myReg || myReg.status !== "confirmed") &&
              event.status === "published" &&
              !isFull && (
                <AttendeeQuestionsForm
                  questions={questions}
                  values={responses}
                  errors={responseErrors}
                  onChange={(next) => {
                    setResponses(next);
                    if (Object.keys(responseErrors).length) setResponseErrors({});
                  }}
                  disabled={acting}
                />
              )}

            {(!myReg || myReg.status !== "confirmed") &&
              event.status === "published" &&
              !isFull && (
                <div className="border border-border rounded-lg p-4 bg-card/50 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-foreground">Tickets</div>
                      <p className="text-xs text-muted-foreground">
                        Bring up to {MAX_QUANTITY - 1} friend
                        {MAX_QUANTITY - 1 === 1 ? "" : "s"}.
                      </p>
                    </div>
                    <div className="inline-flex items-center border border-border rounded-md">
                      <button
                        type="button"
                        className="px-3 py-2 hover:bg-muted disabled:opacity-40"
                        onClick={() => {
                          const next = Math.max(1, quantity - 1);
                          setQuantity(next);
                          setGuests((g) => g.slice(0, Math.max(0, next - 1)));
                        }}
                        disabled={acting || quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 font-medium tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        className="px-3 py-2 hover:bg-muted disabled:opacity-40"
                        onClick={() => {
                          const next = Math.min(maxSelectable, quantity + 1);
                          setQuantity(next);
                          setGuests((g) => {
                            const needed = next - 1;
                            const out = g.slice(0, needed);
                            while (out.length < needed) out.push({ name: "" });
                            return out;
                          });
                        }}
                        disabled={acting || quantity >= maxSelectable}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {quantity > 1 && (
                    <div className="space-y-3">
                      <p className="text-sm text-foreground">
                        Guest details
                      </p>
                      {Array.from({ length: quantity - 1 }).map((_, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                        >
                          <div>
                            <Label htmlFor={`guest-name-${i}`} className="text-xs">
                              Guest {i + 1} name *
                            </Label>
                            <Input
                              id={`guest-name-${i}`}
                              maxLength={120}
                              value={guests[i]?.name ?? ""}
                              onChange={(e) =>
                                setGuests((g) => {
                                  const next = [...g];
                                  next[i] = { ...(next[i] ?? { name: "" }), name: e.target.value };
                                  return next;
                                })
                              }
                              disabled={acting}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`guest-email-${i}`} className="text-xs">
                              Email (optional)
                            </Label>
                            <Input
                              id={`guest-email-${i}`}
                              type="email"
                              maxLength={200}
                              value={guests[i]?.email ?? ""}
                              onChange={(e) =>
                                setGuests((g) => {
                                  const next = [...g];
                                  next[i] = { ...(next[i] ?? { name: "" }), email: e.target.value };
                                  return next;
                                })
                              }
                              disabled={acting}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
          </div>

          <aside className="md:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-6 space-y-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {isFree ? "Price" : quantity > 1 ? "Total" : "Price"}
                </div>
                <div className="font-heading text-2xl text-primary">
                  {isFree
                    ? "Free"
                    : `${event.currency} ${((event.price_cents * quantity) / 100).toFixed(2)}`}
                </div>
                {!isFree && quantity > 1 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {quantity} × {event.currency}{" "}
                    {(event.price_cents / 100).toFixed(2)}
                  </div>
                )}
              </div>

              {event.status === "cancelled" ? (
                <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
                  This event has been cancelled.
                </div>
              ) : event.status === "completed" ? (
                <div className="bg-muted text-muted-foreground text-sm rounded-md p-3">
                  This event has already taken place.
                </div>
              ) : myReg && myReg.status === "confirmed" ? (
                <>
                  <div className="bg-primary/10 text-primary text-sm rounded-md p-3 flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      You're registered.
                      <div className="text-xs mt-1 font-mono opacity-70">
                        Ticket: {myReg.ticket_code}
                      </div>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/account/tickets">View my ticket & QR</Link>
                  </Button>
                </>
              ) : myReg && myReg.status === "pending" ? (
                <>
                  <div className="bg-muted text-sm rounded-md p-3">
                    Your payment didn't complete. Resume checkout to finish.
                  </div>
                  <Button
                    className="w-full"
                    disabled={acting}
                    onClick={handleRegister}
                  >
                    {acting ? "Loading…" : "Resume checkout"}
                  </Button>
                </>
              ) : isFull ? (
                event.waitlist_enabled ? (
                  onWaitlist ? (
                    <>
                      <div className="bg-muted text-sm rounded-md p-3">
                        You're on the waitlist.
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={acting}
                        onClick={handleLeaveWaitlist}
                      >
                        Leave waitlist
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="bg-muted text-sm rounded-md p-3">
                        Sold out. Join the waitlist to be notified if a spot opens.
                      </div>
                      <Button
                        className="w-full"
                        disabled={acting}
                        onClick={handleJoinWaitlist}
                      >
                        {acting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Join waitlist
                      </Button>
                    </>
                  )
                ) : (
                  <div className="bg-muted text-sm rounded-md p-3">Sold out.</div>
                )
              ) : user && !isMember ? (
                <>
                  <div className="bg-muted text-sm rounded-md p-3">
                    Fempower events are for members. {memberStatus === "none"
                      ? "Complete your member profile to request access."
                      : memberStatus === "pending"
                        ? "Your membership is awaiting approval — we'll email you as soon as you're in."
                        : "Your membership isn't active, so sign-ups are closed."}
                  </div>
                  {memberStatus !== "rejected" && (
                    <Button asChild className="w-full" size="lg">
                      <Link
                        to={
                          memberStatus === "none"
                            ? "/account/profile"
                            : "/pending-approval"
                        }
                      >
                        {memberStatus === "none"
                          ? "Complete my profile"
                          : "Check my membership status"}
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  disabled={acting}
                  onClick={handleRegister}
                >
                  {acting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isFree ? "Register" : "Get ticket"}
                </Button>
              )}

              {!user && (
                <p className="text-xs text-muted-foreground text-center">
                  Event sign-ups are for Fempower members — sign in or join to
                  register.
                </p>
              )}


              {!isFree && (
                <div className="mt-4 pt-4 border-t border-border/60">
                  <details className="group text-xs">
                    <summary className="cursor-pointer font-medium text-foreground/80 hover:text-primary list-none flex items-center justify-between">
                      <span>Refund policy</span>
                      <span className="text-muted-foreground group-open:rotate-180 transition-transform">⌄</span>
                    </summary>
                    <div className="mt-3 space-y-2 text-muted-foreground leading-relaxed">
                      <p>
                        At Fempower UAE, we want every experience to feel safe —
                        including how you manage your bookings.
                      </p>
                      <ul className="space-y-1.5 list-none">
                        <li>
                          <span className="font-medium text-foreground">Full refund</span> if we cancel the event
                        </li>
                        <li>
                          <span className="font-medium text-foreground">Credit or transfer</span> to another event if you cancel at least 72 hours before
                        </li>
                        <li>
                          <span className="font-medium text-foreground">No refund or credit</span> for cancellations within 72 hours or no-shows
                        </li>
                      </ul>
                      <p>
                        To cancel or transfer, reach out to us on{" "}
                        <a
                          href="https://www.instagram.com/fempower.ae"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Instagram
                        </a>{" "}
                        or via our contact form.
                      </p>
                      <p className="pt-1">Thank you for being part of this community. 🤍</p>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
