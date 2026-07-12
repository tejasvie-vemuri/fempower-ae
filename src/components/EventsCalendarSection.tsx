import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { CalendarHeart, MapPin, Clock, Loader2, ArrowRight } from "lucide-react";
import { PalmDivider } from "./GulfDecoratives";
import { useJoinGate } from "./JoinGate";

import { supabase } from "@/integrations/supabase/client";

interface CalendarEvent {
  id: string;
  slug: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  price_cents: number;
  currency: string;
}

const EventsCalendarSection = () => {
  const { requireJoin } = useJoinGate();
  const handleEventClick = (e: React.MouseEvent) => {
    if (!requireJoin()) e.preventDefault();
  };
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("id, slug, title, starts_at, location, price_cents, currency")
          .in("status", ["published"])
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true });
        if (error) throw error;
        const parsed: CalendarEvent[] = (data ?? []).map((e) => {
          const d = new Date(e.starts_at);
          return {
            id: e.id,
            slug: e.slug,
            title: e.title,
            location: e.location ?? "TBD",
            price_cents: e.price_cents,
            currency: e.currency,
            date: d,
            time: d.toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" }),
          };
        });
        setEvents(parsed);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const eventDates = events.map((e) => e.date);

  const eventsForDate = selectedDate
    ? events.filter(
        (e) =>
          e.date.getFullYear() === selectedDate.getFullYear() &&
          e.date.getMonth() === selectedDate.getMonth() &&
          e.date.getDate() === selectedDate.getDate()
      )
    : [];

  const priceLabel = (e: CalendarEvent) =>
    e.price_cents === 0 ? "Free" : `${e.currency} ${(e.price_cents / 100).toFixed(0)}`;

  return (
    <section id="events-calendar" className="py-7 md:py-10">
      <PalmDivider className="mb-6" />
      <div className="container max-w-5xl">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark text-center mb-3"
        >
          Event Calendar
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-3xl md:text-4xl font-semibold text-foreground text-center"
        >
          Upcoming Events
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-3 text-center text-muted-foreground font-body"
        >
          Tap a highlighted date or an event to register.
        </motion.p>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-10 grid md:grid-cols-2 gap-10 items-start"
          >
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{ event: eventDates }}
                modifiersClassNames={{
                  event: "bg-accent text-accent-foreground font-bold rounded-full",
                }}
                className="rounded-xl border border-border bg-card shadow-sm p-4"
              />
            </div>

            <div className="space-y-4 md:min-h-[280px]">
              {selectedDate && eventsForDate.length > 0 ? (
                eventsForDate.map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.slug}`}
                    onClick={handleEventClick}
                    className="block bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blush-light flex items-center justify-center flex-shrink-0">
                        <CalendarHeart size={20} className="text-blush-dark" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-heading text-base font-semibold text-foreground">
                          {event.title}
                        </h4>
                        <div className="mt-1.5 flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-body">
                            <Clock size={14} /> {event.time}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-body">
                            <MapPin size={14} /> {event.location}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs font-body font-semibold uppercase tracking-widest-xl text-primary">
                            {priceLabel(event)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-body font-semibold uppercase tracking-widest-xl text-blush-dark">
                            Register <ArrowRight size={12} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : selectedDate ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <p className="text-muted-foreground font-body text-sm">
                    No events on this date. Try selecting a highlighted date!
                  </p>
                </div>
              ) : events.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground font-body font-medium mb-3">
                    All upcoming events:
                  </p>
                  {events.map((event) => (
                    <Link
                      key={event.id}
                      to={`/events/${event.slug}`}
                      onClick={handleEventClick}
                      className="block bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blush-light flex items-center justify-center flex-shrink-0">
                          <CalendarHeart size={16} className="text-blush-dark" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-body text-sm font-semibold text-foreground truncate">
                            {event.title}
                          </h4>
                          <p className="text-xs text-muted-foreground font-body">
                            {event.date.toLocaleDateString("en-AE", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            · {event.time} · {event.location}
                          </p>
                        </div>
                        <span className="text-xs font-body font-semibold uppercase tracking-widest-xl text-primary flex-shrink-0">
                          {priceLabel(event)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <p className="text-muted-foreground font-body text-sm">
                    No upcoming events yet. Check back soon!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
      </div>
    </section>
  );
};

export default EventsCalendarSection;
