import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import {
  parseQuestions,
  validateResponses,
  type AttendeeQuestion,
  type AttendeeResponses,
} from "@/lib/attendeeQuestions";
import { AttendeeQuestionsForm } from "@/components/AttendeeQuestionsForm";
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


  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [myReg, setMyReg] = useState<{ status: string; ticket_code: string } | null>(null);
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [acting, setActing] = useState(false);
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(null);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

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

    const { count } = await supabase
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", ev.id)
      .eq("status", "confirmed");
    setConfirmedCount(count ?? 0);

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
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, user, authLoading]);

  // Handle return from Stripe Checkout
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    if (checkout === "success" && sessionId && user) {
      (async () => {
        const { data, error } = await supabase.functions.invoke("verify-checkout-session", {
          body: { session_id: sessionId, environment: getStripeEnvironment() },
        });
        if (error) {
          toast.error(error.message ?? "Could not verify payment");
        } else if (data?.paid) {
          toast.success("Payment confirmed — you're registered!");
        } else {
          toast.info(`Payment status: ${data?.payment_status ?? "unknown"}`);
        }
        searchParams.delete("checkout");
        searchParams.delete("session_id");
        setSearchParams(searchParams, { replace: true });
        load();
      })();
    } else if (checkout === "cancelled") {
      toast.info("Checkout cancelled");
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const isFree = event && event.price_cents === 0;
  const isFull =
    !!event &&
    event.capacity > 0 &&
    confirmedCount >= event.capacity;

  const checkoutOptions = useMemo(
    () => ({
      clientSecret: checkoutSecret,
      onComplete: async () => {
        setCheckoutOpen(false);
        if (checkoutSessionId) {
          const { data, error } = await supabase.functions.invoke("verify-checkout-session", {
            body: { session_id: checkoutSessionId, environment: getStripeEnvironment() },
          });
          if (error) {
            toast.error(error.message ?? "Could not verify payment");
          } else if (data?.paid) {
            toast.success("Payment confirmed — you're registered!");
          }
        }
        load();
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [checkoutSecret, checkoutSessionId],
  );


  const handleRegister = async () => {
    if (!event) return;
    if (!user) {
      navigate(`/auth?redirect=/events/${event.slug}`);
      return;
    }
    setActing(true);
    if (isFree) {
      const { data: existing } = await supabase
        .from("registrations")
        .select("id, status")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .maybeSingle();
      let error: { message: string } | null = null;
      if (existing) {
        const r = await supabase
          .from("registrations")
          .update({ status: "confirmed", amount_paid_cents: 0, currency: event.currency })
          .eq("id", existing.id);
        error = r.error;
      } else {
        const r = await supabase.from("registrations").insert({
          event_id: event.id,
          user_id: user.id,
          status: "confirmed",
          amount_paid_cents: 0,
          currency: event.currency,
        });
        error = r.error;
      }
      setActing(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("You're registered!");
      load();
    } else {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          event_id: event.id,
          origin: window.location.origin,
          environment: getStripeEnvironment(),
        },
      });
      setActing(false);
      if (error || !data?.clientSecret) {
        toast.error(error?.message ?? data?.error ?? "Could not start checkout");
        return;
      }
      setCheckoutSecret(data.clientSecret);
      setCheckoutSessionId(data.session_id ?? null);
      setCheckoutOpen(true);
    }

  };

  const handleJoinWaitlist = async () => {
    if (!event || !user) {
      if (event) navigate(`/auth?redirect=/events/${event.slug}`);
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

  return (
    <div className="min-h-screen bg-background">
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0 sm:rounded-lg">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="font-heading text-primary">Complete your ticket</DialogTitle>
            <DialogDescription>
              Secure checkout for {event.title}.
            </DialogDescription>
          </DialogHeader>
          {checkoutSecret && (
            <div className="px-2 pb-6 sm:px-6">
              <EmbeddedCheckoutProvider
                stripe={getStripe()}
                options={checkoutOptions}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link
          to="/#events-calendar"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          All events
        </Link>

        {event.cover_image_url && (
          <div className="rounded-2xl overflow-hidden mb-8 aspect-[16/7] bg-muted">
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
          </div>

          <aside className="md:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-6 space-y-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Price
                </div>
                <div className="font-heading text-2xl text-primary">
                  {isFree
                    ? "Free"
                    : `${event.currency} ${(event.price_cents / 100).toFixed(2)}`}
                </div>
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
                  You'll need to sign in to register.
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
                          href="https://instagram.com/fempower.ae"
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
