import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { CalendarHeart, MapPin, Clock, Loader2, MessageCircle } from "lucide-react";
import { PalmDivider } from "./GulfDecoratives";

const WHATSAPP_NUMBER = "971547911282";

function getWhatsAppRSVPLink(event: CalendarEvent) {
  const dateStr = event.date.toLocaleDateString("en-AE", { weekday: "long", month: "long", day: "numeric" });
  const message = encodeURIComponent(`Hi! I'd like to RSVP for "${event.title}" on ${dateStr} at ${event.time} 🙋‍♀️`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}

interface CalendarEvent {
  date: Date;
  title: string;
  time: string;
  location: string;
}

const SUPABASE_URL = "https://uaiymunelgvvnznkxeik.supabase.co";

const EventsCalendarSection = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/fetch-events`);
        const data = await res.json();
        const parsed: CalendarEvent[] = (data.events || []).map(
          (e: { title: string; date: string; time: string; location: string }) => ({
            title: e.title,
            time: e.time,
            location: e.location,
            date: new Date(e.date + "T00:00:00"),
          })
        );
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

  return (
    <section id="events-calendar" className="py-16 md:py-20">
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
          Tap a highlighted date to see what's coming up.
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

            <div className="space-y-4 min-h-[280px]">
              {selectedDate && eventsForDate.length > 0 ? (
                eventsForDate.map((event, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blush-light flex items-center justify-center flex-shrink-0">
                        <CalendarHeart size={20} className="text-blush-dark" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-heading text-base font-semibold text-foreground">{event.title}</h4>
                        <div className="mt-1.5 flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-body">
                            <Clock size={14} /> {event.time}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-body">
                            <MapPin size={14} /> {event.location}
                          </span>
                        </div>
                        <a
                          href={getWhatsAppRSVPLink(event)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-body font-semibold uppercase tracking-widest-xl text-green-700 hover:text-green-900 transition-colors"
                        >
                          <MessageCircle size={14} /> RSVP via WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              ) : selectedDate ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <p className="text-muted-foreground font-body text-sm">No events on this date. Try selecting a highlighted date!</p>
                </div>
              ) : events.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground font-body font-medium mb-3">All upcoming events:</p>
                  {events.map((event, i) => (
                    <div
                      key={i}
                      className="bg-card border border-border rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedDate(event.date)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blush-light flex items-center justify-center flex-shrink-0">
                          <CalendarHeart size={16} className="text-blush-dark" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-body text-sm font-semibold text-foreground truncate">{event.title}</h4>
                          <p className="text-xs text-muted-foreground font-body">
                            {event.date.toLocaleDateString("en-AE", { weekday: "short", month: "short", day: "numeric" })} · {event.time} · {event.location}
                          </p>
                        </div>
                        <a
                          href={getWhatsAppRSVPLink(event)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0 text-green-700 hover:text-green-900 transition-colors"
                          title="RSVP via WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <p className="text-muted-foreground font-body text-sm">No upcoming events yet. Check back soon!</p>
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
