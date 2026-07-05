import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarHeart, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useJoinGate } from "./JoinGate";

interface UpcomingEvent {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
}

const ROTATE_MS = 4500;

/**
 * Slim banner directly under the fixed header announcing upcoming events.
 * Public: reads only published events, same as NextEventCard/EventsCalendarSection.
 */
const EventsStripBanner = () => {
  const { requireJoin } = useJoinGate();
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id, slug, title, starts_at")
        .eq("status", "published")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(5);
      setEvents((data as UpcomingEvent[]) ?? []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (paused || events.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % events.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, events.length]);

  if (loading || events.length === 0) return null;

  const event = events[index];

  const handleEventClick = (e: React.MouseEvent) => {
    if (!requireJoin()) e.preventDefault();
  };

  return (
    <div
      className="relative z-10 w-full bg-lifestyle-espresso border-y border-lifestyle-gold/40"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container flex items-center gap-4 py-3">
        <span className="hidden sm:inline-flex flex-shrink-0 items-center gap-2 text-[11px] font-body font-semibold uppercase tracking-[0.2em] text-lifestyle-gold">
          <CalendarHeart size={13} aria-hidden="true" /> Upcoming
        </span>
        <span className="hidden sm:block w-px h-4 bg-lifestyle-gold/30" aria-hidden="true" />

        <div className="flex-1 min-w-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Link
                to={`/events/${event.slug}`}
                onClick={handleEventClick}
                className="flex items-baseline gap-2.5 whitespace-nowrap hover:opacity-80 transition-opacity"
                style={{ color: "#F3E9DD" }}
              >
                <span className="text-base font-heading truncate">{event.title}</span>
                <span className="text-[10px] font-body uppercase tracking-widest text-lifestyle-gold/70 flex-shrink-0">
                  {new Date(event.starts_at).toLocaleDateString("en-AE", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        {events.length > 1 && (
          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0" aria-hidden="true">
            {events.map((e, i) => (
              <span
                key={e.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-4 bg-lifestyle-gold" : "w-1.5 bg-lifestyle-gold/30"
                }`}
              />
            ))}
          </div>
        )}

        <Link
          to="/#events-calendar"
          className="flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] font-body font-semibold uppercase tracking-widest text-lifestyle-gold border border-lifestyle-gold/50 rounded-full px-4 py-1.5 hover:bg-lifestyle-gold hover:text-lifestyle-espresso transition-colors"
        >
          View All <ArrowRight size={11} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};

export default EventsStripBanner;
