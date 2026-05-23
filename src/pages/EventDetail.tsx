import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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

  const isFree = event && event.price_cents === 0;
  const isFull =
    !!event &&
    event.capacity > 0 &&
    confirmedCount >= event.capacity;

  const handleRegister = async () => {
    if (!event) return;
    if (!user) {
      navigate(`/auth?redirect=/events/${event.slug}`);
      return;
    }
    setActing(true);
    if (isFree) {
      const { error } = await supabase.from("registrations").insert({
        event_id: event.id,
        user_id: user.id,
        status: "confirmed",
        amount_paid_cents: 0,
        currency: event.currency,
      });
      setActing(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("You're registered!");
      load();
    } else {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { event_id: event.id, origin: window.location.origin },
      });
      setActing(false);
      if (error || !data?.url) {
        toast.error(error?.message ?? data?.error ?? "Could not start checkout");
        return;
      }
      window.location.href = data.url;
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
                <div className="bg-primary/10 text-primary text-sm rounded-md p-3 flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    You're registered.
                    <div className="text-xs mt-1 font-mono opacity-70">
                      Ticket: {myReg.ticket_code}
                    </div>
                  </div>
                </div>
              ) : myReg && myReg.status === "pending" ? (
                <div className="bg-muted text-sm rounded-md p-3">
                  Your payment is pending. Refresh after completing checkout.
                </div>
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
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
