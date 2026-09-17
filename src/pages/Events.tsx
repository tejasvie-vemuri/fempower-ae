import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CalendarHeart, MapPin, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const CANONICAL = "https://fempowerae.com/events";

interface EventRow {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
  location: string | null;
  price_cents: number;
  currency: string;
  members_only: boolean;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-AE", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dubai",
  });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-AE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  });

const Events = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id, slug, title, starts_at, location, price_cents, currency, members_only")
        .eq("status", "published")
        .order("starts_at", { ascending: true });
      setEvents((data ?? []) as EventRow[]);
      setLoading(false);
    })();
  }, []);

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= now);
  const past = events
    .filter((e) => new Date(e.starts_at).getTime() < now)
    .reverse()
    .slice(0, 12);

  const price = (e: EventRow) =>
    e.price_cents === 0 ? "Free" : `${e.currency} ${(e.price_cents / 100).toFixed(0)}`;

  const itemListJsonLd =
    upcoming.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Upcoming Fempower women's events in the UAE",
          itemListElement: upcoming.map((e, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `https://fempowerae.com/events/${e.slug}`,
            name: e.title,
          })),
        }
      : null;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Women's Events in Dubai &amp; the UAE — Fempower</title>
        <meta
          name="description"
          content="Upcoming women's events, roundtables and meetups run by Fempower across Dubai, Abu Dhabi and the wider UAE. Dates, locations and prices."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:title" content="Women's Events in Dubai & the UAE — Fempower" />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:type" content="website" />
      </Helmet>

      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      <Header />

      <main className="container max-w-3xl py-16 md:py-24">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-body mb-3">
            UAE events
          </p>
          <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-5">
            Women's events in Dubai and across the UAE
          </h1>
          <p className="font-body text-foreground/90 leading-relaxed">
            Fempower runs in-person gatherings for women living in the UAE roughly every
            15 days — roundtables capped at 15 women, mentor walks, coaching circles and
            casual meetups. Most take place in Dubai, with sessions in Abu Dhabi and
            online for members in the other emirates. Some events are open to everyone,
            others are members-only; each listing says which.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-12">
            <section>
              <h2 className="font-heading text-2xl text-foreground mb-5">Upcoming events</h2>
              {upcoming.length === 0 ? (
                <p className="font-body text-muted-foreground">
                  No dates are published right now. New events are announced in the
                  community roughly every two weeks.
                </p>
              ) : (
                <ul className="space-y-4">
                  {upcoming.map((e) => (
                    <li key={e.id} className="border border-border rounded-lg p-5">
                      <Link
                        to={`/events/${e.slug}`}
                        className="font-heading text-xl text-foreground hover:text-primary transition-colors"
                      >
                        {e.title}
                      </Link>
                      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-body text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarHeart className="h-4 w-4" />
                          {fmtDate(e.starts_at)}, {fmtTime(e.starts_at)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          {e.location || "UAE"}
                        </span>
                        <span>{price(e)}</span>
                        <span>{e.members_only ? "Members only" : "Open to all"}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {past.length > 0 && (
              <section>
                <h2 className="font-heading text-2xl text-foreground mb-5">Recent events</h2>
                <ul className="space-y-3">
                  {past.map((e) => (
                    <li key={e.id} className="font-body text-sm">
                      <Link
                        to={`/events/${e.slug}`}
                        className="text-foreground hover:text-primary transition-colors"
                      >
                        {e.title}
                      </Link>
                      <span className="text-muted-foreground">
                        {" "}
                        — {fmtDate(e.starts_at)}
                        {e.location ? `, ${e.location}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="font-body text-foreground/90 leading-relaxed">
              <h2 className="font-heading text-2xl text-foreground mb-3">
                How to attend a Fempower event
              </h2>
              <p>
                Open events can be booked by anyone, as a guest or with an account.
                Members-only events need an approved Fempower membership, which is free
                to request on the{" "}
                <Link to="/join" className="underline">
                  join page
                </Link>
                . Events run in English and are for women living in the UAE.
              </p>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Events;
